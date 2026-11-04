import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import {
  ShieldAlert,
  Stethoscope,
  Check,
  X,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
} from 'lucide-react';
import { StatusBadge } from '../../components/common/StatusBadge';

export const AdminDashboard = () => {
  const { user } = useAuth();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Reject modal state
  const [rejectingDoctorId, setRejectingDoctorId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDoctors = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      else setIsRefreshing(true);
      const res = await api.getAdminDoctors();
      setDoctors(res.doctors || []);
      setError(null);
    } catch (err) {
      if (!isBackground) setError(err.message || 'Failed to fetch doctor accounts');
    } finally {
      if (!isBackground) setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDoctors(false);

    // Real-time synchronization: poll every 4 seconds for newly registered doctors
    const interval = setInterval(() => {
      fetchDoctors(true);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const handleApprove = async (doctorId) => {
    setActionLoading(true);
    try {
      await api.approveDoctor(doctorId);
      await fetchDoctors(true);
      alert('Doctor account approved. The physician can now access the Doctor Verification Queue.');
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    if (!rejectingDoctorId || !rejectionReason.trim()) return;
    setActionLoading(true);
    try {
      await api.rejectDoctor(rejectingDoctorId, rejectionReason.trim());
      setRejectingDoctorId(null);
      setRejectionReason('');
      await fetchDoctors(true);
      alert('Doctor account rejected.');
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '80px 16px', textAlign: 'center' }}>
        <div className="spinner" />
        <p style={{ marginTop: '16px', color: 'var(--color-slate-500)', fontSize: '13px' }}>
          Loading doctor verification requests...
        </p>
      </div>
    );
  }

  return (
    <div className="container my-8">
      {/* Admin Header */}
      <div className="card mb-6">
        <div className="card-body flex-between" style={{ flexWrap: 'wrap', gap: '16px' }}>
          <div className="flex items-center gap-4">
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--color-slate-900)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShieldAlert size={26} color="#fbbf24" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 style={{ fontSize: '20px', fontWeight: '800' }}>Platform Administration</h1>
                <span className="badge badge-role">ADMIN</span>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--color-slate-500)', marginTop: '3px' }}>
                Doctor Credential Approval & Gating Portal
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                color: 'var(--color-slate-600)',
                backgroundColor: 'var(--color-slate-100)',
                padding: '6px 12px',
                borderRadius: 'var(--radius-full)',
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#10b981',
                  boxShadow: '0 0 6px #10b981',
                  display: 'inline-block',
                }}
              />
              Live Sync (4s)
            </div>

            <button
              onClick={() => fetchDoctors(true)}
              className="btn btn-outline btn-sm flex items-center gap-2"
              disabled={isRefreshing}
            >
              <RotateCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
              {isRefreshing ? 'Syncing...' : 'Refresh'}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      )}

      {/* Doctor Accounts Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <Stethoscope size={18} color="var(--color-primary)" />
            Hospital Doctor Registrations
          </h3>
          <span style={{ fontSize: '12px', color: 'var(--color-slate-500)' }}>
            {doctors.length} doctor account(s) registered
          </span>
        </div>

        <div className="card-body" style={{ padding: 0 }}>
          {doctors.length === 0 ? (
            <div className="empty-state">
              <p>No doctor accounts registered yet.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-slate-200)', backgroundColor: 'var(--color-slate-50)' }}>
                    <th style={{ padding: '12px 16px' }}>Doctor Name</th>
                    <th style={{ padding: '12px 16px' }}>Medical License</th>
                    <th style={{ padding: '12px 16px' }}>Hospital Affiliation</th>
                    <th style={{ padding: '12px 16px' }}>Contact</th>
                    <th style={{ padding: '12px 16px' }}>Status</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {doctors.map((doc) => (
                    <tr key={doc.id} style={{ borderBottom: '1px solid var(--color-slate-100)' }}>
                      <td style={{ padding: '12px 16px', fontWeight: '700' }}>
                        {doc.full_name}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <code style={{ backgroundColor: 'var(--color-slate-100)', padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>
                          {doc.medical_license_number}
                        </code>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div>{doc.hospital_name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--color-slate-500)' }}>{doc.hospital_city || doc.city}</div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div>{doc.email}</div>
                        <div style={{ fontSize: '11px', color: 'var(--color-slate-500)' }}>{doc.phone}</div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <StatusBadge status={doc.approval_status} />
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        {doc.approval_status === 'pending' ? (
                          <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
                            <button
                              className="btn btn-success btn-sm"
                              onClick={() => handleApprove(doc.id)}
                              disabled={actionLoading}
                            >
                              <Check size={14} /> Approve
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => setRejectingDoctorId(doc.id)}
                              disabled={actionLoading}
                            >
                              <X size={14} /> Reject
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '12px', color: 'var(--color-slate-500)' }}>
                            {doc.approval_status === 'verified' ? 'Approved' : 'Rejected'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Reject Reason Modal */}
      {rejectingDoctorId && (
        <div className="modal-backdrop" onClick={() => setRejectingDoctorId(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ color: 'var(--color-primary)' }}>
                Reject Doctor Account
              </h3>
              <button className="modal-close-btn" onClick={() => setRejectingDoctorId(null)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleReject}>
              <div className="modal-body">
                <p style={{ fontSize: '13px', color: 'var(--color-slate-600)', marginBottom: '14px' }}>
                  Please state the reason for rejecting this doctor registration (e.g. invalid license number, unable to verify hospital registry).
                </p>

                <div className="form-group">
                  <label className="form-label" htmlFor="adminRejectReason">
                    Rejection Reason
                  </label>
                  <textarea
                    id="adminRejectReason"
                    className="form-control"
                    rows={3}
                    placeholder="Enter rejection reason..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setRejectingDoctorId(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-danger btn-sm"
                  disabled={actionLoading || !rejectionReason.trim()}
                >
                  {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

