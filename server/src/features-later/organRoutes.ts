import { Router, Response } from 'express';
import { inMemoryDB } from '../db/database.js';
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth.js';
import { emailAdapter } from '../services/emailAdapter.js';

const router = Router();

// 1. Submit Organ Pledge Intent (Awareness & Kin Record)
router.post('/pledge', async (req: AuthRequest, res: Response) => {
  try {
    const {
      full_name,
      date_of_birth,
      blood_group,
      organs_pledged,
      kin_name,
      kin_phone,
      kin_relation,
      official_registry_redirect_clicked,
    } = req.body;

    if (!full_name || !date_of_birth || !organs_pledged || !kin_name || !kin_phone) {
      return res.status(400).json({ error: 'Missing required organ pledge details' });
    }

    const pledgeId = `pledge-${Date.now().toString().slice(-6)}`;
    const timestamp = new Date().toISOString();

    const pledge = {
      id: pledgeId,
      user_id: req.user?.id || null,
      full_name,
      date_of_birth,
      blood_group: blood_group || 'O+',
      organs_pledged: Array.isArray(organs_pledged) ? organs_pledged : [organs_pledged],
      kin_name,
      kin_phone,
      kin_relation: kin_relation || 'Family Member',
      kin_notified: true,
      consent_timestamp: timestamp,
      official_registry_redirect_clicked: !!official_registry_redirect_clicked,
      created_at: timestamp,
    };

    inMemoryDB.organPledges.set(pledgeId, pledge);

    // Send Next-of-Kin Notification (simulation / email)
    if (kin_phone) {
      console.log(`📱 [Next-of-Kin Alert] Sent to ${kin_name} (${kin_phone}): "${full_name} has pledged their organs on LifeLink. In India, family consent is required at the time of donation. Please honor their noble wish."`);
    }

    // Audit Log
    inMemoryDB.auditLogs.set(`audit-${Date.now()}`, {
      id: `audit-${Date.now()}`,
      user_id: req.user?.id || null,
      action: 'ORGAN_PLEDGE_INTENT_RECORDED',
      resource_type: 'organ_pledges',
      resource_id: pledgeId,
      created_at: timestamp,
    });

    res.status(201).json({
      success: true,
      pledge,
      officialRegistryUrl: 'https://notto.mohfw.gov.in',
      message: 'Organ pledge intent successfully recorded. Next-of-kin notification logged. Please complete official registration on NOTTO.',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Get Organ Pledges
router.get('/pledges', authenticateToken, (req: AuthRequest, res: Response) => {
  const pledges = Array.from(inMemoryDB.organPledges.values());
  res.json({ pledges });
});

// 3. Hospital Transplant Coordinator Log
router.post('/coordinator-log', authenticateToken, requireRole(['doctor', 'admin']), (req: AuthRequest, res: Response) => {
  try {
    const {
      patient_identifier,
      family_members_present,
      outcome_notes,
      notto_notified,
    } = req.body;

    if (!patient_identifier || !outcome_notes) {
      return res.status(400).json({ error: 'Patient identifier and counseling notes required' });
    }

    const logId = `clog-${Date.now().toString().slice(-6)}`;
    const timestamp = new Date().toISOString();
    const doctor = req.user?.doctor_id ? inMemoryDB.doctors.get(req.user.doctor_id) : null;
    const hospitalId = doctor?.hospital_id || 'hosp-101';
    const hospital = inMemoryDB.hospitals.get(hospitalId);

    const logEntry = {
      id: logId,
      hospital_id: hospitalId,
      coordinator_user_id: req.user!.id,
      patient_identifier,
      conversation_date: timestamp,
      family_members_present: family_members_present || 'Attending Next-of-Kin',
      outcome_notes,
      notto_notified: !!notto_notified,
      created_at: timestamp,
      hospital_name: hospital?.name,
      coordinator_name: req.user!.full_name,
    };

    inMemoryDB.coordinatorLogs.set(logId, logEntry);

    // Audit Log
    inMemoryDB.auditLogs.set(`audit-${Date.now()}`, {
      id: `audit-${Date.now()}`,
      user_id: req.user!.id,
      action: 'TRANSPLANT_COORDINATOR_CONVERSATION_LOGGED',
      resource_type: 'coordinator_logs',
      resource_id: logId,
      created_at: timestamp,
    });

    res.status(201).json({
      success: true,
      log: logEntry,
      message: 'Transplant coordinator conversation logged for hospital records.',
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Get Coordinator Logs
router.get('/coordinator-logs', authenticateToken, requireRole(['doctor', 'admin']), (req: AuthRequest, res: Response) => {
  const logs = Array.from(inMemoryDB.coordinatorLogs.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  res.json({ logs });
});

export default router;
