import { Router, Response } from 'express';
import { inMemoryDB } from '../db/database.js';
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth.js';

const router = Router();

// 1. Doctor Logs Verified Donation
router.post('/', authenticateToken, requireRole(['doctor', 'admin']), (req: AuthRequest, res: Response) => {
  try {
    const {
      request_id,
      donor_id,
      blood_group,
      component,
      units_donated,
      notes,
    } = req.body;

    if (!donor_id || !blood_group) {
      return res.status(400).json({ error: 'Donor ID and blood group required' });
    }

    const donor = inMemoryDB.donors.get(donor_id);
    if (!donor) return res.status(404).json({ error: 'Donor not found' });

    const doctorId = req.user?.doctor_id || 'doc-1';
    const doctor = inMemoryDB.doctors.get(doctorId);
    const hospitalId = doctor?.hospital_id || 'hosp-101';
    const hospital = inMemoryDB.hospitals.get(hospitalId);

    const donationId = `don-${Date.now().toString().slice(-6)}`;
    const todayStr = new Date().toISOString().split('T')[0];
    const timestamp = new Date().toISOString();

    // 1. Create donation record
    const newDonation = {
      id: donationId,
      request_id: request_id || null,
      donor_id,
      doctor_id: doctorId,
      hospital_id: hospitalId,
      blood_group,
      component: component || 'whole_blood',
      units_donated: units_donated ? parseInt(units_donated, 10) : 1,
      donation_date: todayStr,
      verified_by_doctor_at: timestamp,
      notes: notes || 'Vitals normal. Phlebotomy performed under sterile conditions.',
      created_at: timestamp,
      donor_name: donor.full_name,
      doctor_name: req.user?.full_name,
      hospital_name: hospital?.name,
    };

    inMemoryDB.donations.set(donationId, newDonation);

    // 2. CRITICAL: Update donor's last_donation_date to start cooldown!
    donor.last_donation_date = todayStr;
    donor.updated_at = timestamp;

    // 3. If tied to a blood request, mark request as fulfilled!
    if (request_id) {
      const request = inMemoryDB.bloodRequests.get(request_id);
      if (request) {
        request.status = 'fulfilled';
        request.fulfilled_at = timestamp;
      }
    }

    // 4. Audit Log
    inMemoryDB.auditLogs.set(`audit-${Date.now()}`, {
      id: `audit-${Date.now()}`,
      user_id: req.user!.id,
      action: 'DONATION_VERIFIED_AND_LOGGED',
      resource_type: 'donations',
      resource_id: donationId,
      details_json: {
        donor_id,
        request_id,
        units_donated: newDonation.units_donated,
      },
      created_at: timestamp,
    });

    res.status(201).json({
      success: true,
      donation: newDonation,
      message: `Donation verified by ${req.user?.full_name}. Donor cooldown updated. Request marked fulfilled.`,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. List Verified Donations
router.get('/', authenticateToken, (req: AuthRequest, res: Response) => {
  const donations = Array.from(inMemoryDB.donations.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  res.json({ donations });
});

export default router;
