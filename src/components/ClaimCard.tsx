"use client";

import React from 'react';
import { Claim } from '@/lib/types';

export interface ClaimCardProps {
  claim: Claim;
  onHighlightClause: (clauseId: string) => void;
}

export function ClaimCard({ claim, onHighlightClause }: ClaimCardProps) {
  return (
    <div className="bg-white border border-rule rounded-lg p-4 shadow-2xs transition-all hover:border-ink-soft/40">
      {/* Top assertion text */}
      <p className="text-sm font-medium text-ink leading-relaxed mb-3">
        {claim.text}
      </p>

      {/* Citations & Evidence Quotes */}
      <div className="space-y-2">
        {claim.evidence.map((ev, idx) => (
          <div
            key={`${ev.clauseId}-${idx}`}
            className="flex flex-col bg-paper border border-rule/80 rounded p-2.5 text-xs gap-1.5"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-verified inline-block" />
                <span className="font-mono font-semibold text-verified text-[11px]">
                  Verified Quote
                </span>
                <span className="text-rule">•</span>
                <span className="font-mono text-ink-soft text-[11px]">
                  § {ev.clauseId} · p. {ev.page}
                </span>
              </div>

              {/* Show Me Button */}
              <button
                type="button"
                onClick={() => onHighlightClause(ev.clauseId)}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-white hover:bg-marker/20 border border-rule hover:border-marker text-ink rounded text-[11px] font-semibold transition cursor-pointer"
                title={`Highlight clause ${ev.clauseId} on page ${ev.page}`}
              >
                <span>Show me</span>
                <svg className="w-3 h-3 text-ink-soft" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>

            {/* Verbatim quote snippet */}
            <blockquote className="italic text-ink-soft/90 border-l-2 border-marker pl-2 text-[12px] leading-snug">
              &ldquo;{ev.quote}&rdquo;
            </blockquote>
          </div>
        ))}
      </div>

      {/* Confidence & verification seal */}
      <div className="mt-3 pt-2 border-t border-rule/50 flex items-center justify-between text-[11px] text-ink-soft">
        <span className="flex items-center gap-1">
          <svg className="w-3.5 h-3.5 text-verified" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
          <span>Grounded in agreement text</span>
        </span>
        <span className="font-mono text-[10px]">
          Confidence: {Math.round(claim.confidence * 100)}%
        </span>
      </div>
    </div>
  );
}

export default ClaimCard;
