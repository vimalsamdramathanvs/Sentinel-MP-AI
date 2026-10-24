import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar, NavTabId } from './components/Sidebar';
import { ProjectDetailDrawer } from './components/ProjectDetailDrawer';
import { CommandPalette } from './components/CommandPalette';
import { BhashiniVoiceModal } from './components/BhashiniVoiceModal';
import { DishaReviewModal } from './components/DishaReviewModal';
import { GfrComplianceModal } from './components/GfrComplianceModal';
import { PrintPreviewModal } from './components/PrintPreviewModal';
import { ErrorBoundary } from './components/ErrorBoundary';
import { openPrintPreview, buildActiveViewPrintPayload } from './utils/printService';
import { ProjectItem } from './types';
import { SEED_PROJECTS } from './data/seedProjects';
import { INITIAL_ALERTS } from './data/alertsEngine';

// Views
import { DashboardView } from './views/DashboardView';
import { ProjectsView } from './views/ProjectsView';
import { GisMapView } from './views/GisMapView';
import { FraudCenterView } from './views/FraudCenterView';
import { RiskCenterView } from './views/RiskCenterView';
import { AnalyticsView } from './views/AnalyticsView';
import { SatelliteView } from './views/SatelliteView';
import { DocumentAiView } from './views/DocumentAiView';
import { AlertsHubView } from './views/AlertsHubView';
import { ReportsView } from './views/ReportsView';
import { CopilotChatView } from './views/CopilotChatView';
import { MpLedgerView } from './views/MpLedgerView';
import { PublicPortalView } from './views/PublicPortalView';
import { AdminConfigView } from './views/AdminConfigView';

