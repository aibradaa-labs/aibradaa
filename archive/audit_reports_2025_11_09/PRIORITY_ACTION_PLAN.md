# AI Bradaa - Priority Action Plan
**Date:** November 7, 2025
**Based On:** DOC 1, DOC 2, Transformation Plan, Gap Analysis

---

## Executive Summary

**Current Status:** 67% Complete (98/147 files)
**Estimated Remaining:** 49 files + enhancements
**Critical Path Items:** 8 (blocks production deployment)
**Recommended Approach:** 3-Phase Acceleration

---

## Phase-Based Prioritization

### 🔴 PHASE 1: CRITICAL PATH (Week 1-2)
**Goal:** Make production deployment possible
**Target:** 8 critical files + 5 fixes

#### Week 1: Deployment Prerequisites

**Day 1-2: Configuration & Security**

1. **Create netlify.toml** (PRIORITY 1)
```toml
[build]
  command = "npm run build"
  publish = "dist"
  functions = "netlify/functions"

[build.environment]
  NODE_VERSION = "18"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "geolocation=(), microphone=(), camera=()"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

2. **Create configs/csp_meta.txt** (PRIORITY 1)
```
Content-Security-Policy: default-src 'self'; script-src 'self' https://cdn.tailwindcss.com https://unpkg.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://generativelanguage.googleapis.com; frame-ancestors 'none';
```

3. **Create .env.example** (PRIORITY 2)
```env
# API Keys
GEMINI_API_KEY=AIzaSy...your-key-here
GEMINI_MODEL=gemini-2.0-flash-exp

# Google OAuth
GOOGLE_CLIENT_ID=123456789-...apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-...

# JWT
JWT_SECRET=your-random-32-char-secret-here

# Email (Magic Links)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Database (Optional)
DATABASE_URL=postgresql://...

# Environment
NODE_ENV=production
PORT=3000
```

**Day 3-4: PWA Icons & Assets**

4. **Generate PWA Icons** (PRIORITY 1)
```bash
# Using generate-icons.js script
npm run generate-icons

# Manual alternative:
# 1. Create base logo (1024x1024)
# 2. Use https://favicon.io/ or ImageMagick:
convert logo.png -resize 192x192 public/icons/icon-192.png
convert logo.png -resize 512x512 public/icons/icon-512.png
```

Files needed:
- `public/icons/icon-192.png`
- `public/icons/icon-512.png`
- `public/icons/favicon.svg`

5. **Create Lottie Animation** (PRIORITY 2)
- Either:
  - Option A: Use LottieFiles.com to create ferrofluid animation
  - Option B: Simple placeholder JSON for now:
```json
{
  "v": "5.5.7",
  "fr": 30,
  "ip": 0,
  "op": 60,
  "w": 200,
  "h": 200,
  "nm": "Soul Neutral",
  "ddd": 0,
  "assets": [],
  "layers": [
    {
      "ty": 4,
      "nm": "Circle",
      "sr": 1,
      "ks": {
        "o": { "a": 0, "k": 100 },
        "r": { "a": 1, "k": [
          { "t": 0, "s": [0], "e": [360] },
          { "t": 60, "s": [360] }
        ]},
        "p": { "a": 0, "k": [100, 100, 0] },
        "a": { "a": 0, "k": [0, 0, 0] },
        "s": { "a": 0, "k": [100, 100, 100] }
      },
      "shapes": [
        {
          "ty": "el",
          "p": { "a": 0, "k": [0, 0] },
          "s": { "a": 0, "k": [80, 80] }
        }
      ]
    }
  ]
}
```
Save as: `ai_pod/prototypes/soul_v1/soul-neutral.json`

**Day 5-7: OAuth & Auth Completion**

6. **Complete OAuth Integration** (PRIORITY 1)

Files to enhance:
- `netlify/functions/auth.mjs` - Add Google OAuth callback
- `api/routes/auth.mjs` - Complete OAuth flow

Key additions:
```javascript
// In auth.mjs
import { OAuth2Client } from 'google-auth-library';

const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'https://www.aibradaa.com/auth/google/callback'
);

// Google OAuth routes
router.get('/google', (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['profile', 'email']
  });
  res.redirect(url);
});

