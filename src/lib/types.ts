// Data Contracts — Copied verbatim from docs/03-DATA-CONTRACTS.md

export type Clause = {
  id: string;              // "c_001"
  ordinal: number;
  number: string | null;   // "8.2" if the document numbers it
  headingPath: string[];   // ["8. TERMINATION", "8.2 Notice"]
  text: string;
  page: number;            // 1-based
  charStart: number;
  charEnd: number;
  anchor: string;          // first 60 chars, whitespace-normalised, for highlighting
};

export type Concern =
  | "exit"          // notice period, resignation, relieving
  | "lockin"        // bond, penalty, training cost recovery
  | "future_work"   // non-compete, non-solicit, moonlighting
  | "pay"           // salary, variable pay, deductions
  | "ip"            // IP assignment, side projects, confidentiality
  | "termination";  // for cause, without cause, severance

export type Severity = "high" | "medium" | "low" | "info";
export type Presence = "present" | "unclear" | "missing";

export type Evidence = {
  clauseId: string;
  quote: string;      // MUST be a verbatim substring of that clause's text
  page: number;
};

export type Claim = {
  text: string;           // one assertion, plain language, no hedging
  evidence: Evidence[];   // at least one, else discarded by the verifier
  confidence: number;     // 0..1 as reported by the model
};

export type AnswerStatus =
  | "answered"
  | "insufficient_evidence"   // document does not contain it
  | "out_of_scope";           // not a question about this document

export type AnswerEnvelope = {
  status: AnswerStatus;
  claims: Claim[];
  nearestClauseIds: string[];      // shown on refusal — "closest we found"
  clarifyWithProfessional: string[]; // questions to take to HR or a lawyer
  discardedCount: number;          // set by the verifier, shown in debug panel
};

export type ExtractedField<T> = {
  value: T | null;
  unit?: "days" | "months" | "years" | "INR" | "percent";
  evidence: Evidence | null;
  confidence: number;
};

export type RawFields = {
  noticePeriodEmployee: ExtractedField<number>;
  noticePeriodEmployer: ExtractedField<number>;
  probationMonths: ExtractedField<number>;
  bondPresent: ExtractedField<boolean>;
  bondDurationMonths: ExtractedField<number>;
  bondPenaltyAmount: ExtractedField<number>;
  nonCompeteMonths: ExtractedField<number>;
  nonSolicitMonths: ExtractedField<number>;
  confidentialityYears: ExtractedField<number>;
  severancePresent: ExtractedField<boolean>;
  paymentInLieuOfNotice: ExtractedField<boolean>;
  variablePayForfeitOnExit: ExtractedField<boolean>;
  ipAssignmentPresent: ExtractedField<boolean>;
  priorInventionsCarveOut: ExtractedField<boolean>;
  moonlightingRestricted: ExtractedField<boolean>;
  unilateralAmendment: ExtractedField<boolean>;
  indemnityUncapped: ExtractedField<boolean>;
  arbitrationSeat: ExtractedField<string>;
  governingLawState: ExtractedField<string>;
  terminationWithoutNoticeByEmployer: ExtractedField<boolean>;
};

export type VerifiedFields = RawFields & {
  __verification: {
    checked: number;
    discarded: string[];   // field names that failed verification
    method: "model+verifier";
  };
};

export type RubricItem = {
  id: string;            // "severance"
  label: string;         // "Severance or payment in lieu of notice"
  concern: Concern;
  whyItMatters: string;  // static copy, written by us, not generated
  ifMissingAsk: string;  // the question to put to HR
  severityIfMissing: Severity;
  queries: string[];     // semantic probes
  keywords: string[];    // fallback
  threshold: number;     // cosine threshold, default 0.62
};

export type RubricResult = {
  itemId: string;
  presence: Presence;
  score: number;
  bestClauseId: string | null;
  method: "embedding" | "keyword";
};

export type Finding = {
  id: string;             // rule id
  title: string;          // "Your notice period is longer than your employer's"
  severity: Severity;
  concern: Concern;
  explanation: string;    // plain language, from config, may interpolate values
  evidence: Evidence[];   // REQUIRED and non-empty, or the finding is dropped
  suggestedQuestion: string;
  benchmark?: string;     // "Typical for this role: 30–60 days"
  legalNote?: string;     // e.g. reference to Section 27, Indian Contract Act 1872
};

export type Session = {
  id: string;
  createdAt: number;
  filename: string;
  pageCount: number;
  clauses: Clause[];
  vectors: number[][];
  fields: VerifiedFields;
  rubric: RubricResult[];
  findings: Finding[];
  concerns: Concern[];
};

export const CONCERN_LABELS: Record<Concern, string> = {
  exit:        "Leaving the job",
  lockin:      "Being locked in",
  future_work: "My next job and side work",
  pay:         "Pay and benefits",
  ip:          "Who owns what I build",
  termination: "Being let go",
};
