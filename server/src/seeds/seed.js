import bcrypt from 'bcryptjs';
import { query } from '../db/database.js';

export async function runSeed() {
  console.log('🌱 Checking / Seeding LifeLink default users (Admin, Doctor, Donor, Receiver)...');

  const defaultPassword = 'Password123!';
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  // 1. ADMIN
  const existingAdmin = await query('SELECT * FROM users WHERE email = $1', ['admin@lifelink.org']);
  if (existingAdmin.rows.length === 0) {
    await query(
      `INSERT INTO users (email, password_hash, role, full_name, phone, age, gender, blood_group, city, status, onboarding_completed)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      ['admin@lifelink.org', passwordHash, 'admin', 'System Administrator', '+91 99000 00001', 40, 'Other', 'O+', 'Mumbai', 'verified', true]
    );
    console.log('✅ 1. Admin seeded: admin@lifelink.org / Password123!');
  } else {
    console.log('ℹ️ Admin already exists: admin@lifelink.org');
  }

  // 2. DOCTOR
  const existingDoc = await query('SELECT * FROM users WHERE email = $1', ['doctor@hospital.org']);
  let docUserId = existingDoc.rows[0]?.id;

  if (existingDoc.rows.length === 0) {
    const docUserRes = await query(
      `INSERT INTO users (email, password_hash, role, full_name, phone, age, gender, blood_group, city, status, onboarding_completed)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      ['doctor@hospital.org', passwordHash, 'doctor', 'Dr. Rajesh Sharma, MD', '+91 99000 00002', 45, 'Male', 'B+', 'Mumbai', 'verified', true]
    );
    docUserId = docUserRes.rows[0]?.id;

    if (docUserId) {
      await query(
        `INSERT INTO doctor_profiles (user_id, medical_license_number, hospital_name, hospital_city, approval_status)
         VALUES ($1, $2, $3, $4, $5)`,
        [docUserId, 'MCI-2024-88419', 'Lilavati Hospital & Research Centre', 'Mumbai', 'verified']
      );
      console.log('✅ 2. Doctor seeded: doctor@hospital.org / Password123!');
    }
  }

  // 3. DONOR
  const existingDonor = await query('SELECT * FROM users WHERE email = $1', ['donor@example.com']);
  let donorUserId = existingDonor.rows[0]?.id;

  if (existingDonor.rows.length === 0) {
    const donorUserRes = await query(
      `INSERT INTO users (email, password_hash, role, full_name, phone, age, gender, blood_group, city, status, onboarding_completed)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      ['donor@example.com', passwordHash, 'donor', 'Aarav Patil', '+91 99000 00003', 28, 'Male', 'O-', 'Mumbai', 'verified', true]
    );
    donorUserId = donorUserRes.rows[0]?.id;

    if (donorUserId) {
      const verifiedDate = new Date(Date.now() - 100 * 24 * 3600000).toISOString().split('T')[0];
      await query(
        `INSERT INTO donor_profiles (user_id, last_donation_date, last_donation_date_status, is_available, is_verified)
         VALUES ($1, $2, $3, $4, $5)`,
        [donorUserId, verifiedDate, 'verified', true, true]
      );

      await query(
        `INSERT INTO documents (user_id, doc_type, file_name, original_name, mime_type, file_size, storage_path, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [donorUserId, 'id_proof', 'sample-id-proof.pdf', 'National_ID_Card.pdf', 'application/pdf', 245000, 'sample-id-proof.pdf', 'verified']
      );
      console.log('✅ 3. Donor seeded (O- Verified): donor@example.com / Password123!');
    }
  }

  // 4. RECEIVER
  const existingReceiver = await query('SELECT * FROM users WHERE email = $1', ['receiver@example.com']);
  let receiverUserId = existingReceiver.rows[0]?.id;

  if (existingReceiver.rows.length === 0) {
    const receiverUserRes = await query(
      `INSERT INTO users (email, password_hash, role, full_name, phone, age, gender, blood_group, city, status, onboarding_completed)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      ['receiver@example.com', passwordHash, 'receiver', 'Priya Deshmukh', '+91 99000 00004', 32, 'Female', 'O-', 'Mumbai', 'verified', true]
    );
    receiverUserId = receiverUserRes.rows[0]?.id;

    if (receiverUserId) {
      await query(
        `INSERT INTO documents (user_id, doc_type, file_name, original_name, mime_type, file_size, storage_path, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [receiverUserId, 'medical_requisition', 'sample-prescription.pdf', 'Doctor_Blood_Requisition.pdf', 'application/pdf', 180000, 'sample-prescription.pdf', 'verified']
      );

      // Seed sample verified blood request
      const reqRes = await query(
        `INSERT INTO blood_requests (requester_id, patient_name, blood_group, units_needed, hospital_name, city, urgency, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [receiverUserId, 'Sunita Deshmukh', 'O-', 2, 'Lilavati Hospital', 'Mumbai', 'critical', 'verified']
      );

      if (donorUserId && reqRes.rows[0]) {
        await query(
          `INSERT INTO request_matches (request_id, donor_id, status)
           VALUES ($1, $2, $3)`,
          [reqRes.rows[0].id, donorUserId, 'notified']
        );
      }

      console.log('✅ 4. Receiver seeded: receiver@example.com / Password123!');
    }
  }

  console.log('✨ Seed verification complete.');
}

if (process.argv[1]?.endsWith('seed.js')) {
  runSeed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seed failed:', err);
      process.exit(1);
    });
}
