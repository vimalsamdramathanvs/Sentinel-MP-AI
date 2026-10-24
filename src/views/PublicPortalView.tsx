import React, { useState } from 'react';
import { SEED_PROJECTS } from '../data/seedProjects';
import { MP_ALLOCATIONS_DATA } from '../data/mpAllocations';
import { StatusBadge } from '../components/StatusBadge';
import { openPrintPreview } from '../utils/printService';
import { ProjectItem } from '../types';
import {
  Globe,
  Search,
  MessageSquare,
  Send,
  CheckCircle2,
  ShieldCheck,
  MapPin,
  Camera,
  Upload,
  Sparkles,
  BarChart3,
  Award,
  AlertTriangle,
  FileCheck,
  Languages,
  Check,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Droplets,
  Zap,
  GraduationCap,
  Building,
  Navigation,
  FileText,
  Printer,
  Copy,
  Phone,
  MessageCircle,
  Star,
  Download,
  Users,
  QrCode,
  Share2
} from 'lucide-react';

interface PublicPortalViewProps {
  onSelectProject?: (project: ProjectItem) => void;
}

type LanguageKey = 'en' | 'hi' | 'kn' | 'ta';

interface PinCodeInfo {
  pin: string;
  constituency: string;
  district: string;
  state: string;
  mpName: string;
  party: string;
  totalWorks: number;
  utilizedPercent: number;
  trustScore: number;
}

const PIN_DATABASE: Record<string, PinCodeInfo> = {
  '560001': {
    pin: '560001',
    constituency: 'Bengaluru Central',
    district: 'Bengaluru Urban',
    state: 'Karnataka',
    mpName: 'P. C. Mohan',
    party: 'Lok Sabha',
    totalWorks: 48,
    utilizedPercent: 82,
    trustScore: 89,
  },
  '560034': {
    pin: '560034',
    constituency: 'Bengaluru South',
    district: 'Bengaluru Urban',
    state: 'Karnataka',
    mpName: 'Tejasvi Surya',
    party: 'Lok Sabha',
    totalWorks: 54,
    utilizedPercent: 88,
    trustScore: 92,
  },
  '221001': {
    pin: '221001',
    constituency: 'Varanasi',
    district: 'Varanasi',
    state: 'Uttar Pradesh',
    mpName: 'Narendra Modi',
    party: 'Lok Sabha',
    totalWorks: 92,
    utilizedPercent: 96,
    trustScore: 95,
  },
  '800001': {
    pin: '800001',
    constituency: 'Patna Sahib',
    district: 'Patna',
    state: 'Bihar',
    mpName: 'Ravi Shankar Prasad',
    party: 'Lok Sabha',
    totalWorks: 61,
    utilizedPercent: 74,
    trustScore: 81,
  },
  '411001': {
    pin: '411001',
    constituency: 'Pune',
    district: 'Pune',
    state: 'Maharashtra',
    mpName: 'Murlidhar Mohol',
    party: 'Lok Sabha',
    totalWorks: 43,
    utilizedPercent: 79,
    trustScore: 86,
  },
  '682001': {
    pin: '682001',
    constituency: 'Ernakulam',
    district: 'Ernakulam',
    state: 'Kerala',
    mpName: 'Hibi Eden',
    party: 'Lok Sabha',
    totalWorks: 57,
    utilizedPercent: 91,
    trustScore: 94,
  },
};

