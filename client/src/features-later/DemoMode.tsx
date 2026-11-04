import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  PlayCircle,
  RotateCcw,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  Activity,
  FileCheck,
  Lock,
  Unlock,
  Phone,
} from 'lucide-react';

export const DemoMode: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [stepData, setStepData] = useState<any[]>([]);
  const [isRunningAuto, setIsRunningAuto] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('Ready for interactive hackathon demonstration.');

  const stepsMeta = [
    {
      step: 1,
      title: 'Step 1: Emergency Blood Request Created',
      actor: 'Patient Attendant (Priya Deshmukh)',
      description: 'Emergency request registered for Suresh Deshmukh (2 Units O- at Lilavati Hospital). Crucial: It is strictly pending and NOT yet broadcast.',
      icon: Activity,
    },
    {
      step: 2,
      title: 'Step 2: Doctor Verification & Location Matching',
      actor: 'Attending Physician (Dr. Ananya Sharma, MD)',
      description: 'Doctor reviews clinical requisition & crossmatch order. Approves request, triggering automated location matching across nearby compatible O- donors.',
      icon: StethoscopeIcon,
    },
    {
      step: 3,
      title: 'Step 3: Donor Accepts & Contact Unlocked',
      actor: 'Volunteer Donor (Aarav Patil, O-)',
      description: 'Donor receives emergency notification. Donor clicks "Accept". Privacy lock is released: direct phone numbers and route are revealed to both sides.',
      icon: UserCheck,
    },
    {
      step: 4,
      title: 'Step 4: Donation Logged & Cooldown Reset',
      actor: 'Hospital Blood Bank Pathologist (Dr. Ananya Sharma)',
      description: 'Doctor conducts sterile phlebotomy, verifies units collected, marks request fulfilled, resets donor cooldown to 90 days, and writes audit record.',
      icon: FileCheck,
    },
  ];

  function StethoscopeIcon(props: any) {
    return <ShieldCheck {...props} />;
  }

  const handleReset = async () => {
    setLoading(true);
    try {
      await api.resetDemoData();
      setCurrentStep(0);
      setStepData([]);
      setStatusMessage('Demo environment reset to pristine initial seed state (50 donors, 3 hospitals, 2 doctors).');
    } catch (err: any) {
      alert('Reset failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const executeStep = async (stepNum: number) => {
    setLoading(true);
    try {
      const res = await api.executeDemoStep(stepNum);
      setCurrentStep(stepNum);
      setStepData(prev => [...prev.filter(s => s.step !== stepNum), res]);
      setStatusMessage(res.description);
    } catch (err: any) {
      alert('Step execution failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const runFull2MinSimulation = async () => {
    setIsRunningAuto(true);
    await handleReset();

    // Run Step 1
    await new Promise(r => setTimeout(r, 1000));
    await executeStep(1);

    // Run Step 2
    await new Promise(r => setTimeout(r, 3000));
    await executeStep(2);

    // Run Step 3
    await new Promise(r => setTimeout(r, 3000));
    await executeStep(3);

    // Run Step 4
    await new Promise(r => setTimeout(r, 3000));
    await executeStep(4);

    setIsRunningAuto(false);
  };

  return (
    <div className="max-w-4xl mx-auto my-10 px-4 space-y-8">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-2 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full text-emerald-800 text-xs font-semibold mb-2">
            <PlayCircle className="w-4 h-4 text-emerald-600" />
            <span>Interactive Hackathon Demo Accelerator</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            2-Minute End-to-End LifeLink Journey
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Demonstrates the full verified coordination lifecycle: Request → Doctor Verification → Donor Matching → Privacy Unlock → Logged Fulfilment.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleReset}
            disabled={loading || isRunningAuto}
            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold px-3.5 py-2.5 rounded-xl flex items-center space-x-1.5 transition-colors shadow-2xs"
          >
            <RotateCcw className="w-4 h-4 text-slate-500" />
            <span>Reset Demo DB</span>
          </button>
          <button
            onClick={runFull2MinSimulation}
            disabled={loading || isRunningAuto}
            className="bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold px-5 py-2.5 rounded-xl flex items-center space-x-2 transition-colors shadow-sm"
          >
            <PlayCircle className="w-4 h-4" />
            <span>{isRunningAuto ? 'Running Simulation...' : 'Auto-Run 2-Min Demo'}</span>
          </button>
        </div>
      </div>

      {/* Live Status Bar */}
      <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Current Stage:</span>
            <p className="text-sm font-semibold text-slate-100">{statusMessage}</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-400">Step {currentStep} of 4</span>
        </div>
      </div>

      {/* 4 Interactive Journey Steps */}
      <div className="space-y-4">
        {stepsMeta.map((meta) => {
          const isDone = currentStep >= meta.step;
          const isCurrent = currentStep === meta.step;
          const dataForStep = stepData.find(s => s.step === meta.step);
          const Icon = meta.icon;

          return (
            <div
              key={meta.step}
              className={`rounded-2xl border p-6 transition-all space-y-3 ${
                isDone
                  ? 'border-emerald-300 bg-white shadow-xs'
                  : 'border-slate-200 bg-slate-50/70 opacity-80'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start space-x-3.5">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isDone
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {isDone ? <CheckCircle2 className="w-5 h-5 text-emerald-700" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-bold text-sm text-slate-900">{meta.title}</h3>
                      <span className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                        {meta.actor}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{meta.description}</p>
                  </div>
                </div>

                <div>
                  <button
                    onClick={() => executeStep(meta.step)}
                    disabled={isRunningAuto}
                    className={`text-xs font-semibold px-4 py-2 rounded-xl transition-colors whitespace-nowrap shadow-2xs ${
                      isDone
                        ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        : 'bg-brand-600 hover:bg-brand-700 text-white'
                    }`}
                  >
                    {isDone ? 'Re-Trigger Step' : `Run Step ${meta.step}`}
                  </button>
                </div>
              </div>

              {/* Data Reveal Highlights */}
              {meta.step === 2 && dataForStep && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-900 flex items-center justify-between">
                  <span>✅ Request verified by attending physician. Broadcast dispatched to <strong>{dataForStep.matchedDonorsCount || 5}</strong> nearby O- donors.</span>
                  <span className="text-[10px] font-bold bg-blue-100 px-2 py-0.5 rounded">BROADCAST ACTIVE</span>
                </div>
              )}

              {meta.step === 3 && dataForStep && (
                <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3 text-xs text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <Unlock className="w-4 h-4 text-emerald-700" />
                    <span><strong>Mutual Privacy Released:</strong> Donor ({dataForStep.donorPhone}) ↔ Attendant ({dataForStep.requesterPhone})</span>
                  </div>
                  <span className="text-[10px] font-bold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded uppercase">
                    Direct Contact Open
                  </span>
                </div>
              )}

              {meta.step === 4 && dataForStep && (
                <div className="bg-slate-100 border border-slate-300 rounded-xl p-3 text-xs text-slate-800 flex items-center justify-between">
                  <span>🎉 Donation logged under Record #{dataForStep.donationId}. Donor cooldown updated to 90 days. Request marked FULFILLED.</span>
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                    FULFILLED & AUDITED
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
