// ── API base — change this to your deployed backend URL ──────────────────
export const API_BASE =
  import.meta.env.VITE_API_URL ||
  'https://kadalkaval-api.onrender.com';

async function get(path) {
  const res = await fetch(`${API_BASE}${path}`, { signal: AbortSignal.timeout(4000) });
  if (!res.ok) throw new Error(`API ${path} → ${res.status}`);
  return res.json();
}

export const api = {
  status:     () => get('/api/status'),
  buoys:      () => get('/api/buoys'),
  stats:      () => get('/api/stats'),
  history:    () => get('/api/history'),
  alerts:     () => get('/api/alerts'),
  zones:      () => get('/api/zones'),
  violations: () => get('/api/violations'),
};
