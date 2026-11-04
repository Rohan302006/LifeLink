/**
 * Emergency Escalation Worker
 * Periodically checks for critical requests where no donor has accepted within timeout.
 * Automatically widens the radius and triggers alert notifications.
 */

import { inMemoryDB } from '../db/database.js';
import { emailAdapter } from './emailAdapter.js';
import { findNearbyCompatibleDonors } from './matchingService.js';

export function startEscalationWorker(intervalMs: number = 60000) {
  console.log('⏱️ [Escalation Worker] Initialized. Monitoring emergency requests every 60s.');

  setInterval(() => {
    try {
      const now = Date.now();
      const verifiedRequests = Array.from(inMemoryDB.bloodRequests.values()).filter(
        r => r.status === 'verified' && r.urgency === 'critical_immediate'
      );

      for (const req of verifiedRequests) {
        // Find existing matches
        const matches = Array.from(inMemoryDB.requestMatches.values()).filter(m => m.request_id === req.id);
        const hasAccepted = matches.some(m => m.status === 'accepted');

        if (!hasAccepted && req.verified_at) {
          const verifiedTime = new Date(req.verified_at).getTime();
          const minutesPassed = (now - verifiedTime) / (60 * 1000);

          // If more than 30 minutes without acceptance, escalate radius to 50km
          if (minutesPassed > 30 && matches.length < 20) {
            console.log(`🚨 [Escalation Alert] Escalating search radius to 50km for critical Request #${req.id} (${req.blood_group})`);

            const allDonors = Array.from(inMemoryDB.donors.values());
            const escalatedMatches = findNearbyCompatibleDonors(req, allDonors, 50.0);

            // Add newly matched donors
            for (const d of escalatedMatches) {
              const matchId = `match-${req.id}-${d.donor_id}`;
              if (!inMemoryDB.requestMatches.has(matchId)) {
                inMemoryDB.requestMatches.set(matchId, {
                  id: matchId,
                  request_id: req.id,
                  donor_id: d.donor_id,
                  distance_km: d.distance_km,
                  status: 'notified',
                  notified_at: new Date().toISOString(),
                  responded_at: null,
                  donor_name: d.full_name,
                  approx_area: d.approx_area,
                  blood_group: d.blood_group,
                });
              }
            }

            // Notify Admin and Attending Doctor of escalation
            emailAdapter.sendEmail({
              to: 'admin@lifelink.org',
              subject: `[ESCALATION] Emergency Request #${req.id} (${req.blood_group}) Widened to 50km`,
              body: `No donor acceptance in 30 mins for critical patient ${req.patient_name} at ${req.hospital_name}. Radius automatically widened.`,
              type: 'emergency_escalation',
            });
          }
        }
      }
    } catch (err: any) {
      console.error('Error in escalation worker:', err.message);
    }
  }, intervalMs);
}
