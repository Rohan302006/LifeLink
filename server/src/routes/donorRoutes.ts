import { Router, Response } from 'express';
import { inMemoryDB } from '../db/database.js';
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth.js';
import { calculateDonorEligibility } from '../services/eligibilityService.js';
import { calculateHaversineDistanceKm } from '../services/matchingService.js';
import { emailAdapter } from '../services/emailAdapter.js';

const router = Router();

// 1. Get Donor Profile & Live Cooldown Calculation
router.get('/profile', authenticateToken, requireRole(['donor', 'admin']), (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const donor = Array.from(inMemoryDB.donors.values()).find(d => d.user_id === userId);

  if (!donor) {
    return res.status(404).json({ error: 'Donor profile not found' });
  }

  const eligibility = calculateDonorEligibility(donor.last_donation_date, 'whole_blood');

  // Also calculate active matches
  const activeMatches = Array.from(inMemoryDB.requestMatches.values()).filter(
    m => m.donor_id === donor.id && (m.status === 'notified' || m.status === 'accepted')
  );

  res.json({
    donor: {
      ...donor,
      eligibility,
      activeMatchesCount: activeMatches.length,
    },
  });
});

// 2. Toggle Donor Availability
router.put('/availability', authenticateToken, requireRole(['donor', 'admin']), (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const donor = Array.from(inMemoryDB.donors.values()).find(d => d.user_id === userId);

  if (!donor) return res.status(404).json({ error: 'Donor profile not found' });

  const { is_available } = req.body;
  donor.is_available = typeof is_available === 'boolean' ? is_available : !donor.is_available;
  donor.updated_at = new Date().toISOString();

  res.json({
    success: true,
    is_available: donor.is_available,
    message: `Availability updated to: ${donor.is_available ? 'Available' : 'Temporarily Unavailable'}`,
  });
});

// 3. Get Requests Matched for this Donor
router.get('/matches', authenticateToken, requireRole(['donor', 'admin']), (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const donor = Array.from(inMemoryDB.donors.values()).find(d => d.user_id === userId);

  if (!donor) return res.status(404).json({ error: 'Donor profile not found' });

  const matches = Array.from(inMemoryDB.requestMatches.values()).filter(m => m.donor_id === donor.id);

  const enrichedMatches = matches.map(match => {
    const request = inMemoryDB.bloodRequests.get(match.request_id);
    const hospital = request ? inMemoryDB.hospitals.get(request.hospital_id) : null;
    return {
      match_id: match.id,
      status: match.status,
      distance_km: match.distance_km,
      notified_at: match.notified_at,
      responded_at: match.responded_at,
      request: request ? {
        id: request.id,
        patient_name: request.patient_name,
        blood_group: request.blood_group,
        component: request.component,
        units_needed: request.units_needed,
        urgency: request.urgency,
        required_by: request.required_by,
        hospital_name: hospital?.name,
        hospital_address: hospital?.address,
        // Only reveal requester contact if donor accepted!
        requester_contact: match.status === 'accepted' ? request.requester_phone : 'Locked until accepted',
        requester_name: request.requester_name,
      } : null,
    };
  });

  res.json({ matches: enrichedMatches });
});

// 4. Respond to Match: Accept or Decline
router.post('/matches/:matchId/respond', authenticateToken, requireRole(['donor', 'admin']), async (req: AuthRequest, res: Response) => {
  try {
    const { action } = req.body; // 'accept' | 'decline'
    if (!['accept', 'decline'].includes(action)) {
      return res.status(400).json({ error: 'Action must be accept or decline' });
    }

    const match = inMemoryDB.requestMatches.get(req.params.matchId);
    if (!match) return res.status(404).json({ error: 'Match record not found' });

    const donor = inMemoryDB.donors.get(match.donor_id);
    const request = inMemoryDB.bloodRequests.get(match.request_id);

    if (!donor || !request) return res.status(404).json({ error: 'Associated donor or request not found' });

    const timestamp = new Date().toISOString();
    match.status = action === 'accept' ? 'accepted' : 'declined';
    match.responded_at = timestamp;

    // Audit Log
    inMemoryDB.auditLogs.set(`audit-${Date.now()}`, {
      id: `audit-${Date.now()}`,
      user_id: req.user!.id,
      action: action === 'accept' ? 'DONOR_ACCEPTED_MATCH' : 'DONOR_DECLINED_MATCH',
      resource_type: 'request_matches',
      resource_id: match.id,
      created_at: timestamp,
    });

    if (action === 'accept') {
      // Notify requester that donor accepted! Contact is now mutually unlocked!
      const requester = inMemoryDB.users.get(request.requester_id);
      if (requester) {
        await emailAdapter.sendEmail({
          to: requester.email,
          userId: requester.id,
          subject: `Donor Accepted! Direct Contact Unlocked for Request #${request.id}`,
          body: `A verified donor (${donor.full_name}, ${donor.phone}) has accepted your emergency request. Contact them immediately to coordinate arrival at ${request.hospital_name}.`,
          type: 'donor_accepted_alert',
        });
      }
    }

    res.json({
      success: true,
      status: match.status,
      message: action === 'accept'
        ? 'Thank you! You have accepted the request. Direct emergency contact is now unlocked.'
        : 'Request declined. Thank you for notifying us.',
      // Revealed contact:
      unlockedRequesterPhone: action === 'accept' ? request.requester_phone : null,
      hospitalName: request.hospital_name,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
