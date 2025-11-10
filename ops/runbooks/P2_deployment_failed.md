# P2 Runbook: Deployment Failed

**Priority:** P2 (Medium)
**SLA:** Detection <15min, Mitigation <1h, Resolution <4h
**84-Mentor Owners:** Gene Kim (Mentor 24), Linus Torvalds (Mentor 78)

---

## Incident Detection

### Symptoms
- 🔴 Netlify deploy status: FAILED
- 🔴 Build logs showing errors
- 🔴 CI/CD pipeline failing
- 🔴 Git push triggered deploy but site not updated
- 🔴 Users still seeing old version

### Monitoring Alerts
- **GitHub Actions:** Workflow failure notification
- **Netlify:** Deploy failed webhook
- **Email:** Netlify deploy failure notification

### Confirmation Steps
```bash
# 1. Check latest deploy status
netlify deploy:list --site-id=$NETLIFY_SITE_ID | head -n 3

# 2. View build logs
netlify deploy:log --deploy-id=$DEPLOY_ID

# 3. Check current site version
curl https://ai-bradaa.netlify.app/api/health | jq .version

# 4. Check GitHub Actions status
gh run list --limit 3
```

---

## Impact Assessment

### Severity Matrix
| Failure Type        | Production Impact | Severity |
|---------------------|-------------------|----------|
| Hotfix deploy fails | Incident ongoing  | P0       |
| Feature deploy fails| Feature delayed   | P2       |
| Staging deploy fails| No user impact    | P3       |

### Current Impact
- **Production:** Still running (last successful deploy)
- **Features:** New feature NOT deployed (user expectations unmet)
- **Hotfixes:** Cannot deploy critical fixes (if urgent)
- **Team:** Development velocity blocked

### Business Context
- **Good news:** Zero downtime (old version still serving)
- **Bad news:** Cannot ship improvements or fixes
- **Risk:** If P0 incident occurs, cannot deploy fix

---

## Mitigation Steps

### Immediate (0-15 minutes)
**Goal:** Understand failure, determine severity

1. **Check Build Logs**
   ```bash
   # View full build output
   netlify deploy:log --deploy-id=$DEPLOY_ID

   # Common error patterns:
   # - "npm install failed" → dependency issue
   # - "build command failed" → code issue
   # - "function bundling failed" → function code issue
   # - "out of memory" → build resource issue
   ```

2. **Determine Criticality**
   ```bash
   # Is this blocking a hotfix?
   git log -1 --pretty=format:"%s"

   # If contains "hotfix" or "P0", escalate to P0
   # Otherwise, proceed as P2
   ```

3. **Check Recent Changes**
   ```bash
   # What changed in this deploy?
   git diff HEAD~1 HEAD --stat

   # Who made the change?
   git log -1 --pretty=format:"%an <%ae>"
   ```

4. **Notify Team**
   ```bash
   # Post in #deployments
   "🔴 Deploy FAILED: $DEPLOY_ID
   Commit: $(git log -1 --oneline)
   Error: $(netlify deploy:log --deploy-id=$DEPLOY_ID | tail -n 5)
   Investigating..."
   ```

### Short-term (15-60 minutes)
**Goal:** Fix or revert

1. **Attempt Quick Fix**
   ```bash
   # If error is obvious (typo, missing dep, etc.)
   # Fix it and redeploy

   # Example: Missing dependency
   npm install missing-package
   git add package.json package-lock.json
   git commit -m "fix: add missing dependency"
   git push

   # Monitor new deploy
   netlify deploy:list --site-id=$NETLIFY_SITE_ID --watch
   ```

2. **Revert if Fix Unclear**
   ```bash
   # If fix not obvious, revert to last good commit
   git revert HEAD
   git push

   # Or reset to last good commit (if safe)
   git reset --hard HEAD~1
   git push --force  # ⚠️ Only if no one else has pulled
   ```

3. **Investigate Root Cause**
   - Build environment issue?
   - Dependency conflict?
   - Code error caught by linter?
   - Resource limit exceeded?

---

