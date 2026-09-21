import { NextRequest, NextResponse } from 'next/server';
import { parsePdf, PdfProcessingError, PdfError } from '@/lib/pdf';
import { segmentClauses } from '@/lib/segment';
import { createSession } from '@/lib/store';
import { VerifiedFields } from '@/lib/types';

// Rate limiting: 5 uploads per hour per IP
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60 * 60 * 1000 });
    return false;
  }
  if (entry.count >= 5) {
    return true;
  }
  entry.count++;
  return false;
}

const ERROR_MESSAGES: Record<PdfError['type'], string> = {
  not_pdf: "This doesn't look like a PDF file. Please upload the PDF version of your agreement.",
  too_large: "This file is over 15 MB. Employment agreements are usually smaller — check if you have a compressed version.",
  too_many_pages: "This document is over 60 pages. Clause Radar is designed for standard employment agreements.",
  scan_detected: "This looks like a scanned image, so there's no text to read. If you have the original PDF from HR, that will work.",
  parse_failed: "We couldn't read this PDF. It may be corrupted or password-protected.",
  timeout: "This document is taking too long to process. Try a smaller file.",
};

const initialEmptyFields: VerifiedFields = {
  noticePeriodEmployee: { value: null, confidence: 0, evidence: null },
  noticePeriodEmployer: { value: null, confidence: 0, evidence: null },
  probationMonths: { value: null, confidence: 0, evidence: null },
  bondPresent: { value: null, confidence: 0, evidence: null },
  bondDurationMonths: { value: null, confidence: 0, evidence: null },
  bondPenaltyAmount: { value: null, confidence: 0, evidence: null },
  nonCompeteMonths: { value: null, confidence: 0, evidence: null },
  nonSolicitMonths: { value: null, confidence: 0, evidence: null },
  confidentialityYears: { value: null, confidence: 0, evidence: null },
  severancePresent: { value: null, confidence: 0, evidence: null },
  paymentInLieuOfNotice: { value: null, confidence: 0, evidence: null },
  variablePayForfeitOnExit: { value: null, confidence: 0, evidence: null },
  ipAssignmentPresent: { value: null, confidence: 0, evidence: null },
  priorInventionsCarveOut: { value: null, confidence: 0, evidence: null },
  moonlightingRestricted: { value: null, confidence: 0, evidence: null },
  unilateralAmendment: { value: null, confidence: 0, evidence: null },
  indemnityUncapped: { value: null, confidence: 0, evidence: null },
  arbitrationSeat: { value: null, confidence: 0, evidence: null },
  governingLawState: { value: null, confidence: 0, evidence: null },
  terminationWithoutNoticeByEmployer: { value: null, confidence: 0, evidence: null },
  __verification: {
    checked: 0,
    discarded: [],
    method: 'model+verifier',
  },
};

export async function POST(req: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';

  if (isRateLimited(clientIp)) {
    return NextResponse.json(
      {
        error: 'rate_limited',
        message: 'Upload limit reached (maximum 5 uploads per hour). Please try again later.',
      },
      { status: 429 }
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { error: 'invalid_request', message: 'Unable to parse file upload form data.' },
      { status: 400 }
    );
  }

  const file = formData.get('file');
  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { error: 'missing_file', message: 'Please provide a valid PDF file.' },
      { status: 400 }
    );
  }

  const filename = file.name || 'document.pdf';

  try {
    const arrayBuffer = await file.arrayBuffer();
    const parseResult = await parsePdf(arrayBuffer);
    const clauses = segmentClauses(parseResult.text, parseResult.pageBreaks);

    const sessionId = createSession({
      filename,
      pageCount: parseResult.pageCount,
      clauses,
      vectors: [],
      fields: initialEmptyFields,
      rubric: [],
      findings: [],
      concerns: [],
    });

    const elapsedMs = Date.now() - startTime;
    // Log ONLY IDs, counts, timings per AGENTS.md rule 8
    console.info(`[ingest] sessionId=${sessionId} pages=${parseResult.pageCount} clauses=${clauses.length} elapsedMs=${elapsedMs}`);

    return NextResponse.json({
      sessionId,
      filename,
      pageCount: parseResult.pageCount,
      clauseCount: clauses.length,
      clauses,
    });
  } catch (err) {
    if (err instanceof PdfProcessingError) {
      const message = ERROR_MESSAGES[err.error.type] || 'Failed to process PDF.';
      return NextResponse.json(
        { error: err.error.type, message },
        { status: 400 }
      );
    }

    const message = err instanceof Error ? err.message : 'An unexpected error occurred processing the file.';
    return NextResponse.json(
      { error: 'parse_failed', message },
      { status: 500 }
    );
  }
}
