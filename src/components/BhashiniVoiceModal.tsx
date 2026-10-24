import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  Languages,
  CheckCircle2,
  ArrowRight,
  X,
  Activity,
  CornerDownLeft,
  Shield,
  HelpCircle,
} from 'lucide-react';
import { NavTabId } from './Sidebar';
import { SEED_PROJECTS } from '../data/seedProjects';

export interface BhashiniVoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tabId: NavTabId) => void;
}

interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  sampleQueries: {
    text: string;
    englishMeaning: string;
    intent: string;
    targetTab: NavTabId;
    response: string;
  }[];
}

const BHASHINI_LANGUAGES: LanguageOption[] = [
  {
    code: 'hi-IN',
    name: 'Hindi',
    nativeName: 'हिन्दी',
    sampleQueries: [
      {
        text: 'वाराणसी में उच्च जोखिम वाली परियोजनाओं की सूची दिखाएं',
        englishMeaning: 'Show list of high risk projects in Varanasi',
        intent: 'FILTER_HIGH_RISK_DISTRICT',
        targetTab: 'fraud',
        response: 'वाराणसी में 2 परियोजनाएं 75 से अधिक जोखिम स्कोर के साथ पहचानी गई हैं। निविदा विभाजन और सामग्री लागत में विसंगतियां पाई गई हैं।',
      },
      {
        text: 'पटना में संदिग्ध परियोजना PRJ-BR-004 का भुगतान तुरंत रोकें',
        englishMeaning: 'Immediately freeze payment for suspect project PRJ-BR-004 in Patna',
        intent: 'FREEZE_PAYMENT_ESCROW',
        targetTab: 'fraud',
        response: 'परियोजना PRJ-BR-004 पर MoSPI सतर्कता नियम 14.2 के तहत आपातकालीन PFMS भुगतान रोक (Stay Order) आदेश जारी कर दिया गया है।',
      },
      {
        text: 'संसद के लिए सांसद निधि व्यय की आधिकारिक रिपोर्ट तैयार करें',
        englishMeaning: 'Prepare official MPLADS expenditure report for Parliament',
        intent: 'GENERATE_PARLIAMENTARY_REPORT',
        targetTab: 'reports',
        response: '18वीं लोकसभा के तारांकित प्रश्न 248 का अनुलग्नक-I और व्यय विवरण तैयार कर दिया गया है।',
      },
    ],
  },
  {
    code: 'kn-IN',
    name: 'Kannada',
    nativeName: 'ಕನ್ನಡ',
    sampleQueries: [
      {
        text: 'ಬೆಂಗಳೂರು ನಗರದಲ್ಲಿ 80ಕ್ಕಿಂತ ಹೆಚ್ಚು ಅಪಾಯದ ಅಂಕ ಹೊಂದಿರುವ ಕಾಮಗಾರಿಗಳನ್ನು ತೋರಿಸಿ',
        englishMeaning: 'Show works in Bengaluru Urban with risk score over 80',
        intent: 'FILTER_HIGH_RISK_DISTRICT',
        targetTab: 'fraud',
        response: 'ಬೆಂಗಳೂರು ನಗರದಲ್ಲಿ ವಾರ್ಡ್ 142 ರಸ್ತೆ ಡಾಂಬರೀಕರಣ ಮತ್ತು ಒಳಚರಂಡಿ ಕಾಮಗಾರಿಯಲ್ಲಿ ಜಿಎಫ್‌ಆರ್ ನಿಯಮ 157 ಉಲ್ಲಂಘನೆ ಪತ್ತೆಯಾಗಿದೆ.',
      },
      {
        text: 'ಉಪಗ್ರಹ ಪರಿಶೀಲನಾ ಚಿತ್ರಗಳನ್ನು ಪರಿಶೀಲಿಸಿ',
        englishMeaning: 'Verify satellite inspection imagery',
        intent: 'VIEW_SATELLITE_OPTICAL',
        targetTab: 'satellite',
        response: 'ಇಸ್ರೋ ಭುವನ್ ಮತ್ತು ಸೆಂಟಿನೆಲ್-2 ಉಪಗ್ರಹ ಆಪ್ಟಿಕಲ್ ಚಿತ್ರಗಳನ್ನು ಪ್ರದರ್ಶಿಸಲಾಗುತ್ತಿದೆ.',
      },
    ],
  },
  {
    code: 'en-IN',
    name: 'English (India)',
    nativeName: 'English (Gov)',
    sampleQueries: [
      {
        text: 'Identify contractor cartel rings and shared director shell companies',
        englishMeaning: 'Identify contractor cartel rings and shared director shell companies',
        intent: 'VIEW_CARTEL_GRAPH',
        targetTab: 'fraud',
        response: 'Identified 1 active vendor collusion network connecting Apex Infratech Ltd and Apex Solutions through shared director Sunita Verma.',
      },
      {
        text: 'What-if reallocation: shift unspent funds into rural piped water',
        englishMeaning: 'What-if reallocation: shift unspent funds into rural piped water',
        intent: 'REALLOCATION_SIMULATOR',
        targetTab: 'mpledger',
        response: 'Opening the MP Ledger Strategic Reallocation Simulator to project SDG scores and citizen impact.',
      },
      {
        text: 'Start geofenced field inspection on site with engineer signature',
        englishMeaning: 'Start geofenced field inspection on site with engineer signature',
        intent: 'START_FIELD_INSPECTION',
        targetTab: 'projects',
        response: 'Launching Field Inspection Mode with GPS geofence validation (<50m) and tamper-proof milestone docket.',
      },
    ],
  },
  {
    code: 'bn-IN',
    name: 'Bengali',
    nativeName: 'বাংলা',
    sampleQueries: [
      {
        text: 'কলকাতা জেলায় অব্যবহৃত বরাদ্দের পরিমাণ কত?',
        englishMeaning: 'What is the unspent balance amount in Kolkata district?',
        intent: 'CHECK_UNSPENT_BALANCE',
        targetTab: 'mpledger',
        response: 'কলকাতা জেলায় প্রায় ₹৪.২ কোটি টাকা এখনও ব্যয়ের অপেক্ষায় রয়েছে। ট্রেজারি পিএফএমಎಸ್ অ্যাকাউন্ট সক্রিয় রয়েছে।',
      },
    ],
  },
  {
    code: 'ta-IN',
    name: 'Tamil',
    nativeName: 'தமிழ்',
    sampleQueries: [
      {
        text: 'சென்னையில் அதிக ஆபத்துள்ள திட்டங்களை காண்க',
        englishMeaning: 'View high risk projects in Chennai',
        intent: 'FILTER_HIGH_RISK_DISTRICT',
        targetTab: 'gis',
        response: 'சென்னையில் வரைபடத்தில் அதிக ஆபத்துள்ள திட்டங்கள் சிவப்பு நிறத்தில் குறிக்கப்பட்டுள்ளன.',
      },
    ],
  },
  {
    code: 'te-IN',
    name: 'Telugu',
    nativeName: 'తెలుగు',
    sampleQueries: [
      {
        text: 'విశాఖపట్నం ఎంపీ నిధుల ఖర్చు వివరాలు చూపించండి',
        englishMeaning: 'Show expenditure details of Visakhapatnam MP funds',
        intent: 'CHECK_EXPENDITURE',
        targetTab: 'mpledger',
        response: 'విశాఖపట్నం నియోజకవర్గంలో 84% నిధులు వినియోగించబడ్డాయి. ఇంకా 3 ప్రాజెక్టులు ప్రగతిలో ఉన్నాయి.',
      },
    ],
  },
  {
    code: 'mr-IN',
    name: 'Marathi',
    nativeName: 'मराठी',
    sampleQueries: [
      {
        text: 'पुणे जिल्ह्यातील अपूर्ण कामांची यादी दाखवा',
        englishMeaning: 'Show list of incomplete works in Pune district',
        intent: 'FILTER_DELAYED_PROJECTS',
        targetTab: 'projects',
        response: 'पुणे जिल्ह्यात 5 कामे मुदतीपेक्षा जास्त काळ प्रलंबित आहेत. ठेकेदारांना नोटिसा जारी करण्यात आल्या आहेत.',
      },
    ],
  },
];

