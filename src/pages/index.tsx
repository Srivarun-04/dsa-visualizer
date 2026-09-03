import React, { useState, useCallback, useEffect } from 'react';
import Editor from '../components/Editor';
import Visualization from '../components/Visualization';
import Controls from '../components/Controls';
import PointerInput from '../components/PointerInput';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

const DEFAULT_CUSTOM_CODE = `# Write or paste your Python DSA code here
print("Welcome to DSA Visualizer!")
`

const EXAMPLES: Record<string, { desc: string; code: string; pointers: string[] }> = {
  'Two Sum': {
    desc: 'Array & HashMap Iteration',
    pointers: ['i'],
    code: `# Two Sum with Hash Map
nums = [2, 7, 11, 15]
target = 9
seen = {}
result = None

for i, num in enumerate(nums):
    diff = target - num
    if diff in seen:
        result = [seen[diff], i]
        break
    seen[num] = i

print("Found pair at indices:", result)
`,
  },
  'Binary Search': {
    desc: 'Divide & Conquer with low/high',
    pointers: ['low', 'high', 'mid'],
    code: `# Binary Search
arr = [2, 5, 8, 12, 16, 23]
target = 5
low = 0
high = len(arr) - 1
found_idx = -1

while low <= high:
    mid = (low + high) // 2
    if arr[mid] == target:
        found_idx = mid
        break
    elif arr[mid] < target:
        low = mid + 1
    else:
        high = mid - 1

print("Target", target, "found at index:", found_idx)
`,
  },
};

