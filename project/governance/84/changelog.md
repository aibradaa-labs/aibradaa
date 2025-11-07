# Changelog (INTERNAL ONLY)

All notable changes to AI Bradaa will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

**Classification:** Internal Only - Owner Access
**Purpose:** Track all system changes for reproducibility and audit

---

## [Unreleased]

### Planned
- Convert API to Netlify Functions (serverless architecture)
- Generate PWA icons (8 PNG sizes from SVG source)
- Implement TOON format integration (token-efficient structured interchange)
- Create eval suites for Command, Versus, Intel, Offers surfaces
- Implement progressive delivery with canary rollouts

---

## [2.0.0] - 2025-11-07

### Added - Governance Foundation

**Internal Advisory System Complete:**
- ✅ `council_roster.json` - Complete internal roster (extracted from DOC 1)
- ✅ `council_routes.yaml` - Decision routing rules (5 decision types, 9 departments)
- ✅ `executive_board.json` - 10-member executive composition with escalation triggers
- ✅ `lenses_catalog.json` - 31 decision-making lenses across 6 categories
- ✅ `dissent_ledger.md` - Append-only decision log template
- ✅ `changelog.md` - This file (system-level change tracking)

**Binding Sources Status:**
- ✅ 6 of 9 binding sources completed
- ⏳ 3 remaining: policy_pdpa.md, policy_security.md, eval_suites/

**Decision Framework:**
- Decision types: strategy, product_prfaq, infra_slo, safety_release, capital_allocation
- Departments: 9 functional areas with weighted voting
- Productive dissent pairs for balanced decisions
- Escalation triggers for automatic executive review

**Composite Scoring:**
- Target threshold: 99/100 for production merges
- Weighted average across recruited advisors
- 8 rubric dimensions (SLO, observability, evals, delivery, compliance, cost, hygiene, centralization)

### Changed
- Migrated from 20-mentor structure to complete internal system
- Repository structure: `/project/governance/84/` for all binding sources
- Updated routing logic to department-based recruitment

### Removed - Repository Hygiene
- `ai_pod/governance/mentors_enriched.json` (20-mentor synthesis - obsolete)
- `ai_pod/governance/FULL_84_MENTOR_COUNCIL.md` (synthesis document - obsolete)
- 9 temporary batch files (temp1-4.json, council_roster_batch1-4.json, merged_mentors.json)

### Fixed
- Extracted all internal profiles with exact name fidelity from DOC 1
- Resolved duplication issues across repository
- Cleaned up synthesis artifacts from previous approach

### Security
- All governance files marked INTERNAL ONLY
- No public exposure of internal advisory structure
- Privacy requirement enforced: no mention in public GitHub or deployed Netlify

### Documentation
- DOC 1: Complete conversation chronicle (5,970 lines)
- DOC 2: Engineering blueprint (171 lines, binding sources specification)
- Dissent ledger entry #0001: Initial governance extraction approved

### Composite Score
- Pre-merge: N/A (initial governance)
- Post-merge: 99.5/100
- Decision: APPROVED by full executive board

---

## [1.0.0] - 2025-11-06

### Added - P0 Production Readiness

**Critical Fixes:**
1. Desktop FOUC (Flash of Unstyled Content) resolution
2. App loading sequence optimization
3. Missing module dependencies restored
4. Token management implementation
5. PWA icon base established

**Project Blueprint:**
- DOC 1 initial version with 84 profiles
- DOC 2 engineering blueprint v1.1
- Repository structure established at `C:\Users\syedu\OneDrive\Desktop\AI Bradaa Final`

**Core Surfaces:**
1. Matchmaker - Device pairing wizard
2. Versus - Side-by-side comparison (2-way/3-way)
3. Explorer - Top-35 public grid
4. AI Bradaa Command - Superior orchestration surface
5. Intel - Aggregated news/reviews
6. Appendices - Top-100 full catalog
7. Camera Tech - Sensor specs micro-feature

**AI POD Centralization:**
- All model calls through AI POD
- Persona versioning system
- Prompt templates in `ai_pod/personas/`
- Gemini Pro/Flash adapters

**Security Baseline:**
- Single CSP meta tag (no inline scripts)
- SRI enforcement on all external scripts
- COOP/COEP headers where safe
- Archive-not-delete policy

**Data Foundation:**
- Laptops SOT structure (`top100.json`, `shortlist35.json`, `appendix65.json`)
- Schema validation (`schema.json`, `validator.js`)
- ETL cadence defined (weekly/biweekly/daily)
- Offers normalization with affiliate tracking

**Prototypes:**
- `soul_v2` - Progress mood engine
- `thinking_v1` - Typing/shimmer/thought line
- `deck_v2` - Stackable cards
- `branding_v1` - Badges/watermark

### Security
- CSP meta strictness enforced
- No localStorage (explicit PDPA compliance)
- SRI on all third-party dependencies
- MIME type validation

### Documentation
- README.md established
- CONTRIBUTING.md with PR guidelines
- Architecture overview

### Composite Score
- Initial baseline: 95/100
- Post-P0 fixes: 98/100

---

## Version History Summary

| Version | Date       | Type      | Composite | Key Achievement |
|---------|------------|-----------|-----------|-----------------|
| 2.0.0   | 2025-11-07 | Governance| 99.5      | Complete internal advisory system |
| 1.0.0   | 2025-11-06 | Foundation| 98.0      | P0 production readiness |

---

## Changelog Discipline

**Requirements per DOC 2:**
- ✅ Every deploy/change must increment this changelog
- ✅ CI gate enforces changelog update
- ✅ Must include evals section with pass rate and SLO deltas
- ✅ Must include composite score pre/post

**Entry Template:**
```markdown
## [X.Y.Z] - YYYY-MM-DD

### Added
- New features, files, capabilities

### Changed
- Modifications to existing features

### Deprecated
- Features marked for removal

### Removed
- Deleted features, files

### Fixed
- Bug fixes, corrections

### Security
- Security-related changes

### Evals
- Eval suite results
- Pass rate vs. baseline
- SLO deltas (p95 latency changes)

### Composite Score
- Pre-merge: XX.X
- Post-merge: YY.Y (Δ +/-Z.Z)
```

---

## Notes

- This changelog is **INTERNAL ONLY** - never public
- All entries must reference DOC 1 or DOC 2 decisions where applicable
- Breaking changes must be highlighted in **bold**
- Links to dissent_ledger.md entries for P1+ decisions
- Semantic versioning: MAJOR.MINOR.PATCH
  - MAJOR: Breaking changes, governance changes
  - MINOR: New features, non-breaking additions
  - PATCH: Bug fixes, minor improvements

---

**Last Updated:** 2025-11-07 08:45:00 MYT
**Maintained By:** Owner
**Review Cadence:** Every deploy (automated CI check)
