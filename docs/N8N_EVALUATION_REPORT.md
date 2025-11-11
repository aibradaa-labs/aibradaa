# n8n Workflow Automation Evaluation Report
## Should AI Bradaa Adopt n8n?

**Evaluation Date:** 2025-11-11 15:00 MYT (Asia/Kuala_Lumpur)
**Evaluator:** AI Bradaa Technical Architecture Team
**Status:** Decision Pending
**Version:** 1.0

---

## 📋 Executive Summary

**n8n** is a self-hostable workflow automation platform (open-source alternative to Zapier). This report evaluates whether AI Bradaa should adopt n8n for workflow automation given:
- Current architecture (Netlify Functions + Neon PostgreSQL)
- Existing automation needs (price updates, catchphrase fetching, email sequences)
- Budget constraints (bootstrapped startup, free-tier Netlify)

**TL;DR Recommendation:**
**🟡 NOT NEEDED YET, but monitor for Phase 13+**

Current Netlify scheduled functions handle all automation needs effectively. n8n adds unnecessary complexity and cost at current scale. Revisit when:
1. Workflows exceed 5+ sequential steps
2. Non-technical staff need to modify workflows
3. Integration count exceeds 10+ services

---

## 🔍 What is n8n?

### **Core Features**
- **Visual workflow builder** (drag-and-drop nodes)
- **300+ integrations** (APIs, databases, cloud services)
- **Self-hostable** (Docker, Kubernetes) or cloud-hosted (n8n.cloud)
- **Code-friendly** (JavaScript expressions, custom functions)
- **Trigger types:**
  - Webhook triggers (API calls)
  - Schedule triggers (cron jobs)
  - Event triggers (email received, file uploaded)

### **Pricing**
| Tier | Price | Workflows | Executions/Month |
|------|-------|-----------|------------------|
| **Free (Self-Hosted)** | €0 | Unlimited | Unlimited |
| **Cloud Starter** | €20/month | 20 | 2,500 |
| **Cloud Pro** | €50/month | Unlimited | 10,000 |
| **Enterprise** | Custom | Unlimited | Unlimited |

**Note:** Self-hosted version is free but requires server costs (€10-30/month for VPS).

---

## 🎯 Current AI Bradaa Automation Landscape

### **Existing Automations (Netlify Functions)**

#### **1. Scheduled Catchphrase Fetch** ✅ IMPLEMENTED
```javascript
// netlify/functions/cron-catchphrase-fetch.mjs
// Trigger: Daily at 3:00 AM MYT (netlify.toml schedule)
// Function: Fetch new One Piece catchphrases from source API
// Steps:
//   1. Call One Piece quotes API
//   2. Filter for main characters (Luffy, Zoro, Nami, etc.)
//   3. Store in Neon PostgreSQL (catchphrases table)
//   4. Log execution to analytics
```

**Complexity:** Low (1 API call, 1 DB write)
**n8n Equivalent:** 3 nodes (Schedule → HTTP Request → PostgreSQL)
**Verdict:** Netlify Function is simpler, no need for n8n.

#### **2. Price Update Automation** ⏳ PLANNED (Phase 12)
```javascript
// tools/etl/price-update.mjs
// Trigger: Daily at 2:00 AM MYT
// Function: Scrape laptop prices from Lazada, Shopee, official stores
// Steps:
//   1. Scrape Lazada API (product search by SKU)
//   2. Scrape Shopee API (product details)
//   3. Calculate price changes (compare with last price)
//   4. Update products table (price_myr, price_history JSONB)
//   5. Trigger Slack alert if price drop >15% (affiliate opportunity)
```

**Complexity:** Medium (3 API calls, 1 DB write, 1 conditional alert)
**n8n Equivalent:** 7 nodes (Schedule → 3× HTTP Request → IF → PostgreSQL → Slack)
**Verdict:** Could benefit from n8n for visual debugging, but Netlify Function with retry logic is sufficient.

#### **3. User Onboarding Email Sequence** ⏳ PLANNED (Phase 13)
```javascript
// netlify/functions/onboarding-emails.mjs
// Trigger: New user signup (webhook from auth.mjs)
// Function: Send 5-email onboarding sequence
// Steps:
//   1. Day 0: Welcome email (SendGrid)
//   2. Day 1: Product tour (SendGrid)
//   3. Day 3: Matchmaker quiz prompt (SendGrid)
//   4. Day 7: Pro tier offer (SendGrid)
//   5. Day 14: Feedback survey (SendGrid)
```

