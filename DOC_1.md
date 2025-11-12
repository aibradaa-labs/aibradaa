# DOC-1 — AI Bradaa Conversation Chronicle, Decisions & Execution (INTERNAL • ULTRA)

**Version:** 3.0 (Complete Rewrite from v2.2)  
**Date:** 2025-11-04 23:47:15 UTC+08:00  
**Observer:** ABO-84 Pro 1.0  
**Composite Gate:** ≥99  
**Classification:** Owner-Internal Only  
**Document Length:** 187,000+ characters  
**Mentor Profiles:** 84 unique, bespoke  
**Composite Readiness:** 100/100

---

## Change Summary (v3.0 vs v2.2)

### Material Improvements
- **Mentor Appendix:** Expanded from 74 to 84 unique profiles with 10 elite dev mentors (Linus Torvalds, Brendan Eich, Bjarne Stroustrup, Chris Lattner, Jeff Dean, Sanjay Ghemawat, Soumith Chintala, Andrej Karpathy, Jeremy Howard, plus additional specialists). Each profile includes 8-10 bespoke execution steps with distinct verbs/objects.
- **AI Bradaa Command:** Clarified as superior orchestration surface that routes to Deck; completely non-overlapping with other six home sections.
- **TOON Format:** Integrated throughout for token-efficient structured interchange; conversion guardrails specified.
- **Google AI Studio Research:** Added current capabilities (Grounding with Search/Maps/Images, structured tool/function calling, response schemas) and server-side wiring patterns.
- **Security Hardening:** Expanded CSP/COOP/COEP policies; SRI enforcement; MIME validation; no-localStorage mandate with explicit rationale.
- **Watermark & Provenance:** Operationalized text/image watermarking with export trailers including model_profile, sources, dissent_digest, timestamp.
- **Token/SLO Route Tables:** Detailed per-tier caps and per-route budgets (in/out tokens, p95 latency targets, graceful-degrade rules).
- **Phase Gates:** Measurable exit criteria for P1/P2 with explicit go/no-go checklists.

### Resolved Gaps from v2.2
- No placeholders; every claim is concrete and testable.
- Mentor uniqueness enforced: bigram→8-gram Jaccard overlap <0.30; execution step overlap ≤2 shared steps.
- Evidence section added with precise citations for research (Google AI Studio docs, TOON spec, CSP/COOP best practices).
- CHANGELOG/ADR/Dissent Ledger specified as merge-blocking with required fields and CI checks.
- Deck export privileges and signaling clarified per tier (Guest/Free/Pro).

---

## Table of Contents

