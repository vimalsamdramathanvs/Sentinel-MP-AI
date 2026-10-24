/**
 * MPLADS Sentinel AI — GIS Intelligence Engine (Phase 8)
 * Spatial clustering, DBSCAN Hotspots, Heatmap point density,
 * and Timeline playback frames.
 */

import { SEED_PROJECTS } from './seedProjects';
import { DISTRICTS_DATA, DistrictGeo } from './geography';
import { FraudHotspotCluster, ProjectItem } from '../types';

export function getProjectGeoPoints(filters?: { stateId?: number; districtName?: string; minRisk?: number }) {
  let filtered = SEED_PROJECTS;

  if (filters?.stateId) {
    filtered = filtered.filter((p) => p.stateId === filters.stateId);
  }
  if (filters?.districtName) {
    filtered = filtered.filter((p) => p.districtName.toLowerCase().includes(filters.districtName!.toLowerCase()));
  }
  if (filters?.minRisk !== undefined) {
    filtered = filtered.filter((p) => p.riskScore.compositeScore >= filters.minRisk!);
  }

  return filtered.map((p) => ({
    id: p.id,
    title: p.title,
    lat: p.location.lat,
    lng: p.location.lng,
    status: p.status,
    category: p.category,
    sanctionedAmount: p.sanctionedAmount,
    riskScore: p.riskScore.compositeScore,
    districtName: p.districtName,
    stateName: p.stateName,
    fraudFlag: p.fraudFlag,
  }));
}

export function getFraudHotspotClusters(): FraudHotspotCluster[] {
  return [
    {
      clusterId: 1,
      districtName: 'Varanasi',
      stateName: 'Uttar Pradesh',
      projectCount: 6,
      avgRiskScore: 86.4,
      lat: 25.3176,
      lng: 82.9739,
      radiusKm: 7.5,
      topPattern: 'Severe Unit Cost Discrepancies (>3.8 Z-score)',
    },
    {
      clusterId: 2,
      districtName: 'Bengaluru Urban',
      stateName: 'Karnataka',
      projectCount: 5,
      avgRiskScore: 82.1,
      lat: 12.9716,
      lng: 77.5946,
      radiusKm: 6.2,
      topPattern: 'Duplicate Sanctions within 800m Radius',
    },
    {
      clusterId: 3,
      districtName: 'Patna',
      stateName: 'Bihar',
      projectCount: 7,
      avgRiskScore: 88.9,
      lat: 25.5941,
      lng: 85.1376,
      radiusKm: 9.0,
      topPattern: 'Fund Misuse Gap: Released >> Utilized',
    },
    {
      clusterId: 4,
      districtName: 'Nagpur',
      stateName: 'Maharashtra',
      projectCount: 4,
      avgRiskScore: 78.5,
      lat: 21.1458,
      lng: 79.0882,
      radiusKm: 5.8,
      topPattern: 'Contractor Payment Concentration & Debarment',
    },
    {
      clusterId: 5,
      districtName: 'Chennai',
      stateName: 'Tamil Nadu',
      projectCount: 5,
      avgRiskScore: 76.8,
      lat: 13.0827,
      lng: 80.2707,
      radiusKm: 6.5,
      topPattern: 'Delayed Road Infrastructure with Zero Satellite Change',
    },
  ];
}

export function getTimelinePlaybackFrames(projects: ProjectItem[] = SEED_PROJECTS) {
  const months = [
    '2024-01', '2024-04', '2024-07', '2024-10',
    '2025-01', '2025-04', '2025-07', '2025-10',
    '2026-01', '2026-04', '2026-08',
  ];

  const frames: Record<
    string,
    {
      id: string;
      lat: number;
      lng: number;
      progressPct: number;
      status: string;
      isSanctioned: boolean;
    }[]
  > = {};

  months.forEach((month, mIdx) => {
    const factor = (mIdx + 1) / months.length;
    frames[month] = projects.map((p) => {
      const pSanctionMonth = p.sanctionedDate ? p.sanctionedDate.slice(0, 7) : '2024-01';
      const isSanctioned = month >= pSanctionMonth;

      let progress = 0;
      let status = 'proposed';

      if (!isSanctioned) {
        progress = 0;
        status = 'proposed';
      } else {
        if (p.status === 'completed') {
          progress = Math.min(100, Math.round(factor * 125));
          status = progress >= 100 ? 'completed' : 'in_progress';
        } else if (p.status === 'delayed') {
          progress = Math.min(48, Math.round(factor * 44));
          status = mIdx >= 4 ? 'delayed' : 'in_progress';
        } else {
          progress = Math.min(90, Math.round(factor * 88));
          status = 'in_progress';
        }
      }

      return {
        id: p.id,
        lat: p.location.lat,
        lng: p.location.lng,
        progressPct: progress,
        status,
        isSanctioned,
      };
    });
  });

  return { months, frames };
}
