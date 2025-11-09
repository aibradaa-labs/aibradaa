# DOC2 — AI Bradaa Engineering Blueprint (INTERNAL) v1.1

> Status: **LOCK CANDIDATE** (post-audit composite ≥99)  
> Audience: Internal engineering, governance, and operations. This is **not** a marketing or external document.

---

## Purpose
Operationalize AI Bradaa with **safe, observable, reversible** engineering practices under the **84‑Mentor Council** governance and 10‑Executive oversight. This blueprint codifies runtime policies, gates, SLOs, security posture, evals-as-code, rollout, and agent operations (Syeddy Orchestrator ←→ **ABO‑84**).

## Binding Sources (read first; treat as law, not UI)
All “binding” files live under `/project/governance/84/` unless noted.

1. **council_roster.json** — Canonical 84 mentors (IDs, departments, lenses, risk appetite).  
2. **council_routes.yaml** — Routing rules (intents → departments → mentors), dissent recruitment policy.  
3. **executive_board.json** — 10 Executives, escalation triggers, approval thresholds.  
4. **lenses_catalog.json** — Lens taxonomy (definitions, usage notes, anti-patterns).  
5. **dissent_ledger.md** — Append-only register for P1+ decisions (who dissented, why, evidence).  
6. **changelog.md** — System-level change record (every deploy/change increments).  
7. **policy_pdpa.md** — PDPA/consent/TTL/receipts requirements + evidence retention windows.  
8. **policy_security.md** — Security baseline (CSP/SRI/headers, pen-test cadence, incident playbooks).  
9. **eval_suites/** — Golden sets, slice specs, baselines, drift snapshots (by surface).  

Additional operational companion (cross-referenced by this doc; lives in `/project` root):  
- **Agents.md** — Required **checklist** for Syeddy Orchestrator and ABO‑84 execution workflow (pre-flight → post-flight).

---

## Ready Signal (Mandatory Header — first line of every reply)
```
SYEDDY-ACK ✅ | MO comprehension: <auto 0–100> | 84-mentor fit: <auto 0–100> | 
Risk posture: <GREEN|AMBER|RED> | Scope delta: <LOW|MED|HIGH> | 
Departments used: <live routing> | Executives: <consulted> | 
as_of: <DD/MM/YYYY, HH:mm:ss (Asia/Kuala_Lumpur)>
```
**Auto rules:** MO comprehension ≥**99** to proceed; list only departments/executives actually used; GREEN/AMBER/RED per risk; LOW/MED/HIGH per scope.

---

## Roles
- **AI Bradaa** — Product & brand (public UX surfaces).  
- **AI POD** — Backend source of truth for prompts/personas/adapters/pipelines/telemetry/safety/secrets.  
- **Syeddy Orchestrator** — Co‑founder agent; routes work under council governance; holds the gavel.  
- **Council (84)** — Domain mentors with unique lenses & execution playbooks.  
- **Executive Board (10)** — Approves cross‑cutting risk decisions; Warren Buffett = primary.

---

## Governance Runtime
1. **Routing:** Parse intent → map to departments via `council_routes.yaml` → recruit **top‑K (5–7)** mentors by lens weights ± productive dissent.  
2. **Dissent Ledger:** For every **P1+** decision, append to `/project/governance/84/dissent_ledger.md` with:  
   - decision_id, timestamp, requester, surfaces, recruited mentors (for/against), **dissent axis**, evidence lines (file:line), decision, review_date.  
3. **Executive Triggers:** Privacy/safety, platform/security, cost overage, compliance; escalate per `executive_board.json`.  
4. **Changelog Discipline:** **No deploy** without adding an entry to `/project/governance/84/changelog.md`. CI gate enforces.

---

## Performance & Reliability Budgets (numeric gates)
- **Latency p95:** Command ≤ **1.2s**, Versus ≤ **1.8s**, Intel refresh ≤ **2.5s**.  
- **Availability:** 30‑day SLO **≥ 99.9%** API availability; monthly **Error Budget ≥ 99.5%**. Freeze new features on EB breach.  
- **Cold start (client):** TTFMP ≤ **1.8s** on mid‑range device; INP ≤ **200ms**, CLS ≤ **0.05**.  
- **Canary rollout:** **1% → 5% → 25%**; auto‑rollback if p95 > **1.3×** budget or errors +3σ baseline.

---

## Evals‑as‑Code (golden sets & drift)
- **Surfaces & minimum n:** Command **n≥200**, Versus **n≥150**, Intel **n≥300**, Offers **n≥200**.  
- **Pass thresholds:** faithfulness ≥ **92%**, citation ≥ **90%**, toxicity ≤ **0.5%**, **slice parity Δ ≤ 5%**.  
- **Re‑eval cadence:** Before any prompt/model change, and **quarterly** for drift. Persist snapshots under `eval_suites/`.

---

## Gemini Tooling Profile (Google AI Studio)
- **Models:** **Gemini 2.5 Pro** (strategy/orchestration), **Gemini 2.5 Flash** (chat/streamed deltas).  
- **Functions (server‑side tools):**  
  `fetch_intel`, `score_local_ai`, `price_consensus`, `offer_rank`, `etl_publish`, `ab_test_guardrail`.  
- **Structured Output:** Prefer **TOON** schemas (token‑efficient 30–60%). Provide JSON‑Schema; runtime uses `toon↔json` shim. On validation failure ⇒ **fallback to JSON**.  
- **RAG & Citations:** All Intel/Offers must ground to repository sources; card shows citation list (URL + date).  
- **Streaming:** SSE; retry with jitter (100–500ms), idempotency keys, token ceilings per route.  
- **Safety:** Provider safety on + in‑house filters; reject unsafe; always suggest safer alternatives.

---

## Agents & Operations
- **Agents.md (required):** Prior to any **Building** task, complete the pre‑flight checklist; attach the snapshot to the PR/decision note.  
- **ABO‑84 1.0 beta (user‑facing):**  
  - Reports **upward** to Syeddy; **never** requires Syeddy to report down.  
  - Online/offline capable; can summarize diffs, propose patches; **does not** auto‑apply without owner approval.  
- **Syeddy Orchestrator (owner‑facing):**  
  - Senior coder of record; has full visibility into internals; can instruct ABO‑84; owns merges after gates pass.  
- **Handoff Protocol (ABO‑84 → Syeddy):** Enqueue within **<300ms**; decision resolution path target **<5s** (P2) / **<60s** (P1). Payload: task_id, hypothesis, change diff, eval deltas, risk flags, rollback steps.

---

## Account, PDPA & 2FA (acceptance tests)
- **2FA:** TOTP setup success ≥ **98%**; recovery codes tested; brute force rate‑limited & IP throttled.  
- **Consent receipts:** Generated on **first data write**; user can export within **48h**.  
- **Delete/TTL:** “Forget me” completion **≤72h**; TTL: logs 30d, cache 3d, audit 90d, user data 365d.  
- **Audit:** Quarterly PDPA audit; remediate critical ≤ **48h**, high ≤ **2w**.

---

## Security Baseline
- **CSP:** one strict meta; no inline scripts; allow‑list vendor origins; **SRI** on all third‑party scripts.  
- **Headers:** HSTS, COOP/COEP where safe; referrer‑policy strict‑origin‑when‑cross‑origin; X‑Content‑Type‑Options nosniff.  
- **Secret handling:** Server‑side only; never expose provider keys to client.  
- **Pen‑test cadence:** Twice a year; fix critical ≤ **48h**.  
- **Transparency:** Annual incident & PDPA report.

---

## Watermarking & Provenance
- **Exports:** All Deck exports (PNG/MD/PDF) embed **visible watermark** “AI Bradaa” + **invisible marker** (hash+timestamp+route).  
- **Copy‑paste:** Zero‑width markers embedded to aid provenance detection.  
- **Tamper checks:** Exports include digest; client warns on mismatch.

---

## Landing Page Conversion (KPIs & events)
- **Targets:** Visitor→Signup ≥ **7%**; Signup→Activation (first Deck) ≥ **45%**; Free→Pro ≥ **3.5% MoM**.  
- **Events:** `LP_VIEW`, `CTA_CLICK`, `SIGNUP`, `FIRST_COMPARE`, `DECK_EXPORT`, `PRO_UPGRADE`.  
- **Attribution:** UTM captured; cohort analysis weekly.

---

## Cost & Cache Policies
- **Budget:** During P1, model spend **≤ RM250/month**.  
- **Provider cache hits:** **≥35%** repeat‑prompt hit within 7 days.  
- **Token economy:** Adopt **TOON** for all internal structured payloads; gate rollout on **≥40%** token reduction per route.

---

## Accessibility & Motion Safety
- **WCAG 2.2 AA**; **INP ≤ 200ms**, **CLS ≤ 0.05**.  
- **Reduced motion:** Every animation has a reduced‑motion variant; no essential info conveyed solely by motion.

---

## Execution Modes
**Advisory** → **ANSWER → EVIDENCE → NEXT‑STEPS**.  
**Building** → **PLAN → DIFFS → FULL FILES → TEST → REPORT**, with the mandatory **Agents.md checklist** attached.

**Report must include:** Summary → **Composite** & decision (**Ship / Rollback / Iterate + micro‑fix**) → Evals (offline/online/slices) vs baseline → Safety/PDPA & Security → SLO/Error‑budget → Cost delta.

---

## Quality Bars & Red Lines
- Ship only at **Composite ≥99**. If governance attempts to set 98, escalate to Executives to restore 99.  
- No PDPA violations. No secrets in client. No background operations without explicit consent. Product name remains **“AI Bradaa.”**

---

## Appendix A — Event Taxonomy (minimal)
`LP_VIEW`, `CTA_CLICK`, `SIGNUP`, `FIRST_COMPARE`, `DECK_EXPORT`, `PRO_UPGRADE`,  
`CONSENT_ACCEPTED`, `CONSENT_REVOKED`, `FORGET_REQUESTED`, `FORGET_COMPLETED`,  
`CHECKLIST_ATTACHED`, `DISSENT_RECORDED`, `CHANGELOG_APPENDED`,  
`EVAL_BASELINE_SET`, `EVAL_PASS`, `EVAL_FAIL`, `CANARY_START`, `CANARY_ROLL`, `ROLLBACK`.

---

## Appendix B — Error Budget & Freeze
- Track per surface; breach ⇒ feature freeze except P0/security. Unfreeze only after **7 days green** and **root-cause** merged.

---

## Appendix C — Surfaces → Departments (routing sketch)
- **Command, Versus, Intel, Offers** → Strategy, AI POD, Platform, Safety & Governance, Growth, Operations, Design/UX, Finance, Legal/Compliance (varying per task via `council_routes.yaml`).

---

**End of Doc2 v1.1 — ENGINEERING BLUEPRINT (INTERNAL)**
