import { Ship, AlertOctagon } from 'lucide-react';

function timeStr(ts) {
  if (!ts) return '—';
  return new Date(ts).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export default function Vessels({ data }) {
  if (!data) return null;
  const { violations } = data;

  const VESSEL_IMG = 'https://www.odimer.com/wp-content/uploads/2022/02/bateau-de-peche.jpg';

  return (
   <div>
      <div style={{ height: 240, position: 'relative', overflow: 'hidden', background: '#0a1e35' }}>
        <img
          src={VESSEL_IMG}
          alt="Fishing boat"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: 0.65,
            filter: 'brightness(1.3)',
          }}
          onError={e => e.target.style.display = 'none'}
        />
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(10,30,53,0.65))'
        }} />
        <div className="container" style={{ position: 'absolute', bottom: 20, left: 0, right: 0 }}>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 24, fontWeight: 700, color: '#fff' }}>
            Vessel Violation Log
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 3 }}>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 28, paddingBottom: 48 }}>
        {/* MPA info */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 28 }}>
          {[
            { name: 'Vembanad Wetland MPA',    radius: '10 km', lat: '9.60°N', lon: '76.30°E' },
            { name: 'Gulf of Mannar Buffer',   radius: '15 km', lat: '8.70°N', lon: '77.50°E' },
            { name: 'Kochi Backwaters Reserve',radius: '5 km',  lat: '9.93°N', lon: '76.24°E' },
          ].map(z => (
            <div key={z.name} className="card fade-up" style={{ padding: '14px 18px', borderLeft: '3px solid var(--amber)' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{z.name}</div>
              <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text3)', fontFamily: 'DM Mono, monospace' }}>
                <span>Radius: {z.radius}</span>
                <span>{z.lat}, {z.lon}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Violations table */}
        <div className="card fade-up fade-up-1" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertOctagon size={16} color="var(--red)" />
            <div style={{ fontSize: 13, fontWeight: 600 }}>Detected Violations</div>
            <span className="badge badge-red" style={{ marginLeft: 4 }}>{violations.length}</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: 'var(--bg3)' }}>
                  {['Vessel ID', 'Marine Protected Area', 'Severity', 'Speed (knots)', 'Coordinates', 'Detected'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text3)', letterSpacing: 0.5, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {violations.map((v, i) => (
                  <tr key={i} style={{ borderTop: '1px solid var(--border)', background: i % 2 === 0 ? 'var(--bg2)' : 'var(--bg)' }}>
                    <td style={{ padding: '11px 16px', fontWeight: 700, fontFamily: 'DM Mono, monospace', color: 'var(--teal)' }}>{v.vessel_id}</td>
                    <td style={{ padding: '11px 16px', color: 'var(--text)' }}>{v.zone || v.zone_id || '—'}</td>
                    <td style={{ padding: '11px 16px' }}>
                      <span className={`badge badge-${v.severity === 'HIGH' ? 'red' : 'amber'}`}>{v.severity}</span>
                    </td>
                    <td style={{ padding: '11px 16px', fontFamily: 'DM Mono, monospace' }}>{v.speed_knots ?? v.speed}</td>
                    <td style={{ padding: '11px 16px', fontFamily: 'DM Mono, monospace', fontSize: 11, color: 'var(--text3)' }}>
                      {v.lat ? `${v.lat}°N, ${v.lon}°E` : '—'}
                    </td>
                    <td style={{ padding: '11px 16px', color: 'var(--text3)', fontSize: 12 }}>{v.time || timeStr(v.timestamp)}</td>
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
