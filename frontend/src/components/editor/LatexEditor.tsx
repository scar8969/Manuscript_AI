import { useRef } from 'react';
import Editor, { type OnMount, type OnChange } from '@monaco-editor/react';
import { useStore } from '../../store/useStore';
import { useCompile } from '../../hooks/useCompile';

export function LatexEditor() {
  const {
    latexCode,
    setLatexCode,
    compileStatus,
    documentId,
    setCursorPosition
  } = useStore();
  
  const { compile, download } = useCompile();

  const editorRef = useRef<unknown>(null);

  const handleEditorMount: OnMount = (editor) => {
    editorRef.current = editor;
    editor.onDidChangeCursorPosition((e) => {
      setCursorPosition({ line: e.position.lineNumber, column: e.position.column });
    });
  };

  const handleEditorChange: OnChange = (value) => {
    if (value !== undefined) {
      setLatexCode(value);
    }
  };

  return (
    <section className="col-span-5 bg-surface-container-lowest flex flex-col relative">
      {/* Toolbar */}
      <div className="h-12 flex items-center justify-between px-4 ghost-border">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-sm text-on-surface-variant">description</span>
          <span className="text-xs font-bold tracking-tight">resume.tex</span>
          {documentId && (
            <span className="flex items-center gap-1 text-[10px] text-on-surface-variant ml-2">
              <span className="w-1.5 h-1.5 rounded-full bg-green-600" />
              Saved
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={compile}
            disabled={compileStatus === 'compiling'}
            className="flex items-center gap-1.5 px-3 py-1 bg-primary text-on-primary text-xs font-bold rounded-sm shadow-md hover:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {compileStatus === 'compiling' ? (
              <span className="material-symbols-outlined text-sm animate-spin">refresh</span>
            ) : (
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
            )}
            {compileStatus === 'compiling' ? 'Compiling...' : 'Compile'}
          </button>
          <button
            onClick={download}
            disabled={compileStatus === 'compiling'}
            className="btn-secondary text-on-surface text-xs font-semibold px-3 py-1.5 disabled:opacity-50 flex items-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>download</span>
            Download
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden">
        <Editor
          height="100%"
          defaultLanguage="latex"
          value={latexCode}
          onChange={handleEditorChange}
          onMount={handleEditorMount}
          theme="vs"
          options={{
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: 'on',
            wordWrap: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            padding: { top: 16, bottom: 16 },
            renderLineHighlight: 'gutter',
            smoothScrolling: true,
            cursorSmoothCaretAnimation: 'on',
            fontFamily: "'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', monospace",
            fontLigatures: true,
            bracketPairColorization: { enabled: true },
          }}
        />
      </div>
    </section>
  );
}
