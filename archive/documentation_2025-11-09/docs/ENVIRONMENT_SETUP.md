# Environment Variables Setup Guide

**Complete guide to configuring all environment variables for AI Bradaa**

---

## Quick Start

### 1. Create Local .env File

```bash
# In your project root directory
cd C:\Users\syedu\OneDrive\Desktop\ai-bradaa-pwa\aibradaa

# Copy the example file
copy .env.example .env
```

### 2. Edit .env File

Open `.env` in your text editor and replace placeholder values with real ones.

---

## Required Variables (Must Configure)

### 🔑 GEMINI_API_KEY (CRITICAL)

**What it is:** Google Gemini API key for AI functionality

**How to get it:**

1. Go to **Google AI Studio**: https://makersuite.google.com/app/apikey
2. Sign in with your Google account
3. Click **"Get API Key"** or **"Create API Key"**
4. Click **"Create API key in new project"** (or select existing project)
5. Copy the generated API key (starts with `AIza...`)

**Example:**
```env
GEMINI_API_KEY=AIzaSyDXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

**Cost:** Free tier includes:
- 15 requests per minute
- 1 million tokens per day
- 1,500 requests per day

**Important:** Keep this secret! Never commit to GitHub.

---

### 🔐 JWT_SECRET (CRITICAL)

**What it is:** Secret key for signing JSON Web Tokens (user authentication)

**How to generate:**

**Option 1: Using Node.js (Recommended)**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Option 2: Using PowerShell**
```powershell
-join ((65..90) + (97..122) + (48..57) | Get-Random -Count 64 | ForEach-Object {[char]$_})
```

**Option 3: Using OpenSSL**
```bash
openssl rand -hex 32
```

**Example:**
```env
JWT_SECRET=a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
```

**Requirements:**
- Minimum 32 characters
- Use letters, numbers, and special characters
- Must be random and unpredictable
- Never reuse across environments

---

### 🔑 SESSION_SECRET (CRITICAL)

**What it is:** Secret for encrypting session data

**How to generate:** Same as JWT_SECRET (use same methods above)

**Example:**
```env
SESSION_SECRET=98765fedcba0987654321098765432109876543210fedcba0987654321fedcba
```

---

### 📧 EMAIL CONFIGURATION (Required for magic links)

**What it is:** SMTP settings for sending magic link emails

**Gmail Setup (Recommended for testing):**

1. **Enable 2-Step Verification:**
   - Go to: https://myaccount.google.com/security
   - Click "2-Step Verification" and enable it

2. **Create App Password:**
   - Go to: https://myaccount.google.com/apppasswords
   - Select app: "Mail"
   - Select device: "Other (Custom name)" → Enter "AI Bradaa"
   - Click "Generate"
   - Copy the 16-character password (remove spaces)

**Configuration:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=abcd efgh ijkl mnop  # Your app password (remove spaces)
EMAIL_FROM=AI Bradaa <noreply@aibradaa.com>
```

**Alternative Email Providers:**

**SendGrid:**
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=SG.xxxxxxxxxxxxx  # Your SendGrid API key
```

**Mailgun:**
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@your-domain.mailgun.org
SMTP_PASS=your-mailgun-password
```

---

## Optional Variables (Recommended)

### 🌐 BASE_URL

**What it is:** Base URL of your application

**Local Development:**
```env
BASE_URL=http://localhost:8888
```

**Production (Netlify):**
```env
BASE_URL=https://aibradaa.netlify.app
```

---

### 🤖 GEMINI_MODEL Configuration

**What it is:** Specify which Gemini models to use

**Recommended Settings:**
```env
GEMINI_MODEL=gemini-2.0-flash-exp           # Fast model (default)
GEMINI_MODEL_PRO=gemini-exp-1206            # Advanced model (think mode)
```

**Available Models:**
- `gemini-2.0-flash-exp` - Fast, free tier
- `gemini-exp-1206` - Experimental, advanced reasoning
- `gemini-1.5-pro` - Stable production model
- `gemini-1.5-flash` - Fast stable model

---

