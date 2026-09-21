import {
  Clause,
  Claim,
  AnswerEnvelope,
  RawFields,
  VerifiedFields,
  ExtractedField,
} from '@/lib/types';

// Minimum character length for quote to prevent single-word matches
const MIN_QUOTE_LENGTH = 8;
const CONFIDENCE_FLOOR = 0.55;

const WORD_TO_NUMBER: Record<string, number> = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
  hundred: 100,
};

/**
 * Normalizes text for robust comparison:
 * lowercase, collapses whitespace to single space, strips zero-width chars.
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extracts numbers from text, returning both raw numeric values
 * and their number-word equivalents.
 */
export function extractNumbers(text: string): Set<number> {
  const normalized = normalizeText(text);
  const numbers = new Set<number>();

  // 1. Extract digits: integers or decimals
  const digitMatches = normalized.match(/\b\d+(?:\.\d+)?\b/g);
  if (digitMatches) {
    for (const d of digitMatches) {
      const parsed = parseFloat(d);
      if (!isNaN(parsed)) numbers.add(parsed);
    }
  }

  // 2. Extract number words
  const wordTokens = normalized.split(/[^a-z]+/);
  for (const token of wordTokens) {
    if (token in WORD_TO_NUMBER) {
      numbers.add(WORD_TO_NUMBER[token]);
    }
  }

  return numbers;
}

export interface VerificationResult {
  valid: boolean;
  reason?: string;
}

/**
 * Verifies a single claim against document clauses using the 5 checks.
 */
export function verifyClaim(claim: Claim, clauses: Clause[]): VerificationResult {
  // Check 4: Confidence floor
  if (claim.confidence < CONFIDENCE_FLOOR) {
    return { valid: false, reason: `Confidence ${claim.confidence} below threshold ${CONFIDENCE_FLOOR}` };
  }

  // Evidence must be present
  if (!claim.evidence || claim.evidence.length === 0) {
    return { valid: false, reason: 'Claim has no supporting evidence' };
  }

  const clauseMap = new Map<string, Clause>(clauses.map((c) => [c.id, c]));
  const claimNumbers = extractNumbers(claim.text);

  for (const ev of claim.evidence) {
    // Check 1: Existence
    const clause = clauseMap.get(ev.clauseId);
    if (!clause) {
      return { valid: false, reason: `Cited clauseId ${ev.clauseId} does not exist in document` };
    }

    // Check 2: Quote fidelity
    const normQuote = normalizeText(ev.quote || '');
    const normClauseText = normalizeText(clause.text);

    if (normQuote.length < MIN_QUOTE_LENGTH) {
      return { valid: false, reason: `Quote too short (< ${MIN_QUOTE_LENGTH} chars)` };
    }

    if (!normClauseText.includes(normQuote)) {
      return { valid: false, reason: `Quote is not a verbatim substring of clause ${ev.clauseId}` };
    }

    // Check 3: Number containment
    // Any numbers stated in the claim text MUST be supported by the cited clause text
    if (claimNumbers.size > 0) {
      const clauseNumbers = extractNumbers(clause.text);
      for (const num of claimNumbers) {
        if (!clauseNumbers.has(num)) {
          return {
            valid: false,
            reason: `Claim contains number ${num} which is absent from cited clause ${ev.clauseId}`,
          };
        }
      }
    }
  }

  return { valid: true };
}

/**
 * Verifies an entire AnswerEnvelope, filtering out invalid claims
 * and updating status to "insufficient_evidence" if all claims fail.
 */
export function verifyAnswerEnvelope(
  envelope: AnswerEnvelope,
  clauses: Clause[]
): AnswerEnvelope {
  // If already refused or out of scope, preserve status
  if (envelope.status === 'insufficient_evidence' || envelope.status === 'out_of_scope') {
    return {
      ...envelope,
      claims: [],
      discardedCount: envelope.discardedCount || 0,
    };
  }

  const validClaims: Claim[] = [];
  let discardedCount = envelope.discardedCount || 0;

  for (const claim of envelope.claims) {
    const res = verifyClaim(claim, clauses);
    if (res.valid) {
      validClaims.push(claim);
    } else {
      discardedCount++;
    }
  }

  // Check 5: Aggregate check
  if (validClaims.length === 0) {
    return {
      status: 'insufficient_evidence',
      claims: [],
      nearestClauseIds: envelope.nearestClauseIds || [],
      clarifyWithProfessional:
        envelope.clarifyWithProfessional && envelope.clarifyWithProfessional.length > 0
          ? envelope.clarifyWithProfessional
          : [
              'Does the employer have a separate written policy addressing this topic?',
              'Can HR provide written clarification regarding this absence?',
            ],
      discardedCount,
    };
  }

  return {
    status: 'answered',
    claims: validClaims,
    nearestClauseIds: envelope.nearestClauseIds || [],
    clarifyWithProfessional: envelope.clarifyWithProfessional || [],
    discardedCount,
  };
}

/**
 * Verifies a single extracted field.
 */
function verifySingleField<T>(
  field: ExtractedField<T>,
  clauses: Clause[]
): { verified: ExtractedField<T>; valid: boolean } {
  // Null or empty value is valid null
  if (field.value === null) {
    return { verified: field, valid: true };
  }

  if (field.confidence < CONFIDENCE_FLOOR || !field.evidence) {
    return {
      verified: { value: null, evidence: null, confidence: 0 },
      valid: false,
    };
  }

  const clause = clauses.find((c) => c.id === field.evidence?.clauseId);
  if (!clause) {
    return {
      verified: { value: null, evidence: null, confidence: 0 },
      valid: false,
    };
  }

  const normQuote = normalizeText(field.evidence.quote || '');
  const normClause = normalizeText(clause.text);

  if (normQuote.length < MIN_QUOTE_LENGTH || !normClause.includes(normQuote)) {
    return {
      verified: { value: null, evidence: null, confidence: 0 },
      valid: false,
    };
  }

  // For numeric fields, verify number containment
  if (typeof field.value === 'number') {
    const clauseNumbers = extractNumbers(clause.text);
    if (!clauseNumbers.has(field.value)) {
      return {
        verified: { value: null, evidence: null, confidence: 0 },
        valid: false,
      };
    }
  }

  return { verified: field, valid: true };
}

/**
 * Verifies all 20 P1 extracted fields against document clauses.
 */
export function verifyExtractedFields(raw: RawFields, clauses: Clause[]): VerifiedFields {
  const verified: Partial<RawFields> = {};
  const discarded: string[] = [];
  let checked = 0;

  const fieldKeys = Object.keys(raw) as (keyof RawFields)[];

  for (const key of fieldKeys) {
    const field = raw[key];
    checked++;

    const res = verifySingleField(field as ExtractedField<unknown>, clauses);
    if (res.valid) {
      verified[key] = res.verified as any;
    } else {
      verified[key] = res.verified as any;
      discarded.push(key);
    }
  }

  return {
    ...(verified as RawFields),
    __verification: {
      checked,
      discarded,
      method: 'model+verifier',
    },
  };
}
