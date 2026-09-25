"use client";

import React from 'react';
import { Finding, Concern, Severity } from '@/lib/types';

export interface RiskDashboardProps {
  findings: Finding[];
  selectedConcerns: Concern[];
  onHighlightClause: (clauseId: string) => void;
  onOpenAction?: () => void;
}

const SEVERITY_ORDER: Record<Severity, number> = {
  high: 1,
  medium: 2,
  low: 3,
  info: 4,
};

const SEVERITY_STYLES: Record<
  Severity,
  { bg: string; text: string; border: string; badge: string }
> = {
  high: {
    bg: 'bg-red-50/50',
    text: 'text-flag',
    border: 'border-flag/30',
    badge: 'bg-flag text-paper',
  },
  medium: {
    bg: 'bg-amber-50/50',
    text: 'text-amber-800',
    border: 'border-amber-300',
    badge: 'bg-amber-600 text-white',
  },
  low: {
    bg: 'bg-blue-50/50',
    text: 'text-blue-800',
    border: 'border-blue-200',
    badge: 'bg-blue-600 text-white',
  },
  info: {
    bg: 'bg-paper',
    text: 'text-ink-soft',
    border: 'border-rule',
    badge: 'bg-ink-soft text-paper',
  },
};

export function RiskDashboard({
  findings,
  selectedConcerns,
  onHighlightClause,
  onOpenAction,
}: RiskDashboardProps) {
  // Sort findings: concern match first -> severity
  const sortedFindings = [...findings].sort((a, b) => {
    const aMatches = selectedConcerns.includes(a.concern) ? 0 : 1;
    const bMatches = selectedConcerns.includes(b.concern) ? 0 : 1;

    if (aMatches !== bMatches) {
      return aMatches - bMatches;
    }

    return (SEVERITY_ORDER[a.severity] || 99) - (SEVERITY_ORDER[b.severity] || 99);
  });

  if (sortedFindings.length === 0) {
    return (
      <div className="p-8 text-center my-auto flex flex-col items-center">
        <div className="w-10 h-10 rounded-full bg-verified/10 text-verified flex items-center justify-center mb-3">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-sm font-semibold text-ink mb-1">No Risks Detected</h3>
        <p className="text-xs text-ink-soft max-w-xs leading-relaxed">
          None of the 14 standard legal risk rules were triggered by this agreement.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Take Action Banner */}
      {onOpenAction && (
        <div className="bg-white border border-rule rounded-xl p-3.5 flex items-center justify-between gap-3 shadow-2xs">
          <div>
            <h4 className="text-xs font-bold text-ink flex items-center gap-1.5">
              <span>Ready to negotiate or clarify?</span>
              <span className="w-1.5 h-1.5 rounded-full bg-marker" />
            </h4>
            <p className="text-[11px] text-ink-soft mt-0.5">
              Draft an HR candidate email or 5 targeted questions for a lawyer.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenAction}
            className="px-3 py-1.5 bg-ink hover:bg-ink/90 text-paper text-xs font-semibold rounded transition cursor-pointer flex items-center gap-1.5 shrink-0 shadow-2xs"
          >
            <span>Take Action</span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-ink-soft mb-1">
        <span>
          <strong>{sortedFindings.length}</strong> risk findings evaluated with citations
        </span>
        <span className="font-mono text-[11px]">Strict Citation Requirement</span>
      </div>

      <div className="space-y-4">
        {sortedFindings.map((finding) => {
          const styles = SEVERITY_STYLES[finding.severity] || SEVERITY_STYLES.info;
          const isConcernMatch = selectedConcerns.includes(finding.concern);

          return (
            <div
              key={finding.id}
              className={`border rounded-xl p-4 bg-white shadow-2xs transition hover:shadow-xs space-y-3 ${
                isConcernMatch ? 'ring-1 ring-ink/20' : ''
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${styles.badge}`}
                    >
                      {finding.severity}
                    </span>
                    {isConcernMatch && (
                      <span className="px-1.5 py-0.2 bg-paper text-ink border border-rule rounded text-[10px] font-mono">
                        Your Concern
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-semibold text-ink leading-snug">
                    {finding.title}
                  </h4>
                </div>
              </div>

              {/* Explanation */}
              <p className="text-xs text-ink-soft leading-relaxed">
                {finding.explanation}
              </p>

              {/* Benchmark if present */}
              {finding.benchmark && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-paper border border-rule rounded text-[11px] text-ink-soft font-mono">
                  <span className="font-semibold text-ink">Benchmark:</span>
                  <span>{finding.benchmark}</span>
                </div>
              )}

              {/* Legal Context Note if present */}
              {finding.legalNote && (
                <div className="p-3 bg-paper border-l-4 border-amber-500 rounded-r text-xs text-ink-soft space-y-1">
                  <div className="flex items-center justify-between font-semibold text-ink text-[11px]">
                    <span>Legal Context</span>
                    <span className="text-amber-800 text-[10px]">Confirm with a lawyer</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">{finding.legalNote}</p>
                </div>
              )}

              {/* Citations & Evidence Quotes */}
              <div className="space-y-2 border-t border-rule/60 pt-2.5">
                {finding.evidence.map((ev, evIdx) => (
                  <div
                    key={`${ev.clauseId}-${evIdx}`}
                    className="flex flex-col bg-paper border border-rule/70 rounded p-2.5 text-xs gap-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-ink-soft text-[11px]">
                        § {ev.clauseId} · p. {ev.page}
                      </span>
                      <button
                        type="button"
                        onClick={() => onHighlightClause(ev.clauseId)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-white hover:bg-marker/25 border border-rule text-ink rounded text-[11px] font-semibold transition cursor-pointer"
                      >
                        <span>Show me</span>
                        <svg className="w-3 h-3 text-ink-soft" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </button>
                    </div>
                    <blockquote className="italic text-ink-soft/90 border-l-2 border-marker pl-2 text-[12px] leading-snug">
                      &ldquo;{ev.quote}&rdquo;
                    </blockquote>
                  </div>
                ))}
              </div>

              {/* Suggested Negotiation Question */}
              {finding.suggestedQuestion && (
                <div className="bg-white border border-rule rounded p-2.5 text-xs flex items-start gap-2 text-ink">
                  <span className="font-bold text-[11px] text-ink shrink-0 font-mono">
                    Ask HR:
                  </span>
                  <p className="text-[12px] leading-snug text-ink/90 flex-1">
                    {finding.suggestedQuestion}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default RiskDashboard;
