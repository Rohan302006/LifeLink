import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { query } from '../db/database.js';

const router = Router();

// Strict Admin protection: only ADMIN can access
router.use(authenticateToken);
router.use(requireRole(['admin']));

// 1. List All Doctor Accounts (with Hospital & License Details)
router.get('/doctors', async (req, res) => {
  try {
    const { status } = req.query;
    let queryText = `SELECT 
        COALESCE(dp.id, u.id) as id,
        u.id as user_id,
        COALESCE(dp.medical_license_number, 'Under Review') as medical_license_number,
        COALESCE(dp.hospital_name, 'Affiliated Hospital') as hospital_name,
        COALESCE(dp.hospital_city, u.city) as hospital_city,
        COALESCE(dp.approval_status, u.status, 'pending') as approval_status,
        dp.rejection_reason,
        dp.reviewed_at,
        u.full_name,
        u.email,
        u.phone,
        u.age,
        u.gender,
        u.blood_group,
        u.city,
        u.status as user_status,
        u.created_at as registered_at
       FROM users u
       LEFT JOIN doctor_profiles dp ON dp.user_id = u.id
       WHERE u.role = 'doctor'`;
    const params = [];
    if (status) {
      params.push(status.toLowerCase().trim());
      queryText += ` AND (LOWER(dp.approval_status) = $1 OR (dp.approval_status IS NULL AND LOWER(u.status) = $1))`;
    }
    queryText += ` ORDER BY u.created_at DESC`;

    const doctorsRes = await query(queryText, params);

    res.json({ doctors: doctorsRes.rows });
  } catch (err) {
    console.error('Admin doctors list error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Single Doctor Full Profile & Documents
router.get('/doctors/:id', async (req, res) => {
  try {
    const doctorId = req.params.id;
    let targetUserId = doctorId;
    const profLookup = await query('SELECT * FROM doctor_profiles WHERE id = $1', [doctorId]);
    if (profLookup.rows.length > 0) {
      targetUserId = profLookup.rows[0].user_id;
    }

    const userRes = await query('SELECT * FROM users WHERE id = $1 AND role = $2', [targetUserId, 'doctor']);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'Doctor account not found.' });
    }

    const doctorUser = userRes.rows[0];
    delete doctorUser.password_hash;

    const profileRes = await query('SELECT * FROM doctor_profiles WHERE user_id = $1', [targetUserId]);
    const doctorProfile = profileRes.rows[0] || null;

    const docsRes = await query('SELECT * FROM documents WHERE user_id = $1 ORDER BY created_at DESC', [targetUserId]);

    res.json({
      doctor: {
        ...doctorUser,
        doctor_profile: doctorProfile,
        documents: docsRes.rows || [],
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Admin Approves Doctor Account
router.post('/approve-doctor/:id', async (req, res) => {
  try {
    const doctorId = req.params.id;

    // Resolve target user_id (handles doctorId passed as user_id or profile id)
    let targetUserId = doctorId;
    const profLookup = await query('SELECT * FROM doctor_profiles WHERE id = $1', [doctorId]);
    if (profLookup.rows.length > 0) {
      targetUserId = profLookup.rows[0].user_id;
    }

    // 1. Update user status in users table
    await query("UPDATE users SET status = 'verified' WHERE id = $1", [targetUserId]);

    // 2. Update doctor profile to verified
    let updateProfileRes = await query(
      `UPDATE doctor_profiles
       SET approval_status = 'verified', rejection_reason = NULL, reviewed_at = NOW()
       WHERE user_id = $1 OR id = $1
       RETURNING *`,
      [targetUserId]
    );

    let doctorProfile = updateProfileRes.rows[0];

    if (!doctorProfile) {
      const insRes = await query(
        `INSERT INTO doctor_profiles (user_id, medical_license_number, hospital_name, hospital_city, approval_status, reviewed_at)
         VALUES ($1, 'Verified by Admin', 'Affiliated Hospital', '', 'verified', NOW())
         RETURNING *`,
        [targetUserId]
      );
      doctorProfile = insRes.rows[0];
    }

    res.json({
      success: true,
      doctor: doctorProfile,
      message: 'Doctor account approved. The physician can now access the Doctor Verification Queue.',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Admin Rejects Doctor Account (with Mandatory Reason)
router.post('/reject-doctor/:id', async (req, res) => {
  try {
    const doctorId = req.params.id;
    const { rejection_reason } = req.body;

    if (!rejection_reason || rejection_reason.trim().length === 0) {
      return res.status(400).json({ error: 'Rejection reason is required to reject a doctor account.' });
    }

    // Resolve target user_id
    let targetUserId = doctorId;
    const profLookup = await query('SELECT * FROM doctor_profiles WHERE id = $1', [doctorId]);
    if (profLookup.rows.length > 0) {
      targetUserId = profLookup.rows[0].user_id;
    }

    // 1. Update user status in users table
    await query("UPDATE users SET status = 'rejected' WHERE id = $1", [targetUserId]);

    // 2. Update doctor profile to rejected
    const updateProfileRes = await query(
      `UPDATE doctor_profiles
       SET approval_status = 'rejected', rejection_reason = $1, reviewed_at = NOW()
       WHERE user_id = $2 OR id = $2
       RETURNING *`,
      [rejection_reason.trim(), targetUserId]
    );

    let doctorProfile = updateProfileRes.rows[0];

    if (!doctorProfile) {
      const insRes = await query(
        `INSERT INTO doctor_profiles (user_id, medical_license_number, hospital_name, hospital_city, approval_status, rejection_reason, reviewed_at)
         VALUES ($1, 'Under Review', 'Affiliated Hospital', '', 'rejected', $2, NOW())
         RETURNING *`,
        [targetUserId, rejection_reason.trim()]
      );
      doctorProfile = insRes.rows[0];
    }

    res.json({
      success: true,
      doctor: doctorProfile,
      message: 'Doctor account rejected.',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Admin Deletes Doctor Account (with Mandatory Deletion Reason)
const handleDeleteDoctor = async (req, res) => {
  try {
    const doctorId = req.params.id;
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'A reason is required to delete a doctor account.' });
    }

    // Resolve target user_id
    let targetUserId = doctorId;
    const profLookup = await query('SELECT * FROM doctor_profiles WHERE id = $1', [doctorId]);
    if (profLookup.rows.length > 0) {
      targetUserId = profLookup.rows[0].user_id;
    }

    // Verify target exists and is a doctor
    const userRes = await query('SELECT * FROM users WHERE id = $1', [targetUserId]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'Doctor account not found.' });
    }

    const targetUser = userRes.rows[0];
    if (targetUser.role !== 'doctor') {
      return res.status(400).json({ error: 'Only doctor accounts can be deleted via this endpoint.' });
    }

    // Nullify references in documents and blood_requests where this doctor was reviewer/verifier
    await query('UPDATE documents SET reviewed_by = NULL WHERE reviewed_by = $1', [targetUserId]);
    await query('UPDATE blood_requests SET verified_by = NULL WHERE verified_by = $1', [targetUserId]);

    // Delete doctor profile(s)
    await query('DELETE FROM doctor_profiles WHERE user_id = $1 OR id = $1', [targetUserId]);

    // Delete documents uploaded by this user
    await query('DELETE FROM documents WHERE user_id = $1', [targetUserId]);

    // Delete user record
    await query('DELETE FROM users WHERE id = $1', [targetUserId]);

    console.log(`[LifeLink Admin] Doctor account ${targetUser.email} (${targetUser.full_name}) permanently deleted by Admin. Reason: ${reason.trim()}`);

    res.json({
      success: true,
      message: `Doctor account for Dr. ${targetUser.full_name} has been permanently deleted.`,
    });
  } catch (err) {
    console.error('Delete doctor error:', err);
    res.status(500).json({ error: err.message });
  }
};

router.delete('/doctors/:id', handleDeleteDoctor);
router.post('/delete-doctor/:id', handleDeleteDoctor);

// ============================================================================
// 2. USER SECTION (Donors & Receivers)
// ============================================================================

// 5. List All Users (Donors and Receivers)
router.get('/users', async (req, res) => {
  try {
    const { role, status } = req.query;
    let queryText = `SELECT 
        u.id,
        u.id as user_id,
        u.full_name,
        u.email,
        u.phone,
        u.role,
        u.status,
        u.age,
        u.gender,
        u.blood_group,
        u.city,
        u.onboarding_completed,
        u.created_at as registered_at,
        dp.is_available,
        dp.is_verified,
        dp.last_donation_date,
        dp.last_donation_date_status
       FROM users u
       LEFT JOIN donor_profiles dp ON dp.user_id = u.id
       WHERE u.role IN ('donor', 'receiver')`;
    const params = [];
    if (role && ['donor', 'receiver'].includes(role.toLowerCase())) {
      params.push(role.toLowerCase());
      queryText += ` AND u.role = $${params.length}`;
    }
    if (status) {
      params.push(status.toLowerCase());
      queryText += ` AND LOWER(u.status) = $${params.length}`;
    }
    queryText += ` ORDER BY u.created_at DESC`;

    const usersRes = await query(queryText, params);
    res.json({ users: usersRes.rows });
  } catch (err) {
    console.error('Admin users list error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 6. View Single User Full Profile (Personal, Donor/Receiver info, Requests, Documents)
router.get('/users/:id', async (req, res) => {
  try {
    const userId = req.params.id;
    const userRes = await query('SELECT * FROM users WHERE id = $1', [userId]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const targetUser = userRes.rows[0];
    delete targetUser.password_hash;

    let donorProfile = null;
    if (targetUser.role === 'donor') {
      const dpRes = await query('SELECT * FROM donor_profiles WHERE user_id = $1', [userId]);
      donorProfile = dpRes.rows[0] || null;
    }

    const requestsRes = await query('SELECT * FROM blood_requests WHERE requester_id = $1 ORDER BY created_at DESC', [userId]);
    const docsRes = await query('SELECT * FROM documents WHERE user_id = $1 ORDER BY created_at DESC', [userId]);

    res.json({
      user: {
        ...targetUser,
        donor_profile: donorProfile,
        blood_requests: requestsRes.rows || [],
        documents: docsRes.rows || [],
      },
    });
  } catch (err) {
    console.error('Admin user profile error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 7. Delete User with Mandatory Reason
const handleDeleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const { reason } = req.body;

    if (!reason || !reason.trim()) {
      return res.status(400).json({ error: 'A reason is required to delete a user account.' });
    }

    const userRes = await query('SELECT * FROM users WHERE id = $1', [userId]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    const targetUser = userRes.rows[0];
    if (targetUser.role === 'admin') {
      return res.status(400).json({ error: 'Administrator accounts cannot be deleted.' });
    }

    // Cascade deletes in DB
    await query('DELETE FROM users WHERE id = $1', [userId]);

    console.log(`[LifeLink Admin] User account ${targetUser.email} (${targetUser.full_name}, ${targetUser.role}) permanently deleted by Admin. Reason: ${reason.trim()}`);

    res.json({
      success: true,
      message: `User account for ${targetUser.full_name} (${targetUser.role}) has been permanently deleted.`,
    });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ error: err.message });
  }
};

router.delete('/users/:id', handleDeleteUser);
router.post('/delete-user/:id', handleDeleteUser);

// ============================================================================
// 3. HOSPITAL SECTION
// ============================================================================

// 8. List All Hospitals with Affiliated Doctor Counts
router.get('/hospitals', async (req, res) => {
  try {
    const hospitalsRes = await query('SELECT * FROM hospitals ORDER BY name ASC');
    const doctorsRes = await query('SELECT hospital_name FROM doctor_profiles');
    
    const countMap = {};
    for (const r of doctorsRes.rows || []) {
      if (r.hospital_name) {
        const key = r.hospital_name.toLowerCase().trim();
        countMap[key] = (countMap[key] || 0) + 1;
      }
    }

    const hospitalsWithCount = (hospitalsRes.rows || []).map((h) => ({
      ...h,
      doctors_count: countMap[h.name.toLowerCase().trim()] || 0,
    }));

    res.json({ hospitals: hospitalsWithCount });
  } catch (err) {
    console.error('Admin hospitals list error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 9. Admin Adds New Hospital (Strictly NO delete option per specification)
router.post('/hospitals', async (req, res) => {
  try {
    const { name, city, state, address, contact_phone } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Hospital name is required.' });
    }
    if (!city || !city.trim()) {
      return res.status(400).json({ error: 'Hospital city / location is required.' });
    }

    const existing = await query('SELECT * FROM hospitals WHERE LOWER(name) = $1', [name.toLowerCase().trim()]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'A hospital with this name is already listed.' });
    }

    const insRes = await query(
      `INSERT INTO hospitals (name, city, state, address, contact_phone)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name.trim(), city.trim(), (state || '').trim(), (address || '').trim(), (contact_phone || '').trim()]
    );

    console.log(`[LifeLink Admin] New hospital added: ${name.trim()} (${city.trim()})`);

    res.status(201).json({
      success: true,
      hospital: insRes.rows[0],
      message: 'Hospital added successfully and will be available in doctor registration.',
    });
  } catch (err) {
    console.error('Add hospital error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;

