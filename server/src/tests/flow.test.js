import { test, describe, before } from 'node:test';
import assert from 'node:assert';
import { runSeed } from '../seeds/seed.js';
import { query } from '../db/database.js';
import { calculateDonorEligibility } from '../services/eligibilityService.js';
import { isBloodCompatible } from '../services/bloodCompatibility.js';

describe('LifeLink Core Workflow Tests', () => {
  before(async () => {
    await runSeed();
  });

  test('Seed creates one user per role with verified initial state', async () => {
    const admin = await query('SELECT * FROM users WHERE email = $1', ['admin@lifelink.org']);
    const doctor = await query('SELECT * FROM users WHERE email = $1', ['doctor@hospital.org']);
    const donor = await query('SELECT * FROM users WHERE email = $1', ['donor@example.com']);
    const receiver = await query('SELECT * FROM users WHERE email = $1', ['receiver@example.com']);

    assert.strictEqual(admin.rows.length, 1);
    assert.strictEqual(admin.rows[0].role, 'admin');

    assert.strictEqual(doctor.rows.length, 1);
    assert.strictEqual(doctor.rows[0].role, 'doctor');

    assert.strictEqual(donor.rows.length, 1);
    assert.strictEqual(donor.rows[0].role, 'donor');

    assert.strictEqual(receiver.rows.length, 1);
    assert.strictEqual(receiver.rows[0].role, 'receiver');
  });

  test('Doctor account requires approval status check', async () => {
    const docProfileRes = await query('SELECT * FROM doctor_profiles WHERE medical_license_number = $1', ['MCI-2024-88419']);
    assert.strictEqual(docProfileRes.rows.length, 1);
    assert.strictEqual(docProfileRes.rows[0].approval_status, 'verified');
  });

  test('Only verified donors can be matched to verified requests', async () => {
    const receiverRes = await query('SELECT id FROM users WHERE role = $1', ['receiver']);
    const receiverId = receiverRes.rows[0].id;

    // 1. Create a blood request for O-
    const reqRes = await query(
      `INSERT INTO blood_requests (requester_id, patient_name, blood_group, units_needed, hospital_name, city, urgency, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [receiverId, 'Trauma Patient', 'O-', 2, 'KEM Hospital', 'Mumbai', 'critical', 'verified']
    );
    const request = reqRes.rows[0];
    assert.strictEqual(request.blood_group, 'O-');

    // 2. Fetch all donors
    const donors = await query('SELECT u.id, u.blood_group, dp.is_available, dp.is_verified, dp.last_donation_date, dp.last_donation_date_status FROM users u JOIN donor_profiles dp ON u.id = dp.user_id');

    let matchedCount = 0;
    for (const donor of donors.rows) {
      if (!donor.is_available) continue;
      // Strict rule: ONLY verified donors!
      if (!donor.is_verified) continue;

      if (isBloodCompatible(request.blood_group, donor.blood_group)) {
        const eligibility = calculateDonorEligibility(donor.last_donation_date, donor.last_donation_date_status);
        if (eligibility.isEligible) {
          matchedCount++;
        }
      }
    }

    assert.ok(matchedCount >= 1, 'At least the seeded O- verified donor must be matched');
  });

  test('Document status transitions: pending -> verified / rejected', async () => {
    const donorRes = await query('SELECT id FROM users WHERE role = $1', ['donor']);
    const donorId = donorRes.rows[0].id;

    const insertDoc = await query(
      `INSERT INTO documents (user_id, doc_type, file_name, original_name, mime_type, file_size, storage_path, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [donorId, 'id_proof', 'test-doc.png', 'id_card.png', 'image/png', 1024, 'test-doc.png', 'pending']
    );

    assert.strictEqual(insertDoc.rows[0].status, 'pending');

    // Doctor approval
    const approveDoc = await query(
      `UPDATE documents SET status = $1 WHERE id = $2 RETURNING *`,
      ['verified', insertDoc.rows[0].id]
    );
    assert.strictEqual(approveDoc.rows[0].status, 'verified');

    // Doctor rejection with mandatory reason
    const rejectDoc = await query(
      `UPDATE documents SET status = $1, rejection_reason = $2 WHERE id = $3 RETURNING *`,
      ['rejected', 'Image is blurry', insertDoc.rows[0].id]
    );
    assert.strictEqual(rejectDoc.rows[0].status, 'rejected');
    assert.strictEqual(rejectDoc.rows[0].rejection_reason, 'Image is blurry');
  });
});
