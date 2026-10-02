import React from 'react';
import { CheckCircle2, Clock, XCircle, AlertCircle, ShieldCheck } from 'lucide-react';

interface TimelineStep {
  title: string;
  description: string;
  timestamp: string | null;
  completed: boolean;
  isPending?: boolean;
}

interface StatusTimelineProps {
  status: 'pending' | 'verified' | 'rejected' | 'fulfilled' | 'expired';
  timeline?: TimelineStep[];
  doctorNotes?: string | null;
  rejectionReason?: string | null;
}

export const StatusTimeline: React.FC<StatusTimelineProps> = ({
  status,
  timeline,
  doctorNotes,
  rejectionReason,
}) => {
  // Default steps if not provided
  const steps: TimelineStep[] = timeline || [
    {
      title: '1. Request Registered',
      description: 'Submitted by attendant, placed in Doctor Verification Queue.',
      timestamp: null,
      completed: true,
    },
    {
      title: '2. Doctor Verification',
      description: status === 'rejected'
        ? `Rejected: ${rejectionReason || 'Unverified medical indication.'}`
        : status !== 'pending'
          ? `Verified by attending physician. ${doctorNotes || ''}`
          : 'Awaiting clinical review by hospital verifier.',
      timestamp: null,
      completed: status !== 'pending' && status !== 'rejected',
      isPending: status === 'pending',
    },
    {
      title: '3. Donor Matching & Broadcast',
      description: status === 'verified' || status === 'fulfilled'
        ? 'Broadcast active to verified compatible donors within radius.'
        : 'Cannot broadcast until doctor verification is complete.',
      timestamp: null,
      completed: status === 'verified' || status === 'fulfilled',
      isPending: status === 'verified',
    },
    {
      title: '4. Donation Fulfilled',
      description: status === 'fulfilled'
        ? 'Donation verified on-site by doctor. Units received.'
        : 'Pending donor dispatch & phlebotomy.',
      timestamp: null,
      completed: status === 'fulfilled',
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
        <h3 className="font-semibold text-sm text-slate-900 flex items-center space-x-2">
          <span>Coordination Lifecycle</span>
          <span className="text-xs font-normal text-slate-500">| Supervised Medical Flow</span>
        </h3>
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider ${
            status === 'fulfilled'
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              : status === 'verified'
              ? 'bg-blue-100 text-blue-800 border border-blue-300'
              : status === 'pending'
              ? 'bg-amber-100 text-amber-800 border border-amber-300'
              : status === 'rejected'
              ? 'bg-rose-100 text-rose-800 border border-rose-300'
              : 'bg-slate-100 text-slate-800'
          }`}
        >
          {status}
        </span>
      </div>

      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
        {steps.map((step, idx) => {
          let Icon = Clock;
          let iconColor = 'text-slate-400 bg-white border-slate-300';

          if (step.completed) {
            Icon = CheckCircle2;
            iconColor = 'text-emerald-600 bg-emerald-50 border-emerald-500';
          } else if (step.isPending) {
            Icon = AlertCircle;
            iconColor = 'text-amber-600 bg-amber-50 border-amber-500 animate-pulse';
          } else if (status === 'rejected' && idx === 1) {
            Icon = XCircle;
            iconColor = 'text-rose-600 bg-rose-50 border-rose-500';
          }

          return (
            <div key={idx} className="relative flex items-start space-x-3">
              <div
                className={`absolute -left-6 mt-0.5 w-5 h-5 rounded-full border flex items-center justify-center ${iconColor}`}
              >
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4
                    className={`text-xs font-semibold ${
                      step.completed ? 'text-slate-900' : step.isPending ? 'text-amber-800' : 'text-slate-500'
                    }`}
                  >
                    {step.title}
                  </h4>
                  {step.timestamp && (
                    <span className="text-[10px] text-slate-400">
                      {new Date(step.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{step.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {doctorNotes && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-start space-x-2 text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <strong className="text-slate-900">Doctor Verification Note: </strong>
            <span>{doctorNotes}</span>
          </div>
        </div>
      )}
    </div>
  );
};
