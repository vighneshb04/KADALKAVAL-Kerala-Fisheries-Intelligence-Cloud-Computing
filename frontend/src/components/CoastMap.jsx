import { useState, useEffect, useRef } from 'react';

const STATUS_COLOR = { HIGH: '#dc2626', MEDIUM: '#b45309', LOW: '#16a34a' };

export function CoastMap({ buoys = [], selected, onSelect }) {
  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const markersRef = useRef({});
  const [mapReady, setMapReady] = useState(false);

  // Load Leaflet dynamically
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Load Leaflet CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
      document.head.appendChild(link);
    }

    // Load Leaflet JS
    if (window.L) {
      setMapReady(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
    script.onload = () => setMapReady(true);
    document.head.appendChild(script);
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapReady || !mapRef.current || leafletMapRef.current) return;

    const L = window.L;

    const map = L.map(mapRef.current, {
      center: [10.5, 75.8],
      zoom: 7,
      zoomControl: false,
      attributionControl: false,
    });

    // Esri World Imagery (satellite)
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 18, attribution: 'Esri' }
    ).addTo(map);

    // Ocean labels overlay for context
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
      { maxZoom: 18, opacity: 0.6 }
    ).addTo(map);

    // Zoom control — bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Attribution bottom left, minimal
    L.control.attribution({ position: 'bottomleft', prefix: false })
      .addAttribution('<span style="font-size:9px;opacity:0.5">© Esri</span>')
      .addTo(map);

    leafletMapRef.current = map;
  }, [mapReady]);

  // Sync buoy markers whenever buoys or selected changes
  useEffect(() => {
    if (!leafletMapRef.current || !mapReady) return;
    const L = window.L;
    const map = leafletMapRef.current;

    // Remove old markers
    Object.values(markersRef.current).forEach(m => map.removeLayer(m));
    markersRef.current = {};

    buoys.forEach(b => {
      const isSelected = selected?.buoy_id === b.buoy_id;
      const color = STATUS_COLOR[b.status] || '#16a34a';

      const iconHtml = `
        <div style="
          position:relative;
          width:${isSelected ? 28 : 22}px;
          height:${isSelected ? 28 : 22}px;
          display:flex;
          align-items:center;
          justify-content:center;
        ">
          ${isSelected ? `<div style="
            position:absolute;
            inset:-8px;
            border-radius:50%;
            background:${color};
            opacity:0.18;
            animation:pulse 1.8s ease-in-out infinite;
          "></div>` : ''}
          <div style="
            width:${isSelected ? 22 : 16}px;
            height:${isSelected ? 22 : 16}px;
            border-radius:50%;
            background:${color};
            border:2.5px solid rgba(255,255,255,0.9);
            box-shadow: 0 0 ${isSelected ? '12px 4px' : '6px 2px'} ${color}99;
            display:flex;
            align-items:center;
            justify-content:center;
          ">
            <div style="
              width:${isSelected ? 7 : 5}px;
              height:${isSelected ? 7 : 5}px;
              border-radius:50%;
              background:#fff;
              opacity:0.9;
            "></div>
          </div>
        </div>
      `;

      const icon = L.divIcon({
        html: iconHtml,
        className: '',
        iconSize: [isSelected ? 28 : 22, isSelected ? 28 : 22],
        iconAnchor: [isSelected ? 14 : 11, isSelected ? 14 : 11],
      });

      const marker = L.marker([b.lat, b.lon], { icon })
        .addTo(map)
        .bindTooltip(
          `<div style="
            font-family:'DM Mono',monospace;
            font-size:11px;
            font-weight:600;
            color:#fff;
            background:rgba(10,20,35,0.92);
            border:1px solid ${color};
            border-radius:6px;
            padding:5px 10px;
            white-space:nowrap;
            box-shadow:0 4px 12px rgba(0,0,0,0.5);
          ">
            <span style="color:${color}">●</span> ${b.buoy_name}
            <br/><span style="opacity:0.6;font-size:9px">${b.status} PRIORITY</span>
          </div>`,
          {
            permanent: false,
            direction: 'right',
            offset: [14, 0],
            className: 'buoy-tooltip',
            opacity: 1,
          }
        )
        .on('click', () => onSelect?.(b));

      markersRef.current[b.buoy_id] = marker;
    });
  }, [buoys, selected, mapReady, onSelect]);

  return (
    <div className="card" style={{ overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px 12px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexShrink: 0,
      }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Live Buoy Network</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>Kerala Coastline — 8 Stations</div>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          {[['HIGH', '#dc2626'], ['MEDIUM', '#b45309'], ['LOW', '#16a34a']].map(([l, c]) => (
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />
              <span style={{ fontSize: 10, color: 'var(--text3)' }}>{l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Map container */}
      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        <div ref={mapRef} style={{ width: '100%', height: '100%', minHeight: 340 }} />

        {/* Loading overlay */}
        {!mapReady && (
          <div style={{
            position: 'absolute', inset: 0,
            background: '#0c2a4a',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', gap: 8,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              border: '3px solid rgba(45,212,191,0.2)',
              borderTopColor: '#2dd4bf',
              animation: 'spin 0.8s linear infinite',
            }} />
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontFamily: 'DM Mono, monospace' }}>
              Loading satellite map…
            </span>
          </div>
        )}
      </div>

      <style>{`
        .buoy-tooltip .leaflet-tooltip {
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
        }
        .leaflet-control-zoom a {
          background: rgba(10,20,35,0.85) !important;
          color: #fff !important;
          border-color: rgba(255,255,255,0.15) !important;
        }
        .leaflet-control-zoom a:hover {
          background: rgba(45,212,191,0.25) !important;
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.18; }
          50% { transform: scale(1.4); opacity: 0.08; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}