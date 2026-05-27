import { useState } from 'react';
import { Layout } from './components/Layout.jsx';
import { useData } from './hooks/useData.js';
import Dashboard  from './pages/Dashboard.jsx';
import FishZones  from './pages/FishZones.jsx';
import SSTTrends  from './pages/SSTTrends.jsx';
import Alerts     from './pages/Alerts.jsx';
import Vessels    from './pages/Vessels.jsx';
import CloudSetup from './pages/CloudSetup.jsx';

const PAGES = ['Dashboard', 'Fish Zones', 'SST Trends', 'Alerts', 'Vessels', 'About'];  

// Offline screen shown when backend is not running
function OfflineScreen({ onRetry }) {
  return (
    <div style={{
      minHeight: '80vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32,
      textAlign: 'center',
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: '50%',
        background: 'var(--bg3)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 28,
      }}>⚡</div>
      <div style={{ fontFamily: 'Playfair Display, serif', fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>
        Backend Not Running
      </div>
      <div style={{ fontSize: 14, color: 'var(--text3)', maxWidth: 420, lineHeight: 1.7 }}>
        No data to show. This dashboard only displays real data from the Azure backend.
        <br />Start the FastAPI server first:
      </div>
      <div style={{
        background: 'var(--bg3)', borderRadius: 8, padding: '12px 24px',
        fontFamily: 'DM Mono, monospace', fontSize: 13, color: 'var(--teal)',
        border: '1px solid var(--border)',
      }}>
        cd backend &amp;&amp; uvicorn main:app --reload --port 8000
      </div>
      <button
        onClick={onRetry}
        style={{
          marginTop: 8, padding: '10px 24px', borderRadius: 8,
          background: 'var(--teal)', color: '#fff', border: 'none',
          fontSize: 13, fontWeight: 600, cursor: 'pointer',
        }}
      >
        Retry Connection
      </button>
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState('Dashboard');
  const { data, loading, error, source, refresh } = useData();

  const renderPage = () => {
   if (page === 'About') return <CloudSetup />;
    if (loading) return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 14, color: 'var(--text3)' }}>Connecting to backend…</div>
      </div>
    );
    if (error || !data) return <OfflineScreen onRetry={refresh} />;

    switch (page) {
      case 'Dashboard':  return <Dashboard  data={data} />;
      case 'Fish Zones': return <FishZones  data={data} />;
      case 'SST Trends': return <SSTTrends  data={data} />;
      case 'Alerts':     return <Alerts     data={data} />;
      case 'Vessels':    return <Vessels    data={data} />;
      default:           return <Dashboard  data={data} />;
    }
  };

  return (
    <Layout pages={PAGES} current={page} onNav={setPage} source={source} onRefresh={refresh}>
      {renderPage()}
    </Layout>
  );
}
