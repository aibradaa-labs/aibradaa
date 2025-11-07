# Evaluation Suites (INTERNAL ONLY)

**Version:** 2.0.0
**Last Updated:** 2025-11-07
**Purpose:** Golden sets, baselines, and slice specs for systematic quality measurement

---

## Overview

This directory contains evaluation suites for all AI Bradaa surfaces. Evals are **mandatory** before any prompt, model, or major feature change and are **merge-blocking** in CI.

**Binding Authority:** Per DOC 2, evals are binding sources. Pass thresholds must be met:
- **Faithfulness:** ≥92%
- **Citation:** ≥90%
- **Toxicity:** ≤0.5%
- **Slice Parity:** Δ ≤5% across segments

---

## Directory Structure

```
eval_suites/
├── README.md (this file)
├── command/          # Command surface evals (n≥200)
│   ├── golden_set.jsonl
│   ├── baseline.json
│   └── slice_specs.json
├── versus/           # Versus surface evals (n≥150)
│   ├── golden_set.jsonl
│   ├── baseline.json
│   └── slice_specs.json
├── intel/            # Intel surface evals (n≥300)
│   ├── golden_set.jsonl
│   ├── baseline.json
│   └── slice_specs.json
└── offers/           # Offers surface evals (n≥200)
    ├── golden_set.jsonl
    ├── baseline.json
    └── slice_specs.json
```

---

## File Formats

### Golden Set (`golden_set.jsonl`)

**Format:** JSONL (one JSON object per line)
**Purpose:** Hand-curated question-answer pairs with eval criteria

**Schema:**
```json
{
  "id": "eval-001",
  "surface": "command",
  "question": "Compare ThinkPad X1 vs Dell XPS 13 for portability",
  "expected_answer": "ThinkPad X1 (1.15kg) is slightly heavier than XPS 13 (1.08kg). XPS 13 has longer battery life (12h vs 10h). Both have excellent build quality. XPS 13 edges out for pure portability.",
  "eval_criteria": [
    "mentions weight comparison",
    "mentions battery life",
    "cites specific specs",
    "provides clear recommendation"
  ],
  "priority": "P1",
  "added_date": "2025-11-07",
  "tags": ["comparison", "portability", "specs"]
}
```

**Minimum Sample Size:**
- Command: n≥200
- Versus: n≥150
- Intel: n≥300
- Offers: n≥200

### Baseline (`baseline.json`)

**Purpose:** Historical performance benchmark for regression detection

**Schema:**
```json
{
  "surface": "command",
  "version": "v1.0.0",
  "date": "2025-11-07",
  "model": "gemini-2.5-pro-001",
  "prompt_version": "command_think_v1.0.0",
  "metrics": {
    "accuracy": 0.96,
    "faithfulness": 0.94,
    "citation_rate": 0.92,
    "toxicity": 0.002,
    "latency_p50_ms": 1850,
    "latency_p95_ms": 3200,
    "latency_p99_ms": 4500,
    "tokens_in_avg": 18500,
    "tokens_out_avg": 1820
  },
  "slices": {
    "by_locale": {
      "en": {"accuracy": 0.96, "faithfulness": 0.94},
      "ms": {"accuracy": 0.95, "faithfulness": 0.93}
    },
    "by_brand": {
      "Lenovo": {"accuracy": 0.97},
      "HP": {"accuracy": 0.96},
      "Dell": {"accuracy": 0.95}
    },
    "by_price": {
      "under_3k": {"accuracy": 0.96},
      "3k_5k": {"accuracy": 0.96},
      "over_5k": {"accuracy": 0.95}
    }
  },
  "notes": "Initial baseline after P0 fixes. No significant bias detected."
}
```

**Update Cadence:** Quarterly + after major model/prompt changes

### Slice Specs (`slice_specs.json`)

**Purpose:** Define user segments for fairness and quality analysis

**Schema:**
```json
{
  "surface": "command",
  "slices": [
    {
      "dimension": "locale",
      "segments": ["en", "ms"],
      "parity_threshold": 0.05,
      "description": "English vs Bahasa Malaysia"
    },
    {
      "dimension": "brand",
      "segments": ["Lenovo", "HP", "Dell", "Asus", "Acer", "Apple", "Microsoft"],
      "parity_threshold": 0.05,
      "description": "No brand bias in recommendations"
    },
    {
      "dimension": "price",
      "segments": ["under_3k", "3k_5k", "over_5k"],
      "parity_threshold": 0.05,
      "description": "Quality across price ranges"
    },
    {
      "dimension": "tier",
      "segments": ["guest", "free", "pro"],
      "parity_threshold": 0.05,
      "description": "Quality parity across user tiers"
    }
  ],
  "notes": "Parity threshold Δ ≤5% means no segment should be >5% worse than best segment"
}
```

---

## Evaluation Workflow

### Pre-Merge (CI Gate)

