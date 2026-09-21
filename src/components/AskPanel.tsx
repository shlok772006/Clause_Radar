"use client";

import React, { useState } from 'react';
import { Clause, AnswerEnvelope } from '@/lib/types';
import { ClaimCard } from './ClaimCard';
import { RefusalCard } from './RefusalCard';

export interface AskPanelProps {
  sessionId: string;
  clauses: Clause[];
  onHighlightClause: (clauseId: string) => void;
}

interface QARecord {
  question: string;
  envelope: AnswerEnvelope;
  timestamp: number;
}

const STARTER_QUESTIONS = [
  'What is my notice period?',
  'Is there an employment bond or penalty?',
  'What are the non-compete and moonlighting restrictions?',
  'Who owns inventions and intellectual property?',
];

export function AskPanel({ sessionId, clauses, onHighlightClause }: AskPanelProps) {
  const [question, setQuestion] = useState('');
  const [history, setHistory] = useState<QARecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (queryText: string) => {
    const q = queryText.trim();
    if (!q || loading) return;

    setError(null);
    setLoading(true);
    setLoadingStep('Scanning agreement clauses...');

    const stepTimer = setTimeout(() => {
      setLoadingStep('Verifying quotes and number containment...');
    }, 900);

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, question: q }),
      });

      clearTimeout(stepTimer);

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to analyze question');
      }

      const envelope: AnswerEnvelope = await res.json();

      setHistory((prev) => [
        { question: q, envelope, timestamp: Date.now() },
        ...prev,
      ]);
      setQuestion('');
    } catch (err) {
      clearTimeout(stepTimer);
      setError(err instanceof Error ? err.message : 'Error processing question.');
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-paper select-text">
      {/* Search / Ask Input Bar */}
      <div className="p-4 border-b border-rule bg-white sticky top-0 z-10">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSubmit(question);
          }}
          className="flex items-center gap-2"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask anything about your agreement..."
              disabled={loading}
              className="w-full pl-3 pr-8 py-2 bg-paper border border-rule rounded-lg text-xs text-ink placeholder:text-ink-soft/60 focus:outline-none focus:border-ink focus:bg-white transition"
              aria-label="Ask agreement question"
            />
            {question && (
              <button
                type="button"
                onClick={() => setQuestion('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="px-3.5 py-2 bg-ink text-paper rounded-lg text-xs font-semibold hover:bg-ink/90 disabled:opacity-40 transition cursor-pointer shrink-0"
          >
            {loading ? 'Asking...' : 'Ask'}
          </button>
        </form>

        {/* Loading Indicator */}
        {loading && (
          <div className="mt-2 flex items-center gap-2 text-[11px] text-ink font-mono animate-pulse">
            <div className="w-3 h-3 rounded-full border border-ink border-t-transparent animate-spin" />
            <span>{loadingStep}</span>
          </div>
        )}

        {/* Error alert */}
        {error && (
          <div className="mt-2.5 p-2.5 bg-red-50 border border-red-200 text-red-900 rounded text-xs">
            {error}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Starter Chips on Empty State */}
        {history.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-10 h-10 rounded-full bg-marker/20 text-ink flex items-center justify-center mb-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-ink mb-1">
              Grounded Agreement Q&amp;A
            </h3>
            <p className="text-xs text-ink-soft max-w-sm mb-4 leading-relaxed">
              Every answer is verified against the text. If a clause does not state an answer, Clause Radar refuses to guess.
            </p>

            <div className="text-[11px] font-semibold text-ink-soft uppercase tracking-wider mb-2">
              Common Questions to Ask
            </div>
            <div className="flex flex-wrap justify-center gap-2 max-w-md">
              {STARTER_QUESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => handleSubmit(q)}
                  className="px-3 py-1.5 bg-white hover:bg-marker/20 border border-rule hover:border-marker rounded-full text-xs text-ink transition cursor-pointer text-left shadow-2xs"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Question History Stream */}
        {history.map((record, index) => {
          const envelope = record.envelope;

          return (
            <div key={`${record.timestamp}-${index}`} className="space-y-3">
              {/* Question Bubble */}
              <div className="flex items-start gap-2 bg-white/70 border border-rule/70 rounded-lg p-3">
                <span className="w-5 h-5 rounded-full bg-ink text-paper flex items-center justify-center text-[10px] font-mono shrink-0 font-bold">
                  Q
                </span>
                <div className="flex-1 text-xs font-semibold text-ink">
                  {record.question}
                </div>
                {envelope.discardedCount > 0 && (
                  <span
                    className="text-[10px] font-mono px-1.5 py-0.5 bg-red-50 text-flag border border-red-200 rounded shrink-0"
                    title="Claims that failed verification were discarded"
                  >
                    {envelope.discardedCount} discarded
                  </span>
                )}
              </div>

              {/* Answer Presentation */}
              {envelope.status === 'answered' && envelope.claims.length > 0 ? (
                <div className="space-y-3">
                  {envelope.claims.map((claim, cIdx) => (
                    <ClaimCard
                      key={cIdx}
                      claim={claim}
                      onHighlightClause={onHighlightClause}
                    />
                  ))}
                </div>
              ) : (
                <RefusalCard
                  status={envelope.status === 'out_of_scope' ? 'out_of_scope' : 'insufficient_evidence'}
                  nearestClauseIds={envelope.nearestClauseIds}
                  clarifyWithProfessional={envelope.clarifyWithProfessional}
                  clauses={clauses}
                  onHighlightClause={onHighlightClause}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default AskPanel;
