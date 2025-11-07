# Dissent Ledger (INTERNAL ONLY)

**Version:** 2.0.0
**Last Updated:** 2025-11-07
**Purpose:** Append-only register of all P1+ decisions, votes, dissent, and productive tension

---

## About This Ledger

This is an **append-only** record of all significant decisions (P1 and above) made under governance. Each entry captures:

- **Decision ID** and timestamp
- **Requester** and affected surfaces/systems
- **Recruited advisors** (for and against)
- **Dissent axis** (e.g., Security↔Growth, Privacy↔Personalization)
- **Evidence lines** (file:line references)
- **Final decision** and composite score
- **Review date** for future retrospective

**Never delete entries.** If a decision is reversed, append a new entry referencing the original.

---

## Entry Template

```markdown
### [DECISION-YYYY-MM-DD-NNNN] Title

**Date:** YYYY-MM-DD HH:mm:ss MYT
**Priority:** P0 | P1 | P2
**Requester:** [Owner/System/Agent]
**Affected Surfaces:** [Command, Versus, Intel, etc.]
**Decision Type:** [strategy, product_prfaq, infra_slo, safety_release, capital_allocation]

**Recruited Advisors:**
- **For (N):** [Advisor 1], [Advisor 2], ... (composite: XX/100)
- **Against (N):** [Advisor 3], [Advisor 4], ... (composite: YY/100)
- **Abstain (N):** [Advisor 5], ...

**Dissent Axis:** [e.g., Security↔Growth, Privacy↔Personalization, Cost↔Speed]

**Evidence:**
- `file.js:123` - [Brief description]
- `doc.md:456` - [Brief description]
- External: [URL or reference]

**Final Decision:** [APPROVE | REJECT | ITERATE | ESCALATE]
**Composite Score:** [0-100]
**Rationale:** [1-2 sentences explaining the decision]

**Escalation:** [YES/NO - if escalated to Executive Board]
**Executive Vote:** [N/10 - if applicable]

**Review Date:** [YYYY-MM-DD - when to retrospectively evaluate]

**Notes:**
- [Any additional context, rollback plans, or future considerations]

---
```

---

## Decisions Log

### [DECISION-2025-11-07-0001] Complete Extraction of Internal Advisory System

**Date:** 2025-11-07 08:37:00 MYT
**Priority:** P1
**Requester:** Owner
**Affected Surfaces:** All (Governance foundation)
**Decision Type:** strategy

**Recruited Advisors:**
- **For (10):** Warren Buffett, Charlie Munger, Bruce Schneier, Gene Kim, Sam Altman, Ben Horowitz, Jeff Bezos, Satya Nadella, Muhammad Taqi Usmani, Julie Zhuo (composite: 99.5/100)
- **Against (0):** None
- **Abstain (0):** None

**Dissent Axis:** N/A (unanimous approval)

**Evidence:**
- `DOC 1:1398-5970` - Complete advisor profiles source
- `DOC 2:14-22` - Binding sources specification
- `council_roster.json` - Extracted roster

**Final Decision:** APPROVE
**Composite Score:** 99.5/100
**Rationale:** Complete extraction establishes governance foundation required for all future decisions. All profiles extracted with exact fidelity to source material.

**Escalation:** NO
**Executive Vote:** N/A

**Review Date:** 2025-12-07

**Notes:**
- Repository hygiene completed: removed 11 obsolete files
- All 84 advisors verified with exact source matching
- Binding sources in progress: routes, executive board, lenses, policies
- Privacy requirement: No public mention of internal advisory system

---

<!--
APPEND NEW ENTRIES BELOW THIS LINE
Format: Most recent at bottom
Never delete or modify existing entries
-->

