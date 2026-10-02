import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';
import {
  Heart,
  ShieldCheck,
  Activity,
  UserCheck,
  Stethoscope,
  BarChart3,
  LogOut,
  LogIn,
  PlayCircle,
  Menu,
  X,
  FileHeart,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout, quickLogin } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);

  const handleRoleSwitch = async (role: UserRole) => {
    await quickLogin(role);
    setIsRoleMenuOpen(false);
    if (role === 'doctor') navigate('/doctor/queue');
    else if (role === 'donor') navigate('/donor/dashboard');
    else if (role === 'admin') navigate('/admin');
    else navigate('/requests/new');
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
      {/* Top Clinical Disclaimer bar */}
      <div className="bg-slate-900 text-slate-300 text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-medium text-slate-200">VERIFIED COORDINATION PLATFORM</span>
            <span className="hidden sm:inline text-slate-400">| Final donor screening is strictly done on-site by a licensed physician.</span>
          </div>
          <div className="flex items-center space-x-4 text-slate-300">
            <a
              href="https://eraktkosh.mohfw.gov.in"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white underline decoration-slate-600 transition-colors"
            >
              e-RaktKosh Stock ↗
            </a>
            <a
              href="https://notto.mohfw.gov.in"
              target="_blank"
              rel="noreferrer"
              className="hover:text-white underline decoration-slate-600 transition-colors"
            >
              NOTTO Registry ↗
            </a>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-lg bg-brand-600 flex items-center justify-center text-white shadow-sm">
              <Heart className="w-6 h-6 fill-white" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-xl font-bold tracking-tight text-slate-900">LifeLink</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-300">
                  Doctor-Supervised
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-tight">Emergency Blood & Organ Coordination</p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              to="/requests/new"
              className="text-sm font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 px-3.5 py-2 rounded-md border border-brand-200 transition-colors flex items-center space-x-1.5"
            >
              <Activity className="w-4 h-4 text-brand-600" />
              <span>Need Blood</span>
            </Link>

            <Link
              to="/donor/dashboard"
              className="text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors flex items-center space-x-1.5"
            >
              <UserCheck className="w-4 h-4 text-slate-500" />
              <span>Donor Portal</span>
            </Link>

            <Link
              to="/doctor/queue"
              className="text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors flex items-center space-x-1.5"
            >
              <Stethoscope className="w-4 h-4 text-slate-500" />
              <span>Doctor Queue</span>
            </Link>

            <Link
              to="/organ/pledge"
              className="text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors flex items-center space-x-1.5"
            >
              <FileHeart className="w-4 h-4 text-slate-500" />
              <span>Organ Pledge</span>
            </Link>

            <Link
              to="/admin"
              className="text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors flex items-center space-x-1.5"
            >
              <BarChart3 className="w-4 h-4 text-slate-500" />
              <span>Impact</span>
            </Link>

            <Link
              to="/demo"
              className="text-sm font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-md border border-emerald-300 transition-colors flex items-center space-x-1"
            >
              <PlayCircle className="w-4 h-4 text-emerald-600" />
              <span>2-Min Demo</span>
            </Link>
          </nav>

          {/* Quick Demo Role Switcher & Auth */}
          <div className="hidden lg:flex items-center space-x-3">
            {/* Quick Role Switcher Pill */}
            <div className="relative">
              <button
                onClick={() => setIsRoleMenuOpen(!isRoleMenuOpen)}
                className="text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 px-2.5 py-1.5 rounded-md flex items-center space-x-1.5"
                title="Switch role instantly for testing"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-slate-600" />
                <span>Role: <strong className="capitalize">{user ? user.role : 'Guest'}</strong></span>
                <span className="text-[10px] text-slate-400">▼</span>
              </button>

              {isRoleMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-slate-200 py-1.5 z-50 text-xs">
                  <div className="px-3 py-1 text-slate-400 font-semibold uppercase text-[10px]">
                    Switch Demo Persona:
                  </div>
                  <button
                    onClick={() => handleRoleSwitch('requester')}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between text-slate-800"
                  >
                    <span>1. Patient Attendant (Requester)</span>
                    <span className="text-[10px] bg-slate-100 px-1 rounded">Priya</span>
                  </button>
                  <button
                    onClick={() => handleRoleSwitch('donor')}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between text-slate-800"
                  >
                    <span>2. Active Donor (O-)</span>
                    <span className="text-[10px] bg-slate-100 px-1 rounded">Aarav</span>
                  </button>
                  <button
                    onClick={() => handleRoleSwitch('doctor')}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between text-slate-800"
                  >
                    <span>3. Hospital Verifier (Doctor)</span>
                    <span className="text-[10px] bg-slate-100 px-1 rounded">Dr. Ananya</span>
                  </button>
                  <button
                    onClick={() => handleRoleSwitch('admin')}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 flex items-center justify-between text-slate-800"
                  >
                    <span>4. Health Admin</span>
                    <span className="text-[10px] bg-slate-100 px-1 rounded">Dr. Vivek</span>
                  </button>
                </div>
              )}
            </div>

            {user ? (
              <div className="flex items-center space-x-2 border-l border-slate-200 pl-3">
                <span className="text-xs font-medium text-slate-700 max-w-[120px] truncate" title={user.full_name}>
                  {user.full_name}
                </span>
                <button
                  onClick={logout}
                  className="text-slate-500 hover:text-brand-600 p-1 rounded"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 px-3 py-1.5 rounded-md hover:bg-slate-50 transition-colors flex items-center space-x-1"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Login</span>
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center space-x-2">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-4 space-y-2">
          <Link
            to="/requests/new"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-brand-700 bg-brand-50"
          >
            🚨 I Need Blood
          </Link>
          <Link
            to="/donor/dashboard"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-slate-800 hover:bg-slate-100"
          >
            🩸 Donor Portal & Availability
          </Link>
          <Link
            to="/doctor/queue"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-slate-800 hover:bg-slate-100"
          >
            🩺 Doctor Verification Queue
          </Link>
          <Link
            to="/organ/pledge"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-slate-800 hover:bg-slate-100"
          >
            🕊️ Organ Pledge & Awareness
          </Link>
          <Link
            to="/admin"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-slate-800 hover:bg-slate-100"
          >
            📊 Impact Dashboard
          </Link>
          <Link
            to="/demo"
            onClick={() => setIsMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-medium text-emerald-800 bg-emerald-50"
          >
            ⚡ 2-Minute Demo Mode
          </Link>
          <div className="pt-2 border-t border-slate-200">
            {user ? (
              <div className="flex justify-between items-center px-3 py-2">
                <span className="text-sm font-medium text-slate-700">{user.full_name} ({user.role})</span>
                <button onClick={logout} className="text-sm font-semibold text-brand-600">Logout</button>
              </div>
            ) : (
              <Link
                to="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block text-center px-3 py-2 rounded-md text-base font-semibold text-slate-800 bg-slate-100"
              >
                Login / Register
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
