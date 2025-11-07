# Netlify Functions Conversion Status

**Date:** 2025-11-07
**Purpose:** Track conversion progress from Express API to Netlify Functions
**Target:** Serverless deployment on Netlify

---

## Conversion Progress

### ✅ Completed (11/11 routes) 🎉

1. **health.mjs** - Health check endpoints ✅
   - Routes: `/`, `/detailed`, `/ready`, `/live`, `/metrics`, `/version`
   - Status: ✅ Fully converted
   - File: `netlify/functions/health.mjs`

2. **Utilities** - Shared helper functions ✅
   - `utils/response.mjs` - Response formatters, CORS, security headers
   - `utils/auth.mjs` - JWT validation, API key checking, tier enforcement
   - `utils/rateLimiter.mjs` - Rate limiting (in-memory, upgrade to Redis for production)
   - Status: ✅ Complete

3. **command.mjs** - AI Command processing ✅
   - Routes: `/` (POST), `/parse` (POST)
   - Status: ✅ Fully converted
   - Features: Gemini AI integration, intent parsing, tier-based rate limiting
   - File: `netlify/functions/command.mjs`

4. **auth.mjs** - Authentication endpoints ✅
   - Routes: `/register`, `/login`, `/magic-link`, `/verify/:token`
   - Status: ✅ Fully converted
   - Features: JWT generation, bcrypt password hashing, magic link support
   - File: `netlify/functions/auth.mjs`

5. **deck.mjs** - Deck card generation ✅
   - Routes: `/generate`, `/export`
   - Status: ✅ Fully converted
   - Features: 8-card Deck generation, MD/JSON/TXT export formats
   - File: `netlify/functions/deck.mjs`

6. **recommendations.mjs** - Laptop recommendations ✅
   - Routes: `/` (POST), `/compare` (POST)
   - Status: ✅ Fully converted
   - Features: Gemini AI-powered recommendations, comparison of multiple laptops
   - File: `netlify/functions/recommendations.mjs`

7. **chat.mjs** - Chat interface ✅
   - Routes: `/` (POST), `/stream` (POST)
   - Status: ✅ Fully converted
   - Features: Gemini AI chat with conversation history
   - File: `netlify/functions/chat.mjs`

8. **users.mjs** - User management ✅
   - Routes: `/profile` (GET), `/preferences` (PUT), `/tier` (PATCH)
   - Status: ✅ Fully converted
   - Features: Profile retrieval, preferences management, tier upgrades
   - File: `netlify/functions/users.mjs`

9. **intel.mjs** - News/Intel aggregation ✅
   - Routes: `/feed` (GET), `/refresh` (POST), `/price-drops` (GET)
   - Status: ✅ Fully converted
   - Features: News feed with pagination, ETL refresh trigger, price drop monitoring
   - File: `netlify/functions/intel.mjs`

10. **camera.mjs** - Camera tech image analysis ✅
    - Routes: `/analyze` (POST), `/capabilities` (GET)
    - Status: ✅ Fully converted
    - Features: Gemini Vision API for laptop identification, similar/alternative suggestions
    - File: `netlify/functions/camera.mjs`

11. **affiliates.mjs** - Affiliate link handling ✅
    - Routes: `/out/:id/:slug` (GET), `/stats` (GET)
    - Status: ✅ Fully converted
    - Features: Redirect with tracking, click statistics (admin only)
    - File: `netlify/functions/affiliates.mjs`

### ⏳ In Progress (0/11)

None - All routes completed! 🎉

### 📋 Pending (0/11)

All core routes have been converted!

---

## Conversion Strategy

### Phase 1: Foundation (✅ Complete)
- [x] Create `netlify/functions/` directory structure
- [x] Build shared utilities (response, auth, rateLimiter)
- [x] Update `netlify.toml` to point to new directory
- [x] Convert `health.mjs` as reference implementation

### Phase 2: Critical Routes (✅ Complete)
- [x] Convert `command.mjs` (AI Command - core functionality)
- [x] Convert `deck.mjs` (Deck export - user-facing)
- [x] Convert `auth.mjs` (Authentication - required for protected routes)

### Phase 3: User Features (✅ Complete)
- [x] Convert `recommendations.mjs`
- [x] Convert `chat.mjs`
- [x] Convert `users.mjs`

### Phase 4: Supporting Features (✅ Complete)
- [x] Convert `intel.mjs`
- [x] Convert `camera.mjs`
- [x] Convert `affiliates.mjs`

### Phase 5: Testing & Optimization (🔄 Next)
- [ ] Integration testing for all endpoints
- [ ] Load testing for serverless cold starts
- [ ] Optimize bundle sizes with esbuild
- [ ] Set up external rate limiter (Redis/Upstash) for production
- [ ] Configure environment variables in Netlify dashboard

