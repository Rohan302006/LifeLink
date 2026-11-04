import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import {
  Activity,
  PlusCircle,
  FileText,
  Upload,
  Eye,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Heart,
  ChevronRight,
} from 'lucide-react';
import { StatusBadge } from '../../components/common/StatusBadge';
import { DocumentViewerModal } from '../../components/common/DocumentViewerModal';
import { CreateRequestModal } from '../shared/CreateRequestModal';

export const ReceiverDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Document viewer modal
  const [viewingDoc, setViewingDoc] = useState(null);

  // Re-upload document state
  const [reuploadDocType, setReuploadDocType] = useState(null);
  const [reuploadFile, setReuploadFile] = useState(null);
  const [reuploading, setReuploading] = useState(false);

  // Create request modal
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  const fetchDashboard = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      else setIsRefreshing(true);
      const res = await api.getReceiverDashboard();
      setData(res);
      setError(null);
    } catch (err) {
      if (!isBackground) setError(err.message || 'Failed to load receiver dashboard');
    } finally {
      if (!isBackground) setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard(false);

    // Real-time synchronization: poll every 4 seconds
    const interval = setInterval(() => {
      fetchDashboard(true);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const handleReuploadDoc = async (e) => {
    e.preventDefault();
    if (!reuploadFile || !reuploadDocType) return;
    setReuploading(true);
    try {
      await api.uploadDocument(reuploadFile, reuploadDocType);
      setReuploadDocType(null);
      setReuploadFile(null);
      await fetchDashboard();
      alert('Document re-uploaded and submitted for doctor verification.');
    } catch (err) {
      alert(err.message);
    } finally {
      setReuploading(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '80px 16px', textAlign: 'center' }}>
        <div className="spinner" />
        <p style={{ marginTop: '16px', color: 'var(--color-slate-500)', fontSize: '13px' }}>
          Loading your emergency requests and documents...
        </p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container-narrow my-12">
        <div className="alert alert-error">
          <span>{error || 'Unable to load dashboard.'}</span>
        </div>
      </div>
    );
  }

  const { documents, requests } = data;

  return (
    <div className="container my-8">
      {/* Top Welcome / Receiver Profile Header */}
      <div className="card mb-6">
        <div className="card-body flex-between" style={{ flexWrap: 'wrap', gap: '16px' }}>
          <div className="flex items-center gap-4">
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: '#eff6ff',
                border: '1px solid #bfdbfe',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Activity size={24} color="#2563eb" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 style={{ fontSize: '20px', fontWeight: '800' }}>{data.user.full_name}</h1>
                <StatusBadge status={data.user.status} label={data.user.status === 'verified' ? 'Verified Patient/Attendant' : 'Pending Verification'} />
              </div>
              <p style={{ fontSize: '12px', color: 'var(--color-slate-500)', marginTop: '3px' }}>
                {data.user.city} • {data.user.phone} • {data.user.email}
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
              onClick={() => fetchDashboard(true)}
              className="btn btn-outline btn-sm"
              disabled={isRefreshing}
            >
              {isRefreshing ? 'Syncing...' : 'Refresh'}
            </button>

            {/* Primary Action: Create Request */}
            <button
              onClick={() => setIsRequestModalOpen(true)}
              className="btn btn-primary"
              style={{ fontSize: '13px' }}
            >
              <PlusCircle size={15} />
              New Blood Request
            </button>

            {/* Cross-role: Receiver volunteering to donate */}
            <Link
              to="/donor/dashboard"
              className="btn btn-outline"
              style={{ fontSize: '13px' }}
            >
              <Heart size={15} color="var(--color-primary)" />
              Volunteer as Donor
            </Link>
          </div>
        </div>
      </div>

      <div className="grid-2 mb-6">
        {/* Uploaded Documents Status */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <FileText size={18} color="var(--color-primary)" />
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
                          {doc.doc_type === 'id_proof'
                            ? 'Identity Proof'
                            : 'Hospital Blood Requisition'}
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
                          <strong>Reason:</strong> {doc.rejection_reason || 'File was unreadable or invalid.'}
                        </div>
                        <button
                          className="btn btn-danger btn-sm"
                          style={{ marginTop: '6px' }}
                          onClick={() => setReuploadDocType(doc.doc_type)}
                        >
                          <Upload size={12} /> Re-upload Document
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

            {/* Re-upload form if active */}
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

        {/* Instructions / Medical Gating Info */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <Clock size={18} color="var(--color-primary)" />
              Doctor Verification Protocol
            </h3>
          </div>

          <div className="card-body" style={{ fontSize: '13px', color: 'var(--color-slate-600)', lineHeight: 1.6 }}>
            <p style={{ marginBottom: '12px' }}>
              To safeguard against false alarms and hoarders, all blood requisitions require attending hospital physician review before broadcasting to verified donors.
            </p>
            <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>
                <strong>Pending:</strong> Under clinical review by hospital verifier.
              </li>
              <li>
                <strong>Verified:</strong> Approved by doctor and automatically broadcast to verified compatible donors.
              </li>
              <li>
                <strong>Fulfilled:</strong> Donors have presented at blood bank and donation is complete.
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* My Blood Requests & Status Timeline */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <Activity size={18} color="var(--color-primary)" />
            My Emergency Blood Requests
          </h3>
          <span style={{ fontSize: '12px', color: 'var(--color-slate-500)' }}>
            {requests.length} total
          </span>
        </div>

        <div className="card-body">
          {requests.length === 0 ? (
            <div className="empty-state">
              <Clock className="empty-icon" />
              <p style={{ fontWeight: '600' }}>No blood requests registered yet.</p>
              <button
                className="btn btn-primary"
                style={{ marginTop: '16px' }}
                onClick={() => setIsRequestModalOpen(true)}
              >
                <PlusCircle size={15} /> Create First Request
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {requests.map((r) => (
                <div
                  key={r.id}
                  style={{
                    padding: '18px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-slate-200)',
                    backgroundColor: 'var(--color-white)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                  }}
                >
                  <div className="flex-between" style={{ flexWrap: 'wrap', gap: '8px' }}>
                    <div className="flex items-center gap-3">
                      <div
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: 'var(--radius-md)',
                          backgroundColor: 'var(--color-primary)',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: '800',
                          fontSize: '16px',
                        }}
                      >
                        {r.blood_group}
                      </div>

                      <div>
                        <div style={{ fontSize: '16px', fontWeight: '700' }}>
                          Patient: {r.patient_name} ({r.units_needed} units required)
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--color-slate-600)' }}>
                          Hospital: {r.hospital_name} • {r.city} • Urgency: <strong>{r.urgency?.toUpperCase()}</strong>
                        </div>
                      </div>
                    </div>

                    <StatusBadge status={r.status} />
                  </div>

                  {/* Status Timeline */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: 'var(--color-slate-50)',
                      padding: '12px 16px',
                      borderRadius: 'var(--radius-md)',
                      fontSize: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700', color: 'var(--color-slate-800)' }}>
                      <CheckCircle2 size={16} color="#059669" />
                      1. Submitted
                    </div>

                    <div style={{ width: '24px', height: '1px', backgroundColor: 'var(--color-slate-300)' }} />

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontWeight: '700',
                        color: r.status === 'verified' || r.status === 'fulfilled' ? '#059669' : 'var(--color-slate-400)',
                      }}
                    >
                      <CheckCircle2 size={16} color={r.status === 'verified' || r.status === 'fulfilled' ? '#059669' : 'var(--color-slate-300)'} />
                      2. Doctor Verified
                    </div>

                    <div style={{ width: '24px', height: '1px', backgroundColor: 'var(--color-slate-300)' }} />

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontWeight: '700',
                        color: r.status === 'fulfilled' ? '#059669' : 'var(--color-slate-400)',
                      }}
                    >
                      <CheckCircle2 size={16} color={r.status === 'fulfilled' ? '#059669' : 'var(--color-slate-300)'} />
                      3. Fulfilled
                    </div>
                  </div>

                  {/* Doctor notes or Rejection Reason if present */}
                  {r.doctor_notes && (
                    <div style={{ fontSize: '12px', color: 'var(--color-slate-700)', backgroundColor: '#ecfdf5', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid #a7f3d0' }}>
                      <strong>Attending Doctor Notes:</strong> {r.doctor_notes}
                    </div>
                  )}

                  {r.status === 'rejected' && (
                    <div className="alert alert-error" style={{ margin: 0 }}>
                      <strong>Doctor Rejection Reason:</strong> {r.rejection_reason || 'Requisition details could not be verified.'}
                    </div>
                  )}

                  {/* Donor Match Activity */}
                  {r.status === 'verified' && (
                    <div style={{ fontSize: '13px', color: 'var(--color-slate-700)' }}>
                      Matched verified donors notified: <strong>{r.matchesCount || 0}</strong> • Accepted: <strong style={{ color: '#059669' }}>{r.acceptedCount || 0}</strong>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Document Viewer Modal */}
      {viewingDoc && (
        <DocumentViewerModal
          document={viewingDoc}
          onClose={() => setViewingDoc(null)}
        />
      )}

      {/* Create Request Modal */}
      {isRequestModalOpen && (
        <CreateRequestModal
          onClose={() => setIsRequestModalOpen(false)}
          onSuccess={() => {
            setIsRequestModalOpen(false);
            fetchDashboard();
          }}
        />
      )}
    </div>
  );
};

