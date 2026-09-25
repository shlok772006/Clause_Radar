"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Concern, Finding } from '@/lib/types';

export interface TakeActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  selectedConcerns: Concern[];
  findings: Finding[];
}

export function TakeActionModal({
  isOpen,
  onClose,
  sessionId,
  selectedConcerns,
  findings,
}: TakeActionModalProps) {
  const [activeTab, setActiveTab] = useState<'email' | 'questions'>('email');
  const [emailText, setEmailText] = useState<string>('');
  const [loadingEmail, setLoadingEmail] = useState<boolean>(false);
  const [questions, setQuestions] = useState<string[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Load negotiation email
  const fetchEmail = useCallback(async () => {
    if (emailText) return;
    setLoadingEmail(true);
    setError(null);
    try {
      const res = await fetch('/api/act', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          type: 'email',
          selectedConcerns,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to generate email');
      setEmailText(data.content);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error generating email');
    } finally {
      setLoadingEmail(false);
    }
  }, [sessionId, selectedConcerns, emailText]);

  // Load lawyer questions
  const fetchQuestions = useCallback(async () => {
    if (questions.length > 0) return;
    setLoadingQuestions(true);
    setError(null);
    try {
      const res = await fetch('/api/act', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          type: 'questions',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to generate questions');
      setQuestions(Array.isArray(data.content) ? data.content : [data.content]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error generating questions');
    } finally {
      setLoadingQuestions(false);
    }
  }, [sessionId, questions.length]);

  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      if (activeTab === 'email') {
        fetchEmail();
      } else {
        fetchQuestions();
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [isOpen, activeTab, fetchEmail, fetchQuestions]);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="bg-paper border border-rule rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-rule bg-white">
          <div>
            <h2 id="modal-title" className="text-base font-bold text-ink">
              Take Action on this Agreement
            </h2>
            <p className="text-xs text-ink-soft">
              Derived from {findings.length} findings identified in your document.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1 rounded text-ink-soft hover:text-ink hover:bg-paper transition cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Action Tabs */}
        <div className="flex border-b border-rule bg-paper px-4 pt-2 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('email')}
            className={`px-3 py-2 text-xs font-semibold border-b-2 transition cursor-pointer ${
              activeTab === 'email'
                ? 'border-ink text-ink bg-white rounded-t'
                : 'border-transparent text-ink-soft hover:text-ink'
            }`}
          >
            HR Negotiation Email
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('questions')}
            className={`px-3 py-2 text-xs font-semibold border-b-2 transition cursor-pointer ${
              activeTab === 'questions'
                ? 'border-ink text-ink bg-white rounded-t'
                : 'border-transparent text-ink-soft hover:text-ink'
            }`}
          >
            Questions for Lawyer / HR
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto flex-1 bg-white space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-900 rounded text-xs">
              {error}
            </div>
          )}

          {activeTab === 'email' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-ink-soft font-mono">
                  Polite & professional · References clauses · Under 200 words
                </span>
                <span className="text-[11px] text-ink-soft">Editable</span>
              </div>

              {loadingEmail ? (
                <div className="flex flex-col items-center justify-center p-12 text-ink-soft text-xs space-y-2">
                  <div className="w-6 h-6 rounded-full border-2 border-ink border-t-transparent animate-spin" />
                  <span>Drafting candidate email citing clauses...</span>
                </div>
              ) : (
                <textarea
                  value={emailText}
                  onChange={(e) => setEmailText(e.target.value)}
                  rows={10}
                  className="w-full p-3 text-xs text-ink bg-paper border border-rule rounded-lg focus:outline-none focus:border-ink font-sans leading-relaxed resize-y"
                  aria-label="Candidate negotiation email text"
                />
              )}
            </div>
          )}

          {activeTab === 'questions' && (
            <div className="space-y-3">
              <div className="text-xs text-ink-soft font-mono">
                5 specific questions referencing agreement terms for consultation:
              </div>

              {loadingQuestions ? (
                <div className="flex flex-col items-center justify-center p-12 text-ink-soft text-xs space-y-2">
                  <div className="w-6 h-6 rounded-full border-2 border-ink border-t-transparent animate-spin" />
                  <span>Preparing specific questions for lawyer...</span>
                </div>
              ) : (
                <ol className="space-y-2.5">
                  {questions.map((q, idx) => (
                    <li
                      key={idx}
                      className="p-3 bg-paper border border-rule/80 rounded-lg text-xs text-ink leading-relaxed flex items-start gap-2.5"
                    >
                      <span className="font-mono font-bold text-ink shrink-0 text-[11px] w-5 h-5 rounded-full bg-white border border-rule flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <p className="flex-1">{q}</p>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3 border-t border-rule bg-paper flex items-center justify-between">
          <span className="text-[11px] text-ink-soft">
            {copied ? '✓ Copied to clipboard!' : 'Clause Radar assistance · Not legal advice'}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-white border border-rule hover:bg-paper text-xs text-ink rounded transition cursor-pointer"
            >
              Done
            </button>
            <button
              type="button"
              onClick={() => {
                if (activeTab === 'email') {
                  handleCopy(emailText);
                } else {
                  handleCopy(questions.map((q, i) => `${i + 1}. ${q}`).join('\n\n'));
                }
              }}
              className="px-3 py-1.5 bg-ink hover:bg-ink/90 text-paper text-xs font-semibold rounded transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              <span>{copied ? 'Copied!' : activeTab === 'email' ? 'Copy Email' : 'Copy Questions'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TakeActionModal;
