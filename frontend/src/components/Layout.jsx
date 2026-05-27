import { useState, useEffect } from 'react';
import {
  Waves, LayoutDashboard, Fish, TrendingUp, Ship,
  Bell, Cloud, Sun, Moon, RefreshCw
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Dashboard',   icon: LayoutDashboard },
  { label: 'Fish Zones',  icon: Fish },
  { label: 'SST Trends',  icon: TrendingUp },
  { label: 'Alerts',      icon: Bell },
  { label: 'Vessels',     icon: Ship },
  { label: 'About', icon: Cloud },
];

const SOURCE_CONFIG = {
  live:         { color: 'badge-green', dot: 'var(--green)',  label: 'Live' },
  backend_only: { color: 'badge-amber', dot: 'var(--amber)',  label: 'Backend ' },
  offline:      { color: 'badge-red',   dot: 'var(--red)',    label: 'Offline' },
  loading:      { color: 'badge-amber', dot: 'var(--amber)',  label: 'Connecting…' },
};

export function Layout({ pages, current, onNav, source, onRefresh, children }) {
  const [dark, setDark] = useState(() => localStorage.getItem('kadalkaval-theme') === 'dark');
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('kadalkaval-theme', dark ? 'dark' : 'light');
  }, [dark]);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const badge = SOURCE_CONFIG[source] || SOURCE_CONFIG.offline;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* NAV */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: scrolled ? 'var(--bg2)' : 'var(--bg)',
        borderBottom: `1px solid ${scrolled ? 'var(--border)' : 'transparent'}`,
        transition: 'all 0.2s',
        boxShadow: scrolled ? 'var(--shadow)' : 'none',
      }}>
        <div className="container" style={{ display: 'flex', alignItems: 'center', height: 60, gap: 0 }}>
          {/* Logo */}
          <div style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, marginRight: 32 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, var(--teal) 0%, var(--ocean) 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Waves size={18} color="#fff" strokeWidth={2} />
            </div>
            <div>
              <div style={{ fontFamily: 'Playfair Display, serif', fontWeight: 700, fontSize: 16, color: 'var(--teal)', letterSpacing: 1 }}>
                KADALKAVAL
              </div>
              <div style={{ fontSize: 9, color: 'var(--text3)', letterSpacing: 1.5, textTransform: 'uppercase', marginTop: -2 }}>
                Kerala Fisheries Intelligence
              </div>
            </div>
          </div>

          {/* Nav links */}
          <div style={{ display: 'flex', gap: 2, flex: 1, overflowX: 'auto' }}>
            {NAV_ITEMS.map(({ label, icon: Icon }) => {
              const isActive = current === label;
              return (
                <button
                  key={label}
                  onClick={() => onNav(label)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '7px 13px',
                    background: isActive ? 'var(--teal3)' : 'transparent',
                    color: isActive ? 'var(--teal)' : 'var(--text2)',
                    border: 'none',
                    borderBottom: isActive ? '2px solid var(--teal)' : '2px solid transparent',
                    borderRadius: isActive ? '8px 8px 0 0' : '8px',
                    cursor: 'pointer', fontSize: 13, fontWeight: 500,
                    whiteSpace: 'nowrap', transition: 'all 0.15s',
                  }}
                >
                  <Icon size={14} strokeWidth={2} />
                  {label}
                </button>
              );
            })}
          </div>

          {/* Right controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 16 }}>
            <span className={`badge ${badge.color}`} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: badge.dot,
                animation: 'pulse-dot 2s infinite',
              }} />
              {badge.label}
            </span>

            <button onClick={onRefresh} className="btn btn-ghost" style={{ padding: '6px 10px' }}>
              <RefreshCw size={14} />
            </button>

            <button onClick={() => setDark(d => !d)} className="btn btn-ghost" style={{ padding: '6px 10px' }}>
              {dark ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </div>
        </div>
      </nav>

      {/* PAGE CONTENT */}
      <main>{children}</main>

      {/* FOOTER */}
      <footer style={{
        borderTop: '1px solid var(--border)', marginTop: 60,
        padding: '20px 0', background: 'var(--bg2)',
      }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ fontSize: 13, color: 'var(--text3)' }}>
            KADALKAVAL — Group 23, S6 Cloud Computing, 2025–26
          </div>
          <div style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'DM Mono, monospace' }}>
            Arjun Rajesh · D Aditya Kiran · Deon Sajan · Vighnesh B
          </div>
        </div>
      </footer>
    </div>
  );
}
