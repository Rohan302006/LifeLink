/**
 * Blood Compatibility Tables
 * LifeLink Verified Coordination Platform
 * 
 * Note: These are standard hematological compatibility rules used for pre-screening matching.
 * Actual transfusion crossmatching is ALWAYS performed by hospital blood bank pathologists.
 */

// Whole Blood and Packed Red Blood Cells (RBC) Compatibility Matrix
// Key = Recipient Blood Group, Value = Allowed Donor Blood Groups
export const RBC_COMPATIBILITY: Record<string, string[]> = {
  'O-':  ['O-'],
  'O+':  ['O-', 'O+'],
  'A-':  ['O-', 'A-'],
  'A+':  ['O-', 'O+', 'A-', 'A+'],
  'B-':  ['O-', 'B-'],
  'B+':  ['O-', 'O+', 'B-', 'B+'],
  'AB-': ['O-', 'A-', 'B-', 'AB-'],
  'AB+': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
};

// Platelets and Plasma Compatibility Matrix (Inverse of RBC in many antibodies)
export const PLASMA_COMPATIBILITY: Record<string, string[]> = {
  'O-':  ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'], // AB is universal plasma donor
  'O+':  ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
  'A-':  ['A-', 'A+', 'AB-', 'AB+'],
  'A+':  ['A-', 'A+', 'AB-', 'AB+'],
  'B-':  ['B-', 'B+', 'AB-', 'AB+'],
  'B+':  ['B-', 'B+', 'AB-', 'AB+'],
  'AB-': ['AB-', 'AB+'],
  'AB+': ['AB-', 'AB+'],
};

/**
 * Checks if a donor blood group is compatible with a recipient blood group
 * for a specific component.
 */
export function isBloodCompatible(
  recipientGroup: string,
  donorGroup: string,
  component: string = 'whole_blood'
): boolean {
  const normRecipient = recipientGroup.trim().toUpperCase();
  const normDonor = donorGroup.trim().toUpperCase();

  if (component === 'plasma' || component === 'platelets') {
    const allowed = PLASMA_COMPATIBILITY[normRecipient];
    return allowed ? allowed.includes(normDonor) : normRecipient === normDonor;
  }

  // Default to RBC / Whole Blood compatibility
  const allowed = RBC_COMPATIBILITY[normRecipient];
  return allowed ? allowed.includes(normDonor) : normRecipient === normDonor;
}

/**
 * Returns list of compatible donor groups for a given recipient
 */
export function getCompatibleDonorGroups(
  recipientGroup: string,
  component: string = 'whole_blood'
): string[] {
  const normRecipient = recipientGroup.trim().toUpperCase();
  if (component === 'plasma' || component === 'platelets') {
    return PLASMA_COMPATIBILITY[normRecipient] || [normRecipient];
  }
  return RBC_COMPATIBILITY[normRecipient] || [normRecipient];
}
