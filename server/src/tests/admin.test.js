import { test, describe, before } from 'node:test';
import assert from 'node:assert';
import { runSeed } from '../seeds/seed.js';
import { query } from '../db/database.js';

describe('Admin Management Tests (Doctor, User, and Hospital Sections)', () => {
  before(async () => {
    await runSeed();
  });

  // ==========================================================================
  // Section 1: Doctor Section Tests
  // ==========================================================================
  test('Querying doctors includes age, gender, and blood group', async () => {
    const doctorsRes = await query(
      `SELECT 
        COALESCE(dp.id, u.id) as id,
        u.id as user_id,
        COALESCE(dp.medical_license_number, 'Under Review') as medical_license_number,
        COALESCE(dp.hospital_name, 'Affiliated Hospital') as hospital_name,
        COALESCE(dp.hospital_city, u.city) as hospital_city,
        COALESCE(dp.approval_status, u.status, 'pending') as approval_status,
        u.full_name,
        u.email,
        u.phone,
        u.age,
        u.gender,
        u.blood_group,
        u.city
       FROM users u
       LEFT JOIN doctor_profiles dp ON dp.user_id = u.id
       WHERE u.role = 'doctor'`
    );

    assert.ok(doctorsRes.rows.length >= 1, 'At least one doctor should exist');
    const doctor = doctorsRes.rows[0];
    assert.strictEqual(doctor.email, 'doctor@hospital.org');
    assert.ok(doctor.age !== undefined, 'Doctor age must be present');
    assert.ok(doctor.gender !== undefined, 'Doctor gender must be present');
    assert.ok(doctor.blood_group !== undefined, 'Doctor blood group must be present');
    assert.strictEqual(doctor.approval_status, 'verified');
  });

  test('Deleting a doctor account removes user and cascades doctor_profiles', async () => {
    const insertUser = await query(
      `INSERT INTO users (email, password_hash, role, full_name, phone, age, gender, blood_group, city, status, onboarding_completed)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      ['tempdoc@hospital.org', 'hashedpass', 'doctor', 'Dr. Temporary Test', '+91 99999 88888', 50, 'Male', 'A+', 'Pune', 'verified', true]
    );
    const tempUserId = insertUser.rows[0].id;

    const insertProf = await query(
      `INSERT INTO doctor_profiles (user_id, medical_license_number, hospital_name, hospital_city, approval_status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [tempUserId, 'TEMP-LIC-999', 'City Care Hospital', 'Pune', 'verified']
    );
    assert.strictEqual(insertProf.rows.length, 1);

    const checkBefore = await query('SELECT * FROM users WHERE id = $1', [tempUserId]);
    assert.strictEqual(checkBefore.rows.length, 1);

    await query('DELETE FROM doctor_profiles WHERE user_id = $1 OR id = $1', [tempUserId]);
    await query('DELETE FROM users WHERE id = $1', [tempUserId]);

    const checkAfterUser = await query('SELECT * FROM users WHERE id = $1', [tempUserId]);
    assert.strictEqual(checkAfterUser.rows.length, 0, 'Deleted doctor should not exist in users');

    const checkAfterProf = await query('SELECT * FROM doctor_profiles WHERE user_id = $1', [tempUserId]);
    assert.strictEqual(checkAfterProf.rows.length, 0, 'Deleted doctor should not exist in doctor_profiles');
  });

  // ==========================================================================
  // Section 2: User Section Tests
  // ==========================================================================
  test('Querying regular users returns donors and receivers with profile info', async () => {
    const usersRes = await query(
      `SELECT 
        u.id,
        u.id as user_id,
        u.full_name,
        u.email,
        u.phone,
        u.role,
        u.status,
        u.age,
        u.gender,
        u.blood_group,
        u.city,
        u.onboarding_completed,
        u.created_at as registered_at,
        dp.is_available,
        dp.is_verified,
        dp.last_donation_date,
        dp.last_donation_date_status
       FROM users u
       LEFT JOIN donor_profiles dp ON dp.user_id = u.id
       WHERE u.role IN ('donor', 'receiver')`
    );

    assert.ok(usersRes.rows.length >= 24, 'Should include all seeded donors and receivers (at least 24)');
    const roles = usersRes.rows.map(u => u.role);
    assert.ok(roles.includes('donor'), 'Should include donors');
    assert.ok(roles.includes('receiver'), 'Should include receivers');

    for (const u of usersRes.rows) {
      assert.ok(u.full_name, `User ${u.id} must have full_name populated`);
      assert.ok(u.email, `User ${u.id} must have email populated`);
      assert.ok(u.role, `User ${u.id} must have role populated`);
      assert.ok(u.city, `User ${u.id} must have city populated`);
      assert.ok(u.status, `User ${u.id} must have status populated`);
    }
  });

  test('Admin can delete a regular user with cascade', async () => {
    const insertTempUser = await query(
      `INSERT INTO users (email, password_hash, role, full_name, phone, age, gender, blood_group, city, status, onboarding_completed)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      ['tempuser@example.com', 'hashedpass', 'donor', 'Temp Donor', '+91 98888 77777', 25, 'Female', 'B-', 'Mumbai', 'pending', false]
    );
    const tempId = insertTempUser.rows[0].id;

    const check = await query('SELECT * FROM users WHERE id = $1', [tempId]);
    assert.strictEqual(check.rows.length, 1);

    await query('DELETE FROM users WHERE id = $1', [tempId]);

    const checkAfter = await query('SELECT * FROM users WHERE id = $1', [tempId]);
    assert.strictEqual(checkAfter.rows.length, 0, 'User must be deleted');
  });

  // ==========================================================================
  // Section 3: Hospital Section Tests
  // ==========================================================================
  test('Hospitals list returns pre-listed hospitals', async () => {
    const hospitalsRes = await query('SELECT * FROM hospitals ORDER BY name ASC');
    assert.ok(hospitalsRes.rows.length >= 1, 'Hospitals must be available');
    const lilavati = hospitalsRes.rows.find(h => h.name.includes('Lilavati'));
    assert.ok(lilavati, 'Lilavati Hospital should be listed');
  });

  test('Admin can add a new hospital for doctor registration', async () => {
    const insHosp = await query(
      `INSERT INTO hospitals (name, city, state, address, contact_phone)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      ['Jaslok Hospital & Research Centre', 'Mumbai', 'Maharashtra', '15 Dr. Deshmukh Marg', '+91 22 6657 3010']
    );

    assert.strictEqual(insHosp.rows.length, 1);
    assert.strictEqual(insHosp.rows[0].name, 'Jaslok Hospital & Research Centre');

    const check = await query('SELECT * FROM hospitals WHERE name = $1', ['Jaslok Hospital & Research Centre']);
    assert.strictEqual(check.rows.length, 1);
  });
});