### 🔒 ALLOWED_ORIGINS (Security)

**What it is:** Allowed domains for CORS (Cross-Origin Resource Sharing)

**Configuration:**
```env
ALLOWED_ORIGINS=http://localhost:8888,https://aibradaa.netlify.app,https://www.aibradaa.com
```

**Format:** Comma-separated list of allowed origins (no spaces)

---

### 🎚️ API_KEY (Optional)

**What it is:** API key for external service integrations

**How to generate:**
```bash
node -e "console.log('aibradaa_' + require('crypto').randomBytes(24).toString('hex'))"
```

**Example:**
```env
API_KEY=aibradaa_a1b2c3d4e5f6789012345678901234567890abcdef12
```

---

## Complete .env Template

Copy this template and fill in your values:

```env
# ====================================
# AI BRADAA PRODUCTION ENVIRONMENT
# ====================================

# ====================================
# SERVER CONFIGURATION
# ====================================
NODE_ENV=development
PORT=3000
HOST=localhost
BASE_URL=http://localhost:8888

# ====================================
# GOOGLE GEMINI API (REQUIRED)
# ====================================
GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
GEMINI_MODEL=gemini-2.0-flash-exp
GEMINI_MODEL_PRO=gemini-exp-1206

# ====================================
# AUTHENTICATION (REQUIRED)
# ====================================
SESSION_SECRET=GENERATE_32_CHAR_RANDOM_SECRET_HERE
JWT_SECRET=GENERATE_32_CHAR_RANDOM_SECRET_HERE
JWT_EXPIRES_IN=7d

# ====================================
# EMAIL (REQUIRED for magic links)
# ====================================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password-here
EMAIL_FROM=AI Bradaa <noreply@aibradaa.com>

# ====================================
# SECURITY
# ====================================
ALLOWED_ORIGINS=http://localhost:8888,https://aibradaa.netlify.app
API_KEY=aibradaa_GENERATE_API_KEY_HERE

# ====================================
# RATE LIMITING (OPTIONAL)
# ====================================
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS_FREE=30
RATE_LIMIT_MAX_REQUESTS_PRO=100

# ====================================
# FEATURE FLAGS (OPTIONAL)
# ====================================
ENABLE_2FA=false
ENABLE_MAGIC_LINKS=true
ENABLE_ABO_84=true
LOG_LEVEL=info
```

---

## Netlify Dashboard Configuration

### Step 1: Login to Netlify

1. Go to: https://app.netlify.com
2. Sign in with your account
3. Select your **AI Bradaa** site

### Step 2: Navigate to Environment Variables

1. Click **Site configuration** (or **Site settings**)
2. Click **Environment variables** in the left sidebar
3. Click **Add a variable** or **Add environment variables**

### Step 3: Add Variables One by One

For **each variable** from your `.env` file:

1. Click **Add a variable**
2. **Key:** Enter variable name (e.g., `GEMINI_API_KEY`)
3. **Value:** Enter the value
4. **Scopes:** Select **All scopes** (or specific: Production, Deploy previews, Branch deploys)
5. Click **Create variable**

### Step 4: Critical Variables to Add

**Minimum Required:**
- `GEMINI_API_KEY`
- `JWT_SECRET`
- `SESSION_SECRET`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `EMAIL_FROM`

**Recommended:**
- `BASE_URL` (set to your Netlify URL)
- `ALLOWED_ORIGINS`
- `GEMINI_MODEL`
- `GEMINI_MODEL_PRO`
- `NODE_ENV=production`

### Step 5: Verify Configuration

After adding all variables:

1. Click **Save** or **Deploy site**
2. Trigger a new deployment (or wait for auto-deploy)
3. Check deploy logs for any missing variable warnings

---

## Testing Your Configuration

### Local Testing

```bash
# Start Netlify dev server
netlify dev

# You should see:
# ✓ Local dev server ready: http://localhost:8888
# ✓ Loaded function health
# ✓ Loaded function command
# ✓ Loaded function auth
# ... (all 11 functions should load)
```

### Test Environment Variables

**Create a test file:** `test-env.mjs`

