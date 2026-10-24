/**
 * Historical 12-Month Fund Utilization Trends for Indian Parliamentary Constituencies
 * Tracks monthly progress, cumulative expenditure, and utilization rates across FY 2025-26.
 */

export interface MonthlyConstituencyMetric {
  monthIndex: number;
  monthLabel: string; // e.g., 'Apr 25', 'May 25'
  fullMonth: string; // e.g., 'April 2025'
  date: Date;
  utilizationRate: number; // percentage (0 - 100)
  cumulativeSanctionedCr: number; // ₹ Crore
  cumulativeReleasedCr: number; // ₹ Crore
  cumulativeUtilizedCr: number; // ₹ Crore
  monthlyExpenditureLakhs: number; // ₹ Lakhs spent this month
  activeWorksCount: number;
  anomaliesFlagged: number;
}

export interface ConstituencyTrendSeries {
  id: string;
  name: string;
  state: string;
  mpName: string;
  category: 'Metropolitan' | 'Tier-2 Urban' | 'Semi-Urban & Rural' | 'Aspirational';
  totalSanctionedCr: number;
  currentUtilizationRate: number; // Last month's rate
  netGrowthPctPoints: number; // 12-month change in percentage points
  performanceStatus: 'accelerating' | 'steady' | 'lagging' | 'critical';
  color: string;
  monthlyData: MonthlyConstituencyMetric[];
}

export const TREND_MONTHS_LABELS = [
  'Apr 25', 'May 25', 'Jun 25', 'Jul 25', 'Aug 25', 'Sep 25',
  'Oct 25', 'Nov 25', 'Dec 25', 'Jan 26', 'Feb 26', 'Mar 26'
];

export const TREND_MONTHS_DATES = [
  new Date(2025, 3, 1),
  new Date(2025, 4, 1),
  new Date(2025, 5, 1),
  new Date(2025, 6, 1),
  new Date(2025, 7, 1),
  new Date(2025, 8, 1),
  new Date(2025, 9, 1),
  new Date(2025, 10, 1),
  new Date(2025, 11, 1),
  new Date(2026, 0, 1),
  new Date(2026, 1, 1),
  new Date(2026, 2, 1),
];

// Helper to generate monthly progression
function generateSeries(
  id: string,
  name: string,
  state: string,
  mpName: string,
  category: 'Metropolitan' | 'Tier-2 Urban' | 'Semi-Urban & Rural' | 'Aspirational',
  rates: number[],
  totalSanctioned: number,
  color: string,
  baseWorks: number
): ConstituencyTrendSeries {
  const monthlyData: MonthlyConstituencyMetric[] = rates.map((rate, i) => {
    const releasedCr = Math.round(totalSanctioned * 0.92 * 100) / 100;
    const utilizedCr = Math.round((releasedCr * (rate / 100)) * 100) / 100;
    const prevRate = i === 0 ? Math.max(0, rate - 3) : rates[i - 1];
    const rateDelta = Math.max(0, rate - prevRate);
    const monthlyExpLakhs = Math.round(rateDelta * (releasedCr * 100) / 100 * 10) / 10;

    return {
      monthIndex: i,
      monthLabel: TREND_MONTHS_LABELS[i],
      fullMonth: TREND_MONTHS_DATES[i].toLocaleString('en-US', { month: 'long', year: 'numeric' }),
      date: TREND_MONTHS_DATES[i],
      utilizationRate: rate,
      cumulativeSanctionedCr: totalSanctioned,
      cumulativeReleasedCr: releasedCr,
      cumulativeUtilizedCr: utilizedCr,
      monthlyExpenditureLakhs: monthlyExpLakhs,
      activeWorksCount: baseWorks + Math.floor(i * 1.2),
      anomaliesFlagged: rate > 80 && i < 6 ? 2 : rate < 30 && i > 8 ? 3 : 0,
    };
  });

  const firstRate = rates[0];
  const lastRate = rates[rates.length - 1];
  const netGrowth = Math.round((lastRate - firstRate) * 10) / 10;

  let status: 'accelerating' | 'steady' | 'lagging' | 'critical' = 'steady';
  if (lastRate >= 78 && netGrowth >= 25) status = 'accelerating';
  else if (lastRate < 48) status = 'critical';
  else if (lastRate < 60) status = 'lagging';

  return {
    id,
    name,
    state,
    mpName,
    category,
    totalSanctionedCr: totalSanctioned,
    currentUtilizationRate: lastRate,
    netGrowthPctPoints: netGrowth,
    performanceStatus: status,
    color,
    monthlyData,
  };
}

