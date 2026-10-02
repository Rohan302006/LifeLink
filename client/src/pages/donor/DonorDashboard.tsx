import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import {
  UserCheck,
  Activity,
  Clock,
  MapPin,
  CheckCircle,
  XCircle,
  Phone,
  ShieldCheck,
  AlertCircle,
  Calendar,
} from 'lucide-react';

export const DonorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [donorData, setDonorData] = useState<any | null>(null);
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingAvailability, setUpdatingAvailability] = useState(false);

  const fetchDonorData = async () => {
    try {
      const [profileRes, matchesRes] = await Promise.all([
        api.getDonorProfile(),
        api.getDonorMatches(),
      ]);
      setDonorData(profileRes.donor);
      setMatches(matchesRes.matches);
    } catch (err: any) {
      console.warn('Could not load donor profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDonorData();
  }, []);

  const handleToggleAvailability = async () => {
    if (!donorData) return;
    setUpdatingAvailability(true);
    try {
      const res = await api.toggleAvailability(!donorData.is_available);
      setDonorData((prev: any) => ({ ...prev, is_available: res.is_available }));
    } catch (err: any) {
      alert('Failed to update availability: ' + err.message);
    } finally {
      setUpdatingAvailability(false);
    }
  };

  const handleRespond = async (matchId: string, action: 'accept' | 'decline') => {
    try {
      const res = await api.respondMatch(matchId, action);
      alert(res.message);
      fetchDonorData();
    } catch (err: any) {
      alert('Error responding to match: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto my-16 text-center text-xs text-slate-500">
        Loading donor dashboard & cooldown data...
      </div>
    );
  }

  const eligibility = donorData?.eligibility;

  return (
    <div className="max-w-5xl mx-auto my-10 px-4 space-y-6">
      {/* Top Welcome Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-50 border border-brand-200 flex flex-col items-center justify-center">
            <span className="text-xl font-black text-brand-700 leading-none">
              {donorData?.blood_group || 'O-'}
            </span>
            <span className="text-[10px] uppercase font-bold text-slate-500 mt-0.5">Donor</span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-slate-900">{donorData?.full_name || user?.full_name}</h1>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded border border-emerald-300">
                Verified Volunteer
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 flex items-center space-x-2">
              <span>{donorData?.approx_area || 'Bandra West, Mumbai'}</span>
              <span>•</span>
              <span>{donorData?.phone}</span>
            </p>
          </div>
        </div>

        {/* Availability Toggle */}
        <div className="flex items-center space-x-3 bg-slate-50 border border-slate-200 p-3 rounded-xl">
          <div className="text-right">
            <span className="text-[11px] font-semibold text-slate-700 block">Emergency Availability</span>
            <span className={`text-[10px] font-bold uppercase ${donorData?.is_available ? 'text-emerald-700' : 'text-slate-400'}`}>
              {donorData?.is_available ? 'Active (Ready to match)' : 'Paused'}
            </span>
          </div>
          <button
            onClick={handleToggleAvailability}
            disabled={updatingAvailability}
            className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
              donorData?.is_available ? 'bg-emerald-600' : 'bg-slate-300'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                donorData?.is_available ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Eligibility Cooldown Card (PRD REQUIREMENT) */}
        <div className="md:col-span-1 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
              <Clock className="w-4 h-4 text-brand-600" />
              <span>Interval Eligibility</span>
            </h3>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                eligibility?.isIntervalEligible
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : 'bg-amber-100 text-amber-800 border border-amber-200'
              }`}
            >
              {eligibility?.isIntervalEligible ? 'Eligible' : 'In Cooldown'}
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-[11px] text-slate-400 block">Last Donated Date:</span>
              <strong className="text-slate-800 text-sm">
                {donorData?.last_donation_date ? new Date(donorData.last_donation_date).toLocaleDateString() : 'First-time Donor (No prior cooldown)'}
              </strong>
            </div>

            <div>
              <span className="text-[11px] text-slate-400 block">Next Interval Eligible Date:</span>
              <strong className="text-slate-800">
                {eligibility?.nextEligibleDate ? new Date(eligibility.nextEligibleDate).toLocaleDateString() : 'Today'}
              </strong>
            </div>

            {eligibility && !eligibility.isIntervalEligible && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-amber-900 text-xs">
                <strong>Cooldown Active:</strong> {eligibility.daysRemaining} days remaining for whole blood recovery.
              </div>
            )}
          </div>

          {/* Regulatory Disclaimer on Eligibility Screen (MANDATORY PRD REQUIREMENT) */}
          <div className="pt-3 border-t border-slate-100 bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1 text-[11px] text-slate-600">
            <div className="flex items-center space-x-1 text-slate-800 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Physician Clearance Required:</span>
            </div>
            <p className="leading-relaxed">
              Interval calculation is a pre-screening parameter. Final physical eligibility, vitals, hemoglobin level, and serology are determined strictly by the hospital doctor before donation.
            </p>
          </div>
        </div>

        {/* Incoming Emergency Matching Broadcasts */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Emergency Match Broadcasts</h3>
              <p className="text-xs text-slate-500">
                Doctor-approved requests matching your blood group ({donorData?.blood_group}) within your metro radius
              </p>
            </div>
            <span className="text-xs font-semibold bg-brand-50 text-brand-700 px-2.5 py-1 rounded-full border border-brand-200">
              {matches.length} Available
            </span>
          </div>

          {matches.length === 0 ? (
            <div className="text-center py-12 text-xs text-slate-400 space-y-2">
              <Activity className="w-8 h-8 text-slate-300 mx-auto" />
              <p>No active emergency broadcasts near you at this moment.</p>
              <p className="text-[11px] text-slate-400">Keep your availability toggled on to receive emergency matching notifications.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {matches.map(m => (
                <div
                  key={m.match_id}
                  className={`rounded-xl border p-4 transition-all space-y-3 ${
                    m.status === 'accepted'
                      ? 'border-emerald-400 bg-emerald-50/40'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-900">
                          {m.request?.patient_name}
                        </span>
                        <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-1.5 py-0.5 rounded uppercase">
                          {m.request?.urgency.replace('_', ' ')}
                        </span>
                        <span className="text-xs font-semibold text-slate-700">
                          ({m.request?.units_needed} Unit(s) {m.request?.blood_group})
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 flex items-center space-x-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{m.request?.hospital_name}</span>
                        <span className="font-semibold text-slate-700">• ~{m.distance_km} km away</span>
                      </p>
                    </div>

                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        m.status === 'accepted'
                          ? 'bg-emerald-100 text-emerald-800'
                          : m.status === 'declined'
                          ? 'bg-slate-100 text-slate-600'
                          : 'bg-amber-100 text-amber-800 animate-pulse'
                      }`}
                    >
                      {m.status}
                    </span>
                  </div>

                  {/* If Accepted, reveal Patient Contact */}
                  {m.status === 'accepted' && (
                    <div className="bg-white border border-emerald-200 rounded-lg p-3 text-xs flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-semibold text-emerald-800 uppercase block">Attendant Contact Unlocked:</span>
                        <div className="flex items-center space-x-1.5 font-bold text-slate-900 mt-0.5">
                          <Phone className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{m.request?.requester_contact}</span>
                          <span className="text-slate-400 font-normal">({m.request?.requester_name})</span>
                        </div>
                      </div>
                      <span className="text-[10px] bg-emerald-100 text-emerald-900 px-2 py-1 rounded font-semibold">
                        Mutual Privacy Unlocked
                      </span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {m.status === 'notified' && (
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-end space-x-2 text-xs">
                      <button
                        onClick={() => handleRespond(m.match_id, 'decline')}
                        className="text-slate-600 hover:text-slate-900 px-3 py-1.5 rounded-lg border border-slate-300 font-medium"
                      >
                        Decline
                      </button>
                      <button
                        onClick={() => handleRespond(m.match_id, 'accept')}
                        className="bg-brand-600 hover:bg-brand-700 text-white font-semibold px-4 py-1.5 rounded-lg flex items-center space-x-1.5 transition-colors shadow-2xs"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Accept Emergency Request</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
