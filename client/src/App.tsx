import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';

// Pages
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { RequestsList } from './pages/requester/RequestsList';
import { CreateRequest } from './pages/requester/CreateRequest';
import { RequestDetail } from './pages/requester/RequestDetail';
import { DonorDashboard } from './pages/donor/DonorDashboard';
import { DoctorQueue } from './pages/doctor/DoctorQueue';
import { LogDonation } from './pages/doctor/LogDonation';
import { OrganPledgeGuide } from './pages/organ/OrganPledgeGuide';
import { CoordinatorLogView } from './pages/organ/CoordinatorLog';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { DemoMode } from './pages/DemoMode';

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 font-sans">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Blood Requests */}
              <Route path="/requests" element={<RequestsList />} />
              <Route path="/requests/new" element={<CreateRequest />} />
              <Route path="/requests/:id" element={<RequestDetail />} />

              {/* Donor Portal */}
              <Route path="/donor/dashboard" element={<DonorDashboard />} />

              {/* Doctor Queue & Donation Logging */}
              <Route path="/doctor/queue" element={<DoctorQueue />} />
              <Route path="/doctor/log-donation" element={<LogDonation />} />

              {/* Organ Donation */}
              <Route path="/organ/pledge" element={<OrganPledgeGuide />} />
              <Route path="/organ/coordinator-log" element={<CoordinatorLogView />} />

              {/* Admin & Impact */}
              <Route path="/admin" element={<AdminDashboard />} />

              {/* Hackathon Demo Mode */}
              <Route path="/demo" element={<DemoMode />} />

              {/* Catch-all redirect to Home */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
