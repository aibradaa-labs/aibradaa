# P1 Runbook: High Latency

**Priority:** P1 (High)
**SLA:** Detection <10min, Mitigation <30min, Resolution <2h
**84-Mentor Owners:** Gene Kim (Mentor 24), Jeff Bezos (Mentor 32)

---

## Incident Detection

### Symptoms
- 🐌 Page load times >5s (target: <1.2s)
- 🐌 API responses slow (P95 >3s)
- 🐌 Users reporting "slow" experience
- 🐌 Time to First Byte (TTFB) >2s
- 🐌 Lighthouse performance score <50

### Monitoring Alerts
- **SLO Breach:** P95 latency >1200ms for >5 minutes
- **OTEL Trace:** Request durations >3000ms
- **User Metrics:** Core Web Vitals failing (LCP >2.5s)

### Confirmation Steps
```bash
# 1. Check current P95 latency
curl https://ai-bradaa.netlify.app/api/metrics/slo | jq '.p95'

# 2. Run Lighthouse audit
npx lighthouse https://ai-bradaa.netlify.app --view

# 3. Check backend latency
time curl https://ai-bradaa.netlify.app/api/chat \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -d '{"message":"test"}'

# 4. Check OTEL traces
curl https://ai-bradaa.netlify.app/api/metrics/traces | jq '.[-5:]'
```

---

## Impact Assessment

### Severity Matrix
| P95 Latency | User Impact     | Severity |
|-------------|-----------------|----------|
| >5s         | Unusable        | P0       |
| 2-5s        | Frustrating     | P1       |
| 1.2-2s      | Noticeable      | P2       |
| <1.2s       | Acceptable      | OK       |

### Current Impact
- **Features:** All features slow (chat, recommendations, search)
- **Conversion:** Users abandoning before first interaction
- **SEO:** Google penalizing site in rankings
- **Mobile:** Especially bad on 3G/4G connections

### Business Context
- **Bounce rate:** >3s load time = 53% bounce rate
- **Conversions:** 1s delay = 7% drop in conversions
- **Revenue:** Pro sign-ups decreasing
- **Brand:** "Slow AI" perception

---

## Mitigation Steps

### Immediate (0-10 minutes)
**Goal:** Quick wins to reduce latency

1. **Enable Aggressive CDN Caching**
   ```bash
   # Update netlify.toml
   [[headers]]
     for = "/*"
     [headers.values]
       Cache-Control = "public, max-age=3600, s-maxage=86400"

   git add netlify.toml
   git commit -m "fix: aggressive CDN caching"
   git push
   ```

2. **Reduce Bundle Size**
   ```bash
   # Check current bundle size
   npm run build -- --analyze

   # If >1MB, enable code splitting
   # In webpack/vite config
   ```

3. **Preload Critical Resources**
   ```html
   <!-- Add to index.html -->
   <link rel="preload" href="/assets/main.js" as="script">
   <link rel="preload" href="/assets/main.css" as="style">
   <link rel="preconnect" href="https://generativelanguage.googleapis.com">
   ```

4. **Update Status**
   - Tweet: "Working to improve response times..."
   - Internal: Post in #incidents

### Short-term (10-30 minutes)
**Goal:** Identify bottleneck and optimize

1. **Identify Slow Endpoints**
   ```bash
   # Check OTEL traces grouped by endpoint
   curl https://ai-bradaa.netlify.app/api/metrics/traces/summary | jq '
     group_by(.endpoint) |
     map({
       endpoint: .[0].endpoint,
       avgDuration: (map(.duration) | add / length),
       p95: (map(.duration) | sort | .[(length * 0.95 | floor)])
     }) | sort_by(.p95) | reverse
   '
   ```

2. **Profile Slow Functions**
   ```javascript
   // Add profiling to suspected slow function
   // In netlify/functions/chat.mjs

   console.time('total_duration');
   console.time('gemini_call');
   const geminiResponse = await callGemini(prompt);
   console.timeEnd('gemini_call');

   console.time('database_query');
   const usage = await recordUsage(userId, tokens, cost);
   console.timeEnd('database_query');

   console.timeEnd('total_duration');
   ```

