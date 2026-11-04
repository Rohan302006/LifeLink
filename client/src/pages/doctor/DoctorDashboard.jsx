import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import {
  Stethoscope,
  Users,
  Activity,
  CheckCircle,
  XCircle,
  FileText,
  Eye,
  AlertTriangle,
  Clock,
  ShieldCheck,
  X,
  Check,
} from 'lucide-react';
import { StatusBadge } from '../../components/common/StatusBadge';
import { DocumentViewerModal } from '../../components/common/DocumentViewerModal';

export const DoctorDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('donors');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Doctor profile & status
  const [doctorProfile, setDoctorProfile] = useState(null);

  // Tab Data
  const [donors, setDonors] = useState([]);
  const [receivers, setReceivers] = useState([]);
  const [requests, setRequests] = useState([]);

  // Full Profile Modal
  const [selectedPerson, setSelectedPerson] = useState(null);
  const [personLoading, setPersonLoading] = useState(false);

  // Document Viewer Modal
  const [viewingDoc, setViewingDoc] = useState(null);

  // Action State (Approve / Reject prompts)
  const [rejectionTarget, setRejectionTarget] = useState(null); // { type: 'doc' | 'date' | 'request', id, userId }
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Request approval notes
  const [doctorNotes, setDoctorNotes] = useState('');

  const fetchDoctorData = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);
      else setIsRefreshing(true);
      setError(null);

      // Check current user's doctor profile
      const meRes = await api.getCurrentUser();
      const currentProfile = meRes.doctorProfile || {
        medical_license_number: 'Under Review',
        hospital_name: 'Affiliated Hospital',
        approval_status: meRes.user?.status || 'pending',
      };
      setDoctorProfile(currentProfile);

      if (currentProfile?.approval_status === 'verified') {
        const [donorsRes, receiversRes, requestsRes] = await Promise.all([
          api.getDoctorDonors().catch(() => ({ donors: [] })),
          api.getDoctorReceivers().catch(() => ({ receivers: [] })),
          api.getDoctorRequests().catch(() => ({ requests: [] })),
        ]);

        setDonors(donorsRes.donors || []);
        setReceivers(receiversRes.receivers || []);
        setRequests(requestsRes.requests || []);
      }
    } catch (err) {
      if (!isBackground) setError(err.message || 'Failed to load doctor dashboard');
    } finally {
      if (!isBackground) setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDoctorData(false);

    // Real-time synchronization: poll every 4 seconds
    const interval = setInterval(() => {
      fetchDoctorData(true);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // Open Full Person Profile
  const handleOpenPersonProfile = async (userId) => {
    setPersonLoading(true);
    try {
      const res = await api.getDoctorPersonProfile(userId);
      setSelectedPerson(res);
    } catch (err) {
      alert(err.message);
    } finally {
      setPersonLoading(false);
    }
  };

  // Document Verification
  const handleVerifyDocument = async (docId, status, reason = '') => {
    setActionLoading(true);
    try {
      await api.reviewDocument(docId, status, reason);
      // Refresh current profile and tab lists
      if (selectedPerson) {
        await handleOpenPersonProfile(selectedPerson.user.id);
      }
      await fetchDoctorData();
      setRejectionTarget(null);
      setRejectionReason('');
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Donation Date Verification
  const handleVerifyDonationDate = async (userId, status, reason = '') => {
    setActionLoading(true);
    try {
      await api.verifyDonationDate(userId, status, reason);
      if (selectedPerson) {
        await handleOpenPersonProfile(selectedPerson.user.id);
      }
      await fetchDoctorData();
      setRejectionTarget(null);
      setRejectionReason('');
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Request Verification
  const handleVerifyRequest = async (requestId, status, reason = '', notes = '') => {
    setActionLoading(true);
    try {
      const res = await api.verifyBloodRequest(requestId, status, reason, notes);
      alert(res.message);
      await fetchDoctorData();
      setRejectionTarget(null);
      setRejectionReason('');
      setDoctorNotes('');
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
          Loading Doctor Verification Queue...
        </p>
      </div>
    );
  }

  // 1. UNAPPROVED DOCTOR VIEW (Strict Rule: Unapproved doctors can see nothing)
  if (doctorProfile?.approval_status !== 'verified') {
    return (
      <div className="container-narrow my-12">
        <div className="card" style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--status-pending-bg)',
              border: '2px solid var(--status-pending-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              color: 'var(--status-pending-text)',
            }}
          >
            <Clock size={32} />
          </div>

          <StatusBadge status="pending" label="Pending Admin Approval" />

          <h2 style={{ fontSize: '22px', fontWeight: '800', marginTop: '16px', marginBottom: '8px' }}>
            Doctor Account Pending Verification
          </h2>

          <p style={{ color: 'var(--color-slate-600)', fontSize: '14px', lineHeight: 1.6, maxWidth: '480px', margin: '0 auto 20px' }}>
            Your medical license number (<strong>{doctorProfile?.medical_license_number || 'Under Review'}</strong>) and affiliation with <strong>{doctorProfile?.hospital_name || 'Affiliated Hospital'}</strong> are currently under review by an Administrator.
          </p>

          <div className="alert alert-info" style={{ textAlign: 'left', maxWidth: '480px', margin: '0 auto 20px' }}>
            <span>
              Unapproved doctors cannot access patient medical records or blood queues. You will gain immediate access once verified by an administrator.
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
            <div
              style={{
                display: 'inline-flex',
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
              Live Sync Active (4s)
            </div>

            <button
              onClick={() => fetchDoctorData(true)}
              className="btn btn-outline btn-sm"
              disabled={isRefreshing}
            >
              {isRefreshing ? 'Checking...' : 'Check Status Now'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. APPROVED DOCTOR VIEW
  return (
    <div className="container my-8">
      {/* Header */}
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
              <Stethoscope size={26} color="var(--color-primary)" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 style={{ fontSize: '20px', fontWeight: '800' }}>{user?.full_name}</h1>
                <StatusBadge status="verified" label="Authorized Physician" />
              </div>
              <p style={{ fontSize: '12px', color: 'var(--color-slate-500)', marginTop: '3px' }}>
                {doctorProfile?.hospital_name} • License: {doctorProfile?.medical_license_number}
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
              Live Queue Sync (4s)
            </div>

            <button
              onClick={() => fetchDoctorData(true)}
              className="btn btn-outline btn-sm"
              disabled={isRefreshing}
            >
              {isRefreshing ? 'Syncing...' : 'Refresh Queue'}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="tabs-header">
        <button
          className={`tab-btn ${activeTab === 'donors' ? 'active' : ''}`}
          onClick={() => setActiveTab('donors')}
        >
          <Users size={16} />
          Donors ({donors.length})
        </button>

        <button
          className={`tab-btn ${activeTab === 'receivers' ? 'active' : ''}`}
          onClick={() => setActiveTab('receivers')}
        >
          <Activity size={16} />
          Receivers ({receivers.length})
        </button>

        <button
          className={`tab-btn ${activeTab === 'requests' ? 'active' : ''}`}
          onClick={() => setActiveTab('requests')}
        >
          <CheckCircle size={16} />
          Blood Requests ({requests.length})
        </button>
      </div>

      {/* TAB 1: DONORS */}
      {activeTab === 'donors' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Registered Donors</h3>
            <span style={{ fontSize: '12px', color: 'var(--color-slate-500)' }}>
              Click any donor to inspect full profile & verify documents
            </span>
          </div>

          <div className="card-body" style={{ padding: 0 }}>
            {donors.length === 0 ? (
              <div className="empty-state">
                <p>No registered donors found.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-slate-200)', backgroundColor: 'var(--color-slate-50)' }}>
                      <th style={{ padding: '12px 16px' }}>Donor</th>
                      <th style={{ padding: '12px 16px' }}>Blood Group</th>
                      <th style={{ padding: '12px 16px' }}>City</th>
                      <th style={{ padding: '12px 16px' }}>Last Donation Date</th>
                      <th style={{ padding: '12px 16px' }}>Account Status</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {donors.map((d) => (
                      <tr key={d.id} style={{ borderBottom: '1px solid var(--color-slate-100)' }}>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontWeight: '700' }}>{d.full_name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--color-slate-500)' }}>{d.phone}</div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ fontWeight: '800', color: 'var(--color-primary)' }}>{d.blood_group}</span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>{d.city}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <div>{d.last_donation_date || 'First-time'}</div>
                          <StatusBadge status={d.last_donation_date_status} />
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <StatusBadge status={d.user_status} />
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => handleOpenPersonProfile(d.user_id)}
                          >
                            <Eye size={13} /> Full Profile
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: RECEIVERS */}
      {activeTab === 'receivers' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Registered Receivers (Patients / Attendants)</h3>
            <span style={{ fontSize: '12px', color: 'var(--color-slate-500)' }}>
              Click any receiver to inspect identity and medical prescriptions
            </span>
          </div>

          <div className="card-body" style={{ padding: 0 }}>
            {receivers.length === 0 ? (
              <div className="empty-state">
                <p>No registered receivers found.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-slate-200)', backgroundColor: 'var(--color-slate-50)' }}>
                      <th style={{ padding: '12px 16px' }}>Receiver</th>
                      <th style={{ padding: '12px 16px' }}>Blood Group</th>
                      <th style={{ padding: '12px 16px' }}>City</th>
                      <th style={{ padding: '12px 16px' }}>Active Requests</th>
                      <th style={{ padding: '12px 16px' }}>Account Status</th>
                      <th style={{ padding: '12px 16px', textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receivers.map((r) => (
                      <tr key={r.id} style={{ borderBottom: '1px solid var(--color-slate-100)' }}>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontWeight: '700' }}>{r.full_name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--color-slate-500)' }}>{r.phone}</div>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ fontWeight: '800', color: '#2563eb' }}>{r.blood_group}</span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>{r.city}</td>
                        <td style={{ padding: '12px 16px' }}>{r.requestsCount || 0}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <StatusBadge status={r.user_status} />
                        </td>
                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => handleOpenPersonProfile(r.id)}
                          >
                            <Eye size={13} /> Full Profile
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: REQUESTS */}
      {activeTab === 'requests' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Hospital Blood Requisitions</h3>
            <span style={{ fontSize: '12px', color: 'var(--color-slate-500)' }}>
              Approve requisitions to trigger emergency matching with verified donors
            </span>
          </div>

          <div className="card-body">
            {requests.length === 0 ? (
              <div className="empty-state">
                <p>No blood requisitions in queue.</p>
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
                      backgroundColor: 'var(--color-slate-50)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                    }}
                  >
                    <div className="flex-between" style={{ flexWrap: 'wrap', gap: '8px' }}>
                      <div className="flex items-center gap-3">
                        <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-primary)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '16px' }}>
                          {r.blood_group}
                        </div>
                        <div>
                          <div style={{ fontSize: '16px', fontWeight: '700' }}>
                            Patient: {r.patient_name} ({r.units_needed} units)
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--color-slate-600)' }}>
                            Hospital: {r.hospital_name} • City: {r.city} • Urgency: <strong>{r.urgency?.toUpperCase()}</strong>
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--color-slate-500)', marginTop: '2px' }}>
                            Attendant: {r.requester_name} ({r.requester_phone})
                          </div>
                        </div>
                      </div>

                      <StatusBadge status={r.status} />
                    </div>

                    {/* Action buttons if request is pending */}
                    {r.status === 'pending' && (
                      <div style={{ borderTop: '1px solid var(--color-slate-200)', paddingTop: '12px' }}>
                        <div className="form-group" style={{ marginBottom: '10px' }}>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Optional doctor clinical verification notes..."
                            value={doctorNotes}
                            onChange={(e) => setDoctorNotes(e.target.value)}
                          />
                        </div>

                        <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => setRejectionTarget({ type: 'request', id: r.id })}
                            disabled={actionLoading}
                          >
                            <X size={14} /> Reject Request
                          </button>
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => handleVerifyRequest(r.id, 'verified', '', doctorNotes)}
                            disabled={actionLoading}
                          >
                            <Check size={14} /> Approve & Broadcast to Verified Donors
                          </button>
                        </div>
                      </div>
                    )}

                    {r.rejection_reason && (
                      <div className="alert alert-error" style={{ margin: 0, padding: '8px 12px', fontSize: '12px' }}>
                        <strong>Rejection Reason:</strong> {r.rejection_reason}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* FULL PERSON PROFILE MODAL */}
      {selectedPerson && (
        <div className="modal-backdrop" onClick={() => setSelectedPerson(null)}>
          <div className="modal-dialog modal-dialog-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                Full Profile: {selectedPerson.user.full_name} ({selectedPerson.user.role.toUpperCase()})
              </h3>
              <button className="modal-close-btn" onClick={() => setSelectedPerson(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              {/* Basic Details Grid */}
              <div className="grid-3 mb-6" style={{ padding: '16px', backgroundColor: 'var(--color-slate-50)', borderRadius: 'var(--radius-md)' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--color-slate-500)' }}>Blood Group</div>
                  <div style={{ fontSize: '16px', fontWeight: '800', color: 'var(--color-primary)' }}>{selectedPerson.user.blood_group}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--color-slate-500)' }}>Age & Gender</div>
                  <div style={{ fontSize: '14px', fontWeight: '700' }}>{selectedPerson.user.age} yrs • {selectedPerson.user.gender}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--color-slate-500)' }}>City</div>
                  <div style={{ fontSize: '14px', fontWeight: '700' }}>{selectedPerson.user.city}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--color-slate-500)' }}>Contact Phone</div>
                  <div style={{ fontSize: '14px', fontWeight: '700' }}>{selectedPerson.user.phone}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--color-slate-500)' }}>Email</div>
                  <div style={{ fontSize: '14px', fontWeight: '700' }}>{selectedPerson.user.email}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--color-slate-500)' }}>Account Status</div>
                  <StatusBadge status={selectedPerson.user.status} />
                </div>
              </div>

              {/* If Donor: Last Donation Date & Verification */}
              {selectedPerson.donorProfile && (
                <div style={{ padding: '16px', border: '1px solid var(--color-slate-200)', borderRadius: 'var(--radius-md)', marginBottom: '20px' }}>
                  <div className="flex-between mb-2">
                    <h4 style={{ fontSize: '14px', fontWeight: '700' }}>Donation Date Verification</h4>
                    <StatusBadge status={selectedPerson.donorProfile.last_donation_date_status} />
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--color-slate-600)', marginBottom: '10px' }}>
                    Entered Date: <strong>{selectedPerson.donorProfile.last_donation_date || 'First-time donor (No prior history)'}</strong>
                  </p>

                  {/* Doctor Approve/Reject for Donation Date */}
                  <div className="flex gap-2">
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() => handleVerifyDonationDate(selectedPerson.user.id, 'verified')}
                      disabled={actionLoading}
                    >
                      <Check size={14} /> Approve Date
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => setRejectionTarget({ type: 'date', userId: selectedPerson.user.id })}
                      disabled={actionLoading}
                    >
                      <X size={14} /> Reject Date (With Reason)
                    </button>
                  </div>
                </div>
              )}

              {/* Uploaded Documents List with In-App Viewer & Approve/Reject */}
              <h4 style={{ fontSize: '14px', fontWeight: '700', marginBottom: '12px' }}>
                Uploaded Documents
              </h4>

              {selectedPerson.documents?.length === 0 ? (
                <p style={{ fontSize: '13px', color: 'var(--color-slate-500)' }}>No documents uploaded by user.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {selectedPerson.documents.map((doc) => (
                    <div
                      key={doc.id}
                      style={{
                        padding: '14px',
                        border: '1px solid var(--color-slate-200)',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--color-slate-50)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px',
                      }}
                    >
                      <div className="flex-between">
                        <div>
                          <div style={{ fontWeight: '700', fontSize: '13px' }}>
                            {doc.doc_type === 'id_proof'
                              ? 'Government ID Proof'
                              : doc.doc_type === 'donation_proof'
                              ? 'Blood Donation Certificate'
                              : 'Hospital Blood Requisition Form'}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--color-slate-500)' }}>
                            {doc.original_name} ({Math.round(doc.file_size / 1024)} KB)
                          </div>
                        </div>

                        <StatusBadge status={doc.status} />
                      </div>

                      <div className="flex gap-2" style={{ justifyContent: 'flex-end', marginTop: '6px' }}>
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => setViewingDoc(doc)}
                        >
                          <Eye size={13} /> View Document In-App
                        </button>
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleVerifyDocument(doc.id, 'verified')}
                          disabled={actionLoading}
                        >
                          <Check size={13} /> Approve
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => setRejectionTarget({ type: 'doc', id: doc.id })}
                          disabled={actionLoading}
                        >
                          <X size={13} /> Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary btn-sm" onClick={() => setSelectedPerson(null)}>
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REJECTION REASON PROMPT MODAL (MANDATORY REASON) */}
      {rejectionTarget && (
        <div className="modal-backdrop" onClick={() => setRejectionTarget(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ color: 'var(--color-primary)' }}>
                Mandatory Rejection Reason
              </h3>
              <button className="modal-close-btn" onClick={() => setRejectionTarget(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <p style={{ fontSize: '13px', color: 'var(--color-slate-600)', marginBottom: '14px' }}>
                Please specify why this {rejectionTarget.type === 'doc' ? 'document' : rejectionTarget.type === 'date' ? 'donation date' : 'blood request'} is being rejected. The user will be notified and given the opportunity to re-upload.
              </p>

              <div className="form-group">
                <label className="form-label" htmlFor="rejectReason">
                  Rejection Reason
                </label>
                <textarea
                  id="rejectReason"
                  className="form-control"
                  rows={3}
                  placeholder="e.g. Document photo is blurred / Expired prescription / Name does not match ID."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-outline btn-sm" onClick={() => setRejectionTarget(null)}>
                Cancel
              </button>
              <button
                className="btn btn-danger btn-sm"
                disabled={actionLoading || !rejectionReason.trim()}
                onClick={() => {
                  if (rejectionTarget.type === 'doc') {
                    handleVerifyDocument(rejectionTarget.id, 'rejected', rejectionReason);
                  } else if (rejectionTarget.type === 'date') {
                    handleVerifyDonationDate(rejectionTarget.userId, 'rejected', rejectionReason);
                  } else if (rejectionTarget.type === 'request') {
                    handleVerifyRequest(rejectionTarget.id, 'rejected', rejectionReason);
                  }
                }}
              >
                {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-App Document Viewer Modal */}
      {viewingDoc && (
        <DocumentViewerModal
          document={viewingDoc}
          onClose={() => setViewingDoc(null)}
        />
      )}
    </div>
  );
};

