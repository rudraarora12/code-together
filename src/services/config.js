/**
 * Dynamic network & backend configuration helper.
 * Automatically resolves the correct backend host whether running on localhost,
 * LAN Wi-Fi (e.g. 10.50.3.163), or a public tunnel.
 */

export function getBackendUrl() {
  if (typeof window === 'undefined') return 'http://localhost:5001';

  const { protocol, hostname, port } = window.location;

  // If accessing through a custom public tunnel or proxy without port in URL
  if (!port || port === '80' || port === '443') {
    return `${protocol}//${hostname}:5001`;
  }

  // If running on Vite dev server (port 5173) or any client port,
  // target the backend on port 5001 with the exact same hostname (e.g. 10.50.3.163 or localhost)
  return `${protocol}//${hostname}:5001`;
}

export function getApiBaseUrl() {
  return `${getBackendUrl()}/api`;
}
