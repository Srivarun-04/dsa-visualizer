import React, { useMemo } from 'react';

type VariableMap = Record<string, any>;

type Step = {
  step: number;
  line: number;
  line_text: string;
  event: string;
  locals: VariableMap;
  stdout: string;
  exception: string | null;
};

type VisualizationProps = {
  step: Step | null;
  prevStep: Step | null;
};

// Pointer color palette matching reference design
const POINTER_COLORS = [
  { text: 'text-amber-500', arrow: 'text-amber-500', bg: 'bg-amber-500/15', border: 'border-amber-500/30' },
  { text: 'text-sky-400', arrow: 'text-sky-400', bg: 'bg-sky-400/15', border: 'border-sky-400/30' },
  { text: 'text-emerald-400', arrow: 'text-emerald-400', bg: 'bg-emerald-400/15', border: 'border-emerald-400/30' },
  { text: 'text-purple-400', arrow: 'text-purple-400', bg: 'bg-purple-400/15', border: 'border-purple-400/30' },
  { text: 'text-pink-400', arrow: 'text-pink-400', bg: 'bg-pink-400/15', border: 'border-pink-400/30' },
];

export default function Visualization({ step, prevStep }: VisualizationProps) {
  if (!step) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center select-none bg-[#0D0F14]">
        <div className="w-16 h-16 rounded-2xl bg-[#161B26] border border-white/10 flex items-center justify-center mb-4 text-[#FF8800] shadow-[0_0_20px_rgba(255,136,0,0.15)]">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-white/90 mb-1.5">No Execution in Progress</h3>
        <p className="text-xs text-gray-400 max-w-sm mb-4 leading-relaxed">
          Write Python DSA code on the left and click <span className="text-[#FF8800] font-semibold">Run Code</span> to view memory state and pointers.
        </p>
      </div>
    );
  }

  const { line, line_text, locals, stdout, exception, step: stepNum, event } = step;
  const prevLocals = prevStep?.locals || {};

  // Group variables into Lists, Dictionaries, and Scalars
  const { lists, dicts, primitives, scalarPointers } = useMemo(() => {
    const lList: { name: string; value: any[] }[] = [];
    const dList: { name: string; value: Record<string, any> }[] = [];
    const pList: { name: string; value: any; type: string }[] = [];
    const sPointers: { name: string; val: number }[] = [];

    // Collect integer variables that could serve as array index pointers
    for (const [k, v] of Object.entries(locals)) {
      if (typeof v === 'number' && Number.isInteger(v)) {
        sPointers.push({ name: k, val: v });
      }
    }

    for (const [name, value] of Object.entries(locals)) {
      if (Array.isArray(value)) {
        lList.push({ name, value });
      } else if (typeof value === 'object' && value !== null) {
        dList.push({ name, value });
      } else {
        const typeStr = value === null ? 'None' : typeof value === 'boolean' ? 'bool' : typeof value;
        pList.push({ name, value, type: typeStr });
      }
    }

    return { lists: lList, dicts: dList, primitives: pList, scalarPointers: sPointers };
  }, [locals]);

  return (
    <div className="h-full flex flex-col space-y-5 p-5 overflow-y-auto bg-[#0D0F14] text-gray-200">
      
      {/* Current Step & Executing Line Header */}
      <div className="flex items-center justify-between bg-[#161B26] border border-white/10 rounded-xl px-4 py-2.5 shadow-sm">
        <div className="flex items-center space-x-2.5">
          <span className="px-2.5 py-1 rounded-md bg-[#FF8800] text-black font-mono text-xs font-bold shadow-sm">
            STEP {stepNum}
          </span>
          <span className="text-xs text-gray-400 font-mono">
            Line <span className="text-white font-bold">{line}</span>
          </span>
          <span className="text-[10px] text-gray-500 font-mono uppercase bg-black/30 px-2 py-0.5 rounded">
            {event}
          </span>
        </div>
        <div className="font-mono text-xs text-amber-300/90 bg-black/40 px-3 py-1 rounded-lg border border-white/5 max-w-sm truncate">
          {line_text ? line_text.trim() : '<executing>'}
        </div>
      </div>

      {/* Exception Banner */}
      {exception && (
        <div className="bg-red-950/70 border border-red-700/60 text-red-200 p-4 rounded-xl flex items-start space-x-3 shadow-lg">
          <span className="text-lg">⚠️</span>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-red-400 mb-0.5">Execution Exception</div>
            <pre className="font-mono text-xs whitespace-pre-wrap text-red-200/90">{exception}</pre>
          </div>
        </div>
      )}

      {/* 1. ARRAY / LIST VISUALIZER (Matches Reference Image 1) */}
      {lists.length > 0 && (
        <div className="space-y-4">
          {lists.map(({ name, value }) => {
            const prevArr = Array.isArray(prevLocals[name]) ? prevLocals[name] : null;
            const isArrayChanged = prevArr === null || JSON.stringify(prevArr) !== JSON.stringify(value);

            // Assign pointer colors deterministically based on pointer name
            const pointerMap: Record<number, { name: string; colorIdx: number }[]> = {};
            scalarPointers.forEach(({ name: ptrName, val }, idx) => {
              if (val >= 0 && val < value.length) {
                if (!pointerMap[val]) pointerMap[val] = [];
                pointerMap[val].push({ name: ptrName, colorIdx: idx % POINTER_COLORS.length });
              }
            });

            return (
              <div
                key={name}
                className="bg-[#121620] border border-white/10 rounded-2xl p-5 shadow-lg"
              >
                {/* Array Title & Length Badge */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2.5">
                    <span className="font-mono text-sm font-bold text-white tracking-wide">{name}</span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/5 text-gray-400 font-mono border border-white/10">
                      length = {value.length}
                    </span>
                  </div>
                  {isArrayChanged && (
                    <span className="text-[10px] uppercase font-bold text-[#FF8800] bg-[#FF8800]/15 px-2 py-0.5 rounded-full border border-[#FF8800]/30">
                      Modified
                    </span>
                  )}
                </div>

                {/* Empty State */}
                {value.length === 0 ? (
                  <div className="text-xs text-gray-500 italic py-4 text-center bg-black/30 rounded-xl border border-white/5">
                    [ ] (Empty list)
                  </div>
                ) : (
                  /* Array Elements (Reference Image 1: Bold Rounded Cards with Cream/White Borders) */
                  <div className="overflow-x-auto pb-4 pt-1">
                    <div className="flex items-start space-x-3.5 min-w-max px-1">
                      {value.map((item, idx) => {
                        const isElementChanged = prevArr === null || prevArr[idx] !== item;
                        const activePointers = pointerMap[idx] || [];

                        return (
                          <div key={idx} className="flex flex-col items-center">
                            {/* Array Cell Card (Matches Reference Image 1) */}
                            <div
                              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center border-2 transition-all duration-200 ${
                                isElementChanged && isArrayChanged
                                  ? 'bg-[#222938] border-[#FF8800] text-[#FF8800] shadow-[0_0_15px_rgba(255,136,0,0.35)] scale-105'
                                  : 'bg-[#181D2A] border-[#E8E6DF] text-[#F3F1E9]'
                              }`}
                            >
                              <span className="font-mono text-xl sm:text-2xl font-bold tracking-tight">
                                {typeof item === 'object' && item !== null ? JSON.stringify(item) : String(item)}
                              </span>
                            </div>

                            {/* Index Label: [0], [1], [2]... */}
                            <span className="text-[11px] font-mono text-gray-400 font-medium mt-1.5">
                              [{idx}]
                            </span>

                            {/* Pointer Labels: left, right, mid (Matches Reference Image 1) */}
                            {activePointers.length > 0 && (
                              <div className="mt-2 flex flex-col items-center space-y-1">
                                {activePointers.map((ptr) => {
                                  const color = POINTER_COLORS[ptr.colorIdx];
                                  return (
                                    <div key={ptr.name} className="flex flex-col items-center">
                                      <span className={`text-xs font-bold leading-none ${color.arrow}`}>▲</span>
                                      <span className={`font-mono text-xs font-bold ${color.text} mt-0.5 tracking-tight`}>
                                        {ptr.name}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 2. VARIABLES SECTION (Matches Reference Image 2: "VARIABLES•" + Pill Cards) */}
      <div className="bg-[#121620] border border-white/10 rounded-2xl p-5 shadow-lg space-y-3.5">
        {/* Header with Red Dot Indicator (Matches Reference Image 2) */}
        <div className="flex items-center space-x-1.5 mb-1">
          <h2 className="text-sm font-bold tracking-wider text-gray-400 uppercase font-sans">
            VARIABLES
          </h2>
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
        </div>

        {primitives.length === 0 && dicts.length === 0 && lists.length === 0 ? (
          <div className="text-xs text-gray-500 italic py-2">No variables in scope.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Primitives (Numbers, Strings, Booleans) */}
            {primitives.map(({ name, value }) => {
              const isChanged = prevLocals[name] === undefined || prevLocals[name] !== value;
              return (
                <div
                  key={name}
                  className={`px-4 py-3 rounded-xl border flex items-center justify-between transition-all duration-200 ${
                    isChanged
                      ? 'bg-[#1D2433] border-[#FF8800]/50 shadow-[0_0_12px_rgba(255,136,0,0.15)]'
                      : 'bg-[#181D2A] border-white/5'
                  }`}
                >
                  {/* Left: Variable Name in Blue/Cyan Mono (Matches Reference Image 2) */}
                  <span className="font-mono text-xs font-semibold text-[#4A9EFF]">
                    {name}
                  </span>

                  {/* Right: Variable Value in Green/Emerald (Matches Reference Image 2) */}
                  <span className="font-mono text-xs font-bold text-[#00E599]">
                    {value === null ? 'None' : typeof value === 'boolean' ? (value ? 'True' : 'False') : typeof value === 'string' ? `"${value}"` : String(value)}
                  </span>
                </div>
              );
            })}

            {/* Dictionaries / Maps */}
            {dicts.map(({ name, value }) => {
              const isChanged = prevLocals[name] === undefined || JSON.stringify(prevLocals[name]) !== JSON.stringify(value);
              const keys = Object.keys(value);

              return (
                <div
                  key={name}
                  className={`col-span-1 sm:col-span-2 p-3.5 rounded-xl border transition-all duration-200 ${
                    isChanged
                      ? 'bg-[#1D2433] border-purple-500/50 shadow-[0_0_12px_rgba(168,85,247,0.15)]'
                      : 'bg-[#181D2A] border-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs font-semibold text-[#4A9EFF]">
                      {name} <span className="text-gray-500 text-[10px] font-normal">dict ({keys.length})</span>
                    </span>
                  </div>
                  {keys.length === 0 ? (
                    <div className="text-[11px] text-gray-500 italic font-mono">{"{}"} (empty)</div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {keys.map((k) => (
                        <div key={k} className="bg-black/30 px-2.5 py-1.5 rounded-lg border border-white/5 flex items-center justify-between">
                          <span className="font-mono text-[11px] text-gray-400 truncate">{k}:</span>
                          <span className="font-mono text-[11px] font-bold text-[#00E599] truncate ml-1">
                            {String(value[k])}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. STANDARD OUTPUT CONSOLE */}
      <div className="bg-[#121620] border border-white/10 rounded-2xl p-4 shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/80"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 ml-1">
              Standard Output
            </span>
          </div>
        </div>
        <div className="bg-[#0A0D12] rounded-xl p-3 border border-white/5 font-mono text-xs text-[#00E599] max-h-28 overflow-y-auto whitespace-pre-wrap min-h-[44px]">
          {stdout ? stdout : <span className="text-gray-600 italic">No output produced</span>}
        </div>
      </div>

    </div>
  );
}
