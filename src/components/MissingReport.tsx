"use client";

import React, { useState } from 'react';
import { RubricResult, RubricItem, Concern, Presence } from '@/lib/types';

export interface MissingReportProps {
  rubricResults: RubricResult[];
  rubricItems: RubricItem[];
  selectedConcerns: Concern[];
  onHighlightClause: (clauseId: string) => void;
}

const PRESENCE_BADGES: Record<
  Presence,
  { label: string; badgeClass: string; borderClass: string }
> = {
  present: {
    label: 'Present',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    borderClass: 'border-l-emerald-500',
  },
  unclear: {
    label: 'Unclear',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-300',
    borderClass: 'border-l-amber-500',
  },
  missing: {
    label: 'Missing',
    badgeClass: 'bg-red-50 text-flag border-red-200',
    borderClass: 'border-l-flag',
  },
};

export function MissingReport({
  rubricResults,
  rubricItems,
  selectedConcerns,
  onHighlightClause,
}: MissingReportProps) {
  const [filter, setFilter] = useState<'all' | 'missing' | 'unclear' | 'present'>('all');

  const itemsMap = new Map<string, RubricItem>(rubricItems.map((item) => [item.id, item]));

  const enriched = rubricResults.map((res) => {
    const item = itemsMap.get(res.itemId);
    return {
      ...res,
      item,
    };
  });

  const presentCount = enriched.filter((r) => r.presence === 'present').length;
  const unclearCount = enriched.filter((r) => r.presence === 'unclear').length;
  const missingCount = enriched.filter((r) => r.presence === 'missing').length;

  const filtered = enriched.filter((r) => {
    if (filter === 'all') return true;
    return r.presence === filter;
  });

  // Sort by concern match first -> missing status -> item order
  const sorted = [...filtered].sort((a, b) => {
    const aMatch = a.item && selectedConcerns.includes(a.item.concern) ? 0 : 1;
    const bMatch = b.item && selectedConcerns.includes(b.item.concern) ? 0 : 1;

    if (aMatch !== bMatch) return aMatch - bMatch;

    const rankPresence = (p: Presence) => (p === 'missing' ? 1 : p === 'unclear' ? 2 : 3);
    return rankPresence(a.presence) - rankPresence(b.presence);
  });

  return (
    <div className="p-4 space-y-4">
      {/* Scorecard Header */}
      <div className="bg-white border border-rule rounded-xl p-4 shadow-2xs">
        <div className="text-xs font-semibold text-ink mb-2">Standard Clause Audit</div>
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="p-2 bg-emerald-50/50 border border-emerald-200 rounded-lg">
            <span className="block font-serif text-lg font-bold text-emerald-800">
              {presentCount}
            </span>
            <span className="text-[11px] text-emerald-700">Present</span>
          </div>

          <div className="p-2 bg-amber-50/50 border border-amber-200 rounded-lg">
            <span className="block font-serif text-lg font-bold text-amber-800">
              {unclearCount}
            </span>
            <span className="text-[11px] text-amber-700">Unclear</span>
          </div>

          <div className="p-2 bg-red-50/50 border border-red-200 rounded-lg">
            <span className="block font-serif text-lg font-bold text-flag">
              {missingCount}
            </span>
            <span className="text-[11px] text-flag">Missing</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 border-b border-rule pb-2 text-xs">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`px-2.5 py-1 rounded font-medium transition cursor-pointer ${
            filter === 'all' ? 'bg-ink text-paper' : 'text-ink-soft hover:text-ink'
          }`}
        >
          All ({enriched.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('missing')}
          className={`px-2.5 py-1 rounded font-medium transition cursor-pointer ${
            filter === 'missing' ? 'bg-flag text-paper' : 'text-ink-soft hover:text-ink'
          }`}
        >
          Missing ({missingCount})
        </button>
        <button
          type="button"
          onClick={() => setFilter('unclear')}
          className={`px-2.5 py-1 rounded font-medium transition cursor-pointer ${
            filter === 'unclear' ? 'bg-amber-600 text-white' : 'text-ink-soft hover:text-ink'
          }`}
        >
          Unclear ({unclearCount})
        </button>
        <button
          type="button"
          onClick={() => setFilter('present')}
          className={`px-2.5 py-1 rounded font-medium transition cursor-pointer ${
            filter === 'present' ? 'bg-emerald-700 text-white' : 'text-ink-soft hover:text-ink'
          }`}
        >
          Present ({presentCount})
        </button>
      </div>

      {/* Audit List */}
      <div className="space-y-3">
        {sorted.map((res) => {
          const item = res.item;
          if (!item) return null;

          const badge = PRESENCE_BADGES[res.presence];
          const isConcernMatch = selectedConcerns.includes(item.concern);

          return (
            <div
              key={res.itemId}
              className={`bg-white border border-rule border-l-4 ${badge.borderClass} rounded-lg p-3.5 shadow-2xs space-y-2`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="text-xs font-semibold text-ink flex items-center gap-1.5">
                    <span>{item.label}</span>
                    {isConcernMatch && (
                      <span className="px-1 py-0.2 bg-paper text-ink border border-rule rounded text-[9px] font-mono">
                        Your Concern
                      </span>
                    )}
                  </h4>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border ${badge.badgeClass}`}
                  >
                    {badge.label}
                  </span>

                  {res.bestClauseId && (
                    <button
                      type="button"
                      onClick={() => onHighlightClause(res.bestClauseId!)}
                      className="px-2 py-0.5 bg-paper hover:bg-marker/25 border border-rule text-ink rounded text-[10px] font-semibold transition cursor-pointer"
                    >
                      Show me
                    </button>
                  )}
                </div>
              </div>

              {/* Why It Matters */}
              <p className="text-[12px] text-ink-soft leading-relaxed">
                {item.whyItMatters}
              </p>

              {/* If Missing Ask */}
              {res.presence !== 'present' && item.ifMissingAsk && (
                <div className="bg-paper border border-rule/70 rounded p-2.5 text-xs space-y-1">
                  <span className="font-semibold text-ink text-[11px] block">
                    If missing, ask HR:
                  </span>
                  <p className="text-[11px] text-ink-soft italic leading-snug">
                    &ldquo;{item.ifMissingAsk}&rdquo;
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

export default MissingReport;