---

## Technical Notes

### Express → Netlify Function Pattern

**Express Route:**
```javascript
router.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});
```

**Netlify Function:**
```javascript
export async function handler(event, context) {
  if (event.httpMethod !== 'GET') {
    return errorResponse('Method not allowed', 405);
  }

  return successResponse({ status: 'healthy' });
}
```

### Key Differences

1. **Request/Response:**
   - Express: `req`, `res` objects
   - Netlify: `event`, `context` parameters, return `{ statusCode, headers, body }`

2. **Routing:**
   - Express: Router handles sub-routes
   - Netlify: Each function handles its own path matching via `event.path`

3. **Middleware:**
   - Express: Middleware chain (`app.use()`)
   - Netlify: Manual application in handler or shared utilities

4. **State:**
   - Express: Server maintains state (sessions, cache)
   - Netlify: Stateless (use external services: Redis, databases)

### Migration Checklist (Per Route)

- [ ] Read original Express route
- [ ] Identify middleware used (auth, rate limiting, validation)
- [ ] Extract route handlers (GET, POST, PUT, DELETE)
- [ ] Create Netlify Function with handler export
- [ ] Implement path routing for sub-routes
- [ ] Apply CORS via `utils/response.mjs`
- [ ] Apply auth via `utils/auth.mjs` if needed
- [ ] Apply rate limiting via `utils/rateLimiter.mjs`
- [ ] Handle errors with `errorResponse()`
- [ ] Test locally with `netlify dev`
- [ ] Update documentation

---

## Testing

### Local Testing

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Run local dev server
netlify dev

# Functions will be available at:
# http://localhost:8888/.netlify/functions/health
# http://localhost:8888/api/health (via redirect)
```

### Environment Variables

Required for Netlify deployment:

```env
GEMINI_API_KEY=your_key_here
JWT_SECRET=your_secret_here
API_KEY=your_api_key_here
SMTP_HOST=smtp.example.com
SMTP_USER=user@example.com
ALLOWED_ORIGINS=https://aibradaa.com
NODE_ENV=production
```

Set via: Netlify Dashboard → Site settings → Environment variables

---

## Deployment

### Netlify Configuration

File: `netlify.toml`

```toml
[functions]
  directory = "netlify/functions"
  node_bundler = "esbuild"
```

### Redirect Rules

API calls to `/api/*` are redirected to `/.netlify/functions/*`:

```toml
[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
```

---

## Performance Considerations

### Cold Starts
- **Issue:** Serverless functions have cold start latency (~200-500ms)
- **Mitigation:** Keep functions small, minimize dependencies
- **Monitor:** p95 latency should stay within SLO (per `policy_security.md`)

### Bundle Size
- **Target:** Each function < 50MB zipped
- **Current:** health.mjs ≈ 5KB
- **Optimization:** esbuild tree-shaking, externalize large deps

### Rate Limiting
- **Current:** In-memory (resets on cold start)
- **Production:** Migrate to Redis (Upstash) or Netlify Edge functions
- **SLO:** Per-tier limits enforced (guest: 10/min, free: 30/min, pro: 100/min)

---

## Next Steps

### ✅ Conversion Complete - Ready for Testing!

All 11 API routes have been successfully converted to Netlify Functions. Next steps:

1. **Set up local testing environment** (Priority P0)
   - Install Netlify CLI: `npm install -g netlify-cli`
   - Run local dev server: `netlify dev`
   - Test all endpoints locally

2. **Configure environment variables** (Priority P0)
   - GEMINI_API_KEY - Google Gemini API key
   - JWT_SECRET - Secret for JWT signing
   - API_KEY - API key for external services
   - SMTP_HOST, SMTP_USER - Email service configuration
   - ALLOWED_ORIGINS - CORS allowed origins
   - NODE_ENV - Environment (production/development)

3. **Integration testing** (Priority P1)
   - Test each endpoint with real requests
   - Verify CORS headers
   - Verify authentication flow
   - Verify rate limiting
   - Test error handling

4. **Set up external services** (Priority P1)
   - Redis for rate limiting (Upstash free tier)
   - Database for users, clicks (FaunaDB, Supabase, or DynamoDB)
   - Email service for magic links

5. **Performance optimization** (Priority P2)
   - Benchmark cold start times
   - Optimize bundle sizes with esbuild
   - Monitor p95 latency
   - Set up monitoring and alerts

6. **Deploy to Netlify** (Priority P2)
   - Deploy to staging environment
   - Integration testing on staging
   - Production deployment
   - Monitor for errors

---

**Last Updated:** 2025-11-07 (Current Session)
**Progress:** 11/11 routes converted (100%) ✅
**Status:** API migration complete! All routes converted to serverless architecture 🎉
**Next Milestone:** Testing & Production Deployment
