# 05 — Domain Config

**This file is the product.** It is the thing a general-purpose assistant does not have. Copy these two blocks into `config/clause-rubric.yaml` and `config/risk-rules.yaml` as-is. Do not let the agent regenerate them — it will produce something generic and you will lose the differentiator.

Tune the thresholds on Day 3 against your three fixtures. Everything else is fixed.

> **Legal context notes below are informational.** They are included so the tool can point users at the right question, not so it can give an opinion. Every one of them renders in the UI alongside "confirm this with a professional." Do not remove that pairing.

---

## `config/clause-rubric.yaml`

```yaml
defaults:
  threshold: 0.62

items:
  - id: compensation
    label: Salary and how it is paid
    concern: pay
    severityIfMissing: high
    whyItMatters: Without a stated figure and payment date, your pay is whatever the offer email said, which is not part of the contract.
    ifMissingAsk: Can the exact CTC breakdown and monthly payment date be written into the agreement?
    queries: ["monthly salary and payment date", "annual compensation payable", "remuneration and salary structure"]
    keywords: [salary, remuneration, compensation, CTC, payable]

  - id: variable_pay
    label: Bonus and variable pay conditions
    concern: pay
    severityIfMissing: medium
    whyItMatters: Variable pay is often discretionary and forfeited if you resign before the payout date. If the conditions are not written down, you cannot rely on it.
    ifMissingAsk: What are the exact conditions and payout dates for variable pay, and what happens if I resign before them?
    queries: ["performance bonus and incentive payment conditions", "variable pay eligibility and payout"]
    keywords: [bonus, variable, incentive, performance pay]

  - id: probation
    label: Probation period and confirmation
    concern: termination
    severityIfMissing: medium
    whyItMatters: During probation, notice periods are usually much shorter and termination is easier. You need to know how long it lasts and how confirmation happens.
    ifMissingAsk: How long is probation, and is confirmation automatic or does it require a written letter?
    queries: ["probation period and confirmation of employment", "probationary term"]
    keywords: [probation, probationary, confirmation]

  - id: notice_employee
    label: Notice period you must give
    concern: exit
    severityIfMissing: high
    whyItMatters: This determines how long you are locked in after you decide to leave, and most new employers will not wait indefinitely.
    ifMissingAsk: What notice must I give to resign, and can I buy it out?
    queries: ["notice period required from employee on resignation", "employee shall give written notice"]
    keywords: [notice period, resignation, resign, notice in writing]

  - id: notice_employer
    label: Notice period the company must give
    concern: termination
    severityIfMissing: high
    whyItMatters: If the company can end your employment with less notice than you must give, the relationship is one-sided.
    ifMissingAsk: What notice will the company give me, and can it be shorter than mine?
    queries: ["company may terminate by giving notice", "employer notice of termination"]
    keywords: [company may terminate, employer shall give notice]

  - id: severance
    label: Severance or payment in lieu of notice
    concern: termination
    severityIfMissing: medium
    whyItMatters: Without this, termination can mean zero income from the day you are told, with no transition period.
    ifMissingAsk: If I am terminated without cause, is there any severance or payment in lieu of notice?
    queries: ["severance pay on termination", "payment in lieu of notice", "salary in lieu"]
    keywords: [severance, in lieu of notice, retrenchment compensation]

  - id: bond
    label: Employment bond or training cost recovery
    concern: lockin
    severityIfMissing: low
    whyItMatters: A bond requires you to pay the company if you leave early. Their absence is good news, so this check confirms you are not bonded.
    ifMissingAsk: Confirm in writing that there is no bond or training cost recovery.
    queries: ["employment bond minimum service period", "training cost recovery on early exit", "liquidated damages if employee leaves"]
    keywords: [bond, minimum service, liquidated damages, training cost, service agreement]

  - id: non_compete
    label: Non-compete after you leave
    concern: future_work
    severityIfMissing: low
    whyItMatters: Restricts where you can work after leaving. Its absence is good news; this check confirms it.
    ifMissingAsk: Confirm there is no post-employment restriction on where I can work.
    queries: ["shall not join competitor after termination", "non-compete restriction period"]
    keywords: [non-compete, competing business, shall not engage, competitor]

  - id: non_solicit
    label: Non-solicitation of employees and clients
    concern: future_work
    severityIfMissing: low
    whyItMatters: Usually enforceable and reasonable, but you should know its duration before you plan a move with colleagues.
    ifMissingAsk: How long does the non-solicitation last and does it cover clients I never worked with?
    queries: ["shall not solicit employees or clients", "non-solicitation period"]
    keywords: [solicit, induce, entice away]

  - id: confidentiality
    label: Confidentiality and how long it lasts
    concern: ip
    severityIfMissing: medium
    whyItMatters: Perpetual confidentiality on broadly defined information can restrict what you say about your own work for the rest of your career.
    ifMissingAsk: What exactly counts as confidential, and does the obligation end?
    queries: ["confidential information obligations", "shall not disclose proprietary information"]
    keywords: [confidential, proprietary, non-disclosure]

  - id: ip_assignment
    label: Who owns what you create
    concern: ip
    severityIfMissing: high
    whyItMatters: Broad assignment clauses can capture work you do on weekends on your own machine.
    ifMissingAsk: Is IP assignment limited to work done in the course of employment and using company resources?
    queries: ["assignment of intellectual property to company", "inventions and works made during employment"]
    keywords: [intellectual property, inventions, assign, works, copyright]

  - id: prior_inventions
    label: Carve-out for work you already own
    concern: ip
    severityIfMissing: high
    whyItMatters: Without a carve-out, your existing side projects and open-source work can be swept into company ownership.
    ifMissingAsk: Can we add a schedule listing my existing projects as excluded from IP assignment?
    queries: ["prior inventions excluded from assignment", "pre-existing intellectual property of employee"]
    keywords: [prior invention, pre-existing, excluded works, Schedule of inventions]

  - id: moonlighting
    label: Side projects and outside work
    concern: future_work
    severityIfMissing: medium
    whyItMatters: Determines whether freelancing, teaching or open-source contribution is a breach of contract.
    ifMissingAsk: Is written permission needed for unpaid open-source or teaching work?
    queries: ["shall not engage in other employment or business", "exclusivity of service"]
    keywords: [moonlighting, other employment, whole time, exclusively]

  - id: hours
    label: Working hours, shifts and on-call
    concern: pay
    severityIfMissing: medium
    whyItMatters: Open-ended availability clauses with no overtime provision mean unlimited unpaid hours.
    ifMissingAsk: What are the standard hours, and is there compensation for on-call or night shifts?
    queries: ["working hours and shift timings", "employee may be required to work additional hours"]
    keywords: [working hours, shift, overtime, on-call, roster]

  - id: leave
    label: Leave entitlement
    concern: pay
    severityIfMissing: medium
    whyItMatters: Leave types, carry-forward and encashment rules decide what you actually get and what you lose on exit.
    ifMissingAsk: How many days of each leave type, and is unused leave carried forward or encashed?
    queries: ["annual leave entitlement and carry forward", "casual sick and earned leave"]
    keywords: [leave, holiday, vacation, encashment, carry forward]

  - id: statutory_benefits
    label: PF, gratuity and insurance
    concern: pay
    severityIfMissing: medium
    whyItMatters: These are significant parts of total compensation and should be stated rather than assumed.
    ifMissingAsk: Are PF, gratuity and medical insurance applicable, and are they inside or on top of my CTC?
    queries: ["provident fund gratuity and insurance benefits", "statutory benefits applicable"]
    keywords: [provident fund, PF, gratuity, ESIC, insurance, mediclaim]

  - id: location_transfer
    label: Work location and transfer rights
    concern: exit
    severityIfMissing: medium
    whyItMatters: A broad transfer clause can move you to another city with little notice, and refusing may count as resignation.
    ifMissingAsk: Can I be transferred to another city, and what notice and support would I get?
    queries: ["place of posting and transfer to any location", "company may transfer the employee"]
    keywords: [transfer, posting, location, deputation, branch]

  - id: governing_law
    label: Governing law, jurisdiction and arbitration
    concern: exit
    severityIfMissing: medium
    whyItMatters: Decides which city you would have to litigate or arbitrate in if something goes wrong, which is a real cost.
    ifMissingAsk: Which courts have jurisdiction, and where would arbitration be seated?
    queries: ["governing law and exclusive jurisdiction of courts", "disputes referred to arbitration seated at"]
    keywords: [jurisdiction, governing law, arbitration, courts at]

  - id: amendment
    label: How the contract can be changed
    concern: exit
    severityIfMissing: medium
    whyItMatters: A clause letting the company change terms unilaterally makes every other clause provisional.
    ifMissingAsk: Can terms be changed without my written consent?
    queries: ["company reserves the right to amend the terms", "policies may be modified at the discretion of the company"]
    keywords: [amend, modify, sole discretion, reserves the right, vary]

  - id: exit_process
    label: Full and final settlement and relieving letter
    concern: exit
    severityIfMissing: high
    whyItMatters: Without stated timelines, your relieving letter and final settlement can be delayed, which blocks your next job.
    ifMissingAsk: Within how many days of my last day will I receive the relieving letter and full and final settlement?
    queries: ["full and final settlement on separation", "relieving letter and experience certificate", "handover and clearance on exit"]
    keywords: [full and final, relieving letter, clearance, settlement, handover]
```

