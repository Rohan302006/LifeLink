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

          {/* Mobile hamburger menu button */}
          <div className="mobile-toggle-btn">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle navigation menu"
              className="mobile-hamburger-btn"
            >
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile slide-down menu */}
        {mobileOpen && (
          <div className="mobile-nav-drawer">
            {!user ? (
              <div className="mobile-nav-group">
                <Link to="/" onClick={() => setMobileOpen(false)} className="mobile-nav-link">
                  Home
                </Link>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
                  <Link to="/login" onClick={() => setMobileOpen(false)} className="btn btn-outline btn-block">
                    <LogIn size={15} /> Sign In
                  </Link>
                  <Link to="/register" onClick={() => setMobileOpen(false)} className="btn btn-primary btn-block">
                    <Heart size={15} fill="#ffffff" /> Register
                  </Link>
                </div>
              </div>
            ) : (
              <div className="mobile-nav-group">
                {/* Mobile User Profile Header */}
                <div className="mobile-user-card">
                  <div className="user-avatar" style={{ width: '36px', height: '36px', fontSize: '14px' }}>
                    {user.full_name?.charAt(0).toUpperCase() || <User size={16} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--color-slate-900)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user.full_name}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                      <span className="badge badge-role">{user.role}</span>
                      {user.blood_group && <span className="badge badge-blood">{user.blood_group}</span>}
                    </div>
                  </div>
                </div>

                {/* Mobile Nav Links by Role */}
                {user.role === 'donor' && (
                  <>
                    <Link
                      to="/donor/dashboard"
                      onClick={() => setMobileOpen(false)}
                      className={`mobile-nav-link ${isActive('/donor/dashboard') ? 'active' : ''}`}
                    >
                      <Activity size={17} color="var(--color-primary)" />
                      <span>Donor Dashboard</span>
                    </Link>
                    <Link
                      to="/requests/new"
                      onClick={() => setMobileOpen(false)}
                      className="mobile-nav-link"
                      style={{ color: 'var(--color-primary)', fontWeight: '700' }}
                    >
                      <PlusCircle size={17} />
                      <span>Need Blood Urgently?</span>
                    </Link>
                  </>
                )}

                {user.role === 'receiver' && (
                  <>
                    <Link
                      to="/receiver/dashboard"
                      onClick={() => setMobileOpen(false)}
                      className={`mobile-nav-link ${isActive('/receiver/dashboard') ? 'active' : ''}`}
                    >
                      <Activity size={17} color="var(--color-primary)" />
                      <span>My Requisitions</span>
                    </Link>
                    <Link
                      to="/requests/new"
                      onClick={() => setMobileOpen(false)}
                      className="mobile-nav-link"
                      style={{ color: 'var(--color-primary)', fontWeight: '700' }}
                    >
                      <PlusCircle size={17} />
                      <span>New Blood Request</span>
                    </Link>
                    <Link
                      to="/donor/dashboard"
                      onClick={() => setMobileOpen(false)}
                      className="mobile-nav-link"
                    >
                      <Heart size={17} color="var(--color-primary)" />
                      <span>Volunteer to Donate</span>
                    </Link>
                  </>
                )}

                {user.role === 'doctor' && (
                  <Link
                    to="/doctor/dashboard"
                    onClick={() => setMobileOpen(false)}
                    className={`mobile-nav-link ${isActive('/doctor/dashboard') ? 'active' : ''}`}
                  >
                    <CheckSquare size={17} color="var(--color-primary)" />
                    <span>Doctor Verification Queue</span>
                  </Link>
                )}

                {user.role === 'admin' && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileOpen(false)}
                    className={`mobile-nav-link ${isActive('/admin') ? 'active' : ''}`}
                  >
                    <ShieldAlert size={17} color="var(--color-primary)" />
                    <span>Administration Portal</span>
                  </Link>
                )}

                {/* Logout Button */}
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    handleLogout();
                  }}
                  className="btn btn-outline btn-block"
                  style={{ marginTop: '8px', color: '#be123c', borderColor: '#fecdd3' }}
                >
                  <LogOut size={15} /> Sign Out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

