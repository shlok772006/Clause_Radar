import { describe, it, expect } from 'vitest';
import { matchRubric, loadRubricItems, keywordMatchScore } from './rubric';
import { Clause, RubricItem } from './types';

describe('Rubric Matching Engine (src/lib/rubric.ts)', () => {
  const sampleRubricItem: RubricItem = {
    id: 'notice_employee',
    label: 'Notice period you must give',
    concern: 'exit',
    severityIfMissing: 'high',
    whyItMatters: 'Determines lock-in duration.',
    ifMissingAsk: 'What notice must I give?',
    queries: ['notice period required from employee on resignation'],
    keywords: ['notice period', 'resignation', 'notice in writing'],
    threshold: 0.62,
  };

  const sampleClauses: Clause[] = [
    {
      id: 'c_001',
      ordinal: 0,
      number: '8.1',
      headingPath: ['8. Termination'],
      text: 'The employee shall give sixty (60) days notice in writing upon resignation.',
      page: 1,
      charStart: 0,
      charEnd: 80,
      anchor: 'The employee shall give sixty (60) days notice',
    },
    {
      id: 'c_002',
      ordinal: 1,
      number: '12.1',
      headingPath: ['12. Law'],
      text: 'This agreement is governed by the laws of India.',
      page: 2,
      charStart: 81,
      charEnd: 130,
      anchor: 'This agreement is governed by the laws of India.',
    },
  ];

  it('loads exactly 20 rubric items from config/clause-rubric.yaml', () => {
    const items = loadRubricItems();
    expect(items.length).toBe(20);
    expect(items.some((i) => i.id === 'compensation')).toBe(true);
    expect(items.some((i) => i.id === 'notice_employee')).toBe(true);
    expect(items.some((i) => i.id === 'non_compete')).toBe(true);
  });

  it('computes keyword match scores accurately', () => {
    const score = keywordMatchScore(sampleClauses[0].text, sampleRubricItem.keywords);
    expect(score).toBeGreaterThanOrEqual(0.6);

    const zeroScore = keywordMatchScore(sampleClauses[1].text, sampleRubricItem.keywords);
    expect(zeroScore).toBe(0);
  });

  it('matches present clause via keyword fallback with method "keyword"', () => {
    const results = matchRubric(sampleClauses, [sampleRubricItem]);
    expect(results.length).toBe(1);
    expect(results[0].itemId).toBe('notice_employee');
    expect(results[0].presence).toBe('present');
    expect(results[0].bestClauseId).toBe('c_001');
    expect(results[0].method).toBe('keyword');
  });

  it('marks items missing when clauses contain no related content', () => {
    const severanceItem: RubricItem = {
      id: 'severance',
      label: 'Severance pay',
      concern: 'termination',
      severityIfMissing: 'medium',
      whyItMatters: 'Income transition protection.',
      ifMissingAsk: 'Is severance provided?',
      queries: ['severance pay on termination'],
      keywords: ['severance', 'retrenchment compensation', 'salary in lieu'],
      threshold: 0.62,
    };

    const results = matchRubric(sampleClauses, [severanceItem]);
    expect(results.length).toBe(1);
    expect(results[0].presence).toBe('missing');
    expect(results[0].bestClauseId).toBeNull();
  });

  it('correctly uses mock vectors when available and reports method "embedding"', () => {
    const mockQueryVectors: Record<string, number[][]> = {
      notice_employee: [[1, 0, 0, 0]],
    };
    const mockClauseVectors = [
      [0.9, 0.1, 0, 0], // high similarity with query
      [0, 0, 1, 0],   // orthogonal
    ];

    const results = matchRubric(sampleClauses, [sampleRubricItem], mockQueryVectors, mockClauseVectors);
    expect(results.length).toBe(1);
    expect(results[0].presence).toBe('present');
    expect(results[0].bestClauseId).toBe('c_001');
    expect(results[0].method).toBe('embedding');
    expect(results[0].score).toBeGreaterThan(0.8);
  });
});
