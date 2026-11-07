import bcrypt from 'bcryptjs';
import { query } from '../db/database.js';

export const DEFAULT_DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'Password123!';

export async function runSeed() {
  console.log(`🌱 Checking / Seeding LifeLink default users (Method B password active)...`);

  const passwordHash = await bcrypt.hash(DEFAULT_DEMO_PASSWORD, 10);

  // 1. ADMIN
  const existingAdmin = await query('SELECT * FROM users WHERE email = $1', ['admin@lifelink.org']);
  if (existingAdmin.rows.length === 0) {
    await query(
      `INSERT INTO users (email, password_hash, role, full_name, phone, age, gender, blood_group, city, status, onboarding_completed)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      ['admin@lifelink.org', passwordHash, 'admin', 'System Administrator', '+91 99000 00001', 40, 'Other', 'O+', 'Mumbai', 'verified', true]
    );
    console.log(`✅ 1. Admin seeded: admin@lifelink.org / ${DEFAULT_DEMO_PASSWORD}`);
  } else {
    // Keep password synchronized with DEFAULT_DEMO_PASSWORD (Method B)
    await query('UPDATE users SET password_hash = $1 WHERE email = $2', [passwordHash, 'admin@lifelink.org']);
    console.log(`ℹ️ Admin already exists (password synchronized to: ${DEFAULT_DEMO_PASSWORD})`);
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
      console.log(`✅ 2. Doctor seeded: doctor@hospital.org / ${DEFAULT_DEMO_PASSWORD}`);
    }
  } else {
    await query('UPDATE users SET password_hash = $1 WHERE email = $2', [passwordHash, 'doctor@hospital.org']);
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
        [donorUserId, 'id_proof', 'sample-id-proof.jpg', 'National_ID_Card.jpg', 'image/jpeg', 35911, 'sample-id-proof.jpg', 'verified']
      );
      console.log(`✅ 3. Donor seeded (O- Verified): donor@example.com / ${DEFAULT_DEMO_PASSWORD}`);
    }
  } else {
    await query('UPDATE users SET password_hash = $1 WHERE email = $2', [passwordHash, 'donor@example.com']);
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
        [receiverUserId, 'medical_requisition', 'sample-prescription.jpg', 'Doctor_Blood_Requisition.jpg', 'image/jpeg', 35911, 'sample-prescription.jpg', 'verified']
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

      console.log(`✅ 4. Receiver seeded: receiver@example.com / ${DEFAULT_DEMO_PASSWORD}`);
    }
  } else {
    await query('UPDATE users SET password_hash = $1 WHERE email = $2', [passwordHash, 'receiver@example.com']);
  }

  // Update any existing demo documents from .pdf to .jpg image format
  await query(
    `UPDATE documents 
     SET file_name = 'sample-id-proof.jpg', original_name = 'National_ID_Card.jpg', mime_type = 'image/jpeg', storage_path = 'sample-id-proof.jpg'
     WHERE file_name = 'sample-id-proof.pdf'`
  ).catch(() => {});

  await query(
    `UPDATE documents 
     SET file_name = 'sample-prescription.jpg', original_name = 'Doctor_Blood_Requisition.jpg', mime_type = 'image/jpeg', storage_path = 'sample-prescription.jpg'
     WHERE file_name = 'sample-prescription.pdf'`
  ).catch(() => {});

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
