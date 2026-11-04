import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { Activity, ArrowRight, ArrowLeft } from 'lucide-react';

export const CreateRequest = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [patientName, setPatientName] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [unitsNeeded, setUnitsNeeded] = useState(2);
  const [hospitalName, setHospitalName] = useState('');
  const [city, setCity] = useState(user?.city || '');
  const [urgency, setUrgency] = useState('urgent');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.createBloodRequest({
        patient_name: patientName,
        blood_group: bloodGroup,
        units_needed: unitsNeeded,
        hospital_name: hospitalName,
        city,
        urgency,
      });

      alert('Blood request submitted successfully! It has been routed to the hospital doctor verification queue.');
      if (user?.role === 'donor') {
        navigate('/donor/dashboard');
      } else {
        navigate('/receiver/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Failed to submit blood request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-narrow my-12">
      <div style={{ marginBottom: '24px' }}>
        <button
          className="btn btn-outline btn-sm"
          onClick={() => navigate(-1)}
          style={{ marginBottom: '12px' }}
        >
          <ArrowLeft size={14} /> Back
        </button>
        <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--color-slate-900)' }}>
          Create Emergency Blood Requisition
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--color-slate-500)', marginTop: '4px' }}>
          Submitted requisitions are verified by hospital doctors before broadcasting to verified donors
        </p>
      </div>

      <div className="card">
        <div className="card-body">
          {error && (
            <div className="alert alert-error">
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="reqPatient">Patient Full Name</label>
              <input
                id="reqPatient"
                type="text"
                className="form-control"
                placeholder="e.g. Ramesh Deshmukh"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                required
              />
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="reqBloodGroup">Blood Group Required</label>
                <select
                  id="reqBloodGroup"
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
                <label className="form-label" htmlFor="reqUnits">Units Required</label>
                <input
                  id="reqUnits"
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
                <label className="form-label" htmlFor="reqHospital">Hospital & Campus</label>
                <input
                  id="reqHospital"
                  type="text"
                  className="form-control"
                  placeholder="e.g. Lilavati Hospital & Research Centre"
                  value={hospitalName}
                  onChange={(e) => setHospitalName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="reqCity">City</label>
                <input
                  id="reqCity"
                  type="text"
                  className="form-control"
                  placeholder="e.g. Mumbai"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reqUrgency">Urgency Level</label>
              <select
                id="reqUrgency"
                className="form-select"
                value={urgency}
                onChange={(e) => setUrgency(e.target.value)}
              >
                <option value="critical">Critical (Immediate surgery / ICU)</option>
                <option value="urgent">Urgent (Needed within 24 Hours)</option>
                <option value="planned">Planned (Scheduled procedure)</option>
              </select>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-block btn-lg"
              disabled={loading || !patientName || !hospitalName}
              style={{ marginTop: '20px' }}
            >
              {loading ? 'Submitting Request...' : 'Submit Blood Requisition'}
              {!loading && <ArrowRight size={16} />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

