import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { query } from '../db/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { calculateDonorEligibility } from '../services/eligibilityService.js';

const router = Router();

// 1. User Registration
router.post('/register', async (req, res) => {
  try {
    const {
      role,
      name,
      full_name,
      age,
      gender,
      blood_group,
      phone,
      city,
      email,
      password,
      // Doctor fields
      medical_license_number,
      hospital_name,
      hospital_city,
    } = req.body;

    const actualName = name || full_name;

    if (!role || !actualName || !email || !password || !phone) {
      return res.status(400).json({ error: 'Please provide all required registration fields.' });
    }

    const normalizedRole = role.toLowerCase().trim();
    if (!['donor', 'receiver', 'doctor'].includes(normalizedRole)) {
      return res.status(400).json({ error: 'Role must be donor, receiver, or doctor.' });
    }

    // Doctor specific validation upfront BEFORE inserting user
    if (normalizedRole === 'doctor') {
      if (!medical_license_number || !medical_license_number.trim() || !hospital_name || !hospital_name.trim()) {
        return res.status(400).json({ error: 'Medical license number and hospital affiliation are required for doctors.' });
      }

      // Check if license number already registered
      const existingLicense = await query(
        'SELECT id FROM doctor_profiles WHERE medical_license_number = $1',
        [medical_license_number.trim()]
      );
      if (existingLicense.rows.length > 0) {
        return res.status(409).json({ error: 'This medical license number is already registered.' });
      }
    }

    // Check if email already registered
    const existing = await query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'An account with this email address already exists.' });
    }

    // Hash password securely with bcrypt
    const password_hash = await bcrypt.hash(password, 10);
    const userStatus = 'pending'; // All new accounts start as pending verification

    // Insert user
    const insertUserRes = await query(
      `INSERT INTO users (email, password_hash, role, full_name, phone, age, gender, blood_group, city, status, onboarding_completed)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        email.toLowerCase().trim(),
        password_hash,
        normalizedRole,
        actualName.trim(),
        phone.trim(),
        age ? parseInt(age, 10) : null,
        gender || null,
        blood_group || null,
        city ? city.trim() : null,
        userStatus,
        false,
      ]
    );

    const user = insertUserRes.rows[0];

    try {
      // If doctor, create pending doctor profile
      if (normalizedRole === 'doctor') {
        await query(
          `INSERT INTO doctor_profiles (user_id, medical_license_number, hospital_name, hospital_city, approval_status)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING *`,
          [
            user.id,
            medical_license_number.trim(),
            hospital_name.trim(),
            hospital_city ? hospital_city.trim() : (city || ''),
            'pending',
          ]
        );
      }

      // If donor, create donor profile
      if (normalizedRole === 'donor') {
        await query(
          `INSERT INTO donor_profiles (user_id, last_donation_date, last_donation_date_status)
           VALUES ($1, NULL, 'pending')
           RETURNING *`,
          [user.id, null, 'pending']
        );
      }
    } catch (profileErr) {
      // Rollback user creation to prevent orphaned accounts
      await query('DELETE FROM users WHERE id = $1', [user.id]).catch(() => {});
      throw profileErr;
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    // Sanitize response safely without mutating raw records
    const safeUser = { ...user };
    delete safeUser.password_hash;

    res.status(201).json({
      success: true,
      token,
      user: safeUser,
      message: 'Account successfully registered.',
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: err.message || 'Registration failed' });
  }
});

// 2. User Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const userRes = await query('SELECT * FROM users WHERE email = $1', [email.toLowerCase().trim()]);
    if (userRes.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const rawUser = userRes.rows[0];
    if (!rawUser || !rawUser.password_hash) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const passwordMatch = await bcrypt.compare(password, rawUser.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: rawUser.id, email: rawUser.email, role: rawUser.role },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    const safeUser = { ...rawUser };
    delete safeUser.password_hash;

    res.json({
      success: true,
      token,
      user: safeUser,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: err.message || 'Login failed' });
  }
});

// 3. Get Current User Profile & Context
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = { ...req.user };
    delete user.password_hash;

    let doctorProfile = null;
    let donorProfile = null;
    let eligibility = null;

    if (user.role === 'doctor') {
      const docRes = await query('SELECT * FROM doctor_profiles WHERE user_id = $1', [user.id]);
      doctorProfile = docRes.rows[0] || {
        user_id: user.id,
        medical_license_number: 'Under Review',
        hospital_name: 'Affiliated Hospital',
        hospital_city: user.city || '',
        approval_status: user.status || 'pending',
      };
    }

    if (user.role === 'donor') {
      const donorRes = await query('SELECT * FROM donor_profiles WHERE user_id = $1', [user.id]);
      donorProfile = donorRes.rows[0] || null;
      if (donorProfile) {
        eligibility = calculateDonorEligibility(
          donorProfile.last_donation_date,
          donorProfile.last_donation_date_status
        );
      }
    }

    // Get user's documents
    const docsRes = await query('SELECT * FROM documents WHERE user_id = $1 ORDER BY created_at DESC', [user.id]);

    res.json({
      user,
      doctorProfile,
      donorProfile,
      eligibility,
      documents: docsRes.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

