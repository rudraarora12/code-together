import React, { useRef, useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import { MonacoBinding } from '../services/yMonacoBinding';
import { useRoom } from '../context/RoomContext';
import { useAuth } from '../context/AuthContext';
import { detectLanguageFromFilename } from '../utils/languageDetector';
import { showToast } from './Toast';
import { getBackendUrl } from '../services/config';
import { FileCode, Sparkles, Plus } from 'lucide-react';

export default function CodeEditor() {
  const { 
    roomId,
    activeFileId,
    activeFile,
    openTabs,
    sessionRef,
    sessionReady,
    editorSettings, 
    runProject,
    collaborators,
    activeFilePresence,
    remoteCursors,
    activeTypingUser
  } = useRoom();
  const { user } = useAuth();
  
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const bindingRef = useRef(null);
  const [editorReady, setEditorReady] = useState(false);

  // Determine language of current active file
  const activeLang = activeFile 
    ? (activeFile.language || detectLanguageFromFilename(activeFile.name).language)
    : 'plaintext';

  // Setup Monaco shortcuts & theme
  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Custom dark theme
    monaco.editor.defineTheme('codetogether-theme', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6272a4', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'cba6f7', fontStyle: 'bold' },
        { token: 'string', foreground: 'a6e3a1' },
        { token: 'number', foreground: 'fab387' },
        { token: 'type', foreground: '89dceb' },
        { token: 'function', foreground: '89b4fa' }
      ],
      colors: {
        'editor.background': '#151726',
        'editor.foreground': '#cdd6f4',
        'editor.lineHighlightBackground': '#1e2136',
        'editorCursor.foreground': '#89b4fa',
        'editorWhitespace.foreground': '#313244',
        'editorIndentGuide.background': '#282b42',
        'editorIndentGuide.activeBackground': '#4e5275',
        'editor.selectionBackground': '#45475a80',
        'editorLineNumber.foreground': '#585b70',
        'editorLineNumber.activeForeground': '#cdd6f4'
      }
    });
    monaco.editor.setTheme('codetogether-theme');

    // Register Ctrl+Enter to Run Project
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      runProject();
    });

    // Register Ctrl+S to notify sync
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      showToast('Project file synchronized via Yjs CRDT');
    });

    setEditorReady(true);
  };

  // Bind active file to Monaco model and Yjs doc
  useEffect(() => {
    if (!editorReady || !editorRef.current || !monacoRef.current || !sessionReady || !sessionRef.current) return;
    if (!activeFileId) return;

    const editor = editorRef.current;
    const monaco = monacoRef.current;

    // Clean up previous binding
    if (bindingRef.current) {
      bindingRef.current.destroy();
      bindingRef.current = null;
    }

    let isSubscribed = true;

    async function bindCurrentFile() {
      // 1. Get or create Y.Doc for this active file
      const docEntry = sessionRef.current.getFileDoc(activeFileId);
      if (!docEntry) return;

      const { ydoc, yText } = docEntry;

      // If document is empty in memory, fetch initial content from backend
      if (yText.length === 0) {
        try {
          const effectiveRoomId = roomId || sessionRef.current?.roomId;
          if (effectiveRoomId) {
            const res = await fetch(`${getBackendUrl()}/api/rooms/${encodeURIComponent(effectiveRoomId)}/file-content?path=${encodeURIComponent(activeFileId)}`);
            if (res.ok) {
              const data = await res.json();
              if (isSubscribed && yText.length === 0 && data.content) {
                yText.insert(0, data.content);
              }
            }
          }
        } catch {
          // ignore error if new file
        }
      }

      if (!isSubscribed) return;

      // 2. Obtain or create Monaco Model for this file URI
      const uri = monaco.Uri.parse(`inmemory://codetogether/${activeFileId}`);
      let model = monaco.editor.getModel(uri);

      if (!model) {
        const detection = detectLanguageFromFilename(activeFileId);
        model = monaco.editor.createModel(yText.toString(), detection.language, uri);
      } else {
        const detection = detectLanguageFromFilename(activeFileId);
        monaco.editor.setModelLanguage(model, detection.language);
      }

      editor.setModel(model);

      // 3. Connect Monaco to Yjs CRDT binding
      try {
        const binding = new MonacoBinding(
          yText,
          model,
          new Set([editor]),
          null, // awareness is handled via socket cursors
          monaco
        );
        bindingRef.current = binding;
        console.log(`[Monaco] Bound to file ${activeFileId}`);
      } catch (err) {
        console.warn('[Monaco] Binding error:', err);
      }
    }

    bindCurrentFile();

    return () => {
      isSubscribed = false;
      if (bindingRef.current) {
        bindingRef.current.destroy();
        bindingRef.current = null;
      }
    };
  }, [editorReady, sessionReady, activeFileId]);

  // Cursor and Selection position tracking
  useEffect(() => {
    if (!editorReady || !editorRef.current || !sessionReady || !sessionRef.current) return;
    if (!activeFileId) return;

    const editor = editorRef.current;
    let throttleTimer = null;

    const disp = editor.onDidChangeCursorPosition((e) => {
      if (throttleTimer) return;
      throttleTimer = setTimeout(() => {
        throttleTimer = null;
        const sel = editor.getSelection();
        sessionRef.current?.sendCursorMove({
          lineNumber: e.position.lineNumber,
          column: e.position.column
        }, sel ? {
          startLineNumber: sel.startLineNumber,
          startColumn: sel.startColumn,
          endLineNumber: sel.endLineNumber,
          endColumn: sel.endColumn
        } : null);
      }, 50);
    });

    return () => {
      disp.dispose();
      if (throttleTimer) clearTimeout(throttleTimer);
    };
  }, [editorReady, sessionReady, activeFileId]);

  // Remote cursor decorations rendering
  useEffect(() => {
    if (!editorReady || !editorRef.current || !monacoRef.current) return;
    const editor = editorRef.current;
    const monaco = monacoRef.current;

    const activeCursors = remoteCursors.filter(c => c.fileId === activeFileId);
    const newDecorations = [];

    activeCursors.forEach(c => {
      if (!c.position || !c.user) return;
      const { lineNumber, column } = c.position;

      // Remote cursor decoration
      newDecorations.push({
        range: new monaco.Range(lineNumber, column, lineNumber, column),
        options: {
          className: `remote-socket-cursor-${c.socketId}`,
          hoverMessage: { value: `**${c.user.name}** is editing here` },
          zIndex: 100
        }
      });

      // Remote selection decoration
      if (c.selection && (c.selection.startLineNumber !== c.selection.endLineNumber || c.selection.startColumn !== c.selection.endColumn)) {
        newDecorations.push({
          range: new monaco.Range(
            c.selection.startLineNumber,
            c.selection.startColumn,
            c.selection.endLineNumber,
            c.selection.endColumn
          ),
          options: {
            className: `remote-socket-selection-${c.socketId}`,
            zIndex: 90
          }
        });
      }
    });

    const oldDecorations = editorRef.current._remoteDecorations || [];
    editorRef.current._remoteDecorations = editor.deltaDecorations(oldDecorations, newDecorations);

  }, [editorReady, remoteCursors, activeFileId]);

  // Collaborators currently viewing this active file
  const filePeers = activeFileId ? (activeFilePresence.get(activeFileId) || []) : [];

  if (!activeFileId || openTabs.length === 0) {
    return (
      <div className="flex-1 h-full w-full bg-[#151726] flex flex-col items-center justify-center text-center p-8 select-none">
        <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4 text-indigo-400">
          <FileCode className="w-8 h-8 opacity-80" />
        </div>
        <h3 className="text-base font-semibold text-white mb-1">No File Open</h3>
        <p className="text-xs text-gray-400 max-w-sm mb-6 leading-relaxed">
          Select any file from the project explorer on the left, or open a tab to start editing together in real time.
        </p>
        <div className="flex items-center space-x-2 text-[11px] text-gray-500 font-mono">
          <kbd className="px-2 py-1 bg-gray-800 rounded border border-gray-700 text-gray-300">Ctrl</kbd>
          <span>+</span>
          <kbd className="px-2 py-1 bg-gray-800 rounded border border-gray-700 text-gray-300">Enter</kbd>
          <span className="ml-1">to run the project</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex-1 h-full w-full bg-[#151726] overflow-hidden">
      {/* Floating Active Collaborator Indicators on Active File */}
      <div className="absolute top-2 right-4 z-10 flex items-center space-x-1.5 pointer-events-none bg-gray-900/85 backdrop-blur-md px-3 py-1 rounded-full border border-gray-800 shadow-xl">
        <span className="text-[10px] text-gray-400 font-medium mr-1">In this file:</span>
        {filePeers.length > 0 ? (
          filePeers.map((c, i) => (
            <div
              key={c.id || i}
              title={`${c.name} is viewing ${activeFileId}`}
              className="flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border pointer-events-auto shadow-sm"
              style={{ 
                borderColor: `${c.color}60`, 
                backgroundColor: `${c.color}20`, 
                color: c.color 
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.color }} />
              <span>{c.name.split(' ')[0]}</span>
            </div>
          ))
        ) : (
          <span className="text-[10px] text-gray-500 italic">Just you</span>
        )}

        {activeTypingUser && (
          <div className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border border-indigo-500/50 bg-indigo-500/20 text-indigo-300 animate-pulse pointer-events-auto">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
            <span>{activeTypingUser} is typing...</span>
          </div>
        )}
      </div>

      <Editor
        height="100%"
        width="100%"
        language={activeLang}
        onMount={handleEditorDidMount}
        theme="vs-dark"
        options={{
          fontSize: editorSettings.fontSize || 14,
          tabSize: editorSettings.tabSize || 2,
          minimap: { enabled: editorSettings.minimap ?? true },
          wordWrap: editorSettings.wordWrap || 'on',
          lineNumbers: editorSettings.lineNumbers || 'on',
          scrollBeyondLastLine: false,
          smoothScrolling: true,
          fontFamily: "'Fira Code', monospace",
          fontLigatures: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          automaticLayout: true,
          padding: { top: 14, bottom: 14 },
          renderLineHighlight: 'all',
          bracketPairColorization: { enabled: true }
        }}
      />
    </div>
  );
}
