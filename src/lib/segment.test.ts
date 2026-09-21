import { describe, it, expect } from 'vitest';
import { segmentClauses, normalizeWhitespace, createAnchor, getPageForOffset } from './segment';

describe('segmentClauses', () => {
  it('detects numbered clause: "8.2 Notice Period" → number: "8.2"', () => {
    const text = `8.2 Notice Period\nThe Employee must give at least thirty (30) days written notice before termination.`;
    const clauses = segmentClauses(text, [0]);
    expect(clauses.length).toBe(1);
    expect(clauses[0].number).toBe('8.2');
    expect(clauses[0].headingPath).toContain('8.2 Notice Period');
  });

  it('detects nested numbering: "1.1.1 Sub clause"', () => {
    const text = `1.1.1 Sub clause\nThis is a nested clause specifying specific duties and responsibilities of the engineer.`;
    const clauses = segmentClauses(text, [0]);
    expect(clauses.length).toBe(1);
    expect(clauses[0].number).toBe('1.1.1');
  });

  it('heading path accumulates across sections', () => {
    const text = `GENERAL TERMS\n1. Definitions\n1.1 Defined Terms\nThe following words have the following specific meanings assigned throughout this agreement.`;
    const clauses = segmentClauses(text, [0]);
    expect(clauses.length).toBeGreaterThan(0);
    const clause = clauses.find(c => c.number === '1.1');
    expect(clause).toBeDefined();
    expect(clause?.headingPath).toEqual(
      expect.arrayContaining(['GENERAL TERMS', '1.1 Defined Terms'])
    );
  });

  it('heading path resets on SCHEDULE/ANNEXURE', () => {
    const text = `CONFIDENTIALITY\n1. Non-Disclosure\nNo confidential info shall be disclosed to any third party.\n\nSCHEDULE A — BENEFITS\n1. Medical\nEmployee receives group health insurance coverage.`;
    const clauses = segmentClauses(text, [0]);
    const scheduleClause = clauses.find(c => c.text.includes('Medical'));
    expect(scheduleClause).toBeDefined();
    expect(scheduleClause?.headingPath).toContain('SCHEDULE A — BENEFITS');
    expect(scheduleClause?.headingPath).not.toContain('CONFIDENTIALITY');
  });

  it('fragments under 120 chars merge forward', () => {
    const text = `Short note here.\n\n8.1 Termination for Cause\nThe employer may terminate this agreement immediately without any notice or severance pay if employee commits gross misconduct.`;
    const clauses = segmentClauses(text, [0]);
    // The short note (< 120 chars) should have merged forward into the next clause
    expect(clauses.length).toBe(1);
    expect(clauses[0].text).toContain('Short note here.');
    expect(clauses[0].text).toContain('Termination for Cause');
  });

  it('fragments that ARE headings do NOT merge', () => {
    const text = `8.1 Head\n\n8.2 Next`;
    const clauses = segmentClauses(text, [0]);
    // Even though each is short, numbered clauses/headings are protected from merging
    expect(clauses.length).toBe(2);
    expect(clauses[0].number).toBe('8.1');
    expect(clauses[1].number).toBe('8.2');
  });

  it('page numbers correct across a page boundary', () => {
    // Page 1: 0..150, Page 2: 151..300
    const page1Text = '1. First Clause\nThis clause is on page one and contains sufficient text to be a valid clause.';
    const page2Text = '2. Second Clause\nThis clause is on page two and spans across the second page break.';
    const fullText = `${page1Text}\n\n${page2Text}`;
    const page2Offset = fullText.indexOf('2. Second Clause');
    const pageBreaks = [0, page2Offset];

    const clauses = segmentClauses(fullText, pageBreaks);
    expect(clauses.length).toBe(2);
    expect(clauses[0].page).toBe(1);
    expect(clauses[1].page).toBe(2);
  });

  it('empty input returns []', () => {
    expect(segmentClauses('', [])).toEqual([]);
    expect(segmentClauses('   \n  \t  ', [])).toEqual([]);
  });

  it('anchor is first 60 chars, whitespace normalised', () => {
    const text = `  8.2    Notice   Period:   The    Employee   shall   serve  sixty   (60)   days   notice   prior   to   departure.  `;
    const clauses = segmentClauses(text, [0]);
    expect(clauses.length).toBe(1);
    expect(clauses[0].anchor).toBe(normalizeWhitespace(text).slice(0, 60));
    expect(clauses[0].anchor.includes('  ')).toBe(false);
  });

  it('ALL-CAPS line under 80 chars is treated as heading, not clause', () => {
    const text = `SECTION II: INTELLECTUAL PROPERTY\n\nAll intellectual property developed by employee belongs entirely to company.`;
    const clauses = segmentClauses(text, [0]);
    // SECTION II: INTELLECTUAL PROPERTY is a heading line, not a standalone clause
    expect(clauses.length).toBe(1);
    expect(clauses[0].headingPath).toContain('SECTION II: INTELLECTUAL PROPERTY');
    expect(clauses[0].text).not.toBe('SECTION II: INTELLECTUAL PROPERTY');
  });
});

describe('helpers', () => {
  it('normalizeWhitespace collapses spaces and tabs', () => {
    expect(normalizeWhitespace('  hello \t world  \n test ')).toBe('hello world test');
  });

  it('createAnchor truncates at 60 characters', () => {
    const longString = 'a'.repeat(100);
    expect(createAnchor(longString).length).toBe(60);
  });

  it('getPageForOffset finds correct 1-based page', () => {
    const breaks = [0, 100, 250];
    expect(getPageForOffset(50, breaks)).toBe(1);
    expect(getPageForOffset(100, breaks)).toBe(2);
    expect(getPageForOffset(200, breaks)).toBe(2);
    expect(getPageForOffset(250, breaks)).toBe(3);
    expect(getPageForOffset(300, breaks)).toBe(3);
  });
});
