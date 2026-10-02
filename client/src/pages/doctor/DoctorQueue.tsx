import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { BloodRequest } from '../../types';
import {
  Stethoscope,
  ShieldCheck,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  MapPin,
  FileCheck,
  User,
} from 'lucide-react';

export const DoctorQueue: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [filter, setFilter] = useState<'pending' | 'verified' | 'all'>('pending');
  const [loading, setLoading] = useState(true);

  // Verification modal state
  const [selectedReq, setSelectedReq] = useState<BloodRequest | null>(null);
  const [doctorNotes, setDoctorNotes] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Rejection modal state
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchRequests = async () => {
    try {
      const res = await api.getRequests();
      setRequests(res.requests);
    } catch (err: any) {
      console.warn('Error loading queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleVerify = async () => {
    if (!selectedReq) return;
    setIsVerifying(true);
    try {
      const res = await api.verifyRequest(selectedReq.id, doctorNotes);
      alert(res.message);
      setSelectedReq(null);
      setDoctorNotes('');
      fetchRequests();
    } catch (err: any) {
      alert('Verification failed: ' + err.message);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleReject = async () => {
    if (!selectedReq) return;
    setIsRejecting(true);
    try {
      await api.rejectRequest(selectedReq.id, rejectionReason);
      alert('Request rejected.');
      setSelectedReq(null);
      setRejectionReason('');
      fetchRequests();
    } catch (err: any) {
      alert('Rejection failed: ' + err.message);
    } finally {
      setIsRejecting(false);
    }
  };

  const filteredRequests = requests.filter(r => {
    if (filter === 'pending') return r.status === 'pending';
    if (filter === 'verified') return r.status === 'verified';
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto my-10 px-4 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center">
            <Stethoscope className="w-6 h-6 text-brand-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-bold text-slate-900">Doctor Verification Queue</h1>
              <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded border border-slate-300">
                Hospital Verifier Portal
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Review patient admission & blood requisitions. Unverified requests are never broadcast to donors.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to="/doctor/log-donation"
            className="bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-2xs flex items-center space-x-1.5"
          >
            <FileCheck className="w-4 h-4" />
            <span>Log Verified Donation</span>
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-3 text-xs font-semibold">
        <button
          onClick={() => setFilter('pending')}
          className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 ${
            filter === 'pending'
              ? 'bg-amber-100 text-amber-900 border border-amber-300'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-amber-600" />
          <span>Pending Verification ({requests.filter(r => r.status === 'pending').length})</span>
        </button>

        <button
          onClick={() => setFilter('verified')}
          className={`px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1.5 ${
            filter === 'verified'
              ? 'bg-blue-100 text-blue-900 border border-blue-300'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <CheckCircle className="w-3.5 h-3.5 text-blue-600" />
          <span>Active Broadcasts ({requests.filter(r => r.status === 'verified').length})</span>
        </button>

        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg transition-colors ${
            filter === 'all'
              ? 'bg-slate-200 text-slate-900'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          All Requests ({requests.length})
        </button>
      </div>

      {/* Queue List */}
      {filteredRequests.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-400 space-y-2">
          <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto" />
          <p className="font-semibold text-slate-700">Verification Queue is Clear</p>
          <p>No requests requiring attention under this filter.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map(req => (
            <div
              key={req.id}
              className={`bg-white rounded-2xl border p-5 shadow-sm space-y-4 transition-colors ${
                req.status === 'pending' ? 'border-amber-300 ring-1 ring-amber-200' : 'border-slate-200'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3.5">
                  <div className="w-12 h-12 rounded-xl bg-brand-50 border border-brand-200 flex flex-col items-center justify-center font-bold text-brand-700">
                    <span className="text-base">{req.blood_group}</span>
                    <span className="text-[9px] uppercase text-slate-500 font-semibold">{req.component.replace('_', ' ')}</span>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-bold text-sm text-slate-900">
                        {req.patient_name}
                      </h3>
                      <span className="text-xs text-slate-500 font-semibold">
                        ({req.units_needed} Units Required)
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          req.urgency === 'critical_immediate'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {req.urgency.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 flex items-center space-x-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{req.hospital_name || 'Hospital'}</span>
                      <span>•</span>
                      <span>Attendant: {req.requester_name} ({req.requester_phone})</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-xs">
                  {req.status === 'pending' ? (
                    <>
                      <button
                        onClick={() => {
                          setSelectedReq(req);
                          setDoctorNotes('Verified clinical requisition & admission bed. Authorized for nearby donor matching.');
                        }}
                        className="bg-brand-600 hover:bg-brand-700 text-white font-semibold px-4 py-2 rounded-xl transition-colors shadow-2xs flex items-center space-x-1.5"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Verify & Broadcast</span>
                      </button>
                      <button
                        onClick={() => {
                          setSelectedReq(req);
                          setRejectionReason('Incomplete transfusion documentation.');
                        }}
                        className="text-rose-700 hover:bg-rose-50 border border-rose-200 px-3 py-2 rounded-xl font-medium"
                      >
                        Reject
                      </button>
                    </>
                  ) : (
                    <Link
                      to={`/requests/${req.id}`}
                      className="text-brand-600 hover:underline font-semibold"
                    >
                      View Live Matches →
                    </Link>
                  )}
                </div>
              </div>

              {req.doctor_notes && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs text-slate-700 flex items-start space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <p>
                    <strong className="text-slate-900">Physician Note: </strong>
                    {req.doctor_notes}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Verification Modal */}
      {selectedReq && !rejectionReason && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full space-y-4 border border-slate-200 shadow-xl">
            <div className="flex items-center space-x-2 text-slate-900">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-base">Physician Medical Verification</h3>
            </div>

            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs space-y-1">
              <div><strong>Patient:</strong> {selectedReq.patient_name} ({selectedReq.blood_group} {selectedReq.component})</div>
              <div><strong>Hospital:</strong> {selectedReq.hospital_name}</div>
              <div><strong>Units Needed:</strong> {selectedReq.units_needed} Unit(s)</div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Physician Clinical Notes & Confirmation
              </label>
              <textarea
                rows={3}
                value={doctorNotes}
                onChange={e => setDoctorNotes(e.target.value)}
                placeholder="Confirm patient bed, crossmatch order, or urgency indications..."
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-1 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedReq(null)}
                className="text-xs text-slate-500 px-4 py-2"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isVerifying}
                onClick={handleVerify}
                className="bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs px-5 py-2 rounded-xl transition-colors shadow-2xs"
              >
                {isVerifying ? 'Broadcasting...' : 'Confirm Verification & Broadcast to Donors'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {selectedReq && rejectionReason && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 border border-slate-200 shadow-xl">
            <h3 className="font-bold text-base text-rose-800">Reject Emergency Request</h3>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              placeholder="State reason for rejecting request..."
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5"
            />
            <div className="flex justify-end space-x-2">
              <button onClick={() => setSelectedReq(null)} className="text-xs text-slate-500 px-3 py-1.5">Cancel</button>
              <button onClick={handleReject} disabled={isRejecting} className="bg-rose-600 text-white text-xs font-semibold px-4 py-1.5 rounded-lg">
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
