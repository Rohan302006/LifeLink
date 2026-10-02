import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { BloodRequest } from '../../types';
import { Activity, Clock, MapPin, ChevronRight, PlusCircle, ShieldCheck } from 'lucide-react';

export const RequestsList: React.FC = () => {
  const [requests, setRequests] = useState<BloodRequest[]>([]);
  const [filter, setFilter] = useState<'all' | 'verified' | 'pending' | 'fulfilled'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getRequests()
      .then(res => setRequests(res.requests))
      .catch(err => console.warn(err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = requests.filter(r => {
    if (filter === 'all') return true;
    return r.status === filter;
  });

  return (
    <div className="max-w-5xl mx-auto my-10 px-4 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Blood & Component Requests</h1>
          <p className="text-xs text-slate-500 mt-0.5">Emergency requisitions verified by hospital physicians</p>
        </div>

        <Link
          to="/requests/new"
          className="bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors shadow-2xs flex items-center space-x-1.5 w-fit"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Emergency Request</span>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 text-xs font-semibold">
        {(['all', 'verified', 'pending', 'fulfilled'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3 py-1.5 rounded-lg capitalize transition-colors ${
              filter === tab
                ? 'bg-slate-900 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {tab} ({requests.filter(r => tab === 'all' || r.status === tab).length})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-xs text-slate-400">Loading requests...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-400">
          No blood requests found under this filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(req => (
            <div
              key={req.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-slate-300 transition-colors space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3.5">
                  <div className="w-12 h-12 rounded-xl bg-brand-50 border border-brand-200 flex flex-col items-center justify-center font-bold text-brand-700">
                    <span className="text-base">{req.blood_group}</span>
                    <span className="text-[9px] uppercase text-slate-500 font-semibold">{req.component.replace('_', ' ')}</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">{req.patient_name}</h3>
                    <p className="text-xs text-slate-500 flex items-center space-x-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{req.hospital_name || 'Hospital'}</span>
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end space-y-1">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      req.status === 'fulfilled'
                        ? 'bg-emerald-100 text-emerald-800'
                        : req.status === 'verified'
                        ? 'bg-blue-100 text-blue-800'
                        : req.status === 'pending'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {req.status}
                  </span>
                  <span className="text-xs text-slate-700 font-semibold">{req.units_needed} Unit(s)</span>
                </div>
              </div>

              {req.doctor_notes && (
                <div className="bg-slate-50 border border-slate-100 rounded-lg p-2.5 text-xs text-slate-700 flex items-start space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <p className="line-clamp-2">
                    <strong className="text-slate-900">Dr. Clearance: </strong>
                    {req.doctor_notes}
                  </p>
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px] flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Required by: {new Date(req.required_by).toLocaleDateString()}</span>
                </span>
                <Link
                  to={`/requests/${req.id}`}
                  className="font-semibold text-brand-600 hover:text-brand-700 flex items-center space-x-1"
                >
                  <span>View Details</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
