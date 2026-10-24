/**
 * MPLADS Sentinel AI — Seed Projects Database (Phase 23)
 * Contains realistic baseline projects + 20 deliberate fraud cases, 20 delay cases,
 * and 10 duplicate pairs (20 duplicate projects) mapped to real Indian geography and MPs.
 */

import { ProjectItem } from '../types';
import { DISTRICTS_DATA, DistrictGeo, PROJECT_CATEGORIES, AGENCY_TYPES } from './geography';
import { calculateCompositeRisk } from './riskEngine';
import { MP_ALLOCATIONS_DATA } from './mpAllocations';

const VENDORS_SAMPLE = [
  { id: 'v-101', name: 'National Infra Buildcon Pvt Ltd', blacklisted: false },
  { id: 'v-102', name: 'Apex Rural Engineering & Power', blacklisted: false },
  { id: 'v-103', name: 'Bharat Roadcraft Builders Ltd', blacklisted: false },
  { id: 'v-104', name: 'Cauvery Water Works Consortium', blacklisted: false },
  { id: 'v-105', name: 'Pioneer Civic Infra Services', blacklisted: false },
  { id: 'v-106', name: 'Shiva Shakti Constructions', blacklisted: false },
  { id: 'v-107', name: 'Deccan Highway Builders', blacklisted: false },
  { id: 'v-108', name: 'Ganga Valley Development Ltd', blacklisted: true }, // Blacklisted
  { id: 'v-109', name: 'Surya Solar & Electricals', blacklisted: false },
  { id: 'v-110', name: 'Himalayan Concrete Works', blacklisted: false },
];

function findMPForState(stateName: string, districtName: string): { mpName: string; constituency: string } {
  const match = MP_ALLOCATIONS_DATA.find(
    (m) => m.state.toLowerCase() === stateName.toLowerCase() && m.constituency.toLowerCase().includes(districtName.toLowerCase().slice(0, 4))
  );
  if (match) return { mpName: match.mpName, constituency: match.constituency };
  const stateMatch = MP_ALLOCATIONS_DATA.find((m) => m.state.toLowerCase() === stateName.toLowerCase());
  return stateMatch ? { mpName: stateMatch.mpName, constituency: stateMatch.constituency } : { mpName: 'Hon. Member of Parliament', constituency: districtName };
}