**Complexity:** High (5 sequential emails with delays)
**n8n Equivalent:** 6 nodes (Webhook → Wait → 5× SendGrid)
**Verdict:** **n8n would be IDEAL here** for visual delay management and A/B testing different email copy.

#### **4. Stripe Payment → Tier Upgrade** ✅ IMPLEMENTED
```javascript
// netlify/functions/stripe-webhook.mjs
// Trigger: Stripe webhook (checkout.session.completed)
// Function: Upgrade user tier after successful payment
// Steps:
//   1. Verify Stripe signature
//   2. Extract customer_id, subscription_id
//   3. Update users table (tier='pro' or 'ultimate')
//   4. Update subscriptions table
//   5. Send upgrade confirmation email (SendGrid)
```

**Complexity:** Medium (1 webhook, 2 DB writes, 1 email)
**n8n Equivalent:** 4 nodes (Webhook → PostgreSQL × 2 → SendGrid)
**Verdict:** Netlify Function is better for security (signature verification in code).

#### **5. Ops Alerts (Composite Score Drop)** ⏳ PLANNED
```javascript
// netlify/functions/ops-alert.mjs
// Trigger: CI workflow (.github/workflows/composite-score.yml)
// Function: Send Slack alert if composite score <99
// Steps:
//   1. Receive webhook from GitHub Actions
//   2. Parse score, commit, branch
//   3. Send Slack message to #ops channel
//   4. Create Jira ticket (if score <95, critical)
```

**Complexity:** Low (1 webhook, 2 API calls)
**n8n Equivalent:** 4 nodes (Webhook → IF → Slack + Jira)
**Verdict:** Netlify Function is sufficient. n8n only helps if ops team wants to modify alert conditions without code.

---

## 📊 n8n Use Case Analysis

### **Scenario 1: Price Scraping & Alerts**

**Current Approach (Netlify Function):**
```javascript
// Pros:
// ✅ Full control over scraping logic (custom selectors, pagination)
// ✅ Retry logic built-in (exponential backoff)
// ✅ Error tracking (Syeddy Debugger integration)
// ✅ No additional cost

// Cons:
// ❌ Requires code changes to add new price sources
// ❌ No visual debugging (console logs only)
// ❌ Non-technical staff can't modify workflow
```

**n8n Approach:**
```
[Schedule Trigger]
    ↓
[HTTP Request: Lazada API]
    ↓
[Set Variable: lazadaPrice]
    ↓
[HTTP Request: Shopee API]
    ↓
[Set Variable: shopeePrice]
    ↓
[IF: Price Drop >15%]
    ├─ TRUE → [PostgreSQL: Update] → [Slack: Alert]
    └─ FALSE → [End]
```

**Pros:**
- ✅ Visual debugging (see data at each step)
- ✅ Non-technical staff can modify alert threshold
- ✅ Easy to add new price sources (drag-and-drop new HTTP node)

**Cons:**
- ❌ Limited control over retry logic (n8n built-in retries are basic)
- ❌ Cost: €20-50/month or €15/month for VPS
- ❌ Another service to maintain (uptime monitoring, updates)

**Verdict:** Netlify Function wins at current scale (<1000 products). n8n becomes valuable at 5000+ products when ops team needs to add price sources without engineering involvement.

---

### **Scenario 2: Email Drip Campaigns**

**Current Approach (Netlify Function + Cron):**
```javascript
// Requires COMPLEX state management:
// 1. Store user_onboarding_stage in database
// 2. Cron job checks daily for users at each stage
// 3. Send email if stage matches day count
// 4. Update onboarding_stage

// Pros:
// ✅ No additional cost
// ✅ Works within existing architecture

// Cons:
// ❌ Complex state logic (bug-prone)
// ❌ Hard to visualize user journey
// ❌ No A/B testing without code changes
```

**n8n Approach:**
```
[Webhook: New User Signup]
    ↓
[SendGrid: Welcome Email]
    ↓
[Wait: 1 day]
    ↓
[SendGrid: Product Tour Email]
    ↓
[Wait: 2 days]
    ↓
[SendGrid: Matchmaker Prompt]
    ↓
[Wait: 4 days]
    ↓
[IF: User Upgraded?]
    ├─ TRUE → [End]
    └─ FALSE → [SendGrid: Pro Tier Offer]
```

**Pros:**
- ✅ Visual user journey (easy to understand flow)
- ✅ Built-in delay management (no cron state complexity)
- ✅ A/B testing via duplicate workflows
- ✅ Marketing team can modify email copy/delays without engineering

**Cons:**
- ❌ Cost (€20-50/month)
- ❌ Vendor lock-in if using n8n.cloud
- ❌ Another auth system to secure (n8n dashboard access)