router.get('/google/callback', async (req, res) => {
  const { code } = req.query;
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  const ticket = await oauth2Client.verifyIdToken({
    idToken: tokens.id_token,
    audience: process.env.GOOGLE_CLIENT_ID
  });

  const payload = ticket.getPayload();
  // Create/login user with payload.email
  // Generate JWT
  // Redirect to app
});
```

7. **Test Authentication Flow**
- [ ] Email/password signup works
- [ ] Google OAuth signup works
- [ ] Magic link email works
- [ ] JWT token valid
- [ ] Protected routes work

**Day 8-9: Critical Tests**

8. **Create Smoke Tests** (PRIORITY 2)

File: `tests/smoke/csp.test.mjs`
```javascript
import { test, expect } from '@jest/globals';
import { JSDOM } from 'jsdom';
import { readFileSync } from 'fs';

test('CSP meta tag exists in all HTML files', () => {
  const files = [
    'public/index.html',
    'public/app.html',
    'public/signup.html'
  ];

  files.forEach(file => {
    const html = readFileSync(file, 'utf-8');
    const dom = new JSDOM(html);
    const cspMeta = dom.window.document.querySelector('meta[http-equiv="Content-Security-Policy"]');

    expect(cspMeta).toBeTruthy();
    expect(cspMeta.content).toContain('default-src');
  });
});
```

File: `tests/smoke/render.test.mjs`
```javascript
import { test, expect } from '@playwright/test';

test('All 7 sections render without errors', async ({ page }) => {
  const sections = [
    '/matchmaker',
    '/versus',
    '/explorer',
    '/command',
    '/intel',
    '/appendices',
    '/camera-tech'
  ];

  for (const section of sections) {
    await page.goto(`http://localhost:3000${section}`);
    await expect(page.locator('h1')).toBeVisible();

    // No console errors
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.waitForLoadState('networkidle');
    expect(errors).toHaveLength(0);
  }
});
```

**Day 10-11: Data Validation**

9. **Refresh Laptop Data (06/11/2025)**

Action:
```bash
# Run ETL pipeline
npm run etl:refresh

# Validate schema
npm run test:data

# Check for updates needed
node tools/generate-laptop-db.mjs --validate-date 2025-11-06
```

If data is stale:
- Run scraper (or manual update)
- Validate against schema
- Regenerate search index

**Day 12-14: Deployment Testing**

10. **Deploy to Netlify Staging**

Steps:
```bash
# 1. Ensure all env vars set in Netlify UI
# 2. Connect GitHub repo to Netlify
# 3. Configure build settings
# 4. Deploy

# Test deployment:
npm run test:smoke -- --url=https://staging.aibradaa.com
```

11. **Fix any deployment issues**
12. **Verify PWA installation works**
13. **Test all auth methods in production**

---

### 🟡 PHASE 2: QUALITY GATES (Week 3-4)
**Goal:** Meet Phase 2 transformation requirements
**Target:** 20 files + enhancements

#### Week 3: AI POD & RAG

**Day 15-16: RAG Pipeline**

1. **Create ai_pod/pipelines/rag.yaml**
```yaml
retrieval:
  sources:
    - type: curated_docs
      path: /data/segments.json
      weight: 1.0
    - type: laptop_database
      path: /data/laptops.json
      weight: 0.8
    - type: brand_info
      path: /data/brands.json
      weight: 0.6

embedding:
  model: text-embedding-004
  batch_size: 100
  cache_ttl: 3600

retrieval_config:
  top_k: 5
  similarity_threshold: 0.7
  rerank: true
```

2. **Create ai_pod/pipelines/grounding.yaml**
```yaml
grounding:
  google_search:
    enabled: true
    quota_per_day: 100
    fallback: cached_results

  maps:
    enabled: false

  images:
    enabled: false
```

3. **Create ai_pod/pipelines/toon_schema.yaml**
```yaml
toon_format:
  version: 1.0.0
  rules:
    - remove_nulls: true
    - compact_arrays: true
    - abbreviate_keys:
        specifications: specs
        price_malaysian_ringgit: price_MYR
        display_resolution: res
```

4. **Implement RAG in Command**

Enhance `app/command/command.mjs`:
```javascript
import { retrieveContext } from '../../shared/utils/rag.mjs';

