import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { Hospital, UserRole } from '../types';
import { Heart, UserCheck, Activity, Stethoscope, ShieldAlert, Check, KeyRound } from 'lucide-react';

export const Register: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [role, setRole] = useState<UserRole>((searchParams.get('role') as UserRole) || 'donor');
  const [hospitals, setHospitals] = useState<Hospital[]>([]);

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [previewOtp, setPreviewOtp] = useState<string | null>(null);

  // Donor fields
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [approxArea, setApproxArea] = useState('Bandra West');
  const [isFirstTime, setIsFirstTime] = useState(false);
  const [lastDonationDate, setLastDonationDate] = useState('');
  const [consentStorage, setConsentStorage] = useState(false);
  const [consentPrivacy, setConsentPrivacy] = useState(false);
  const [consentDoctor, setConsentDoctor] = useState(false);

  // Doctor fields
  const [hospitalId, setHospitalId] = useState('hosp-101');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [specialization, setSpecialization] = useState('Transfusion Medicine');

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getHospitals()
      .then(res => setHospitals(res.hospitals))
      .catch(err => console.warn('Could not load hospitals:', err));
  }, []);

  const handleSendOtp = async () => {
    if (!phone) {
      setError('Please enter a phone number first');
      return;
    }
    setError(null);
    try {
      const res = await api.sendOtp(phone);
      setOtpSent(true);
      setPreviewOtp(res.previewCode);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (role === 'donor' && (!consentStorage || !consentPrivacy || !consentDoctor)) {
      setError('Please agree to all mandatory safety and consent checkboxes.');
      return;
    }

    setLoading(true);
    try {
      await register({
        role,
        full_name: fullName,
        email,
        phone,
        password,
        otpCode: otpCode || '123456',
        blood_group: bloodGroup,
        approx_area: approxArea,
        last_donation_date: isFirstTime ? null : (lastDonationDate || null),
        hospital_id: hospitalId,
        medical_license_number: licenseNumber,
        specialization,
      });

      if (role === 'doctor') navigate('/doctor/queue');
      else if (role === 'donor') navigate('/donor/dashboard');
      else navigate('/requests/new');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto my-12 px-4 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-xl bg-brand-600 flex items-center justify-center text-white mx-auto shadow-sm">
          <Heart className="w-6 h-6 fill-white" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Create Your LifeLink Account</h1>
        <p className="text-xs text-slate-500">Join the doctor-supervised blood and organ coordination network</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
        {/* Role Selector Tabs */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">Select Account Role</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => { setRole('donor'); setError(null); }}
              className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-colors ${
                role === 'donor'
                  ? 'border-brand-600 bg-brand-50/50 text-brand-900 ring-1 ring-brand-600'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <UserCheck className={`w-5 h-5 mb-1 ${role === 'donor' ? 'text-brand-600' : 'text-slate-400'}`} />
              <div>
                <strong className="block text-xs">Volunteer Donor</strong>
                <span className="text-[10px] text-slate-500">Donate blood / pledge</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => { setRole('requester'); setError(null); }}
              className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-colors ${
                role === 'requester'
                  ? 'border-brand-600 bg-brand-50/50 text-brand-900 ring-1 ring-brand-600'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <Activity className={`w-5 h-5 mb-1 ${role === 'requester' ? 'text-brand-600' : 'text-slate-400'}`} />
              <div>
                <strong className="block text-xs">Patient Attendant</strong>
                <span className="text-[10px] text-slate-500">Need emergency blood</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => { setRole('doctor'); setError(null); }}
              className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-colors ${
                role === 'doctor'
                  ? 'border-brand-600 bg-brand-50/50 text-brand-900 ring-1 ring-brand-600'
                  : 'border-slate-200 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <Stethoscope className={`w-5 h-5 mb-1 ${role === 'doctor' ? 'text-brand-600' : 'text-slate-400'}`} />
              <div>
                <strong className="block text-xs">Hospital Verifier</strong>
                <span className="text-[10px] text-slate-500">Physician queue</span>
              </div>
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Legal Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="e.g. Aarav Patil"
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-1 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-1 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Number (Phone OTP)</label>
              <div className="flex space-x-2">
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+91 98202 10000"
                  className="flex-1 text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-1 focus:ring-brand-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleSendOtp}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs px-2.5 rounded-lg whitespace-nowrap"
                >
                  Send OTP
                </button>
              </div>
              {previewOtp && (
                <div className="mt-1 text-[10px] text-emerald-700 bg-emerald-50 p-1.5 rounded">
                  Mock OTP: <code>{previewOtp}</code>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Verify OTP (or enter 123456)</label>
              <input
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={e => setOtpCode(e.target.value)}
                placeholder="123456"
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 tracking-wider focus:ring-1 focus:ring-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Create Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-1 focus:ring-brand-500 focus:outline-none"
            />
          </div>

          {/* Role-Specific Fields: DONOR */}
          {role === 'donor' && (
            <div className="pt-3 border-t border-slate-100 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Donor Clinical Information</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Blood Group</label>
                  <select
                    value={bloodGroup}
                    onChange={e => setBloodGroup(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-1 focus:ring-brand-500 focus:outline-none"
                  >
                    {['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'].map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Locality (Metro Area)</label>
                  <select
                    value={approxArea}
                    onChange={e => setApproxArea(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white focus:ring-1 focus:ring-brand-500 focus:outline-none"
                  >
                    <option value="Bandra West">Bandra West</option>
                    <option value="Bandra East">Bandra East</option>
                    <option value="Khar West">Khar West</option>
                    <option value="Parel">Parel</option>
                    <option value="Dadar West">Dadar West</option>
                    <option value="Andheri West">Andheri West</option>
                    <option value="Colaba">Colaba</option>
                    <option value="Ghatkopar">Ghatkopar</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Last Donation Date</label>
                <div className="space-y-2">
                  <input
                    type="date"
                    disabled={isFirstTime}
                    value={lastDonationDate}
                    onChange={e => setLastDonationDate(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 disabled:opacity-50"
                  />
                  <label className="flex items-center space-x-2 text-xs text-slate-600">
                    <input
                      type="checkbox"
                      checked={isFirstTime}
                      onChange={e => {
                        setIsFirstTime(e.target.checked);
                        if (e.target.checked) setLastDonationDate('');
                      }}
                      className="rounded border-slate-300 text-brand-600"
                    />
                    <span>I am a first-time donor (No prior cooldown)</span>
                  </label>
                </div>
              </div>

              {/* Consent Checkboxes (DPDP Act & Medical Safety) */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
                <span className="font-semibold text-slate-800 block text-[11px] uppercase tracking-wider">
                  Mandatory Consent & Privacy Terms (DPDP Act 2023)
                </span>
                <label className="flex items-start space-x-2 text-slate-600">
                  <input
                    type="checkbox"
                    checked={consentStorage}
                    onChange={e => setConsentStorage(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-brand-600"
                  />
                  <span>I consent to storing my blood group and approximate area for emergency matching.</span>
                </label>
                <label className="flex items-start space-x-2 text-slate-600">
                  <input
                    type="checkbox"
                    checked={consentPrivacy}
                    onChange={e => setConsentPrivacy(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-brand-600"
                  />
                  <span>I understand my phone number and exact GPS coordinates remain strictly hidden until I voluntarily accept an emergency request.</span>
                </label>
                <label className="flex items-start space-x-2 text-slate-600">
                  <input
                    type="checkbox"
                    checked={consentDoctor}
                    onChange={e => setConsentDoctor(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-brand-600"
                  />
                  <span>I understand that LifeLink is a coordination tool and final clinical donor eligibility is always determined on-site by a physician.</span>
                </label>
              </div>
            </div>
          )}

          {/* Role-Specific Fields: DOCTOR */}
          {role === 'doctor' && (
            <div className="pt-3 border-t border-slate-100 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Hospital Physician Credentials</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Affiliated Hospital</label>
                  <select
                    value={hospitalId}
                    onChange={e => setHospitalId(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 bg-white"
                  >
                    {hospitals.map(h => (
                      <option key={h.id} value={h.id}>{h.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">State Medical License #</label>
                  <input
                    type="text"
                    required
                    value={licenseNumber}
                    onChange={e => setLicenseNumber(e.target.value)}
                    placeholder="e.g. MMC-2016-04-1234"
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5"
                  />
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold text-xs py-3 rounded-xl transition-colors shadow-sm"
          >
            {loading ? 'Creating Account...' : 'Complete Registration'}
          </button>
        </form>

        <div className="text-center text-xs text-slate-500">
          Already registered?{' '}
          <Link to="/login" className="text-brand-600 font-semibold hover:underline">
            Log in to your account
          </Link>
        </div>
      </div>
    </div>
  );
};
