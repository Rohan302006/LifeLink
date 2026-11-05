import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { query } from '../db/database.js';

export async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication token required' });
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret);
    const userResult = await query('SELECT * FROM users WHERE id = $1', [payload.id]);

    if (!userResult.rows || userResult.rows.length === 0) {
      return res.status(401).json({ error: 'User account not found' });
    }

    req.user = userResult.rows[0];
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired session token' });
  }
}

export function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Role '${req.user.role}' is not authorized.`,
      });
    }

    next();
  };
}

export async function requireDoctorApproved(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (req.user.role !== 'doctor') {
    return res.status(403).json({ error: 'Doctor access required' });
  }

  const doctorProfileResult = await query(
    'SELECT * FROM doctor_profiles WHERE user_id = $1',
    [req.user.id]
  );

  let profile = doctorProfileResult.rows[0];

  // Self-heal: If user account has been verified by Admin, ensure doctor profile matches
  if ((!profile || profile.approval_status !== 'verified') && req.user.status === 'verified') {
    if (!profile) {
      const insRes = await query(
        `INSERT INTO doctor_profiles (user_id, medical_license_number, hospital_name, hospital_city, approval_status, reviewed_at)
         VALUES ($1, 'Verified by Admin', 'Affiliated Hospital', '', 'verified', NOW())
         RETURNING *`,
        [req.user.id]
      );
      profile = insRes.rows[0];
    } else {
      const updRes = await query(
        `UPDATE doctor_profiles SET approval_status = 'verified', reviewed_at = NOW() WHERE id = $1 RETURNING *`,
        [profile.id]
      );
      profile = updRes.rows[0] || { ...profile, approval_status: 'verified' };
    }
  }

  if (!profile || profile.approval_status !== 'verified') {
    return res.status(403).json({
      error: 'Doctor account is pending admin approval',
      message: 'Your medical credentials are currently pending verification by an administrator. You will gain access once approved.',
      status: profile ? profile.approval_status : 'pending',
    });
  }

  req.doctorProfile = profile;
  next();
}

