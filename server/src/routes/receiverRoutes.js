import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { query } from '../db/database.js';

const router = Router();

// 1. Receiver Dashboard Data
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch receiver documents
    const docsRes = await query(
      'SELECT * FROM documents WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    // Fetch all blood requests created by this user
    const requestsRes = await query(
      'SELECT * FROM blood_requests WHERE requester_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    // Enrich requests with matched donor counts
    const enrichedRequests = await Promise.all(
      requestsRes.rows.map(async (r) => {
        const matchesRes = await query('SELECT * FROM request_matches WHERE request_id = $1', [r.id]);
        return {
          ...r,
          matchesCount: matchesRes.rows.length,
          acceptedCount: matchesRes.rows.filter(m => m.status === 'accepted').length,
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
      documents: docsRes.rows,
      requests: enrichedRequests,
    });
  } catch (err) {
    console.error('Receiver dashboard error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;

