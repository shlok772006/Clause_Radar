import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Computes cosine similarity between two numeric vectors.
 * Returns a value between -1.0 and 1.0 (or 0 if magnitude is zero).
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length === 0 || b.length === 0) return 0;
  const len = Math.min(a.length, b.length);

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < len; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Embeds an array of text snippets using Gemini text-embedding-004.
 * Returns null if GEMINI_API_KEY is not configured or if API call fails.
 */
export async function embedTexts(texts: string[]): Promise<number[][] | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || texts.length === 0) return null;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });

    const vectors: number[][] = [];
    const CHUNK_SIZE = 5;

    for (let i = 0; i < texts.length; i += CHUNK_SIZE) {
      const chunk = texts.slice(i, i + CHUNK_SIZE);
      const results = await Promise.all(
        chunk.map(async (text) => {
          const truncated = text.slice(0, 2000);
          const res = await model.embedContent(truncated);
          return res.embedding.values;
        })
      );
      vectors.push(...results);
    }

    return vectors;
  } catch (err) {
    console.warn('[embed] Embedding failed, falling back to keyword matching:', err instanceof Error ? err.message : 'Unknown');
    return null;
  }
}
