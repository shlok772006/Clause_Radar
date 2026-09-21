# Phase 3: The Differentiator — User Acceptance Testing (UAT)

**Status:** Completed (Passed)  
**Completed:** 2026-09-21  

## Test Matrix

| # | Test Scenario | Expected Result | Status |
|---|---------------|-----------------|--------|
| 1 | Tab Navigation & Counts | FindingsPane displays four tabs: Clauses (37), Risks, Missing (10), and Ask with live badge counts | Passed |
| 2 | ConcernPicker Interaction | ConcernPicker renders 6 concern pills (*Leaving the job*, *Being locked in*, *My next job and side work*, *Pay and benefits*, *Who owns what I build*, *Being let go*) with active toggle state and selection count | Passed |
| 3 | Standard Clause Audit Scorecard | Missing tab displays scorecard with counts for Present (9), Unclear (1), and Missing (10) out of 20 rubric items | Passed |
| 4 | Audit Filter Tabs | Filtering by All (20), Missing (10), Unclear (1), and Present (9) updates the audit checklist dynamically | Passed |
| 5 | "Why It Matters" & "Ask HR" Copy | Missing items display contextual "Why it matters" rationale and suggested negotiation questions to ask HR | Passed |
| 6 | "Show me" Rubric Navigation | Clicking "Show me" on a detected rubric clause switches view and highlights the exact clause in the document | Passed |
| 7 | Risk Dashboard | Risks tab renders RiskDashboard, showing strict citation requirements and clean state handling | Passed |
| 8 | Concern Re-Ranking | Toggling concern pills dynamically re-orders audit items and prioritizes user concerns | Passed |

## Session Log

- Verified Phase 3 end-to-end in browser on test agreement: rubric scorecard, 20-clause audit matching, 6-pill ConcernPicker, filtering, "Show me" navigation, and RiskDashboard.
- All 10 unit test files (51 tests) pass with zero errors.
