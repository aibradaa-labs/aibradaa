# Environment Setup - Quick Start Guide

**Get AI Bradaa running in 5 minutes**

---

## Step 1: Create .env File (30 seconds)

```bash
# In project directory
cd C:\Users\syedu\OneDrive\Desktop\ai-bradaa-pwa\aibradaa

# Copy example file
copy .env.example .env
```

---

## Step 2: Get Gemini API Key (2 minutes)

1. **Go to:** https://makersuite.google.com/app/apikey
2. **Click:** "Create API Key"
3. **Copy** the key (starts with `AIza...`)

---

## Step 3: Generate Secrets (1 minute)

**Run these commands in PowerShell/Terminal:**

```bash
# Generate JWT_SECRET
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"

# Generate SESSION_SECRET
node -e "console.log('SESSION_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
```

**Copy the outputs!**

---

## Step 4: Edit .env File (2 minutes)

Open `.env` and replace these values:

```env
# Paste your Gemini API key
GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Paste your generated secrets
JWT_SECRET=a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
SESSION_SECRET=98765fedcba0987654321098765432109876543210fedcba0987654321fedcba

# For testing, use a Gmail account
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password

# Or skip email for now (magic links won't work)
# SMTP_USER=test@test.com
# SMTP_PASS=test123
```

**Save the file!**

---

## Step 5: Install & Run (30 seconds)

```bash
# Install dependencies
npm install

# Start dev server
netlify dev
```

**You should see:**
```
✓ Local dev server ready: http://localhost:8888
✓ Loaded function health
✓ Loaded function command
... (all 11 functions)
```

---

## Quick Test

**Open browser:** http://localhost:8888/.netlify/functions/health

**You should see:**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-07T...",
  "uptime": 123
}
```

---

## Minimal .env for Testing

If you just want to test quickly without email:

```env
GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
JWT_SECRET=generate-32-char-random-secret-here-use-command-above
SESSION_SECRET=generate-another-32-char-random-secret-here
SMTP_USER=test@test.com
SMTP_PASS=test123
BASE_URL=http://localhost:8888
```

---

## Troubleshooting

**Functions won't load?**
```bash
# Make sure you ran npm install first
npm install
```

**Still errors?**
```bash
# Clear cache and restart
rm -rf .netlify node_modules
npm install
netlify dev
```

**Need help?**
- Check full guide: `docs/ENVIRONMENT_SETUP.md`
- Check logs in terminal

---

## Next: Production Setup

1. Login to Netlify: https://app.netlify.com
2. Go to Site Settings → Environment Variables
3. Add the same variables from your `.env` file
4. Deploy!

---

**Ready to code!** 🚀
