import { test, describe } from 'node:test';
import assert from 'node:assert';
import { isBloodCompatible, getCompatibleDonorGroups } from '../services/bloodCompatibility.js';

describe('Hematological Blood Compatibility Tests', () => {
  test('O- is universal red blood cell donor', () => {
    const allGroups = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'];
    for (const group of allGroups) {
      assert.strictEqual(
        isBloodCompatible(group, 'O-'),
        true,
        `O- must be compatible with recipient group ${group}`
      );
    }
  });

  test('Recipient with O- can receive ONLY from O-', () => {
    assert.strictEqual(isBloodCompatible('O-', 'O-'), true);
    assert.strictEqual(isBloodCompatible('O-', 'O+'), false);
    assert.strictEqual(isBloodCompatible('O-', 'A-'), false);
    assert.strictEqual(isBloodCompatible('O-', 'B+'), false);
    assert.strictEqual(isBloodCompatible('O-', 'AB+'), false);
  });

  test('AB+ is universal recipient (can receive from all)', () => {
    const allGroups = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'];
    for (const group of allGroups) {
      assert.strictEqual(
        isBloodCompatible('AB+', group),
        true,
        `AB+ recipient must accept donor group ${group}`
      );
    }
  });

  test('Incompatible blood groups are strictly rejected', () => {
    // A+ cannot receive from B+ or AB+
    assert.strictEqual(isBloodCompatible('A+', 'B+'), false);
    assert.strictEqual(isBloodCompatible('A+', 'AB+'), false);

    // B- cannot receive from B+, A+, or AB+
    assert.strictEqual(isBloodCompatible('B-', 'B+'), false);
    assert.strictEqual(isBloodCompatible('B-', 'A-'), false);
  });
});

