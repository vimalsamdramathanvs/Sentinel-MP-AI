/**
 * MPLADS Sentinel AI — Core TypeScript Types
 * Unified contract covering all 24 architectural phases.
 */

export type RoleType =
  | 'ministry_admin'
  | 'state_admin'
  | 'district_officer'
  | 'mp_user'
  | 'auditor'
  | 'public_user'
  | 'system_admin';

export type NavTabId =
  | 'dashboard'
  | 'projects'
  | 'gis'
  | 'fraud'
  | 'risk'
  | 'analytics'
  | 'satellite'
  | 'documents'
  | 'alerts'
  | 'reports'
  | 'copilot'
  | 'mpledger'
  | 'public'
  | 'admin';

export interface UserSession {
  id: string;
  email: string;
  fullName: string;
  role: RoleType;
  stateId?: number;
  districtId?: number;
  constituencyId?: number;
  mpName?: string;
  mfaEnabled: boolean;
  token?: string;
}

export interface MPAllocation {
  srNo: number;
  state: string;
  mpName: string;
  constituency: string;
  allocatedAmount: number;
}

export type ProjectStatus =
  | 'proposed'
  | 'sanctioned'
  | 'in_progress'
  | 'delayed'
  | 'completed'
  | 'cancelled';

export interface ProjectLocation {
  lat: number;
  lng: number;
}

export interface RiskComponents {
  cost_risk: number;
  delay_risk: number;
  utilization_risk: number;
  duplicate_risk: number;
  vendor_risk: number;
  agency_risk: number;
  compliance_risk: number;
  geo_risk: number;
}

export interface RiskExplanationItem {
  component: keyof RiskComponents;
  score: number;
  weight: number;
  contribution: number;
  narrative?: string;
}

export interface RiskResult {
  components: RiskComponents;
  compositeScore: number;
  weightsUsed: Record<string, number>;
  explanation: RiskExplanationItem[];
}

export interface ProjectItem {
  id: string;
  title: string;
  description: string;
  constituencyId: number;
  constituencyName: string;
  districtId: number;
  districtName: string;
  stateId: number;
  stateName: string;
  mpName?: string;
  agencyId: string;
  agencyName: string;
  agencyType: string;
  agencyBlacklisted: boolean;
  vendorId: string;
  vendorName: string;
  vendorBlacklisted: boolean;
  category: string;
  sanctionedAmount: number;
  releasedAmount: number;
  utilizedAmount: number;
  status: ProjectStatus;
  sanctionedDate: string;
  expectedCompletion: string;
  actualCompletion?: string;
  location: ProjectLocation;
  isSeedData: boolean;
  riskScore: RiskResult;
  fraudFlag?: 'cost_anomaly' | 'fund_misuse' | 'vendor_concentration' | 'near_duplicate';
  isDuplicateCandidate?: boolean;
  duplicateWithId?: string;
  verifiedStatus?: 'unverified' | 'satellite_verified' | 'field_verified' | 'disputed' | 'ghost_suspected';
  lastUpdated: string;
}

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';
export type AlertStatus = 'open' | 'acknowledged' | 'resolved' | 'dismissed';

export interface AlertItem {
  id: string;
  projectId: string;
  projectTitle: string;
  title?: string;
  description?: string;
  routedToRole?: string;
  slaHours?: number;
  districtName: string;
  stateName: string;
  stateId: number;
  alertType: 'fraud' | 'delay' | 'geo' | 'compliance' | 'financial';
  severity: AlertSeverity;
  message: string;
  status: AlertStatus;
  resolution?: 'confirmed_fraud' | 'false_positive' | 'inconclusive';
  resolutionNotes?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  createdAt: string;
  riskScore: number;
}

export interface ForecastPeriod {
  ds: string;
  yhat: number;
  yhat_lower: number;
  yhat_upper: number;
}

export interface ForecastData {
  scope: 'state' | 'district' | 'agency';
  scopeId: string;
  scopeName: string;
  metric: 'delay_rate' | 'utilization_rate';
  historical: { ds: string; y: number }[];
  forecast: ForecastPeriod[];
  confidenceNote: string;
}

