/**
 * Dynamic network & backend configuration helper.
 * Automatically resolves the correct backend host whether running on localhost,
 * LAN Wi-Fi (e.g. 10.50.3.163), or a public tunnel.
 */

export function getBackendUrl() {
  if (typeof window === 'undefined') return 'http://localhost:5001';

  // Use current origin so all API requests and Socket.io WebSockets
  // seamlessly route through Vite's built-in /api and /socket.io proxy.
  // This works identically on localhost, Wi-Fi LAN IP, hotspot, or public tunnels!
  return window.location.origin;
}

export function getApiBaseUrl() {
  return `${getBackendUrl()}/api`;
}