3. **Check Database Query Performance**
   ```sql
   -- Find slow queries
   SELECT
     query,
     mean_exec_time,
     calls
   FROM pg_stat_statements
   ORDER BY mean_exec_time DESC
   LIMIT 10;

   -- Check for missing indexes
   SELECT
     schemaname,
     tablename,
     attname,
     n_distinct,
     correlation
   FROM pg_stats
   WHERE schemaname = 'public'
     AND correlation < 0.5;
   ```

4. **Check Cache Hit Rate**
   ```bash
   curl https://ai-bradaa.netlify.app/api/metrics/cache | jq '{
     hitRate: .hitRate,
     layers: .layers
   }'

   # If <60%, cache is underutilized
   ```

5. **Check Cold Start Impact**
   ```bash
   # Netlify Functions cold start can add 1-3s
   # Check function logs for "cold start" entries

   netlify functions:log --function=chat | grep "cold start"
   ```

---

## Recovery Procedures

### Scenario 1: Slow Database Queries
**Cause:** N+1 queries or missing indexes

**Solution:**
```sql
-- Add missing indexes
CREATE INDEX CONCURRENTLY idx_usage_quotas_user_period
ON usage_quotas(user_id, period_start, period_end);

CREATE INDEX CONCURRENTLY idx_usage_events_user_timestamp
ON usage_events(user_id, timestamp DESC);

-- Optimize slow query
-- Before (N+1):
SELECT * FROM users WHERE id = $1;
SELECT * FROM usage_quotas WHERE user_id = $1;

-- After (JOIN):
SELECT u.*, q.*
FROM users u
LEFT JOIN usage_quotas q ON q.user_id = u.id
WHERE u.id = $1;
```

### Scenario 2: Large Bundle Size
**Cause:** JavaScript bundle >1MB

**Solution:**
```javascript
// Enable code splitting
// In vite.config.js or webpack.config.js

export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['./src/components/ui'],
          gemini: ['./src/lib/gemini'],
        },
      },
    },
  },
};

// Lazy load routes
const Chat = lazy(() => import('./pages/Chat'));
const Recommendations = lazy(() => import('./pages/Recommendations'));
```

### Scenario 3: Inefficient Caching
**Cause:** Cache miss rate >40%

**Solution:**
```javascript
// Improve cache key strategy
// In netlify/functions/utils/cache.mjs

function getCacheKey(request) {
  // Before: Too granular (low hit rate)
  const key = `${request.endpoint}:${JSON.stringify(request.body)}`;

  // After: Normalized (higher hit rate)
  const normalized = normalizeRequest(request);
  const key = `${request.endpoint}:${hash(normalized)}`;

  return key;
}

function normalizeRequest(request) {
  // Normalize to increase cache hits
  return {
    endpoint: request.endpoint,
    query: request.query.toLowerCase().trim(),
    // Ignore user-specific fields for caching
  };
}
```

### Scenario 4: Cold Starts
**Cause:** Netlify Function cold starts adding 1-3s

**Solution:**
```javascript
// Keep functions warm with scheduled pings
// Create .github/workflows/keep-warm.yml

name: Keep Functions Warm
on:
  schedule:
    - cron: '*/5 * * * *'  # Every 5 minutes
jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Ping critical endpoints
        run: |
          curl https://ai-bradaa.netlify.app/api/health
          curl https://ai-bradaa.netlify.app/api/chat -X POST -d '{"message":"warmup"}'
```

### Scenario 5: Unoptimized Images
**Cause:** Large image payloads

**Solution:**
```html
<!-- Use modern formats and responsive images -->
<picture>
  <source srcset="/images/hero.webp" type="image/webp">
  <source srcset="/images/hero.jpg" type="image/jpeg">
  <img src="/images/hero.jpg"
       loading="lazy"
       width="800"
       height="600"
       alt="AI Bradaa">
</picture>

<!-- Or use Netlify Image CDN -->
<img src="/.netlify/images?url=/images/hero.jpg&w=800&fm=webp">
```

