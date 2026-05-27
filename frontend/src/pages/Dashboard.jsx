import { useState } from 'react';
import { Thermometer, Leaf, Fish, AlertTriangle, Radio, Clock } from 'lucide-react';
import { StatCard } from '../components/StatCard.jsx';
import { CoastMap } from '../components/CoastMap.jsx';

const STATUS_COLOR = { HIGH: 'red', MEDIUM: 'amber', LOW: 'green' };
const ZONE_COLOR   = { OPTIMAL: 'green', MODERATE: 'amber', AVOID: 'red' };
const STATUS_BG    = { HIGH: 'var(--red2)', MEDIUM: 'var(--amber2)', LOW: 'var(--green2)' };
const STATUS_FG    = { HIGH: 'var(--red)',  MEDIUM: 'var(--amber)',  LOW: 'var(--green)'  };

// Real unsplash fishing images
const HERO_IMAGE = 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1400&q=80';

function BuoyDetail({ buoy }) {
  if (!buoy) return (
    <div className="card" style={{
      padding: 32, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 12,
      minHeight: 300, textAlign: 'center',
    }}>
      <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Radio size={22} color="var(--text3)" />
      </div>
      <div style={{ fontSize: 14, color: 'var(--text2)' }}>Select a buoy on the map</div>
      <div style={{ fontSize: 12, color: 'var(--text3)' }}>Click any station to view live readings</div>
    </div>
  );

  const rows = [
    { label: 'Sea Surface Temp',  value: `${buoy.sst_celsius} °C`,       note: 'Normal: 27.5–30.5°C', warn: buoy.sst_celsius > 30.5 || buoy.sst_celsius < 27.5 },
    { label: 'Wave Height',       value: `${buoy.wave_height_m} m`,       note: buoy.wave_height_m > 3 ? 'High wave warning' : '', warn: buoy.wave_height_m > 3 },
    { label: 'Wind Speed',        value: `${buoy.wind_speed_kmh} km/h`,   note: '' },
    { label: 'Salinity',          value: `${buoy.salinity_psu} PSU`,      note: 'Normal: 34–36 PSU', warn: buoy.salinity_psu < 32 },
    { label: 'Chlorophyll-a',     value: `${buoy.chlorophyll} mg/m³`,     note: 'Higher = more fish food' },
    { label: 'Fish Probability',  value: `${(buoy.fish_prob * 100).toFixed(1)}%`, note: buoy.species },
  ];

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px', borderBottom: '1px solid var(--border)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        background: `linear-gradient(135deg, var(--teal3), var(--bg2))`,
      }}>
        <div>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 20, fontWeight: 700, color: 'var(--teal)' }}>
            {buoy.buoy_name}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2, fontFamily: 'DM Mono, monospace' }}>
            {buoy.lat}°N · {buoy.lon}°E
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <span className={`badge badge-${STATUS_COLOR[buoy.status]}`}>{buoy.status}</span>
          <span className={`badge badge-${ZONE_COLOR[buoy.zone_status]}`}>{buoy.zone_status}</span>
        </div>
      </div>

      {/* Readings */}
      <div style={{ padding: '0 20px' }}>
        {rows.map(({ label, value, note, warn }) => (
          <div key={label} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '12px 0', borderBottom: '1px solid var(--border)',
          }}>
            <span style={{ fontSize: 13, color: 'var(--text2)' }}>{label}</span>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 14, fontWeight: 600, fontFamily: 'DM Mono, monospace',
                color: warn ? 'var(--red)' : 'var(--text)' }}>
                {value}
              </div>
              {note && <div style={{ fontSize: 10, color: warn ? 'var(--amber)' : 'var(--text3)', marginTop: 1 }}>{note}</div>}
            </div>
          </div>
        ))}
      </div>

      {/* Fish prob bar */}
      <div style={{ padding: '16px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text3)', marginBottom: 6 }}>
          <span>Fish Aggregation Probability</span>
          <span style={{ fontWeight: 600, color: 'var(--teal)', fontFamily: 'DM Mono, monospace' }}>
            {(buoy.fish_prob * 100).toFixed(1)}%
          </span>
        </div>
        <div style={{ background: 'var(--bg3)', borderRadius: 4, height: 6 }}>
          <div style={{
            width: `${buoy.fish_prob * 100}%`, height: '100%',
            background: `linear-gradient(90deg, var(--teal), var(--ocean))`,
            borderRadius: 4, transition: 'width 0.5s',
          }} />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard({ data }) {
  const [selectedBuoy, setSelectedBuoy] = useState(null);

  if (!data) return null;
  const { buoys, stats, alerts } = data;

  return (
    <div>
      {/* Hero */}
      <div style={{
        height: 320,
        position: 'relative',
        overflow: 'hidden',
        background: '#0c2a4a',
      }}>
        <img
          src={HERO_IMAGE}
          alt="Kerala coast"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: 0.65,
            filter: 'brightness(1.25)',
          }}
          onError={e => { e.target.style.display = 'none'; }}
        />
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.08), rgba(12,42,74,0.6))',
        }} />
        <div className="container" style={{
          position: 'absolute', bottom: 28, left: 0, right: 0,
        }}>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 32, fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>
            Kerala Coast
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.88)', marginTop: 4, display: 'flex', gap: 16 }}>
            <span>590 km Coastline</span>
            <span>·</span>
            <span>1.1M Fisherfolk</span>
            <span>·</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={12} />
              Updated {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 28, paddingBottom: 40 }}>
        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 28 }}>
          <StatCard icon={Thermometer} label="Avg Sea Temp"    value={stats.avg_sst}  unit="°C"     accent="ocean"  delay={0}   sub="Kerala coast avg" />
          <StatCard icon={Leaf}        label="Avg Chlorophyll" value={stats.avg_chl}  unit="mg/m³"  accent="green"  delay={50}  sub="Fish food index" />
          <StatCard icon={Fish}        label="Optimal Zones"   value={stats.optimal}  unit={`/ ${stats.buoys}`} accent="teal" delay={100} sub="High fish probability" />
          <StatCard icon={AlertTriangle} label="Active Alerts" value={stats.alerts}   unit=""       accent={stats.alerts > 2 ? 'red' : 'amber'} delay={150} sub="Requires attention" />
          <StatCard icon={Radio}       label="Buoys Online"    value={stats.buoys}    unit=""       accent="green"  delay={200} sub="All stations active" />
        </div>

        {/* Map + Detail */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>
          <CoastMap buoys={buoys} selected={selectedBuoy} onSelect={setSelectedBuoy} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <BuoyDetail buoy={selectedBuoy} />

            {/* Recent alerts strip */}
            {alerts.length > 0 && (
              <div className="card" style={{ padding: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text2)', marginBottom: 10, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                  Recent Alerts
                </div>
                {alerts.slice(0, 3).map((a, i) => (
                  <div key={i} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '8px 0', borderBottom: i < 2 ? '1px solid var(--border)' : 'none',
                  }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <div style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: STATUS_FG[a.alert_type?.includes('HIGH') ? 'HIGH' : 'MEDIUM'],
                      }} />
                      <span style={{ fontSize: 13, color: 'var(--text)' }}>{a.zone_id}</span>
                    </div>
                    <span className={`badge badge-${a.alert_type?.includes('HIGH') ? 'red' : 'amber'}`} style={{ fontSize: 10 }}>
                      {a.alert_type}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Buoy table */}
        <div className="card fade-up" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>All Buoy Stations — Current Readings</div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--bg3)' }}>
                  {['Station', 'SST (°C)', 'Salinity (PSU)', 'Wave (m)', 'Wind (km/h)', 'Chlorophyll', 'Fish Prob', 'Status', 'Zone'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text3)', letterSpacing: 0.5, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {buoys.map((b, i) => (
                  <tr key={b.buoy_id}
                    onClick={() => setSelectedBuoy(b)}
                    style={{
                      borderTop: '1px solid var(--border)',
                      background: i % 2 === 0 ? 'var(--bg2)' : 'var(--bg)',
                      cursor: 'pointer', transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--teal3)'}
                    onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'var(--bg2)' : 'var(--bg)'}
                  >
                    <td style={{ padding: '10px 16px', fontWeight: 600, color: 'var(--teal)' }}>{b.buoy_name}</td>
                    <td style={{ padding: '10px 16px', fontFamily: 'DM Mono, monospace', color: b.sst_celsius > 30.5 ? 'var(--red)' : 'var(--text)' }}>{b.sst_celsius}</td>
                    <td style={{ padding: '10px 16px', fontFamily: 'DM Mono, monospace' }}>{b.salinity_psu}</td>
                    <td style={{ padding: '10px 16px', fontFamily: 'DM Mono, monospace', color: b.wave_height_m > 3 ? 'var(--amber)' : 'var(--text)' }}>{b.wave_height_m}</td>
                    <td style={{ padding: '10px 16px', fontFamily: 'DM Mono, monospace' }}>{b.wind_speed_kmh}</td>
                    <td style={{ padding: '10px 16px', fontFamily: 'DM Mono, monospace' }}>{b.chlorophyll}</td>
                    <td style={{ padding: '10px 16px', fontFamily: 'DM Mono, monospace' }}>{(b.fish_prob * 100).toFixed(1)}%</td>
                    <td style={{ padding: '10px 16px' }}><span className={`badge badge-${STATUS_COLOR[b.status]}`}>{b.status}</span></td>
                    <td style={{ padding: '10px 16px' }}><span className={`badge badge-${ZONE_COLOR[b.zone_status]}`}>{b.zone_status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
