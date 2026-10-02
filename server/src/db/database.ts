import pg from 'pg';
import { config } from '../config/env.js';
import {
  SEED_HOSPITALS,
  SEED_USERS,
  SEED_DOCTORS,
  SEED_BLOOD_REQUESTS,
  generateSeedDonors,
  UserRecord,
  HospitalRecord,
  DoctorRecord,
  DonorRecord,
  BloodRequestRecord,
  RequestMatchRecord,
  DonationRecord,
  OrganPledgeRecord,
  CoordinatorLogRecord,
  HospitalPolicyRecord
} from '../seeds/seedData.js';

const { Pool } = pg;

// In-Memory Database store for instant offline running & fallback
class InMemoryDB {
  users: Map<string, UserRecord> = new Map();
  hospitals: Map<string, HospitalRecord> = new Map();
  doctors: Map<string, DoctorRecord> = new Map();
  donors: Map<string, DonorRecord> = new Map();
  bloodRequests: Map<string, BloodRequestRecord> = new Map();
  requestMatches: Map<string, RequestMatchRecord> = new Map();
  donations: Map<string, DonationRecord> = new Map();
  organPledges: Map<string, OrganPledgeRecord> = new Map();
  coordinatorLogs: Map<string, CoordinatorLogRecord> = new Map();
  notifications: Map<string, any> = new Map();
  auditLogs: Map<string, any> = new Map();
  hospitalPolicies: Map<string, HospitalPolicyRecord> = new Map();

  constructor() {
    this.resetWithSeedData();
  }

  resetWithSeedData() {
    this.users.clear();
    this.hospitals.clear();
    this.doctors.clear();
    this.donors.clear();
    this.bloodRequests.clear();
    this.requestMatches.clear();
    this.donations.clear();
    this.organPledges.clear();
    this.coordinatorLogs.clear();
    this.notifications.clear();
    this.auditLogs.clear();
    this.hospitalPolicies.clear();

    // Load hospitals
    SEED_HOSPITALS.forEach(h => {
      this.hospitals.set(h.id, { ...h });
      this.hospitalPolicies.set(h.id, {
        id: `pol-${h.id}`,
        hospital_id: h.id,
        whole_blood_gap_days: 90,
        plasma_gap_days: 14,
        platelets_gap_days: 7,
        escalation_timeout_mins: 30,
        escalation_radius_km: 25.0
      });
    });

    // Load users
    SEED_USERS.forEach(u => this.users.set(u.id, { ...u }));

    // Load doctors
    SEED_DOCTORS.forEach(d => this.doctors.set(d.id, { ...d }));

    // Load donors
    const { users: donorUsers, donors: donorList } = generateSeedDonors();
    donorUsers.forEach(u => this.users.set(u.id, { ...u }));
    donorList.forEach(d => this.donors.set(d.id, { ...d }));

    // Load requests
    SEED_BLOOD_REQUESTS.forEach(r => this.bloodRequests.set(r.id, { ...r }));

    // Seed sample organ pledge
    this.organPledges.set('pledge-001', {
      id: 'pledge-001',
      user_id: 'user-donor-1',
      full_name: 'Aarav Patil',
      date_of_birth: '1995-04-12',
      blood_group: 'O+',
      organs_pledged: ['Corneas', 'Kidneys', 'Liver', 'Heart'],
      kin_name: 'Sunita Patil',
      kin_phone: '+91 98200 88990',
      kin_relation: 'Mother',
      kin_notified: true,
      consent_timestamp: '2026-01-22T14:30:00Z',
      official_registry_redirect_clicked: true,
      created_at: '2026-01-22T14:30:00Z'
    });

    // Seed sample coordinator log
    this.coordinatorLogs.set('clog-001', {
      id: 'clog-001',
      hospital_id: 'hosp-101',
      coordinator_user_id: 'user-doc-1',
      patient_identifier: 'PAT-ICU-8821',
      conversation_date: '2026-01-25T11:00:00Z',
      family_members_present: 'Spouse and Brother',
      outcome_notes: 'Counseled regarding brain-stem death reflex tests. Family was receptive to pledge awareness; provided NOTTO information brochure.',
      notto_notified: false,
      created_at: '2026-01-25T11:00:00Z',
      hospital_name: 'Lilavati Hospital & Research Centre',
      coordinator_name: 'Dr. Ananya Sharma, MD'
    });

    // Seed pre-matched donor for req-001 to demonstrate instant demo acceptance
    this.requestMatches.set('match-001', {
      id: 'match-001',
      request_id: 'req-001',
      donor_id: 'donor-1',
      distance_km: 1.2,
      status: 'notified',
      notified_at: new Date(Date.now() - 30 * 60000).toISOString(),
      responded_at: null,
      donor_name: 'Aarav Patil',
      donor_phone: '+91 98202 10000',
      approx_area: 'Bandra West',
      blood_group: 'O-'
    });

    // Seed sample completed donation for req-004
    this.donations.set('don-001', {
      id: 'don-001',
      request_id: 'req-004',
      donor_id: 'donor-5',
      doctor_id: 'doc-1',
      hospital_id: 'hosp-101',
      blood_group: 'A+',
      component: 'plasma',
      units_donated: 2,
      donation_date: new Date(Date.now() - 24 * 3600000).toISOString().split('T')[0],
      verified_by_doctor_at: new Date(Date.now() - 24 * 3600000).toISOString(),
      notes: 'Donor tolerated plasmapheresis well. Vital parameters stable pre and post.',
      created_at: new Date(Date.now() - 24 * 3600000).toISOString(),
      donor_name: 'Anjali Pawar',
      doctor_name: 'Dr. Ananya Sharma, MD',
      hospital_name: 'Lilavati Hospital & Research Centre'
    });
  }
}

export const inMemoryDB = new InMemoryDB();

// PostgreSQL connection pool (for NeonDB)
let pool: pg.Pool | null = null;
let usePg = false;

if (config.databaseUrl) {
  try {
    pool = new Pool({
      connectionString: config.databaseUrl,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000
    });
    // Test connection
    pool.query('SELECT NOW()')
      .then(() => {
        console.log('✅ Connected to PostgreSQL / NeonDB successfully.');
        usePg = true;
      })
      .catch((err) => {
        console.warn('⚠️ PostgreSQL connection failed, switching seamlessly to local memory DB engine:', err.message);
        usePg = false;
      });
  } catch (err: any) {
    console.warn('⚠️ Could not initialize pg pool, using local memory engine:', err.message);
    usePg = false;
  }
} else {
  console.log('ℹ️ No DATABASE_URL provided. Running with high-speed built-in local database engine.');
}

export const db = {
  isPg: () => usePg,
  getPool: () => pool,
  store: inMemoryDB,
};
