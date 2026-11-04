import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="container" style={{ padding: '80px 16px', textAlign: 'center' }}>
        <div className="spinner" />
        <p style={{ marginTop: '16px', color: 'var(--color-slate-500)', fontSize: '13px' }}>
          Loading your session...
        </p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If user has not completed onboarding and is not already on onboarding page
  if (
    !user.onboarding_completed &&
    user.role !== 'admin' &&
    user.role !== 'doctor' &&
    !location.pathname.startsWith('/onboarding')
  ) {
    return <Navigate to={`/onboarding/${user.role}`} replace />;
  }

  // Check role authorization
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'donor') return <Navigate to="/donor/dashboard" replace />;
    if (user.role === 'receiver') return <Navigate to="/receiver/dashboard" replace />;
    if (user.role === 'doctor') return <Navigate to="/doctor/dashboard" replace />;
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
};

