import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import {
  User,
  Upload,
  Activity,
  FileText,
  Clock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';
import { StatusBadge } from '../../components/common/StatusBadge';

export const ReceiverOnboarding = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Step 1: Profile details
  const [phone, setPhone] = useState(user?.phone || '');
  const [city, setCity] = useState(user?.city || '');
  const [bloodGroup, setBloodGroup] = useState(user?.blood_group || 'O+');
  const [age, setAge] = useState(user?.age || '');

  // Step 2: Documents (ID Proof & Medical Requisition)
  const [idFile, setIdFile] = useState(null);
  const [medFile, setMedFile] = useState(null);

  // Step 3: Blood Request
  const [patientName, setPatientName] = useState('');
  const [reqBloodGroup, setReqBloodGroup] = useState('O+');
  const [unitsNeeded, setUnitsNeeded] = useState(2);
  const [hospitalName, setHospitalName] = useState('');
  const [urgency, setUrgency] = useState('urgent');

  // Step 1 Submit
  const handleStep1Submit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.updateOnboardingDetails({ phone, city, blood_group: bloodGroup, age });
      await refreshUser();
      setCurrentStep(2);
    } catch (err) {
      setError(err.message || 'Failed to update profile details');
    } finally {
      setLoading(false);
    }
  };

  // Step 2 Submit (Upload ID Proof and Medical Requisition)
  const handleStep2Submit = async (e) => {
    e.preventDefault();
    if (!idFile || !medFile) {
      setError('Both ID proof and Hospital Medical Requisition are mandatory.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await api.uploadDocument(idFile, 'id_proof');
      await api.uploadDocument(medFile, 'medical_requisition');
      setCurrentStep(3);
    } catch (err) {
      setError(err.message || 'Document upload failed');
    } finally {
      setLoading(false);
    }
  };

  // Step 3 Submit (Create Initial Blood Request)
  const handleStep3Submit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.createBloodRequest({
        patient_name: patientName,
        blood_group: reqBloodGroup,
        units_needed: unitsNeeded,
        hospital_name: hospitalName,
        city: city || user?.city,
        urgency,
      });

      await api.completeOnboarding();
      await refreshUser();
      setCurrentStep(4);
    } catch (err) {
      setError(err.message || 'Failed to create blood request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-narrow my-12">
      {/* Visible Step Indicator */}
      <div className="wizard-steps">
        <div className="wizard-line" />

        <div className={`wizard-step ${currentStep === 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
          <div className="wizard-circle">1</div>
          <div className="wizard-label">Profile</div>
        </div>

        <div className={`wizard-step ${currentStep === 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
          <div className="wizard-circle">2</div>
          <div className="wizard-label">Documents</div>
        </div>

        <div className={`wizard-step ${currentStep === 3 ? 'active' : ''} ${currentStep > 3 ? 'completed' : ''}`}>
          <div className="wizard-circle">3</div>
          <div className="wizard-label">Requisition</div>
        </div>

        <div className={`wizard-step ${currentStep === 4 ? 'active' : ''}`}>
          <div className="wizard-circle">4</div>
          <div className="wizard-label">Complete</div>
        </div>
      </div>

      <div className="card">
        {error && (
          <div style={{ padding: '16px 24px 0' }}>
            <div className="alert alert-error">
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* STEP 1: Profile Details */}
        {currentStep === 1 && (
          <form onSubmit={handleStep1Submit}>
            <div className="card-header">
              <div>
                <h3 className="card-title">Step 1: Confirm Patient / Attendant Profile</h3>
                <p className="card-subtitle">Ensure contact info is accurate for emergency hospital communication</p>
              </div>
            </div>

            <div className="card-body">
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input type="text" className="form-control" value={user?.full_name} disabled />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input type="email" className="form-control" value={user?.email} disabled />
                </div>
              </div>

              <div className="grid-3">
                <div className="form-group">
                  <label className="form-label" htmlFor="recBGroup">Patient Blood Group</label>
                  <select
                    id="recBGroup"
                    className="form-select"
                    value={bloodGroup}
                    onChange={(e) => {
                      setBloodGroup(e.target.value);
                      setReqBloodGroup(e.target.value);
                    }}
                  >
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="recAge">Age</label>
                  <input
                    id="recAge"
                    type="number"
                    className="form-control"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="recPhone">Emergency Phone</label>
                  <input
                    id="recPhone"
                    type="tel"
                    className="form-control"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="recCity">City</label>
                <input
                  id="recCity"
                  type="text"
                  className="form-control"
                  placeholder="e.g. Mumbai"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="card-footer" style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving...' : 'Next: Upload Documents'}
                <ArrowRight size={16} />
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: Upload ID Proof & Medical Requisition */}
        {currentStep === 2 && (
          <form onSubmit={handleStep2Submit}>
            <div className="card-header">
              <div>
                <h3 className="card-title">Step 2: Upload Verification Documents</h3>
                <p className="card-subtitle">Upload ID proof and Doctor's Blood Requisition (JPG, PNG, or PDF)</p>
              </div>
            </div>

            <div className="card-body">
              {/* Document 1: ID Proof */}
              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label">1. Government Identity Proof (Aadhaar / Passport / DL)</label>
                <label
                  htmlFor="recIdInput"
                  className={`upload-zone ${idFile ? 'active' : ''}`}
                  style={{ display: 'block' }}
                >
                  <Upload size={28} color="var(--color-primary)" style={{ margin: '0 auto 8px' }} />
                  <p style={{ fontWeight: '600', fontSize: '14px' }}>
                    {idFile ? idFile.name : 'Choose ID Proof File'}
                  </p>
                  <input
                    id="recIdInput"
                    type="file"
                    accept="image/jpeg,image/png,application/pdf"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      if (e.target.files?.[0]) setIdFile(e.target.files[0]);
                    }}
                  />
                </label>
              </div>

              {/* Document 2: Medical Requisition */}
              <div className="form-group">
                <label className="form-label">2. Doctor / Hospital Blood Requisition Form</label>
                <label
                  htmlFor="recMedInput"
                  className={`upload-zone ${medFile ? 'active' : ''}`}
                  style={{ display: 'block' }}
                >
                  <Upload size={28} color="var(--color-primary)" style={{ margin: '0 auto 8px' }} />
                  <p style={{ fontWeight: '600', fontSize: '14px' }}>
                    {medFile ? medFile.name : 'Choose Hospital Blood Requisition / Prescription'}
                  </p>
                  <input
                    id="recMedInput"
                    type="file"
                    accept="image/jpeg,image/png,application/pdf"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      if (e.target.files?.[0]) setMedFile(e.target.files[0]);
                    }}
                  />
                </label>
              </div>
            </div>

            <div className="card-footer" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setCurrentStep(1)}
              >
                <ArrowLeft size={16} /> Back
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || !idFile || !medFile}
              >
                {loading ? 'Uploading Files...' : 'Next: Create Blood Request'}
                <ArrowRight size={16} />
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: Create Blood Request */}
        {currentStep === 3 && (
          <form onSubmit={handleStep3Submit}>
            <div className="card-header">
              <div>
                <h3 className="card-title">Step 3: Create Emergency Blood Request</h3>
                <p className="card-subtitle">This requisition will be reviewed by the hospital doctor before donor broadcast</p>
              </div>
            </div>

            <div className="card-body">
              <div className="form-group">
                <label className="form-label" htmlFor="patName">Patient Name</label>
                <input
                  id="patName"
                  type="text"
                  className="form-control"
                  placeholder="e.g. Sunita Deshmukh"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  required
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="reqBg">Blood Group Required</label>
                  <select
                    id="reqBg"
                    className="form-select"
                    value={reqBloodGroup}
                    onChange={(e) => setReqBloodGroup(e.target.value)}
                  >
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="units">Units Required</label>
                  <input
                    id="units"
                    type="number"
                    className="form-control"
                    value={unitsNeeded}
                    onChange={(e) => setUnitsNeeded(e.target.value)}
                    min={1}
                    max={10}
                    required
                  />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label" htmlFor="hosp">Hospital Name & Campus</label>
                  <input
                    id="hosp"
                    type="text"
                    className="form-control"
                    placeholder="e.g. Lilavati Hospital, Bandra"
                    value={hospitalName}
                    onChange={(e) => setHospitalName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="urg">Urgency Level</label>
                  <select
                    id="urg"
                    className="form-select"
                    value={urgency}
                    onChange={(e) => setUrgency(e.target.value)}
                  >
                    <option value="critical">Critical (Immediate surgery / ICU)</option>
                    <option value="urgent">Urgent (Within 24 Hours)</option>
                    <option value="planned">Planned (Scheduled procedure)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="card-footer" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setCurrentStep(2)}
              >
                <ArrowLeft size={16} /> Back
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading || !patientName || !hospitalName}
              >
                {loading ? 'Submitting Request...' : 'Submit Requisition'}
                <ArrowRight size={16} />
              </button>
            </div>
          </form>
        )}

        {/* STEP 4: Complete */}
        {currentStep === 4 && (
          <div>
            <div className="card-body" style={{ textAlign: 'center', padding: '48px 24px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--status-pending-bg)', border: '2px solid var(--status-pending-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--status-pending-text)' }}>
                <Clock size={32} />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <StatusBadge status="pending" label="Pending Doctor Verification" />
              </div>

              <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '10px' }}>
                Blood Requisition Submitted
              </h2>

              <p style={{ color: 'var(--color-slate-600)', fontSize: '14px', lineHeight: 1.6, maxWidth: '480px', margin: '0 auto 24px' }}>
                Your request and uploaded prescription have been routed to the hospital verification queue. Once approved by the attending physician, it will be automatically broadcast to verified compatible donors.
              </p>

              <button
                type="button"
                className="btn btn-primary btn-lg"
                onClick={() => navigate('/receiver/dashboard')}
              >
                View Request in Dashboard
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