---

## Validation

### Success Criteria
✅ P95 latency <1.2s
✅ Lighthouse performance score >90
✅ LCP (Largest Contentful Paint) <2.5s
✅ FID (First Input Delay) <100ms
✅ CLS (Cumulative Layout Shift) <0.1
✅ Cache hit rate >70%

### Validation Commands
```bash
# 1. Run Lighthouse audit
npx lighthouse https://ai-bradaa.netlify.app \
  --only-categories=performance \
  --output=json \
  | jq '.categories.performance.score'

# 2. Check P95 latency
curl https://ai-bradaa.netlify.app/api/metrics/slo | jq '{
  p50: .p50,
  p95: .p95,
  p99: .p99
}'

# 3. Test real user experience
curl -w "@curl-format.txt" -o /dev/null -s \
  https://ai-bradaa.netlify.app

# 4. Check bundle size
npm run build
ls -lh dist/assets/*.js
```

---

## Postmortem Template

```markdown
# Postmortem: High Latency ({{date}})

## Timeline
- **{{time}}** - High latency detected (P95 >3s)
- **{{time}}** - Bottleneck identified: {{component}}
- **{{time}}** - Mitigation deployed: {{fix}}
- **{{time}}** - Latency normalized (P95 <1.2s)

## Root Cause
{{description of bottleneck}}

## Impact
- **Duration:** {{duration}} minutes
- **P95 latency peak:** {{peak}}ms
- **User complaints:** {{count}}
- **Bounce rate increase:** {{percentage}}%

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
- **Gene Kim:** SLO compliance grade {{A-F}}
- **Jeff Bezos:** User experience impact grade {{A-F}}
```

---

## Prevention

### Immediate (Week 1)
- [ ] Set up performance budgets (Lighthouse CI)
- [ ] Add database query monitoring
- [ ] Implement bundle size alerts
- [ ] Enable OTEL latency tracking

### Short-term (Month 1)
- [ ] Add database indexes for hot queries
- [ ] Implement edge caching (Cloudflare/Fastly)
- [ ] Optimize bundle with tree-shaking
- [ ] Add performance regression tests

### Long-term (Quarter 1)
- [ ] Migrate to edge functions (Netlify Edge)
- [ ] Implement predictive prefetching
- [ ] Add CDN for static assets
- [ ] Optimize database with read replicas

---

## Performance Budget

```javascript
// lighthouse-config.json
{
  "budgets": [{
    "path": "/*",
    "timings": [
      { "metric": "first-contentful-paint", "budget": 1500 },
      { "metric": "largest-contentful-paint", "budget": 2500 },
      { "metric": "interactive", "budget": 3000 }
    ],
    "resourceSizes": [
      { "resourceType": "script", "budget": 300 },
      { "resourceType": "stylesheet", "budget": 50 },
      { "resourceType": "image", "budget": 200 },
      { "resourceType": "total", "budget": 600 }
    ]
  }]
}
```

---

## Escalation

### If mitigation fails after 1 hour:
1. **Escalate to Platform Team**
   - Netlify Support: support@netlify.com
   - Priority: P1
   - Include: Trace IDs, timestamps, performance profiles

2. **Notify Executive Board**
   - Gene Kim (Mentor 24) - Infrastructure lead
   - Jeff Bezos (Mentor 32) - User experience impact
   - Julie Zhuo (Mentor 12) - Product impact

3. **Consider Emergency Options**
   - Enable maintenance mode with performance message
   - Rollback to last fast deploy
   - Disable non-critical features (reduce load)

---

## Related Runbooks
- [P0: Database Down](./P0_database_down.md)
- [P1: Gemini API Timeout](./P1_gemini_api_timeout.md)
- [P2: Deployment Failed](./P2_deployment_failed.md)

## Revision History
- 2025-11-09: Initial version (Phase 9.9)