async function handleQuery(query) {
  // 1. Retrieve context
  const context = await retrieveContext(query);

  // 2. Build prompt with context
  const prompt = buildPromptWithContext(query, context);

  // 3. Call Gemini
  const response = await callGemini(prompt);

  // 4. Return with citations
  return {
    answer: response.text,
    sources: context.sources
  };
}
```

**Day 17-18: Governance Integration**

5. **Enrich Mentor Profiles**

File: `ai_pod/governance/mentors_enriched.json`
```json
{
  "mentors": [
    {
      "id": "warren-buffett",
      "name": "Warren Buffett",
      "department": "Strategy & Finance",
      "lens": "Owner Earnings",
      "weight": 1.2,
      "evaluation_criteria": {
        "moat": { "weight": 0.3, "description": "Competitive advantage" },
        "owner_earnings": { "weight": 0.3, "description": "True cash flow" },
        "margin_of_safety": { "weight": 0.2, "description": "Risk buffer" },
        "business_quality": { "weight": 0.2, "description": "Long-term viability" }
      }
    }
    // ... all 84 mentors
  ]
}
```

6. **Create Dissent Ledger (JSONL)**

File: `ai_pod/governance/dissent_ledger.jsonl`
```jsonl
{"timestamp":"2025-11-07T12:00:00Z","decision":"laptop-database-integration","mentor":"Andrew Ng","vote":"approve","score":9,"reasoning":"Solid data pipeline, good test coverage"}
{"timestamp":"2025-11-07T12:01:00Z","decision":"laptop-database-integration","mentor":"Bruce Schneier","vote":"approve","score":9,"reasoning":"Security posture acceptable, CSP needed"}
```

7. **Create Memory Architecture**

File: `ai_pod/governance/memory_architecture.yaml`
```yaml
memory_layers:
  - name: Episodic
    ttl: 24h
    storage: IndexedDB

  - name: Semantic
    ttl: 7d
    storage: IndexedDB

  - name: Procedural
    ttl: 30d
    storage: IndexedDB

  - name: Emotional
    ttl: 90d
    storage: Server

  - name: Meta
    ttl: 1y
    storage: Server

  - name: Constitutional
    ttl: permanent
    storage: Server
```

**Day 19-20: Chat UI Enhancement**

8. **Create app/command/chat-ui.mjs**
```javascript
export class ChatUI {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.messages = [];
  }

  async sendMessage(text) {
    // Add user message
    this.addMessage('user', text);

    // Show thinking state
    const thinkingId = this.addThinking();

    // Call API
    const response = await fetch('/api/command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: text })
    });

    // Stream response
    const reader = response.body.getReader();
    let aiMessage = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = new TextDecoder().decode(value);
      aiMessage += chunk;
      this.updateMessage(thinkingId, aiMessage);
    }

    // Add citations
    this.addCitations(response.sources);
  }

  addMessage(role, text) {
    const msg = { role, text, timestamp: Date.now() };
    this.messages.push(msg);
    this.render();
    return msg.timestamp;
  }

  addThinking() {
    return this.addMessage('assistant', '🤔 Thinking...');
  }

  updateMessage(id, text) {
    const msg = this.messages.find(m => m.timestamp === id);
    if (msg) {
      msg.text = text;
      this.render();
    }
  }

  render() {
    this.container.innerHTML = this.messages.map(m => `
      <div class="message ${m.role}">
        <div class="message-content">${m.text}</div>
      </div>
    `).join('');
  }
}
```

**Day 21: Testing**

9. **Write Integration Tests**
```bash
# Test RAG retrieval
npm run test:integration -- rag

# Test chat UI
npm run test:e2e -- chat

# Test governance scoring
npm run test:unit -- governance
```

#### Week 4: Testing & Security

**Day 22-23: Complete Test Suite**

10. **UX Tests**

File: `tests/ux/a11y.test.mjs`
```javascript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('Accessibility compliance (WCAG 2.2 AA)', async ({ page }) => {
  await page.goto('http://localhost:3000');

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();

  expect(results.violations).toHaveLength(0);
});
```

File: `tests/ux/keyboard-nav.test.mjs`
```javascript
import { test, expect } from '@playwright/test';

test('Keyboard navigation works', async ({ page }) => {
  await page.goto('http://localhost:3000');

  // Tab through interactive elements
  await page.keyboard.press('Tab');
  await expect(page.locator(':focus')).toHaveAttribute('href');

  // Enter should activate
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/#/);
});
```

11. **Data Tests**

File: `tests/data/inclusion.test.mjs`
```javascript
import { test, expect } from '@jest/globals';
import laptops from '../data/laptops.json';

test('Inclusion policy enforced (≤12 months, ≥4 years relevance)', () => {
  const now = new Date('2025-11-06');

  laptops.laptops.forEach(laptop => {
    const releaseDate = new Date(laptop.releaseDate);
    const monthsOld = (now - releaseDate) / (1000 * 60 * 60 * 24 * 30);

    expect(monthsOld).toBeLessThanOrEqual(12);
  });
});
```

**Day 24-25: Security Hardening**

12. **Run Security Scan**
```bash
# NPM audit
npm audit --audit-level=high

