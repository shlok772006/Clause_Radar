"use client";

import React, { useState } from 'react';
import { Clause, Finding, RubricResult, RubricItem, Concern } from '@/lib/types';
import { AskPanel } from './AskPanel';
import { ConcernPicker } from './ConcernPicker';
import { RiskDashboard } from './RiskDashboard';
import { MissingReport } from './MissingReport';
import { RUBRIC_ITEMS } from '@/lib/rubric-data';

export interface FindingsPaneProps {
  sessionId: string;
  clauses: Clause[];
  findings?: Finding[];
  rubric?: RubricResult[];
  rubricItems?: RubricItem[];
  selectedClauseId: string | null;
  onSelectClause: (clauseId: string) => void;
  onOpenAction?: () => void;
}

type TabType = 'clauses' | 'risks' | 'missing' | 'ask';

export function FindingsPane({
  sessionId,
  clauses,
  findings = [],
  rubric = [],
  rubricItems = RUBRIC_ITEMS,
  selectedClauseId,
  onSelectClause,
  onOpenAction,
}: FindingsPaneProps) {
  const [activeTab, setActiveTab] = useState<TabType>('clauses');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConcerns, setSelectedConcerns] = useState<Concern[]>(['exit', 'pay']);
  const [plainViewMode, setPlainViewMode] = useState<Record<string, 'original' | 'plain'>>({});
  const [explanations, setExplanations] = useState<
    Record<string, { text: string; verified: boolean; loading: boolean }>
  >({});

  const handleToggleConcern = (concern: Concern) => {
    setSelectedConcerns((prev) =>
      prev.includes(concern) ? prev.filter((c) => c !== concern) : [...prev, concern]
    );
  };

  const handleTogglePlain = async (clause: Clause) => {
    const currentMode = plainViewMode[clause.id] || 'original';
    const nextMode = currentMode === 'original' ? 'plain' : 'original';

    setPlainViewMode((prev) => ({ ...prev, [clause.id]: nextMode }));

    if (nextMode === 'plain' && !explanations[clause.id]) {
      setExplanations((prev) => ({
        ...prev,
        [clause.id]: { text: '', verified: true, loading: true },
      }));

      try {
        const res = await fetch('/api/explain', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId, clauseId: clause.id }),
        });
        const data = await res.json();
        if (res.ok) {
          setExplanations((prev) => ({
            ...prev,
            [clause.id]: { text: data.text, verified: data.verified, loading: false },
          }));
        } else {
          setExplanations((prev) => ({
            ...prev,
            [clause.id]: { text: clause.text, verified: false, loading: false },
          }));
        }
      } catch {
        setExplanations((prev) => ({
          ...prev,
          [clause.id]: { text: clause.text, verified: false, loading: false },
        }));
      }
    }
  };

  const filteredClauses = clauses.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (c.number && c.number.toLowerCase().includes(q)) ||
      c.id.toLowerCase().includes(q) ||
      c.text.toLowerCase().includes(q) ||
      c.headingPath.some((h) => h.toLowerCase().includes(q))
    );
  });

  const missingCount = rubric.filter((r) => r.presence === 'missing').length;

  return (
    <aside className="flex flex-col h-full bg-paper overflow-hidden select-text border-l border-rule">
      {/* Tab Navigation */}
      <nav aria-label="Review Navigation" className="flex border-b border-rule bg-white px-2 pt-2" role="tablist">
        <button
          id="tab-clauses"
          type="button"
          onClick={() => setActiveTab('clauses')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'clauses'
              ? 'border-ink text-ink'
              : 'border-transparent text-ink-soft hover:text-ink hover:border-rule'
          }`}
          aria-selected={activeTab === 'clauses'}
          aria-controls="tabpanel-clauses"
          role="tab"
        >
          <span>Clauses</span>
          <span className="text-[10px] bg-paper px-1.5 py-0.5 rounded-full border border-rule">
            {clauses.length}
          </span>
        </button>

        <button
          id="tab-risks"
          type="button"
          onClick={() => setActiveTab('risks')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'risks'
              ? 'border-flag text-flag'
              : 'border-transparent text-ink-soft hover:text-ink hover:border-rule'
          }`}
          aria-selected={activeTab === 'risks'}
          aria-controls="tabpanel-risks"
          role="tab"
        >
          <span>Risks</span>
          {findings.length > 0 ? (
            <span className="text-[10px] bg-red-50 text-flag px-1.5 py-0.5 rounded-full border border-red-200 font-mono font-bold">
              {findings.length}
            </span>
          ) : (
            <span className="w-1.5 h-1.5 rounded-full bg-rule" />
          )}
        </button>

        <button
          id="tab-missing"
          type="button"
          onClick={() => setActiveTab('missing')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'missing'
              ? 'border-ink text-ink'
              : 'border-transparent text-ink-soft hover:text-ink hover:border-rule'
          }`}
          aria-selected={activeTab === 'missing'}
          aria-controls="tabpanel-missing"
          role="tab"
        >
          <span>Missing</span>
          {missingCount > 0 ? (
            <span className="text-[10px] bg-paper px-1.5 py-0.5 rounded-full border border-rule font-mono">
              {missingCount}
            </span>
          ) : (
            <span className="text-[10px] bg-paper px-1.5 py-0.5 rounded-full border border-rule font-mono">
              20
            </span>
          )}
        </button>

        <button
          id="tab-ask"
          type="button"
          onClick={() => setActiveTab('ask')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'ask'
              ? 'border-ink text-ink'
              : 'border-transparent text-ink-soft hover:text-ink hover:border-rule'
          }`}
          aria-selected={activeTab === 'ask'}
          aria-controls="tabpanel-ask"
          role="tab"
        >
          <span>Ask</span>
          <span className="w-1.5 h-1.5 rounded-full bg-verified" />
        </button>
      </nav>

      {/* Concern Picker Filter Bar (shown on Risks and Missing tabs) */}
      {(activeTab === 'risks' || activeTab === 'missing') && (
        <ConcernPicker
          selectedConcerns={selectedConcerns}
          onToggleConcern={handleToggleConcern}
        />
      )}

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'clauses' && (
          <div id="tabpanel-clauses" role="tabpanel" aria-labelledby="tab-clauses" className="flex flex-col h-full">
            {/* Filter bar */}
            <div className="p-3 border-b border-rule bg-paper sticky top-0 z-10">
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter clauses by text, number..."
                className="w-full px-3 py-1.5 bg-white border border-rule rounded text-xs text-ink placeholder:text-ink-soft/60 focus:outline-none focus:border-ink"
                aria-label="Filter clauses"
              />
            </div>

            {/* Clauses List */}
            <ul className="divide-y divide-rule/60" role="list">
              {filteredClauses.length === 0 ? (
                <li className="p-6 text-center text-xs text-ink-soft">
                  No clauses match &ldquo;{searchQuery}&rdquo;
                </li>
              ) : (
                filteredClauses.map((clause) => {
                  const isSelected = selectedClauseId === clause.id;
                  const isPlain = plainViewMode[clause.id] === 'plain';
                  const exp = explanations[clause.id];

                  return (
                    <li key={clause.id}>
                      <div
                        onClick={() => onSelectClause(clause.id)}
                        className={`w-full text-left p-3.5 transition-colors cursor-pointer block hover:bg-white/80 ${
                          isSelected ? 'bg-white border-l-4 border-l-marker shadow-xs' : ''
                        }`}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            onSelectClause(clause.id);
                          }
                        }}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-xs font-semibold text-ink font-mono">
                            {clause.number ? `§ ${clause.number}` : clause.id}
                          </span>
                          <span className="text-[11px] text-ink-soft font-mono">
                            p. {clause.page}
                          </span>
                        </div>

                        {clause.headingPath.length > 0 && (
                          <div className="text-[11px] text-ink-soft font-medium truncate mb-1">
                            {clause.headingPath.join(' › ')}
                          </div>
                        )}

                        {/* Clause Body: Preview when collapsed, Full/Plain when expanded */}
                        {!isSelected ? (
                          <p className="text-xs text-ink/85 line-clamp-2 leading-relaxed">
                            {clause.text.slice(0, 110).trim()}
                            {clause.text.length > 110 && '…'}
                          </p>
                        ) : (
                          <div className="mt-2 pt-2 border-t border-rule space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] uppercase font-mono tracking-wider text-ink-soft">
                                View Mode
                              </span>
                              <div className="flex items-center bg-paper rounded p-0.5 border border-rule gap-0.5">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPlainViewMode((prev) => ({ ...prev, [clause.id]: 'original' }));
                                  }}
                                  className={`px-2 py-0.5 text-[10px] font-semibold rounded transition cursor-pointer ${
                                    !isPlain
                                      ? 'bg-white shadow-2xs text-ink'
                                      : 'text-ink-soft hover:text-ink'
                                  }`}
                                >
                                  As written
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleTogglePlain(clause);
                                  }}
                                  className={`px-2 py-0.5 text-[10px] font-semibold rounded transition cursor-pointer flex items-center gap-1 ${
                                    isPlain
                                      ? 'bg-ink text-paper shadow-2xs'
                                      : 'text-ink-soft hover:text-ink'
                                  }`}
                                >
                                  <span>Plain English</span>
                                  <span className="w-1.5 h-1.5 rounded-full bg-marker" />
                                </button>
                              </div>
                            </div>

                            {isPlain ? (
                              exp?.loading ? (
                                <div className="flex items-center gap-2 p-3 bg-paper rounded text-xs text-ink-soft">
                                  <div className="w-3.5 h-3.5 rounded-full border-2 border-ink border-t-transparent animate-spin" />
                                  <span>Simplifying clause and verifying numbers...</span>
                                </div>
                              ) : (
                                <div className="p-3 bg-paper/60 border border-marker/60 rounded-lg text-xs space-y-1.5 shadow-2xs">
                                  <div className="flex items-center justify-between text-[10px] font-mono">
                                    <span className="font-semibold text-ink">Simplified for candidates</span>
                                    {exp?.verified ? (
                                      <span className="text-verified flex items-center gap-1 font-semibold">
                                        ✓ Numbers verified
                                      </span>
                                    ) : (
                                      <span className="text-amber-800">Unverified numbers</span>
                                    )}
                                  </div>
                                  <p className="text-xs text-ink leading-relaxed">
                                    {exp?.text || clause.text}
                                  </p>
                                </div>
                              )
                            ) : (
                              <p className="text-xs text-ink leading-relaxed font-serif bg-paper/50 p-2.5 rounded border border-rule/60">
                                {clause.text}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        )}

        {activeTab === 'risks' && (
          <div id="tabpanel-risks" role="tabpanel" aria-labelledby="tab-risks">
            <RiskDashboard
              findings={findings}
              selectedConcerns={selectedConcerns}
              onHighlightClause={onSelectClause}
              onOpenAction={onOpenAction}
            />
          </div>
        )}

        {activeTab === 'missing' && (
          <div id="tabpanel-missing" role="tabpanel" aria-labelledby="tab-missing">
            <MissingReport
              rubricResults={rubric}
              rubricItems={rubricItems}
              selectedConcerns={selectedConcerns}
              onHighlightClause={onSelectClause}
            />
          </div>
        )}

        {activeTab === 'ask' && (
          <div id="tabpanel-ask" role="tabpanel" aria-labelledby="tab-ask">
            <AskPanel
              sessionId={sessionId}
              clauses={clauses}
              onHighlightClause={onSelectClause}
            />
          </div>
        )}
      </div>

      {/* Persistent Quiet Disclaimer Footer (AGENTS.md rule 10) */}
      <footer className="p-2.5 border-t border-rule bg-white text-[11px] text-ink-soft text-center select-none">
        Clause Radar helps you understand your document. It is not legal advice.
      </footer>
    </aside>
  );
}

export default FindingsPane;
