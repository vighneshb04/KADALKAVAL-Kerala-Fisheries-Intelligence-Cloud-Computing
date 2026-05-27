import { Waves, Globe2, ShieldAlert, Fish, Anchor, Wind, Thermometer, Leaf } from 'lucide-react';

const IMG_HERO  = 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=1600&q=85';
const IMG_COAST = 'https://canoekerala.com/image-uploads/blog/31fefc0e570cb3860f2a6d4b38c6490d_1.jpg';
const IMG_FISH  = 'https://images.livemint.com/img/2022/12/29/original/kerala_boats_vizhinjam_PTI_1672284240416.jpg';
const IMG_BUOY  = 'https://akm-img-a-in.tosshub.com/indiatoday/images/story/202603/niot-buoy-17591343-16x9_0.jpeg?VersionId=6_qEVN7paz_XwtbWn5KraJ2.o7MCSco3';

const COMPONENTS = [
  {
    num: '01',
    color: '#0a7c6e',
    label: 'Azure Event Hubs',
    desc: 'Handles real-time data streaming from IoT buoy stations distributed along the Kerala coastline, ingesting sensor readings every five minutes.',
  },
  {
    num: '02',
    color: '#1a5f7a',
    label: 'Azure SQL Database',
    desc: 'Stores all processed sensor readings, marine alerts, vessel detections, fish zone predictions, and historical records for analysis and tracking.',
  },
  {
    num: '03',
    color: '#b45309',
    label: 'Azure Functions',
    desc: 'Four serverless functions automate SST anomaly detection, weather alert classification, vessel violation monitoring, and fish zone prediction.',
  },
  {
    num: '04',
    color: '#0f766e',
    label: 'Azure App Service',
    desc: 'Hosts the FastAPI backend and this React dashboard, providing real-time marine condition visualization to fisherfolk and the public.',
  },
];

const FUNCTIONS = [
  {
    id: 'fn1',
    name: 'SST Anomaly Detector',
    icon: Thermometer,
    color: '#0a7c6e',
    desc: "Identifies abnormal sea surface temperature conditions outside Kerala's safe range (27.5–30.5°C) and generates alerts for unsafe marine environments.",
  },
  {
    id: 'fn2',
    name: 'Weather Alert Function',
    icon: Wind,
    color: '#1a5f7a',
    desc: 'Analyzes incoming weather data from Open-Meteo Marine API and classifies alert severity — storms, cyclones, and high-wave conditions — for coastal districts.',
  },
  {
    id: 'fn3',
    name: 'Vessel Violation Detector',
    icon: Anchor,
    color: '#b45309',
    desc: 'Monitors vessel coordinates from AIS data streams and detects unauthorized entry into protected marine regions using Haversine geospatial calculations.',
  },
  {
    id: 'fn4',
    name: 'Fish Zone Predictor',
    icon: Fish,
    color: '#0f766e',
    desc: 'Analyzes SST and chlorophyll-a concentration readings to estimate suitable fishing regions across 8 coastal zones based on predefined marine conditions.',
  },
];

const SDGS = [
  {
    num: '14',
    icon: Waves,
    title: 'SDG 14 — Life Below Water',
    desc: 'Vessel violation detection and marine protected area monitoring support sustainable ocean ecosystems along the Kerala coastline.',
  },
  {
    num: '13',
    icon: Globe2,
    title: 'SDG 13 — Climate Action',
    desc: 'Real-time SST anomaly detection surfaces ocean warming patterns and environmental changes for researchers and coastal authorities.',
  },
  {
    num: '2',
    icon: Leaf,
    title: 'SDG 2 — Zero Hunger',
    desc: 'Fish zone predictions help fishing communities locate optimal catch areas, improving food availability and reducing time at sea.',
  },
  {
    num: '1',
    icon: ShieldAlert,
    title: 'SDG 1 — No Poverty',
    desc: "Early weather and sea condition alerts protect the livelihoods of over 1.1 million fisherfolk along Kerala's 590 km coastline.",
  },
];

const SENSORS = [
  { label: 'Sea Surface Temperature', unit: '°C',    note: 'Anomaly: outside 27.5–30.5°C' },
  { label: 'Salinity',                unit: 'PSU',   note: 'Ocean salinity concentration' },
  { label: 'Wave Height',             unit: 'm',     note: 'Storm threshold: > 3.5 m' },
  { label: 'Chlorophyll-a',           unit: 'mg/m³', note: 'Fish food index' },
  { label: 'Wind Speed',              unit: 'km/h',  note: 'Cyclone threshold: > 89 km/h' },
  { label: 'Vessel Location',         unit: 'AIS',   note: 'Geospatial MPA violation check' },
];

