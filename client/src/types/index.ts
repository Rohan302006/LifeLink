export type UserRole = 'requester' | 'donor' | 'doctor' | 'admin';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
  phone: string;
  phone_verified?: boolean;
  doctor?: DoctorProfile | null;
  donor?: DonorProfile | null;
}

export interface DoctorProfile {
  id: string;
  user_id: string;
  hospital_id: string;
  medical_license_number: string;
  specialization: string;
  is_verified: boolean;
  hospital_name?: string;
  doctor_name?: string;
}

export interface DonorProfile {
  id: string;
  user_id: string;
  blood_group: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  approx_area: string;
  last_donation_date: string | null;
  is_available: boolean;
  consent_given_at: string;
  medical_notes_self_reported?: string;
  full_name?: string;
  phone?: string;
  eligibility?: DonorEligibility;
}

export interface DonorEligibility {
  isIntervalEligible: boolean;
  daysSinceLastDonation: number | null;
  minimumRequiredGapDays: number;
  daysRemaining: number;
  nextEligibleDate: string | null;
  statusLabel: string;
  medicalDisclaimer: string;
}

export interface Hospital {
  id: string;
  name: string;
  registration_number: string;
  address: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  phone: string;
  email: string;
  is_verified: boolean;
  emergency_contact: string;
}

export interface BloodRequest {
  id: string;
  requester_id: string;
  patient_name: string;
  hospital_id: string;
  doctor_id: string | null;
  blood_group: string;
  component: 'whole_blood' | 'packed_rbc' | 'platelets' | 'plasma';
  units_needed: number;
  urgency: 'critical_immediate' | 'urgent_within_24h' | 'planned';
  required_by: string;
  status: 'pending' | 'verified' | 'rejected' | 'fulfilled' | 'expired';
  doctor_notes: string | null;
  rejection_reason: string | null;
  lat: number;
  lng: number;
  created_at: string;
  verified_at: string | null;
  fulfilled_at: string | null;
  hospital_name?: string;
  requester_name?: string;
  requester_phone?: string;
  hospital?: Hospital;
  timeline?: Array<{
    title: string;
    description: string;
    timestamp: string | null;
    completed: boolean;
    isPending?: boolean;
  }>;
  matchesCount?: number;
  acceptedMatchesCount?: number;
}

export interface MatchedDonor {
  donor_id: string;
  user_id: string;
  blood_group: string;
  distance_km: number;
  approx_area: string;
  is_interval_eligible: boolean;
  status_label: string;
  next_eligible_date: string | null;
  full_name: string;
  phone: string | null; // Masked prior to acceptance!
  lat: number | null;
  lng: number | null;
  match_status?: string;
  is_contact_revealed: boolean;
}

export interface DonationRecord {
  id: string;
  request_id: string | null;
  donor_id: string;
  doctor_id: string;
  hospital_id: string;
  blood_group: string;
  component: string;
  units_donated: number;
  donation_date: string;
  verified_by_doctor_at: string;
  notes: string | null;
  donor_name?: string;
  doctor_name?: string;
  hospital_name?: string;
}

export interface OrganPledge {
  id: string;
  user_id: string | null;
  full_name: string;
  date_of_birth: string;
  blood_group: string;
  organs_pledged: string[];
  kin_name: string;
  kin_phone: string;
  kin_relation: string;
  kin_notified: boolean;
  consent_timestamp: string;
  official_registry_redirect_clicked: boolean;
  created_at: string;
}

export interface CoordinatorLog {
  id: string;
  hospital_id: string;
  coordinator_user_id: string;
  patient_identifier: string;
  conversation_date: string;
  family_members_present: string;
  outcome_notes: string;
  notto_notified: boolean;
  created_at: string;
  hospital_name?: string;
  coordinator_name?: string;
}

export interface ImpactMetrics {
  totalRequests: number;
  fulfilledRequests: number;
  verifiedRequests: number;
  pendingRequests: number;
  fulfillmentRatePct: number;
  activeDonors: number;
  totalRegisteredDonors: number;
  totalUnitsCoordinated: number;
  totalOrganPledges: number;
  averageResponseTimeMins: number;
}
