export function StatCard({ icon: Icon, label, value, unit, sub, accent = 'teal', delay = 0 }) {
  const colors = {
    teal:  { bg: 'var(--teal3)',  fg: 'var(--teal)'  },
    ocean: { bg: 'var(--ocean2)', fg: 'var(--ocean)' },
    amber: { bg: 'var(--amber2)', fg: 'var(--amber)' },
    red:   { bg: 'var(--red2)',   fg: 'var(--red)'   },
    green: { bg: 'var(--green2)', fg: 'var(--green)' },
  };
  const c = colors[accent] || colors.teal;

  return (
    <div className={`card fade-up`} style={{
      padding: '20px 24px', animationDelay: `${delay}ms`,
      borderTop: `3px solid ${c.fg}`,
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: 10,
        background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 12,
      }}>
        <Icon size={18} color={c.fg} strokeWidth={2} />
      </div>
      <div style={{ fontSize: 11, color: 'var(--text3)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        <span style={{ fontSize: 28, fontWeight: 700, fontFamily: 'DM Mono, monospace', color: c.fg }}>
          {value ?? '—'}
        </span>
        {unit && <span style={{ fontSize: 13, color: 'var(--text3)' }}>{unit}</span>}
      </div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}
