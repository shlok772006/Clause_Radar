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
}: FindingsPaneProps) {
  const [activeTab, setActiveTab] = useState<TabType>('clauses');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConcerns, setSelectedConcerns] = useState<Concern[]>(['exit', 'pay']);

  const handleToggleConcern = (concern: Concern) => {
    setSelectedConcerns((prev) =>
      prev.includes(concern) ? prev.filter((c) => c !== concern) : [...prev, concern]
    );
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
          {findings.length > 0 ? (
            <span className="text-[10px] bg-red-50 text-flag px-1.5 py-0.5 rounded-full border border-red-200 font-mono font-bold">
              {findings.length}
            </span>
          ) : (
            <span className="w-1.5 h-1.5 rounded-full bg-rule" />
          )}
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
          <RiskDashboard
            findings={findings}
            selectedConcerns={selectedConcerns}
            onHighlightClause={onSelectClause}
          />
        )}

        {activeTab === 'missing' && (
          <MissingReport
            rubricResults={rubric}
            rubricItems={rubricItems}
            selectedConcerns={selectedConcerns}
            onHighlightClause={onSelectClause}
          />
        )}

        {activeTab === 'ask' && (
          <AskPanel
            sessionId={sessionId}
            clauses={clauses}
            onHighlightClause={onSelectClause}
          />
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
