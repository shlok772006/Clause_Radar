import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { parsePdf } from '@/lib/pdf';
import { segmentClauses } from '@/lib/segment';
import { matchRubric, loadPrecomputedVectors } from '@/lib/rubric';
import { RUBRIC_ITEMS } from '@/lib/rubric-data';
import { evaluateRules } from '@/lib/rules';
import { VerifiedFields } from '@/lib/types';

describe('Rubric and Rules End-to-End Evaluation Test', () => {
  it('evaluates test-agreement.pdf and finds expected present/missing items and rules', async () => {
    const fixturePath = path.resolve('eval/fixtures/test-agreement.pdf');
    expect(fs.existsSync(fixturePath)).toBe(true);

    const buffer = fs.readFileSync(fixturePath);
    const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);

    const parseResult = await parsePdf(arrayBuffer);
    const clauses = segmentClauses(parseResult.text, parseResult.pageBreaks);
    expect(clauses.length).toBeGreaterThan(5);

    // 1. Rubric matching
    const precomputed = loadPrecomputedVectors();
    const rubricResults = matchRubric(clauses, RUBRIC_ITEMS, precomputed);
    expect(rubricResults.length).toBe(20);

    // Verify key present items in test-agreement
    const noticeEmployee = rubricResults.find((r) => r.itemId === 'notice_employee');
    expect(noticeEmployee).toBeDefined();
    expect(noticeEmployee?.presence).toBe('present');
    expect(noticeEmployee?.bestClauseId).toBeTruthy();

    const bondItem = rubricResults.find((r) => r.itemId === 'bond');
    expect(bondItem).toBeDefined();
    expect(bondItem?.presence).toBe('present');

    // 2. Risk rules evaluation
    const mockVerifiedFields: VerifiedFields = {
      noticePeriodEmployee: {
        value: 60,
        evidence: { clauseId: noticeEmployee!.bestClauseId!, quote: 'sixty (60) days', page: 1 },
        confidence: 0.95,
      },
      noticePeriodEmployer: {
        value: 30,
        evidence: { clauseId: 'c_001', quote: 'thirty (30) days', page: 1 },
        confidence: 0.9,
      },
      probationMonths: { value: null, confidence: 0, evidence: null },
      bondPresent: {
        value: true,
        evidence: { clauseId: bondItem!.bestClauseId!, quote: 'service bond', page: 2 },
        confidence: 0.9,
      },
      bondDurationMonths: {
        value: 24,
        evidence: { clauseId: bondItem!.bestClauseId!, quote: '24 months', page: 2 },
        confidence: 0.9,
      },
      bondPenaltyAmount: {
        value: 150000,
        evidence: { clauseId: bondItem!.bestClauseId!, quote: '150000 INR', page: 2 },
        confidence: 0.9,
      },
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
      __verification: { checked: 20, discarded: [], method: 'model+verifier' },
    };

    const findings = evaluateRules(mockVerifiedFields, clauses);
    expect(findings.length).toBeGreaterThanOrEqual(2);

    // Verify asymmetric notice fired
    const asym = findings.find((f) => f.id === 'asymmetric_notice');
    expect(asym).toBeDefined();
    expect(asym?.severity).toBe('high');
    expect(asym?.evidence.length).toBeGreaterThan(0);

    // Verify bond penalty fired
    const bondFinding = findings.find((f) => f.id === 'bond_penalty');
    expect(bondFinding).toBeDefined();
    expect(bondFinding?.title).toContain('You owe money if you leave early');
  });
});