1. **Trigger:** Any change to:
   - Prompt files (`ai_pod/personas/*.md`)
   - Model configuration
   - Major feature affecting AI outputs

2. **Runner:** `tests/evals/runner.js` (Node script)

3. **Process:**
   - Load golden set for affected surface(s)
   - Run each question through API
   - Compare response vs expected_answer (fuzzy match, 80% threshold)
   - Check eval_criteria (all must pass)
   - Calculate metrics: accuracy, faithfulness, citation_rate, latency
   - Compare vs baseline (regression if <95% baseline)

4. **Pass Criteria:**
   - Accuracy ≥95% of baseline
   - Faithfulness ≥92%
   - Citation rate ≥90%
   - Toxicity ≤0.5%
   - Slice parity Δ ≤5%
   - p95 latency within SLO

5. **Failure:** Block merge; require fixes

### Quarterly Drift Check

**Purpose:** Detect degradation over time (model drift, data staleness)

**Process:**
1. Run full eval suite (all surfaces)
2. Compare vs baseline
3. Analyze slice metrics for new biases
4. Update baseline if improvements are sustained (>30 days)
5. Document findings in changelog

---

## Metric Definitions

### Accuracy
**Definition:** % of responses that match expected answer (fuzzy match ≥80% similarity)
**Threshold:** ≥95% of baseline
**Calculation:** `(correct_responses / total_responses) * 100`

### Faithfulness
**Definition:** % of responses grounded in sources (no hallucinations)
**Threshold:** ≥92%
**Calculation:** Manual review (sample 50) + automated citation checking

### Citation Rate
**Definition:** % of responses with valid, verifiable citations
**Threshold:** ≥90%
**Calculation:** `(responses_with_citations / total_responses) * 100`

### Toxicity
**Definition:** % of responses flagged as toxic (hate, violence, bias)
**Threshold:** ≤0.5%
**Tool:** Perspective API or equivalent
**Calculation:** `(toxic_responses / total_responses) * 100`

### Slice Parity
**Definition:** Max deviation between best and worst performing slice
**Threshold:** Δ ≤5%
**Example:** If `en` accuracy is 96% and `ms` is 90%, parity Δ = 6% (FAIL)

### Latency (p95)
**Definition:** 95th percentile response time
**Threshold:** Per surface SLO (Command ≤1.2s, Versus ≤1.8s, Intel ≤2.5s)
**Calculation:** Sort latencies, take 95th percentile value

---

## Creating New Golden Sets

### Process

1. **Identify Representative Cases:**
   - Common queries (80% of traffic patterns)
   - Edge cases (boundary conditions)
   - Error-prone patterns (past failures)
   - Slice coverage (all segments represented)

2. **Draft Questions:**
   - Natural language (as users would ask)
   - Unambiguous (single clear answer)
   - Testable (can verify objectively)

3. **Generate Expected Answers:**
   - Manual research (check specs, reviews)
   - Cite sources
   - Write eval_criteria (checklist of requirements)

4. **Validate:**
   - Run through API
   - Verify answer quality
   - Adjust criteria if needed

5. **Add to Golden Set:**
   - Append to `golden_set.jsonl`
   - Update `baseline.json` if this is first run
   - Document in changelog

### Quality Standards

- **Diversity:** Cover all major use cases
- **Balance:** Equal representation across slices
- **Clarity:** Unambiguous questions and answers
- **Stability:** Answers should remain valid >6 months
- **Traceability:** All expected answers have source citations

---

## Maintenance

### Quarterly Review

- [ ] Review golden set for stale questions (outdated specs, EOL products)
- [ ] Add new questions for recent features
- [ ] Re-run full eval suite
- [ ] Update baseline if sustained improvements
- [ ] Document changes in changelog

### Post-Incident

- [ ] Add regression tests for root cause
- [ ] Re-run affected surface evals
- [ ] Update golden set if gaps found
- [ ] Document in dissent ledger

---

## Tools & Scripts

### Eval Runner

**Location:** `/tests/evals/runner.js`
**Usage:**
```bash
node tests/evals/runner.js --surface command --golden project/governance/84/eval_suites/command/golden_set.jsonl
```

**Output:**
- Pass/fail per question
- Aggregate metrics
- Slice breakdown
- Comparison vs baseline

### Golden Set Generator (Planned)

**Purpose:** Semi-automated golden set creation
**Status:** P2 (not yet implemented)
**Approach:** LLM-assisted question generation + human review

---

## References

- **DOC 2:** Evals-as-code requirements (section on evaluation)
- **Baseline Thresholds:** Faithfulness ≥92%, Citation ≥90%, Toxicity ≤0.5%
- **OTEL Instrumentation:** Latency and token usage tracked per eval run
- **Changelog:** All eval updates logged

---

**Maintained By:** Owner + AI POD Department
**Review Cadence:** Quarterly + Post-Major-Change
**Next Review:** 2026-02-07
