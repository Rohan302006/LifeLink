import { Router, Response } from 'express';
import { inMemoryDB } from '../db/database.js';
import { authenticateToken, AuthRequest, requireRole } from '../middleware/auth.js';

const router = Router();

// 1. Get Hospitals
router.get('/hospitals', (req: AuthRequest, res: Response) => {
  const hospitals = Array.from(inMemoryDB.hospitals.values());
  res.json({ hospitals });
});

// 2. Impact Dashboard Metrics
router.get('/impact', (req: AuthRequest, res: Response) => {
  const requests = Array.from(inMemoryDB.bloodRequests.values());
  const donors = Array.from(inMemoryDB.donors.values());
  const donations = Array.from(inMemoryDB.donations.values());
  const organPledges = Array.from(inMemoryDB.organPledges.values());

  const totalRequests = requests.length;
  const fulfilledRequests = requests.filter(r => r.status === 'fulfilled').length;
  const verifiedRequests = requests.filter(r => r.status === 'verified').length;
  const pendingRequests = requests.filter(r => r.status === 'pending').length;
  const activeDonors = donors.filter(d => d.is_available).length;
  const totalUnitsCoordinated = donations.reduce((sum, d) => sum + (d.units_donated || 1), 0);

  // Average response time simulation from seed data (e.g. 14.2 minutes)
  const averageResponseTimeMins = 14.2;

  res.json({
    metrics: {
      totalRequests,
      fulfilledRequests,
      verifiedRequests,
      pendingRequests,
      fulfillmentRatePct: totalRequests > 0 ? Math.round((fulfilledRequests / totalRequests) * 100) : 0,
      activeDonors,
      totalRegisteredDonors: donors.length,
      totalUnitsCoordinated,
      totalOrganPledges: organPledges.length,
      averageResponseTimeMins,
    },
  });
});

// 3. Audit Logs
router.get('/audit-logs', authenticateToken, requireRole(['admin']), (req: AuthRequest, res: Response) => {
  const logs = Array.from(inMemoryDB.auditLogs.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  res.json({ logs });
});

// 4. Update Hospital Configurable Policy (Gap Days)
router.put('/policies/:hospitalId', authenticateToken, requireRole(['admin']), (req: AuthRequest, res: Response) => {
  const { hospitalId } = req.params;
  const { whole_blood_gap_days, plasma_gap_days, platelets_gap_days } = req.body;

  let policy = inMemoryDB.hospitalPolicies.get(hospitalId);
  if (!policy) {
    policy = {
      id: `pol-${hospitalId}`,
      hospital_id: hospitalId,
      whole_blood_gap_days: 90,
      plasma_gap_days: 14,
      platelets_gap_days: 7,
      escalation_timeout_mins: 30,
      escalation_radius_km: 25.0,
    };
    inMemoryDB.hospitalPolicies.set(hospitalId, policy);
  }

  if (whole_blood_gap_days !== undefined) policy.whole_blood_gap_days = parseInt(whole_blood_gap_days, 10);
  if (plasma_gap_days !== undefined) policy.plasma_gap_days = parseInt(plasma_gap_days, 10);
  if (platelets_gap_days !== undefined) policy.platelets_gap_days = parseInt(platelets_gap_days, 10);

  res.json({
    success: true,
    policy,
    message: 'Hospital clinical eligibility policies updated successfully.',
  });
});

export default router;