## Recovery Procedures

### Scenario 1: Dependency Installation Failed
**Cause:** `npm install` or `npm ci` failed

**Error Pattern:**
```
npm ERR! code ERESOLVE
npm ERR! ERESOLVE unable to resolve dependency tree
```

**Solution:**
```bash
# 1. Check package.json for conflicts
npm install --legacy-peer-deps

# 2. Update lockfile
rm package-lock.json
npm install

# 3. Commit and redeploy
git add package-lock.json
git commit -m "fix: resolve dependency conflicts"
git push
```

### Scenario 2: Build Script Failed
**Cause:** `npm run build` exited with error

**Error Pattern:**
```
vite build failed
ERROR: Cannot find module 'xyz'
```

**Solution:**
```bash
# 1. Reproduce locally
npm run build

# 2. Fix the error (example: missing import)
# In src/components/Chat.jsx
- import { Button } from './Button';
+ import { Button } from './ui/Button';

# 3. Test locally
npm run build

# 4. Commit and redeploy
git add .
git commit -m "fix: correct import path"
git push
```

### Scenario 3: Netlify Function Bundling Failed
**Cause:** Function code has errors or missing deps

**Error Pattern:**
```
Failed to bundle Netlify Function: chat.mjs
SyntaxError: Unexpected token
```

**Solution:**
```bash
# 1. Test function locally
netlify functions:serve

# 2. Fix syntax error
# In netlify/functions/chat.mjs
- const response = await fetch(url
+ const response = await fetch(url)

# 3. Commit and redeploy
git add netlify/functions/chat.mjs
git commit -m "fix: syntax error in chat function"
git push
```

### Scenario 4: Out of Memory
**Cause:** Build process exceeding Netlify's memory limit

**Error Pattern:**
```
FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory
```

**Solution:**
```javascript
// Increase Node memory limit
// In netlify.toml

[build]
  command = "NODE_OPTIONS='--max-old-space-size=4096' npm run build"

// Or reduce bundle size
// In vite.config.js
export default {
  build: {
    minify: 'esbuild',  // Faster than terser
    chunkSizeWarningLimit: 500,
  },
};
```

```bash
git add netlify.toml
git commit -m "fix: increase build memory limit"
git push
```

### Scenario 5: Environment Variable Missing
**Cause:** Required env var not set in Netlify

**Error Pattern:**
```
Error: Missing required environment variable: GEMINI_API_KEY
```

**Solution:**
```bash
# 1. Set missing env var
netlify env:set GEMINI_API_KEY "your-api-key"

# 2. Trigger redeploy (env vars don't auto-redeploy)
netlify deploy:create --trigger
```

### Scenario 6: GitHub Actions Failure
**Cause:** CI checks failing before deploy

**Error Pattern:**
```
❌ Composite Score Quality Gate
Error: Score 78.4 is below threshold 99
```

**Solution:**
```bash
# 1. Check which workflow failed
gh run view

# 2. If quality gate, either:
#    a) Fix the quality issue
#    b) Update ULTIMATE_CONSOLIDATED_AUDIT_REPORT.md with new score

# 3. Or skip CI for emergency hotfix
git commit -m "fix: emergency hotfix [skip ci]"
git push
```

---

## Validation

### Success Criteria
✅ Deploy status: SUCCESS
✅ Build logs show no errors
✅ Site updated with new version
✅ Health check returns expected version
✅ No errors in function logs

### Validation Commands
```bash
# 1. Check deploy status
netlify deploy:list --site-id=$NETLIFY_SITE_ID | head -n 1

# 2. Verify version deployed
curl https://ai-bradaa.netlify.app/api/health | jq '{
  version: .version,
  commit: .commit,
  timestamp: .timestamp
}'

# 3. Test critical endpoints
curl -X POST https://ai-bradaa.netlify.app/api/chat \
  -H "Authorization: Bearer $TEST_TOKEN" \
  -d '{"message":"test"}' | jq .

# 4. Check function logs (should be clean)
netlify functions:log --function=chat --since=5m

# 5. Run smoke tests
npm run test:smoke
```