**Verdict:** **n8n WINS** for email campaigns. The visual delay management and marketing team autonomy justify the cost. **Revisit this use case in Phase 13 (Q2 2026) when user base reaches 5000+ MAU.**

---

### **Scenario 3: Multi-Step Data Pipelines (ETL)**

**Current Approach (Node.js Scripts):**
```javascript
// tools/etl/laptops-ingest.mjs
// Manual execution: npm run etl

// Pros:
// ✅ Full control over data transformation
// ✅ Can use npm libraries (cheerio for scraping, ajv for validation)
// ✅ Runs locally, no deployment needed for testing

// Cons:
// ❌ Manual execution (requires SSH to server or local run)
// ❌ No visual progress tracking
// ❌ Non-technical staff can't run ETL jobs
```

**n8n Approach:**
```
[Schedule: Daily 1 AM]
    ↓
[HTTP Request: Manufacturer API]
    ↓
[Code: Transform Data]
    ↓
[PostgreSQL: Bulk Insert]
    ↓
[IF: Insert Failed]
    ├─ TRUE → [Slack: Alert Ops Team]
    └─ FALSE → [End]
```

**Pros:**
- ✅ Scheduled execution (no manual intervention)
- ✅ Visual progress (see how many products ingested)
- ✅ Ops team can trigger manual runs from n8n dashboard

**Cons:**
- ❌ JavaScript code in n8n is less maintainable than proper .mjs files
- ❌ No Git version control for n8n workflows (JSON export required)
- ❌ Cost

**Verdict:** Netlify Functions win for complex ETL. Keep logic in Git-tracked .mjs files. Use GitHub Actions to schedule ETL jobs (runs in CI environment, logs visible in GitHub).

---

## 🛠️ Alternative Solutions (Without n8n)

### **Alternative 1: Netlify Scheduled Functions (Current)**

**How it works:**
```toml
# netlify.toml
[[functions]]
  path = "/cron-catchphrase-fetch"
  schedule = "0 3 * * *"  # 3:00 AM MYT daily
```

**Pros:**
- ✅ Free (within Netlify Functions quota: 125k invocations/month)
- ✅ Integrated with existing architecture
- ✅ Git version control
- ✅ Easy to debug (Netlify dashboard logs)

**Cons:**
- ❌ Max execution time: 10 seconds (Background Functions: 15 minutes on paid plan)
- ❌ No visual workflow builder
- ❌ Requires code changes for modifications

**Best for:** Simple automations (1-3 steps), current AI Bradaa scale.

---

### **Alternative 2: GitHub Actions Workflows**

**How it works:**
```yaml
# .github/workflows/price-update.yml
name: Daily Price Update
on:
  schedule:
    - cron: '0 2 * * *'  # 2:00 AM UTC daily

jobs:
  update-prices:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run ETL
        run: node tools/etl/price-update.mjs
      - name: Commit changes
        run: |
          git add data/prices.json
          git commit -m "chore: Update prices"
          git push
```

**Pros:**
- ✅ Free (2000 minutes/month for private repos, unlimited for public)
- ✅ Git-native (workflow files version controlled)
- ✅ Matrix builds (run scraping for multiple brands in parallel)
- ✅ Secrets management (GitHub Secrets for API keys)

