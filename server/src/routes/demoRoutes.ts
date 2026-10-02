import { Router, Request, Response } from 'express';
import { inMemoryDB } from '../db/database.js';
import { findNearbyCompatibleDonors } from '../services/matchingService.js';

const router = Router();

// 1. Reset Database to pristine initial seed state
router.post('/reset', (req: Request, res: Response) => {
  inMemoryDB.resetWithSeedData();
  res.json({
    success: true,
    message: 'LifeLink demo database successfully reset with 50 donors, 3 hospitals, 2 doctors, and 5 requests.',
  });
});

// 2. Demo State inspection
router.get('/state', (req: Request, res: Response) => {
  const req1 = inMemoryDB.bloodRequests.get('req-001');
  const matches = Array.from(inMemoryDB.requestMatches.values()).filter(m => m.request_id === 'req-001');
  const donations = Array.from(inMemoryDB.donations.values()).filter(d => d.request_id === 'req-001');

  res.json({
    activeDemoRequest: req1,
    matches,
    donations,
  });
});

// 3. Step execution for interactive 2-minute walkthrough
router.post('/step/:stepNumber', async (req: Request, res: Response) => {
  const step = parseInt(req.params.stepNumber, 10);
  const timestamp = new Date().toISOString();

  if (step === 1) {
    // Step 1: Create emergency request (Requester creates critical O- request)
    const requestId = 'req-demo-01';
    inMemoryDB.bloodRequests.set(requestId, {
      id: requestId,
      requester_id: 'user-req-1',
      patient_name: 'Anil Kapoor (ICU Bed 4)',
      hospital_id: 'hosp-101',
      doctor_id: null,
      blood_group: 'O-',
      component: 'whole_blood',
      units_needed: 2,
      urgency: 'critical_immediate',
      required_by: new Date(Date.now() + 3 * 3600000).toISOString(),
      status: 'pending', // Starts as pending doctor review!
      doctor_notes: null,
      rejection_reason: null,
      lat: 19.0519,
      lng: 72.8295,
      created_at: timestamp,
      verified_at: null,
      fulfilled_at: null,
      hospital_name: 'Lilavati Hospital & Research Centre',
      requester_name: 'Priya Deshmukh',
      requester_phone: '+91 98201 55667',
    });

    return res.json({
      step: 1,
      name: 'Emergency Request Created',
      description: 'Patient attendant created an emergency request for O- blood. It is now awaiting Doctor Verification.',
      requestId,
      status: 'pending',
    });
  }

  if (step === 2) {
    // Step 2: Doctor Verifies request & triggers matching
    const reqItem = inMemoryDB.bloodRequests.get('req-demo-01') || inMemoryDB.bloodRequests.get('req-001');
    if (!reqItem) return res.status(404).json({ error: 'Request not found' });

    reqItem.status = 'verified';
    reqItem.verified_at = timestamp;
    reqItem.doctor_id = 'doc-1';
    reqItem.doctor_notes = 'Pre-transfusion crossmatch form verified. Verified by Dr. Ananya Sharma.';

    // Run matching
    const allDonors = Array.from(inMemoryDB.donors.values());
    const matches = findNearbyCompatibleDonors(reqItem, allDonors, 25.0);

    // Save match for donor-1 (Aarav Patil, O-)
    const matchId = `match-${reqItem.id}-donor-1`;
    inMemoryDB.requestMatches.set(matchId, {
      id: matchId,
      request_id: reqItem.id,
      donor_id: 'donor-1',
      distance_km: 1.2,
      status: 'notified',
      notified_at: timestamp,
      responded_at: null,
      donor_name: 'Aarav Patil',
      donor_phone: inMemoryDB.donors.get('donor-1')?.phone,
      approx_area: 'Bandra West',
      blood_group: 'O-',
    });

    return res.json({
      step: 2,
      name: 'Doctor Verified & Donors Matched',
      description: `Dr. Ananya Sharma verified the request. Broadcast notified ${matches.length} compatible donors within 25km.`,
      requestId: reqItem.id,
      matchedDonorsCount: matches.length,
      status: 'verified',
    });
  }

  if (step === 3) {
    // Step 3: Donor Accepts (Contact unlocked!)
    const reqItem = inMemoryDB.bloodRequests.get('req-demo-01') || inMemoryDB.bloodRequests.get('req-001');
    const matchId = `match-${reqItem?.id}-donor-1`;
    const match = inMemoryDB.requestMatches.get(matchId) || inMemoryDB.requestMatches.get('match-001');

    if (match) {
      match.status = 'accepted';
      match.responded_at = timestamp;
    }

    return res.json({
      step: 3,
      name: 'Donor Accepted & Contact Unlocked',
      description: 'Donor Aarav Patil accepted the request! Strict privacy lock removed: Direct contact numbers and route map now revealed to both sides.',
      donorPhone: '+91 98202 10000',
      requesterPhone: '+91 98201 55667',
      status: 'accepted',
    });
  }

  if (step === 4) {
    // Step 4: Doctor Logs Donation & Updates Cooldown
    const reqItem = inMemoryDB.bloodRequests.get('req-demo-01') || inMemoryDB.bloodRequests.get('req-001');
    const donor = inMemoryDB.donors.get('donor-1');

    if (reqItem) {
      reqItem.status = 'fulfilled';
      reqItem.fulfilled_at = timestamp;
    }

    if (donor) {
      donor.last_donation_date = timestamp.split('T')[0];
    }

    const donationId = `don-demo-${Date.now().toString().slice(-4)}`;
    inMemoryDB.donations.set(donationId, {
      id: donationId,
      request_id: reqItem?.id || null,
      donor_id: 'donor-1',
      doctor_id: 'doc-1',
      hospital_id: 'hosp-101',
      blood_group: 'O-',
      component: 'whole_blood',
      units_donated: 2,
      donation_date: timestamp.split('T')[0],
      verified_by_doctor_at: timestamp,
      notes: 'Completed 2 units whole blood donation. Donor stable. Phlebotomy verified.',
      created_at: timestamp,
      donor_name: 'Aarav Patil',
      doctor_name: 'Dr. Ananya Sharma, MD',
      hospital_name: 'Lilavati Hospital & Research Centre',
    });

    return res.json({
      step: 4,
      name: 'Donation Completed & Logged',
      description: 'Dr. Ananya Sharma logged the donation. Request marked Fulfilled. Donor cooldown timer updated to 90 days. Audit log permanently stamped.',
      donationId,
      status: 'fulfilled',
    });
  }

  res.status(400).json({ error: 'Invalid step number. Steps: 1 to 4.' });
});

export default router;
