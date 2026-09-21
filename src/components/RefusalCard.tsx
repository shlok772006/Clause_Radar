"use client";

import React from 'react';
import { Clause } from '@/lib/types';

export interface RefusalCardProps {
  status: 'insufficient_evidence' | 'out_of_scope';
  nearestClauseIds: string[];
  clarifyWithProfessional: string[];
  clauses: Clause[];
  onHighlightClause: (clauseId: string) => void;
}

export function RefusalCard({
  status,
  nearestClauseIds,
  clarifyWithProfessional,
  clauses,
  onHighlightClause,
}: RefusalCardProps) {
  const clauseMap = new Map<string, Clause>(clauses.map((c) => [c.id, c]));

  return (
    <div className="bg-white border-2 border-rule/80 rounded-xl p-5 shadow-xs space-y-4">
      {/* Header Banner */}
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-marker/20 text-ink flex items-center justify-center shrink-0 mt-0.5">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-ink">
            {status === 'out_of_scope'
              ? 'Question Outside Scope'
              : 'Not Stated in this Agreement'}
          </h3>
          <p className="text-xs text-ink-soft leading-relaxed mt-0.5">
            {status === 'out_of_scope'
              ? 'Clause Radar only analyzes the clauses contained within this employment agreement.'
              : 'The model scanned all clauses in your agreement and found no verifiable mention or provision answering this question.'}
          </p>
        </div>
      </div>

      {/* Nearest Clauses (if any) */}
      {nearestClauseIds.length > 0 && (
        <div className="bg-paper border border-rule/80 rounded-lg p-3">
          <div className="text-[11px] font-semibold text-ink-soft uppercase tracking-wider mb-2">
            Closest Related Sections Found
          </div>
          <div className="flex flex-wrap gap-2">
            {nearestClauseIds.map((id) => {
              const clause = clauseMap.get(id);
              const label = clause
                ? `${clause.number ? `§ ${clause.number}` : clause.id} · p.${clause.page}`
                : id;

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onHighlightClause(id)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-marker/25 border border-rule hover:border-marker rounded text-xs font-medium text-ink transition cursor-pointer shadow-2xs"
                  title={clause?.text.slice(0, 80) || `Jump to clause ${id}`}
                >
                  <span className="font-mono">{label}</span>
                  <svg className="w-3 h-3 text-ink-soft" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-ink-soft/80 mt-2 italic">
            Click any section above to inspect the closest clauses in the document viewer.
          </p>
        </div>
      )}

      {/* Suggested Questions for HR or Lawyer */}
      {clarifyWithProfessional.length > 0 && (
        <div className="border-t border-rule/60 pt-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-ink mb-2">
            <svg className="w-3.5 h-3.5 text-verified" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Questions to Clarify with HR or a Professional</span>
          </div>
          <ul className="space-y-1.5 text-xs text-ink/85 list-disc list-inside">
            {clarifyWithProfessional.map((q, idx) => (
              <li key={idx} className="leading-relaxed">
                {q}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default RefusalCard;
