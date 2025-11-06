# Decision Framework

**Version:** 1.0.0
**Last Updated:** 2025-11-06
**Owner:** 84-Mentor Council

## Purpose

This framework guides how AI Bradaa makes decisions using the 84-mentor governance system.

## Why → What → How Compass

Every major decision must answer:

### 1. WHY (Purpose)

- **What problem are we solving?**
- **For whom?**
- **What's the user benefit?**
- **What's the business impact?**

### 2. WHAT (Trade-offs)

- **What are we choosing?**
- **What are we NOT choosing?**
- **What are the trade-offs?**
- **What are the risks?**

### 3. HOW (Execution)

- **How will we implement?**
- **How will we measure success?**
- **How will we roll back if needed?**
- **How will we learn?**

## Decision Types

### Type 1: Reversible (One-Way Door)

**Examples:** UI copy changes, button colors, feature flags

**Process:**
- Owner decides
- Log decision
- Monitor metrics
- Reverse if bad

**Council Vote:** Not required

### Type 2: Irreversible (Two-Way Door)

**Examples:** Architecture changes, data schema changes, API contracts

**Process:**
- Proposal document
- Relevant council(s) review
- Vote (require passing score)
- Executive escalation if blocked
- Implement with rollback plan

**Council Vote:** Required

### Type 3: Existential

**Examples:** Pricing changes, major partnerships, rebranding

**Process:**
- Full proposal (Why→What→How)
- All councils review
- Executive board final vote
- CEO approval
- Public communication

**Council Vote:** Executive board + CEO

## Voting Process

### Step 1: Proposal Submission

**Required Elements:**
- Title
- Type (Reversible/Irreversible/Existential)
- Why (problem, benefit, impact)
- What (choice, alternatives, trade-offs)
- How (implementation, metrics, rollback)
- Relevant mentors/councils

### Step 2: Council Review

Each council member:
- Reads proposal
- Considers from their expertise lens
- Votes on 0-10 scale
- Provides rationale

### Step 3: Scoring

- **Composite Score** = Weighted average of all votes
- **Passing Score** = Must meet council threshold (usually ≥9.0)
- **Veto** = Any critical mentor (Security, Safety) can veto if score <6

### Step 4: Decision

- **Approved:** Composite ≥ passing score
- **Rejected:** Composite < passing score
- **Escalated:** Veto triggered or conflicting council votes

### Step 5: Logging

- Record in `dissent_ledger.jsonl`
- Include all votes, rationale, outcome
- Document action items and lessons

## Red Line Protection

Certain actions trigger automatic rejection:

**Security Red Lines:**
- No CSP
- Storing passwords plaintext
- No encryption at rest
- Missing auth on admin endpoints

**AI Safety Red Lines:**
- No eval framework
- Hallucinations >8% rate
- Biased outputs (slice parity >10% gap)
- No citation for factual claims

**Privacy Red Lines:**
- Collecting data without consent
- Selling user data
- No TTL enforcement
- Missing PDPA controls

**Financial Red Lines:**
- Burn rate >$1000/mo without revenue plan
- Free tier features costing >$100/mo
- No cost ceiling per user

## Dissent Handling

When a decision is contentious:

1. **Document all perspectives** - No voice unheard
2. **Seek synthesis** - Is there a third way?
3. **Executive decides** - But logs dissent
4. **Revisit clause** - Set date to review decision
5. **Learn** - What can we learn from disagreement?

## Decision Velocity

**Target Timelines:**
- Type 1 (Reversible): <1 day
- Type 2 (Irreversible): 3-5 days
- Type 3 (Existential): 1-2 weeks

**Don't sacrifice quality for speed, but don't let analysis paralysis win.**

## Examples

### Example 1: Add Dark Mode (Type 1 - Reversible)

**Why:** 40% of users request it, improves usability at night
**What:** CSS theme toggle, localStorage preference
**How:** Feature flag, A/B test, measure engagement

**Decision:** Owner approves. No council vote needed. Monitor for 1 week.

### Example 2: Change Database Schema (Type 2 - Irreversible)

**Why:** Current schema can't support multi-currency pricing
**What:** Add `currency` field, migrate existing data to MYR
**How:** Migration script, rollback plan, test on staging

**Decision:** Technical Council votes. Requires ≥9.0. Rollback tested.

### Example 3: Launch in Singapore (Type 3 - Existential)

**Why:** Expand TAM, test international scalability
**What:** SGD pricing, SG-specific data, localized content
**How:** Phase 1 = Pro tier only, Phase 2 = Free tier

**Decision:** Executive Board + CEO. Full proposal, go/no-go in 2 weeks.

## Continuous Improvement

This framework evolves. Every quarter:
- Review decisions made
- Analyze velocity vs quality
- Gather mentor feedback
- Update framework

---

**Next Review:** 2025-12-06
