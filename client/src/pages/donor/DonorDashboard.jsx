import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import {
  Heart,
  Calendar,
  Clock,
  ShieldCheck,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Upload,
  Eye,
  PlusCircle,
  Check,
  X,
} from 'lucide-react';
import { StatusBadge } from '../../components/common/StatusBadge';
import { DocumentViewerModal } from '../../components/common/DocumentViewerModal';
import { CreateRequestModal } from '../shared/CreateRequestModal';

export const DonorDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Document viewer modal
  const [viewingDoc, setViewingDoc] = useState(null);

  // Re-upload state
  const [reuploadDocType, setReuploadDocType] = useState(null);
  const [reuploadFile, setReuploadFile] = useState(null);
  const [reuploading, setReuploading] = useState(false);

  // Re-upload donation date state
  const [showDateForm, setShowDateForm] = useState(false);
  const [newDonationDate, setNewDonationDate] = useState('');
  const [newDonationProof, setNewDonationProof] = useState(null);
  const [updatingDate, setUpdatingDate] = useState(false);

  // Request Blood modal (Cross-Functionality)
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  const fetchDashboard = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      const res = await api.getDonorDashboard();
      setData(res);
      setError(null);
    } catch (err) {
      if (!isBackground) setError(err.message || 'Failed to load donor dashboard');
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard(false);

    // Real-time synchronization: poll silently in background every 4 seconds
    const interval = setInterval(() => {
      fetchDashboard(true);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const handleToggleAvailability = async () => {
    if (!data?.donorProfile) return;
    try {
      const newStatus = !data.donorProfile.is_available;
      await api.toggleDonorAvailability(newStatus);
      setData((prev) => ({
        ...prev,
        donorProfile: { ...prev.donorProfile, is_available: newStatus },
      }));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleMatchResponse = async (matchId, action) => {
    try {
      await api.respondMatch(matchId, action);
      await fetchDashboard();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleReuploadDoc = async (e) => {
    e.preventDefault();
    if (!reuploadFile || !reuploadDocType) return;
    setReuploading(true);
    try {
      await api.uploadDocument(reuploadFile, reuploadDocType);
      setReuploadDocType(null);
      setReuploadFile(null);
      await fetchDashboard();
      alert('Document re-uploaded successfully and submitted for doctor verification.');
    } catch (err) {
      alert(err.message);
    } finally {
      setReuploading(false);
    }
  };

  const handleUpdateDonationDate = async (e) => {
    e.preventDefault();
    if (!newDonationDate) return;
    setUpdatingDate(true);
    try {
      await api.updateDonationDate(newDonationDate);
      if (newDonationProof) {
        await api.uploadDocument(newDonationProof, 'donation_proof');
      }
      setShowDateForm(false);
      setNewDonationDate('');
      setNewDonationProof(null);
      await fetchDashboard();
      alert('New donation date and certificate submitted for doctor verification.');
    } catch (err) {
      alert(err.message);
    } finally {
      setUpdatingDate(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '80px 16px', textAlign: 'center' }}>
        <div className="spinner" />
        <p style={{ marginTop: '16px', color: 'var(--color-slate-500)', fontSize: '13px' }}>
          Loading donor dashboard and doctor-verified cooldown...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container-narrow my-12">
        <div className="alert alert-error">
          <span>{error || 'Unable to load donor details.'}</span>
        </div>
      </div>
    );
  }

  const { donorProfile, eligibility, documents, matches } = data;

  return (
    <div className="container my-8">
      {/* Top Welcome / Profile Header */}
      <div className="card mb-6">
        <div className="card-body flex-between" style={{ flexWrap: 'wrap', gap: '16px' }}>
          <div className="flex items-center gap-4">
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--color-primary-light)',
                border: '1px solid var(--color-primary-border)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ fontSize: '20px', fontWeight: '900', color: 'var(--color-primary-dark)', lineHeight: 1 }}>
                {data.user.blood_group || 'O+'}
              </span>
              <span style={{ fontSize: '9px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--color-slate-500)', marginTop: '2px' }}>
                Donor
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 style={{ fontSize: '20px', fontWeight: '800' }}>{data.user.full_name}</h1>
                <StatusBadge status={data.user.status} label={data.user.status === 'verified' ? 'Verified Volunteer' : 'Pending Verification'} />
              </div>
              <p style={{ fontSize: '12px', color: 'var(--color-slate-500)', marginTop: '3px' }}>
                {data.user.city} • {data.user.phone} • {data.user.email}
              </p>
            </div>
          </div>

          {/* Availability Toggle & Cross-Role Blood Request Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleToggleAvailability}
              className={`btn ${donorProfile?.is_available ? 'btn-success' : 'btn-outline'}`}
              style={{ fontSize: '13px' }}
            >
              {donorProfile?.is_available ? '🟢 Available to Donate' : '⚪ Paused: Unavailable'}
            </button>

            {/* Cross-role: Donor requesting blood */}
            <button
              onClick={() => setIsRequestModalOpen(true)}
              className="btn btn-primary"
              style={{ fontSize: '13px' }}
            >
              <PlusCircle size={15} />
              Need Blood Urgently?
            </button>
          </div>
        </div>
      </div>

      <div className="grid-2 mb-6">
        {/* Cooldown Timer Card (Computed ONLY from Doctor-Verified Date) */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <Calendar size={18} color="var(--color-primary)" />
              Eligibility Cooldown Status
            </h3>
            <StatusBadge status={donorProfile?.last_donation_date_status} />
          </div>

          <div className="card-body">
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '12px', color: 'var(--color-slate-500)', marginBottom: '4px' }}>
                Doctor-Verified Last Donation Date:
              </div>
              <div style={{ fontSize: '16px', fontWeight: '700', color: 'var(--color-slate-900)' }}>
                {donorProfile?.last_donation_date || 'No prior donation record (First-time donor)'}
              </div>
            </div>

            {/* Status explanation */}
            <div
              style={{
                padding: '14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: eligibility?.isEligible ? 'var(--status-verified-bg)' : 'var(--status-pending-bg)',
                border: `1px solid ${eligibility?.isEligible ? 'var(--status-verified-border)' : 'var(--status-pending-border)'}`,
                color: eligibility?.isEligible ? 'var(--status-verified-text)' : 'var(--status-pending-text)',
                marginBottom: '16px',
              }}
            >
              <div style={{ fontWeight: '700', fontSize: '14px', marginBottom: '4px' }}>
                {eligibility?.statusLabel}
              </div>
              {eligibility?.daysRemaining > 0 && (
                <div style={{ fontSize: '13px' }}>
                  Next mathematically eligible date: <strong>{eligibility?.nextEligibleDate}</strong> ({eligibility?.daysRemaining} days remaining).
                </div>
              )}
            </div>

            {/* If doctor rejected last donation date, show reason & re-upload form */}
            {donorProfile?.last_donation_date_status === 'rejected' && (
              <div className="alert alert-error" style={{ marginBottom: '16px' }}>
                <AlertTriangle size={18} />
                <div>
                  <strong>Doctor Rejection Reason:</strong> {donorProfile?.last_donation_rejection_reason || 'Certificate was unclear.'}
                  <div style={{ marginTop: '8px' }}>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => setShowDateForm(true)}
                    >
                      Update Date & Re-upload Proof
                    </button>
                  </div>
                </div>
              </div>
            )}

            {!showDateForm && donorProfile?.last_donation_date_status !== 'rejected' && (
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setShowDateForm(true)}
              >
                Log New Donation Date
              </button>
            )}

            {showDateForm && (
              <form onSubmit={handleUpdateDonationDate} style={{ marginTop: '16px', padding: '16px', border: '1px solid var(--color-slate-200)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-slate-50)' }}>
                <h4 style={{ fontSize: '13px', fontWeight: '700', marginBottom: '10px' }}>
                  Submit Recent Donation for Doctor Verification
                </h4>
                <div className="form-group">
                  <label className="form-label">Donation Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={newDonationDate}
                    onChange={(e) => setNewDonationDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Proof / Certificate (JPG, PNG, PDF)</label>
                  <input
                    type="file"
                    className="form-control"
                    accept="image/jpeg,image/png,application/pdf"
                    onChange={(e) => setNewDonationProof(e.target.files?.[0])}
                  />
                </div>
                <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => setShowDateForm(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm" disabled={updatingDate || !newDonationDate}>
                    {updatingDate ? 'Submitting...' : 'Submit to Doctor'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Uploaded Documents & Re-upload section */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <ShieldCheck size={18} color="var(--color-primary)" />
              Verification Documents
            </h3>
          </div>

          <div className="card-body">
            {documents.length === 0 ? (
              <div className="empty-state">
                <p>No documents uploaded yet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--color-slate-200)',
                      backgroundColor: 'var(--color-slate-50)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <div className="flex-between">
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '700' }}>
                          {doc.doc_type === 'id_proof' ? 'Government ID Proof' : 'Donation Proof Certificate'}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--color-slate-500)' }}>
                          {doc.original_name}
                        </div>
                      </div>
                      <StatusBadge status={doc.status} />
                    </div>

                    {/* If doctor rejected this document, show reason & Re-upload button */}
                    {doc.status === 'rejected' && (
                      <div className="alert alert-error" style={{ margin: '4px 0 0', padding: '8px 12px', fontSize: '12px' }}>
                        <div>
                          <strong>Reason:</strong> {doc.rejection_reason || 'Document was unreadable.'}
                        </div>
                        <button
                          className="btn btn-danger btn-sm"
                          style={{ marginTop: '6px' }}
                          onClick={() => setReuploadDocType(doc.doc_type)}
                        >
                          <Upload size={12} /> Re-upload {doc.doc_type === 'id_proof' ? 'ID Proof' : 'Donation Proof'}
                        </button>
                      </div>
                    )}

                    <div className="flex gap-2" style={{ justifyContent: 'flex-end', marginTop: '4px' }}>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => setViewingDoc(doc)}
                      >
                        <Eye size={13} /> View In-App
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Re-upload Modal/Form if clicked */}
            {reuploadDocType && (
              <form onSubmit={handleReuploadDoc} style={{ marginTop: '16px', padding: '16px', backgroundColor: 'var(--status-rejected-bg)', border: '1px solid var(--status-rejected-border)', borderRadius: 'var(--radius-md)' }}>
                <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--status-rejected-text)', marginBottom: '8px' }}>
                  Re-upload {reuploadDocType.replace('_', ' ').toUpperCase()}
                </h4>
                <input
                  type="file"
                  className="form-control"
                  accept="image/jpeg,image/png,application/pdf"
                  onChange={(e) => setReuploadFile(e.target.files?.[0])}
                  required
                />
                <div className="flex gap-2" style={{ marginTop: '10px', justifyContent: 'flex-end' }}>
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => setReuploadDocType(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-danger btn-sm" disabled={reuploading || !reuploadFile}>
                    {reuploading ? 'Uploading...' : 'Submit Re-upload'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Matched Blood Requests */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <Heart size={18} color="var(--color-primary)" />
            Matched Emergency Requests
          </h3>
          <span style={{ fontSize: '12px', color: 'var(--color-slate-500)' }}>
            {matches.length} alert(s)
          </span>
        </div>

        <div className="card-body">
          {matches.length === 0 ? (
            <div className="empty-state">
              <Clock className="empty-icon" />
              <p style={{ fontWeight: '600' }}>No active emergency matches right now.</p>
              <p style={{ fontSize: '12px', marginTop: '4px' }}>
                Keep your availability active. When a doctor approves a compatible blood request in your area, it will appear here.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {matches.map((m) => (
                <div
                  key={m.id}
                  style={{
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-slate-200)',
                    backgroundColor: 'var(--color-white)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <div className="flex-between" style={{ flexWrap: 'wrap', gap: '8px' }}>
                    <div className="flex items-center gap-3">
                      <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-primary)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800' }}>
                        {m.request?.blood_group}
                      </div>
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: '700' }}>
                          Patient: {m.request?.patient_name} ({m.request?.units_needed} units needed)
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--color-slate-600)' }}>
                          Hospital: {m.request?.hospital_name} • {m.request?.city}
                        </div>
                      </div>
                    </div>

                    <StatusBadge status={m.status} label={m.status.toUpperCase()} />
                  </div>

                  <div className="flex-between" style={{ borderTop: '1px solid var(--color-slate-100)', paddingTop: '10px' }}>
                    <div style={{ fontSize: '12px', color: 'var(--color-slate-500)' }}>
                      Urgency: <strong style={{ color: 'var(--color-primary)' }}>{m.request?.urgency?.toUpperCase()}</strong>
                    </div>

                    {m.status === 'notified' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleMatchResponse(m.id, 'declined')}
                          className="btn btn-outline btn-sm"
                        >
                          <X size={14} /> Decline
                        </button>
                        <button
                          onClick={() => handleMatchResponse(m.id, 'accepted')}
                          className="btn btn-success btn-sm"
                        >
                          <Check size={14} /> Accept Request
                        </button>
                      </div>
                    )}

                    {m.status === 'accepted' && (
                      <span className="badge badge-verified">
                        ✓ Match Accepted — Hospital & Attendant Notified
                      </span>
                    )}

                    {m.status === 'declined' && (
                      <span className="badge badge-rejected">
                        Declined
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Reusable In-App Document Viewer Modal */}
      {viewingDoc && (
        <DocumentViewerModal
          document={viewingDoc}
          onClose={() => setViewingDoc(null)}
        />
      )}

      {/* Cross-Role Blood Request Modal */}
      {isRequestModalOpen && (
        <CreateRequestModal
          onClose={() => setIsRequestModalOpen(false)}
          onSuccess={() => {
            setIsRequestModalOpen(false);
            alert('Your emergency blood request has been created and sent to the doctor queue!');
          }}
        />
      )}
    </div>
  );
};

