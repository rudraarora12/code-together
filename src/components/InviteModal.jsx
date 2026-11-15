import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { 
  Copy, 
  Check, 
  Users, 
  Link2, 
  Wifi, 
  Laptop, 
  Globe, 
  Sparkles, 
  QrCode,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';
import { showToast } from './Toast';
import { getBackendUrl } from '../services/config';

export default function InviteModal({ isOpen, onClose, roomId, roomName, collaborators }) {
  const [copiedType, setCopiedType] = useState(null);
  const [networkIp, setNetworkIp] = useState('');
  const [activeTab, setActiveTab] = useState('wifi'); // 'wifi' | 'local' | 'tunnel'
  const [showQr, setShowQr] = useState(false);

  // Fetch host LAN IP from backend
  useEffect(() => {
    if (!isOpen) return;

    fetch(`${getBackendUrl()}/api/network-info`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.localIp && data.localIp !== 'localhost') {
          setNetworkIp(data.localIp);
        }
      })
      .catch(() => {});
  }, [isOpen]);

  const clientPort = window.location.port || '5173';
  const protocol = window.location.protocol;

  // 1. Wi-Fi / Hackathon LAN URL (teammates on the same Wi-Fi)
  const wifiHost = networkIp || (window.location.hostname !== 'localhost' ? window.location.hostname : '10.50.3.163');
  const wifiInviteUrl = `${protocol}//${wifiHost}:${clientPort}/room/${roomId}`;

  // 2. Localhost URL (same laptop)
  const localInviteUrl = `${protocol}//localhost:${clientPort}/room/${roomId}`;

  // Current active URL based on user selection or hostname
  const currentUrl = activeTab === 'local' ? localInviteUrl : wifiInviteUrl;

  const handleCopy = (url, type) => {
    navigator.clipboard.writeText(url);
    setCopiedType(type);
    showToast('Invitation link copied to clipboard!');
    setTimeout(() => setCopiedType(null), 2500);
  };

  // Generate lightweight QR code using Google Charts API or quick SVG
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(wifiInviteUrl)}&bgcolor=121422&color=67e8f9&margin=1`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Invite Teammates to Collaborate" maxWidth="max-w-lg">
      <div className="space-y-4 text-xs">
        {/* Active Project Header Card */}
        <div className="bg-[#121424] border border-gray-800 rounded-xl p-3 flex items-center justify-between">
          <div className="truncate pr-2">
            <span className="text-[10px] text-gray-500 uppercase font-mono tracking-wider">Project Room</span>
            <h4 className="text-sm font-bold text-white truncate">{roomName}</h4>
          </div>
          <div className="flex items-center space-x-1.5 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2.5 py-1 rounded-lg shrink-0 font-medium">
            <Users className="w-3.5 h-3.5" />
            <span>{collaborators.length} Online</span>
          </div>
        </div>

        {/* Tab Selection: Wi-Fi vs Localhost vs Public */}
        <div className="flex bg-[#0f111c] p-1 rounded-xl border border-gray-800 space-x-1">
          <button
            onClick={() => setActiveTab('wifi')}
            className={`flex-1 py-1.5 px-2 rounded-lg font-medium transition-all flex items-center justify-center space-x-1.5 ${
              activeTab === 'wifi'
                ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Wifi className="w-3.5 h-3.5" />
            <span>Hackathon Wi-Fi / LAN</span>
          </button>

          <button
            onClick={() => setActiveTab('local')}
            className={`flex-1 py-1.5 px-2 rounded-lg font-medium transition-all flex items-center justify-center space-x-1.5 ${
              activeTab === 'local'
                ? 'bg-gray-800 text-cyan-300 shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>Same Laptop (Local)</span>
          </button>

          <button
            onClick={() => setActiveTab('tunnel')}
            className={`flex-1 py-1.5 px-2 rounded-lg font-medium transition-all flex items-center justify-center space-x-1.5 ${
              activeTab === 'tunnel'
                ? 'bg-gray-800 text-cyan-300 shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Remote / Internet</span>
          </button>
        </div>

        {/* TAB 1: Hackathon Wi-Fi / LAN Sharing (Recommended) */}
        {activeTab === 'wifi' && (
          <div className="space-y-3">
            <div className="p-3 bg-cyan-950/20 border border-cyan-800/30 rounded-xl space-y-1">
              <div className="flex items-center space-x-1.5 text-cyan-300 font-semibold text-xs">
                <Wifi className="w-3.5 h-3.5" />
                <span>Recommended for Hackathon Teams</span>
              </div>
              <p className="text-[11px] text-gray-300 leading-relaxed">
                Send this link to any teammate connected to the same hackathon Wi-Fi or mobile hotspot. They can open it directly on their laptop to edit in real time!
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300 flex items-center justify-between">
                <span>Teammate Invitation URL (Wi-Fi)</span>
                <span className="text-[10px] text-emerald-400 font-mono">Works on any laptop</span>
              </label>

              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  readOnly
                  value={wifiInviteUrl}
                  onClick={(e) => e.target.select()}
                  className="flex-1 bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs font-mono text-cyan-300 truncate outline-none select-all"
                />
                <button
                  onClick={() => handleCopy(wifiInviteUrl, 'wifi')}
                  className={`px-4 py-2 rounded-xl font-semibold text-xs flex items-center space-x-1.5 transition-all shadow-md shrink-0 ${
                    copiedType === 'wifi'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
                  }`}
                >
                  {copiedType === 'wifi' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedType === 'wifi' ? 'Copied!' : 'Copy Link'}</span>
                </button>
              </div>
            </div>

            {/* Toggle QR Code */}
            <div className="pt-1 flex items-center justify-between text-[11px] text-gray-400">
              <button
                type="button"
                onClick={() => setShowQr(!showQr)}
                className="flex items-center space-x-1 text-cyan-400 hover:text-cyan-300 transition-colors"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>{showQr ? 'Hide QR Code' : 'Show Mobile / Tablet QR Code'}</span>
              </button>
              <span className="font-mono text-gray-500">IP: {wifiHost}</span>
            </div>

            {showQr && (
              <div className="p-3 bg-gray-950 border border-gray-800 rounded-xl flex flex-col items-center justify-center space-y-2 animate-fade-in">
                <img
                  src={qrCodeUrl}
                  alt="Room Invitation QR Code"
                  className="w-36 h-36 rounded-lg bg-gray-900 p-1"
                />
                <p className="text-[10px] text-gray-400 text-center">
                  Teammates can scan with phone camera to instantly test live collaboration.
                </p>
              </div>
            )}

            <div className="p-2.5 bg-gray-900/60 border border-gray-800 rounded-xl text-[11px] text-gray-400 space-y-1">
              <span className="text-amber-400 font-semibold flex items-center gap-1">
                💡 Having trouble connecting on Campus/Hackathon Wi-Fi?
              </span>
              <p className="text-gray-300 leading-relaxed">
                Campus and event Wi-Fis often enable <em>AP Isolation</em> to block direct laptop connections. 
                <br />
                <strong>Fast Fix:</strong> Connect teammates to a <strong>Phone Mobile Hotspot</strong>, or switch to the <strong>Remote / Internet</strong> tab to generate a public link!
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: Local Machine (for testing across 2 tabs) */}
        {activeTab === 'local' && (
          <div className="space-y-3">
            <p className="text-gray-400 text-xs leading-relaxed">
              Use this link when testing collaboration on your own machine across two browser windows or in an incognito tab.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-300">Localhost Invitation URL</label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  readOnly
                  value={localInviteUrl}
                  onClick={(e) => e.target.select()}
                  className="flex-1 bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs font-mono text-gray-300 truncate outline-none select-all"
                />
                <button
                  onClick={() => handleCopy(localInviteUrl, 'local')}
                  className={`px-4 py-2 rounded-xl font-semibold text-xs flex items-center space-x-1.5 transition-all shadow-md shrink-0 ${
                    copiedType === 'local'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-800 hover:bg-gray-700 text-white'
                  }`}
                >
                  {copiedType === 'local' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedType === 'local' ? 'Copied!' : 'Copy Link'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Public Internet Tunnel */}
        {activeTab === 'tunnel' && (
          <div className="space-y-3">
            <div className="p-3 bg-purple-950/20 border border-purple-800/30 rounded-xl space-y-1.5">
              <div className="flex items-center space-x-1.5 text-purple-300 font-semibold text-xs">
                <Globe className="w-3.5 h-3.5" />
                <span>Invite Remote Friends (Across the Internet)</span>
              </div>
              <p className="text-[11px] text-gray-300 leading-relaxed">
                If your teammates are not in the same room or on the same Wi-Fi, you can expose your workspace instantly using a free tunnel:
              </p>
            </div>

            <div className="p-2.5 bg-gray-950 border border-gray-800 rounded-xl space-y-1 font-mono text-[11px]">
              <span className="text-gray-400 font-sans">Run this single command in a new terminal:</span>
              <div className="flex items-center justify-between text-cyan-300 bg-gray-900/80 px-2 py-1.5 rounded">
                <span>npm run tunnel</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText('npm run tunnel');
                    showToast('Command copied to clipboard!');
                  }}
                  className="hover:text-white p-0.5 text-gray-400"
                  title="Copy command"
                >
                  <Copy className="w-3 h-3" />
                </button>
              </div>
              <p className="text-[10px] text-emerald-400 font-sans pt-1">
                ✓ Bypasses Wi-Fi restrictions and firewalls automatically. Teammates anywhere can join!
              </p>
            </div>
          </div>
        )}

        {/* Room ID reference */}
        <div className="p-2.5 bg-gray-950/60 border border-dashed border-gray-800 rounded-xl flex items-center justify-between text-[11px] text-gray-400 font-mono">
          <span>Room ID: <strong className="text-white">{roomId}</strong></span>
          <span className="text-[10px] text-cyan-400">Yjs CRDT Real-Time Sync</span>
        </div>

        {/* Live connected users preview */}
        <div className="pt-2 border-t border-gray-800/80">
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-2">
            Teammates in this room ({collaborators.length})
          </span>
          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {collaborators.map((c, i) => (
              <div
                key={c.id || i}
                className="flex items-center justify-between p-2 rounded-lg bg-gray-900/40 border border-gray-800/60"
              >
                <div className="flex items-center space-x-2">
                  <img
                    src={c.avatar}
                    alt={c.name}
                    className="w-5 h-5 rounded-full object-cover ring-1"
                    style={{ ringColor: c.color }}
                  />
                  <span className="font-medium text-white">{c.name}</span>
                </div>
                <span
                  className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: `${c.color}20`, color: c.color }}
                >
                  {c.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
