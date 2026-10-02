import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../../services/api';
import { Hospital } from '../../types';
import { Activity, ShieldAlert, Sparkles, AlertCircle, Clock, MapPin } from 'lucide-react';
import { EmergencyIntakeModal } from '../../components/ai/EmergencyIntakeModal';

export const CreateRequest: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [isIntakeOpen, setIsIntakeOpen] = useState(false);

  // Form State
  const [patientName, setPatientName] = useState('');
  const [hospitalId, setHospitalId] = useState('hosp-101');
  const [bloodGroup, setBloodGroup] = useState('O-');
  const [component, setComponent] = useState<'whole_blood' | 'packed_rbc' | 'platelets' | 'plasma'>('whole_blood');
  const [unitsNeeded, setUnitsNeeded] = useState(2);
  const [urgency, setUrgency] = useState<'critical_immediate' | 'urgent_within_24h' | 'planned'>('critical_immediate');
  const [requiredBy, setRequiredBy] = useState(
    new Date(Date.now() + 4 * 3600000).toISOString().slice(0, 16)
  );

  const [error, setError] = useState<string | null>(null);
  const [duplicateAlert, setDuplicateAlert] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getHospitals()
      .then(res => setHospitals(res.hospitals))
      .catch(err => console.warn(err));

    // Check if initial AI draft was passed via navigation
    const initialDraft = (location.state as any)?.initialDraft;
    if (initialDraft) {
      applyDraft(initialDraft);
    }
  }, [location.state]);

  const applyDraft = (draft: any) => {
    if (draft.patient_name) setPatientName(draft.patient_name);
    if (draft.blood_group) setBloodGroup(draft.blood_group);
    if (draft.component) setComponent(draft.component);
    if (draft.units_needed) setUnitsNeeded(draft.units_needed);
    if (draft.urgency) setUrgency(draft.urgency);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setDuplicateAlert(null);
    setLoading(true);

    try {
      const res = await api.createRequest({
        patient_name: patientName,
        hospital_id: hospitalId,
        blood_group: bloodGroup,
        component,
        units_needed: unitsNeeded,
        urgency,
        required_by: new Date(requiredBy).toISOString(),
      });

      alert(res.message);
      navigate(`/requests/${res.request.id}`);
    } catch (err: any) {
      if (err.message && err.message.includes('Duplicate request detected')) {
        setDuplicateAlert(err);
      } else {
        setError(err.message || 'Failed to submit request');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto my-10 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse"></span>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Emergency Blood Request</h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Submitted requests are routed to the attending doctor queue before donor broadcast
          </p>
        </div>

        {/* AI Fast Intake Trigger */}
        <button
          type="button"
          onClick={() => setIsIntakeOpen(true)}
          className="bg-brand-50 hover:bg-brand-100 text-brand-700 border border-brand-200 text-xs font-semibold px-3 py-2 rounded-xl flex items-center space-x-1.5 transition-colors shadow-2xs"
        >
          <Sparkles className="w-4 h-4 text-brand-600" />
          <span>AI Voice / Fast Intake</span>
        </button>
      </div>

      {/* Mandatory Doctor Verification Warning */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start space-x-3 text-xs text-amber-900">
        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="block font-semibold">Medical Verification Required:</strong>
          <p className="leading-relaxed text-amber-800 text-[11px]">
            To eliminate hoaxes and panic broadcasts, LifeLink only alerts donors once the hospital physician verifies patient admission and crossmatch requisitions.
          </p>
        </div>
      </div>

      {/* Duplicate Alert */}
      {duplicateAlert && (
        <div className="bg-rose-50 border border-rose-300 rounded-xl p-4 text-xs text-rose-900 space-y-2">
          <div className="flex items-center space-x-2 font-bold text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>Duplicate Request Alert</span>
          </div>
          <p>{duplicateAlert.message}</p>
          {duplicateAlert.existingRequestId && (
            <button
              onClick={() => navigate(`/requests/${duplicateAlert.existingRequestId}`)}
              className="text-xs font-semibold text-rose-700 underline block"
            >
              View Existing Active Request #{duplicateAlert.existingRequestId} →
            </button>
          )}
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Patient Full Name</label>
            <input
              type="text"
              required
              value={patientName}
              onChange={e => setPatientName(e.target.value)}
              placeholder="e.g. Suresh Deshmukh"
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-1 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Admitted Hospital</label>
            <select
              value={hospitalId}
              onChange={e => setHospitalId(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-1 focus:ring-brand-500 focus:outline-none"
            >
              {hospitals.map(h => (
                <option key={h.id} value={h.id}>{h.name} ({h.city})</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Required Blood Group</label>
            <select
              value={bloodGroup}
              onChange={e => setBloodGroup(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white font-bold text-brand-700 focus:ring-1 focus:ring-brand-500 focus:outline-none"
            >
              {['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'].map(bg => (
                <option key={bg} value={bg}>{bg}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Component Needed</label>
            <select
              value={component}
              onChange={e => setComponent(e.target.value as any)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-1 focus:ring-brand-500 focus:outline-none"
            >
              <option value="whole_blood">Whole Blood</option>
              <option value="packed_rbc">Packed RBC</option>
              <option value="platelets">Platelets (SDP/RDP)</option>
              <option value="plasma">Fresh Frozen Plasma (FFP)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Units Required</label>
            <input
              type="number"
              min={1}
              max={10}
              required
              value={unitsNeeded}
              onChange={e => setUnitsNeeded(parseInt(e.target.value, 10))}
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-1 focus:ring-brand-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Urgency Classification</label>
            <select
              value={urgency}
              onChange={e => setUrgency(e.target.value as any)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-1 focus:ring-brand-500 focus:outline-none"
            >
              <option value="critical_immediate">Critical / Immediate (Active OT / Trauma)</option>
              <option value="urgent_within_24h">Urgent (Within 24 Hours)</option>
              <option value="planned">Planned (Elective Surgery)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Required By (Deadline)</label>
            <input
              type="datetime-local"
              required
              value={requiredBy}
              onChange={e => setRequiredBy(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-1 focus:ring-brand-500 focus:outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold text-xs py-3 rounded-xl transition-colors shadow-sm"
        >
          {loading ? 'Submitting to Doctor Queue...' : 'Submit for Doctor Verification'}
        </button>
      </form>

      {/* AI Modal */}
      <EmergencyIntakeModal
        isOpen={isIntakeOpen}
        onClose={() => setIsIntakeOpen(false)}
        onApplyDraft={applyDraft}
      />
    </div>
  );
};
