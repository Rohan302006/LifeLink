import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { query } from '../db/database.js';
import { isBloodCompatible } from '../services/bloodCompatibility.js';

const router = Router();

// 1. Create Emergency Blood Request (Accessible to DONOR or RECEIVER)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      patient_name,
      blood_group,
      units_needed,
      hospital_name,
      city,
      urgency,
    } = req.body;

    if (!patient_name || !blood_group || !hospital_name) {
      return res.status(400).json({ error: 'Patient name, blood group, and hospital name are required.' });
    }

    const insertRes = await query(
      `INSERT INTO blood_requests (requester_id, patient_name, blood_group, units_needed, hospital_name, city, urgency, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
       RETURNING *`,
      [
        req.user.id,
        patient_name.trim(),
        blood_group.trim().toUpperCase(),
        units_needed ? parseInt(units_needed, 10) : 1,
        hospital_name.trim(),
        city ? city.trim() : (req.user.city || ''),
        urgency || 'urgent',
      ]
    );

    res.status(201).json({
      success: true,
      request: insertRes.rows[0],
      message: 'Blood request submitted. It is now awaiting Doctor Verification before broadcasting to verified donors.',
    });
  } catch (err) {
    console.error('Create request error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 2. Get Current User's Requests
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const requestsRes = await query(
      'SELECT * FROM blood_requests WHERE requester_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json({ requests: requestsRes.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Get Single Request Details with Matched Donors
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const reqRes = await query('SELECT * FROM blood_requests WHERE id = $1', [req.params.id]);
    if (reqRes.rows.length === 0) {
      return res.status(404).json({ error: 'Blood request not found.' });
    }

    const request = reqRes.rows[0];

    // Fetch matches
    const matchesRes = await query('SELECT * FROM request_matches WHERE request_id = $1', [request.id]);

    // Enrich matches: only show contact if donor accepted
    const enrichedMatches = await Promise.all(
      matchesRes.rows.map(async (m) => {
        const donorUserRes = await query('SELECT * FROM users WHERE id = $1', [m.donor_id]);
        const donorUser = donorUserRes.rows[0] || {};

        return {
          id: m.id,
          donor_id: m.donor_id,
          status: m.status,
          notified_at: m.notified_at,
          responded_at: m.responded_at,
          donor_name: donorUser.full_name || 'Anonymous Donor',
          blood_group: donorUser.blood_group,
          city: donorUser.city,
          // Strict Privacy Rule: Phone unlocked only when match accepted
          phone: m.status === 'accepted' ? donorUser.phone : 'Locked until donor accepts',
          is_contact_revealed: m.status === 'accepted',
        };
      })
    );

    res.json({
      request,
      matches: enrichedMatches,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

