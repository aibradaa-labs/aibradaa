# ADR-001: Technology Stack Selection

**Status**: Accepted
**Date**: 2025-11-06
**Decision Makers**: Engineering Team

## Context

AI Bradaa requires a modern, performant, and cost-effective technology stack for a Malaysia-first AI-powered laptop recommendation PWA.

## Decision

### Frontend
- **Framework**: Vanilla JavaScript (ES Modules)
  - Rationale: No framework lock-in, lightweight, fast
  - Alternative considered: React/Vue (rejected for bundle size)

- **Styling**: Tailwind CSS
  - Rationale: Utility-first, small production bundle, rapid development
  - Alternative: Custom CSS (rejected for maintenance overhead)

- **PWA**: Service Worker + IndexedDB
  - Rationale: Offline-first, PDPA-compliant local storage
  - No localStorage per PDPA requirements

### Backend
- **Runtime**: Node.js 18+
  - Rationale: JavaScript everywhere, excellent ecosystem

- **Framework**: Express.js
  - Rationale: Minimal, flexible, well-documented
  - Alternative: Fastify (considered for future migration)

- **AI Integration**: Google Gemini API
  - Rationale: Cost-effective, powerful, generous free tier
  - Alternative: OpenAI (rejected for cost)

### Authentication
- **Method**: JWT + Magic Links (Email/Password)
  - Rationale: Passwordless option, secure, user-friendly
  - NO OAuth per user requirement

### Data Storage
- **Current**: JSON/JSONL files
  - Rationale: Simple, version-controlled, sufficient for initial scale
  - Migration path: PostgreSQL/MongoDB when needed

- **Validation**: Ajv (JSON Schema)
  - Rationale: Fast, standards-compliant, TypeScript support

### Deployment
- **Frontend**: Netlify
  - Rationale: Free tier, auto-SSL, global CDN, easy setup

- **Backend API**: Netlify Functions (serverless)
  - Rationale: Co-located with frontend, auto-scaling
  - Migration path: Dedicated server when needed

### Testing
- **Framework**: Node.js native test runner
  - Rationale: No dependencies, built-in, fast

### Monitoring
- **Logging**: Console + structured logs
  - Rationale: Simple, works with all platforms
  - Future: Sentry for error tracking

## Consequences

### Positive
- Low initial cost (~RM 38/month budget achievable)
- Fast development velocity
- Small bundle sizes (< 100KB gzipped)
- Easy to understand and maintain
- PDPA compliant by design
- Future migration paths clear

### Negative
- Manual state management (no React/Vue)
- Limited type safety (could add JSDoc/TypeScript later)
- JSON files won't scale indefinitely
- Manual optimization needed for some features

### Neutral
- Learning curve for Vanilla JS patterns
- Need to build some utilities from scratch
- Service Worker complexity

## Compliance

- ✅ PDPA: No localStorage, explicit consent, data minimization
- ✅ Performance: TTFMP < 2s, Lighthouse > 95
- ✅ Accessibility: WCAG 2.1 AA compliance
- ✅ Security: CSP headers, HTTPS, SRI

## Review Date

Review this decision in 6 months or at 10,000 active users, whichever comes first.

---

**References**:
- [Gemini API Pricing](https://ai.google.dev/pricing)
- [Netlify Pricing](https://www.netlify.com/pricing/)
- [PDPA Malaysia Guidelines](https://www.pdp.gov.my/)
