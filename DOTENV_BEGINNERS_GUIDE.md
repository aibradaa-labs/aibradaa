# .ENV FILE - COMPLETE BEGINNER'S GUIDE

**For:** Syeddy (Owner) - ZERO Technical Knowledge Assumed  
**Purpose:** Learn what .env is, how it works, and how to use it  
**Date:** November 14, 2025

---

## 🚨 COPY-PASTE THIS ENTIRE SECTION (Your Complete .env File)

**CRITICAL:** Copy EVERYTHING below (from the first `#` to the last line) and paste into a new file named `.env` in your project root.

```env
# ============================================================================
# CRITICAL ENVIRONMENT VARIABLES (REQUIRED FOR APP TO RUN)
# ============================================================================
# Copy this entire file, fill in the values after the = signs, save as .env
# ============================================================================

# ----------------------------------------------------------------------------
# 1. OPENROUTER API KEY (AI Brain - CRITICAL)
# ----------------------------------------------------------------------------
# What: API key for Claude/GPT-4 access via OpenRouter
# Where to get: https://openrouter.ai/keys
# Cost: Pay-as-you-go (~$0.50/1000 requests for Claude Sonnet)
# How to get:
#   1. Go to https://openrouter.ai
#   2. Sign up with Google/GitHub
#   3. Click "Keys" in left sidebar
#   4. Click "Create Key"
#   5. Set spending limit: $50/month (recommended)
#   6. Copy key (starts with sk-or-v1-)
#   7. Paste below (replace YOUR_KEY_HERE)
# ----------------------------------------------------------------------------
OPENROUTER_API_KEY=sk-or-v1-YOUR_KEY_HERE

# ----------------------------------------------------------------------------
# 2. UPSTASH REDIS (Memory & Caching - CRITICAL)
# ----------------------------------------------------------------------------
# What: Fast memory for storing chat history, mentor votes, session data
# Where to get: https://console.upstash.com
# Cost: FREE tier (10,000 commands/day), then $0.20 per 100k commands
# How to get:
#   1. Go to https://console.upstash.com
#   2. Sign up with Google/GitHub
#   3. Click "Create Database"
#   4. Name: ai-bradaa-redis
#   5. Region: Singapore (ap-southeast-1) ← Closest to Malaysia
#   6. Type: Regional (free tier)
#   7. Click "Create"
#   8. Copy "REST URL" → paste to UPSTASH_REDIS_REST_URL below
#   9. Copy "REST Token" → paste to UPSTASH_REDIS_REST_TOKEN below
# ----------------------------------------------------------------------------
UPSTASH_REDIS_REST_URL=https://YOUR-DB-NAME.upstash.io
UPSTASH_REDIS_REST_TOKEN=YOUR_TOKEN_HERE

# ----------------------------------------------------------------------------
# 3. MONGODB DATABASE (Data Storage - CRITICAL)
# ----------------------------------------------------------------------------
# What: Database for storing laptops, user data, search history
# Where to get: https://www.mongodb.com/cloud/atlas/register
# Cost: FREE tier (M0 cluster, 512MB storage), forever free
# How to get:
#   1. Go to https://www.mongodb.com/cloud/atlas/register
#   2. Sign up with Google
#   3. Create Organization: "AI Bradaa"
#   4. Create Project: "Production"
#   5. Build a Database → M0 FREE cluster
#   6. Cloud Provider: AWS, Region: Singapore (ap-southeast-1)
#   7. Cluster Name: ai-bradaa-prod
#   8. Create cluster (takes 3-5 minutes)
#   9. Security → Database Access → Add New User
#      - Username: aibradaa_admin
#      - Password: Generate (SAVE THIS PASSWORD)
#      - Role: Atlas Admin
#   10. Security → Network Access → Add IP Address → Allow from Anywhere (0.0.0.0/0)
#   11. Click "Connect" on your cluster
#   12. Choose "Connect your application"
#   13. Driver: Node.js, Version: 5.5 or later
#   14. Copy connection string (looks like mongodb+srv://...)
#   15. Replace <password> with your saved password
#   16. Paste below
# ----------------------------------------------------------------------------
DATABASE_URL=mongodb+srv://aibradaa_admin:YOUR_PASSWORD@ai-bradaa-prod.xxxxx.mongodb.net/?retryWrites=true&w=majority

# ----------------------------------------------------------------------------
# 4. JWT SECRET (Session Security - CRITICAL)
# ----------------------------------------------------------------------------
# What: Secret key for encrypting user login tokens
# Where to get: Generate yourself (see below)
# Cost: FREE (you generate it)
# How to get:
#   OPTION 1 - PowerShell (Windows):
#     Open PowerShell, paste this command, press Enter:
#     [Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
#   
#   OPTION 2 - Online Generator:
#     Go to https://generate-secret.vercel.app/32
#     Click "Generate"
#     Copy the result
#   
#   OPTION 3 - Manual:
#     Smash your keyboard randomly for 32 characters (letters, numbers, symbols)
#     Example: k8$mP2@nQ5!rT9#wX3&yZ7%cV1^bN4*
# ----------------------------------------------------------------------------
JWT_SECRET=YOUR_GENERATED_SECRET_HERE_32_CHARS_MINIMUM

# ----------------------------------------------------------------------------
# 5. SESSION SECRET (Web Session Security - CRITICAL)
# ----------------------------------------------------------------------------
# What: Secret key for encrypting web sessions (different from JWT)
# Where to get: Generate yourself (same as JWT, but DIFFERENT value)
# Cost: FREE (you generate it)
# How to get: Use same method as JWT_SECRET above, but generate a DIFFERENT value
# ----------------------------------------------------------------------------
SESSION_SECRET=DIFFERENT_SECRET_FROM_JWT_32_CHARS_MINIMUM

# ============================================================================
# OPTIONAL ENVIRONMENT VARIABLES (App works without these, but limited features)
# ============================================================================

# ----------------------------------------------------------------------------
# 6. GOOGLE OAUTH (Optional - For "Sign in with Google" button)
# ----------------------------------------------------------------------------
# What: Allows users to log in with their Google account
# Where to get: https://console.cloud.google.com
# Cost: FREE (unlimited)
# How to get:
#   1. Go to https://console.cloud.google.com
#   2. Create New Project: "AI Bradaa"
#   3. Enable "Google+ API"
#   4. Credentials → Create Credentials → OAuth 2.0 Client ID
#   5. Application Type: Web application
#   6. Authorized redirect URIs: http://localhost:8888/auth/google/callback
#   7. Copy Client ID → paste to GOOGLE_CLIENT_ID below
#   8. Copy Client Secret → paste to GOOGLE_CLIENT_SECRET below
# ----------------------------------------------------------------------------
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET

# ----------------------------------------------------------------------------
# 7. STRIPE (Optional - For processing payments)
# ----------------------------------------------------------------------------
# What: Payment processing for premium features
# Where to get: https://dashboard.stripe.com/register
# Cost: FREE (2.9% + RM0.50 per transaction when you make sales)
# How to get:
#   1. Go to https://dashboard.stripe.com/register
#   2. Sign up with email
#   3. Verify email
#   4. Developers → API Keys
#   5. Copy "Publishable key" (starts with pk_test_) → paste to STRIPE_PUBLIC_KEY
#   6. Reveal "Secret key" (starts with sk_test_) → paste to STRIPE_SECRET_KEY
# ----------------------------------------------------------------------------
STRIPE_PUBLIC_KEY=pk_test_YOUR_KEY
STRIPE_SECRET_KEY=sk_test_YOUR_KEY

# ----------------------------------------------------------------------------
# 8. SENDGRID (Optional - For sending emails)
# ----------------------------------------------------------------------------
# What: Email service for sending notifications, password resets
# Where to get: https://signup.sendgrid.com
# Cost: FREE tier (100 emails/day), then $15/month for 40k emails
# How to get:
#   1. Go to https://signup.sendgrid.com
#   2. Sign up (use work email, not Gmail)
#   3. Verify email
#   4. Settings → API Keys → Create API Key
#   5. Name: AI Bradaa Production
#   6. Permissions: Full Access
#   7. Copy key (starts with SG.) → paste below
# ----------------------------------------------------------------------------
SENDGRID_API_KEY=SG.YOUR_KEY_HERE
SENDGRID_FROM_EMAIL=noreply@aibradaa.com

# ----------------------------------------------------------------------------
# 9. GEMINI API (Optional - Backup AI if OpenRouter fails)
# ----------------------------------------------------------------------------
# What: Google's Gemini AI as backup (free tier available)
# Where to get: https://makersuite.google.com/app/apikey
# Cost: FREE tier (60 requests/minute), then pay-as-you-go
# How to get:
#   1. Go to https://makersuite.google.com/app/apikey
#   2. Sign in with Google
#   3. Click "Create API Key"
#   4. Copy key → paste below
# ----------------------------------------------------------------------------
GEMINI_API_KEY=YOUR_GEMINI_KEY_HERE

# ----------------------------------------------------------------------------
# 10. ENVIRONMENT & PORT (System Settings)
# ----------------------------------------------------------------------------
# What: Tells the app if it's running locally (development) or live (production)
# Where to get: You choose (keep as-is for local development)
# ----------------------------------------------------------------------------
NODE_ENV=development
PORT=8888

# ----------------------------------------------------------------------------
# 11. FRONTEND URL (For CORS - Cross-Origin Requests)
# ----------------------------------------------------------------------------
# What: Tells backend which frontend domains are allowed to connect
# Where to get: Your deployed frontend URL (Netlify gives you this)
# ----------------------------------------------------------------------------
FRONTEND_URL=http://localhost:8888

# ============================================================================
# END OF .env FILE
# ============================================================================
# After filling in all values:
# 1. Save this file as .env (with the dot, no .txt extension)
# 2. Place in project root (same folder as package.json)
# 3. Run: npm run dev
# 4. App should start without errors
# ============================================================================
```

