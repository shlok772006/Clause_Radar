import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { VerifiedFields, Finding, Severity, Concern, Evidence, Clause } from '@/lib/types';

export interface RiskRuleConfig {
  id: string;
  when: string;
  severity: Severity;
  concern: Concern;
  title: string;
  explanation: string;
  benchmark?: string;
  legalNote?: string;
  suggestedQuestion: string;
  evidenceFrom: string | string[];
}

let cachedRules: RiskRuleConfig[] | null = null;

interface RawRiskRule {
  id: string;
  when: string;
  severity: Severity;
  concern: Concern;
  title: string;
  explanation: string;
  benchmark?: string;
  legalNote?: string;
  suggestedQuestion: string;
  evidenceFrom: string | string[];
}

/**
 * Loads the 14 risk rules from config/risk-rules.yaml
 */
export function loadRiskRules(): RiskRuleConfig[] {
  if (cachedRules) return cachedRules;

  const rulesPath = path.resolve('config/risk-rules.yaml');
  const content = fs.readFileSync(rulesPath, 'utf-8');
  const parsed = YAML.parse(content);

  const rawRules = (parsed.rules || []) as RawRiskRule[];
  cachedRules = rawRules.map((r) => ({
    id: r.id,
    when: r.when,
    severity: r.severity,
    concern: r.concern,
    title: r.title,
    explanation: r.explanation,
    benchmark: r.benchmark,
    legalNote: r.legalNote,
    suggestedQuestion: r.suggestedQuestion,
    evidenceFrom: r.evidenceFrom,
  }));

  return cachedRules!;
}

/**
 * Extracts a field value from VerifiedFields given a path like "noticePeriodEmployee.value"
 */
function getFieldValue(pathStr: string, fields: VerifiedFields): unknown {
  const parts = pathStr.split('.');
  const fieldName = parts[0] as keyof VerifiedFields;
  const prop = parts[1] || 'value';

  if (fieldName in fields) {
    const fieldObj = fields[fieldName] as Record<string, unknown> | undefined;
    if (fieldObj && typeof fieldObj === 'object') {
      return fieldObj[prop];
    }
  }
  return undefined;
}

/**
 * Evaluates a single comparison clause e.g. "noticePeriodEmployee.value > 90"
 */
function evaluateComparison(expr: string, fields: VerifiedFields): boolean {
  const trimmed = expr.trim();

  // Pattern: left op right
  const match = trimmed.match(/^([\w.]+)\s*(==|!=|>=|<=|>|<)\s*(.+)$/);
  if (!match) return false;

  const [, leftPath, op, rightLiteral] = match;
  const leftVal = getFieldValue(leftPath, fields);

  let rightVal: unknown;
  const rightTrimmed = rightLiteral.trim();

  if (rightTrimmed === 'null') {
    rightVal = null;
  } else if (rightTrimmed === 'true') {
    rightVal = true;
  } else if (rightTrimmed === 'false') {
    rightVal = false;
  } else if (/^\d+(?:\.\d+)?$/.test(rightTrimmed)) {
    rightVal = parseFloat(rightTrimmed);
  } else if (rightTrimmed in fields || rightTrimmed.includes('.')) {
    // Dynamic right side e.g. noticePeriodEmployee.value
    rightVal = getFieldValue(rightTrimmed, fields);
  } else {
    rightVal = rightTrimmed.replace(/^["']|["']$/g, '');
  }

  if (leftVal === undefined || leftVal === null) {
    if (op === '==') return rightVal === null;
    if (op === '!=') return rightVal !== null;
    return false;
  }

  if (rightVal === null) {
    if (op === '==') return leftVal === null;
    if (op === '!=') return leftVal !== null;
    return false;
  }

  switch (op) {
    case '>':
      return Number(leftVal) > Number(rightVal);
    case '<':
      return Number(leftVal) < Number(rightVal);
    case '>=':
      return Number(leftVal) >= Number(rightVal);
    case '<=':
      return Number(leftVal) <= Number(rightVal);
    case '==':
      return leftVal === rightVal;
    case '!=':
      return leftVal !== rightVal;
    default:
      return false;
  }
}

/**
 * Evaluates a "when" expression (supporting "and" connectors).
 */
export function evaluateCondition(whenExpr: string, fields: VerifiedFields): boolean {
  if (!whenExpr || whenExpr.startsWith('special:')) return false;

  const parts = whenExpr.split(/\s+and\s+/i);
  for (const part of parts) {
    if (!evaluateComparison(part, fields)) {
      return false;
    }
  }

  return true;
}

/**
 * Interpolates tokens like {noticePeriodEmployee.value} into a string.
 */
export function interpolateText(template: string, fields: VerifiedFields): string {
  return template.replace(/\{([\w.]+)\}/g, (_, pathStr) => {
    const val = getFieldValue(pathStr, fields);
    return val !== undefined && val !== null ? String(val) : '';
  });
}

/**
 * Pure function: evaluates risk rules against verified fields and clauses.
 *
 * CRITICAL RULE (AGENTS.md rule 5):
 * A rule fires ONLY if it can attach valid, verified clause evidence.
 * A finding without evidence is discarded!
 */
export function evaluateRules(
  fields: VerifiedFields,
  clauses: Clause[],
  ruleConfigs?: RiskRuleConfig[]
): Finding[] {
  const rules = ruleConfigs || loadRiskRules();
  const findings: Finding[] = [];
  const clauseMap = new Map<string, Clause>(clauses.map((c) => [c.id, c]));

  for (const rule of rules) {
    if (rule.when.startsWith('special:')) {
      continue; // Handled by security scanner
    }

    if (!evaluateCondition(rule.when, fields)) {
      continue;
    }

    // Resolve evidence from field(s)
    const fieldSources = Array.isArray(rule.evidenceFrom) ? rule.evidenceFrom : [rule.evidenceFrom];
    const evidenceList: Evidence[] = [];

    for (const src of fieldSources) {
      const fieldKey = src as keyof VerifiedFields;
      const field = fields[fieldKey] as { evidence?: Evidence | null } | undefined;

      if (field && typeof field === 'object' && field.evidence) {
        const ev = field.evidence as Evidence;
        if (ev.clauseId && clauseMap.has(ev.clauseId)) {
          evidenceList.push(ev);
        }
      }
    }

    // AGENTS.md RULE 5: Rules fire only with a citation.
    // If no evidence can be attached, the finding does NOT exist!
    if (evidenceList.length === 0) {
      continue;
    }

    findings.push({
      id: rule.id,
      title: interpolateText(rule.title, fields),
      severity: rule.severity,
      concern: rule.concern,
      explanation: interpolateText(rule.explanation, fields),
      evidence: evidenceList,
      suggestedQuestion: rule.suggestedQuestion,
      benchmark: rule.benchmark,
      legalNote: rule.legalNote,
    });
  }

  return findings;
}
