import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../utils/api';

export function useData(refreshInterval = 30000) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [source,  setSource]  = useState('loading'); // 'live' | 'backend_only' | 'offline'
  const timerRef = useRef(null);

  const fetch = useCallback(async () => {
    try {
      const [buoys, stats, history, alerts, zones, violations, status] = await Promise.all([
        api.buoys(), api.stats(), api.history(),
        api.alerts(), api.zones(), api.violations(), api.status(),
      ]);
      setData({ buoys, stats, history, alerts, zones, violations });
      setSource('live');
      setError(null);
    } catch (err) {
      // Backend offline — show nothing, surface the error
      setData(null);
      setSource('offline');
      setError('Backend unreachable. Start the FastAPI server to load real data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch();
    timerRef.current = setInterval(fetch, refreshInterval);
    return () => clearInterval(timerRef.current);
  }, [fetch, refreshInterval]);

  return { data, loading, error, source, refresh: fetch };
}
