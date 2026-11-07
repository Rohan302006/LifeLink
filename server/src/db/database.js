import pg from 'pg';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { config } from '../config/env.js';
import { DEFAULT_HOSPITALS, DEMO_DONORS, DEMO_RECEIVERS, ADDITIONAL_DOCTORS } from '../seeds/seedData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const { Pool } = pg;

let pool = null;
let usePg = false;

// In-Memory Database store for local development/testing without live Neon credentials
class MemoryDB {
  constructor() {
    this.users = new Map();
    this.doctorProfiles = new Map();
    this.donorProfiles = new Map();
    this.documents = new Map();
    this.bloodRequests = new Map();
    this.requestMatches = new Map();
    this.hospitals = new Map();

    // Auto-populate default accounts synchronously so login works instantly out-of-the-box
    this.initDefaultRecords();
  }

  reset() {
    this.users.clear();
    this.doctorProfiles.clear();
    this.donorProfiles.clear();
    this.documents.clear();
    this.bloodRequests.clear();
    this.requestMatches.clear();
    this.hospitals.clear();
    this.initDefaultRecords();
  }

  initDefaultRecords() {
    const timestamp = new Date().toISOString();
    const defaultPassword = process.env.DEMO_PASSWORD || 'Password123!';
    const passwordHash = bcrypt.hashSync(defaultPassword, 10);

    // 1. Admin (admin@lifelink.org / Password123!)
    const adminId = 'user-admin-001';
    this.users.set(adminId, {
      id: adminId,
      email: 'admin@lifelink.org',
      password_hash: passwordHash,
      role: 'admin',
      full_name: 'System Administrator',
      phone: '+91 99000 00001',
      age: 40,
      gender: 'Other',
      blood_group: 'O+',
      city: 'Mumbai',
      status: 'verified',
      onboarding_completed: true,
      created_at: timestamp,
      updated_at: timestamp,
    });

    // 2. Doctor (doctor@hospital.org / Password123!)
    const docUserId = 'user-doc-001';
    const docProfileId = 'profile-doc-001';
    this.users.set(docUserId, {
      id: docUserId,
      email: 'doctor@hospital.org',
      password_hash: passwordHash,
      role: 'doctor',
      full_name: 'Dr. Rajesh Sharma, MD',
      phone: '+91 99000 00002',
      age: 45,
      gender: 'Male',
      blood_group: 'B+',
      city: 'Mumbai',
      status: 'verified',
      onboarding_completed: true,
      created_at: timestamp,
      updated_at: timestamp,
    });
    this.doctorProfiles.set(docProfileId, {
      id: docProfileId,
      user_id: docUserId,
      medical_license_number: 'MCI-2024-88419',
      hospital_name: 'Lilavati Hospital & Research Centre',
      hospital_city: 'Mumbai',
      approval_status: 'verified',
      rejection_reason: null,
      reviewed_at: timestamp,
      created_at: timestamp,
    });

    // 3. Donor (donor@example.com / Password123!)
    const donorUserId = 'user-donor-001';
    const donorProfileId = 'profile-donor-001';
    this.users.set(donorUserId, {
      id: donorUserId,
      email: 'donor@example.com',
      password_hash: passwordHash,
      role: 'donor',
      full_name: 'Aarav Patil',
      phone: '+91 99000 00003',
      age: 28,
      gender: 'Male',
      blood_group: 'O-',
      city: 'Mumbai',
      status: 'verified',
      onboarding_completed: true,
      created_at: timestamp,
      updated_at: timestamp,
    });
    const verifiedDate = new Date(Date.now() - 100 * 24 * 3600000).toISOString().split('T')[0];
    this.donorProfiles.set(donorProfileId, {
      id: donorProfileId,
      user_id: donorUserId,
      last_donation_date: verifiedDate,
      last_donation_date_status: 'verified',
      last_donation_rejection_reason: null,
      is_available: true,
      is_verified: true,
      created_at: timestamp,
      updated_at: timestamp,
    });
    const donorDocId = 'doc-donor-001';
    this.documents.set(donorDocId, {
      id: donorDocId,
      user_id: donorUserId,
      doc_type: 'id_proof',
      file_name: 'sample-id-proof.jpg',
      original_name: 'National_ID_Card.jpg',
      mime_type: 'image/jpeg',
      file_size: 35911,
      storage_path: 'sample-id-proof.jpg',
      status: 'verified',
      rejection_reason: null,
      reviewed_by: docUserId,
      reviewed_at: timestamp,
      created_at: timestamp,
    });

    // 4. Receiver (receiver@example.com / Password123!)
    const receiverUserId = 'user-rec-001';
    this.users.set(receiverUserId, {
      id: receiverUserId,
      email: 'receiver@example.com',
      password_hash: passwordHash,
      role: 'receiver',
      full_name: 'Priya Deshmukh',
      phone: '+91 99000 00004',
      age: 32,
      gender: 'Female',
      blood_group: 'O-',
      city: 'Mumbai',
      status: 'verified',
      onboarding_completed: true,
      created_at: timestamp,
      updated_at: timestamp,
    });
    const recDocId = 'doc-rec-001';
    this.documents.set(recDocId, {
      id: recDocId,
      user_id: receiverUserId,
      doc_type: 'medical_requisition',
      file_name: 'sample-prescription.jpg',
      original_name: 'Doctor_Blood_Requisition.jpg',
      mime_type: 'image/jpeg',
      file_size: 35911,
      storage_path: 'sample-prescription.jpg',
      status: 'verified',
      rejection_reason: null,
      reviewed_by: docUserId,
      reviewed_at: timestamp,
      created_at: timestamp,
    });
    const reqId = 'req-seed-001';
    this.bloodRequests.set(reqId, {
      id: reqId,
      requester_id: receiverUserId,
      patient_name: 'Sunita Deshmukh',
      blood_group: 'O-',
      units_needed: 2,
      hospital_name: 'Lilavati Hospital',
      city: 'Mumbai',
      urgency: 'critical',
      status: 'verified',
      rejection_reason: null,
      doctor_notes: 'Approved for urgent transfusion.',
      verified_by: docUserId,
      verified_at: timestamp,
      fulfilled_at: null,
      created_at: timestamp,
    });
    const matchId = 'match-seed-001';
    this.requestMatches.set(matchId, {
      id: matchId,
      request_id: reqId,
      donor_id: donorUserId,
      status: 'notified',
      notified_at: timestamp,
      responded_at: null,
    });

    // 5. Popular Maharashtra Hospitals
    for (const h of DEFAULT_HOSPITALS) {
      this.hospitals.set(h.id, {
        ...h,
        created_at: timestamp,
      });
    }

    // 6. Additional Authentic Indian Donors
    for (const d of DEMO_DONORS) {
      this.users.set(d.id, {
        id: d.id,
        email: d.email,
        password_hash: passwordHash,
        role: 'donor',
        full_name: d.name,
        phone: d.phone,
        age: d.age,
        gender: d.gender,
        blood_group: d.blood_group,
        city: d.city,
        status: d.status,
        onboarding_completed: true,
        created_at: timestamp,
        updated_at: timestamp,
      });

      const lastDate = d.daysAgo !== null
        ? new Date(Date.now() - d.daysAgo * 24 * 3600000).toISOString().split('T')[0]
        : null;

      this.donorProfiles.set(d.profileId, {
        id: d.profileId,
        user_id: d.id,
        last_donation_date: lastDate,
        last_donation_date_status: d.donationStatus,
        last_donation_rejection_reason: null,
        is_available: d.available,
        is_verified: d.status === 'verified',
        created_at: timestamp,
        updated_at: timestamp,
      });

      // Sample verified ID proof document for profile viewer
      const docId = `doc-${d.id}`;
      this.documents.set(docId, {
        id: docId,
        user_id: d.id,
        doc_type: 'id_proof',
        file_name: 'sample-id-proof.jpg',
        original_name: `${d.name.replace(/\s+/g, '_')}_Aadhaar_ID.jpg`,
        mime_type: 'image/jpeg',
        file_size: 35911,
        storage_path: 'sample-id-proof.jpg',
        status: d.status === 'verified' ? 'verified' : 'pending',
        rejection_reason: null,
        reviewed_by: docUserId,
        reviewed_at: timestamp,
        created_at: timestamp,
      });
    }

    // 7. Additional Authentic Indian Receivers with Emergency Requests
    for (const r of DEMO_RECEIVERS) {
      this.users.set(r.id, {
        id: r.id,
        email: r.email,
        password_hash: passwordHash,
        role: 'receiver',
        full_name: r.name,
        phone: r.phone,
        age: r.age,
        gender: r.gender,
        blood_group: r.blood_group,
        city: r.city,
        status: r.status,
        onboarding_completed: true,
        created_at: timestamp,
        updated_at: timestamp,
      });

      // Document for receiver
      const docId = `doc-${r.id}`;
      this.documents.set(docId, {
        id: docId,
        user_id: r.id,
        doc_type: 'medical_requisition',
        file_name: 'sample-prescription.jpg',
        original_name: `${r.name.replace(/\s+/g, '_')}_Doctor_Requisition.jpg`,
        mime_type: 'image/jpeg',
        file_size: 35911,
        storage_path: 'sample-prescription.jpg',
        status: r.status === 'verified' ? 'verified' : 'pending',
        rejection_reason: null,
        reviewed_by: docUserId,
        reviewed_at: timestamp,
        created_at: timestamp,
      });

      // Emergency Blood Request
      if (r.request) {
        this.bloodRequests.set(r.request.id, {
          id: r.request.id,
          requester_id: r.id,
          patient_name: r.request.patient,
          blood_group: r.request.blood_group,
          units_needed: r.request.units,
          hospital_name: r.request.hospital,
          city: r.request.city,
          urgency: r.request.urgency,
          status: r.request.status,
          rejection_reason: null,
          doctor_notes: r.request.doctor_notes,
          verified_by: r.request.status === 'verified' ? docUserId : null,
          verified_at: r.request.status === 'verified' ? timestamp : null,
          fulfilled_at: r.request.status === 'fulfilled' ? timestamp : null,
          created_at: timestamp,
        });
      }
    }

    // 8. 4 Additional Verified Doctors
    for (const doc of ADDITIONAL_DOCTORS) {
      this.users.set(doc.id, {
        id: doc.id,
        email: doc.email,
        password_hash: passwordHash,
        role: 'doctor',
        full_name: doc.name,
        phone: doc.phone,
        age: doc.age,
        gender: doc.gender,
        blood_group: doc.blood_group,
        city: doc.city,
        status: 'verified',
        onboarding_completed: true,
        created_at: timestamp,
        updated_at: timestamp,
      });

      this.doctorProfiles.set(doc.profileId, {
        id: doc.profileId,
        user_id: doc.id,
        medical_license_number: doc.license,
        hospital_name: doc.hospital,
        hospital_city: doc.hospital_city,
        approval_status: 'verified',
        rejection_reason: null,
        reviewed_at: timestamp,
        created_at: timestamp,
      });
    }
  }
}

