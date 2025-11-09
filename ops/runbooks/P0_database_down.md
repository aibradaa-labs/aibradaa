# P0 Runbook: Database Down

**Priority:** P0 (Critical)
**SLA:** Detection <5min, Mitigation <15min, Resolution <1h
**84-Mentor Owners:** Andrew Ng (Mentor 7), Gene Kim (Mentor 24)

---

## Incident Detection

### Symptoms
- ❌ All database queries failing
- ❌ Connection timeout errors
- ❌ `ECONNREFUSED` errors in logs
- ❌ 500 errors on all authenticated endpoints
- ❌ Health check endpoint returning unhealthy

### Monitoring Alerts
- **Error Spike:** >10% error rate with `DatabaseConnectionError`
- **OTEL Trace:** No successful `db.*` spans in last 2 minutes
- **Health Check:** `/api/health` returning 503

### Confirmation Steps
```bash
# 1. Check database connectivity
psql postgresql://${DATABASE_URL} -c "SELECT 1"

# 2. Check Netlify function logs
netlify functions:log --function=chat

# 3. Check error spike dashboard
curl https://ai-bradaa.netlify.app/api/errors/stats
```

---

## Impact Assessment

### Severity Matrix
| Users Affected | Revenue Impact | Severity |
|----------------|----------------|----------|
| All users      | Total outage   | P0       |
| Authenticated  | Partial        | P1       |
| Premium only   | Limited        | P2       |

### Current Impact
- **Users:** ALL authenticated users cannot use AI Bradaa
- **Features:** Chat, recommendations, quota tracking ALL DOWN
- **Revenue:** No new sign-ups, existing users blocked
- **Data:** No data loss (PostgreSQL is durable)

### Business Context
- **Free tier:** Degraded to guest mode (in-memory only)
- **Pro/Ultimate:** Complete service disruption
- **SLA:** 99.5% uptime = max 3.6h downtime/month

---

## Mitigation Steps

### Immediate (0-5 minutes)
**Goal:** Stop the bleeding, restore basic service

1. **Enable Fail-Open Mode**
   ```bash
   # Set environment variable to bypass database
   netlify env:set DATABASE_FAIL_OPEN=true
   ```
   This allows guest mode for all users (no auth, no quotas)

2. **Trigger Auto-Rollback**
   ```bash
   # Rollback to last known good deploy
   netlify sites:rollback --site-id=$NETLIFY_SITE_ID
   ```

3. **Update Status Page**
   ```bash
   # If using status page service
   curl -X POST https://statuspage.io/api/incidents \
     -d "status=investigating" \
     -d "message=Database connectivity issues. Investigating..."
   ```

4. **Notify Stakeholders**
   - Slack: Post in #incidents
   - Email: Alert oncall team
   - Users: Tweet/status page update

### Short-term (5-30 minutes)
**Goal:** Diagnose and restore database connectivity

1. **Check PostgreSQL Service Health**
   ```bash
   # If using Neon/Supabase
   curl https://api.neon.tech/v2/projects/${PROJECT_ID}/health

   # If using Railway
   railway status
   ```

2. **Verify Connection String**
   ```bash
   # Check DATABASE_URL is set
   netlify env:get DATABASE_URL

   # Test connection manually
   psql $DATABASE_URL -c "SELECT version()"
   ```

3. **Check Connection Pool**
   ```javascript
   // If max connections exhausted
   // In database/connection.mjs

   // Reduce pool size temporarily
   const pool = new Pool({
     connectionString: process.env.DATABASE_URL,
     max: 5, // Reduce from 20
     idleTimeoutMillis: 10000,
   });
   ```

4. **Check for Blocking Queries**
   ```sql
   -- Find long-running queries
   SELECT pid, now() - query_start as duration, query
   FROM pg_stat_activity
   WHERE state = 'active'
   ORDER BY duration DESC
   LIMIT 10;

   -- Kill blocking queries (last resort)
   SELECT pg_terminate_backend(pid)
   FROM pg_stat_activity
   WHERE state = 'active' AND now() - query_start > interval '5 minutes';
   ```

5. **Check Disk Space (if self-hosted)**
   ```bash
   df -h /var/lib/postgresql
   ```

---

## Recovery Procedures

### Scenario 1: Database Service Down
**Cause:** PostgreSQL service crashed

