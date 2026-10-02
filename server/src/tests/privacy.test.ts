import { test, describe } from 'node:test';
import assert from 'node:assert';
import { findNearbyCompatibleDonors, sanitizeDonorPrivacy } from '../services/matchingService.js';
import { DonorRecord, BloodRequestRecord, RequestMatchRecord } from '../seeds/seedData.js';

describe('Strict Privacy-by-Design Tests', () => {
  const mockDonor: DonorRecord = {
    id: 'donor-test-1',
    user_id: 'user-test-1',
    blood_group: 'O-',
    city: 'Mumbai',
    state: 'Maharashtra',
    lat: 19.0596,
    lng: 72.8295,
    approx_area: 'Bandra West',
    last_donation_date: null,
    is_available: true,
    consent_given_at: '2026-01-01T00:00:00Z',
    medical_notes_self_reported: 'Healthy',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    full_name: 'Pooja Patil',
    phone: '+91 98202 99999',
  };

  const mockRequest: BloodRequestRecord = {
    id: 'req-test-1',
    requester_id: 'user-req-1',
    patient_name: 'John Doe',
    hospital_id: 'hosp-101',
    doctor_id: 'doc-1',
    blood_group: 'O-',
    component: 'whole_blood',
    units_needed: 1,
    urgency: 'critical_immediate',
    required_by: '2026-03-01T12:00:00Z',
    status: 'verified',
    doctor_notes: 'Verified by doctor',
    rejection_reason: null,
    lat: 19.0519,
    lng: 72.8295,
    created_at: '2026-02-28T10:00:00Z',
    verified_at: '2026-02-28T10:30:00Z',
    fulfilled_at: null,
  };

  test('Privacy Rule 1: findNearbyCompatibleDonors ALWAYS redacts phone and exact GPS coordinates', () => {
    const results = findNearbyCompatibleDonors(mockRequest, [mockDonor], 20.0);
    assert.strictEqual(results.length, 1);

    const matched = results[0];
    // Phone MUST be null before acceptance
    assert.strictEqual(matched.phone, null, 'Donor phone must be hidden prior to acceptance');
    // Coordinates MUST be null before acceptance
    assert.strictEqual(matched.lat, null, 'Exact latitude must be hidden prior to acceptance');
    assert.strictEqual(matched.lng, null, 'Exact longitude must be hidden prior to acceptance');
    // Approximate area and distance ARE allowed
    assert.strictEqual(matched.approx_area, 'Bandra West');
    assert.ok(matched.distance_km >= 0);
    assert.strictEqual(matched.is_contact_revealed, false);
  });

  test('Privacy Rule 2: sanitizeDonorPrivacy masks contact when match status is "notified" or "declined"', () => {
    const matchNotified: RequestMatchRecord = {
      id: 'match-1',
      request_id: 'req-test-1',
      donor_id: 'donor-test-1',
      distance_km: 1.5,
      status: 'notified',
      notified_at: '2026-02-28T10:35:00Z',
      responded_at: null,
    };

    const sanitized = sanitizeDonorPrivacy(mockDonor, matchNotified);
    assert.strictEqual(sanitized.phone, null, 'Phone must remain masked when status is notified');
    assert.strictEqual(sanitized.lat, null, 'Latitude must remain masked when status is notified');
    assert.strictEqual(sanitized.lng, null, 'Longitude must remain masked when status is notified');
    assert.strictEqual(sanitized.is_contact_revealed, false);
  });

  test('Privacy Rule 3: sanitizeDonorPrivacy reveals contact ONLY after explicit acceptance by donor', () => {
    const matchAccepted: RequestMatchRecord = {
      id: 'match-1',
      request_id: 'req-test-1',
      donor_id: 'donor-test-1',
      distance_km: 1.5,
      status: 'accepted', // ACCEPTED!
      notified_at: '2026-02-28T10:35:00Z',
      responded_at: '2026-02-28T10:40:00Z',
    };

    const sanitized = sanitizeDonorPrivacy(mockDonor, matchAccepted);
    assert.strictEqual(sanitized.phone, '+91 98202 99999', 'Phone must be revealed upon acceptance');
    assert.strictEqual(sanitized.lat, 19.0596, 'Coordinates must be revealed for route navigation upon acceptance');
    assert.strictEqual(sanitized.lng, 72.8295);
    assert.strictEqual(sanitized.is_contact_revealed, true);
  });
});
