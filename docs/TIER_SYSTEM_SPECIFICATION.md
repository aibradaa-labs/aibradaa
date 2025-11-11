# Tier System Specification v2.0
## Free, Pro, Ultimate - Malaysia-First Pricing

**Version:** 2.0 (Enhanced with ABO-84 Beta & Catchphrase v4.1)
**Last Updated:** 2025-11-11 15:45 MYT (Asia/Kuala_Lumpur)
**Currency:** Malaysian Ringgit (MYR)
**Status:** Production Specification

---

## 🎯 Overview

AI Bradaa offers a **3-tier subscription model** designed for Malaysian users:

1. **Free Tier (RM0/month)** - Entry-level access for students and casual users
2. **Pro Tier (RM30/month)** - Power users and professionals
3. **Ultimate Tier (RM80/month)** - Maximum access + ABO-84 AI coding assistant

**Key Principles:**
- **Malaysia-first pricing** (affordable for local market)
- **Hard cost ceilings** (no surprise bills)
- **Graceful degradation** (users aren't blocked, just warned near limits)
- **ABO-84 Beta exclusivity** (Ultimate tier only, limited to 20 signups)

---

## 💰 Pricing Tiers

### **Tier Comparison Table**

| Feature | Free (RM0) | Pro (RM30) | Ultimate (RM80) |
|---------|------------|------------|-----------------|
| **Monthly Token Quota** | 30,000 | 400,000 | 3,000,000 |
| **API Requests/Month** | 50 | 800 | 5,000 |
| **Cost Ceiling (MYR)** | 8 | 40 | 200 |
| **Matchmaker Module** | ✅ Basic | ✅ Advanced | ✅ Advanced |
| **Versus Module** | ✅ 5 compares/month | ✅ Unlimited | ✅ Unlimited |
| **Explorer Module** | ✅ Basic filters | ✅ All filters | ✅ All filters |
| **Command Module (AI Chat)** | ❌ | ✅ 100 msgs/month | ✅ Unlimited |
| **Intel Module (Deep Research)** | ❌ | ✅ 10 reports/month | ✅ Unlimited |
| **Camera Module** | ❌ | ✅ Limited | ✅ Full Access |
| **TTS (Text-to-Speech)** | ❌ | ✅ 10 min/day | ✅ Unlimited |
| **Conversation History** | 7 days | 30 days | 90 days |
| **Priority Support** | ❌ | ✅ Email 24-48hrs | ✅ Priority 12hrs |
| **One Piece Catchphrase** | ✅ Daily | ✅ Daily + Custom | ✅ Daily + Custom + Yo |
| **ABO-84 Beta Access** | ❌ | 🟡 Dashboard Only | ✅ Full (20 spots) |
| **Export Data** | ❌ | ✅ CSV | ✅ CSV + JSON + API |
| **Ads** | ✅ Shown | ❌ Ad-free | ❌ Ad-free |
| **Badge** | - | 🏅 Pro | 👑 Ultimate |

---

## 📊 Detailed Tier Specifications

### **Free Tier (RM0/month)**

**Target Audience:**
- Students exploring laptop options
- Casual users comparing 1-2 laptops
- Trial users before upgrading

**Quota Limits:**
```yaml
tokens_monthly: 30000
requests_monthly: 50
cost_ceiling_myr: 8.00
tts_minutes_daily: 0
versus_compares_monthly: 5
conversation_history_days: 7
```

**Feature Access:**
- ✅ **Matchmaker:** Basic quiz (10 questions, top 3 recommendations)
- ✅ **Explorer:** Browse laptops, basic filters (brand, price range)
- ✅ **Versus:** Compare up to 5 laptop pairs per month
- ✅ **Catchphrase:** Daily One Piece quote (standard paraphrase)
- ❌ **Command:** No AI chat access
- ❌ **Intel:** No deep research reports
- ❌ **Camera Module:** No access
- ❌ **TTS:** No voice narration

**Ads:**
- Shown on landing page (not intrusive)
- Banner ads on Explorer module (bottom of page)
- Skippable after 3 seconds

**Upgrade Prompts:**
- After 5 Versus comparisons: "Unlock unlimited comparisons with Pro!"
- On Command module attempt: "Unlock AI chat with Pro for RM30/month"
- Daily dashboard: Soft CTA "Upgrade to Pro for advanced features"

---

### **Pro Tier (RM30/month)**

**Target Audience:**
- Working professionals buying laptops for work
- Content creators needing detailed comparisons
- Tech enthusiasts wanting AI insights

**Quota Limits:**
```yaml
tokens_monthly: 400000
requests_monthly: 800
cost_ceiling_myr: 40.00
tts_minutes_daily: 10
versus_compares_monthly: -1  # Unlimited
conversation_history_days: 30
command_messages_monthly: 100
intel_reports_monthly: 10
```

**Feature Access:**
- ✅ **Matchmaker:** Advanced quiz (20 questions, top 10 recommendations with confidence scores)
- ✅ **Explorer:** All filters (CPU, GPU, RAM, storage, use case, release date)
- ✅ **Versus:** Unlimited comparisons, AI-generated comparison reports
- ✅ **Command:** AI chat with laptop expertise (100 messages/month, 200 tokens/message avg)
- ✅ **Intel:** Deep research reports (10/month, 4000 tokens/report avg)
- ✅ **Camera Module:** Limited access (browse only, no AI recommendations yet)
- ✅ **TTS:** 10 minutes/day voice narration (AI-generated reports read aloud)
- ✅ **Catchphrase:** Daily quote + custom nickname ("Yo, {nickname}!" greeting)
- ✅ **ABO-84 Beta:** Dashboard preview only (see features, cannot download)

**Ads:**
- **Ad-free experience** across all modules
- No banner ads, no sponsored content

**Support:**
- ✅ Email support (24-48 hour response time)
- ✅ Knowledge base access
- ✅ Community Discord channel

**Stripe Payment:**
- **Price ID:** `price_1ProMonthlyMYR30`
- **Billing:** Monthly recurring
- **Trial:** 7-day free trial (new users only)
- **Cancellation:** Cancel anytime, access until period end

---

### **Ultimate Tier (RM80/month)**

**Target Audience:**
- Power users needing unlimited AI access
- Developers using ABO-84 AI coding assistant
- Early adopters wanting exclusive features

**Quota Limits:**
```yaml
tokens_monthly: 3000000
requests_monthly: 5000
cost_ceiling_myr: 200.00
tts_minutes_daily: 9999  # Effectively unlimited
versus_compares_monthly: -1  # Unlimited
conversation_history_days: 90
command_messages_monthly: -1  # Unlimited
intel_reports_monthly: -1  # Unlimited
```

**Feature Access:**
- ✅ **All Pro features** +
- ✅ **Command:** Unlimited AI chat messages
- ✅ **Intel:** Unlimited deep research reports
- ✅ **Camera Module:** Full access (AI recommendations, matchmaker, versus)
- ✅ **TTS:** Unlimited voice narration
- ✅ **Catchphrase:** v4.1 system (70% rephrase, "Yo" daily, "nakama" + nickname)
- ✅ **ABO-84 Beta:** **FULL ACCESS** (download desktop app for Windows, macOS, Linux)
- ✅ **Priority Support:** 12-hour response time, dedicated channel
- ✅ **Data Export:** CSV, JSON, API access for programmatic data retrieval
- ✅ **Early Access:** New features 30 days before other tiers
- ✅ **Community Badge:** 👑 Ultimate badge on profile, Discord server

**ABO-84 Beta Access (Exclusive):**
- **Signup Limit:** 20 users maximum
- **Countdown:** Dashboard shows "X/20 spots remaining"
- **Features:**
  - Desktop app (Electron-based)
  - AI-powered code completion
  - Real-time code analysis
  - Multi-language support (JS, TS, Python, Go, Rust)
  - Integrated with Gemini 2.5 Pro
  - Offline mode (cached models)
- **Platforms:** Windows (.exe), macOS (.dmg), Linux (.AppImage)
- **License:** Per-user (1 device active, 3 devices registered)

**Stripe Payment:**
- **Price ID:** `price_1UltimateMonthlyMYR80`
- **Billing:** Monthly recurring
- **Trial:** 14-day free trial (new users only, full ABO-84 access during trial)
- **Cancellation:** Cancel anytime, access until period end

**Support:**
- ✅ Priority email (12-hour SLA)
- ✅ Discord: #ultimate-support (private channel)
- ✅ Monthly Q&A sessions with founders
- ✅ Feature request priority (vote on roadmap)

---

## 🚀 ABO-84 Beta Countdown System

### **Countdown Display (Dashboard)**

```html
<!-- Dashboard Widget for Ultimate Tier Users -->
<div class="abo84-countdown">
  <h3>🎉 ABO-84 Beta Early Access</h3>
  <div class="progress-bar">
    <div class="filled" style="width: 65%;"></div>
    <span class="count">13/20 spots taken</span>
  </div>
  <p class="urgency">⚠️ Only 7 spots left! Upgrade to secure your access.</p>
  <a href="/upgrade?tier=ultimate" class="cta-button">Upgrade to Ultimate (RM80/month)</a>
</div>

<!-- For Pro Tier Users (Dashboard Preview) -->
<div class="abo84-preview-locked">
  <h3>🔒 ABO-84 Beta (Ultimate Only)</h3>
  <img src="/assets/abo84-screenshot.png" class="preview-img" />
  <p>AI-powered coding assistant with Gemini 2.5 Pro</p>
  <p class="countdown">🔥 13/20 early access spots taken</p>
  <a href="/upgrade?tier=ultimate" class="cta-button">Unlock Full Access (RM80/month)</a>
</div>
```

### **Database Implementation**

```sql
-- Check current signup count
SELECT COUNT(*)
FROM users
WHERE abo84_beta_access = TRUE
  AND tier = 'ultimate';

-- Function: Check if ABO-84 signups available
CREATE OR REPLACE FUNCTION abo84_signups_remaining()
RETURNS INT AS $$
DECLARE
  v_current_count INT;
  v_limit INT := 20;
BEGIN
  SELECT COUNT(*) INTO v_current_count
  FROM users
  WHERE abo84_beta_access = TRUE
    AND tier = 'ultimate';

  RETURN GREATEST(0, v_limit - v_current_count);
END;
$$ LANGUAGE plpgsql;

-- Trigger: Prevent signup if limit reached
CREATE OR REPLACE FUNCTION check_abo84_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.abo84_beta_access = TRUE
     AND NEW.tier = 'ultimate'
     AND abo84_signups_remaining() <= 0 THEN
    RAISE EXCEPTION 'ABO-84 Beta signup limit reached (20/20)';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_abo84_limit
  BEFORE INSERT OR UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION check_abo84_limit();
```

### **API Endpoint: Check Remaining Spots**

```javascript
// netlify/functions/abo84-status.mjs
export async function handler(event, context) {
  const sql = neon(process.env.DATABASE_URL);

  const result = await sql`SELECT abo84_signups_remaining() AS remaining`;
  const remaining = result[0].remaining;

  return {
    statusCode: 200,
    body: JSON.stringify({
      signup_limit: 20,
      signups_taken: 20 - remaining,
      signups_remaining: remaining,
      is_available: remaining > 0,
      urgency_level: remaining <= 5 ? 'high' : remaining <= 10 ? 'medium' : 'low'
    })
  };
}
```

---

## 🔄 Upgrade & Downgrade Paths

### **Free → Pro Upgrade**

**Trigger Points:**
1. User hits 50 API requests/month (quota limit)
2. User tries to access Command module
3. User completes 5 Versus comparisons
4. User visits landing page 10+ times (retargeting)

**Upgrade Flow:**
```
[User clicks "Upgrade to Pro"]
    ↓
[Stripe Checkout: RM30/month, 7-day trial]
    ↓
[Payment Success]
    ↓
[Webhook: /.netlify/functions/stripe-webhook]
    ↓
[Update users.tier = 'pro']
    ↓
[Create subscription record]
    ↓
[Send welcome email (SendGrid)]
    ↓
[Redirect to dashboard with success banner]
```

### **Pro → Ultimate Upgrade**

**Trigger Points:**
1. User sees ABO-84 dashboard preview (curiosity)
2. User hits 100 Command messages/month
3. User hits 10 Intel reports/month
4. ABO-84 countdown urgency (only 5 spots left)

**Upgrade Flow:** Same as Free → Pro, but:
- **Price Difference:** RM50/month (RM80 - RM30)
- **Proration:** Stripe automatically prorates (credit unused Pro days)
- **ABO-84 Activation:** Immediately grants `abo84_beta_access = TRUE`

### **Pro/Ultimate → Free Downgrade**

**Trigger:** User cancels subscription

**Flow:**
```
[User clicks "Cancel Subscription" in dashboard]
    ↓
[Confirmation modal: "Are you sure? You'll lose..."]
    ↓
[Stripe API: Cancel subscription, set cancel_at_period_end = TRUE]
    ↓
[Subscription remains active until period_end]
    ↓
[On period_end: Webhook updates users.tier = 'free']
    ↓
[Send "We're sad to see you go" email with win-back offer]
    ↓
[User continues with Free tier access]
```

**Grace Period:** 7 days after downgrade, user can re-upgrade without losing data

---

## 📈 Quota Enforcement

### **Soft Limits (Warnings)**

**At 80% of quota:**
```javascript
// Dashboard banner
"⚠️ You've used 80% of your monthly token quota (24,000/30,000).
 Upgrade to Pro for 13× more tokens (400,000/month)."
```

**At 90% of quota:**
```javascript
"🔴 You've used 90% of your tokens (27,000/30,000).
 You may run out soon. Upgrade to avoid interruptions."
```

**At 100% of quota:**
```javascript
"🚫 Monthly quota exceeded (30,000/30,000 tokens).
 Upgrade to Pro to continue using AI features, or wait for reset on Dec 1."
```

### **Hard Limits (Enforcement)**

**When quota exceeded:**
- **Matchmaker:** Still works (basic mode, no AI)
- **Explorer:** Still works (static data)
- **Versus:** Basic comparison only (no AI insights)
- **Command:** Blocked with upgrade CTA
- **Intel:** Blocked with upgrade CTA

**Cost Ceiling Exceeded:**
- **Rare case:** User's API usage costs exceed ceiling (e.g., Free tier >RM8)
- **Action:** Suspend AI features, send urgent email, require upgrade
- **Calculation:** Gemini pricing (RM0.00015/1K tokens input, RM0.0006/1K tokens output)

---

## 🎁 Promotional Pricing

### **Launch Offer (Phase 11-12)**

**Free → Pro:**
- 30-day free trial (instead of 7 days)
- Lifetime discount: RM25/month (17% off)
- Coupon code: `AIBRADAA_EARLY`

**Pro → Ultimate:**
- 50% off first 3 months (RM40/month instead of RM80)
- Coupon code: `ABO84_BETA`
- Condition: Only if <15 ABO-84 signups (to fill remaining spots)

### **Referral Program (Phase 13+)**

**Refer a Friend:**
- Referrer: 1 month free Pro (RM30 value)
- Referred: 20% off first month
- Limit: 5 referrals/year per user

**Implementation:**
```sql
-- users.referral_code (unique 8-char alphanumeric)
-- users.referred_by (UUID of referrer)

-- On successful referral signup:
UPDATE users
SET preferences = preferences || '{"free_months": 1}'::jsonb
WHERE id = referred_by_user_id;
```

---

## 🛡️ Fair Use Policy

### **Abuse Prevention**

**Anti-Patterns:**
1. **Token Hoarding:** User creates multiple Free accounts to bypass quotas
   - **Detection:** Same IP, same payment method, similar usage patterns
   - **Action:** Merge accounts, enforce 1 account/person policy

2. **Scraping:** User programmatically scrapes laptop data
   - **Detection:** 100+ requests/hour, no human interaction
   - **Action:** Rate limit to 10 requests/minute, require CAPTCHA

3. **Reselling Access:** User sells ABO-84 accounts
   - **Detection:** Multiple devices, different IPs, license violations
   - **Action:** Revoke ABO-84 access, downgrade to Free

### **Usage Monitoring**

```sql
-- Detect multiple accounts from same IP
SELECT ip_address, COUNT(DISTINCT user_id) AS account_count
FROM analytics
WHERE timestamp > NOW() - INTERVAL '7 days'
GROUP BY ip_address
HAVING COUNT(DISTINCT user_id) > 3;

-- Detect scraping behavior
SELECT user_id, COUNT(*) AS request_count
FROM analytics
WHERE event_type = 'api_request'
  AND timestamp > NOW() - INTERVAL '1 hour'
GROUP BY user_id
HAVING COUNT(*) > 100;
```

---

## 📊 Tier Migration Metrics

### **KPIs**

| Metric | Target (Phase 12) | Current |
|--------|-------------------|---------|
| **Free → Pro Conversion** | 5% | TBD |
| **Pro → Ultimate Conversion** | 10% | TBD |
| **Churn Rate (Pro)** | <5%/month | TBD |
| **Churn Rate (Ultimate)** | <2%/month | TBD |
| **ABO-84 Signups** | 20/20 (100%) | 0/20 |
| **Avg. Revenue Per User (ARPU)** | RM15 | TBD |
| **Monthly Recurring Revenue (MRR)** | RM50,000 | TBD |

### **Tracking**

```sql
-- Monthly conversion rate (Free → Pro)
SELECT
  COUNT(DISTINCT CASE WHEN prev_tier = 'free' AND curr_tier = 'pro' THEN user_id END) AS conversions,
  COUNT(DISTINCT CASE WHEN prev_tier = 'free' THEN user_id END) AS free_users,
  ROUND(100.0 * COUNT(CASE WHEN prev_tier = 'free' AND curr_tier = 'pro' THEN 1 END) /
        NULLIF(COUNT(CASE WHEN prev_tier = 'free' THEN 1 END), 0), 2) AS conversion_rate
FROM (
  SELECT
    user_id,
    tier AS curr_tier,
    LAG(tier) OVER (PARTITION BY user_id ORDER BY updated_at) AS prev_tier
  FROM users
  WHERE updated_at >= DATE_TRUNC('month', NOW())
) sub;
```

---

## 🎯 Catchphrase v4.1 Tier Differences

### **Free Tier:**
- **Frequency:** Daily rotation
- **Paraphrase:** Standard (80% rephrase threshold, v4.0 behavior)
- **Personalization:** None (generic "nakama")

### **Pro Tier:**
- **Frequency:** Daily rotation
- **Paraphrase:** Enhanced (70% rephrase threshold, v4.1 behavior)
- **Personalization:** Uses user nickname if set
- **Greeting:** Standard ("Hello, {nickname}!")

### **Ultimate Tier:**
- **Frequency:** Daily rotation + on-demand refresh
- **Paraphrase:** Premium (70% rephrase, multiple variants)
- **Personalization:** Full customization (nickname + favorite character priority)
- **Greeting:** "Yo, {nickname}!" (informal, friendly)
- **Custom:** User can favorite characters, get their quotes more often

---

## 📚 Appendix

### **A. Stripe Price IDs (Production)**

```bash
# Pro Tier
STRIPE_PRICE_PRO_MONTHLY="price_1ProMonthlyMYR30"
STRIPE_PRICE_PRO_YEARLY="price_1ProYearlyMYR300"  # 2 months free

# Ultimate Tier
STRIPE_PRICE_ULTIMATE_MONTHLY="price_1UltimateMonthlyMYR80"
STRIPE_PRICE_ULTIMATE_YEARLY="price_1UltimateYearlyMYR800"  # 2 months free

# Launch Offers (limited time)
STRIPE_PRICE_PRO_LAUNCH="price_1ProLaunchMYR25"  # 30-day trial, RM25/month
STRIPE_PRICE_ULTIMATE_LAUNCH="price_1UltimateLaunchMYR40"  # 3 months 50% off
```

### **B. Tier Feature Matrix (Code)**

```yaml
# configs/tiers.yaml
tiers:
  free:
    price_myr: 0
    tokens_monthly: 30000
    requests_monthly: 50
    cost_ceiling_myr: 8
    features:
      matchmaker: basic
      explorer: basic
      versus: limited
      command: false
      intel: false
      camera: false
      tts: false
      abo84: false
      ads: true
      conversation_history_days: 7

  pro:
    price_myr: 30
    tokens_monthly: 400000
    requests_monthly: 800
    cost_ceiling_myr: 40
    features:
      matchmaker: advanced
      explorer: full
      versus: unlimited
      command: limited
      intel: limited
      camera: limited
      tts: limited
      abo84: dashboard_only
      ads: false
      conversation_history_days: 30

  ultimate:
    price_myr: 80
    tokens_monthly: 3000000
    requests_monthly: 5000
    cost_ceiling_myr: 200
    features:
      matchmaker: advanced
      explorer: full
      versus: unlimited
      command: unlimited
      intel: unlimited
      camera: full
      tts: unlimited
      abo84: full_access
      ads: false
      conversation_history_days: 90
```

---

**Document Status:** ✅ Production Specification
**Next Review:** 2026-01-01 (Post-Phase 12 Launch)
**Owner:** AI Bradaa Product & Pricing Team

**Related Documents:**
- `DATABASE_SCHEMA_SPECIFICATION.md` - Database implementation
- `.env.example` - Environment variables (quota limits)
- `ARCHITECTURE.md` - System architecture
- `CHANGELOG.md` - Development history
