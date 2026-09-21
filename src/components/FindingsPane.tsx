"use client";

import React, { useState } from 'react';
import { Clause } from '@/lib/types';

export interface FindingsPaneProps {
  clauses: Clause[];
  selectedClauseId: string | null;
  onSelectClause: (clauseId: string) => void;
}

type TabType = 'clauses' | 'risks' | 'missing' | 'ask';

export function FindingsPane({
  clauses,
  selectedClauseId,
  onSelectClause,
}: FindingsPaneProps) {
  const [activeTab, setActiveTab] = useState<TabType>('clauses');
  const [searchQuery, setSearchQuery] = useState('');

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

  return (
    <aside className="flex flex-col h-full bg-paper overflow-hidden select-text border-l border-rule">
      {/* Tab Navigation */}
      <nav aria-label="Review Navigation" className="flex border-b border-rule bg-white px-2 pt-2">
        <button
          type="button"
          onClick={() => setActiveTab('clauses')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'clauses'
              ? 'border-ink text-ink'
              : 'border-transparent text-ink-soft hover:text-ink hover:border-rule'
          }`}
          aria-selected={activeTab === 'clauses'}
          role="tab"
        >
          <span>Clauses</span>
          <span className="text-[10px] bg-paper px-1.5 py-0.5 rounded-full border border-rule">
            {clauses.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('risks')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'risks'
              ? 'border-flag text-flag'
              : 'border-transparent text-ink-soft hover:text-ink hover:border-rule'
          }`}
          aria-selected={activeTab === 'risks'}
          role="tab"
        >
          <span>Risks</span>
          <span className="text-[9px] bg-paper px-1 py-0.2 rounded border border-rule text-ink-soft">
            Phase 2
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('missing')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'missing'
              ? 'border-ink text-ink'
              : 'border-transparent text-ink-soft hover:text-ink hover:border-rule'
          }`}
          aria-selected={activeTab === 'missing'}
          role="tab"
        >
          <span>Missing</span>
          <span className="text-[9px] bg-paper px-1 py-0.2 rounded border border-rule text-ink-soft">
            Phase 3
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('ask')}
          className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'ask'
              ? 'border-ink text-ink'
              : 'border-transparent text-ink-soft hover:text-ink hover:border-rule'
          }`}
          aria-selected={activeTab === 'ask'}
          role="tab"
        >
          <span>Ask</span>
          <span className="text-[9px] bg-paper px-1 py-0.2 rounded border border-rule text-ink-soft">
            Phase 2
          </span>
        </button>
      </nav>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'clauses' && (
          <div className="flex flex-col h-full">
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
                  const previewText = clause.text.slice(0, 110).trim();

                  return (
                    <li key={clause.id}>
                      <button
                        type="button"
                        onClick={() => onSelectClause(clause.id)}
                        className={`w-full text-left p-3.5 transition-colors cursor-pointer block hover:bg-white/80 focus:outline-none focus:ring-1 focus:ring-ink ${
                          isSelected ? 'bg-white border-l-4 border-l-marker shadow-xs' : ''
                        }`}
                        aria-current={isSelected ? 'true' : undefined}
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

                        <p className="text-xs text-ink/85 line-clamp-2 leading-relaxed">
                          {previewText}
                          {clause.text.length > 110 && '…'}
                        </p>
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        )}

        {activeTab === 'risks' && (
          <div className="p-8 text-center my-auto flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-flag/10 text-flag flex items-center justify-center mb-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-sm font-semibold text-ink mb-1">Risk Review Engine</h2>
            <p className="text-xs text-ink-soft max-w-xs mb-3">
              Phase 2 will evaluate 14 Indian employment risk rules with verbatim clause citations.
            </p>
            <span className="text-[10px] font-mono text-ink-soft bg-rule/30 px-2 py-0.5 rounded">
              Ready in Phase 2
            </span>
          </div>
        )}

        {activeTab === 'missing' && (
          <div className="p-8 text-center my-auto flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-rule/50 text-ink flex items-center justify-center mb-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <h2 className="text-sm font-semibold text-ink mb-1">Missing Clause Rubric</h2>
            <p className="text-xs text-ink-soft max-w-xs mb-3">
              Phase 3 will audit this agreement against 20 standard Indian employment clauses.
            </p>
            <span className="text-[10px] font-mono text-ink-soft bg-rule/30 px-2 py-0.5 rounded">
              Ready in Phase 3
            </span>
          </div>
        )}

        {activeTab === 'ask' && (
          <div className="p-8 text-center my-auto flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-verified/10 text-verified flex items-center justify-center mb-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h2 className="text-sm font-semibold text-ink mb-1">Grounded Q&A</h2>
            <p className="text-xs text-ink-soft max-w-xs mb-3">
              Phase 2 will answer natural language questions about notice periods, non-competes, and bonds with verified quotes.
            </p>
            <span className="text-[10px] font-mono text-ink-soft bg-rule/30 px-2 py-0.5 rounded">
              Ready in Phase 2
            </span>
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