export const PublicPortalView: React.FC<PublicPortalViewProps> = ({ onSelectProject }) => {
  const [lang, setLang] = useState<LanguageKey>('en');
  const [search, setSearch] = useState('');
  const [pinCodeQuery, setPinCodeQuery] = useState('560001');
  const [activePinData, setActivePinData] = useState<PinCodeInfo | null>(PIN_DATABASE['560001']);
  const [pinNotFound, setPinNotFound] = useState(false);

  // Ground verification grievance form state
  const [complaintProject, setComplaintProject] = useState('');
  const [complaintDistrict, setComplaintDistrict] = useState('Bengaluru Urban');
  const [complaintText, setComplaintText] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [geoTaggedCoords, setGeoTaggedCoords] = useState<string>('12.9716° N, 77.5946° E');
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [lastGeneratedDocket, setLastGeneratedDocket] = useState<string | null>(null);

  // Citizen Action Modules: Grievance vs SMS/WhatsApp Tracking vs Auto-RTI Generator vs Social Audit vs Audit Dossier
  const [citizenActionTab, setCitizenActionTab] = useState<
    'grievance' | 'track_sms' | 'rti_generator' | 'social_audit' | 'audit_dossier'
  >('grievance');
  const [trackingQuery, setTrackingQuery] = useState('TRK-2026-BLR-0042');
  const [whatsappSubscribed, setWhatsappSubscribed] = useState(true);
  const [citizenPhone, setCitizenPhone] = useState('9845012345');
  const [docketLookupMessage, setDocketLookupMessage] = useState<string | null>(null);
  const [activeTrackedDocket, setActiveTrackedDocket] = useState<{
    id: string;
    projectTitle: string;
    district: string;
    date: string;
    status: string;
    reporter: string;
    eta: string;
  }>({
    id: 'TRK-2026-BLR-0042',
    projectTitle: 'Sub-Centre Clinic Solar Installation (Patna Sahib)',
    district: 'Patna',
    date: '01 March 2026, 11:24 AM IST',
    status: 'Under Executive Engineer Review',
    reporter: 'Dr. Arvind Narayanan',
    eta: 'Within 4 Business Days',
  });

  // Citizen Social Audit Form State (Phase 13)
  const [socialAuditProject, setSocialAuditProject] = useState(SEED_PROJECTS[0].id);
  const [ratings, setRatings] = useState({
    quality: 5,
    utility: 4,
    timeliness: 4,
    maintenance: 4,
  });
  const [citizenCategory, setCitizenCategory] = useState<'Resident' | 'Gram Panchayat' | 'Youth' | 'Social Auditor'>('Resident');
  const [auditFeedback, setAuditFeedback] = useState('');
  const [socialAuditSubmitted, setSocialAuditSubmitted] = useState(false);
  const [socialAuditsHistory, setSocialAuditsHistory] = useState([
    {
      id: 'SA-2026-081',
      projectTitle: 'Sub-Centre Clinic Solar Installation',
      auditor: 'Kavitha R. (Gram Panchayat Member)',
      overallScore: 4.5,
      date: '10 Mar 2026',
      comment: 'Solar panels functioning well during power cuts. Doctor confirmed vaccine refrigerator stays cold 24x7.',
      verified: true,
    },
    {
      id: 'SA-2026-074',
      projectTitle: 'Heritage Ghat Flood-Resilient Lighting',
      auditor: 'Prof. S. Tripathi (Civil Society Auditor)',
      overallScore: 4.8,
      date: '04 Mar 2026',
      comment: 'Lamps survive heavy wave action during high flood season. Solid anchoring fixtures.',
      verified: true,
    },
  ]);

  // Exportable PDF Audit Dossier State (Phase 13)
  const [dossierProjectId, setDossierProjectId] = useState(SEED_PROJECTS[0].id);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  // Auto-RTI Generator State
  const [rtiProjectTitle, setRtiProjectTitle] = useState(SEED_PROJECTS[0].title);
  const [applicantName, setApplicantName] = useState('Dr. Arvind Narayanan');
  const [applicantAddress, setApplicantAddress] = useState('Flat 402, Shanti Vihar, Indiranagar, Bengaluru - 560038');
  const [applicantPhone, setApplicantPhone] = useState('+91 98450 12345');
  const [applicantEmail, setApplicantEmail] = useState('arvind.narayanan@citizenmail.in');
  const [rtiGenerated, setRtiGenerated] = useState(false);
  const [copiedRti, setCopiedRti] = useState(false);

  const [filedComplaints, setFiledComplaints] = useState<any[]>([
    {
      id: 'TRK-2026-BLR-0042',
      projectTitle: 'Sub-Centre Clinic Solar Installation',
      district: 'Patna',
      date: '2026-03-01',
      status: 'Under District Magistrate Review',
      hasPhoto: true,
      description: 'Building roof has solar brackets installed but inverters were never connected. Hospital using diesel generator.',
    },
    {
      id: 'TRK-2026-VAR-0019',
      projectTitle: 'Heritage Ghat Flood-Resilient Lighting',
      district: 'Varanasi',
      date: '2026-02-28',
      status: 'Verified & Rectified by Agency',
      hasPhoto: true,
      description: '3 high-mast lamps on north staircase were loose; agency repaired anchor fixtures within 48 hours.',
    },
  ]);

  // Translations map for plain language accessibility
  const UI_TEXT = {
    en: {
      portalBadge: 'Public Transparency & Social Audit Portal',
      heroTitle: "Track Your MP's Local Area Development Funds",
      heroDesc:
        'Under the Right to Information Act and national open government principles, every citizen can inspect MPLADS project sanctions, release milestones, contractor allocations, and satellite ground truth verification.',
      scorecardTitle: 'Constituency Development Scorecard',
      scorecardSubtitle: 'Audited performance & ground delivery metrics',
      pinPlaceholder: 'Enter 6-digit PIN Code (e.g. 560001)',
      findPin: 'Locate My Constituency',
      reportTitle: 'Citizen Ground Truth & Social Audit Reporting',
      reportDesc:
        'Witness an abandoned site, substandard materials, or a non-existent asset? Upload a geo-tagged photo to file a tamper-evident audit docket directly with the District Vigilance Officer.',
      recentWorks: 'Local Works in Selected Jurisdiction',
      submitBtn: 'Submit Ground Audit Docket',
      photoLabel: 'Attach Verification Photo from Site (Optional)',
    },
    hi: {
      portalBadge: 'सार्वजनिक पारदर्शिता एवं सामाजिक अंकेक्षण पोर्टल',
      heroTitle: 'अपने सांसद के स्थानीय क्षेत्र विकास कोष (MPLADS) की स्थिति जानें',
      heroDesc:
        'सूचना का अधिकार अधिनियम के अंतर्गत, प्रत्येक नागरिक अपने क्षेत्र में स्वीकृत कार्यों, धन आवंटन, ठेकेदार विवरण और उपग्रह सत्यापन रिपोर्ट देख सकता है।',
      scorecardTitle: 'संसदीय क्षेत्र विकास स्कोरकार्ड',
      scorecardSubtitle: 'सत्यापित प्रदर्शन एवं धरातलीय प्रगति विवरण',
      pinPlaceholder: '६-अंकों का पिन कोड दर्ज करें (उदा. 221001)',
      findPin: 'मेरा क्षेत्र खोजें',
      reportTitle: 'नागरिक सत्यापन एवं शिकायत निवारण',
      reportDesc:
        'क्या आपके क्षेत्र में कोई कार्य अधूरा या अनुपस्थित है? फोटो अपलोड कर सीधे जिला सतर्कता अधिकारी को शिकायत दर्ज कराएं।',
      recentWorks: 'क्षेत्रीय स्वीकृत परियोजनाएं',
      submitBtn: 'सत्यापन रिपोर्ट दर्ज करें',
      photoLabel: 'कार्य स्थल का फोटो अपलोड करें (वैकल्पिक)',
    },
    kn: {
      portalBadge: 'ಸಾರ್ವಜನಿಕ ಪಾರದರ್ಶಕತೆ ಮತ್ತು ಸಾಮಾಜಿಕ ಲೆಕ್ಕಪರಿಶೋಧನೆ ಪೋರ್ಟಲ್',
      heroTitle: 'ನಿಮ್ಮ ಸಂಸದರ ಸ್ಥಳೀಯ ಪ್ರದೇಶಾಭಿವೃದ್ಧಿ ಅನುದಾನವನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ',
      heroDesc:
        'ಮಾಹಿತಿ ಹಕ್ಕು ಕಾಯಿದೆಯ ಅನ್ವಯ, ಪ್ರತಿಯೊಬ್ಬ ನಾಗರಿಕನು ತನ್ನ ಕ್ಷೇತ್ರದಲ್ಲಿ ಅನುಮೋದಿಸಲಾದ ಕಾಮಗಾರಿಗಳು ಮತ್ತು ಪ್ರಗತಿಯನ್ನು ಪರಿಶೀಲಿಸಬಹುದು.',
      scorecardTitle: 'ಕ್ಷೇತ್ರ ಅಭಿವೃದ್ಧಿ ಸ್ಕೋರ್‌ಕಾರ್ಡ್',
      scorecardSubtitle: 'ಪರಿಶೀಲಿಸಿದ ಸಾಧನೆ ಮತ್ತು ಕಾಮಗಾರಿಗಳ ವಿವರ',
      pinPlaceholder: '೬ ಅಂಕಿಯ ಪಿನ್ ಕೋಡ್ ನಮೂದಿಸಿ (ಉದಾ. 560001)',
      findPin: 'ನನ್ನ ಕ್ಷೇತ್ರ ಹುಡುಕಿ',
      reportTitle: 'ಸ್ಥಳೀಯ ಕಾಮಗಾರಿ ಪರಿಶೀಲನೆ ಮತ್ತು ದೂರು ದಾಖಲಾತಿ',
      reportDesc:
        'ಕಾಮಗಾರಿ ಅಪೂರ್ಣವಾಗಿದ್ದರೆ ಅಥವಾ ಕಳಪೆ ಗುಣಮಟ್ಟದ್ದಾಗಿದ್ದರೆ, ಫೋಟೋ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ ನೇರವಾಗಿ ಜಿಲ್ಲಾಧಿಕಾರಿಗಳಿಗೆ ದೂರು ಸಲ್ಲಿಸಿ.',
      recentWorks: 'ಆಯ್ದ ಕ್ಷೇತ್ರದ ಸಾರ್ವಜನಿಕ ಕಾಮಗಾರಿಗಳು',
      submitBtn: 'ಪರಿಶೀಲನಾ ವರದಿ ಸಲ್ಲಿಸಿ',
      photoLabel: 'ಸ್ಥಳದ ಫೋಟೋ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ (ಐಚ್ಛಿಕ)',
    },
    ta: {
      portalBadge: 'மக்கள் வெளிப்படைத்தன்மை & சமூக தணிக்கை தளம்',
      heroTitle: 'உங்கள் நாடாளுமன்ற உறுப்பினர் தொகுதி மேம்பாட்டு நிதியை அறிக',
      heroDesc:
        'தகவல் அறியும் உரிமைச் சட்டத்தின்படி, உங்கள் பகுதியில் ஒப்பளிக்கப்பட்ட வளர்ச்சி திட்டங்கள் மற்றும் நிதி நிலவரங்களை எளிதாக அறியலாம்.',
      scorecardTitle: 'தொகுதி வளர்ச்சி மதிப்பீட்டு அட்டை',
      scorecardSubtitle: 'சரிபார்க்கப்பட்ட திட்ட செயலாக்க புள்ளிவிவரங்கள்',
      pinPlaceholder: '6 இலக்க அஞ்சல் குறியீட்டு எண் (PIN) உள்ளிடவும்',
      findPin: 'என் தொகுதியை கண்டறிக',
      reportTitle: 'கள ஆய்வு & சமூக தணிக்கை புகார் பதிவு',
      reportDesc:
        'திட்டம் தொடங்கப்படாமல் இருந்தாலோ அல்லது குறைபாடுகள் இருந்தாலோ, புகைப்படத்துடன் அதிகாரிகளுக்கு நேரடியாக புகார் அனுப்பவும்.',
      recentWorks: 'தொகுதியில் நடைபெறும் முக்கிய திட்டங்கள்',
      submitBtn: 'புகாரை சமர்ப்பிக்கவும்',
      photoLabel: 'கள ஆய்வு புகைப்படத்தை இணைக்கவும் (விருப்பப்படி)',
    },
  }[lang];

  const handlePinLookup = (pin: string) => {
    const cleaned = pin.trim();
    if (PIN_DATABASE[cleaned]) {
      setActivePinData(PIN_DATABASE[cleaned]);
      setComplaintDistrict(PIN_DATABASE[cleaned].district);
      setPinNotFound(false);
    } else {
      setPinNotFound(true);
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitGrievance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintText.trim()) return;

    const prefix = complaintDistrict.substring(0, 3).toUpperCase();
    const newId = `TRK-2026-${prefix}-${Math.floor(100 + Math.random() * 900)}`;
    setLastGeneratedDocket(newId);

    setFiledComplaints([
      {
        id: newId,
        projectTitle: complaintProject || 'Constituency Public Infrastructure Verification',
        district: complaintDistrict,
        date: new Date().toISOString().slice(0, 10),
        status: 'Dispatched to District Vigilance Officer',
        hasPhoto: !!photoPreview,
        description: complaintText,
      },
      ...filedComplaints,
    ]);

    setSubmittedSuccess(true);
    setComplaintText('');
    setComplaintProject('');
    setPhotoPreview(null);
    setTimeout(() => setSubmittedSuccess(false), 5000);
  };

  const filteredProjects = SEED_PROJECTS.filter((p) => {
    if (activePinData && !search) {
      return (
        p.districtName.toLowerCase().includes(activePinData.district.toLowerCase()) ||
        p.stateName.toLowerCase().includes(activePinData.state.toLowerCase())
      );
    }
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      p.districtName.toLowerCase().includes(q) ||
      p.stateName.toLowerCase().includes(q)
    );
  }).slice(0, 6);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-5xl mx-auto">
      {/* Language Selector Header */}
      <div className="flex items-center justify-between bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <Languages size={16} className="text-blue-600" />
          <span>Select Official Language / भाषा / ಭಾಷೆ / மொழி:</span>
        </div>
        <div className="flex items-center gap-1.5">
          {(['en', 'hi', 'kn', 'ta'] as LanguageKey[]).map((code) => {
            const labels: Record<LanguageKey, string> = {
              en: 'English',
              hi: 'हिन्दी',
              kn: 'ಕನ್ನಡ',
              ta: 'தமிழ்',
            };
            return (
              <button
                key={code}
                onClick={() => setLang(code)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                  lang === code
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {labels[code]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Citizen Transparency Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 rounded-2xl p-6 sm:p-8 text-white space-y-4 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center gap-2 text-blue-300 text-xs font-bold uppercase tracking-widest">
          <Globe size={16} className="text-blue-400" />
          <span>{UI_TEXT.portalBadge}</span>
        </div>
        
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight max-w-2xl text-white">
          {UI_TEXT.heroTitle}
        </h1>
        
        <p className="text-xs sm:text-sm text-blue-100/90 max-w-2xl leading-relaxed">
          {UI_TEXT.heroDesc}
        </p>

        {/* Official Government Transparency Portals */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <a
            href="https://mplads.gov.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold transition-colors"
          >
            <ExternalLink size={12} className="text-amber-300" />
            <span>e-SAKSHI Citizen Portal (mplads.gov.in)</span>
          </a>
          <a
            href="https://rtionline.gov.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold transition-colors"
          >
            <ExternalLink size={12} className="text-emerald-300" />
            <span>National RTI Online (rtionline.gov.in)</span>
          </a>
          <a
            href="https://pgportal.gov.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-semibold transition-colors"
          >
            <ExternalLink size={12} className="text-blue-300" />
            <span>CPGRAMS Grievance Portal (pgportal.gov.in)</span>
          </a>
        </div>

        {/* PIN Code Fast-Finder Form */}
        <div className="pt-2">
          <div className="bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/20 max-w-xl space-y-2">
            <div className="text-[11px] font-semibold text-blue-200 flex items-center gap-1.5">
              <Navigation size={13} className="text-amber-400" />
              <span>Instant PIN Code / Constituency Locator</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  maxLength={6}
                  value={pinCodeQuery}
                  onChange={(e) => {
                    setPinCodeQuery(e.target.value);
                    if (e.target.value.length === 6) {
                      handlePinLookup(e.target.value);
                    }
                  }}
                  placeholder={UI_TEXT.pinPlaceholder}
                  className="w-full pl-9 pr-3 py-2 bg-white text-slate-900 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
                />
              </div>
              <button
                onClick={() => handlePinLookup(pinCodeQuery)}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-xs font-bold transition-colors shrink-0 flex items-center gap-1"
              >
                <span>{UI_TEXT.findPin}</span>
                <ChevronRight size={14} />
              </button>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[10px]">
              <span className="text-blue-300">Quick Try:</span>
              {Object.keys(PIN_DATABASE).map((p) => (
                <button
                  key={p}
                  onClick={() => {
                    setPinCodeQuery(p);
                    handlePinLookup(p);
                  }}
                  className={`px-2 py-0.5 rounded border transition-colors ${
                    activePinData?.pin === p
                      ? 'bg-blue-400 text-slate-950 font-bold border-blue-300'
                      : 'bg-white/10 text-blue-100 hover:bg-white/20 border-white/10'
                  }`}
                >
                  {p} ({PIN_DATABASE[p].district.split(' ')[0]})
                </button>
              ))}
            </div>

            {pinNotFound && (
              <p className="text-[11px] text-amber-300 pt-1">
                Note: PIN {pinCodeQuery} is simulated as National Zone. Showing default state data.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Constituency Development Scorecard (Nutrition Label Style) */}
      {activePinData && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-mono text-[10px] font-bold">
                  PIN: {activePinData.pin}
                </span>
                <span className="text-xs text-slate-500">{activePinData.state}</span>
              </div>
              <h2 className="text-xl font-black text-slate-900 mt-1">
                {activePinData.constituency} Parliamentary Constituency
              </h2>
              <p className="text-xs text-slate-500">
                Hon'ble MP: <span className="font-semibold text-slate-800">{activePinData.mpName}</span> • District: {activePinData.district}
              </p>
            </div>

            <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-xl">
              <ShieldCheck size={28} className="text-emerald-600 shrink-0" />
              <div>
                <div className="text-[10px] uppercase font-bold text-emerald-800">Public Trust Index</div>
                <div className="text-lg font-black text-emerald-950 leading-tight">
                  {activePinData.trustScore}/100
                </div>
                <div className="text-[10px] text-emerald-700">Audit & Satellite Verified</div>
              </div>
            </div>
          </div>

          {/* Key Metric Blocks */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <div className="text-[11px] text-slate-500 font-medium">MP Annual Quota</div>
              <div className="text-base font-extrabold text-slate-900 mt-0.5">₹5.00 Cr</div>
              <div className="text-[10px] text-slate-400">Statutory MPLADS Allocation</div>
            </div>

            <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-200/80">
              <div className="text-[11px] text-blue-700 font-medium">Fund Utilization</div>
              <div className="text-base font-extrabold text-blue-950 mt-0.5">
                {activePinData.utilizedPercent}%
              </div>
              <div className="text-[10px] text-blue-600">₹{(5 * activePinData.utilizedPercent / 100).toFixed(2)} Cr Expended</div>
            </div>

            <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-200/80">
              <div className="text-[11px] text-indigo-700 font-medium">Sanctioned Works</div>
              <div className="text-base font-extrabold text-indigo-950 mt-0.5">
                {activePinData.totalWorks} Projects
              </div>
              <div className="text-[10px] text-indigo-600">Across {activePinData.district}</div>
            </div>

            <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200/80">
              <div className="text-[11px] text-amber-700 font-medium">Completion Velocity</div>
              <div className="text-base font-extrabold text-amber-950 mt-0.5">
                4.8 Mos.
              </div>
              <div className="text-[10px] text-amber-700">Sanction to Commission</div>
            </div>
          </div>

          {/* Priority Sectors Breakdown */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Constituency Investment Priorities (Sectoral Distribution)
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
              <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center gap-2">
                <Droplets size={16} className="text-blue-600 shrink-0" />
                <div className="truncate">
                  <div className="font-bold text-slate-800">34% Water</div>
                  <div className="text-[10px] text-slate-500">RO Plants & Tanks</div>
                </div>
              </div>

              <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center gap-2">
                <GraduationCap size={16} className="text-emerald-600 shrink-0" />
                <div className="truncate">
                  <div className="font-bold text-slate-800">26% Education</div>
                  <div className="text-[10px] text-slate-500">School Classrooms</div>
                </div>
              </div>

              <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center gap-2">
                <Zap size={16} className="text-amber-600 shrink-0" />
                <div className="truncate">
                  <div className="font-bold text-slate-800">18% Solar</div>
                  <div className="text-[10px] text-slate-500">Street & Clinic Power</div>
                </div>
              </div>

              <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center gap-2">
                <Building size={16} className="text-purple-600 shrink-0" />
                <div className="truncate">
                  <div className="font-bold text-slate-800">14% Community</div>
                  <div className="text-[10px] text-slate-500">Public Halls & Parks</div>
                </div>
              </div>

              <div className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center gap-2">
                <TrendingUp size={16} className="text-slate-600 shrink-0" />
                <div className="truncate">
                  <div className="font-bold text-slate-800">8% Roads</div>
                  <div className="text-[10px] text-slate-500">Concrete CC Drains</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Projects List for Citizens */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-slate-900">{UI_TEXT.recentWorks}</h2>
            <p className="text-xs text-slate-500">Open Public Records • Verified via PFMS & Bhuvan</p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by work or agency..."
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProjects.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs space-y-3 hover:border-slate-300 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="text-xs font-bold text-slate-900 truncate">{p.title}</h3>
                  <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1 truncate">
                    <MapPin size={12} className="text-blue-600 shrink-0" />
                    <span className="truncate">{p.districtName}, {p.stateName}</span>
                  </div>
                </div>
                <StatusBadge status={p.status} />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs p-2 rounded-lg bg-slate-50 border border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400">Sanctioned</span>
                  <div className="font-bold text-slate-800 mt-0.5">
                    ₹{(p.sanctionedAmount / 1e7).toFixed(2)} Cr
                  </div>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400">Executing Agency</span>
                  <div className="font-bold text-slate-800 truncate mt-0.5">{p.agencyName}</div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-100">
                <span className="text-slate-400">ID: {p.id}</span>
                <div className="flex items-center gap-3">
                  {onSelectProject && (
                    <button
                      onClick={() => onSelectProject(p)}
                      className="text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <FileText size={12} />
                      <span>Inspect Dossier</span>
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setComplaintProject(p.title);
                      setCitizenActionTab('grievance');
                      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                    }}
                    className="text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Camera size={12} />
                    <span>Verify on Ground →</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Citizen Action & Social Accountability Hub */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-200 flex items-center justify-center font-bold">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                Citizen Social Accountability &amp; RTI Gateway
              </h2>
              <p className="text-xs text-slate-500">
                Lodge ground observations, track dockets via WhatsApp/SMS, or generate statutory RTI Section 6(1) petitions.
              </p>
            </div>
          </div>

          {/* Action Tabs Selector */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setCitizenActionTab('grievance')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                citizenActionTab === 'grievance'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Field Observation
            </button>
            <button
              onClick={() => setCitizenActionTab('social_audit')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                citizenActionTab === 'social_audit'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Star size={13} className="text-amber-500 fill-amber-500" />
              <span>Social Audit Form</span>
            </button>
            <button
              onClick={() => setCitizenActionTab('track_sms')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                citizenActionTab === 'track_sms'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MessageCircle size={13} className="text-emerald-600" />
              <span>SMS / WhatsApp Tracker</span>
            </button>
            <button
              onClick={() => setCitizenActionTab('rti_generator')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                citizenActionTab === 'rti_generator'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText size={13} className="text-blue-600" />
              <span>Auto-RTI Generator</span>
            </button>
            <button
              onClick={() => setCitizenActionTab('audit_dossier')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                citizenActionTab === 'audit_dossier'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Download size={13} className="text-indigo-600" />
              <span>Audit Dossier (PDF)</span>
            </button>
          </div>
        </div>

        {/* TAB 1: FIELD GRIEVANCE OBSERVATION */}
        {citizenActionTab === 'grievance' && (
          <div className="space-y-4">
            {submittedSuccess && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs rounded-xl space-y-1">
                <div className="flex items-center gap-2 font-bold text-emerald-800">
                  <CheckCircle2 size={18} className="text-emerald-600" />
                  <span>Grievance Docket Registered: {lastGeneratedDocket}</span>
                </div>
                <p className="text-emerald-700 leading-relaxed">
                  Your field observation and verification metadata have been encrypted and submitted to the District Collectorate and MoSPI Sentinel Vigilance audit channel. You can track this reference number anytime.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmitGrievance} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Project / Work Name</label>
                  <input
                    type="text"
                    value={complaintProject}
                    onChange={(e) => setComplaintProject(e.target.value)}
                    placeholder="e.g. Village Drinking Water RO Plant, Main Road"
                    className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700">District Location</label>
                  <select
                    value={complaintDistrict}
                    onChange={(e) => setComplaintDistrict(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="Bengaluru Urban">Bengaluru Urban, Karnataka</option>
                    <option value="Varanasi">Varanasi, Uttar Pradesh</option>
                    <option value="Patna">Patna, Bihar</option>
                    <option value="Pune">Pune, Maharashtra</option>
                    <option value="Ernakulam">Ernakulam, Kerala</option>
                    <option value="New Delhi">New Delhi, Delhi</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700">
                  Detailed Ground Observation / Discrepancy Description
                </label>
                <textarea
                  required
                  rows={3}
                  value={complaintText}
                  onChange={(e) => setComplaintText(e.target.value)}
                  placeholder="Describe the condition on ground (e.g., Work shown 100% finished on portal, but physical structure has no water connection or boundary wall)..."
                  className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Ground Truth Photo Upload with simulated Geo-Tag */}
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-700 flex items-center justify-between">
                  <span>{UI_TEXT.photoLabel}</span>
                  <span className="text-[10px] text-slate-400 font-mono">Geo-tag: {geoTaggedCoords}</span>
                </label>
                <div className="flex flex-col sm:flex-row items-start gap-3">
                  <label className="flex items-center gap-2 px-4 py-2 border border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors text-slate-600 text-xs">
                    <Camera size={16} className="text-blue-600" />
                    <span>Choose Photo or Take Picture</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoSelect}
                      className="hidden"
                    />
                  </label>

                  {photoPreview ? (
                    <div className="flex items-center gap-2 p-1.5 border border-slate-200 rounded-lg bg-slate-50">
                      <img
                        src={photoPreview}
                        alt="Preview"
                        className="w-12 h-12 object-cover rounded"
                      />
                      <div className="text-[11px] text-slate-600 pr-2">
                        <div className="font-semibold text-slate-800">Photo Attached</div>
                        <div className="text-slate-400 font-mono text-[10px]">Timestamp &amp; GPS Tagged</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPhotoPreview(null)}
                        className="text-slate-400 hover:text-slate-700 text-xs px-1"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <span className="text-[11px] text-slate-400 self-center">
                      Attach geo-tagged ground images to strengthen audit verification.
                    </span>
                  )}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="py-2.5 px-6 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold flex items-center gap-2 transition-colors shadow-xs"
                >
                  <Send size={14} />
                  <span>{UI_TEXT.submitBtn}</span>
                </button>
              </div>
            </form>

            {/* Existing Tracked Grievances */}
            <div className="pt-4 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-700">Recently Registered Dockets:</h3>
                <span className="text-[10px] text-slate-400">MoSPI Central Registry</span>
              </div>

              {filedComplaints.map((grv) => (
                <div key={grv.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5">
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-slate-900">{grv.projectTitle} ({grv.district})</span>
                    <span className="font-mono text-blue-700 text-[11px] font-bold">{grv.id}</span>
                  </div>
                  <p className="text-slate-600 text-[11px]">{grv.description}</p>
                  <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1 border-t border-slate-200/50">
                    <span>Filed: {grv.date}</span>
                    <div className="flex items-center gap-2">
                      {grv.hasPhoto && (
                        <span className="text-emerald-700 font-medium flex items-center gap-1">
                          <Camera size={10} /> Photo Attached
                        </span>
                      )}
                      <span className="font-bold text-amber-800 px-2 py-0.5 rounded bg-amber-100/70">
                        {grv.status}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setTrackingQuery(grv.id);
                          setActiveTrackedDocket({
                            id: grv.id,
                            projectTitle: `${grv.projectTitle} (${grv.district})`,
                            district: grv.district,
                            date: `${grv.date}, 11:24 AM IST`,
                            status: grv.status,
                            reporter: 'Citizen Field Verification',
                            eta: grv.status.includes('Verified') ? 'Completed & Closed' : 'Within 4 Business Days',
                          });
                          setDocketLookupMessage(`Loaded live audit trail for Docket ${grv.id}`);
                          setCitizenActionTab('track_sms');
                        }}
                        className="px-2 py-0.5 rounded bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] transition-colors cursor-pointer"
                      >
                        Track Docket →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: SMS & WHATSAPP DOCKET TRACKER */}
        {citizenActionTab === 'track_sms' && (
          <div className="space-y-6">
            {/* Search & Lookup Bar */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                  <input
                    type="text"
                    value={trackingQuery}
                    onChange={(e) => setTrackingQuery(e.target.value)}
                    placeholder="Enter Docket ID (e.g. TRK-2026-BLR-0042) or Citizen Mobile..."
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const q = trackingQuery.trim();
                    const found = filedComplaints.find(
                      (c) => c.id.toLowerCase() === q.toLowerCase() || c.projectTitle.toLowerCase().includes(q.toLowerCase())
                    );
                    if (found) {
                      setActiveTrackedDocket({
                        id: found.id,
                        projectTitle: `${found.projectTitle} (${found.district})`,
                        district: found.district,
                        date: `${found.date}, 11:24 AM IST`,
                        status: found.status,
                        reporter: 'Registered Citizen Auditor',
                        eta: found.status.includes('Verified') ? 'Completed & Closed' : 'Within 4 Business Days',
                      });
                      setDocketLookupMessage(`Synced live MoSPI vigilance timeline for docket ${found.id}.`);
                    } else if (q) {
                      setActiveTrackedDocket({
                        id: q.toUpperCase().startsWith('TRK-') ? q.toUpperCase() : `TRK-2026-${q.slice(-4).toUpperCase() || '0099'}`,
                        projectTitle: `MPLADS Field Audit Query (${q})`,
                        district: complaintDistrict || 'Bengaluru Urban',
                        date: 'Today, Live Telemetry Sync',
                        status: 'Under Executive Engineer Review',
                        reporter: `Citizen Mobile (${citizenPhone})`,
                        eta: 'Within 3 Business Days',
                      });
                      setDocketLookupMessage(`Fetched real-time audit timeline for reference "${q}".`);
                    }
                  }}
                  className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-2xs cursor-pointer"
                >
                  <Search size={14} />
                  <span>Fetch Audit Timeline</span>
                </button>
              </div>

              {docketLookupMessage && (
                <div className="px-3 py-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-800 text-xs font-medium flex items-center justify-between">
                  <span>{docketLookupMessage}</span>
                  <button
                    type="button"
                    onClick={() => setDocketLookupMessage(null)}
                    className="text-[10px] font-bold text-blue-600 hover:underline"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* WhatsApp Subscription Gateway */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-200/80 text-xs">
                <div className="flex items-center gap-2 text-slate-700">
                  <MessageCircle size={16} className="text-emerald-600 shrink-0" />
                  <span>Receive instant progress alerts via <strong>WhatsApp &amp; SMS</strong>:</span>
                  <input
                    type="text"
                    value={citizenPhone}
                    onChange={(e) => setCitizenPhone(e.target.value)}
                    className="w-28 px-2 py-1 bg-white border border-slate-300 rounded text-xs font-mono"
                  />
                </div>
                <button
                  onClick={() => setWhatsappSubscribed(!whatsappSubscribed)}
                  className={`px-3 py-1 rounded-lg font-bold text-xs transition-colors ${
                    whatsappSubscribed
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {whatsappSubscribed ? '✓ WhatsApp Alerts Active' : '+ Enable WhatsApp Alerts'}
                </button>
              </div>
            </div>

            {/* Active Docket Detail Card */}
            <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-amber-400 font-bold text-xs">
                      DOCKET: {activeTrackedDocket.id}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {activeTrackedDocket.status}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-white mt-1">
                    {activeTrackedDocket.projectTitle}
                  </h4>
                  <p className="text-xs text-slate-400">
                    Citizen Reporter: {activeTrackedDocket.reporter} • Logged: {activeTrackedDocket.date}
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                    Estimated Resolution
                  </div>
                  <div className="text-xs font-bold text-emerald-400">{activeTrackedDocket.eta}</div>
                </div>
              </div>

              {/* 5-Stage Visual Stepper */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-slate-800/80 border border-emerald-500/40 text-xs space-y-1">
                  <div className="flex items-center justify-between text-emerald-400 font-bold">
                    <span>1. Lodged</span>
                    <CheckCircle2 size={14} />
                  </div>
                  <div className="text-[11px] text-slate-300 font-medium">Digital Timestamp</div>
                  <div className="text-[10px] text-slate-400 font-mono">01-Mar 11:24 AM</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/80 border border-emerald-500/40 text-xs space-y-1">
                  <div className="flex items-center justify-between text-emerald-400 font-bold">
                    <span>2. AI Cross-Check</span>
                    <CheckCircle2 size={14} />
                  </div>
                  <div className="text-[11px] text-slate-300 font-medium">ISRO Optical &amp; PFMS</div>
                  <div className="text-[10px] text-slate-400 font-mono">01-Mar 02:15 PM</div>
                </div>

                <div className="p-3 rounded-xl bg-blue-950/60 border border-blue-400 text-xs space-y-1 ring-2 ring-blue-500/30">
                  <div className="flex items-center justify-between text-blue-400 font-bold">
                    <span>3. Vigilance Notice</span>
                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                  </div>
                  <div className="text-[11px] text-white font-medium">Sent to EE Patna</div>
                  <div className="text-[10px] text-blue-300 font-mono">Notice #VN-884 Issued</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700 text-xs space-y-1 opacity-70">
                  <div className="flex items-center justify-between text-slate-400 font-semibold">
                    <span>4. Physical Site Visit</span>
                    <span className="text-[10px]">Pending</span>
                  </div>
                  <div className="text-[11px] text-slate-400">Scheduled 22-Mar</div>
                  <div className="text-[10px] text-slate-500">AE Geofenced Inspection</div>
                </div>

                <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700 text-xs space-y-1 opacity-70">
                  <div className="flex items-center justify-between text-slate-400 font-semibold">
                    <span>5. Audit Closure</span>
                    <span className="text-[10px]">Pending</span>
                  </div>
                  <div className="text-[11px] text-slate-400">Public Certificate</div>
                  <div className="text-[10px] text-slate-500">Rectification Proof</div>
                </div>
              </div>

              {/* Automated SMS & WhatsApp Notification History */}
              <div className="p-3.5 bg-slate-800/50 rounded-xl border border-slate-700/60 space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Phone size={13} className="text-emerald-400" />
                  <span>Live Automated Dispatch Feed (WhatsApp + SMS Gateway)</span>
                </div>
                <div className="space-y-1 text-xs font-mono">
                  <div className="flex items-start gap-2 text-slate-300">
                    <span className="text-emerald-400 shrink-0">[WhatsApp +91-9845012345]</span>
                    <span>MoSPI Sentinel: Your grievance TRK-2026-BLR-0042 regarding Solar Installation has been forwarded to Executive Engineer Patna. Case file open.</span>
                  </div>
                  <div className="flex items-start gap-2 text-slate-400">
                    <span className="text-blue-400 shrink-0">[SMS GOVTIN]</span>
                    <span>Sentinel Alert: Satellite comparison confirms rooftop inverter mismatch. Site engineer visit scheduled for 22-03-2026.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: AUTO-RTI SECTION 6(1) DRAFT GENERATOR */}
        {citizenActionTab === 'rti_generator' && (
          <div className="space-y-6">
            <div className="p-4 bg-blue-50/70 rounded-xl border border-blue-200 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-blue-900">
                <FileText size={16} className="text-blue-700" />
                <span>Statutory Right to Information (RTI) Drafting Tool — Section 6(1), RTI Act 2005</span>
              </div>
              <p className="text-blue-800 leading-relaxed">
                Empower your inquiry with a legally binding information request. This module auto-populates statutory questions targeting the administrative sanction, measurement book entries, geo-tagged completion records, and contractor payment ledgers.
              </p>
            </div>

            {/* Inputs Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Select Project to Inquire Under RTI</label>
                <select
                  value={rtiProjectTitle}
                  onChange={(e) => {
                    setRtiProjectTitle(e.target.value);
                    setRtiGenerated(true);
                  }}
                  className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {SEED_PROJECTS.map((p) => (
                    <option key={p.id} value={p.title}>
                      [{p.id}] {p.title} ({p.districtName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Applicant Full Name</label>
                <input
                  type="text"
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-800 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="font-semibold text-slate-700">Applicant Postal Address (For Official Dispatch)</label>
                <input
                  type="text"
                  value={applicantAddress}
                  onChange={(e) => setApplicantAddress(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-800 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            {/* Generated Official RTI Application Letterhead */}
            <div className="p-6 bg-white rounded-xl border border-slate-300 shadow-sm text-xs font-serif space-y-4 relative">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3 font-sans">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs uppercase tracking-wider text-slate-700">
                    Form A — Application for Seeking Information under RTI Act, 2005
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const rtiText = `APPLICATION FOR INFORMATION UNDER SECTION 6(1) OF THE RIGHT TO INFORMATION ACT, 2005\n\nTo:\nThe Central Public Information Officer (CPIO) / District Collectorate\n\nApplicant: ${applicantName}\nAddress: ${applicantAddress}\n\nSubject: Information regarding MPLADS Project "${rtiProjectTitle}"\n\nQuestions:\n1. Certified copy of Administrative Sanction and Financial Sanction orders.\n2. Certified copy of Measurement Book (MB) recordings and Running Account bills.\n3. Detailed ledger of PFMS transaction UTR numbers and payment vouchers.\n4. Name and designation of the Inspecting Officer who verified physical completion.\n5. Certified copy of geo-tagged inspection photos and quality lab test reports.\n\nFee: ₹10 Indian Postal Order attached.`;
                      if (navigator.clipboard?.writeText) {
                        navigator.clipboard.writeText(rtiText).catch(() => {});
                      }
                      setCopiedRti(true);
                      setTimeout(() => setCopiedRti(false), 2500);
                    }}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-800 font-sans font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Copy size={13} />
                    <span>{copiedRti ? '✓ Copied to Clipboard' : 'Copy Application'}</span>
                  </button>
                  <button
                    onClick={() => {
                      openPrintPreview({
                        title: 'FORM A — APPLICATION FOR INFORMATION UNDER SECTION 6(1), RTI ACT 2005',
                        subtitle: 'Addressed to: Central Public Information Officer (CPIO) / District Collectorate (MPLADS Nodal Division)',
                        referenceId: `RTI-SEC6-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
                        badgeText: 'STATUTORY RTI FORM A',
                        fileNamePrefix: 'MPLADS_RTI_Section6_Application',
                        metadataRows: [
                          ['1. Full Name of Applicant', applicantName],
                          ['2. Postal Address', applicantAddress],
                          ['3. Contact Details', `${applicantPhone} | ${applicantEmail}`],
                          ['4. Target MPLADS Work', rtiProjectTitle],
                          ['5. Statutory Period', 'Within 30 days under Section 7(1) of the RTI Act, 2005'],
                          ['6. Application Fee', 'INR 10/- remitted via Indian Postal Order / Online Gateway Receipt'],
                        ],
                        sections: [
                          {
                            heading: 'Particulars of Certified Information Sought Under Section 6(1)',
                            paragraphs: [
                              '1. Certified true copy of the original Administrative Sanction (AS) and Financial Sanction (FS) issued for this project.',
                              '2. Certified true copies of all Measurement Book (MB) entries recorded by the Junior Engineer (JE) and approved by the Executive Engineer (EE).',
                              '3. Complete list of all payments made to the contractor/implementing agency with PFMS UTR transaction numbers, dates, and amounts.',
                              '4. Certified copies of the Stage-3 Physical Completion Certificate, along with high-resolution date/time geo-tagged inspection photographs.',
                              '5. Certified copy of the Quality Assurance & Material Testing Laboratory Report (concrete compressive strength, bitumen density).',
                            ],
                          },
                        ],
                      });
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-sans font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                  >
                    <Printer size={13} />
                    <span>Print / Save PDF</span>
                  </button>
                </div>
              </div>

              {/* Letterhead Body */}
              <div className="space-y-3 leading-relaxed text-slate-900">
                <div className="font-sans font-bold text-sm text-center tracking-wide text-slate-900 uppercase">
                  Application for Information Under Section 6(1) of the Right to Information Act, 2005
                </div>

                <div className="pt-2">
                  <strong>To:</strong><br />
                  The Public Information Officer (PIO) / Assistant PIO,<br />
                  Office of the District Magistrate &amp; Collector (MPLADS Nodal Division),<br />
                  Collectorate Office.
                </div>

                <div>
                  <strong>1. Full Name of Applicant:</strong> {applicantName}<br />
                  <strong>2. Address for Correspondence:</strong> {applicantAddress}<br />
                  <strong>3. Contact Number:</strong> {applicantPhone} | <strong>Email:</strong> {applicantEmail}
                </div>

                <div>
                  <strong>4. Particulars of Information Required:</strong><br />
                  <strong>(a) Subject:</strong> Certified records and financial expenditures regarding MPLADS work: <u>{rtiProjectTitle}</u>.<br />
                  <strong>(b) Specific Information Sought:</strong>
                  <ol className="list-decimal pl-6 space-y-1.5 pt-1">
                    <li>Certified true copy of the original <strong>Administrative Sanction (AS)</strong> and <strong>Financial Sanction (FS)</strong> issued for this project.</li>
                    <li>Certified true copies of all <strong>Measurement Book (MB)</strong> entries recorded by the Junior Engineer (JE) and approved by the Executive Engineer (EE).</li>
                    <li>Complete list of all payments made to the contractor/implementing agency with <strong>PFMS UTR transaction numbers</strong>, dates, and amounts.</li>
                    <li>Certified copies of the <strong>Stage-3 Physical Completion Certificate</strong>, along with high-resolution date/time geo-tagged inspection photographs.</li>
                    <li>Certified copy of the <strong>Quality Assurance &amp; Material Testing Laboratory Report</strong> (e.g. concrete compressive strength, bitumen density).</li>
                  </ol>
                </div>

                <div>
                  <strong>5. Statutory Period:</strong> The information is respectfully requested within 30 days as mandated under Section 7(1) of the RTI Act, 2005.
                </div>

                <div>
                  <strong>6. Application Fee:</strong> Statutory fee of ₹10/- has been remitted via Indian Postal Order / Court Fee Stamp / Online Gateway receipt.
                </div>

                <div className="pt-4 flex justify-between font-sans text-xs text-slate-500">
                  <div>Date: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</div>
                  <div className="text-right">
                    <strong>({applicantName})</strong><br />
                    Signature of Citizen Applicant
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
              <span>Ready to submit online? Citizens can also paste this text directly into the National RTI Portal:</span>
              <a
                href="https://rtionline.gov.in"
                target="_blank"
                rel="noreferrer"
                className="font-bold text-blue-700 hover:underline flex items-center gap-1 shrink-0"
              >
                <span>rtionline.gov.in</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>
        )}

        {/* TAB 4: CITIZEN SOCIAL AUDIT FORM (Phase 13) */}
        {citizenActionTab === 'social_audit' && (
          <div className="space-y-6">
            <div className="p-4 bg-amber-50/70 rounded-xl border border-amber-200 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-950">
                <Star size={16} className="text-amber-600 fill-amber-600" />
                <span>Statutory Citizen Social Audit &amp; Community Feedback Mechanism</span>
              </div>
              <p className="text-amber-800 leading-relaxed">
                Under MoSPI Social Audit Guidelines §14, beneficiaries and local gram panchayats have the right to audit public assets. Your objective ratings and notes are aggregated directly into the district vigilance scorecard.
              </p>
            </div>

            {socialAuditSubmitted && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                  <div>
                    <div className="font-bold">Social Audit Entry Successfully Recorded!</div>
                    <div className="text-emerald-700 text-[11px]">
                      Your score has been registered in the permanent public social audit ledger.
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSocialAuditSubmitted(false)}
                  className="text-xs text-emerald-800 font-bold underline"
                >
                  Log Another Audit
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Left Column: Form */}
              <div className="md:col-span-7 space-y-4">
                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-4 text-xs">
                  <h3 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                    Submit Ground Evaluation
                  </h3>

                  <div>
                    <label className="font-semibold text-slate-700">Work Under Audit:</label>
                    <select
                      value={socialAuditProject}
                      onChange={(e) => setSocialAuditProject(e.target.value)}
                      className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-800 focus:bg-white text-xs"
                    >
                      {SEED_PROJECTS.map((p) => (
                        <option key={p.id} value={p.id}>
                          [{p.id}] {p.title} ({p.districtName})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700">Your Capacity / Affiliation:</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
                      {(['Resident', 'Gram Panchayat', 'Youth', 'Social Auditor'] as const).map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setCitizenCategory(cat)}
                          className={`p-2 rounded-lg border text-center font-medium transition-all ${
                            citizenCategory === cat
                              ? 'border-blue-600 bg-blue-50 text-blue-800 font-bold'
                              : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 4 Interactive Star Rating Dimensions */}
                  <div className="space-y-3 pt-2 border-t border-slate-100">
                    <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
                      Audit Scoring Matrix (1 to 5 Stars):
                    </span>

                    {[
                      { key: 'quality', label: '1. Material & Civil Construction Quality' },
                      { key: 'utility', label: '2. Real Community Benefit & Usability' },
                      { key: 'timeliness', label: '3. Timeliness of Completion' },
                      { key: 'maintenance', label: '4. Ongoing Maintenance & Cleanliness' },
                    ].map(({ key, label }) => (
                      <div key={key} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                        <span className="text-slate-700 font-medium">{label}</span>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() =>
                                setRatings((prev) => ({ ...prev, [key]: star }))
                              }
                              className="p-1 hover:scale-110 transition-transform"
                            >
                              <Star
                                size={16}
                                className={
                                  star <= (ratings as any)[key]
                                    ? 'text-amber-500 fill-amber-500'
                                    : 'text-slate-300'
                                }
                              />
                            </button>
                          ))}
                          <span className="w-5 text-right font-bold text-slate-700 font-mono text-xs">
                            {(ratings as any)[key]}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700">Detailed Feedback / Community Observations:</label>
                    <textarea
                      rows={3}
                      value={auditFeedback}
                      onChange={(e) => setAuditFeedback(e.target.value)}
                      placeholder="e.g. Has the asset solved the local drinking water shortage? Is it open to all communities without bias? Any visible structural cracks or unfinished electrical works?"
                      className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-800 focus:bg-white text-xs"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const avg = (
                        (ratings.quality + ratings.utility + ratings.timeliness + ratings.maintenance) /
                        4
                      ).toFixed(1);
                      const proj = SEED_PROJECTS.find((p) => p.id === socialAuditProject);
                      const newEntry = {
                        id: `SA-2026-${Math.floor(100 + Math.random() * 900)}`,
                        projectTitle: proj ? proj.title : 'Community Asset',
                        auditor: `Citizen Reviewer (${citizenCategory})`,
                        overallScore: parseFloat(avg),
                        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
                        comment: auditFeedback || 'High satisfaction with asset construction and public accessibility.',
                        verified: true,
                      };
                      setSocialAuditsHistory((prev) => [newEntry, ...prev]);
                      setSocialAuditSubmitted(true);
                      setAuditFeedback('');
                    }}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-2xs"
                  >
                    <CheckCircle2 size={15} />
                    <span>Publish Social Audit to Public Ledger</span>
                  </button>
                </div>
              </div>

              {/* Right Column: Historical Social Audits */}
              <div className="md:col-span-5 space-y-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <Users size={14} className="text-blue-600" />
                      <span>Verified Citizen Audits</span>
                    </h3>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                      Open Social Accountability
                    </span>
                  </div>

                  <div className="space-y-3">
                    {socialAuditsHistory.map((item) => (
                      <div key={item.id} className="p-3 bg-white rounded-lg border border-slate-200 text-xs space-y-1.5 shadow-2xs">
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-bold text-slate-900 line-clamp-1">{item.projectTitle}</span>
                          <div className="flex items-center gap-1 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 shrink-0">
                            <Star size={11} className="text-amber-500 fill-amber-500" />
                            <span className="font-bold text-amber-900 font-mono text-[10px]">{item.overallScore}</span>
                          </div>
                        </div>
                        <p className="text-slate-600 text-[11px] leading-relaxed italic">
                          "{item.comment}"
                        </p>
                        <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                          <span>{item.auditor}</span>
                          <span>{item.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: AUDIT DOSSIER PDF EXPORT (Phase 13) */}
        {citizenActionTab === 'audit_dossier' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="space-y-0.5">
                <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  Official Public Audit Dossier Generator
                </h3>
                <p className="text-[11px] text-slate-500">
                  Generate Comptroller-ready, exportable PDF audit dossiers combining satellite ground truth, GFR Form 12-C certificates, and contractor expenditure trails.
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  onClick={() => {
                    const proj = SEED_PROJECTS.find((p) => p.id === dossierProjectId) || SEED_PROJECTS[0];
                    const sanctionedInLakhs = ((proj.sanctionedAmount || 0) / 100000).toFixed(1);
                    const releasedInLakhs = (((proj as any).utilizedAmount || proj.releasedAmount || 0) / 100000).toFixed(1);
                    openPrintPreview({
                      title: 'MPLADS COMPREHENSIVE VIGILANCE & SOCIAL AUDIT DOSSIER',
                      subtitle: `Government of India • MoSPI Vigilance Division • ${proj.districtName}, ${proj.stateName}`,
                      referenceId: `AUD-DOS-2026-${proj.id}`,
                      badgeText: 'PUBLIC AUDIT DOSSIER',
                      fileNamePrefix: `MPLADS_Public_Audit_Dossier_${proj.id}`,
                      kpiCards: [
                        { label: 'Sanctioned Allocation', value: `INR ${sanctionedInLakhs} Lakhs`, sub: 'Approved Outlay' },
                        { label: 'PFMS Released to Date', value: `INR ${releasedInLakhs} Lakhs`, sub: 'GFR 12-C Verified' },
                        { label: 'Physical Status', value: proj.status.replace(/_/g, ' ').toUpperCase(), sub: 'ISRO Geo-Lock Matched' },
                        { label: 'Social Audit Rating', value: '4.8 / 5.0', sub: '42 Citizen Reviews' },
                      ],
                      metadataRows: [
                        ['Project Name', proj.title],
                        ['Project ID', proj.id],
                        ['Constituency / District', `${proj.constituencyName} (${proj.districtName}, ${proj.stateName})`],
                        ['Executing Agency', proj.agencyName],
                        ['Awarded Contractor', proj.vendorName],
                        ['GPS Coordinates', `${proj.location.lat.toFixed(4)}° N, ${proj.location.lng.toFixed(4)}° E`],
                      ],
                      sections: [
                        {
                          heading: '1. Financial Sanction & GFR 12-C Utilization Status',
                          paragraphs: [
                            `Sanctioned Allocation: INR ${sanctionedInLakhs} Lakhs | PFMS Released to Date: INR ${releasedInLakhs} Lakhs | GFR 12-C UC Verification: Audit Verified & Signed.`,
                          ],
                        },
                        {
                          heading: '2. Remote Sensing Earth Observation & Optical Audit',
                          paragraphs: [
                            '• ISRO Cartosat-3 Optical Verification: 100% Geometry Matched',
                            '• Sentinel-2 NDVI / Structural Density Delta: +42.8% Physical Delta (Valid)',
                            '• Ground Geofence Radius Verification: Inside 50m Parameter (Verified)',
                          ],
                        },
                        {
                          heading: '3. Public Social Audit & Citizen Beneficiary Rating',
                          paragraphs: [
                            'Community Social Audit Score: 4.8 / 5.0 based on 42 verified beneficiary feedback dockets recorded in the gram panchayat.',
                          ],
                        },
                      ],
                    });
                  }}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                >
                  <Printer size={13} />
                  <span>{isExportingPdf ? 'Preparing Dossier...' : 'Print / Export PDF'}</span>
                </button>
              </div>
            </div>

            {/* Dossier Project Selector */}
            <div className="flex items-center gap-3 text-xs bg-white p-3 rounded-xl border border-slate-200">
              <label className="font-bold text-slate-700 shrink-0">Select Target Project:</label>
              <select
                value={dossierProjectId}
                onChange={(e) => setDossierProjectId(e.target.value)}
                className="w-full text-xs font-semibold p-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none"
              >
                {SEED_PROJECTS.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.id}] {p.title} — {p.districtName}, {p.stateName}
                  </option>
                ))}
              </select>
            </div>

            {/* Render Printable / Exportable Official Audit Dossier */}
            {(() => {
              const proj = SEED_PROJECTS.find((p) => p.id === dossierProjectId) || SEED_PROJECTS[0];
              const sanctionedInLakhs = ((proj.sanctionedAmount || 0) / 100000).toFixed(1);
              const releasedInLakhs = (((proj as any).utilizedAmount || proj.releasedAmount || 0) / 100000).toFixed(1);

              return (
                <div className="bg-white rounded-2xl border-2 border-slate-300 p-6 sm:p-8 space-y-6 shadow-sm text-slate-900 font-sans print:border-none print:shadow-none">
                  {/* Dossier Official Header */}
                  <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xl">
                        🇮🇳
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-bold tracking-widest text-slate-500">
                          Government of India • MoSPI Vigilance Division
                        </div>
                        <h2 className="text-base sm:text-lg font-black tracking-tight text-slate-900">
                          MPLADS Comprehensive Vigilance &amp; Social Audit Dossier
                        </h2>
                        <div className="text-[11px] text-slate-500 font-mono">
                          Statutory Docket: AUD-DOS-2026-{proj.id} • GFR Rule 238(1)
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-right">
                      <div className="space-y-0.5">
                        <div className="text-[10px] text-slate-400 uppercase font-mono">ISRO Bhuvan Sync</div>
                        <div className="text-xs font-bold text-emerald-600">Geo-Lock Matched</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {proj.location.lat.toFixed(4)}° N, {proj.location.lng.toFixed(4)}° E
                        </div>
                      </div>
                      <div className="p-2 border border-slate-300 rounded-lg bg-slate-50">
                        <QrCode size={36} className="text-slate-800" />
                      </div>
                    </div>
                  </div>

                  {/* Metadata Matrix */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-slate-500 uppercase font-bold">Project Name</span>
                      <div className="font-bold text-slate-900 mt-1 truncate" title={proj.title}>{proj.title}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-slate-500 uppercase font-bold">Constituency / District</span>
                      <div className="font-bold text-slate-900 mt-1">{proj.districtName}, {proj.stateName}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-slate-500 uppercase font-bold">Executing Agency</span>
                      <div className="font-bold text-slate-900 mt-1 truncate">{proj.agencyName}</div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] text-slate-500 uppercase font-bold">Physical Audit Status</span>
                      <div className="font-bold text-emerald-700 mt-1 uppercase text-[11px]">{proj.status.replace(/_/g, ' ')}</div>
                    </div>
                  </div>

                  {/* Section 1: Financial & GFR 12-C Trail */}
                  <div className="space-y-2 text-xs">
                    <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <FileCheck size={14} className="text-blue-600" />
                      <span>1. Financial Sanction &amp; GFR 12-C Utilization Status</span>
                    </h4>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <span className="text-[10px] text-slate-500">Sanctioned Allocation:</span>
                        <div className="font-bold text-slate-900 text-sm">₹{sanctionedInLakhs} Lakhs</div>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500">PFMS Released to Date:</span>
                        <div className="font-bold text-slate-900 text-sm">₹{releasedInLakhs} Lakhs</div>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500">GFR 12-C UC Verification:</span>
                        <div className="font-bold text-emerald-700 text-sm flex items-center gap-1">
                          <CheckCircle2 size={13} />
                          <span>Audit Verified &amp; Signed</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: Satellite Earth Observation Audit */}
                  <div className="space-y-2 text-xs">
                    <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <Globe size={14} className="text-indigo-600" />
                      <span>2. Remote Sensing Earth Observation &amp; Optical Audit</span>
                    </h4>
                    <div className="p-3.5 rounded-xl bg-slate-900 text-slate-200 font-mono text-[11px] space-y-1.5">
                      <div className="flex justify-between text-slate-400">
                        <span>ISRO Cartosat-3 Optical Verification:</span>
                        <span className="text-emerald-400 font-bold">100% Geometry Matched</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Sentinel-2 NDVI / Structural Density Delta:</span>
                        <span className="text-emerald-400 font-bold">+42.8% Physical Delta (Valid)</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                        <span>Ground Geofence Radius Verification:</span>
                        <span className="text-emerald-400 font-bold">Inside 50m Parameter (Verified)</span>
                      </div>
                    </div>
                  </div>

                  {/* Section 3: Social Audit & Community Satisfaction */}
                  <div className="space-y-2 text-xs">
                    <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <Star size={14} className="text-amber-500 fill-amber-500" />
                      <span>3. Public Social Audit &amp; Citizen Beneficiary Rating</span>
                    </h4>
                    <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="font-bold text-slate-900">Community Social Audit Score: 4.8 / 5.0</div>
                        <div className="text-[11px] text-slate-600">
                          Based on 42 verified beneficiary feedback dockets recorded in the gram panchayat.
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-amber-500">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} size={16} className="fill-amber-500" />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Statutory Attestation Footer */}
                  <div className="border-t border-slate-200 pt-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-[11px] text-slate-500 font-mono">
                    <div>
                      Cryptographic Seal: SHA256:4a8b7c6d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b
                    </div>
                    <div className="text-slate-700 font-bold">
                      Certified by MoSPI Sentinel Platform §14
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
};
