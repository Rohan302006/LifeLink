import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { DonationRecord } from '../../types';
import { FileCheck, ShieldCheck, CheckCircle2, User, Heart, History } from 'lucide-react';

export const LogDonation: React.FC = () => {
  const { user } = useAuth();
  const [donations, setDonations] = useState<DonationRecord[]>([]);
  const [donorId, setDonorId] = useState('donor-1');
  const [requestId, setRequestId] = useState('req-001');
  const [bloodGroup, setBloodGroup] = useState('O-');
  const [component, setComponent] = useState('whole_blood');
  const [unitsDonated, setUnitsDonated] = useState(1);
  const [notes, setNotes] = useState('Sterile phlebotomy completed. Post-donation vitals normal.');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchDonations = async () => {
    try {
      const res = await api.getDonations();
      setDonations(res.donations);
    } catch (err: any) {
      console.warn('Could not load donations:', err);
    }
  };

  useEffect(() => {
    fetchDonations();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg(null);
    try {
      const res = await api.logDonation({
        donor_id: donorId,
        request_id: requestId || null,
        blood_group: bloodGroup,
        component,
        units_donated: unitsDonated,
        notes,
      });

      setSuccessMsg(res.message || 'Donation verified successfully');
      fetchDonations();
    } catch (err: any) {
      alert('Failed to log donation: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto my-10 px-4 space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center space-x-3.5">
        <div className="w-12 h-12 rounded-xl bg-brand-600 text-white flex items-center justify-center">
          <FileCheck className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Log Verified Donation (Doctor Only)</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Logging a donation updates the donor's eligibility cooldown and stamps a permanent hospital audit trail.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Form Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-900 pb-2 border-b border-slate-100 flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Phlebotomy & Verification Record</span>
          </h3>

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs p-3 rounded-lg flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Donor ID / Tag</label>
              <input
                type="text"
                required
                value={donorId}
                onChange={e => setDonorId(e.target.value)}
                placeholder="e.g. donor-1 (Aarav Patil)"
                className="w-full border border-slate-300 rounded-lg p-2.5"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Associated Request ID (Optional)</label>
              <input
                type="text"
                value={requestId}
                onChange={e => setRequestId(e.target.value)}
                placeholder="e.g. req-001 (Marks request fulfilled)"
                className="w-full border border-slate-300 rounded-lg p-2.5"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Blood Group</label>
                <select
                  value={bloodGroup}
                  onChange={e => setBloodGroup(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 bg-white font-bold"
                >
                  {['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'].map(bg => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Units Collected</label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={unitsDonated}
                  onChange={e => setUnitsDonated(parseInt(e.target.value, 10))}
                  className="w-full border border-slate-300 rounded-lg p-2.5"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Component</label>
              <select
                value={component}
                onChange={e => setComponent(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2.5 bg-white"
              >
                <option value="whole_blood">Whole Blood (Cooldown: 90 days)</option>
                <option value="plasma">Plasma (Cooldown: 14 days)</option>
                <option value="platelets">Platelets (Cooldown: 7 days)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Doctor Clinical Observation</label>
              <textarea
                rows={3}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full border border-slate-300 rounded-lg p-2.5"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors shadow-2xs"
            >
              {loading ? 'Recording...' : 'Verify Donation & Reset Cooldown'}
            </button>
          </form>
        </div>

        {/* Donation Audit History */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-900 pb-2 border-b border-slate-100 flex items-center space-x-2">
            <History className="w-4 h-4 text-slate-500" />
            <span>Recent Verified Donations</span>
          </h3>

          <div className="space-y-3">
            {donations.map(don => (
              <div
                key={don.id}
                className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1 text-xs"
              >
                <div className="flex items-center justify-between font-bold text-slate-900">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-brand-700">{don.blood_group}</span>
                    <span>•</span>
                    <span>{don.donor_name || 'Verified Donor'}</span>
                  </div>
                  <span className="text-[10px] text-slate-400">{don.donation_date}</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Logged by {don.doctor_name || 'Dr. Ananya Sharma'} at {don.hospital_name || 'Hospital'}
                </p>
                {don.notes && (
                  <p className="text-[11px] text-slate-600 italic mt-1">"{don.notes}"</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
