import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import {
  ShieldAlert,
  Stethoscope,
  Users,
  Building2,
  Check,
  X,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Eye,
  FileText,
  Mail,
  Phone,
  MapPin,
  Calendar,
  User,
  Award,
  Plus,
  Heart,
  Activity,
  Search,
} from 'lucide-react';
import { StatusBadge } from '../../components/common/StatusBadge';
import { DocumentViewerModal } from '../../components/common/DocumentViewerModal';

export const AdminDashboard = () => {
  const { user } = useAuth();

  // Active Main Section: 'doctors' | 'users' | 'hospitals'
  const [activeModule, setActiveModule] = useState('doctors');

  // --------------------------------------------------------------------------
  // Data States
  // --------------------------------------------------------------------------
  const [doctors, setDoctors] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // --------------------------------------------------------------------------
  // Doctor Section States
  // --------------------------------------------------------------------------
  const [doctorFilter, setDoctorFilter] = useState('all'); // 'all' | 'verified' | 'pending' | 'rejected'
  const [rejectingDoctorId, setRejectingDoctorId] = useState(null);
  const [doctorRejectionReason, setDoctorRejectionReason] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [loadingDoctorDocs, setLoadingDoctorDocs] = useState(false);
  const [doctorToDelete, setDoctorToDelete] = useState(null);
  const [doctorDeleteReason, setDoctorDeleteReason] = useState('');

  // --------------------------------------------------------------------------
  // User Section States
  // --------------------------------------------------------------------------
  const [userFilter, setUserFilter] = useState('all'); // 'all' | 'donor' | 'receiver' | 'verified' | 'pending'
  const [selectedUser, setSelectedUser] = useState(null);
  const [loadingUserDetails, setLoadingUserDetails] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [userDeleteReason, setUserDeleteReason] = useState('');

  // --------------------------------------------------------------------------
  // Hospital Section States
  // --------------------------------------------------------------------------
  const [isAddHospitalOpen, setIsAddHospitalOpen] = useState(false);
  const [hospitalSearch, setHospitalSearch] = useState('');
  const [newHospital, setNewHospital] = useState({
    name: '',
    city: '',
    state: '',
    address: '',
    contact_phone: '',
  });

  // Shared Document Viewer Previewer
  const [docToPreview, setDocToPreview] = useState(null);

  // --------------------------------------------------------------------------
  // Fetch Functions
  // --------------------------------------------------------------------------
  const fetchAllData = async (isBackground = false) => {
    try {
      if (!isBackground) setLoading(true);

      const [docsRes, usersRes, hospsRes] = await Promise.all([
        api.getAdminDoctors().catch(() => ({ doctors: [] })),
        api.getAdminUsers().catch(() => ({ users: [] })),
        api.getAdminHospitals().catch(() => ({ hospitals: [] })),
      ]);

      setDoctors(docsRes.doctors || []);
      setUsersList(usersRes.users || []);
      setHospitals(hospsRes.hospitals || []);
      setError(null);
    } catch (err) {
      if (!isBackground) setError(err.message || 'Failed to load administration data');
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData(false);

    // Background polling every 4 seconds for silent real-time sync
    const interval = setInterval(() => {
      fetchAllData(true);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  // --------------------------------------------------------------------------
  // Doctor Section Handlers
  // --------------------------------------------------------------------------
  const handleApproveDoctor = async (doctorId) => {
    setActionLoading(true);
    try {
      await api.approveDoctor(doctorId);
      await fetchAllData(true);
      alert('Doctor account approved. The physician can now access the triage queue.');
      if (selectedDoctor && (selectedDoctor.user_id === doctorId || selectedDoctor.id === doctorId)) {
        setSelectedDoctor((prev) => ({ ...prev, approval_status: 'verified', status: 'verified' }));
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectDoctor = async (e) => {
    e.preventDefault();
    if (!rejectingDoctorId || !doctorRejectionReason.trim()) return;
    setActionLoading(true);
    try {
      await api.rejectDoctor(rejectingDoctorId, doctorRejectionReason.trim());
      const rejectedId = rejectingDoctorId;
      setRejectingDoctorId(null);
      setDoctorRejectionReason('');
      await fetchAllData(true);
      alert('Doctor account rejected.');
      if (selectedDoctor && (selectedDoctor.user_id === rejectedId || selectedDoctor.id === rejectedId)) {
        setSelectedDoctor(null);
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewDoctorProfile = async (doc) => {
    setSelectedDoctor(doc);
    setLoadingDoctorDocs(true);
    try {
      const res = await api.getAdminDoctorProfile(doc.user_id || doc.id);
      if (res.doctor) {
        setSelectedDoctor(res.doctor);
      }
    } catch (err) {
      console.warn('Could not load detailed documents for doctor:', err.message);
    } finally {
      setLoadingDoctorDocs(false);
    }
  };

  const handleDeleteDoctorSubmit = async (e) => {
    e.preventDefault();
    if (!doctorToDelete || !doctorDeleteReason.trim()) return;

    setActionLoading(true);
    try {
      const targetId = doctorToDelete.user_id || doctorToDelete.id;
      await api.deleteDoctor(targetId, doctorDeleteReason.trim());
      alert(`Doctor account for Dr. ${doctorToDelete.full_name} has been permanently deleted.`);
      setDoctorToDelete(null);
      setDoctorDeleteReason('');
      if (selectedDoctor && (selectedDoctor.user_id === targetId || selectedDoctor.id === targetId)) {
        setSelectedDoctor(null);
      }
      await fetchAllData(true);
    } catch (err) {
      alert(err.message || 'Failed to delete doctor account');
    } finally {
      setActionLoading(false);
    }
  };

  // --------------------------------------------------------------------------
  // User Section Handlers
  // --------------------------------------------------------------------------
  const handleViewUserProfile = async (u) => {
    setSelectedUser(u);
    setLoadingUserDetails(true);
    try {
      const res = await api.getAdminUserProfile(u.user_id || u.id);
      if (res.user) {
        setSelectedUser(res.user);
      }
    } catch (err) {
      console.warn('Could not load user profile details:', err.message);
    } finally {
      setLoadingUserDetails(false);
    }
  };

  const handleDeleteUserSubmit = async (e) => {
    e.preventDefault();
    if (!userToDelete || !userDeleteReason.trim()) return;

    setActionLoading(true);
    try {
      const targetId = userToDelete.user_id || userToDelete.id;
      await api.deleteUser(targetId, userDeleteReason.trim());
      alert(`User account for ${userToDelete.full_name} (${userToDelete.role}) has been permanently deleted.`);
      setUserToDelete(null);
      setUserDeleteReason('');
      if (selectedUser && (selectedUser.user_id === targetId || selectedUser.id === targetId)) {
        setSelectedUser(null);
      }
      await fetchAllData(true);
    } catch (err) {
      alert(err.message || 'Failed to delete user account');
    } finally {
      setActionLoading(false);
    }
  };

  // --------------------------------------------------------------------------
  // Hospital Section Handlers
  // --------------------------------------------------------------------------
  const handleAddHospitalSubmit = async (e) => {
    e.preventDefault();
    if (!newHospital.name.trim() || !newHospital.city.trim()) {
      alert('Please provide hospital name and city.');
      return;
    }

    setActionLoading(true);
    try {
      await api.addHospital(newHospital);
      alert(`Hospital "${newHospital.name}" added successfully! It is now listed in the doctor registration dropdown.`);
      setIsAddHospitalOpen(false);
      setNewHospital({ name: '', city: '', state: '', address: '', contact_phone: '' });
      await fetchAllData(true);
    } catch (err) {
      alert(err.message || 'Failed to add hospital');
    } finally {
      setActionLoading(false);
    }
  };

  // --------------------------------------------------------------------------
  // Filter Calculations
  // --------------------------------------------------------------------------
  // Doctors
  const verifiedDoctors = doctors.filter((d) => d.approval_status === 'verified');
  const pendingDoctors = doctors.filter((d) => d.approval_status === 'pending');
  const rejectedDoctors = doctors.filter((d) => d.approval_status === 'rejected');

  const filteredDoctors = doctors.filter((doc) => {
    if (doctorFilter === 'verified') return doc.approval_status === 'verified';
    if (doctorFilter === 'pending') return doc.approval_status === 'pending';
    if (doctorFilter === 'rejected') return doc.approval_status === 'rejected';
    return true;
  });

  // Users
  const donorUsers = usersList.filter((u) => u.role === 'donor');
  const receiverUsers = usersList.filter((u) => u.role === 'receiver');
  const verifiedUsers = usersList.filter((u) => u.status === 'verified');
  const pendingUsers = usersList.filter((u) => u.status === 'pending');

  const filteredUsers = usersList.filter((u) => {
    if (userFilter === 'donor') return u.role === 'donor';
    if (userFilter === 'receiver') return u.role === 'receiver';
    if (userFilter === 'verified') return u.status === 'verified';
    if (userFilter === 'pending') return u.status === 'pending';
    return true;
  });

  // Hospitals
  const filteredHospitals = hospitals.filter((h) => {
    if (!hospitalSearch.trim()) return true;
    const term = hospitalSearch.toLowerCase();
    return (
      h.name.toLowerCase().includes(term) ||
      (h.city && h.city.toLowerCase().includes(term)) ||
      (h.state && h.state.toLowerCase().includes(term))
    );
  });

  if (loading) {
    return (
      <div className="container" style={{ padding: '80px 16px', textAlign: 'center' }}>
        <div className="spinner" />
        <p style={{ marginTop: '16px', color: 'var(--color-slate-500)', fontSize: '13px' }}>
          Loading LifeLink Administration Portal...
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
                LifeLink Doctor-Supervised Emergency Blood Coordination Management
              </p>
            </div>
          </div>

          {/* Quick Metrics Header Pill */}
          <div className="flex items-center gap-2" style={{ fontSize: '13px', color: 'var(--color-slate-600)' }}>
            <span className="badge badge-blood">{doctors.length} Doctors</span>
            <span className="badge badge-pending">{usersList.length} Users</span>
            <span className="badge badge-role">{hospitals.length} Hospitals</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-error mb-6">
          <span>{error}</span>
        </div>
      )}

      {/* =========================================================================
          PRIMARY 3 SECTIONS NAVIGATION TABS
         ========================================================================= */}
      <div
        className="tabs-header mb-6"
        style={{
          borderBottom: '2px solid var(--color-slate-200)',
          gap: '12px',
        }}
      >
        <button
          className={`tab-btn ${activeModule === 'doctors' ? 'active' : ''}`}
          onClick={() => setActiveModule('doctors')}
          style={{ fontSize: '15px', padding: '12px 20px', fontWeight: '700' }}
        >
          <Stethoscope size={18} />
          1. Doctor Section ({doctors.length})
        </button>

        <button
          className={`tab-btn ${activeModule === 'users' ? 'active' : ''}`}
          onClick={() => setActiveModule('users')}
          style={{ fontSize: '15px', padding: '12px 20px', fontWeight: '700' }}
        >
          <Users size={18} />
          2. User Section ({usersList.length})
        </button>

        <button
          className={`tab-btn ${activeModule === 'hospitals' ? 'active' : ''}`}
          onClick={() => setActiveModule('hospitals')}
          style={{ fontSize: '15px', padding: '12px 20px', fontWeight: '700' }}
        >
          <Building2 size={18} />
          3. Hospital Section ({hospitals.length})
        </button>
      </div>

      {/* =========================================================================
          MODULE 1: DOCTOR SECTION
         ========================================================================= */}
      {activeModule === 'doctors' && (
        <div>
          {/* Doctor KPI Metric Cards with 1-Click Verified Filter */}
          <div className="grid-3 mb-6" style={{ gap: '16px' }}>
            <div
              className="card"
              style={{
                cursor: 'pointer',
                border: doctorFilter === 'all' ? '2px solid var(--color-slate-900)' : '1px solid var(--color-slate-200)',
                transition: 'var(--transition)',
              }}
              onClick={() => setDoctorFilter('all')}
            >
              <div className="card-body flex-between">
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--color-slate-500)', fontWeight: '600', textTransform: 'uppercase' }}>
                    Total Doctors
                  </span>
                  <h2 style={{ fontSize: '26px', fontWeight: '800', marginTop: '4px' }}>{doctors.length}</h2>
                </div>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--color-slate-100)',
                    color: 'var(--color-slate-700)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Stethoscope size={22} />
                </div>
              </div>
            </div>

            <div
              className="card"
              style={{
                cursor: 'pointer',
                border: doctorFilter === 'verified' ? '2px solid #059669' : '1px solid var(--color-slate-200)',
                backgroundColor: doctorFilter === 'verified' ? '#f0fdf4' : 'var(--color-white)',
                transition: 'var(--transition)',
              }}
              onClick={() => setDoctorFilter('verified')}
              title="Click to view all verified doctors with a single click"
            >
              <div className="card-body flex-between">
                <div>
                  <span style={{ fontSize: '12px', color: '#047857', fontWeight: '700', textTransform: 'uppercase' }}>
                    Verified Doctors (1-Click)
                  </span>
                  <h2 style={{ fontSize: '26px', fontWeight: '800', marginTop: '4px', color: '#047857' }}>
                    {verifiedDoctors.length}
                  </h2>
                </div>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: '#dcfce7',
                    color: '#059669',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CheckCircle2 size={22} />
                </div>
              </div>
            </div>

            <div
              className="card"
              style={{
                cursor: 'pointer',
                border: doctorFilter === 'pending' ? '2px solid #d97706' : '1px solid var(--color-slate-200)',
                backgroundColor: doctorFilter === 'pending' ? '#fffbeb' : 'var(--color-white)',
                transition: 'var(--transition)',
              }}
              onClick={() => setDoctorFilter('pending')}
            >
              <div className="card-body flex-between">
                <div>
                  <span style={{ fontSize: '12px', color: '#b45309', fontWeight: '700', textTransform: 'uppercase' }}>
                    Pending Review
                  </span>
                  <h2 style={{ fontSize: '26px', fontWeight: '800', marginTop: '4px', color: '#b45309' }}>
                    {pendingDoctors.length}
                  </h2>
                </div>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: '#fef3c7',
                    color: '#d97706',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Clock size={22} />
                </div>
              </div>
            </div>
          </div>

          {/* Doctor Accounts Table Card */}
          <div className="card">
            <div className="card-header flex-between" style={{ flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 className="card-title">
                  <Stethoscope size={18} color="var(--color-primary)" />
                  Hospital Doctor Registrations
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--color-slate-500)' }}>
                  Showing {filteredDoctors.length} of {doctors.length} doctor account(s)
                </span>
              </div>

              {/* Quick tab filters for doctors */}
              <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                <button
                  className={`btn btn-sm ${doctorFilter === 'all' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setDoctorFilter('all')}
                >
                  All ({doctors.length})
                </button>
                <button
                  className={`btn btn-sm ${doctorFilter === 'verified' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setDoctorFilter('verified')}
                  title="Filter to view verified doctors with a single click"
                >
                  <CheckCircle2 size={14} /> Verified ({verifiedDoctors.length})
                </button>
                <button
                  className={`btn btn-sm ${doctorFilter === 'pending' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setDoctorFilter('pending')}
                >
                  <Clock size={14} /> Pending ({pendingDoctors.length})
                </button>
                <button
                  className={`btn btn-sm ${doctorFilter === 'rejected' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setDoctorFilter('rejected')}
                >
                  <X size={14} /> Rejected ({rejectedDoctors.length})
                </button>
              </div>
            </div>

            <div className="card-body" style={{ padding: 0 }}>
              {filteredDoctors.length === 0 ? (
                <div className="empty-state">
                  <Stethoscope size={36} color="var(--color-slate-400)" style={{ margin: '0 auto 12px' }} />
                  <p style={{ fontWeight: '600' }}>No doctor accounts found in this category.</p>
                  {doctorFilter !== 'all' && (
                    <button
                      className="btn btn-outline btn-sm"
                      style={{ marginTop: '12px' }}
                      onClick={() => setDoctorFilter('all')}
                    >
                      View All Doctors
                    </button>
                  )}
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
                      {filteredDoctors.map((doc) => (
                        <tr key={doc.id || doc.user_id} style={{ borderBottom: '1px solid var(--color-slate-100)' }}>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ fontWeight: '700', color: 'var(--color-slate-900)' }}>
                              Dr. {doc.full_name.replace(/^dr\.?\s+/i, '')}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--color-slate-500)', marginTop: '2px' }}>
                              Registered: {doc.registered_at ? new Date(doc.registered_at).toLocaleDateString() : 'N/A'}
                            </div>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <code style={{ backgroundColor: 'var(--color-slate-100)', padding: '3px 7px', borderRadius: '4px', fontSize: '12px', fontWeight: '600' }}>
                              {doc.medical_license_number}
                            </code>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ fontWeight: '500' }}>{doc.hospital_name}</div>
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
                            <div className="flex gap-2" style={{ justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                              {/* 1. View Profile Button */}
                              <button
                                className="btn btn-outline btn-sm"
                                onClick={() => handleViewDoctorProfile(doc)}
                                title="View all details of this doctor"
                              >
                                <Eye size={14} /> View Profile
                              </button>

                              {/* 2. Approve/Reject for Pending */}
                              {doc.approval_status === 'pending' && (
                                <>
                                  <button
                                    className="btn btn-success btn-sm"
                                    onClick={() => handleApproveDoctor(doc.user_id || doc.id)}
                                    disabled={actionLoading}
                                  >
                                    <Check size={14} /> Approve
                                  </button>
                                  <button
                                    className="btn btn-outline btn-sm"
                                    style={{ color: 'var(--color-primary)', borderColor: 'var(--color-primary-border)' }}
                                    onClick={() => setRejectingDoctorId(doc.user_id || doc.id)}
                                    disabled={actionLoading}
                                  >
                                    <X size={14} /> Reject
                                  </button>
                                </>
                              )}

                              {/* 3. Delete Doctor Button */}
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => {
                                  setDoctorToDelete(doc);
                                  setDoctorDeleteReason('');
                                }}
                                disabled={actionLoading}
                                title="Delete doctor account permanently"
                              >
                                <Trash2 size={14} /> Delete Doctor
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODULE 2: USER SECTION (Donors & Receivers)
         ========================================================================= */}
      {activeModule === 'users' && (
        <div>
          {/* User Section KPI Metrics */}
          <div className="grid-3 mb-6" style={{ gap: '16px' }}>
            <div
              className="card"
              style={{
                cursor: 'pointer',
                border: userFilter === 'all' ? '2px solid var(--color-slate-900)' : '1px solid var(--color-slate-200)',
              }}
              onClick={() => setUserFilter('all')}
            >
              <div className="card-body flex-between">
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--color-slate-500)', fontWeight: '600', textTransform: 'uppercase' }}>
                    All Users
                  </span>
                  <h2 style={{ fontSize: '26px', fontWeight: '800', marginTop: '4px' }}>{usersList.length}</h2>
                </div>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--color-slate-100)',
                    color: 'var(--color-slate-700)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Users size={22} />
                </div>
              </div>
            </div>

            <div
              className="card"
              style={{
                cursor: 'pointer',
                border: userFilter === 'donor' ? '2px solid var(--color-primary)' : '1px solid var(--color-slate-200)',
                backgroundColor: userFilter === 'donor' ? 'var(--color-primary-light)' : 'var(--color-white)',
              }}
              onClick={() => setUserFilter('donor')}
            >
              <div className="card-body flex-between">
                <div>
                  <span style={{ fontSize: '12px', color: 'var(--color-primary-dark)', fontWeight: '700', textTransform: 'uppercase' }}>
                    Donors
                  </span>
                  <h2 style={{ fontSize: '26px', fontWeight: '800', marginTop: '4px', color: 'var(--color-primary)' }}>
                    {donorUsers.length}
                  </h2>
                </div>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: '#fee2e2',
                    color: 'var(--color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Heart size={22} />
                </div>
              </div>
            </div>

            <div
              className="card"
              style={{
                cursor: 'pointer',
                border: userFilter === 'receiver' ? '2px solid #2563eb' : '1px solid var(--color-slate-200)',
                backgroundColor: userFilter === 'receiver' ? '#eff6ff' : 'var(--color-white)',
              }}
              onClick={() => setUserFilter('receiver')}
            >
              <div className="card-body flex-between">
                <div>
                  <span style={{ fontSize: '12px', color: '#1d4ed8', fontWeight: '700', textTransform: 'uppercase' }}>
                    Receivers
                  </span>
                  <h2 style={{ fontSize: '26px', fontWeight: '800', marginTop: '4px', color: '#2563eb' }}>
                    {receiverUsers.length}
                  </h2>
                </div>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: '#dbeafe',
                    color: '#2563eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Activity size={22} />
                </div>
              </div>
            </div>
          </div>

          {/* User Accounts Table Card */}
          <div className="card">
            <div className="card-header flex-between" style={{ flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 className="card-title">
                  <Users size={18} color="var(--color-primary)" />
                  Registered Blood Donors & Emergency Receivers
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--color-slate-500)' }}>
                  Showing {filteredUsers.length} of {usersList.length} user account(s)
                </span>
              </div>

              {/* Sub-filters for users */}
              <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                <button
                  className={`btn btn-sm ${userFilter === 'all' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setUserFilter('all')}
                >
                  All ({usersList.length})
                </button>
                <button
                  className={`btn btn-sm ${userFilter === 'donor' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setUserFilter('donor')}
                >
                  Donors ({donorUsers.length})
                </button>
                <button
                  className={`btn btn-sm ${userFilter === 'receiver' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setUserFilter('receiver')}
                >
                  Receivers ({receiverUsers.length})
                </button>
                <button
                  className={`btn btn-sm ${userFilter === 'verified' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setUserFilter('verified')}
                >
                  Verified ({verifiedUsers.length})
                </button>
                <button
                  className={`btn btn-sm ${userFilter === 'pending' ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setUserFilter('pending')}
                >
                  Pending ({pendingUsers.length})
                </button>
              </div>
            </div>

            <div className="card-body" style={{ padding: 0 }}>
              {filteredUsers.length === 0 ? (
                <div className="empty-state">
                  <Users size={36} color="var(--color-slate-400)" style={{ margin: '0 auto 12px' }} />
                  <p style={{ fontWeight: '600' }}>No users found in this filter.</p>
                  {userFilter !== 'all' && (
                    <button
                      className="btn btn-outline btn-sm"
                      style={{ marginTop: '12px' }}
                      onClick={() => setUserFilter('all')}
                    >
                      View All Users
                    </button>
                  )}
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--color-slate-200)', backgroundColor: 'var(--color-slate-50)' }}>
                        <th style={{ padding: '12px 16px' }}>User Name</th>
                        <th style={{ padding: '12px 16px' }}>Role</th>
                        <th style={{ padding: '12px 16px' }}>Blood Group</th>
                        <th style={{ padding: '12px 16px' }}>Contact</th>
                        <th style={{ padding: '12px 16px' }}>City</th>
                        <th style={{ padding: '12px 16px' }}>Status</th>
                        <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((u) => (
                        <tr key={u.id || u.user_id} style={{ borderBottom: '1px solid var(--color-slate-100)' }}>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ fontWeight: '700', color: 'var(--color-slate-900)' }}>
                              {u.full_name}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--color-slate-500)', marginTop: '2px' }}>
                              Joined: {u.registered_at ? new Date(u.registered_at).toLocaleDateString() : 'N/A'}
                            </div>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span className={`badge ${u.role === 'donor' ? 'badge-role' : 'badge-pending'}`} style={{ textTransform: 'uppercase' }}>
                              {u.role}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span className="badge badge-blood">{u.blood_group || 'N/A'}</span>
                            <div style={{ fontSize: '11px', color: 'var(--color-slate-500)', marginTop: '2px' }}>
                              {u.age ? `${u.age} yrs` : ''} {u.gender || ''}
                            </div>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <div>{u.email}</div>
                            <div style={{ fontSize: '11px', color: 'var(--color-slate-500)' }}>{u.phone}</div>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <div>{u.city || 'N/A'}</div>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <StatusBadge status={u.status} />
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                            <div className="flex gap-2" style={{ justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                              {/* 1. View Profile Button */}
                              <button
                                className="btn btn-outline btn-sm"
                                onClick={() => handleViewUserProfile(u)}
                                title="View full profile of this user"
                              >
                                <Eye size={14} /> View Profile
                              </button>

                              {/* 2. Delete User Button */}
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => {
                                  setUserToDelete(u);
                                  setUserDeleteReason('');
                                }}
                                disabled={actionLoading}
                                title="Delete user account permanently"
                              >
                                <Trash2 size={14} /> Delete User
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODULE 3: HOSPITAL SECTION (List & Add Hospitals, NO DELETE)
         ========================================================================= */}
      {activeModule === 'hospitals' && (
        <div>
          {/* Hospital Section Header & Controls */}
          <div className="card mb-6">
            <div className="card-body flex-between" style={{ flexWrap: 'wrap', gap: '16px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Building2 size={20} color="var(--color-primary)" /> Listed Hospitals & Healthcare Centers
                </h2>
                <p style={{ fontSize: '12px', color: 'var(--color-slate-500)', marginTop: '4px' }}>
                  Manage hospital affiliations available to physicians during registration. (Deletion disabled to safeguard clinical affiliations).
                </p>
              </div>

              <div className="flex items-center gap-3" style={{ flexWrap: 'wrap' }}>
                <div style={{ position: 'relative' }}>
                  <Search
                    size={15}
                    color="var(--color-slate-400)"
                    style={{ position: 'absolute', left: '10px', top: '10px' }}
                  />
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search hospitals or city..."
                    value={hospitalSearch}
                    onChange={(e) => setHospitalSearch(e.target.value)}
                    style={{ paddingLeft: '32px', minWidth: '220px', height: '36px', fontSize: '13px' }}
                  />
                </div>

                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => setIsAddHospitalOpen(true)}
                >
                  <Plus size={16} /> Add New Hospital
                </button>
              </div>
            </div>
          </div>

          {/* Hospitals Table */}
          <div className="card">
            <div className="card-header flex-between" style={{ flexWrap: 'wrap', gap: '12px' }}>
              <h3 className="card-title">
                All Listed Hospitals ({filteredHospitals.length})
              </h3>
              <span className="badge badge-verified">
                Active in Doctor Registration Dropdown
              </span>
            </div>

            <div className="card-body" style={{ padding: 0 }}>
              {filteredHospitals.length === 0 ? (
                <div className="empty-state">
                  <Building2 size={36} color="var(--color-slate-400)" style={{ margin: '0 auto 12px' }} />
                  <p style={{ fontWeight: '600' }}>No hospitals match your search.</p>
                  <button
                    className="btn btn-outline btn-sm"
                    style={{ marginTop: '12px' }}
                    onClick={() => setHospitalSearch('')}
                  >
                    Clear Search
                  </button>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--color-slate-200)', backgroundColor: 'var(--color-slate-50)' }}>
                        <th style={{ padding: '12px 16px' }}>Hospital Name</th>
                        <th style={{ padding: '12px 16px' }}>City / Location</th>
                        <th style={{ padding: '12px 16px' }}>State / Region</th>
                        <th style={{ padding: '12px 16px' }}>Emergency Contact</th>
                        <th style={{ padding: '12px 16px' }}>Affiliated Doctors</th>
                        <th style={{ padding: '12px 16px', textAlign: 'right' }}>Integrity Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredHospitals.map((hosp) => (
                        <tr key={hosp.id || hosp.name} style={{ borderBottom: '1px solid var(--color-slate-100)' }}>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ fontWeight: '700', color: 'var(--color-slate-900)' }}>
                              {hosp.name}
                            </div>
                            {hosp.address && (
                              <div style={{ fontSize: '11px', color: 'var(--color-slate-500)', marginTop: '2px' }}>
                                {hosp.address}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <div className="flex items-center gap-1">
                              <MapPin size={13} color="var(--color-slate-400)" />
                              <span>{hosp.city}</span>
                            </div>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span>{hosp.state || 'N/A'}</span>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            {hosp.contact_phone ? (
                              <div className="flex items-center gap-1">
                                <Phone size={13} color="var(--color-slate-400)" />
                                <span>{hosp.contact_phone}</span>
                              </div>
                            ) : (
                              <span style={{ color: 'var(--color-slate-400)' }}>Not listed</span>
                            )}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span className="badge badge-role">
                              {hosp.doctors_count || 0} Doctor(s)
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                            <span
                              style={{
                                fontSize: '11px',
                                color: 'var(--color-slate-500)',
                                backgroundColor: 'var(--color-slate-100)',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                display: 'inline-block',
                              }}
                              title="Deletion is permanently disabled to prevent impacting affiliated doctors"
                            >
                              Permanent Facility
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW DOCTOR PROFILE MODAL
         ========================================================================= */}
      {selectedDoctor && (
        <div className="modal-backdrop" onClick={() => setSelectedDoctor(null)}>
          <div className="modal-dialog modal-dialog-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="flex items-center gap-3">
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--color-primary-light)',
                    color: 'var(--color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Stethoscope size={20} />
                </div>
                <div>
                  <h3 className="modal-title" style={{ fontSize: '17px' }}>
                    Dr. {selectedDoctor.full_name?.replace(/^dr\.?\s+/i, '')}
                  </h3>
                  <div className="flex items-center gap-2" style={{ marginTop: '2px' }}>
                    <span className="badge badge-role">DOCTOR</span>
                    <StatusBadge status={selectedDoctor.approval_status || selectedDoctor.doctor_profile?.approval_status || selectedDoctor.status} />
                  </div>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedDoctor(null)} aria-label="Close">
                <X size={20} />
              </button>
            </div>

            <div className="modal-body" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
              {(selectedDoctor.approval_status === 'rejected' || selectedDoctor.doctor_profile?.approval_status === 'rejected') && (
                <div className="alert alert-error mb-4" style={{ alignItems: 'flex-start' }}>
                  <AlertTriangle size={18} style={{ marginTop: '2px', flexShrink: 0 }} />
                  <div>
                    <strong style={{ display: 'block', marginBottom: '2px' }}>Doctor Registration Rejected</strong>
                    <span style={{ fontSize: '13px' }}>
                      Reason: {selectedDoctor.rejection_reason || selectedDoctor.doctor_profile?.rejection_reason || 'Rejected by Administrator'}
                    </span>
                  </div>
                </div>
              )}

              <div className="grid-2" style={{ gap: '20px', marginBottom: '20px' }}>
                {/* Personal Information */}
                <div className="card" style={{ border: '1px solid var(--color-slate-200)', backgroundColor: 'var(--color-slate-50)' }}>
                  <div className="card-header" style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-slate-200)' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <User size={16} color="var(--color-primary)" /> Personal Information
                    </h4>
                  </div>
                  <div className="card-body" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                    <div>
                      <span style={{ color: 'var(--color-slate-500)', fontSize: '11px', display: 'block' }}>Full Name</span>
                      <strong style={{ color: 'var(--color-slate-900)' }}>{selectedDoctor.full_name}</strong>
                    </div>

                    <div>
                      <span style={{ color: 'var(--color-slate-500)', fontSize: '11px', display: 'block' }}>Email Address</span>
                      <div className="flex items-center gap-2">
                        <Mail size={13} color="var(--color-slate-400)" />
                        <span>{selectedDoctor.email}</span>
                      </div>
                    </div>

                    <div>
                      <span style={{ color: 'var(--color-slate-500)', fontSize: '11px', display: 'block' }}>Phone Number</span>
                      <div className="flex items-center gap-2">
                        <Phone size={13} color="var(--color-slate-400)" />
                        <span>{selectedDoctor.phone}</span>
                      </div>
                    </div>

                    <div className="grid-3" style={{ gap: '8px' }}>
                      <div>
                        <span style={{ color: 'var(--color-slate-500)', fontSize: '11px', display: 'block' }}>Age</span>
                        <span>{selectedDoctor.age ? `${selectedDoctor.age} yrs` : 'Not specified'}</span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--color-slate-500)', fontSize: '11px', display: 'block' }}>Gender</span>
                        <span>{selectedDoctor.gender || 'Not specified'}</span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--color-slate-500)', fontSize: '11px', display: 'block' }}>Blood Group</span>
                        <span className="badge badge-blood">{selectedDoctor.blood_group || 'N/A'}</span>
                      </div>
                    </div>

                    <div>
                      <span style={{ color: 'var(--color-slate-500)', fontSize: '11px', display: 'block' }}>City</span>
                      <div className="flex items-center gap-2">
                        <MapPin size={13} color="var(--color-slate-400)" />
                        <span>{selectedDoctor.city || 'Not specified'}</span>
                      </div>
                    </div>

                    <div>
                      <span style={{ color: 'var(--color-slate-500)', fontSize: '11px', display: 'block' }}>Registration Date</span>
                      <div className="flex items-center gap-2">
                        <Calendar size={13} color="var(--color-slate-400)" />
                        <span>{selectedDoctor.registered_at || selectedDoctor.created_at ? new Date(selectedDoctor.registered_at || selectedDoctor.created_at).toLocaleString() : 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Medical Credentials */}
                <div className="card" style={{ border: '1px solid var(--color-slate-200)', backgroundColor: 'var(--color-slate-50)' }}>
                  <div className="card-header" style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-slate-200)' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Award size={16} color="var(--color-primary)" /> Medical Credentials
                    </h4>
                  </div>
                  <div className="card-body" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                    <div>
                      <span style={{ color: 'var(--color-slate-500)', fontSize: '11px', display: 'block' }}>Medical License</span>
                      <code style={{ backgroundColor: 'var(--color-white)', border: '1px solid var(--color-slate-200)', padding: '4px 8px', borderRadius: '4px', fontSize: '13px', fontWeight: '700', color: 'var(--color-primary-dark)' }}>
                        {selectedDoctor.medical_license_number || selectedDoctor.doctor_profile?.medical_license_number || 'Under Review'}
                      </code>
                    </div>

                    <div>
                      <span style={{ color: 'var(--color-slate-500)', fontSize: '11px', display: 'block' }}>Hospital Affiliation</span>
                      <div className="flex items-center gap-2">
                        <Building2 size={13} color="var(--color-slate-400)" />
                        <strong style={{ color: 'var(--color-slate-900)' }}>
                          {selectedDoctor.hospital_name || selectedDoctor.doctor_profile?.hospital_name || 'Affiliated Hospital'}
                        </strong>
                      </div>
                    </div>

                    <div>
                      <span style={{ color: 'var(--color-slate-500)', fontSize: '11px', display: 'block' }}>Hospital City</span>
                      <span>{selectedDoctor.hospital_city || selectedDoctor.doctor_profile?.hospital_city || selectedDoctor.city || 'Not specified'}</span>
                    </div>

                    <div>
                      <span style={{ color: 'var(--color-slate-500)', fontSize: '11px', display: 'block' }}>Approval Status</span>
                      <StatusBadge status={selectedDoctor.approval_status || selectedDoctor.doctor_profile?.approval_status || selectedDoctor.status} />
                    </div>

                    <div>
                      <span style={{ color: 'var(--color-slate-500)', fontSize: '11px', display: 'block' }}>Reviewed At</span>
                      <span>
                        {selectedDoctor.reviewed_at || selectedDoctor.doctor_profile?.reviewed_at
                          ? new Date(selectedDoctor.reviewed_at || selectedDoctor.doctor_profile?.reviewed_at).toLocaleString()
                          : 'Pending Review'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Uploaded Documents */}
              <div className="card" style={{ border: '1px solid var(--color-slate-200)' }}>
                <div className="card-header" style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-slate-200)' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText size={16} color="var(--color-primary)" /> Uploaded Verification Documents
                  </h4>
                </div>
                <div className="card-body" style={{ padding: '16px' }}>
                  {loadingDoctorDocs ? (
                    <div style={{ textAlign: 'center', padding: '16px' }}>
                      <div className="spinner" style={{ width: '24px', height: '24px', margin: '0 auto' }} />
                      <span style={{ fontSize: '12px', color: 'var(--color-slate-500)', display: 'block', marginTop: '8px' }}>
                        Loading doctor documents...
                      </span>
                    </div>
                  ) : selectedDoctor.documents && selectedDoctor.documents.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {selectedDoctor.documents.map((docItem) => (
                        <div
                          key={docItem.id}
                          className="flex-between"
                          style={{
                            padding: '10px 14px',
                            backgroundColor: 'var(--color-slate-50)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-slate-200)',
                            fontSize: '13px',
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <FileText size={18} color="var(--color-primary)" />
                            <div>
                              <div style={{ fontWeight: '600' }}>{docItem.original_name || docItem.file_name}</div>
                              <div style={{ fontSize: '11px', color: 'var(--color-slate-500)' }}>
                                Type: {docItem.doc_type} • Size: {Math.round((docItem.file_size || 0) / 1024)} KB
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <StatusBadge status={docItem.status} />
                            <button
                              type="button"
                              className="btn btn-outline btn-sm"
                              onClick={() => setDocToPreview(docItem)}
                            >
                              <Eye size={13} /> View
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: '13px', color: 'var(--color-slate-500)', margin: 0 }}>
                      No verification documents attached to this doctor account.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="modal-footer flex-between" style={{ flexWrap: 'wrap', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={() => {
                  const docToDel = selectedDoctor;
                  setSelectedDoctor(null);
                  setDoctorToDelete(docToDel);
                  setDoctorDeleteReason('');
                }}
                disabled={actionLoading}
              >
                <Trash2 size={14} /> Delete Doctor
              </button>

              <div className="flex gap-2">
                {selectedDoctor.approval_status === 'pending' && (
                  <>
                    <button
                      type="button"
                      className="btn btn-success btn-sm"
                      onClick={() => handleApproveDoctor(selectedDoctor.user_id || selectedDoctor.id)}
                      disabled={actionLoading}
                    >
                      <Check size={14} /> Approve Doctor
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      style={{ color: 'var(--color-primary)', borderColor: 'var(--color-primary-border)' }}
                      onClick={() => {
                        const targetId = selectedDoctor.user_id || selectedDoctor.id;
                        setSelectedDoctor(null);
                        setRejectingDoctorId(targetId);
                      }}
                      disabled={actionLoading}
                    >
                      <X size={14} /> Reject Doctor
                    </button>
                  </>
                )}
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setSelectedDoctor(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW USER PROFILE MODAL (Donors & Receivers)
         ========================================================================= */}
      {selectedUser && (
        <div className="modal-backdrop" onClick={() => setSelectedUser(null)}>
          <div className="modal-dialog modal-dialog-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="flex items-center gap-3">
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: selectedUser.role === 'donor' ? 'var(--color-primary-light)' : '#eff6ff',
                    color: selectedUser.role === 'donor' ? 'var(--color-primary)' : '#2563eb',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {selectedUser.role === 'donor' ? <Heart size={20} /> : <Activity size={20} />}
                </div>
                <div>
                  <h3 className="modal-title" style={{ fontSize: '17px' }}>
                    {selectedUser.full_name}
                  </h3>
                  <div className="flex items-center gap-2" style={{ marginTop: '2px' }}>
                    <span className="badge badge-role" style={{ textTransform: 'uppercase' }}>
                      {selectedUser.role}
                    </span>
                    <StatusBadge status={selectedUser.status} />
                  </div>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedUser(null)} aria-label="Close">
                <X size={20} />
              </button>
            </div>

            <div className="modal-body" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
              <div className="grid-2" style={{ gap: '20px', marginBottom: '20px' }}>
                {/* Personal Information */}
                <div className="card" style={{ border: '1px solid var(--color-slate-200)', backgroundColor: 'var(--color-slate-50)' }}>
                  <div className="card-header" style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-slate-200)' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <User size={16} color="var(--color-primary)" /> Personal Profile
                    </h4>
                  </div>
                  <div className="card-body" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                    <div>
                      <span style={{ color: 'var(--color-slate-500)', fontSize: '11px', display: 'block' }}>Full Name</span>
                      <strong style={{ color: 'var(--color-slate-900)' }}>{selectedUser.full_name}</strong>
                    </div>

                    <div>
                      <span style={{ color: 'var(--color-slate-500)', fontSize: '11px', display: 'block' }}>Email</span>
                      <div className="flex items-center gap-2">
                        <Mail size={13} color="var(--color-slate-400)" />
                        <span>{selectedUser.email}</span>
                      </div>
                    </div>

                    <div>
                      <span style={{ color: 'var(--color-slate-500)', fontSize: '11px', display: 'block' }}>Phone</span>
                      <div className="flex items-center gap-2">
                        <Phone size={13} color="var(--color-slate-400)" />
                        <span>{selectedUser.phone}</span>
                      </div>
                    </div>

                    <div className="grid-3" style={{ gap: '8px' }}>
                      <div>
                        <span style={{ color: 'var(--color-slate-500)', fontSize: '11px', display: 'block' }}>Age</span>
                        <span>{selectedUser.age ? `${selectedUser.age} yrs` : 'N/A'}</span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--color-slate-500)', fontSize: '11px', display: 'block' }}>Gender</span>
                        <span>{selectedUser.gender || 'N/A'}</span>
                      </div>
                      <div>
                        <span style={{ color: 'var(--color-slate-500)', fontSize: '11px', display: 'block' }}>Blood Group</span>
                        <span className="badge badge-blood">{selectedUser.blood_group || 'N/A'}</span>
                      </div>
                    </div>

                    <div>
                      <span style={{ color: 'var(--color-slate-500)', fontSize: '11px', display: 'block' }}>City / Location</span>
                      <div className="flex items-center gap-2">
                        <MapPin size={13} color="var(--color-slate-400)" />
                        <span>{selectedUser.city || 'Not specified'}</span>
                      </div>
                    </div>

                    <div>
                      <span style={{ color: 'var(--color-slate-500)', fontSize: '11px', display: 'block' }}>Registered At</span>
                      <div className="flex items-center gap-2">
                        <Calendar size={13} color="var(--color-slate-400)" />
                        <span>{selectedUser.registered_at || selectedUser.created_at ? new Date(selectedUser.registered_at || selectedUser.created_at).toLocaleString() : 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Role Specific Details: Donor vs Receiver */}
                <div className="card" style={{ border: '1px solid var(--color-slate-200)', backgroundColor: 'var(--color-slate-50)' }}>
                  <div className="card-header" style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-slate-200)' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Activity size={16} color="var(--color-primary)" />
                      {selectedUser.role === 'donor' ? 'Clinical Donor Status' : 'Emergency Blood Requisitions'}
                    </h4>
                  </div>
                  <div className="card-body" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px' }}>
                    {selectedUser.role === 'donor' ? (
                      <>
                        <div>
                          <span style={{ color: 'var(--color-slate-500)', fontSize: '11px', display: 'block' }}>Donor Verification</span>
                          <StatusBadge status={selectedUser.donor_profile?.is_verified ? 'verified' : 'pending'} />
                        </div>
                        <div>
                          <span style={{ color: 'var(--color-slate-500)', fontSize: '11px', display: 'block' }}>Active Availability</span>
                          <span className={`badge ${selectedUser.donor_profile?.is_available !== false ? 'badge-verified' : 'badge-rejected'}`}>
                            {selectedUser.donor_profile?.is_available !== false ? 'Available for Donation' : 'Marked Unavailable'}
                          </span>
                        </div>
                        <div>
                          <span style={{ color: 'var(--color-slate-500)', fontSize: '11px', display: 'block' }}>Last Donation Date</span>
                          <strong>
                            {selectedUser.donor_profile?.last_donation_date || selectedUser.last_donation_date || 'First-time Donor / None'}
                          </strong>
                        </div>
                        <div>
                          <span style={{ color: 'var(--color-slate-500)', fontSize: '11px', display: 'block' }}>Donation Date Verification</span>
                          <StatusBadge status={selectedUser.donor_profile?.last_donation_date_status || selectedUser.last_donation_date_status || 'pending'} />
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <span style={{ color: 'var(--color-slate-500)', fontSize: '11px', display: 'block' }}>Requisitions Submitted</span>
                          <strong style={{ fontSize: '18px', color: 'var(--color-slate-900)' }}>
                            {selectedUser.blood_requests ? selectedUser.blood_requests.length : selectedUser.requests_count || 0}
                          </strong>
                        </div>
                        <div>
                          <span style={{ color: 'var(--color-slate-500)', fontSize: '11px', display: 'block' }}>Onboarding Completed</span>
                          <span className={`badge ${selectedUser.onboarding_completed ? 'badge-verified' : 'badge-pending'}`}>
                            {selectedUser.onboarding_completed ? 'Completed' : 'Incomplete'}
                          </span>
                        </div>
                      </>
                    )}

                    <div>
                      <span style={{ color: 'var(--color-slate-500)', fontSize: '11px', display: 'block' }}>User ID</span>
                      <span style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--color-slate-500)' }}>
                        {selectedUser.id || selectedUser.user_id}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Uploaded Documents */}
              <div className="card mb-4" style={{ border: '1px solid var(--color-slate-200)' }}>
                <div className="card-header" style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-slate-200)' }}>
                  <h4 style={{ fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText size={16} color="var(--color-primary)" /> Uploaded Verification Documents
                  </h4>
                </div>
                <div className="card-body" style={{ padding: '16px' }}>
                  {loadingUserDetails ? (
                    <div style={{ textAlign: 'center', padding: '16px' }}>
                      <div className="spinner" style={{ width: '24px', height: '24px', margin: '0 auto' }} />
                      <span style={{ fontSize: '12px', color: 'var(--color-slate-500)', display: 'block', marginTop: '8px' }}>
                        Loading documents...
                      </span>
                    </div>
                  ) : selectedUser.documents && selectedUser.documents.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {selectedUser.documents.map((docItem) => (
                        <div
                          key={docItem.id}
                          className="flex-between"
                          style={{
                            padding: '10px 14px',
                            backgroundColor: 'var(--color-slate-50)',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--color-slate-200)',
                            fontSize: '13px',
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <FileText size={18} color="var(--color-primary)" />
                            <div>
                              <div style={{ fontWeight: '600' }}>{docItem.original_name || docItem.file_name}</div>
                              <div style={{ fontSize: '11px', color: 'var(--color-slate-500)' }}>
                                Type: {docItem.doc_type} • Size: {Math.round((docItem.file_size || 0) / 1024)} KB
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <StatusBadge status={docItem.status} />
                            <button
                              type="button"
                              className="btn btn-outline btn-sm"
                              onClick={() => setDocToPreview(docItem)}
                            >
                              <Eye size={13} /> View
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{ fontSize: '13px', color: 'var(--color-slate-500)', margin: 0 }}>
                      No documents currently uploaded by this user.
                    </p>
                  )}
                </div>
              </div>

              {/* Blood Requests Table (if Receiver or Donor has submitted requests) */}
              {selectedUser.blood_requests && selectedUser.blood_requests.length > 0 && (
                <div className="card" style={{ border: '1px solid var(--color-slate-200)' }}>
                  <div className="card-header" style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-slate-200)' }}>
                    <h4 style={{ fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Activity size={16} color="var(--color-primary)" /> Blood Requisitions History
                    </h4>
                  </div>
                  <div className="card-body" style={{ padding: 0 }}>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ backgroundColor: 'var(--color-slate-50)', borderBottom: '1px solid var(--color-slate-200)' }}>
                            <th style={{ padding: '8px 12px' }}>Patient</th>
                            <th style={{ padding: '8px 12px' }}>Blood Group</th>
                            <th style={{ padding: '8px 12px' }}>Units</th>
                            <th style={{ padding: '8px 12px' }}>Hospital</th>
                            <th style={{ padding: '8px 12px' }}>Urgency</th>
                            <th style={{ padding: '8px 12px' }}>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedUser.blood_requests.map((req) => (
                            <tr key={req.id} style={{ borderBottom: '1px solid var(--color-slate-100)' }}>
                              <td style={{ padding: '8px 12px', fontWeight: '600' }}>{req.patient_name}</td>
                              <td style={{ padding: '8px 12px' }}><span className="badge badge-blood">{req.blood_group}</span></td>
                              <td style={{ padding: '8px 12px' }}>{req.units_needed} unit(s)</td>
                              <td style={{ padding: '8px 12px' }}>{req.hospital_name}</td>
                              <td style={{ padding: '8px 12px' }}>{req.urgency}</td>
                              <td style={{ padding: '8px 12px' }}><StatusBadge status={req.status} /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer flex-between" style={{ flexWrap: 'wrap', gap: '8px' }}>
              <button
                type="button"
                className="btn btn-danger btn-sm"
                onClick={() => {
                  const uToDel = selectedUser;
                  setSelectedUser(null);
                  setUserToDelete(uToDel);
                  setUserDeleteReason('');
                }}
                disabled={actionLoading}
              >
                <Trash2 size={14} /> Delete User
              </button>

              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setSelectedUser(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          DELETE DOCTOR POP-UP MODAL (Confirmation with Reason & Warning)
         ========================================================================= */}
      {doctorToDelete && (
        <div className="modal-backdrop" onClick={() => setDoctorToDelete(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="flex items-center gap-2">
                <Trash2 size={20} color="var(--color-primary)" />
                <h3 className="modal-title" style={{ color: 'var(--color-primary)' }}>
                  Delete Doctor Account
                </h3>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => {
                  setDoctorToDelete(null);
                  setDoctorDeleteReason('');
                }}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleDeleteDoctorSubmit}>
              <div className="modal-body">
                <div
                  className="alert alert-error"
                  style={{
                    backgroundColor: 'var(--color-primary-light)',
                    borderColor: 'var(--color-primary-border)',
                    marginBottom: '16px',
                    alignItems: 'flex-start',
                  }}
                >
                  <AlertTriangle size={20} color="var(--color-primary)" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <div>
                    <strong style={{ color: 'var(--color-primary-dark)', display: 'block', fontSize: '13px' }}>
                      This action can't be undone.
                    </strong>
                    <span style={{ fontSize: '12px', color: 'var(--color-slate-700)', marginTop: '2px', display: 'block' }}>
                      Deleting this doctor account will permanently remove their credentials and clinical profile records from LifeLink.
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: 'var(--color-slate-50)',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-slate-200)',
                    marginBottom: '16px',
                    fontSize: '13px',
                  }}
                >
                  <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--color-slate-900)' }}>
                    Dr. {doctorToDelete.full_name?.replace(/^dr\.?\s+/i, '')}
                  </div>
                  <div style={{ color: 'var(--color-slate-600)', marginTop: '3px' }}>
                    Hospital: <strong>{doctorToDelete.hospital_name}</strong>
                  </div>
                  <div style={{ color: 'var(--color-slate-600)', marginTop: '2px' }}>
                    License: <code style={{ backgroundColor: 'var(--color-slate-200)', padding: '2px 5px', borderRadius: '3px' }}>{doctorToDelete.medical_license_number}</code>
                  </div>
                  <div style={{ color: 'var(--color-slate-500)', fontSize: '12px', marginTop: '2px' }}>
                    Email: {doctorToDelete.email}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="adminDeleteDocReason">
                    Reason to Delete Doctor <span style={{ color: 'var(--color-primary)' }}>*</span>
                  </label>
                  <textarea
                    id="adminDeleteDocReason"
                    className="form-control"
                    rows={3}
                    placeholder="Enter reason to delete doctor (e.g. invalid license, hospital request, fraudulent credentials)..."
                    value={doctorDeleteReason}
                    onChange={(e) => setDoctorDeleteReason(e.target.value)}
                    required
                    autoFocus
                  />
                  <div className="form-hint" style={{ color: 'var(--color-slate-500)', fontSize: '12px', marginTop: '4px' }}>
                    A specific reason is required for administrative audit logs before deleting this profile.
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => {
                    setDoctorToDelete(null);
                    setDoctorDeleteReason('');
                  }}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-danger btn-sm"
                  disabled={actionLoading || !doctorDeleteReason.trim()}
                >
                  <Trash2 size={14} />
                  {actionLoading ? 'Deleting Doctor...' : 'Delete Doctor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          DELETE USER POP-UP MODAL (Confirmation with Reason & Warning)
         ========================================================================= */}
      {userToDelete && (
        <div className="modal-backdrop" onClick={() => setUserToDelete(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="flex items-center gap-2">
                <Trash2 size={20} color="var(--color-primary)" />
                <h3 className="modal-title" style={{ color: 'var(--color-primary)' }}>
                  Delete User Account
                </h3>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => {
                  setUserToDelete(null);
                  setUserDeleteReason('');
                }}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleDeleteUserSubmit}>
              <div className="modal-body">
                <div
                  className="alert alert-error"
                  style={{
                    backgroundColor: 'var(--color-primary-light)',
                    borderColor: 'var(--color-primary-border)',
                    marginBottom: '16px',
                    alignItems: 'flex-start',
                  }}
                >
                  <AlertTriangle size={20} color="var(--color-primary)" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <div>
                    <strong style={{ color: 'var(--color-primary-dark)', display: 'block', fontSize: '13px' }}>
                      This action can't be undone.
                    </strong>
                    <span style={{ fontSize: '12px', color: 'var(--color-slate-700)', marginTop: '2px', display: 'block' }}>
                      Deleting this user account will permanently remove all their profiles, donor history, blood requisitions, and documents from LifeLink.
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: 'var(--color-slate-50)',
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-slate-200)',
                    marginBottom: '16px',
                    fontSize: '13px',
                  }}
                >
                  <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--color-slate-900)' }}>
                    {userToDelete.full_name}
                  </div>
                  <div style={{ color: 'var(--color-slate-600)', marginTop: '3px' }}>
                    Role: <span className="badge badge-role" style={{ textTransform: 'uppercase' }}>{userToDelete.role}</span>
                  </div>
                  <div style={{ color: 'var(--color-slate-600)', marginTop: '2px' }}>
                    Blood Group: <strong>{userToDelete.blood_group || 'N/A'}</strong>
                  </div>
                  <div style={{ color: 'var(--color-slate-500)', fontSize: '12px', marginTop: '2px' }}>
                    Email: {userToDelete.email}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="adminDeleteUserReason">
                    Reason to Delete User <span style={{ color: 'var(--color-primary)' }}>*</span>
                  </label>
                  <textarea
                    id="adminDeleteUserReason"
                    className="form-control"
                    rows={3}
                    placeholder="Enter reason to delete this user (e.g. duplicate account, user request, spam profile)..."
                    value={userDeleteReason}
                    onChange={(e) => setUserDeleteReason(e.target.value)}
                    required
                    autoFocus
                  />
                  <div className="form-hint" style={{ color: 'var(--color-slate-500)', fontSize: '12px', marginTop: '4px' }}>
                    A specific reason is required for administrative records before deleting this user.
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => {
                    setUserToDelete(null);
                    setUserDeleteReason('');
                  }}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-danger btn-sm"
                  disabled={actionLoading || !userDeleteReason.trim()}
                >
                  <Trash2 size={14} />
                  {actionLoading ? 'Deleting User...' : 'Delete User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          REJECT DOCTOR MODAL
         ========================================================================= */}
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

            <form onSubmit={handleRejectDoctor}>
              <div className="modal-body">
                <p style={{ fontSize: '13px', color: 'var(--color-slate-600)', marginBottom: '14px' }}>
                  Please state the reason for rejecting this doctor registration (e.g. invalid license number, unable to verify hospital registry).
                </p>

                <div className="form-group">
                  <label className="form-label" htmlFor="adminRejectDocReason">
                    Rejection Reason <span style={{ color: 'var(--color-primary)' }}>*</span>
                  </label>
                  <textarea
                    id="adminRejectDocReason"
                    className="form-control"
                    rows={3}
                    placeholder="Enter rejection reason..."
                    value={doctorRejectionReason}
                    onChange={(e) => setDoctorRejectionReason(e.target.value)}
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
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-danger btn-sm"
                  disabled={actionLoading || !doctorRejectionReason.trim()}
                >
                  {actionLoading ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          ADD NEW HOSPITAL MODAL (Hospital Section)
         ========================================================================= */}
      {isAddHospitalOpen && (
        <div className="modal-backdrop" onClick={() => setIsAddHospitalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="flex items-center gap-2">
                <Building2 size={20} color="var(--color-primary)" />
                <h3 className="modal-title">Add New Listed Hospital</h3>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setIsAddHospitalOpen(false)}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddHospitalSubmit}>
              <div className="modal-body">
                <p style={{ fontSize: '13px', color: 'var(--color-slate-600)', marginBottom: '16px' }}>
                  Register a verified hospital facility. Once added, this hospital will immediately appear in the dropdown during physician registrations.
                </p>

                <div className="form-group">
                  <label className="form-label" htmlFor="newHospName">
                    Hospital Name <span style={{ color: 'var(--color-primary)' }}>*</span>
                  </label>
                  <input
                    id="newHospName"
                    type="text"
                    className="form-control"
                    placeholder="e.g. Kokilaben Dhirubhai Ambani Hospital"
                    value={newHospital.name}
                    onChange={(e) => setNewHospital({ ...newHospital, name: e.target.value })}
                    required
                    autoFocus
                  />
                </div>

                <div className="grid-2" style={{ gap: '12px' }}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="newHospCity">
                      City / Location <span style={{ color: 'var(--color-primary)' }}>*</span>
                    </label>
                    <input
                      id="newHospCity"
                      type="text"
                      className="form-control"
                      placeholder="e.g. Mumbai, Andheri West"
                      value={newHospital.city}
                      onChange={(e) => setNewHospital({ ...newHospital, city: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="newHospState">
                      State / Region
                    </label>
                    <input
                      id="newHospState"
                      type="text"
                      className="form-control"
                      placeholder="e.g. Maharashtra"
                      value={newHospital.state}
                      onChange={(e) => setNewHospital({ ...newHospital, state: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="newHospPhone">
                    Emergency Phone / Helpline
                  </label>
                  <input
                    id="newHospPhone"
                    type="text"
                    className="form-control"
                    placeholder="e.g. +91 22 3099 9999"
                    value={newHospital.contact_phone}
                    onChange={(e) => setNewHospital({ ...newHospital, contact_phone: e.target.value })}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="newHospAddress">
                    Address / Landmark
                  </label>
                  <textarea
                    id="newHospAddress"
                    className="form-control"
                    rows={2}
                    placeholder="e.g. Rao Saheb Achutrao Patwardhan Marg, Four Bungalows"
                    value={newHospital.address}
                    onChange={(e) => setNewHospital({ ...newHospital, address: e.target.value })}
                  />
                </div>

                <div
                  style={{
                    backgroundColor: 'var(--color-slate-50)',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-slate-200)',
                    marginTop: '16px',
                    fontSize: '12px',
                    color: 'var(--color-slate-600)',
                  }}
                >
                  ℹ️ Note: Listed hospitals are permanently recorded to preserve clinical affiliations for existing registered doctors.
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => setIsAddHospitalOpen(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={actionLoading || !newHospital.name.trim() || !newHospital.city.trim()}
                >
                  <Plus size={15} />
                  {actionLoading ? 'Adding Hospital...' : 'Save Hospital'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          DOCUMENT PREVIEWER MODAL (Inline Document Viewer)
         ========================================================================= */}
      {docToPreview && (
        <DocumentViewerModal
          document={docToPreview}
          onClose={() => setDocToPreview(null)}
        />
      )}
    </div>
  );
};
