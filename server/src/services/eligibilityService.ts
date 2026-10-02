/**
 * Eligibility Service
 * Computes interval cooldowns based on configurable hospital / administrative policies.
 * 
 * LifeLink Core Principle:
 * The platform only computes mathematical interval eligibility.
 * Final physical & clinical donor screening is strictly done by a doctor.
 */

export interface EligibilityPolicy {
  wholeBloodGapDays: number;
  plasmaGapDays: number;
  plateletsGapDays: number;
}

export const DEFAULT_ELIGIBILITY_POLICY: EligibilityPolicy = {
  wholeBloodGapDays: 90, // Configurable (default 90 days for whole blood in India)
  plasmaGapDays: 14,      // Configurable (default 14 days for plasmapheresis)
  plateletsGapDays: 7,    // Configurable (default 7 days for plateletpheresis)
};

export interface EligibilityResult {
  isIntervalEligible: boolean;
  daysSinceLastDonation: number | null;
  minimumRequiredGapDays: number;
  daysRemaining: number;
  nextEligibleDate: string | null;
  statusLabel: string;
  medicalDisclaimer: string;
}

/**
 * Calculates donor eligibility based on last donation date, component, and policy
 */
export function calculateDonorEligibility(
  lastDonationDateStr: string | null | undefined,
  component: string = 'whole_blood',
  policy: EligibilityPolicy = DEFAULT_ELIGIBILITY_POLICY
): EligibilityResult {
  const disclaimer = 'LifeLink computes interval eligibility only. Final clinical clearance is performed by the attending doctor at the blood bank.';

  // If donor has never donated before
  if (!lastDonationDateStr) {
    return {
      isIntervalEligible: true,
      daysSinceLastDonation: null,
      minimumRequiredGapDays: 0,
      daysRemaining: 0,
      nextEligibleDate: new Date().toISOString().split('T')[0],
      statusLabel: 'Eligible by interval (pending doctor screening)',
      medicalDisclaimer: disclaimer,
    };
  }

  // Determine required gap
  let requiredGapDays = policy.wholeBloodGapDays;
  if (component === 'plasma') {
    requiredGapDays = policy.plasmaGapDays;
  } else if (component === 'platelets') {
    requiredGapDays = policy.plateletsGapDays;
  }

  const lastDate = new Date(lastDonationDateStr);
  const now = new Date();
  
  // Difference in calendar days
  const diffTime = now.getTime() - lastDate.getTime();
  const daysSince = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  const daysRemaining = Math.max(0, requiredGapDays - daysSince);
  const isIntervalEligible = daysSince >= requiredGapDays;

  const nextEligibleTime = new Date(lastDate.getTime() + requiredGapDays * 24 * 60 * 60 * 1000);
  const nextEligibleDate = nextEligibleTime.toISOString().split('T')[0];

  return {
    isIntervalEligible,
    daysSinceLastDonation: daysSince,
    minimumRequiredGapDays: requiredGapDays,
    daysRemaining,
    nextEligibleDate,
    statusLabel: isIntervalEligible
      ? 'Eligible by interval (pending doctor screening)'
      : `Cooldown active (${daysRemaining} days remaining)`,
    medicalDisclaimer: disclaimer,
  };
}
