import React, { useState, useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import { SEED_PROJECTS } from '../data/seedProjects';
import { DISTRICTS_DATA, STATES_MAP } from '../data/geography';
import { getFraudHotspotClusters, getTimelinePlaybackFrames } from '../data/gisEngine';
import { getRiskColor } from '../data/riskEngine';
import { ProjectItem, FraudHotspotCluster } from '../types';
import {
  Layers,
  Play,
  Pause,
  RotateCcw,
  Flame,
  ShieldAlert,
  MapPin,
  Eye,
  Satellite,
  Compass,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  SlidersHorizontal,
  Info,
  ExternalLink,
  ChevronRight,
  Crosshair,
  FileText,
  Search,
  X,
  Sparkles,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

interface GisMapViewProps {
  onSelectProject: (p: ProjectItem, openDossier?: boolean) => void;
  initialProjectId?: string;
  initialStateId?: number;
}

type BasemapType = 'streets' | 'osm' | 'satellite' | 'dark';

// State centers for quick flyTo
const STATE_COORDINATES: Record<number, { lat: number; lng: number; zoom: number }> = {
  1: { lat: 14.5204, lng: 75.7224, zoom: 7 }, // Karnataka
  2: { lat: 19.7515, lng: 75.7139, zoom: 7 }, // Maharashtra
  3: { lat: 26.8467, lng: 80.9462, zoom: 7 }, // Uttar Pradesh
  4: { lat: 11.1271, lng: 78.6569, zoom: 7 }, // Tamil Nadu
  5: { lat: 22.9868, lng: 87.8550, zoom: 7 }, // West Bengal
  6: { lat: 27.0238, lng: 74.2179, zoom: 6 }, // Rajasthan
  7: { lat: 22.2587, lng: 71.1924, zoom: 7 }, // Gujarat
  8: { lat: 25.0961, lng: 85.3131, zoom: 7 }, // Bihar
};

export const GisMapView: React.FC<GisMapViewProps> = ({
  onSelectProject,
  initialProjectId,
  initialStateId,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const hotspotsLayerRef = useRef<L.LayerGroup | null>(null);
  const heatmapLayerRef = useRef<L.LayerGroup | null>(null);

  // Load all projects including any custom/locally created ones
  const [allProjects, setAllProjects] = useState<ProjectItem[]>(() => {
    let customProjects: ProjectItem[] = [];
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('mplads_custom_projects');
        if (saved) customProjects = JSON.parse(saved);
      }
    } catch (_) {}
    return [...customProjects, ...SEED_PROJECTS];
  });

  const [basemap, setBasemap] = useState<BasemapType>('streets');
  const [selectedStateId, setSelectedStateId] = useState<number | null>(initialStateId ?? null);
  const [minRisk, setMinRisk] = useState<number>(0);
  const [showHotspots, setShowHotspots] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCluster, setSelectedCluster] = useState<FraudHotspotCluster | null>(null);
  const [popupProject, setPopupProject] = useState<ProjectItem | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Timeline playback state
  const { months, frames } = useMemo(() => getTimelinePlaybackFrames(allProjects), [allProjects]);
  const [timelineIndex, setTimelineIndex] = useState(months.length - 1);
  const [isPlaying, setIsPlaying] = useState(false);

  // Handle initial project focus if provided
  useEffect(() => {
    if (!initialProjectId) return;
    const proj = allProjects.find((p) => p.id === initialProjectId);
    if (proj) {
      setPopupProject(proj);
      const timer = setTimeout(() => {
        mapInstanceRef.current?.flyTo([proj.location.lat, proj.location.lng], 13, { duration: 1.0 });
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [initialProjectId, allProjects]);

  // Auto playback loop
  useEffect(() => {
    let timer: any;
    if (isPlaying) {
      timer = setInterval(() => {
        setTimelineIndex((prev) => (prev + 1 >= months.length ? 0 : prev + 1));
      }, 1400);
    }
    return () => clearInterval(timer);
  }, [isPlaying, months.length]);

  const clusters = useMemo(() => getFraudHotspotClusters(), []);

  // Filtered projects based on State, Risk, Category, and Search
  const activeProjects = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return allProjects.filter((p) => {
      if (selectedStateId && p.stateId !== selectedStateId) return false;
      if (p.riskScore.compositeScore < minRisk) return false;
      if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
      if (q) {
        const matchesId = p.id.toLowerCase().includes(q);
        const matchesTitle = p.title.toLowerCase().includes(q);
        const matchesDistrict = p.districtName.toLowerCase().includes(q);
        const matchesState = p.stateName.toLowerCase().includes(q);
        const matchesMp = p.mpName?.toLowerCase().includes(q);
        const matchesVendor = p.vendorName?.toLowerCase().includes(q);
        if (!matchesId && !matchesTitle && !matchesDistrict && !matchesState && !matchesMp && !matchesVendor) {
          return false;
        }
      }
      return true;
    });
  }, [allProjects, selectedStateId, minRisk, selectedCategory, searchQuery]);

  // Current frame data for active epoch
  const currentEpochMonth = months[timelineIndex] || months[months.length - 1];
  const currentFrameItems = frames[currentEpochMonth] || [];
  const frameMap = useMemo(() => {
    const map = new Map<string, { progressPct: number; status: string; isSanctioned: boolean }>();
    currentFrameItems.forEach((f) => map.set(f.id, f));
    return map;
  }, [currentFrameItems]);

  // Tile URL mapping
  const getTileUrl = (type: BasemapType) => {
    switch (type) {
      case 'satellite':
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      case 'osm':
        return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      case 'dark':
        return 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
      case 'streets':
      default:
        return 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
    }
  };

  const getTileAttribution = (type: BasemapType) => {
    switch (type) {
      case 'satellite':
        return '&copy; Esri, Maxar, Earthstar Geographics, ISRO Bhuvan';
      case 'osm':
        return '&copy; OpenStreetMap contributors';
      case 'dark':
      case 'streets':
      default:
        return '&copy; CARTO, OpenStreetMap contributors';
    }
  };

  // 1. Initialize Leaflet Map safely
  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Safety guard against re-initialization of already active Leaflet instance
    if ((mapContainerRef.current as any)._leaflet_id) {
      delete (mapContainerRef.current as any)._leaflet_id;
    }
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Center on India
    const map = L.map(mapContainerRef.current, {
      center: [22.3511, 78.6677],
      zoom: 5,
      minZoom: 4,
      maxZoom: 18,
      zoomControl: false,
    });

    tileLayerRef.current = L.tileLayer(getTileUrl('streets'), {
      attribution: getTileAttribution('streets'),
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    hotspotsLayerRef.current = L.layerGroup().addTo(map);
    heatmapLayerRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    // ResizeObserver ensures Leaflet never renders partial or gray tiles
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && mapContainerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        map.invalidateSize();
      });
      resizeObserver.observe(mapContainerRef.current);
    }

    const initTimer = setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      clearTimeout(initTimer);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Invalidate map size when toggling fullscreen
  useEffect(() => {
    const timer = setTimeout(() => {
      mapInstanceRef.current?.invalidateSize();
    }, 200);
    return () => clearTimeout(timer);
  }, [isFullscreen]);

  // 2. Handle Basemap Change
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    tileLayerRef.current.setUrl(getTileUrl(basemap));
  }, [basemap]);

  // 3. Handle FlyTo when State filter changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    if (selectedStateId && STATE_COORDINATES[selectedStateId]) {
      const { lat, lng, zoom } = STATE_COORDINATES[selectedStateId];
      mapInstanceRef.current.flyTo([lat, lng], zoom, { duration: 1.2 });
    } else if (selectedStateId === null) {
      mapInstanceRef.current.flyTo([22.3511, 78.6677], 5, { duration: 1.0 });
    }
  }, [selectedStateId]);

  // 4. Update Hotspots & Density Layers
  useEffect(() => {
    if (!hotspotsLayerRef.current || !heatmapLayerRef.current) return;

    hotspotsLayerRef.current.clearLayers();
    heatmapLayerRef.current.clearLayers();

    if (showHotspots) {
      clusters.forEach((c) => {
        // Outer pulsing ring
        const outerCircle = L.circle([c.lat, c.lng], {
          radius: c.radiusKm * 1000,
          color: '#ef4444',
          fillColor: '#ef4444',
          fillOpacity: 0.15,
          weight: 2,
          dashArray: '6, 6',
        });

        // Center marker
        const centerMarker = L.circleMarker([c.lat, c.lng], {
          radius: 9,
          color: '#ffffff',
          fillColor: '#dc2626',
          fillOpacity: 0.95,
          weight: 2,
        });

        const tooltipContent = `
          <div style="font-family: inherit; font-size: 11px; line-height: 1.4;">
            <strong style="color: #dc2626;">DBSCAN Hotspot #${c.clusterId}</strong><br/>
            <strong>${c.districtName}</strong>, ${c.stateName}<br/>
            <span>Projects: <b>${c.projectCount}</b> | Avg Risk: <b style="color: #ef4444;">${c.avgRiskScore}/100</b></span><br/>
            <span style="font-size: 10px; color: #64748b;">${c.topPattern}</span>
          </div>
        `;

        outerCircle.bindTooltip(tooltipContent, { sticky: true, className: 'leaflet-custom-tooltip' });
        centerMarker.bindTooltip(tooltipContent, { sticky: true, className: 'leaflet-custom-tooltip' });

        const handleHotspotClick = (e: L.LeafletMouseEvent) => {
          L.DomEvent.stopPropagation(e);
          setSelectedCluster(c);
          mapInstanceRef.current?.flyTo([c.lat, c.lng], 11, { duration: 1.2 });
        };

        outerCircle.on('click', handleHotspotClick);
        centerMarker.on('click', handleHotspotClick);

        outerCircle.addTo(hotspotsLayerRef.current!);
        centerMarker.addTo(hotspotsLayerRef.current!);
      });
    }

    if (showHeatmap) {
      activeProjects.forEach((p) => {
        const score = p.riskScore.compositeScore;
        const color = score >= 85 ? '#ef4444' : score >= 70 ? '#f97316' : score >= 40 ? '#f59e0b' : '#10b981';
        const heatHalo = L.circle([p.location.lat, p.location.lng], {
          radius: (score >= 70 ? 25 : 15) * 1000,
          color: 'transparent',
          fillColor: color,
          fillOpacity: 0.22,
        });
        heatHalo.addTo(heatmapLayerRef.current!);
      });
    }
  }, [clusters, showHotspots, showHeatmap, activeProjects]);

  // 5. Update Project Pins with coordinate jitter for duplicate co-locations & timeline epoch awareness
  useEffect(() => {
    if (!markersLayerRef.current) return;
    markersLayerRef.current.clearLayers();

    // Group projects by exact coordinates to identify co-located duplicates
    const coordGroups = new Map<string, ProjectItem[]>();
    activeProjects.forEach((p) => {
      const key = `${p.location.lat.toFixed(5)}_${p.location.lng.toFixed(5)}`;
      if (!coordGroups.has(key)) coordGroups.set(key, []);
      coordGroups.get(key)!.push(p);
    });

    activeProjects.forEach((p) => {
      const score = p.riskScore.compositeScore;
      const color = getRiskColor(score);
      const isCritical = score >= 85;

      // Coordinate jitter calculation if co-located duplicates exist
      const coordKey = `${p.location.lat.toFixed(5)}_${p.location.lng.toFixed(5)}`;
      const coLocated = coordGroups.get(coordKey) || [];
      const isDuplicateCluster = coLocated.length > 1;

      let displayLat = p.location.lat;
      let displayLng = p.location.lng;

      if (isDuplicateCluster) {
        const indexInGroup = coLocated.indexOf(p);
        const angle = (indexInGroup / coLocated.length) * 2 * Math.PI;
        // ~250 meter offset so both pins are distinctly visible and clickable
        displayLat += 0.0022 * Math.cos(angle);
        displayLng += 0.0022 * Math.sin(angle);
      }

      // Check current timeline status for this project
      const timelineState = frameMap.get(p.id);
      const isSanctionedInEpoch = timelineState ? timelineState.isSanctioned : true;
      const progressInEpoch = timelineState ? timelineState.progressPct : Math.round((p.utilizedAmount / p.sanctionedAmount) * 100);

      // Custom HTML Pin
      const iconHtml = `
        <div style="
          position: relative;
          width: 26px;
          height: 26px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          opacity: ${isSanctionedInEpoch ? '1.0' : '0.35'};
          transition: opacity 0.3s;
        ">
          ${
            isCritical && isSanctionedInEpoch
              ? `<span style="
                  position: absolute;
                  width: 28px;
                  height: 28px;
                  border-radius: 9999px;
                  background: rgba(239, 68, 68, 0.45);
                  animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
                "></span>`
              : ''
          }
          ${
            isDuplicateCluster
              ? `<span style="
                  position: absolute;
                  top: -6px;
                  right: -6px;
                  background: #7c3aed;
                  color: #ffffff;
                  font-size: 9px;
                  font-weight: 800;
                  border-radius: 9999px;
                  width: 14px;
                  height: 14px;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  border: 1.5px solid #ffffff;
                  box-shadow: 0 1px 3px rgba(0,0,0,0.3);
                ">2x</span>`
              : ''
          }
          <div style="
            width: 14px;
            height: 14px;
            border-radius: 9999px;
            background-color: ${color};
            border: 2.5px solid #ffffff;
            box-shadow: 0 2px 5px rgba(0,0,0,0.35);
            transition: transform 0.2s;
          "></div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-pin-marker',
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });

      const marker = L.marker([displayLat, displayLng], { icon: customIcon });

      // Quick hover tooltip
      marker.bindTooltip(
        `
        <div style="font-family: inherit; font-size: 11px; max-width: 230px; line-height: 1.35;">
          <div style="font-weight: 700; color: #0f172a; margin-bottom: 2px;">${p.title}</div>
          <div style="color: #64748b; font-size: 10px;">${p.districtName}, ${p.stateName}</div>
          <div style="margin-top: 4px; display: flex; justify-content: space-between; font-size: 10px; border-top: 1px solid #e2e8f0; pt: 3px;">
            <span>Sanction: <b>₹${(p.sanctionedAmount / 1e7).toFixed(2)} Cr</b></span>
            <span style="font-weight: 700; color: ${color};">Risk: ${score}/100</span>
          </div>
          ${
            isDuplicateCluster
              ? `<div style="color: #7c3aed; font-weight: 700; font-size: 10px; margin-top: 3px;">⚠️ Co-Located Near-Duplicate Sanction</div>`
              : ''
          }
          <div style="font-size: 10px; color: #0284c7; margin-top: 2px;">
            Progress in ${currentEpochMonth}: <b>${progressInEpoch}%</b> (${isSanctionedInEpoch ? 'Sanctioned' : 'Pre-Sanction'})
          </div>
        </div>
        `,
        { direction: 'top', offset: [0, -12], className: 'leaflet-custom-tooltip' }
      );

      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        setPopupProject(p);
      });

      marker.addTo(markersLayerRef.current!);
    });
  }, [activeProjects, frameMap, currentEpochMonth]);

  const handleResetView = () => {
    setSelectedStateId(null);
    setMinRisk(0);
    setSelectedCategory('all');
    setSearchQuery('');
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([22.3511, 78.6677], 5, { duration: 1.0 });
    }
  };

  const handleZoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };

  const handleZoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  // Search match selection
  const handleSelectSearchMatch = (project: ProjectItem) => {
    setPopupProject(project);
    setSearchQuery('');
    mapInstanceRef.current?.flyTo([project.location.lat, project.location.lng], 14, { duration: 1.0 });
  };

  // Check if any filters are active
  const isFiltered = selectedStateId !== null || minRisk > 0 || selectedCategory !== 'all' || searchQuery.trim() !== '';

  return (
    <div className={`p-4 sm:p-6 space-y-4 max-w-7xl mx-auto ${isFullscreen ? 'fixed inset-0 z-[2000] p-4 bg-slate-950/95 overflow-y-auto max-w-none' : ''}`}>
      {/* GIS Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold tracking-wider uppercase">
              Live Geospatial Surveillance
            </span>
            <span className="text-xs text-slate-500 font-mono">EPSG:4326 WGS84 • 40 Operational Districts</span>
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            <Compass size={22} className="text-blue-600" />
            <span className={isFullscreen ? 'text-white' : 'text-slate-900'}>
              National Spatial GIS & Fraud Hotspot Map
            </span>
          </h1>
          <p className={`text-xs mt-0.5 ${isFullscreen ? 'text-slate-400' : 'text-slate-500'}`}>
            High-precision cartography with DBSCAN spatial clumping, multi-spectral satellite basemaps, and co-located project detection.
          </p>
        </div>

        {/* Filter Bar Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick Search Input */}
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Search ID, title, MP, district..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-7 py-1.5 text-xs font-medium bg-white text-slate-800 border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs w-48 sm:w-56"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={13} />
              </button>
            )}
          </div>

          <select
            value={selectedStateId ?? ''}
            onChange={(e) => setSelectedStateId(e.target.value ? Number(e.target.value) : null)}
            className="px-3 py-1.5 text-xs font-semibold bg-white text-slate-800 border border-slate-300 rounded-lg focus:outline-none shadow-2xs"
          >
            <option value="">All 8 Operational States</option>
            {Object.entries(STATES_MAP).map(([id, s]) => (
              <option key={id} value={id}>
                {s.name} ({s.code})
              </option>
            ))}
          </select>

          <select
            value={minRisk}
            onChange={(e) => setMinRisk(Number(e.target.value))}
            className="px-3 py-1.5 text-xs font-semibold bg-white text-slate-800 border border-slate-300 rounded-lg focus:outline-none shadow-2xs"
          >
            <option value="0">All Risk Scores</option>
            <option value="40">Medium Risk (≥40)</option>
            <option value="70">High Risk (≥70)</option>
            <option value="85">Critical Risk Only (≥85)</option>
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold bg-white text-slate-800 border border-slate-300 rounded-lg focus:outline-none shadow-2xs"
          >
            <option value="all">All Project Sectors</option>
            <option value="road">Roads & Pathways</option>
            <option value="water">Drinking Water & Irrigation</option>
            <option value="education">Education & Schools</option>
            <option value="health">Health & Sanitation</option>
            <option value="drainage">Drainage & Sewerage</option>
            <option value="electricity">Solar & Electrification</option>
            <option value="community_hall">Community Centers</option>
            <option value="sports">Sports & Youth Infra</option>
          </select>

          {isFiltered && (
            <button
              onClick={handleResetView}
              className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer border border-slate-200"
              title="Reset all filters"
            >
              <RotateCcw size={13} />
              <span>Reset</span>
            </button>
          )}

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 transition-colors shadow-2xs"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      {/* Main Map Container Shell */}
      <div className={`relative bg-slate-900 rounded-2xl border border-slate-200 overflow-hidden shadow-md ${isFullscreen ? 'h-[calc(100vh-140px)]' : 'h-[640px]'}`}>
        {/* Real Leaflet Map Container */}
        <div
          ref={mapContainerRef}
          className="w-full h-full z-0 focus:outline-none"
        />

        {/* Floating Top-Right: Basemap & Layer Controls with z-[1000] */}
        <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2 pointer-events-auto">
          {/* Basemap Picker */}
          <div className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl p-2.5 text-xs shadow-lg space-y-2 text-slate-800">
            <div className="font-bold text-[10px] uppercase tracking-wider text-slate-500 flex items-center gap-1.5 pb-1 border-b border-slate-100">
              <Layers size={13} className="text-blue-600" />
              <span>Cartography Basemap</span>
            </div>

            <div className="grid grid-cols-2 gap-1.5 text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setBasemap('streets')}
                className={`px-2 py-1 rounded-lg transition-colors text-left flex items-center gap-1.5 cursor-pointer ${
                  basemap === 'streets'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>🗺️ Streets</span>
              </button>

              <button
                type="button"
                onClick={() => setBasemap('satellite')}
                className={`px-2 py-1 rounded-lg transition-colors text-left flex items-center gap-1.5 cursor-pointer ${
                  basemap === 'satellite'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>🛰️ Satellite</span>
              </button>

              <button
                type="button"
                onClick={() => setBasemap('osm')}
                className={`px-2 py-1 rounded-lg transition-colors text-left flex items-center gap-1.5 cursor-pointer ${
                  basemap === 'osm'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>🌐 OpenStreet</span>
              </button>

              <button
                type="button"
                onClick={() => setBasemap('dark')}
                className={`px-2 py-1 rounded-lg transition-colors text-left flex items-center gap-1.5 cursor-pointer ${
                  basemap === 'dark'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>🌙 Dark Ops</span>
              </button>
            </div>

            {/* Overlays toggles */}
            <div className="pt-2 border-t border-slate-100 space-y-1.5 text-[11px]">
              <label className="flex items-center justify-between cursor-pointer hover:text-slate-950">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  DBSCAN Hotspots
                </span>
                <input
                  type="checkbox"
                  checked={showHotspots}
                  onChange={(e) => setShowHotspots(e.target.checked)}
                  className="accent-rose-600 rounded"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer hover:text-slate-950">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Density Halos
                </span>
                <input
                  type="checkbox"
                  checked={showHeatmap}
                  onChange={(e) => setShowHeatmap(e.target.checked)}
                  className="accent-amber-600 rounded"
                />
              </label>
            </div>
          </div>

          {/* Quick Zoom & Reset Buttons */}
          <div className="bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl p-1.5 shadow-lg flex flex-col gap-1 text-slate-700 self-end">
            <button
              onClick={handleZoomIn}
              title="Zoom In"
              className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <ZoomIn size={16} />
            </button>
            <button
              onClick={handleZoomOut}
              title="Zoom Out"
              className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <ZoomOut size={16} />
            </button>
            <button
              onClick={handleResetView}
              title="Reset India Center View"
              className="p-1.5 rounded-lg hover:bg-slate-100 text-blue-600 transition-colors cursor-pointer"
            >
              <Crosshair size={16} />
            </button>
          </div>
        </div>

        {/* Floating Top-Left: Risk Legend & Stats with z-[1000] */}
        <div className="absolute top-4 left-4 z-[1000] bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl p-3 text-xs text-slate-800 shadow-lg space-y-2 max-w-[210px] pointer-events-auto">
          <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
            <span className="font-bold text-slate-900">Map Legend</span>
            <span className="text-[10px] text-blue-600 font-mono font-bold">
              {activeProjects.length} Works
            </span>
          </div>

          <div className="space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-xs ring-2 ring-rose-200" />
                <span>Critical (≥85)</span>
              </div>
              <span className="font-mono text-slate-500 text-[10px]">
                {activeProjects.filter((p) => p.riskScore.compositeScore >= 85).length}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                <span>High Risk (70–84)</span>
              </div>
              <span className="font-mono text-slate-500 text-[10px]">
                {activeProjects.filter((p) => p.riskScore.compositeScore >= 70 && p.riskScore.compositeScore < 85).length}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>Medium (40–69)</span>
              </div>
              <span className="font-mono text-slate-500 text-[10px]">
                {activeProjects.filter((p) => p.riskScore.compositeScore >= 40 && p.riskScore.compositeScore < 70).length}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Low Risk (&lt;40)</span>
              </div>
              <span className="font-mono text-slate-500 text-[10px]">
                {activeProjects.filter((p) => p.riskScore.compositeScore < 40).length}
              </span>
            </div>

            <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[10px] text-purple-700 font-semibold">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-600" />
                Co-Located Sanctions
              </span>
              <span>10 Pairs</span>
            </div>
          </div>
        </div>

        {/* Selected Hotspot Cluster Inspector Card with z-[1050] */}
        {selectedCluster && (
          <div className="absolute top-20 left-4 z-[1050] bg-slate-900/95 backdrop-blur-md border border-slate-700 rounded-xl p-4 max-w-xs text-white shadow-2xl space-y-2 pointer-events-auto">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] uppercase font-bold text-rose-400 flex items-center gap-1">
                  <Flame size={12} />
                  DBSCAN Hotspot #{selectedCluster.clusterId}
                </span>
                <h3 className="font-bold text-sm text-white">{selectedCluster.districtName}, {selectedCluster.stateName}</h3>
              </div>
              <button
                onClick={() => setSelectedCluster(null)}
                className="text-slate-400 hover:text-white text-xs px-1 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <div className="text-xs text-slate-300 space-y-1.5 pt-1 border-t border-slate-800">
              <div className="flex justify-between">
                <span>Concentrated Projects:</span>
                <strong className="text-white">{selectedCluster.projectCount}</strong>
              </div>
              <div className="flex justify-between">
                <span>Average Risk Score:</span>
                <strong className="text-rose-400">{selectedCluster.avgRiskScore}/100</strong>
              </div>
              <div className="flex justify-between">
                <span>Cluster Radius:</span>
                <strong className="text-white">{selectedCluster.radiusKm} km</strong>
              </div>
              <div className="pt-1 text-[11px] text-amber-300 font-medium">
                Primary Anomaly: {selectedCluster.topPattern}
              </div>
            </div>
          </div>
        )}

        {/* Selected Project Card Popover on Map Marker Click with z-[1050] */}
        {popupProject && (
          <div
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            className="absolute bottom-24 left-4 right-4 sm:left-auto sm:right-4 z-[1050] bg-white/95 backdrop-blur-md border border-slate-300 rounded-xl p-4 sm:max-w-sm text-slate-900 shadow-2xl space-y-3 pointer-events-auto"
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-bold">
                    {popupProject.id}
                  </span>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                    style={{ backgroundColor: getRiskColor(popupProject.riskScore.compositeScore) }}
                  >
                    Risk: {popupProject.riskScore.compositeScore}/100
                  </span>
                </div>
                <h3 className="font-bold text-xs text-slate-900 mt-1 leading-snug">
                  {popupProject.title}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {popupProject.districtName}, {popupProject.stateName}
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setPopupProject(null);
                }}
                className="text-slate-400 hover:text-slate-700 text-xs px-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
              <div>
                <span className="text-[10px] text-slate-400">Sanctioned</span>
                <div className="font-bold text-slate-800">
                  ₹{(popupProject.sanctionedAmount / 1e7).toFixed(2)} Cr
                </div>
              </div>
              <div>
                <span className="text-[10px] text-slate-400">Utilized</span>
                <div className="font-bold text-slate-800">
                  ₹{(popupProject.utilizedAmount / 1e7).toFixed(2)} Cr
                </div>
              </div>
              <div className="col-span-2">
                <span className="text-[10px] text-slate-400">Executing Agency</span>
                <div className="font-semibold text-slate-800 truncate text-[11px]">
                  {popupProject.agencyName}
                </div>
              </div>
            </div>

            {popupProject.fraudFlag && (
              <div className="p-2 rounded bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-medium flex items-center gap-1.5">
                <ShieldAlert size={14} className="text-rose-600 shrink-0" />
                <span>Flagged Anomaly: <strong className="uppercase">{popupProject.fraudFlag.replace(/_/g, ' ')}</strong></span>
              </div>
            )}

            <div className="space-y-1.5 pt-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectProject(popupProject, true);
                  setPopupProject(null);
                }}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <FileText size={14} className="text-blue-400" />
                <span>Inspect Full Project Audit Dossier</span>
                <ChevronRight size={14} />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectProject(popupProject, false);
                  setPopupProject(null);
                }}
                className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>Open Quick Overview Drawer</span>
              </button>
            </div>
          </div>
        )}

        {/* Timeline Playback Bar at the Bottom with z-[1000] */}
        <div className="absolute bottom-4 left-4 right-4 z-[1000] bg-slate-900/90 backdrop-blur-md border border-slate-700 rounded-xl p-3 flex items-center gap-4 text-white shadow-2xl pointer-events-auto">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors cursor-pointer"
            title={isPlaying ? 'Pause Timeline' : 'Play Historical Construction Timeline'}
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
          </button>

          <button
            onClick={() => {
              setIsPlaying(false);
              setTimelineIndex(0);
            }}
            title="Reset to beginning (Jan 2024)"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
          >
            <RotateCcw size={14} />
          </button>

          <div className="flex-1 flex flex-col gap-1">
            <div className="flex justify-between text-[11px] font-mono text-slate-300">
              <span className="flex items-center gap-1.5">
                <span>Historical Replay (Jan 2024 &rarr; Aug 2026)</span>
                {isPlaying && (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Simulating Execution
                  </span>
                )}
              </span>
              <span className="text-blue-400 font-bold bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800/60">
                Epoch: {currentEpochMonth}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max={months.length - 1}
              value={timelineIndex}
              onChange={(e) => setTimelineIndex(Number(e.target.value))}
              className="w-full accent-blue-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg appearance-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
