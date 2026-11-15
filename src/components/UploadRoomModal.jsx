import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from './Modal';
import { 
  UploadCloud, 
  Folder, 
  FolderOpen,
  FileCode, 
  FileCode2,
  FileText,
  FileArchive,
  X, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight, 
  Sparkles,
  Settings,
  ChevronDown,
  ChevronRight,
  ShieldAlert,
  Loader2,
  Check
} from 'lucide-react';
import { 
  processFolderUpload, 
  processZipUpload, 
  detectProjectTypeFromFiles,
  buildFileTree,
  DEFAULT_IGNORED_DIRS 
} from '../services/projectUpload';
import { formatFileSize } from '../utils/languageDetector';
import { useAuth } from '../context/AuthContext';
import { showToast } from './Toast';

export default function UploadRoomModal({ isOpen, onClose }) {
  const { user, recordRoomVisit } = useAuth();
  const navigate = useNavigate();

  const [dragOver, setDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Project parsed state
  const [parsedProject, setParsedProject] = useState(null); 
  // { projectName, files, totalFiles, totalBytes, sensitiveFilesExcluded, projectType }
  
  const [customProjectName, setCustomProjectName] = useState('');
  const [customRunCommand, setCustomRunCommand] = useState('');
  const [allowSecrets, setAllowSecrets] = useState(false);
  const [showIgnoreSettings, setShowIgnoreSettings] = useState(false);
  const [ignoredPatterns, setIgnoredPatterns] = useState([...DEFAULT_IGNORED_DIRS]);
  const [expandedPreviewFolders, setExpandedPreviewFolders] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const folderInputRef = useRef(null);
  const zipInputRef = useRef(null);

  const resetState = () => {
    setParsedProject(null);
    setErrorMsg('');
    setIsProcessing(false);
    setProgress(0);
    setCustomProjectName('');
    setCustomRunCommand('');
    setAllowSecrets(false);
    setIsSubmitting(false);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  // Process folder upload
  const handleFolderSelect = async (e) => {
    const rawFiles = e.target.files;
    if (!rawFiles || rawFiles.length === 0) return;

    setErrorMsg('');
    setIsProcessing(true);
    setProgress(10);

    try {
      const result = await processFolderUpload(rawFiles, {
        ignoredPatterns,
        allowSecrets,
        onProgress: (p) => setProgress(p)
      });

      if (result.files.length === 0) {
        throw new Error('No valid source code or configuration files found in the selected folder.');
      }

      const detected = detectProjectTypeFromFiles(result.files);

      setParsedProject({
        ...result,
        projectType: detected
      });
      setCustomProjectName(result.projectName);
      setCustomRunCommand(detected.runCommand);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to process project folder.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Process ZIP archive upload
  const handleZipSelect = async (file) => {
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.zip')) {
      setErrorMsg('Please select a valid .zip archive file.');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setErrorMsg('Project ZIP exceeds maximum 50MB limit.');
      return;
    }

    setErrorMsg('');
    setIsProcessing(true);
    setProgress(15);

    try {
      const result = await processZipUpload(file, {
        ignoredPatterns,
        allowSecrets,
        onProgress: (p) => setProgress(p)
      });

      if (result.files.length === 0) {
        throw new Error('No valid files could be extracted from this ZIP archive.');
      }

      const detected = detectProjectTypeFromFiles(result.files);

      setParsedProject({
        ...result,
        projectType: detected
      });
      setCustomProjectName(result.projectName);
      setCustomRunCommand(detected.runCommand);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to parse ZIP archive.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Drag and drop handler
  const handleDrop = async (e) => {
    e.preventDefault();
    setDragOver(false);

    const items = e.dataTransfer.items;
    const files = e.dataTransfer.files;

    if (files.length === 1 && files[0].name.toLowerCase().endsWith('.zip')) {
      handleZipSelect(files[0]);
      return;
    }

    if (files.length > 0) {
      handleFolderSelect({ target: { files } });
    }
  };

  // Create room on backend
  const handleCreateRoom = async () => {
    if (!parsedProject || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const payload = {
        projectName: customProjectName.trim() || parsedProject.projectName,
        files: parsedProject.files,
        user: {
          id: user?.id || 'owner-creator',
          name: user?.name || 'Project Lead',
          avatar: user?.avatar
        },
        runConfig: {
          command: customRunCommand.trim()
        }
      };

      const res = await fetch('http://localhost:5001/api/rooms/project', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create project room.');

      recordRoomVisit({
        id: data.roomId,
        name: data.room?.name || payload.projectName,
        language: data.room?.primaryLanguage || 'javascript',
        isOwner: true,
        collaboratorsCount: 1,
        filesCount: parsedProject.files.length
      });

      showToast(`Created project room: ${data.room?.name}`, 'success');
      handleClose();
      navigate(`/room/${data.roomId}`);
    } catch (err) {
      setErrorMsg(`Server error: ${err.message}`);
      setIsSubmitting(false);
    }
  };

  // Render tree item for review
  const renderPreviewTree = (node, depth = 0) => {
    const isExpanded = !!expandedPreviewFolders[node.path];

    if (node.isDir) {
      return (
        <div key={node.path} className="space-y-0.5">
          <div
            onClick={() => setExpandedPreviewFolders(prev => ({ ...prev, [node.path]: !prev[node.path] }))}
            style={{ paddingLeft: `${depth * 14 + 4}px` }}
            className="flex items-center space-x-1.5 py-0.5 text-xs text-gray-300 hover:text-white cursor-pointer select-none"
          >
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
            )}
            {isExpanded ? (
              <FolderOpen className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            ) : (
              <Folder className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            )}
            <span className="truncate font-medium">{node.name}</span>
          </div>

          {isExpanded && node.children && (
            <div>
              {node.children.map(c => renderPreviewTree(c, depth + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <div
        key={node.path}
        style={{ paddingLeft: `${depth * 14 + 18}px` }}
        className="flex items-center justify-between py-0.5 text-[11px] text-gray-400"
      >
        <div className="flex items-center space-x-1.5 truncate">
          <FileCode className="w-3 h-3 text-cyan-400 shrink-0" />
          <span className="truncate">{node.name}</span>
        </div>
        <span className="text-[10px] text-gray-600 font-mono">
          {formatFileSize(node.size || 0)}
        </span>
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={parsedProject ? 'Review Project Structure' : 'Upload Complete Project Folder'}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-5">
        {/* Error Alert */}
        {errorMsg && (
          <div className="flex items-start space-x-2.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <div className="flex-1 leading-relaxed">{errorMsg}</div>
          </div>
        )}

        {/* STATE A: Upload Picker (Folder or ZIP) */}
        {!parsedProject ? (
          <div className="space-y-4">
            {/* Drag & Drop Zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
                dragOver
                  ? 'border-cyan-400 bg-cyan-950/20'
                  : 'border-gray-800 hover:border-gray-700 bg-gray-900/30'
              }`}
            >
              {isProcessing ? (
                <div className="py-6 space-y-3">
                  <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mx-auto" />
                  <div className="text-sm font-semibold text-white">Analyzing project files...</div>
                  <div className="w-48 bg-gray-800 rounded-full h-1.5 mx-auto overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-indigo-500 to-cyan-400 h-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600/20 to-cyan-500/20 border border-indigo-500/30 flex items-center justify-center mx-auto text-cyan-400">
                    <UploadCloud className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white mb-1">
                      Upload Your Entire Project
                    </h3>
                    <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed">
                      Upload React, Node.js, Python, Java, C++, or HTML projects. The full folder structure is preserved in a shared collaboration room.
                    </p>
                  </div>

                  {/* Buttons for Folder and ZIP Picker */}
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => folderInputRef.current?.click()}
                      className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/20 flex items-center space-x-2 transition-transform hover:scale-105"
                    >
                      <FolderOpen className="w-4 h-4" />
                      <span>Select Project Folder</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => zipInputRef.current?.click()}
                      className="px-4 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 hover:text-white font-semibold text-xs border border-gray-700 flex items-center space-x-2 transition-colors"
                    >
                      <FileArchive className="w-4 h-4 text-amber-400" />
                      <span>Upload ZIP Archive</span>
                    </button>
                  </div>

                  <p className="text-[11px] text-gray-500 pt-1">
                    Automatically excludes <span className="font-mono text-gray-400">node_modules</span>, <span className="font-mono text-gray-400">.git</span>, and secret <span className="font-mono text-gray-400">.env</span> files.
                  </p>
                </div>
              )}

              {/* Hidden HTML5 folder picker */}
              <input
                ref={folderInputRef}
                type="file"
                webkitdirectory=""
                directory=""
                multiple
                className="hidden"
                onChange={handleFolderSelect}
              />

              {/* Hidden ZIP picker */}
              <input
                ref={zipInputRef}
                type="file"
                accept=".zip"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleZipSelect(e.target.files[0])}
              />
            </div>

            {/* Configurable Ignore Patterns Toggle */}
            <div className="rounded-xl border border-gray-800/80 bg-gray-900/40 p-3 space-y-2">
              <button
                type="button"
                onClick={() => setShowIgnoreSettings(!showIgnoreSettings)}
                className="w-full flex items-center justify-between text-xs text-gray-400 hover:text-gray-200"
              >
                <div className="flex items-center space-x-2">
                  <Settings className="w-3.5 h-3.5 text-gray-500" />
                  <span>Configured Ignored Directories & Secrets</span>
                </div>
                {showIgnoreSettings ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>

              {showIgnoreSettings && (
                <div className="pt-2 border-t border-gray-800 space-y-2 text-xs">
                  <div className="flex flex-wrap gap-1.5">
                    {DEFAULT_IGNORED_DIRS.map((pattern) => {
                      const isChecked = ignoredPatterns.includes(pattern);
                      return (
                        <button
                          key={pattern}
                          type="button"
                          onClick={() => {
                            setIgnoredPatterns(prev => 
                              isChecked ? prev.filter(p => p !== pattern) : [...prev, pattern]
                            );
                          }}
                          className={`px-2 py-1 rounded text-[11px] font-mono border transition-colors ${
                            isChecked
                              ? 'bg-indigo-600/20 border-indigo-500 text-cyan-300'
                              : 'bg-gray-800/50 border-gray-700 text-gray-500'
                          }`}
                        >
                          {isChecked ? '✓ ' : '+ '} {pattern}
                        </button>
                      );
                    })}
                  </div>

                  <label className="flex items-center space-x-2 pt-1 text-[11px] text-amber-300/80 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowSecrets}
                      onChange={(e) => setAllowSecrets(e.target.checked)}
                      className="rounded bg-gray-800 border-gray-700 text-indigo-600"
                    />
                    <span>Allow uploading .env files (Warning: exposes API secrets to room members)</span>
                  </label>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* STATE B: Project Review Screen */
          <div className="space-y-4">
            {/* Sensitive files warning if any were excluded */}
            {parsedProject.sensitiveFilesExcluded?.length > 0 && (
              <div className="flex items-start space-x-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                <div>
                  <div className="font-semibold">Protected Environment Secrets Excluded</div>
                  <p className="text-[11px] text-amber-300/80 mt-0.5">
                    Safely excluded {parsedProject.sensitiveFilesExcluded.length} sensitive file(s) ({parsedProject.sensitiveFilesExcluded.join(', ')}) to protect credentials.
                  </p>
                </div>
              </div>
            )}

            {/* Project Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Project Name Field */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300">Project Name</label>
                <input
                  type="text"
                  value={customProjectName}
                  onChange={(e) => setCustomProjectName(e.target.value)}
                  placeholder="My Awesome Project"
                  className="w-full bg-[#181a2b] border border-gray-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-500"
                />
              </div>

              {/* Detected Framework / Type Card */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-300">Detected Framework</label>
                <div className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-gray-900 border border-gray-800 text-xs">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: parsedProject.projectType.badgeColor }}
                  />
                  <span className="font-semibold text-white">
                    {parsedProject.projectType.name}
                  </span>
                  <span className="text-[10px] text-gray-500 font-mono ml-auto">
                    {parsedProject.totalFiles} files ({formatFileSize(parsedProject.totalBytes)})
                  </span>
                </div>
              </div>
            </div>

            {/* Run Command Configuration */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-300 flex items-center justify-between">
                <span>Start / Run Command</span>
                <span className="text-[10px] text-gray-500 font-normal">Can be edited anytime in room</span>
              </label>
              <input
                type="text"
                value={customRunCommand}
                onChange={(e) => setCustomRunCommand(e.target.value)}
                placeholder="npm run dev"
                className="w-full bg-[#181a2b] border border-gray-800 rounded-xl px-3 py-2 text-xs text-cyan-300 font-mono outline-none focus:border-cyan-500"
              />
            </div>

            {/* Interactive File Tree Review Box */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span className="font-semibold text-gray-300">Project Structure Review</span>
                <span>{parsedProject.totalFiles} files ready to upload</span>
              </div>

              <div className="h-44 overflow-y-auto bg-[#0d0f19] border border-gray-800 rounded-xl p-2.5 space-y-0.5 font-mono">
                {buildFileTree(parsedProject.files).map(node => renderPreviewTree(node, 0))}
              </div>
            </div>

            {/* Modal Bottom Action Controls */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-800">
              <button
                type="button"
                onClick={resetState}
                className="px-3.5 py-2 rounded-xl text-xs text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
              >
                ← Choose Another Project
              </button>

              <button
                type="button"
                onClick={handleCreateRoom}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-semibold text-xs shadow-lg shadow-indigo-600/25 flex items-center space-x-2 transition-all hover:scale-105 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating Room & Storing Project...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Create Collaborative Room</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