---

## Postmortem Template

```markdown
# Postmortem: Deployment Failed ({{date}})

## Timeline
- **{{time}}** - Deploy triggered (commit {{sha}})
- **{{time}}** - Deploy failed (error detected)
- **{{time}}** - Root cause identified: {{cause}}
- **{{time}}** - Fix deployed: {{solution}}
- **{{time}}** - Deploy successful

## Root Cause
{{description of why deploy failed}}

## Impact
- **Duration:** {{duration}} minutes (time to fix)
- **Production impact:** None (old version still serving)
- **Feature delay:** {{feature}} delayed by {{duration}}
- **Team impact:** {{count}} developers blocked

## What Went Well
- ✅ Production remained stable (old version)
- ✅ {{positive 1}}
- ✅ {{positive 2}}

## What Went Wrong
- ❌ {{issue 1}}
- ❌ {{issue 2}}

## Action Items
- [ ] {{action 1}} - Owner: {{name}} - Due: {{date}}
- [ ] {{action 2}} - Owner: {{name}} - Due: {{date}}

## 84-Mentor Review
- **Gene Kim:** CI/CD process grade {{A-F}}
- **Linus Torvalds:** Code quality grade {{A-F}}
```

---

## Prevention

### Immediate (Week 1)
- [ ] Add pre-commit hooks (lint, type-check)
- [ ] Require local build before push
- [ ] Add deploy preview checks
- [ ] Set up Netlify deploy notifications

### Short-term (Month 1)
- [ ] Add comprehensive CI checks (unit tests, e2e)
- [ ] Implement deployment canary (gradual rollout)
- [ ] Add automated rollback on deploy failure
- [ ] Create deploy checklist

### Long-term (Quarter 1)
- [ ] Implement blue-green deployments
- [ ] Add deploy approval workflow
- [ ] Set up deploy performance budgets
- [ ] Automate dependency updates (Renovate)

---

## Pre-Deploy Checklist

```bash
#!/bin/bash
# pre-deploy.sh - Run before git push

set -e

echo "🔍 Running pre-deploy checks..."

# 1. Lint
echo "1/6 Linting..."
npm run lint

# 2. Type check
echo "2/6 Type checking..."
npm run type-check

# 3. Unit tests
echo "3/6 Running tests..."
npm run test

# 4. Build
echo "4/6 Building..."
npm run build

# 5. Check bundle size
echo "5/6 Checking bundle size..."
BUNDLE_SIZE=$(du -sh dist | cut -f1)
echo "Bundle size: $BUNDLE_SIZE"

# 6. Validate env vars
echo "6/6 Validating env vars..."
required_vars=("GEMINI_API_KEY" "DATABASE_URL")
for var in "${required_vars[@]}"; do
  netlify env:get "$var" > /dev/null || {
    echo "❌ Missing required env var: $var"
    exit 1
  }
done

echo "✅ All pre-deploy checks passed!"
```

---

## Escalation

### If cannot fix within 1 hour:
1. **Revert to Last Known Good**
   ```bash
   # Revert commit
   git revert HEAD
   git push

   # Or redeploy previous successful deploy
   netlify deploy:restore --deploy-id=$LAST_GOOD_DEPLOY_ID
   ```

2. **Notify Team**
   - Post in #engineering: Deploy blocked, investigating
   - Update stakeholders if feature deadline impacted

3. **Consider Alternative**
   - Can feature be disabled via feature flag?
   - Can deploy be split into smaller chunks?
   - Is manual fix possible (env var, config)?

---

## Related Runbooks
- [P0: Database Down](./P0_database_down.md)
- [P1: High Latency](./P1_high_latency.md)

## Useful Links
- [Netlify Build Docs](https://docs.netlify.com/configure-builds/)
- [Netlify Deploy Logs](https://app.netlify.com/sites/ai-bradaa/deploys)
- [GitHub Actions Logs](https://github.com/aibradaa/actions)

## Revision History
- 2025-11-09: Initial version (Phase 9.9)
