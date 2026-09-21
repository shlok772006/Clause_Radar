"use client";

import React from 'react';
import { Concern, CONCERN_LABELS } from '@/lib/types';

export interface ConcernPickerProps {
  selectedConcerns: Concern[];
  onToggleConcern: (concern: Concern) => void;
  className?: string;
}

const ALL_CONCERNS: Concern[] = ['exit', 'lockin', 'future_work', 'pay', 'ip', 'termination'];

export function ConcernPicker({
  selectedConcerns,
  onToggleConcern,
  className = '',
}: ConcernPickerProps) {
  return (
    <div className={`p-3 bg-paper border-b border-rule ${className}`}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-[11px] font-semibold text-ink-soft uppercase tracking-wider">
          Filter by your concerns:
        </span>
        {selectedConcerns.length > 0 && (
          <span className="text-[10px] font-mono text-ink-soft">
            {selectedConcerns.length} selected · Prioritized
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {ALL_CONCERNS.map((concern) => {
          const isSelected = selectedConcerns.includes(concern);
          const label = CONCERN_LABELS[concern] || concern;

          return (
            <button
              key={concern}
              type="button"
              onClick={() => onToggleConcern(concern)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium transition cursor-pointer flex items-center gap-1.5 border shadow-2xs ${
                isSelected
                  ? 'bg-ink text-paper border-ink'
                  : 'bg-white text-ink border-rule hover:border-ink-soft/60'
              }`}
              aria-pressed={isSelected}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isSelected ? 'bg-marker' : 'bg-rule'
                }`}
              />
              <span>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default ConcernPicker;
