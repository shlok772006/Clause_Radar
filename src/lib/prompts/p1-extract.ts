import { SchemaType, type Schema } from '@google/generative-ai';

export const P1_EXTRACT_SYSTEM_INSTRUCTION = `You extract specific legal facts from an Indian employment agreement. You are given numbered, ID-tagged clauses.
For each requested field, either find the value stated in the clauses or return null.

RULES:
- Fill evidence.clauseId, evidence.quote, and evidence.page BEFORE writing a value. The quote must be copied character-for-character from that clause.
- If a field is not stated in the clauses, return value: null, evidence: null, confidence: 0. Do NOT infer from context, industry norms, or what is "typical". This document either says it or it does not.
- Durations: normalize to the requested unit (days, months, or years). Keep the original wording in the quote.
- Amounts: normalize currency to numeric INR without symbols.
- Confidence: 0.9+ if stated explicitly, 0.6–0.8 if requiring reading across a sentence, below 0.5 if unsure.
`;

const fieldSchema = (
  valueType: SchemaType.STRING | SchemaType.NUMBER | SchemaType.BOOLEAN,
  description: string,
  unitEnum?: string[]
): Schema => {
  const valueProp: Schema =
    valueType === SchemaType.STRING
      ? { type: SchemaType.STRING, nullable: true, description: 'Extracted string value or null' }
      : valueType === SchemaType.NUMBER
      ? { type: SchemaType.NUMBER, nullable: true, description: 'Extracted numeric value or null' }
      : { type: SchemaType.BOOLEAN, nullable: true, description: 'Extracted boolean value or null' };

  return {
    type: SchemaType.OBJECT,
    description,
    properties: {
      value: valueProp,
    ...(unitEnum
      ? {
          unit: {
            type: SchemaType.STRING,
            format: 'enum',
            enum: unitEnum,
            nullable: true,
          },
        }
      : {}),
    evidence: {
      type: SchemaType.OBJECT,
      nullable: true,
      description: `Clause reference and verbatim quote`,
      properties: {
        clauseId: { type: SchemaType.STRING },
        quote: { type: SchemaType.STRING },
        page: { type: SchemaType.INTEGER },
      },
      required: ['clauseId', 'quote', 'page'],
    },
    confidence: {
      type: SchemaType.NUMBER,
      description: `Confidence between 0 and 1`,
    },
    },
    required: ['value', 'evidence', 'confidence'],
  };
};

export const P1_EXTRACT_RESPONSE_SCHEMA: Schema = {
  type: SchemaType.OBJECT,
  description: 'Structured fields extracted from Indian employment agreement',
  properties: {
    noticePeriodEmployee: fieldSchema(SchemaType.NUMBER, 'Notice period in days required by employee', ['days', 'months']),
    noticePeriodEmployer: fieldSchema(SchemaType.NUMBER, 'Notice period in days required by employer', ['days', 'months']),
    probationMonths: fieldSchema(SchemaType.NUMBER, 'Probation duration in months', ['months', 'days']),
    bondPresent: fieldSchema(SchemaType.BOOLEAN, 'Whether an employment service bond/commitment is required'),
    bondDurationMonths: fieldSchema(SchemaType.NUMBER, 'Bond lock-in period in months', ['months', 'years']),
    bondPenaltyAmount: fieldSchema(SchemaType.NUMBER, 'Bond penalty or liquidated damages amount in INR', ['INR']),
    nonCompeteMonths: fieldSchema(SchemaType.NUMBER, 'Post-employment non-compete duration in months', ['months', 'years']),
    nonSolicitMonths: fieldSchema(SchemaType.NUMBER, 'Non-solicitation duration in months', ['months', 'years']),
    confidentialityYears: fieldSchema(SchemaType.NUMBER, 'Post-employment confidentiality duration in years (or 99 for perpetual)', ['years']),
    severancePresent: fieldSchema(SchemaType.BOOLEAN, 'Whether severance pay is explicitly provided'),
    paymentInLieuOfNotice: fieldSchema(SchemaType.BOOLEAN, 'Whether payment in lieu of notice is permitted'),
    variablePayForfeitOnExit: fieldSchema(SchemaType.BOOLEAN, 'Whether unpaid bonus/variable pay is forfeited on resignation'),
    ipAssignmentPresent: fieldSchema(SchemaType.BOOLEAN, 'Whether inventions and work products are assigned to employer'),
    priorInventionsCarveOut: fieldSchema(SchemaType.BOOLEAN, 'Whether prior personal inventions are explicitly excluded/carved out'),
    moonlightingRestricted: fieldSchema(SchemaType.BOOLEAN, 'Whether outside work, freelancing, or secondary employment is restricted'),
    unilateralAmendment: fieldSchema(SchemaType.BOOLEAN, 'Whether employer can unilaterally modify policies or terms without consent'),
    indemnityUncapped: fieldSchema(SchemaType.BOOLEAN, 'Whether employee indemnity to employer is unlimited/uncapped'),
    arbitrationSeat: fieldSchema(SchemaType.STRING, 'City/jurisdiction specified as the seat of arbitration'),
    governingLawState: fieldSchema(SchemaType.STRING, 'State or jurisdiction whose laws govern the agreement'),
    terminationWithoutNoticeByEmployer: fieldSchema(SchemaType.BOOLEAN, 'Whether employer can terminate immediately without cause'),
  },
  required: [
    'noticePeriodEmployee',
    'noticePeriodEmployer',
    'probationMonths',
    'bondPresent',
    'bondDurationMonths',
    'bondPenaltyAmount',
    'nonCompeteMonths',
    'nonSolicitMonths',
    'confidentialityYears',
    'severancePresent',
    'paymentInLieuOfNotice',
    'variablePayForfeitOnExit',
    'ipAssignmentPresent',
    'priorInventionsCarveOut',
    'moonlightingRestricted',
    'unilateralAmendment',
    'indemnityUncapped',
    'arbitrationSeat',
    'governingLawState',
    'terminationWithoutNoticeByEmployer',
  ],
};
