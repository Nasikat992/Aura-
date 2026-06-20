// ── Axios-style fetch wrapper with JWT auth ──────────────────────
const BASE = import.meta.env.VITE_API_URL || '/api';

function getTokens() {
  return {
    access: localStorage.getItem('aura_access'),
    refresh: localStorage.getItem('aura_refresh'),
  };
}
function setTokens(access, refresh) {
  localStorage.setItem('aura_access', access);
  if (refresh) localStorage.setItem('aura_refresh', refresh);
}
export function clearTokens() {
  localStorage.removeItem('aura_access');
  localStorage.removeItem('aura_refresh');
}

async function refreshAccess() {
  const { refresh } = getTokens();
  if (!refresh) throw new Error('No refresh token');
  const res = await fetch(`${BASE}/auth/token/refresh/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh }),
  });
  if (!res.ok) throw new Error('Refresh failed');
  const data = await res.json();
  setTokens(data.access, data.refresh);
  return data.access;
}

async function request(method, url, body, isFormData = false) {
  const { access } = getTokens();
  const headers = {};
  if (access) headers['Authorization'] = `Bearer ${access}`;
  if (!isFormData) headers['Content-Type'] = 'application/json';

  const options = { method, headers };
  if (body) options.body = isFormData ? body : JSON.stringify(body);

  let res = await fetch(`${BASE}${url}`, options);

  // 401 → try refresh
  if (res.status === 401) {
    try {
      const newAccess = await refreshAccess();
      headers['Authorization'] = `Bearer ${newAccess}`;
      res = await fetch(`${BASE}${url}`, { ...options, headers });
    } catch {
      clearTokens();
      window.location.href = '/login';
      throw new Error('Session expired');
    }
  }

  const text = await res.text();
  const json = text ? JSON.parse(text) : {};

  if (!res.ok) {
    const msg = json.detail || json.message || JSON.stringify(json) || res.statusText;
    throw Object.assign(new Error(msg), { status: res.status, data: json });
  }
  return json;
}

export const api = {
  get: (url) => request('GET', url),
  post: (url, body) => request('POST', url, body),
  put: (url, body) => request('PUT', url, body),
  patch: (url, body) => request('PATCH', url, body),
  delete: (url) => request('DELETE', url),
  upload: (url, formData, method = 'POST') => request(method, url, formData, true),
};

// ── Auth helpers ─────────────────────────────────────────────────
export async function login(username, password) {
  const data = await request('POST', '/auth/token/', { username, password });
  setTokens(data.access, data.refresh);
  return data;
}

export async function register(payload) {
  return request('POST', '/register/', payload);
}

export function isLoggedIn() {
  return !!getTokens().access;
}
