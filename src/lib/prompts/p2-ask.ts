import { SchemaType, type Schema } from '@google/generative-ai';

export const P2_ASK_SYSTEM_INSTRUCTION = `You answer questions about one specific Indian employment agreement, using ONLY the clauses supplied. You are not a lawyer and you do not give legal advice.

PROCESS (STRICT ORDER):
1. Find the clauses that contain the answer. If none do, STOP and REFUSE (see Refusal Rules below).
2. For each clause, copy the EXACT, character-for-character sentence that carries the fact into "quote".
3. ONLY THEN write the claim text in plain language.

RULES:
- Evidence-before-assertion: Populate evidence.clauseId, evidence.quote, and evidence.page before writing claim text.
- Quote fidelity: The quote must be an exact verbatim substring from the cited clause text. Never summarize or paraphrase the quote.
- Number containment: Every number, duration, percentage, or currency amount in your claim text MUST appear in the cited quote.
- One assertion per claim: Split compound answers into separate claims.
- Never speculate or generalize: Do NOT write "typically", "usually", "generally", "in most contracts", or "it is likely". This document either says it or it does not.
- Confidence: 0.9+ if explicitly stated, 0.6–0.8 if requiring reading across a sentence, below 0.5 if unsure.

REFUSAL RULES:
- If the requested information is not stated in the supplied clauses:
  * Set status to "insufficient_evidence".
  * Set claims to an empty list [].
  * Set nearestClauseIds to the 3 closest or most topically adjacent clause IDs in the document.
  * Set clarifyWithProfessional to 2–4 specific, practical questions the candidate should ask HR or a lawyer.
- If the user's question is completely unrelated to employment, contracts, or legal agreements:
  * Set status to "out_of_scope".
  * Set claims to [].

WORKED REFUSAL EXAMPLE:
Question: "What happens to my stock options if I resign?" (when document is silent on equity)
Output:
{
  "status": "insufficient_evidence",
  "claims": [],
  "nearestClauseIds": ["c_031", "c_044", "c_052"],
  "clarifyWithProfessional": [
    "Is there a separate ESOP grant letter, policy, or plan document?",
    "What is the vesting schedule and what happens to vested options upon resignation?",
    "Is there a clawback, forfeiture, or repurchase option exercised by the employer?"
  ]
}
`;

export const P2_ASK_RESPONSE_SCHEMA: Schema = {
  type: SchemaType.OBJECT,
  description: 'Grounded question-answering envelope with verified evidence citations',
  properties: {
    status: {
      type: SchemaType.STRING,
      format: 'enum',
      enum: ['answered', 'insufficient_evidence', 'out_of_scope'],
      description: 'Outcome of the query analysis',
    },
    claims: {
      type: SchemaType.ARRAY,
      description: 'List of grounded claims. MUST be empty if status is not answered.',
      items: {
        type: SchemaType.OBJECT,
        properties: {
          text: {
            type: SchemaType.STRING,
            description: 'Single factual assertion in plain, direct language',
          },
          evidence: {
            type: SchemaType.ARRAY,
            description: 'Verbatim quotes and clause citations supporting this claim',
            items: {
              type: SchemaType.OBJECT,
              properties: {
                clauseId: {
                  type: SchemaType.STRING,
                  description: 'The exact ID of the cited clause, e.g. c_012',
                },
                quote: {
                  type: SchemaType.STRING,
                  description: 'Exact verbatim substring copied directly from that clause',
                },
                page: {
                  type: SchemaType.INTEGER,
                  description: 'Page number where the clause appears',
                },
              },
              required: ['clauseId', 'quote', 'page'],
            },
          },
          confidence: {
            type: SchemaType.NUMBER,
            description: 'Confidence score between 0.0 and 1.0',
          },
        },
        required: ['evidence', 'text', 'confidence'],
      },
    },
    nearestClauseIds: {
      type: SchemaType.ARRAY,
      description: '3 closest clause IDs when answering or refusing',
      items: { type: SchemaType.STRING },
    },
    clarifyWithProfessional: {
      type: SchemaType.ARRAY,
      description: 'Suggested practical questions for HR or an attorney',
      items: { type: SchemaType.STRING },
    },
  },
  required: ['status', 'claims', 'nearestClauseIds', 'clarifyWithProfessional'],
};
