const ZONE_COLOR = { OPTIMAL: 'green', MODERATE: 'amber', AVOID: 'red' };
const ZONE_FG    = { OPTIMAL: 'var(--green)', MODERATE: 'var(--amber)', AVOID: 'var(--red)' };
const ZONE_LABEL = { OPTIMAL: 'Best conditions', MODERATE: 'Acceptable', AVOID: 'Not recommended' };

const FISH_IMG = 'https://www.fao.org/images/devclimatechangelibraries/default-album/pps/western-fisheries-not-collapsing-but-asian-waters-unmanaged-and-unrecorded-1.jpg?sfvrsn=f02a462c_1';

export default function FishZones({ data }) {
  if (!data) return null;
  const { zones } = data;

  return (
    <div>
      {/* Banner */}
      <div style={{
        height: 260,
        position: 'relative',
        overflow: 'hidden',
        background: '#061a28',
      }}>
        <img
          src={FISH_IMG}
          alt="Fish school"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: 0.6,
            filter: 'brightness(1.3)',
          }}
          onError={e => e.target.style.display = 'none'}
        />
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(6,26,40,0.65))'
        }} />
        <div className="container" style={{ position: 'absolute', bottom: 24, left: 0, right: 0 }}>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 26, fontWeight: 700, color: '#fff' }}>
            Optimal Fishing Zones
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 4 }}>
            Ranked by SST + chlorophyll formula 
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 28, paddingBottom: 48 }}>
        {/* Legend */}
        <div style={{ display: 'flex', gap: 20, marginBottom: 24, flexWrap: 'wrap' }}>
          {Object.entries(ZONE_LABEL).map(([k, v]) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: ZONE_FG[k] }} />
              <span style={{ fontSize: 12, color: 'var(--text2)' }}><b>{k}</b> — {v}</span>
            </div>
          ))}
        </div>

        {/* Zone cards grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {zones.map((z, i) => (
            <div
              key={z.zone_id}
              className="card fade-up"
              style={{
                animationDelay: `${i * 40}ms`,
                borderTop: `3px solid ${ZONE_FG[z.status]}`,
                overflow: 'hidden',
                transition: 'transform 0.18s, box-shadow 0.18s',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = 'var(--shadow2)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--shadow)'; }}
            >
              {/* Rank badge */}
              {i === 0 && (
                <div style={{
                  background: 'var(--teal)', color: '#fff',
                  fontSize: 10, fontWeight: 700, letterSpacing: 1,
                  padding: '4px 12px', textAlign: 'center',
                }}>
                  TOP ZONE
                </div>
              )}

              <div style={{ padding: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{z.zone_name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'DM Mono, monospace', marginTop: 2 }}>
                      {z.lat}°N · {z.lon}°E
                    </div>
                  </div>
                  <span className={`badge badge-${ZONE_COLOR[z.status]}`}>{z.status}</span>
                </div>

                {/* Probability bar */}
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text3)', marginBottom: 5 }}>
                    <span>Fish Probability</span>
                    <span style={{ fontWeight: 700, color: ZONE_FG[z.status], fontFamily: 'DM Mono, monospace' }}>
                      {(z.fish_prob * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div style={{ background: 'var(--bg3)', borderRadius: 4, height: 6, overflow: 'hidden' }}>
                    <div style={{
                      width: `${z.fish_prob * 100}%`, height: '100%',
                      background: ZONE_FG[z.status], borderRadius: 4,
                      transition: 'width 0.6s cubic-bezier(.4,0,.2,1)',
                    }} />
                  </div>
                </div>

                {/* Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {[
                    ['SST', `${z.sst}°C`],
                    ['Chlorophyll', `${z.chlorophyll} mg/m³`],
                  ].map(([k, v]) => (
                    <div key={k} style={{ background: 'var(--bg3)', borderRadius: 6, padding: '8px 10px' }}>
                      <div style={{ fontSize: 9, color: 'var(--text3)', letterSpacing: 0.5, textTransform: 'uppercase' }}>{k}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'DM Mono, monospace', color: 'var(--text)', marginTop: 2 }}>{v}</div>
                    </div>
                  ))}
                </div>

                {/* Species */}
                <div style={{
                  marginTop: 12, padding: '8px 10px', borderRadius: 6,
                  background: 'var(--teal3)', display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--teal)', flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: 'var(--teal)', fontWeight: 500 }}>{z.species}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
