import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { BloodRequest, MatchedDonor } from '../../types';
import { StatusTimeline } from '../../components/common/StatusTimeline';
import { LeafletMap } from '../../components/maps/LeafletMap';
import {
  Activity,
  MapPin,
  Clock,
  ShieldCheck,
  Phone,
  Lock,
  Unlock,
  CheckCircle,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

export const RequestDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [request, setRequest] = useState<BloodRequest | null>(null);
  const [matches, setMatches] = useState<MatchedDonor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetails = async () => {
    if (!id) return;
    try {
      const res = await api.getRequestById(id);
      setRequest(res.request);

      if (res.request.status !== 'pending') {
        const matchRes = await api.getRequestMatches(id);
        setMatches(matchRes.matches);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
    const interval = setInterval(fetchDetails, 15000); // 15s refresh
    return () => clearInterval(interval);
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto my-16 text-center text-xs text-slate-500">
        Loading emergency request status...
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="max-w-md mx-auto my-16 bg-rose-50 border border-rose-200 p-4 rounded-xl text-xs text-rose-800 text-center">
        {error || 'Request not found.'}
      </div>
    );
  }

  // Markers for Leaflet Map
  const mapCenter: [number, number] = [request.lat || 19.0519, request.lng || 72.8295];
  const mapMarkers = [
    {
      lat: request.lat || 19.0519,
      lng: request.lng || 72.8295,
      title: request.hospital_name || 'Hospital',
      subtitle: `${request.blood_group} (${request.units_needed} units required)`,
      type: 'hospital' as const,
    },
    ...matches.map(m => ({
      lat: m.lat || (request.lat + 0.009),
      lng: m.lng || (request.lng + 0.009),
      title: m.full_name,
      subtitle: m.is_contact_revealed ? `Accepted Donor: ${m.phone}` : 'Privacy Protected',
      type: m.is_contact_revealed ? ('donor' as const) : ('approx_donor' as const),
    })),
  ];

  return (
    <div className="max-w-5xl mx-auto my-10 px-4 space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-brand-50 border border-brand-200 flex flex-col items-center justify-center">
            <span className="text-xl font-black text-brand-700 leading-none">{request.blood_group}</span>
            <span className="text-[10px] uppercase font-bold text-slate-500 mt-0.5">{request.component.replace('_', ' ')}</span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-slate-900">Request #{request.id}</h1>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                  request.status === 'fulfilled'
                    ? 'bg-emerald-100 text-emerald-800'
                    : request.status === 'verified'
                    ? 'bg-blue-100 text-blue-800'
                    : request.status === 'pending'
                    ? 'bg-amber-100 text-amber-800 animate-pulse'
                    : 'bg-slate-100 text-slate-800'
                }`}
              >
                {request.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center space-x-2">
              <span className="font-semibold text-slate-700">Patient: {request.patient_name}</span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{request.hospital_name}</span>
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-right">
            <span className="text-[10px] text-slate-400 block font-semibold uppercase">Requirement</span>
            <strong className="text-sm font-bold text-slate-900">{request.units_needed} Unit(s)</strong>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-right">
            <span className="text-[10px] text-slate-400 block font-semibold uppercase">Deadline</span>
            <strong className="text-xs font-semibold text-slate-700">
              {new Date(request.required_by).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </strong>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Status Timeline */}
        <div className="lg:col-span-1 space-y-4">
          <StatusTimeline
            status={request.status}
            timeline={request.timeline}
            doctorNotes={request.doctor_notes}
            rejectionReason={request.rejection_reason}
          />

          {/* Central Stock Reference Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2">
            <h4 className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">
              Need Central Blood Stock?
            </h4>
            <p className="text-slate-500 text-[11px] leading-relaxed">
              If real-time matching is ongoing, you can simultaneously check centralized hospital stock reserves on e-RaktKosh:
            </p>
            <a
              href="https://eraktkosh.mohfw.gov.in"
              target="_blank"
              rel="noreferrer"
              className="text-brand-600 font-semibold hover:underline inline-flex items-center text-[11px]"
            >
              Visit e-RaktKosh Portal <ExternalLink className="w-3 h-3 ml-1" />
            </a>
          </div>
        </div>

        {/* Right: Matched Donors (Strict Privacy Demo) & Live Map */}
        <div className="lg:col-span-2 space-y-6">
          {/* Leaflet Map Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-xs text-slate-900 flex items-center space-x-1.5">
                <MapPin className="w-4 h-4 text-brand-600" />
                <span>Hospital & Donor Matching Map</span>
              </h3>
              <span className="text-[11px] text-slate-400">
                {request.status === 'pending'
                  ? 'Broadcast inactive (Awaiting Doctor Verification)'
                  : `${matches.length} Nearby Donors In Range`}
              </span>
            </div>
            <LeafletMap center={mapCenter} zoom={13} markers={mapMarkers} className="h-64 w-full" />
            <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
              <span className="flex items-center space-x-1">
                <span>🏥</span>
                <span>Hospital Location</span>
              </span>
              <span className="flex items-center space-x-1">
                <span className="inline-block w-3 h-3 rounded-full bg-blue-200 border border-blue-400"></span>
                <span>Approximate Area (Privacy Masked)</span>
              </span>
              <span className="flex items-center space-x-1">
                <span>🩸</span>
                <span>Accepted Donor Pin</span>
              </span>
            </div>
          </div>

          {/* Privacy-Gated Matched Donors Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Nearby Compatible Donors</h3>
                <p className="text-xs text-slate-500">
                  Privacy-by-Design: Direct phone contact remains locked until a donor voluntarily accepts.
                </p>
              </div>
              <span className="text-xs bg-slate-100 px-2.5 py-1 rounded-full text-slate-700 font-semibold">
                {matches.length} Matched
              </span>
            </div>

            {request.status === 'pending' ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 flex items-center space-x-3">
                <Clock className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <strong>Doctor Verification Queue Active:</strong>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    This request is currently under review by Dr. Ananya Sharma. Matching notifications will dispatch immediately once verified.
                  </p>
                </div>
              </div>
            ) : matches.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                Searching for compatible donors within extended radius...
              </div>
            ) : (
              <div className="space-y-3">
                {matches.map(m => (
                  <div
                    key={m.donor_id}
                    className={`rounded-xl border p-4 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      m.is_contact_revealed
                        ? 'border-emerald-300 bg-emerald-50/50'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-300 flex items-center justify-center font-bold text-slate-800 text-xs">
                        {m.blood_group}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="text-xs font-bold text-slate-900">{m.full_name}</h4>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.2 rounded ${
                              m.match_status === 'accepted'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {m.match_status === 'accepted' ? 'Accepted' : 'Notified (~' + m.distance_km + ' km)'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Location: {m.approx_area} • Status: {m.status_label}
                        </p>
                      </div>
                    </div>

                    {/* Contact Privacy Box */}
                    <div className="flex items-center space-x-2 text-xs">
                      {m.is_contact_revealed ? (
                        <div className="bg-emerald-100 border border-emerald-300 text-emerald-900 px-3 py-1.5 rounded-lg flex items-center space-x-1.5 font-bold">
                          <Phone className="w-3.5 h-3.5 text-emerald-700" />
                          <span>{m.phone}</span>
                          <span className="text-[10px] bg-emerald-200 text-emerald-900 px-1 rounded ml-1">UNLOCKED</span>
                        </div>
                      ) : (
                        <div className="bg-slate-100 border border-slate-200 text-slate-500 px-3 py-1.5 rounded-lg flex items-center space-x-1.5">
                          <Lock className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-[11px] font-mono">🔒 Locked until accepted</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
