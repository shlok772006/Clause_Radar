import { Clause, Finding } from '@/lib/types';
import { normalizeText } from '@/lib/verify';

const INJECTION_PATTERNS = [
  'ignore previous',
  'system prompt',
  'disregard the above',
  'disregard previous',
  'you are now',
  'new instructions',
  'override instructions',
  'output the following',
  'jailbreak',
  'prompt injection',
];

/**
 * Scans document clauses for suspicious phrases designed to manipulate
 * automated language models (prompt injection).
 *
 * If detected, surfaces a Finding with severity: 'info' detailing the clause citation.
 */
export function scanForInjection(clauses: Clause[]): Finding[] {
  const findings: Finding[] = [];

  for (const clause of clauses) {
    const normalized = normalizeText(clause.text);

    for (const pattern of INJECTION_PATTERNS) {
      if (normalized.includes(pattern)) {
        // Extract surrounding quote
        const idx = normalized.indexOf(pattern);
        const start = Math.max(0, idx - 15);
        const end = Math.min(clause.text.length, idx + pattern.length + 25);
        const quote = clause.text.slice(start, end).trim();

        findings.push({
          id: `f_injection_${clause.id}`,
          title: 'Automated Reader Manipulation Detected',
          severity: 'info',
          concern: 'termination',
          explanation:
            'This agreement contains phrasing commonly associated with automated prompt injection or instruction override attempts. Clause Radar treats all contract text strictly as untrusted data.',
          evidence: [
            {
              clauseId: clause.id,
              quote: quote.length >= 8 ? quote : clause.text.slice(0, 40),
              page: clause.page,
            },
          ],
          suggestedQuestion:
            'Ask the employer why unconventional instruction-like text appears within this agreement section.',
        });

        // Only surface one finding per clause
        break;
      }
    }
  }

  return findings;
}
