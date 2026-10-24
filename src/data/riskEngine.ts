/**
 * MPLADS Sentinel AI — Risk Scoring Engine (Phase 7 & Phase 18)
 * 8 Explainable Components, Configurable Normalized Weights, and Unified Color Scales
 */

import { RiskComponents, RiskResult, RiskExplanationItem } from '../types';

export const RISK_SCALE = {
  low: { threshold: 0, color: "#10b981", badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "Low" },
  medium: { threshold: 40, color: "#f59e0b", badgeBg: "bg-amber-50 text-amber-700 border-amber-200", label: "Medium" },
  high: { threshold: 70, color: "#f97316", badgeBg: "bg-orange-50 text-orange-700 border-orange-200", label: "High" },
  critical: { threshold: 85, color: "#ef4444", badgeBg: "bg-rose-50 text-rose-700 border-rose-200", label: "Critical" },
} as const;

export function getRiskTier(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score >= RISK_SCALE.critical.threshold) return 'critical';
  if (score >= RISK_SCALE.high.threshold) return 'high';
  if (score >= RISK_SCALE.medium.threshold) return 'medium';
  return 'low';
}

export function getRiskColor(score: number): string {
  return RISK_SCALE[getRiskTier(score)].color;
}

export const DEFAULT_RISK_WEIGHTS: Record<keyof RiskComponents, number> = {
  cost_risk: 0.15,
  delay_risk: 0.15,
  utilization_risk: 0.20, // highest weighted: fund misuse is core mandate
  duplicate_risk: 0.10,
  vendor_risk: 0.10,
  agency_risk: 0.10,
  compliance_risk: 0.10,
  geo_risk: 0.10,
};

export function normalizeTo100(val: number): number {
  return Math.max(0, Math.min(100, Math.round(val * 10) / 10));
}

export function computeCostRisk(costZScore: number): number {
  return normalizeTo100(Math.max(0, costZScore - 0.5) * 25);
}

export function computeDelayRisk(daysOverdue: number, typicalDurationDays: number = 365): number {
  if (typicalDurationDays <= 0) typicalDurationDays = 365;
  return normalizeTo100((daysOverdue / typicalDurationDays) * 100);
}

export function computeUtilizationRisk(utilizationRatio: number, releaseRatio: number): number {
  const misuseGap = Math.max(0, releaseRatio - utilizationRatio);
  return normalizeTo100(misuseGap * 150);
}

export function computeDuplicateRisk(maxDuplicateScore: number): number {
  return normalizeTo100(maxDuplicateScore * 100);
}

export function computeVendorRisk(maxPaymentRatio: number, vendorBlacklisted: boolean, vendorFlagCount: number = 0): number {
  let base = maxPaymentRatio * 40;
  if (vendorBlacklisted) base += 50;
  base += Math.min(vendorFlagCount * 10, 30);
  return normalizeTo100(base);
}

export function computeAgencyRisk(agencyBlacklisted: boolean, historicalAlertRate: number = 0): number {
  let base = agencyBlacklisted ? 60 : 0;
  base += historicalAlertRate * 100 * 0.4;
  return normalizeTo100(base);
}

export function computeComplianceRisk(missingDocs: number, mismatchedAmounts: number): number {
  return normalizeTo100(missingDocs * 15 + mismatchedAmounts * 25);
}

export function computeGeoRisk(locationMismatch: boolean, satelliteNoChange: boolean): number {
  let base = 0;
  if (locationMismatch) base += 45;
  if (satelliteNoChange) base += 55;
  return normalizeTo100(base);
}

export interface ScoreInputs {
  costZScore: number;
  daysOverdue: number;
  typicalDurationDays?: number;
  utilizationRatio: number;
  releaseRatio: number;
  maxDuplicateScore?: number;
  maxPaymentRatio?: number;
  vendorBlacklisted?: boolean;
  vendorFlagCount?: number;
  agencyBlacklisted?: boolean;
  agencyHistoricalAlertRate?: number;
  missingDocuments?: number;
  mismatchedAmounts?: number;
  locationMismatch?: boolean;
  satelliteNoChange?: boolean;
}

export function calculateCompositeRisk(
  inputs: ScoreInputs,
  weights: Record<keyof RiskComponents, number> = DEFAULT_RISK_WEIGHTS
): RiskResult {
  const components: RiskComponents = {
    cost_risk: computeCostRisk(inputs.costZScore),
    delay_risk: computeDelayRisk(inputs.daysOverdue, inputs.typicalDurationDays ?? 365),
    utilization_risk: computeUtilizationRisk(inputs.utilizationRatio, inputs.releaseRatio),
    duplicate_risk: computeDuplicateRisk(inputs.maxDuplicateScore ?? 0),
    vendor_risk: computeVendorRisk(inputs.maxPaymentRatio ?? 0, inputs.vendorBlacklisted ?? false, inputs.vendorFlagCount ?? 0),
    agency_risk: computeAgencyRisk(inputs.agencyBlacklisted ?? false, inputs.agencyHistoricalAlertRate ?? 0),
    compliance_risk: computeComplianceRisk(inputs.missingDocuments ?? 0, inputs.mismatchedAmounts ?? 0),
    geo_risk: computeGeoRisk(inputs.locationMismatch ?? false, inputs.satelliteNoChange ?? false),
  };

  const compKeys = Object.keys(components) as (keyof RiskComponents)[];
  let rawComposite = 0;

  const explanation: RiskExplanationItem[] = compKeys.map((k) => {
    const score = components[k];
    const weight = weights[k] ?? 0.125;
    const contribution = Math.round(score * weight * 100) / 100;
    rawComposite += contribution;

    let narrative = '';
    if (k === 'utilization_risk' && score > 60) {
      narrative = `Fund utilization lag: ${Math.round(inputs.releaseRatio * 100)}% released vs ${Math.round(inputs.utilizationRatio * 100)}% utilized.`;
    } else if (k === 'cost_risk' && score > 50) {
      narrative = `Estimated unit cost is ${inputs.costZScore.toFixed(1)} standard deviations above district peer baseline.`;
    } else if (k === 'delay_risk' && score > 50) {
      narrative = `Project is ${inputs.daysOverdue} days overdue past expected completion date.`;
    } else if (k === 'duplicate_risk' && score > 50) {
      narrative = `High spatial and title similarity detected with adjacent sanctioned work within 5km.`;
    } else if (k === 'geo_risk' && score > 40) {
      narrative = `Satellite multi-spectral change check flags negligible physical progress on ground.`;
    } else if (k === 'vendor_risk' && score > 40) {
      narrative = inputs.vendorBlacklisted ? 'Vendor is on ministry debarment list.' : 'Excessive payment concentration in single vendor account.';
    } else if (k === 'agency_risk' && score > 40) {
      narrative = inputs.agencyBlacklisted ? 'Executing agency flagged for compliance debarment.' : 'Agency shows elevated historical alert rates.';
    } else if (k === 'compliance_risk' && score > 40) {
      narrative = `Critical document discrepancy or missing mandatory utilization certificate.`;
    }

    return {
      component: k,
      score,
      weight,
      contribution,
      narrative: narrative || `Normal range contribution for ${k.replace('_', ' ')}.`,
    };
  });

  explanation.sort((a, b) => b.contribution - a.contribution);

  const compositeScore = Math.min(100, Math.max(0, Math.round(rawComposite * 10) / 10));

  return {
    components,
    compositeScore,
    weightsUsed: { ...weights },
    explanation,
  };
}