export default function Home() {
  const [activeTab, setActiveTab] = useState<'custom' | 'Two Sum' | 'Binary Search'>('custom');
  const [code, setCode] = useState<string>(DEFAULT_CUSTOM_CODE);
  const [customSavedCode, setCustomSavedCode] = useState<string>(DEFAULT_CUSTOM_CODE);
  const [pointerVars, setPointerVars] = useState<string[]>([]);
  const [customSavedPointers, setCustomSavedPointers] = useState<string[]>([]);

  const [steps, setSteps] = useState<any[]>([]);
  const [current, setCurrent] = useState<number>(0);
  const [playing, setPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(400);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Switch between "Your Code" and built-in examples
  const handleSelectTab = (tab: 'custom' | 'Two Sum' | 'Binary Search') => {
    setActiveTab(tab);
    setSteps([]);
    setCurrent(0);
    setPlaying(false);
    setErrorMsg(null);

    if (tab === 'custom') {
      setCode(customSavedCode);
      setPointerVars(customSavedPointers);
    } else {
      const example = EXAMPLES[tab];
      setCode(example.code);
      setPointerVars(example.pointers);
    }
  };

  // Keep track of user custom code updates
  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    if (activeTab === 'custom') {
      setCustomSavedCode(newCode);
    }
  };

  // Keep track of user custom pointer updates
  const handlePointersChange = (newPointers: string[]) => {
    setPointerVars(newPointers);
    if (activeTab === 'custom') {
      setCustomSavedPointers(newPointers);
    }
  };

  const fetchTrace = useCallback(async () => {
    if (!code.trim()) {
      setErrorMsg('Please write or paste some Python code to run.');
      setSteps([]);
      setCurrent(0);
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setPlaying(false);

    try {
      const resp = await axios.post(`${API_BASE_URL}/trace`, {
        code,
        timeout_seconds: 10,
        max_steps: 5000,
      });
      const data = resp.data;
      if (data.steps && data.steps.length > 0) {
        setSteps(data.steps);
        setCurrent(0);
      } else if (data.error) {
        setSteps([]);
        setErrorMsg(data.error);
      } else {
        setSteps([]);
        setErrorMsg('No execution steps recorded.');
      }
    } catch (e: any) {
      console.error('Trace error', e);
      const serverErr = e.response?.data?.detail;
      setErrorMsg(
        serverErr ||
        `Failed to connect to backend tracer at ${API_BASE_URL}. Please ensure the server is running.`
      );
    } finally {
      setLoading(false);
    }
  }, [code]);

  const handlePrev = useCallback(() => setCurrent((i) => Math.max(i - 1, 0)), []);
  const handleNext = useCallback(
    () => setCurrent((i) => Math.min(i + 1, steps.length - 1)),
    [steps.length]
  );
  const handlePlay = useCallback(() => setPlaying(true), []);
  const handlePause = useCallback(() => setPlaying(false), []);
  const handleReset = useCallback(() => {
    setPlaying(false);
    setCurrent(0);
  }, []);
  const handleSeek = useCallback((idx: number) => {
    setPlaying(false);
    setCurrent(idx);
  }, []);

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        fetchTrace();
        return;
      }
      const target = e.target as HTMLElement | null;
      const activeEl = document.activeElement as HTMLElement | null;
      const isTyping =
        target?.tagName === 'INPUT' ||
        target?.tagName === 'TEXTAREA' ||
        target?.isContentEditable ||
        Boolean(target?.closest('.monaco-editor')) ||
        activeEl?.tagName === 'INPUT' ||
        activeEl?.tagName === 'TEXTAREA' ||
        activeEl?.isContentEditable ||
        Boolean(activeEl?.closest('.monaco-editor')) ||
        Boolean(activeEl?.classList?.contains('inputarea'));

      if (isTyping) {
        return; // Do not intercept space or arrows when typing in Monaco or input fields
      }
      if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.code === 'Space') {
        e.preventDefault();
        setPlaying((p) => !p);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrev, handleNext, fetchTrace]);

  const currentStep = steps[current] || null;
  const prevStep = current > 0 ? steps[current - 1] : null;

  return (
    <div className="h-screen w-screen bg-[#0B0D13] text-gray-100 flex flex-col overflow-hidden font-sans select-none">
      {/* Top Navigation & Controls Header */}
      <header className="h-14 px-5 border-b border-white/10 bg-[#121620] flex items-center justify-between shrink-0 gap-4">
        {/* App Logo & Title */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-[#FF8800] flex items-center justify-center font-mono font-bold text-black shadow-[0_0_12px_rgba(255,136,0,0.3)]">
            &lt;/&gt;
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-sm font-bold tracking-tight text-white">DSA Visualizer</h1>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/30">
                PYTHON
              </span>
            </div>
            <p className="text-[10px] text-gray-400 hidden sm:block">Step-by-step visual execution tracer</p>
          </div>
        </div>

        {/* Mode Selector: "Your Code" vs Built-in Examples */}
        <div className="flex items-center space-x-2 bg-[#0B0D13] p-1 rounded-xl border border-white/10">
          {/* Primary "Your Code" Button */}
          <button
            onClick={() => handleSelectTab('custom')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${activeTab === 'custom'
              ? 'bg-[#1F2637] text-[#FF8800] border border-white/10 shadow-sm'
              : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
          >
            <span>Your Code</span>
          </button>

          <span className="text-gray-600 text-xs hidden md:inline">|</span>

          {/* Built-in Examples (Two Sum, Binary Search) */}
          <div className="flex items-center space-x-1">
            {(['Two Sum', 'Binary Search'] as const).map((key) => {
              const isSelected = activeTab === key;
              return (
                <button
                  key={key}
                  onClick={() => handleSelectTab(key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${isSelected
                    ? 'bg-[#1F2637] text-[#FF8800] font-bold border border-white/10 shadow-sm'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                >
                  {key}
                </button>
              );
            })}
          </div>
        </div>

        {/* Run Code Button */}
        <div className="flex items-center space-x-2">
          <button
            onClick={fetchTrace}
            disabled={loading}
            className="px-4 py-2 bg-[#FF8800] hover:bg-[#ff951c] active:scale-95 disabled:opacity-50 text-black font-bold text-xs rounded-xl shadow-[0_0_15px_rgba(255,136,0,0.3)] flex items-center space-x-2 transition-all cursor-pointer"
            title="Run code (Ctrl + Enter)"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5 text-black" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span>Executing...</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                <span>Run Code</span>
                <span className="text-[10px] opacity-70 bg-black/20 px-1 py-0.5 rounded font-mono hidden md:inline text-black font-semibold">
                  Ctrl+↵
                </span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Workspace Layout (Side-by-Side: LEFT = Code, RIGHT = Visualizer) */}
      <main className="flex-1 flex flex-col md:flex-row overflow-hidden w-full h-full">
        {/* LEFT SIDE: Code Editor (46% width on desktop) */}
        <section className="w-full md:w-[46%] h-1/2 md:h-full border-b md:border-b-0 md:border-r border-white/10 flex flex-col bg-[#131722] overflow-hidden">
          {/* Subheader */}
          <div className="px-4 py-2.5 bg-[#181E2C] border-b border-white/10 flex items-center justify-between text-xs text-gray-400 shrink-0">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-gray-200 font-mono">
                {activeTab === 'custom' ? 'YOUR CODE' : `EXAMPLE: ${activeTab.toUpperCase()}`}
              </span>
              <span className="text-[10px] text-gray-500">• Python 3</span>
            </div>
            <button
              onClick={() => {
                setCode('');
                if (activeTab === 'custom') setCustomSavedCode('');
              }}
              className="text-[11px] text-gray-400 hover:text-[#FF8800] transition-colors cursor-pointer"
            >
              Clear
            </button>
          </div>

          {/* User-Defined Pointer Variables Input Section */}
          <PointerInput
            pointers={pointerVars}
            onChange={handlePointersChange}
            code={code}
          />

          {/* Monaco Editor Container */}
          <div className="flex-1 overflow-hidden">
            <Editor
              code={code}
              setCode={handleCodeChange}
              currentLine={currentStep ? currentStep.line : undefined}
            />
          </div>
        </section>

        {/* RIGHT SIDE: Step-by-Step Visualization (54% width on desktop) */}
        <section className="w-full md:w-[54%] h-1/2 md:h-full flex flex-col bg-[#0D0F14] overflow-hidden">
          <div className="px-4 py-2.5 bg-[#181E2C] border-b border-white/10 flex items-center justify-between text-xs text-gray-400 shrink-0">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-gray-200 font-mono">VISUALIZATION</span>
              {currentStep && (
                <span className="text-[11px] text-[#FF8800] font-mono font-bold">
                  Step {current + 1} of {steps.length}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-3 text-[11px] text-gray-400">
              <span>Space = Play</span>
              <span>← / → = Step</span>
            </div>
          </div>

          <div className="flex-1 overflow-hidden">
            {errorMsg ? (
              <div className="p-6 text-center">
                <div className="bg-red-950/60 border border-red-800 text-red-300 p-4 rounded-xl text-xs font-mono text-left shadow-lg">
                  <div className="text-xs font-bold text-red-400 mb-1">Execution Notice:</div>
                  <pre className="whitespace-pre-wrap">{errorMsg}</pre>
                </div>
              </div>
            ) : (
              <Visualization
                step={currentStep}
                prevStep={prevStep}
                userPointers={pointerVars}
              />
            )}
          </div>
        </section>
      </main>

      {/* Bottom Controls Bar */}
      <footer className="shrink-0 border-t border-white/10">
        <Controls
          stepIndex={current}
          totalSteps={steps.length}
          onPrev={handlePrev}
          onNext={handleNext}
          onPlay={handlePlay}
          onPause={handlePause}
          onReset={handleReset}
          onSeek={handleSeek}
          playing={playing}
          speed={speed}
          setSpeed={setSpeed}
        />
      </footer>
    </div>
  );
}