export interface RootCauseFinding {
  factor: string;
  findingType: 'categorical' | 'numeric';
  statistic: number;
  pValue: number;
  effectDescription: string;
  sampleSize: number;
}

export interface WhatIfScenarioInput {
  utilizationRatio?: number;
  releaseRatio?: number;
  vendorBlacklisted?: boolean;
  agencyBlacklisted?: boolean;
  costZScore?: number;
  daysOverdue?: number;
  missingDocuments?: number;
}

export interface WhatIfScenarioResult {
  baselineCompositeScore: number;
  simulatedCompositeScore: number;
  scoreDelta: number;
  componentDeltas: Partial<Record<keyof RiskComponents, number>>;
  interpretation: string;
}

export interface DuplicatePair {
  projectA: { id: string; title: string; sanctionedAmount: number; district: string };
  projectB: { id: string; title: string; sanctionedAmount: number; district: string };
  duplicateScore: number;
  titleSimilarity: number;
  distanceKm: number;
  sameAgency: boolean;
  dateOverlap: boolean;
}

export interface FraudHotspotCluster {
  clusterId: number;
  districtName: string;
  stateName: string;
  projectCount: number;
  avgRiskScore: number;
  lat: number;
  lng: number;
  radiusKm: number;
  topPattern: string;
}

export interface GrievanceItem {
  id: string;
  projectId?: string;
  projectTitle?: string;
  submitterName?: string;
  submitterContact?: string;
  category: 'quality_concern' | 'delay_concern' | 'fund_misuse_suspicion' | 'asset_missing' | 'other';
  description: string;
  status: 'submitted' | 'under_review' | 'forwarded' | 'resolved' | 'dismissed';
  submittedAt: string;
  resolvedAt?: string;
  resolutionNotes?: string;
}

export interface AgentTraceStep {
  agent: string;
  toolCalls: string[];
  summary?: string;
  timestamp: string;
}

export interface MpAllocationRecord {
  mpId: string;
  mpName: string;
  constituency: string;
  state: string;
  party: string;
  house: 'Lok Sabha' | 'Rajya Sabha';
  entitledCr: number;
  sanctionedCr: number;
  utilizedCr: number;
  recommendedWorksCount: number;
}

export interface CopilotAction {
  label: string;
  tab?: NavTabId;
  projectId?: string;
  icon?: string;
}

export interface CopilotMessage {
  id: string;
  role?: 'user' | 'assistant';
  sender?: 'user' | 'assistant';
  content?: string;
  text?: string;
  agentName?: string;
  toolTraces?: { tool: string; latencyMs: number }[];
  agentTrace?: AgentTraceStep[];
  timestamp: string;
  actions?: CopilotAction[];
  structuredData?: {
    type: 'projects_table' | 'risk_summary' | 'report_link' | 'hotspot_list';
    data: any;
  };
}

export interface ReportJob {
  id: string;
  reportType: 'district' | 'state' | 'executive';
  scopeId: string;
  scopeName: string;
  format: 'pdf' | 'xlsx' | 'csv';
  status: 'queued' | 'processing' | 'ready' | 'failed';
  generatedAt: string;
  downloadUrl?: string;
  summaryMetrics?: Record<string, any>;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  userEmail: string;
  userRole: string;
  entityType: string;
  entityId: string;
  beforeState?: Record<string, any>;
  afterState?: Record<string, any>;
  timestamp: string;
  ipAddress: string;
}

export interface FieldInspectionRecord {
  id: string;
  projectId: string;
  projectTitle: string;
  inspectorName: string;
  inspectorDesignation: string;
  inspectorBadgeNumber: string;
  inspectionDate: string;
  physicalProgressPercent: number;
  qualityRating: 'A' | 'B' | 'C' | 'F';
  functionalityStatus: 'operational' | 'in_progress' | 'substandard' | 'ghost_confirmed';
  signboardVerified: boolean;
  watermarkedPhotoUrl: string;
  rawPhotoName?: string;
  observations: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  hash: string;
  cagComplianceCode: string;
}
