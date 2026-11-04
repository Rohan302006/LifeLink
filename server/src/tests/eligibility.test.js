import { test, describe } from 'node:test';
import assert from 'node:assert';
import { calculateDonorEligibility, WHOLE_BLOOD_COOLDOWN_DAYS } from '../services/eligibilityService.js';

describe('Doctor-Verified Donor Eligibility & Cooldown Tests', () => {
  test('First-time donor (null last donation date) is marked eligible', () => {
    const res = calculateDonorEligibility(null, 'verified');
    assert.strictEqual(res.isEligible, true);
    assert.strictEqual(res.daysRemaining, 0);
    assert.ok(res.statusLabel.includes('First-time donor'));
  });

  test('Donor with UNVERIFIED (pending) donation date is NOT eligible', () => {
    const date50DaysAgo = new Date(Date.now() - 50 * 86400000).toISOString().split('T')[0];
    const res = calculateDonorEligibility(date50DaysAgo, 'pending');

    // Strict Clinical Rule: MUST NOT BE ELIGIBLE UNTIL DOCTOR VERIFIES
    assert.strictEqual(res.isEligible, false);
    assert.strictEqual(res.isDoctorVerified, false);
    assert.ok(res.statusLabel.includes('Pending doctor verification'));
  });

  test('Donor with REJECTED donation date proof is NOT eligible', () => {
    const date120DaysAgo = new Date(Date.now() - 120 * 86400000).toISOString().split('T')[0];
    const res = calculateDonorEligibility(date120DaysAgo, 'rejected');

    assert.strictEqual(res.isEligible, false);
    assert.ok(res.statusLabel.includes('Donation date rejected'));
  });

  test('Donor with DOCTOR-VERIFIED date 100 days ago is ELIGIBLE under 90-day cooldown', () => {
    const date100DaysAgo = new Date(Date.now() - 100 * 86400000).toISOString().split('T')[0];
    const res = calculateDonorEligibility(date100DaysAgo, 'verified');

    assert.strictEqual(res.isEligible, true);
    assert.strictEqual(res.daysRemaining, 0);
    assert.ok(res.statusLabel.includes('Eligible to donate'));
  });

  test('Donor with DOCTOR-VERIFIED date 30 days ago is IN COOLDOWN (~60 days remaining)', () => {
    const date30DaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
    const res = calculateDonorEligibility(date30DaysAgo, 'verified');

    assert.strictEqual(res.isEligible, false);
    assert.ok(res.daysRemaining >= 59 && res.daysRemaining <= 61);
    assert.ok(res.statusLabel.includes('Cooldown active'));
  });
});