**Cons:**
- ❌ YAML configuration (less intuitive than n8n visual builder)
- ❌ Limited to Git-related workflows (can't easily integrate with Slack, SendGrid without custom actions)

**Best for:** Data pipelines that commit results to repo (price updates, data ingestion).

---

### **Alternative 3: Cloudflare Workers (Cron Triggers)**

**How it works:**
```javascript
// cloudflare-worker.js
export default {
  async scheduled(event, env, ctx) {
    // Runs on schedule (configured in Cloudflare dashboard)
    const response = await fetch('https://api.onepiece.com/quotes');
    const quotes = await response.json();

    await env.DB.prepare('INSERT INTO catchphrases (text) VALUES (?)')
      .bind(quotes[0].text)
      .run();
  }
};
```

**Pros:**
- ✅ Free tier: 100,000 requests/day
- ✅ Edge computing (low latency)
- ✅ Built-in D1 database (SQLite)
- ✅ Can run alongside Netlify (use for automation only)

**Cons:**
- ❌ Another platform to manage (Cloudflare + Netlify + Neon)
- ❌ V8 isolates (not full Node.js, some npm packages incompatible)
- ❌ Requires Cloudflare Workers KV or D1 (separate database from Neon)

**Best for:** High-frequency, lightweight tasks (rate limiting, edge caching). **Overkill for AI Bradaa's current needs.**

---

## 💰 Cost Analysis

### **Scenario: 10 Automated Workflows**

| Solution | Setup Cost | Monthly Cost | Annual Cost | Engineering Time |
|----------|-----------|--------------|-------------|------------------|
| **Netlify Scheduled Functions** | €0 | €0 | €0 | 2 hrs/workflow = 20 hrs |
| **GitHub Actions** | €0 | €0 | €0 | 3 hrs/workflow = 30 hrs |
| **n8n Cloud** | €0 | €50 | €600 | 1 hr/workflow = 10 hrs |
| **n8n Self-Hosted (VPS)** | €50 (setup) | €15 | €230 | 20 hrs (includes DevOps) |
| **Cloudflare Workers** | €0 | €5 | €60 | 4 hrs/workflow = 40 hrs |

**Analysis:**
- n8n Cloud saves 10 hours of engineering time (€50/hr × 10 = €500 saved)
- But costs €600/year
- **Break-even:** Only if non-technical staff modify workflows >5 times/year
- **Verdict:** Not worth it at current scale (<10 workflows)

---

## 🔮 When Should AI Bradaa Adopt n8n?

### **Trigger Conditions (Any 3 of these = Consider n8n)**

1. ✅ **Workflow Complexity >5 Steps**
   - Example: Price scraping → Compare → Update DB → Generate report → Email → Slack → Create Jira ticket
   - Current: Max 3 steps in any workflow ❌

2. ✅ **Non-Technical Staff Need Workflow Access**
   - Example: Marketing team wants to modify email delays without engineering
   - Current: All workflows managed by engineering ❌

3. ✅ **Integration Count >10 Services**
   - Example: Netlify + Neon + Gemini + SendGrid + Stripe + Slack + Jira + Google Sheets + Airtable + Notion
   - Current: 5 integrations (Netlify, Neon, Gemini, SendGrid, Stripe) ❌

4. ✅ **High-Frequency Debugging**
   - Example: Ops team needs to debug failed workflows daily
   - Current: Workflows rarely fail (<1% error rate) ❌

5. ✅ **A/B Testing Workflows**
   - Example: Test 2 different email sequences to see which converts better
   - Current: No A/B testing yet ❌

6. ✅ **Multi-Category Expansion (Phase 13+)**
   - Example: Separate workflows for laptops, cameras, smartphones price updates
   - Current: Laptops only ❌

**Current Score:** 0/6 triggers met
**Decision:** **NOT NEEDED YET**

---

## 📝 Recommendation Summary

### **Immediate Action (Phase 11-12): Continue with Netlify Functions**

**Rationale:**
- Current automation needs are simple (1-3 step workflows)
- Budget-conscious (free tier Netlify covers all needs)
- Engineering team comfortable with code-based workflows
- No non-technical staff requiring workflow access yet

**Continue using:**
- Netlify Scheduled Functions (catchphrase fetching, ops alerts)
- GitHub Actions (ETL pipelines, data ingestion)
- Netlify webhooks (Stripe payment processing)

---

### **Re-Evaluate in Phase 13 (Q2 2026): Email Campaigns Launch**

**Trigger:** When user base reaches 5000+ MAU and marketing team needs autonomy

**If adopted, use n8n for:**
1. **Email drip campaigns** (onboarding, re-engagement, upgrade prompts)
2. **A/B testing workflows** (test email copy, delays, offers)
3. **Marketing automation** (segment users, personalized campaigns)

**Keep Netlify Functions for:**
1. **Security-critical flows** (Stripe webhooks, auth)
2. **Complex logic** (AI inference, data transformations)
3. **Real-time APIs** (chat, matchmaker)

---

### **Re-Evaluate in Phase 14 (Q3 2026): Multi-Category Expansion**

**Trigger:** When managing 3+ categories (laptops, cameras, smartphones) each with separate workflows

**If adopted, use n8n for:**
1. **Category-specific price updates** (parallel workflows for each category)
2. **Cross-category reports** (aggregate data across products)
3. **Ops dashboards** (visualize workflow execution across categories)

---

## 🎯 Final Verdict

### **🟡 n8n: NOT NEEDED NOW, but HIGH VALUE in Phase 13+**

**Current Recommendation:**
- **DO NOT** adopt n8n for Phase 11-12
- **MONITOR** trigger conditions (workflow complexity, team needs)
- **REVISIT** evaluation in Q2 2026 (Phase 13: Email Campaigns)

**If re-evaluation in Phase 13 concludes n8n is needed:**
- **Deployment:** Self-hosted on Cloudflare Workers (avoid €50/month cloud cost)
- **Use cases:** Email campaigns, A/B testing, marketing automation ONLY
- **Keep:** Netlify Functions for all security-critical and real-time logic

---

## 📚 Appendix

### **A. n8n Self-Hosting Options**

| Platform | Cost | Pros | Cons |
|----------|------|------|------|
| **Cloudflare Workers** | €5/month | Edge deployment, low latency | Persistent state requires KV/D1 |
| **Railway** | €10/month | Easy deployment, auto-scaling | Limited free tier |
| **Render** | €7/month | Managed PostgreSQL included | US-only data centers |
| **DigitalOcean Droplet** | €6/month | Full control, Singapore DC | Manual updates, security |
| **Fly.io** | €0 (3 VMs free) | Free tier generous, global edge | Complex config |

**Recommendation if self-hosting:** **Fly.io** for free tier, **Render** for production (managed DB + n8n in one service).

---

### **B. Alternatives to n8n**

| Tool | Type | Cost | Best For |
|------|------|------|----------|
| **Zapier** | Cloud SaaS | $20-$50/month | Non-technical users, no code |
| **Make (Integromat)** | Cloud SaaS | $10-$30/month | Visual workflows, data transformation |
| **Temporal** | Self-hosted | Free (OSS) | Complex, mission-critical workflows (overkill) |
| **Airflow** | Self-hosted | Free (OSS) | Data engineering pipelines (overkill) |
| **Prefect** | Cloud/Self-hosted | $0-$200/month | Python-based workflows, ML pipelines |

**Verdict:** If n8n is adopted, stick with **n8n** (best balance of visual builder + code flexibility + self-hosting).

---

### **C. Sample n8n Workflow (Email Drip Campaign)**

```json
{
  "name": "User Onboarding Campaign",
  "nodes": [
    {
      "type": "n8n-nodes-base.webhook",
      "name": "New User Signup",
      "webhookId": "new-user-signup",
      "httpMethod": "POST"
    },
    {
      "type": "n8n-nodes-base.sendGrid",
      "name": "Send Welcome Email",
      "credentials": "sendGrid",
      "subject": "Welcome to AI Bradaa! 🚀",
      "text": "Hi {{$json.name}}, welcome to AI Bradaa..."
    },
    {
      "type": "n8n-nodes-base.wait",
      "name": "Wait 1 Day",
      "amount": 1,
      "unit": "days"
    },
    {
      "type": "n8n-nodes-base.sendGrid",
      "name": "Send Product Tour",
      "subject": "Quick tour of AI Bradaa features",
      "text": "Here's how to get started..."
    },
    {
      "type": "n8n-nodes-base.wait",
      "name": "Wait 2 Days",
      "amount": 2,
      "unit": "days"
    },
    {
      "type": "n8n-nodes-base.postgres",
      "name": "Check if Upgraded",
      "operation": "select",
      "query": "SELECT tier FROM users WHERE id = {{$json.userId}}"
    },
    {
      "type": "n8n-nodes-base.if",
      "name": "Already Pro?",
      "conditions": {
        "string": [
          {
            "value1": "{{$json.tier}}",
            "operation": "notEqual",
            "value2": "free"
          }
        ]
      }
    },
    {
      "type": "n8n-nodes-base.sendGrid",
      "name": "Send Pro Upgrade Offer",
      "subject": "Special offer: Upgrade to Pro (30% off)",
      "text": "Limited time offer..."
    }
  ],
  "connections": {
    "New User Signup": { "main": [[{ "node": "Send Welcome Email" }]] },
    "Send Welcome Email": { "main": [[{ "node": "Wait 1 Day" }]] },
    "Wait 1 Day": { "main": [[{ "node": "Send Product Tour" }]] },
    "Send Product Tour": { "main": [[{ "node": "Wait 2 Days" }]] },
    "Wait 2 Days": { "main": [[{ "node": "Check if Upgraded" }]] },
    "Check if Upgraded": { "main": [[{ "node": "Already Pro?" }]] },
    "Already Pro?": {
      "main": [
        [],
        [{ "node": "Send Pro Upgrade Offer" }]
      ]
    }
  }
}
```

---

**Document Status:** ✅ Evaluation Complete
**Next Review:** 2026-04-01 (Q2 2026 - Phase 13 Start)
**Owner:** AI Bradaa Technical Architecture Team

**Related Documents:**
- `ARCHITECTURE.md` - System architecture
- `MULTI_CATEGORY_EXPANSION_STRATEGY.md` - Expansion roadmap
- `.env.example` - Environment variables
