import { describe, it, expect } from 'vitest';
import {
  verifyClaim,
  verifyAnswerEnvelope,
  verifyExtractedFields,
  normalizeText,
  extractNumbers,
} from './verify';
import { Clause, Claim, AnswerEnvelope, RawFields } from './types';

const mockClauses: Clause[] = [
  {
    id: 'c_001',
    ordinal: 0,
    number: '8.1',
    headingPath: ['8. TERMINATION', '8.1 Notice'],
    text: 'Either party may terminate this agreement by giving sixty (60) days written notice to the other party.',
    page: 1,
    charStart: 0,
    charEnd: 104,
    anchor: 'Either party may terminate this agreement by giving sixty (6',
  },
  {
    id: 'c_002',
    ordinal: 1,
    number: '11.3',
    headingPath: ['11. COMMITMENT', '11.3 Training Bond'],
    text: 'The Employee agrees to serve the Company for a minimum period of 24 months, failing which liquidated damages of 150000 INR shall be payable.',
    page: 2,
    charStart: 105,
    charEnd: 247,
    anchor: 'The Employee agrees to serve the Company for a minimum perio',
  },
];

describe('Grounding Verifier (lib/verify.ts)', () => {
  describe('Text normalization & Number extraction', () => {
    it('normalizes whitespace and case', () => {
      expect(normalizeText('  Sixty (60)  \n DAYS\t')).toBe('sixty (60) days');
    });

    it('extracts digits and word equivalents', () => {
      const numbers = extractNumbers('Notice is sixty (60) days or 2 months');
      expect(numbers.has(60)).toBe(true);
      expect(numbers.has(2)).toBe(true);
    });
  });

  describe('Check 1: Clause Existence', () => {
    it('discards claim citing non-existent clauseId', () => {
      const claim: Claim = {
        text: 'The notice period is 60 days.',
        evidence: [
          {
            clauseId: 'c_999',
            quote: 'giving sixty (60) days written notice',
            page: 1,
          },
        ],
        confidence: 0.9,
      };

      const result = verifyClaim(claim, mockClauses);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('does not exist');
    });
  });

  describe('Check 2: Quote Fidelity', () => {
    it('discards claim with hallucinated quote not present in clause', () => {
      const claim: Claim = {
        text: 'The notice period is 60 days.',
        evidence: [
          {
            clauseId: 'c_001',
            quote: 'employee must give ninety days advance warning',
            page: 1,
          },
        ],
        confidence: 0.9,
      };

      const result = verifyClaim(claim, mockClauses);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('not a verbatim substring');
    });

    it('accepts claim with quote that differs only by whitespace or capitalization', () => {
      const claim: Claim = {
        text: 'The notice period is 60 days.',
        evidence: [
          {
            clauseId: 'c_001',
            quote: '  GIVING   SIXTY (60) DAYS WRITTEN NOTICE  ',
            page: 1,
          },
        ],
        confidence: 0.9,
      };

      const result = verifyClaim(claim, mockClauses);
      expect(result.valid).toBe(true);
    });

    it('discards trivially short quotes under 8 characters', () => {
      const claim: Claim = {
        text: 'The notice period is 60 days.',
        evidence: [
          {
            clauseId: 'c_001',
            quote: 'notice',
            page: 1,
          },
        ],
        confidence: 0.9,
      };

      const result = verifyClaim(claim, mockClauses);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('too short');
    });
  });

  describe('Check 3: Number Containment', () => {
    it('discards claim when claim says 90 days but cited clause says 60 days', () => {
      const claim: Claim = {
        text: 'The required notice period for termination is 90 days.',
        evidence: [
          {
            clauseId: 'c_001',
            quote: 'giving sixty (60) days written notice',
            page: 1,
          },
        ],
        confidence: 0.9,
      };

      const result = verifyClaim(claim, mockClauses);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('number 90 which is absent');
    });

    it('accepts claim with word equivalent: claim says "sixty days", clause has "60"', () => {
      const claim: Claim = {
        text: 'The required notice period is sixty days.',
        evidence: [
          {
            clauseId: 'c_001',
            quote: 'giving sixty (60) days written notice',
            page: 1,
          },
        ],
        confidence: 0.95,
      };

      const result = verifyClaim(claim, mockClauses);
      expect(result.valid).toBe(true);
    });
  });

  describe('Check 4: Confidence Floor', () => {
    it('discards claim with confidence below 0.55', () => {
      const claim: Claim = {
        text: 'The notice period is 60 days.',
        evidence: [
          {
            clauseId: 'c_001',
            quote: 'giving sixty (60) days written notice',
            page: 1,
          },
        ],
        confidence: 0.45,
      };

      const result = verifyClaim(claim, mockClauses);
      expect(result.valid).toBe(false);
      expect(result.reason).toContain('below threshold');
    });
  });

  describe('Check 5: Aggregate AnswerEnvelope Verification', () => {
    it('retains valid claims and records discardedCount', () => {
      const envelope: AnswerEnvelope = {
        status: 'answered',
        claims: [
          {
            text: 'The notice period is 60 days.',
            evidence: [{ clauseId: 'c_001', quote: 'giving sixty (60) days written notice', page: 1 }],
            confidence: 0.9,
          },
          {
            text: 'The bond penalty is 500000 INR.', // 500000 not in clause (clause says 150000)
            evidence: [{ clauseId: 'c_002', quote: 'liquidated damages of 150000 INR', page: 2 }],
            confidence: 0.9,
          },
        ],
        nearestClauseIds: ['c_001'],
        clarifyWithProfessional: [],
        discardedCount: 0,
      };

      const verified = verifyAnswerEnvelope(envelope, mockClauses);
      expect(verified.status).toBe('answered');
      expect(verified.claims.length).toBe(1);
      expect(verified.claims[0].text).toBe('The notice period is 60 days.');
      expect(verified.discardedCount).toBe(1);
    });

    it('converts to insufficient_evidence when all candidate claims fail verification', () => {
      const envelope: AnswerEnvelope = {
        status: 'answered',
        claims: [
          {
            text: 'The equity cliff is 1 year.',
            evidence: [{ clauseId: 'c_999', quote: 'cliff of 1 year', page: 1 }],
            confidence: 0.9,
          },
        ],
        nearestClauseIds: ['c_001', 'c_002'],
        clarifyWithProfessional: ['Ask HR if an ESOP policy exists.'],
        discardedCount: 0,
      };

      const verified = verifyAnswerEnvelope(envelope, mockClauses);
      expect(verified.status).toBe('insufficient_evidence');
      expect(verified.claims.length).toBe(0);
      expect(verified.discardedCount).toBe(1);
      expect(verified.nearestClauseIds).toEqual(['c_001', 'c_002']);
      expect(verified.clarifyWithProfessional).toContain('Ask HR if an ESOP policy exists.');
    });
  });

  describe('Extracted Fields Verification', () => {
    it('verifies RawFields and records discarded invalid fields', () => {
      const initialFields: RawFields = {
        noticePeriodEmployee: {
          value: 60,
          evidence: { clauseId: 'c_001', quote: 'giving sixty (60) days written notice', page: 1 },
          confidence: 0.95,
        },
        noticePeriodEmployer: {
          value: 90, // Mismatched value
          evidence: { clauseId: 'c_001', quote: 'giving sixty (60) days written notice', page: 1 },
          confidence: 0.95,
        },
        probationMonths: { value: null, evidence: null, confidence: 0 },
        bondPresent: {
          value: true,
          evidence: { clauseId: 'c_002', quote: 'serve the Company for a minimum period of 24 months', page: 2 },
          confidence: 0.9,
        },
        bondDurationMonths: {
          value: 24,
          evidence: { clauseId: 'c_002', quote: 'minimum period of 24 months', page: 2 },
          confidence: 0.9,
        },
        bondPenaltyAmount: {
          value: 150000,
          evidence: { clauseId: 'c_002', quote: 'liquidated damages of 150000 INR', page: 2 },
          confidence: 0.9,
        },
        nonCompeteMonths: { value: null, evidence: null, confidence: 0 },
        nonSolicitMonths: { value: null, evidence: null, confidence: 0 },
        confidentialityYears: { value: null, evidence: null, confidence: 0 },
        severancePresent: { value: null, evidence: null, confidence: 0 },
        paymentInLieuOfNotice: { value: null, evidence: null, confidence: 0 },
        variablePayForfeitOnExit: { value: null, evidence: null, confidence: 0 },
        ipAssignmentPresent: { value: null, evidence: null, confidence: 0 },
        priorInventionsCarveOut: { value: null, evidence: null, confidence: 0 },
        moonlightingRestricted: { value: null, evidence: null, confidence: 0 },
        unilateralAmendment: { value: null, evidence: null, confidence: 0 },
        indemnityUncapped: { value: null, evidence: null, confidence: 0 },
        arbitrationSeat: { value: null, evidence: null, confidence: 0 },
        governingLawState: { value: null, evidence: null, confidence: 0 },
        terminationWithoutNoticeByEmployer: { value: null, evidence: null, confidence: 0 },
      };

      const verified = verifyExtractedFields(initialFields, mockClauses);
      expect(verified.noticePeriodEmployee.value).toBe(60);
      expect(verified.bondDurationMonths.value).toBe(24);
      // noticePeriodEmployer failed number containment
      expect(verified.noticePeriodEmployer.value).toBeNull();
      expect(verified.__verification.discarded).toContain('noticePeriodEmployer');
      expect(verified.__verification.checked).toBe(20);
    });
  });
});
