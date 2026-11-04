import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { query } from '../db/database.js';

const router = Router();

// 1. Update Profile Details during Onboarding
router.post('/details', authenticateToken, async (req, res) => {
  try {
    const { age, gender, blood_group, city, phone } = req.body;
    const userId = req.user.id;

    const updateRes = await query(
      `UPDATE users
       SET age = COALESCE($1, age),
           gender = COALESCE($2, gender),
           blood_group = COALESCE($3, blood_group),
           city = COALESCE($4, city),
           phone = COALESCE($5, phone),
           updated_at = NOW()
       WHERE id = $6
       RETURNING *`,
      [
        age ? parseInt(age, 10) : null,
        gender || null,
        blood_group || null,
        city ? city.trim() : null,
        phone ? phone.trim() : null,
        userId,
      ]
    );

    const user = updateRes.rows[0];
    delete user.password_hash;

    res.json({
      success: true,
      user,
      message: 'Onboarding profile details saved.',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Mark Onboarding as Completed
router.post('/complete', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const updateRes = await query(
      `UPDATE users
       SET onboarding_completed = TRUE, updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [userId]
    );

    const user = updateRes.rows[0];
    delete user.password_hash;

    res.json({
      success: true,
      user,
      message: 'Onboarding wizard completed successfully.',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