function AppContent() {
  const [activeTab, setActiveTab] = useState<NavTabId>(() => {
    try {
      if (typeof window !== 'undefined') {
        const p = new URLSearchParams(window.location.search).get('tab') as NavTabId | null;
        if (p) return p;
      }
    } catch (_) {}
    return 'dashboard';
  });
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);
  const [isDossierOpen, setIsDossierOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isVoiceCopilotOpen, setIsVoiceCopilotOpen] = useState(false);
  const [isDishaOpen, setIsDishaOpen] = useState(false);
  const [isGfrOpen, setIsGfrOpen] = useState(false);

  // Synchronize project selection without corrupting Cloud Run proxy query strings
  const handleSelectProject = (project: ProjectItem | null, openDossier = false) => {
    setSelectedProject(project);
    setIsDossierOpen(openDossier);
  };

  const handleTabChange = (newTab: NavTabId) => {
    setActiveTab(newTab);
  };

  // Parse URL on initial mount (supporting direct links, redirects, bookmarks)
  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab') as NavTabId | null;
      const projectParam = params.get('project') || params.get('projectId');
      const dossierParam = params.get('dossier') === 'true' || params.get('audit') === 'true';

      const validTabs: NavTabId[] = [
        'dashboard',
        'projects',
        'gis',
        'fraud',
        'risk',
        'analytics',
        'satellite',
        'documents',
        'alerts',
        'reports',
        'copilot',
        'mpledger',
        'public',
        'admin',
      ];

      if (tabParam && validTabs.includes(tabParam)) {
        setActiveTab(tabParam);
      } else if (!tabParam && !projectParam) {
        setActiveTab('dashboard');
      }

      if (projectParam) {
        let customProjects: ProjectItem[] = [];
        try {
          const saved = localStorage.getItem('mplads_custom_projects');
          if (saved) customProjects = JSON.parse(saved);
        } catch (_) {}

        const allProjects = [...customProjects, ...SEED_PROJECTS];
        const found = allProjects.find(
          (p) => p.id.toLowerCase() === projectParam.toLowerCase().trim()
        );
        if (found) {
          setSelectedProject(found);
          setIsDossierOpen(dossierParam);
        }
      }
    } catch (err) {
      console.warn('URL param parse error:', err);
    }
  }, []);

  // Sync browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      try {
        if (typeof window === 'undefined') return;
        const params = new URLSearchParams(window.location.search);
        const tabParam = params.get('tab') as NavTabId | null;
        const projectParam = params.get('project') || params.get('projectId');
        const dossierParam = params.get('dossier') === 'true' || params.get('audit') === 'true';

        if (tabParam) {
          setActiveTab(tabParam);
        }

        if (projectParam) {
          let customProjects: ProjectItem[] = [];
          try {
            const saved = localStorage.getItem('mplads_custom_projects');
            if (saved) customProjects = JSON.parse(saved);
          } catch (_) {}

          const allProjects = [...customProjects, ...SEED_PROJECTS];
          const found = allProjects.find(
            (p) => p.id.toLowerCase() === projectParam.toLowerCase().trim()
          );
          setSelectedProject(found || null);
          setIsDossierOpen(dossierParam);
        } else {
          setSelectedProject(null);
          setIsDossierOpen(false);
        }
      } catch (_) {}
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Keyboard shortcut for Command Palette (⌘K / Ctrl+K) and Print (⌘P / Ctrl+P)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        openPrintPreview(buildActiveViewPrintPayload(activeTab));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab]);

  const openAlertCount = INITIAL_ALERTS.filter(
    (a) => a.status === 'open' && (a.severity === 'critical' || a.severity === 'high')
  ).length;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      {/* Top Navigation */}
      <Navbar
        onOpenAlerts={() => handleTabChange('alerts')}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenVoiceCopilot={() => setIsVoiceCopilotOpen(true)}
        onNavigateHome={() => handleTabChange('dashboard')}
        onPrintCurrentView={() => openPrintPreview(buildActiveViewPrintPayload(activeTab))}
      />

      {/* Main Body Shell with Sidebar + View Container */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={handleTabChange}
          openAlertCount={openAlertCount}
          onOpenDisha={() => setIsDishaOpen(true)}
          onOpenGfr={() => setIsGfrOpen(true)}
        />

        {/* Center Scrollable Content Area */}
        <main className="flex-1 overflow-y-auto bg-slate-100/60 min-w-0">
          <ErrorBoundary
            fallbackTitle="View Rendering Issue"
            onReset={() => {
              setActiveTab('projects');
              setSelectedProject(null);
            }}
          >
            {activeTab === 'dashboard' && (
              <DashboardView
                onSelectProject={handleSelectProject}
                onNavigate={handleTabChange}
                onOpenDisha={() => setIsDishaOpen(true)}
                onOpenGfr={() => setIsGfrOpen(true)}
              />
            )}

            {activeTab === 'projects' && (
              <ProjectsView onSelectProject={handleSelectProject} />
            )}

            {activeTab === 'gis' && (
              <GisMapView onSelectProject={handleSelectProject} />
            )}

            {activeTab === 'fraud' && (
              <FraudCenterView onSelectProject={handleSelectProject} />
            )}

            {activeTab === 'risk' && <RiskCenterView />}

            {activeTab === 'analytics' && <AnalyticsView />}

            {activeTab === 'satellite' && (
              <SatelliteView onSelectProject={(p) => handleSelectProject(p, true)} />
            )}

            {activeTab === 'documents' && (
              <DocumentAiView onSelectProject={(p) => handleSelectProject(p, true)} />
            )}

            {activeTab === 'alerts' && (
              <AlertsHubView onSelectProject={(p) => handleSelectProject(p, true)} />
            )}

            {activeTab === 'reports' && <ReportsView />}

            {activeTab === 'copilot' && (
              <CopilotChatView
                onNavigate={handleTabChange}
                onSelectProject={handleSelectProject}
              />
            )}

            {activeTab === 'mpledger' && <MpLedgerView />}

            {activeTab === 'public' && (
              <PublicPortalView onSelectProject={(p) => handleSelectProject(p, true)} />
            )}

            {activeTab === 'admin' && <AdminConfigView />}
          </ErrorBoundary>
        </main>
      </div>

      {/* Slide-over Project Detail Drawer protected by ErrorBoundary */}
      <ErrorBoundary
        fallbackTitle="Project Dossier Display Issue"
        onReset={() => {
          setSelectedProject(null);
          setIsDossierOpen(false);
        }}
      >
        <ProjectDetailDrawer
          project={selectedProject}
          onClose={() => handleSelectProject(null, false)}
          onUpdateProject={(updated) => setSelectedProject(updated)}
          initialOpenDossier={isDossierOpen}
        />
      </ErrorBoundary>

      {/* Global ⌘K Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigate={handleTabChange}
        onSelectProject={handleSelectProject}
      />

      {/* Bhashini Indic Voice Copilot Modal */}
      <BhashiniVoiceModal
        isOpen={isVoiceCopilotOpen}
        onClose={() => setIsVoiceCopilotOpen(false)}
        onNavigate={handleTabChange}
      />

      {/* DISHA Monthly Review Executive Pack Modal */}
      <DishaReviewModal
        isOpen={isDishaOpen}
        onClose={() => setIsDishaOpen(false)}
        onSelectProject={(p) => handleSelectProject(p, true)}
      />

      {/* Statutory GFR 2017 & MoSPI Compliance Engine Modal */}
      <GfrComplianceModal
        isOpen={isGfrOpen}
        onClose={() => setIsGfrOpen(false)}
        onSelectProject={(p) => handleSelectProject(p, true)}
      />

      {/* Global A4 Print Preview & Statutory Document Spooler Modal */}
      <PrintPreviewModal />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary fallbackTitle="National Portal System Recovery">
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}
