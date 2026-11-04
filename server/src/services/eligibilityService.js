/**
 * Eligibility Service
 * 
 * Strict Clinical Rule:
 * Cooldown is computed ONLY from a doctor-VERIFIED donation date.
 * If the date is PENDING or REJECTED by a doctor, the donor is NOT eligible.
 */

export const WHOLE_BLOOD_COOLDOWN_DAYS = 90;

export function calculateDonorEligibility(lastDonationDateStr, lastDonationDateStatus = 'pending') {
  const disclaimer = 'LifeLink computes interval eligibility only. Final clinical clearance is performed by the attending doctor.';

  // 1. If donor has never donated before (null or empty date)
  if (!lastDonationDateStr) {
    return {
      isEligible: true,
      status: 'eligible',
      daysSinceLastDonation: null,
      daysRemaining: 0,
      nextEligibleDate: new Date().toISOString().split('T')[0],
      statusLabel: 'Eligible (First-time donor)',
      isDoctorVerified: true,
      medicalDisclaimer: disclaimer,
    };
  }

  // 2. If date has not been doctor-verified yet
  if (lastDonationDateStatus === 'pending') {
    return {
      isEligible: false,
      status: 'pending_verification',
      daysSinceLastDonation: null,
      daysRemaining: null,
      nextEligibleDate: null,
      statusLabel: 'Pending doctor verification of donation date',
      isDoctorVerified: false,
      medicalDisclaimer: disclaimer,
    };
  }

  // 3. If doctor rejected the donation date proof
  if (lastDonationDateStatus === 'rejected') {
    return {
      isEligible: false,
      status: 'rejected',
      daysSinceLastDonation: null,
      daysRemaining: null,
      nextEligibleDate: null,
      statusLabel: 'Donation date rejected - please re-upload valid proof',
      isDoctorVerified: false,
      medicalDisclaimer: disclaimer,
    };
  }

  // 4. Doctor-VERIFIED donation date: Compute mathematically
  const lastDate = new Date(lastDonationDateStr);
  const now = new Date();
  const diffTime = now.getTime() - lastDate.getTime();
  const daysSince = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  const daysRemaining = Math.max(0, WHOLE_BLOOD_COOLDOWN_DAYS - daysSince);
  const isEligible = daysSince >= WHOLE_BLOOD_COOLDOWN_DAYS;

  const nextEligibleTime = new Date(lastDate.getTime() + WHOLE_BLOOD_COOLDOWN_DAYS * 24 * 60 * 60 * 1000);
  const nextEligibleDate = nextEligibleTime.toISOString().split('T')[0];

  return {
    isEligible,
    status: isEligible ? 'eligible' : 'cooldown',
    daysSinceLastDonation: daysSince,
    daysRemaining,
    nextEligibleDate,
    statusLabel: isEligible
      ? 'Eligible to donate'
      : `Cooldown active (${daysRemaining} days remaining)`,
    isDoctorVerified: true,
    medicalDisclaimer: disclaimer,
  };
}