export const memoryStore = new MemoryDB();

// Helper to ensure in-memory queries always return cloned records
// This prevents external code (like `delete user.password_hash`) from mutating stored memory
function formatResult(rows) {
  const cloned = (rows || []).map(r => (r && typeof r === 'object' ? { ...r } : r));
  return { rows: cloned, rowCount: cloned.length };
}

// Initialize PostgreSQL connection pool
export async function initDatabase() {
  if (config.databaseUrl) {
    try {
      if (!pool) {
        pool = new Pool({
          connectionString: config.databaseUrl,
          ssl: { rejectUnauthorized: false },
          connectionTimeoutMillis: 10000,
        });
      }

      await pool.query('SELECT NOW()');
      console.log('✅ Connected to PostgreSQL / NeonDB successfully.');
      usePg = true;
      try {
        const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
        await pool.query(schemaSql);
        console.log('✅ Database schema verified / created on NeonDB.');
      } catch (schemaErr) {
        console.warn('Database schema init warning:', schemaErr.message);
      }
    } catch (err) {
      console.warn('⚠️ NeonDB connection failed, falling back to local memory engine:', err.message);
      usePg = false;
    }
  } else {
    console.log('ℹ️ No DATABASE_URL provided. Running with memory database engine.');
    usePg = false;
  }
}