export const CONSTITUENCY_TREND_SERIES: ConstituencyTrendSeries[] = [
  generateSeries(
    'varanasi',
    'Varanasi',
    'Uttar Pradesh',
    'Afzal Ansari / Local MP',
    'Tier-2 Urban',
    [32.4, 36.1, 41.5, 46.8, 51.2, 57.6, 64.2, 69.8, 74.5, 79.1, 83.4, 87.2],
    17.5,
    '#4f46e5', // Indigo
    42
  ),
  generateSeries(
    'bengaluru-urban',
    'Bengaluru South',
    'Karnataka',
    'Tejasvi Surya',
    'Metropolitan',
    [41.0, 44.5, 48.2, 52.0, 56.4, 60.1, 63.8, 67.5, 71.2, 75.0, 78.4, 81.5],
    18.2,
    '#059669', // Emerald
    58
  ),
  generateSeries(
    'pune',
    'Pune',
    'Maharashtra',
    'Murlidhar Mohol',
    'Metropolitan',
    [28.5, 31.8, 35.2, 38.9, 43.1, 47.6, 52.4, 57.0, 62.1, 66.8, 71.5, 75.2],
    16.8,
    '#0284c7', // Sky blue
    46
  ),
  generateSeries(
    'new-delhi',
    'New Delhi',
    'Delhi',
    'Bansuri Swaraj',
    'Metropolitan',
    [35.0, 39.2, 43.8, 48.1, 52.7, 57.0, 62.5, 67.8, 72.4, 76.9, 81.2, 84.6],
    15.4,
    '#7c3aed', // Violet
    39
  ),
  generateSeries(
    'hyderabad',
    'Hyderabad',
    'Telangana',
    'Asaduddin Owaisi',
    'Metropolitan',
    [38.2, 42.0, 46.5, 50.8, 55.6, 60.2, 65.1, 69.7, 74.2, 78.6, 82.3, 85.8],
    17.0,
    '#d97706', // Amber
    51
  ),
  generateSeries(
    'chennai-central',
    'Chennai Central',
    'Tamil Nadu',
    'Dayanidhi Maran',
    'Metropolitan',
    [30.2, 33.6, 37.4, 41.5, 45.8, 50.2, 55.4, 60.8, 65.9, 70.4, 74.8, 78.2],
    16.0,
    '#0d9488', // Teal
    44
  ),
  generateSeries(
    'jaipur',
    'Jaipur',
    'Rajasthan',
    'Manju Sharma',
    'Tier-2 Urban',
    [25.4, 28.6, 32.1, 35.8, 39.5, 44.0, 48.8, 53.6, 58.2, 63.0, 67.4, 71.0],
    15.8,
    '#ea580c', // Orange
    36
  ),
  generateSeries(
    'lucknow',
    'Lucknow',
    'Uttar Pradesh',
    'Rajnath Singh',
    'Tier-2 Urban',
    [27.0, 30.2, 33.8, 37.5, 41.2, 45.9, 50.4, 55.2, 60.1, 64.8, 69.2, 73.5],
    17.2,
    '#db2777', // Pink
    48
  ),
  generateSeries(
    'patna-sahib',
    'Patna Sahib',
    'Bihar',
    'Ravi Shankar Prasad',
    'Tier-2 Urban',
    [18.5, 20.8, 23.4, 26.2, 29.5, 33.2, 37.8, 42.1, 46.5, 50.2, 54.1, 58.4],
    16.5,
    '#dc2626', // Red
    38
  ),
  generateSeries(
    'kolkata-north',
    'Kolkata North',
    'West Bengal',
    'Sudip Bandyopadhyay',
    'Metropolitan',
    [15.2, 17.5, 19.8, 22.4, 25.6, 29.0, 32.8, 36.5, 40.2, 43.8, 47.2, 51.0],
    14.7,
    '#9333ea', // Purple
    32
  ),
];

// National MoSPI Recommended Benchmark rate for 12 months
export const NATIONAL_BENCHMARK_RATES = [
  { monthLabel: 'Apr 25', rate: 30.0 },
  { monthLabel: 'May 25', rate: 34.0 },
  { monthLabel: 'Jun 25', rate: 38.5 },
  { monthLabel: 'Jul 25', rate: 43.0 },
  { monthLabel: 'Aug 25', rate: 47.5 },
  { monthLabel: 'Sep 25', rate: 52.0 },
  { monthLabel: 'Oct 25', rate: 57.0 },
  { monthLabel: 'Nov 25', rate: 62.0 },
  { monthLabel: 'Dec 25', rate: 67.5 },
  { monthLabel: 'Jan 26', rate: 72.0 },
  { monthLabel: 'Feb 26', rate: 76.5 },
  { monthLabel: 'Mar 26', rate: 80.0 },
];
