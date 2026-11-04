import React from 'react';
import { Clock, CheckCircle2, XCircle } from 'lucide-react';

export const StatusBadge = ({ status, label }) => {
  const norm = (status || 'pending').toLowerCase();

  if (norm === 'verified' || norm === 'approved') {
    return (
      <span className="badge badge-verified">
        <CheckCircle2 size={12} />
        {label || 'VERIFIED'}
      </span>
    );
  }

  if (norm === 'rejected') {
    return (
      <span className="badge badge-rejected">
        <XCircle size={12} />
        {label || 'REJECTED'}
      </span>
    );
  }

  return (
    <span className="badge badge-pending">
      <Clock size={12} />
      {label || 'PENDING'}
    </span>
  );
};

