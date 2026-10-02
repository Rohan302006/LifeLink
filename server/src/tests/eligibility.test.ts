import { test, describe } from 'node:test';
import assert from 'node:assert';
import { calculateDonorEligibility, DEFAULT_ELIGIBILITY_POLICY } from '../services/eligibilityService.js';

describe('Donor Eligibility Interval Tests', () => {
  test('First-time donor (null last_donation_date) is marked eligible by interval', () => {
    const res = calculateDonorEligibility(null, 'whole_blood');
    assert.strictEqual(res.isIntervalEligible, true);
    assert.strictEqual(res.daysRemaining, 0);
    assert.ok(res.statusLabel.includes('Eligible by interval'));
    assert.ok(res.medicalDisclaimer.includes('LifeLink computes interval eligibility only'));
  });

  test('Donor who donated 100 days ago is eligible under 90-day whole blood policy', () => {
    const date100DaysAgo = new Date(Date.now() - 100 * 86400000).toISOString().split('T')[0];
    const res = calculateDonorEligibility(date100DaysAgo, 'whole_blood', DEFAULT_ELIGIBILITY_POLICY);

    assert.strictEqual(res.isIntervalEligible, true);
    assert.strictEqual(res.daysRemaining, 0);
    assert.ok(res.statusLabel.includes('Eligible by interval'));
  });

  test('Donor who donated 30 days ago is in cooldown under 90-day whole blood policy', () => {
    const date30DaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
    const res = calculateDonorEligibility(date30DaysAgo, 'whole_blood', DEFAULT_ELIGIBILITY_POLICY);

    assert.strictEqual(res.isIntervalEligible, false);
    assert.ok(res.daysRemaining >= 59 && res.daysRemaining <= 61);
    assert.ok(res.statusLabel.includes('Cooldown active'));
  });

  test('Configurable policy works properly for Platelets (7 days) and Plasma (14 days)', () => {
    const date10DaysAgo = new Date(Date.now() - 10 * 86400000).toISOString().split('T')[0];

    // For platelets (gap = 7 days): 10 days ago should be ELIGIBLE
    const plateletRes = calculateDonorEligibility(date10DaysAgo, 'platelets', DEFAULT_ELIGIBILITY_POLICY);
    assert.strictEqual(plateletRes.isIntervalEligible, true);

    // For plasma (gap = 14 days): 10 days ago should be IN COOLDOWN (4 days remaining)
    const plasmaRes = calculateDonorEligibility(date10DaysAgo, 'plasma', DEFAULT_ELIGIBILITY_POLICY);
    assert.strictEqual(plasmaRes.isIntervalEligible, false);
    assert.ok(plasmaRes.daysRemaining >= 3 && plasmaRes.daysRemaining <= 5);
  });
});
