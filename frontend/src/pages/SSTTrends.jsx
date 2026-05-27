import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts';

const LINE_COLORS = ['#0a7c6e', '#1a5f7a', '#7c3aed', '#b45309', '#16a34a'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip" style={{ padding: '10px 14px' }}>
      <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6 }}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, fontSize: 12, marginBottom: 2 }}>
          <span style={{ color: p.color }}>{p.name}</span>
          <span style={{ fontFamily: 'DM Mono, monospace', fontWeight: 600, color: 'var(--text)' }}>{p.value}°C</span>
        </div>
      ))}
    </div>
  );
};

export default function SSTTrends({ data }) {
  if (!data) return null;
  const { history, buoys } = data;
  const historyKeys = history?.[0] ? Object.keys(history[0]).filter(k => k !== 'date') : [];

  // Current snapshot data for bar chart
  const snapshot = buoys.map(b => ({ name: b.buoy_name.slice(0, 6), sst: b.sst_celsius }));

  return (
    <div>

      {/* Hero Banner */}
      <div style={{
        height: 260,
        position: 'relative',
        overflow: 'hidden',
        background: '#082032',
      }}>
        <img
          src="https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=1600&q=80"
          alt="Ocean"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: 0.65,
            filter: 'brightness(1.25)',
          }}
          onError={e => e.target.style.display = 'none'}
        />

        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(8,32,50,0.7))',
        }} />

        <div className="container" style={{
          position: 'absolute',
          bottom: 28,
          left: 0,
          right: 0,
        }}>
          <div style={{
            fontFamily: 'Playfair Display, serif',
            fontSize: 34,
            fontWeight: 800,
            color: '#fff',
            lineHeight: 1.2,
          }}>
            Sea Surface Temperature Trends
          </div>

          <div style={{
            fontSize: 13,
            color: 'rgba(255,255,255,0.88)',
            marginTop: 5,
          }}>
            Real-time buoy monitoring • Azure SQL analytics • Kerala coastal SST anomalies
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 32, paddingBottom: 48 }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 26, fontWeight: 700, color: 'var(--text)' }}>
            Sea Surface Temperature Trends
          </div>
          <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 4 }}>
  Real-time sea surface temperature monitoring across Kerala coastal buoy stations
</div>
        </div>

        
        {/* 30-day area chart */}
        <div className="card fade-up fade-up-1" style={{ padding: '20px 24px', marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>30-Day SST History (°C)</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 18 }}>
            Red reference lines at 27.5°C and 30.5°C indicate Kerala anomaly thresholds
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={history} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
              <defs>
                {historyKeys.map((k, i) => (
                  <linearGradient key={k} id={`g${i}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={LINE_COLORS[i % LINE_COLORS.length]} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={LINE_COLORS[i % LINE_COLORS.length]} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" stroke="var(--text3)" tick={{ fontSize: 10, fontFamily: 'DM Mono' }} interval={4} />
              <YAxis domain={[25, 33]} stroke="var(--text3)" tick={{ fontSize: 10, fontFamily: 'DM Mono' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <ReferenceLine y={30.5} stroke="var(--red)" strokeDasharray="4 2" strokeWidth={1.5} label={{ value: '30.5°C', fill: 'var(--red)', fontSize: 10 }} />
              <ReferenceLine y={27.5} stroke="var(--amber)" strokeDasharray="4 2" strokeWidth={1.5} label={{ value: '27.5°C', fill: 'var(--amber)', fontSize: 10 }} />
              {historyKeys.map((k, i) => (
                <Area key={k} type="monotone" dataKey={k}
                  stroke={LINE_COLORS[i % LINE_COLORS.length]}
                  fill={`url(#g${i})`}
                  strokeWidth={2} dot={false} />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Current snapshot */}
        <div className="card fade-up fade-up-2" style={{ padding: '20px 24px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Current SST per Station</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 18 }}>
            Live readings from all 8 buoy stations
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={snapshot} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" stroke="var(--text3)" tick={{ fontSize: 10, fontFamily: 'DM Mono' }} />
              <YAxis domain={[25, 33]} stroke="var(--text3)" tick={{ fontSize: 10, fontFamily: 'DM Mono' }} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={30.5} stroke="var(--red)" strokeDasharray="4 2" />
              <ReferenceLine y={27.5} stroke="var(--amber)" strokeDasharray="4 2" />
              <Bar dataKey="sst" name="SST °C" fill="var(--teal)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}