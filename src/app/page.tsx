"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUploadContext } from '@/lib/upload-context';

function UploadContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setFile, clearFile } = useUploadContext();

  const [dragActive, setDragActive] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const deletedNotice = searchParams.get('deleted') === 'true';

  useEffect(() => {
    if (deletedNotice) {
      clearFile();
    }
  }, [deletedNotice, clearFile]);

  const handleUpload = async (selectedFile: File) => {
    setErrorMessage(null);

    // Client-side quick validation
    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.toLowerCase().endsWith('.pdf')) {
      setErrorMessage("This doesn't look like a PDF file. Please upload the PDF version of your agreement.");
      return;
    }

    if (selectedFile.size > 15 * 1024 * 1024) {
      setErrorMessage("This file is over 15 MB. Employment agreements are usually smaller — check if you have a compressed version.");
      return;
    }

    try {
      setLoadingStep('Uploading document...');
      const formData = new FormData();
      formData.append('file', selectedFile);

      setLoadingStep('Reading pages & extracting clauses...');
      const response = await fetch('/api/ingest', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.message || 'We could not read this PDF. Please check the file and try again.');
        setLoadingStep(null);
        return;
      }

      // Store file in memory for rendered canvas viewer
      setFile(selectedFile);
      setLoadingStep('Opening review workspace...');

      router.push(`/review/${data.sessionId}`);
    } catch {
      setErrorMessage('Network error while processing file. Please check your connection and try again.');
      setLoadingStep(null);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <main className="min-h-screen bg-paper flex flex-col justify-between p-6 sm:p-12 text-ink">
      {/* Header */}
      <header className="max-w-4xl mx-auto w-full flex items-center justify-between py-2 border-b border-rule/70">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-marker" />
          <h1 className="font-serif font-bold text-lg tracking-tight">Clause Radar</h1>
        </div>
        <span className="text-xs text-ink-soft font-mono">v1.0 Spine</span>
      </header>

      {/* Hero & Upload Zone */}
      <div className="max-w-xl mx-auto w-full my-auto py-10 flex flex-col items-center">
        {deletedNotice && (
          <div
            role="status"
            className="w-full mb-6 p-3 bg-white border border-verified/40 text-verified rounded text-xs flex items-center gap-2 shadow-xs"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>Deleted. The extracted text is gone from the server.</span>
          </div>
        )}

        {errorMessage && (
          <div
            role="alert"
            className="w-full mb-6 p-4 bg-red-50 border border-red-200 text-red-900 rounded text-xs leading-relaxed shadow-xs"
          >
            <p className="font-semibold mb-1">Cannot process document</p>
            <p>{errorMessage}</p>
          </div>
        )}

        <div className="text-center mb-8">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-ink mb-3">
            Read your employment agreement with clarity.
          </h2>
          <p className="text-sm text-ink-soft max-w-md mx-auto leading-relaxed">
            Drop in your Indian employment agreement to inspect every clause, verify citations, and catch missing protections.
          </p>
        </div>

        {/* Drag & Drop Card */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`w-full p-8 sm:p-10 border-2 border-dashed rounded-xl bg-white text-center transition-all cursor-pointer shadow-xs ${
            dragActive
              ? 'border-ink bg-marker/10 scale-[1.01]'
              : 'border-rule hover:border-ink-soft/60'
          }`}
        >
          {loadingStep ? (
            <div className="flex flex-col items-center justify-center py-6 gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-ink border-t-transparent animate-spin" />
              <p className="text-xs font-semibold text-ink font-mono">{loadingStep}</p>
              <p className="text-[11px] text-ink-soft">Processing in-memory only</p>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center cursor-pointer">
              <div className="w-12 h-12 rounded-full bg-paper border border-rule flex items-center justify-center mb-3 text-ink-soft">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>

              <span className="text-sm font-semibold text-ink mb-1">
                Click to upload or drag &amp; drop PDF
              </span>
              <span className="text-xs text-ink-soft mb-4 font-mono">PDF documents up to 15 MB</span>

              <span className="px-4 py-2 bg-ink text-paper rounded text-xs font-semibold hover:bg-ink/90 transition shadow-xs">
                Select Agreement PDF
              </span>

              <input
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleUpload(e.target.files[0]);
                  }
                }}
              />
            </label>
          )}
        </div>

        {/* Privacy Callout */}
        <div className="mt-6 flex items-center gap-2 text-center text-[12px] text-ink-soft">
          <svg className="w-4 h-4 shrink-0 text-verified" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span>
            Your contract is processed in memory and deleted after 30 minutes. It is never written to a database.
          </span>
        </div>
      </div>

      {/* Footer */}
      <footer className="max-w-4xl mx-auto w-full text-center py-4 border-t border-rule/70 text-xs text-ink-soft flex flex-col sm:flex-row items-center justify-between gap-2">
        <span>Clause Radar helps you understand your document. It is not legal advice.</span>
        <span className="font-mono text-[11px]">Strict Verification &bull; In-Memory TTL</span>
      </footer>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-paper" />}>
      <UploadContent />
    </Suspense>
  );
}
