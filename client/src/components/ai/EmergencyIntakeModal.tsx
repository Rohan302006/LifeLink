import React, { useState } from 'react';
import { api } from '../../services/api';
import { Sparkles, Mic, MicOff, AlertCircle, CheckCircle, ArrowRight, X } from 'lucide-react';

interface EmergencyIntakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyDraft: (draft: any) => void;
}

export const EmergencyIntakeModal: React.FC<EmergencyIntakeModalProps> = ({
  isOpen,
  onClose,
  onApplyDraft,
}) => {
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [extractedDraft, setExtractedDraft] = useState<any | null>(null);

  if (!isOpen) return null;

  const handleParse = async (sampleText?: string) => {
    const textToProcess = sampleText || inputText;
    if (!textToProcess.trim()) return;

    setIsLoading(true);
    try {
      const res = await api.getAiIntakeDraft(textToProcess);
      setExtractedDraft(res.draft);
    } catch (err: any) {
      alert('Intake parsing failed: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleVoice = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition not supported in this browser. Please type emergency details.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    setIsListening(true);

    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setInputText(text);
      setIsListening(false);
      handleParse(text);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const sampleEmergencyTemplates = [
    'Emergency! Need 2 units O negative blood for patient Suresh Deshmukh at Lilavati Hospital Mumbai urgently for bypass surgery.',
    'Trauma patient Rajesh at KEM Hospital needs 3 units B positive whole blood immediately.',
    'Platelets required: 1 unit SDP for patient Asha Mhatre at Tata Memorial Hospital within 24 hours.',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">AI Emergency Intake Assistant</h3>
              <p className="text-[11px] text-slate-400">Speak or paste emergency text to auto-draft request</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Describe Emergency in Natural Language (Voice or Text)
            </label>
            <div className="relative">
              <textarea
                rows={3}
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                placeholder="e.g. Urgent! 2 units O- needed for Suresh Deshmukh at Lilavati Hospital Mumbai for heart surgery..."
                className="w-full text-xs border border-slate-300 rounded-lg p-3 pr-10 focus:ring-1 focus:ring-brand-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={toggleVoice}
                className={`absolute right-2.5 top-2.5 p-1.5 rounded-md ${
                  isListening
                    ? 'bg-rose-100 text-rose-600 animate-pulse'
                    : 'text-slate-400 hover:text-slate-700'
                }`}
                title="Dictate with voice"
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Quick Examples */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-slate-500">Quick Test Templates:</span>
            <div className="space-y-1">
              {sampleEmergencyTemplates.map((tpl, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setInputText(tpl);
                    handleParse(tpl);
                  }}
                  className="block w-full text-left text-[11px] text-slate-600 bg-slate-50 hover:bg-slate-100 p-2 rounded border border-slate-200 truncate"
                >
                  👉 {tpl}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => handleParse()}
            disabled={isLoading || !inputText.trim()}
            className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-medium text-xs py-2.5 rounded-lg flex items-center justify-center space-x-2 transition-colors"
          >
            {isLoading ? (
              <span>Extracting Clinical Entities...</span>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-brand-400" />
                <span>Parse Structured Draft</span>
              </>
            )}
          </button>

          {/* Extracted Draft Card */}
          {extractedDraft && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-xs font-semibold text-slate-900 flex items-center space-x-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>Structured Draft Extracted</span>
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded">
                  Requires Human Confirmation
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Patient Name</span>
                  <strong className="text-slate-800">{extractedDraft.patient_name || 'Not detected'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Blood Group</span>
                  <strong className="text-brand-700 text-sm">{extractedDraft.blood_group || 'O-'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Component</span>
                  <strong className="text-slate-800 capitalize">{extractedDraft.component}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Units Needed</span>
                  <strong className="text-slate-800">{extractedDraft.units_needed} Unit(s)</strong>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block text-[10px]">Detected Hospital</span>
                  <strong className="text-slate-800">{extractedDraft.hospital_name || 'Lilavati Hospital & Research Centre'}</strong>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 italic">
                  *A human must review, and a doctor still verifies.
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onApplyDraft(extractedDraft);
                    onClose();
                  }}
                  className="bg-brand-600 hover:bg-brand-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-colors"
                >
                  <span>Apply to Form</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
