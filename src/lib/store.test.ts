import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createSession, getSession, deleteSession, clearAllSessions } from './store';
import { RawFields, VerifiedFields } from './types';

const emptyFields: VerifiedFields = {
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

describe('SessionStore', () => {
  beforeEach(() => {
    clearAllSessions();
    vi.useRealTimers();
  });

  it('creates a session and retrieves it', () => {
    const id = createSession({
      filename: 'sample.pdf',
      pageCount: 3,
      clauses: [],
      vectors: [],
      fields: emptyFields,
      rubric: [],
      findings: [],
      concerns: [],
    });

    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    const session = getSession(id);
    expect(session).not.toBeNull();
    expect(session?.filename).toBe('sample.pdf');
    expect(session?.pageCount).toBe(3);
  });

  it('deletes a session', () => {
    const id = createSession({
      filename: 'sample.pdf',
      pageCount: 3,
      clauses: [],
      vectors: [],
      fields: emptyFields,
      rubric: [],
      findings: [],
      concerns: [],
    });

    expect(deleteSession(id)).toBe(true);
    expect(getSession(id)).toBeNull();
  });

  it('expires session after 30 minutes', () => {
    vi.useFakeTimers();
    const startTime = 1000000;
    vi.setSystemTime(startTime);

    const id = createSession({
      filename: 'sample.pdf',
      pageCount: 3,
      clauses: [],
      vectors: [],
      fields: emptyFields,
      rubric: [],
      findings: [],
      concerns: [],
    });

    expect(getSession(id)).not.toBeNull();

    // Advance 31 minutes
    vi.setSystemTime(startTime + 31 * 60 * 1000);
    expect(getSession(id)).toBeNull();
  });
});