function generateSeedProjects(): ProjectItem[] {
  const projects: ProjectItem[] = [];
  let pIndex = 1;

  // 1. Deliberate Fraud Cases (20 cases: cost anomalies, fund misuse, vendor concentration)
  const fraudPatterns: ('cost_anomaly' | 'fund_misuse' | 'vendor_concentration')[] = [
    'cost_anomaly', 'cost_anomaly', 'cost_anomaly', 'cost_anomaly', 'cost_anomaly', 'cost_anomaly', 'cost_anomaly',
    'fund_misuse', 'fund_misuse', 'fund_misuse', 'fund_misuse', 'fund_misuse', 'fund_misuse', 'fund_misuse',
    'vendor_concentration', 'vendor_concentration', 'vendor_concentration', 'vendor_concentration', 'vendor_concentration', 'vendor_concentration'
  ];

  fraudPatterns.forEach((pattern, i) => {
    const dist: DistrictGeo = DISTRICTS_DATA[i % DISTRICTS_DATA.length];
    const mpInfo = findMPForState(dist.stateName, dist.name);
    const category = pattern === 'cost_anomaly' ? 'road' : pattern === 'fund_misuse' ? 'water' : 'education';
    const sanctioned = pattern === 'cost_anomaly' ? 24500000 : pattern === 'fund_misuse' ? 18500000 : 12000000;
    const released = pattern === 'cost_anomaly' ? 19500000 : pattern === 'fund_misuse' ? 18000000 : 11000000;
    const utilized = pattern === 'cost_anomaly' ? 17000000 : pattern === 'fund_misuse' ? 850000 : 9800000; // fund misuse: ₹1.8Cr released vs ₹8.5L utilized!
    const isVendorBad = pattern === 'vendor_concentration' || i === 0;

    const riskInputs = {
      costZScore: pattern === 'cost_anomaly' ? 4.2 : 1.1,
      daysOverdue: pattern === 'fund_misuse' ? 240 : 45,
      typicalDurationDays: 300,
      utilizationRatio: utilized / released,
      releaseRatio: released / sanctioned,
      maxPaymentRatio: pattern === 'vendor_concentration' ? 0.96 : 0.4,
      vendorBlacklisted: isVendorBad,
      vendorFlagCount: isVendorBad ? 4 : 0,
      agencyBlacklisted: i % 4 === 0,
      agencyHistoricalAlertRate: 0.35,
      missingDocuments: pattern === 'fund_misuse' ? 3 : 1,
      mismatchedAmounts: pattern === 'cost_anomaly' ? 2 : 0,
      satelliteNoChange: pattern === 'fund_misuse',
    };

    const riskScore = calculateCompositeRisk(riskInputs);

    projects.push({
      id: `proj-fraud-${i + 1}`,
      title: `[FLAGGED-${pattern.toUpperCase()}] ${pattern === 'cost_anomaly' ? 'Four-Lane High Density Bypass Corridor' : pattern === 'fund_misuse' ? 'Deep Borewell Piped Drinking Water Grid' : 'Smart Model School Digital Laboratories'}`,
      description: `Deliberately injected test case exhibiting high-confidence ${pattern.replace('_', ' ')} anomaly pattern for ML validation.`,
      constituencyId: 100 + i,
      constituencyName: mpInfo.constituency,
      districtId: 200 + i,
      districtName: dist.name,
      stateId: dist.stateId,
      stateName: dist.stateName,
      mpName: mpInfo.mpName,
      agencyId: `ag-${i % 5 + 1}`,
      agencyName: `${AGENCY_TYPES[i % AGENCY_TYPES.length]} Div-${dist.name.slice(0, 3)}`,
      agencyType: AGENCY_TYPES[i % AGENCY_TYPES.length],
      agencyBlacklisted: i % 4 === 0,
      vendorId: isVendorBad ? VENDORS_SAMPLE[7].id : VENDORS_SAMPLE[i % VENDORS_SAMPLE.length].id,
      vendorName: isVendorBad ? VENDORS_SAMPLE[7].name : VENDORS_SAMPLE[i % VENDORS_SAMPLE.length].name,
      vendorBlacklisted: isVendorBad,
      category,
      sanctionedAmount: sanctioned,
      releasedAmount: released,
      utilizedAmount: utilized,
      status: pattern === 'fund_misuse' ? 'delayed' : 'in_progress',
      sanctionedDate: '2024-03-15',
      expectedCompletion: '2025-01-20',
      location: {
        lat: dist.lat + (Math.sin(i * 1.5) * 0.04),
        lng: dist.lng + (Math.cos(i * 1.5) * 0.04),
      },
      isSeedData: true,
      riskScore,
      fraudFlag: pattern,
      verifiedStatus: pattern === 'fund_misuse' ? 'ghost_suspected' : 'disputed',
      lastUpdated: '2026-08-10T11:20:00Z',
    });
    pIndex++;
  });

  // 2. Deliberate Delay Cases (20 cases: sanctioned > 600 days ago, overdue, low progress)
  for (let i = 0; i < 20; i++) {
    const dist: DistrictGeo = DISTRICTS_DATA[(i + 5) % DISTRICTS_DATA.length];
    const mpInfo = findMPForState(dist.stateName, dist.name);
    const sanctioned = 8500000 + (i * 300000);
    const released = Math.round(sanctioned * 0.65);
    const utilized = Math.round(released * 0.55);
    const daysOverdue = 280 + (i * 18);

    const riskInputs = {
      costZScore: 0.8,
      daysOverdue,
      typicalDurationDays: 365,
      utilizationRatio: utilized / released,
      releaseRatio: released / sanctioned,
      maxPaymentRatio: 0.35,
      vendorBlacklisted: false,
      missingDocuments: 1,
      mismatchedAmounts: 1,
    };

    const riskScore = calculateCompositeRisk(riskInputs);

    projects.push({
      id: `proj-delay-${i + 1}`,
      title: `[DELAYED] Community Primary Healthcare & Diagnostic Centre Block-${i + 1}`,
      description: `Critical delay case sanctioned 650+ days ago with repeated missed inspection milestones and unspent sanction balances.`,
      constituencyId: 300 + i,
      constituencyName: mpInfo.constituency,
      districtId: 400 + i,
      districtName: dist.name,
      stateId: dist.stateId,
      stateName: dist.stateName,
      mpName: mpInfo.mpName,
      agencyId: `ag-${(i % 5) + 1}`,
      agencyName: `Zilla Parishad Engineering Division ${dist.name}`,
      agencyType: 'Zilla Parishad',
      agencyBlacklisted: false,
      vendorId: VENDORS_SAMPLE[(i + 2) % VENDORS_SAMPLE.length].id,
      vendorName: VENDORS_SAMPLE[(i + 2) % VENDORS_SAMPLE.length].name,
      vendorBlacklisted: false,
      category: 'health',
      sanctionedAmount: sanctioned,
      releasedAmount: released,
      utilizedAmount: utilized,
      status: 'delayed',
      sanctionedDate: '2023-08-10',
      expectedCompletion: '2024-06-15',
      location: {
        lat: dist.lat + 0.02 + (i * 0.003),
        lng: dist.lng - 0.02 - (i * 0.003),
      },
      isSeedData: true,
      riskScore,
      verifiedStatus: 'field_verified',
      lastUpdated: '2026-09-01T09:15:00Z',
    });
  }

  // 3. Deliberate Duplicate Pairs (10 pairs = 20 projects, sharing same agency, <5km proximity, overlapping dates)
  const baseDuplicateTitles = [
    'Construction of Rural Feeder Link Road',
    'Rehabilitation of Community Rainwater Storage Tank',
    'Upgradation of Gram Panchayat Civic Meeting Hall',
    'Installation of High Mast Solar Street Lighting System',
    'Deepening & Desilting of Agricultural Drainage Canal',
    'Installation of RO Potable Drinking Water Purification Unit',
    'Construction of Anganwadi Child Welfare Centre Block',
    'Paving of Internal Village Concrete CC Roadways',
    'Modernization of Veterinary Health Extension Clinic',
    'Installation of Solar Powered Irrigation Tube Wells',
  ];

  for (let i = 0; i < 10; i++) {
    const dist: DistrictGeo = DISTRICTS_DATA[(i * 3) % DISTRICTS_DATA.length];
    const mpInfo = findMPForState(dist.stateName, dist.name);
    const baseTitle = baseDuplicateTitles[i];
    const baseLat = dist.lat + 0.015;
    const baseLng = dist.lng + 0.015;
    const agency = `PWD Sub-Division ${dist.name}`;
    const vendor = VENDORS_SAMPLE[i % VENDORS_SAMPLE.length];

    const pairAId = `proj-dup-${i + 1}A`;
    const pairBId = `proj-dup-${i + 1}B`;

    const riskInputsA = {
      costZScore: 1.8,
      daysOverdue: 30,
      typicalDurationDays: 240,
      utilizationRatio: 0.8,
      releaseRatio: 0.9,
      maxDuplicateScore: 0.88,
    };
    const riskInputsB = {
      costZScore: 1.9,
      daysOverdue: 45,
      typicalDurationDays: 240,
      utilizationRatio: 0.75,
      releaseRatio: 0.85,
      maxDuplicateScore: 0.88,
    };

    projects.push({
      id: pairAId,
      title: `[DUPLICATE-PAIR #${i + 1}] ${baseTitle} - Phase I`,
      description: `Potential double billing duplicate pair candidate. Highly similar scope and overlapping coordinates with ${pairBId}.`,
      constituencyId: 500 + i,
      constituencyName: mpInfo.constituency,
      districtId: 600 + i,
      districtName: dist.name,
      stateId: dist.stateId,
      stateName: dist.stateName,
      mpName: mpInfo.mpName,
      agencyId: `ag-dup-${i}`,
      agencyName: agency,
      agencyType: 'PWD',
      agencyBlacklisted: false,
      vendorId: vendor.id,
      vendorName: vendor.name,
      vendorBlacklisted: false,
      category: i % 2 === 0 ? 'road' : 'water',
      sanctionedAmount: 6500000,
      releasedAmount: 5500000,
      utilizedAmount: 4400000,
      status: 'in_progress',
      sanctionedDate: '2024-01-20',
      expectedCompletion: '2024-11-30',
      location: { lat: baseLat, lng: baseLng },
      isSeedData: true,
      riskScore: calculateCompositeRisk(riskInputsA),
      fraudFlag: 'near_duplicate',
      isDuplicateCandidate: true,
      duplicateWithId: pairBId,
      verifiedStatus: 'disputed',
      lastUpdated: '2026-08-15T14:00:00Z',
    });

    projects.push({
      id: pairBId,
      title: `[DUPLICATE-PAIR #${i + 1}] ${baseTitle} - Sector A Extensions`,
      description: `Paired counterpart project. Same implementing agency and spatial footprint within 0.8km of ${pairAId}.`,
      constituencyId: 500 + i,
      constituencyName: mpInfo.constituency,
      districtId: 600 + i,
      districtName: dist.name,
      stateId: dist.stateId,
      stateName: dist.stateName,
      mpName: mpInfo.mpName,
      agencyId: `ag-dup-${i}`,
      agencyName: agency,
      agencyType: 'PWD',
      agencyBlacklisted: false,
      vendorId: vendor.id,
      vendorName: vendor.name,
      vendorBlacklisted: false,
      category: i % 2 === 0 ? 'road' : 'water',
      sanctionedAmount: 6200000,
      releasedAmount: 5200000,
      utilizedAmount: 4100000,
      status: 'in_progress',
      sanctionedDate: '2024-02-15',
      expectedCompletion: '2024-12-15',
      location: { lat: baseLat + 0.003, lng: baseLng + 0.004 }, // ~450 meters away
      isSeedData: true,
      riskScore: calculateCompositeRisk(riskInputsB),
      fraudFlag: 'near_duplicate',
      isDuplicateCandidate: true,
      duplicateWithId: pairAId,
      verifiedStatus: 'disputed',
      lastUpdated: '2026-08-15T14:00:00Z',
    });
  }

  // 4. Realistic Standard Projects (Completed, Healthy, In-Progress across the 40 districts)
  const standardTemplates = [
    { title: 'Solar Powered Public Library & Digital Reading Room', category: 'education', cost: 4500000, status: 'completed' as const },
    { title: 'Veterinary Hospital Upgradation & Cattle Shelter', category: 'health', cost: 3800000, status: 'completed' as const },
    { title: 'Panchayat Bhavan Solar Rooftop Installation', category: 'electricity', cost: 2200000, status: 'completed' as const },
    { title: 'Underground Stormwater Drainage Channel Phase-2', category: 'drainage', cost: 7800000, status: 'in_progress' as const },
    { title: 'Rural Multi-Purpose Indoor Sports Complex & Gymnasium', category: 'sports', cost: 9500000, status: 'in_progress' as const },
    { title: 'Installation of Clean Drinking Water Purification Kiosks', category: 'water', cost: 3200000, status: 'completed' as const },
    { title: 'Blacktop Road Connectivity from Gram Panchayat to State Highway', category: 'road', cost: 8900000, status: 'in_progress' as const },
    { title: 'Community Hall for Tribal Welfare and Self-Help Groups', category: 'community_hall', cost: 5600000, status: 'completed' as const },
    { title: 'Construction of Maternity & Child Healthcare Sub-Centre', category: 'health', cost: 6200000, status: 'in_progress' as const },
    { title: 'Rejuvenation of Traditional Village Water Reservoir (Amrit Sarovar)', category: 'water', cost: 4800000, status: 'completed' as const },
  ];

  DISTRICTS_DATA.forEach((dist, dIdx) => {
    const tmpl = standardTemplates[dIdx % standardTemplates.length];
    const mpInfo = findMPForState(dist.stateName, dist.name);
    const isComp = tmpl.status === 'completed';
    const released = tmpl.cost;
    const utilized = isComp ? tmpl.cost : Math.round(tmpl.cost * 0.7);

    const riskInputs = {
      costZScore: 0.1,
      daysOverdue: 0,
      typicalDurationDays: 200,
      utilizationRatio: utilized / released,
      releaseRatio: 1.0,
      maxPaymentRatio: 0.25,
      vendorBlacklisted: false,
    };

    projects.push({
      id: `proj-std-${dIdx + 1}`,
      title: `${tmpl.title} — ${dist.name}`,
      description: `Standard approved constituency infrastructure development scheme sanctioned under Hon'ble MP allocation quota.`,
      constituencyId: 700 + dIdx,
      constituencyName: mpInfo.constituency,
      districtId: 800 + dIdx,
      districtName: dist.name,
      stateId: dist.stateId,
      stateName: dist.stateName,
      mpName: mpInfo.mpName,
      agencyId: `ag-std-${(dIdx % 5) + 1}`,
      agencyName: `${AGENCY_TYPES[dIdx % AGENCY_TYPES.length]} ${dist.name}`,
      agencyType: AGENCY_TYPES[dIdx % AGENCY_TYPES.length],
      agencyBlacklisted: false,
      vendorId: VENDORS_SAMPLE[dIdx % VENDORS_SAMPLE.length].id,
      vendorName: VENDORS_SAMPLE[dIdx % VENDORS_SAMPLE.length].name,
      vendorBlacklisted: false,
      category: tmpl.category,
      sanctionedAmount: tmpl.cost,
      releasedAmount: released,
      utilizedAmount: utilized,
      status: tmpl.status,
      sanctionedDate: isComp ? '2023-05-10' : '2024-04-12',
      expectedCompletion: isComp ? '2024-01-20' : '2025-03-30',
      actualCompletion: isComp ? '2024-01-18' : undefined,
      location: {
        lat: dist.lat + ((dIdx % 2 === 0 ? 1 : -1) * 0.03),
        lng: dist.lng + ((dIdx % 3 === 0 ? 1 : -1) * 0.03),
      },
      isSeedData: true,
      riskScore: calculateCompositeRisk(riskInputs),
      verifiedStatus: isComp ? 'satellite_verified' : 'unverified',
      lastUpdated: '2026-09-05T16:30:00Z',
    });
  });

  // 5. Proposed Schemes (Awaiting administrative sanction / technical vetting)
  const proposedTemplates = [
    { title: 'Automated Weather Monitoring & Climate Advisory Towers', category: 'electricity', cost: 1800000 },
    { title: 'Modern Anganwadi Nutrition & Child Development Hub', category: 'health', cost: 2400000 },
    { title: 'Smart Solar CCTV Surveillance & Traffic Safety Infrastructure', category: 'road', cost: 3500000 },
    { title: 'Community Rainwater Harvesting & Deep Percolation Wells', category: 'water', cost: 1900000 },
    { title: 'Digital Skill Training & Youth Employment Center', category: 'education', cost: 4200000 },
    { title: 'High-Capacity Biomass Solid Waste Composting Facility', category: 'community_hall', cost: 2800000 },
    { title: 'Rural Badminton Academy & Synthetic Floor Arena', category: 'sports', cost: 3100000 },
    { title: 'Perimeter Underground Storm Drain & Silt Trap Construction', category: 'drainage', cost: 4600000 },
    { title: 'Solar Cold Storage Hub for Farmer Producer Groups', category: 'electricity', cost: 5200000 },
    { title: 'Mobile Medical & Telemedicine Emergency Response Van', category: 'health', cost: 3900000 },
  ];

  proposedTemplates.forEach((tmpl, pIdx) => {
    const dist = DISTRICTS_DATA[(pIdx * 4) % DISTRICTS_DATA.length];
    const mpInfo = findMPForState(dist.stateName, dist.name);
    const riskScore = calculateCompositeRisk({
      costZScore: 0.2,
      daysOverdue: 0,
      typicalDurationDays: 180,
      utilizationRatio: 0,
      releaseRatio: 0,
      maxPaymentRatio: 0,
      vendorBlacklisted: false,
    });

    projects.push({
      id: `proj-prop-${pIdx + 1}`,
      title: `[PROPOSED] ${tmpl.title} — ${dist.name}`,
      description: `Scheme recommended by Hon'ble MP ${mpInfo.mpName}; DPR submitted and awaiting technical clearance by District Planning Cell.`,
      constituencyId: 900 + pIdx,
      constituencyName: mpInfo.constituency,
      districtId: 920 + pIdx,
      districtName: dist.name,
      stateId: dist.stateId,
      stateName: dist.stateName,
      mpName: mpInfo.mpName,
      agencyId: `ag-prop-${(pIdx % 4) + 1}`,
      agencyName: `District Planning Cell — ${dist.name}`,
      agencyType: 'Panchayati Raj Institution',
      agencyBlacklisted: false,
      vendorId: 'v-pending',
      vendorName: 'Tender To Be Floated Upon Sanction',
      vendorBlacklisted: false,
      category: tmpl.category,
      sanctionedAmount: tmpl.cost,
      releasedAmount: 0,
      utilizedAmount: 0,
      status: 'proposed',
      sanctionedDate: '2026-07-15',
      expectedCompletion: '2027-03-31',
      location: {
        lat: dist.lat + 0.015,
        lng: dist.lng + 0.012,
      },
      isSeedData: true,
      riskScore,
      verifiedStatus: 'unverified',
      lastUpdated: '2026-09-12T10:00:00Z',
    });
  });

  // 6. Sanctioned Schemes (Administrative approval granted; tender awarded / ground-breaking pending)
  const sanctionedTemplates = [
    { title: 'Elevated Potable Drinking Water Reservoir (5 Lakh Ltr)', category: 'water', cost: 7200000 },
    { title: 'Multi-Span Concrete Bridge across Agricultural Canal', category: 'road', cost: 11500000 },
    { title: 'STEM Innovation Digital Laboratories in 5 Schools', category: 'education', cost: 6500000 },
    { title: 'District Sub-Divisional Ayurvedic Hospital Wing', category: 'health', cost: 8400000 },
    { title: 'Flood Mitigation Concrete Embankment & Culvert Reinforcement', category: 'drainage', cost: 9200000 },
    { title: 'High-Mast LED Illumination Grid for Gram Panchayats', category: 'electricity', cost: 2800000 },
    { title: 'Divyangjan Accessible Civic Community Welfare Hall', category: 'community_hall', cost: 4800000 },
    { title: 'Grassroots Athletic Running Track & Multi-Sports Pavilion', category: 'sports', cost: 7500000 },
    { title: 'Rural Piped Water Supply Network Distribution Pipeline', category: 'water', cost: 8900000 },
    { title: 'All-Weather Bituminous Pavement Linking Tribal Hamlets', category: 'road', cost: 10400000 },
  ];

  sanctionedTemplates.forEach((tmpl, sIdx) => {
    const dist = DISTRICTS_DATA[(sIdx * 3 + 2) % DISTRICTS_DATA.length];
    const mpInfo = findMPForState(dist.stateName, dist.name);
    const released = Math.round(tmpl.cost * 0.4); // 40% first installment released
    const vendor = VENDORS_SAMPLE[sIdx % VENDORS_SAMPLE.length];
    const riskScore = calculateCompositeRisk({
      costZScore: 0.15,
      daysOverdue: 0,
      typicalDurationDays: 240,
      utilizationRatio: 0,
      releaseRatio: 0.4,
      maxPaymentRatio: 0.2,
      vendorBlacklisted: false,
    });

    projects.push({
      id: `proj-sanc-${sIdx + 1}`,
      title: `[SANCTIONED] ${tmpl.title} — ${dist.name}`,
      description: `Formal administrative sanction issued by District Magistrate. First tranche released to executing agency; work order executed.`,
      constituencyId: 950 + sIdx,
      constituencyName: mpInfo.constituency,
      districtId: 960 + sIdx,
      districtName: dist.name,
      stateId: dist.stateId,
      stateName: dist.stateName,
      mpName: mpInfo.mpName,
      agencyId: `ag-sanc-${(sIdx % 3) + 1}`,
      agencyName: `Public Works Division ${dist.name}`,
      agencyType: 'PWD',
      agencyBlacklisted: false,
      vendorId: vendor.id,
      vendorName: vendor.name,
      vendorBlacklisted: false,
      category: tmpl.category,
      sanctionedAmount: tmpl.cost,
      releasedAmount: released,
      utilizedAmount: 0,
      status: 'sanctioned',
      sanctionedDate: '2026-05-18',
      expectedCompletion: '2027-01-30',
      location: {
        lat: dist.lat - 0.018,
        lng: dist.lng - 0.015,
      },
      isSeedData: true,
      riskScore,
      verifiedStatus: 'unverified',
      lastUpdated: '2026-09-15T14:30:00Z',
    });
  });

  return projects;
}

export const SEED_PROJECTS: ProjectItem[] = generateSeedProjects();
