"use client";

import React, { useEffect, useState, useRef, use } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useUploadContext } from '@/lib/upload-context';
import { Clause, Session } from '@/lib/types';
import { FindingsPane } from '@/components/FindingsPane';
import type { DocumentPaneHandle } from '@/components/DocumentPane';

// Dynamically import DocumentPane to prevent SSR execution of canvas/window
const DocumentPane = dynamic(() => import('@/components/DocumentPane'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center h-full bg-[#EAECE9] border-r border-rule p-8 text-ink-soft text-xs animate-pulse">
      <div className="w-8 h-8 rounded-full border-2 border-ink border-t-transparent animate-spin mb-3" />
      <span>Loading document viewer...</span>
    </div>
  ),
});

export default function ReviewPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const resolvedParams = use(params);
  const sessionId = resolvedParams.sessionId;
  const router = useRouter();
  const { file, setFile, clearFile } = useUploadContext();

  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(30 * 60);
  const [selectedClauseId, setSelectedClauseId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [mobileView, setMobileView] = useState<'document' | 'findings'>('findings');

  const documentPaneRef = useRef<DocumentPaneHandle>(null);

  // Fetch session data
  useEffect(() => {
    let isMounted = true;

    async function loadSession() {
      try {
        setLoading(true);
        const res = await fetch(`/api/session/${sessionId}`);
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error('This review has expired after 30 minutes, or does not exist.');
          }
          throw new Error('Failed to retrieve session data.');
        }

        const data: Session = await res.json();
        if (!isMounted) return;

        setSession(data);
        setLoading(false);

        // Compute remaining TTL
        const elapsed = Math.floor((Date.now() - data.createdAt) / 1000);
        const remaining = Math.max(0, 30 * 60 - elapsed);
        setRemainingSeconds(remaining);
      } catch (err) {
        if (!isMounted) return;
        setLoading(false);
        setError(err instanceof Error ? err.message : 'Error loading session.');
      }
    }

    loadSession();

    return () => {
      isMounted = false;
    };
  }, [sessionId]);

  // Session TTL countdown timer
  useEffect(() => {
    if (loading || !session) return;

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [loading, session]);

  // Format countdown mm:ss
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Delete session handler
  const handleDeleteSession = async () => {
    if (isDeleting) return;
    setIsDeleting(true);

    try {
      await fetch(`/api/session/${sessionId}`, { method: 'DELETE' });
      clearFile();
      router.push('/?deleted=true');
    } catch {
      clearFile();
      router.push('/');
    }
  };

  const handleSelectClause = (clauseId: string) => {
    setSelectedClauseId(clauseId);
    if (documentPaneRef.current) {
      documentPaneRef.current.highlightClause(clauseId);
    }
    // On mobile, switch to document view when clause is tapped
    if (window.innerWidth < 768) {
      setMobileView('document');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-paper text-ink">
        <div className="w-8 h-8 rounded-full border-2 border-ink border-t-transparent animate-spin mb-3" />
        <p className="text-sm font-medium">Opening agreement review...</p>
      </div>
    );
  }

  if (error || remainingSeconds === 0) {
    return (
      <main className="flex flex-col items-center justify-center min-h-screen bg-paper p-6 text-center">
        <div className="max-w-md p-8 bg-white border border-rule rounded-lg shadow-xs">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-marker/20 text-ink flex items-center justify-center font-bold">
            !
          </div>
          <h1 className="text-lg font-bold text-ink mb-2">Review Expired</h1>
          <p className="text-xs text-ink-soft leading-relaxed mb-6">
            {error ||
              'This review expired after 30 minutes, which is how we keep your contract private. Upload it again to continue.'}
          </p>
          <button
            type="button"
            onClick={() => {
              clearFile();
              router.push('/');
            }}
            className="px-4 py-2 bg-ink text-paper rounded text-xs font-semibold hover:bg-ink/90 transition cursor-pointer"
          >
            Upload Document Again
          </button>
        </div>
      </main>
    );
  }

  const clauses: Clause[] = session?.clauses || [];

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-paper text-ink">
      {/* Top Application Header */}
      <header className="flex items-center justify-between px-4 py-2.5 bg-paper border-b border-rule z-20">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push('/')}
            className="font-serif font-bold text-base tracking-tight text-ink hover:opacity-80 transition cursor-pointer"
          >
            Clause Radar
          </button>
          <span className="text-rule">|</span>
          <span
            className="text-xs text-ink-soft truncate max-w-[200px] sm:max-w-xs font-mono"
            title={session?.filename}
          >
            {session?.filename}
          </span>
        </div>

        {/* Mobile View Toggle Buttons */}
        <div className="flex md:hidden items-center bg-rule/30 rounded p-0.5 border border-rule">
          <button
            type="button"
            onClick={() => setMobileView('document')}
            className={`px-2.5 py-1 text-xs rounded font-medium transition ${
              mobileView === 'document' ? 'bg-white shadow-xs text-ink' : 'text-ink-soft'
            }`}
          >
            Document
          </button>
          <button
            type="button"
            onClick={() => setMobileView('findings')}
            className={`px-2.5 py-1 text-xs rounded font-medium transition ${
              mobileView === 'findings' ? 'bg-white shadow-xs text-ink' : 'text-ink-soft'
            }`}
          >
            Findings
          </button>
        </div>

        <div className="flex items-center gap-4 text-xs">
          {/* 30-min TTL Live Countdown */}
          <div
            className={`flex items-center gap-1.5 font-mono text-xs px-2.5 py-1 rounded border ${
              remainingSeconds < 300
                ? 'bg-red-50 text-flag border-red-200 animate-pulse'
                : 'bg-white text-ink-soft border-rule'
            }`}
            title="Session automatically purges after 30 minutes for privacy"
          >
            <span className="inline-block w-2 h-2 rounded-full bg-verified" />
            <span>expires in {formatTimer(remainingSeconds)}</span>
          </div>

          {/* Delete Now Button */}
          <button
            type="button"
            onClick={handleDeleteSession}
            disabled={isDeleting}
            className="px-2.5 py-1 bg-white hover:bg-red-50 border border-rule hover:border-red-200 text-ink-soft hover:text-flag rounded transition-colors text-xs font-medium cursor-pointer"
            title="Immediately purge all extracted text from server"
          >
            {isDeleting ? 'Deleting...' : 'Delete now'}
          </button>
        </div>
      </header>

      {/* Main Two-Pane Workplace Layout */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Left Pane: PDF Document Viewer */}
        <section
          aria-label="PDF Document Viewer"
          className={`h-full w-full md:w-1/2 flex-1 ${
            mobileView === 'document' ? 'block' : 'hidden md:block'
          }`}
        >
          <DocumentPane
            ref={documentPaneRef}
            file={file}
            clauses={clauses}
            highlightedClauseId={selectedClauseId}
            onClauseSelect={handleSelectClause}
            onFileChange={(newFile) => setFile(newFile)}
          />
        </section>

        {/* Right Pane: Findings and Clause Navigator */}
        <section
          aria-label="Findings and Clauses"
          className={`h-full w-full md:w-1/2 flex-1 ${
            mobileView === 'findings' ? 'block' : 'hidden md:block'
          }`}
        >
          <FindingsPane
            sessionId={sessionId}
            clauses={clauses}
            selectedClauseId={selectedClauseId}
            onSelectClause={handleSelectClause}
          />
        </section>
      </main>
    </div>
  );
}