# OWASP ZAP (if installed)
zap-cli quick-scan http://localhost:3000

# Lighthouse security
lighthouse http://localhost:3000 --only-categories=best-practices

# Manual checks
- [ ] CSP violations = 0
- [ ] HTTPS enforced
- [ ] SRI on external scripts
- [ ] No credentials in code
- [ ] Auth tokens expire
```

13. **Document Security Baseline**

File: `docs/SECURITY_BASELINE.md`
```markdown
# Security Baseline

## Last Scan: 2025-11-07

### Vulnerabilities
- Critical: 0
- High: 0
- Medium: 2 (acceptable)
- Low: 5 (acceptable)

### CSP Policy
- No violations detected
- All external resources whitelisted

### Authentication
- JWT expiry: 24h
- Password min length: 8
- 2FA available: Yes
- OAuth providers: Google

### Data Protection
- HTTPS enforced: Yes
- PDPA compliant: Yes
- Data retention: 90 days
```

**Day 26-27: Performance Optimization**

14. **Minify Assets**
```bash
# Build script already exists
npm run build

# Verify output
ls -lh dist/
```

15. **Image Optimization**
```bash
# Convert to WebP (if images exist)
for img in public/images/*.png; do
  cwebp -q 80 "$img" -o "${img%.png}.webp"
done
```

16. **Test Performance**
```bash
# Lighthouse
lighthouse https://staging.aibradaa.com --view

# Target scores:
# Performance: ≥95
# Accessibility: ≥95
# Best Practices: ≥95
# SEO: ≥95
```

**Day 28: Final Deployment**

17. **Production Deployment**
```bash
# 1. Merge to main
git checkout main
git merge development
git push

# 2. Netlify auto-deploys

# 3. Verify
npm run test:smoke -- --url=https://www.aibradaa.com

# 4. Monitor
# Check Netlify logs
# Watch error rates
# Monitor performance
```

---

### 🟢 PHASE 3: ENHANCEMENTS (Week 5-6)
**Goal:** Complete transformation plan requirements
**Target:** Remaining 21 files

#### Week 5: Observability & Tools

**Day 29-30: ETL Automation**

1. **Create tools/etl/normalize.mjs**
2. **Create tools/etl/enrich.mjs**
3. **Create tools/etl/dedupe.mjs**
4. **Create tools/fetchers/shopee.mjs**
5. **Create tools/fetchers/lazada.mjs**
6. **Create tools/fetchers/oem.mjs**

**Day 31-32: Observer Hooks**

7. **Create tools/observer-hooks/syeddy-debugger.mjs**
```javascript
// Owner-only dashboard with 300+ signals
export class SyeddyDebugger {
  constructor() {
    this.signals = new Map();
  }

  capture(category, metric, value) {
    const key = `${category}.${metric}`;
    this.signals.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  getDashboard() {
    return {
      api: this.getAPIMetrics(),
      gemini: this.getGeminiMetrics(),
      governance: this.getGovernanceMetrics(),
      user: this.getUserMetrics()
    };
  }
}
```

8. **Create tools/observer-hooks/abo-84-probe.mjs**
```javascript
// Pro user diagnostics (sanitized)
export class ABO84Probe {
  getPublicMetrics() {
    return {
      latency: this.getLatencyStats(),
      cacheHit: this.getCacheHitRate(),
      evalScore: this.getEvalScore()
    };
  }
}
```

**Day 33-34: Governance Training Files**

9. **Create ai_pod/governance/eval_principles.md**
10. **Create ai_pod/governance/post_training_pipeline.yaml**
11. **Create ai_pod/governance/training_stages.yaml**
12. **Create ai_pod/governance/loss_spike_prevention.yaml**

#### Week 6: Documentation & ADRs

**Day 35-36: Missing Docs**

13. **Create docs/persona_playbook.md**
```markdown
# Syeddy Persona Playbook

## Core Characteristics
- Malaysian identity (Manglish, local references)
- One Piece inspiration (nakama spirit, adventure, determination)
- Tech-savvy but approachable
- Transparency about limitations

## Tone Sliders
- Formality: 3/10 (casual)
- Humor: 7/10 (playful)
- Technical depth: 8/10 (expert)
- Empathy: 9/10 (highly supportive)

## Catchphrases (Paraphrased, No Direct Quotes)
- "Let's find your perfect laptop, nakama!"
- "Time to set sail for laptop deals!"
- "Your laptop journey starts here!"
```

14. **Create docs/adrs/ADR-0002-auth-strategy.md**
15. **Create docs/adrs/ADR-0003-toon-format.md**

**Day 37-38: Eval Suite**

16. **Create tests/evals/golden_set_v5.jsonl**
```jsonl
{"id":1,"query":"Best gaming laptop under MYR 5000","expected_segments":["gaming"],"expected_price_max":5000}
{"id":2,"query":"Lightweight laptop for travel","expected_segments":["ultrabook"],"expected_weight_max":2.0}
```

17. **Create tests/evals/runner.mjs**
18. **Create baseline files**

**Day 39-40: API Adapters**

19. **Create api/adapters/retry.mjs**
```javascript
export async function retryWithBackoff(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === maxRetries - 1) throw err;
      await sleep(Math.pow(2, i) * 1000);
    }
  }
}
```

20. **Create api/adapters/quota.mjs**
```javascript
export class QuotaGovernor {
  constructor(tier) {
    this.limits = {
      free: { daily: 10, monthly: 100 },
      pro: { daily: 100, monthly: 2000 },
      ultimate: { daily: 1000, monthly: 20000 }
    };
    this.tier = tier;
  }

  async checkQuota(userId) {
    const usage = await this.getUsage(userId);
    const limit = this.limits[this.tier];

    if (usage.daily >= limit.daily) {
      throw new Error('Daily quota exceeded');
    }

    return true;
  }
}
```

**Day 41-42: Final Polish**

21. **Create OTEL config**
22. **Test all features end-to-end**
23. **Run final eval suite**
24. **Update documentation**
25. **Celebrate launch! 🎉**

---

## Quick Reference Checklist

### Critical Path (Week 1-2)
- [ ] netlify.toml
- [ ] configs/csp_meta.txt
- [ ] .env.example
- [ ] PWA icons (3 files)
- [ ] Lottie animation JSON
- [ ] Complete OAuth
- [ ] Smoke tests (CSP, render)
- [ ] Data validation
- [ ] Deploy to staging

### Quality Gates (Week 3-4)
- [ ] RAG pipeline (3 YAML files)
- [ ] Governance enrichment
- [ ] Chat UI module
- [ ] UX tests (a11y, keyboard)
- [ ] Data tests (inclusion, offers)
- [ ] Security scan
- [ ] Performance optimization
- [ ] Production deployment

### Enhancements (Week 5-6)
- [ ] ETL modules (6 files)
- [ ] Observer hooks (2 files)
- [ ] Governance training (4 files)
- [ ] Missing docs (3 files)
- [ ] Eval suite (4 files)
- [ ] API adapters (2 files)
- [ ] OTEL config

---

## Success Criteria

### Phase 1 Complete
- ✅ PWA installable on mobile
- ✅ All 3 auth methods work
- ✅ CSP violations = 0
- ✅ Smoke tests passing
- ✅ Deployed to production

### Phase 2 Complete
- ✅ RAG retrieval ≥90% accuracy
- ✅ Test coverage ≥60%
- ✅ Lighthouse ≥95 all categories
- ✅ Security scan clean
- ✅ All 7 sections functional

### Phase 3 Complete
- ✅ Test coverage ≥80%
- ✅ 84-mentor composite ≥99
- ✅ ETL automation working
- ✅ Observer dashboards live
- ✅ Full documentation

---

## Risk Mitigation

### If Behind Schedule
1. **Week 1:** Focus only on Critical Path items 1-5
2. **Week 2:** Deploy with basic OAuth (skip magic links)
3. **Week 3:** Skip observer hooks, focus on tests
4. **Week 4:** Deploy with Phase 2 partial

### If Blocked
- **OAuth issues:** Deploy with email/password only
- **Lottie animation:** Use CSS fallback
- **RAG pipeline:** Use basic keyword search
- **Icons:** Use generic placeholders temporarily

---

## Next Immediate Actions

1. **Create netlify.toml** (30 min)
2. **Create CSP config** (15 min)
3. **Create .env.example** (15 min)
4. **Generate icons** (2 hours)
5. **Test OAuth flow** (2 hours)

**Total Estimate for Critical Path:** 2 weeks
**Total Estimate for Full Plan:** 6 weeks
**Recommended:** Start with Critical Path, iterate to Quality Gates

---

**Status:** Ready to execute
**Owner Approval:** Required before proceeding
