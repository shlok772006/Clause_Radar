import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { Clause, Presence, RubricItem, RubricResult } from '@/lib/types';
import { cosineSimilarity } from './embed';
import { normalizeText } from './verify';

export const DEFAULT_THRESHOLD = 0.62;
export const UNCLEAR_FLOOR = 0.50;

let cachedRubricItems: RubricItem[] | null = null;
let cachedPrecomputedVectors: Record<string, number[][]> | null = null;

/**
 * Loads the 20 rubric items from config/clause-rubric.yaml
 */
export function loadRubricItems(): RubricItem[] {
  if (cachedRubricItems) return cachedRubricItems;

  const rubricPath = path.resolve('config/clause-rubric.yaml');
  const yamlContent = fs.readFileSync(rubricPath, 'utf-8');
  const parsed = YAML.parse(yamlContent);

  cachedRubricItems = parsed.items.map((item: any) => ({
    id: item.id,
    label: item.label,
    concern: item.concern,
    whyItMatters: item.whyItMatters,
    ifMissingAsk: item.ifMissingAsk,
    severityIfMissing: item.severityIfMissing,
    queries: item.queries || [],
    keywords: item.keywords || [],
    threshold: item.threshold || parsed.defaults?.threshold || DEFAULT_THRESHOLD,
  }));

  return cachedRubricItems!;
}

/**
 * Loads precomputed vectors from config/rubric-vectors.json if available
 */
export function loadPrecomputedVectors(): Record<string, number[][]> | null {
  if (cachedPrecomputedVectors) return cachedPrecomputedVectors;

  try {
    const vectorsPath = path.resolve('config/rubric-vectors.json');
    if (!fs.existsSync(vectorsPath)) return null;

    const content = fs.readFileSync(vectorsPath, 'utf-8');
    cachedPrecomputedVectors = JSON.parse(content);
    return cachedPrecomputedVectors;
  } catch {
    return null;
  }
}

/**
 * Deterministic keyword matching score between a clause and a rubric item's keywords.
 */
export function keywordMatchScore(clauseText: string, keywords: string[]): number {
  if (keywords.length === 0) return 0;
  const normalized = normalizeText(clauseText);

  let matchCount = 0;
  for (const kw of keywords) {
    const normKw = normalizeText(kw);
    if (normalized.includes(normKw)) {
      matchCount++;
    }
  }

  // Ratio of matched keywords, capped at 1.0
  const ratio = matchCount / Math.min(keywords.length, 3);
  return Math.min(1.0, ratio);
}

/**
 * Matches document clauses against the 20 rubric items using embeddings
 * with fallback to deterministic keyword matching.
 */
export function matchRubric(
  clauses: Clause[],
  rubricItems: RubricItem[],
  precomputedVectors?: Record<string, number[][]> | null,
  clauseVectors?: number[][] | null
): RubricResult[] {
  const results: RubricResult[] = [];
  const hasVectors =
    Boolean(precomputedVectors) &&
    Boolean(clauseVectors) &&
    clauseVectors!.length === clauses.length;

  for (const item of rubricItems) {
    let bestScore = 0;
    let bestClauseId: string | null = null;
    let method: 'embedding' | 'keyword' = 'keyword';

    const queryVectors = precomputedVectors?.[item.id];

    if (hasVectors && queryVectors && queryVectors.length > 0) {
      method = 'embedding';
      for (let i = 0; i < clauses.length; i++) {
        const cVec = clauseVectors![i];
        for (const qVec of queryVectors) {
          const sim = cosineSimilarity(cVec, qVec);
          if (sim > bestScore) {
            bestScore = sim;
            bestClauseId = clauses[i].id;
          }
        }
      }
    } else {
      // Keyword fallback
      method = 'keyword';
      for (const clause of clauses) {
        const score = keywordMatchScore(clause.text, item.keywords);
        if (score > bestScore) {
          bestScore = score;
          bestClauseId = clause.id;
        }
      }
    }

    // Determine presence
    let presence: Presence = 'missing';
    const threshold = item.threshold || DEFAULT_THRESHOLD;

    if (bestScore >= threshold) {
      presence = 'present';
    } else if (bestScore >= UNCLEAR_FLOOR) {
      presence = 'unclear';
    } else {
      presence = 'missing';
      bestClauseId = null;
    }

    results.push({
      itemId: item.id,
      presence,
      score: Math.round(bestScore * 100) / 100,
      bestClauseId,
      method,
    });
  }

  return results;
}
