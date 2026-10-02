import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { BloodRequest, ImpactMetrics } from '../types';
import {
  Heart,
  Activity,
  UserCheck,
  Stethoscope,
  ShieldCheck,
  Clock,
  ExternalLink,
  ChevronRight,
  Bot,
  MapPin,
  Sparkles,
} from 'lucide-react';
import { AiAssistantModal } from '../components/ai/AiAssistantModal';
import { EmergencyIntakeModal } from '../components/ai/EmergencyIntakeModal';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [metrics, setMetrics] = useState<ImpactMetrics | null>(null);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isIntakeModalOpen, setIsIntakeModalOpen] = useState(false);

  useEffect(() => {
    // Load active verified requests
    api.getRequests()
      .then(res => setRequests(res.requests.slice(0, 4)))
      .catch(err => console.warn('Could not load live requests:', err));

    // Load impact metrics
    api.getImpactMetrics()
      .then(res => setMetrics(res.metrics))
      .catch(err => console.warn('Could not load metrics:', err));
  }, []);

  const handleApplyDraft = (draft: any) => {
    // Navigate to create request with drafted state
    navigate('/requests/new', { state: { initialDraft: draft } });
  };

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Section: Emergency-First Design */}
      <section className="relative bg-gradient-to-b from-brand-50/60 via-white to-slate-50 border-b border-slate-200 pt-10 pb-16 px-4">
        <div className="max-w-6xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center space-x-2 bg-white border border-brand-200 px-3.5 py-1.5 rounded-full shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-xs font-semibold text-slate-800">Doctor-Supervised Coordination Infrastructure</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight">
            Verified Emergency Matching for{' '}
            <span className="text-brand-600 underline decoration-brand-200">Blood & Organ Pledges</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            LifeLink bridges acute hospital blood bank deficits with verified volunteer donors. All requests undergo mandatory physician verification before donor dispatch.
          </p>

          {/* TWO PRIMARY ACTIONS (PRD REQUIREMENT) */}
          <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
            {/* Big Action 1: I Need Blood */}
            <div className="bg-white rounded-2xl p-6 border-2 border-brand-600 shadow-lg text-left flex flex-col justify-between space-y-4 hover:border-brand-700 transition-all">
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-xl bg-brand-600 text-white flex items-center justify-center shadow-sm">
                  <Activity className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">I Need Blood</h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Attendants or patients: register an emergency blood or component requirement for doctor verification.
                </p>
              </div>

              <div className="space-y-2">
                <Link
                  to="/requests/new"
                  className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm py-3 px-4 rounded-xl flex items-center justify-center space-x-2 shadow-sm transition-colors"
                >
                  <span>Create Emergency Request</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
                <button
                  type="button"
                  onClick={() => setIsIntakeModalOpen(true)}
                  className="w-full text-center text-xs font-semibold text-brand-700 hover:text-brand-800 py-1.5 flex items-center justify-center space-x-1"
                >
                  <Sparkles className="w-3.5 h-3.5 text-brand-600" />
                  <span>Use Voice / AI Fast Intake</span>
                </button>
              </div>
            </div>

            {/* Big Action 2: I Want to Donate */}
            <div className="bg-white rounded-2xl p-6 border-2 border-slate-300 shadow-lg text-left flex flex-col justify-between space-y-4 hover:border-slate-400 transition-all">
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-sm">
                  <UserCheck className="w-6 h-6 text-brand-400" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">I Want to Donate</h2>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Volunteer donors: register blood group, manage availability, and check cooldown intervals.
                </p>
              </div>

              <div className="space-y-2">
                <Link
                  to="/donor/dashboard"
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm py-3 px-4 rounded-xl flex items-center justify-center space-x-2 shadow-sm transition-colors"
                >
                  <span>Donor Dashboard & Availability</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/register?role=donor"
                  className="w-full text-center text-xs font-semibold text-slate-700 hover:text-slate-900 py-1.5 block"
                >
                  New Donor? Register Here (OTP Login)
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Official Government Stock Links Bar */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3 text-slate-800">
            <span className="text-xl">🏛️</span>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Official National Portals</h4>
              <p className="text-xs text-slate-700">Check government stock availability before emergency dispatch:</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <a
              href="https://eraktkosh.mohfw.gov.in"
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 px-3.5 py-2 rounded-lg border border-slate-300 flex items-center space-x-1.5 transition-colors"
            >
              <span>e-RaktKosh Central Stock</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <a
              href="https://notto.mohfw.gov.in"
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 px-3.5 py-2 rounded-lg border border-slate-300 flex items-center space-x-1.5 transition-colors"
            >
              <span>NOTTO Organ Registry</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </section>

      {/* Live Impact Stats */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Active Donors (City Pool)</span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">
              {metrics ? metrics.activeDonors : '45'}
            </span>
            <span className="text-[10px] text-emerald-700 font-medium">● Available for immediate matching</span>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Average Match Response</span>
            <span className="text-2xl font-bold text-brand-600 mt-1 block">
              ~{metrics ? metrics.averageResponseTimeMins : '14.2'} min
            </span>
            <span className="text-[10px] text-slate-500 font-medium">From doctor verify to donor accept</span>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Units Coordinated</span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">
              {metrics ? metrics.totalUnitsCoordinated : '18'} Units
            </span>
            <span className="text-[10px] text-slate-500 font-medium">Doctor-verified phlebotomy</span>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Unverified Broadcasts</span>
            <span className="text-2xl font-bold text-emerald-700 mt-1 block">0 (Strictly Zero)</span>
            <span className="text-[10px] text-slate-500 font-medium">Physician screening mandatory</span>
          </div>
        </div>
      </section>

      {/* Live Verified Emergency Requests Feed */}
      <section className="max-w-6xl mx-auto px-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Verified Emergency Broadcasts</h3>
            <p className="text-xs text-slate-500">Only doctor-approved requests are visible to matching donors</p>
          </div>
          <Link to="/requests" className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center space-x-1">
            <span>View All Requests</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {requests.map(req => (
            <div
              key={req.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-colors space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-xl bg-brand-50 border border-brand-200 flex flex-col items-center justify-center">
                    <span className="text-base font-black text-brand-700 leading-none">{req.blood_group}</span>
                    <span className="text-[9px] uppercase font-bold text-slate-500 mt-0.5">{req.component.replace('_', ' ')}</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{req.patient_name}</h4>
                    <p className="text-xs text-slate-500 flex items-center space-x-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{req.hospital_name || 'Lilavati Hospital'}</span>
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end space-y-1">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      req.urgency === 'critical_immediate'
                        ? 'bg-rose-100 text-rose-800 border border-rose-300'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {req.urgency.replace('_', ' ')}
                  </span>
                  <span className="text-xs text-slate-500 font-semibold">{req.units_needed} Unit(s)</span>
                </div>
              </div>

              {req.doctor_notes && (
                <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5 text-xs text-slate-700 flex items-start space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="line-clamp-2">
                    <strong className="text-slate-900">Dr. Clearance: </strong>
                    {req.doctor_notes}
                  </p>
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-1 text-slate-400 text-[11px]">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Required by: {new Date(req.required_by).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <Link
                  to={`/requests/${req.id}`}
                  className="font-semibold text-brand-600 hover:text-brand-700 flex items-center space-x-1"
                >
                  <span>View Status Timeline</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Platform Positioning & How It Works */}
      <section className="max-w-6xl mx-auto px-4 pt-6">
        <div className="bg-slate-900 text-white rounded-2xl p-8 space-y-8">
          <div className="max-w-2xl space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-400">Strict Safety Protocol</span>
            <h3 className="text-2xl font-bold tracking-tight">How LifeLink Verified Coordination Works</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Engineered with medical supervision and privacy by design at every step.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-xs">
            <div className="space-y-2 bg-slate-800/60 p-4 rounded-xl border border-slate-700">
              <span className="text-brand-400 font-bold text-sm">01</span>
              <h4 className="font-semibold text-slate-100 text-sm">Emergency Intake</h4>
              <p className="text-slate-400 leading-relaxed">
                Attendant submits request or uses AI voice intake. Duplicate detection prevents redundant alarms.
              </p>
            </div>
            <div className="space-y-2 bg-slate-800/60 p-4 rounded-xl border border-slate-700">
              <span className="text-brand-400 font-bold text-sm">02</span>
              <h4 className="font-semibold text-slate-100 text-sm">Doctor Verification</h4>
              <p className="text-slate-400 leading-relaxed">
                Hospital physician reviews clinical indication and crossmatch form. Unverified requests are NEVER broadcast.
              </p>
            </div>
            <div className="space-y-2 bg-slate-800/60 p-4 rounded-xl border border-slate-700">
              <span className="text-brand-400 font-bold text-sm">03</span>
              <h4 className="font-semibold text-slate-100 text-sm">Privacy-Safe Matching</h4>
              <p className="text-slate-400 leading-relaxed">
                Nearby donors matched by compatibility & distance. Phone numbers remain completely masked prior to acceptance.
              </p>
            </div>
            <div className="space-y-2 bg-slate-800/60 p-4 rounded-xl border border-slate-700">
              <span className="text-brand-400 font-bold text-sm">04</span>
              <h4 className="font-semibold text-slate-100 text-sm">Logged Fulfilment</h4>
              <p className="text-slate-400 leading-relaxed">
                Attending physician confirms on-site phlebotomy, resets donor cooldown interval, and generates permanent audit log.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Floating AI Assistant Trigger Button */}
      <button
        onClick={() => setIsAiModalOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-brand-600 hover:bg-brand-700 text-white p-3.5 rounded-full shadow-2xl flex items-center space-x-2 border-2 border-white transition-all transform hover:scale-105"
        title="Open LifeLink Multilingual Assistant (English, Hindi, Marathi)"
      >
        <Bot className="w-5 h-5" />
        <span className="text-xs font-semibold pr-1 hidden sm:inline">Ask LifeLink AI</span>
      </button>

      {/* Modals */}
      <AiAssistantModal isOpen={isAiModalOpen} onClose={() => setIsAiModalOpen(false)} />
      <EmergencyIntakeModal
        isOpen={isIntakeModalOpen}
        onClose={() => setIsIntakeModalOpen(false)}
        onApplyDraft={handleApplyDraft}
      />
    </div>
  );
};
