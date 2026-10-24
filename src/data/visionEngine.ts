/**
 * MPLADS Sentinel AI — Satellite & Vision Intelligence (Phase 9 & Phase 11)
 * Multi-spectral NDVI/NDBI change detection, Ghost asset conservative flagging,
 * Perceptual Hashing (pHash) duplicate detection, and ELA manipulation forensics.
 */

export interface SatelliteComparison {
  assetId: string;
  projectId: string;
  projectTitle: string;
  assetType: string;
  location: { lat: number; lng: number };
  sanctionedDate: string;
  lastSatelliteDate: string;
  ndviBefore: number;
  ndviAfter: number;
  ndviDelta: number;
  ndbiBefore: number;
  ndbiAfter: number;
  ndbiDelta: number;
  ssimScore: number;
  cloudCoverPct: number;
  constructionLikely: boolean;
  verifiedStatus: 'satellite_verified' | 'ghost_suspected' | 'unverified' | 'disputed';
  confidence: number;
  reasoning: string;
  beforeImageUrl: string;
  afterImageUrl: string;
}

export interface PhotoForensicsCheck {
  imageId: string;
  assetTypeClaimed: string;
  assetTypeDetected: string;
  typeMatchConfidence: number;
  perceptualHash: string;
  duplicateMatches: { matchedImageId: string; hammingDistance: number; projectTitle: string }[];
  elaMaxDifference: number;
  elaSuspiciousPct: number;
  manipulationSuspected: boolean;
  confidence: number;
  caveats: string[];
}

export const SATELLITE_ASSET_CHECKS: SatelliteComparison[] = [
  {
    assetId: 'ast-sat-01',
    projectId: 'proj-fraud-8',
    projectTitle: '[FLAGGED-FUND_MISUSE] Deep Borewell Piped Drinking Water Grid',
    assetType: 'water_storage_reservoir',
    location: { lat: 25.3176, lng: 82.9739 },
    sanctionedDate: '2024-03-15',
    lastSatelliteDate: '2026-08-20',
    ndviBefore: 0.44,
    ndviAfter: 0.435,
    ndviDelta: -0.005,
    ndbiBefore: 0.11,
    ndbiAfter: 0.112,
    ndbiDelta: 0.002,
    ssimScore: 0.94, // visually almost 100% identical!
    cloudCoverPct: 2.1,
    constructionLikely: false,
    verifiedStatus: 'ghost_suspected',
    confidence: 0.91,
    reasoning:
      'Project reported as 100% completed with ₹1.8Cr sanction, yet Sentinel-2 10m multi-spectral imagery detects zero ground disturbance (NDVI Δ=-0.005, NDBI Δ=+0.002). Physical verification recommended immediately.',
    beforeImageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&auto=format&fit=crop&q=80',
    afterImageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&auto=format&fit=crop&q=80',
  },
  {
    assetId: 'ast-sat-02',
    projectId: 'proj-std-1',
    projectTitle: 'Solar Powered Public Library & Digital Reading Room — Bengaluru Urban',
    assetType: 'community_building',
    location: { lat: 12.9716, lng: 77.5946 },
    sanctionedDate: '2023-05-10',
    lastSatelliteDate: '2026-08-15',
    ndviBefore: 0.52,
    ndviAfter: 0.28,
    ndviDelta: -0.24,
    ndbiBefore: 0.09,
    ndbiAfter: 0.31,
    ndbiDelta: 0.22,
    ssimScore: 0.61, // significant structural change
    cloudCoverPct: 1.4,
    constructionLikely: true,
    verifiedStatus: 'satellite_verified',
    confidence: 0.88,
    reasoning:
      'Clear new built-up rooftop signature and concrete reflectance detected consistent with reported construction timeline.',
    beforeImageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&auto=format&fit=crop&q=80',
    afterImageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?w=600&auto=format&fit=crop&q=80',
  },
];

