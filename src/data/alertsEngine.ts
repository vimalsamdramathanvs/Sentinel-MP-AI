/**
 * MPLADS Sentinel AI — Alert System & Resolution Engine (Phase 16)
 * Generates alerts, routes via Severity x Role x Channel matrix,
 * and records resolution feedback for supervised ML model training.
 */

import { AlertItem } from '../types';
import { SEED_PROJECTS } from './seedProjects';

export interface ChannelDeliveryRule {
  severity: 'low' | 'medium' | 'high' | 'critical';
  channels: ('dashboard' | 'email' | 'push' | 'sms')[];
}

export const CHANNEL_ROUTING_MATRIX: ChannelDeliveryRule[] = [
  { severity: 'low', channels: ['dashboard'] },
  { severity: 'medium', channels: ['dashboard', 'email'] },
  { severity: 'high', channels: ['dashboard', 'email', 'push'] },
  { severity: 'critical', channels: ['dashboard', 'email', 'push', 'sms'] },
];

function generateInitialAlerts(): AlertItem[] {
  const alerts: AlertItem[] = [];

  // Generate alerts for projects with high or critical risk scores
  SEED_PROJECTS.forEach((proj, idx) => {
    const comp = proj.riskScore.compositeScore;
    if (comp >= 70 || proj.fraudFlag || proj.status === 'delayed') {
      const severity: 'low' | 'medium' | 'high' | 'critical' =
        comp >= 85 ? 'critical' : comp >= 70 ? 'high' : 'medium';

      let alertType: 'fraud' | 'delay' | 'geo' | 'compliance' | 'financial' = 'fraud';
      let message = '';

      if (proj.fraudFlag === 'fund_misuse') {
        alertType = 'financial';
        message = `High financial divergence: ₹${(proj.releasedAmount / 1e7).toFixed(2)} Cr released with only ₹${(proj.utilizedAmount / 1e5).toFixed(1)} L utilized.`;
      } else if (proj.fraudFlag === 'cost_anomaly') {
        alertType = 'fraud';
        message = `Severe unit cost anomaly detected: ${proj.riskScore.components.cost_risk.toFixed(1)}/100 peer variance.`;
      } else if (proj.fraudFlag === 'near_duplicate') {
        alertType = 'fraud';
        message = `Duplicate spatial signature candidate detected within 800m of ${proj.duplicateWithId || 'adjacent project'}.`;
      } else if (proj.status === 'delayed') {
        alertType = 'delay';
        message = `Project milestones overdue by 280+ days with stalled contractor progress.`;
      } else if (proj.verifiedStatus === 'ghost_suspected') {
        alertType = 'geo';
        message = `Satellite multi-spectral change check reveals zero physical land-cover alteration.`;
      } else {
        message = `Composite risk threshold breached (${comp.toFixed(1)}/100). Manual investigation recommended.`;
      }

      // First few are already resolved as ground-truth for supervised training (Phase 6)
      const isResolved = idx < 8;
      const resolution = isResolved
        ? idx % 2 === 0
          ? 'confirmed_fraud'
          : 'false_positive'
        : undefined;

      alerts.push({
        id: `alt-${idx + 1}`,
        projectId: proj.id,
        projectTitle: proj.title,
        title: proj.title,
        description: message,
        routedToRole: severity === 'critical' ? 'ministry_admin' : severity === 'high' ? 'district_officer' : 'auditor',
        slaHours: severity === 'critical' ? 24 : severity === 'high' ? 48 : 72,
        districtName: proj.districtName,
        stateName: proj.stateName,
        stateId: proj.stateId,
        alertType,
        severity,
        message,
        status: isResolved ? 'resolved' : idx % 3 === 0 ? 'acknowledged' : 'open',
        resolution,
        resolutionNotes: isResolved
          ? resolution === 'confirmed_fraud'
            ? 'District magistrate physical inspection confirmed unauthorized diversion of sanctioned funds.'
            : 'Price revision approved by State Planning Board accounted for legitimate material cost inflation.'
          : undefined,
        resolvedBy: isResolved ? 'State Auditor / Vigilance Officer' : undefined,
        resolvedAt: isResolved ? '2026-08-28T14:30:00Z' : undefined,
        createdAt: '2026-08-15T09:00:00Z',
        riskScore: comp,
      });
    }
  });

  return alerts;
}

export const INITIAL_ALERTS: AlertItem[] = generateInitialAlerts();
