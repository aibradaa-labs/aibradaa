# Semantic Routing V2 - Quick Start Guide

**Phase 9.20:** 84-Mentor Auto-Routing with ML Semantic Understanding

---

## Quick Start (3 Steps)

### 1. Set API Key
```bash
export GEMINI_API_KEY=your_gemini_api_key_here
```

### 2. Use in API
```javascript
// POST /api/mentor/consult
{
  "query": "Should we add dark mode?",
  "useSemanticRouting": true  // Default: true
}
```

### 3. Get Results
```javascript
{
  "semanticRouting": {
    "intent": "ux_improvement",
    "context": {
      "impact": "high",
      "effort": "medium",
      "reversible": true
    },
    "routing": [
      {
        "council": "Design Council",
        "mentor": "Don Nielsen",
        "confidence": 0.95,
        "reasoning": "UX feature request requiring design expertise"
      }
    ],
    "confidenceLevel": "high"
  }
}
```

---

## Direct Usage

```javascript
import { getSemanticRouter } from './netlify/functions/utils/semantic-router.mjs';

// Initialize router
const router = getSemanticRouter(process.env.GEMINI_API_KEY);

// Route a query
const result = await router.route('Should we add dark mode?');

// Access routing data
console.log(result.intent);              // "ux_improvement"
console.log(result.routing[0].mentor);   // "Don Nielsen"
console.log(result.routing[0].confidence); // 0.95
console.log(result.escalation.required); // false
```

---

## Intent Categories

| Intent | Description | Example Query |
|--------|-------------|---------------|
| `feature_request` | New capability | "Should we add video calls?" |
| `bug_report` | Something broken | "Search is returning errors" |
| `optimization` | Performance/cost | "Can we speed up laptop search?" |
| `architecture_decision` | Technical design | "Should we use microservices?" |
| `pricing_change` | Monetization | "Increase Pro to RM50?" |
| `security_concern` | Safety/privacy | "How to handle GDPR?" |
| `ux_improvement` | User experience | "Should we add dark mode?" |
| `infrastructure_change` | Ops/platform | "Migrate to Kubernetes?" |

---

## Confidence Levels

| Level | Range | Action |
|-------|-------|--------|
| **high** | ≥0.90 | Route to primary council only |
| **medium** | 0.70-0.89 | Route to primary + secondary |
| **low** | 0.50-0.69 | Route to all relevant + escalate |
| **conflicting** | <0.50 | Escalate to CEO/Executive Board |

---

## Context Fields

```javascript
context: {
  impact: "critical" | "high" | "medium" | "low",
  effort: "high" | "medium" | "low",
  reversible: boolean,
  urgency: "immediate" | "high" | "medium" | "low"
}
```

---

## Mentor Councils

| Council | Mentors | Expertise |
|---------|---------|-----------|
| **Strategy** | Reid Hoffman, Ben Horowitz, Warren Buffett | Business strategy, competitive positioning |
| **Product** | Marty Cagan, Julie Zhuo | Product strategy, roadmap, features |
| **Design** | Don Nielsen, Jony Ive, Dieter Rams | UX/UI, user experience, interface |
| **Engineering** | Linus Torvalds, DHH, Jeff Dean | Technical implementation, architecture |
| **Security** | Bruce Schneier, Arvind Narayanan | Security, privacy, compliance |
| **AI/ML** | Andrew Ng, Geoffrey Hinton | Machine learning, AI models |
| **Platform** | Guillermo Rauch, Gene Kim | Infrastructure, DevOps, platform |
| **Growth** | Brian Balfour, Hiten Shah | User acquisition, retention, growth |
| **Finance** | Warren Buffett, Ray Dalio | Pricing, costs, ROI, financial strategy |

---

## Test Examples

### Example 1: UX Feature
```javascript
query: "Should we add dark mode?"
→ intent: "ux_improvement"
→ primary: Design Council → Don Nielsen (0.95)
→ escalation: none
```