```javascript
import dotenv from 'dotenv';
dotenv.config();

console.log('Environment Variables Check:');
console.log('==========================');
console.log('✓ GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? '✓ Set' : '✗ Missing');
console.log('✓ JWT_SECRET:', process.env.JWT_SECRET ? '✓ Set' : '✗ Missing');
console.log('✓ SESSION_SECRET:', process.env.SESSION_SECRET ? '✓ Set' : '✗ Missing');
console.log('✓ SMTP_USER:', process.env.SMTP_USER ? '✓ Set' : '✗ Missing');
console.log('✓ SMTP_PASS:', process.env.SMTP_PASS ? '✓ Set' : '✗ Missing');
```

Run:
```bash
node test-env.mjs
```

---

## Security Best Practices

### 🔒 DO:
- ✅ Use different secrets for development and production
- ✅ Rotate secrets regularly (every 90 days)
- ✅ Use environment-specific .env files (.env.development, .env.production)
- ✅ Add `.env` to `.gitignore` (already done)
- ✅ Use Netlify environment variables for production
- ✅ Keep `.env.example` updated (without real values)

### 🚫 DON'T:
- ❌ Commit `.env` files to Git
- ❌ Share API keys in chat/email
- ❌ Use simple/predictable secrets
- ❌ Reuse secrets across projects
- ❌ Store secrets in code comments
- ❌ Use production secrets in development

---

## Troubleshooting

### Error: "Could not resolve @google/generative-ai"

**Fix:** Run `npm install` first
```bash
npm install
```

### Error: "GEMINI_API_KEY is not defined"

**Fix:** Make sure `.env` file exists and contains:
```env
GEMINI_API_KEY=AIzaSy...
```

### Error: "Invalid SMTP credentials"

**Fix:**
1. Verify Gmail app password is correct (16 characters, no spaces)
2. Check 2-Step Verification is enabled
3. Regenerate app password if needed

### Functions not loading in Netlify CLI

**Fix:**
```bash
# Clear Netlify cache
rm -rf .netlify

# Restart dev server
netlify dev
```

---

## Environment Variable Reference

| Variable | Required | Purpose | Example |
|----------|----------|---------|---------|
| `GEMINI_API_KEY` | ✅ Yes | Google Gemini API authentication | `AIzaSy...` |
| `JWT_SECRET` | ✅ Yes | JWT token signing | `a1b2c3...` |
| `SESSION_SECRET` | ✅ Yes | Session encryption | `9876fe...` |
| `SMTP_HOST` | ✅ Yes | Email server | `smtp.gmail.com` |
| `SMTP_PORT` | ✅ Yes | Email port | `587` |
| `SMTP_USER` | ✅ Yes | Email username | `you@gmail.com` |
| `SMTP_PASS` | ✅ Yes | Email password | `abcd efgh...` |
| `EMAIL_FROM` | ✅ Yes | Sender email | `AI Bradaa <noreply@...>` |
| `BASE_URL` | ⚠️ Recommended | App base URL | `http://localhost:8888` |
| `ALLOWED_ORIGINS` | ⚠️ Recommended | CORS origins | `http://localhost:8888,...` |
| `GEMINI_MODEL` | ⚠️ Recommended | Fast AI model | `gemini-2.0-flash-exp` |
| `GEMINI_MODEL_PRO` | ⚠️ Recommended | Advanced AI model | `gemini-exp-1206` |
| `API_KEY` | ⚠️ Optional | External API key | `aibradaa_...` |
| `NODE_ENV` | ⚠️ Optional | Environment | `development`/`production` |
| `LOG_LEVEL` | ⚠️ Optional | Logging level | `info` |

---

## Next Steps

After configuring environment variables:

1. ✅ Run `npm install`
2. ✅ Run `netlify dev`
3. ✅ Test functions at http://localhost:8888/.netlify/functions/health
4. ✅ Configure Netlify dashboard for production
5. ✅ Deploy and test live

---

**Last Updated:** 2025-11-07
**Status:** Production Ready
**Questions?** Check logs or contact team lead
