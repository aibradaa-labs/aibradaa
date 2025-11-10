# P1 Runbook: Gemini API Timeout

**Priority:** P1 (High)
**SLA:** Detection <10min, Mitigation <30min, Resolution <2h
**84-Mentor Owners:** Sam Altman (Mentor 25), Andrew Ng (Mentor 7)

---

## Incident Detection

### Symptoms
- ⏱️ Gemini API calls timing out (>30s)
- ⏱️ Users seeing "Request timeout" errors
- ⏱️ P95 latency >3s (target: <1.2s)
- ⏱️ Retry attempts exhausted
- ⏱️ Circuit breaker in OPEN state

### Monitoring Alerts
- **Error Spike:** >3% error rate with `GeminiAPIError` or `TimeoutError`
- **OTEL Trace:** `api.gemini` spans exceeding 30s
- **SLO Breach:** P95 latency >3000ms for >5 minutes

### Confirmation Steps
```bash
# 1. Check Gemini API status
curl https://generativelanguage.googleapis.com/v1beta/models \
  -H "x-goog-api-key: $GEMINI_API_KEY"

# 2. Test single Gemini request
curl -X POST https://ai-bradaa.netlify.app/api/test-gemini \
  -H "Content-Type: application/json" \
  -d '{"prompt":"test"}'

# 3. Check error tracker stats
curl https://ai-bradaa.netlify.app/api/errors/stats | jq
```

---

## Impact Assessment

### Severity Matrix
| Timeout Rate | User Experience | Severity |
|--------------|-----------------|----------|
| >50%         | Unusable        | P0       |
| 10-50%       | Degraded        | P1       |
| <10%         | Intermittent    | P2       |

### Current Impact
- **Features:** AI recommendations, chat, versus comparisons ALL slow/failing
- **Tiers:** All tiers affected (Free, Pro, Ultimate)
- **Revenue:** Users cannot get value → churn risk
- **Quota:** Users consuming quota with timeout errors (refund needed)

### Business Context
- **Free tier:** Poor first impression → no conversions
- **Pro/Ultimate:** Paying customers frustrated → refund requests
- **Cost:** Wasted Gemini API quota on failed requests

---

## Mitigation Steps

### Immediate (0-10 minutes)
**Goal:** Reduce timeout impact, restore basic functionality

1. **Enable Aggressive Caching**
   ```bash
   # Serve stale cache responses
   netlify env:set CACHE_SERVE_STALE=true
   netlify env:set CACHE_MAX_AGE=3600  # 1 hour

   # Redeploy
   git commit --allow-empty -m "fix: enable aggressive caching"
   git push
   ```

2. **Reduce Timeout Threshold**
   ```javascript
   // In netlify/functions/utils/gemini-client.mjs
   const TIMEOUT_MS = 10000; // Reduce from 30s to 10s
   ```

3. **Enable Faster Model**
   ```bash
   # Switch to gemini-1.5-flash (faster, cheaper)
   netlify env:set GEMINI_MODEL=gemini-1.5-flash
   ```

4. **Update Status**
   - Tweet: "AI Bradaa experiencing slower response times. We're investigating."
   - Status page: "Degraded performance"

### Short-term (10-30 minutes)
**Goal:** Identify root cause and apply targeted fix

1. **Check Google Cloud Status**
   ```bash
   # Visit https://status.cloud.google.com/
   # Check Vertex AI / Generative AI status
   ```

2. **Check API Key Quota**
   ```bash
   # Check if quota exceeded
   curl https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent \
     -H "x-goog-api-key: $GEMINI_API_KEY" \
     -d '{"contents":[{"parts":[{"text":"test"}]}]}' \
     -w "\nHTTP Status: %{http_code}\n"

   # If 429 (rate limit), you've hit quota
   ```

3. **Analyze Request Patterns**
   ```javascript
   // Check if requests are abnormally large
   // In logs, look for:
   console.log('[Gemini] Request size:', JSON.stringify(request).length);

   // If >50KB, request is too large
   ```

4. **Check Network Path**
   ```bash
   # Test latency to Google API
   curl -w "@curl-format.txt" -o /dev/null -s \
     https://generativelanguage.googleapis.com/v1beta/models

   # Expected: <100ms
   # If >500ms, network issue
   ```

5. **Review Recent Changes**
   ```bash
   # Check last 3 deploys
   netlify deploy:list --site-id=$NETLIFY_SITE_ID | head -n 5

   # Rollback if recent change suspicious
   netlify sites:rollback
   ```

---

## Recovery Procedures

### Scenario 1: Google API Outage
**Cause:** Gemini API service degraded

**Solution:**
```javascript
// Implement graceful fallback
// In netlify/functions/utils/gemini-client.mjs

export async function callGemini(prompt, options = {}) {
  try {
    return await callGeminiPrimary(prompt, options);
  } catch (error) {
    if (error.name === 'TimeoutError') {
      // Fallback: Return cached response or simple template
      console.warn('[Gemini] Primary failed, using fallback');
      return getFallbackResponse(prompt);
    }
    throw error;
  }
}

function getFallbackResponse(prompt) {
  return {
    response: "AI Bradaa is experiencing high demand. Please try again in a few minutes.",
    fallback: true,
  };
}
```

