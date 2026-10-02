/**
 * Matching Service with Strict Privacy-by-Design Filter
 * 
 * Rules:
 * 1. Blood group compatibility verification
 * 2. Distance computation (Haversine formula)
 * 3. Sorting by interval eligibility and distance
 * 4. STRICT PRIVACY: Donor phone and exact coordinates are NEVER revealed
 *    before explicit acceptance of a request match!
 */

import { isBloodCompatible } from './bloodCompatibility.js';
import { calculateDonorEligibility, EligibilityPolicy, DEFAULT_ELIGIBILITY_POLICY } from './eligibilityService.js';
import { DonorRecord, BloodRequestRecord, RequestMatchRecord } from '../seeds/seedData.js';

/**
 * Calculates Great-Circle distance using Haversine formula (in kilometers)
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((R * c).toFixed(2));
}

export interface MatchedDonorOutput {
  donor_id: string;
  user_id: string;
  blood_group: string;
  distance_km: number;
  approx_area: string;
  is_interval_eligible: boolean;
  status_label: string;
  next_eligible_date: string | null;
  // Privacy-gated fields
  full_name: string;
  phone: string | null; // NULL or MASKED prior to match acceptance
  lat: number | null;   // NULL prior to match acceptance
  lng: number | null;   // NULL prior to match acceptance
  match_status?: string;
  is_contact_revealed: boolean;
}

/**
 * Finds compatible donors for a blood request within a radius, sorted by eligibility & distance
 */
export function findNearbyCompatibleDonors(
  request: BloodRequestRecord,
  donors: DonorRecord[],
  maxRadiusKm: number = 25.0,
  policy: EligibilityPolicy = DEFAULT_ELIGIBILITY_POLICY
): MatchedDonorOutput[] {
  const matches: MatchedDonorOutput[] = [];

  for (const donor of donors) {
    // 1. Availability check
    if (!donor.is_available) continue;

    // 2. Compatibility check
    if (!isBloodCompatible(request.blood_group, donor.blood_group, request.component)) {
      continue;
    }

    // 3. Distance calculation
    const distanceKm = calculateHaversineDistanceKm(
      request.lat,
      request.lng,
      donor.lat,
      donor.lng
    );

    if (distanceKm > maxRadiusKm) continue;

    // 4. Eligibility calculation
    const eligibility = calculateDonorEligibility(
      donor.last_donation_date,
      request.component,
      policy
    );

    // Apply strict privacy masking (pre-acceptance by default)
    matches.push({
      donor_id: donor.id,
      user_id: donor.user_id,
      blood_group: donor.blood_group,
      distance_km: distanceKm,
      approx_area: donor.approx_area || 'Nearby Metro Region',
      is_interval_eligible: eligibility.isIntervalEligible,
      status_label: eligibility.statusLabel,
      next_eligible_date: eligibility.nextEligibleDate,
      full_name: donor.full_name || 'Anonymous Donor',
      // Strictly masked pre-acceptance:
      phone: null,
      lat: null,
      lng: null,
      is_contact_revealed: false,
    });
  }

  // Sort: Eligible donors first, then ascending by distance
  return matches.sort((a, b) => {
    if (a.is_interval_eligible !== b.is_interval_eligible) {
      return a.is_interval_eligible ? -1 : 1;
    }
    return a.distance_km - b.distance_km;
  });
}

/**
 * Privacy Enforcer: Formats donor response based on match acceptance state
 */
export function sanitizeDonorPrivacy(
  donor: DonorRecord,
  match: RequestMatchRecord | null | undefined
): MatchedDonorOutput {
  const isAccepted = match?.status === 'accepted';

  return {
    donor_id: donor.id,
    user_id: donor.user_id,
    blood_group: donor.blood_group,
    distance_km: match ? match.distance_km : 0,
    approx_area: donor.approx_area || 'Nearby Metro Region',
    is_interval_eligible: true,
    status_label: 'Eligible by interval (pending doctor screening)',
    next_eligible_date: null,
    full_name: donor.full_name || 'Verified Donor',
    // ONLY revealed if explicitly accepted by donor
    phone: isAccepted ? (donor.phone || null) : null,
    lat: isAccepted ? donor.lat : null,
    lng: isAccepted ? donor.lng : null,
    match_status: match?.status || 'notified',
    is_contact_revealed: isAccepted,
  };
}
