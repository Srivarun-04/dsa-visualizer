import React, { useState, useCallback, useEffect } from 'react';
import Editor from '../components/Editor';
import Visualization from '../components/Visualization';
import Controls from '../components/Controls';
import PointerInput from '../components/PointerInput';
import axios from 'axios';

const EXAMPLES: Record<string, { desc: string; code: string; pointers: string[] }> = {
  'Most Water': {
    desc: 'Two Pointers Area',
    pointers: ['i', 'j'],
    code: `# Container With Most Water
height = [1, 8, 6, 2, 5, 4, 8, 3, 7]

i = 0
maxi = 0
j = len(height) - 1

while i < j:
    area = min(height[i], height[j]) * (j - i)
    maxi = max(maxi, area)

    if height[i] < height[j]:
        i += 1
    else:
        j -= 1

print("Maximum area:", maxi)
`,
  },
  'Binary Search': {
    desc: 'Divide & Conquer',
    pointers: ['left', 'right'],
    code: `# Binary Search
arr = [3, 8, 12, 17, 21, 26, 30]
target = 21
left = 0
right = len(arr) - 1
found_idx = -1

while left <= right:
    mid = (left + right) // 2
    if arr[mid] == target:
        found_idx = mid
        break
    elif arr[mid] < target:
        left = mid + 1
    else:
        right = mid - 1

print("Target", target, "found at index:", found_idx)
`,
  },
  'Two Sum': {
    desc: 'Hash Map Lookup',
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
  'Bubble Sort': {
    desc: 'Array Swapping',
    pointers: ['i', 'j'],
    code: `# Bubble Sort
nums = [64, 34, 25, 12, 22, 11]
n = len(nums)

for i in range(n):
    for j in range(0, n - i - 1):
        if nums[j] > nums[j + 1]:
            nums[j], nums[j + 1] = nums[j + 1], nums[j]

print("Sorted array:", nums)
`,
  },
  'Linear Search': {
    desc: 'Sequential Scan',
    pointers: ['idx'],
    code: `# Linear Search
data = [10, 20, 30, 40, 50]
target = 30
found_at = -1

for idx in range(len(data)):
    if data[idx] == target:
        found_at = idx
        break

print("Item found at:", found_at)
`,
  },
};

export default function Home() {
  const [selectedExample, setSelectedExample] = useState<string>('Most Water');
  const [code, setCode] = useState<string>(EXAMPLES['Most Water'].code);
  const [pointerVars, setPointerVars] = useState<string[]>(EXAMPLES['Most Water'].pointers);
  const [steps, setSteps] = useState<any[]>([]);
  const [current, setCurrent] = useState<number>(0);
  const [playing, setPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(400);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchTrace = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    setPlaying(false);
    try {
      const resp = await axios.post('http://127.0.0.1:8000/trace', {
        code,
        timeout_seconds: 10,
        max_steps: 5000,
      });
      const data = resp.data;
      if (data.steps && data.steps.length > 0) {
        setSteps(data.steps);
        setCurrent(0);
      } else {
        setSteps([]);
        setErrorMsg('No execution steps recorded.');
      }
    } catch (e: any) {
      console.error('Trace error', e);
      setErrorMsg(
        e.response?.data?.detail || 'Failed to connect to backend tracer (http://127.0.0.1:8000). Please check backend server.'
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
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.classList.contains('inputarea')
      ) {
        return;
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
      
      {/* Top Header */}
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

        {/* Example Presets Pills */}
        <div className="flex items-center space-x-1.5 bg-[#0B0D13] p-1 rounded-xl border border-white/10">
          {Object.entries(EXAMPLES).map(([key, item]) => {
            const isSelected = selectedExample === key;
            return (
              <button
                key={key}
                onClick={() => {
                  setSelectedExample(key);
                  setCode(item.code);
                  setPointerVars(item.pointers || []);
                  setSteps([]);
                  setCurrent(0);
                  setPlaying(false);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-[#1C2333] text-[#FF8800] font-bold border border-white/10 shadow-sm'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {key}
              </button>
            );
          })}
        </div>

        {/* Run Button */}
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
      <main className="flex-1 flex flex-row overflow-hidden w-full h-full">
        
        {/* LEFT SIDE: Code Editor (46% width) */}
        <section className="w-[46%] h-full border-r border-white/10 flex flex-col bg-[#131722] overflow-hidden">
          {/* Subheader */}
          <div className="px-4 py-2.5 bg-[#181E2C] border-b border-white/10 flex items-center justify-between text-xs text-gray-400 shrink-0">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-gray-200 font-mono">CODE EDITOR</span>
              <span className="text-[10px] text-gray-500">• Python 3</span>
            </div>
            <button
              onClick={() => setCode('')}
              className="text-[11px] text-gray-400 hover:text-[#FF8800] transition-colors"
            >
              Clear
            </button>
          </div>

          {/* User-Defined Pointer Variables Input Section */}
          <PointerInput
            pointers={pointerVars}
            onChange={setPointerVars}
            code={code}
          />

          {/* Monaco Editor Container */}
          <div className="flex-1 overflow-hidden">
            <Editor
              code={code}
              setCode={setCode}
              currentLine={currentStep ? currentStep.line : undefined}
            />
          </div>
        </section>

        {/* RIGHT SIDE: Step-by-Step Visualization (54% width) */}
        <section className="w-[54%] h-full flex flex-col bg-[#0D0F14] overflow-hidden">
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
                  {errorMsg}
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
