import React, { useState, useMemo, useEffect } from 'react';
import { SEED_PROJECTS } from '../data/seedProjects';
import { ProjectItem } from '../types';
import { DataTable, Column } from '../components/DataTable';
import { FilterBar, FilterValues } from '../components/FilterBar';
import { RiskBadge } from '../components/RiskBadge';
import { StatusBadge } from '../components/StatusBadge';
import {
  Plus,
  Download,
  FileSpreadsheet,
  Smartphone,
  Eye,
  FileDown,
  AlertTriangle,
  Copy,
  Route,
  Droplet,
  HeartPulse,
  GraduationCap,
  Waves,
  Zap,
  Building2,
  Trophy,
  FolderKanban,
  IndianRupee,
  Clock,
  CheckCircle2,
  X,
  Check,
  ShieldAlert,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { FieldInspectionModal } from '../components/FieldInspectionModal';
import { exportAndDownloadProjectPdf } from '../utils/pdfGenerator';
import { DISTRICTS_DATA, STATES_MAP } from '../data/geography';
import { calculateCompositeRisk } from '../data/riskEngine';

interface ProjectsViewProps {
  onSelectProject: (p: ProjectItem) => void;
}

// Category visual icon and styling helper
function getCategoryVisual(category: string) {
  switch (category) {
    case 'road':
      return {
        icon: <Route size={12} className="text-amber-600 shrink-0" />,
        bg: 'bg-amber-50 text-amber-800 border-amber-200/60',
      };
    case 'water':
      return {
        icon: <Droplet size={12} className="text-cyan-600 shrink-0" />,
        bg: 'bg-cyan-50 text-cyan-800 border-cyan-200/60',
      };
    case 'health':
      return {
        icon: <HeartPulse size={12} className="text-rose-600 shrink-0" />,
        bg: 'bg-rose-50 text-rose-800 border-rose-200/60',
      };
    case 'education':
      return {
        icon: <GraduationCap size={12} className="text-indigo-600 shrink-0" />,
        bg: 'bg-indigo-50 text-indigo-800 border-indigo-200/60',
      };
    case 'drainage':
      return {
        icon: <Waves size={12} className="text-teal-600 shrink-0" />,
        bg: 'bg-teal-50 text-teal-800 border-teal-200/60',
      };
    case 'electricity':
      return {
        icon: <Zap size={12} className="text-yellow-600 shrink-0" />,
        bg: 'bg-yellow-50 text-yellow-800 border-yellow-200/60',
      };
    case 'community_hall':
      return {
        icon: <Building2 size={12} className="text-purple-600 shrink-0" />,
        bg: 'bg-purple-50 text-purple-800 border-purple-200/60',
      };
    case 'sports':
      return {
        icon: <Trophy size={12} className="text-emerald-600 shrink-0" />,
        bg: 'bg-emerald-50 text-emerald-800 border-emerald-200/60',
      };
    default:
      return {
        icon: <Building2 size={12} className="text-slate-600 shrink-0" />,
        bg: 'bg-slate-100 text-slate-700 border-slate-200',
      };
  }
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({ onSelectProject }) => {
  const { hasPermission } = useAuth();
  
  // Persistent list supporting dynamically sanctioned projects
  const [projectsList, setProjectsList] = useState<ProjectItem[]>(() => {
    try {
      const saved = localStorage.getItem('mplads_custom_projects');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return [...parsed, ...SEED_PROJECTS];
        }
      }
    } catch {
      // ignore
    }
    return SEED_PROJECTS;
  });

  const [filters, setFilters] = useState<FilterValues>({
    search: '',
    stateId: null,
    category: null,
    status: null,
    minRisk: null,
  });

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFieldInspectionModal, setShowFieldInspectionModal] = useState(false);
  const [selectedForInspection, setSelectedForInspection] = useState<ProjectItem | null>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  // New project creation state
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('road');
  const [newAmount, setNewAmount] = useState('5000000');
  const [newDistrictName, setNewDistrictName] = useState(DISTRICTS_DATA[0].name);
  const [newAgency, setNewAgency] = useState('Public Works Department (PWD)');

  // Auto-dismiss toast
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  // Comprehensive filter logic covering all fields
  const filteredProjects = useMemo(() => {
    return projectsList.filter((p) => {
      if (filters.search) {
        const q = filters.search.toLowerCase().trim();
        const matches =
          p.title.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q) ||
          p.districtName.toLowerCase().includes(q) ||
          p.stateName.toLowerCase().includes(q) ||
          (p.mpName && p.mpName.toLowerCase().includes(q)) ||
          (p.agencyName && p.agencyName.toLowerCase().includes(q)) ||
          (p.vendorName && p.vendorName.toLowerCase().includes(q)) ||
          (p.constituencyName && p.constituencyName.toLowerCase().includes(q)) ||
          p.category.toLowerCase().includes(q) ||
          p.status.toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (filters.stateId !== null && filters.stateId !== undefined && p.stateId !== filters.stateId) {
        return false;
      }
      if (filters.category && p.category !== filters.category) return false;
      if (filters.status && p.status !== filters.status) return false;
      if (filters.minRisk && p.riskScore.compositeScore < filters.minRisk) return false;
      return true;
    });
  }, [filters, projectsList]);

  // Aggregate metrics
  const totalSanctionedSum = useMemo(() => {
    return filteredProjects.reduce((acc, p) => acc + p.sanctionedAmount, 0);
  }, [filteredProjects]);

  const highRiskCount = useMemo(() => {
    return filteredProjects.filter((p) => p.riskScore.compositeScore >= 70).length;
  }, [filteredProjects]);

  const delayedCount = useMemo(() => {
    return filteredProjects.filter((p) => p.status === 'delayed').length;
  }, [filteredProjects]);

  const completedCount = useMemo(() => {
    return filteredProjects.filter((p) => p.status === 'completed').length;
  }, [filteredProjects]);

  // Columns definition with custom sortValue and rich rendering
  const columns: Column<ProjectItem>[] = [
    {
      key: 'title',
      label: 'Scheme & Execution Agency',
      sortable: true,
      sortValue: (p) => p.title,
      render: (p) => {
        const isDuplicate = p.id.includes('dup-');
        const isFraud = p.riskScore.compositeScore >= 80;
        return (
          <div className="max-w-md py-1 space-y-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold border border-slate-200">
                {p.id}
              </span>
              {isDuplicate && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                  <Copy size={10} /> Duplicate Candidate
                </span>
              )}
              {isFraud && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
                  <AlertTriangle size={10} /> High Anomaly
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelectProject(p);
              }}
              className="text-left font-semibold text-slate-900 line-clamp-1 hover:text-blue-600 hover:underline transition-colors cursor-pointer block w-full"
              title="Click to inspect full project audit dossier & analytics"
            >
              {p.title}
            </button>
            <div className="text-[11px] text-slate-500 line-clamp-1">
              {p.agencyName} • <span className="font-medium text-slate-700">MP:</span> {p.mpName || 'Lok Sabha Member'}
            </div>
          </div>
        );
      },
    },
    {
      key: 'districtName',
      label: 'District / State',
      sortable: true,
      sortValue: (p) => `${p.districtName} ${p.stateName}`,
      render: (p) => (
        <div>
          <div className="font-medium text-slate-800">{p.districtName}</div>
          <div className="text-[10px] text-slate-400">
            {p.stateName} {p.constituencyName ? `• ${p.constituencyName}` : ''}
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      label: 'Category',
      sortable: true,
      sortValue: (p) => p.category,
      render: (p) => {
        const visual = getCategoryVisual(p.category);
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium border capitalize ${visual.bg}`}
          >
            {visual.icon}
            <span>{p.category.replace(/_/g, ' ')}</span>
          </span>
        );
      },
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      sortValue: (p) => p.status,
      render: (p) => <StatusBadge status={p.status} />,
    },
    {
      key: 'sanctionedAmount',
      label: 'Sanctioned',
      sortable: true,
      sortValue: (p) => p.sanctionedAmount,
      align: 'right',
      render: (p) => (
        <div className="font-mono text-slate-900 font-semibold text-xs">
          ₹{(p.sanctionedAmount / 1e7).toFixed(2)} Cr
        </div>
      ),
    },
    {
      key: 'utilizedAmount',
      label: 'Utilized / Progress',
      sortable: true,
      sortValue: (p) => (p.releasedAmount > 0 ? p.utilizedAmount / p.releasedAmount : 0),
      align: 'right',
      render: (p) => {
        const pct = p.releasedAmount > 0 ? Math.round((p.utilizedAmount / p.releasedAmount) * 100) : 0;
        return (
          <div className="font-mono text-[11px] text-right space-y-1">
            <div className="font-medium text-slate-800">
              ₹{(p.utilizedAmount / 1e7).toFixed(2)} Cr
            </div>
            <div className="flex items-center justify-end gap-1.5">
              <div className="w-12 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    pct >= 80 ? 'bg-emerald-500' : pct >= 40 ? 'bg-blue-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${Math.min(100, pct)}%` }}
                />
              </div>
              <span className={`text-[10px] font-bold ${pct < 40 && p.status === 'delayed' ? 'text-rose-600' : 'text-slate-500'}`}>
                {pct}%
              </span>
            </div>
          </div>
        );
      },
    },
    {
      key: 'riskScore',
      label: 'Risk Index',
      sortable: true,
      sortValue: (p) => p.riskScore.compositeScore,
      align: 'right',
      render: (p) => <RiskBadge score={p.riskScore.compositeScore} size="sm" />,
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      align: 'center',
      render: (p) => (
        <div
          className="flex items-center justify-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => onSelectProject(p)}
            title="Inspect GIS Dossier & Full Audit Breakdown"
            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
          >
            <Eye size={14} />
          </button>
          <button
            onClick={() => {
              setSelectedForInspection(p);
              setShowFieldInspectionModal(true);
            }}
            title="Field Geofenced Ground Inspection"
            className="p-1.5 rounded-md hover:bg-blue-50 text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
          >
            <Smartphone size={14} />
          </button>
          <button
            onClick={() => {
              exportAndDownloadProjectPdf(p);
              setToastMessage({
                text: `Exported Audit Inspection Report for ${p.id}`,
                type: 'success',
              });
            }}
            title="Generate Official Audit PDF Report"
            className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-emerald-700 transition-colors cursor-pointer"
          >
            <FileDown size={14} />
          </button>
        </div>
      ),
    },
  ];

  // CSV Export with clean quoting and toast notification
  const handleExportCsv = () => {
    const headers = [
      'Project ID',
      'Title',
      'District',
      'State',
      'Category',
      'Status',
      'Sanctioned Amount (INR)',
      'Released Amount (INR)',
      'Utilized Amount (INR)',
      'Risk Score',
      'Agency',
      'Vendor',
      'MP Name',
    ];
    const rows = filteredProjects.map((p) => [
      `"${p.id}"`,
      `"${p.title.replace(/"/g, '""')}"`,
      `"${p.districtName}"`,
      `"${p.stateName}"`,
      `"${p.category}"`,
      `"${p.status}"`,
      p.sanctionedAmount,
      p.releasedAmount,
      p.utilizedAmount,
      p.riskScore.compositeScore,
      `"${(p.agencyName || '').replace(/"/g, '""')}"`,
      `"${(p.vendorName || '').replace(/"/g, '""')}"`,
      `"${(p.mpName || '').replace(/"/g, '""')}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `MPLADS_Project_Registry_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setToastMessage({
      text: `Exported CSV register containing ${filteredProjects.length} records.`,
      type: 'success',
    });
  };

  // JSON Export for technical audit ingestion
  const handleExportJson = () => {
    const jsonStr = JSON.stringify(filteredProjects, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', url);
    downloadAnchor.setAttribute('download', `MPLADS_Registry_Dossier_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    URL.revokeObjectURL(url);

    setToastMessage({
      text: `Exported complete JSON repository with ${filteredProjects.length} projects.`,
      type: 'success',
    });
  };

  // Real Project Sanction Handler
  const handleSanctionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedDist = DISTRICTS_DATA.find((d) => d.name === newDistrictName) || DISTRICTS_DATA[0];
    const amountNum = Number(newAmount) || 5000000;
    const newId = `proj-sanc-${Date.now().toString().slice(-4)}`;

    const newRisk = calculateCompositeRisk({
      costZScore: 0.1,
      daysOverdue: 0,
      typicalDurationDays: 200,
      utilizationRatio: 0,
      releaseRatio: 0.35,
      maxPaymentRatio: 0.2,
      vendorBlacklisted: false,
    });

    const newProject: ProjectItem = {
      id: newId,
      title: newTitle.trim() || 'New Sanctioned Constituency Infrastructure Work',
      description: `Officially sanctioned constituency development scheme under MPLADS allocation.`,
      constituencyId: 900 + Math.floor(Math.random() * 50),
      constituencyName: `${selectedDist.name} Parliamentary Constituency`,
      districtId: 800 + Math.floor(Math.random() * 50),
      districtName: selectedDist.name,
      stateId: selectedDist.stateId,
      stateName: selectedDist.stateName,
      mpName: 'Hon. Member of Parliament',
      agencyId: 'ag-pwd-01',
      agencyName: newAgency,
      agencyType: 'PWD',
      agencyBlacklisted: false,
      vendorId: 'v-registered-01',
      vendorName: 'State Registered Infrastructure Contractor',
      vendorBlacklisted: false,
      category: newCategory,
      sanctionedAmount: amountNum,
      releasedAmount: Math.round(amountNum * 0.35),
      utilizedAmount: 0,
      status: 'sanctioned',
      sanctionedDate: new Date().toISOString().slice(0, 10),
      expectedCompletion: new Date(Date.now() + 270 * 86400000).toISOString().slice(0, 10),
      location: {
        lat: selectedDist.lat + 0.01,
        lng: selectedDist.lng + 0.01,
      },
      isSeedData: false,
      riskScore: newRisk,
      verifiedStatus: 'unverified',
      lastUpdated: new Date().toISOString(),
    };

    const updated = [newProject, ...projectsList];
    setProjectsList(updated);

    try {
      const customOnly = updated.filter((p) => !p.isSeedData);
      localStorage.setItem('mplads_custom_projects', JSON.stringify(customOnly));
    } catch {
      // ignore
    }

    setShowCreateModal(false);
    setNewTitle('');
    setToastMessage({
      text: `Project ${newId} sanctioned and successfully added to registry!`,
      type: 'success',
    });
  };

  return (
    <div className="p-6 space-y-4">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">MPLADS Project Registry</h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
              Live State Scoped
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Full repository with RLS State Scoping, PostGIS Geometries, and Phase 7 Risk Scoring
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setSelectedForInspection(filteredProjects[0] || projectsList[0] || SEED_PROJECTS[0]);
              setShowFieldInspectionModal(true);
            }}
            className="px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-800 text-xs font-semibold hover:bg-blue-100 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Smartphone size={14} className="text-blue-600" />
            <span>Field Inspection Mode</span>
          </button>

          <button
            onClick={handleExportCsv}
            title="Download CSV Table"
            className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleExportJson}
            title="Export Registry JSON Dossier"
            className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <FileSpreadsheet size={14} className="text-emerald-600" />
            <span>JSON Dossier</span>
          </button>

          {hasPermission('project.write') && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={14} />
              <span>Sanction New Project</span>
            </button>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-900 text-xs flex items-center justify-between shadow-2xs animate-fade-in">
          <div className="flex items-center gap-2">
            <Check size={14} className="text-emerald-600 font-bold shrink-0" />
            <span className="font-medium">{toastMessage.text}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 p-0.5 cursor-pointer"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* Interactive Metric Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div
          onClick={() =>
            setFilters({ search: '', stateId: null, category: null, status: null, minRisk: null })
          }
          className="p-3 bg-white border border-slate-200/90 rounded-xl shadow-2xs hover:border-blue-300 hover:shadow-xs cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-medium">Total Schemes</span>
            <FolderKanban size={14} className="text-blue-500" />
          </div>
          <div className="text-lg font-bold text-slate-900 mt-1 font-mono">
            {projectsList.length}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Showing {filteredProjects.length}</div>
        </div>

        <div className="p-3 bg-white border border-slate-200/90 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-medium">Sanctioned Capital</span>
            <IndianRupee size={14} className="text-indigo-500" />
          </div>
          <div className="text-lg font-bold text-slate-900 mt-1 font-mono">
            ₹{(totalSanctionedSum / 1e7).toFixed(1)} <span className="text-xs font-normal">Cr</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Filtered allocation</div>
        </div>

        <div
          onClick={() => setFilters({ ...filters, minRisk: 70, status: null })}
          className={`p-3 bg-white border rounded-xl shadow-2xs cursor-pointer transition-all ${
            filters.minRisk === 70
              ? 'border-rose-400 bg-rose-50/40 ring-1 ring-rose-400'
              : 'border-slate-200/90 hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-medium text-rose-700">High / Critical Risk</span>
            <ShieldAlert size={14} className="text-rose-500" />
          </div>
          <div className="text-lg font-bold text-rose-700 mt-1 font-mono">
            {highRiskCount}
          </div>
          <div className="text-[10px] text-rose-500/80 mt-0.5">Score ≥ 70</div>
        </div>

        <div
          onClick={() => setFilters({ ...filters, status: 'delayed', minRisk: null })}
          className={`p-3 bg-white border rounded-xl shadow-2xs cursor-pointer transition-all ${
            filters.status === 'delayed'
              ? 'border-amber-400 bg-amber-50/40 ring-1 ring-amber-400'
              : 'border-slate-200/90 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-medium text-amber-700">Delayed Schemes</span>
            <Clock size={14} className="text-amber-500" />
          </div>
          <div className="text-lg font-bold text-amber-700 mt-1 font-mono">
            {delayedCount}
          </div>
          <div className="text-[10px] text-amber-500/80 mt-0.5">Behind schedule</div>
        </div>

        <div
          onClick={() => setFilters({ ...filters, status: 'completed', minRisk: null })}
          className={`p-3 bg-white border rounded-xl shadow-2xs cursor-pointer transition-all col-span-2 sm:col-span-1 ${
            filters.status === 'completed'
              ? 'border-emerald-400 bg-emerald-50/40 ring-1 ring-emerald-400'
              : 'border-slate-200/90 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-medium text-emerald-700">Completed</span>
            <CheckCircle2 size={14} className="text-emerald-500" />
          </div>
          <div className="text-lg font-bold text-emerald-700 mt-1 font-mono">
            {completedCount}
          </div>
          <div className="text-[10px] text-emerald-500/80 mt-0.5">Physically verified</div>
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar
        filters={filters}
        onChange={setFilters}
        onReset={() =>
          setFilters({ search: '', stateId: null, category: null, status: null, minRisk: null })
        }
      />

      {/* Main Table */}
      <DataTable
        columns={columns}
        rows={filteredProjects}
        onRowClick={onSelectProject}
        pageSize={15}
        emptyMessage="No matching projects found in the registry."
      />

      {/* Sanction New Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Plus size={16} className="text-blue-600" />
                <span>Sanction New Scheme (MPLADS Phase 5)</span>
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Submit administrative approval details. Service layer automatically enforces state scoping, generates initial risk index, and registers the project for geofenced inspection.
            </p>

            <form onSubmit={handleSanctionSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-medium text-slate-700">Project / Scheme Title *</label>
                <input
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Solar Cold Storage and Veterinary Clinic Phase-1"
                  className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-slate-700">Category *</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 capitalize"
                  >
                    <option value="road">Road</option>
                    <option value="water">Water Supply</option>
                    <option value="health">Healthcare</option>
                    <option value="education">Education</option>
                    <option value="drainage">Drainage</option>
                    <option value="electricity">Solar / Power</option>
                    <option value="community_hall">Community Hall</option>
                    <option value="sports">Sports Complex</option>
                  </select>
                </div>

                <div>
                  <label className="font-medium text-slate-700">Sanction Amount (INR) *</label>
                  <input
                    type="number"
                    required
                    min={500000}
                    step={100000}
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-slate-700">Target District *</label>
                  <select
                    value={newDistrictName}
                    onChange={(e) => setNewDistrictName(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {DISTRICTS_DATA.map((d) => (
                      <option key={d.name} value={d.name}>
                        {d.name} ({d.stateName})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-medium text-slate-700">Executing Agency</label>
                  <input
                    value={newAgency}
                    onChange={(e) => setNewAgency(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 cursor-pointer shadow-xs"
                >
                  Confirm & Register Sanction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Field Officer Geofenced Inspection Mode Modal */}
      {showFieldInspectionModal && (
        <FieldInspectionModal
          isOpen={showFieldInspectionModal}
          project={selectedForInspection || filteredProjects[0] || SEED_PROJECTS[0]}
          initialProject={selectedForInspection}
          onClose={() => {
            setShowFieldInspectionModal(false);
            setSelectedForInspection(null);
          }}
          onSaveInspection={(record, updated) => {
            setProjectsList((prev) =>
              prev.map((p) => (p.id === updated.id ? updated : p))
            );
            setToastMessage({
              text: `Field inspection evidence recorded for ${updated.id}`,
              type: 'success',
            });
          }}
        />
      )}
    </div>
  );
};
