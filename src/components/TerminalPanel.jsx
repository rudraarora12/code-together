import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Square, 
  RotateCw, 
  Trash2, 
  Terminal as TerminalIcon, 
  Maximize2, 
  Minimize2,
  ChevronDown,
  ExternalLink,
  Layers,
  CheckCircle2,
  XCircle,
  Loader2,
  Globe
} from 'lucide-react';
import { useRoom } from '../context/RoomContext';

export default function TerminalPanel() {
  const { 
    runStatus, 
    runLogs, 
    previewUrl, 
    runProject, 
    stopProject, 
    restartProject, 
    clearTerminal, 
    terminalTab, 
    setTerminalTab, 
    isTerminalOpen, 
    setIsTerminalOpen,
    setIsPreviewOpen,
    projectTypeName,
    runCommand
  } = useRoom();

  const [isExpanded, setIsExpanded] = useState(false);
  const [terminalInput, setTerminalInput] = useState('');
  const [cliHistory, setCliHistory] = useState([
    { type: 'system', text: 'CodeTogether Isolated Sandbox Terminal' },
    { type: 'system', text: 'Commands: run, stop, restart, clear, env, whoami' }
  ]);

  const logsEndRef = useRef(null);

  // Auto-scroll logs to bottom
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [runLogs, cliHistory]);

  if (!isTerminalOpen) return null;

  const handleCliSubmit = (e) => {
    e.preventDefault();
    if (!terminalInput.trim()) return;

    const cmd = terminalInput.trim();
    const newEntry = { type: 'user', text: `$ ${cmd}` };

    if (cmd === 'clear') {
      setCliHistory([]);
      setTerminalInput('');
      return;
    }

    let responseText = '';
    if (cmd === 'help') {
      responseText = 'Available commands: run, stop, restart, clear, whoami, env, status';
    } else if (cmd === 'run') {
      runProject();
      responseText = 'Initiating project run in sandbox...';
    } else if (cmd === 'stop') {
      stopProject();
      responseText = 'Stopping running project...';
    } else if (cmd === 'restart') {
      restartProject();
      responseText = 'Restarting project...';
    } else if (cmd === 'status') {
      responseText = `Runtime status: ${runStatus}, Command: ${runCommand || 'default'}`;
    } else if (cmd === 'whoami') {
      responseText = 'collaborator@codetogether-sandbox (isolated runtime)';
    } else if (cmd === 'env') {
      responseText = 'NODE_ENV=development\nPORT=auto-allocated\nSANDBOX_ISOLATED=true';
    } else {
      responseText = `sandbox: command not recognized: ${cmd}`;
    }

    setCliHistory(prev => [...prev, newEntry, { type: 'output', text: responseText }]);
    setTerminalInput('');
  };

  const getStatusBadge = () => {
    switch (runStatus) {
      case 'running':
        return (
          <span className="flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Running</span>
          </span>
        );
      case 'building':
        return (
          <span className="flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40">
            <Loader2 className="w-2.5 h-2.5 animate-spin text-amber-400" />
            <span>Building / Starting</span>
          </span>
        );
      case 'error':
        return (
          <span className="flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40">
            <XCircle className="w-2.5 h-2.5 text-rose-400" />
            <span>Error</span>
          </span>
        );
      default:
        return (
          <span className="flex items-center space-x-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-800 text-gray-400 border border-gray-700">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-500" />
            <span>Stopped</span>
          </span>
        );
    }
  };

  return (
    <div
      className={`border-t border-gray-800 bg-[#0d0f19] flex flex-col transition-all duration-200 select-none ${
        isExpanded ? 'h-96' : 'h-64'
      }`}
    >
      {/* Terminal Toolbar */}
      <div className="h-10 bg-[#121422] border-b border-gray-800/80 px-4 flex items-center justify-between text-xs shrink-0">
        {/* Left Tabs & Status */}
        <div className="flex items-center space-x-2 h-full">
          <button
            onClick={() => setTerminalTab('output')}
            className={`h-full px-3 flex items-center space-x-1.5 font-medium border-b-2 transition-colors ${
              terminalTab === 'output'
                ? 'border-cyan-400 text-cyan-300 bg-gray-800/40'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <span>Project Output</span>
            {runStatus === 'building' && <Loader2 className="w-3 h-3 text-cyan-400 animate-spin" />}
          </button>

          <button
            onClick={() => setTerminalTab('terminal')}
            className={`h-full px-3 flex items-center space-x-1.5 font-medium border-b-2 transition-colors ${
              terminalTab === 'terminal'
                ? 'border-cyan-400 text-cyan-300 bg-gray-800/40'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <TerminalIcon className="w-3.5 h-3.5" />
            <span>Sandbox CLI</span>
          </button>

          <div className="h-4 w-[1px] bg-gray-800 mx-1" />
          {getStatusBadge()}
        </div>

        {/* Right Execution & Layout Controls */}
        <div className="flex items-center space-x-1.5">
          {previewUrl && (
            <button
              onClick={() => setIsPreviewOpen(true)}
              title="Open Web Application Preview"
              className="flex items-center space-x-1 px-2.5 py-1 rounded bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-cyan-300 text-[11px] font-medium transition-colors"
            >
              <Globe className="w-3 h-3 text-cyan-400" />
              <span>Preview App</span>
            </button>
          )}

          {runStatus !== 'running' && runStatus !== 'building' ? (
            <button
              onClick={() => runProject()}
              title="Run Complete Project"
              className="flex items-center space-x-1 px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-[11px] shadow-sm transition-colors"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Run</span>
            </button>
          ) : (
            <button
              onClick={stopProject}
              title="Stop Project"
              className="flex items-center space-x-1 px-2.5 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-medium text-[11px] shadow-sm transition-colors"
            >
              <Square className="w-3 h-3 fill-current" />
              <span>Stop</span>
            </button>
          )}

          <button
            onClick={() => restartProject()}
            title="Restart Project"
            className="p-1.5 rounded hover:text-white hover:bg-gray-800 text-gray-400 transition-colors"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={clearTerminal}
            title="Clear Output Logs"
            className="p-1.5 rounded hover:text-white hover:bg-gray-800 text-gray-400 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-[1px] bg-gray-800 mx-1" />

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? 'Collapse' : 'Maximize'}
            className="p-1.5 rounded hover:text-white hover:bg-gray-800 text-gray-400 transition-colors"
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => setIsTerminalOpen(false)}
            title="Close Panel"
            className="p-1.5 rounded hover:text-white hover:bg-gray-800 text-gray-400 transition-colors"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal Content Body */}
      <div className="flex-1 p-3 overflow-y-auto font-mono text-xs bg-[#0b0d17]">
        {terminalTab === 'output' ? (
          <div className="space-y-1">
            {runLogs.length === 0 ? (
              <div className="text-gray-500 py-6 text-center select-none">
                <p>No execution logs yet.</p>
                <p className="text-[11px] mt-1 text-gray-600">
                  Click <span className="text-emerald-400 font-semibold">Run Project</span> to start the isolated runtime.
                </p>
              </div>
            ) : (
              runLogs.map((log, i) => (
                <div 
                  key={i} 
                  className={`leading-relaxed whitespace-pre-wrap break-words ${
                    log.type === 'stderr' ? 'text-rose-400' :
                    log.type === 'system' ? 'text-indigo-400 font-semibold' :
                    'text-gray-300'
                  }`}
                >
                  {log.text}
                </div>
              ))
            )}
            <div ref={logsEndRef} />
          </div>
        ) : (
          <div className="h-full flex flex-col justify-between">
            <div className="space-y-1 overflow-y-auto">
              {cliHistory.map((item, i) => (
                <div 
                  key={i} 
                  className={`leading-relaxed whitespace-pre-wrap ${
                    item.type === 'user' ? 'text-cyan-300 font-bold' :
                    item.type === 'system' ? 'text-gray-500' :
                    'text-gray-300'
                  }`}
                >
                  {item.text}
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>

            <form onSubmit={handleCliSubmit} className="flex items-center space-x-2 pt-2 border-t border-gray-800/80">
              <span className="text-cyan-400 font-bold">$</span>
              <input
                type="text"
                value={terminalInput}
                onChange={(e) => setTerminalInput(e.target.value)}
                placeholder="Type a sandbox command (e.g. run, help, env)..."
                className="flex-1 bg-transparent text-white text-xs outline-none font-mono placeholder-gray-600"
              />
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
