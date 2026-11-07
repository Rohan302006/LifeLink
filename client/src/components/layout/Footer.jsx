import React from 'react';

export const Footer = () => {
  return (
    <footer className="site-footer">
      <div className="container" style={{ textAlign: 'center' }}>
        <p style={{ fontWeight: '700', color: 'var(--color-white)', marginBottom: '8px' }}>
          LifeLink Doctor-Supervised Coordination Platform
        </p>
        <p style={{ maxWidth: '640px', margin: '0 auto 16px', lineHeight: 1.6 }}>
          LifeLink is a coordination platform for emergency donor-to-patient blood shortages.
          Final donor clinical screening, hemoglobin, and serological crossmatching are conducted on-site by a licensed physician.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', fontSize: '11px', color: 'var(--color-slate-400)' }}>
          <a href="https://eraktkosh.mohfw.gov.in" target="_blank" rel="noreferrer" style={{ textDecoration: 'underline' }}>
            e-RaktKosh Central Blood Portal
          </a>
          <span>•</span>
          <a href="https://notto.mohfw.gov.in" target="_blank" rel="noreferrer" style={{ textDecoration: 'underline' }}>
            NOTTO Statutory Registry
          </a>
        </div>
        <p style={{ marginTop: '16px', fontSize: '11px', color: 'var(--color-slate-500)' }}>
          © 2026 LifeLink Platform. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