export const SAMPLE_PHOTO_FORENSICS: PhotoForensicsCheck[] = [
  {
    imageId: 'img-photo-101',
    assetTypeClaimed: 'water_tank',
    assetTypeDetected: 'classroom_interior',
    typeMatchConfidence: 0.94,
    perceptualHash: 'a7b3c29f041289de',
    duplicateMatches: [
      {
        matchedImageId: 'img-prior-88',
        hammingDistance: 3, // very close duplicate!
        projectTitle: 'Model Anganwadi Centre Upgrade',
      },
    ],
    elaMaxDifference: 68.4,
    elaSuspiciousPct: 12.8,
    manipulationSuspected: true,
    confidence: 0.85,
    caveats: [
      'Image content mismatch: Claimed water tank but image depicts school classroom interior.',
      'Perceptual hash hamming distance of 3 indicates image was previously submitted for an unrelated project in 2023.',
      'Error Level Analysis (ELA) shows localized pixel compression discrepancy around date plaque.',
    ],
  },
];

export function getSatelliteObservations() {
  return [
    {
      id: 'SAT-001',
      projectId: 'proj-fraud-8',
      projectTitle: 'Deep Borewell Piped Drinking Water Grid — Varanasi',
      location: { lat: 25.3176, lng: 82.9739 },
      baselinePassDate: '2024-03-15',
      postPassDate: '2026-02-20',
      cloudCover: 2.1,
      spectralDelta: { ndvi: -0.005, ndbi: 0.002 },
      confidence: 0.94,
      status: 'ghost_suspected',
      groundTruthFinding: 'Zero ground disturbance or built-up signature detected despite 100% fund withdrawal.',
    },
    {
      id: 'SAT-002',
      projectId: 'proj-std-1',
      projectTitle: 'Solar Powered Public Library & Digital Reading Room — Bengaluru',
      location: { lat: 12.9716, lng: 77.5946 },
      baselinePassDate: '2023-05-10',
      postPassDate: '2026-01-18',
      cloudCover: 1.4,
      spectralDelta: { ndvi: -0.24, ndbi: 0.22 },
      confidence: 0.91,
      status: 'verified_change',
      groundTruthFinding: 'Substantial structural concrete roof signature confirmed.',
    },
    {
      id: 'SAT-003',
      projectId: 'proj-fraud-4',
      projectTitle: 'Model Anganwadi Centre Upgrade — Patna',
      location: { lat: 25.5941, lng: 85.1376 },
      baselinePassDate: '2024-01-12',
      postPassDate: '2026-02-05',
      cloudCover: 3.8,
      spectralDelta: { ndvi: -0.08, ndbi: 0.06 },
      confidence: 0.72,
      status: 'partial_change',
      groundTruthFinding: 'Partial clearing detected; structure footprint smaller than sanctioned DPR drawings.',
    },
  ];
}

export function runPhotoForensicCheck(caseType: 'clean' | 'duplicate_phash' | 'tampered_ela' = 'clean') {
  if (caseType === 'clean') {
    return {
      passed: true,
      authenticityScore: 96,
      summary: 'Photograph verified authentic. EXIF geotag consistent with project coordinates.',
      details: {
        phashMatch: 'Unique (Hamming distance > 22)',
        elaVariance: 'Normal (1.8% variance)',
        exifStatus: 'Intact & verified within 50m of site',
      },
    };
  }

  if (caseType === 'duplicate_phash') {
    return {
      passed: false,
      authenticityScore: 28,
      summary: 'Fraud Alert: Perceptual Hash match detected (Hamming distance 2). Recycled photo from 2023 project.',
      details: {
        phashMatch: 'Matched with PRJ-2023-412 (98.6% match)',
        elaVariance: 'Normal',
        exifStatus: 'Camera timestamp stripped',
      },
    };
  }

  return {
    passed: false,
    authenticityScore: 34,
    summary: 'Tampering Alert: Error Level Analysis detects spliced text/pixel compression on milestone plaque.',
    details: {
      phashMatch: 'Unique hash',
      elaVariance: 'Extreme (68.4 max diff, 14% high-error block)',
      exifStatus: 'Software tag: Adobe Photoshop 24.1 detected',
    },
  };
}

