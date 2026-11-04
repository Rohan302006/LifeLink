/**
 * Blood Compatibility Tables
 * LifeLink Coordination Platform
 */

export const RBC_COMPATIBILITY = {
  'O-': ['O-'],
  'O+': ['O-', 'O+'],
  'A-': ['O-', 'A-'],
  'A+': ['O-', 'O+', 'A-', 'A+'],
  'B-': ['O-', 'B-'],
  'B+': ['O-', 'O+', 'B-', 'B+'],
  'AB-': ['O-', 'A-', 'B-', 'AB-'],
  'AB+': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
};

export function isBloodCompatible(recipientGroup, donorGroup) {
  if (!recipientGroup || !donorGroup) return false;
  const normRecipient = recipientGroup.trim().toUpperCase();
  const normDonor = donorGroup.trim().toUpperCase();

  const allowed = RBC_COMPATIBILITY[normRecipient];
  return allowed ? allowed.includes(normDonor) : normRecipient === normDonor;
}

export function getCompatibleDonorGroups(recipientGroup) {
  if (!recipientGroup) return [];
  const normRecipient = recipientGroup.trim().toUpperCase();
  return RBC_COMPATIBILITY[normRecipient] || [normRecipient];
}

