import React, { useEffect, useRef } from 'react';

type ControlsProps = {
  stepIndex: number;
  totalSteps: number;
  onPrev: () => void;
  onNext: () => void;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onSeek: (idx: number) => void;
  playing: boolean;
  speed: number;
  setSpeed: (s: number) => void;
};

export default function Controls({
  stepIndex,
  totalSteps,
  onPrev,
  onNext,
  onPlay,
  onPause,
  onReset,
  onSeek,
  playing,
  speed,
  setSpeed,
}: ControlsProps) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => {
        if (stepIndex >= totalSteps - 1) {
          onPause();
        } else {
          onNext();
        }
      }, speed);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [playing, speed, onNext, onPause, stepIndex, totalSteps]);

  const hasSteps = totalSteps > 0;

  return (
    <div className="bg-surface border-t border-border px-6 py-3 flex flex-col md:flex-row items-center justify-between gap-4 select-none">
      {/* Playback Button Group */}
      <div className="flex items-center space-x-1.5">
        <button
          className="p-2 bg-surfaceSecondary hover:bg-surfaceHover text-secondary hover:text-primary rounded-lg border border-border transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          onClick={onReset}
          disabled={!hasSteps || stepIndex === 0}
          title="Reset to start (Step 1)"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>

        <button
          className="px-3 py-2 bg-surfaceSecondary hover:bg-surfaceHover text-primary text-xs font-semibold rounded-lg border border-border flex items-center space-x-1 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          onClick={onPrev}
          disabled={!hasSteps || stepIndex <= 0}
          title="Previous step (Left Arrow)"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="hidden sm:inline">Prev</span>
        </button>

        {/* Main Play / Pause Button */}
        {playing ? (
          <button
            className="px-4 py-2 bg-accent text-white text-xs font-bold rounded-lg shadow-glow hover:bg-orange-600 flex items-center space-x-1.5 transition-all"
            onClick={onPause}
            title="Pause (Spacebar)"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
            <span>Pause</span>
          </button>
        ) : (
          <button
            className="px-4 py-2 bg-accent text-white text-xs font-bold rounded-lg shadow-glow hover:bg-orange-600 flex items-center space-x-1.5 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            onClick={onPlay}
            disabled={!hasSteps || stepIndex >= totalSteps - 1}
            title="Auto-play execution (Spacebar)"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            <span>Play</span>
          </button>
        )}

        <button
          className="px-3 py-2 bg-surfaceSecondary hover:bg-surfaceHover text-primary text-xs font-semibold rounded-lg border border-border flex items-center space-x-1 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          onClick={onNext}
          disabled={!hasSteps || stepIndex >= totalSteps - 1}
          title="Next step (Right Arrow)"
        >
          <span className="hidden sm:inline">Next</span>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Scrubber Timeline */}
      <div className="flex-1 flex items-center space-x-3 w-full max-w-md">
        <span className="text-xs font-mono font-medium text-secondary whitespace-nowrap min-w-[75px]">
          {hasSteps ? `Step ${stepIndex + 1} / ${totalSteps}` : '0 / 0'}
        </span>
        <input
          type="range"
          min="0"
          max={Math.max(totalSteps - 1, 0)}
          value={hasSteps ? stepIndex : 0}
          disabled={!hasSteps}
          onChange={(e) => onSeek(Number(e.target.value))}
          className="w-full accent-accent h-2 bg-background rounded-lg cursor-pointer disabled:opacity-30 transition-all"
        />
      </div>

      {/* Speed Presets */}
      <div className="flex items-center space-x-1.5 bg-surfaceSecondary p-1 rounded-lg border border-border">
        <span className="text-[11px] text-muted font-medium px-2 hidden sm:inline">Speed:</span>
        {[
          { label: '0.5x', ms: 800 },
          { label: '1x', ms: 400 },
          { label: '2x', ms: 200 },
        ].map((item) => (
          <button
            key={item.label}
            onClick={() => setSpeed(item.ms)}
            className={`px-2.5 py-1 text-xs font-mono font-semibold rounded-md transition-all ${
              speed === item.ms
                ? 'bg-accent text-white shadow-sm'
                : 'text-secondary hover:text-primary'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
