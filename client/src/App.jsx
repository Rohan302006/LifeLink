import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { ProtectedRoute } from './components/common/ProtectedRoute';

// Pages
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { DonorOnboarding } from './pages/onboarding/DonorOnboarding';
import { ReceiverOnboarding } from './pages/onboarding/ReceiverOnboarding';
import { DonorDashboard } from './pages/donor/DonorDashboard';
import { ReceiverDashboard } from './pages/receiver/ReceiverDashboard';
import { CreateRequest } from './pages/requester/CreateRequest';
import { DoctorDashboard } from './pages/doctor/DoctorDashboard';
import { AdminDashboard } from './pages/admin/AdminDashboard';

export const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <main>
          <Routes>
            {/* Public Pages */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Linear Onboarding Wizards */}
            <Route
              path="/onboarding/donor"
              element={
                <ProtectedRoute allowedRoles={['donor']}>
                  <DonorOnboarding />
                </ProtectedRoute>
              }
            />
            <Route
              path="/onboarding/receiver"
              element={
                <ProtectedRoute allowedRoles={['receiver']}>
                  <ReceiverOnboarding />
                </ProtectedRoute>
              }
            />

            {/* Dashboards */}
            <Route
              path="/donor/dashboard"
              element={
                <ProtectedRoute allowedRoles={['donor', 'receiver']}>
                  <DonorDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/receiver/dashboard"
              element={
                <ProtectedRoute allowedRoles={['receiver', 'donor']}>
                  <ReceiverDashboard />
                </ProtectedRoute>
              }
            />

            {/* Emergency Blood Request (Cross-Functionality) */}
            <Route
              path="/requests/new"
              element={
                <ProtectedRoute allowedRoles={['donor', 'receiver']}>
                  <CreateRequest />
                </ProtectedRoute>
              }
            />

            {/* Doctor Verification Queue */}
            <Route
              path="/doctor/dashboard"
              element={
                <ProtectedRoute allowedRoles={['doctor']}>
                  <DoctorDashboard />
                </ProtectedRoute>
              }
            />

            {/* Admin Doctor Approvals */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </Router>
    </AuthProvider>
  );
};

export default App;

