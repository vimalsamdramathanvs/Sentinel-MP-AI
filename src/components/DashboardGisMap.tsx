import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { ProjectItem, FraudHotspotCluster } from '../types';
import { getRiskColor } from '../data/riskEngine';
import {
  ZoomIn,
  ZoomOut,
  Crosshair,
  Flame,
  Layers,
  ChevronRight,
  FileText,
  X,
  AlertCircle
} from 'lucide-react';

interface DashboardGisMapProps {
  projects: ProjectItem[];
  clusters: FraudHotspotCluster[];
  selectedClusterId?: number | null;
  onSelectProject: (p: ProjectItem, openDossier?: boolean) => void;
  onSelectCluster?: (cluster: FraudHotspotCluster | null) => void;
  onLaunchFullMap?: () => void;
}

export const DashboardGisMap: React.FC<DashboardGisMapProps> = ({
  projects,
  clusters,
  selectedClusterId,
  onSelectProject,
  onSelectCluster,
  onLaunchFullMap,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const hotspotsLayerRef = useRef<L.LayerGroup | null>(null);

  const [basemap, setBasemap] = useState<'streets' | 'satellite' | 'dark'>('streets');
  const [showHotspots, setShowHotspots] = useState(true);
  const [activePopupProject, setActivePopupProject] = useState<ProjectItem | null>(null);

  const getTileUrl = (type: 'streets' | 'satellite' | 'dark') => {
    switch (type) {
      case 'satellite':
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      case 'dark':
        return 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
      case 'streets':
      default:
        return 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
    }
  };

  // 1. Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if ((mapContainerRef.current as any)._leaflet_id) {
      delete (mapContainerRef.current as any)._leaflet_id;
    }
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: [22.3511, 78.6677],
      zoom: 5,
      minZoom: 4,
      maxZoom: 18,
      zoomControl: false,
    });

    tileLayerRef.current = L.tileLayer(getTileUrl(basemap), {
      attribution: '&copy; CARTO, OpenStreetMap',
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    hotspotsLayerRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && mapContainerRef.current) {
      resizeObserver = new ResizeObserver(() => {
        map.invalidateSize();
      });
      resizeObserver.observe(mapContainerRef.current);
    }

    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      clearTimeout(timer);
      if (resizeObserver) resizeObserver.disconnect();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 2. Basemap toggle
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    tileLayerRef.current.setUrl(getTileUrl(basemap));
  }, [basemap]);

  // 3. Render DBSCAN Hotspots
  useEffect(() => {
    if (!hotspotsLayerRef.current) return;
    hotspotsLayerRef.current.clearLayers();

    if (showHotspots) {
      clusters.forEach((c) => {
        const isSelected = selectedClusterId === c.clusterId;

        const circle = L.circle([c.lat, c.lng], {
          radius: c.radiusKm * 1000,
          color: isSelected ? '#dc2626' : '#ef4444',
          fillColor: '#ef4444',
          fillOpacity: isSelected ? 0.28 : 0.15,
          weight: isSelected ? 3 : 2,
          dashArray: '6, 6',
        });

        const centerPin = L.circleMarker([c.lat, c.lng], {
          radius: isSelected ? 11 : 8,
          color: '#ffffff',
          fillColor: isSelected ? '#991b1b' : '#dc2626',
          fillOpacity: 0.95,
          weight: 2,
        });

        const tooltip = `
          <div style="font-family: inherit; font-size: 11px; line-height: 1.3;">
            <strong style="color: #dc2626;">DBSCAN Cluster #${c.clusterId}</strong><br/>
            <strong>${c.districtName}</strong>, ${c.stateName}<br/>
            <span>Works: <b>${c.projectCount}</b> | Avg Risk: <b style="color: #ef4444;">${c.avgRiskScore}/100</b></span>
          </div>
        `;

        circle.bindTooltip(tooltip, { sticky: true });
        centerPin.bindTooltip(tooltip, { sticky: true });

        const handleClick = (e: L.LeafletMouseEvent) => {
          L.DomEvent.stopPropagation(e);
          onSelectCluster?.(c);
          mapInstanceRef.current?.flyTo([c.lat, c.lng], 10, { duration: 1.0 });
        };

        circle.on('click', handleClick);
        centerPin.on('click', handleClick);

        circle.addTo(hotspotsLayerRef.current!);
        centerPin.addTo(hotspotsLayerRef.current!);
      });
    }
  }, [clusters, showHotspots, selectedClusterId, onSelectCluster]);

  // 4. Render Project Pins
  useEffect(() => {
    if (!markersLayerRef.current) return;
    markersLayerRef.current.clearLayers();

    projects.forEach((p) => {
      const score = p.riskScore.compositeScore;
      const color = getRiskColor(score);
      const isCritical = score >= 85;

      const iconHtml = `
        <div style="
          position: relative;
          width: 22px;
          height: 22px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        ">
          ${
            isCritical
              ? `<span style="
                  position: absolute;
                  width: 24px;
                  height: 24px;
                  border-radius: 9999px;
                  background: rgba(239, 68, 68, 0.45);
                  animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
                "></span>`
              : ''
          }
          <div style="
            width: 12px;
            height: 12px;
            border-radius: 9999px;
            background-color: ${color};
            border: 2px solid #ffffff;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          "></div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-dashboard-pin',
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });

      const marker = L.marker([p.location.lat, p.location.lng], { icon: customIcon });

      marker.bindTooltip(
        `
        <div style="font-family: inherit; font-size: 11px; line-height: 1.35;">
          <strong>${p.title}</strong><br/>
          <span style="color: #64748b;">${p.districtName}, ${p.stateName}</span><br/>
          <span>Sanction: <b>₹${(p.sanctionedAmount / 1e7).toFixed(2)} Cr</b> | Risk: <b style="color: ${color};">${score}/100</b></span>
        </div>
        `,
        { direction: 'top', offset: [0, -10] }
      );

      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        setActivePopupProject(p);
      });

      marker.addTo(markersLayerRef.current!);
    });
  }, [projects]);

  // 5. React to selected cluster changes from parent
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedClusterId) return;
    const targetCluster = clusters.find((c) => c.clusterId === selectedClusterId);
    if (targetCluster) {
      mapInstanceRef.current.flyTo([targetCluster.lat, targetCluster.lng], 10, { duration: 1.0 });
    }
  }, [selectedClusterId, clusters]);

  const handleReset = () => {
    onSelectCluster?.(null);
    mapInstanceRef.current?.flyTo([22.3511, 78.6677], 5, { duration: 1.0 });
  };

  return (
    <div className="relative w-full h-[380px] bg-slate-900 rounded-xl overflow-hidden border border-slate-200 shadow-inner">
      {/* Real Leaflet Map */}
      <div ref={mapContainerRef} className="w-full h-full z-0 focus:outline-none" />

      {/* Floating Top-Right: Basemap & Layer Controls */}
      <div className="absolute top-3 right-3 z-[1000] flex flex-col gap-1.5 pointer-events-auto">
        <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-lg p-1.5 shadow-md flex items-center gap-1 text-[11px] font-semibold text-slate-700">
          <button
            type="button"
            onClick={() => setBasemap('streets')}
            className={`px-2 py-1 rounded transition-colors cursor-pointer ${
              basemap === 'streets' ? 'bg-blue-600 text-white shadow-2xs' : 'hover:bg-slate-100'
            }`}
          >
            Streets
          </button>
          <button
            type="button"
            onClick={() => setBasemap('satellite')}
            className={`px-2 py-1 rounded transition-colors cursor-pointer ${
              basemap === 'satellite' ? 'bg-blue-600 text-white shadow-2xs' : 'hover:bg-slate-100'
            }`}
          >
            Satellite
          </button>
          <button
            type="button"
            onClick={() => setBasemap('dark')}
            className={`px-2 py-1 rounded transition-colors cursor-pointer ${
              basemap === 'dark' ? 'bg-blue-600 text-white shadow-2xs' : 'hover:bg-slate-100'
            }`}
          >
            Dark
          </button>
        </div>

        <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-lg p-1.5 shadow-md flex flex-col gap-1 self-end text-slate-700">
          <button
            type="button"
            onClick={() => mapInstanceRef.current?.zoomIn()}
            title="Zoom In"
            className="p-1.5 rounded hover:bg-slate-100 cursor-pointer"
          >
            <ZoomIn size={14} />
          </button>
          <button
            type="button"
            onClick={() => mapInstanceRef.current?.zoomOut()}
            title="Zoom Out"
            className="p-1.5 rounded hover:bg-slate-100 cursor-pointer"
          >
            <ZoomOut size={14} />
          </button>
          <button
            type="button"
            onClick={handleReset}
            title="Recenter India"
            className="p-1.5 rounded hover:bg-slate-100 text-blue-600 cursor-pointer"
          >
            <Crosshair size={14} />
          </button>
        </div>
      </div>

      {/* Floating Top-Left: Mini Legend */}
      <div className="absolute top-3 left-3 z-[1000] bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-lg p-2.5 shadow-md text-slate-800 text-[11px] space-y-1.5 pointer-events-auto">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-1 font-bold text-[10px] uppercase text-slate-500">
          <span>Live Radar</span>
          <span className="text-blue-600 font-mono">{projects.length} Works</span>
        </div>
        <div className="flex items-center gap-3 text-[10px]">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500 ring-2 ring-rose-200" />
            Critical (≥85)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-orange-500" />
            High (70–84)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Medium
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Low
          </span>
        </div>
        <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px]">
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="checkbox"
              checked={showHotspots}
              onChange={(e) => setShowHotspots(e.target.checked)}
              className="accent-rose-600 rounded scale-90"
            />
            <span className="text-rose-700 font-medium">DBSCAN Hotspots</span>
          </label>
          {onLaunchFullMap && (
            <button
              type="button"
              onClick={onLaunchFullMap}
              className="text-blue-600 hover:underline font-semibold flex items-center gap-0.5 cursor-pointer ml-2"
            >
              <span>Full Map</span>
              <ChevronRight size={11} />
            </button>
          )}
        </div>
      </div>

      {/* Project Card Popover on Marker Click */}
      {activePopupProject && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-3 left-3 right-3 sm:left-auto sm:right-3 sm:max-w-xs z-[1050] bg-white/95 backdrop-blur-md border border-slate-300 rounded-xl p-3 shadow-xl space-y-2 text-slate-900 pointer-events-auto text-xs"
        >
          <div className="flex justify-between items-start">
            <div className="space-y-0.5">
              <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-slate-100 font-bold text-slate-700">
                {activePopupProject.id}
              </span>
              <h4 className="font-bold text-xs text-slate-900 leading-snug line-clamp-1">
                {activePopupProject.title}
              </h4>
              <p className="text-[10px] text-slate-500">
                {activePopupProject.districtName}, {activePopupProject.stateName}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActivePopupProject(null)}
              className="text-slate-400 hover:text-slate-700 text-xs px-1 cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="flex justify-between items-center bg-slate-50 p-1.5 rounded border border-slate-100 text-[11px]">
            <div>
              <span className="text-[9px] text-slate-400 block">Sanctioned</span>
              <span className="font-bold text-slate-800">
                ₹{(activePopupProject.sanctionedAmount / 1e7).toFixed(2)} Cr
              </span>
            </div>
            <div className="text-right">
              <span className="text-[9px] text-slate-400 block">Risk Score</span>
              <span
                className="font-bold px-1.5 py-0.5 rounded text-white text-[10px]"
                style={{ backgroundColor: getRiskColor(activePopupProject.riskScore.compositeScore) }}
              >
                {activePopupProject.riskScore.compositeScore}/100
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              onSelectProject(activePopupProject, true);
              setActivePopupProject(null);
            }}
            className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-bold transition-colors flex items-center justify-center gap-1 shadow-xs cursor-pointer"
          >
            <FileText size={12} className="text-blue-400" />
            <span>Open Audit Dossier</span>
          </button>
        </div>
      )}
    </div>
  );
};
