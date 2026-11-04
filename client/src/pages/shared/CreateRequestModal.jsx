import React, { useState } from 'react';
import { X, Activity, ArrowRight } from 'lucide-react';
import { api } from '../../services/api';

export const CreateRequestModal = ({ onClose, onSuccess }) => {
  const [patientName, setPatientName] = useState('');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [unitsNeeded, setUnitsNeeded] = useState(2);
  const [hospitalName, setHospitalName] = useState('');
  const [city, setCity] = useState('');
  const [urgency, setUrgency] = useState('urgent');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await api.createBloodRequest({
        patient_name: patientName,
        blood_group: bloodGroup,
        units_needed: unitsNeeded,
        hospital_name: hospitalName,
        city,
        urgency,
      });

      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to submit blood request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <Activity size={18} color="var(--color-primary)" />
            <h3 className="modal-title">Emergency Blood Request</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div className="alert alert-error">
                <span>{error}</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="mPatientName">Patient Full Name</label>
              <input
                id="mPatientName"
                type="text"
                className="form-control"
                placeholder="e.g. Ramesh Deshmukh"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label" htmlFor="mBloodGroup">Blood Group Required</label>
                <select
                  id="mBloodGroup"
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
                <label className="form-label" htmlFor="mUnits">Units Needed</label>
                <input
                  id="mUnits"
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
                <label className="form-label" htmlFor="mHospital">Hospital & Campus</label>
                <input
                  id="mHospital"
                  type="text"
                  className="form-control"
                  placeholder="e.g. Lilavati Hospital"
                  value={hospitalName}
                  onChange={(e) => setHospitalName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="mCity">City</label>
                <input
                  id="mCity"
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
              <label className="form-label" htmlFor="mUrgency">Urgency Level</label>
              <select
                id="mUrgency"
                className="form-select"
                value={urgency}
                onChange={(e) => setUrgency(e.target.value)}
              >
                <option value="critical">Critical (Immediate surgery / ICU)</option>
                <option value="urgent">Urgent (Needed within 24 Hours)</option>
                <option value="planned">Planned (Scheduled next few days)</option>
              </select>
              <p className="form-hint">
                Requests are verified by a hospital doctor before notifications are sent to verified donors.
              </p>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={loading || !patientName || !hospitalName}>
              {loading ? 'Submitting...' : 'Submit Request'}
              {!loading && <ArrowRight size={14} />}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

