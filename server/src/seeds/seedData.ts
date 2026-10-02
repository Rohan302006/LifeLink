export interface UserRecord {
  id: string;
  email: string;
  password_hash: string;
  role: 'requester' | 'donor' | 'doctor' | 'admin';
  full_name: string;
  phone: string;
  phone_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface HospitalRecord {
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
  created_at: string;
}

export interface DoctorRecord {
  id: string;
  user_id: string;
  hospital_id: string;
  medical_license_number: string;
  specialization: string;
  is_verified: boolean;
  created_at: string;
  doctor_name?: string;
  hospital_name?: string;
}

export interface DonorRecord {
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
  medical_notes_self_reported: string;
  created_at: string;
  updated_at: string;
  full_name?: string;
  phone?: string;
}

export interface BloodRequestRecord {
  id: string;
  requester_id: string;
  patient_name: string;
  hospital_id: string;
  doctor_id: string | null;
  blood_group: string;
  component: string;
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
}

export interface RequestMatchRecord {
  id: string;
  request_id: string;
  donor_id: string;
  distance_km: number;
  status: 'notified' | 'accepted' | 'declined' | 'expired';
  notified_at: string;
  responded_at: string | null;
  donor_name?: string;
  donor_phone?: string;
  approx_area?: string;
  blood_group?: string;
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
  created_at: string;
  donor_name?: string;
  doctor_name?: string;
  hospital_name?: string;
}

export interface OrganPledgeRecord {
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

export interface CoordinatorLogRecord {
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

export interface HospitalPolicyRecord {
  id: string;
  hospital_id: string;
  whole_blood_gap_days: number;
  plasma_gap_days: number;
  platelets_gap_days: number;
  escalation_timeout_mins: number;
  escalation_radius_km: number;
}

// Initial Seed Data
export const SEED_HOSPITALS: HospitalRecord[] = [
  {
    id: 'hosp-101',
    name: 'Lilavati Hospital & Research Centre',
    registration_number: 'MH-MUM-2004-9812',
    address: 'A-791, Bandra Reclamation, Bandra West',
    city: 'Mumbai',
    state: 'Maharashtra',
    lat: 19.0519,
    lng: 72.8295,
    phone: '+91 22 2675 1000',
    email: 'emergency@lilavatihospital.com',
    is_verified: true,
    emergency_contact: '+91 98200 11223',
    created_at: '2026-01-10T10:00:00Z',
  },
  {
    id: 'hosp-102',
    name: 'Tata Memorial Hospital',
    registration_number: 'MH-MUM-1998-4421',
    address: 'Dr. E Borges Road, Parel',
    city: 'Mumbai',
    state: 'Maharashtra',
    lat: 19.0044,
    lng: 72.8427,
    phone: '+91 22 2417 7000',
    email: 'bloodbank@tmc.gov.in',
    is_verified: true,
    emergency_contact: '+91 98200 44556',
    created_at: '2026-01-12T10:00:00Z',
  },
  {
    id: 'hosp-103',
    name: 'King Edward Memorial (KEM) Hospital',
    registration_number: 'MH-MUM-1975-1102',
    address: 'Acharya Donde Marg, Parel',
    city: 'Mumbai',
    state: 'Maharashtra',
    lat: 19.0028,
    lng: 72.8415,
    phone: '+91 22 2410 7000',
    email: 'transfusion@kem.edu',
    is_verified: true,
    emergency_contact: '+91 98200 77889',
    created_at: '2026-01-15T10:00:00Z',
  },
];

// Pre-seeded Users (Admins, Doctors, Requesters, Sample Donors)
// Password for all seeded users: "LifeLink2026!" (Bcrypt hash below)
export const DEFAULT_PASSWORD_HASH = '$2a$10$WqB4Q5nQ4qO4vVbX6Jz2UOB8v9Q0S/0JtQzE2PjE0k7PjW3g0tE7a'; // LifeLink2026!

export const SEED_USERS: UserRecord[] = [
  {
    id: 'user-admin-1',
    email: 'admin@lifelink.org',
    password_hash: DEFAULT_PASSWORD_HASH,
    role: 'admin',
    full_name: 'Dr. Vivek Rane (System Admin)',
    phone: '+91 98201 00001',
    phone_verified: true,
    is_active: true,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'user-doc-1',
    email: 'dr.ananya@lilavati.com',
    password_hash: DEFAULT_PASSWORD_HASH,
    role: 'doctor',
    full_name: 'Dr. Ananya Sharma, MD',
    phone: '+91 98201 11222',
    phone_verified: true,
    is_active: true,
    created_at: '2026-01-10T11:00:00Z',
    updated_at: '2026-01-10T11:00:00Z',
  },
  {
    id: 'user-doc-2',
    email: 'dr.rajesh@tmc.gov.in',
    password_hash: DEFAULT_PASSWORD_HASH,
    role: 'doctor',
    full_name: 'Dr. Rajesh Mehta, FRCPath',
    phone: '+91 98201 33444',
    phone_verified: true,
    is_active: true,
    created_at: '2026-01-12T11:00:00Z',
    updated_at: '2026-01-12T11:00:00Z',
  },
  {
    id: 'user-req-1',
    email: 'priya.attendant@gmail.com',
    password_hash: DEFAULT_PASSWORD_HASH,
    role: 'requester',
    full_name: 'Priya Deshmukh',
    phone: '+91 98201 55667',
    phone_verified: true,
    is_active: true,
    created_at: '2026-02-01T09:00:00Z',
    updated_at: '2026-02-01T09:00:00Z',
  },
];

export const SEED_DOCTORS: DoctorRecord[] = [
  {
    id: 'doc-1',
    user_id: 'user-doc-1',
    hospital_id: 'hosp-101',
    medical_license_number: 'MMC-2012-08-3312',
    specialization: 'Transfusion Medicine & Critical Care',
    is_verified: true,
    created_at: '2026-01-10T11:00:00Z',
    doctor_name: 'Dr. Ananya Sharma, MD',
    hospital_name: 'Lilavati Hospital & Research Centre',
  },
  {
    id: 'doc-2',
    user_id: 'user-doc-2',
    hospital_id: 'hosp-102',
    medical_license_number: 'MMC-2008-04-1920',
    specialization: 'Hematology & Oncology Transfusion',
    is_verified: true,
    created_at: '2026-01-12T11:00:00Z',
    doctor_name: 'Dr. Rajesh Mehta, FRCPath',
    hospital_name: 'Tata Memorial Hospital',
  },
];

// Helper to generate 50 realistic donors across Mumbai localities
const MUMBAI_LOCALITIES = [
  { name: 'Bandra West', lat: 19.0596, lng: 72.8295 },
  { name: 'Bandra East', lat: 19.0607, lng: 72.8467 },
  { name: 'Khar West', lat: 19.0700, lng: 72.8338 },
  { name: 'Santacruz', lat: 19.0843, lng: 72.8360 },
  { name: 'Parel', lat: 19.0044, lng: 72.8427 },
  { name: 'Dadar West', lat: 19.0178, lng: 72.8478 },
  { name: 'Worli', lat: 19.0134, lng: 72.8154 },
  { name: 'Mahim', lat: 19.0354, lng: 72.8404 },
  { name: 'Andheri West', lat: 19.1136, lng: 72.8397 },
  { name: 'Juhu', lat: 19.1075, lng: 72.8263 },
  { name: 'Colaba', lat: 18.9067, lng: 72.8147 },
  { name: 'Fort', lat: 18.9322, lng: 72.8335 },
  { name: 'Ghatkopar', lat: 19.0860, lng: 72.9090 },
  { name: 'Kurla', lat: 19.0726, lng: 72.8845 },
  { name: 'Chembur', lat: 19.0522, lng: 72.8997 },
];

const BLOOD_GROUPS = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'];

const FIRST_NAMES = [
  'Aarav', 'Rohan', 'Sneha', 'Vikram', 'Anjali', 'Kavita', 'Aditya', 'Pooja',
  'Rahul', 'Tanvi', 'Karan', 'Neha', 'Siddharth', 'Meera', 'Arjun', 'Isha',
  'Nikhil', 'Divya', 'Gaurav', 'Rhea', 'Amit', 'Shreya', 'Pranav', 'Payal',
  'Varun', 'Kriti', 'Manish', 'Simran', 'Akash', 'Swati', 'Harsh', 'Preeti',
  'Deepak', 'Aarti', 'Kunal', 'Rupal', 'Sameer', 'Monika', 'Sachin', 'Namrata',
  'Yash', 'Bhavna', 'Chetan', 'Jyoti', 'Tarun', 'Anushka', 'Vivek', 'Pallavi',
  'Hemant', 'Sunita'
];

const LAST_NAMES = [
  'Patil', 'Kulkarni', 'Deshmukh', 'Jadhav', 'Shinde', 'Pawar', 'More', 'Chavan',
  'Sawant', 'Gaikwad', 'Shah', 'Mehta', 'Parikh', 'Doshi', 'Kapoor', 'Sharma',
  'Verma', 'Gupta', 'Iyer', 'Nair', 'Shetty', 'Kamath', 'Fernandes', 'D\'Souza'
];

export function generateSeedDonors(): { users: UserRecord[]; donors: DonorRecord[] } {
  const users: UserRecord[] = [];
  const donors: DonorRecord[] = [];

  for (let i = 0; i < 50; i++) {
    const fn = FIRST_NAMES[i % FIRST_NAMES.length];
    const ln = LAST_NAMES[i % LAST_NAMES.length];
    const fullName = `${fn} ${ln}`;
    const userId = `user-donor-${i + 1}`;
    const donorId = `donor-${i + 1}`;
    const loc = MUMBAI_LOCALITIES[i % MUMBAI_LOCALITIES.length];
    const bloodGroup = BLOOD_GROUPS[i % BLOOD_GROUPS.length];

    // Jitter coordinates slightly (+/- 0.008 deg = ~800m)
    const lat = Number((loc.lat + (Math.sin(i * 1.5) * 0.008)).toFixed(5));
    const lng = Number((loc.lng + (Math.cos(i * 1.5) * 0.008)).toFixed(5));

    // Calculate last donation date: some recent (>90 days), some cooldown (<90 days)
    let lastDonationDate: string | null = null;
    if (i % 5 === 0) {
      lastDonationDate = null; // First-time donor
    } else if (i % 4 === 0) {
      // Recent donation 20 days ago (active cooldown)
      lastDonationDate = new Date(Date.now() - 20 * 86400000).toISOString().split('T')[0];
    } else {
      // Eligible donor (donated 120-180 days ago)
      const daysAgo = 100 + (i * 3);
      lastDonationDate = new Date(Date.now() - daysAgo * 86400000).toISOString().split('T')[0];
    }

    const email = `${fn.toLowerCase()}.${ln.toLowerCase()}${i + 1}@example.com`;
    const phone = `+91 98202 ${String(10000 + i).padStart(5, '0')}`;

    users.push({
      id: userId,
      email,
      password_hash: DEFAULT_PASSWORD_HASH,
      role: 'donor',
      full_name: fullName,
      phone,
      phone_verified: true,
      is_active: true,
      created_at: '2026-01-20T08:00:00Z',
      updated_at: '2026-01-20T08:00:00Z',
    });

    donors.push({
      id: donorId,
      user_id: userId,
      blood_group: bloodGroup,
      city: 'Mumbai',
      state: 'Maharashtra',
      lat,
      lng,
      approx_area: loc.name,
      last_donation_date: lastDonationDate,
      is_available: i % 10 !== 0, // 90% available
      consent_given_at: '2026-01-20T08:00:00Z',
      medical_notes_self_reported: 'Healthy, no chronic medication, normal BP self-reported.',
      created_at: '2026-01-20T08:00:00Z',
      updated_at: '2026-01-20T08:00:00Z',
      full_name: fullName,
      phone,
    });
  }

  return { users, donors };
}

// 5 Sample Blood Requests across states
export const SEED_BLOOD_REQUESTS: BloodRequestRecord[] = [
  {
    id: 'req-001',
    requester_id: 'user-req-1',
    patient_name: 'Suresh Deshmukh',
    hospital_id: 'hosp-101',
    doctor_id: 'doc-1',
    blood_group: 'O-',
    component: 'whole_blood',
    units_needed: 2,
    urgency: 'critical_immediate',
    required_by: new Date(Date.now() + 4 * 3600000).toISOString(),
    status: 'verified',
    doctor_notes: 'Urgent bypass surgery scheduled. Crossmatch pre-arranged. Verified by Dr. Ananya Sharma.',
    rejection_reason: null,
    lat: 19.0519,
    lng: 72.8295,
    created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
    verified_at: new Date(Date.now() - 1.5 * 3600000).toISOString(),
    fulfilled_at: null,
    hospital_name: 'Lilavati Hospital & Research Centre',
    requester_name: 'Priya Deshmukh',
    requester_phone: '+91 98201 55667',
  },
  {
    id: 'req-002',
    requester_id: 'user-req-1',
    patient_name: 'Asha Mhatre',
    hospital_id: 'hosp-102',
    doctor_id: null,
    blood_group: 'AB-',
    component: 'platelets',
    units_needed: 1,
    urgency: 'urgent_within_24h',
    required_by: new Date(Date.now() + 18 * 3600000).toISOString(),
    status: 'pending',
    doctor_notes: null,
    rejection_reason: null,
    lat: 19.0044,
    lng: 72.8427,
    created_at: new Date(Date.now() - 45 * 60000).toISOString(),
    verified_at: null,
    fulfilled_at: null,
    hospital_name: 'Tata Memorial Hospital',
    requester_name: 'Priya Deshmukh',
    requester_phone: '+91 98201 55667',
  },
  {
    id: 'req-003',
    requester_id: 'user-req-1',
    patient_name: 'Rajesh Solanki',
    hospital_id: 'hosp-103',
    doctor_id: 'doc-2',
    blood_group: 'B+',
    component: 'whole_blood',
    units_needed: 3,
    urgency: 'critical_immediate',
    required_by: new Date(Date.now() + 6 * 3600000).toISOString(),
    status: 'verified',
    doctor_notes: 'Severe trauma admission. Verified by Dr. Rajesh Mehta.',
    rejection_reason: null,
    lat: 19.0028,
    lng: 72.8415,
    created_at: new Date(Date.now() - 5 * 3600000).toISOString(),
    verified_at: new Date(Date.now() - 4 * 3600000).toISOString(),
    fulfilled_at: null,
    hospital_name: 'King Edward Memorial (KEM) Hospital',
    requester_name: 'Priya Deshmukh',
    requester_phone: '+91 98201 55667',
  },
  {
    id: 'req-004',
    requester_id: 'user-req-1',
    patient_name: 'Meena Kamat',
    hospital_id: 'hosp-101',
    doctor_id: 'doc-1',
    blood_group: 'A+',
    component: 'plasma',
    units_needed: 2,
    urgency: 'planned',
    required_by: new Date(Date.now() + 48 * 3600000).toISOString(),
    status: 'fulfilled',
    doctor_notes: 'Plasmapheresis completed successfully.',
    rejection_reason: null,
    lat: 19.0519,
    lng: 72.8295,
    created_at: new Date(Date.now() - 72 * 3600000).toISOString(),
    verified_at: new Date(Date.now() - 70 * 3600000).toISOString(),
    fulfilled_at: new Date(Date.now() - 24 * 3600000).toISOString(),
    hospital_name: 'Lilavati Hospital & Research Centre',
    requester_name: 'Priya Deshmukh',
    requester_phone: '+91 98201 55667',
  },
  {
    id: 'req-005',
    requester_id: 'user-req-1',
    patient_name: 'Farhan Sayed',
    hospital_id: 'hosp-102',
    doctor_id: 'doc-2',
    blood_group: 'O+',
    component: 'whole_blood',
    units_needed: 1,
    urgency: 'urgent_within_24h',
    required_by: new Date(Date.now() - 10 * 3600000).toISOString(),
    status: 'expired',
    doctor_notes: 'Hospital central stock replenishment received before match.',
    rejection_reason: null,
    lat: 19.0044,
    lng: 72.8427,
    created_at: new Date(Date.now() - 96 * 3600000).toISOString(),
    verified_at: new Date(Date.now() - 94 * 3600000).toISOString(),
    fulfilled_at: null,
    hospital_name: 'Tata Memorial Hospital',
    requester_name: 'Priya Deshmukh',
    requester_phone: '+91 98201 55667',
  },
];
