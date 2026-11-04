import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { CoordinatorLog } from '../../types';
import { Users, FileText, CheckCircle2, ShieldAlert, History } from 'lucide-react';

export const CoordinatorLogView: React.FC = () => {
  const [logs, setLogs] = useState<CoordinatorLog[]>([]);
  const [patientId, setPatientId] = useState('');
  const [familyMembers, setFamilyMembers] = useState('');
  const [notes, setNotes] = useState('');
  const [nottoNotified, setNottoNotified] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchLogs = async () => {
    try {
      const res = await api.getCoordinatorLogs();
      setLogs(res.logs);
    } catch (err: any) {
      console.warn(err);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMsg(null);
    try {
      const res = await api.logCoordinatorConversation({
        patient_identifier: patientId,
        family_members_present: familyMembers,
        outcome_notes: notes,
        notto_notified: nottoNotified,
      });

      setSuccessMsg(res.message);
      setPatientId('');
      setFamilyMembers('');
      setNotes('');
      fetchLogs();
    } catch (err: any) {
      alert('Failed to log conversation: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto my-10 px-4 space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex items-center space-x-3.5">
        <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center">
          <Users className="w-6 h-6 text-brand-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-900">Hospital Transplant Coordinator Log</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Log grief counseling and family consent awareness sessions. strictly no recipient matching or allocation logic.
          </p>
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start space-x-2 text-xs text-amber-900">
        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p>
          <strong>Hospital Record Only:</strong> LifeLink transplant coordinator logs are administrative and awareness notes. Organ retrieval and recipient allocation are carried out solely through official ROTTO / NOTTO regulatory mechanisms.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-900 pb-2 border-b border-slate-100 flex items-center space-x-2">
            <FileText className="w-4 h-4 text-slate-600" />
            <span>Record Family Counseling Session</span>
          </h3>

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs p-3 rounded-lg flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Patient Hospital ID / Bed Tag</label>
              <input
                type="text"
                required
                value={patientId}
                onChange={e => setPatientId(e.target.value)}
                placeholder="e.g. PAT-ICU-8821"
                className="w-full border border-slate-300 rounded-lg p-2.5"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Family Members Present</label>
              <input
                type="text"
                required
                value={familyMembers}
                onChange={e => setFamilyMembers(e.target.value)}
                placeholder="e.g. Spouse, eldest daughter, and brother"
                className="w-full border border-slate-300 rounded-lg p-2.5"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Counseling & Awareness Outcome Notes</label>
              <textarea
                rows={4}
                required
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Document family understanding, questions addressed, and NOTTO informational pamphlet provided..."
                className="w-full border border-slate-300 rounded-lg p-2.5"
              />
            </div>

            <label className="flex items-center space-x-2 text-slate-700">
              <input
                type="checkbox"
                checked={nottoNotified}
                onChange={e => setNottoNotified(e.target.checked)}
                className="rounded border-slate-300 text-brand-600"
              />
              <span>NOTTO nodal coordinator informed of potential brain-stem death evaluation</span>
            </label>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl transition-colors"
            >
              {loading ? 'Recording...' : 'Log Coordinator Conversation'}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-900 pb-2 border-b border-slate-100 flex items-center space-x-2">
            <History className="w-4 h-4 text-slate-500" />
            <span>Hospital Conversation Log History</span>
          </h3>

          <div className="space-y-3">
            {logs.map(log => (
              <div
                key={log.id}
                className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1 text-xs"
              >
                <div className="flex items-center justify-between font-bold text-slate-900">
                  <span>{log.patient_identifier}</span>
                  <span className="text-[10px] text-slate-400">
                    {new Date(log.conversation_date).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Coordinator: {log.coordinator_name || 'Dr. Ananya Sharma'} • Present: {log.family_members_present}
                </p>
                <p className="text-[11px] text-slate-700 leading-relaxed mt-1">"{log.outcome_notes}"</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
