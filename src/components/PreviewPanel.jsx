import React, { useState } from 'react';
import { 
  RotateCw, 
  ExternalLink, 
  X, 
  Globe, 
  Laptop, 
  Smartphone, 
  Tablet,
  AlertCircle,
  Play
} from 'lucide-react';
import { useRoom } from '../context/RoomContext';

export default function PreviewPanel() {
  const { 
    previewUrl, 
    previewKey, 
    refreshPreview, 
    isPreviewOpen, 
    setIsPreviewOpen, 
    runStatus,
    runProject 
  } = useRoom();

  const [deviceMode, setDeviceMode] = useState('responsive'); // 'responsive' | 'tablet' | 'mobile'

  if (!isPreviewOpen) return null;

  const getWidthStyle = () => {
    switch (deviceMode) {
      case 'mobile':
        return 'max-w-[375px]';
      case 'tablet':
        return 'max-w-[768px]';
      default:
        return 'w-full';
    }
  };

  return (
    <div className="w-1/2 min-w-[340px] max-w-[50%] h-full flex flex-col bg-[#0e101b] border-l border-gray-800/80 z-20 shrink-0">
      {/* Top Preview Toolbar */}
      <div className="h-10 bg-[#121424] border-b border-gray-800/80 px-3 flex items-center justify-between text-xs select-none">
        <div className="flex items-center space-x-2 flex-1 min-w-0 mr-2">
          <div className="flex items-center space-x-1.5 font-semibold text-gray-300">
            <Globe className="w-4 h-4 text-cyan-400" />
            <span className="text-[11px] uppercase tracking-wider">Web Preview</span>
          </div>

          {/* Browser Address Bar */}
          <div className="flex-1 bg-[#1a1d30] border border-gray-800/90 rounded-md px-2.5 py-1 text-[11px] text-gray-300 font-mono flex items-center justify-between truncate">
            <span className="truncate">{previewUrl || 'http://localhost:sandbox'}</span>
            <button
              onClick={refreshPreview}
              title="Refresh Preview"
              className="text-gray-400 hover:text-white ml-2 transition-colors"
            >
              <RotateCw className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Viewport & Controls */}
        <div className="flex items-center space-x-1">
          <div className="flex items-center bg-[#181b2e] rounded-md p-0.5 border border-gray-800">
            <button
              onClick={() => setDeviceMode('responsive')}
              title="Desktop / Responsive"
              className={`p-1 rounded ${deviceMode === 'responsive' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              <Laptop className="w-3 h-3" />
            </button>
            <button
              onClick={() => setDeviceMode('tablet')}
              title="Tablet View"
              className={`p-1 rounded ${deviceMode === 'tablet' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              <Tablet className="w-3 h-3" />
            </button>
            <button
              onClick={() => setDeviceMode('mobile')}
              title="Mobile View"
              className={`p-1 rounded ${deviceMode === 'mobile' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              <Smartphone className="w-3 h-3" />
            </button>
          </div>

          {previewUrl && (
            <a
              href={previewUrl}
              target="_blank"
              rel="noreferrer"
              title="Open Preview in New Tab"
              className="p-1.5 rounded hover:text-white hover:bg-gray-800 text-gray-400 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}

          <button
            onClick={() => setIsPreviewOpen(false)}
            title="Close Preview"
            className="p-1.5 rounded hover:text-white hover:bg-gray-800 text-gray-400 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Preview Content Area */}
      <div className="flex-1 bg-[#0b0c14] flex items-center justify-center overflow-hidden p-2">
        {previewUrl ? (
          <div className={`h-full ${getWidthStyle()} mx-auto bg-white rounded-md shadow-2xl overflow-hidden transition-all duration-200`}>
            <iframe
              key={previewKey}
              src={previewUrl}
              title="CodeTogether Web Preview"
              className="w-full h-full border-0"
              sandbox="allow-scripts allow-same-origin allow-forms allow-modals allow-popups"
            />
          </div>
        ) : (
          <div className="text-center p-6 max-w-sm space-y-4">
            <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-1">No Active Web Server</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                When you click "Run Project", any web application (Vite, Express, or HTML) will stream its live view directly here.
              </p>
            </div>
            {runStatus !== 'running' && runStatus !== 'building' && (
              <button
                onClick={() => runProject()}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-600/20 inline-flex items-center space-x-1.5 transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run Project Now</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
