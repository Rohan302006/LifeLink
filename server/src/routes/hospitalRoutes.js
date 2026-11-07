import { Router } from 'express';
import { query } from '../db/database.js';

const router = Router();

// Public endpoint: List all listed hospitals (used in registration dropdown and publicly)
router.get('/', async (req, res) => {
  try {
    const hospitalsRes = await query('SELECT * FROM hospitals ORDER BY name ASC');
    res.json({ hospitals: hospitalsRes.rows });
  } catch (err) {
    console.error('List hospitals error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;

