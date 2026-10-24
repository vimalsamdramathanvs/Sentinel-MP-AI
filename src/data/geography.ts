/**
 * Indian States and Districts Geography metadata
 * Covering 8 representative states and 40 operational districts (Phase 23 §3)
 */

export interface DistrictGeo {
  name: string;
  stateId: number;
  stateName: string;
  lat: number;
  lng: number;
}

export const STATES_MAP: Record<number, { name: string; code: string; capital: string }> = {
  1: { name: "Karnataka", code: "KA", capital: "Bengaluru" },
  2: { name: "Maharashtra", code: "MH", capital: "Mumbai" },
  3: { name: "Uttar Pradesh", code: "UP", capital: "Lucknow" },
  4: { name: "Tamil Nadu", code: "TN", capital: "Chennai" },
  5: { name: "West Bengal", code: "WB", capital: "Kolkata" },
  6: { name: "Rajasthan", code: "RJ", capital: "Jaipur" },
  7: { name: "Gujarat", code: "GJ", capital: "Gandhinagar" },
  8: { name: "Bihar", code: "BR", capital: "Patna" },
};

export const DISTRICTS_DATA: DistrictGeo[] = [
  // Karnataka (stateId: 1)
  { name: "Bengaluru Urban", stateId: 1, stateName: "Karnataka", lat: 12.9716, lng: 77.5946 },
  { name: "Mysuru", stateId: 1, stateName: "Karnataka", lat: 12.2958, lng: 76.6394 },
  { name: "Belagavi", stateId: 1, stateName: "Karnataka", lat: 15.8497, lng: 74.4977 },
  { name: "Tumakuru", stateId: 1, stateName: "Karnataka", lat: 13.3379, lng: 77.1010 },
  { name: "Ballari", stateId: 1, stateName: "Karnataka", lat: 15.1394, lng: 76.9214 },

  // Maharashtra (stateId: 2)
  { name: "Mumbai City", stateId: 2, stateName: "Maharashtra", lat: 19.0760, lng: 72.8777 },
  { name: "Pune", stateId: 2, stateName: "Maharashtra", lat: 18.5204, lng: 73.8567 },
  { name: "Nagpur", stateId: 2, stateName: "Maharashtra", lat: 21.1458, lng: 79.0882 },
  { name: "Nashik", stateId: 2, stateName: "Maharashtra", lat: 19.9975, lng: 73.7898 },
  { name: "Aurangabad", stateId: 2, stateName: "Maharashtra", lat: 19.8762, lng: 75.3433 },

  // Uttar Pradesh (stateId: 3)
  { name: "Lucknow", stateId: 3, stateName: "Uttar Pradesh", lat: 26.8467, lng: 80.9462 },
  { name: "Kanpur Nagar", stateId: 3, stateName: "Uttar Pradesh", lat: 26.4499, lng: 80.3319 },
  { name: "Varanasi", stateId: 3, stateName: "Uttar Pradesh", lat: 25.3176, lng: 82.9739 },
  { name: "Agra", stateId: 3, stateName: "Uttar Pradesh", lat: 27.1767, lng: 78.0081 },
  { name: "Prayagraj", stateId: 3, stateName: "Uttar Pradesh", lat: 25.4358, lng: 81.8463 },

  // Tamil Nadu (stateId: 4)
  { name: "Chennai", stateId: 4, stateName: "Tamil Nadu", lat: 13.0827, lng: 80.2707 },
  { name: "Coimbatore", stateId: 4, stateName: "Tamil Nadu", lat: 11.0168, lng: 76.9558 },
  { name: "Madurai", stateId: 4, stateName: "Tamil Nadu", lat: 9.9252, lng: 78.1198 },
  { name: "Tiruchirappalli", stateId: 4, stateName: "Tamil Nadu", lat: 10.7905, lng: 78.7047 },
  { name: "Salem", stateId: 4, stateName: "Tamil Nadu", lat: 11.6643, lng: 78.1460 },

  // West Bengal (stateId: 5)
  { name: "Kolkata", stateId: 5, stateName: "West Bengal", lat: 22.5726, lng: 88.3639 },
  { name: "Howrah", stateId: 5, stateName: "West Bengal", lat: 22.5958, lng: 88.2636 },
  { name: "North 24 Parganas", stateId: 5, stateName: "West Bengal", lat: 22.6169, lng: 88.4327 },
  { name: "Darjeeling", stateId: 5, stateName: "West Bengal", lat: 27.0410, lng: 88.2627 },
  { name: "Bardhaman", stateId: 5, stateName: "West Bengal", lat: 23.2324, lng: 87.8615 },

  // Rajasthan (stateId: 6)
  { name: "Jaipur", stateId: 6, stateName: "Rajasthan", lat: 26.9124, lng: 75.7873 },
  { name: "Jodhpur", stateId: 6, stateName: "Rajasthan", lat: 26.2389, lng: 73.0243 },
  { name: "Udaipur", stateId: 6, stateName: "Rajasthan", lat: 24.5854, lng: 73.7125 },
  { name: "Kota", stateId: 6, stateName: "Rajasthan", lat: 25.2138, lng: 75.8648 },
  { name: "Bikaner", stateId: 6, stateName: "Rajasthan", lat: 28.0229, lng: 73.3119 },

  // Gujarat (stateId: 7)
  { name: "Ahmedabad", stateId: 7, stateName: "Gujarat", lat: 23.0225, lng: 72.5714 },
  { name: "Surat", stateId: 7, stateName: "Gujarat", lat: 21.1702, lng: 72.8311 },
  { name: "Vadodara", stateId: 7, stateName: "Gujarat", lat: 22.3072, lng: 73.1812 },
  { name: "Rajkot", stateId: 7, stateName: "Gujarat", lat: 22.3039, lng: 70.8022 },
  { name: "Bhavnagar", stateId: 7, stateName: "Gujarat", lat: 21.7645, lng: 72.1519 },

  // Bihar (stateId: 8)
  { name: "Patna", stateId: 8, stateName: "Bihar", lat: 25.5941, lng: 85.1376 },
  { name: "Gaya", stateId: 8, stateName: "Bihar", lat: 24.7955, lng: 85.0002 },
  { name: "Bhagalpur", stateId: 8, stateName: "Bihar", lat: 25.2445, lng: 86.9842 },
  { name: "Muzaffarpur", stateId: 8, stateName: "Bihar", lat: 26.1225, lng: 85.3906 },
  { name: "Darbhanga", stateId: 8, stateName: "Bihar", lat: 26.1542, lng: 85.8918 },
];

export const PROJECT_CATEGORIES = [
  "road",
  "water",
  "education",
  "health",
  "drainage",
  "electricity",
  "community_hall",
  "sports",
] as const;

export const AGENCY_TYPES = [
  "PWD",
  "Zilla Parishad",
  "Municipal Corporation",
  "NGO",
  "Panchayati Raj Institution",
] as const;
