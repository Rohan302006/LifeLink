import { test, describe } from 'node:test';
import assert from 'node:assert';
import { isBloodCompatible, getCompatibleDonorGroups } from '../services/bloodCompatibility.js';
import { calculateHaversineDistanceKm } from '../services/matchingService.js';

describe('Blood Compatibility & Matching Tests', () => {
  test('O- is universal red blood cell donor', () => {
    const recipients = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'];
    for (const r of recipients) {
      assert.strictEqual(
        isBloodCompatible(r, 'O-', 'whole_blood'),
        true,
        `O- should be compatible with ${r}`
      );
    }
  });

  test('AB+ can receive whole blood / RBC from all blood groups', () => {
    const donors = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'];
    for (const d of donors) {
      assert.strictEqual(
        isBloodCompatible('AB+', d, 'whole_blood'),
        true,
        `AB+ should be able to receive from ${d}`
      );
    }
  });

  test('Incompatible blood groups are strictly rejected', () => {
    // A+ cannot receive from B+ or AB+
    assert.strictEqual(isBloodCompatible('A+', 'B+', 'whole_blood'), false);
    assert.strictEqual(isBloodCompatible('A+', 'AB+', 'whole_blood'), false);
    // O- can only receive from O-
    assert.strictEqual(isBloodCompatible('O-', 'O+', 'whole_blood'), false);
    assert.strictEqual(isBloodCompatible('O-', 'A+', 'whole_blood'), false);
    assert.strictEqual(isBloodCompatible('O-', 'B-', 'whole_blood'), false);
  });

  test('Plasma compatibility adheres to reverse agglutination rules', () => {
    // AB is universal plasma donor
    assert.strictEqual(isBloodCompatible('O-', 'AB+', 'plasma'), true);
    assert.strictEqual(isBloodCompatible('A+', 'AB+', 'plasma'), true);
  });

  test('Haversine distance calculation is accurate within metro scale', () => {
    // Distance between Bandra Reclamation (19.0519, 72.8295) and Tata Memorial Parel (19.0044, 72.8427) is ~5.4 km
    const dist = calculateHaversineDistanceKm(19.0519, 72.8295, 19.0044, 72.8427);
    assert.ok(dist >= 5.0 && dist <= 6.0, `Expected ~5.4 km, got ${dist}`);
  });
});
