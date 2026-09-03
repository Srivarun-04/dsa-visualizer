import React, { useEffect, useRef } from 'react';
import MonacoEditor, { OnMount } from '@monaco-editor/react';

type EditorProps = {
  code: string;
  setCode: (code: string) => void;
  currentLine?: number;
};

const Editor: React.FC<EditorProps> = ({ code, setCode, currentLine }) => {
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const decorationsRef = useRef<string[]>([]);
  const isInternalChangeRef = useRef<boolean>(false);

  const handleEditorDidMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Define custom sleek dark theme matching our surface color
    monaco.editor.defineTheme('dsa-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '64748B', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'FF7A00', fontStyle: 'bold' },
        { token: 'number', foreground: '38BDF8' },
        { token: 'string', foreground: '34D399' },
        { token: 'identifier', foreground: 'F1F5F9' },
        { token: 'delimiter', foreground: '94A3B8' },
      ],
      colors: {
        'editor.background': '#131722',
        'editor.foreground': '#F8FAFC',
        'editor.lineHighlightBackground': '#1C2230',
        'editorLineNumber.foreground': '#475569',
        'editorLineNumber.activeForeground': '#FF7A00',
        'editorGutter.background': '#131722',
        'editorCursor.foreground': '#FF7A00',
      },
    });

    monaco.editor.setTheme('dsa-dark');

    // Fix web font metric mismatch by remeasuring fonts once loaded
    if (typeof document !== 'undefined' && 'fonts' in document) {
      document.fonts.ready.then(() => {
        monaco.editor.remeasureFonts();
      });
    }

    // Handle container resize cleanly
    if (containerRef.current && typeof ResizeObserver !== 'undefined') {
      const resizeObserver = new ResizeObserver(() => {
        editor.layout();
      });
      resizeObserver.observe(containerRef.current);
    }
  };

  // Synchronize active executing line highlight
  useEffect(() => {
    if (!editorRef.current) return;
    const editor = editorRef.current;

    if (currentLine && currentLine > 0) {
      decorationsRef.current = editor.deltaDecorations(decorationsRef.current, [
        {
          range: {
            startLineNumber: currentLine,
            startColumn: 1,
            endLineNumber: currentLine,
            endColumn: 1,
          },
          options: {
            isWholeLine: true,
            className: 'active-exec-line',
            glyphMarginClassName: 'active-exec-glyph',
          },
        },
      ]);
      editor.revealLineInCenterIfOutsideViewport(currentLine);
    } else {
      decorationsRef.current = editor.deltaDecorations(decorationsRef.current, []);
    }
  }, [currentLine]);

  // Update editor value only when external code prop changes (e.g. preset selection or clear)
  useEffect(() => {
    if (!editorRef.current) return;
    const editor = editorRef.current;
    const currentValue = editor.getValue();
    if (code !== currentValue && !isInternalChangeRef.current) {
      editor.setValue(code);
    }
  }, [code]);

  return (
    <div ref={containerRef} className="w-full h-full relative">
      <MonacoEditor
        height="100%"
        width="100%"
        defaultLanguage="python"
        theme="dsa-dark"
        defaultValue={code}
        options={{
          fontSize: 14,
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace",
          lineHeight: 22,
          letterSpacing: 0,
          minimap: { enabled: false },
          lineNumbers: 'on',
          glyphMargin: true,
          wordWrap: 'on',
          scrollBeyondLastLine: false,
          smoothScrolling: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          renderLineHighlight: 'all',
          automaticLayout: true,
          padding: { top: 12, bottom: 12 },
          tabSize: 4,
          insertSpaces: true,
        }}
        onMount={handleEditorDidMount}
        onChange={(value) => {
          isInternalChangeRef.current = true;
          setCode(value ?? '');
          setTimeout(() => {
            isInternalChangeRef.current = false;
          }, 0);
        }}
      />
    </div>
  );
};

export default Editor;
