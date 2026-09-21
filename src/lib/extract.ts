import { Clause, RawFields, VerifiedFields } from '@/lib/types';
import { serializeClauses } from '@/lib/prompts/serializer';
import { P1_EXTRACT_SYSTEM_INSTRUCTION, P1_EXTRACT_RESPONSE_SCHEMA } from '@/lib/prompts/p1-extract';
import { getStructuredModel } from '@/lib/gemini';
import { verifyExtractedFields } from '@/lib/verify';

export const EMPTY_RAW_FIELDS: RawFields = {
  noticePeriodEmployee: { value: null, confidence: 0, evidence: null },
  noticePeriodEmployer: { value: null, confidence: 0, evidence: null },
  probationMonths: { value: null, confidence: 0, evidence: null },
  bondPresent: { value: null, confidence: 0, evidence: null },
  bondDurationMonths: { value: null, confidence: 0, evidence: null },
  bondPenaltyAmount: { value: null, confidence: 0, evidence: null },
  nonCompeteMonths: { value: null, confidence: 0, evidence: null },
  nonSolicitMonths: { value: null, confidence: 0, evidence: null },
  confidentialityYears: { value: null, confidence: 0, evidence: null },
  severancePresent: { value: null, confidence: 0, evidence: null },
  paymentInLieuOfNotice: { value: null, confidence: 0, evidence: null },
  variablePayForfeitOnExit: { value: null, confidence: 0, evidence: null },
  ipAssignmentPresent: { value: null, confidence: 0, evidence: null },
  priorInventionsCarveOut: { value: null, confidence: 0, evidence: null },
  moonlightingRestricted: { value: null, confidence: 0, evidence: null },
  unilateralAmendment: { value: null, confidence: 0, evidence: null },
  indemnityUncapped: { value: null, confidence: 0, evidence: null },
  arbitrationSeat: { value: null, confidence: 0, evidence: null },
  governingLawState: { value: null, confidence: 0, evidence: null },
  terminationWithoutNoticeByEmployer: { value: null, confidence: 0, evidence: null },
};

/**
 * Extracts 20 standard employment agreement facts using Gemini P1 extraction prompt
 * and passes the candidate fields through the Grounding Verifier.
 */
export async function extractFields(clauses: Clause[]): Promise<VerifiedFields> {
  if (clauses.length === 0) {
    return {
      ...EMPTY_RAW_FIELDS,
      __verification: {
        checked: 0,
        discarded: [],
        method: 'model+verifier',
      },
    };
  }

  try {
    const serialized = serializeClauses(clauses);
    const model = getStructuredModel({
      systemInstruction: P1_EXTRACT_SYSTEM_INSTRUCTION,
      responseSchema: P1_EXTRACT_RESPONSE_SCHEMA,
      temperature: 0,
    });

    const result = await model.generateContent(
      `Extract all 20 facts from the following clauses:\n\n${serialized}`
    );
    const responseText = result.response.text();
    const candidateFields: RawFields = JSON.parse(responseText);

    // Run verification pass
    return verifyExtractedFields(candidateFields, clauses);
  } catch (err) {
    // If extraction fails or API is unreachable, return empty fields cleanly
    return {
      ...EMPTY_RAW_FIELDS,
      __verification: {
        checked: 0,
        discarded: ['extraction_failed'],
        method: 'model+verifier',
      },
    };
  }
}