export default function CloudSetup() {
  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>

      {/* ── HERO ──────────────────────────────────────────────────── */}
      <div style={{ position: 'relative', height: 480, overflow: 'hidden' }}>
        <img
          src={IMG_HERO}
          alt="Kerala sea"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 55%' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.4) 55%, rgba(0,0,0,0.15) 100%)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,124,110,0.3) 0%, transparent 55%)' }} />

        <div className="container" style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingBottom: 56 }}>
          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, letterSpacing: 3, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', marginBottom: 14 }}>
            Kerala Fisheries Intelligence · Microsoft Azure
          </div>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 56, fontWeight: 700, color: '#fff', lineHeight: 1.05, marginBottom: 18 }}>
            KADALKAVAL
          </div>
          <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.75)', maxWidth: 520, lineHeight: 1.85 }}>
            Sea Guardian — a cloud-native sustainable fisheries monitoring system designed for the Kerala coastline to support fisher safety, marine monitoring, and sustainable fishing practices.
          </div>
        </div>
      </div>

      {/* ── ABOUT ─────────────────────────────────────────────────── */}
      <div style={{ background: 'var(--bg2)', borderBottom: '1px solid var(--border)' }}>
        <div className="container" style={{ padding: '64px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
            <div>
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, letterSpacing: 2, color: 'var(--teal)', textTransform: 'uppercase', marginBottom: 14 }}>About</div>
              <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 32, fontWeight: 700, lineHeight: 1.2, marginBottom: 24 }}>
                Supporting Fisher Safety Along 590 km of Kerala Coast
              </div>
              <div style={{ fontSize: 15, color: 'var(--text2)', lineHeight: 1.95, marginBottom: 18 }}>
                KADALKAVAL simulates IoT buoy sensor data including sea surface temperature, salinity, wave height, chlorophyll concentration, weather conditions, and vessel location data from multiple virtual coastal stations.
              </div>
              <div style={{ fontSize: 15, color: 'var(--text2)', lineHeight: 1.95 }}>
                The platform uses Azure Event Hubs for real-time data streaming and Azure Functions for serverless event processing, with all monitoring records stored in Azure SQL Database for analysis and historical tracking.
              </div>
            </div>
            <div style={{ position: 'relative' }}>
              <img src={IMG_COAST} alt="Kerala coastline" style={{ width: '100%', height: 360, objectFit: 'cover', borderRadius: 14, display: 'block' }} />
              <div style={{ position: 'absolute', bottom: -18, left: -18, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 20px', boxShadow: 'var(--shadow2)', display: 'flex', gap: 28 }}>
                {[['590 km', 'Coastline'], ['1.1M', 'Fisherfolk'], ['8', 'Buoy Stations']].map(([v, l]) => (
                  <div key={l} style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, fontWeight: 700, color: 'var(--teal)' }}>{v}</div>
                    <div style={{ fontSize: 10, color: 'var(--text3)', fontFamily: 'DM Mono, monospace', marginTop: 3, letterSpacing: 0.5 }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── SENSOR DATA ───────────────────────────────────────────── */}
      <div className="container" style={{ padding: '64px 24px' }}>
        <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, letterSpacing: 2, color: 'var(--teal)', textTransform: 'uppercase', marginBottom: 14 }}>IoT Buoy Data</div>
        <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 32, fontWeight: 700, marginBottom: 32 }}>Simulated Sensor Parameters</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {SENSORS.map((s, i) => (
            <div key={s.label} className="card" style={{ padding: '20px 22px', borderLeft: '3px solid var(--teal)', display: 'flex', gap: 16, alignItems: 'center' }}>
              <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 32, fontWeight: 700, color: 'var(--teal)', opacity: 0.15, minWidth: 36, lineHeight: 1 }}>
                {String(i + 1).padStart(2, '0')}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'DM Mono, monospace', lineHeight: 1.6 }}>{s.unit} · {s.note}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── AZURE COMPONENTS ──────────────────────────────────────── */}
      <div style={{ background: 'var(--bg3)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="container" style={{ padding: '64px 24px' }}>
          <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, letterSpacing: 2, color: 'var(--teal)', textTransform: 'uppercase', marginBottom: 14 }}>Cloud Architecture</div>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 32, fontWeight: 700, marginBottom: 10 }}>Four Azure Cloud Components</div>
          <div style={{ fontSize: 14, color: 'var(--text3)', marginBottom: 36, maxWidth: 580, lineHeight: 1.75 }}>
            By leveraging Microsoft Azure's serverless cloud ecosystem, KADALKAVAL provides a scalable and cost-effective smart coastal monitoring platform suitable for academic and research-oriented cloud applications.
          </div>

          {/* pipeline strip */}
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 36, overflowX: 'auto', paddingBottom: 4 }}>
            {['IoT Buoys', 'Event Hubs', 'Azure Functions', 'SQL Database', 'App Service'].map((node, i, arr) => (
              <div key={node} style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 16px', whiteSpace: 'nowrap', fontSize: 13, fontWeight: 600, color: i === 0 ? 'var(--text3)' : 'var(--teal)' }}>
                  {node}
                </div>
                {i < arr.length - 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', padding: '0 3px' }}>
                    <div style={{ width: 18, height: 1.5, background: 'var(--border)' }} />
                    <div style={{ width: 0, height: 0, borderTop: '4px solid transparent', borderBottom: '4px solid transparent', borderLeft: '6px solid var(--border)' }} />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {COMPONENTS.map(c => (
              <div key={c.label} className="card" style={{ padding: '24px 22px', borderTop: `3px solid ${c.color}`, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 10, right: 14, fontFamily: 'Playfair Display, serif', fontSize: 52, fontWeight: 700, color: c.color, opacity: 0.07, lineHeight: 1 }}>{c.num}</div>
                <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, fontWeight: 700, color: c.color, marginBottom: 10, letterSpacing: 1 }}>{c.num}</div>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 10 }}>{c.label}</div>
                <div style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 1.75 }}>{c.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── FUNCTIONS ─────────────────────────────────────────────── */}
      <div className="container" style={{ padding: '64px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'start' }}>
          <div>
            <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, letterSpacing: 2, color: 'var(--teal)', textTransform: 'uppercase', marginBottom: 14 }}>Serverless Processing</div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 32, fontWeight: 700, lineHeight: 1.2, marginBottom: 10 }}>Four Azure Functions</div>
            <div style={{ fontSize: 14, color: 'var(--text3)', lineHeight: 1.8, marginBottom: 32 }}>
              Four Azure Functions automate the critical monitoring operations within the system, running on Azure's consumption-based serverless infrastructure.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {FUNCTIONS.map(f => {
                const Icon = f.icon;
                return (
                  <div key={f.id} className="card" style={{ padding: '18px 20px', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                    <div style={{ minWidth: 44, height: 44, borderRadius: 10, background: `${f.color}14`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Icon size={18} color={f.color} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                        <span style={{ fontFamily: 'DM Mono, monospace', fontSize: 10, fontWeight: 700, color: f.color, background: `${f.color}14`, padding: '2px 7px', borderRadius: 4 }}>{f.id}</span>
                        <span style={{ fontSize: 14, fontWeight: 700 }}>{f.name}</span>
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 1.75 }}>{f.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ position: 'sticky', top: 24 }}>
            <div style={{ position: 'relative' }}>
              <img src={IMG_BUOY} alt="ocean monitoring buoy" style={{ width: '100%', height: 460, objectFit: 'cover', borderRadius: 14 }} />
              
            </div>
          </div>
        </div>
      </div>

      {/* ── SDGs ──────────────────────────────────────────────────── */}
      <div style={{ background: 'var(--bg3)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="container" style={{ padding: '64px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <img src={IMG_FISH} alt="Kerala fishing" style={{ width: '100%', height: 500, objectFit: 'cover', borderRadius: 14 }} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,124,110,0.65) 0%, transparent 50%)', borderRadius: 14 }} />
              <div style={{ position: 'absolute', bottom: 28, left: 28, right: 28 }}>
                <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 6 }}>Protecting Kerala's Fishing Communities</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>Real-time alerts and fish zone guidance for 1.1 million fisherfolk</div>
              </div>
            </div>

            <div>
              <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 11, letterSpacing: 2, color: 'var(--teal)', textTransform: 'uppercase', marginBottom: 14 }}>Impact</div>
              <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 32, fontWeight: 700, lineHeight: 1.2, marginBottom: 10 }}>
                UN Sustainable Development Goals
              </div>
              <div style={{ fontSize: 14, color: 'var(--text3)', lineHeight: 1.8, marginBottom: 36 }}>
                KADALKAVAL addresses multiple United Nations Sustainable Development Goals through marine intelligence and fisher safety.
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
                {SDGS.map(s => {
                  const Icon = s.icon;
                  return (
                    <div key={s.title} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                      <div style={{ minWidth: 52, height: 52, borderRadius: 12, background: 'var(--teal3)', border: '1px solid var(--teal)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <div style={{ fontFamily: 'DM Mono, monospace', fontSize: 9, color: 'var(--teal)', fontWeight: 700 }}>SDG</div>
                        <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 18, fontWeight: 700, color: 'var(--teal)', lineHeight: 1 }}>{s.num}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 5 }}>{s.title}</div>
                        <div style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 1.75 }}>{s.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── FOOTER BAND ───────────────────────────────────────────── */}
      <div style={{ background: 'var(--teal)', padding: '28px 24px' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, fontWeight: 700, color: '#fff' }}>KADALKAVAL</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', fontFamily: 'DM Mono, monospace', marginTop: 3 }}>Sea Guardian · Kerala Fisheries Intelligence</div>
          </div>
          <div style={{ display: 'flex', gap: 24 }}>
            {['SDG 1', 'SDG 2', 'SDG 13', 'SDG 14'].map(s => (
              <div key={s} style={{ fontFamily: 'DM Mono, monospace', fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>{s}</div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}