**Solution:**
```bash
# If using managed service (Neon/Supabase)
# Contact support immediately

# If self-hosted
sudo systemctl restart postgresql
sudo systemctl status postgresql

# Verify
psql $DATABASE_URL -c "SELECT 1"
```

### Scenario 2: Connection String Invalid
**Cause:** Environment variable misconfigured

**Solution:**
```bash
# Get correct DATABASE_URL from provider dashboard
# Update Netlify environment
netlify env:set DATABASE_URL="postgresql://..."

# Redeploy
git commit --allow-empty -m "fix: update database URL"
git push
```

### Scenario 3: Connection Pool Exhausted
**Cause:** Too many concurrent connections

**Solution:**
```javascript
// Update netlify/functions/database/connection.mjs
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10, // Increase pool size
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
});

// Add connection release logging
pool.on('error', (err) => {
  console.error('[DB Pool] Unexpected error:', err);
});

// Deploy fix
```

### Scenario 4: Network Partition
**Cause:** Network connectivity between Netlify and database

**Solution:**
```bash
# Check Netlify region
netlify sites:show

# Check database region
# Ensure they're in same region (ap-southeast-1)

# If different regions, migrate database
# or enable multi-region replication
```

---

## Validation

### Success Criteria
✅ Database connection restored
✅ Health check passing (`/api/health` returns 200)
✅ Error rate <1%
✅ P95 latency <1.2s
✅ Sample authenticated request succeeds

### Validation Commands
```bash
# 1. Health check
curl https://ai-bradaa.netlify.app/api/health | jq

# 2. Test database query
curl -X POST https://ai-bradaa.netlify.app/api/test-db \
  -H "Authorization: Bearer $TEST_TOKEN"

# 3. Check error rate
curl https://ai-bradaa.netlify.app/api/errors/stats | jq .errorRate

# 4. Monitor logs
netlify functions:log --function=chat --tail
```

---

## Postmortem Template

```markdown
# Postmortem: Database Down ({{date}})

## Timeline
- **{{time}}** - Incident detected (error spike alert)
- **{{time}}** - Mitigation started (rollback triggered)
- **{{time}}** - Database connectivity restored
- **{{time}}** - Service fully recovered

## Root Cause
{{description}}

## Impact
- **Duration:** {{duration}} minutes
- **Users affected:** {{count}}
- **Revenue impact:** RM {{amount}}
- **SLA breach:** {{yes/no}}

## What Went Well
- ✅ Detection was fast (<5min)
- ✅ Auto-rollback worked as designed
- ✅ Communication was clear

## What Went Wrong
- ❌ {{issue 1}}
- ❌ {{issue 2}}

## Action Items
- [ ] {{action 1}} - Owner: {{name}} - Due: {{date}}
- [ ] {{action 2}} - Owner: {{name}} - Due: {{date}}

## 84-Mentor Review
- **Warren Buffett:** Cost impact acceptable/unacceptable
- **Gene Kim:** SLO compliance {{pass/fail}}
- **Andrew Ng:** Technical response grade {{A-F}}
```

---

## Prevention

### Immediate (Week 1)
- [ ] Add connection pool monitoring
- [ ] Implement circuit breaker for database
- [ ] Add fallback to read-replica
- [ ] Improve health check granularity

### Short-term (Month 1)
- [ ] Set up database replication
- [ ] Implement connection retry with exponential backoff
- [ ] Add database failover automation
- [ ] Create database performance baselines

### Long-term (Quarter 1)
- [ ] Multi-region database deployment
- [ ] Chaos engineering tests (random DB failures)
- [ ] Automated database backup verification
- [ ] Cost-optimized connection pooling

---

## Escalation

### If mitigation fails after 30 minutes:
1. **Escalate to Database Provider Support**
   - Neon: support@neon.tech
   - Supabase: support@supabase.com

2. **Notify Executive Board**
   - Warren Buffett (Mentor 1) - Cost impact
   - Andrew Ng (Mentor 7) - Technical lead
   - Gene Kim (Mentor 24) - Infrastructure

3. **Consider Emergency Options**
   - Restore from backup (if available)
   - Migrate to new database instance
   - Enable extended fail-open mode

---

## Related Runbooks
- [P1: High Latency](./P1_high_latency.md)
- [P2: Deployment Failed](./P2_deployment_failed.md)

## Revision History
- 2025-11-09: Initial version (Phase 9.9)