### Example 2: Pricing Change
```javascript
query: "Increase Pro tier from RM30 to RM40?"
→ intent: "pricing_change"
→ primary: Finance Council → Warren Buffett (0.95)
→ escalation: none
```

### Example 3: Performance Bug
```javascript
query: "Users reporting slow laptop search"
→ intent: "bug_report + optimization"
→ primary: Engineering Council → DHH (0.92)
→ escalation: none
```

### Example 4: Critical Security
```javascript
query: "How should we handle GDPR compliance?"
→ intent: "security_concern"
→ primary: Security Council → Bruce Schneier (0.93)
→ escalation: YES (executive, legal review)
```

---

## Run Tests

### Demo (No API Key Required)
```bash
node demo-semantic-routing.mjs
```

### Full Test Suite (Requires API Key)
```bash
GEMINI_API_KEY=xxx node test-semantic-routing.mjs
```

---

## Cost

- **Model:** Gemini 2.5 Pro
- **Tokens per route:** ~2,000 tokens
- **Cost per route:** RM 0.0022 (~0.22 sen)
- **Acceptable for high-value mentor consultations**

---

## Configuration Files

| File | Purpose |
|------|---------|
| `/netlify/functions/utils/semantic-router.mjs` | Semantic routing engine |
| `/ops/mentor-expertise.json` | Mentor expertise mapping |
| `/ops/routing-history.json` | Routing history tracking |
| `/netlify/functions/mentor-consultation.mjs` | Consultation API (V2) |

---

## Fallback Behavior

If `GEMINI_API_KEY` is not set or LLM fails:
1. **Automatic fallback** to keyword-based routing
2. Logs warning to console
3. Returns routing with `fallback: true` flag
4. Lower confidence scores (0.40-0.70)

```javascript
// Explicit fallback
{
  "query": "Should we add dark mode?",
  "category": "design",          // Manual category
  "useSemanticRouting": false    // Disable semantic
}
```

---

## Troubleshooting

### Issue: `ERR_MODULE_NOT_FOUND` for @google/generative-ai
**Solution:** Install dependencies
```bash
npm install @google/generative-ai
```

### Issue: Low confidence scores
**Solution:** Query may be ambiguous, check:
- Is the query clear and specific?
- Does it contain domain keywords?
- Review `escalation.reason` for guidance

### Issue: Wrong mentor routed
**Solution:**
1. Check matched expertise in response
2. Update `/ops/mentor-expertise.json` with better keywords
3. Log feedback to `/ops/routing-history.json`

---

## Advanced Usage

### Get Routing History
```javascript
const router = getSemanticRouter(apiKey);
const history = router.getHistory();
console.log(history); // Last 100 routings
```

### Calculate Accuracy
```javascript
const feedback = [
  { query: "...", routedCouncil: "Design", actualApprover: "Design", wasCorrect: true },
  // ... more feedback
];
const accuracy = router.calculateAccuracy(feedback);
console.log(`Accuracy: ${accuracy.accuracy * 100}%`);
```

### Custom Model
```javascript
const router = new SemanticRouter(apiKey, {
  model: 'gemini-2.5-flash' // Faster, cheaper (default: gemini-2.5-pro)
});
```

---

## Key Improvements Over Keyword Routing

| Metric | Keyword | Semantic | Improvement |
|--------|---------|----------|-------------|
| Confidence | 0.60-0.70 | 0.90-0.95 | **+45%** |
| Intent | ❌ None | ✅ 8 categories | **+Intent** |
| Context | ❌ None | ✅ 4 dimensions | **+Context** |
| Mentor | ❌ Generic | ✅ Specific (84) | **+Mentor** |
| Escalation | ❌ None | ✅ Logic | **+Escalation** |
| Learning | ❌ None | ✅ History | **+Learning** |

---

## Next Steps

1. ✅ Test with real queries
2. ✅ Monitor confidence scores
3. ✅ Track routing accuracy
4. ✅ Collect mentor feedback
5. ✅ Adjust thresholds if needed

---

**84-Mentor Approved:** Andrew Ng, Warren Buffett, Syeddy Orchestrator ✅
