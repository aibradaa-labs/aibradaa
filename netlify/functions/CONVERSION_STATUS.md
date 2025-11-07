# Netlify Functions Conversion Status

**Date:** 2025-11-07
**Purpose:** Track conversion progress from Express API to Netlify Functions
**Target:** Serverless deployment on Netlify

---

## Conversion Progress

### ✅ Completed (2/11 routes)

1. **health.mjs** - Health check endpoints
   - Routes: `/`, `/detailed`, `/ready`, `/live`, `/metrics`, `/version`
   - Status: ✅ Fully converted
   - File: `netlify/functions/health.mjs`

2. **Utilities** - Shared helper functions
   - `utils/response.mjs` - Response formatters, CORS, security headers
   - `utils/auth.mjs` - JWT validation, API key checking, tier enforcement
   - `utils/rateLimiter.mjs` - Rate limiting (in-memory, upgrade to Redis for production)
   - Status: ✅ Complete

### ⏳ In Progress (0/11)

None currently

### 📋 Pending (9/11 routes)

3. **auth.mjs** - Authentication endpoints
   - Routes: `/login`, `/register`, `/refresh`, `/logout`
   - Complexity: Medium (JWT generation, password hashing)
   - Dependencies: jsonwebtoken, bcryptjs

4. **command.mjs** - AI Command processing
   - Routes: `/` (POST), `/parse` (POST)
   - Complexity: High (Gemini AI integration, tier-based rate limiting)
   - Dependencies: @google/generative-ai
   - **Critical:** Core AI functionality

5. **deck.mjs** - Deck card generation
   - Routes: `/export`, `/cards`
   - Complexity: Medium (card generation, export formats)
   - **Critical:** User-facing feature

6. **recommendations.mjs** - Laptop recommendations
   - Routes: `/` (GET/POST)
   - Complexity: Medium
   - Dependencies: Laptop data SOT

7. **chat.mjs** - Chat interface
   - Routes: `/` (POST), `/history` (GET)
   - Complexity: Medium
   - Dependencies: Gemini AI, session management

8. **users.mjs** - User management
   - Routes: `/profile`, `/settings`, `/tier`
   - Complexity: Medium
   - Dependencies: Auth middleware

9. **intel.mjs** - News/Intel aggregation
   - Routes: `/` (GET), `/refresh` (POST)
   - Complexity: Medium
   - Dependencies: External news APIs

10. **camera.mjs** - Camera specs
    - Routes: `/specs`, `/compare`, `/gallery`
    - Complexity: Low
    - Dependencies: Static data

11. **affiliates.mjs** - Affiliate link handling
    - Routes: `/out/:id`, `/track`
    - Complexity: Low
    - Dependencies: Redirect logic, analytics

12. **verify.mjs** - Verification endpoints
    - Routes: `/email`, `/export`
    - Complexity: Low
    - Dependencies: Email service

---

## Conversion Strategy

### Phase 1: Foundation (✅ Complete)
- [x] Create `netlify/functions/` directory structure
- [x] Build shared utilities (response, auth, rateLimiter)
- [x] Update `netlify.toml` to point to new directory
- [x] Convert `health.mjs` as reference implementation

### Phase 2: Critical Routes (Next Priority)
- [ ] Convert `command.mjs` (AI Command - core functionality)
- [ ] Convert `deck.mjs` (Deck export - user-facing)
- [ ] Convert `auth.mjs` (Authentication - required for protected routes)

### Phase 3: User Features
- [ ] Convert `recommendations.mjs`
- [ ] Convert `chat.mjs`
- [ ] Convert `users.mjs`

### Phase 4: Supporting Features
- [ ] Convert `intel.mjs`
- [ ] Convert `camera.mjs`
- [ ] Convert `affiliates.mjs`
- [ ] Convert `verify.mjs`

### Phase 5: Testing & Optimization
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

1. **Convert command.mjs** (Priority P0)
   - Core AI functionality
   - Requires Gemini AI integration
   - Implements tier-based routing

2. **Convert auth.mjs** (Priority P0)
   - Required for protected routes
   - JWT generation and validation

3. **Convert deck.mjs** (Priority P1)
   - User-facing export feature
   - Multiple export formats (PNG, MD, PDF)

4. **Set up external services** (Priority P1)
   - Redis for rate limiting (Upstash free tier)
   - Session store if needed

5. **Testing & Documentation** (Priority P1)
   - Integration tests for all functions
   - Update API documentation
   - Performance benchmarks

---

**Last Updated:** 2025-11-07 09:45 MYT
**Progress:** 2/11 routes converted (18%)
**ETA for completion:** ~8-12 hours of focused work
