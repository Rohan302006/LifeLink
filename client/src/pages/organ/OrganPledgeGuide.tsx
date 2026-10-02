import React, { useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import {
  FileHeart,
  ExternalLink,
  ShieldAlert,
  Users,
  CheckCircle,
  Heart,
  Eye,
  Activity,
  ArrowRight,
} from 'lucide-react';

export const OrganPledgeGuide: React.FC = () => {
  const { user } = useAuth();

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [dob, setDob] = useState('1998-05-15');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [selectedOrgans, setSelectedOrgans] = useState<string[]>([
    'Corneas (Eyes)',
    'Kidneys',
    'Liver',
    'Heart',
  ]);
  const [kinName, setKinName] = useState('');
  const [kinPhone, setKinPhone] = useState('');
  const [kinRelation, setKinRelation] = useState('Parent');
  const [consentCheck, setConsentCheck] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pledgeComplete, setPledgeComplete] = useState(false);

  const organList = [
    { name: 'Corneas (Eyes)', icon: Eye, desc: 'Restores sight to 2 individuals' },
    { name: 'Kidneys', icon: Activity, desc: 'Helps up to 2 end-stage renal patients' },
    { name: 'Liver', icon: Heart, desc: 'Can save 1 adult or split for 2 patients' },
    { name: 'Heart', icon: Heart, desc: 'Critical for end-stage heart failure' },
    { name: 'Lungs', icon: Activity, desc: 'Essential for respiratory failure' },
    { name: 'Pancreas', icon: Activity, desc: 'Controls severe diabetic complications' },
  ];

  const handleToggleOrgan = (organName: string) => {
    if (selectedOrgans.includes(organName)) {
      setSelectedOrgans(selectedOrgans.filter(o => o !== organName));
    } else {
      setSelectedOrgans([...selectedOrgans, organName]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consentCheck) {
      alert('Please check the acknowledgment confirming discussion with your next-of-kin.');
      return;
    }
    setIsSubmitting(true);
    try {
      await api.submitOrganPledge({
        full_name: fullName,
        date_of_birth: dob,
        blood_group: bloodGroup,
        organs_pledged: selectedOrgans,
        kin_name: kinName,
        kin_phone: kinPhone,
        kin_relation: kinRelation,
        official_registry_redirect_clicked: false,
      });

      setPledgeComplete(true);
    } catch (err: any) {
      alert('Failed to log pledge intent: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto my-10 px-4 space-y-8">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center space-x-2 bg-brand-50 border border-brand-200 px-3 py-1 rounded-full text-brand-800 text-xs font-semibold">
          <FileHeart className="w-4 h-4 text-brand-600" />
          <span>Awareness & Guided Intent Pledging</span>
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Pledge the Gift of Life: Organ Donation Guide
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Understanding the pledge process in India, the vital role of your family, and legal registration with the National Organ & Tissue Transplant Organisation (NOTTO).
        </p>
      </div>

      {/* Mandatory Positioning Alert */}
      <div className="bg-slate-900 text-slate-300 rounded-2xl p-5 border border-slate-800 space-y-2 text-xs">
        <div className="flex items-center space-x-2 text-white font-bold text-sm">
          <ShieldAlert className="w-5 h-5 text-brand-500 shrink-0" />
          <span>Statutory Authority Notice (Government of India)</span>
        </div>
        <p className="text-slate-300 leading-relaxed">
          LifeLink handles public awareness, pledge intention recording, and next-of-kin notification records. <strong>LifeLink DOES NOT perform recipient matching, DOES NOT maintain waiting lists, and DOES NOT allocate organs.</strong> Official legal allocation is handled strictly by NOTTO (National), ROTTO (Regional), and SOTTO (State) authorities.
        </p>
        <div className="pt-2">
          <a
            href="https://notto.mohfw.gov.in"
            target="_blank"
            rel="noreferrer"
            className="text-brand-400 font-semibold underline inline-flex items-center hover:text-white"
          >
            Visit NOTTO National Registry Portal ↗
          </a>
        </div>
      </div>

      {/* Plain Language Educational Guide */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-2 text-xs">
          <span className="w-7 h-7 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center font-bold">1</span>
          <h4 className="font-bold text-slate-900 text-sm">Why Family Consent Matters</h4>
          <p className="text-slate-500 leading-relaxed">
            In India, under the Transplantation of Human Organs Act, a pledge card is an expression of intent. At the time of donation, your next-of-kin must give legal consent. Telling your family today is the single most vital step.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-2 text-xs">
          <span className="w-7 h-7 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center font-bold">2</span>
          <h4 className="font-bold text-slate-900 text-sm">Brain-Stem Death Protocol</h4>
          <p className="text-slate-500 leading-relaxed">
            Deceased organ donation only occurs after brain-stem death is certified twice, 6 hours apart, by a panel of 4 independent doctors (including neurologists), strictly unaffiliated with transplant teams.
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-2 text-xs">
          <span className="w-7 h-7 rounded-lg bg-brand-50 text-brand-700 flex items-center justify-center font-bold">3</span>
          <h4 className="font-bold text-slate-900 text-sm">One Donor Saves 8 Lives</h4>
          <p className="text-slate-500 leading-relaxed">
            A single deceased donor can donate heart, 2 lungs, liver, 2 kidneys, pancreas, and intestines, plus tissue like corneas and skin, transforming the lives of up to 75 individuals.
          </p>
        </div>
      </div>

      {/* Internal Pledge Form */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="pb-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Record Your Pledge Intent</h3>
            <p className="text-xs text-slate-500">Record your intent and log a notification to your next-of-kin</p>
          </div>
          <span className="text-[11px] bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md font-semibold">
            Form 7 Compliant (Intent)
          </span>
        </div>

        {pledgeComplete ? (
          <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-6 text-center space-y-4">
            <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto" />
            <div className="space-y-1">
              <h4 className="text-lg font-bold text-emerald-950">Pledge Intent Recorded!</h4>
              <p className="text-xs text-emerald-800 max-w-md mx-auto">
                Thank you, {fullName}. Your pledge intent has been logged in LifeLink, and an automated alert has been recorded for your next-of-kin ({kinName}).
              </p>
            </div>

            <div className="pt-2">
              <a
                href="https://notto.mohfw.gov.in"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs px-6 py-3 rounded-xl transition-colors shadow-sm"
              >
                <span>Complete Official Legal Registration on NOTTO</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Legal Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="e.g. Aarav Patil"
                  className="w-full border border-slate-300 rounded-lg p-2.5"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Date of Birth</label>
                <input
                  type="date"
                  required
                  value={dob}
                  onChange={e => setDob(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Blood Group</label>
                <select
                  value={bloodGroup}
                  onChange={e => setBloodGroup(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2.5 bg-white font-bold"
                >
                  {['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'].map(bg => (
                    <option key={bg} value={bg}>{bg}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Organs Selection Grid */}
            <div className="space-y-2">
              <label className="block font-semibold text-slate-700">Select Organs & Tissues to Pledge</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {organList.map(item => {
                  const isSelected = selectedOrgans.includes(item.name);
                  return (
                    <button
                      type="button"
                      key={item.name}
                      onClick={() => handleToggleOrgan(item.name)}
                      className={`p-3 rounded-xl border text-left transition-colors flex items-start space-x-2.5 ${
                        isSelected
                          ? 'border-brand-600 bg-brand-50/60 ring-1 ring-brand-600 text-brand-900'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <item.icon className={`w-4 h-4 mt-0.5 ${isSelected ? 'text-brand-600' : 'text-slate-400'}`} />
                      <div>
                        <strong className="block text-xs">{item.name}</strong>
                        <span className="text-[10px] text-slate-500">{item.desc}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Next of Kin Notification Card */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-brand-600" />
                <h4 className="font-bold text-slate-900 text-xs">Next-of-Kin Witness & Notification Record</h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Next-of-Kin Name</label>
                  <input
                    type="text"
                    required
                    value={kinName}
                    onChange={e => setKinName(e.target.value)}
                    placeholder="e.g. Sunita Patil"
                    className="w-full bg-white border border-slate-300 rounded-lg p-2.5"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Next-of-Kin Mobile</label>
                  <input
                    type="tel"
                    required
                    value={kinPhone}
                    onChange={e => setKinPhone(e.target.value)}
                    placeholder="+91 98200 88990"
                    className="w-full bg-white border border-slate-300 rounded-lg p-2.5"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 mb-1 font-semibold">Relationship</label>
                  <select
                    value={kinRelation}
                    onChange={e => setKinRelation(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2.5"
                  >
                    <option value="Parent">Parent</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Child">Child</option>
                    <option value="Guardian">Guardian</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Acknowledgment Checkbox */}
            <label className="flex items-start space-x-2.5 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                required
                checked={consentCheck}
                onChange={e => setConsentCheck(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-brand-600"
              />
              <span className="leading-relaxed">
                I hereby declare my intent to donate my organs upon death. I have discussed this decision with my next-of-kin ({kinName || 'my family'}), who understand their legal requirement to honor this wish.
              </span>
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors shadow-sm flex items-center justify-center space-x-2"
            >
              <span>{isSubmitting ? 'Recording Intent...' : 'Record Pledge Intent & Proceed to NOTTO'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
