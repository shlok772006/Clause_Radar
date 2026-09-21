import { describe, it, expect } from 'vitest';
import { verifyAnswerEnvelope } from './verify';
import { Clause, AnswerEnvelope } from './types';
import { serializeClauses, UNTRUSTED_DOC_HEADER, UNTRUSTED_DOC_FOOTER } from './prompts/serializer';

const sampleClauses: Clause[] = [
  {
    id: 'c_001',
    ordinal: 0,
    number: '8.1',
    headingPath: ['8. TERMINATION', '8.1 Notice Period'],
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
    headingPath: ['11. COMMITMENT', '11.3 Service Bond'],
    text: 'The Employee agrees to serve the Company for a minimum period of 24 months, failing which liquidated damages of 150000 INR shall be payable.',
    page: 2,
    charStart: 105,
    charEnd: 247,
    anchor: 'The Employee agrees to serve the Company for a minimum perio',
  },
];

describe('Prompt Serialization', () => {
  it('wraps clauses with untrusted document delimiters', () => {
    const serialized = serializeClauses(sampleClauses);
    expect(serialized).toContain(UNTRUSTED_DOC_HEADER.trim());
    expect(serialized).toContain(UNTRUSTED_DOC_FOOTER.trim());
    expect(serialized).toContain('[c_001 | p.1 | 8.1 8.1 Notice Period]');
    expect(serialized).toContain('sixty (60) days written notice');
  });
});

describe('Q&A Pipeline Envelope Verification', () => {
  it('preserves valid answered envelope with verbatim quotes', () => {
    const rawAnswer: AnswerEnvelope = {
      status: 'answered',
      claims: [
        {
          text: 'The agreement requires sixty (60) days written notice by either party to terminate.',
          evidence: [
            {
              clauseId: 'c_001',
              quote: 'Either party may terminate this agreement by giving sixty (60) days written notice',
              page: 1,
            },
          ],
          confidence: 0.95,
        },
      ],
      nearestClauseIds: ['c_001'],
      clarifyWithProfessional: [],
      discardedCount: 0,
    };

    const verified = verifyAnswerEnvelope(rawAnswer, sampleClauses);
    expect(verified.status).toBe('answered');
    expect(verified.claims.length).toBe(1);
    expect(verified.discardedCount).toBe(0);
    expect(verified.claims[0].text).toContain('sixty (60) days');
  });

  it('refuses and transitions to insufficient_evidence when model fabricates claim quote', () => {
    const hallucinatedAnswer: AnswerEnvelope = {
      status: 'answered',
      claims: [
        {
          text: 'The notice period is 90 days as per company standards.',
          evidence: [
            {
              clauseId: 'c_001',
              quote: 'standard notice period shall be 90 days', // NOT in clause
              page: 1,
            },
          ],
          confidence: 0.85,
        },
      ],
      nearestClauseIds: ['c_001'],
      clarifyWithProfessional: ['Does HR have an addendum updating the notice period?'],
      discardedCount: 0,
    };

    const verified = verifyAnswerEnvelope(hallucinatedAnswer, sampleClauses);
    expect(verified.status).toBe('insufficient_evidence');
    expect(verified.claims.length).toBe(0);
    expect(verified.discardedCount).toBe(1);
    expect(verified.clarifyWithProfessional.length).toBeGreaterThan(0);
  });

  it('handles explicit refusal contracts seamlessly', () => {
    const refusalAnswer: AnswerEnvelope = {
      status: 'insufficient_evidence',
      claims: [],
      nearestClauseIds: ['c_001', 'c_002'],
      clarifyWithProfessional: [
        'Is there a separate stock option grant letter?',
        'What is the option vesting cliff?',
      ],
      discardedCount: 0,
    };

    const verified = verifyAnswerEnvelope(refusalAnswer, sampleClauses);
    expect(verified.status).toBe('insufficient_evidence');
    expect(verified.claims.length).toBe(0);
    expect(verified.nearestClauseIds).toEqual(['c_001', 'c_002']);
    expect(verified.clarifyWithProfessional.length).toBe(2);
  });
});