// Auto-run initDatabase immediately on load
initDatabase().catch(err => console.warn('Database pool init notice:', err.message));

/**
 * Universal query runner: executes against PostgreSQL pool or fallback in-memory store
 */
export async function query(sql, params = []) {
  if (usePg && pool) {
    return pool.query(sql, params);
  }

  // In-Memory query handler for standard operations
  const trimmed = sql.trim();
  const lower = trimmed.toLowerCase();

  // 1. SELECT queries
  if (lower.startsWith('select')) {
    // SELECT * FROM users WHERE email = $1
    if (lower.includes('from users') && lower.includes('email = $1')) {
      const email = (params[0] || '').toLowerCase().trim();
      const rows = Array.from(memoryStore.users.values()).filter(u => u.email.toLowerCase().trim() === email);
      return formatResult(rows);
    }

    // SELECT * FROM users WHERE id = $1
    if (lower.includes('from users') && lower.includes('id = $1')) {
      const id = params[0];
      const user = memoryStore.users.get(id);
      if (!user) return formatResult([]);
      if (lower.includes('role = $2') && user.role !== params[1]) return formatResult([]);
      return formatResult([user]);
    }

    // SELECT * FROM users WHERE role = $1
    if (lower.includes('from users') && (lower.includes('role = $1') || lower.includes("role = 'receiver'"))) {
      const roleParam = lower.includes("role = 'receiver'") ? 'receiver' : params[0];
      const rows = Array.from(memoryStore.users.values()).filter(u => u.role === roleParam);
      return formatResult(rows);
    }

    // SELECT * FROM doctor_profiles WHERE id = $1
    if (lower.includes('from doctor_profiles') && lower.includes('id = $1')) {
      const id = params[0];
      const dp = memoryStore.doctorProfiles.get(id) || Array.from(memoryStore.doctorProfiles.values()).find(d => d.id === id || d.user_id === id);
      return formatResult(dp ? [dp] : []);
    }

    // SELECT * FROM doctor_profiles WHERE medical_license_number = $1
    if (lower.includes('from doctor_profiles') && lower.includes('medical_license_number = $1')) {
      const license = params[0];
      const rows = Array.from(memoryStore.doctorProfiles.values()).filter(d => d.medical_license_number === license);
      return formatResult(rows);
    }

    // SELECT * FROM doctor_profiles WHERE user_id = $1
    if (lower.includes('from doctor_profiles') && lower.includes('user_id = $1')) {
      const userId = params[0];
      const rows = Array.from(memoryStore.doctorProfiles.values()).filter(d => d.user_id === userId);
      return formatResult(rows);
    }

    // SELECT * / hospital_name FROM doctor_profiles (without WHERE clause)
    if (lower.includes('from doctor_profiles') && !lower.includes('where') && !lower.includes('join')) {
      return formatResult(Array.from(memoryStore.doctorProfiles.values()));
    }

    // All doctor profiles with user details for admin
    if (
      (lower.includes('from doctor_profiles dp') && lower.includes('join users u')) ||
      (lower.includes('from users u') && lower.includes('doctor_profiles dp'))
    ) {
      let doctorUsers = Array.from(memoryStore.users.values()).filter(u => u.role === 'doctor');
      if (params.length > 0 && lower.includes('approval_status')) {
        const targetStatus = (params[0] || '').toLowerCase().trim();
        doctorUsers = doctorUsers.filter(u => {
          const dp = Array.from(memoryStore.doctorProfiles.values()).find(d => d.user_id === u.id);
          const st = (dp?.approval_status || u.status || 'pending').toLowerCase();
          return st === targetStatus;
        });
      }
      const rows = doctorUsers.map(u => {
        const dp = Array.from(memoryStore.doctorProfiles.values()).find(d => d.user_id === u.id) || {};
        return {
          id: dp.id || u.id,
          user_id: u.id,
          medical_license_number: dp.medical_license_number || 'Under Review',
          hospital_name: dp.hospital_name || 'Affiliated Hospital',
          hospital_city: dp.hospital_city || u.city || '',
          approval_status: dp.approval_status || u.status || 'pending',
          rejection_reason: dp.rejection_reason || null,
          reviewed_at: dp.reviewed_at || null,
          full_name: u.full_name,
          email: u.email,
          phone: u.phone,
          age: u.age || null,
          gender: u.gender || null,
          blood_group: u.blood_group || null,
          city: u.city,
          user_status: u.status,
          registered_at: u.created_at,
        };
      });
      return formatResult(rows);
    }

    // Donor profiles for user
    if (lower.includes('from donor_profiles') && lower.includes('user_id = $1')) {
      const userId = params[0];
      const rows = Array.from(memoryStore.donorProfiles.values()).filter(d => d.user_id === userId);
      return formatResult(rows);
    }

    // All regular users (donor/receiver) for admin User Section
    if (
      lower.includes('from users u') &&
      (lower.includes("role in ('donor', 'receiver')") ||
        lower.includes("role in ('donor','receiver')") ||
        lower.includes("u.role != 'admin'"))
    ) {
      let regUsers = Array.from(memoryStore.users.values()).filter(u => u.role === 'donor' || u.role === 'receiver');
      if (params.length > 0) {
        if (lower.includes('u.role = $')) {
          const targetRole = params[0];
          regUsers = regUsers.filter(u => u.role === targetRole);
        }
        if (lower.includes('lower(u.status) = $')) {
          const targetStatus = params[params.length - 1];
          regUsers = regUsers.filter(u => (u.status || '').toLowerCase() === targetStatus.toLowerCase());
        }
      }
      const rows = regUsers.map(u => {
        const dp = Array.from(memoryStore.donorProfiles.values()).find(d => d.user_id === u.id) || {};
        const reqCount = Array.from(memoryStore.bloodRequests.values()).filter(r => r.requester_id === u.id).length;
        return {
          id: u.id,
          user_id: u.id,
          full_name: u.full_name,
          email: u.email,
          phone: u.phone,
          role: u.role,
          status: u.status,
          age: u.age,
          gender: u.gender,
          blood_group: u.blood_group,
          city: u.city,
          onboarding_completed: u.onboarding_completed,
          created_at: u.created_at,
          registered_at: u.created_at,
          is_available: dp.is_available !== undefined ? dp.is_available : null,
          is_verified: dp.is_verified !== undefined ? dp.is_verified : null,
          last_donation_date: dp.last_donation_date || null,
          last_donation_date_status: dp.last_donation_date_status || null,
          requests_count: reqCount,
        };
      });
      return formatResult(rows);
    }

    // SELECT ... FROM users u JOIN donor_profiles dp ON u.id = dp.user_id (Workflow matching only)
    if (lower.includes('from users u') && lower.includes('join donor_profiles dp') && !lower.includes('u.role in') && !lower.includes('u.full_name')) {
      const rows = [];
      for (const u of memoryStore.users.values()) {
        const dp = Array.from(memoryStore.donorProfiles.values()).find(d => d.user_id === u.id);
        if (dp) {
          rows.push({
            id: u.id,
            blood_group: u.blood_group,
            is_available: dp.is_available,
            is_verified: dp.is_verified,
            last_donation_date: dp.last_donation_date,
            last_donation_date_status: dp.last_donation_date_status,
          });
        }
      }
      return formatResult(rows);
    }

    // All donors for doctor: SELECT dp.*, u.full_name... FROM donor_profiles dp JOIN users u
    if (lower.includes('from donor_profiles dp') && lower.includes('join users u')) {
      const rows = Array.from(memoryStore.donorProfiles.values()).map(dp => {
        const u = memoryStore.users.get(dp.user_id) || {};
        return {
          ...dp,
          full_name: u.full_name,
          email: u.email,
          phone: u.phone,
          age: u.age,
          gender: u.gender,
          blood_group: u.blood_group,
          city: u.city,
          user_status: u.status,
        };
      });
      return formatResult(rows);
    }

    // Documents for a user
    if (lower.includes('from documents') && lower.includes('user_id = $1')) {
      const userId = params[0];
      const rows = Array.from(memoryStore.documents.values()).filter(d => d.user_id === userId);
      return formatResult(rows);
    }

    // Document by id
    if (lower.includes('from documents') && lower.includes('id = $1')) {
      const doc = memoryStore.documents.get(params[0]);
      return formatResult(doc ? [doc] : []);
    }

    // Blood requests
    if (lower.includes('from blood_requests')) {
      if (lower.includes('requester_id = $1')) {
        const rows = Array.from(memoryStore.bloodRequests.values()).filter(r => r.requester_id === params[0]);
        return formatResult(rows);
      }
      if (lower.includes('id = $1')) {
        const req = memoryStore.bloodRequests.get(params[0]);
        return formatResult(req ? [req] : []);
      }
      const rows = Array.from(memoryStore.bloodRequests.values()).map(r => {
        const u = memoryStore.users.get(r.requester_id) || {};
        return {
          ...r,
          requester_name: u.full_name,
          requester_phone: u.phone,
          requester_email: u.email,
        };
      });
      return formatResult(rows);
    }

    // Matches
    if (lower.includes('from request_matches')) {
      if (lower.includes('donor_id = $1')) {
        const rows = Array.from(memoryStore.requestMatches.values()).filter(m => m.donor_id === params[0]);
        return formatResult(rows);
      }
      if (lower.includes('request_id = $1')) {
        const rows = Array.from(memoryStore.requestMatches.values()).filter(m => m.request_id === params[0]);
        return formatResult(rows);
      }
      if (lower.includes('id = $1')) {
        const m = memoryStore.requestMatches.get(params[0]);
        return formatResult(m ? [m] : []);
      }
    }

    // Hospitals
    if (lower.includes('from hospitals')) {
      if (lower.includes('lower(name) = $1') || lower.includes('name = $1')) {
        const nameParam = (params[0] || '').toLowerCase().trim();
        const rows = Array.from(memoryStore.hospitals.values()).filter(h => h.name.toLowerCase().trim() === nameParam);
        return formatResult(rows);
      }
      if (lower.includes('id = $1')) {
        const h = memoryStore.hospitals.get(params[0]);
        return formatResult(h ? [h] : []);
      }
      const rows = Array.from(memoryStore.hospitals.values()).sort((a, b) => a.name.localeCompare(b.name));
      return formatResult(rows);
    }
  }

  // 2. INSERT queries
  if (lower.startsWith('insert into users')) {
    const id = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    const newUser = {
      id,
      email: (params[0] || '').toLowerCase().trim(),
      password_hash: params[1],
      role: params[2],
      full_name: params[3],
      phone: params[4],
      age: params[5],
      gender: params[6],
      blood_group: params[7],
      city: params[8],
      status: params[9] || 'pending',
      onboarding_completed: params[10] || false,
      created_at: timestamp,
      updated_at: timestamp,
    };
    memoryStore.users.set(id, newUser);
    return formatResult([newUser]);
  }

  if (lower.startsWith('insert into doctor_profiles')) {
    const id = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    const newDoc = {
      id,
      user_id: params[0],
      medical_license_number: params[1],
      hospital_name: params[2],
      hospital_city: params[3],
      approval_status: params[4] || 'pending',
      rejection_reason: null,
      reviewed_at: null,
      created_at: timestamp,
    };
    memoryStore.doctorProfiles.set(id, newDoc);
    return formatResult([newDoc]);
  }

  if (lower.startsWith('insert into donor_profiles')) {
    const id = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    const newDonor = {
      id,
      user_id: params[0],
      last_donation_date: params[1] || null,
      last_donation_date_status: params[2] || 'pending',
      last_donation_rejection_reason: null,
      is_available: params[3] !== undefined ? params[3] : true,
      is_verified: params[4] !== undefined ? params[4] : false,
      created_at: timestamp,
      updated_at: timestamp,
    };
    memoryStore.donorProfiles.set(id, newDonor);
    return formatResult([newDonor]);
  }

  if (lower.startsWith('insert into documents')) {
    const id = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    const newDoc = {
      id,
      user_id: params[0],
      doc_type: params[1],
      file_name: params[2],
      original_name: params[3],
      mime_type: params[4],
      file_size: params[5],
      storage_path: params[6],
      status: params[7] || 'pending',
      rejection_reason: null,
      reviewed_by: null,
      reviewed_at: null,
      created_at: timestamp,
    };
    memoryStore.documents.set(id, newDoc);
    return formatResult([newDoc]);
  }

  if (lower.startsWith('insert into blood_requests')) {
    const id = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    const newReq = {
      id,
      requester_id: params[0],
      patient_name: params[1],
      blood_group: params[2],
      units_needed: params[3],
      hospital_name: params[4],
      city: params[5],
      urgency: params[6],
      status: params[7] || 'pending',
      rejection_reason: null,
      doctor_notes: null,
      verified_by: null,
      verified_at: null,
      fulfilled_at: null,
      created_at: timestamp,
    };
    memoryStore.bloodRequests.set(id, newReq);
    return formatResult([newReq]);
  }

  if (lower.startsWith('insert into request_matches')) {
    const id = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    const newMatch = {
      id,
      request_id: params[0],
      donor_id: params[1],
      status: params[2] || 'notified',
      notified_at: timestamp,
      responded_at: null,
    };
    memoryStore.requestMatches.set(id, newMatch);
    return formatResult([newMatch]);
  }

  if (lower.startsWith('insert into hospitals')) {
    const id = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    const newHosp = {
      id,
      name: params[0],
      city: params[1],
      state: params[2] || '',
      address: params[3] || '',
      contact_phone: params[4] || '',
      created_at: timestamp,
    };
    memoryStore.hospitals.set(id, newHosp);
    return formatResult([newHosp]);
  }

  // 3. UPDATE queries
  if (lower.startsWith('update users')) {
    const id = params[params.length - 1];
    const user = memoryStore.users.get(id);
    if (user) {
      if (lower.includes('onboarding_completed = true')) user.onboarding_completed = true;
      if (lower.includes('status =')) {
        const statusMatch = sql.match(/status\s*=\s*'([^']+)'/i) || sql.match(/status\s*=\s*\$1/i);
        if (statusMatch && statusMatch[1]) user.status = statusMatch[1];
        else user.status = params[0];
      }
      user.updated_at = new Date().toISOString();
      return formatResult([user]);
    }
  }

  if (lower.startsWith('update doctor_profiles')) {
    const id = params[params.length - 1];
    let profile = memoryStore.doctorProfiles.get(id);
    if (!profile) {
      profile = Array.from(memoryStore.doctorProfiles.values()).find(p => p.id === id || p.user_id === id);
    }
    if (profile) {
      if (lower.includes("approval_status = 'verified'") || params[0] === 'verified') {
        profile.approval_status = 'verified';
        profile.rejection_reason = null;
      } else if (lower.includes("approval_status = 'rejected'") || params[0] === 'rejected') {
        profile.approval_status = 'rejected';
        profile.rejection_reason = params[1] || 'Rejected by Administrator';
      } else {
        profile.approval_status = params[0];
        profile.rejection_reason = params[1] || null;
      }
      profile.reviewed_at = new Date().toISOString();
      return formatResult([profile]);
    }
  }

  if (lower.startsWith('update donor_profiles')) {
    const userId = params[params.length - 1];
    let profile = Array.from(memoryStore.donorProfiles.values()).find(p => p.user_id === userId || p.id === userId);
    if (profile) {
      if (lower.includes('is_available =')) {
        profile.is_available = params[0];
      } else if (lower.includes('last_donation_date_status =')) {
        profile.last_donation_date_status = params[0];
        profile.last_donation_rejection_reason = params[1] || null;
      } else if (lower.includes('last_donation_date =')) {
        profile.last_donation_date = params[0];
        profile.last_donation_date_status = 'pending';
        profile.last_donation_rejection_reason = null;
      }
      if (lower.includes('is_verified = true')) {
        profile.is_verified = true;
      }
      profile.updated_at = new Date().toISOString();
      return formatResult([profile]);
    }
  }

  if (lower.startsWith('update documents')) {
    if (lower.includes('set reviewed_by = null')) {
      const targetUserId = params[0];
      for (const doc of memoryStore.documents.values()) {
        if (doc.reviewed_by === targetUserId) {
          doc.reviewed_by = null;
        }
      }
      return formatResult([]);
    }
    const id = params[params.length - 1];
    const doc = memoryStore.documents.get(id);
    if (doc) {
      doc.status = params[0];
      if (lower.includes('rejection_reason = $2')) {
        doc.rejection_reason = params[1] || null;
        doc.reviewed_by = params[2] || null;
      } else if (lower.includes('rejection_reason =')) {
        const reasonMatch = sql.match(/rejection_reason\s*=\s*'([^']+)'/i);
        if (reasonMatch) doc.rejection_reason = reasonMatch[1];
      }
      doc.reviewed_at = new Date().toISOString();
      return formatResult([doc]);
    }
  }

  if (lower.startsWith('update blood_requests')) {
    if (lower.includes('set verified_by = null')) {
      const targetUserId = params[0];
      for (const req of memoryStore.bloodRequests.values()) {
        if (req.verified_by === targetUserId) {
          req.verified_by = null;
        }
      }
      return formatResult([]);
    }
    const id = params[params.length - 1];
    const req = memoryStore.bloodRequests.get(id);
    if (req) {
      req.status = params[0];
      req.rejection_reason = params[1] || null;
      req.doctor_notes = params[2] || null;
      req.verified_by = params[3] || null;
      req.verified_at = new Date().toISOString();
      return formatResult([req]);
    }
  }

  if (lower.startsWith('update request_matches')) {
    const id = params[params.length - 1];
    const match = memoryStore.requestMatches.get(id);
    if (match) {
      match.status = params[0];
      match.responded_at = new Date().toISOString();
      return formatResult([match]);
    }
  }

  // 4. DELETE queries
  if (lower.startsWith('delete from users')) {
    const id = params[0];
    const user = memoryStore.users.get(id);
    if (user) {
      memoryStore.users.delete(id);
      for (const [dpId, dp] of memoryStore.doctorProfiles.entries()) {
        if (dp.user_id === id || dpId === id) {
          memoryStore.doctorProfiles.delete(dpId);
        }
      }
      for (const [dpId, dp] of memoryStore.donorProfiles.entries()) {
        if (dp.user_id === id) {
          memoryStore.donorProfiles.delete(dpId);
        }
      }
      for (const [docId, doc] of memoryStore.documents.entries()) {
        if (doc.user_id === id) {
          memoryStore.documents.delete(docId);
        } else if (doc.reviewed_by === id) {
          doc.reviewed_by = null;
        }
      }
      for (const [reqId, req] of memoryStore.bloodRequests.entries()) {
        if (req.requester_id === id) {
          memoryStore.bloodRequests.delete(reqId);
        } else if (req.verified_by === id) {
          req.verified_by = null;
        }
      }
      for (const [matchId, match] of memoryStore.requestMatches.entries()) {
        if (match.donor_id === id) {
          memoryStore.requestMatches.delete(matchId);
        }
      }
      return formatResult([user]);
    }
    return formatResult([]);
  }

  if (lower.startsWith('delete from doctor_profiles')) {
    const id = params[0];
    const toDelete = [];
    for (const [dpId, dp] of memoryStore.doctorProfiles.entries()) {
      if (dp.user_id === id || dpId === id) {
        toDelete.push(dpId);
      }
    }
    toDelete.forEach(k => memoryStore.doctorProfiles.delete(k));
    return formatResult(toDelete.map(k => ({ id: k })));
  }

  if (lower.startsWith('delete from documents')) {
    const userId = params[0];
    const toDelete = [];
    for (const [docId, doc] of memoryStore.documents.entries()) {
      if (doc.user_id === userId) {
        toDelete.push(docId);
      }
    }
    toDelete.forEach(k => memoryStore.documents.delete(k));
    return formatResult(toDelete.map(k => ({ id: k })));
  }

  return formatResult([]);
}

export const db = {
  query,
  initDatabase,
  isPg: () => usePg,
  getPool: () => pool,
};
