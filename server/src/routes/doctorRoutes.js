import { Router } from 'express';
import { authenticateToken, requireDoctorApproved } from '../middleware/auth.js';
import { query } from '../db/database.js';
import { calculateDonorEligibility } from '../services/eligibilityService.js';
import { isBloodCompatible } from '../services/bloodCompatibility.js';

const router = Router();

// Doctor routes are strictly protected: only APPROVED doctors can access
router.use(authenticateToken);
router.use(requireDoctorApproved);

// 1. Get All Donors
router.get('/donors', async (req, res) => {
  try {
    const donorsRes = await query(
      `SELECT dp.*, u.full_name, u.email, u.phone, u.age, u.gender, u.blood_group, u.city, u.status as user_status
       FROM donor_profiles dp
       JOIN users u ON dp.user_id = u.id
       ORDER BY dp.created_at DESC`
    );

    const enrichedDonors = await Promise.all(
      donorsRes.rows.map(async (d) => {
        const docs = await query('SELECT * FROM documents WHERE user_id = $1', [d.user_id]);
        const eligibility = calculateDonorEligibility(d.last_donation_date, d.last_donation_date_status);
        return {
          ...d,
          documents: docs.rows,
          eligibility,
        };
      })
    );

    res.json({ donors: enrichedDonors });
  } catch (err) {
    console.error('Doctor donors list error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 2. Get All Receivers
router.get('/receivers', async (req, res) => {
  try {
    const receiversRes = await query(
      `SELECT id, full_name, email, phone, age, gender, blood_group, city, status as user_status, created_at
       FROM users
       WHERE role = 'receiver'
       ORDER BY created_at DESC`
    );

    const enrichedReceivers = await Promise.all(
      receiversRes.rows.map(async (r) => {
        const docs = await query('SELECT * FROM documents WHERE user_id = $1', [r.id]);
        const requests = await query('SELECT * FROM blood_requests WHERE requester_id = $1', [r.id]);
        return {
          ...r,
          documents: docs.rows,
          requestsCount: requests.rows.length,
        };
      })
    );

    res.json({ receivers: enrichedReceivers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Get All Blood Requests
router.get('/requests', async (req, res) => {
  try {
    const requestsRes = await query(
      `SELECT r.*, u.full_name as requester_name, u.phone as requester_phone, u.email as requester_email
       FROM blood_requests r
       JOIN users u ON r.requester_id = u.id
       ORDER BY r.created_at DESC`
    );

    res.json({ requests: requestsRes.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Get Full Profile of Any User (Full details + all documents)
router.get('/profile/:userId', async (req, res) => {
  try {
    const userRes = await query('SELECT * FROM users WHERE id = $1', [req.params.userId]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userRes.rows[0];
    delete user.password_hash;

    const docsRes = await query('SELECT * FROM documents WHERE user_id = $1 ORDER BY created_at DESC', [user.id]);
    const donorProfileRes = await query('SELECT * FROM donor_profiles WHERE user_id = $1', [user.id]);
    const donorProfile = donorProfileRes.rows[0] || null;

    let eligibility = null;
    if (donorProfile) {
      eligibility = calculateDonorEligibility(
        donorProfile.last_donation_date,
        donorProfile.last_donation_date_status
      );
    }

    const requestsRes = await query('SELECT * FROM blood_requests WHERE requester_id = $1 ORDER BY created_at DESC', [user.id]);

    res.json({
      user,
      donorProfile,
      eligibility,
      documents: docsRes.rows,
      requests: requestsRes.rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Verify Document (Approve / Reject with Required Reason)
router.post('/verify-document', async (req, res) => {
  try {
    const { document_id, status, rejection_reason } = req.body;

    if (!document_id || !['verified', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Document ID and valid status (verified/rejected) required.' });
    }

    if (status === 'rejected' && (!rejection_reason || rejection_reason.trim().length === 0)) {
      return res.status(400).json({ error: 'A specific reason is required when rejecting a document.' });
    }

    const updateRes = await query(
      `UPDATE documents
       SET status = $1, rejection_reason = $2, reviewed_by = $3, reviewed_at = NOW()
       WHERE id = $4
       RETURNING *`,
      [status, status === 'rejected' ? rejection_reason.trim() : null, req.user.id, document_id]
    );

    if (updateRes.rows.length === 0) {
      return res.status(404).json({ error: 'Document not found.' });
    }

    const doc = updateRes.rows[0];

    // If ID proof is verified, also update user status
    if (doc.doc_type === 'id_proof' && status === 'verified') {
      await query("UPDATE users SET status = 'verified' WHERE id = $1", [doc.user_id]);
    }

    res.json({
      success: true,
      document: doc,
      message: `Document status updated to ${status}.`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Verify Donor Last Donation Date (Approve / Reject with Required Reason)
router.post('/verify-donation-date', async (req, res) => {
  try {
    const { user_id, status, rejection_reason } = req.body;

    if (!user_id || !['verified', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'User ID and valid status (verified/rejected) required.' });
    }

    if (status === 'rejected' && (!rejection_reason || rejection_reason.trim().length === 0)) {
      return res.status(400).json({ error: 'A reason is required when rejecting a donation date.' });
    }

    const updateRes = await query(
      `UPDATE donor_profiles
       SET last_donation_date_status = $1, last_donation_rejection_reason = $2, updated_at = NOW()
       WHERE user_id = $3
       RETURNING *`,
      [status, status === 'rejected' ? rejection_reason.trim() : null, user_id]
    );

    if (updateRes.rows.length === 0) {
      return res.status(404).json({ error: 'Donor profile not found.' });
    }

    const updatedProfile = updateRes.rows[0];

    // Check if donor can be fully verified
    if (status === 'verified') {
      await query("UPDATE donor_profiles SET is_verified = TRUE WHERE user_id = $1", [user_id]);
      await query("UPDATE users SET status = 'verified' WHERE id = $1", [user_id]);
    }

    res.json({
      success: true,
      donorProfile: updatedProfile,
      message: `Donation date status updated to ${status}.`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Verify / Approve Blood Request (Triggers broadcast ONLY to verified donors)
router.post('/verify-request', async (req, res) => {
  try {
    const { request_id, status, rejection_reason, doctor_notes } = req.body;

    if (!request_id || !['verified', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Request ID and valid status (verified/rejected) required.' });
    }

    if (status === 'rejected' && (!rejection_reason || rejection_reason.trim().length === 0)) {
      return res.status(400).json({ error: 'A reason is required when rejecting a blood request.' });
    }

    const updateRes = await query(
      `UPDATE blood_requests
       SET status = $1, rejection_reason = $2, doctor_notes = $3, verified_by = $4, verified_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [
        status,
        status === 'rejected' ? rejection_reason.trim() : null,
        doctor_notes ? doctor_notes.trim() : null,
        req.user.id,
        request_id,
      ]
    );

    if (updateRes.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found.' });
    }

    const verifiedRequest = updateRes.rows[0];
    let matchedDonorsCount = 0;

    // Strict Rule: ONLY verified donors are broadcast / matched!
    if (status === 'verified') {
      // Find all verified donors who are currently available
      const donorsRes = await query(
        `SELECT u.id, u.blood_group, dp.is_available, dp.is_verified, dp.last_donation_date, dp.last_donation_date_status
         FROM users u
         JOIN donor_profiles dp ON u.id = dp.user_id
         WHERE dp.is_available = TRUE AND (dp.is_verified = TRUE OR u.status = 'verified')`
      );

      for (const donor of donorsRes.rows) {
        // Compatibility check
        if (isBloodCompatible(verifiedRequest.blood_group, donor.blood_group)) {
          // Eligibility cooldown check
          const eligibility = calculateDonorEligibility(donor.last_donation_date, donor.last_donation_date_status);
          if (eligibility.isEligible) {
            // Insert match record
            await query(
              `INSERT INTO request_matches (request_id, donor_id, status)
               VALUES ($1, $2, 'notified')
               ON CONFLICT (request_id, donor_id) DO NOTHING`,
              [verifiedRequest.id, donor.id]
            );
            matchedDonorsCount++;
          }
        }
      }
    }

    res.json({
      success: true,
      request: verifiedRequest,
      matchedDonorsCount,
      message: status === 'verified'
        ? `Request approved by Dr. ${req.user.full_name}. Broadcast sent to ${matchedDonorsCount} verified compatible donor(s).`
        : 'Request has been rejected.',
    });
  } catch (err) {
    console.error('Verify request error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;

