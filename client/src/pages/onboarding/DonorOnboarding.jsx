import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import {
  User,
  Upload,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { StatusBadge } from '../../components/common/StatusBadge';

export const DonorOnboarding = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Step 1: Details
  const [phone, setPhone] = useState(user?.phone || '');
  const [city, setCity] = useState(user?.city || '');
  const [bloodGroup, setBloodGroup] = useState(user?.blood_group || 'O+');
  const [age, setAge] = useState(user?.age || '');

  // Step 2: ID Proof File
  const [idFile, setIdFile] = useState(null);
  const [idUploaded, setIdUploaded] = useState(false);

  // Step 3: Donation Date & Proof File
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [lastDonationDate, setLastDonationDate] = useState('');
  const [donationProofFile, setDonationProofFile] = useState(null);
  const [donationProofUploaded, setDonationProofUploaded] = useState(false);

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
      setError(err.message || 'Failed to update details');
    } finally {
      setLoading(false);
    }
  };

  // Step 2 Submit (Upload ID Proof)
  const handleStep2Submit = async (e) => {
    e.preventDefault();
    if (!idFile && !idUploaded) {
      setError('Please select an ID proof file (JPG, PNG, or PDF).');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      if (idFile) {
        await api.uploadDocument(idFile, 'id_proof');
        setIdUploaded(true);
      }
      setCurrentStep(3);
    } catch (err) {
      setError(err.message || 'ID proof upload failed');
    } finally {
      setLoading(false);
    }
  };

  // Step 3 Submit (Donation Date & Certificate)
  const handleStep3Submit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!isFirstTime) {
      if (!lastDonationDate) {
        setError('Please select your last donation date or check "First-time donor".');
        return;
      }
      if (!donationProofFile && !donationProofUploaded) {
        setError('Please upload your donation certificate or receipt.');
        return;
      }
    }

    setLoading(true);
    try {
      if (!isFirstTime) {
        await api.updateDonationDate(lastDonationDate);
        if (donationProofFile) {
          await api.uploadDocument(donationProofFile, 'donation_proof');
          setDonationProofUploaded(true);
        }
      } else {
        await api.updateDonationDate(null);
      }

      await api.completeOnboarding();
      await refreshUser();
      setCurrentStep(4);
    } catch (err) {
      setError(err.message || 'Failed to record donation proof');
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
          <div className="wizard-label">ID Proof</div>
        </div>

        <div className={`wizard-step ${currentStep === 3 ? 'active' : ''} ${currentStep > 3 ? 'completed' : ''}`}>
          <div className="wizard-circle">3</div>
          <div className="wizard-label">Donation History</div>
        </div>

        <div className={`wizard-step ${currentStep === 4 ? 'active' : ''}`}>
          <div className="wizard-circle">4</div>
          <div className="wizard-label">Verification</div>
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
                <h3 className="card-title">Step 1: Confirm Donor Profile</h3>
                <p className="card-subtitle">Verify your basic details for hospital matching</p>
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
                  <label className="form-label" htmlFor="bGroup">Blood Group</label>
                  <select
                    id="bGroup"
                    className="form-select"
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
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
                  <label className="form-label" htmlFor="ageInput">Age</label>
                  <input
                    id="ageInput"
                    type="number"
                    className="form-control"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    required
                    min={18}
                    max={75}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="phoneInput">Phone</label>
                  <input
                    id="phoneInput"
                    type="tel"
                    className="form-control"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="cityInput">City / Locality</label>
                <input
                  id="cityInput"
                  type="text"
                  className="form-control"
                  placeholder="e.g. Bandra West, Mumbai"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="card-footer" style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving...' : 'Next: Upload ID Proof'}
                <ArrowRight size={16} />
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: Upload ID Proof */}
        {currentStep === 2 && (
          <form onSubmit={handleStep2Submit}>
            <div className="card-header">
              <div>
                <h3 className="card-title">Step 2: Upload Government ID Proof</h3>
                <p className="card-subtitle">Upload Aadhaar, Passport, or Driver's License (JPG, PNG, or PDF)</p>
              </div>
            </div>

            <div className="card-body">
              <label
                htmlFor="idFileInput"
                className={`upload-zone ${idFile ? 'active' : ''}`}
                style={{ display: 'block' }}
              >
                <Upload size={36} color="var(--color-primary)" style={{ margin: '0 auto 12px' }} />
                <p style={{ fontWeight: '700', fontSize: '15px', color: 'var(--color-slate-900)' }}>
                  {idFile ? idFile.name : 'Click or drag file to upload ID proof'}
                </p>
                <p style={{ fontSize: '12px', color: 'var(--color-slate-500)', marginTop: '4px' }}>
                  Maximum file size: 5 MB. Supported formats: JPG, PNG, PDF.
                </p>
                <input
                  id="idFileInput"
                  type="file"
                  accept="image/jpeg,image/png,application/pdf"
                  style={{ display: 'none' }}
                  onChange={(e) => {
                    if (e.target.files?.[0]) setIdFile(e.target.files[0]);
                  }}
                />
              </label>

              {idFile && (
                <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-slate-100)', fontSize: '13px' }}>
                  <FileText size={16} />
                  <span style={{ fontWeight: '600', flex: 1 }}>{idFile.name}</span>
                  <span style={{ color: 'var(--color-slate-500)' }}>
                    ({Math.round(idFile.size / 1024)} KB)
                  </span>
                </div>
              )}
            </div>

            <div className="card-footer" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setCurrentStep(1)}
              >
                <ArrowLeft size={16} /> Back
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading || !idFile}>
                {loading ? 'Uploading...' : 'Next: Donation History'}
                <ArrowRight size={16} />
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: Donation Date & Certificate */}
        {currentStep === 3 && (
          <form onSubmit={handleStep3Submit}>
            <div className="card-header">
              <div>
                <h3 className="card-title">Step 3: Blood Donation History</h3>
                <p className="card-subtitle">
                  Eligibility cooldown is calculated strictly from a doctor-verified donation date
                </p>
              </div>
            </div>

            <div className="card-body">
              <div className="form-group" style={{ marginBottom: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
                  <input
                    type="checkbox"
                    checked={isFirstTime}
                    onChange={(e) => {
                      setIsFirstTime(e.target.checked);
                      if (e.target.checked) {
                        setLastDonationDate('');
                        setDonationProofFile(null);
                      }
                    }}
                  />
                  <span>I am a first-time donor (I have never donated blood before)</span>
                </label>
              </div>

              {!isFirstTime && (
                <>
                  <div className="form-group">
                    <label className="form-label" htmlFor="donationDate">
                      Date of Last Blood Donation
                    </label>
                    <input
                      id="donationDate"
                      type="date"
                      className="form-control"
                      value={lastDonationDate}
                      onChange={(e) => setLastDonationDate(e.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                      required={!isFirstTime}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Upload Donation Certificate or Receipt
                    </label>
                    <label
                      htmlFor="certInput"
                      className={`upload-zone ${donationProofFile ? 'active' : ''}`}
                      style={{ display: 'block' }}
                    >
                      <Upload size={32} color="var(--color-primary)" style={{ margin: '0 auto 8px' }} />
                      <p style={{ fontWeight: '600', fontSize: '14px' }}>
                        {donationProofFile ? donationProofFile.name : 'Upload Certificate / Receipt (PDF/Image)'}
                      </p>
                      <p style={{ fontSize: '12px', color: 'var(--color-slate-500)', marginTop: '2px' }}>
                        Blood bank certificate, donor card, or official phlebotomy receipt
                      </p>
                      <input
                        id="certInput"
                        type="file"
                        accept="image/jpeg,image/png,application/pdf"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          if (e.target.files?.[0]) setDonationProofFile(e.target.files[0]);
                        }}
                      />
                    </label>

                    {donationProofFile && (
                      <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-slate-100)', fontSize: '13px' }}>
                        <FileText size={16} />
                        <span style={{ fontWeight: '600', flex: 1 }}>{donationProofFile.name}</span>
                        <span style={{ color: 'var(--color-slate-500)' }}>
                          ({Math.round(donationProofFile.size / 1024)} KB)
                        </span>
                      </div>
                    )}
                  </div>
                </>
              )}
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
                disabled={loading || (!isFirstTime && (!lastDonationDate || !donationProofFile))}
              >
                {loading ? 'Submitting...' : 'Submit for Verification'}
                <ArrowRight size={16} />
              </button>
            </div>
          </form>
        )}

        {/* STEP 4: Status = Pending Verification */}
        {currentStep === 4 && (
          <div>
            <div className="card-body" style={{ textAlign: 'center', padding: '48px 24px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--status-pending-bg)', border: '2px solid var(--status-pending-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--status-pending-text)' }}>
                <Clock size={32} />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <StatusBadge status="pending" label="Pending Verification" />
              </div>

              <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '10px' }}>
                Onboarding Submitted Successfully
              </h2>

              <p style={{ color: 'var(--color-slate-600)', fontSize: '14px', lineHeight: 1.6, maxWidth: '480px', margin: '0 auto 24px' }}>
                Your identity proof and donation records have been received. An authorized hospital doctor will review your documents. Your eligibility cooldown timer will activate as soon as your donation date is verified.
              </p>

              <button
                type="button"
                className="btn btn-primary btn-lg"
                onClick={() => navigate('/donor/dashboard')}
              >
                Enter Donor Dashboard
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