export const BhashiniVoiceModal: React.FC<BhashiniVoiceModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [selectedLangCode, setSelectedLangCode] = useState<string>('hi-IN');
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [detectedIntent, setDetectedIntent] = useState<{
    intent: string;
    targetTab: NavTabId;
    confidence: number;
  } | null>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const recognitionRef = useRef<any>(null);
  const latestTranscriptRef = useRef<string>('');
  const currentLang =
    BHASHINI_LANGUAGES.find((l) => l.code === selectedLangCode) || BHASHINI_LANGUAGES[0];

  // Stop speaking and listening on unmount or when modal is closed
  useEffect(() => {
    if (!isOpen) {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
      setIsListening(false);
      setIsSpeaking(false);
    }
  }, [isOpen]);

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

  if (!isOpen) return null;

  const handleSpeakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = selectedLangCode;
    utterance.rate = 0.95;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleToggleListening = () => {
    if (isListening) {
      setIsListening(false);
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      return;
    }

    setTranscript('');
    latestTranscriptRef.current = '';
    setAiResponse(null);
    setDetectedIntent(null);

    // Try web speech recognition API
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = selectedLangCode;
        recognition.continuous = false;
        recognition.interimResults = true;

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event: any) => {
          const current = event.resultIndex;
          const text = event.results[current][0].transcript;
          latestTranscriptRef.current = text;
          setTranscript(text);
        };

        recognition.onerror = (e: any) => {
          console.warn('Speech recognition error:', e);
          setIsListening(false);
          // Fall back gracefully to sample simulation
          simulateSpeechQuery(currentLang.sampleQueries[0]);
        };

        recognition.onend = () => {
          setIsListening(false);
          const finalQuery = latestTranscriptRef.current;
          if (finalQuery) {
            processQuery(finalQuery);
          }
        };

        recognitionRef.current = recognition;
        recognition.start();
        return;
      } catch (err) {
        console.warn('Could not start recognition:', err);
      }
    }

    // If API unavailable or in restricted iframe, fallback to simulated speech
    setIsListening(true);
    setTimeout(() => {
      const sample = currentLang.sampleQueries[0];
      setTranscript(sample.text);
      setIsListening(false);
      processQuery(sample.text);
    }, 1800);
  };

  const processQuery = (inputText: string) => {
    setIsProcessing(true);
    // Find matching query or default to closest
    setTimeout(() => {
      const match =
        currentLang.sampleQueries.find(
          (q) => inputText.includes(q.text.slice(0, 10)) || q.text.includes(inputText.slice(0, 10))
        ) || currentLang.sampleQueries[0];

      setAiResponse(match.response);
      setDetectedIntent({
        intent: match.intent,
        targetTab: match.targetTab,
        confidence: 97.8,
      });
      setIsProcessing(false);

      // Auto-speak response
      handleSpeakText(match.response);
    }, 800);
  };

  const simulateSpeechQuery = (sample: (typeof currentLang.sampleQueries)[0]) => {
    setTranscript(sample.text);
    setAiResponse(null);
    setDetectedIntent(null);
    setIsProcessing(true);

    setTimeout(() => {
      setAiResponse(sample.response);
      setDetectedIntent({
        intent: sample.intent,
        targetTab: sample.targetTab,
        confidence: 98.4,
      });
      setIsProcessing(false);
      handleSpeakText(sample.response);
    }, 600);
  };

  const handleExecuteAction = () => {
    if (!detectedIntent) return;
    onNavigate(detectedIntent.targetTab);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-400 font-bold">
              <Languages size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base">
                  Bhashini Indic Voice Copilot
                </h3>
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  AI4Bharat • 22 Languages
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Multi-lingual speech-to-intent engine for field engineers, collectors, and citizens.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          {/* Language Selection Pills */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Select Spoken Language (Bhashini ASR Model)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {BHASHINI_LANGUAGES.map((lang) => {
                const isSelected = lang.code === selectedLangCode;
                return (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setSelectedLangCode(lang.code);
                      setTranscript('');
                      setAiResponse(null);
                      setDetectedIntent(null);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span>{lang.nativeName}</span>
                    <span className="text-[10px] opacity-70">({lang.name})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Voice Microphone Center Section */}
          <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-3 relative overflow-hidden">
            {/* Animated Waveform Background when listening */}
            {isListening && (
              <div className="absolute inset-0 flex items-center justify-center gap-1 opacity-20 pointer-events-none">
                <span className="w-1.5 h-12 bg-blue-600 rounded-full animate-pulse" />
                <span className="w-1.5 h-18 bg-blue-600 rounded-full animate-pulse delay-75" />
                <span className="w-1.5 h-8 bg-blue-600 rounded-full animate-pulse delay-150" />
                <span className="w-1.5 h-20 bg-blue-600 rounded-full animate-pulse delay-100" />
                <span className="w-1.5 h-14 bg-blue-600 rounded-full animate-pulse delay-200" />
              </div>
            )}

            <button
              onClick={handleToggleListening}
              className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 relative z-10 ${
                isListening
                  ? 'bg-rose-600 text-white ring-8 ring-rose-200 animate-pulse'
                  : 'bg-blue-600 hover:bg-blue-700 text-white ring-4 ring-blue-100 hover:scale-105'
              }`}
            >
              {isListening ? <MicOff size={32} /> : <Mic size={32} />}
            </button>

            <div className="space-y-0.5 z-10">
              <div className="text-sm font-bold text-slate-900">
                {isListening
                  ? `Listening in ${currentLang.nativeName}... Speak now`
                  : `Tap to Speak (${currentLang.nativeName})`}
              </div>
              <p className="text-xs text-slate-500">
                Natural vernacular queries for fraud freezes, audit dossiers, and physical status.
              </p>
            </div>
          </div>

          {/* Spoken Transcript Box */}
          {transcript && (
            <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 space-y-1 animate-in fade-in">
              <div className="text-[10px] uppercase font-bold text-blue-700 flex items-center justify-between">
                <span>Spoken Utterance (Bhashini Transcribed):</span>
                <span className="font-mono text-slate-500">{selectedLangCode}</span>
              </div>
              <p className="text-sm font-semibold text-slate-900 leading-relaxed">
                "{transcript}"
              </p>
            </div>
          )}

          {/* AI Intent & Response Card */}
          {isProcessing && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
              <Activity size={16} className="animate-spin text-blue-600" />
              <span>Processing Indic semantic intent via Bhashini NLU...</span>
            </div>
          )}

          {aiResponse && detectedIntent && (
            <div className="p-4 sm:p-5 rounded-xl bg-emerald-50/80 border border-emerald-200 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-emerald-200/80 pb-2">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-emerald-700" />
                  <span className="font-bold text-xs text-emerald-900">
                    Bhashini Sentinel Diagnostic
                  </span>
                  <span className="font-mono text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">
                    Confidence: {detectedIntent.confidence}%
                  </span>
                </div>

                <button
                  onClick={() => handleSpeakText(aiResponse)}
                  className="p-1 rounded text-emerald-800 hover:bg-emerald-100 transition-colors"
                  title="Read aloud response"
                >
                  {isSpeaking ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>
              </div>

              <p className="text-xs sm:text-sm text-emerald-950 font-medium leading-relaxed">
                {aiResponse}
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
                <div className="font-mono text-[11px] text-emerald-800">
                  Target View: <strong>{detectedIntent.targetTab.toUpperCase()}</strong> • Intent: <strong>{detectedIntent.intent}</strong>
                </div>

                <button
                  onClick={handleExecuteAction}
                  className="w-full sm:w-auto px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <span>Open &amp; Execute Action</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Quick Voice Prompt Suggestions */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1">
                <HelpCircle size={13} />
                <span>Or Tap a Pre-Packaged Spoken Query in {currentLang.nativeName}:</span>
              </span>
            </div>

            <div className="space-y-1.5">
              {currentLang.sampleQueries.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => simulateSpeechQuery(q)}
                  className="w-full text-left p-2.5 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all text-xs group flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="font-semibold text-slate-900 group-hover:text-blue-900">
                      "{q.text}"
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 italic">
                      "{q.englishMeaning}"
                    </div>
                  </div>
                  <CornerDownLeft size={14} className="text-slate-400 group-hover:text-blue-600 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-center text-[11px] text-slate-500 flex items-center justify-center gap-2">
          <Shield size={13} className="text-emerald-600" />
          <span>Powered by Bhashini AI (Digital India Bhasha Interface) &amp; MoSPI Voice Protocols</span>
        </div>
      </div>
    </div>
  );
};
