import React, { useState, useRef, useEffect } from 'react';
import { processCopilotMessage, resolveProjectByCodeOrId, CopilotMessage } from '../data/copilotEngine';
import { SEED_PROJECTS } from '../data/seedProjects';
import { ProjectItem, NavTabId } from '../types';
import {
  Bot,
  User,
  Send,
  Sparkles,
  ChevronRight,
  Activity,
  Cpu,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  ExternalLink,
  Languages,
  Shield,
  MapPin,
  FileText
} from 'lucide-react';

interface CopilotChatViewProps {
  onNavigate?: (tab: NavTabId) => void;
  onSelectProject?: (project: ProjectItem) => void;
}

const SUGGESTED_QUERIES = [
  'What are the highest risk projects in Bengaluru?',
  'Check for duplicate road works in Varanasi',
  'Are there blacklisted vendors active in Karnataka?',
  'Explain why project PRJ-BR-004 was flagged for critical risk',
  'What are the GFR Form 12-C compliance requirements?',
];

const BHASHINI_VOICE_LANGS = [
  { code: 'en-IN', name: 'English (India)' },
  { code: 'hi-IN', name: 'हिन्दी (Hindi)' },
  { code: 'ta-IN', name: 'தமிழ் (Tamil)' },
  { code: 'te-IN', name: 'తెలుగు (Telugu)' },
  { code: 'kn-IN', name: 'ಕನ್ನಡ (Kannada)' },
  { code: 'bn-IN', name: 'বাংলা (Bengali)' },
];

