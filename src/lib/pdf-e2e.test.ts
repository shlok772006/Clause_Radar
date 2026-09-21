import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { parsePdf } from './pdf';
import { segmentClauses } from './segment';

describe('End-to-End PDF Pipeline Fixture Test', () => {
  it('parses synthetic test-agreement.pdf and segments into valid clauses', async () => {
    const fixturePath = path.resolve('eval/fixtures/test-agreement.pdf');
    expect(fs.existsSync(fixturePath)).toBe(true);

    const fileBuffer = fs.readFileSync(fixturePath);
    const arrayBuffer = fileBuffer.buffer.slice(
      fileBuffer.byteOffset,
      fileBuffer.byteOffset + fileBuffer.byteLength
    );

    const parseResult = await parsePdf(arrayBuffer);
    expect(parseResult.pageCount).toBe(3);
    expect(parseResult.pageBreaks.length).toBe(3);
    expect(parseResult.text.length).toBeGreaterThan(1000);

    const clauses = segmentClauses(parseResult.text, parseResult.pageBreaks);
    expect(clauses.length).toBeGreaterThan(5);

    // Verify presence of key clauses
    const noticeClause = clauses.find(
      (c) => c.text.includes('sixty (60) days') || (c.number && c.number.startsWith('8'))
    );
    expect(noticeClause).toBeDefined();
    expect(noticeClause?.anchor.length).toBeGreaterThan(10);
    expect(noticeClause?.page).toBeGreaterThanOrEqual(1);

    // Verify all clauses have valid structure
    clauses.forEach((clause, idx) => {
      expect(clause.id).toBe(`c_${String(idx + 1).padStart(3, '0')}`);
      expect(clause.ordinal).toBe(idx);
      expect(clause.anchor).toBeTruthy();
      expect(clause.page).toBeGreaterThanOrEqual(1);
      expect(clause.page).toBeLessThanOrEqual(parseResult.pageCount);
      expect(clause.charStart).toBeLessThanOrEqual(clause.charEnd);
    });
  });
});