### Scenario 2: Rate Limit Exceeded
**Cause:** Too many requests to Gemini API

**Solution:**
```javascript
// Implement request queuing
import PQueue from 'p-queue';

const queue = new PQueue({
  concurrency: 5,        // Max 5 concurrent requests
  interval: 1000,        // Per second
  intervalCap: 10,       // Max 10 requests per second
});

export async function callGemini(prompt, options = {}) {
  return await queue.add(() => callGeminiInternal(prompt, options));
}
```

### Scenario 3: Large Request Payloads
**Cause:** Sending too much data to Gemini

**Solution:**
```javascript
// Truncate long prompts
function truncatePrompt(prompt, maxLength = 10000) {
  if (prompt.length <= maxLength) return prompt;

  return prompt.substring(0, maxLength) + '\n\n[Truncated for length]';
}

// Apply before sending
const truncated = truncatePrompt(userPrompt);
const response = await callGemini(truncated);
```

### Scenario 4: Network Latency
**Cause:** High latency between Netlify and Google API

**Solution:**
```bash
# Deploy to region closer to Google Cloud
# Update netlify.toml
[build.environment]
  AWS_REGION = "us-west-2"  # Closer to Google Cloud us-west1

# Or use Vertex AI (regional endpoints)
netlify env:set GEMINI_USE_VERTEX_AI=true
netlify env:set VERTEX_AI_REGION=asia-southeast1
```

---

## Validation

### Success Criteria
✅ Gemini API response time <5s (P95)
✅ Timeout error rate <1%
✅ Circuit breaker in CLOSED state
✅ User requests completing successfully
✅ Cache hit rate >60%

### Validation Commands
```bash
# 1. Test Gemini call
time curl -X POST https://ai-bradaa.netlify.app/api/chat \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":"recommend laptop for coding"}'

# 2. Check error rate
curl https://ai-bradaa.netlify.app/api/errors/stats | jq '.current.breakdown.byType.TimeoutError'

# 3. Check SLO metrics
curl https://ai-bradaa.netlify.app/api/metrics/slo | jq '.p95'

# 4. Check cache performance
curl https://ai-bradaa.netlify.app/api/metrics/cache | jq '.hitRate'
```

---

## Postmortem Template

```markdown
# Postmortem: Gemini API Timeout ({{date}})

## Timeline
- **{{time}}** - Timeout errors detected (>3% error rate)
- **{{time}}** - Mitigation: Enabled aggressive caching
- **{{time}}** - Root cause identified: {{cause}}
- **{{time}}** - Recovery: {{solution}}
- **{{time}}** - Service restored (error rate <1%)

## Root Cause
{{description of what caused the timeouts}}

## Impact
- **Duration:** {{duration}} minutes
- **Requests affected:** {{count}} (~{{percentage}}%)
- **Users affected:** {{count}}
- **Quota wasted:** RM {{amount}}

## What Went Well
- ✅ {{positive 1}}
- ✅ {{positive 2}}

## What Went Wrong
- ❌ {{issue 1}}
- ❌ {{issue 2}}

## Action Items
- [ ] {{action 1}} - Owner: {{name}} - Due: {{date}}
- [ ] {{action 2}} - Owner: {{name}} - Due: {{date}}

## 84-Mentor Review
- **Sam Altman:** AI strategy impact grade {{A-F}}
- **Andrew Ng:** Technical mitigation grade {{A-F}}
```

---

## Prevention

### Immediate (Week 1)
- [ ] Implement request queuing (rate limiting)
- [ ] Add fallback response mechanism
- [ ] Improve cache hit rate (>70% target)
- [ ] Set up Gemini API status monitoring

### Short-term (Month 1)
- [ ] Implement multi-model fallback (Gemini → Claude)
- [ ] Add request payload size limits
- [ ] Optimize prompts (reduce token count)
- [ ] Set up regional failover

### Long-term (Quarter 1)
- [ ] Evaluate alternative AI providers (redundancy)
- [ ] Implement smart prompt compression
- [ ] Build prompt caching layer
- [ ] Add predictive request throttling

---

## Escalation

### If mitigation fails after 1 hour:
1. **Escalate to Google Cloud Support**
   - Create support ticket: https://cloud.google.com/support
   - Priority: P1
   - Include: Request IDs, timestamps, error logs

2. **Notify Executive Board**
   - Sam Altman (Mentor 25) - AI strategy
   - Andrew Ng (Mentor 7) - Technical lead
   - Warren Buffett (Mentor 1) - Cost impact (refunds)

3. **Consider Emergency Options**
   - Switch to alternative AI provider (Claude, GPT)
   - Enable extended maintenance mode
   - Offer refunds/credits to affected users

---

## Related Runbooks
- [P1: High Latency](./P1_high_latency.md)
- [P2: Deployment Failed](./P2_deployment_failed.md)

## Revision History
- 2025-11-09: Initial version (Phase 9.9)
