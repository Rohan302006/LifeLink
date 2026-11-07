import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { Heart, UserCheck, Activity, Stethoscope, ArrowRight } from 'lucide-react';

export const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [role, setRole] = useState(searchParams.get('role') || 'donor');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [city, setCity] = useState('');

  // Doctor specific fields
  const [medicalLicense, setMedicalLicense] = useState('');
  const [hospitalName, setHospitalName] = useState('');
  const [hospitals, setHospitals] = useState([]);
  const [loadingHospitals, setLoadingHospitals] = useState(false);

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchHospitals = async () => {
      try {
        setLoadingHospitals(true);
        const res = await api.getHospitals();
        setHospitals(res.hospitals || []);
      } catch (err) {
        console.warn('Could not fetch hospitals list:', err.message);
      } finally {
        setLoadingHospitals(false);
      }
    };
    fetchHospitals();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payload = {
        role,
        name,
        email,
        password,
        phone,
        age: age ? parseInt(age, 10) : null,
        gender,
        blood_group: bloodGroup,
        city,
      };

      if (role === 'doctor') {
        if (!medicalLicense || !hospitalName) {
          throw new Error('Medical license number and hospital affiliation are required for doctors.');
        }
        payload.medical_license_number = medicalLicense;
        payload.hospital_name = hospitalName;
        payload.hospital_city = city;
      }

      const user = await register(payload);

      // Route based on role
      if (role === 'doctor') {
        navigate('/doctor/dashboard');
      } else {
        // Linear Onboarding wizard
        navigate(`/onboarding/${role}`);
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please review your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-narrow my-12">
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <div className="brand-icon" style={{ margin: '0 auto 12px', width: '48px', height: '48px' }}>
          <Heart size={24} fill="#ffffff" />
        </div>
        <h1 style={{ fontSize: '26px', fontWeight: '800', color: 'var(--color-slate-900)' }}>
          Create Your LifeLink Account
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--color-slate-500)', marginTop: '4px' }}>
          Join the doctor-supervised emergency blood coordination network
        </p>
      </div>

      <div className="card">
        <div className="card-body">
          {error && (
            <div className="alert alert-error">
              <span>{error}</span>
            </div>
          )}

          {/* Role Picker (Donor / Receiver / Doctor) */}
          <div className="form-group">
            <label className="form-label">Select Your Role</label>
            <div className="grid-3">
              <button
                type="button"
                onClick={() => setRole('donor')}
                className={`btn btn-outline ${role === 'donor' ? 'btn-primary' : ''}`}
                style={{
                  padding: '12px 8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  height: 'auto',
                }}
              >
                <Heart size={20} />
                <span style={{ fontSize: '13px', fontWeight: '700' }}>Donor</span>
                <span style={{ fontSize: '11px', opacity: 0.8 }}>I want to donate</span>
              </button>

              <button
                type="button"
                onClick={() => setRole('receiver')}
                className={`btn btn-outline ${role === 'receiver' ? 'btn-primary' : ''}`}
                style={{
                  padding: '12px 8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  height: 'auto',
                }}
              >
                <Activity size={20} />
                <span style={{ fontSize: '13px', fontWeight: '700' }}>Receiver</span>
                <span style={{ fontSize: '11px', opacity: 0.8 }}>Patient / Attendant</span>
              </button>

              <button
                type="button"
                onClick={() => setRole('doctor')}
                className={`btn btn-outline ${role === 'doctor' ? 'btn-primary' : ''}`}
                style={{
                  padding: '12px 8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  height: 'auto',
                }}
              >
                <Stethoscope size={20} />
                <span style={{ fontSize: '13px', fontWeight: '700' }}>Doctor</span>
                <span style={{ fontSize: '11px', opacity: 0.8 }}>Hospital Verifier</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="name">Full Name</label>
                <input
                  id="name"
                  type="text"
                  className="form-control"
                  placeholder="e.g. Aarav Patil"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="phone">Phone Number</label>
                <input
                  id="phone"
                  type="tel"
                  className="form-control"
                  placeholder="+91 98200 00000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  className="form-control"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  className="form-control"
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
            </div>

            <div className="grid-3">
              <div className="form-group">
                <label className="form-label" htmlFor="bloodGroup">Blood Group</label>
                <select
                  id="bloodGroup"
                  className="form-select"
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                >
                  <option value="O+">O+</option>
                  <option value="O-">O- (Universal)</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="age">Age</label>
                <input
                  id="age"
                  type="number"
                  className="form-control"
                  placeholder="e.g. 28"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  min={18}
                  max={75}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="gender">Gender</label>
                <select
                  id="gender"
                  className="form-select"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="city">City / Locality</label>
              <input
                id="city"
                type="text"
                className="form-control"
                placeholder="e.g. Mumbai, Bandra West"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
              />
            </div>

            {/* Doctor Specific Fields */}
            {role === 'doctor' && (
              <div style={{ padding: '16px', backgroundColor: 'var(--color-slate-50)', border: '1px solid var(--color-slate-200)', borderRadius: 'var(--radius-md)', marginBottom: '16px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: '700', marginBottom: '12px', color: 'var(--color-slate-900)' }}>
                  Hospital Physician Credentials
                </h4>
                <div className="form-group">
                  <label className="form-label" htmlFor="license">Medical License Number</label>
                  <input
                    id="license"
                    type="text"
                    className="form-control"
                    placeholder="e.g. MCI-2024-88419"
                    value={medicalLicense}
                    onChange={(e) => setMedicalLicense(e.target.value)}
                    required
                  />
                  <p className="form-hint">State Medical Council or National Medical Commission registration.</p>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" htmlFor="hospital">Hospital Affiliation</label>
                  <select
                    id="hospital"
                    className="form-select"
                    value={hospitalName}
                    onChange={(e) => {
                      setHospitalName(e.target.value);
                      const matched = hospitals.find((h) => h.name === e.target.value);
                      if (matched && matched.city && !city) {
                        setCity(matched.city);
                      }
                    }}
                    required
                  >
                    <option value="">
                      {loadingHospitals ? 'Loading listed hospitals...' : 'Select Affiliated Hospital...'}
                    </option>
                    {hospitals.map((hosp) => (
                      <option key={hosp.id || hosp.name} value={hosp.name}>
                        {hosp.name} ({hosp.city})
                      </option>
                    ))}
                  </select>
                  <p className="form-hint">
                    Notice: Doctor accounts stay "Pending" until an Admin approves your license. (Hospital listed by Platform Admin).
                  </p>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-block btn-lg"
              disabled={loading}
              style={{ marginTop: '24px' }}
            >
              {loading ? 'Creating Account...' : role === 'doctor' ? 'Submit for Admin Approval' : 'Continue to Onboarding Wizard'}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>
        </div>

        <div className="card-footer" style={{ textAlign: 'center', fontSize: '13px' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ fontWeight: '700', color: 'var(--color-primary)' }}>
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};