**AFTER COPY-PASTING:**
1. **Replace ALL "YOUR_KEY_HERE" / "YOUR_PASSWORD" with real values** (from signup steps in comments)
2. **Save as `.env`** in project root (same folder as `package.json`)
3. **NEVER commit .env to GitHub** (it's in `.gitignore` already)
4. **Run `npm run dev`** - app should start without errors

---

## What is a .env File? (Explained Like You're Five)

### The Real-World Analogy

Imagine you have a **safe in your house** where you keep:
- Your bank account password
- Your house keys
- Your credit card numbers
- Your WiFi password

**The .env file is like that safe** - it stores all your app's secret passwords and keys.

### Why This Matters

**WITHOUT .env (BAD ❌):**
```javascript
// In your code (VISIBLE TO EVERYONE on GitHub!)
const password = "my_secret_password_123"  // ❌ DANGEROUS!
const apiKey = "sk-or-v1-abc123xyz"        // ❌ ANYONE CAN SEE THIS!
```

If you commit this code to GitHub, **the whole world can see your secrets**!

**WITH .env (GOOD ✅):**
```javascript
// In your code (SAFE - no secrets visible)
const password = process.env.DATABASE_PASSWORD  // ✅ Secret stored safely
const apiKey = process.env.OPENROUTER_API_KEY  // ✅ Only you can see it
```

The actual secrets live in `.env` file (which is **NEVER uploaded** to GitHub).

---

## How .env Works - The Three-Part System

### Part 1: .env.example (The Template)
**Location:** `configs/env.example`  
**Purpose:** A template showing what secrets you need (WITHOUT the actual secrets)  
**Uploaded to GitHub:** ✅ YES (safe - no real secrets)

**Example:**
```env
# OpenRouter API Key
# HOW TO GET: Sign up at https://openrouter.ai
OPENROUTER_API_KEY=your_openrouter_api_key_here  ← Placeholder
```

### Part 2: .env (Your Secret Safe)
**Location:** `c:\Users\syedu\OneDrive\Desktop\.env` (YOUR DESKTOP, not the project folder!)  
**Purpose:** Contains your REAL secrets  
**Uploaded to GitHub:** ❌ **NEVER!** (listed in `.gitignore`)

**Example:**
```env
# OpenRouter API Key
OPENROUTER_API_KEY=sk-or-v1-332dc77e6f80f33cc19e7cbb  ← REAL KEY!
```

### Part 3: .gitignore (The Guard)
**Location:** `.gitignore` (project root)  
**Purpose:** Tells GitHub to **IGNORE** the `.env` file (so it's never uploaded)

**Example:**
```gitignore
.env          ← This line prevents .env from being uploaded
node_modules/
```

---

## Your Current Situation (What You've Done)

### ✅ What You Did Right

1. **Created `.env` file on Desktop** (`c:\Users\syedu\OneDrive\Desktop\.env`)
   - ✅ CORRECT! This keeps it out of GitHub
   - ✅ Has all your real API keys

2. **Removed `.env` from project repo**
   - ✅ CORRECT! Prevents accidental upload to GitHub

### ⚠️ The Problem

**Your `.env` is on the Desktop, but your app runs from:**
```
c:\Users\syedu\OneDrive\Desktop\AI Bradaa Full\
```

**When you run tests or start the app, Node.js looks for `.env` in the PROJECT folder, not your Desktop!**

---

## COMPLETE LIST: ALL ENVIRONMENT VARIABLES YOU NEED

### CRITICAL (Must Have to Run App)

#### 1. **OPENROUTER_API_KEY** (AI Brain - MOST IMPORTANT)
**What it does:** Lets your app talk to AI models (Claude, GPT-4, etc.)  
**How to get:**
1. Go to https://openrouter.ai
2. Click "Sign In" (top right)
3. Sign up with Google/GitHub
4. Click your profile → "Keys"
5. Click "Create Key"
6. **SET SPENDING LIMIT: $50 USD** (very important!)
7. Copy the key (starts with `sk-or-v1-`)

**In your .env:**
```env
OPENROUTER_API_KEY=sk-or-v1-abc123xyz...
```

#### 2. **UPSTASH_REDIS_REST_URL** + **UPSTASH_REDIS_REST_TOKEN** (Memory)
**What it does:** Remembers conversations, caches data  
**How to get:**
1. Go to https://console.upstash.com
2. Sign up (free tier = 10,000 commands/day)
3. Click "Create Database"
   - Name: `aibradaa-memory`
   - Type: Regional
   - Region: Asia Pacific (Singapore) - **closest to Malaysia!**
   - Eviction: No eviction
4. Click "REST API" tab
5. Copy both:
   - `UPSTASH_REDIS_REST_URL` (the https:// link)
   - `UPSTASH_REDIS_REST_TOKEN` (the long token)

**In your .env:**
```env
UPSTASH_REDIS_REST_URL=https://guiding-donkey-12345.upstash.io
UPSTASH_REDIS_REST_TOKEN=AbCdEf123456...
```

#### 3. **DATABASE_URL** (MongoDB - Where Data Lives)
**What it does:** Stores user accounts, laptop data, search history  
**How to get:**
1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up (free tier = 512MB storage)
3. Create cluster:
   - Cloud Provider: AWS
   - Region: Singapore (ap-southeast-1) - **closest to Malaysia!**
   - Cluster Tier: M0 Sandbox (FREE)
4. Create database user:
   - Username: `aibradaa_admin`
   - Password: **Generate strong password** (save it!)
5. Allow IP access: Click "Network Access" → "Add IP Address" → "Allow Access from Anywhere" (for testing)
6. Click "Connect" → "Connect your application"
7. Copy connection string (looks like `mongodb+srv://...`)
8. Replace `<password>` with your database password

**In your .env:**
```env
DATABASE_URL=mongodb+srv://aibradaa_admin:YourPassword@cluster0.mongodb.net/ai_bradaa?retryWrites=true&w=majority
```

---

### IMPORTANT (Needed for Full Features)

#### 4. **JWT_SECRET** (Security Token)
**What it does:** Secures user login sessions  
**How to get:** Generate random string in PowerShell
```powershell
# Run this in PowerShell:
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```
Copy the output (32-character random string)

**In your .env:**
```env
JWT_SECRET=xK9mP2qR8vN5tY3wZ7aB4cD6eF1gH0iJ
```

#### 5. **SESSION_SECRET** (Web Session Security)
**What it does:** Keeps your website sessions secure  
**How to get:** Same as JWT_SECRET, run the PowerShell command again (use different value)

**In your .env:**
```env
SESSION_SECRET=aB3cD5eF7gH9iJ2kL4mN6oP8qR1sT0uV
```

#### 6. **GOOGLE_CLIENT_ID** + **GOOGLE_CLIENT_SECRET** (Google Login)
**What it does:** Lets users login with Google account  
**How to get:**
1. Go to https://console.cloud.google.com
2. Create new project: "AI Bradaa"
3. Enable "Google+ API"
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Application type: Web application
6. Authorized redirect URIs: `http://localhost:3000/api/auth/google/callback`
7. Copy Client ID and Client Secret

**In your .env:**
```env
GOOGLE_CLIENT_ID=123456789-abc.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abc123...
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

---

### OPTIONAL (Can Add Later)

#### 7. **STRIPE_SECRET_KEY** (Payments - Phase 2)
**What it does:** Accept credit card payments  
**How to get:**
1. Go to https://dashboard.stripe.com/register
2. Sign up
3. Go to "Developers" → "API keys"
4. Copy "Secret key" (starts with `sk_test_`)

**In your .env:**
```env
STRIPE_SECRET_KEY=sk_test_abc123...
STRIPE_PUBLISHABLE_KEY=pk_test_xyz789...
```

#### 8. **SENDGRID_API_KEY** (Email - Magic Links)
**What it does:** Send login emails without passwords  
**How to get:**
1. Go to https://signup.sendgrid.com
2. Sign up (free = 100 emails/day)
3. Create API Key: Settings → API Keys → "Create API Key"
4. Full Access → Create

**In your .env:**
```env
SENDGRID_API_KEY=SG.abc123...
SENDGRID_FROM_EMAIL=noreply@aibradaa.com
```

#### 9. **GEMINI_API_KEY** (Backup AI - DEPRECATED)
**What it does:** Google's AI (backup if OpenRouter fails)  
**How to get:**
1. Go to https://makersuite.google.com/app/apikey
2. Click "Get API Key"
3. Create in new project or existing

**In your .env:**
```env
GEMINI_API_KEY=AIzaSy...
GEMINI_MODEL=gemini-2.0-flash-exp
```

---

## STEP-BY-STEP: How to Set Up Your .env File

### Step 1: Copy the Template
```powershell
# In PowerShell, navigate to project folder
cd "c:\Users\syedu\OneDrive\Desktop\AI Bradaa Full"

# Copy env.example to .env
Copy-Item "configs\env.example" ".env"
```

### Step 2: Open .env in Notepad
```powershell
notepad .env
```

### Step 3: Fill In Your Secrets
Replace ALL the `your_xxx_here` placeholders with real values from the guides above.

**Start with these 5 CRITICAL ones:**
1. `OPENROUTER_API_KEY=sk-or-v1-...` (from OpenRouter)
2. `UPSTASH_REDIS_REST_URL=https://...` (from Upstash)
3. `UPSTASH_REDIS_REST_TOKEN=Ab...` (from Upstash)
4. `DATABASE_URL=mongodb+srv://...` (from MongoDB Atlas)
5. `JWT_SECRET=...` (generate with PowerShell command)

### Step 4: Save and Test
```powershell
# Save the .env file (Ctrl+S in Notepad)

# Test if it works
npm run test:all
```

---

## Common Mistakes (Don't Do These!)

### ❌ WRONG: Putting .env in wrong folder
```
c:\Users\syedu\OneDrive\Desktop\.env  ← WRONG (Desktop)
```

### ✅ CORRECT: .env in project folder
```
c:\Users\syedu\OneDrive\Desktop\AI Bradaa Full\.env  ← CORRECT!
```

### ❌ WRONG: Uploading .env to GitHub
**If you accidentally commit .env:**
```powershell
# Remove from git
git rm --cached .env

# Commit the removal
git commit -m "Remove .env from repo"

# Regenerate ALL secrets (they're compromised!)
```

### ❌ WRONG: Using fake placeholder values
```env
OPENROUTER_API_KEY=your_openrouter_api_key_here  ← Won't work!
```

### ✅ CORRECT: Real API keys
```env
OPENROUTER_API_KEY=sk-or-v1-332dc77e6f80f33cc19e7cbb  ← Works!
```

---

## Quick Reference: What Each Service Costs

| Service | Free Tier | Cost After Free | Why You Need It |
|---------|-----------|-----------------|-----------------|
| **OpenRouter** | $0 (pay-as-you-go) | ~$0.50-2/1000 requests | AI brain (CRITICAL) |
| **Upstash Redis** | 10k commands/day | $0.20/100k commands | Memory & caching |
| **MongoDB Atlas** | 512MB storage | $9/month (M10) | Database |
| **SendGrid** | 100 emails/day | $14.95/month (40k emails) | Email magic links |
| **Stripe** | FREE | 2.9% + $0.30/transaction | Payment processing |
| **Google OAuth** | FREE forever | FREE | Google login |

**Total for free tier:** $0/month (OpenRouter pay-as-you-go, very cheap)

---

## Troubleshooting

### "Cannot find module 'dotenv'"
**Solution:**
```powershell
npm install dotenv
```

### "OPENROUTER_API_KEY is not defined"
**Solution:** Check your .env file is in the project root, not Desktop

### "Redis connection failed"
**Solution:** Check Upstash credentials are correct, no extra spaces

### "MongoDB connection timeout"
**Solution:** Check IP allowlist in MongoDB Atlas, add 0.0.0.0/0 for testing

---

## What's Next?

1. ✅ Set up the 5 CRITICAL environment variables (OpenRouter, Upstash, MongoDB, JWT, Session)
2. ⏸️ Test the app runs: `npm run dev`
3. ⏸️ Add optional ones later (Stripe, SendGrid) when needed

**Your .env file is like your house safe - keep it SECRET, keep it LOCAL, NEVER upload it!**

## How to Fix It (Three Solutions)

### Solution 1: Copy .env to Project Root (RECOMMENDED)

**Step 1:** Copy your `.env` from Desktop to project folder
```powershell
# Open PowerShell in VS Code (Terminal → New Terminal)
Copy-Item "c:\Users\syedu\OneDrive\Desktop\.env" "c:\Users\syedu\OneDrive\Desktop\AI Bradaa Full\.env"
```

**Step 2:** Verify `.gitignore` contains `.env`
```powershell
# Check .gitignore file
cat .gitignore | Select-String ".env"
```

**Expected Output:**
```
.env
```

**Step 3:** Test it works
```powershell
# Run demo script
node demo-orchestrator-v3.mjs
```

**Expected Output:**
```
✅ Orchestrator initialized with:
   Redis: ✅ Connected  ← Should show "Connected" now!
   OpenRouter: ✅ Active  ← Should show "Active" now!
```

---

### Solution 2: Use Absolute Path (If you want .env on Desktop)

Create a `.env.local` file in your project that points to your Desktop .env:

**Step 1:** Create a new file at project root:
```
c:\Users\syedu\OneDrive\Desktop\AI Bradaa Full\.env.local
```

**Step 2:** Add this content:
```env
# This file loads the real .env from Desktop
# DO NOT COMMIT THIS FILE TO GITHUB!
```

**Step 3:** Modify `package.json` to load from Desktop:
```json
{
  "scripts": {
    "dev": "node -r dotenv/config server.js dotenv_config_path=c:/Users/syedu/OneDrive/Desktop/.env",
    "test": "node -r dotenv/config demo-orchestrator-v3.mjs dotenv_config_path=c:/Users/syedu/OneDrive/Desktop/.env"
  }
}
```

---

### Solution 3: Use Environment Variables Directly (Advanced)

Set environment variables in PowerShell session:

```powershell
# Set variables for current session only
$env:OPENROUTER_API_KEY="sk-or-v1-332dc77e6f80f33cc19e7cbb..."
$env:UPSTASH_REDIS_REST_URL="https://your-endpoint.upstash.io"
$env:UPSTASH_REDIS_REST_TOKEN="your_token_here"

# Then run your app
node demo-orchestrator-v3.mjs
```

**Downside:** You have to run these commands EVERY TIME you open a new PowerShell window.

---

## Recommended Setup (Step-by-Step)

### ✅ Complete Guide

**1. Copy .env to Project**
```powershell
# In PowerShell (VS Code Terminal)
Copy-Item "c:\Users\syedu\OneDrive\Desktop\.env" ".\.env"
```

**2. Verify .gitignore Protects It**
```powershell
# Check .gitignore
cat .gitignore
```

**Should see:**
```gitignore
.env
.env.local
.env.*.local
```

**3. Test Environment Variables Load**
```powershell
# Create test script
@"
import dotenv from 'dotenv';
dotenv.config();

console.log('OpenRouter:', process.env.OPENROUTER_API_KEY ? '✅ Loaded' : '❌ Missing');
console.log('Redis URL:', process.env.UPSTASH_REDIS_REST_URL ? '✅ Loaded' : '❌ Missing');
console.log('Redis Token:', process.env.UPSTASH_REDIS_REST_TOKEN ? '✅ Loaded' : '❌ Missing');
"@ | Out-File -Encoding UTF8 test-env.mjs

# Run test
node test-env.mjs
```

**Expected Output:**
```
OpenRouter: ✅ Loaded
Redis URL: ✅ Loaded
Redis Token: ✅ Loaded
```

**4. Run Demo Script**
```powershell
node demo-orchestrator-v3.mjs
```

**Expected Output:**
```
[Orchestrator Memory] Redis initialized successfully  ← Fixed!
[OpenRouter] Initialized successfully  ← Fixed!
```

---

## How .env is Used in Code

### Example 1: Connecting to Redis

**In Code (`orchestrator_memory.mjs`):**
```javascript
import { Redis } from '@upstash/redis';

// Node.js reads from .env file automatically
const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

// Create Redis client with secrets from .env
const redis = new Redis({
  url: redisUrl,      // Gets value from .env
  token: redisToken,  // Gets value from .env
});
```

**How It Works:**
1. You run `node demo-orchestrator-v3.mjs`
2. Node.js reads `.env` file in the same folder
3. Sets `process.env.UPSTASH_REDIS_REST_URL` = your Redis URL
4. Your code uses `process.env` to get the secret
5. **No secrets are ever visible in your code files!**

### Example 2: OpenRouter API

**In Code (`openrouter_adapter.mjs`):**
```javascript
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

if (!OPENROUTER_API_KEY) {
  console.warn('❌ API key not found. Set OPENROUTER_API_KEY in .env');
}

// Use API key to call OpenRouter
const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  headers: {
    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,  ← Secret from .env!
  },
});
```

---

## Security Best Practices

### ✅ DO

1. **Keep .env file LOCAL only**
   - Never upload to GitHub
   - Never share via email
   - Never paste in chat/Discord

2. **Use .env.example as template**
   - Upload `configs/env.example` to GitHub (safe - no real secrets)
   - Share with team so they know what keys to get

3. **Regenerate compromised keys immediately**
   - If you accidentally upload `.env`, regenerate ALL keys:
     - OpenRouter: https://openrouter.ai/keys
     - Upstash Redis: https://console.upstash.com

4. **Use different .env for different environments**
   - `.env.development` - Local testing
   - `.env.production` - Live server (Netlify)
   - `.env.test` - Running tests

### ❌ DON'T

1. **Never commit .env to GitHub**
   - Check `.gitignore` has `.env` listed
   - Run `git status` before committing

2. **Never hardcode secrets in code**
   ```javascript
   // ❌ BAD!
   const apiKey = "sk-or-v1-abc123xyz";
   
   // ✅ GOOD!
   const apiKey = process.env.OPENROUTER_API_KEY;
   ```

3. **Never share .env file directly**
   - Share `.env.example` instead
   - Tell people "fill in your own keys"

---

## Testing Checklist

Run these commands to verify everything works:

```powershell
# 1. Check .env file exists in project root
Test-Path .\.env
# Expected: True

# 2. Check .gitignore protects .env
Select-String -Path .gitignore -Pattern "^\.env$"
# Expected: .env

# 3. Test environment variables load
node test-env.mjs
# Expected: All ✅ Loaded

# 4. Run demo script
node demo-orchestrator-v3.mjs
# Expected: Redis ✅ Connected, OpenRouter ✅ Active

# 5. Verify .env is NOT tracked by Git
git status
# Expected: .env should NOT appear in the list
```

---

## Common Errors & Fixes

### Error 1: "Redis credentials missing"
```
[Orchestrator Memory] Redis credentials missing, using in-memory fallback
```

**Cause:** `.env` file not in project root OR variable names wrong

**Fix:**
```powershell
# Check .env exists
Test-Path .\.env

# Check variable names are correct
Select-String -Path .\.env -Pattern "UPSTASH_REDIS"

# Should show:
# UPSTASH_REDIS_REST_URL=...
# UPSTASH_REDIS_REST_TOKEN=...
```

### Error 2: "OPENROUTER_API_KEY not found"
```
[OpenRouter] API key not found. Set OPENROUTER_API_KEY in .env
```

**Cause:** Variable name mismatch

**Fix:**
```powershell
# Check .env has correct variable name
Select-String -Path .\.env -Pattern "OPENROUTER"

# Should show:
# OPENROUTER_API_KEY=sk-or-v1-...
```

### Error 3: ".env file not loading"

**Cause:** App not configured to load .env

**Fix:** Install `dotenv` package and configure it

```powershell
# Install dotenv
npm install dotenv

# Add to top of your main file (demo-orchestrator-v3.mjs)
import dotenv from 'dotenv';
dotenv.config();  // This loads .env file

// Now your code can use process.env
```

---

## Summary: The Simple Version

**Think of .env like a safe:**
1. **Create the safe** (`.env` file in project root)
2. **Put secrets inside** (your API keys, passwords)
3. **Lock it** (add `.env` to `.gitignore`)
4. **Use the safe** (code reads `process.env.YOUR_SECRET`)

**When you run your app locally:**
- Node.js opens the `.env` "safe"
- Reads all the secrets
- Makes them available as `process.env.SECRET_NAME`
- Your code uses them
- **Secrets never appear in your GitHub code!**

**That's it!** The .env file is just a way to keep secrets safe while still letting your app use them.

---

## Your Next Steps

1. ✅ **Copy .env to project root** (from Desktop)
2. ✅ **Verify .gitignore protects it** (`cat .gitignore | Select-String ".env"`)
3. ✅ **Run test script** (`node test-env.mjs`)
4. ✅ **Run demo** (`node demo-orchestrator-v3.mjs`)
5. ✅ **See Redis connected** (should show "✅ Connected")

**Questions?** Ask me to explain any part!
