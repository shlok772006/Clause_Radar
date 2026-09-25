import { GoogleGenerativeAI } from '@google/generative-ai';
import { Clause } from './types';
import { extractNumbers } from './verify';

export interface ExplainResult {
  text: string;
  verified: boolean;
  fallback: boolean;
  clauseId: string;
}

/**
 * Verifies that every number mentioned in the plain-language rewrite
 * exists in the original source clause text.
 */
export function verifyExplanation(rewrite: string, sourceText: string): boolean {
  const rewriteNums = extractNumbers(rewrite);
  const sourceNums = extractNumbers(sourceText);

  for (const num of rewriteNums) {
    if (!sourceNums.has(num)) {
      return false;
    }
  }
  return true;
}

/**
 * Rewrites a single clause in plain English using Gemini 2.5 Flash (P3, temp 0),
 * and verifies that all numbers/durations match the source clause.
 */
export async function explainClause(
  clause: Clause,
  overrideApiKey?: string
): Promise<ExplainResult> {
  const apiKey = overrideApiKey || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return {
      text: clause.text,
      verified: true,
      fallback: true,
      clauseId: clause.id,
    };
  }

  const prompt = `Rewrite this one clause so a 23-year-old with no legal training understands it.
Constraints:
- Keep every number, duration, amount and party name exactly as written.
- Add no obligation, exception or consequence that is not in the text.
- Do not soften or dramatise.
- Two to four sentences.
- If the clause is already plain, return it unchanged.
- Return ONLY the rewritten plain English text without preamble, headings, quotes, or markdown.

Clause ID: ${clause.id}${clause.number ? ` (§${clause.number})` : ''}
Untrusted clause text follows:
"""
${clause.text}
"""`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0,
      },
    });

    const response = await model.generateContent(prompt);
    const text = response.response.text().trim();

    if (!text) {
      return {
        text: clause.text,
        verified: true,
        fallback: true,
        clauseId: clause.id,
      };
    }

    // AGENTS.md Rule 1: No model output reaches UI unverified
    const isValid = verifyExplanation(text, clause.text);
    if (!isValid) {
      console.warn(`[explain] Clause ${clause.id} failed number verification, falling back to original`);
      return {
        text: clause.text,
        verified: false,
        fallback: true,
        clauseId: clause.id,
      };
    }

    return {
      text,
      verified: true,
      fallback: false,
      clauseId: clause.id,
    };
  } catch (err) {
    console.warn(`[explain] Error generating plain-language rewrite for ${clause.id}:`, err instanceof Error ? err.message : 'Unknown');
    return {
      text: clause.text,
      verified: true,
      fallback: true,
      clauseId: clause.id,
    };
  }
}
