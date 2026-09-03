import React, { useState, useRef, useEffect } from 'react';

type PointerInputProps = {
  pointers: string[];
  onChange: (pointers: string[]) => void;
  code: string;
};

export default function PointerInput({ pointers, onChange, code }: PointerInputProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAdding && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAdding]);

  const handleAdd = () => {
    const trimmed = inputValue.trim();
    if (trimmed && !pointers.includes(trimmed)) {
      onChange([...pointers, trimmed]);
    }
    setInputValue('');
    setIsAdding(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    } else if (e.key === 'Escape') {
      setInputValue('');
      setIsAdding(false);
    }
  };

  const handleRemove = (nameToRemove: string) => {
    onChange(pointers.filter((p) => p !== nameToRemove));
  };

  // Check which pointer variable names are not present in code
  const isVarInCode = (varName: string) => {
    if (!varName.trim()) return false;
    try {
      const regex = new RegExp(`\\b${varName.trim()}\\b`);
      return regex.test(code);
    } catch {
      return code.includes(varName.trim());
    }
  };

  const invalidPointers = pointers.filter((p) => !isVarInCode(p));

  return (
    <div className="px-4 py-2.5 bg-[#141924] border-b border-white/10 flex flex-col gap-1.5 shrink-0 select-none">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-gray-300 font-sans tracking-wide">
          Pointer Variables:
        </span>

        {/* Pointer Chips */}
        {pointers.map((p) => {
          const isValid = isVarInCode(p);
          return (
            <div
              key={p}
              className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border font-mono text-xs font-bold transition-all ${
                isValid
                  ? 'bg-[#1C2333] border-white/15 text-[#FF8800] shadow-sm'
                  : 'bg-amber-950/30 border-amber-600/50 text-amber-300'
              }`}
            >
              <span>{p}</span>
              <button
                type="button"
                onClick={() => handleRemove(p)}
                className="text-gray-400 hover:text-red-400 ml-1 transition-colors leading-none"
                title={`Remove pointer ${p}`}
              >
                ✕
              </button>
            </div>
          );
        })}

        {/* Add Pointer Button / Input Form */}
        {isAdding ? (
          <div className="inline-flex items-center space-x-1">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleAdd}
              placeholder="var name"
              className="w-20 px-2 py-0.5 bg-[#0B0D13] border border-[#FF8800] rounded-lg text-xs font-mono text-white outline-none"
            />
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleAdd();
              }}
              className="px-2 py-0.5 bg-[#FF8800] text-black text-xs font-bold rounded-lg hover:bg-[#ffa033]"
            >
              Add
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg border border-dashed border-white/20 hover:border-[#FF8800] text-gray-400 hover:text-white text-xs font-mono transition-all"
            title="Add pointer variable name"
          >
            <span>+ Add Pointer</span>
          </button>
        )}
      </div>

      {/* Validation warning if a pointer name is not in code */}
      {invalidPointers.length > 0 && (
        <div className="text-[11px] text-amber-400 font-mono flex items-center space-x-1.5 pt-0.5">
          <span>⚠️</span>
          <span>
            {invalidPointers.map((p) => `"${p}" was not found in the code.`).join(' ')}
          </span>
        </div>
      )}
    </div>
  );
}
