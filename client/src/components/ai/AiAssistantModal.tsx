import React, { useState } from 'react';
import { api } from '../../services/api';
import { Bot, X, Send, Mic, MicOff, Globe2, ShieldAlert, ExternalLink, Sparkles } from 'lucide-react';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  sender: 'user' | 'assistant';
  text: string;
  disclaimer?: string;
  officialLinks?: Array<{ title: string; url: string }>;
  timestamp: string;
}

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({ isOpen, onClose }) => {
  const [language, setLanguage] = useState<'en' | 'hi' | 'mr'>('en');
  const [inputQuery, setInputQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: 'assistant',
      text: 'Hello. I am the LifeLink Coordination Assistant. I can help with donation interval rules, FAQ guidance, and emergency intake drafting in English, Hindi, or Marathi. How can I assist you?',
      disclaimer: 'LifeLink provides coordination logistics only. Clinical clearance is strictly determined by a physician.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  if (!isOpen) return null;

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const res = await api.getAiFaqResponse(textToSend, language);
      const assistantMsg: ChatMessage = {
        sender: 'assistant',
        text: res.reply,
        disclaimer: res.disclaimer,
        officialLinks: res.officialLinks,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          sender: 'assistant',
          text: 'I encountered an error retrieving that answer. Please consult the nearest hospital blood bank for immediate clinical guidance.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Simulated Voice Input
  const toggleSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser. Please type your message.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = language === 'hi' ? 'hi-IN' : language === 'mr' ? 'mr-IN' : 'en-US';
    recognition.interimResults = false;

    setIsListening(true);

    recognition.onresult = (event: any) => {
      const speechToText = event.results[0][0].transcript;
      setInputQuery(speechToText);
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const samplePrompts = [
    { label: 'Eligibility Cooldown', query: 'What is the required waiting interval between whole blood donations?' },
    { label: 'Organ Pledge Process', query: 'How does organ pledge and family consent work in India?' },
    { label: 'Central Blood Stock', query: 'Where can I check centralized blood stock availability?' },
    { label: 'रक्तदान नियम (Hindi)', query: 'रक्तदान की पात्रता के क्या नियम हैं?', lang: 'hi' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl flex flex-col h-[650px] overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-sm">LifeLink AI Assistant</h3>
                <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded border border-slate-700">
                  Gemini API Protected
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Multilingual FAQs & Coordination Guidance</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Language Selector */}
            <div className="flex items-center space-x-1 bg-slate-800 rounded-lg p-1 text-xs">
              <Globe2 className="w-3.5 h-3.5 text-slate-400 ml-1" />
              <button
                onClick={() => setLanguage('en')}
                className={`px-2 py-0.5 rounded ${language === 'en' ? 'bg-brand-600 text-white' : 'text-slate-400'}`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('hi')}
                className={`px-2 py-0.5 rounded ${language === 'hi' ? 'bg-brand-600 text-white' : 'text-slate-400'}`}
              >
                हिन्दी
              </button>
              <button
                onClick={() => setLanguage('mr')}
                className={`px-2 py-0.5 rounded ${language === 'mr' ? 'bg-brand-600 text-white' : 'text-slate-400'}`}
              >
                मराठी
              </button>
            </div>

            <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-md">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Guardrail Disclaimer Alert */}
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center space-x-2 text-[11px] text-amber-900">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Medical Guardrail:</strong> LifeLink AI does NOT diagnose illnesses or make clinical eligibility decisions. Always consult a physician.
          </span>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs shadow-sm ${
                  msg.sender === 'user'
                    ? 'bg-brand-600 text-white rounded-tr-none'
                    : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                }`}
              >
                <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>

                {msg.officialLinks && msg.officialLinks.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-slate-100 space-y-1">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Official Resources:</span>
                    {msg.officialLinks.map((link, lIdx) => (
                      <a
                        key={lIdx}
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center text-[11px] text-brand-600 hover:underline mr-3"
                      >
                        {link.title} <ExternalLink className="w-2.5 h-2.5 ml-1" />
                      </a>
                    ))}
                  </div>
                )}

                {msg.disclaimer && (
                  <div className="mt-2 text-[10px] text-slate-400 italic">
                    ℹ {msg.disclaimer}
                  </div>
                )}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.timestamp}</span>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center space-x-2 text-xs text-slate-500 bg-white p-2.5 rounded-lg border border-slate-200 w-fit">
              <Sparkles className="w-3.5 h-3.5 text-brand-500 animate-spin" />
              <span>Analyzing with clinical safety guardrails...</span>
            </div>
          )}
        </div>

        {/* Sample Prompts Ticker */}
        <div className="bg-white border-t border-slate-200 px-4 py-2 flex items-center space-x-2 overflow-x-auto text-[11px]">
          <span className="text-slate-400 font-medium whitespace-nowrap">FAQs:</span>
          {samplePrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => {
                if (p.lang) setLanguage(p.lang as any);
                handleSend(p.query);
              }}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1 rounded-full whitespace-nowrap border border-slate-200"
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Input Form */}
        <div className="p-3 bg-white border-t border-slate-200">
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center space-x-2"
          >
            <button
              type="button"
              onClick={toggleSpeechRecognition}
              className={`p-2 rounded-lg border transition-colors ${
                isListening
                  ? 'bg-rose-100 border-rose-400 text-rose-600 animate-pulse'
                  : 'bg-slate-100 border-slate-300 text-slate-600 hover:bg-slate-200'
              }`}
              title={isListening ? 'Stop listening' : 'Speak to AI'}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <input
              type="text"
              value={inputQuery}
              onChange={e => setInputQuery(e.target.value)}
              placeholder={
                language === 'hi'
                  ? 'रक्तदान या अंगदान के बारे में पूछें...'
                  : language === 'mr'
                  ? 'रक्तदान किंवा अवयवदानाबद्दल विचारा...'
                  : 'Ask about donation eligibility, organ pledge, or procedures...'
              }
              className="flex-1 text-xs border border-slate-300 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />

            <button
              type="submit"
              disabled={isLoading || !inputQuery.trim()}
              className="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white p-2.5 rounded-lg transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
