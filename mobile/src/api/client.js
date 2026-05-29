import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE } from './config';

async function getTokens() {
  const access = await AsyncStorage.getItem('aura_access');
  const refresh = await AsyncStorage.getItem('aura_refresh');
  return { access, refresh };
}

async function setTokens(access, refresh) {
  if (access) await AsyncStorage.setItem('aura_access', access);
  if (refresh) await AsyncStorage.setItem('aura_refresh', refresh);
}

export async function clearTokens() {
  await AsyncStorage.removeItem('aura_access');
  await AsyncStorage.removeItem('aura_refresh');
}

async function refreshAccess() {
  const { refresh } = await getTokens();
  if (!refresh) throw new Error('No refresh token');

  const res = await fetch(`${BASE}/auth/token/refresh/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh }),
  });

  if (!res.ok) throw new Error('Refresh failed');
  const data = await res.json();
  await setTokens(data.access, data.refresh);
  return data.access;
}

// Global listener for auth failures (session expiry)
let onSessionExpiredCallback = null;
export function setSessionExpiredHandler(callback) {
  onSessionExpiredCallback = callback;
}

async function request(method, url, body, isFormData = false, useAuth = true) {
  const { access } = await getTokens();
  const headers = {};
  if (useAuth && access) headers['Authorization'] = `Bearer ${access}`;
  if (!isFormData) headers['Content-Type'] = 'application/json';

  const options = { method, headers };
  if (body) options.body = isFormData ? body : JSON.stringify(body);

  let res = await fetch(`${BASE}${url}`, options);

  // 401 → try refresh
  if (useAuth && res.status === 401) {
    try {
      const newAccess = await refreshAccess();
      headers['Authorization'] = `Bearer ${newAccess}`;
      res = await fetch(`${BASE}${url}`, { ...options, headers });
    } catch {
      await clearTokens();
      if (onSessionExpiredCallback) {
        onSessionExpiredCallback();
      }
      throw new Error('Session expired');
    }
  }

  const text = await res.text();
  let json = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { detail: text };
  }

  if (!res.ok) {
    const fieldErrors = Object.values(json).flat().join(' ');
    const msg = json.detail || json.message || fieldErrors || res.statusText;
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
  const data = await request('POST', '/auth/token/', { username, password }, false, false);
  await setTokens(data.access, data.refresh);
  return data;
}

export async function register(payload) {
  return request('POST', '/register/', payload, false, false);
}

export async function isLoggedIn() {
  const { access } = await getTokens();
  return !!access;
}
