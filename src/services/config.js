/**
 * Dynamic network & backend configuration helper.
 * Automatically resolves the correct backend and socket hosts:
 * 1. Checks VITE_API_URL and VITE_SOCKET_URL environment variables (for production Vercel deployment)
 * 2. Falls back to window.location.origin (for local Vite dev proxy and public tunnels)
 * 3. Falls back to http://localhost:5001 (for SSR or Node environments)
 */

export function getBackendUrl() {
  // Support production environment variable on Vercel
  const envApi = import.meta.env?.VITE_API_URL;
  if (envApi && typeof envApi === 'string' && envApi.trim()) {
    return envApi.replace(/\/api\/?$/, '').replace(/\/$/, '');
  }

  if (typeof window === 'undefined') return 'http://localhost:5001';

  // Use current origin so all API requests route through Vite proxy or same-origin deployment
  return window.location.origin;
}

export function getSocketUrl() {
  const envSocket = import.meta.env?.VITE_SOCKET_URL;
  if (envSocket && typeof envSocket === 'string' && envSocket.trim()) {
    return envSocket.replace(/\/$/, '');
  }
  return getBackendUrl();
}

export function getApiBaseUrl() {
  const envApi = import.meta.env?.VITE_API_URL;
  if (envApi && typeof envApi === 'string' && envApi.trim()) {
    const raw = envApi.replace(/\/$/, '');
    return raw.endsWith('/api') ? raw : `${raw}/api`;
  }
  return `${getBackendUrl()}/api`;
}