---

## `config/risk-rules.yaml`

Each rule fires only if it can attach a clause citation. `when` is evaluated by `lib/rules.ts` against `VerifiedFields`. Keep the expression language tiny: field, operator, literal, plus `and`.

```yaml
rules:
  - id: long_notice
    when: "noticePeriodEmployee.value > 90"
    severity: high
    concern: exit
    title: "You must give {noticePeriodEmployee.value} days notice to resign"
    explanation: "Most new employers expect you to join within 30 to 60 days. A longer notice period can cost you offers."
    benchmark: "Common range in Indian tech roles: 30–90 days"
    suggestedQuestion: "Can the notice period be reduced to 60 days, or can I buy out the balance?"
    evidenceFrom: noticePeriodEmployee

  - id: asymmetric_notice
    when: "noticePeriodEmployer.value < noticePeriodEmployee.value"
    severity: high
    concern: termination
    title: "The company can end your employment faster than you can leave"
    explanation: "You must give {noticePeriodEmployee.value} days; the company only gives {noticePeriodEmployer.value}."
    suggestedQuestion: "Can the notice periods be made equal for both sides?"
    evidenceFrom: [noticePeriodEmployee, noticePeriodEmployer]

  - id: bond_penalty
    when: "bondPresent.value == true and bondPenaltyAmount.value != null"
    severity: high
    concern: lockin
    title: "You owe money if you leave early"
    explanation: "Leaving before the bond period ends triggers a payment of {bondPenaltyAmount.value}."
    legalNote: "Indian courts have treated recovery of genuine, documented training costs differently from penalties. Whether an amount is enforceable depends on the facts — worth confirming with a lawyer before signing."
    suggestedQuestion: "What actual training costs does this amount represent, and does it reduce over the bond period?"
    evidenceFrom: [bondPresent, bondPenaltyAmount]

  - id: long_bond
    when: "bondDurationMonths.value > 24"
    severity: high
    concern: lockin
    title: "Long lock-in period of {bondDurationMonths.value} months"
    explanation: "You are committing a substantial part of your early career before you know whether the role suits you."
    suggestedQuestion: "Can the bond period be shortened, or the amount pro-rated month by month?"
    evidenceFrom: bondDurationMonths

  - id: non_compete_long
    when: "nonCompeteMonths.value > 12"
    severity: medium
    concern: future_work
    title: "{nonCompeteMonths.value}-month restriction on joining competitors"
    explanation: "This clause would restrict where you can work after leaving."
    legalNote: "Section 27 of the Indian Contract Act, 1872 makes agreements in restraint of trade void, and Indian courts have generally declined to enforce post-employment non-competes. A clause can still be signed, and disputes still cost time and money — confirm the position with a lawyer."
    suggestedQuestion: "Is this restriction limited to named competitors and a defined role, and how would it be enforced?"
    evidenceFrom: nonCompeteMonths

  - id: unilateral_amendment
    when: "unilateralAmendment.value == true"
    severity: medium
    concern: exit
    title: "The company can change these terms without your consent"
    explanation: "A clause allowing unilateral amendment means the terms you are reviewing today can change later."
    suggestedQuestion: "Can changes to material terms require my written agreement?"
    evidenceFrom: unilateralAmendment

  - id: uncapped_indemnity
    when: "indemnityUncapped.value == true"
    severity: high
    concern: termination
    title: "Your financial liability has no stated limit"
    explanation: "An indemnity without a cap means there is no written ceiling on what you could be asked to pay."
    suggestedQuestion: "Can liability be capped at a fixed amount, and limited to wilful misconduct?"
    evidenceFrom: indemnityUncapped

  - id: no_prior_inventions
    when: "ipAssignmentPresent.value == true and priorInventionsCarveOut.value != true"
    severity: high
    concern: ip
    title: "Your existing side projects may be covered by the IP clause"
    explanation: "The agreement assigns intellectual property to the company but does not carve out work you created before joining."
    suggestedQuestion: "Can we attach a schedule listing my existing projects as excluded?"
    evidenceFrom: ipAssignmentPresent

  - id: variable_forfeit
    when: "variablePayForfeitOnExit.value == true"
    severity: medium
    concern: pay
    title: "Variable pay is forfeited if you resign before the payout"
    explanation: "Part of the CTC you were quoted is conditional on still being employed on the payout date."
    suggestedQuestion: "Is variable pay pro-rated if I leave partway through the year?"
    evidenceFrom: variablePayForfeitOnExit

  - id: termination_no_notice
    when: "terminationWithoutNoticeByEmployer.value == true"
    severity: high
    concern: termination
    title: "The company can terminate you immediately in some situations"
    explanation: "There are stated circumstances in which employment ends with no notice and no payment in lieu."
    suggestedQuestion: "Which specific situations allow immediate termination, and is there a process before it applies?"
    evidenceFrom: terminationWithoutNoticeByEmployer

  - id: long_probation
    when: "probationMonths.value > 6"
    severity: medium
    concern: termination
    title: "Probation lasts {probationMonths.value} months"
    explanation: "Notice periods and protections are usually weaker during probation, so a long probation extends that exposure."
    suggestedQuestion: "Is confirmation automatic at the end of probation, or does it require a letter?"
    evidenceFrom: probationMonths

  - id: distant_arbitration
    when: "arbitrationSeat.value != null"
    severity: medium
    concern: exit
    title: "Disputes would be heard in {arbitrationSeat.value}"
    explanation: "If a dispute arises, this is where you would have to pursue it, which affects the practical cost of doing so."
    suggestedQuestion: "Can the seat be changed to my place of work?"
    evidenceFrom: arbitrationSeat

  - id: injection_text
    when: "special:injection_detected"
    severity: info
    concern: ip
    title: "This document contains text that appears aimed at automated readers"
    explanation: "One or more clauses contain phrasing designed to influence AI tools reading the document. It has been ignored, and you should read that section yourself."
    suggestedQuestion: "Why does this document contain instructions addressed to software?"
    evidenceFrom: special
```

---

## Concern → tag mapping for ranking

```ts
const CONCERN_LABELS: Record<Concern, string> = {
  exit:        "Leaving the job",
  lockin:      "Being locked in",
  future_work: "My next job and side work",
  pay:         "Pay and benefits",
  ip:          "Who owns what I build",
  termination: "Being let go",
};
```

The onboarding screen shows these six, the user picks up to three, and both the rubric report and the findings list sort by concern match first. That is the whole personalisation feature — small, visible, and directly responsive to the point the judges made about different users caring about different things.
