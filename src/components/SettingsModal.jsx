import React, { useState } from 'react';
import Modal from './Modal';
import { 
  Sliders, 
  Terminal, 
  Keyboard, 
  Sparkles, 
  Box, 
  Check, 
  CheckCircle2 
} from 'lucide-react';
import { useRoom } from '../context/RoomContext';
import { showToast } from './Toast';

export default function SettingsModal({ isOpen, onClose }) {
  const { 
    editorSettings, 
    updateEditorSettings, 
    simulateActivity, 
    setSimulateActivity 
  } = useRoom();

  const [activeTab, setActiveTab] = useState('editor'); // 'editor' | 'sandbox' | 'shortcuts'
  const [sandboxEndpoint, setSandboxEndpoint] = useState('http://localhost:5001');
  const [isSaved, setIsSaved] = useState(false);

  const handleSaveSandbox = (e) => {
    e.preventDefault();
    setIsSaved(true);
    showToast('Sandbox backend endpoint updated');
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Workspace Settings" maxWidth="max-w-xl">
      {/* Settings Navigation Tabs */}
      <div className="flex border-b border-gray-800 -mx-6 -mt-2 px-6 space-x-4 text-xs font-medium">
        <button
          onClick={() => setActiveTab('editor')}
          className={`pb-2.5 flex items-center gap-1.5 transition-colors ${
            activeTab === 'editor'
              ? 'text-cyan-400 border-b-2 border-cyan-400 font-semibold'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          Editor & Display
        </button>
        <button
          onClick={() => setActiveTab('sandbox')}
          className={`pb-2.5 flex items-center gap-1.5 transition-colors ${
            activeTab === 'sandbox'
              ? 'text-cyan-400 border-b-2 border-cyan-400 font-semibold'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <Box className="w-3.5 h-3.5" />
          Docker Sandbox API
        </button>
        <button
          onClick={() => setActiveTab('shortcuts')}
          className={`pb-2.5 flex items-center gap-1.5 transition-colors ${
            activeTab === 'shortcuts'
              ? 'text-cyan-400 border-b-2 border-cyan-400 font-semibold'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <Keyboard className="w-3.5 h-3.5" />
          Shortcuts
        </button>
      </div>

      <div className="pt-2 space-y-4">
        {activeTab === 'editor' && (
          <div className="space-y-4 text-xs">
            {/* Font Size */}
            <div className="flex items-center justify-between">
              <div>
                <label className="font-medium text-gray-200">Editor Font Size</label>
                <p className="text-[11px] text-gray-400">Controls Monaco code rendering size</p>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="range"
                  min="12"
                  max="22"
                  value={editorSettings.fontSize}
                  onChange={(e) => updateEditorSettings({ fontSize: Number(e.target.value) })}
                  className="w-24 accent-indigo-500"
                />
                <span className="font-mono text-cyan-300 w-8 text-right font-medium">
                  {editorSettings.fontSize}px
                </span>
              </div>
            </div>

            {/* Tab Size */}
            <div className="flex items-center justify-between border-t border-gray-800/60 pt-3">
              <div>
                <label className="font-medium text-gray-200">Tab Indentation</label>
                <p className="text-[11px] text-gray-400">Number of spaces per indentation level</p>
              </div>
              <select
                value={editorSettings.tabSize}
                onChange={(e) => updateEditorSettings({ tabSize: Number(e.target.value) })}
                className="bg-gray-950 border border-gray-800 rounded px-2.5 py-1 text-gray-300 font-mono text-xs focus:outline-none focus:border-indigo-500"
              >
                <option value={2}>2 spaces</option>
                <option value={4}>4 spaces</option>
              </select>
            </div>

            {/* Minimap */}
            <div className="flex items-center justify-between border-t border-gray-800/60 pt-3">
              <div>
                <label className="font-medium text-gray-200">Minimap Preview</label>
                <p className="text-[11px] text-gray-400">Show bird's eye code overview on right side</p>
              </div>
              <button
                onClick={() => updateEditorSettings({ minimap: !editorSettings.minimap })}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                  editorSettings.minimap ? 'bg-indigo-600 justify-end' : 'bg-gray-800 justify-start'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-md"></div>
              </button>
            </div>

            {/* Word Wrap */}
            <div className="flex items-center justify-between border-t border-gray-800/60 pt-3">
              <div>
                <label className="font-medium text-gray-200">Word Wrap</label>
                <p className="text-[11px] text-gray-400">Wrap long code lines inside the viewport</p>
              </div>
              <button
                onClick={() =>
                  updateEditorSettings({
                    wordWrap: editorSettings.wordWrap === 'on' ? 'off' : 'on'
                  })
                }
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                  editorSettings.wordWrap === 'on' ? 'bg-indigo-600 justify-end' : 'bg-gray-800 justify-start'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-md"></div>
              </button>
            </div>

            {/* Simulated Live Teammates */}
            <div className="flex items-center justify-between border-t border-gray-800/60 pt-3">
              <div>
                <label className="font-medium text-gray-200 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  Simulate Live Collaborators
                </label>
                <p className="text-[11px] text-gray-400">
                  Animates teammate cursors and presence when testing solo
                </p>
              </div>
              <button
                onClick={() => setSimulateActivity(!simulateActivity)}
                className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                  simulateActivity ? 'bg-cyan-600 justify-end' : 'bg-gray-800 justify-start'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-md"></div>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'sandbox' && (
          <form onSubmit={handleSaveSandbox} className="space-y-3 text-xs">
            <div className="p-3 bg-indigo-950/30 border border-indigo-800/40 rounded-xl space-y-1">
              <span className="font-semibold text-indigo-300">Docker Sandbox Architecture</span>
              <p className="text-gray-300 text-[11px] leading-relaxed">
                Code execution is designed for isolated Docker containers (Node, Python, GCC, OpenJDK).
                Code submitted is executed in stateless ephemeral sandboxes with CPU/memory limits.
              </p>
            </div>

            <div className="space-y-1">
              <label className="font-medium text-gray-300">Backend Execution Server Endpoint</label>
              <input
                type="text"
                value={sandboxEndpoint}
                onChange={(e) => setSandboxEndpoint(e.target.value)}
                placeholder="http://localhost:5001"
                className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-indigo-500"
              />
              <span className="text-[11px] text-gray-500">
                Defaults to high-fidelity frontend execution emulator when backend is not listening.
              </span>
            </div>

            <button
              type="submit"
              className="mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium flex items-center gap-1.5 transition-colors"
            >
              {isSaved ? <CheckCircle2 className="w-3.5 h-3.5" /> : null}
              <span>{isSaved ? 'Settings Saved' : 'Update Endpoint'}</span>
            </button>
          </form>
        )}

        {activeTab === 'shortcuts' && (
          <div className="space-y-2 text-xs">
            {[
              { key: 'Ctrl + Enter', desc: 'Execute active file in sandbox runner' },
              { key: 'Ctrl + S', desc: 'Trigger document synchronization' },
              { key: 'Ctrl + `', desc: 'Toggle terminal / console output drawer' },
              { key: 'Ctrl + B', desc: 'Toggle file explorer sidebar' },
              { key: 'Ctrl + P', desc: 'Quick open file switcher' },
              { key: 'Ctrl + /', desc: 'Toggle line comment in Monaco editor' }
            ].map((shortcut, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2 rounded-lg bg-gray-900/40 border border-gray-800/60"
              >
                <span className="text-gray-300">{shortcut.desc}</span>
                <kbd className="px-2 py-0.5 rounded bg-gray-800 border border-gray-700 font-mono text-cyan-300 text-[11px]">
                  {shortcut.key}
                </kbd>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
