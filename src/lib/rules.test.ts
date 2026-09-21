import { describe, it, expect } from 'vitest';
import { evaluateRules, evaluateCondition, interpolateText, loadRiskRules } from './rules';
import { VerifiedFields, Clause } from './types';

const mockClauses: Clause[] = [
  {
    id: 'c_001',
    ordinal: 0,
    number: '8.1',
    headingPath: ['8. Termination'],
    text: 'Employee must provide 120 days notice before resigning.',
    page: 1,
    charStart: 0,
    charEnd: 60,
    anchor: 'Employee must provide 120 days notice before resigning.',
  },
  {
    id: 'c_002',
    ordinal: 1,
    number: '8.2',
    headingPath: ['8. Termination'],
    text: 'Company may terminate employee with 30 days notice.',
    page: 1,
    charStart: 61,
    charEnd: 120,
    anchor: 'Company may terminate employee with 30 days notice.',
  },
  {
    id: 'c_003',
    ordinal: 2,
    number: '11.3',
    headingPath: ['11. Service Bond'],
    text: 'Bond period of 36 months applies with liquidated damages of 200000 INR.',
    page: 2,
    charStart: 121,
    charEnd: 195,
    anchor: 'Bond period of 36 months applies with liquidated damages',
  },
];

const createEmptyFields = (): VerifiedFields => ({
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
    checked: 20,
    discarded: [],
    method: 'model+verifier',
  },
});

describe('Risk Rules Engine (src/lib/rules.ts)', () => {
  it('loads all 13 evaluated rules from config/risk-rules.yaml', () => {
    const rules = loadRiskRules();
    expect(rules.length).toBe(13);
    expect(rules.some((r) => r.id === 'long_notice')).toBe(true);
    expect(rules.some((r) => r.id === 'asymmetric_notice')).toBe(true);
    expect(rules.some((r) => r.id === 'bond_penalty')).toBe(true);
  });

  it('correctly evaluates conditions with comparisons and AND connectors', () => {
    const fields = createEmptyFields();
    fields.noticePeriodEmployee = { value: 120, confidence: 1, evidence: null };
    fields.noticePeriodEmployer = { value: 30, confidence: 1, evidence: null };

    expect(evaluateCondition('noticePeriodEmployee.value > 90', fields)).toBe(true);
    expect(evaluateCondition('noticePeriodEmployer.value < noticePeriodEmployee.value', fields)).toBe(true);
    expect(evaluateCondition('noticePeriodEmployee.value > 150', fields)).toBe(false);
  });

  it('interpolates field tokens into titles and explanations', () => {
    const fields = createEmptyFields();
    fields.noticePeriodEmployee = { value: 120, confidence: 1, evidence: null };

    const title = interpolateText('You must give {noticePeriodEmployee.value} days notice to resign', fields);
    expect(title).toBe('You must give 120 days notice to resign');
  });

  it('fires long_notice when notice > 90 and evidence is present', () => {
    const fields = createEmptyFields();
    fields.noticePeriodEmployee = {
      value: 120,
      confidence: 0.95,
      evidence: { clauseId: 'c_001', quote: '120 days notice', page: 1 },
    };

    const findings = evaluateRules(fields, mockClauses);
    const longNotice = findings.find((f) => f.id === 'long_notice');
    expect(longNotice).toBeDefined();
    expect(longNotice?.severity).toBe('high');
    expect(longNotice?.title).toContain('120 days notice');
    expect(longNotice?.evidence[0].clauseId).toBe('c_001');
  });

  it('CRITICAL: Rule does NOT fire if evidence is missing (AGENTS.md Rule 5)', () => {
    const fields = createEmptyFields();
    // Condition passes (>90) BUT evidence is null!
    fields.noticePeriodEmployee = {
      value: 120,
      confidence: 0.95,
      evidence: null,
    };

    const findings = evaluateRules(fields, mockClauses);
    const longNotice = findings.find((f) => f.id === 'long_notice');
    expect(longNotice).toBeUndefined();
  });

  it('CRITICAL: asymmetric_notice does NOT fire when notice periods are equal', () => {
    const fields = createEmptyFields();
    fields.noticePeriodEmployee = {
      value: 60,
      confidence: 0.95,
      evidence: { clauseId: 'c_001', quote: '60 days notice', page: 1 },
    };
    fields.noticePeriodEmployer = {
      value: 60,
      confidence: 0.95,
      evidence: { clauseId: 'c_002', quote: '60 days notice', page: 1 },
    };

    const findings = evaluateRules(fields, mockClauses);
    const asymNotice = findings.find((f) => f.id === 'asymmetric_notice');
    expect(asymNotice).toBeUndefined();
  });

  it('asymmetric_notice fires when employer notice is strictly less than employee notice', () => {
    const fields = createEmptyFields();
    fields.noticePeriodEmployee = {
      value: 90,
      confidence: 0.95,
      evidence: { clauseId: 'c_001', quote: '90 days notice', page: 1 },
    };
    fields.noticePeriodEmployer = {
      value: 30,
      confidence: 0.95,
      evidence: { clauseId: 'c_002', quote: '30 days notice', page: 1 },
    };

    const findings = evaluateRules(fields, mockClauses);
    const asymNotice = findings.find((f) => f.id === 'asymmetric_notice');
    expect(asymNotice).toBeDefined();
    expect(asymNotice?.severity).toBe('high');
    expect(asymNotice?.evidence.length).toBe(2);
  });
});
