import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Heart,
  LogOut,
  LogIn,
  Menu,
  X,
  User,
  PlusCircle,
  Activity,
  CheckSquare,
  ShieldAlert,
} from 'lucide-react';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="nav-header">
      {/* Top Clinical Disclaimer bar */}
      <div className="nav-disclaimer">
        <div className="nav-disclaimer-tag">
          <span className="pulse-dot" />
          <span>Doctor-Supervised Emergency Coordination</span>
        </div>
        <div style={{ color: 'var(--color-slate-400)', fontSize: '11px' }}>
          Mandatory physician review before donor broadcast.
        </div>
      </div>

      {/* Main Navbar */}
      <div className="container">
        <div className="navbar-inner">
          {/* Logo */}
          <Link to="/" className="brand-logo">
            <div className="brand-icon">
              <Heart size={20} fill="#ffffff" />
            </div>
            <span>LifeLink</span>
          </Link>

          {/* Desktop Navigation Links (Relevant to Logged-in Role Only) */}
          <nav className="nav-links">
            {!user ? (
              <>
                <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
                  Home
                </Link>
                <Link to="/login" className="btn btn-outline btn-sm">
                  <LogIn size={14} />
                  Sign In
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm">
                  Register
                </Link>
              </>
            ) : (
              <>
                {/* DONOR Navigation */}
                {user.role === 'donor' && (
                  <>
                    <Link
                      to="/donor/dashboard"
                      className={`nav-link ${isActive('/donor/dashboard') ? 'active' : ''}`}
                    >
                      <Activity size={15} />
                      Donor Dashboard
                    </Link>
                    <Link
                      to="/requests/new"
                      className="nav-link"
                      style={{ color: 'var(--color-primary)', fontWeight: '700' }}
                    >
                      <PlusCircle size={15} />
                      Need Blood?
                    </Link>
                  </>
                )}

                {/* RECEIVER Navigation */}
                {user.role === 'receiver' && (
                  <>
                    <Link
                      to="/receiver/dashboard"
                      className={`nav-link ${isActive('/receiver/dashboard') ? 'active' : ''}`}
                    >
                      <Activity size={15} />
                      My Requests
                    </Link>
                    <Link
                      to="/requests/new"
                      className="btn btn-primary btn-sm"
                    >
                      <PlusCircle size={14} />
                      New Request
                    </Link>
                    <Link
                      to="/donor/dashboard"
                      className="nav-link"
                    >
                      <Heart size={15} color="var(--color-primary)" />
                      Volunteer to Donate
                    </Link>
                  </>
                )}

                {/* DOCTOR Navigation */}
                {user.role === 'doctor' && (
                  <Link
                    to="/doctor/dashboard"
                    className={`nav-link ${isActive('/doctor/dashboard') ? 'active' : ''}`}
                  >
                    <CheckSquare size={15} />
                    Doctor Verification Queue
                  </Link>
                )}

                {/* ADMIN Navigation */}
                {user.role === 'admin' && (
                  <Link
                    to="/admin"
                    className={`nav-link ${isActive('/admin') ? 'active' : ''}`}
                  >
                    <ShieldAlert size={15} />
                    Doctor Approvals
                  </Link>
                )}

                {/* User profile & Logout */}
                <div className="user-profile-badge">
                  <div className="user-avatar">
                    {user.full_name?.charAt(0).toUpperCase() || <User size={14} />}
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: '700', lineHeight: 1.2 }}>
                      {user.full_name}
                    </div>
                    <span className="badge badge-role" style={{ marginTop: '2px', display: 'inline-block' }}>
                      {user.role}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    title="Logout"
                    style={{ marginLeft: '6px', color: 'var(--color-slate-500)', padding: '4px' }}
                  >
                    <LogOut size={16} />
                  </button>
                </div>
              </>
            )}
          </nav>

          {/* Mobile hamburger menu */}
          <div style={{ display: 'none' }} className="mobile-toggle-btn">
            <button onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileOpen && (
          <div style={{ padding: '16px 0', borderTop: '1px solid var(--color-slate-200)' }}>
            {!user ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <Link to="/" onClick={() => setMobileOpen(false)} className="nav-link">Home</Link>
                <Link to="/login" onClick={() => setMobileOpen(false)} className="btn btn-outline btn-block">Sign In</Link>
                <Link to="/register" onClick={() => setMobileOpen(false)} className="btn btn-primary btn-block">Register</Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {user.role === 'donor' && (
                  <>
                    <Link to="/donor/dashboard" onClick={() => setMobileOpen(false)} className="nav-link">
                      Donor Dashboard
                    </Link>
                    <Link to="/requests/new" onClick={() => setMobileOpen(false)} className="nav-link">
                      Need Blood Request
                    </Link>
                  </>
                )}
                {user.role === 'receiver' && (
                  <>
                    <Link to="/receiver/dashboard" onClick={() => setMobileOpen(false)} className="nav-link">
                      My Requests
                    </Link>
                    <Link to="/requests/new" onClick={() => setMobileOpen(false)} className="nav-link">
                      Create Request
                    </Link>
                  </>
                )}
                {user.role === 'doctor' && (
                  <Link to="/doctor/dashboard" onClick={() => setMobileOpen(false)} className="nav-link">
                    Doctor Queue
                  </Link>
                )}
                {user.role === 'admin' && (
                  <Link to="/admin" onClick={() => setMobileOpen(false)} className="nav-link">
                    Doctor Approvals
                  </Link>
                )}
                <button onClick={handleLogout} className="btn btn-outline btn-sm btn-block" style={{ marginTop: '12px' }}>
                  <LogOut size={14} /> Log Out ({user.full_name})
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

