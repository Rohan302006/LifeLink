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
    const doctorsRes = await query(
      `SELECT 
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
        u.city,
        u.status as user_status,
        u.created_at as registered_at
       FROM users u
       LEFT JOIN doctor_profiles dp ON dp.user_id = u.id
       WHERE u.role = 'doctor'
       ORDER BY u.created_at DESC`
    );

    res.json({ doctors: doctorsRes.rows });
  } catch (err) {
    console.error('Admin doctors list error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 2. Admin Approves Doctor Account
router.post('/approve-doctor/:id', async (req, res) => {
  try {
    const doctorId = req.params.id;

    // Update doctor profile to verified
    const updateProfileRes = await query(
      `UPDATE doctor_profiles
       SET approval_status = 'verified', rejection_reason = NULL, reviewed_at = NOW()
       WHERE id = $1 OR user_id = $1
       RETURNING *`,
      [doctorId]
    );

    let doctorProfile = updateProfileRes.rows[0];

    if (!doctorProfile) {
      // Find doctor user by id
      const userRes = await query('SELECT * FROM users WHERE id = $1 AND role = $2', [doctorId, 'doctor']);
      if (userRes.rows.length === 0) {
        return res.status(404).json({ error: 'Doctor account not found.' });
      }
      const insRes = await query(
        `INSERT INTO doctor_profiles (user_id, medical_license_number, hospital_name, hospital_city, approval_status, reviewed_at)
         VALUES ($1, 'Verified by Admin', 'Affiliated Hospital', '', 'verified', NOW())
         RETURNING *`,
        [doctorId]
      );
      doctorProfile = insRes.rows[0];
    }

    // Also update the underlying user status to verified
    await query("UPDATE users SET status = 'verified' WHERE id = $1", [doctorProfile.user_id]);

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

    const updateProfileRes = await query(
      `UPDATE doctor_profiles
       SET approval_status = 'rejected', rejection_reason = $1, reviewed_at = NOW()
       WHERE id = $2 OR user_id = $2
       RETURNING *`,
      [rejection_reason.trim(), doctorId]
    );

    if (updateProfileRes.rows.length === 0) {
      return res.status(404).json({ error: 'Doctor profile not found.' });
    }

    const doctorProfile = updateProfileRes.rows[0];
    await query("UPDATE users SET status = 'rejected' WHERE id = $1", [doctorProfile.user_id]);

    res.json({
      success: true,
      doctor: doctorProfile,
      message: 'Doctor account rejected.',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

