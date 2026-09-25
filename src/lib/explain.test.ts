import { describe, it, expect } from 'vitest';
import { verifyExplanation, explainClause } from './explain';
import { Clause } from './types';

describe('verifyExplanation', () => {
  it('passes when rewrite preserves existing numbers', () => {
    const source = 'Either party may terminate this agreement by giving sixty (60) days notice in writing.';
    const rewrite = 'You or the company can end this contract by giving 60 days written notice.';
    expect(verifyExplanation(rewrite, source)).toBe(true);
  });

  it('fails when rewrite introduces a hallucinated number', () => {
    const source = 'Either party may terminate this agreement by giving 60 days notice.';
    const rewrite = 'You must give 90 days notice before leaving.';
    expect(verifyExplanation(rewrite, source)).toBe(false);
  });

  it('passes when clause has no numbers and rewrite has no numbers', () => {
    const source = 'The employee shall keep all company property confidential.';
    const rewrite = 'You must keep company information private and not share it.';
    expect(verifyExplanation(rewrite, source)).toBe(true);
  });

  it('fails when rewrite adds numbers to a numberless clause', () => {
    const source = 'The employee shall keep all company property confidential.';
    const rewrite = 'You must keep company information private for 5 years.';
    expect(verifyExplanation(rewrite, source)).toBe(false);
  });
});

describe('explainClause', () => {
  const sampleClause: Clause = {
    id: 'c_001',
    ordinal: 1,
    number: '8.1',
    headingPath: ['8. TERMINATION'],
    text: 'Either party may terminate by giving 30 days notice.',
    page: 1,
    charStart: 0,
    charEnd: 52,
    anchor: 'Either party may terminate',
  };

  it('returns original clause text with fallback: true when no apiKey is provided', async () => {
    const res = await explainClause(sampleClause, '');
    expect(res.fallback).toBe(true);
    expect(res.text).toBe(sampleClause.text);
    expect(res.clauseId).toBe('c_001');
  });
});
