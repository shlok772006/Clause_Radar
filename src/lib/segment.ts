// Deterministic clause segmentation for Clause Radar
import { Clause } from './types';

export function normalizeWhitespace(str: string): string {
  return str.replace(/\s+/g, ' ').trim();
}

export function createAnchor(text: string): string {
  return normalizeWhitespace(text).slice(0, 60);
}

export function getPageForOffset(charOffset: number, pageBreaks: number[]): number {
  if (!pageBreaks || pageBreaks.length === 0) return 1;
  for (let i = pageBreaks.length - 1; i >= 0; i--) {
    if (charOffset >= pageBreaks[i]) {
      return i + 1;
    }
  }
  return 1;
}

interface RawClause {
  number: string | null;
  headingPath: string[];
  text: string;
  charStart: number;
  charEnd: number;
  isHeading: boolean;
}

const NUMBERED_HEADING_REGEX = /^\s*(\d+(\.\d+)*)[\.)]?\s+([A-Z].*)/;
const SCHEDULE_REGEX = /^\s*(SCHEDULE|ANNEXURE|EXHIBIT)(\s+[A-Z0-9\-_]+)?/i;

function isAllCapsHeading(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length === 0 || trimmed.length > 80) return false;
  // Must contain uppercase letters and only uppercase letters / punctuation / digits / spaces
  if (!/[A-Z]/.test(trimmed)) return false;
  return trimmed === trimmed.toUpperCase();
}

export function segmentClauses(text: string, pageBreaks: number[]): Clause[] {
  if (!text || !text.trim()) {
    return [];
  }

  // Scan lines with character offsets
  interface LineSpan {
    raw: string;
    trimmed: string;
    start: number;
    end: number;
  }

  const lines: LineSpan[] = [];
  const lineRegex = /(.*?)(\r\n|\r|\n|$)/g;
  let match: RegExpExecArray | null;

  while ((match = lineRegex.exec(text)) !== null) {
    if (match.index === lineRegex.lastIndex) {
      lineRegex.lastIndex++;
    }
    const raw = match[1];
    lines.push({
      raw,
      trimmed: raw.trim(),
      start: match.index,
      end: match.index + raw.length,
    });
    if (match.index + match[0].length >= text.length) {
      break;
    }
  }

  const rawClauses: RawClause[] = [];
  let currentSectionHeading: string | null = null;
  let currentNumberedPath: string[] = [];

  function getCurrentHeadingPath(): string[] {
    const path: string[] = [];
    if (currentSectionHeading) {
      path.push(currentSectionHeading);
    }
    path.push(...currentNumberedPath);
    return path;
  }

  let currentClause: {
    number: string | null;
    headingPath: string[];
    lines: string[];
    charStart: number;
    charEnd: number;
    isHeading: boolean;
  } | null = null;

  function flushCurrentClause() {
    if (!currentClause) return;
    const joinedText = currentClause.lines.join('\n').trim();
    if (joinedText.length > 0) {
      rawClauses.push({
        number: currentClause.number,
        headingPath: [...currentClause.headingPath],
        text: joinedText,
        charStart: currentClause.charStart,
        charEnd: currentClause.charEnd,
        isHeading: currentClause.isHeading,
      });
    }
    currentClause = null;
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trimmed;

    if (!trimmed) {
      // Blank line: if current clause is >= 200 chars, flush it
      if (currentClause) {
        const currentLen = currentClause.lines.join('\n').trim().length;
        if (currentLen >= 200) {
          flushCurrentClause();
        }
      }
      continue;
    }

    // 1. SCHEDULE / ANNEXURE / EXHIBIT
    if (SCHEDULE_REGEX.test(trimmed)) {
      flushCurrentClause();
      currentSectionHeading = trimmed;
      currentNumberedPath = [];
      continue;
    }

    // 2. Numbered heading: e.g. "8.2 Notice Period"
    const numMatch = trimmed.match(NUMBERED_HEADING_REGEX);
    if (numMatch) {
      flushCurrentClause();
      const numStr = numMatch[1];
      const depth = numStr.split('.').length;

      // Adjust numbered hierarchy according to depth
      if (currentNumberedPath.length >= depth) {
        currentNumberedPath = currentNumberedPath.slice(0, depth - 1);
      }
      currentNumberedPath.push(trimmed);

      currentClause = {
        number: numStr,
        headingPath: getCurrentHeadingPath(),
        lines: [trimmed],
        charStart: line.start,
        charEnd: line.end,
        isHeading: true,
      };
      continue;
    }

    // 3. ALL-CAPS standalone line under 80 chars (section heading, not clause)
    if (isAllCapsHeading(trimmed)) {
      flushCurrentClause();
      currentSectionHeading = trimmed;
      currentNumberedPath = [];
      continue;
    }

    // 4. Regular body line
    if (!currentClause) {
      currentClause = {
        number: null,
        headingPath: getCurrentHeadingPath(),
        lines: [trimmed],
        charStart: line.start,
        charEnd: line.end,
        isHeading: false,
      };
    } else {
      currentClause.lines.push(trimmed);
      currentClause.charEnd = line.end;
      // Once a clause has body text beyond its heading line, it's no longer just a heading
      if (currentClause.lines.length > 1) {
        currentClause.isHeading = false;
      }
    }
  }

  flushCurrentClause();

  // Merge rule: merge any clause under 120 characters forward into the next clause,
  // UNLESS it is itself a heading or numbered clause.
  const merged: RawClause[] = [];
  for (let i = 0; i < rawClauses.length; i++) {
    const item = rawClauses[i];
    const isProtected = item.isHeading || item.number !== null;

    if (!isProtected && item.text.length < 120 && i + 1 < rawClauses.length) {
      // Merge forward into next clause
      const next = rawClauses[i + 1];
      next.text = item.text + '\n' + next.text;
      next.charStart = Math.min(item.charStart, next.charStart);
    } else if (!isProtected && item.text.length < 120 && merged.length > 0) {
      // Last clause fragment: merge backward into previous clause
      const prev = merged[merged.length - 1];
      prev.text = prev.text + '\n' + item.text;
      prev.charEnd = Math.max(prev.charEnd, item.charEnd);
    } else {
      merged.push(item);
    }
  }

  // Convert to final Clause[]
  return merged.map((c, index) => {
    return {
      id: `c_${String(index + 1).padStart(3, '0')}`,
      ordinal: index,
      number: c.number,
      headingPath: c.headingPath,
      text: c.text,
      page: getPageForOffset(c.charStart, pageBreaks),
      charStart: c.charStart,
      charEnd: c.charEnd,
      anchor: createAnchor(c.text),
    };
  });
}
