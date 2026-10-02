import { Router, Response } from 'express';
import { inMemoryDB } from '../db/database.js';
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth.js';
import { requestCreationLimiter } from '../middleware/rateLimiter.js';
import { findNearbyCompatibleDonors, sanitizeDonorPrivacy } from '../services/matchingService.js';
import { emailAdapter } from '../services/emailAdapter.js';

const router = Router();

// 1. Create Blood Request (with Duplicate Detection)
router.post('/', authenticateToken, requestCreationLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const {
      patient_name,
      hospital_id,
      blood_group,
      component,
      units_needed,
      urgency,
      required_by,
      doctor_id,
    } = req.body;

    if (!patient_name || !hospital_id || !blood_group || !units_needed || !required_by) {
      return res.status(400).json({ error: 'Missing required blood request fields' });
    }

    const hospital = inMemoryDB.hospitals.get(hospital_id);
    if (!hospital) {
      return res.status(404).json({ error: 'Hospital not found in verified registry' });
    }

    // DUPLICATE DETECTION: Check if active request exists for same patient + hospital + blood group in past 24h
    const oneDayAgo = new Date(Date.now() - 24 * 3600000).toISOString();
    const existingDuplicate = Array.from(inMemoryDB.bloodRequests.values()).find(
      r =>
        r.patient_name.toLowerCase().trim() === patient_name.toLowerCase().trim() &&
        r.hospital_id === hospital_id &&
        r.blood_group === blood_group &&
        (r.status === 'pending' || r.status === 'verified') &&
        r.created_at >= oneDayAgo
    );

    if (existingDuplicate) {
      return res.status(409).json({
        error: 'Duplicate request detected',
        message: `An active request for patient "${patient_name}" (${blood_group}) at ${hospital.name} is already registered (#${existingDuplicate.id}). Please contact the hospital verifier.`,
        existingRequestId: existingDuplicate.id,
      });
    }

    const requestId = `req-${Date.now().toString().slice(-6)}`;
    const timestamp = new Date().toISOString();

    const newRequest = {
      id: requestId,
      requester_id: req.user!.id,
      patient_name,
      hospital_id,
      doctor_id: doctor_id || null,
      blood_group,
      component: component || 'whole_blood',
      units_needed: parseInt(units_needed, 10),
      urgency: urgency || 'urgent_within_24h',
      required_by,
      status: 'pending' as const, // Strict Rule: ALWAYS starts as pending!
      doctor_notes: null,
      rejection_reason: null,
      lat: hospital.lat,
      lng: hospital.lng,
      created_at: timestamp,
      verified_at: null,
      fulfilled_at: null,
      hospital_name: hospital.name,
      requester_name: req.user!.full_name,
      requester_phone: req.user!.phone,
    };

    inMemoryDB.bloodRequests.set(requestId, newRequest);

    // Audit Log
    inMemoryDB.auditLogs.set(`audit-${Date.now()}`, {
      id: `audit-${Date.now()}`,
      user_id: req.user!.id,
      action: 'REQUEST_CREATED_PENDING_VERIFICATION',
      resource_type: 'blood_requests',
      resource_id: requestId,
      created_at: timestamp,
    });

    // Notify hospital doctors
    const doctors = Array.from(inMemoryDB.doctors.values()).filter(d => d.hospital_id === hospital_id);
    for (const doc of doctors) {
      const docUser = inMemoryDB.users.get(doc.user_id);
      if (docUser) {
        await emailAdapter.sendEmail({
          to: docUser.email,
          userId: docUser.id,
          subject: `Verification Needed: Blood Request #${requestId} (${blood_group})`,
          body: `A new emergency request for ${patient_name} (${units_needed} unit(s) ${blood_group}) requires doctor verification before broadcast.`,
          type: 'doctor_verification_queue',
        });
      }
    }

    res.status(201).json({
      success: true,
      request: newRequest,
      message: 'Request registered. Placed in Doctor Verification Queue. It will be broadcast to donors immediately upon doctor approval.',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Get All Requests (Role filtered)
router.get('/', authenticateToken, (req: AuthRequest, res: Response) => {
  const allRequests = Array.from(inMemoryDB.bloodRequests.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const user = req.user!;

  if (user.role === 'admin') {
    return res.json({ requests: allRequests });
  }

  if (user.role === 'doctor') {
    // Doctors see their hospital's requests + all verified
    const hospitalId = user.hospital_id;
    const filtered = allRequests.filter(
      r => r.hospital_id === hospitalId || r.status === 'verified' || r.status === 'fulfilled'
    );
    return res.json({ requests: filtered });
  }

  if (user.role === 'requester') {
    // Requesters see their own requests + verified active requests
    const filtered = allRequests.filter(
      r => r.requester_id === user.id || r.status === 'verified'
    );
    return res.json({ requests: filtered });
  }

  // Donors only see verified broadcasts
  const verifiedOnly = allRequests.filter(r => r.status === 'verified');
  res.json({ requests: verifiedOnly });
});

// 3. Get Request Details by ID (with Status Timeline)
router.get('/:id', authenticateToken, (req: AuthRequest, res: Response) => {
  const request = inMemoryDB.bloodRequests.get(req.params.id);
  if (!request) return res.status(404).json({ error: 'Request not found' });

  const hospital = inMemoryDB.hospitals.get(request.hospital_id);

  // Status timeline events
  const timeline = [
    {
      title: 'Request Created',
      description: 'Submitted by attendant and queued for doctor verification.',
      timestamp: request.created_at,
      completed: true,
    },
    {
      title: 'Doctor Medical Verification',
      description: request.verified_at
        ? `Verified by attending physician. ${request.doctor_notes || ''}`
        : 'Pending review by hospital physician.',
      timestamp: request.verified_at,
      completed: !!request.verified_at,
      isPending: !request.verified_at && request.status === 'pending',
    },
    {
      title: 'Donor Matching & Broadcast',
      description: request.verified_at
        ? 'Location matching active across nearby compatible donors.'
        : 'Awaiting doctor clearance before broadcasting.',
      timestamp: request.verified_at,
      completed: !!request.verified_at,
    },
    {
      title: 'Donation Completed & Logged',
      description: request.fulfilled_at
        ? 'Donation verified on-site by doctor. Request fulfilled.'
        : 'Donation pending completion.',
      timestamp: request.fulfilled_at,
      completed: !!request.fulfilled_at,
    },
  ];

  // Matches for this request
  const matches = Array.from(inMemoryDB.requestMatches.values()).filter(m => m.request_id === request.id);

  res.json({
    request: {
      ...request,
      hospital,
      timeline,
      matchesCount: matches.length,
      acceptedMatchesCount: matches.filter(m => m.status === 'accepted').length,
    },
  });
});

// 4. Doctor Verification Queue: Verify Blood Request
router.post('/:id/verify', authenticateToken, requireRole(['doctor', 'admin']), async (req: AuthRequest, res: Response) => {
  try {
    const request = inMemoryDB.bloodRequests.get(req.params.id);
    if (!request) return res.status(404).json({ error: 'Request not found' });

    if (request.status !== 'pending') {
      return res.status(400).json({ error: `Cannot verify request with current status: ${request.status}` });
    }

    const { doctor_notes } = req.body;
    const timestamp = new Date().toISOString();

    request.status = 'verified';
    request.verified_at = timestamp;
    request.doctor_id = req.user?.doctor_id || null;
    request.doctor_notes = doctor_notes || 'Verified by attending physician. Eligible for donor dispatch.';

    // RUN MATCHING ENGINE: Automatically match nearby compatible donors!
    const allDonors = Array.from(inMemoryDB.donors.values());
    const matchedDonors = findNearbyCompatibleDonors(request, allDonors, 25.0);

    // Save match notifications
    for (const matched of matchedDonors.slice(0, 10)) { // notify top 10 nearest
      const matchId = `match-${request.id}-${matched.donor_id}`;
      inMemoryDB.requestMatches.set(matchId, {
        id: matchId,
        request_id: request.id,
        donor_id: matched.donor_id,
        distance_km: matched.distance_km,
        status: 'notified',
        notified_at: timestamp,
        responded_at: null,
        donor_name: matched.full_name,
        donor_phone: inMemoryDB.donors.get(matched.donor_id)?.phone,
        approx_area: matched.approx_area,
        blood_group: matched.blood_group,
      });

      // Send donor notification email
      const donorUser = inMemoryDB.users.get(matched.user_id);
      if (donorUser) {
        await emailAdapter.sendEmail({
          to: donorUser.email,
          userId: donorUser.id,
          subject: `Emergency Match: Urgent ${request.blood_group} Blood Needed`,
          body: `An approved doctor-supervised request requires ${request.blood_group} blood at ${request.hospital_name} (~${matched.distance_km} km from you). Log in to accept or decline. Your phone number remains hidden until acceptance.`,
          type: 'donor_match_alert',
        });
      }
    }

    // Audit Log
    inMemoryDB.auditLogs.set(`audit-${Date.now()}`, {
      id: `audit-${Date.now()}`,
      user_id: req.user!.id,
      action: 'REQUEST_VERIFIED_BY_DOCTOR',
      resource_type: 'blood_requests',
      resource_id: request.id,
      created_at: timestamp,
    });

    res.json({
      success: true,
      request,
      matchedDonorsCount: matchedDonors.length,
      message: `Request #${request.id} verified. Broadcast dispatched to ${matchedDonors.length} compatible nearby donors.`,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Doctor Reject Blood Request
router.post('/:id/reject', authenticateToken, requireRole(['doctor', 'admin']), (req: AuthRequest, res: Response) => {
  const request = inMemoryDB.bloodRequests.get(req.params.id);
  if (!request) return res.status(404).json({ error: 'Request not found' });

  const { rejection_reason } = req.body;
  request.status = 'rejected';
  request.rejection_reason = rejection_reason || 'Incomplete clinical information or unverified patient record.';

  // Audit Log
  inMemoryDB.auditLogs.set(`audit-${Date.now()}`, {
    id: `audit-${Date.now()}`,
    user_id: req.user!.id,
    action: 'REQUEST_REJECTED_BY_DOCTOR',
    resource_type: 'blood_requests',
    resource_id: request.id,
    created_at: new Date().toISOString(),
  });

  res.json({ success: true, request, message: 'Request rejected.' });
});

// 6. Get Matched Donors for a Request (PRIVACY PROTECTED)
router.get('/:id/matches', authenticateToken, (req: AuthRequest, res: Response) => {
  const request = inMemoryDB.bloodRequests.get(req.params.id);
  if (!request) return res.status(404).json({ error: 'Request not found' });

  // Only verified requests show matches
  if (request.status === 'pending') {
    return res.status(403).json({
      error: 'Unverified requests cannot view or broadcast to donors.',
    });
  }

  const matches = Array.from(inMemoryDB.requestMatches.values()).filter(m => m.request_id === request.id);

  // Apply privacy sanitization: Phone and exact GPS are masked unless status === 'accepted'
  const sanitizedMatches = matches.map(match => {
    const donor = inMemoryDB.donors.get(match.donor_id);
    if (!donor) return null;
    return sanitizeDonorPrivacy(donor, match);
  }).filter(Boolean);

  res.json({ matches: sanitizedMatches });
});

export default router;
