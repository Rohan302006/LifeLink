import { test, describe } from 'node:test';
import assert from 'node:assert';
import bcrypt from 'bcryptjs';
import { query } from '../db/database.js';

describe('Admin & Core Authentication Tests', () => {
  test('Admin user exists in database and password verifies', async () => {
    const adminRes = await query('SELECT * FROM users WHERE email = $1', ['admin@lifelink.org']);
    assert.strictEqual(adminRes.rows.length, 1, 'Admin user must exist in database');

    const admin = adminRes.rows[0];
    assert.strictEqual(admin.email, 'admin@lifelink.org');
    assert.strictEqual(admin.role, 'admin');

    const isMatch = await bcrypt.compare('Password123!', admin.password_hash);
    assert.strictEqual(isMatch, true, 'Password123! must match admin password hash');
  });

  test('All default seeded accounts exist and match Password123!', async () => {
    const defaultAccounts = [
      { email: 'admin@lifelink.org', role: 'admin' },
      { email: 'doctor@hospital.org', role: 'doctor' },
      { email: 'donor@example.com', role: 'donor' },
      { email: 'receiver@example.com', role: 'receiver' },
    ];

    for (const acc of defaultAccounts) {
      const res = await query('SELECT * FROM users WHERE email = $1', [acc.email]);
      assert.strictEqual(res.rows.length, 1, `${acc.email} must exist`);
      assert.strictEqual(res.rows[0].role, acc.role, `Role must be ${acc.role}`);

      const passwordOk = await bcrypt.compare('Password123!', res.rows[0].password_hash);
      assert.strictEqual(passwordOk, true, `Password for ${acc.email} must match Password123!`);
    }
  });

  test('Sanitizing user password_hash does not mutate stored database record', async () => {
    // 1. First fetch
    const res1 = await query('SELECT * FROM users WHERE email = $1', ['admin@lifelink.org']);
    const user1 = res1.rows[0];
    assert.ok(user1.password_hash, 'user1 must have password_hash');

    // Simulate sanitizing response as auth route does
    delete user1.password_hash;
    assert.strictEqual(user1.password_hash, undefined, 'local object had password_hash removed');

    // 2. Second fetch must STILL have password_hash intact
    const res2 = await query('SELECT * FROM users WHERE email = $1', ['admin@lifelink.org']);
    const user2 = res2.rows[0];
    assert.ok(user2.password_hash, 'user2 in DB must still retain password_hash intact');

    const canVerify = await bcrypt.compare('Password123!', user2.password_hash);
    assert.strictEqual(canVerify, true, 'Subsequent login attempt must succeed without undefined error');
  });
});

