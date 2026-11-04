import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { query } from '../db/database.js';
import { calculateDonorEligibility } from '../services/eligibilityService.js';

const router = Router();

// 1. Donor Dashboard Data
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get donor profile
    const donorRes = await query('SELECT * FROM donor_profiles WHERE user_id = $1', [userId]);
    let donorProfile = donorRes.rows[0];

    // If profile doesn't exist yet, create one
    if (!donorProfile) {
      const createRes = await query(
        `INSERT INTO donor_profiles (user_id, last_donation_date, last_donation_date_status, is_available, is_verified)
         VALUES ($1, NULL, 'pending', TRUE, FALSE)
         RETURNING *`,
        [userId]
      );
      donorProfile = createRes.rows[0];
    }

    // Mathematical Cooldown: computed strictly from doctor-verified donation date
    const eligibility = calculateDonorEligibility(
      donorProfile.last_donation_date,
      donorProfile.last_donation_date_status
    );

    // Get documents
    const docsRes = await query('SELECT * FROM documents WHERE user_id = $1 ORDER BY created_at DESC', [userId]);

    // Get matched blood requests
    const matchesRes = await query('SELECT * FROM request_matches WHERE donor_id = $1 ORDER BY notified_at DESC', [userId]);

    const enrichedMatches = await Promise.all(
      matchesRes.rows.map(async (m) => {
        const reqRes = await query('SELECT * FROM blood_requests WHERE id = $1', [m.request_id]);
        return {
          ...m,
          request: reqRes.rows[0] || null,
        };
      })
    );

    res.json({
      user: {
        id: req.user.id,
        full_name: req.user.full_name,
        email: req.user.email,
        phone: req.user.phone,
        blood_group: req.user.blood_group,
        city: req.user.city,
        status: req.user.status,
        onboarding_completed: req.user.onboarding_completed,
      },
      donorProfile,
      eligibility,
      documents: docsRes.rows,
      matches: enrichedMatches,
    });
  } catch (err) {
    console.error('Donor dashboard error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 2. Toggle Availability
router.put('/availability', authenticateToken, async (req, res) => {
  try {
    const { is_available } = req.body;
    const userId = req.user.id;

    const updateRes = await query(
      `UPDATE donor_profiles
       SET is_available = $1, updated_at = NOW()
       WHERE user_id = $2
       RETURNING *`,
      [is_available, userId]
    );

    res.json({
      success: true,
      is_available: updateRes.rows[0]?.is_available,
      message: `Availability updated to ${is_available ? 'Available' : 'Unavailable'}.`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Update Last Donation Date (Pending Doctor Verification)
router.post('/donation-date', authenticateToken, async (req, res) => {
  try {
    const { last_donation_date } = req.body;
    const userId = req.user.id;

    const updateRes = await query(
      `UPDATE donor_profiles
       SET last_donation_date = $1, last_donation_date_status = 'pending', last_donation_rejection_reason = NULL, updated_at = NOW()
       WHERE user_id = $2
       RETURNING *`,
      [last_donation_date || null, userId]
    );

    res.json({
      success: true,
      donorProfile: updateRes.rows[0],
      message: 'Donation date recorded and submitted for doctor verification.',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Respond to Match: Accept or Decline
router.post('/matches/:id/respond', authenticateToken, async (req, res) => {
  try {
    const { action } = req.body; // 'accepted' | 'declined'
    if (!['accepted', 'declined'].includes(action)) {
      return res.status(400).json({ error: 'Action must be accepted or declined.' });
    }

    const matchRes = await query('SELECT * FROM request_matches WHERE id = $1', [req.params.id]);
    if (matchRes.rows.length === 0) {
      return res.status(404).json({ error: 'Match record not found.' });
    }

    const match = matchRes.rows[0];
    if (match.donor_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized for this match.' });
    }

    const updateRes = await query(
      `UPDATE request_matches
       SET status = $1, responded_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [action, match.id]
    );

    res.json({
      success: true,
      match: updateRes.rows[0],
      message: `Request match ${action}.`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

