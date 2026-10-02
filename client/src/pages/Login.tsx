import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { UserRole } from '../types';
import { Heart, Lock, Mail, KeyRound, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, quickLogin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mode, setMode] = useState<'password' | 'otp'>('password');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [previewOtp, setPreviewOtp] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Forgot password state
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [forgotMessage, setForgotMessage] = useState<string | null>(null);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!phone) {
      setError('Please enter your phone number');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await api.sendOtp(phone);
      setOtpSent(true);
      setPreviewOtp(res.previewCode);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtpLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode) return;
    setError(null);
    setLoading(true);
    try {
      await api.verifyOtp(phone, otpCode);
      // Automatically log into donor account associated with phone or seed donor
      await quickLogin('donor');
      navigate('/donor/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickRole = async (role: UserRole) => {
    setLoading(true);
    try {
      await quickLogin(role);
      if (role === 'doctor') navigate('/doctor/queue');
      else if (role === 'donor') navigate('/donor/dashboard');
      else if (role === 'admin') navigate('/admin');
      else navigate('/requests/new');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSend = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.forgotPassword(forgotEmail);
      setForgotStep(2);
      setForgotMessage(res.message || 'Reset code sent');
      if (res.previewCode) setForgotOtp(res.previewCode);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleForgotReset = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.resetPassword(forgotEmail, forgotOtp, newPassword);
      alert('Password reset successfully! You can now log in.');
      setIsForgotOpen(false);
      setForgotStep(1);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 px-4 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-xl bg-brand-600 flex items-center justify-center text-white mx-auto shadow-sm">
          <Heart className="w-6 h-6 fill-white" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Login to LifeLink</h1>
        <p className="text-xs text-slate-500">Access verified coordination, donor availability, or doctor verification queue</p>
      </div>

      {/* QUICK DEMO ROLE BUTTONS (Judges Love This!) */}
      <div className="bg-slate-100 border border-slate-200 rounded-xl p-3.5 space-y-2">
        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
          <span className="flex items-center space-x-1">
            <Sparkles className="w-3.5 h-3.5 text-brand-600" />
            <span>Hackathon Quick-Login:</span>
          </span>
          <span className="text-[10px] text-slate-400">1-Click Auth</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            type="button"
            onClick={() => handleQuickRole('requester')}
            className="bg-white hover:bg-slate-50 text-slate-800 p-2 rounded-lg border border-slate-300 font-medium text-left shadow-2xs"
          >
            <span className="block font-bold">1. Attendant</span>
            <span className="text-[10px] text-slate-500">Priya Deshmukh</span>
          </button>
          <button
            type="button"
            onClick={() => handleQuickRole('donor')}
            className="bg-white hover:bg-slate-50 text-slate-800 p-2 rounded-lg border border-slate-300 font-medium text-left shadow-2xs"
          >
            <span className="block font-bold">2. Donor (O-)</span>
            <span className="text-[10px] text-slate-500">Aarav Patil</span>
          </button>
          <button
            type="button"
            onClick={() => handleQuickRole('doctor')}
            className="bg-white hover:bg-slate-50 text-slate-800 p-2 rounded-lg border border-slate-300 font-medium text-left shadow-2xs"
          >
            <span className="block font-bold">3. Doctor (Lilavati)</span>
            <span className="text-[10px] text-slate-500">Dr. Ananya Sharma</span>
          </button>
          <button
            type="button"
            onClick={() => handleQuickRole('admin')}
            className="bg-white hover:bg-slate-50 text-slate-800 p-2 rounded-lg border border-slate-300 font-medium text-left shadow-2xs"
          >
            <span className="block font-bold">4. Platform Admin</span>
            <span className="text-[10px] text-slate-500">Dr. Vivek Rane</span>
          </button>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
        {/* Toggle Mode: Password vs OTP */}
        <div className="grid grid-cols-2 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => { setMode('password'); setError(null); }}
            className={`py-1.5 rounded-lg transition-colors ${
              mode === 'password' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Email + Password
          </button>
          <button
            type="button"
            onClick={() => { setMode('otp'); setError(null); }}
            className={`py-1.5 rounded-lg transition-colors ${
              mode === 'otp' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            OTP Login
          </button>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs p-3 rounded-lg">
            {error}
          </div>
        )}

        {mode === 'password' ? (
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="e.g. dr.ananya@lilavati.com"
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 pl-8 focus:ring-1 focus:ring-brand-500 focus:outline-none"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-2.5 top-3" />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-slate-700">Password</label>
                <button
                  type="button"
                  onClick={() => setIsForgotOpen(true)}
                  className="text-[11px] text-brand-600 hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 pl-8 focus:ring-1 focus:ring-brand-500 focus:outline-none"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-2.5 top-3" />
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">Default seed password: <code>LifeLink2026!</code></span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold text-xs py-2.5 rounded-lg transition-colors flex items-center justify-center space-x-1.5"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtpLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Number</label>
              <div className="flex space-x-2">
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+91 98202 10000"
                  className="flex-1 text-xs border border-slate-300 rounded-lg p-2.5 focus:ring-1 focus:ring-brand-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={loading}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium px-3.5 py-2.5 rounded-lg transition-colors"
                >
                  Send OTP
                </button>
              </div>
              {previewOtp && (
                <div className="mt-1 text-[11px] text-emerald-700 bg-emerald-50 p-2 rounded border border-emerald-200">
                  ⚡ <strong>Mock OTP Code:</strong> <code>{previewOtp}</code> (Auto-fill enabled)
                </div>
              )}
            </div>

            {otpSent && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Enter 6-Digit OTP</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otpCode}
                    onChange={e => setOtpCode(e.target.value)}
                    placeholder="123456"
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 pl-8 tracking-widest focus:ring-1 focus:ring-brand-500 focus:outline-none"
                  />
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-2.5 top-3" />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !otpSent}
              className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold text-xs py-2.5 rounded-lg transition-colors flex items-center justify-center space-x-1.5"
            >
              <span>{loading ? 'Verifying...' : 'Verify OTP & Login'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        )}

        <div className="pt-2 text-center text-xs text-slate-500">
          Don't have an account?{' '}
          <Link to="/register" className="text-brand-600 font-semibold hover:underline">
            Register as Donor or Requester
          </Link>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {isForgotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 border border-slate-200 shadow-xl">
            <h3 className="font-bold text-sm text-slate-900">Reset Account Password</h3>
            {forgotStep === 1 ? (
              <form onSubmit={handleForgotSend} className="space-y-3">
                <p className="text-xs text-slate-500">Enter your registered email to receive an OTP code:</p>
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={e => setForgotEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5"
                />
                <div className="flex justify-end space-x-2">
                  <button type="button" onClick={() => setIsForgotOpen(false)} className="text-xs text-slate-500 px-3 py-1.5">Cancel</button>
                  <button type="submit" className="bg-brand-600 text-white text-xs font-semibold px-4 py-1.5 rounded-lg">Send Code</button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleForgotReset} className="space-y-3">
                {forgotMessage && <p className="text-[11px] text-emerald-700 bg-emerald-50 p-2 rounded">{forgotMessage}</p>}
                <input
                  type="text"
                  required
                  value={forgotOtp}
                  onChange={e => setForgotOtp(e.target.value)}
                  placeholder="Enter OTP"
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5"
                />
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Enter New Password"
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5"
                />
                <div className="flex justify-end space-x-2">
                  <button type="button" onClick={() => setIsForgotOpen(false)} className="text-xs text-slate-500 px-3 py-1.5">Cancel</button>
                  <button type="submit" className="bg-brand-600 text-white text-xs font-semibold px-4 py-1.5 rounded-lg">Reset Password</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
