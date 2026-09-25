import { describe, it, expect } from 'vitest';
import {
  buildFallbackEmail,
  buildFallbackLawyerQuestions,
  generateNegotiationEmail,
  generateLawyerQuestions,
} from './act';
import { Finding, Clause } from './types';

describe('Candidate Action Generation (act.ts)', () => {
  const sampleFindings: Finding[] = [
    {
      id: 'long_notice',
      title: 'Notice period of 90 days',
      severity: 'high',
      concern: 'exit',
      explanation: 'You must give 90 days notice.',
      suggestedQuestion: 'Can the notice period be reduced to 60 days?',
      evidence: [{ clauseId: 'c_001', quote: '90 days notice', page: 1 }],
      benchmark: 'Typical: 30–60 days',
    },
    {
      id: 'bond_penalty',
      title: 'Service bond penalty of 1,50,000 INR',
      severity: 'high',
      concern: 'lockin',
      explanation: 'Penalty if leaving before 24 months.',
      suggestedQuestion: 'What actual training costs does this represent?',
      evidence: [{ clauseId: 'c_002', quote: 'pay 1,50,000 INR', page: 2 }],
      legalNote: 'Section 27 of ICA and training cost jurisprudence',
    },
  ];

  const sampleClauses: Clause[] = [
    {
      id: 'c_001',
      ordinal: 1,
      number: '8.1',
      headingPath: ['8. Termination'],
      text: 'Employee must give 90 days notice.',
      page: 1,
      charStart: 0,
      charEnd: 35,
      anchor: 'Employee must give',
    },
    {
      id: 'c_002',
      ordinal: 2,
      number: '9.3',
      headingPath: ['9. Bond'],
      text: 'Employee must pay 1,50,000 INR if leaving within 24 months.',
      page: 2,
      charStart: 36,
      charEnd: 95,
      anchor: 'Employee must pay',
    },
  ];

  it('builds a fallback email citing specific findings and questions', () => {
    const email = buildFallbackEmail(sampleFindings);
    expect(email).toContain('Dear HR Team');
    expect(email).toContain('Notice period of 90 days');
    expect(email).toContain('Can the notice period be reduced to 60 days?');
  });

  it('builds fallback lawyer questions citing clause and legal notes', () => {
    const questions = buildFallbackLawyerQuestions(sampleFindings);
    expect(questions.length).toBe(5);
    expect(questions[0]).toContain('§c_001');
    expect(questions[1]).toContain('Section 27');
  });

  it('returns fallback email when no apiKey is supplied to generateNegotiationEmail', async () => {
    const email = await generateNegotiationEmail(sampleFindings, ['exit'], sampleClauses, '');
    expect(email).toContain('Dear HR Team');
  });

  it('returns 5 lawyer questions when no apiKey is supplied to generateLawyerQuestions', async () => {
    const questions = await generateLawyerQuestions(sampleFindings, sampleClauses, '');
    expect(questions.length).toBe(5);
  });
});
