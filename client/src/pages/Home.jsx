import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Heart,
  ShieldCheck,
  Stethoscope,
  Activity,
  ArrowRight,
  UserCheck,
  Users,
  CheckCircle,
} from 'lucide-react';

export const Home = () => {
  const { user } = useAuth();

  return (
    <div style={{ paddingBottom: '64px' }}>
      {/* Hero Section */}
      <section style={{ backgroundColor: 'var(--color-slate-900)', color: 'var(--color-white)', padding: '72px 16px 80px', textAlign: 'center' }}>
        <div className="container-narrow">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 14px', borderRadius: 'var(--radius-full)', backgroundColor: 'rgba(255, 255, 255, 0.1)', fontSize: '12px', fontWeight: '700', color: '#34d399', marginBottom: '20px' }}>
            <span className="pulse-dot" />
            DOCTOR-SUPERVISED BLOOD COORDINATION
          </div>

          <h1 style={{ fontSize: '38px', fontWeight: '800', lineHeight: 1.2, letterSpacing: '-0.02em', marginBottom: '16px' }}>
            Connecting Emergency Blood Needs to Verified Donors
          </h1>

          <p style={{ fontSize: '16px', color: 'var(--color-slate-300)', lineHeight: 1.6, marginBottom: '32px' }}>
            LifeLink eliminates fake forwards and spam calls by ensuring every emergency requisition and donor credential is independently verified by a licensed hospital doctor.
          </p>

          {!user ? (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <Link to="/register" className="btn btn-primary btn-lg">
                <Heart size={18} fill="#ffffff" />
                Register as Donor or Receiver
              </Link>
              <Link to="/login" className="btn btn-outline btn-lg" style={{ backgroundColor: 'transparent', color: '#ffffff', borderColor: 'var(--color-slate-600)' }}>
                Sign In to Dashboard
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <Link
                to={
                  user.role === 'donor'
                    ? '/donor/dashboard'
                    : user.role === 'receiver'
                    ? '/receiver/dashboard'
                    : user.role === 'doctor'
                    ? '/doctor/dashboard'
                    : '/admin'
                }
                className="btn btn-primary btn-lg"
              >
                Go to Your {user.role.toUpperCase()} Dashboard
                <ArrowRight size={18} />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* How LifeLink Works Section */}
      <section className="container my-12" id="how-it-works">
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '26px', fontWeight: '800', color: 'var(--color-slate-900)' }}>
            How LifeLink Works
          </h2>
          <p style={{ color: 'var(--color-slate-500)', fontSize: '14px', marginTop: '6px' }}>
            A simple, linear, doctor-verified workflow protecting patients and donors.
          </p>
        </div>

        <div className="grid-3">
          {/* Step 1 */}
          <div className="card">
            <div className="card-body">
              <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <Activity size={22} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>
                1. Requisition & ID Upload
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--color-slate-600)', lineHeight: 1.6 }}>
                Receivers submit their identity card and official hospital blood requisition. Donors upload ID and past donation records.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="card">
            <div className="card-body">
              <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-md)', backgroundColor: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <Stethoscope size={22} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>
                2. Mandatory Doctor Verification
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--color-slate-600)', lineHeight: 1.6 }}>
                Hospital physicians inspect submitted documents and verify patient urgency before any emergency notification is broadcast.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="card">
            <div className="card-body">
              <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-md)', backgroundColor: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <ShieldCheck size={22} />
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>
                3. Privacy-Safe Matching
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--color-slate-600)', lineHeight: 1.6 }}>
                Only verified, cooldown-eligible donors are alerted. Phone numbers remain locked until the volunteer explicitly accepts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Cross-Role Emergency Callout */}
      <section className="container my-12">
        <div className="card" style={{ backgroundColor: 'var(--color-primary-light)', borderColor: 'var(--color-primary-border)', padding: '32px 24px', textAlign: 'center' }}>
          <h3 style={{ fontSize: '20px', fontWeight: '800', color: 'var(--color-primary-dark)', marginBottom: '8px' }}>
            Universal Emergency Protection
          </h3>
          <p style={{ fontSize: '14px', color: 'var(--color-slate-700)', maxWidth: '640px', margin: '0 auto 20px', lineHeight: 1.6 }}>
            In real life, emergencies can happen to anyone. Registered donors can apply for blood whenever needed, and receivers can volunteer to donate blood once their situation is stabilized.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
            <Link to="/register" className="btn btn-primary">
              Join the LifeLink Network
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

