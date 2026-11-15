import React, { useState } from 'react';
import { Search, FileCode, X, ChevronRight } from 'lucide-react';
import { useRoom } from '../context/RoomContext';

export default function SearchPanel() {
  const { files, openFile } = useRoom();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (term) => {
    setSearchTerm(term);
    if (!term.trim() || term.length < 2) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    const matches = [];

    // Search file names and fetch content if needed
    for (const file of files) {
      if (file.name.toLowerCase().includes(term.toLowerCase())) {
        matches.push({
          path: file.path,
          name: file.name,
          preview: `File name matches "${term}"`,
          line: 1
        });
      }
    }

    setResults(matches);
    setIsSearching(false);
  };

  return (
    <div className="h-full flex flex-col bg-[#11131f] select-none text-xs border-r border-gray-800/80">
      <div className="px-3 py-2 border-b border-gray-800/80 shrink-0">
        <span className="font-bold text-gray-300 uppercase tracking-wider text-[11px]">
          Search in Project
        </span>
      </div>

      <div className="p-2 shrink-0">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-gray-500 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Search files and symbols..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full bg-[#181a2b] border border-gray-800/80 rounded-md pl-8 pr-2 py-1.5 text-xs text-gray-200 placeholder-gray-500 outline-none focus:border-indigo-500/50"
          />
          {searchTerm && (
            <button
              onClick={() => handleSearch('')}
              className="absolute right-2 top-2 text-gray-500 hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {results.length > 0 ? (
          <div>
            <div className="text-[10px] text-gray-500 font-mono mb-2 px-1">
              Found {results.length} match{results.length === 1 ? '' : 'es'}
            </div>
            {results.map((r, i) => (
              <div
                key={i}
                onClick={() => openFile(r.path)}
                className="p-2 rounded-lg bg-gray-900/60 hover:bg-gray-800 border border-gray-800/60 cursor-pointer space-y-1 transition-colors"
              >
                <div className="flex items-center space-x-1.5 text-cyan-300 font-medium">
                  <FileCode className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span className="truncate">{r.path}</span>
                </div>
                <div className="text-[11px] text-gray-400 pl-5 truncate">
                  {r.preview}
                </div>
              </div>
            ))}
          </div>
        ) : searchTerm.trim().length >= 2 ? (
          <div className="text-center text-gray-500 py-8">
            No matching files found.
          </div>
        ) : (
          <div className="text-center text-gray-600 py-8 text-xs">
            Type at least 2 characters to search across files in this project.
          </div>
        )}
      </div>
    </div>
  );
}
