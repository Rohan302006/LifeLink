import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ExternalLink, Heart, Lock, FileText } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';

export const Footer: React.FC = () => {
  const { user } = useAuth();

  const handleWithdrawConsent = async () => {
    if (!window.confirm('Under the Digital Personal Data Protection (DPDP) Act, you may withdraw your consent at any time. This will deactivate your account and erase all your personal contact information from active matching. Proceed?')) {
      return;
    }
    try {
      await api.withdrawConsent();
      alert('Your consent has been withdrawn and personal data anonymized.');
      window.location.reload();
    } catch (err: any) {
      alert('Failed to process withdrawal: ' + err.message);
    }
  };

  return (
    <footer className="bg-slate-900 text-slate-400 text-sm border-t border-slate-800 mt-20">
      {/* High-visibility Mandatory Regulatory Disclaimer Box */}
      <div className="bg-slate-950 border-b border-slate-800 py-6 px-4">
        <div className="max-w-7xl mx-auto flex items-start space-x-3.5">
          <ShieldAlert className="w-6 h-6 text-brand-500 shrink-0 mt-0.5" />
          <div className="space-y-1.5">
            <h4 className="text-slate-200 font-semibold text-sm tracking-wide uppercase">
              Regulatory Positioning & Clinical Disclaimer
            </h4>
            <p className="text-xs leading-relaxed text-slate-300">
              <strong>LifeLink is a verified coordination platform</strong> designed to streamline communication between verified patient attendants, volunteer donors, and hospital verifiers during emergency shortages. <strong>LifeLink is NOT a medical decision-making platform and NOT an organ-allocation authority.</strong>
            </p>
            <ul className="text-xs text-slate-400 space-y-1 list-disc pl-4">
              <li>
                <strong>Blood Transfusions:</strong> Platform interval eligibility calculations are preliminary logistic indicators. Final donor screening, vitals, hemoglobin verification, and serological crossmatching are <em>always conducted on-site by certified hospital physicians</em>. Central stock levels are tracked on{' '}
                <a href="https://eraktkosh.mohfw.gov.in" target="_blank" rel="noreferrer" className="text-brand-400 underline inline-flex items-center">
                  e-RaktKosh <ExternalLink className="w-3 h-3 ml-0.5" />
                </a>.
              </li>
              <li>
                <strong>Organ Donation:</strong> Official waiting lists, recipient ranking, and deceased donor organ allocations are governed exclusively by{' '}
                <a href="https://notto.mohfw.gov.in" target="_blank" rel="noreferrer" className="text-brand-400 underline inline-flex items-center">
                  NOTTO / ROTTO / SOTTO <ExternalLink className="w-3 h-3 ml-0.5" />
                </a>{' '}
                under the Transplantation of Human Organs and Tissues Act (THOTA), Government of India. LifeLink provides community awareness and internal pledge intent logging only.
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center space-x-2 text-white font-bold text-base mb-3">
            <Heart className="w-5 h-5 text-brand-600 fill-brand-600" />
            <span>LifeLink Platform</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed mb-3">
            Doctor-supervised emergency coordination infrastructure bridging the critical gap when blood banks face acute stock deficits.
          </p>
          <div className="flex items-center space-x-1.5 text-xs text-slate-300">
            <Lock className="w-3.5 h-3.5 text-emerald-400" />
            <span>DPDP Act 2023 Compliant</span>
          </div>
        </div>

        <div>
          <h4 className="text-white font-medium text-xs uppercase tracking-wider mb-3">Emergency Flows</h4>
          <ul className="space-y-2 text-xs">
            <li><Link to="/requests/new" className="hover:text-white transition-colors">Request Emergency Blood</Link></li>
            <li><Link to="/donor/dashboard" className="hover:text-white transition-colors">Donor Availability & Cooldown</Link></li>
            <li><Link to="/doctor/queue" className="hover:text-white transition-colors">Doctor Verification Queue</Link></li>
            <li><Link to="/doctor/log-donation" className="hover:text-white transition-colors">Log Verified Donation</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-medium text-xs uppercase tracking-wider mb-3">Organ & Government Portals</h4>
          <ul className="space-y-2 text-xs">
            <li><Link to="/organ/pledge" className="hover:text-white transition-colors">Pledge Intent & Next-of-Kin Record</Link></li>
            <li><Link to="/organ/coordinator-log" className="hover:text-white transition-colors">Transplant Coordinator Log</Link></li>
            <li>
              <a href="https://notto.mohfw.gov.in" target="_blank" rel="noreferrer" className="hover:text-white transition-colors inline-flex items-center">
                NOTTO National Registry <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            </li>
            <li>
              <a href="https://eraktkosh.mohfw.gov.in" target="_blank" rel="noreferrer" className="hover:text-white transition-colors inline-flex items-center">
                e-RaktKosh Blood Stock Portal <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-medium text-xs uppercase tracking-wider mb-3">Privacy & Compliance</h4>
          <p className="text-xs text-slate-400 leading-relaxed mb-3">
            Donor contact details and exact location remain concealed until voluntary acceptance of an emergency match.
          </p>
          {user && (
            <button
              onClick={handleWithdrawConsent}
              className="text-xs text-brand-400 hover:text-brand-300 underline text-left block"
            >
              Withdraw My Consent & Erase Data (DPDP)
            </button>
          )}
          <div className="mt-3 text-[11px] text-slate-500">
            LifeLink Hackathon Edition 2026. Built with Node.js, React, Tailwind CSS, Leaflet & Gemini AI.
          </div>
        </div>
      </div>
    </footer>
  );
};