export const CopilotChatView: React.FC<CopilotChatViewProps> = ({
  onNavigate,
  onSelectProject,
}) => {
  const [input, setInput] = useState('');
  const [voiceLang, setVoiceLang] = useState('hi-IN');
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const [messages, setMessages] = useState<CopilotMessage[]>([
    {
      id: 'msg-0',
      sender: 'assistant',
      text: 'Greetings. I am the **MPLADS Sentinel AI Copilot**, orchestrated via a LangGraph Multi-Agent Supervisor network. I can investigate project anomalies, coordinate spatial queries, review contractor track records, and audit GFR compliance. How may I assist your vigilance review?',
      agentName: 'supervisor',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actions: [
        { label: 'Explore Interactive GIS Map', tab: 'gis' },
        { label: 'Inspect Vendor Cartel Graph', tab: 'fraud' },
        { label: 'Benford Forensic Audit', tab: 'fraud' },
        { label: 'Inspect Delayed Works', tab: 'analytics' },
      ],
    },
  ]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
    };
  }, []);

  const handleSpeak = (msgId: string, text: string) => {
    if (!('speechSynthesis' in window)) {
      setVoiceNotice('Text-to-speech is not supported in this browser environment.');
      setTimeout(() => setVoiceNotice(null), 4000);
      return;
    }

    if (speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text
      .replace(/\*\*/g, '')
      .replace(/[•\-\*#]/g, '')
      .replace(/₹/g, 'Rupees ');

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = voiceLang;
    utterance.rate = 0.95;

    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);

    setSpeakingMsgId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  const handleToggleVoiceInput = () => {
    if (isRecording) {
      setIsRecording(false);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceNotice('Speech recognition is not supported in this browser. Please type your query or click suggestions.');
      setTimeout(() => setVoiceNotice(null), 4500);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = voiceLang;
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (e: any) => {
        const transcript = e.results[e.resultIndex][0].transcript;
        setInput(transcript);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognition.onerror = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.warn(e);
      setIsRecording(false);
    }
  };

  const handleSend = async (queryText?: string) => {
    const text = queryText || input;
    if (!text.trim() || isProcessing) return;

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
    }

    const userMsg: CopilotMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsProcessing(true);

    try {
      const responseMsg = await processCopilotMessage(text);
      setMessages((prev) => [...prev, responseMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          text: 'An error occurred while coordinating worker agents. Please try again.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleActionClick = (action: { label: string; tab?: NavTabId; projectId?: string }) => {
    if (action.projectId && onSelectProject) {
      const found =
        resolveProjectByCodeOrId(action.projectId) ||
        SEED_PROJECTS.find((p) => p.id === action.projectId);
      if (found) {
        onSelectProject(found);
        return;
      }
    }
    if (action.tab && onNavigate) {
      onNavigate(action.tab);
    }
  };

  const renderFormattedMessage = (rawText: string) => {
    const parts = rawText.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={idx} className="font-bold text-slate-950">
            {part.slice(2, -2)}
          </strong>
        );
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code
            key={idx}
            className="px-1 py-0.5 rounded bg-slate-200/80 text-slate-900 font-mono text-[11px]"
          >
            {part.slice(1, -1)}
          </code>
        );
      }
      return <React.Fragment key={idx}>{part}</React.Fragment>;
    });
  };

  return (
    <div className="p-6 h-[calc(100vh-4rem)] flex flex-col space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
            <Bot size={18} />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 leading-none">
              Multi-Agent Intelligence Copilot (Phase 12 &amp; 13)
            </h1>
            <p className="text-[11px] text-slate-500 mt-1">
              Supervisor routing to: Fraud Agent, GIS Specialist, Compliance Agent &amp; Analytics Worker
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Bhashini Voice Language Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200 text-xs">
            <Languages size={13} className="text-slate-500" />
            <select
              value={voiceLang}
              onChange={(e) => setVoiceLang(e.target.value)}
              className="bg-transparent font-medium text-slate-700 focus:outline-none cursor-pointer text-xs"
            >
              {BHASHINI_VOICE_LANGS.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-500 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
            <Cpu size={13} className="text-blue-600" />
            <span>LangGraph: Active</span>
          </div>
        </div>
      </div>

      {/* Chat Messages Log */}
      <div className="flex-1 bg-white rounded-xl border border-slate-200/90 p-4 overflow-y-auto space-y-4 shadow-2xs">
        {messages.map((msg) => {
          const isAssistant = msg.sender === 'assistant';
          const isSpeakingThis = speakingMsgId === msg.id;

          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-3xl ${isAssistant ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
            >
              <div
                className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-white ${
                  isAssistant ? 'bg-slate-900' : 'bg-blue-600'
                }`}
              >
                {isAssistant ? <Bot size={16} className="text-blue-400" /> : <User size={16} />}
              </div>

              <div className="space-y-1.5 flex-1 min-w-0">
                {/* Agent Supervisor Routing Badge & Audio */}
                {isAssistant && (
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>Dispatched To: {msg.agentName ? msg.agentName.replace(/_/g, ' ') : 'Supervisor'}</span>
                    </div>

                    <button
                      onClick={() => handleSpeak(msg.id, msg.text || '')}
                      title={isSpeakingThis ? 'Stop Audio' : 'Listen with Bhashini Voice TTS'}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold transition-colors ${
                        isSpeakingThis
                          ? 'bg-rose-100 text-rose-700 animate-pulse'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {isSpeakingThis ? <VolumeX size={11} /> : <Volume2 size={11} />}
                      <span>{isSpeakingThis ? 'Stop Voice' : 'Bhashini Voice'}</span>
                    </button>
                  </div>
                )}

                <div
                  className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                    isAssistant
                      ? 'bg-slate-50 text-slate-800 border border-slate-200/80'
                      : 'bg-blue-600 text-white shadow-xs'
                  }`}
                >
                  <p className="whitespace-pre-line">
                    {isAssistant ? renderFormattedMessage(msg.text || '') : msg.text}
                  </p>
                </div>

                {/* Dispatchable Action Buttons */}
                {isAssistant && msg.actions && msg.actions.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {msg.actions.map((act, aIdx) => (
                      <button
                        key={aIdx}
                        onClick={() => handleActionClick(act)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-600 hover:text-white hover:border-blue-600 text-[11px] font-semibold transition-all shadow-2xs group"
                      >
                        {act.tab === 'gis' && <MapPin size={11} />}
                        {act.tab === 'fraud' && <Shield size={11} />}
                        {act.tab === 'reports' && <FileText size={11} />}
                        {act.projectId && <ExternalLink size={11} />}
                        <span>{act.label}</span>
                        <ChevronRight size={11} className="group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Multi-Agent Tool Trace Log (Phase 12 §4) */}
                {msg.toolTraces && msg.toolTraces.length > 0 && (
                  <div className="p-2 rounded-lg bg-slate-900 text-slate-300 text-[11px] font-mono space-y-1 border border-slate-800">
                    <div className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                      <Activity size={12} className="text-emerald-400" />
                      <span>Tool Execution Trace:</span>
                    </div>
                    {msg.toolTraces.map((t, idx) => (
                      <div key={idx} className="flex justify-between text-[10px]">
                        <span className="text-blue-400">{t.tool}</span>
                        <span className="text-slate-400">{t.latencyMs}ms</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="text-[10px] text-slate-400 font-mono px-1">{msg.timestamp}</div>
              </div>
            </div>
          );
        })}

        {isProcessing && (
          <div className="flex items-center gap-3 text-xs text-slate-500 max-w-sm">
            <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-white">
              <Bot size={16} className="text-blue-400 animate-pulse" />
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
              <span>Supervisor consulting tool registry...</span>
            </div>
          </div>
        )}
      </div>

      {/* Suggested Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-400 font-semibold shrink-0 text-[11px]">Suggestions:</span>
        {SUGGESTED_QUERIES.map((q) => (
          <button
            key={q}
            onClick={() => handleSend(q)}
            className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium whitespace-nowrap transition-colors"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Voice Notice if speech unsupported */}
      {voiceNotice && (
        <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg text-xs flex items-center justify-between">
          <span>{voiceNotice}</span>
          <button
            type="button"
            onClick={() => setVoiceNotice(null)}
            className="text-amber-700 hover:text-amber-900 font-bold ml-2 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Input Bar with Speech-to-Text */}
      <div className="bg-white rounded-xl border border-slate-300 p-2 flex items-center gap-2 shadow-sm focus-within:ring-2 focus-within:ring-blue-500">
        <button
          onClick={handleToggleVoiceInput}
          title={isRecording ? 'Stop Recording' : 'Speak your query via Bhashini'}
          className={`p-2 rounded-lg transition-all ${
            isRecording
              ? 'bg-rose-500 text-white animate-pulse'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
          }`}
        >
          {isRecording ? <MicOff size={15} /> : <Mic size={15} />}
        </button>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder={isRecording ? 'Listening in your chosen language...' : 'Ask Copilot to investigate anomalies, find duplicates, check vendor status...'}
          className="flex-1 px-3 py-1.5 text-xs text-slate-800 bg-transparent focus:outline-none"
        />

        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || isProcessing}
          className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  );
};
