import { Clause, AnswerEnvelope } from './types';
import { serializeClauses } from './prompts/serializer';
import { P2_ASK_SYSTEM_INSTRUCTION, P2_ASK_RESPONSE_SCHEMA } from './prompts/p2-ask';
import { getStructuredModel } from './gemini';
import { verifyAnswerEnvelope } from './verify';

/**
 * Answers a question against document clauses using Gemini 2.0 Flash (temp 0)
 * with strict schema decoding and Grounding Verifier pass.
 */
export async function askQuestion(
  question: string,
  clauses: Clause[]
): Promise<AnswerEnvelope> {
  if (clauses.length === 0) {
    return {
      status: 'insufficient_evidence',
      claims: [],
      nearestClauseIds: [],
      clarifyWithProfessional: [
        'Could you verify that the document contains text and is not an unread scanned image?',
      ],
      discardedCount: 0,
    };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      status: 'insufficient_evidence',
      claims: [],
      nearestClauseIds: clauses.slice(0, 3).map((c) => c.id),
      clarifyWithProfessional: [
        'GEMINI_API_KEY is not configured on the server. Please configure it to enable live AI Q&A.',
      ],
      discardedCount: 0,
    };
  }

  const serializedDocument = serializeClauses(clauses);
  const userPrompt = `AGREEMENT CLAUSES:\n${serializedDocument}\n\nQUESTION: ${question.trim()}`;

  const model = getStructuredModel({
    systemInstruction: P2_ASK_SYSTEM_INSTRUCTION,
    responseSchema: P2_ASK_RESPONSE_SCHEMA,
    temperature: 0,
  });

  const result = await model.generateContent(userPrompt);
  const responseText = result.response.text();

  let candidateEnvelope: AnswerEnvelope;
  try {
    candidateEnvelope = JSON.parse(responseText);
  } catch {
    throw new Error('Model produced non-JSON output');
  }

  // Pass through Grounding Verifier (AGENTS.md Rule 1)
  return verifyAnswerEnvelope(candidateEnvelope, clauses);
}