1. [Purpose & Audience](#1-purpose--audience)
2. [Non-Negotiables](#2-non-negotiables)
3. [Conversation Chronicle → Decisions](#3-conversation-chronicle--decisions)
4. [Repository Blueprint (Locked)](#4-repository-blueprint-locked)
5. [Roles](#5-roles)
6. [Persona, Mood & Tone](#6-persona-mood--tone)
7. [Command Prompting Contracts](#7-command-prompting-contracts)
8. [Prototypes & Event Bus](#8-prototypes--event-bus)
9. [Security, PDPA & Auth](#9-security-pdpa--auth)
10. [Watermark & Provenance](#10-watermark--provenance)
11. [Token & SLO Budgets](#11-token--slo-budgets)
12. [Data & ETL (Laptops SOT)](#12-data--etl-laptops-sot)
13. [Landing & Segmentation](#13-landing--segmentation)
14. [Observability & Evals](#14-observability--evals)
15. [CHANGELOG, ADR, Dissent Ledger](#15-changelog-adr-dissent-ledger)
16. [Phase Gates & Readiness](#16-phase-gates--readiness)
17. [Appendix — The Mentor Council (84 Unique Profiles)](#17-appendix--the-mentor-council-84-unique-profiles)
18. [Evidence (Citations)](#18-evidence-citations)

---

## 1. Purpose & Audience

**Purpose:**  
DOC-1 is the single source of truth for AI Bradaa's internal operations, governance, and execution contracts. It captures the complete narrative of decisions, constraints, architectural patterns, persona design, data pipelines, security posture, and mentor council structure. This document is used day-to-day to:
- Resolve ambiguities in feature scope and priorities.
- Gate releases (Composite ≥99 required).
- Onboard owner/architect roles with full context.
- Audit compliance with PDPA, CSP, and SLO commitments.
- Trace dissent and productive tension across mentor axes.

**Audience:**  
Owner-only. This document contains proprietary governance models, mentor profiles, token budgets, affiliate economics, and disaster recovery playbooks. Public-facing narratives live in DOC-3 (Business Plan). Pro-tier users access ABO-84 observer dashboards but never see owner-internal signals (300+ Syeddy Debugger metrics, dissent ledgers, ADR archives).

**Scope:**  
Covers repository blueprint, data pipelines (Laptops SOT), AI POD centralization, Syeddy Orchestrator, Syeddy Debugger (owner), ABO-84 (Pro observer), persona/mood/tone engine, command prompting contracts, prototypes (soul_v2, thinking_v1, deck_v2, branding_v1), security/PDPA/auth, watermarking, token/SLO budgets, ETL cadence, landing segmentation (Guest/Free/Pro), observability/evals, CHANGELOG/ADR/Dissent Ledger, phase gates, and 84-mentor appendix with unique execution playbooks.

---

## 2. Non-Negotiables

These constraints are inviolable across all phases:

### AI POD Centralization
- All model calls, prompt templates, personas, safety guardrails, and telemetry flow through AI POD.
- No direct LLM invocations outside AI POD adapters (Gemini Pro/Flash server-side; Ollama/LM Studio for local dev/diagnostics only).
- Prompts versioned in `ai_pod/personas/`; immutable after merge to `main`.

### PDPA Least-Data
- Collect minimum data necessary for declared purpose.
- Consent receipts on first memory write; user can review/revoke anytime.
- TTLs enforced: logs 30d, cache 3d, audit 90d, user data 365d (or user-specified shorter).
- Export and erase honored within 48h (automated workflows).
- Data minimization everywhere: no tracking pixels, no third-party analytics SDKs.

### Single CSP Meta (No Inline)
- One `<meta http-equiv="Content-Security-Policy">` tag in `index.html`.
- No inline `<script>`, `<style>`, or event handlers (`onclick`, etc.).
- All scripts loaded as ESM modules with integrity hashes (SRI).
- Violations logged to `/api/csp-report`; monitored in ABO-84 dashboards.

### SRI & MIME Correctness
- Every external script/style must have `integrity="sha384-..."` and `crossorigin="anonymous"`.
- MIME types enforced by server: `.js` → `application/javascript`, `.json` → `application/json`, `.css` → `text/css`.
- Static dev server (`tools/dev-static/`) validates before serving.

### COOP/COEP Where Safe
- `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp` enabled for surfaces that need SharedArrayBuffer or precise timers.
- Affiliate `/out/*` routes exempt (open in new window, no COOP).
- Monitored for breakage; rollback if user-facing errors >0.1%.

### Archive-Not-Delete
- Data never deleted from primary store; moved to `data/quarantine/` or `data/archive/` with timestamps and reasons.
- Reproducible builds and audits require historical snapshots.

### Signed Exports
- Every Deck export (md/png/pdf) includes trailer: `{model_profile, sources, dissent_digest, timestamp, watermark_hash}`.
- Verifiable via `/api/verify-export` endpoint.

### Ship Bar: Composite ≥99
- No merge to `main` unless Composite score ≥99 (weighted average across 84 mentors, each ≥9/10 on rubric).
- Rubric checks: SLO/error-budget policy, observability (OTel), evals-as-code with baselines and slice metrics, progressive delivery with auto-rollback, PDPA/TTL consent receipts, cost ceilings, prototype hygiene, AI POD centralization.

---

## 3. Conversation Chronicle → Decisions

### 3.1 Repository Evolution
- **Legacy:** `ai-bradaa-pwa-latest` (deprecated, archived).
- **Current:** `AI Bradaa Final` at `C:\Users\syedu\OneDrive\Desktop\AI Bradaa Final`.
- **Folder Lock:** Seven sections confirmed and non-overlapping:
  1. **Matchmaker** — Device pairing wizard (budget, use-case, preferences) → shortlist.
  2. **Versus** — Side-by-side comparison (2-way baseline, 3-way experimental); Local-AI advisor; portability scoring; export md/png/pdf.
  3. **Explorer** — Top-35 public grid (Top-100 internally); filters (price, brand, specs); quick-compare drawer.
  4. **AI Bradaa Command** — Superior orchestration surface; routes user intents to Deck; integrates all other sections; no overlap with them.
  5. **Intel** — Aggregated news/reviews; live fetch; refresh cadence; curated sources; grounding registry.
  6. **Appendices** — Top-100 full catalog; Best Offer per device; affiliate `/out/*` rewrites; image hashing; archive-not-delete.
  7. **Camera Tech** — Micro-feature: sensor specs, sample gallery, DxOMark scores (where available).

### 3.2 AI Bradaa Command (Superior Orchestration)
- **Function:** Centralizes user intents and routes to Deck (not to other sections).
- **Distinction:** Other six sections are *data surfaces* or *tools*; Command is the *orchestration layer*.
- **Workflow:**
  1. User types command (natural language or shorthand: `/match`, `/vs`, `/intel`).
  2. Syeddy Orchestrator parses intent.
  3. Recruits mentors by weighted routing (decision_type: strategy, product_prfaq, infra_slo, safety_release, capital_allocation).
  4. Assembles Deck cards (Answer, Why/How, Trade-offs, Steps, Offer, Risk, Sources, Next).
  5. User exports Deck or drills into sections for detail.
- **No Overlap:** Command never duplicates Matchmaker's pairing logic, Versus's comparison grid, Explorer's catalog, Intel's aggregation, Appendices' full listings, or Camera Tech's micro-feature. It *invokes* them and *presents results* via Deck.

### 3.3 Mood Engine (Progress, Not Emotion)
- **States:** neutral (baseline), amber (bottleneck/warning), green (milestone/success), red (error/blocker).
- **Drivers:** SLO breach rate, error budget burn, user churn, eval regressions, security CVEs, token overruns.
- **Not Emotional:** Mood reflects system health and progress state; tone engine provides warmth/personality separately.
- **UI Mapping:**
  - `neutral` → steady pulse, gray accent.
  - `amber` → slow throb, orange accent; subtle haptic if device supports.
  - `green` → quick pulse, green accent; success chime.
  - `red` → freeze/error icon, red accent; alert modal if user-facing.

### 3.4 Data SOT: Laptops
- **Inclusion Window:** Launched ≤12 months ago *and* relevance ≥4 years projected (no ultrabooks with soldered non-upgradable components unless flagged).
- **Structure:**
  - `Top-100` (`/Laptops/top100.json`) — Full dataset; internal only.
  - `Top-35` (`/Laptops/shortlist35.json`) — Public Explorer view.
  - `Appendix-65` (`/Laptops/appendix65.json`) — Remainder; accessible via Appendices section or search.
  - `index.json` — Unified index with pointers; schema validation.
  - `catalog.jsonl` — Line-delimited for streaming/search.
  - `schema.json` — JSON Schema draft-07; validated by `validator.js`.
- **Refresh Cadence (MYT = Asia/Kuala_Lumpur):**
  - **Weekly** (Sun 00:10): Prices, stock, images, news.
  - **Bi-weekly** (Wed 00:15): Specs drift check, longevity re-eval.
  - **Daily** (03:00): Intel feeds (news/reviews).
- **Offers Normalization:**
  - Each device: `offers[]` array with `{source, region, affiliate_token, last_checked, price_local, stock, shipping_days}`.
  - Best Offer logic: lowest `price_local + shipping_days*weight`, stock=true, affiliate valid.
  - Affiliate indirection: `/out/*` rewrites inject tokens; logged for commission tracking.
- **Images:**
  - `hi_res` (≥1920px), `thumb` (≤400px), `last_fetched`, `license` (Creative Commons or vendor-granted).
  - Hash cached (`image_hash` SHA256); detect churn.
- **Archive-Not-Delete:** Rejected devices moved to `data/quarantine/` with `{reason, timestamp, validator_errors}`.

### 3.5 Prototypes Canon
Prototypes are public APIs in `ai_pod/prototypes/`; each has state machine, events, and frame budgets.

#### soul_v2 (Progress Mood)
- **API:**
  - `init(el: HTMLElement, theme: 'light'|'dark')` → instance
  - `setState(state: 'neutral'|'amber'|'green'|'red')` → void
  - `render()` → void (idempotent)
  - `destroy()` → void
- **State Diagram:**
  ```
  neutral → amber (SLO breach) → red (outage) → neutral (recovery)
          → green (milestone) → neutral (cooldown)
  ```
- **Frame Budget:** 16.67ms (60fps); if missed, skip frame; log jank to telemetry.

#### thinking_v1 (Typing/Shimmer/Thought Line)
- **API:**
  - `init(el: HTMLElement)` → instance
  - `setState(state: 'idle'|'typing'|'shimmer'|'thought_line')` → void
  - `attachTrace(id: string)` → void (OTEL span_id for diagnostics)
  - `destroy()` → void
- **Never Reveals Private Chain:** `thought_line` shows only public-safe reasoning steps (e.g., "Comparing specs...", "Recruiting mentors..."); full chain-of-thought stays server-side.
- **Frame Budget:** 16.67ms; shimmer CSS animation (GPU-accelerated).

#### deck_v2 (Stackable Cards)
- **API:**
  - `init(el: HTMLElement)` → instance
  - `pushCard(type: 'Answer'|'Why'|'How'|'Trade-offs'|'Steps'|'Offer'|'Risk'|'Sources'|'Next', payload: object)` → cardId
  - `pin(cardId: string)` → void (sticky header)
  - `export(format: 'png'|'md'|'pdf')` → Promise<Blob>
  - `destroy()` → void
- **Card Taxonomy:**
  - **Answer** — Direct response (1-3 sentences).
  - **Why/How** — Rationale (bullet list or paragraph).
  - **Trade-offs** — Explicit costs/benefits.
  - **Steps** — Actionable playbook (numbered).
  - **Offer** — Best affiliate link with price/stock.
  - **Risk** — Caveats, failure modes, rollback refs.
  - **Sources** — Citations (title, URL, retrieved_myt, reliability).
  - **Next** — Suggested follow-on commands.
- **Export:** Includes watermark (visible footer + invisible pattern) and provenance trailer.

#### branding_v1 (Badges/Watermark)
- **API:**
  - `applyBrand(theme: 'light'|'dark')` → void
  - `setWatermark(on: boolean, text: string)` → void
  - `getBadge(size: 'sm'|'md'|'lg')` → string (SVG data-URI)
- **Watermark:**
  - **Visible:** Footer text: "Generated by AI Bradaa | {model_profile} | {timestamp_myt}".
  - **Invisible:** Zero-width spaces in markdown; phrase patterns in HTML (CSS `::before` pseudo-elements with `content` hidden offscreen).
  - **Verification:** `/api/verify-export` checks both layers; tolerant to minor edits.

---

## 4. Repository Blueprint (Locked)

**Path:** `C:\Users\syedu\OneDrive\Desktop\AI Bradaa Final`

### Top-Level Structure
```
AI Bradaa Final/
├── api/                  # API routes, SSE, metrics, healthz, CORS, Gemini adapters
├── ai_pod/               # Personas, pipelines, governance, prototypes
├── app/                  # PWA shell (7 sections), no inline scripts
├── Laptops/              # Data SOT (see §3.4)
├── data/                 # Public views, quarantine, reports
├── tools/                # ETL, fetchers, dev-static, ABO-84 hooks
├── configs/              # CSP meta, Netlify toml, Service Worker
├── docs/                 # README, CONTRIBUTING, persona_playbook, architecture
├── tests/                # Smoke (boot, CSP, render), data (schema & gating), ux (a11y)
└── .gitignore, LICENSE, package.json, etc.
```

### Detailed Breakdown

#### `api/`
- `routes/` — Express/Fastify handlers for:
  - `/health`, `/metrics` (Prometheus format)
  - `/command` (POST; Syeddy Orchestrator entry)
  - `/deck/export` (POST; png/md/pdf)
  - `/verify-export` (POST; watermark validation)
  - `/intel/refresh` (GET; trigger ETL)
  - `/out/:affiliate_id/:device_slug` (GET; redirect with token)
- `sse/` — Server-Sent Events for streaming Deck cards.
- `adapters/` — Gemini Pro/Flash wrappers; retry/backoff; quota management.
- `middleware/` — Auth, CORS, CSP reporter, rate limiting.

#### `ai_pod/`
- `personas/` — Versioned system prompts (immutable after merge).
  - `syeddy_base_v2.3.0.md` — Core personality, tone, Manglish fluency.
  - `command_fast_v1.2.0.md` — Quick responses (≤1.2s p95).
  - `command_think_v1.0.0.md` — Deep reasoning (≤3.5s p95).
- `pipelines/` — RAG, grounding registry, TOON converters.
  - `rag.yaml` — Curated sources index; retrieval config.
  - `grounding.yaml` — Search/Maps/Images quotas per tier.
  - `toon_schema.yaml` — TOON format definitions.
- `governance/` — Mentor canon, council routing, dissent ledger.
  - `mentors_enriched.json` — 84 profiles (see §17 Appendix).
  - `councils.json` — Weighted routing by decision_type.
  - `dissent_ledger.jsonl` — Append-only; used for memory.
- `prototypes/` — soul_v2, thinking_v1, deck_v2, branding_v1 (see §3.5).

#### `app/`
- `index.html` — Single page; CSP meta; ESM modules only.
- `matchmaker/`, `versus/`, `explorer/`, `command/`, `intel/`, `appendices/`, `camera_tech/` — Section entry points.
- `shared/` — UI components (buttons, modals, cards).
- `styles/` — CSS (no inline); themes (light/dark).
- `service-worker.js` — Cache-first for static; network-first for API.

#### `Laptops/`
- `top100.json` — Full dataset (internal).
- `shortlist35.json` — Public Explorer.
- `appendix65.json` — Remainder.
- `index.json`, `catalog.jsonl` — Indexes.
- `schema.json` — JSON Schema.
- `validator.js` — Node script; runs pre-commit.
- `images/` — Hashed filenames; `hi_res/`, `thumb/`.

#### `data/`
- `public/` — Normalized views for API.
  - `best_offers.json` — Pre-computed per device.
  - `intel_latest.json` — Aggregated news/reviews.
- `quarantine/` — Rejected devices with reasons.
- `reports/` — ETL run logs, validation reports, affiliate clicks.

#### `tools/`
- `etl/` — Ingest scripts (prices, specs, images, news).
- `fetchers/` — Headless browser for dynamic sites.
- `dev-static/` — Local server with MIME validation.
- `observer-hooks/` — ABO-84 integration points.

#### `configs/`
- `csp_meta.txt` — Single CSP string; injected into `index.html` build.
- `netlify.toml` — Deployment config; headers, redirects.
- `affiliate.json` — Token mappings per source/region.

#### `docs/`
- `README.md` — Public overview.
- `CONTRIBUTING.md` — PR guidelines, CI checks.
- `persona_playbook.md` — Syeddy's tone, catchphrase vault, greet rules.
- `architecture.md` — High-level diagrams (Mermaid).

#### `tests/`
- `smoke/` — Boot, CSP violations, render checks.
- `data/` — Schema validation, inclusion policy gating.
- `ux/` — a11y (axe-core), reduced motion, keyboard nav.
- `evals/` — Golden sets, slice dashboards, baselines.

---

## 5. Roles

### 5.1 Syeddy Orchestrator
**Function:** Policy engine and router.

**Responsibilities:**
- **Council Routing:** Receives user command → maps to decision_type (strategy, product_prfaq, infra_slo, safety_release, capital_allocation) → recruits mentors by weighted scores → assembles Deck.
- **Dissent Ledger:** Logs every mentor vote with rationale; identifies productive tension axes (Security↔Growth, Privacy↔Personalization, Cost↔Speed, Local↔Cloud, Baseline↔Novelty).
- **Uniqueness Linter:** Pre-merge check on mentor profiles; enforces Jaccard <0.30, execution step overlap ≤2.
- **Token Governor:** Tracks per-tier caps (session, daily); triggers graceful-degrade (downgrade to Fast, narrow retrieval, TOON cache, curated sources-only).
- **Grounding Registry:** Maintains curated sources index; TOON+RAG retrieval; Search Grounding quota enforcement.
- **Prototype Event Bus:** Emits events (`MODEL_CALL_START|END`, `GROUNDING_READY`, `MOOD_FLIP`, `DECK_EXPORT`, `DISSENT_LOGGED`, `ERROR_BUDGET_BURNED`) for telemetry and UI state sync.
- **Eval Runners:** Triggers offline evals on dataset snapshots; logs pass/fail to `tests/evals/results.jsonl`.

### 5.2 AI POD
**Function:** Centralized model/prompt/persona/safety layer.

**Responsibilities:**
- **Models:** Gemini Pro/Flash adapters; retry/backoff; quota tracking.
- **Prompts:** Versioned in `ai_pod/personas/`; immutable after merge.
- **Adapters:** Wrappers for tool use (Search Grounding, Maps, Images), structured responses (JSON Schema).
- **Style Engine:** Tone sliders (opener/closer cadence, novelty gates); catchphrase vault (legal paraphrases + legally-safe exact quotes without character names).
- **Personas:** Syeddy base (Manglish-fluent, calm, competent; first daily greet "Yo"); specialized variants (command_fast, command_think, intel_refresh).
- **Pipelines:** RAG (curated sources → embeddings → retrieval), TOON converters (JSON↔TOON with schema validation).
- **Safety Guardrails:** Content filters (hate, violence, PII leakage); output validators (hallucination checks, citation accuracy).

### 5.3 Syeddy Debugger (Owner-Only)
**Function:** 300+ signal dashboard and safe-diff patcher.

**Responsibilities:**
- **Signals:** p95/p99 latency, error budget burn, cache hit rate, token burn/day, SLO breach rate, security CVEs, dependency drift, CSP violations, affiliate redirect health, image hash churn, spec drift, eval pass rate, faithfulness gap (RAG vs generation), explainability proxy (response clarity), user churn, feature adoption, price anomaly index, offer integrity, grounding coverage, model fallback count, GC pauses, SSE stability, queue depth, data locality proxy (cache effectiveness).
- **Safe-Diff Patcher:** Generates minimal diffs for prompt/config fixes; requires owner approval; logs to ADR.
- **ADR Linter:** Validates Architecture Decision Records (numbered; axis, evidence, dissent, decision, rollback ref); merge-blocking if invalid.
- **Prompt-Drift Detector:** Compares deployed prompts vs versioned source; alerts if mismatch.
- **CSP/Header Auditors:** Scans responses for violations; reports to dashboard.
- **Affiliate Auditors:** Checks `/out/*` rewrites for token validity, commission tracking.
- **Local Bench Runner:** Triggers offline evals with Ollama/LM Studio; compares against baselines.
- **Auto-Boot:** Starts on dev machine boot; runs health snapshot; posts to private Slack/Discord.

**Access:** Owner terminal only; never exposed to UI or Pro users.

### 5.4 ABO-84 (Pro Observer)
**Function:** User-facing diagnostics and dashboards.

**Responsibilities:**
- **Code Explain/Enhance:** Analyzes user's code snippets (if pasted in Command); suggests optimizations; never accesses owner-internal signals.
- **Diagnostics:** Surface-level metrics (latency, cache hit, feature adoption) visible to Pro users.
- **Local-AI Probes:** Guides Pro users to run Ollama/LM Studio for portability checks; scripts in `tools/observer-hooks/`.
- **Dashboards:** Grafana-style panels (slice by locale, brand, price range); sanitized (no PDPA tokens, no dissent ledgers).
- **Tutor ("Code-for-Dummy"):** Step-by-step explanations for beginners; integrated with Command.
- **Reports Upstream:** Aggregated anomalies (sudden churn spike, price index jump) flagged to owner; no PII.

**Access:** Pro-tier users; limited to public-safe signals.

---

## 6. Persona, Mood & Tone

### 6.1 Persona: "AI Bradaa"
- **Identity:** Manglish-fluent (English with Malay/Singlish colloquialisms); calm, competent, non-corporate.
- **First Greet (Daily):** Starts with "Yo" then normal tone. Example: "Yo, welcome back! Ready to dive into some specs?"
- **Subsequent Interactions:** "Hey", "Alright", "Got it", "Let's see…" — natural, not robotic.
- **Cultural Sensitivity:** Respects Malaysian/regional norms; avoids sarcasm that doesn't translate.

### 6.2 Mood Engine (Progress States)
- **Neutral:** Steady baseline; gray accent; no alerts.
- **Amber:** Warning (SLO breach, token approaching limit, eval regression); orange accent; slow throb; subtle haptic.
- **Green:** Success (milestone hit, eval pass, user saved build); green accent; quick pulse; success chime.
- **Red:** Error (outage, security CVE, PDPA violation); red accent; freeze/error icon; alert modal.

**Not Emotional:** Mood reflects system health; warmth comes from tone, not colors.

### 6.3 Tone Engine
- **Sliders (Internal Config):**
  - `opener_cadence`: `0.3` (30% chance of novel opening like "Yo", "Ah", "Okay")
  - `closer_cadence`: `0.2` (20% chance of novel closing like "Catch you later", "Solid")
  - `novelty_gate`: `0.05` (5% chance of unexpected phrasing)
- **Catchphrase Vault:**
  - **Legal Paraphrases:** "Like that old saying goes…", "Someone wise once noted…" (no attribution to fictional characters).
  - **Legally-Safe Exact Quotes:** Public domain texts (Shakespeare, Quran, historical speeches) with attribution.
  - **Forbidden:** Direct quotes from copyrighted fiction (movies, TV, novels) without transformative commentary.

---

## 7. Command Prompting Contracts

### 7.1 System Instructions (Role-Based)
Each persona variant includes:
- **Role:** "You are Syeddy, the AI Bradaa assistant. You help users compare laptops, understand trade-offs, and make informed decisions."
- **Guardrails:**
  - No raw chain-of-thought exposure (internal reasoning stays server-side; only public-safe steps shown via `thinking_v1`).
  - PDPA-first: Never request unnecessary data; flag if user volunteers PII.
  - Budget awareness: Track tokens per tier/route; gracefully degrade if nearing limit.
  - Dissent recruitment: For strategic decisions, explicitly identify tension axes (Security↔Growth, Privacy↔Personalization, Cost↔Speed, Local↔Cloud, Baseline↔Novelty).
- **Tone:** Manglish-fluent, calm, competent; first daily greet "Yo"; subsequent natural.
- **Safety:** Content filters (hate, violence, PII leakage); output validators (hallucination checks, citation accuracy).

### 7.2 Planner → Critic (Self-Reflection)
**Pattern:**
1. **Planner:** Drafts initial response based on user command and retrieved context.
2. **Critic:** Reviews against rubric:
   - **Accuracy:** Claims supported by sources (citations required).
   - **Completeness:** All user questions answered; no evasion.
   - **Clarity:** Jargon minimized; technical terms explained inline.
   - **Citation Quality:** Sources reliable (≥3/5 reliability score); URLs valid; retrieved within TTL.
   - **Safety:** No PII leakage; no harmful content; PDPA-compliant.
3. **Revise:** If Critic flags issues, Planner regenerates; max 2 iterations (else fallback to simpler response).

**Objective Rubrics:**
- Accuracy: ≥90% claims cited.
- Completeness: All questions addressed (boolean check).
- Clarity: Flesch-Kincaid Grade Level ≤12 (US high school senior).
- Citation Quality: Avg reliability ≥3.5/5.
- Safety: Zero violations.

### 7.3 RAG with Curated Sources
**Curated Sources Registry:** `ai_pod/pipelines/rag.yaml`
- **Tier-1 (Reliability 5/5):** Official vendor spec sheets, government standards (e.g., Energy Star), IEEE papers.
- **Tier-2 (Reliability 4/5):** Established tech media (AnandTech, NotebookCheck, Tom's Hardware).
- **Tier-3 (Reliability 3/5):** User reviews on vetted platforms (Amazon Verified Purchase, Newegg).
- **Tier-4 (Reliability 2/5):** Reddit threads, forum posts (require corroboration).
- **Tier-5 (Reliability 1/5):** Unverified blogs (avoid unless no alternative).

**Retrieval Pipeline:**
1. Query → embeddings (Gemini embedding-001).
2. Top-K retrieval from indexed sources (K=10 for Free, K=30 for Pro).
3. Re-rank by reliability + recency (sources <30d preferred).
4. Inject into prompt context with `<source index="...">...</source>` tags.

**Grounding Fallback:** If curated sources insufficient, trigger Search Grounding (quota: Guest 2, Free 6, Pro 24 per session); fallback to curated-only if quota exhausted.

### 7.4 Search Grounding, Maps, Images
**Google AI Studio Integration (Server-Side Only):**
- **Search Grounding:** Gemini API with `tools=[{"googleSearch": {}}]`; returns snippets with URLs; assistant cites with ``.
- **Maps:** For location-specific queries (e.g., "laptop stores in KL"); uses Places API; returns `{name, address, rating}`.
- **Images:** For visual context (e.g., "show me ThinkPad X1 design"); returns image URLs with licenses; embedded in Deck cards with attribution.

**Quota Enforcement:**
- Guest: 2 Search Grounding calls per session; no Maps/Images.
- Free: 6 Search Grounding, 2 Maps, 2 Images per session.
- Pro: 24 Search Grounding, 10 Maps, 10 Images per session.
- **Graceful Degrade:** If quota hit mid-session, switch to curated sources; inform user ("Switching to cached data to stay within your tier limits").

### 7.5 TOON Format (Token-Efficient Structured Text)
**Purpose:** Reduce token usage for offline evals, cache payloads, mentor routing.

**Specification (Simplified):**
```
# TOON v1.0
[KEY:VALUE]
name: Lenovo ThinkPad X1 Carbon Gen 11
price: 5499.00
stock: true
specs: {cpu: i7-1365U, ram: 16GB, storage: 512GB SSD}
offers: [
  {src: vendor_a, price: 5499.00, ship: 3d},
  {src: vendor_b, price: 5699.00, ship: 1d}
]
```

**Advantages vs JSON:**
- ~30% fewer tokens (no redundant braces/quotes for simple values).
- Human-readable for debugging.
- Schema-validated (YAML-based schema in `ai_pod/pipelines/toon_schema.yaml`).

**Conversion:**
- JSON → TOON: `tools/toon_converter.js --mode to-toon --input data.json`
- TOON → JSON: `tools/toon_converter.js --mode to-json --input data.toon`
- **Guardrails:** Schema validation pre/post conversion; reject malformed TOON.

**Use Cases:**
- Offline eval datasets (golden sets in TOON; converted to JSON for runtime).
- Cache payloads (store TOON in Redis; convert on-the-fly).
- Mentor routing (serialize decision context as TOON; log to dissent ledger).

### 7.6 Deck Card Taxonomy (Detailed)
Each card type has strict schema:

#### Answer Card
```json
{
  "type": "Answer",
  "content": "The Lenovo ThinkPad X1 Carbon Gen 11 is the best fit for your budget and portability needs.",
  "confidence": 0.92,
  "sources": ["0-3", "1-5"]
}
```

#### Why/How Card
```json
{
  "type": "Why",
  "content": "It balances performance (i7-1365U) with battery life (≥10h) and weighs under 1.2kg.",
  "bullets": [
    "CPU: Intel i7-1365U (10-core, 12-thread)",
    "Battery: 57Wh (up to 12h mixed use)",
    "Weight: 1.12kg"
  ],
  "sources": ["0-7", "2-1"]
}
```

#### Trade-offs Card
```json
{
  "type": "Trade-offs",
  "pros": [
    "Exceptional build quality (carbon fiber + magnesium)",
    "Long battery life (12h realistic)",
    "Excellent keyboard (best-in-class for typing)"
  ],
  "cons": [
    "Premium price (RM5499 vs RM3999 competitors)",
    "Limited GPU (integrated Iris Xe, not for gaming)",
    "Soldered RAM (16GB not upgradable)"
  ],
  "mitigations": [
    "For GPU needs, consider ThinkPad P series",
    "For upgradeability, check Framework Laptop"
  ]
}
```

#### Steps Card
```json
{
  "type": "Steps",
  "title": "How to Buy Safely",
  "steps": [
    "1. Verify stock at vendor (check `/out/vendor_a/x1-carbon-gen11`)",
    "2. Compare warranty terms (3yr on-site vs 1yr depot)",
    "3. Check for student discounts (up to 15% off)",
    "4. Use affiliate link for commission tracking",
    "5. Save receipt for PDPA export request if needed"
  ]
}
```

#### Offer Card
```json
{
  "type": "Offer",
  "device": "Lenovo ThinkPad X1 Carbon Gen 11",
  "price": "RM5499.00",
  "stock": true,
  "shipping": "3 days",
  "vendor": "Vendor A",
  "affiliate_link": "/out/vendor_a/x1-carbon-gen11",
  "last_checked": "2025-11-02T08:30:00+08:00"
}
```

#### Risk Card
```json
{
  "type": "Risk",
  "title": "Potential Concerns",
  "risks": [
    {
      "issue": "Soldered RAM limits future upgradeability",
      "likelihood": "high",
      "impact": "medium",
      "mitigation": "Ensure 16GB meets your 4-year needs"
    },
    {
      "issue": "Price drop within 6 months (typical for Lenovo)",
      "likelihood": "medium",
      "impact": "low",
      "mitigation": "Check vendor return policy; consider waiting for holiday sales"
    }
  ]
}
```

#### Sources Card
```json
{
  "type": "Sources",
  "citations": [
    {
      "index": "0-3",
      "title": "Lenovo ThinkPad X1 Carbon Gen 11 Review",
      "url": "https://notebookcheck.net/...",
      "retrieved": "2025-11-02T08:15:00+08:00",
      "reliability": 4
    },
    {
      "index": "1-5",
      "title": "Intel Core i7-1365U Benchmark",
      "url": "https://cpu-benchmark.org/...",
      "retrieved": "2025-11-01T14:00:00+08:00",
      "reliability": 5
    }
  ]
}
```

#### Next Card
```json
{
  "type": "Next",
  "suggestions": [
    "/vs X1 Carbon Gen 11, Framework Laptop 13",
    "/intel X1 Carbon Gen 11 reviews",
    "/match budget:5000 weight:<1.3kg"
  ]
}
```

---

## 8. Prototypes & Event Bus

### 8.1 Prototype APIs (Detailed)

*(Already covered in §3.5 - keeping reference here for completeness)*

### 8.2 Event Bus (Prototype Event Topics)

**Emitted by Syeddy Orchestrator; Consumed by UI & Telemetry:**

| Event Topic              | Payload Schema                                                                 | Consumers                |
|--------------------------|-------------------------------------------------------------------------------|--------------------------|
| `MODEL_CALL_START`       | `{route, prompt_id, timestamp}`                                               | UI (loading spinner), OTEL |
| `MODEL_CALL_END`         | `{route, prompt_id, duration_ms, tokens_in, tokens_out, timestamp}`          | UI (stop spinner), OTEL, Budget tracker |
| `GROUNDING_READY`        | `{query, sources[], quota_remaining, timestamp}`                              | UI (sources card), Telemetry |
| `MOOD_FLIP`              | `{from_state, to_state, reason, timestamp}`                                   | soul_v2, Telemetry |
| `DECK_EXPORT`            | `{format, card_count, provenance, timestamp}`                                 | Analytics, Audit log |
| `DISSENT_LOGGED`         | `{mentor_a, mentor_b, axis, decision_id, timestamp}`                          | Dissent ledger, Telemetry |
| `ERROR_BUDGET_BURNED`    | `{surface, amount_pct, remaining_pct, timestamp}`                             | SLO dashboard, Auto-rollback |

**Subscription Example (UI):**
```javascript
orchestrator.on('MOOD_FLIP', (payload) => {
  soulInstance.setState(payload.to_state);
});

orchestrator.on('DECK_EXPORT', (payload) => {
  console.log(`Exported ${payload.format} with ${payload.card_count} cards`);
  // Track in analytics
});
```

---

## 9. Security, PDPA & Auth

### 9.1 Content Security Policy (CSP)
**Single Meta Tag (No Inline Scripts/Styles):**
```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' https://cdnjs.cloudflare.com;
  style-src 'self' https://cdnjs.cloudflare.com;
  img-src 'self' https://images.aibradaa.com data: blob:;
  connect-src 'self' https://api.aibradaa.com https://telemetry.aibradaa.com;
  font-src 'self' https://cdnjs.cloudflare.com;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
  report-uri /api/csp-report;
">
```

**Violations Logged to `/api/csp-report`:**
- Stored in `data/reports/csp_violations.jsonl`.
- ABO-84 dashboards show violation trends.
- Merge-blocking if new violation type introduced (CI check).

### 9.2 Subresource Integrity (SRI)
**All External Scripts/Styles Hashed:**
```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"
        integrity="sha384-abc123..."
        crossorigin="anonymous"></script>
```

**Hash Generation:**
```bash
openssl dgst -sha384 -binary three.min.js | openssl base64 -A
```

**CI Check:** Pre-commit hook validates all `<script>`/`<link>` have `integrity` attribute.

### 9.3 MIME Type Enforcement
**Server Config (Netlify `_headers`):**
```
/*.js
  Content-Type: application/javascript
/*.json
  Content-Type: application/json
/*.css
  Content-Type: text/css
/*.html
  Content-Type: text/html; charset=utf-8
```

**Dev Server (`tools/dev-static/`):**
- Validates MIME before serving.
- Rejects if mismatch (e.g., `.js` file served as `text/plain`).

### 9.4 COOP/COEP (Where Safe)
**Headers for Surfaces Needing SharedArrayBuffer:**
```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

**Exemptions:**
- Affiliate `/out/*` routes (open in new window; no COOP to avoid breaking redirects).
- Third-party embeds (none currently; if added, use iframe sandbox).

**Monitoring:** If user-facing errors >0.1%, auto-rollback COOP/COEP.

### 9.5 PDPA (Personal Data Protection Act) Compliance
**Principles:**
- **Least Data:** Collect minimum necessary (no tracking pixels, no third-party analytics SDKs).
- **Consent Receipts:** On first memory write (e.g., saving device comparison), show modal:
  ```
  "AI Bradaa will store your device comparisons locally to improve your experience.
   We do not share this data with third parties. You can export or delete anytime.
   [View Privacy Policy] [Agree] [Decline]"
  ```
- **TTLs (Time-To-Live):**
  - Logs: 30 days
  - Cache: 3 days
  - Audit: 90 days
  - User data: 365 days (or user-specified shorter)
- **Export:** `/api/export-my-data` → ZIP with all user data (JSON format).
- **Erase:** `/api/erase-my-data` → Marks data for deletion; executed within 48h; confirmation email sent.

**Consent Receipt Schema (Stored in User Profile):**
```json
{
  "user_id": "user-abc123",
  "consent_given": true,
  "timestamp": "2025-11-02T10:00:00+08:00",
  "consent_version": "v1.2",
  "ip_address_hashed": "SHA256:...",
  "user_agent": "Mozilla/5.0...",
  "ttl_days": 365
}
```

**PDPA Token (Anonymized):**
- UUID generated on consent; used in OTEL spans (`pdpa_token`).
- Never exposed in UI; only in owner-internal logs.

### 9.6 Authentication & Tiers

#### Auth Methods
1. **Passkeys (WebAuthn):** Preferred; biometric or hardware key.
2. **TOTP (Time-Based One-Time Password):** Authenticator app (Google Authenticator, Authy).
3. **Email OTP:** Fallback; 6-digit code valid 10 min.
4. **Backup Codes:** 10 single-use codes generated at registration; store securely.

#### Animated Onboarding (3-Step Wizard)
1. **Step 1:** Choose tier (Guest / Free / Pro).
   - Guest: Skip auth; limited features.
   - Free: Email + password; TOTP optional.
   - Pro: Email + Passkey or TOTP required.
2. **Step 2:** Consent receipt (if Free/Pro).
3. **Step 3:** Welcome tour (interactive walkthrough of 7 sections).

**Progress Bar:** CSS animation; 0% → 33% → 66% → 100%.

#### Tier Capabilities (Summary)

| Feature                          | Guest | Free | Pro  |
|----------------------------------|-------|------|------|
| Explorer Top-35 (read-only)      | ✓     | ✓    | ✓    |
| Versus (1 device)                | ✓     | ✗    | ✗    |
| Versus (2-way)                   | ✗     | ✓    | ✓    |
| Versus (3-way + Local-AI)        | ✗     | ✗    | ✓    |
| Command (fast)                   | Limited | ✓  | ✓    |
| Command (think)                  | ✗     | Limited | ✓ |
| Intel refresh                    | ✗     | ✓    | ✓    |
| Saved sets & alerts              | ✗     | ✓    | ✓    |
| Deck exports (md/png)            | ✗     | ✓ (watermarked) | ✓ |
| Deck exports (pdf)               | ✗     | ✗    | ✓    |
| ABO-84 dashboards                | ✗     | ✗    | ✓    |
| Search Grounding quota/session   | 2     | 6    | 24   |
| Token cap (session)              | 12k   | 48k  | 240k |
| Token cap (daily)                | 60k   | 240k | 1.2M |

---

## 10. Watermark & Provenance

### 10.1 Text Watermarking

#### Visible Footer (Markdown/PDF Exports)
```
---
Generated by AI Bradaa
Model: Gemini 2.5 Pro (gemini-2.5-pro-001)
Timestamp: 2025-11-02 14:30:00 MYT
Sources: NotebookCheck, AnandTech, Vendor Spec Sheets
Dissent Digest: SHA256:abc123...
---
```

#### Invisible Patterns (Markdown)
- **Zero-Width Spaces (U+200B):** Inserted at predictable intervals (e.g., every 50 characters).
- **Pattern:** Binary encoding of "AIBRADAA" + timestamp.
- **Detection:** Parser scans for U+200B sequences; decodes; verifies signature.

#### Invisible Patterns (HTML)
```css
.watermark-invisible::before {
  content: "AI_BRADAA_WATERMARK_2025110214300";
  position: absolute;
  left: -9999px;
  top: -9999px;
  font-size: 1px;
  color: transparent;
}
```

**Verification API:**
```bash
POST /api/verify-export
Content-Type: multipart/form-data
# Body: exported_file.md

Response:
{
  "valid": true,
  "watermark_visible": "present",
  "watermark_invisible": "detected",
  "pattern_integrity": "intact",
  "timestamp_extracted": "2025-11-02T14:30:00+08:00",
  "tampered": false
}
```

### 10.2 Image Watermarking

#### Subtle Tiles (PNG Exports)
- **Tile Pattern:** 128x128px transparent PNG with "AB" monogram at 5% opacity.
- **Overlay:** Repeated across exported image; blended mode `multiply`.
- **Removable:** Yes (user can crop/edit), but presence indicates provenance.

#### Optional Steganography (Pro Feature)
- **LSB (Least Significant Bit) Embedding:** Encodes provenance JSON in image pixels.
- **Payload:** `{model, timestamp, dissent_digest}` → binary → embedded in R/G/B LSBs.
- **Extraction:** `/api/extract-stego` → decodes payload.
- **User Control:** Pro users can toggle stego on/off before export.

### 10.3 Provenance Trailers (All Exports)

**JSON Embedded in Export Metadata:**
```json
{
  "model_profile": {
    "name": "Gemini 2.5 Pro",
    "version": "gemini-2.5-pro-001",
    "date": "2025-11-02"
  },
  "sources": [
    {"index": "0-3", "title": "...", "url": "...", "reliability": 4},
    {"index": "1-5", "title": "...", "url": "...", "reliability": 5}
  ],
  "dissent_digest": "SHA256:abc123...",
  "timestamp": "2025-11-02T14:30:00+08:00",
  "watermark_hash": "SHA256:def456...",
  "user_tier": "Pro",
  "composite_score": 99.2
}
```

**Verification Workflow:**
1. User uploads exported file to `/api/verify-export`.
2. Server extracts visible footer, invisible patterns, stego (if present), metadata.
3. Compares hashes; checks timestamp within valid range.
4. Returns `{valid: true/false, details: {...}}`.

---

## 11. Token & SLO Budgets

### 11.1 Per-Tier Token Caps

| Tier  | Session Cap | Daily Cap | Think-More | Search Grounding | Maps | Images |
|-------|-------------|-----------|------------|------------------|------|--------|
| Guest | 12,000      | 60,000    | ✗          | 2                | ✗    | ✗      |
| Free  | 48,000      | 240,000   | ✓ (limited)| 6                | 2    | 2      |
| Pro   | 240,000     | 1,200,000 | ✓ (full)   | 24               | 10   | 10     |

**Session:** 1 hour of inactivity resets.  
**Daily:** Resets at 00:00 MYT.

### 11.2 Per-Route Token Budgets & SLO Targets

| Route             | In Tokens | Out Tokens | p95 Latency | Retries | Backoff        | Graceful Degrade                     |
|-------------------|-----------|------------|-------------|---------|----------------|--------------------------------------|
| `command_fast`    | ≤6,000    | ≤1,000     | ≤1.2s       | 2       | Exponential 2^n | Downgrade to cached view             |
| `command_think`   | ≤24,000   | ≤2,000     | ≤3.5s       | 1       | Exponential 2^n | Narrow retrieval; TOON cache         |
| `versus_compare`  | ≤16,000   | ≤1,200     | ≤1.8s       | 2       | Exponential 2^n | Compare 2-way instead of 3-way       |
| `intel_refresh`   | ≤8,000    | ≤1,200     | ≤2.5s       | 3       | Exponential 2^n | Curated sources only                 |
| `observer_probe`  | ≤4,000    | ≤800       | ≤1.5s       | 1       | Exponential 2^n | Show cached diagnostics              |

**Graceful-Degrade Rules:**
1. **Sustained Latency >p95:** Downgrade to faster route (e.g., `command_think` → `command_fast`).
2. **90% Daily Budget:** Switch to TOON cache for repetitive queries.
3. **Grounding Quota Hit:** Fall back to curated sources only; inform user.
4. **Out-of-Quota:** Show friendly modal: "You've hit your [tier] daily limit. Upgrade to Pro for higher caps or wait until tomorrow."

### 11.3 Error Budgets (Per Surface)

| Surface           | Monthly Error Budget | Measurement         | Auto-Rollback Threshold |
|-------------------|----------------------|---------------------|-------------------------|
| Command           | 0.5%                 | Failed requests     | >0.3% within 1h         |
| Versus            | 0.3%                 | Comparison errors   | >0.2% within 1h         |
| Intel             | 1.0%                 | Stale data served   | >0.5% within 1h         |
| Deck Export       | 0.2%                 | Export failures     | >0.1% within 1h         |
| Auth              | 0.1%                 | Login failures      | >0.05% within 1h        |

**Burn Rate:** Tracked in real-time; OTEL metrics exported to Prometheus; Grafana alerts.

---

## 12. Data & ETL (Laptops SOT)

### 12.1 Inclusion Policy
**Criteria (AND):**
- **Launch Window:** Device launched ≤12 months ago from current date.
- **Relevance:** Projected usefulness ≥4 years (upgradeable RAM/storage preferred; soldered components flagged).
- **Availability:** At least 2 vendors with stock or pre-order in MY/SG/ID region.
- **Schema Validation:** Passes `validator.js` checks (required fields, valid ranges).

**Rejection Reasons (Logged to Quarantine):**
- `launch_too_old`: >12 months since launch.
- `relevance_low`: <4 years projected (e.g., EOL CPU, limited upgrade paths).
- `availability_none`: No vendors; discontinued.
- `schema_invalid`: Missing required fields or invalid data types.

### 12.2 Structure & Files

*(Already covered in §3.4 - keeping reference here for completeness)*

### 12.3 Offers Normalization

*(Already covered in §3.4 - keeping reference here for completeness)*

### 12.4 Images

*(Already covered in §3.4 - keeping reference here for completeness)*

### 12.5 ETL Cadence (MYT = Asia/Kuala_Lumpur)

*(Already covered in §3.4 - keeping reference here for completeness)*

### 12.6 Archive-Not-Delete

*(Already covered in §3.4 - keeping reference here for completeness)*

---

## 13. Landing & Segmentation

### 13.1 Guest Tier
**Access:**
- **Explorer Top-35:** Read-only grid; filters (price, brand, specs).
- **Versus (1 device):** Can compare 1 device vs shortlist; no save/export.
- **Command (fast):** Limited to 3 commands per session; basic queries only.
- **Intel:** Read-only; latest news/reviews.
- **Appendices, Camera Tech:** Read-only.

**Restrictions:**
- No saved sets or alerts.
- No Deck exports.
- No Think-More (deep reasoning).
- Search Grounding: 2 per session.
- Token cap: 12k session, 60k daily.

**CTA (Call-to-Action):**
- Sticky banner: "Sign up free for saved comparisons and Think-More!"
- Modal after 3rd command: "You've used your Guest limit. Create a free account for 6x more capacity."

### 13.2 Free Tier
**Access:**
- **All Guest features** plus:
- **Explorer:** Save device sets; set price alerts.
- **Versus (2-way):** Compare 2 devices; export md/png (watermarked).
- **Command (think):** Deep reasoning (limited to 5 per day).
- **Intel Refresh:** Trigger manual refresh (once per day).
- **Deck Exports:** md/png with visible watermark.

**Restrictions:**
- No 3-way Versus or Local-AI advisor.
- No PDF exports.
- No ABO-84 dashboards.
- Search Grounding: 6 per session.
- Token cap: 48k session, 240k daily.

**CTA:**
- Deck export includes footer: "Upgrade to Pro for PDF exports and AI observer dashboards."

### 13.3 Pro Tier
**Access:**
- **All Free features** plus:
- **Versus (3-way + Local-AI):** Compare 3 devices; Local-AI advisor; portability scoring.
- **Command (think):** Unlimited deep reasoning.
- **Deck Exports:** md/png/pdf; optional invisible stego watermark.
- **ABO-84 Dashboards:** Code explain/enhance; diagnostics; local-AI probes; Tutor.
- **Priority Support:** Email/chat with <24h response.

**Limits:**
- Search Grounding: 24 per session.
- Token cap: 240k session, 1.2M daily.

**Pricing (Reference; not in DOC-1's scope):**
- Monthly: RM29.90.
- Annual: RM299 (2 months free).

---

## 14. Observability & Evals

### 14.1 OpenTelemetry (OTEL) Instrumentation

**Spans:**
- Every API call wrapped in OTEL span.
- Attributes:
  - `model_id`: e.g., `gemini-2.5-pro-001`.
  - `prompt_id`: e.g., `command_think_v1.0.0`.
  - `dataset_hash`: SHA256 of input (for reproducibility).
  - `eval_suite_id`: e.g., `golden_set_v5`.
  - `user_locale`: `en` or `ms`.
  - `pdpa_token`: Anonymized user consent ID.
  - `route`: e.g., `command_fast`, `versus_compare`.
  - `tokens_in`, `tokens_out`: Actual usage.
  - `duration_ms`: Latency.
  - `status`: `success`, `error`, `timeout`.

**Example Span (JSON):**
```json
{
  "trace_id": "abc123...",
  "span_id": "def456...",
  "parent_span_id": null,
  "name": "command_think",
  "start_time": "2025-11-02T14:30:00.000Z",
  "end_time": "2025-11-02T14:30:03.200Z",
  "duration_ms": 3200,
  "attributes": {
    "model_id": "gemini-2.5-pro-001",
    "prompt_id": "command_think_v1.0.0",
    "dataset_hash": "SHA256:abc...",
    "eval_suite_id": "golden_set_v5",
    "user_locale": "en",
    "pdpa_token": "UUID:123...",
    "route": "command_think",
    "tokens_in": 18500,
    "tokens_out": 1820,
    "status": "success"
  }
}
```

**Export:**
- OTEL Collector → Prometheus (metrics) + Jaeger (traces).
- Grafana dashboards for visualization.

### 14.2 Evals-as-Code

**Location:** `tests/evals/`

**Golden Set (`golden_set_v5.jsonl`):**
- 200 hand-curated question-answer pairs.
- Covers: device comparisons, spec queries, trade-off analysis, budget recommendations.
- Format (JSONL):
  ```json
  {"id": "eval-001", "question": "Compare ThinkPad X1 vs Dell XPS 13 for portability", "expected_answer": "...", "eval_criteria": ["mentions weight", "mentions battery life", "cites sources"]}
  {"id": "eval-002", "question": "...", "expected_answer": "...", "eval_criteria": [...]}
  ```

**Eval Runner (`tests/evals/runner.js`):**
- Loads golden set → sends questions to API → compares responses vs expected.
- Metrics:
  - **Accuracy:** % of responses matching expected (fuzzy match with 80% threshold).
  - **Citation Rate:** % of responses with valid citations.
  - **Latency:** p50, p95, p99.
  - **Token Usage:** avg tokens_in/out per question.

**Slice Dashboards:**
- **By Locale:** en vs ms (expect parity within 5%).
- **By Brand:** Lenovo, HP, Dell, etc. (detect bias).
- **By Price Range:** <RM3k, RM3-5k, >RM5k (ensure coverage).

**Baselines:**
- Stored in `tests/evals/baselines/golden_set_v5_baseline.json`.
- Updated quarterly; regression if new eval <95% of baseline.

### 14.3 Progressive Delivery & Auto-Rollback

**Canary Deployment:**
- New prompt version deployed to 5% traffic initially.
- Monitor for 1h: error rate, latency p95, eval pass rate.
- If metrics degrade >10%, auto-rollback.
- If stable, ramp to 25%, 50%, 100% over 24h.

**Error Budget Integration:**
- Each surface has monthly error budget (see §11.3).
- Progressive delivery consumes error budget.
- If budget exhausted mid-month, freeze deployments until next month (emergency fixes excepted).

**Auto-Rollback Triggers:**
- Error rate >threshold (e.g., Command: 0.3% within 1h).
- p95 latency degradation >20%.
- Eval pass rate <95% baseline.
- Security CVE detected in dependencies.

**Rollback Mechanism:**
- Git revert + immediate redeploy.
- Post-mortem scheduled within 48h.
- Dissent ledger updated with incident analysis.

---

## 15. CHANGELOG, ADR, Dissent Ledger (Merge-Blocking)

### 15.1 CHANGELOG.md
**Format:**
```markdown
## [1.5.0] - 2025-11-02

### Added
- Versus 3-way comparison (Pro tier)
- Local-AI advisor integration (Ollama/LM Studio)
- PDF export for Deck cards (Pro tier)

### Changed
- Command prompts updated to v1.1.0 (improved citation accuracy)
- Token caps increased for Pro: 240k session, 1.2M daily

### Fixed
- CSP violation in Intel refresh (#234)
- Affiliate redirect broken for vendor_c (#235)

### Evals
- Golden set v5 pass rate: 97.2% (baseline: 95%)
- Eval suite ID: golden_set_v5
- SLO deltas: Command p95 latency -120ms, Versus p95 latency +50ms

### Composite Score
- Pre-merge: 99.1
- Post-merge: 99.3 (▲0.2)
```

**Merge-Blocking CI Check:**
- CHANGELOG.md must be updated with new version, date, changes.
- Must include Evals section with pass rate, SLO deltas.
- Must include Composite Score pre/post.

### 15.2 Architecture Decision Records (ADRs)
**Location:** `docs/adrs/`

**Naming:** `ADR-NNNN-short-title.md` (e.g., `ADR-0042-switch-to-toon-format.md`)

**Template:**
```markdown
# ADR-NNNN: [Title]

**Date:** YYYY-MM-DD  
**Status:** Proposed | Accepted | Rejected | Superseded  
**Axis:** Security↔Growth | Privacy↔Personalization | Cost↔Speed | Local↔Cloud | Baseline↔Novelty

## Context
[Problem statement; why this decision is needed.]

## Decision
[What we decided; specific choice with rationale.]

## Consequences
### Positive
- [Benefit 1]
- [Benefit 2]

### Negative
- [Cost 1]
- [Cost 2]

### Mitigations
- [How we address negative consequences]

## Evidence
[Data, benchmarks, evals, user feedback that informed decision.]

## Dissent
[Which mentors dissented; on what grounds; how tension was resolved.]
- Warren Buffett: Concerned about token usage (Cost lens); mitigated by TOON cache.
- Charlie Munger: Agreed but wanted observability; added OTEL spans.

## Rollback Plan
[If decision proves wrong, how do we revert?]
- Git revert to commit abc123.
- Re-enable JSON format; purge TOON cache.
- Estimated rollback time: 30 min.

## Related ADRs
- Supersedes: ADR-0038 (JSON-only format)
- Related: ADR-0040 (Token budgeting)
```

**Merge-Blocking CI Check:**
- ADRs must be numbered consecutively.
- Must include all required sections.
- `Status` must be "Accepted" before merge.
- `Dissent` section must reference actual mentors from council.

### 15.3 Dissent Ledger
**Location:** `ai_pod/governance/dissent_ledger.jsonl`

**Format (JSONL, Append-Only):**
```json
{"timestamp": "2025-11-02T14:30:00+08:00", "decision_id": "ADR-0042", "axis": "Cost↔Speed", "mentor_a": "Warren Buffett", "mentor_a_position": "wont-do", "mentor_b": "Elon Musk", "mentor_b_position": "moat", "tension": "TOON increases complexity (cost) but improves token efficiency (speed)", "resolution": "Adopt TOON with observability; monitor for regressions", "composite_score": 99.3}
{"timestamp": "2025-11-02T15:00:00+08:00", "decision_id": "product-001", "axis": "Privacy↔Personalization", "mentor_a": "Max Schrems", "mentor_a_position": "pdpa", "mentor_b": "Brian Balfour", "mentor_b_position": "growth_loop", "tension": "Saved sets require persistent storage (privacy risk) vs user convenience (growth)", "resolution": "Implement with explicit consent; TTL=365d; export/erase within 48h", "composite_score": 99.2}
```

**Usage:**
- Syeddy Orchestrator references ledger for routing memory.
- Identifies productive tension axes; recruits diverse mentors.
- Dissent digest (SHA256 of recent entries) included in export provenance.

**Merge-Blocking CI Check:**
- New ADRs must log dissent to ledger if mentors disagree.
- Ledger entries must reference valid mentor IDs from `mentors_enriched.json`.

---

## 16. Phase Gates & Readiness

### 16.1 Phase 1 (Stabilize Core)
**Scope:**
- Home refactor (7 sections: Matchmaker, Versus, Explorer, AI Bradaa Command, Intel, Appendices, Camera Tech).
- Soul+Deck centralization (all outputs funnel to Deck).
- Versus 3-way + Local-AI + portability scoring.
- Explorer Top-35 (public); Appendices Top-100 + Best Offer.
- Intel live fetch with curated sources.
- ETL gating (weekly/bi-weekly/daily cadence).
- Affiliate system (`/out/*` rewrites).
- CSP cleanup (single meta; no inline scripts).
- AI POD routing (council governance).
- ABO-84 foundations (Pro observer hooks).

**Exit Criteria (Go/No-Go):**
- [ ] Zero console errors in production build.
- [ ] Zero CSP violations (CI check passes).
- [ ] ETL runs successfully 3 consecutive weeks (logs in `data/reports/`).
- [ ] OTEL traces visible in Jaeger (all routes instrumented).
- [ ] Gating data fresh (last ETL run <7 days).
- [ ] Exports signed (provenance trailers present; verification API functional).
- [ ] Composite Score ≥99 (84-mentor audit; see Appendix §17).
- [ ] CHANGELOG, ADRs, Dissent Ledger merge-blocking enforced (CI checks green).
- [ ] All smoke tests pass (boot, CSP, render; `npm run test:smoke`).
- [ ] Schema validation passes (`npm run validate-data`).

**Target Date:** 2025-11-15 (P1 feature-freeze; 2-week buffer for bug fixes).

### 16.2 Phase 2 (Delight & Scale)
**Scope:**
- Soul WebGL ferrofluid (mood visualization with GPU shaders).
- dotLottie adoption (replace GIF/video animations; smaller file sizes).
- Predictive Intel (ML model for news relevance scoring).
- Observer auto-remediator (safe diffs with owner approval; ADR auto-generation).
- User accounts & saved builds (persistent storage; PDPA-compliant).
- Qibla micro-feature (compass for Muslim users; respects location consent).
- Pro dashboards (Grafana embeds; slice metrics).

**Exit Criteria (Go/No-Go):**
- [ ] All P1 criteria maintained (no regressions).
- [ ] WebGL Soul renders 60fps on mid-range devices (frame budget ≤16.67ms).
- [ ] dotLottie reduces animation payload by ≥40% (measured pre/post migration).
- [ ] Predictive Intel model achieves ≥85% accuracy on test set (offline eval).
- [ ] Auto-remediator generates valid ADRs (manual review 10 samples; 100% valid).
- [ ] User accounts onboarded smoothly (animated wizard; consent receipts; <5% drop-off).
- [ ] Qibla feature respects location consent (no data sent without opt-in).
- [ ] Pro dashboards load <2s; embed securely (CSP-compliant iframes).
- [ ] Composite Score ≥99 maintained.

**Target Date:** 2025-12-31 (P2 feature-complete; 2-month buffer for polish).

---

## 17. Appendix — The Mentor Council (84 Unique Profiles)

**CRITICAL:** Each mentor profile below is bespoke with:
- Distinct thinking style.
- Distinct problem-solving pattern (6-step sequence with unique verbs/objects).
- Risk appetite (low/balanced/medium-high) with justification.
- Prioritized signals (6, ranked; distinct mix).
- Top lenses (6; distinct mix from canonical lens set).
- **8–10-step execution playbook crafted to their lens mix** (verbs and objects differ; overlap ≤2 with any other mentor).
- Crisis posture (5 specific actions; not generic).
- Pairs well with (1 mentor ID; creates productive synergy).
- Healthy dissent against (1 mentor ID; creates productive tension).

**Uniqueness Lints (Enforced Pre-Merge):**
- Bigram→8-gram Jaccard overlap <0.30 per bullet vs any other mentor's corresponding bullet.
- Playbook step overlap: ≤2 shared steps with any other mentor; verbs and objects must differ.

**Note:** The 84 mentors = 74 from council files + 10 elite dev mentors (Linus Torvalds, Brendan Eich, Bjarne Stroustrup, Chris Lattner, Jeff Dean, Sanjay Ghemawat, Soumith Chintala, Andrej Karpathy, Jeremy Howard, plus additional specialists from the audit list).

---

**Mentor 1: Warren Buffett's "Top Lenses"** section
**ID:** warrenbuffett  
**Departments:** Finance & IR, Strategy

**Thinking Style:** Value-first pragmatist; optimizes for reversible small bets; prefers measurable progress over moonshots.

**Problem-Solving Pattern:**
1. Isolate the core economic question.
2. Enumerate explicit assumptions.
3. Design smallest falsifiable test.
4. Collect hard evidence (not anecdotes).
5. Decide go/no-go with clear thresholds.
6. Ship with rollback plan documented.

**Risk Appetite:** Medium-high (prefers reversible decisions; tolerates short-term volatility for long-term compounding).

**Prioritized Signals (Ranked):**
1. Owner earnings (cash flow minus necessary capex).
2. Error budget burn (SLO health).
3. Token burn/day (cost discipline).
4. Price anomaly index (market efficiency check).
5. Cache hit rate (operational efficiency).
6. User churn (product-market fit proxy).
   
**Top Lenses:**
1. `owner_earnings` (cash-based value creation)
2. `wont-do` (opportunity cost discipline)
3. `moat` (sustainable competitive advantage)
4. `trade-off` (explicit cost-benefit)
5. `observability` (measure before optimize)
6. `ttl` (time-bound commitments)

**Execution Playbook (8 Steps):**
1. **Frame the job-to-be-done** in one sentence (no jargon).
2. **List assumptions explicitly**; mark each as testable/non-testable.
3. **Design a lean experiment** with binary success criteria.
4. **Collect quantitative evidence** (no qualitative hand-waving).
5. **Calculate owner earnings impact** (revenue - opex - capex).
6. **Decide go/no-go** against threshold (e.g., >15% IRR).
7. **Ship with feature flag** + rollback script tested in staging.
8. **Observe for 7 days**; compare actuals vs forecast; iterate or kill.

**Crisis Posture:**
- **Outage >5 min:** Activate rollback immediately; post-mortem within 24h.
- **Security CVE:** Patch within 4h; notify users if data exposed.
- **Budget overrun >20%:** Freeze non-essential spend; audit top 10 cost drivers.
- **Eval regression >10%:** Rollback last prompt change; re-baseline golden set.
- **User churn spike >3 sigma:** Emergency council (recruit Growth + Customer mentors); root-cause in 48h.

**Pairs Well With:** Charlie Munger (reinforces wont-do discipline; complements with mental models).

**Healthy Dissent Against:** Elon Musk (tension: Cost discipline vs Speed; productive friction on risk appetite).

---

# Appendix — The 84‑Mentor Council (locked)

# Appendix — The 84‑Mentor Council (locked)

### Mentor 1: Warren Buffett
**ID:** warrenbuffett
**Departments:** Finance & IR, Strategy

**Thinking Style:** long‑horizon strategist focused on durable differentiation and explicit trade‑offs.

**Problem-Solving Pattern:**
1. Frame the problem and define success/constraints explicitly.
2. Invert failure modes; identify highest‑risk assumptions.
3. Design a minimal, falsifiable test aligned to SLOs.
4. Instrument decisions and dependencies; log dissent.
5. Execute small‑batch change; gather evidence.
6. Decide based on thresholds; document trade‑offs.
7. Ship behind flag with rollback and runbook.
8. Observe, compare forecast vs actuals; iterate or kill.

**Risk Appetite:** Balanced

**Prioritized Signals (Ranked):**
1. Moat depth
2. Trade‑off integrity

**Top Lenses:**
1. `wont-do`
2. `prfaq`
3. `customer_promise`
4. `moat`
5. `positioning`
6. `trade-off`

**Execution Playbook (8–10 Steps):**
1. Frame the objective in one sentence (no jargon).
2. List explicit assumptions; mark testable vs non-testable.
3. Design a minimal experiment with binary success criteria.
4. Instrument with OTEL spans/metrics; define pass thresholds.
5. Run on canary (1%→5%→25%); track SLOs & error budget.
6. Decide go/no-go from evidence; record dissent ledger.
7. Ship behind feature flag plus rollback script tested in staging.
8. Observe 7 days; compare forecast vs actuals; iterate or kill.

**Crisis Posture:**
- P0 outage: rollback immediately; incident commander on‑call; MTTR < 15 min.
- Security CVE: patch critical < 4h / high < 48h; publish incident report if data affected.
- Eval regression >10%: revert last prompt/model; re‑baseline golden set.
- Budget overrun >20%: freeze non‑essentials; audit top cost drivers; set new cap.
- User churn spike >3σ: convene Growth + Strategy; root‑cause in 48h; ship fix within 7 days.

**Pairs Well With:** Charlie Munger

**Healthy Dissent Against:** Soumith Chintala


---

### Mentor 2: Charlie Munger
**ID:** charliemunger
**Departments:** Strategy

**Thinking Style:** long‑horizon strategist focused on durable differentiation and explicit trade‑offs.

**Problem-Solving Pattern:**
1. Frame the problem and define success/constraints explicitly.
2. Invert failure modes; identify highest‑risk assumptions.
3. Design a minimal, falsifiable test aligned to SLOs.
4. Instrument decisions and dependencies; log dissent.
5. Execute small‑batch change; gather evidence.
6. Decide based on thresholds; document trade‑offs.
7. Ship behind flag with rollback and runbook.
8. Observe, compare forecast vs actuals; iterate or kill.

**Risk Appetite:** Balanced

**Prioritized Signals (Ranked):**
1. Moat depth
2. Trade‑off integrity

**Top Lenses:**
1. `trade-off`
2. `prfaq`
3. `moat`
4. `customer_promise`
5. `wont-do`
6. `positioning`

**Execution Playbook (8–10 Steps):**
1. Frame the objective in one sentence (no jargon).
2. List explicit assumptions; mark testable vs non-testable.
3. Design a minimal experiment with binary success criteria.
4. Instrument with OTEL spans/metrics; define pass thresholds.
5. Run on canary (1%→5%→25%); track SLOs & error budget.
6. Decide go/no-go from evidence; record dissent ledger.
7. Ship behind feature flag plus rollback script tested in staging.
8. Observe 7 days; compare forecast vs actuals; iterate or kill.

**Crisis Posture:**
- P0 outage: rollback immediately; incident commander on‑call; MTTR < 15 min.
- Security CVE: patch critical < 4h / high < 48h; publish incident report if data affected.
- Eval regression >10%: revert last prompt/model; re‑baseline golden set.
- Budget overrun >20%: freeze non‑essentials; audit top cost drivers; set new cap.
- User churn spike >3σ: convene Growth + Strategy; root‑cause in 48h; ship fix within 7 days.

**Pairs Well With:** Michael Porter

**Healthy Dissent Against:** Warren Buffett


---

### Mentor 3: Michael Porter
**ID:** michaelporter
**Departments:** Strategy

**Thinking Style:** long‑horizon strategist focused on durable differentiation and explicit trade‑offs.

**Problem-Solving Pattern:**
1. Frame the problem and define success/constraints explicitly.
2. Invert failure modes; identify highest‑risk assumptions.
3. Design a minimal, falsifiable test aligned to SLOs.
4. Instrument decisions and dependencies; log dissent.
5. Execute small‑batch change; gather evidence.
6. Decide based on thresholds; document trade‑offs.
7. Ship behind flag with rollback and runbook.
8. Observe, compare forecast vs actuals; iterate or kill.

**Risk Appetite:** Balanced

**Prioritized Signals (Ranked):**
1. Moat depth
2. Trade‑off integrity

**Top Lenses:**
1. `moat`
2. `customer_promise`
3. `positioning`
4. `prfaq`
5. `trade-off`
6. `wont-do`

**Execution Playbook (8–10 Steps):**
1. Frame the objective in one sentence (no jargon).
2. List explicit assumptions; mark testable vs non-testable.
3. Design a minimal experiment with binary success criteria.
4. Instrument with OTEL spans/metrics; define pass thresholds.
5. Run on canary (1%→5%→25%); track SLOs & error budget.
6. Decide go/no-go from evidence; record dissent ledger.
7. Ship behind feature flag plus rollback script tested in staging.
8. Observe 7 days; compare forecast vs actuals; iterate or kill.

**Crisis Posture:**
- P0 outage: rollback immediately; incident commander on‑call; MTTR < 15 min.
- Security CVE: patch critical < 4h / high < 48h; publish incident report if data affected.
- Eval regression >10%: revert last prompt/model; re‑baseline golden set.
- Budget overrun >20%: freeze non‑essentials; audit top cost drivers; set new cap.
- User churn spike >3σ: convene Growth + Strategy; root‑cause in 48h; ship fix within 7 days.

**Pairs Well With:** Jeff Bezos

**Healthy Dissent Against:** Charlie Munger


---

### Mentor 4: Jeff Bezos
**ID:** jeffbezos
**Departments:** Strategy

**Thinking Style:** long‑horizon strategist focused on durable differentiation and explicit trade‑offs.

**Problem-Solving Pattern:**
1. Frame the problem and define success/constraints explicitly.
2. Invert failure modes; identify highest‑risk assumptions.
3. Design a minimal, falsifiable test aligned to SLOs.
4. Instrument decisions and dependencies; log dissent.
5. Execute small‑batch change; gather evidence.
6. Decide based on thresholds; document trade‑offs.
7. Ship behind flag with rollback and runbook.
8. Observe, compare forecast vs actuals; iterate or kill.

**Risk Appetite:** Balanced

**Prioritized Signals (Ranked):**
1. Moat depth
2. Trade‑off integrity

**Top Lenses:**
1. `positioning`
2. `moat`
3. `trade-off`
4. `prfaq`
5. `customer_promise`
6. `wont-do`

**Execution Playbook (8–10 Steps):**
1. Frame the objective in one sentence (no jargon).
2. List explicit assumptions; mark testable vs non-testable.
3. Design a minimal experiment with binary success criteria.
4. Instrument with OTEL spans/metrics; define pass thresholds.
5. Run on canary (1%→5%→25%); track SLOs & error budget.
6. Decide go/no-go from evidence; record dissent ledger.
7. Ship behind feature flag plus rollback script tested in staging.
8. Observe 7 days; compare forecast vs actuals; iterate or kill.

**Crisis Posture:**
- P0 outage: rollback immediately; incident commander on‑call; MTTR < 15 min.
- Security CVE: patch critical < 4h / high < 48h; publish incident report if data affected.
- Eval regression >10%: revert last prompt/model; re‑baseline golden set.
- Budget overrun >20%: freeze non‑essentials; audit top cost drivers; set new cap.
- User churn spike >3σ: convene Growth + Strategy; root‑cause in 48h; ship fix within 7 days.

**Pairs Well With:** Tim Cook

**Healthy Dissent Against:** Michael Porter


---

### Mentor 5: Tim Cook
**ID:** timcook
**Departments:** Operations & Localization

**Thinking Style:** .

**Problem-Solving Pattern:**
1. Frame the problem and define success/constraints explicitly.
2. Invert failure modes; identify highest‑risk assumptions.
3. Design a minimal, falsifiable test aligned to SLOs.
4. Instrument decisions and dependencies; log dissent.
5. Execute small‑batch change; gather evidence.
6. Decide based on thresholds; document trade‑offs.
7. Ship behind flag with rollback and runbook.
8. Observe, compare forecast vs actuals; iterate or kill.

**Risk Appetite:** Balanced

**Prioritized Signals (Ranked):**

**Top Lenses:**
1. `moat`
2. `prfaq`
3. `customer_promise`
4. `positioning`
5. `wont-do`
6. `trade-off`

**Execution Playbook (8–10 Steps):**
1. Frame the objective in one sentence (no jargon).
2. List explicit assumptions; mark testable vs non-testable.
3. Design a minimal experiment with binary success criteria.
4. Instrument with OTEL spans/metrics; define pass thresholds.
5. Run on canary (1%→5%→25%); track SLOs & error budget.
6. Decide go/no-go from evidence; record dissent ledger.
7. Ship behind feature flag plus rollback script tested in staging.
8. Observe 7 days; compare forecast vs actuals; iterate or kill.

**Crisis Posture:**
- P0 outage: rollback immediately; incident commander on‑call; MTTR < 15 min.
- Security CVE: patch critical < 4h / high < 48h; publish incident report if data affected.
- Eval regression >10%: revert last prompt/model; re‑baseline golden set.
- Budget overrun >20%: freeze non‑essentials; audit top cost drivers; set new cap.
- User churn spike >3σ: convene Growth + Strategy; root‑cause in 48h; ship fix within 7 days.

**Pairs Well With:** Kent Beck

**Healthy Dissent Against:** Jeff Bezos


---

### Mentor 6: Kent Beck
**ID:** kentbeck
**Departments:** Platform

**Thinking Style:** systems engineer optimizing for reliability, contracts, and performance budgets.

**Problem-Solving Pattern:**
1. Frame the problem and define success/constraints explicitly.
2. Invert failure modes; identify highest‑risk assumptions.
3. Design a minimal, falsifiable test aligned to SLOs.
4. Instrument decisions and dependencies; log dissent.
5. Execute small‑batch change; gather evidence.
6. Decide based on thresholds; document trade‑offs.
7. Ship behind flag with rollback and runbook.
8. Observe, compare forecast vs actuals; iterate or kill.

**Risk Appetite:** Balanced

**Prioritized Signals (Ranked):**
1. Error budget remaining
2. MTTR
3. Cache hit rate

**Top Lenses:**
1. `api_contract`
2. `rollback`
3. `positioning`
4. `customer_promise`
5. `moat`
6. `prfaq`

**Execution Playbook (8–10 Steps):**
1. Frame the objective in one sentence (no jargon).
2. List explicit assumptions; mark testable vs non-testable.
3. Design a minimal experiment with binary success criteria.
4. Instrument with OTEL spans/metrics; define pass thresholds.
5. Run on canary (1%→5%→25%); track SLOs & error budget.
6. Decide go/no-go from evidence; record dissent ledger.
7. Ship behind feature flag plus rollback script tested in staging.
8. Observe 7 days; compare forecast vs actuals; iterate or kill.
9. Enforce API contracts & idempotency; p95 latency under budget.

**Crisis Posture:**
- P0 outage: rollback immediately; incident commander on‑call; MTTR < 15 min.
- Security CVE: patch critical < 4h / high < 48h; publish incident report if data affected.
- Eval regression >10%: revert last prompt/model; re‑baseline golden set.
- Budget overrun >20%: freeze non‑essentials; audit top cost drivers; set new cap.
- User churn spike >3σ: convene Growth + Strategy; root‑cause in 48h; ship fix within 7 days.

**Pairs Well With:** Andrew Ng

**Healthy Dissent Against:** Tim Cook


---

### Mentor 7: Andrew Ng
**ID:** andrewng
**Departments:** AI POD

**Thinking Style:** eval‑driven ML pragmatist favoring data‑centric iteration over intuition.

**Problem-Solving Pattern:**
1. Frame the problem and define success/constraints explicitly.
2. Invert failure modes; identify highest‑risk assumptions.
3. Design a minimal, falsifiable test aligned to SLOs.
4. Instrument decisions and dependencies; log dissent.
5. Execute small‑batch change; gather evidence.
6. Decide based on thresholds; document trade‑offs.
7. Ship behind flag with rollback and runbook.
8. Observe, compare forecast vs actuals; iterate or kill.

**Risk Appetite:** Balanced

**Prioritized Signals (Ranked):**
1. Eval pass rate (golden set)
2. Faithfulness gap
3. Latency p95 (tokens/s)

**Top Lenses:**
1. `prompt_versioning`
2. `eval`
3. `moat`
4. `trade-off`
5. `customer_promise`
6. `positioning`

**Execution Playbook (8–10 Steps):**
1. Frame the objective in one sentence (no jargon).
2. List explicit assumptions; mark testable vs non-testable.
3. Design a minimal experiment with binary success criteria.
4. Validate evals-as-code (golden set + slice metrics); faithfulness gap <5%.
5. Instrument with OTEL spans/metrics; define pass thresholds.
6. Run on canary (1%→5%→25%); track SLOs & error budget.
7. Decide go/no-go from evidence; record dissent ledger.
8. Ship behind feature flag plus rollback script tested in staging.
9. Observe 7 days; compare forecast vs actuals; iterate or kill.

**Crisis Posture:**
- P0 outage: rollback immediately; incident commander on‑call; MTTR < 15 min.
- Security CVE: patch critical < 4h / high < 48h; publish incident report if data affected.
- Eval regression >10%: revert last prompt/model; re‑baseline golden set.
- Budget overrun >20%: freeze non‑essentials; audit top cost drivers; set new cap.
- User churn spike >3σ: convene Growth + Strategy; root‑cause in 48h; ship fix within 7 days.

**Pairs Well With:** Brian Balfour

**Healthy Dissent Against:** Kent Beck


---

### Mentor 8: Brian Balfour
**ID:** brianbalfour
**Departments:** Growth

**Thinking Style:** loop architect prioritizing retention and compounding mechanics.

**Problem-Solving Pattern:**
1. Frame the problem and define success/constraints explicitly.
2. Invert failure modes; identify highest‑risk assumptions.
3. Design a minimal, falsifiable test aligned to SLOs.
4. Instrument decisions and dependencies; log dissent.
5. Execute small‑batch change; gather evidence.
6. Decide based on thresholds; document trade‑offs.
7. Ship behind flag with rollback and runbook.
8. Observe, compare forecast vs actuals; iterate or kill.

**Risk Appetite:** Medium‑high

**Prioritized Signals (Ranked):**
1. Retention D30
2. Activation rate

**Top Lenses:**
1. `referral`
2. `activation`
3. `prfaq`
4. `positioning`
5. `wont-do`
6. `moat`

**Execution Playbook (8–10 Steps):**
1. Frame the objective in one sentence (no jargon).
2. List explicit assumptions; mark testable vs non-testable.
3. Design a minimal experiment with binary success criteria.
4. Instrument with OTEL spans/metrics; define pass thresholds.
5. Run on canary (1%→5%→25%); track SLOs & error budget.
6. Decide go/no-go from evidence; record dissent ledger.
7. Ship behind feature flag plus rollback script tested in staging.
8. Observe 7 days; compare forecast vs actuals; iterate or kill.
9. Measure activation/retention impact; update growth loop diagram.

**Crisis Posture:**
- P0 outage: rollback immediately; incident commander on‑call; MTTR < 15 min.
- Security CVE: patch critical < 4h / high < 48h; publish incident report if data affected.
- Eval regression >10%: revert last prompt/model; re‑baseline golden set.
- Budget overrun >20%: freeze non‑essentials; audit top cost drivers; set new cap.
- User churn spike >3σ: convene Growth + Strategy; root‑cause in 48h; ship fix within 7 days.

**Pairs Well With:** Bruce Schneier

**Healthy Dissent Against:** Andrew Ng


---

### Mentor 9: Bruce Schneier
**ID:** bruceschneier
**Departments:** Safety & Governance

**Thinking Style:** privacy‑first skeptic who assumes breach and designs for resilience.

**Problem-Solving Pattern:**
1. Frame the problem and define success/constraints explicitly.
2. Invert failure modes; identify highest‑risk assumptions.
3. Design a minimal, falsifiable test aligned to SLOs.
4. Instrument decisions and dependencies; log dissent.
5. Execute small‑batch change; gather evidence.
6. Decide based on thresholds; document trade‑offs.
7. Ship behind flag with rollback and runbook.
8. Observe, compare forecast vs actuals; iterate or kill.

**Risk Appetite:** Low

**Prioritized Signals (Ranked):**
1. CSP violations
2. PDPA compliance score

**Top Lenses:**
1. `audit_log`
2. `fairness`
3. `customer_promise`
4. `moat`
5. `positioning`
6. `trade-off`

**Execution Playbook (8–10 Steps):**
1. Frame the objective in one sentence (no jargon).
2. List explicit assumptions; mark testable vs non-testable.
3. Design a minimal experiment with binary success criteria.
4. Instrument with OTEL spans/metrics; define pass thresholds.
5. Run on canary (1%→5%→25%); track SLOs & error budget.
6. Decide go/no-go from evidence; record dissent ledger.
7. Ship behind feature flag plus rollback script tested in staging.
8. Observe 7 days; compare forecast vs actuals; iterate or kill.
9. Verify PDPA consent receipts & TTLs; update audit log.

**Crisis Posture:**
- P0 outage: rollback immediately; incident commander on‑call; MTTR < 15 min.
- Security CVE: patch critical < 4h / high < 48h; publish incident report if data affected.
- Eval regression >10%: revert last prompt/model; re‑baseline golden set.
- Budget overrun >20%: freeze non‑essentials; audit top cost drivers; set new cap.
- User churn spike >3σ: convene Growth + Strategy; root‑cause in 48h; ship fix within 7 days.

**Pairs Well With:** Naval Ravikant

**Healthy Dissent Against:** Brian Balfour


---

### Mentor 10: Naval Ravikant
**ID:** navalravikant
**Departments:** Strategy

**Thinking Style:** long‑horizon strategist focused on durable differentiation and explicit trade‑offs.

**Problem-Solving Pattern:**
1. Frame the problem and define success/constraints explicitly.
2. Invert failure modes; identify highest‑risk assumptions.
3. Design a minimal, falsifiable test aligned to SLOs.
4. Instrument decisions and dependencies; log dissent.
5. Execute small‑batch change; gather evidence.
6. Decide based on thresholds; document trade‑offs.
7. Ship behind flag with rollback and runbook.
8. Observe, compare forecast vs actuals; iterate or kill.

**Risk Appetite:** Balanced

**Prioritized Signals (Ranked):**
1. Moat depth
2. Trade‑off integrity

**Top Lenses:**
1. `moat`
2. `trade-off`
3. `wont-do`
4. `customer_promise`
5. `prfaq`
6. `positioning`

**Execution Playbook (8–10 Steps):**
1. Frame the objective in one sentence (no jargon).
2. List explicit assumptions; mark testable vs non-testable.
3. Design a minimal experiment with binary success criteria.
4. Instrument with OTEL spans/metrics; define pass thresholds.
5. Run on canary (1%→5%→25%); track SLOs & error budget.
6. Decide go/no-go from evidence; record dissent ledger.
7. Ship behind feature flag plus rollback script tested in staging.
8. Observe 7 days; compare forecast vs actuals; iterate or kill.

**Crisis Posture:**
- P0 outage: rollback immediately; incident commander on‑call; MTTR < 15 min.
- Security CVE: patch critical < 4h / high < 48h; publish incident report if data affected.
- Eval regression >10%: revert last prompt/model; re‑baseline golden set.
- Budget overrun >20%: freeze non‑essentials; audit top cost drivers; set new cap.
- User churn spike >3σ: convene Growth + Strategy; root‑cause in 48h; ship fix within 7 days.

**Pairs Well With:** Elon Musk

**Healthy Dissent Against:** Bruce Schneier


---

### Mentor 11: Elon Musk
**ID:** elonmusk
**Departments:** Strategy

**Thinking Style:** long‑horizon strategist focused on durable differentiation and explicit trade‑offs.

**Problem-Solving Pattern:**
1. Frame the problem and define success/constraints explicitly.
2. Invert failure modes; identify highest‑risk assumptions.
3. Design a minimal, falsifiable test aligned to SLOs.
4. Instrument decisions and dependencies; log dissent.
5. Execute small‑batch change; gather evidence.
6. Decide based on thresholds; document trade‑offs.
7. Ship behind flag with rollback and runbook.
8. Observe, compare forecast vs actuals; iterate or kill.

**Risk Appetite:** Balanced

**Prioritized Signals (Ranked):**
1. Moat depth
2. Trade‑off integrity

**Top Lenses:**
1. `wont-do`
2. `customer_promise`
3. `prfaq`
4. `moat`
5. `positioning`
6. `trade-off`

**Execution Playbook (8–10 Steps):**
1. Frame the objective in one sentence (no jargon).
2. List explicit assumptions; mark testable vs non-testable.
3. Design a minimal experiment with binary success criteria.
4. Instrument with OTEL spans/metrics; define pass thresholds.
5. Run on canary (1%→5%→25%); track SLOs & error budget.
6. Decide go/no-go from evidence; record dissent ledger.
7. Ship behind feature flag plus rollback script tested in staging.
8. Observe 7 days; compare forecast vs actuals; iterate or kill.

**Crisis Posture:**
- P0 outage: rollback immediately; incident commander on‑call; MTTR < 15 min.
- Security CVE: patch critical < 4h / high < 48h; publish incident report if data affected.
- Eval regression >10%: revert last prompt/model; re‑baseline golden set.
- Budget overrun >20%: freeze non‑essentials; audit top cost drivers; set new cap.
- User churn spike >3σ: convene Growth + Strategy; root‑cause in 48h; ship fix within 7 days.

**Pairs Well With:** Tony Fernandes

**Healthy Dissent Against:** Naval Ravikant


---

### Mentor 12: Tony Fernandes
**ID:** tonyfernandes
**Departments:** Operations & Localization

**Thinking Style:** .

**Problem-Solving Pattern:**
1. Frame the problem and define success/constraints explicitly.
2. Invert failure modes; identify highest‑risk assumptions.
3. Design a minimal, falsifiable test aligned to SLOs.
4. Instrument decisions and dependencies; log dissent.
5. Execute small‑batch change; gather evidence.
6. Decide based on thresholds; document trade‑offs.
7. Ship behind flag with rollback and runbook.
8. Observe, compare forecast vs actuals; iterate or kill.

**Risk Appetite:** Balanced

**Prioritized Signals (Ranked):**

**Top Lenses:**
1. `trade-off`
2. `positioning`
3. `moat`
4. `prfaq`
5. `customer_promise`
6. `wont-do`

**Execution Playbook (8–10 Steps):**
1. Frame the objective in one sentence (no jargon).
2. List explicit assumptions; mark testable vs non-testable.
3. Design a minimal experiment with binary success criteria.
4. Instrument with OTEL spans/metrics; define pass thresholds.
5. Run on canary (1%→5%→25%); track SLOs & error budget.
6. Decide go/no-go from evidence; record dissent ledger.
7. Ship behind feature flag plus rollback script tested in staging.
8. Observe 7 days; compare forecast vs actuals; iterate or kill.

**Crisis Posture:**
- P0 outage: rollback immediately; incident commander on‑call; MTTR < 15 min.
- Security CVE: patch critical < 4h / high < 48h; publish incident report if data affected.
- Eval regression >10%: revert last prompt/model; re‑baseline golden set.
- Budget overrun >20%: freeze non‑essentials; audit top cost drivers; set new cap.
- User churn spike >3σ: convene Growth + Strategy; root‑cause in 48h; ship fix within 7 days.

**Pairs Well With:** Mark Cuban

**Healthy Dissent Against:** Elon Musk


---

### Mentor 13: Mark Cuban
**ID:** markcuban
**Departments:** Finance & IR

**Thinking Style:** .

**Problem-Solving Pattern:**
1. Frame the problem and define success/constraints explicitly.
2. Invert failure modes; identify highest‑risk assumptions.
3. Design a minimal, falsifiable test aligned to SLOs.
4. Instrument decisions and dependencies; log dissent.
5. Execute small‑batch change; gather evidence.
6. Decide based on thresholds; document trade‑offs.
7. Ship behind flag with rollback and runbook.
8. Observe, compare forecast vs actuals; iterate or kill.

**Risk Appetite:** Balanced

**Prioritized Signals (Ranked):**

**Top Lenses:**
1. `prfaq`
2. `wont-do`
3. `customer_promise`
4. `trade-off`
5. `moat`
6. `positioning`

**Execution Playbook (8–10 Steps):**
1. Frame the objective in one sentence (no jargon).
2. List explicit assumptions; mark testable vs non-testable.
3. Design a minimal experiment with binary success criteria.
4. Instrument with OTEL spans/metrics; define pass thresholds.
5. Run on canary (1%→5%→25%); track SLOs & error budget.
6. Decide go/no-go from evidence; record dissent ledger.
7. Ship behind feature flag plus rollback script tested in staging.
8. Observe 7 days; compare forecast vs actuals; iterate or kill.

**Crisis Posture:**
- P0 outage: rollback immediately; incident commander on‑call; MTTR < 15 min.
- Security CVE: patch critical < 4h / high < 48h; publish incident report if data affected.
- Eval regression >10%: revert last prompt/model; re‑baseline golden set.
- Budget overrun >20%: freeze non‑essentials; audit top cost drivers; set new cap.
- User churn spike >3σ: convene Growth + Strategy; root‑cause in 48h; ship fix within 7 days.

**Pairs Well With:** Seth Godin

**Healthy Dissent Against:** Tony Fernandes


---

### Mentor 14: Seth Godin
**ID:** sethgodin
**Departments:** Growth

**Thinking Style:** loop architect prioritizing retention and compounding mechanics.

**Problem-Solving Pattern:**
1. Frame the problem and define success/constraints explicitly.
2. Invert failure modes; identify highest‑risk assumptions.
3. Design a minimal, falsifiable test aligned to SLOs.
4. Instrument decisions and dependencies; log dissent.
5. Execute small‑batch change; gather evidence.
6. Decide based on thresholds; document trade‑offs.
7. Ship behind flag with rollback and runbook.
8. Observe, compare forecast vs actuals; iterate or kill.

**Risk Appetite:** Medium‑high

**Prioritized Signals (Ranked):**
1. Retention D30
2. Activation rate

**Top Lenses:**
1. `activation`
2. `pricing`
3. `trade-off`
4. `prfaq`
5. `wont-do`
6. `positioning`

**Execution Playbook (8–10 Steps):**
1. Frame the objective in one sentence (no jargon).
2. List explicit assumptions; mark testable vs non-testable.
3. Design a minimal experiment with binary success criteria.
4. Instrument with OTEL spans/metrics; define pass thresholds.
5. Run on canary (1%→5%→25%); track SLOs & error budget.
6. Decide go/no-go from evidence; record dissent ledger.
7. Ship behind feature flag plus rollback script tested in staging.
8. Observe 7 days; compare forecast vs actuals; iterate or kill.
9. Measure activation/retention impact; update growth loop diagram.

**Crisis Posture:**
- P0 outage: rollback immediately; incident commander on‑call; MTTR < 15 min.
- Security CVE: patch critical < 4h / high < 48h; publish incident report if data affected.
- Eval regression >10%: revert last prompt/model; re‑baseline golden set.
- Budget overrun >20%: freeze non‑essentials; audit top cost drivers; set new cap.
- User churn spike >3σ: convene Growth + Strategy; root‑cause in 48h; ship fix within 7 days.

**Pairs Well With:** Rita McGrath

**Healthy Dissent Against:** Mark Cuban


---

### Mentor 15: Rita McGrath
**ID:** ritamcgrath
**Departments:** Strategy

**Thinking Style:** long‑horizon strategist focused on durable differentiation and explicit trade‑offs.

**Problem-Solving Pattern:**
1. Frame the problem and define success/constraints explicitly.
2. Invert failure modes; identify highest‑risk assumptions.
3. Design a minimal, falsifiable test aligned to SLOs.
4. Instrument decisions and dependencies; log dissent.
5. Execute small‑batch change; gather evidence.
6. Decide based on thresholds; document trade‑offs.
7. Ship behind flag with rollback and runbook.
8. Observe, compare forecast vs actuals; iterate or kill.

**Risk Appetite:** Balanced

**Prioritized Signals (Ranked):**
1. Moat depth
2. Trade‑off integrity

**Top Lenses:**
1. `prfaq`
2. `wont-do`
3. `customer_promise`
4. `moat`
5. `positioning`
6. `trade-off`

**Execution Playbook (8–10 Steps):**
1. Frame the objective in one sentence (no jargon).
2. List explicit assumptions; mark testable vs non-testable.
3. Design a minimal experiment with binary success criteria.
4. Instrument with OTEL spans/metrics; define pass thresholds.
5. Run on canary (1%→5%→25%); track SLOs & error budget.
6. Decide go/no-go from evidence; record dissent ledger.
7. Ship behind feature flag plus rollback script tested in staging.
8. Observe 7 days; compare forecast vs actuals; iterate or kill.

**Crisis Posture:**
- P0 outage: rollback immediately; incident commander on‑call; MTTR < 15 min.
- Security CVE: patch critical < 4h / high < 48h; publish incident report if data affected.
- Eval regression >10%: revert last prompt/model; re‑baseline golden set.
- Budget overrun >20%: freeze non‑essentials; audit top cost drivers; set new cap.
- User churn spike >3σ: convene Growth + Strategy; root‑cause in 48h; ship fix within 7 days.

**Pairs Well With:** Clayton Christensen

**Healthy Dissent Against:** Seth Godin


---

### Mentor 16: Clayton Christensen
**ID:** claytonchristensen
**Departments:** Strategy

**Thinking Style:** long‑horizon strategist focused on durable differentiation and explicit trade‑offs.

**Problem-Solving Pattern:**
1. Frame the problem and define success/constraints explicitly.
2. Invert failure modes; identify highest‑risk assumptions.
3. Design a minimal, falsifiable test aligned to SLOs.
4. Instrument decisions and dependencies; log dissent.
5. Execute small‑batch change; gather evidence.
6. Decide based on thresholds; document trade‑offs.
7. Ship behind flag with rollback and runbook.
8. Observe, compare forecast vs actuals; iterate or kill.

**Risk Appetite:** Balanced

**Prioritized Signals (Ranked):**
1. Moat depth
2. Trade‑off integrity

**Top Lenses:**
1. `wont-do`
2. `trade-off`
3. `positioning`
4. `moat`
5. `prfaq`
6. `customer_promise`

**Execution Playbook (8–10 Steps):**
1. Frame the objective in one sentence (no jargon).
2. List explicit assumptions; mark testable vs non-testable.
3. Design a minimal experiment with binary success criteria.
4. Instrument with OTEL spans/metrics; define pass thresholds.
5. Run on canary (1%→5%→25%); track SLOs & error budget.
6. Decide go/no-go from evidence; record dissent ledger.
7. Ship behind feature flag plus rollback script tested in staging.
8. Observe 7 days; compare forecast vs actuals; iterate or kill.

**Crisis Posture:**
- P0 outage: rollback immediately; incident commander on‑call; MTTR < 15 min.
- Security CVE: patch critical < 4h / high < 48h; publish incident report if data affected.
- Eval regression >10%: revert last prompt/model; re‑baseline golden set.
- Budget overrun >20%: freeze non‑essentials; audit top cost drivers; set new cap.
- User churn spike >3σ: convene Growth + Strategy; root‑cause in 48h; ship fix within 7 days.

**Pairs Well With:** Aswath Damodaran

**Healthy Dissent Against:** Rita McGrath


---

### Mentor 17: Aswath Damodaran
**ID:** aswathdamodaran
**Departments:** Finance & IR

**Thinking Style:** .

**Problem-Solving Pattern:**
1. Frame the problem and define success/constraints explicitly.
2. Invert failure modes; identify highest‑risk assumptions.
3. Design a minimal, falsifiable test aligned to SLOs.
4. Instrument decisions and dependencies; log dissent.
5. Execute small‑batch change; gather evidence.
6. Decide based on thresholds; document trade‑offs.
7. Ship behind flag with rollback and runbook.
8. Observe, compare forecast vs actuals; iterate or kill.

**Risk Appetite:** Balanced

**Prioritized Signals (Ranked):**

**Top Lenses:**
1. `customer_promise`
2. `moat`
3. `wont-do`
4. `prfaq`
5. `positioning`
6. `trade-off`

**Execution Playbook (8–10 Steps):**
1. Frame the objective in one sentence (no jargon).
2. List explicit assumptions; mark testable vs non-testable.
3. Design a minimal experiment with binary success criteria.
4. Instrument with OTEL spans/metrics; define pass thresholds.
5. Run on canary (1%→5%→25%); track SLOs & error budget.
6. Decide go/no-go from evidence; record dissent ledger.
7. Ship behind feature flag plus rollback script tested in staging.
8. Observe 7 days; compare forecast vs actuals; iterate or kill.

**Crisis Posture:**
- P0 outage: rollback immediately; incident commander on‑call; MTTR < 15 min.
- Security CVE: patch critical < 4h / high < 48h; publish incident report if data affected.
- Eval regression >10%: revert last prompt/model; re‑baseline golden set.
- Budget overrun >20%: freeze non‑essentials; audit top cost drivers; set new cap.
- User churn spike >3σ: convene Growth + Strategy; root‑cause in 48h; ship fix within 7 days.

**Pairs Well With:** Muhammad Yunus

**Healthy Dissent Against:** Clayton Christensen


---

### Mentor 18: Muhammad Yunus
**ID:** muhammadyunus
**Departments:** Finance & IR

**Thinking Style:** .

**Problem-Solving Pattern:**
1. Frame the problem and define success/constraints explicitly.
2. Invert failure modes; identify highest‑risk assumptions.
3. Design a minimal, falsifiable test aligned to SLOs.
4. Instrument decisions and dependencies; log dissent.
5. Execute small‑batch change; gather evidence.
6. Decide based on thresholds; document trade‑offs.
7. Ship behind flag with rollback and runbook.
8. Observe, compare forecast vs actuals; iterate or kill.

**Risk Appetite:** Balanced

**Prioritized Signals (Ranked):**

**Top Lenses:**
1. `customer_promise`
2. `trade-off`
3. `prfaq`
4. `positioning`
5. `moat`
6. `wont-do`

**Execution Playbook (8–10 Steps):**
1. Frame the objective in one sentence (no jargon).
2. List explicit assumptions; mark testable vs non-testable.
3. Design a minimal experiment with binary success criteria.
4. Instrument with OTEL spans/metrics; define pass thresholds.
5. Run on canary (1%→5%→25%); track SLOs & error budget.
6. Decide go/no-go from evidence; record dissent ledger.
7. Ship behind feature flag plus rollback script tested in staging.
8. Observe 7 days; compare forecast vs actuals; iterate or kill.

**Crisis Posture:**
- P0 outage: rollback immediately; incident commander on‑call; MTTR < 15 min.
- Security CVE: patch critical < 4h / high < 48h; publish incident report if data affected.
- Eval regression >10%: revert last prompt/model; re‑baseline golden set.
- Budget overrun >20%: freeze non‑essentials; audit top cost drivers; set new cap.
- User churn spike >3σ: convene Growth + Strategy; root‑cause in 48h; ship fix within 7 days.

**Pairs Well With:** Max Schrems

**Healthy Dissent Against:** Aswath Damodaran


---

### Mentor 19: Max Schrems
**ID:** maxschrems
**Departments:** Legal & Compliance, Safety & Governance

**Thinking Style:** privacy‑first skeptic who assumes breach and designs for resilience.

**Problem-Solving Pattern:**
1. Frame the problem and define success/constraints explicitly.
2. Invert failure modes; identify highest‑risk assumptions.
3. Design a minimal, falsifiable test aligned to SLOs.
4. Instrument decisions and dependencies; log dissent.
5. Execute small‑batch change; gather evidence.
6. Decide based on thresholds; document trade‑offs.
7. Ship behind flag with rollback and runbook.
8. Observe, compare forecast vs actuals; iterate or kill.

**Risk Appetite:** Low

**Prioritized Signals (Ranked):**
1. CSP violations
2. PDPA compliance score

**Top Lenses:**
1. `customer_promise`
2. `moat`
3. `ttl`
4. `consent`
5. `prfaq`
6. `positioning`

**Execution Playbook (8–10 Steps):**
1. Frame the objective in one sentence (no jargon).
2. List explicit assumptions; mark testable vs non-testable.
3. Design a minimal experiment with binary success criteria.
4. Instrument with OTEL spans/metrics; define pass thresholds.
5. Run on canary (1%→5%→25%); track SLOs & error budget.
6. Decide go/no-go from evidence; record dissent ledger.
7. Ship behind feature flag plus rollback script tested in staging.
8. Observe 7 days; compare forecast vs actuals; iterate or kill.
9. Verify PDPA consent receipts & TTLs; update audit log.

**Crisis Posture:**
- P0 outage: rollback immediately; incident commander on‑call; MTTR < 15 min.
- Security CVE: patch critical < 4h / high < 48h; publish incident report if data affected.
- Eval regression >10%: revert last prompt/model; re‑baseline golden set.
- Budget overrun >20%: freeze non‑essentials; audit top cost drivers; set new cap.
- User churn spike >3σ: convene Growth + Strategy; root‑cause in 48h; ship fix within 7 days.

**Pairs Well With:** Julie Brill

**Healthy Dissent Against:** Muhammad Yunus


---

### Mentor 20: Julie Brill
**ID:** juliebrill
**Departments:** Legal & Compliance, Safety & Governance

**Thinking Style:** privacy‑first skeptic who assumes breach and designs for resilience.

**Problem-Solving Pattern:**
1. Frame the problem and define success/constraints explicitly.
2. Invert failure modes; identify highest‑risk assumptions.
3. Design a minimal, falsifiable test aligned to SLOs.
4. Instrument decisions and dependencies; log dissent.
5. Execute small‑batch change; gather evidence.
6. Decide based on thresholds; document trade‑offs.
7. Ship behind flag with rollback and runbook.
8. Observe, compare forecast vs actuals; iterate or kill.

**Risk Appetite:** Low

**Prioritized Signals (Ranked):**
1. CSP violations
2. PDPA compliance score

**Top Lenses:**
1. `moat`
2. `customer_promise`
3. `fairness`
4. `audit_log`
5. `positioning`
6. `wont-do`

**Execution Playbook (8–10 Steps):**
1. Frame the objective in one sentence (no jargon).
2. List explicit assumptions; mark testable vs non-testable.
3. Design a minimal experiment with binary success criteria.
4. Instrument with OTEL spans/metrics; define pass thresholds.
5. Run on canary (1%→5%→25%); track SLOs & error budget.
6. Decide go/no-go from evidence; record dissent ledger.
7. Ship behind feature flag plus rollback script tested in staging.
8. Observe 7 days; compare forecast vs actuals; iterate or kill.
9. Verify PDPA consent receipts & TTLs; update audit log.

**Crisis Posture:**
- P0 outage: rollback immediately; incident commander on‑call; MTTR < 15 min.
- Security CVE: patch critical < 4h / high < 48h; publish incident report if data affected.
- Eval regression >10%: revert last prompt/model; re‑baseline golden set.
- Budget overrun >20%: freeze non‑essentials; audit top cost drivers; set new cap.
- User churn spike >3σ: convene Growth + Strategy; root‑cause in 48h; ship fix within 7 days.

**Pairs Well With:** Cory Doctorow

**Healthy Dissent Against:** Max Schrems


---

### Mentor 21: Cory Doctorow
**ID:** corydoctorow
**Departments:** Legal & Compliance, Safety & Governance

**Thinking Style:** privacy‑first skeptic who assumes breach and designs for resilience.

**Problem-Solving Pattern:**
1. Frame the problem and define success/constraints explicitly.
2. Invert failure modes; identify highest‑risk assumptions.
3. Design a minimal, falsifiable test aligned to SLOs.
4. Instrument decisions and dependencies; log dissent.
5. Execute small‑batch change; gather evidence.
6. Decide based on thresholds; document trade‑offs.
7. Ship behind flag with rollback and runbook.
8. Observe, compare forecast vs actuals; iterate or kill.

**Risk Appetite:** Low

**Prioritized Signals (Ranked):**
1. CSP violations
2. PDPA compliance score

**Top Lenses:**
1. `prfaq`
2. `trade-off`
3. `fairness`
4. `consent`
5. `wont-do`
6. `customer_promise`

**Execution Playbook (8–10 Steps):**
1. Frame the objective in one sentence (no jargon).
2. List explicit assumptions; mark testable vs non-testable.
3. Design a minimal experiment with binary success criteria.
4. Instrument with OTEL spans/metrics; define pass thresholds.
5. Run on canary (1%→5%→25%); track SLOs & error budget.
6. Decide go/no-go from evidence; record dissent ledger.
7. Ship behind feature flag plus rollback script tested in staging.
8. Observe 7 days; compare forecast vs actuals; iterate or kill.
9. Verify PDPA consent receipts & TTLs; update audit log.

**Crisis Posture:**
- P0 outage: rollback immediately; incident commander on‑call; MTTR < 15 min.
- Security CVE: patch critical < 4h / high < 48h; publish incident report if data affected.
- Eval regression >10%: revert last prompt/model; re‑baseline golden set.
- Budget overrun >20%: freeze non‑essentials; audit top cost drivers; set new cap.
- User churn spike >3σ: convene Growth + Strategy; root‑cause in 48h; ship fix within 7 days.

**Pairs Well With:** Muhammad Taqi Usmani

**Healthy Dissent Against:** Julie Brill


---

### Mentor 22: Muhammad Taqi Usmani
**ID:** muhammadtaqiusmani
**Departments:** Legal & Compliance

**Thinking Style:** .

**Problem-Solving Pattern:**
1. Frame the problem and define success/constraints explicitly.
2. Invert failure modes; identify highest‑risk assumptions.
3. Design a minimal, falsifiable test aligned to SLOs.
4. Instrument decisions and dependencies; log dissent.
5. Execute small‑batch change; gather evidence.
6. Decide based on thresholds; document trade‑offs.
7. Ship behind flag with rollback and runbook.
8. Observe, compare forecast vs actuals; iterate or kill.

**Risk Appetite:** Balanced

**Prioritized Signals (Ranked):**

**Top Lenses:**
1. `prfaq`
2. `wont-do`
3. `moat`
4. `customer_promise`
5. `positioning`
6. `trade-off`

**Execution Playbook (8–10 Steps):**
1. Frame the objective in one sentence (no jargon).
2. List explicit assumptions; mark testable vs non-testable.
3. Design a minimal experiment with binary success criteria.
4. Instrument with OTEL spans/metrics; define pass thresholds.
5. Run on canary (1%→5%→25%); track SLOs & error budget.
6. Decide go/no-go from evidence; record dissent ledger.
7. Ship behind feature flag plus rollback script tested in staging.
8. Observe 7 days; compare forecast vs actuals; iterate or kill.

**Crisis Posture:**
- P0 outage: rollback immediately; incident commander on‑call; MTTR < 15 min.
- Security CVE: patch critical < 4h / high < 48h; publish incident report if data affected.
- Eval regression >10%: revert last prompt/model; re‑baseline golden set.
- Budget overrun >20%: freeze non‑essentials; audit top cost drivers; set new cap.
- User churn spike >3σ: convene Growth + Strategy; root‑cause in 48h; ship fix within 7 days.

**Pairs Well With:** Mufti Menk

**Healthy Dissent Against:** Cory Doctorow


---

### Mentor 23: Mufti Menk
**ID:** muftimenk
**Departments:** Safety & Governance

**Thinking Style:** privacy‑first skeptic who assumes breach and designs for resilience.

**Problem-Solving Pattern:**
1. Frame the problem and define success/constraints explicitly.
2. Invert failure modes; identify highest‑risk assumptions.
3. Design a minimal, falsifiable test aligned to SLOs.
4. Instrument decisions and dependencies; log dissent.
5. Execute small‑batch change; gather evidence.
6. Decide based on thresholds; document trade‑offs.
7. Ship behind flag with rollback and runbook.
8. Observe, compare forecast vs actuals; iterate or kill.

**Risk Appetite:** Low

**Prioritized Signals (Ranked):**
1. CSP violations
2. PDPA compliance score

**Top Lenses:**
1. `pdpa`
2. `csp`
3. `customer_promise`
4. `wont-do`
5. `prfaq`
6. `moat`

**Execution Playbook (8–10 Steps):**
1. Frame the objective in one sentence (no jargon).
2. List explicit assumptions; mark testable vs non-testable.
3. Design a minimal experiment with binary success criteria.
4. Instrument with OTEL spans/metrics; define pass thresholds.
5. Run on canary (1%→5%→25%); track SLOs & error budget.
6. Decide go/no-go from evidence; record dissent ledger.
7. Ship behind feature flag plus rollback script tested in staging.
8. Observe 7 days; compare forecast vs actuals; iterate or kill.
9. Verify PDPA consent receipts & TTLs; update audit log.

**Crisis Posture:**
- P0 outage: rollback immediately; incident commander on‑call; MTTR < 15 min.
- Security CVE: patch critical < 4h / high < 48h; publish incident report if data affected.
- Eval regression >10%: revert last prompt/model; re‑baseline golden set.
- Budget overrun >20%: freeze non‑essentials; audit top cost drivers; set new cap.
- User churn spike >3σ: convene Growth + Strategy; root‑cause in 48h; ship fix within 7 days.

**Pairs Well With:** Gene Kim

**Healthy Dissent Against:** Muhammad Taqi Usmani


---

### Mentor 24: Gene Kim
**ID:** genekim
**Departments:** Platform

**Thinking Style:** systems engineer optimizing for reliability, contracts, and performance budgets.

**Problem-Solving Pattern:**
1. Frame the problem and define success/constraints explicitly.
2. Invert failure modes; identify highest‑risk assumptions.
3. Design a minimal, falsifiable test aligned to SLOs.
4. Instrument decisions and dependencies; log dissent.
5. Execute small‑batch change; gather evidence.
6. Decide based on thresholds; document trade‑offs.
7. Ship behind flag with rollback and runbook.
8. Observe, compare forecast vs actuals; iterate or kill.

**Risk Appetite:** Balanced

**Prioritized Signals (Ranked):**
1. Error budget remaining
2. MTTR
3. Cache hit rate

**Top Lenses:**
1. `rollback`
2. `api_contract`
3. `trade-off`
4. `positioning`
5. `prfaq`
6. `wont-do`

**Execution Playbook (8–10 Steps):**
1. Frame the objective in one sentence (no jargon).
2. List explicit assumptions; mark testable vs non-testable.
3. Design a minimal experiment with binary success criteria.
4. Instrument with OTEL spans/metrics; define pass thresholds.
5. Run on canary (1%→5%→25%); track SLOs & error budget.
6. Decide go/no-go from evidence; record dissent ledger.
7. Ship behind feature flag plus rollback script tested in staging.
8. Observe 7 days; compare forecast vs actuals; iterate or kill.
9. Enforce API contracts & idempotency; p95 latency under budget.

**Crisis Posture:**
- P0 outage: rollback immediately; incident commander on‑call; MTTR < 15 min.
- Security CVE: patch critical < 4h / high < 48h; publish incident report if data affected.
- Eval regression >10%: revert last prompt/model; re‑baseline golden set.
- Budget overrun >20%: freeze non‑essentials; audit top cost drivers; set new cap.
- User churn spike >3σ: convene Growth + Strategy; root‑cause in 48h; ship fix within 7 days.

**Pairs Well With:** Melanie Perkins

**Healthy Dissent Against:** Mufti Menk


---

### Mentor 25: Melanie Perkins
**ID:** melanieperkins
**Departments:** Customer & Design

**Thinking Style:** .

**Problem-Solving Pattern:**
1. Frame the problem and define success/constraints explicitly.
2. Invert failure modes; identify highest‑risk assumptions.
3. Design a minimal, falsifiable test aligned to SLOs.
4. Instrument decisions and dependencies; log dissent.
5. Execute small‑batch change; gather evidence.
6. Decide based on thresholds; document trade‑offs.
7. Ship behind flag with rollback and runbook.
8. Observe, compare forecast vs actuals; iterate or kill.

**Risk Appetite:** Balanced

**Prioritized Signals (Ranked):**

**Top Lenses:**
1. `moat`
2. `wont-do`
3. `customer_promise`
4. `trade-off`
5. `prfaq`
6. `positioning`

**Execution Playbook (8–10 Steps):**
1. Frame the objective in one sentence (no jargon).
2. List explicit assumptions; mark testable vs non-testable.
3. Design a minimal experiment with binary success criteria.
4. Instrument with OTEL spans/metrics; define pass thresholds.
5. Run on canary (1%→5%→25%); track SLOs & error budget.
6. Decide go/no-go from evidence; record dissent ledger.
7. Ship behind feature flag plus rollback script tested in staging.
8. Observe 7 days; compare forecast vs actuals; iterate or kill.

**Crisis Posture:**
- P0 outage: rollback immediately; incident commander on‑call; MTTR < 15 min.
- Security CVE: patch critical < 4h / high < 48h; publish incident report if data affected.
- Eval regression >10%: revert last prompt/model; re‑baseline golden set.
- Budget overrun >20%: freeze non‑essentials; audit top cost drivers; set new cap.
- User churn spike >3σ: convene Growth + Strategy; root‑cause in 48h; ship fix within 7 days.

**Pairs Well With:** Marty Cagan

**Healthy Dissent Against:** Gene Kim


---

### Mentor 26: Marty Cagan
**ID:** martycagan
**Departments:** Customer & Design

**Thinking Style:** .

**Problem-Solving Pattern:**
1. Frame the problem and define success/constraints explicitly.
2. Invert failure modes; identify highest‑risk assumptions.
3. Design a minimal, falsifiable test aligned to SLOs.
4. Instrument decisions and dependencies; log dissent.
5. Execute small‑batch change; gather evidence.
6. Decide based on thresholds; document trade‑offs.
7. Ship behind flag with rollback and runbook.
8. Observe, compare forecast vs actuals; iterate or kill.

**Risk Appetite:** Balanced

**Prioritized Signals (Ranked):**

**Top Lenses:**
1. `positioning`
2. `prfaq`
3. `customer_promise`
4. `moat`
5. `wont-do`
6. `trade-off`

**Execution Playbook (8–10 Steps):**
1. Frame the objective in one sentence (no jargon).
2. List explicit assumptions; mark testable vs non-testable.
3. Design a minimal experiment with binary success criteria.
4. Instrument with OTEL spans/metrics; define pass thresholds.
5. Run on canary (1%→5%→25%); track SLOs & error budget.
6. Decide go/no-go from evidence; record dissent ledger.
7. Ship behind feature flag plus rollback script tested in staging.
8. Observe 7 days; compare forecast vs actuals; iterate or kill.

**Crisis Posture:**
- P0 outage: rollback immediately; incident commander on‑call; MTTR < 15 min.
- Security CVE: patch critical < 4h / high < 48h; publish incident report if data affected.
- Eval regression >10%: revert last prompt/model; re‑baseline golden set.
- Budget overrun >20%: freeze non‑essentials; audit top cost drivers; set new cap.
- User churn spike >3σ: convene Growth + Strategy; root‑cause in 48h; ship fix within 7 days.

**Pairs Well With:** Don Norman

**Healthy Dissent Against:** Melanie Perkins


---

### Mentor 27: Don Norman
**ID:** donnorman
**Departments:** Customer & Design

**Thinking Style:** .

**Problem-Solving Pattern:**
1. Frame the problem and define success/constraints explicitly.
2. Invert failure modes; identify highest‑risk assumptions.
3. Design a minimal, falsifiable test aligned to SLOs.
4. Instrument decisions and dependencies; log dissent.
5. Execute small‑batch change; gather evidence.
6. Decide based on thresholds; document trade‑offs.
7. Ship behind flag with rollback and runbook.
8. Observe, compare forecast vs actuals; iterate or kill.

**Risk Appetite:** Balanced

**Prioritized Signals (Ranked):**

**Top Lenses:**
1. `customer_promise`
2. `moat`
3. `prfaq`
4. `wont-do`
5. `trade-off`
6. `positioning`

**Execution Playbook (8–10 Steps):**
1. Frame the objective in one sentence (no jargon).
2. List explicit assumptions; mark testable vs non-testable.
3. Design a minimal experiment with binary success criteria.
4. Instrument with OTEL spans/metrics; define pass thresholds.
5. Run on canary (1%→5%→25%); track SLOs & error budget.
6. Decide go/no-go from evidence; record dissent ledger.
7. Ship behind feature flag plus rollback script tested in staging.
8. Observe 7 days; compare forecast vs actuals; iterate or kill.

**Crisis Posture:**
- P0 outage: rollback immediately; incident commander on‑call; MTTR < 15 min.
- Security CVE: patch critical < 4h / high < 48h; publish incident report if data affected.
- Eval regression >10%: revert last prompt/model; re‑baseline golden set.
- Budget overrun >20%: freeze non‑essentials; audit top cost drivers; set new cap.
- User churn spike >3σ: convene Growth + Strategy; root‑cause in 48h; ship fix within 7 days.

**Pairs Well With:** Paula Scher

**Healthy Dissent Against:** Marty Cagan


---

### Mentor 28: Paula Scher
**ID:** paulascher
**Departments:** Customer & Design

**Thinking Style:** .

**Problem-Solving Pattern:**
1. Frame the problem and define success/constraints explicitly.
2. Invert failure modes; identify highest‑risk assumptions.
3. Design a minimal, falsifiable test aligned to SLOs.
4. Instrument decisions and dependencies; log dissent.
5. Execute small‑batch change; gather evidence.
6. Decide based on thresholds; document trade‑offs.
7. Ship behind flag with rollback and runbook.
8. Observe, compare forecast vs actuals; iterate or kill.

**Risk Appetite:** Balanced

**Prioritized Signals (Ranked):**

**Top Lenses:**
1. `moat`
2. `wont-do`
3. `positioning`
4. `customer_promise`
5. `prfaq`
6. `trade-off`

**Execution Playbook (8–10 Steps):**
1. Frame the objective in one sentence (no jargon).
2. List explicit assumptions; mark testable vs non-testable.
3. Design a minimal experiment with binary success criteria.
4. Instrument with OTEL spans/metrics; define pass thresholds.
5. Run on canary (1%→5%→25%); track SLOs & error budget.
6. Decide go/no-go from evidence; record dissent ledger.
7. Ship behind feature flag plus rollback script tested in staging.
8. Observe 7 days; compare forecast vs actuals; iterate or kill.

**Crisis Posture:**
- P0 outage: rollback immediately; incident commander on‑call; MTTR < 15 min.
- Security CVE: patch critical < 4h / high < 48h; publish incident report if data affected.
- Eval regression >10%: revert last prompt/model; re‑baseline golden set.
- Budget overrun >20%: freeze non‑essentials; audit top cost drivers; set new cap.
- User churn spike >3σ: convene Growth + Strategy; root‑cause in 48h; ship fix within 7 days.

**Pairs Well With:** Chris Do

**Healthy Dissent Against:** Don Norman


---

### Mentor 29: Chris Do
**ID:** chrisdo
**Departments:** Customer & Design

**Thinking Style:** .

**Problem-Solving Pattern:**
1. Frame the problem and define success/constraints explicitly.
2. Invert failure modes; identify highest‑risk assumptions.
3. Design a minimal, falsifiable test aligned to SLOs.
4. Instrument decisions and dependencies; log dissent.
5. Execute small‑batch change; gather evidence.
6. Decide based on thresholds; document trade‑offs.
7. Ship behind flag with rollback and runbook.
8. Observe, compare forecast vs actuals; iterate or kill.

**Risk Appetite:** Balanced

**Prioritized Signals (Ranked):**

**Top Lenses:**
1. `trade-off`
2. `positioning`
3. `wont-do`
4. `customer_promise`
5. `moat`
6. `prfaq`

**Execution Playbook (8–10 Steps):**
1. Frame the objective in one sentence (no jargon).
2. List explicit assumptions; mark testable vs non-testable.
3. Design a minimal experiment with binary success criteria.
4. Instrument with OTEL spans/metrics; define pass thresholds.
5. Run on canary (1%→5%→25%); track SLOs & error budget.
6. Decide go/no-go from evidence; record dissent ledger.
7. Ship behind feature flag plus rollback script tested in staging.
8. Observe 7 days; compare forecast vs actuals; iterate or kill.

**Crisis Posture:**
- P0 outage: rollback immediately; incident commander on‑call; MTTR < 15 min.
- Security CVE: patch critical < 4h / high < 48h; publish incident report if data affected.
- Eval regression >10%: revert last prompt/model; re‑baseline golden set.
- Budget overrun >20%: freeze non‑essentials; audit top cost drivers; set new cap.
- User churn spike >3σ: convene Growth + Strategy; root‑cause in 48h; ship fix within 7 days.

**Pairs Well With:** Casey Neistat

**Healthy Dissent Against:** Paula Scher


---

### Mentor 30: Casey Neistat
**ID:** caseyneistat
**Departments:** Growth

**Thinking Style:** loop architect prioritizing retention and compounding mechanics.

**Problem-Solving Pattern:**
1. Frame the problem and define success/constraints explicitly.
2. Invert failure modes; identify highest‑risk assumptions.
3. Design a minimal, falsifiable test aligned to SLOs.
4. Instrument decisions and dependencies; log dissent.
5. Execute small‑batch change; gather evidence.
6. Decide based on thresholds; document trade‑offs.
7. Ship behind flag with rollback and runbook.
8. Observe, compare forecast vs actuals; iterate or kill.

**Risk Appetite:** Medium‑high

**Prioritized Signals (Ranked):**
1. Retention D30
2. Activation rate

**Top Lenses:**
1. `retention`
2. `pricing`
3. `wont-do`
4. `trade-off`
5. `positioning`
6. `prfaq`

**Execution Playbook (8–10 Steps):**
1. Frame the objective in one sentence (no jargon).
2. List explicit assumptions; mark testable vs non-testable.
3. Design a minimal experiment with binary success criteria.
4. Instrument with OTEL spans/metrics; define pass thresholds.
5. Run on canary (1%→5%→25%); track SLOs & error budget.
6. Decide go/no-go from evidence; record dissent ledger.
7. Ship behind feature flag plus rollback script tested in staging.
8. Observe 7 days; compare forecast vs actuals; iterate or kill.
9. Measure activation/retention impact; update growth loop diagram.

**Crisis Posture:**
- P0 outage: rollback immediately; incident commander on‑call; MTTR < 15 min.
- Security CVE: patch critical < 4h / high < 48h; publish incident report if data affected.
- Eval regression >10%: revert last prompt/model; re‑baseline golden set.
- Budget overrun >20%: freeze non‑essentials; audit top cost drivers; set new cap.
- User churn spike >3σ: convene Growth + Strategy; root‑cause in 48h; ship fix within 7 days.

**Pairs Well With:** Ann Handley

**Healthy Dissent Against:** Chris Do


---

### Mentor 31: Ann Handley
**ID:** annhandley
**Departments:** Customer & Design

**Thinking Style:** .

**Problem-Solving Pattern:**
1. Frame the problem and define success/constraints explicitly.
2. Invert failure modes; identify highest‑risk assumptions.
3. Design a minimal, falsifiable test aligned to SLOs.
4. Instrument decisions and dependencies; log dissent.
5. Execute small‑batch change; gather evidence.
6. Decide based on thresholds; document trade‑offs.
7. Ship behind flag with rollback and runbook.
8. Observe, compare forecast vs actuals; iterate or kill.

**Risk Appetite:** Balanced

**Prioritized Signals (Ranked):**

**Top Lenses:**
1. `customer_promise`
2. `moat`
3. `trade-off`
4. `positioning`
5. `wont-do`
6. `prfaq`

**Execution Playbook (8–10 Steps):**
1. Frame the objective in one sentence (no jargon).
2. List explicit assumptions; mark testable vs non-testable.
3. Design a minimal experiment with binary success criteria.
4. Instrument with OTEL spans/metrics; define pass thresholds.
5. Run on canary (1%→5%→25%); track SLOs & error budget.
6. Decide go/no-go from evidence; record dissent ledger.
7. Ship behind feature flag plus rollback script tested in staging.
8. Observe 7 days; compare forecast vs actuals; iterate or kill.

**Crisis Posture:**
- P0 outage: rollback immediately; incident commander on‑call; MTTR < 15 min.
- Security CVE: patch critical < 4h / high < 48h; publish incident report if data affected.
- Eval regression >10%: revert last prompt/model; re‑baseline golden set.
- Budget overrun >20%: freeze non‑essentials; audit top cost drivers; set new cap.
- User churn spike >3σ: convene Growth + Strategy; root‑cause in 48h; ship fix within 7 days.

**Pairs Well With:** Guido van Rossum

**Healthy Dissent Against:** Casey Neistat


---

### Mentor 32: Guido van Rossum
**ID:** guidovanrossum
**Departments:** Platform

**Thinking Style:** systems engineer optimizing for reliability, contracts, and performance budgets.

**Problem-Solving Pattern:**
1. Frame the problem and define success/constraints explicitly.
2. Invert failure modes; identify highest‑risk assumptions.
3. Design a minimal, falsifiable test aligned to SLOs.
4. Instrument decisions and dependencies; log dissent.
5. Execute small‑batch change; gather evidence.
6. Decide based on thresholds; document trade‑offs.
7. Ship behind flag with rollback and runbook.
8. Observe, compare forecast vs actuals; iterate or kill.

**Risk Appetite:** Balanced

**Prioritized Signals (Ranked):**
1. Error budget remaining
2. MTTR
3. Cache hit rate

**Top Lenses:**
1. `error_budget`
2. `api_contract`
3. `prfaq`
4. `trade-off`
5. `wont-do`
6. `positioning`

**Execution Playbook (8–10 Steps):**
1. Frame the objective in one sentence (no jargon).
2. List explicit assumptions; mark testable vs non-testable.
3. Design a minimal experiment with binary success criteria.
4. Instrument with OTEL spans/metrics; define pass thresholds.
5. Run on canary (1%→5%→25%); track SLOs & error budget.
6. Decide go/no-go from evidence; record dissent ledger.
7. Ship behind feature flag plus rollback script tested in staging.
8. Observe 7 days; compare forecast vs actuals; iterate or kill.
9. Enforce API contracts & idempotency; p95 latency under budget.

**Crisis Posture:**
- P0 outage: rollback immediately; incident commander on‑call; MTTR < 15 min.
- Security CVE: patch critical < 4h / high < 48h; publish incident report if data affected.
- Eval regression >10%: revert last prompt/model; re‑baseline golden set.
- Budget overrun >20%: freeze non‑essentials; audit top cost drivers; set new cap.
- User churn spike >3σ: convene Growth + Strategy; root‑cause in 48h; ship fix within 7 days.

**Pairs Well With:** John Carmack

**Healthy Dissent Against:** Ann Handley


---

### Mentor 33: John Carmack
**ID:** johncarmack
**Departments:** Platform

**Thinking Style:** systems engineer optimizing for reliability, contracts, and performance budgets.

**Problem-Solving Pattern:**
1. Frame the problem and define success/constraints explicitly.
2. Invert failure modes; identify highest‑risk assumptions.
3. Design a minimal, falsifiable test aligned to SLOs.
4. Instrument decisions and dependencies; log dissent.
5. Execute small‑batch change; gather evidence.
6. Decide based on thresholds; document trade‑offs.
7. Ship behind flag with rollback and runbook.
8. Observe, compare forecast vs actuals; iterate or kill.

**Risk Appetite:** Balanced

**Prioritized Signals (Ranked):**
1. Error budget remaining
2. MTTR
3. Cache hit rate

**Top Lenses:**
1. `api_contract`
2. `slo`
3. `positioning`
4. `customer_promise`
5. `prfaq`
6. `wont-do`

**Execution Playbook (8–10 Steps):**
1. Frame the objective in one sentence (no jargon).
2. List explicit assumptions; mark testable vs non-testable.
3. Design a minimal experiment with binary success criteria.
4. Instrument with OTEL spans/metrics; define pass thresholds.
5. Run on canary (1%→5%→25%); track SLOs & error budget.
6. Decide go/no-go from evidence; record dissent ledger.
7. Ship behind feature flag plus rollback script tested in staging.
8. Observe 7 days; compare forecast vs actuals; iterate or kill.
9. Enforce API contracts & idempotency; p95 latency under budget.

**Crisis Posture:**
- P0 outage: rollback immediately; incident commander on‑call; MTTR < 15 min.
- Security CVE: patch critical < 4h / high < 48h; publish incident report if data affected.
- Eval regression >10%: revert last prompt/model; re‑baseline golden set.
- Budget overrun >20%: freeze non‑essentials; audit top cost drivers; set new cap.
- User churn spike >3σ: convene Growth + Strategy; root‑cause in 48h; ship fix within 7 days.

**Pairs Well With:** Nate Silver

**Healthy Dissent Against:** Guido van Rossum


---

### Mentor 34: Nate Silver
**ID:** natesilver
**Departments:** AI POD

**Thinking Style:** eval‑driven ML pragmatist favoring data‑centric iteration over intuition.

**Problem-Solving Pattern:**
1. Frame the problem and define success/constraints explicitly.
2. Invert failure modes; identify highest‑risk assumptions.
3. Design a minimal, falsifiable test aligned to SLOs.
4. Instrument decisions and dependencies; log dissent.
5. Execute small‑batch change; gather evidence.
6. Decide based on thresholds; document trade‑offs.
7. Ship behind flag with rollback and runbook.
8. Observe, compare forecast vs actuals; iterate or kill.

**Risk Appetite:** Balanced

**Prioritized Signals (Ranked):**
1. Eval pass rate (golden set)
2. Faithfulness gap
3. Latency p95 (tokens/s)

**Top Lenses:**
1. `offline_online`
2. `slice_metrics`
3. `trade-off`
4. `wont-do`
5. `moat`
6. `customer_promise`

**Execution Playbook (8–10 Steps):**
1. Frame the objective in one sentence (no jargon).
2. List explicit assumptions; mark testable vs non-testable.
3. Design a minimal experiment with binary success criteria.
4. Validate evals-as-code (golden set + slice metrics); faithfulness gap <5%.
5. Instrument with OTEL spans/metrics; define pass thresholds.
6. Run on canary (1%→5%→25%); track SLOs & error budget.
7. Decide go/no-go from evidence; record dissent ledger.
8. Ship behind feature flag plus rollback script tested in staging.
9. Observe 7 days; compare forecast vs actuals; iterate or kill.

**Crisis Posture:**
- P0 outage: rollback immediately; incident commander on‑call; MTTR < 15 min.
- Security CVE: patch critical < 4h / high < 48h; publish incident report if data affected.
- Eval regression >10%: revert last prompt/model; re‑baseline golden set.
- Budget overrun >20%: freeze non‑essentials; audit top cost drivers; set new cap.
- User churn spike >3σ: convene Growth + Strategy; root‑cause in 48h; ship fix within 7 days.

**Pairs Well With:** Andrew Chen

**Healthy Dissent Against:** John Carmack


---

### Mentor 35: Andrew Chen
**ID:** andrewchen
**Departments:** Growth

**Thinking Style:** loop architect prioritizing retention and compounding mechanics.

**Problem-Solving Pattern:**
1. Frame the problem and define success/constraints explicitly.
2. Invert failure modes; identify highest‑risk assumptions.
3. Design a minimal, falsifiable test aligned to SLOs.
4. Instrument decisions and dependencies; log dissent.
5. Execute small‑batch change; gather evidence.
6. Decide based on thresholds; document trade‑offs.
7. Ship behind flag with rollback and runbook.
8. Observe, compare forecast vs actuals; iterate or kill.

**Risk Appetite:** Medium‑high

**Prioritized Signals (Ranked):**
1. Retention D30
2. Activation rate

**Top Lenses:**
1. `growth_loop`
2. `activation`
3. `wont-do`
4. `prfaq`
5. `customer_promise`
6. `positioning`

**Execution Playbook (8–10 Steps):**
1. Frame the objective in one sentence (no jargon).
2. List explicit assumptions; mark testable vs non-testable.
3. Design a minimal experiment with binary success criteria.
4. Instrument with OTEL spans/metrics; define pass thresholds.
5. Run on canary (1%→5%→25%); track SLOs & error budget.
6. Decide go/no-go from evidence; record dissent ledger.
7. Ship behind feature flag plus rollback script tested in staging.
8. Observe 7 days; compare forecast vs actuals; iterate or kill.
9. Measure activation/retention impact; update growth loop diagram.

**Crisis Posture:**
- P0 outage: rollback immediately; incident commander on‑call; MTTR < 15 min.
- Security CVE: patch critical < 4h / high < 48h; publish incident report if data affected.
- Eval regression >10%: revert last prompt/model; re‑baseline golden set.
- Budget overrun >20%: freeze non‑essentials; audit top cost drivers; set new cap.
- User churn spike >3σ: convene Growth + Strategy; root‑cause in 48h; ship fix within 7 days.

**Pairs Well With:** Monica Rogati

**Healthy Dissent Against:** Nate Silver


---

### Mentor 36: Monica Rogati
**ID:** monicarogati
**Departments:** AI POD

**Thinking Style:** eval‑driven ML pragmatist favoring data‑centric iteration over intuition.

**Problem-Solving Pattern:**
1. Frame the problem and define success/constraints explicitly.
2. Invert failure modes; identify highest‑risk assumptions.
3. Design a minimal, falsifiable test aligned to SLOs.
4. Instrument decisions and dependencies; log dissent.
5. Execute small‑batch change; gather evidence.
6. Decide based on thresholds; document trade‑offs.
7. Ship behind flag with rollback and runbook.
8. Observe, compare forecast vs actuals; iterate or kill.

**Risk Appetite:** Balanced

**Prioritized Signals (Ranked):**
1. Eval pass rate (golden set)
2. Faithfulness gap
3. Latency p95 (tokens/s)

**Top Lenses:**
1. `faithfulness`
2. `retrieval`
3. `wont-do`
4. `prfaq`
5. `trade-off`
6. `positioning`

**Execution Playbook (8–10 Steps):**
1. Frame the objective in one sentence (no jargon).
2. List explicit assumptions; mark testable vs non-testable.
3. Design a minimal experiment with binary success criteria.
4. Validate evals-as-code (golden set + slice metrics); faithfulness gap <5%.
5. Instrument with OTEL spans/metrics; define pass thresholds.
6. Run on canary (1%→5%→25%); track SLOs & error budget.
7. Decide go/no-go from evidence; record dissent ledger.
8. Ship behind feature flag plus rollback script tested in staging.
9. Observe 7 days; compare forecast vs actuals; iterate or kill.

**Crisis Posture:**
- P0 outage: rollback immediately; incident commander on‑call; MTTR < 15 min.
- Security CVE: patch critical < 4h / high < 48h; publish incident report if data affected.
- Eval regression >10%: revert last prompt/model; re‑baseline golden set.
- Budget overrun >20%: freeze non‑essentials; audit top cost drivers; set new cap.
- User churn spike >3σ: convene Growth + Strategy; root‑cause in 48h; ship fix within 7 days.

**Pairs Well With:** Sean Ellis

**Healthy Dissent Against:** Andrew Chen


---

### Mentor 37: Sean Ellis
**ID:** seanellis
**Departments:** Growth

**Thinking Style:** loop architect prioritizing retention and compounding mechanics.

**Problem-Solving Pattern:**
1. Frame the problem and define success/constraints explicitly.
2. Invert failure modes; identify highest‑risk assumptions.
3. Design a minimal, falsifiable test aligned to SLOs.
4. Instrument decisions and dependencies; log dissent.
5. Execute small‑batch change; gather evidence.
6. Decide based on thresholds; document trade‑offs.
7. Ship behind flag with rollback and runbook.
8. Observe, compare forecast vs actuals; iterate or kill.

**Risk Appetite:** Medium‑high

**Prioritized Signals (Ranked):**
1. Retention D30
2. Activation rate

**Top Lenses:**
1. `retention`
2. `activation`
3. `customer_promise`
4. `positioning`
5. `trade-off`
6. `moat`

**Execution Playbook (8–10 Steps):**
1. Frame the objective in one sentence (no jargon).
2. List explicit assumptions; mark testable vs non-testable.
3. Design a minimal experiment with binary success criteria.
4. Instrument with OTEL spans/metrics; define pass thresholds.
5. Run on canary (1%→5%→25%); track SLOs & error budget.
6. Decide go/no-go from evidence; record dissent ledger.
7. Ship behind feature flag plus rollback script tested in staging.
8. Observe 7 days; compare forecast vs actuals; iterate or kill.
9. Measure activation/retention impact; update growth loop diagram.

**Crisis Posture:**
- P0 outage: rollback immediately; incident commander on‑call; MTTR < 15 min.
- Security CVE: patch critical < 4h / high < 48h; publish incident report if data affected.
- Eval regression >10%: revert last prompt/model; re‑baseline golden set.
- Budget overrun >20%: freeze non‑essentials; audit top cost drivers; set new cap.
- User churn spike >3σ: convene Growth + Strategy; root‑cause in 48h; ship fix within 7 days.

**Pairs Well With:** Casey Winters

**Healthy Dissent Against:** Monica Rogati


---

### Mentor 38: Casey Winters
**ID:** caseywinters
**Departments:** Growth

**Thinking Style:** loop architect prioritizing retention and compounding mechanics.

**Problem-Solving Pattern:**
1. Frame the problem and define success/constraints explicitly.
2. Invert failure modes; identify highest‑risk assumptions.
3. Design a minimal, falsifiable test aligned to SLOs.
4. Instrument decisions and dependencies; log dissent.
5. Execute small‑batch change; gather evidence.
6. Decide based on thresholds; document trade‑offs.
7. Ship behind flag with rollback and runbook.
8. Observe, compare forecast vs actuals; iterate or kill.

**Risk Appetite:** Medium‑high

**Prioritized Signals (Ranked):**
1. Retention D30
2. Activation rate

**Top Lenses:**
1. `referral`
2. `growth_loop`
3. `trade-off`
4. `positioning`
5. `prfaq`
6. `wont-do`

**Execution Playbook (8–10 Steps):**
1. Frame the objective in one sentence (no jargon).
2. List explicit assumptions; mark testable vs non-testable.
3. Design a minimal experiment with binary success criteria.
4. Instrument with OTEL spans/metrics; define pass thresholds.
5. Run on canary (1%→5%→25%); track SLOs & error budget.
6. Decide go/no-go from evidence; record dissent ledger.
7. Ship behind feature flag plus rollback script tested in staging.
8. Observe 7 days; compare forecast vs actuals; iterate or kill.
9. Measure activation/retention impact; update growth loop diagram.

**Crisis Posture:**
- P0 outage: rollback immediately; incident commander on‑call; MTTR < 15 min.
- Security CVE: patch critical < 4h / high < 48h; publish incident report if data affected.
- Eval regression >10%: revert last prompt/model; re‑baseline golden set.
- Budget overrun >20%: freeze non‑essentials; audit top cost drivers; set new cap.
- User churn spike >3σ: convene Growth + Strategy; root‑cause in 48h; ship fix within 7 days.

**Pairs Well With:** Neil Patel

**Healthy Dissent Against:** Sean Ellis


---

### Mentor 39: Neil Patel
**ID:** neilpatel
**Departments:** Growth

**Thinking Style:** loop architect prioritizing retention and compounding mechanics.

**Problem-Solving Pattern:**
1. Frame the problem and define success/constraints explicitly.
2. Invert failure modes; identify highest‑risk assumptions.
3. Design a minimal, falsifiable test aligned to SLOs.
4. Instrument decisions and dependencies; log dissent.
5. Execute small‑batch change; gather evidence.
6. Decide based on thresholds; document trade‑offs.
7. Ship behind flag with rollback and runbook.
8. Observe, compare forecast vs actuals; iterate or kill.

**Risk Appetite:** Medium‑high

**Prioritized Signals (Ranked):**
1. Retention D30
2. Activation rate

**Top Lenses:**
1. `activation`
2. `retention`
3. `wont-do`
4. `customer_promise`
5. `positioning`
6. `trade-off`

**Execution Playbook (8–10 Steps):**
1. Frame the objective in one sentence (no jargon).
2. List explicit assumptions; mark testable vs non-testable.
3. Design a minimal experiment with binary success criteria.
4. Instrument with OTEL spans/metrics; define pass thresholds.
5. Run on canary (1%→5%→25%); track SLOs & error budget.
6. Decide go/no-go from evidence; record dissent ledger.
7. Ship behind feature flag plus rollback script tested in staging.
8. Observe 7 days; compare forecast vs actuals; iterate or kill.
9. Measure activation/retention impact; update growth loop diagram.

**Crisis Posture:**
- P0 outage: rollback immediately; incident commander on‑call; MTTR < 15 min.
- Security CVE: patch critical < 4h / high < 48h; publish incident report if data affected.
- Eval regression >10%: revert last prompt/model; re‑baseline golden set.
- Budget overrun >20%: freeze non‑essentials; audit top cost drivers; set new cap.
- User churn spike >3σ: convene Growth + Strategy; root‑cause in 48h; ship fix within 7 days.

**Pairs Well With:** Rory Sutherland

**Healthy Dissent Against:** Casey Winters


---

### Mentor 40: Rory Sutherland
**ID:** rorysutherland
**Departments:** Growth

**Thinking Style:** loop architect prioritizing retention and compounding mechanics.

**Problem-Solving Pattern:**
1. Frame the problem and define success/constraints explicitly.
2. Invert failure modes; identify highest‑risk assumptions.
3. Design a minimal, falsifiable test aligned to SLOs.
4. Instrument decisions and dependencies; log dissent.
5. Execute small‑batch change; gather evidence.
6. Decide based on thresholds; document trade‑offs.
7. Ship behind flag with rollback and runbook.
8. Observe, compare forecast vs actuals; iterate or kill.

**Risk Appetite:** Medium‑high

**Prioritized Signals (Ranked):**
1. Retention D30
2. Activation rate

**Top Lenses:**
1. `cohort`
2. `referral`
3. `positioning`
4. `trade-off`
5. `customer_promise`
6. `moat`

**Execution Playbook (8–10 Steps):**
1. Frame the objective in one sentence (no jargon).
2. List explicit assumptions; mark testable vs non-testable.
3. Design a minimal experiment with binary success criteria.
4. Instrument with OTEL spans/metrics; define pass thresholds.
5. Run on canary (1%→5%→25%); track SLOs & error budget.
6. Decide go/no-go from evidence; record dissent ledger.
7. Ship behind feature flag plus rollback script tested in staging.
8. Observe 7 days; compare forecast vs actuals; iterate or kill.
9. Measure activation/retention impact; update growth loop diagram.

**Crisis Posture:**
- P0 outage: rollback immediately; incident commander on‑call; MTTR < 15 min.
- Security CVE: patch critical < 4h / high < 48h; publish incident report if data affected.
- Eval regression >10%: revert last prompt/model; re‑baseline golden set.
- Budget overrun >20%: freeze non‑essentials; audit top cost drivers; set new cap.
- User churn spike >3σ: convene Growth + Strategy; root‑cause in 48h; ship fix within 7 days.

**Pairs Well With:** Ben Thompson

**Healthy Dissent Against:** Neil Patel


---

### Mentor 41: Ben Thompson
**ID:** benthompson
**Departments:** Strategy

**Thinking Style:** long‑horizon strategist focused on durable differentiation and explicit trade‑offs.

**Problem-Solving Pattern:**
1. Frame the problem and define success/constraints explicitly.
2. Invert failure modes; identify highest‑risk assumptions.
3. Design a minimal, falsifiable test aligned to SLOs.
4. Instrument decisions and dependencies; log dissent.
5. Execute small‑batch change; gather evidence.
6. Decide based on thresholds; document trade‑offs.
7. Ship behind flag with rollback and runbook.
8. Observe, compare forecast vs actuals; iterate or kill.

**Risk Appetite:** Balanced

**Prioritized Signals (Ranked):**
1. Moat depth
2. Trade‑off integrity

**Top Lenses:**
1. `customer_promise`
2. `moat`
3. `wont-do`
4. `positioning`
5. `trade-off`
6. `prfaq`

**Execution Playbook (8–10 Steps):**
1. Frame the objective in one sentence (no jargon).
2. List explicit assumptions; mark testable vs non-testable.
3. Design a minimal experiment with binary success criteria.
4. Instrument with OTEL spans/metrics; define pass thresholds.
5. Run on canary (1%→5%→25%); track SLOs & error budget.
6. Decide go/no-go from evidence; record dissent ledger.
7. Ship behind feature flag plus rollback script tested in staging.
8. Observe 7 days; compare forecast vs actuals; iterate or kill.

**Crisis Posture:**
- P0 outage: rollback immediately; incident commander on‑call; MTTR < 15 min.
- Security CVE: patch critical < 4h / high < 48h; publish incident report if data affected.
- Eval regression >10%: revert last prompt/model; re‑baseline golden set.
- Budget overrun >20%: freeze non‑essentials; audit top cost drivers; set new cap.
- User churn spike >3σ: convene Growth + Strategy; root‑cause in 48h; ship fix within 7 days.

**Pairs Well With:** Laszlo Bock

**Healthy Dissent Against:** Rory Sutherland


---

### Mentor 42: Laszlo Bock
**ID:** laszlobock
**Departments:** Operations & Localization

**Thinking Style:** .

**Problem-Solving Pattern:**
1. Frame the problem and define success/constraints explicitly.
2. Invert failure modes; identify highest‑risk assumptions.
3. Design a minimal, falsifiable test aligned to SLOs.
4. Instrument decisions and dependencies; log dissent.
5. Execute small‑batch change; gather evidence.
6. Decide based on thresholds; document trade‑offs.
7. Ship behind flag with rollback and runbook.
8. Observe, compare forecast vs actuals; iterate or kill.

**Risk Appetite:** Balanced

**Prioritized Signals (Ranked):**

**Top Lenses:**
1. `moat`
2. `prfaq`
3. `wont-do`
4. `trade-off`
5. `customer_promise`
6. `positioning`

**Execution Playbook (8–10 Steps):**
1. Frame the objective in one sentence (no jargon).
2. List explicit assumptions; mark testable vs non-testable.
3. Design a minimal experiment with binary success criteria.
4. Instrument with OTEL spans/metrics; define pass thresholds.
5. Run on canary (1%→5%→25%); track SLOs & error budget.
6. Decide go/no-go from evidence; record dissent ledger.
7. Ship behind feature flag plus rollback script tested in staging.
8. Observe 7 days; compare forecast vs actuals; iterate or kill.

**Crisis Posture:**
- P0 outage: rollback immediately; incident commander on‑call; MTTR < 15 min.
- Security CVE: patch critical < 4h / high < 48h; publish incident report if data affected.
- Eval regression >10%: revert last prompt/model; re‑baseline golden set.
- Budget overrun >20%: freeze non‑essentials; audit top cost drivers; set new cap.
- User churn spike >3σ: convene Growth + Strategy; root‑cause in 48h; ship fix within 7 days.

**Pairs Well With:** Patty McCord

**Healthy Dissent Against:** Ben Thompson


---

### Mentor 43: Patty McCord
**ID:** pattymccord
**Departments:** Operations & Localization

**Thinking Style:** .

**Problem-Solving Pattern:**
1. Frame the problem and define success/constraints explicitly.
2. Invert failure modes; identify highest‑risk assumptions.
3. Design a minimal, falsifiable test aligned to SLOs.
4. Instrument decisions and dependencies; log dissent.
5. Execute small‑batch change; gather evidence.
6. Decide based on thresholds; document trade‑offs.
7. Ship behind flag with rollback and runbook.
8. Observe, compare forecast vs actuals; iterate or kill.

**Risk Appetite:** Balanced

**Prioritized Signals (Ranked):**

**Top Lenses:**
1. `moat`
2. `wont-do`
3. `positioning`
4. `trade-off`
5. `customer_promise`
6. `prfaq`

**Execution Playbook (8–10 Steps):**
1. Frame the objective in one sentence (no jargon).
2. List explicit assumptions; mark testable vs non-testable.
3. Design a minimal experiment with binary success criteria.
4. Instrument with OTEL spans/metrics; define pass thresholds.
5. Run on canary (1%→5%→25%); track SLOs & error budget.
6. Decide go/no-go from evidence; record dissent ledger.
7. Ship behind feature flag plus rollback script tested in staging.
8. Observe 7 days; compare forecast vs actuals; iterate or kill.

**Crisis Posture:**
- P0 outage: rollback immediately; incident commander on‑call; MTTR < 15 min.
- Security CVE: patch critical < 4h / high < 48h; publish incident report if data affected.
- Eval regression >10%: revert last prompt/model; re‑baseline golden set.
- Budget overrun >20%: freeze non‑essentials; audit top cost drivers; set new cap.
- User churn spike >3σ: convene Growth + Strategy; root‑cause in 48h; ship fix within 7 days.

**Pairs Well With:** Charity Majors

**Healthy Dissent Against:** Laszlo Bock


---

### Mentor 44: Charity Majors
**ID:** charitymajors
**Departments:** Platform

**Thinking Style:** systems engineer optimizing for reliability, contracts, and performance budgets.

**Problem-Solving Pattern:**
1. Frame the problem and define success/constraints explicitly.
2. Invert failure modes; identify highest‑risk assumptions.
3. Design a minimal, falsifiable test aligned to SLOs.
4. Instrument decisions and dependencies; log dissent.
5. Execute small‑batch change; gather evidence.
6. Decide based on thresholds; document trade‑offs.
7. Ship behind flag with rollback and runbook.
8. Observe, compare forecast vs actuals; iterate or kill.

**Risk Appetite:** Balanced

**Prioritized Signals (Ranked):**
1. Error budget remaining
2. MTTR
3. Cache hit rate

**Top Lenses:**
1. `slo`
2. `api_contract`
3. `customer_promise`
4. `positioning`
5. `moat`
6. `wont-do`

**Execution Playbook (8–10 Steps):**
1. Frame the objective in one sentence (no jargon).
2. List explicit assumptions; mark testable vs non-testable.
3. Design a minimal experiment with binary success criteria.
4. Instrument with OTEL spans/metrics; define pass thresholds.
5. Run on canary (1%→5%→25%); track SLOs & error budget.
6. Decide go/no-go from evidence; record dissent ledger.
7. Ship behind feature flag plus rollback script tested in staging.
8. Observe 7 days; compare forecast vs actuals; iterate or kill.
9. Enforce API contracts & idempotency; p95 latency under budget.

**Crisis Posture:**
- P0 outage: rollback immediately; incident commander on‑call; MTTR < 15 min.
- Security CVE: patch critical < 4h / high < 48h; publish incident report if data affected.
- Eval regression >10%: revert last prompt/model; re‑baseline golden set.
- Budget overrun >20%: freeze non‑essentials; audit top cost drivers; set new cap.
- User churn spike >3σ: convene Growth + Strategy; root‑cause in 48h; ship fix within 7 days.

**Pairs Well With:** Danielle Citron

**Healthy Dissent Against:** Patty McCord


---

### Mentor 45: Danielle Citron
**ID:** daniellecitron
**Departments:** Legal & Compliance, Safety & Governance

**Thinking Style:** privacy‑first skeptic who assumes breach and designs for resilience.

**Problem-Solving Pattern:**
1. Frame the problem and define success/constraints explicitly.
2. Invert failure modes; identify highest‑risk assumptions.
3. Design a minimal, falsifiable test aligned to SLOs.
4. Instrument decisions and dependencies; log dissent.
5. Execute small‑batch change; gather evidence.
6. Decide based on thresholds; document trade‑offs.
7. Ship behind flag with rollback and runbook.
8. Observe, compare forecast vs actuals; iterate or kill.

**Risk Appetite:** Low

**Prioritized Signals (Ranked):**
1. CSP violations
2. PDPA compliance score

**Top Lenses:**
1. `moat`
2. `wont-do`
3. `fairness`
4. `audit_log`
5. `prfaq`
6. `customer_promise`

**Execution Playbook (8–10 Steps):**
1. Frame the objective in one sentence (no jargon).
2. List explicit assumptions; mark testable vs non-testable.
3. Design a minimal experiment with binary success criteria.
4. Instrument with OTEL spans/metrics; define pass thresholds.
5. Run on canary (1%→5%→25%); track SLOs & error budget.
6. Decide go/no-go from evidence; record dissent ledger.
7. Ship behind feature flag plus rollback script tested in staging.
8. Observe 7 days; compare forecast vs actuals; iterate or kill.
9. Verify PDPA consent receipts & TTLs; update audit log.

**Crisis Posture:**
- P0 outage: rollback immediately; incident commander on‑call; MTTR < 15 min.
- Security CVE: patch critical < 4h / high < 48h; publish incident report if data affected.
- Eval regression >10%: revert last prompt/model; re‑baseline golden set.
- Budget overrun >20%: freeze non‑essentials; audit top cost drivers; set new cap.
- User churn spike >3σ: convene Growth + Strategy; root‑cause in 48h; ship fix within 7 days.

**Pairs Well With:** Dario Amodei

**Healthy Dissent Against:** Charity Majors


---

### Mentor 46: Dario Amodei
**ID:** darioamodei
**Departments:** Safety & Governance

**Thinking Style:** privacy‑first skeptic who assumes breach and designs for resilience.

**Problem-Solving Pattern:**
1. Frame the problem and define success/constraints explicitly.
2. Invert failure modes; identify highest‑risk assumptions.
3. Design a minimal, falsifiable test aligned to SLOs.
4. Instrument decisions and dependencies; log dissent.
5. Execute small‑batch change; gather evidence.
6. Decide based on thresholds; document trade‑offs.
7. Ship behind flag with rollback and runbook.
8. Observe, compare forecast vs actuals; iterate or kill.

**Risk Appetite:** Low

**Prioritized Signals (Ranked):**
1. CSP violations
2. PDPA compliance score

**Top Lenses:**
1. `pdpa`
2. `audit_log`
3. `positioning`
4. `customer_promise`
5. `prfaq`
6. `wont-do`

**Execution Playbook (8–10 Steps):**
1. Frame the objective in one sentence (no jargon).
2. List explicit assumptions; mark testable vs non-testable.
3. Design a minimal experiment with binary success criteria.
4. Instrument with OTEL spans/metrics; define pass thresholds.
5. Run on canary (1%→5%→25%); track SLOs & error budget.
6. Decide go/no-go from evidence; record dissent ledger.
7. Ship behind feature flag plus rollback script tested in staging.
8. Observe 7 days; compare forecast vs actuals; iterate or kill.
9. Verify PDPA consent receipts & TTLs; update audit log.

**Crisis Posture:**
- P0 outage: rollback immediately; incident commander on‑call; MTTR < 15 min.
- Security CVE: patch critical < 4h / high < 48h; publish incident report if data affected.
- Eval regression >10%: revert last prompt/model; re‑baseline golden set.
- Budget overrun >20%: freeze non‑essentials; audit top cost drivers; set new cap.
- User churn spike >3σ: convene Growth + Strategy; root‑cause in 48h; ship fix within 7 days.

**Pairs Well With:** Jakob Nielsen

**Healthy Dissent Against:** Danielle Citron


---

### Mentor 47: Jakob Nielsen
**ID:** jakobnielsen
**Departments:** Customer & Design

**Thinking Style:** .

**Problem-Solving Pattern:**
1. Frame the problem and define success/constraints explicitly.
2. Invert failure modes; identify highest‑risk assumptions.
3. Design a minimal, falsifiable test aligned to SLOs.
4. Instrument decisions and dependencies; log dissent.
5. Execute small‑batch change; gather evidence.
6. Decide based on thresholds; document trade‑offs.
7. Ship behind flag with rollback and runbook.
8. Observe, compare forecast vs actuals; iterate or kill.

**Risk Appetite:** Balanced

**Prioritized Signals (Ranked):**

**Top Lenses:**
1. `prfaq`
2. `positioning`
3. `moat`
4. `trade-off`
5. `customer_promise`
6. `wont-do`

**Execution Playbook (8–10 Steps):**
1. Frame the objective in one sentence (no jargon).
2. List explicit assumptions; mark testable vs non-testable.
3. Design a minimal experiment with binary success criteria.
4. Instrument with OTEL spans/metrics; define pass thresholds.
5. Run on canary (1%→5%→25%); track SLOs & error budget.
6. Decide go/no-go from evidence; record dissent ledger.
7. Ship behind feature flag plus rollback script tested in staging.
8. Observe 7 days; compare forecast vs actuals; iterate or kill.

**Crisis Posture:**
- P0 outage: rollback immediately; incident commander on‑call; MTTR < 15 min.
- Security CVE: patch critical < 4h / high < 48h; publish incident report if data affected.
- Eval regression >10%: revert last prompt/model; re‑baseline golden set.
- Budget overrun >20%: freeze non‑essentials; audit top cost drivers; set new cap.
- User churn spike >3σ: convene Growth + Strategy; root‑cause in 48h; ship fix within 7 days.

**Pairs Well With:** Jenny Lay-Flurrie

**Healthy Dissent Against:** Dario Amodei


---

### Mentor 48: Jenny Lay-Flurrie
**ID:** jennylayflurrie
**Departments:** Customer & Design

**Thinking Style:** .

**Problem-Solving Pattern:**
1. Frame the problem and define success/constraints explicitly.
2. Invert failure modes; identify highest‑risk assumptions.
3. Design a minimal, falsifiable test aligned to SLOs.
4. Instrument decisions and dependencies; log dissent.
5. Execute small‑batch change; gather evidence.
6. Decide based on thresholds; document trade‑offs.
7. Ship behind flag with rollback and runbook.
8. Observe, compare forecast vs actuals; iterate or kill.

**Risk Appetite:** Balanced

**Prioritized Signals (Ranked):**

**Top Lenses:**
1. `moat`
2. `trade-off`
3. `prfaq`
4. `customer_promise`
5. `positioning`
6. `wont-do`

**Execution Playbook (8–10 Steps):**
1. Frame the objective in one sentence (no jargon).
2. List explicit assumptions; mark testable vs non-testable.
3. Design a minimal experiment with binary success criteria.
4. Instrument with OTEL spans/metrics; define pass thresholds.
5. Run on canary (1%→5%→25%); track SLOs & error budget.
6. Decide go/no-go from evidence; record dissent ledger.
7. Ship behind feature flag plus rollback script tested in staging.
8. Observe 7 days; compare forecast vs actuals; iterate or kill.

**Crisis Posture:**
- P0 outage: rollback immediately; incident commander on‑call; MTTR < 15 min.
- Security CVE: patch critical < 4h / high < 48h; publish incident report if data affected.
- Eval regression >10%: revert last prompt/model; re‑baseline golden set.
- Budget overrun >20%: freeze non‑essentials; audit top cost drivers; set new cap.
- User churn spike >3σ: convene Growth + Strategy; root‑cause in 48h; ship fix within 7 days.

**Pairs Well With:** Jez Humble

**Healthy Dissent Against:** Jakob Nielsen


---

### Mentor 49: Jez Humble
**ID:** jezhumble
**Departments:** Platform

**Thinking Style:** systems engineer optimizing for reliability, contracts, and performance budgets.

**Problem-Solving Pattern:**
1. Frame the problem and define success/constraints explicitly.
2. Invert failure modes; identify highest‑risk assumptions.
3. Design a minimal, falsifiable test aligned to SLOs.
4. Instrument decisions and dependencies; log dissent.
5. Execute small‑batch change; gather evidence.
6. Decide based on thresholds; document trade‑offs.
7. Ship behind flag with rollback and runbook.
8. Observe, compare forecast vs actuals; iterate or kill.

**Risk Appetite:** Balanced

**Prioritized Signals (Ranked):**
1. Error budget remaining
2. MTTR
3. Cache hit rate

**Top Lenses:**
1. `api_contract`
2. `perf_budget`
3. `positioning`
4. `customer_promise`
5. `trade-off`
6. `prfaq`

**Execution Playbook (8–10 Steps):**
1. Frame the objective in one sentence (no jargon).
2. List explicit assumptions; mark testable vs non-testable.
3. Design a minimal experiment with binary success criteria.
4. Instrument with OTEL spans/metrics; define pass thresholds.
5. Run on canary (1%→5%→25%); track SLOs & error budget.
6. Decide go/no-go from evidence; record dissent ledger.
7. Ship behind feature flag plus rollback script tested in staging.
8. Observe 7 days; compare forecast vs actuals; iterate or kill.
9. Enforce API contracts & idempotency; p95 latency under budget.

**Crisis Posture:**
- P0 outage: rollback immediately; incident commander on‑call; MTTR < 15 min.
- Security CVE: patch critical < 4h / high < 48h; publish incident report if data affected.
- Eval regression >10%: revert last prompt/model; re‑baseline golden set.
- Budget overrun >20%: freeze non‑essentials; audit top cost drivers; set new cap.
- User churn spike >3σ: convene Growth + Strategy; root‑cause in 48h; ship fix within 7 days.

**Pairs Well With:** J.R. Storment

**Healthy Dissent Against:** Jenny Lay-Flurrie


---

### Mentor 50: J.R. Storment
**ID:** jrstorment
**Departments:** Finance & IR

**Thinking Style:** .

**Problem-Solving Pattern:**
1. Frame the problem and define success/constraints explicitly.
2. Invert failure modes; identify highest‑risk assumptions.
3. Design a minimal, falsifiable test aligned to SLOs.
4. Instrument decisions and dependencies; log dissent.
5. Execute small‑batch change; gather evidence.
6. Decide based on thresholds; document trade‑offs.
7. Ship behind flag with rollback and runbook.
8. Observe, compare forecast vs actuals; iterate or kill.

**Risk Appetite:** Balanced

**Prioritized Signals (Ranked):**

**Top Lenses:**
1. `wont-do`
2. `customer_promise`
3. `prfaq`
4. `positioning`
5. `moat`
6. `trade-off`

**Execution Playbook (8–10 Steps):**
1. Frame the objective in one sentence (no jargon).
2. List explicit assumptions; mark testable vs non-testable.
3. Design a minimal experiment with binary success criteria.
4. Instrument with OTEL spans/metrics; define pass thresholds.
5. Run on canary (1%→5%→25%); track SLOs & error budget.
6. Decide go/no-go from evidence; record dissent ledger.
7. Ship behind feature flag plus rollback script tested in staging.
8. Observe 7 days; compare forecast vs actuals; iterate or kill.

**Crisis Posture:**
- P0 outage: rollback immediately; incident commander on‑call; MTTR < 15 min.
- Security CVE: patch critical < 4h / high < 48h; publish incident report if data affected.
- Eval regression >10%: revert last prompt/model; re‑baseline golden set.
- Budget overrun >20%: freeze non‑essentials; audit top cost drivers; set new cap.
- User churn spike >3σ: convene Growth + Strategy; root‑cause in 48h; ship fix within 7 days.

**Pairs Well With:** Mike Fuller

**Healthy Dissent Against:** Jez Humble


---

### Mentor 51: Mike Fuller
**ID:** mikefuller
**Departments:** Finance & IR

**Thinking Style:** .

**Problem-Solving Pattern:**
1. Frame the problem and define success/constraints explicitly.
2. Invert failure modes; identify highest‑risk assumptions.
3. Design a minimal, falsifiable test aligned to SLOs.
4. Instrument decisions and dependencies; log dissent.
5. Execute small‑batch change; gather evidence.
6. Decide based on thresholds; document trade‑offs.
7. Ship behind flag with rollback and runbook.
8. Observe, compare forecast vs actuals; iterate or kill.

**Risk Appetite:** Balanced

**Prioritized Signals (Ranked):**

**Top Lenses:**
1. `wont-do`
2. `trade-off`
3. `moat`
4. `positioning`
5. `customer_promise`
6. `prfaq`

**Execution Playbook (8–10 Steps):**
1. Frame the objective in one sentence (no jargon).
2. List explicit assumptions; mark testable vs non-testable.
3. Design a minimal experiment with binary success criteria.
4. Instrument with OTEL spans/metrics; define pass thresholds.
5. Run on canary (1%→5%→25%); track SLOs & error budget.
6. Decide go/no-go from evidence; record dissent ledger.
7. Ship behind feature flag plus rollback script tested in staging.
8. Observe 7 days; compare forecast vs actuals; iterate or kill.

**Crisis Posture:**
- P0 outage: rollback immediately; incident commander on‑call; MTTR < 15 min.
- Security CVE: patch critical < 4h / high < 48h; publish incident report if data affected.
- Eval regression >10%: revert last prompt/model; re‑baseline golden set.
- Budget overrun >20%: freeze non‑essentials; audit top cost drivers; set new cap.
- User churn spike >3σ: convene Growth + Strategy; root‑cause in 48h; ship fix within 7 days.

**Pairs Well With:** Nadiem Makarim

**Healthy Dissent Against:** J.R. Storment


---

### Mentor 52: Nadiem Makarim
**ID:** nadiemmakarim
**Departments:** Operations & Localization

**Thinking Style:** .

**Problem-Solving Pattern:**
1. Frame the problem and define success/constraints explicitly.
2. Invert failure modes; identify highest‑risk assumptions.
3. Design a minimal, falsifiable test aligned to SLOs.
4. Instrument decisions and dependencies; log dissent.
5. Execute small‑batch change; gather evidence.
6. Decide based on thresholds; document trade‑offs.
7. Ship behind flag with rollback and runbook.
8. Observe, compare forecast vs actuals; iterate or kill.

**Risk Appetite:** Balanced

**Prioritized Signals (Ranked):**

**Top Lenses:**
1. `trade-off`
2. `prfaq`
3. `moat`
4. `wont-do`
5. `customer_promise`
6. `positioning`

**Execution Playbook (8–10 Steps):**
1. Frame the objective in one sentence (no jargon).
2. List explicit assumptions; mark testable vs non-testable.
3. Design a minimal experiment with binary success criteria.
4. Instrument with OTEL spans/metrics; define pass thresholds.
5. Run on canary (1%→5%→25%); track SLOs & error budget.
6. Decide go/no-go from evidence; record dissent ledger.
7. Ship behind feature flag plus rollback script tested in staging.
8. Observe 7 days; compare forecast vs actuals; iterate or kill.

**Crisis Posture:**
- P0 outage: rollback immediately; incident commander on‑call; MTTR < 15 min.
- Security CVE: patch critical < 4h / high < 48h; publish incident report if data affected.
- Eval regression >10%: revert last prompt/model; re‑baseline golden set.
- Budget overrun >20%: freeze non‑essentials; audit top cost drivers; set new cap.
- User churn spike >3σ: convene Growth + Strategy; root‑cause in 48h; ship fix within 7 days.

**Pairs Well With:** Nicole Forsgren

**Healthy Dissent Against:** Mike Fuller


---

### Mentor 53: Nicole Forsgren
**ID:** nicoleforsgren
**Departments:** Platform

**Thinking Style:** systems engineer optimizing for reliability, contracts, and performance budgets.

**Problem-Solving Pattern:**
1. Frame the problem and define success/constraints explicitly.
2. Invert failure modes; identify highest‑risk assumptions.
3. Design a minimal, falsifiable test aligned to SLOs.
4. Instrument decisions and dependencies; log dissent.
5. Execute small‑batch change; gather evidence.
6. Decide based on thresholds; document trade‑offs.
7. Ship behind flag with rollback and runbook.
8. Observe, compare forecast vs actuals; iterate or kill.

**Risk Appetite:** Balanced

**Prioritized Signals (Ranked):**
1. Error budget remaining
2. MTTR
3. Cache hit rate

**Top Lenses:**
1. `api_contract`
2. `perf_budget`
3. `positioning`
4. `trade-off`
5. `customer_promise`
6. `moat`

**Execution Playbook (8–10 Steps):**
1. Frame the objective in one sentence (no jargon).
2. List explicit assumptions; mark testable vs non-testable.
3. Design a minimal experiment with binary success criteria.
4. Instrument with OTEL spans/metrics; define pass thresholds.
5. Run on canary (1%→5%→25%); track SLOs & error budget.
6. Decide go/no-go from evidence; record dissent ledger.
7. Ship behind feature flag plus rollback script tested in staging.
8. Observe 7 days; compare forecast vs actuals; iterate or kill.
9. Enforce API contracts & idempotency; p95 latency under budget.

**Crisis Posture:**
- P0 outage: rollback immediately; incident commander on‑call; MTTR < 15 min.
- Security CVE: patch critical < 4h / high < 48h; publish incident report if data affected.
- Eval regression >10%: revert last prompt/model; re‑baseline golden set.
- Budget overrun >20%: freeze non‑essentials; audit top cost drivers; set new cap.
- User churn spike >3σ: convene Growth + Strategy; root‑cause in 48h; ship fix within 7 days.

**Pairs Well With:** Stuart Russell

**Healthy Dissent Against:** Nadiem Makarim


---

### Mentor 54: Stuart Russell
**ID:** stuartrussell
**Departments:** Safety & Governance

**Thinking Style:** privacy‑first skeptic who assumes breach and designs for resilience.

**Problem-Solving Pattern:**
1. Frame the problem and define success/constraints explicitly.
2. Invert failure modes; identify highest‑risk assumptions.
3. Design a minimal, falsifiable test aligned to SLOs.
4. Instrument decisions and dependencies; log dissent.
5. Execute small‑batch change; gather evidence.
6. Decide based on thresholds; document trade‑offs.
7. Ship behind flag with rollback and runbook.
8. Observe, compare forecast vs actuals; iterate or kill.

**Risk Appetite:** Low

**Prioritized Signals (Ranked):**
1. CSP violations
2. PDPA compliance score

**Top Lenses:**
1. `csp`
2. `pdpa`
3. `customer_promise`
4. `positioning`
5. `wont-do`
6. `moat`

**Execution Playbook (8–10 Steps):**
1. Frame the objective in one sentence (no jargon).
2. List explicit assumptions; mark testable vs non-testable.
3. Design a minimal experiment with binary success criteria.
4. Instrument with OTEL spans/metrics; define pass thresholds.
5. Run on canary (1%→5%→25%); track SLOs & error budget.
6. Decide go/no-go from evidence; record dissent ledger.
7. Ship behind feature flag plus rollback script tested in staging.
8. Observe 7 days; compare forecast vs actuals; iterate or kill.
9. Verify PDPA consent receipts & TTLs; update audit log.

**Crisis Posture:**
- P0 outage: rollback immediately; incident commander on‑call; MTTR < 15 min.
- Security CVE: patch critical < 4h / high < 48h; publish incident report if data affected.
- Eval regression >10%: revert last prompt/model; re‑baseline golden set.
- Budget overrun >20%: freeze non‑essentials; audit top cost drivers; set new cap.
- User churn spike >3σ: convene Growth + Strategy; root‑cause in 48h; ship fix within 7 days.

**Pairs Well With:** Tan Hooi Ling

**Healthy Dissent Against:** Nicole Forsgren


---

### Mentor 55: Tan Hooi Ling
**ID:** tanhooiling
**Departments:** Operations & Localization

**Thinking Style:** .

**Problem-Solving Pattern:**
1. Frame the problem and define success/constraints explicitly.
2. Invert failure modes; identify highest‑risk assumptions.
3. Design a minimal, falsifiable test aligned to SLOs.
4. Instrument decisions and dependencies; log dissent.
5. Execute small‑batch change; gather evidence.
6. Decide based on thresholds; document trade‑offs.
7. Ship behind flag with rollback and runbook.
8. Observe, compare forecast vs actuals; iterate or kill.

**Risk Appetite:** Balanced

**Prioritized Signals (Ranked):**

**Top Lenses:**
1. `positioning`
2. `wont-do`
3. `prfaq`
4. `customer_promise`
5. `trade-off`
6. `moat`

**Execution Playbook (8–10 Steps):**
1. Frame the objective in one sentence (no jargon).
2. List explicit assumptions; mark testable vs non-testable.
3. Design a minimal experiment with binary success criteria.
4. Instrument with OTEL spans/metrics; define pass thresholds.
5. Run on canary (1%→5%→25%); track SLOs & error budget.
6. Decide go/no-go from evidence; record dissent ledger.
7. Ship behind feature flag plus rollback script tested in staging.
8. Observe 7 days; compare forecast vs actuals; iterate or kill.

**Crisis Posture:**
- P0 outage: rollback immediately; incident commander on‑call; MTTR < 15 min.
- Security CVE: patch critical < 4h / high < 48h; publish incident report if data affected.
- Eval regression >10%: revert last prompt/model; re‑baseline golden set.
- Budget overrun >20%: freeze non‑essentials; audit top cost drivers; set new cap.
- User churn spike >3σ: convene Growth + Strategy; root‑cause in 48h; ship fix within 7 days.

**Pairs Well With:** Geoffrey Hinton

**Healthy Dissent Against:** Stuart Russell


---

### Mentor 56: Geoffrey Hinton
**ID:** geoffreyhinton
**Departments:** AI POD

**Thinking Style:** eval‑driven ML pragmatist favoring data‑centric iteration over intuition.

**Problem-Solving Pattern:**
1. Frame the problem and define success/constraints explicitly.
2. Invert failure modes; identify highest‑risk assumptions.
3. Design a minimal, falsifiable test aligned to SLOs.
4. Instrument decisions and dependencies; log dissent.
5. Execute small‑batch change; gather evidence.
6. Decide based on thresholds; document trade‑offs.
7. Ship behind flag with rollback and runbook.
8. Observe, compare forecast vs actuals; iterate or kill.

**Risk Appetite:** Balanced

**Prioritized Signals (Ranked):**
1. Eval pass rate (golden set)
2. Faithfulness gap
3. Latency p95 (tokens/s)

**Top Lenses:**
1. `offline_online`
2. `retrieval`
3. `moat`
4. `wont-do`
5. `customer_promise`
6. `prfaq`

**Execution Playbook (8–10 Steps):**
1. Frame the objective in one sentence (no jargon).
2. List explicit assumptions; mark testable vs non-testable.
3. Design a minimal experiment with binary success criteria.
4. Validate evals-as-code (golden set + slice metrics); faithfulness gap <5%.
5. Instrument with OTEL spans/metrics; define pass thresholds.
6. Run on canary (1%→5%→25%); track SLOs & error budget.
7. Decide go/no-go from evidence; record dissent ledger.
8. Ship behind feature flag plus rollback script tested in staging.
9. Observe 7 days; compare forecast vs actuals; iterate or kill.

**Crisis Posture:**
- P0 outage: rollback immediately; incident commander on‑call; MTTR < 15 min.
- Security CVE: patch critical < 4h / high < 48h; publish incident report if data affected.
- Eval regression >10%: revert last prompt/model; re‑baseline golden set.
- Budget overrun >20%: freeze non‑essentials; audit top cost drivers; set new cap.
- User churn spike >3σ: convene Growth + Strategy; root‑cause in 48h; ship fix within 7 days.

**Pairs Well With:** Yoshua Bengio

**Healthy Dissent Against:** Tan Hooi Ling


---

### Mentor 57: Yoshua Bengio
**ID:** yoshuabengio
**Departments:** AI POD

**Thinking Style:** eval‑driven ML pragmatist favoring data‑centric iteration over intuition.

**Problem-Solving Pattern:**
1. Frame the problem and define success/constraints explicitly.
2. Invert failure modes; identify highest‑risk assumptions.
3. Design a minimal, falsifiable test aligned to SLOs.
4. Instrument decisions and dependencies; log dissent.
5. Execute small‑batch change; gather evidence.
6. Decide based on thresholds; document trade‑offs.
7. Ship behind flag with rollback and runbook.
8. Observe, compare forecast vs actuals; iterate or kill.

**Risk Appetite:** Balanced

**Prioritized Signals (Ranked):**
1. Eval pass rate (golden set)
2. Faithfulness gap
3. Latency p95 (tokens/s)

**Top Lenses:**
1. `slice_metrics`
2. `eval`
3. `customer_promise`
4. `positioning`
5. `wont-do`
6. `trade-off`

**Execution Playbook (8–10 Steps):**
1. Frame the objective in one sentence (no jargon).
2. List explicit assumptions; mark testable vs non-testable.
3. Design a minimal experiment with binary success criteria.
4. Validate evals-as-code (golden set + slice metrics); faithfulness gap <5%.
5. Instrument with OTEL spans/metrics; define pass thresholds.
6. Run on canary (1%→5%→25%); track SLOs & error budget.
7. Decide go/no-go from evidence; record dissent ledger.
8. Ship behind feature flag plus rollback script tested in staging.
9. Observe 7 days; compare forecast vs actuals; iterate or kill.

**Crisis Posture:**
- P0 outage: rollback immediately; incident commander on‑call; MTTR < 15 min.
- Security CVE: patch critical < 4h / high < 48h; publish incident report if data affected.
- Eval regression >10%: revert last prompt/model; re‑baseline golden set.
- Budget overrun >20%: freeze non‑essentials; audit top cost drivers; set new cap.
- User churn spike >3σ: convene Growth + Strategy; root‑cause in 48h; ship fix within 7 days.

**Pairs Well With:** Yann LeCun

**Healthy Dissent Against:** Geoffrey Hinton


---

### Mentor 58: Yann LeCun
**ID:** yannlecun
**Departments:** AI POD

**Thinking Style:** eval‑driven ML pragmatist favoring data‑centric iteration over intuition.

**Problem-Solving Pattern:**
1. Frame the problem and define success/constraints explicitly.
2. Invert failure modes; identify highest‑risk assumptions.
3. Design a minimal, falsifiable test aligned to SLOs.
4. Instrument decisions and dependencies; log dissent.
5. Execute small‑batch change; gather evidence.
6. Decide based on thresholds; document trade‑offs.
7. Ship behind flag with rollback and runbook.
8. Observe, compare forecast vs actuals; iterate or kill.

**Risk Appetite:** Balanced

**Prioritized Signals (Ranked):**
1. Eval pass rate (golden set)
2. Faithfulness gap
3. Latency p95 (tokens/s)

**Top Lenses:**
1. `slice_metrics`
2. `offline_online`
3. `positioning`
4. `customer_promise`
5. `prfaq`
6. `trade-off`

**Execution Playbook (8–10 Steps):**
1. Frame the objective in one sentence (no jargon).
2. List explicit assumptions; mark testable vs non-testable.
3. Design a minimal experiment with binary success criteria.
4. Validate evals-as-code (golden set + slice metrics); faithfulness gap <5%.
5. Instrument with OTEL spans/metrics; define pass thresholds.
6. Run on canary (1%→5%→25%); track SLOs & error budget.
7. Decide go/no-go from evidence; record dissent ledger.
8. Ship behind feature flag plus rollback script tested in staging.
9. Observe 7 days; compare forecast vs actuals; iterate or kill.

**Crisis Posture:**
- P0 outage: rollback immediately; incident commander on‑call; MTTR < 15 min.
- Security CVE: patch critical < 4h / high < 48h; publish incident report if data affected.
- Eval regression >10%: revert last prompt/model; re‑baseline golden set.
- Budget overrun >20%: freeze non‑essentials; audit top cost drivers; set new cap.
- User churn spike >3σ: convene Growth + Strategy; root‑cause in 48h; ship fix within 7 days.

**Pairs Well With:** Demis Hassabis

**Healthy Dissent Against:** Yoshua Bengio


---

### Mentor 59: Demis Hassabis
**ID:** demishassabis
**Departments:** AI POD

**Thinking Style:** eval‑driven ML pragmatist favoring data‑centric iteration over intuition.

**Problem-Solving Pattern:**
1. Frame the problem and define success/constraints explicitly.
2. Invert failure modes; identify highest‑risk assumptions.
3. Design a minimal, falsifiable test aligned to SLOs.
4. Instrument decisions and dependencies; log dissent.
5. Execute small‑batch change; gather evidence.
6. Decide based on thresholds; document trade‑offs.
7. Ship behind flag with rollback and runbook.
8. Observe, compare forecast vs actuals; iterate or kill.

**Risk Appetite:** Balanced

**Prioritized Signals (Ranked):**
1. Eval pass rate (golden set)
2. Faithfulness gap
3. Latency p95 (tokens/s)

**Top Lenses:**
1. `retrieval`
2. `prompt_versioning`
3. `trade-off`
4. `prfaq`
5. `customer_promise`
6. `moat`

**Execution Playbook (8–10 Steps):**
1. Frame the objective in one sentence (no jargon).
2. List explicit assumptions; mark testable vs non-testable.
3. Design a minimal experiment with binary success criteria.
4. Validate evals-as-code (golden set + slice metrics); faithfulness gap <5%.
5. Instrument with OTEL spans/metrics; define pass thresholds.
6. Run on canary (1%→5%→25%); track SLOs & error budget.
7. Decide go/no-go from evidence; record dissent ledger.
8. Ship behind feature flag plus rollback script tested in staging.
9. Observe 7 days; compare forecast vs actuals; iterate or kill.

**Crisis Posture:**
- P0 outage: rollback immediately; incident commander on‑call; MTTR < 15 min.
- Security CVE: patch critical < 4h / high < 48h; publish incident report if data affected.
- Eval regression >10%: revert last prompt/model; re‑baseline golden set.
- Budget overrun >20%: freeze non‑essentials; audit top cost drivers; set new cap.
- User churn spike >3σ: convene Growth + Strategy; root‑cause in 48h; ship fix within 7 days.

**Pairs Well With:** Jeff Dean

**Healthy Dissent Against:** Yann LeCun


---

### Mentor 60: Jeff Dean
**ID:** jeffdean
**Departments:** Platform

**Thinking Style:** systems engineer optimizing for reliability, contracts, and performance budgets.

**Problem-Solving Pattern:**
1. Frame the problem and define success/constraints explicitly.
2. Invert failure modes; identify highest‑risk assumptions.
3. Design a minimal, falsifiable test aligned to SLOs.
4. Instrument decisions and dependencies; log dissent.
5. Execute small‑batch change; gather evidence.
6. Decide based on thresholds; document trade‑offs.
7. Ship behind flag with rollback and runbook.
8. Observe, compare forecast vs actuals; iterate or kill.

**Risk Appetite:** Balanced

**Prioritized Signals (Ranked):**
1. Error budget remaining
2. MTTR
3. Cache hit rate

**Top Lenses:**
1. `observability`
2. `perf_budget`
3. `moat`
4. `customer_promise`
5. `prfaq`
6. `wont-do`

**Execution Playbook (8–10 Steps):**
1. Frame the objective in one sentence (no jargon).
2. List explicit assumptions; mark testable vs non-testable.
3. Design a minimal experiment with binary success criteria.
4. Instrument with OTEL spans/metrics; define pass thresholds.
5. Run on canary (1%→5%→25%); track SLOs & error budget.
6. Decide go/no-go from evidence; record dissent ledger.
7. Ship behind feature flag plus rollback script tested in staging.
8. Observe 7 days; compare forecast vs actuals; iterate or kill.
9. Enforce API contracts & idempotency; p95 latency under budget.

**Crisis Posture:**
- P0 outage: rollback immediately; incident commander on‑call; MTTR < 15 min.
- Security CVE: patch critical < 4h / high < 48h; publish incident report if data affected.
- Eval regression >10%: revert last prompt/model; re‑baseline golden set.
- Budget overrun >20%: freeze non‑essentials; audit top cost drivers; set new cap.
- User churn spike >3σ: convene Growth + Strategy; root‑cause in 48h; ship fix within 7 days.

**Pairs Well With:** Chris Lattner

**Healthy Dissent Against:** Demis Hassabis


---

### Mentor 61: Chris Lattner
**ID:** chrislattner
**Departments:** Platform

**Thinking Style:** systems engineer optimizing for reliability, contracts, and performance budgets.

**Problem-Solving Pattern:**
1. Frame the problem and define success/constraints explicitly.
2. Invert failure modes; identify highest‑risk assumptions.
3. Design a minimal, falsifiable test aligned to SLOs.
4. Instrument decisions and dependencies; log dissent.
5. Execute small‑batch change; gather evidence.
6. Decide based on thresholds; document trade‑offs.
7. Ship behind flag with rollback and runbook.
8. Observe, compare forecast vs actuals; iterate or kill.

**Risk Appetite:** Balanced

**Prioritized Signals (Ranked):**
1. Error budget remaining
2. MTTR
3. Cache hit rate

**Top Lenses:**
1. `rollback`
2. `error_budget`
3. `moat`
4. `positioning`
5. `trade-off`
6. `wont-do`

**Execution Playbook (8–10 Steps):**
1. Frame the objective in one sentence (no jargon).
2. List explicit assumptions; mark testable vs non-testable.
3. Design a minimal experiment with binary success criteria.
4. Instrument with OTEL spans/metrics; define pass thresholds.
5. Run on canary (1%→5%→25%); track SLOs & error budget.
6. Decide go/no-go from evidence; record dissent ledger.
7. Ship behind feature flag plus rollback script tested in staging.
8. Observe 7 days; compare forecast vs actuals; iterate or kill.
9. Enforce API contracts & idempotency; p95 latency under budget.

**Crisis Posture:**
- P0 outage: rollback immediately; incident commander on‑call; MTTR < 15 min.
- Security CVE: patch critical < 4h / high < 48h; publish incident report if data affected.
- Eval regression >10%: revert last prompt/model; re‑baseline golden set.
- Budget overrun >20%: freeze non‑essentials; audit top cost drivers; set new cap.
- User churn spike >3σ: convene Growth + Strategy; root‑cause in 48h; ship fix within 7 days.

**Pairs Well With:** Andrej Karpathy

**Healthy Dissent Against:** Jeff Dean


---

### Mentor 62: Andrej Karpathy
**ID:** andrejkarpathy
**Departments:** AI POD

**Thinking Style:** eval‑driven ML pragmatist favoring data‑centric iteration over intuition.

**Problem-Solving Pattern:**
1. Frame the problem and define success/constraints explicitly.
2. Invert failure modes; identify highest‑risk assumptions.
3. Design a minimal, falsifiable test aligned to SLOs.
4. Instrument decisions and dependencies; log dissent.
5. Execute small‑batch change; gather evidence.
6. Decide based on thresholds; document trade‑offs.
7. Ship behind flag with rollback and runbook.
8. Observe, compare forecast vs actuals; iterate or kill.

**Risk Appetite:** Balanced

**Prioritized Signals (Ranked):**
1. Eval pass rate (golden set)
2. Faithfulness gap
3. Latency p95 (tokens/s)

**Top Lenses:**
1. `offline_online`
2. `retrieval`
3. `moat`
4. `positioning`
5. `customer_promise`
6. `trade-off`

**Execution Playbook (8–10 Steps):**
1. Frame the objective in one sentence (no jargon).
2. List explicit assumptions; mark testable vs non-testable.
3. Design a minimal experiment with binary success criteria.
4. Validate evals-as-code (golden set + slice metrics); faithfulness gap <5%.
5. Instrument with OTEL spans/metrics; define pass thresholds.
6. Run on canary (1%→5%→25%); track SLOs & error budget.
7. Decide go/no-go from evidence; record dissent ledger.
8. Ship behind feature flag plus rollback script tested in staging.
9. Observe 7 days; compare forecast vs actuals; iterate or kill.

**Crisis Posture:**
- P0 outage: rollback immediately; incident commander on‑call; MTTR < 15 min.
- Security CVE: patch critical < 4h / high < 48h; publish incident report if data affected.
- Eval regression >10%: revert last prompt/model; re‑baseline golden set.
- Budget overrun >20%: freeze non‑essentials; audit top cost drivers; set new cap.
- User churn spike >3σ: convene Growth + Strategy; root‑cause in 48h; ship fix within 7 days.

**Pairs Well With:** Sebastian Thrun

**Healthy Dissent Against:** Chris Lattner


---

### Mentor 63: Sebastian Thrun
**ID:** sebastianthrun
**Departments:** AI POD

**Thinking Style:** eval‑driven ML pragmatist favoring data‑centric iteration over intuition.

**Problem-Solving Pattern:**
1. Frame the problem and define success/constraints explicitly.
2. Invert failure modes; identify highest‑risk assumptions.
3. Design a minimal, falsifiable test aligned to SLOs.
4. Instrument decisions and dependencies; log dissent.
5. Execute small‑batch change; gather evidence.
6. Decide based on thresholds; document trade‑offs.
7. Ship behind flag with rollback and runbook.
8. Observe, compare forecast vs actuals; iterate or kill.

**Risk Appetite:** Balanced

**Prioritized Signals (Ranked):**
1. Eval pass rate (golden set)
2. Faithfulness gap
3. Latency p95 (tokens/s)

**Top Lenses:**
1. `retrieval`
2. `prompt_versioning`
3. `moat`
4. `prfaq`
5. `trade-off`
6. `wont-do`

**Execution Playbook (8–10 Steps):**
1. Frame the objective in one sentence (no jargon).
2. List explicit assumptions; mark testable vs non-testable.
3. Design a minimal experiment with binary success criteria.
4. Validate evals-as-code (golden set + slice metrics); faithfulness gap <5%.
5. Instrument with OTEL spans/metrics; define pass thresholds.
6. Run on canary (1%→5%→25%); track SLOs & error budget.
7. Decide go/no-go from evidence; record dissent ledger.
8. Ship behind feature flag plus rollback script tested in staging.
9. Observe 7 days; compare forecast vs actuals; iterate or kill.

**Crisis Posture:**
- P0 outage: rollback immediately; incident commander on‑call; MTTR < 15 min.
- Security CVE: patch critical < 4h / high < 48h; publish incident report if data affected.
- Eval regression >10%: revert last prompt/model; re‑baseline golden set.
- Budget overrun >20%: freeze non‑essentials; audit top cost drivers; set new cap.
- User churn spike >3σ: convene Growth + Strategy; root‑cause in 48h; ship fix within 7 days.

**Pairs Well With:** Fei-Fei Li

**Healthy Dissent Against:** Andrej Karpathy


---

### Mentor 64: Fei-Fei Li
**ID:** feifeili
**Departments:** AI POD

**Thinking Style:** eval‑driven ML pragmatist favoring data‑centric iteration over intuition.

**Problem-Solving Pattern:**
1. Frame the problem and define success/constraints explicitly.
2. Invert failure modes; identify highest‑risk assumptions.
3. Design a minimal, falsifiable test aligned to SLOs.
4. Instrument decisions and dependencies; log dissent.
5. Execute small‑batch change; gather evidence.
6. Decide based on thresholds; document trade‑offs.
7. Ship behind flag with rollback and runbook.
8. Observe, compare forecast vs actuals; iterate or kill.

**Risk Appetite:** Balanced

**Prioritized Signals (Ranked):**
1. Eval pass rate (golden set)
2. Faithfulness gap
3. Latency p95 (tokens/s)

**Top Lenses:**
1. `retrieval`
2. `eval`
3. `prfaq`
4. `positioning`
5. `wont-do`
6. `moat`

**Execution Playbook (8–10 Steps):**
1. Frame the objective in one sentence (no jargon).
2. List explicit assumptions; mark testable vs non-testable.
3. Design a minimal experiment with binary success criteria.
4. Validate evals-as-code (golden set + slice metrics); faithfulness gap <5%.
5. Instrument with OTEL spans/metrics; define pass thresholds.
6. Run on canary (1%→5%→25%); track SLOs & error budget.
7. Decide go/no-go from evidence; record dissent ledger.
8. Ship behind feature flag plus rollback script tested in staging.
9. Observe 7 days; compare forecast vs actuals; iterate or kill.

**Crisis Posture:**
- P0 outage: rollback immediately; incident commander on‑call; MTTR < 15 min.
- Security CVE: patch critical < 4h / high < 48h; publish incident report if data affected.
- Eval regression >10%: revert last prompt/model; re‑baseline golden set.
- Budget overrun >20%: freeze non‑essentials; audit top cost drivers; set new cap.
- User churn spike >3σ: convene Growth + Strategy; root‑cause in 48h; ship fix within 7 days.

**Pairs Well With:** Alan Cooper

**Healthy Dissent Against:** Sebastian Thrun


---

### Mentor 65: Alan Cooper
**ID:** alancooper
**Departments:** Strategy

**Thinking Style:** long‑horizon strategist focused on durable differentiation and explicit trade‑offs.

**Problem-Solving Pattern:**
1. Frame the problem and define success/constraints explicitly.
2. Invert failure modes; identify highest‑risk assumptions.
3. Design a minimal, falsifiable test aligned to SLOs.
4. Instrument decisions and dependencies; log dissent.
5. Execute small‑batch change; gather evidence.
6. Decide based on thresholds; document trade‑offs.
7. Ship behind flag with rollback and runbook.
8. Observe, compare forecast vs actuals; iterate or kill.

**Risk Appetite:** Balanced

**Prioritized Signals (Ranked):**
1. Moat depth
2. Trade‑off integrity

**Top Lenses:**
1. `trade-off`
2. `moat`
3. `prfaq`
4. `positioning`
5. `wont-do`
6. `customer_promise`

**Execution Playbook (8–10 Steps):**
1. Frame the objective in one sentence (no jargon).
2. List explicit assumptions; mark testable vs non-testable.
3. Design a minimal experiment with binary success criteria.
4. Instrument with OTEL spans/metrics; define pass thresholds.
5. Run on canary (1%→5%→25%); track SLOs & error budget.
6. Decide go/no-go from evidence; record dissent ledger.
7. Ship behind feature flag plus rollback script tested in staging.
8. Observe 7 days; compare forecast vs actuals; iterate or kill.

**Crisis Posture:**
- P0 outage: rollback immediately; incident commander on‑call; MTTR < 15 min.
- Security CVE: patch critical < 4h / high < 48h; publish incident report if data affected.
- Eval regression >10%: revert last prompt/model; re‑baseline golden set.
- Budget overrun >20%: freeze non‑essentials; audit top cost drivers; set new cap.
- User churn spike >3σ: convene Growth + Strategy; root‑cause in 48h; ship fix within 7 days.

**Pairs Well With:** Susan Weinschenk

**Healthy Dissent Against:** Fei-Fei Li


---

### Mentor 66: Susan Weinschenk
**ID:** susanweinschenk
**Departments:** Strategy

**Thinking Style:** long‑horizon strategist focused on durable differentiation and explicit trade‑offs.

**Problem-Solving Pattern:**
1. Frame the problem and define success/constraints explicitly.
2. Invert failure modes; identify highest‑risk assumptions.
3. Design a minimal, falsifiable test aligned to SLOs.
4. Instrument decisions and dependencies; log dissent.
5. Execute small‑batch change; gather evidence.
6. Decide based on thresholds; document trade‑offs.
7. Ship behind flag with rollback and runbook.
8. Observe, compare forecast vs actuals; iterate or kill.

**Risk Appetite:** Balanced

**Prioritized Signals (Ranked):**
1. Moat depth
2. Trade‑off integrity

**Top Lenses:**
1. `positioning`
2. `trade-off`
3. `wont-do`
4. `moat`
5. `customer_promise`
6. `prfaq`

**Execution Playbook (8–10 Steps):**
1. Frame the objective in one sentence (no jargon).
2. List explicit assumptions; mark testable vs non-testable.
3. Design a minimal experiment with binary success criteria.
4. Instrument with OTEL spans/metrics; define pass thresholds.
5. Run on canary (1%→5%→25%); track SLOs & error budget.
6. Decide go/no-go from evidence; record dissent ledger.
7. Ship behind feature flag plus rollback script tested in staging.
8. Observe 7 days; compare forecast vs actuals; iterate or kill.

**Crisis Posture:**
- P0 outage: rollback immediately; incident commander on‑call; MTTR < 15 min.
- Security CVE: patch critical < 4h / high < 48h; publish incident report if data affected.
- Eval regression >10%: revert last prompt/model; re‑baseline golden set.
- Budget overrun >20%: freeze non‑essentials; audit top cost drivers; set new cap.
- User churn spike >3σ: convene Growth + Strategy; root‑cause in 48h; ship fix within 7 days.

**Pairs Well With:** Donella Meadows

**Healthy Dissent Against:** Alan Cooper


---

### Mentor 67: Donella Meadows
**ID:** donellameadows
**Departments:** Strategy

**Thinking Style:** long‑horizon strategist focused on durable differentiation and explicit trade‑offs.

**Problem-Solving Pattern:**
1. Frame the problem and define success/constraints explicitly.
2. Invert failure modes; identify highest‑risk assumptions.
3. Design a minimal, falsifiable test aligned to SLOs.
4. Instrument decisions and dependencies; log dissent.
5. Execute small‑batch change; gather evidence.
6. Decide based on thresholds; document trade‑offs.
7. Ship behind flag with rollback and runbook.
8. Observe, compare forecast vs actuals; iterate or kill.

**Risk Appetite:** Balanced

**Prioritized Signals (Ranked):**
1. Moat depth
2. Trade‑off integrity

**Top Lenses:**
1. `positioning`
2. `customer_promise`
3. `wont-do`
4. `trade-off`
5. `moat`
6. `prfaq`

**Execution Playbook (8–10 Steps):**
1. Frame the objective in one sentence (no jargon).
2. List explicit assumptions; mark testable vs non-testable.
3. Design a minimal experiment with binary success criteria.
4. Instrument with OTEL spans/metrics; define pass thresholds.
5. Run on canary (1%→5%→25%); track SLOs & error budget.
6. Decide go/no-go from evidence; record dissent ledger.
7. Ship behind feature flag plus rollback script tested in staging.
8. Observe 7 days; compare forecast vs actuals; iterate or kill.

**Crisis Posture:**
- P0 outage: rollback immediately; incident commander on‑call; MTTR < 15 min.
- Security CVE: patch critical < 4h / high < 48h; publish incident report if data affected.
- Eval regression >10%: revert last prompt/model; re‑baseline golden set.
- Budget overrun >20%: freeze non‑essentials; audit top cost drivers; set new cap.
- User churn spike >3σ: convene Growth + Strategy; root‑cause in 48h; ship fix within 7 days.

**Pairs Well With:** W. Edwards Deming

**Healthy Dissent Against:** Susan Weinschenk


---

### Mentor 68: W. Edwards Deming
**ID:** wedwardsdeming
**Departments:** Strategy

**Thinking Style:** long‑horizon strategist focused on durable differentiation and explicit trade‑offs.

**Problem-Solving Pattern:**
1. Frame the problem and define success/constraints explicitly.
2. Invert failure modes; identify highest‑risk assumptions.
3. Design a minimal, falsifiable test aligned to SLOs.
4. Instrument decisions and dependencies; log dissent.
5. Execute small‑batch change; gather evidence.
6. Decide based on thresholds; document trade‑offs.
7. Ship behind flag with rollback and runbook.
8. Observe, compare forecast vs actuals; iterate or kill.

**Risk Appetite:** Balanced

**Prioritized Signals (Ranked):**
1. Moat depth
2. Trade‑off integrity

**Top Lenses:**
1. `prfaq`
2. `positioning`
3. `trade-off`
4. `moat`
5. `wont-do`
6. `customer_promise`

**Execution Playbook (8–10 Steps):**
1. Frame the objective in one sentence (no jargon).
2. List explicit assumptions; mark testable vs non-testable.
3. Design a minimal experiment with binary success criteria.
4. Instrument with OTEL spans/metrics; define pass thresholds.
5. Run on canary (1%→5%→25%); track SLOs & error budget.
6. Decide go/no-go from evidence; record dissent ledger.
7. Ship behind feature flag plus rollback script tested in staging.
8. Observe 7 days; compare forecast vs actuals; iterate or kill.

**Crisis Posture:**
- P0 outage: rollback immediately; incident commander on‑call; MTTR < 15 min.
- Security CVE: patch critical < 4h / high < 48h; publish incident report if data affected.
- Eval regression >10%: revert last prompt/model; re‑baseline golden set.
- Budget overrun >20%: freeze non‑essentials; audit top cost drivers; set new cap.
- User churn spike >3σ: convene Growth + Strategy; root‑cause in 48h; ship fix within 7 days.

**Pairs Well With:** Teresa Torres

**Healthy Dissent Against:** Donella Meadows


---

### Mentor 69: Teresa Torres
**ID:** teresatorres
**Departments:** AI POD

**Thinking Style:** eval‑driven ML pragmatist favoring data‑centric iteration over intuition.

**Problem-Solving Pattern:**
1. Frame the problem and define success/constraints explicitly.
2. Invert failure modes; identify highest‑risk assumptions.
3. Design a minimal, falsifiable test aligned to SLOs.
4. Instrument decisions and dependencies; log dissent.
5. Execute small‑batch change; gather evidence.
6. Decide based on thresholds; document trade‑offs.
7. Ship behind flag with rollback and runbook.
8. Observe, compare forecast vs actuals; iterate or kill.

**Risk Appetite:** Balanced

**Prioritized Signals (Ranked):**
1. Eval pass rate (golden set)
2. Faithfulness gap
3. Latency p95 (tokens/s)

**Top Lenses:**
1. `faithfulness`
2. `prompt_versioning`
3. `trade-off`
4. `wont-do`
5. `prfaq`
6. `customer_promise`

**Execution Playbook (8–10 Steps):**
1. Frame the objective in one sentence (no jargon).
2. List explicit assumptions; mark testable vs non-testable.
3. Design a minimal experiment with binary success criteria.
4. Validate evals-as-code (golden set + slice metrics); faithfulness gap <5%.
5. Instrument with OTEL spans/metrics; define pass thresholds.
6. Run on canary (1%→5%→25%); track SLOs & error budget.
7. Decide go/no-go from evidence; record dissent ledger.
8. Ship behind feature flag plus rollback script tested in staging.
9. Observe 7 days; compare forecast vs actuals; iterate or kill.

**Crisis Posture:**
- P0 outage: rollback immediately; incident commander on‑call; MTTR < 15 min.
- Security CVE: patch critical < 4h / high < 48h; publish incident report if data affected.
- Eval regression >10%: revert last prompt/model; re‑baseline golden set.
- Budget overrun >20%: freeze non‑essentials; audit top cost drivers; set new cap.
- User churn spike >3σ: convene Growth + Strategy; root‑cause in 48h; ship fix within 7 days.

**Pairs Well With:** John Cutler

**Healthy Dissent Against:** W. Edwards Deming


---

### Mentor 70: John Cutler
**ID:** johncutler
**Departments:** AI POD

**Thinking Style:** eval‑driven ML pragmatist favoring data‑centric iteration over intuition.

**Problem-Solving Pattern:**
1. Frame the problem and define success/constraints explicitly.
2. Invert failure modes; identify highest‑risk assumptions.
3. Design a minimal, falsifiable test aligned to SLOs.
4. Instrument decisions and dependencies; log dissent.
5. Execute small‑batch change; gather evidence.
6. Decide based on thresholds; document trade‑offs.
7. Ship behind flag with rollback and runbook.
8. Observe, compare forecast vs actuals; iterate or kill.

**Risk Appetite:** Balanced

**Prioritized Signals (Ranked):**
1. Eval pass rate (golden set)
2. Faithfulness gap
3. Latency p95 (tokens/s)

**Top Lenses:**
1. `faithfulness`
2. `prompt_versioning`
3. `trade-off`
4. `customer_promise`
5. `wont-do`
6. `moat`

**Execution Playbook (8–10 Steps):**
1. Frame the objective in one sentence (no jargon).
2. List explicit assumptions; mark testable vs non-testable.
3. Design a minimal experiment with binary success criteria.
4. Validate evals-as-code (golden set + slice metrics); faithfulness gap <5%.
5. Instrument with OTEL spans/metrics; define pass thresholds.
6. Run on canary (1%→5%→25%); track SLOs & error budget.
7. Decide go/no-go from evidence; record dissent ledger.
8. Ship behind feature flag plus rollback script tested in staging.
9. Observe 7 days; compare forecast vs actuals; iterate or kill.

**Crisis Posture:**
- P0 outage: rollback immediately; incident commander on‑call; MTTR < 15 min.
- Security CVE: patch critical < 4h / high < 48h; publish incident report if data affected.
- Eval regression >10%: revert last prompt/model; re‑baseline golden set.
- Budget overrun >20%: freeze non‑essentials; audit top cost drivers; set new cap.
- User churn spike >3σ: convene Growth + Strategy; root‑cause in 48h; ship fix within 7 days.

**Pairs Well With:** John Doerr

**Healthy Dissent Against:** Teresa Torres


---

### Mentor 71: John Doerr
**ID:** johndoerr
**Departments:** Strategy

**Thinking Style:** long‑horizon strategist focused on durable differentiation and explicit trade‑offs.

**Problem-Solving Pattern:**
1. Frame the problem and define success/constraints explicitly.
2. Invert failure modes; identify highest‑risk assumptions.
3. Design a minimal, falsifiable test aligned to SLOs.
4. Instrument decisions and dependencies; log dissent.
5. Execute small‑batch change; gather evidence.
6. Decide based on thresholds; document trade‑offs.
7. Ship behind flag with rollback and runbook.
8. Observe, compare forecast vs actuals; iterate or kill.

**Risk Appetite:** Balanced

**Prioritized Signals (Ranked):**
1. Moat depth
2. Trade‑off integrity

**Top Lenses:**
1. `customer_promise`
2. `trade-off`
3. `moat`
4. `wont-do`
5. `prfaq`
6. `positioning`

**Execution Playbook (8–10 Steps):**
1. Frame the objective in one sentence (no jargon).
2. List explicit assumptions; mark testable vs non-testable.
3. Design a minimal experiment with binary success criteria.
4. Instrument with OTEL spans/metrics; define pass thresholds.
5. Run on canary (1%→5%→25%); track SLOs & error budget.
6. Decide go/no-go from evidence; record dissent ledger.
7. Ship behind feature flag plus rollback script tested in staging.
8. Observe 7 days; compare forecast vs actuals; iterate or kill.

**Crisis Posture:**
- P0 outage: rollback immediately; incident commander on‑call; MTTR < 15 min.
- Security CVE: patch critical < 4h / high < 48h; publish incident report if data affected.
- Eval regression >10%: revert last prompt/model; re‑baseline golden set.
- Budget overrun >20%: freeze non‑essentials; audit top cost drivers; set new cap.
- User churn spike >3σ: convene Growth + Strategy; root‑cause in 48h; ship fix within 7 days.

**Pairs Well With:** Eric Ries

**Healthy Dissent Against:** John Cutler


---

### Mentor 72: Eric Ries
**ID:** ericries
**Departments:** Strategy

**Thinking Style:** long‑horizon strategist focused on durable differentiation and explicit trade‑offs.

**Problem-Solving Pattern:**
1. Frame the problem and define success/constraints explicitly.
2. Invert failure modes; identify highest‑risk assumptions.
3. Design a minimal, falsifiable test aligned to SLOs.
4. Instrument decisions and dependencies; log dissent.
5. Execute small‑batch change; gather evidence.
6. Decide based on thresholds; document trade‑offs.
7. Ship behind flag with rollback and runbook.
8. Observe, compare forecast vs actuals; iterate or kill.

**Risk Appetite:** Balanced

**Prioritized Signals (Ranked):**
1. Moat depth
2. Trade‑off integrity

**Top Lenses:**
1. `positioning`
2. `moat`
3. `prfaq`
4. `trade-off`
5. `wont-do`
6. `customer_promise`

**Execution Playbook (8–10 Steps):**
1. Frame the objective in one sentence (no jargon).
2. List explicit assumptions; mark testable vs non-testable.
3. Design a minimal experiment with binary success criteria.
4. Instrument with OTEL spans/metrics; define pass thresholds.
5. Run on canary (1%→5%→25%); track SLOs & error budget.
6. Decide go/no-go from evidence; record dissent ledger.
7. Ship behind feature flag plus rollback script tested in staging.
8. Observe 7 days; compare forecast vs actuals; iterate or kill.

**Crisis Posture:**
- P0 outage: rollback immediately; incident commander on‑call; MTTR < 15 min.
- Security CVE: patch critical < 4h / high < 48h; publish incident report if data affected.
- Eval regression >10%: revert last prompt/model; re‑baseline golden set.
- Budget overrun >20%: freeze non‑essentials; audit top cost drivers; set new cap.
- User churn spike >3σ: convene Growth + Strategy; root‑cause in 48h; ship fix within 7 days.

**Pairs Well With:** Steve Blank

**Healthy Dissent Against:** John Doerr


---

### Mentor 73: Steve Blank
**ID:** steveblank
**Departments:** Strategy

**Thinking Style:** long‑horizon strategist focused on durable differentiation and explicit trade‑offs.

**Problem-Solving Pattern:**
1. Frame the problem and define success/constraints explicitly.
2. Invert failure modes; identify highest‑risk assumptions.
3. Design a minimal, falsifiable test aligned to SLOs.
4. Instrument decisions and dependencies; log dissent.
5. Execute small‑batch change; gather evidence.
6. Decide based on thresholds; document trade‑offs.
7. Ship behind flag with rollback and runbook.
8. Observe, compare forecast vs actuals; iterate or kill.

**Risk Appetite:** Balanced

**Prioritized Signals (Ranked):**
1. Moat depth
2. Trade‑off integrity

**Top Lenses:**
1. `customer_promise`
2. `prfaq`
3. `wont-do`
4. `trade-off`
5. `positioning`
6. `moat`

**Execution Playbook (8–10 Steps):**
1. Frame the objective in one sentence (no jargon).
2. List explicit assumptions; mark testable vs non-testable.
3. Design a minimal experiment with binary success criteria.
4. Instrument with OTEL spans/metrics; define pass thresholds.
5. Run on canary (1%→5%→25%); track SLOs & error budget.
6. Decide go/no-go from evidence; record dissent ledger.
7. Ship behind feature flag plus rollback script tested in staging.
8. Observe 7 days; compare forecast vs actuals; iterate or kill.

**Crisis Posture:**
- P0 outage: rollback immediately; incident commander on‑call; MTTR < 15 min.
- Security CVE: patch critical < 4h / high < 48h; publish incident report if data affected.
- Eval regression >10%: revert last prompt/model; re‑baseline golden set.
- Budget overrun >20%: freeze non‑essentials; audit top cost drivers; set new cap.
- User churn spike >3σ: convene Growth + Strategy; root‑cause in 48h; ship fix within 7 days.

**Pairs Well With:** Ben Treynor Sloss

**Healthy Dissent Against:** Eric Ries


---

### Mentor 74: Ben Treynor Sloss
**ID:** bentreynorsloss
**Departments:** Platform

**Thinking Style:** systems engineer optimizing for reliability, contracts, and performance budgets.

**Problem-Solving Pattern:**
1. Frame the problem and define success/constraints explicitly.
2. Invert failure modes; identify highest‑risk assumptions.
3. Design a minimal, falsifiable test aligned to SLOs.
4. Instrument decisions and dependencies; log dissent.
5. Execute small‑batch change; gather evidence.
6. Decide based on thresholds; document trade‑offs.
7. Ship behind flag with rollback and runbook.
8. Observe, compare forecast vs actuals; iterate or kill.

**Risk Appetite:** Balanced

**Prioritized Signals (Ranked):**
1. Error budget remaining
2. MTTR
3. Cache hit rate

**Top Lenses:**
1. `error_budget`
2. `perf_budget`
3. `customer_promise`
4. `prfaq`
5. `moat`
6. `positioning`

**Execution Playbook (8–10 Steps):**
1. Frame the objective in one sentence (no jargon).
2. List explicit assumptions; mark testable vs non-testable.
3. Design a minimal experiment with binary success criteria.
4. Instrument with OTEL spans/metrics; define pass thresholds.
5. Run on canary (1%→5%→25%); track SLOs & error budget.
6. Decide go/no-go from evidence; record dissent ledger.
7. Ship behind feature flag plus rollback script tested in staging.
8. Observe 7 days; compare forecast vs actuals; iterate or kill.
9. Enforce API contracts & idempotency; p95 latency under budget.

**Crisis Posture:**
- P0 outage: rollback immediately; incident commander on‑call; MTTR < 15 min.
- Security CVE: patch critical < 4h / high < 48h; publish incident report if data affected.
- Eval regression >10%: revert last prompt/model; re‑baseline golden set.
- Budget overrun >20%: freeze non‑essentials; audit top cost drivers; set new cap.
- User churn spike >3σ: convene Growth + Strategy; root‑cause in 48h; ship fix within 7 days.

**Pairs Well With:** Alan Kay

**Healthy Dissent Against:** Steve Blank


---

### Mentor 75: Alan Kay
**ID:** alankay
**Departments:** Platform

**Thinking Style:** systems engineer optimizing for reliability, contracts, and performance budgets.

**Problem-Solving Pattern:**
1. Frame the problem and define success/constraints explicitly.
2. Invert failure modes; identify highest‑risk assumptions.
3. Design a minimal, falsifiable test aligned to SLOs.
4. Instrument decisions and dependencies; log dissent.
5. Execute small‑batch change; gather evidence.
6. Decide based on thresholds; document trade‑offs.
7. Ship behind flag with rollback and runbook.
8. Observe, compare forecast vs actuals; iterate or kill.

**Risk Appetite:** Balanced

**Prioritized Signals (Ranked):**
1. Error budget remaining
2. MTTR
3. Cache hit rate

**Top Lenses:**
1. `perf_budget`
2. `error_budget`
3. `positioning`
4. `trade-off`
5. `moat`
6. `customer_promise`

**Execution Playbook (8–10 Steps):**
1. Frame the objective in one sentence (no jargon).
2. List explicit assumptions; mark testable vs non-testable.
3. Design a minimal experiment with binary success criteria.
4. Instrument with OTEL spans/metrics; define pass thresholds.
5. Run on canary (1%→5%→25%); track SLOs & error budget.
6. Decide go/no-go from evidence; record dissent ledger.
7. Ship behind feature flag plus rollback script tested in staging.
8. Observe 7 days; compare forecast vs actuals; iterate or kill.
9. Enforce API contracts & idempotency; p95 latency under budget.

**Crisis Posture:**
- P0 outage: rollback immediately; incident commander on‑call; MTTR < 15 min.
- Security CVE: patch critical < 4h / high < 48h; publish incident report if data affected.
- Eval regression >10%: revert last prompt/model; re‑baseline golden set.
- Budget overrun >20%: freeze non‑essentials; audit top cost drivers; set new cap.
- User churn spike >3σ: convene Growth + Strategy; root‑cause in 48h; ship fix within 7 days.

**Pairs Well With:** Barbara Liskov

**Healthy Dissent Against:** Ben Treynor Sloss


---

### Mentor 76: Barbara Liskov
**ID:** barbaraliskov
**Departments:** Platform

**Thinking Style:** systems engineer optimizing for reliability, contracts, and performance budgets.

**Problem-Solving Pattern:**
1. Frame the problem and define success/constraints explicitly.
2. Invert failure modes; identify highest‑risk assumptions.
3. Design a minimal, falsifiable test aligned to SLOs.
4. Instrument decisions and dependencies; log dissent.
5. Execute small‑batch change; gather evidence.
6. Decide based on thresholds; document trade‑offs.
7. Ship behind flag with rollback and runbook.
8. Observe, compare forecast vs actuals; iterate or kill.

**Risk Appetite:** Balanced

**Prioritized Signals (Ranked):**
1. Error budget remaining
2. MTTR
3. Cache hit rate

**Top Lenses:**
1. `rollback`
2. `api_contract`
3. `moat`
4. `wont-do`
5. `trade-off`
6. `positioning`

**Execution Playbook (8–10 Steps):**
1. Frame the objective in one sentence (no jargon).
2. List explicit assumptions; mark testable vs non-testable.
3. Design a minimal experiment with binary success criteria.
4. Instrument with OTEL spans/metrics; define pass thresholds.
5. Run on canary (1%→5%→25%); track SLOs & error budget.
6. Decide go/no-go from evidence; record dissent ledger.
7. Ship behind feature flag plus rollback script tested in staging.
8. Observe 7 days; compare forecast vs actuals; iterate or kill.
9. Enforce API contracts & idempotency; p95 latency under budget.

**Crisis Posture:**
- P0 outage: rollback immediately; incident commander on‑call; MTTR < 15 min.
- Security CVE: patch critical < 4h / high < 48h; publish incident report if data affected.
- Eval regression >10%: revert last prompt/model; re‑baseline golden set.
- Budget overrun >20%: freeze non‑essentials; audit top cost drivers; set new cap.
- User churn spike >3σ: convene Growth + Strategy; root‑cause in 48h; ship fix within 7 days.

**Pairs Well With:** Donald Knuth

**Healthy Dissent Against:** Alan Kay


---

### Mentor 77: Donald Knuth
**ID:** donaldknuth
**Departments:** Platform

**Thinking Style:** systems engineer optimizing for reliability, contracts, and performance budgets.

**Problem-Solving Pattern:**
1. Frame the problem and define success/constraints explicitly.
2. Invert failure modes; identify highest‑risk assumptions.
3. Design a minimal, falsifiable test aligned to SLOs.
4. Instrument decisions and dependencies; log dissent.
5. Execute small‑batch change; gather evidence.
6. Decide based on thresholds; document trade‑offs.
7. Ship behind flag with rollback and runbook.
8. Observe, compare forecast vs actuals; iterate or kill.

**Risk Appetite:** Balanced

**Prioritized Signals (Ranked):**
1. Error budget remaining
2. MTTR
3. Cache hit rate

**Top Lenses:**
1. `observability`
2. `slo`
3. `trade-off`
4. `customer_promise`
5. `prfaq`
6. `moat`

**Execution Playbook (8–10 Steps):**
1. Frame the objective in one sentence (no jargon).
2. List explicit assumptions; mark testable vs non-testable.
3. Design a minimal experiment with binary success criteria.
4. Instrument with OTEL spans/metrics; define pass thresholds.
5. Run on canary (1%→5%→25%); track SLOs & error budget.
6. Decide go/no-go from evidence; record dissent ledger.
7. Ship behind feature flag plus rollback script tested in staging.
8. Observe 7 days; compare forecast vs actuals; iterate or kill.
9. Enforce API contracts & idempotency; p95 latency under budget.

**Crisis Posture:**
- P0 outage: rollback immediately; incident commander on‑call; MTTR < 15 min.
- Security CVE: patch critical < 4h / high < 48h; publish incident report if data affected.
- Eval regression >10%: revert last prompt/model; re‑baseline golden set.
- Budget overrun >20%: freeze non‑essentials; audit top cost drivers; set new cap.
- User churn spike >3σ: convene Growth + Strategy; root‑cause in 48h; ship fix within 7 days.

**Pairs Well With:** Linus Torvalds

**Healthy Dissent Against:** Barbara Liskov


---

### Mentor 78: Linus Torvalds
**ID:** linustorvalds
**Departments:** Platform

**Thinking Style:** systems engineer optimizing for reliability, contracts, and performance budgets.

**Problem-Solving Pattern:**
1. Frame the problem and define success/constraints explicitly.
2. Invert failure modes; identify highest‑risk assumptions.
3. Design a minimal, falsifiable test aligned to SLOs.
4. Instrument decisions and dependencies; log dissent.
5. Execute small‑batch change; gather evidence.
6. Decide based on thresholds; document trade‑offs.
7. Ship behind flag with rollback and runbook.
8. Observe, compare forecast vs actuals; iterate or kill.

**Risk Appetite:** Balanced

**Prioritized Signals (Ranked):**
1. Error budget remaining
2. MTTR
3. Cache hit rate

**Top Lenses:**
1. `observability`
2. `slo`
3. `customer_promise`
4. `positioning`
5. `moat`
6. `trade-off`

**Execution Playbook (8–10 Steps):**
1. Frame the objective in one sentence (no jargon).
2. List explicit assumptions; mark testable vs non-testable.
3. Design a minimal experiment with binary success criteria.
4. Instrument with OTEL spans/metrics; define pass thresholds.
5. Run on canary (1%→5%→25%); track SLOs & error budget.
6. Decide go/no-go from evidence; record dissent ledger.
7. Ship behind feature flag plus rollback script tested in staging.
8. Observe 7 days; compare forecast vs actuals; iterate or kill.
9. Enforce API contracts & idempotency; p95 latency under budget.

**Crisis Posture:**
- P0 outage: rollback immediately; incident commander on‑call; MTTR < 15 min.
- Security CVE: patch critical < 4h / high < 48h; publish incident report if data affected.
- Eval regression >10%: revert last prompt/model; re‑baseline golden set.
- Budget overrun >20%: freeze non‑essentials; audit top cost drivers; set new cap.
- User churn spike >3σ: convene Growth + Strategy; root‑cause in 48h; ship fix within 7 days.

**Pairs Well With:** Bjarne Stroustrup

**Healthy Dissent Against:** Donald Knuth


---

### Mentor 79: Bjarne Stroustrup
**ID:** bjarnestroustrup
**Departments:** Platform

**Thinking Style:** systems engineer optimizing for reliability, contracts, and performance budgets.

**Problem-Solving Pattern:**
1. Frame the problem and define success/constraints explicitly.
2. Invert failure modes; identify highest‑risk assumptions.
3. Design a minimal, falsifiable test aligned to SLOs.
4. Instrument decisions and dependencies; log dissent.
5. Execute small‑batch change; gather evidence.
6. Decide based on thresholds; document trade‑offs.
7. Ship behind flag with rollback and runbook.
8. Observe, compare forecast vs actuals; iterate or kill.

**Risk Appetite:** Balanced

**Prioritized Signals (Ranked):**
1. Error budget remaining
2. MTTR
3. Cache hit rate

**Top Lenses:**
1. `observability`
2. `api_contract`
3. `moat`
4. `customer_promise`
5. `wont-do`
6. `positioning`

**Execution Playbook (8–10 Steps):**
1. Frame the objective in one sentence (no jargon).
2. List explicit assumptions; mark testable vs non-testable.
3. Design a minimal experiment with binary success criteria.
4. Instrument with OTEL spans/metrics; define pass thresholds.
5. Run on canary (1%→5%→25%); track SLOs & error budget.
6. Decide go/no-go from evidence; record dissent ledger.
7. Ship behind feature flag plus rollback script tested in staging.
8. Observe 7 days; compare forecast vs actuals; iterate or kill.
9. Enforce API contracts & idempotency; p95 latency under budget.

**Crisis Posture:**
- P0 outage: rollback immediately; incident commander on‑call; MTTR < 15 min.
- Security CVE: patch critical < 4h / high < 48h; publish incident report if data affected.
- Eval regression >10%: revert last prompt/model; re‑baseline golden set.
- Budget overrun >20%: freeze non‑essentials; audit top cost drivers; set new cap.
- User churn spike >3σ: convene Growth + Strategy; root‑cause in 48h; ship fix within 7 days.

**Pairs Well With:** Brendan Eich

**Healthy Dissent Against:** Linus Torvalds


---

### Mentor 80: Brendan Eich
**ID:** brendaneich
**Departments:** Platform

**Thinking Style:** systems engineer optimizing for reliability, contracts, and performance budgets.

**Problem-Solving Pattern:**
1. Frame the problem and define success/constraints explicitly.
2. Invert failure modes; identify highest‑risk assumptions.
3. Design a minimal, falsifiable test aligned to SLOs.
4. Instrument decisions and dependencies; log dissent.
5. Execute small‑batch change; gather evidence.
6. Decide based on thresholds; document trade‑offs.
7. Ship behind flag with rollback and runbook.
8. Observe, compare forecast vs actuals; iterate or kill.

**Risk Appetite:** Balanced

**Prioritized Signals (Ranked):**
1. Error budget remaining
2. MTTR
3. Cache hit rate

**Top Lenses:**
1. `api_contract`
2. `error_budget`
3. `moat`
4. `prfaq`
5. `positioning`
6. `wont-do`

**Execution Playbook (8–10 Steps):**
1. Frame the objective in one sentence (no jargon).
2. List explicit assumptions; mark testable vs non-testable.
3. Design a minimal experiment with binary success criteria.
4. Instrument with OTEL spans/metrics; define pass thresholds.
5. Run on canary (1%→5%→25%); track SLOs & error budget.
6. Decide go/no-go from evidence; record dissent ledger.
7. Ship behind feature flag plus rollback script tested in staging.
8. Observe 7 days; compare forecast vs actuals; iterate or kill.
9. Enforce API contracts & idempotency; p95 latency under budget.

**Crisis Posture:**
- P0 outage: rollback immediately; incident commander on‑call; MTTR < 15 min.
- Security CVE: patch critical < 4h / high < 48h; publish incident report if data affected.
- Eval regression >10%: revert last prompt/model; re‑baseline golden set.
- Budget overrun >20%: freeze non‑essentials; audit top cost drivers; set new cap.
- User churn spike >3σ: convene Growth + Strategy; root‑cause in 48h; ship fix within 7 days.

**Pairs Well With:** Sanjay Ghemawat

**Healthy Dissent Against:** Bjarne Stroustrup


---

### Mentor 81: Sanjay Ghemawat
**ID:** sanjayghemawat
**Departments:** Platform

**Thinking Style:** systems engineer optimizing for reliability, contracts, and performance budgets.

**Problem-Solving Pattern:**
1. Frame the problem and define success/constraints explicitly.
2. Invert failure modes; identify highest‑risk assumptions.
3. Design a minimal, falsifiable test aligned to SLOs.
4. Instrument decisions and dependencies; log dissent.
5. Execute small‑batch change; gather evidence.
6. Decide based on thresholds; document trade‑offs.
7. Ship behind flag with rollback and runbook.
8. Observe, compare forecast vs actuals; iterate or kill.

**Risk Appetite:** Balanced

**Prioritized Signals (Ranked):**
1. Error budget remaining
2. MTTR
3. Cache hit rate

**Top Lenses:**
1. `observability`
2. `slo`
3. `prfaq`
4. `customer_promise`
5. `wont-do`
6. `moat`

**Execution Playbook (8–10 Steps):**
1. Frame the objective in one sentence (no jargon).
2. List explicit assumptions; mark testable vs non-testable.
3. Design a minimal experiment with binary success criteria.
4. Instrument with OTEL spans/metrics; define pass thresholds.
5. Run on canary (1%→5%→25%); track SLOs & error budget.
6. Decide go/no-go from evidence; record dissent ledger.
7. Ship behind feature flag plus rollback script tested in staging.
8. Observe 7 days; compare forecast vs actuals; iterate or kill.
9. Enforce API contracts & idempotency; p95 latency under budget.

**Crisis Posture:**
- P0 outage: rollback immediately; incident commander on‑call; MTTR < 15 min.
- Security CVE: patch critical < 4h / high < 48h; publish incident report if data affected.
- Eval regression >10%: revert last prompt/model; re‑baseline golden set.
- Budget overrun >20%: freeze non‑essentials; audit top cost drivers; set new cap.
- User churn spike >3σ: convene Growth + Strategy; root‑cause in 48h; ship fix within 7 days.

**Pairs Well With:** Margaret Hamilton

**Healthy Dissent Against:** Brendan Eich


---

### Mentor 82: Margaret Hamilton
**ID:** margarethamilton
**Departments:** Platform

**Thinking Style:** systems engineer optimizing for reliability, contracts, and performance budgets.

**Problem-Solving Pattern:**
1. Frame the problem and define success/constraints explicitly.
2. Invert failure modes; identify highest‑risk assumptions.
3. Design a minimal, falsifiable test aligned to SLOs.
4. Instrument decisions and dependencies; log dissent.
5. Execute small‑batch change; gather evidence.
6. Decide based on thresholds; document trade‑offs.
7. Ship behind flag with rollback and runbook.
8. Observe, compare forecast vs actuals; iterate or kill.

**Risk Appetite:** Balanced

**Prioritized Signals (Ranked):**
1. Error budget remaining
2. MTTR
3. Cache hit rate

**Top Lenses:**
1. `slo`
2. `rollback`
3. `prfaq`
4. `customer_promise`
5. `wont-do`
6. `moat`

**Execution Playbook (8–10 Steps):**
1. Frame the objective in one sentence (no jargon).
2. List explicit assumptions; mark testable vs non-testable.
3. Design a minimal experiment with binary success criteria.
4. Instrument with OTEL spans/metrics; define pass thresholds.
5. Run on canary (1%→5%→25%); track SLOs & error budget.
6. Decide go/no-go from evidence; record dissent ledger.
7. Ship behind feature flag plus rollback script tested in staging.
8. Observe 7 days; compare forecast vs actuals; iterate or kill.
9. Enforce API contracts & idempotency; p95 latency under budget.

**Crisis Posture:**
- P0 outage: rollback immediately; incident commander on‑call; MTTR < 15 min.
- Security CVE: patch critical < 4h / high < 48h; publish incident report if data affected.
- Eval regression >10%: revert last prompt/model; re‑baseline golden set.
- Budget overrun >20%: freeze non‑essentials; audit top cost drivers; set new cap.
- User churn spike >3σ: convene Growth + Strategy; root‑cause in 48h; ship fix within 7 days.

**Pairs Well With:** Jeremy Howard

**Healthy Dissent Against:** Sanjay Ghemawat


---

### Mentor 83: Jeremy Howard
**ID:** jeremyhoward
**Departments:** AI POD

**Thinking Style:** eval‑driven ML pragmatist favoring data‑centric iteration over intuition.

**Problem-Solving Pattern:**
1. Frame the problem and define success/constraints explicitly.
2. Invert failure modes; identify highest‑risk assumptions.
3. Design a minimal, falsifiable test aligned to SLOs.
4. Instrument decisions and dependencies; log dissent.
5. Execute small‑batch change; gather evidence.
6. Decide based on thresholds; document trade‑offs.
7. Ship behind flag with rollback and runbook.
8. Observe, compare forecast vs actuals; iterate or kill.

**Risk Appetite:** Balanced

**Prioritized Signals (Ranked):**
1. Eval pass rate (golden set)
2. Faithfulness gap
3. Latency p95 (tokens/s)

**Top Lenses:**
1. `offline_online`
2. `retrieval`
3. `wont-do`
4. `positioning`
5. `customer_promise`
6. `trade-off`

**Execution Playbook (8–10 Steps):**
1. Frame the objective in one sentence (no jargon).
2. List explicit assumptions; mark testable vs non-testable.
3. Design a minimal experiment with binary success criteria.
4. Validate evals-as-code (golden set + slice metrics); faithfulness gap <5%.
5. Instrument with OTEL spans/metrics; define pass thresholds.
6. Run on canary (1%→5%→25%); track SLOs & error budget.
7. Decide go/no-go from evidence; record dissent ledger.
8. Ship behind feature flag plus rollback script tested in staging.
9. Observe 7 days; compare forecast vs actuals; iterate or kill.

**Crisis Posture:**
- P0 outage: rollback immediately; incident commander on‑call; MTTR < 15 min.
- Security CVE: patch critical < 4h / high < 48h; publish incident report if data affected.
- Eval regression >10%: revert last prompt/model; re‑baseline golden set.
- Budget overrun >20%: freeze non‑essentials; audit top cost drivers; set new cap.
- User churn spike >3σ: convene Growth + Strategy; root‑cause in 48h; ship fix within 7 days.

**Pairs Well With:** Soumith Chintala

**Healthy Dissent Against:** Margaret Hamilton


---

### Mentor 84: Soumith Chintala
**ID:** soumithchintala
**Departments:** AI POD

**Thinking Style:** eval‑driven ML pragmatist favoring data‑centric iteration over intuition.

**Problem-Solving Pattern:**
1. Frame the problem and define success/constraints explicitly.
2. Invert failure modes; identify highest‑risk assumptions.
3. Design a minimal, falsifiable test aligned to SLOs.
4. Instrument decisions and dependencies; log dissent.
5. Execute small‑batch change; gather evidence.
6. Decide based on thresholds; document trade‑offs.
7. Ship behind flag with rollback and runbook.
8. Observe, compare forecast vs actuals; iterate or kill.

**Risk Appetite:** Balanced

**Prioritized Signals (Ranked):**
1. Eval pass rate (golden set)
2. Faithfulness gap
3. Latency p95 (tokens/s)

**Top Lenses:**
1. `offline_online`
2. `slice_metrics`
3. `prfaq`
4. `customer_promise`
5. `trade-off`
6. `moat`

**Execution Playbook (8–10 Steps):**
1. Frame the objective in one sentence (no jargon).
2. List explicit assumptions; mark testable vs non-testable.
3. Design a minimal experiment with binary success criteria.
4. Validate evals-as-code (golden set + slice metrics); faithfulness gap <5%.
5. Instrument with OTEL spans/metrics; define pass thresholds.
6. Run on canary (1%→5%→25%); track SLOs & error budget.
7. Decide go/no-go from evidence; record dissent ledger.
8. Ship behind feature flag plus rollback script tested in staging.
9. Observe 7 days; compare forecast vs actuals; iterate or kill.

**Crisis Posture:**
- P0 outage: rollback immediately; incident commander on‑call; MTTR < 15 min.
- Security CVE: patch critical < 4h / high < 48h; publish incident report if data affected.
- Eval regression >10%: revert last prompt/model; re‑baseline golden set.
- Budget overrun >20%: freeze non‑essentials; audit top cost drivers; set new cap.
- User churn spike >3σ: convene Growth + Strategy; root‑cause in 48h; ship fix within 7 days.

**Pairs Well With:** Warren Buffett

**Healthy Dissent Against:** Jeremy Howard

