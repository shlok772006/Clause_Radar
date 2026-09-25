import { GoogleGenerativeAI } from '@google/generative-ai';
import { Finding, Concern, Clause } from './types';

/**
 * Builds a deterministic fallback negotiation email if model is unavailable.
 */
export function buildFallbackEmail(findings: Finding[]): string {
  if (findings.length === 0) {
    return `Dear HR Team,

Thank you for the offer. I am very excited about the opportunity to join the team and contribute.

I have reviewed the agreement and had a couple of brief clarifying questions regarding the standard terms before signing. Could we arrange a brief call or email exchange to review them?

Looking forward to hearing from you.

Best regards,
Candidate`;
  }

  const points = findings.slice(0, 3).map((f) => {
    const clauseRef = f.evidence[0] ? `Clause §${f.evidence[0].clauseId}` : 'the agreement';
    return `- Regarding ${clauseRef} (${f.title}): ${f.suggestedQuestion}`;
  }).join('\n');

  return `Dear HR Team,

Thank you for extending this offer. I am very keen to join and excited about the role.

Upon reviewing the employment agreement, I noticed a few specific clauses I would appreciate clarifying:

${points}

Would it be possible to discuss these points or consider standard adjustments? I appreciate your guidance on this.

Warm regards,
Candidate`;
}

/**
 * Builds deterministic fallback questions for a lawyer if model is unavailable.
 */
export function buildFallbackLawyerQuestions(findings: Finding[]): string[] {
  if (findings.length === 0) {
    return [
      'Is there an IP assignment carve-out for pre-existing personal inventions?',
      'Are the dispute resolution and jurisdiction terms balanced?',
      'Is the notice period standard for this seniority level in India?',
      'Does the confidentiality clause have a reasonable sunset period?',
      'Are there any unusual indemnity obligations that should be capped?',
    ];
  }

  const questions: string[] = [];
  for (const f of findings) {
    const clause = f.evidence[0] ? `§${f.evidence[0].clauseId}` : 'clause';
    if (f.legalNote) {
      questions.push(`Under ${clause}, does "${f.title}" raise enforceability concerns given that ${f.legalNote}?`);
    } else {
      questions.push(`Under ${clause}, how should I navigate "${f.title}" (${f.suggestedQuestion})?`);
    }
    if (questions.length >= 5) break;
  }

  while (questions.length < 5) {
    questions.push('Are there any other standard protections missing from this agreement?');
  }

  return questions;
}

/**
 * Generates a candidate negotiation email to HR (Prompt P5, temp 0.4).
 */
export async function generateNegotiationEmail(
  findings: Finding[],
  selectedConcerns: Concern[],
  clauses: Clause[],
  overrideApiKey?: string
): Promise<string> {
  const apiKey = overrideApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return buildFallbackEmail(findings);
  }

  const clauseMap = new Map<string, Clause>(clauses.map((c) => [c.id, c]));

  // Prioritize findings matching user concerns
  const prioritized = [...findings].sort((a, b) => {
    const aMatch = selectedConcerns.includes(a.concern) ? 0 : 1;
    const bMatch = selectedConcerns.includes(b.concern) ? 0 : 1;
    return aMatch - bMatch;
  }).slice(0, 4);

  const findingsSummary = prioritized.map((f) => {
    const ev = f.evidence[0];
    const c = ev ? clauseMap.get(ev.clauseId) : null;
    const cNum = c?.number ? `§${c.number}` : ev?.clauseId ? `§${ev.clauseId}` : 'Clause';
    return `Point: ${f.title}\nClause: ${cNum} (Quote: "${ev?.quote || ''}")\nSuggested Question: ${f.suggestedQuestion}`;
  }).join('\n\n');

  const prompt = `Write a short, polite email from a candidate to an HR contact, raising the specific points listed below.
Constraints:
- Reference each point by its clause number (§).
- Ask questions and propose alternatives; do not make demands or threats.
- Do not claim anything is illegal or unenforceable.
- Under 200 words.
- Plain sentences, no legalese, no flattery.
- End with a line making clear the candidate is keen on the role.
- Output ONLY the email body text. Do not wrap in markdown or backticks.

Points to raise:
${findingsSummary || 'Standard contract terms clarification.'}`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.4,
      },
    });

    const response = await model.generateContent(prompt);
    const text = response.response.text().trim();
    return text || buildFallbackEmail(findings);
  } catch (err) {
    console.warn('[act] Failed to generate negotiation email:', err instanceof Error ? err.message : 'Unknown');
    return buildFallbackEmail(findings);
  }
}

/**
 * Generates 5 sharp questions for a lawyer / professional (Prompt P6, temp 0.4).
 */
export async function generateLawyerQuestions(
  findings: Finding[],
  clauses: Clause[],
  overrideApiKey?: string
): Promise<string[]> {
  const apiKey = overrideApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return buildFallbackLawyerQuestions(findings);
  }

  const clauseMap = new Map<string, Clause>(clauses.map((c) => [c.id, c]));

  const findingsSummary = findings.slice(0, 5).map((f) => {
    const ev = f.evidence[0];
    const c = ev ? clauseMap.get(ev.clauseId) : null;
    const cNum = c?.number ? `§${c.number}` : ev?.clauseId ? `§${ev.clauseId}` : 'Clause';
    return `Finding: ${f.title} (${cNum})\nLegal Note: ${f.legalNote || 'N/A'}\nQuote: "${ev?.quote || ''}"`;
  }).join('\n\n');

  const prompt = `From these findings from an Indian employment agreement, write the five questions this person should put to a lawyer or to HR.
Constraints:
- Each question must be specific to their contract and reference a clause number (§).
- No generic advice, no explanation of what a lawyer does.
- Return EXACTLY 5 questions formatted as a raw JSON array of 5 strings: ["Question 1", "Question 2", "Question 3", "Question 4", "Question 5"].
- Do NOT include markdown code fences or backticks.

Findings:
${findingsSummary || 'General employment terms.'}`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.4,
        responseMimeType: 'application/json',
      },
    });

    const response = await model.generateContent(prompt);
    const raw = response.response.text().trim();
    const parsed = JSON.parse(raw);

    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.slice(0, 5).map((q) => String(q).trim());
    }

    return buildFallbackLawyerQuestions(findings);
  } catch (err) {
    console.warn('[act] Failed to generate lawyer questions:', err instanceof Error ? err.message : 'Unknown');
    return buildFallbackLawyerQuestions(findings);
  }
}
