# AI Bradaa Architecture

## System Overview

AI Bradaa is a Malaysia-first AI-powered laptop recommendation platform built as a Progressive Web App (PWA) with a comprehensive backend API and AI integration.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │Matchmaker│  │  Versus  │  │ Explorer │  │ Command  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                 │
│  │  Intel   │  │Appendices│  │Camera Tech│                 │
│  └──────────┘  └──────────┘  └──────────┘                 │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐ │
│  │         Shared Components & Utilities                  │ │
│  │  Card | Modal | Toast | API | Storage | Validators    │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                         API LAYER                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   Auth   │  │Matchmaker│  │  Versus  │  │ Command  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                 │
│  │  Intel   │  │ Laptops  │  │  User    │                 │
│  └──────────┘  └──────────┘  └──────────┘                 │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐ │
│  │     Middleware: Auth | Rate Limit | Error Handler     │ │
│  └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                        AI POD LAYER                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Personas: Syeddy v2.3.0 (Manglish, One Piece)      │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Pipelines: TOON | RAG | Context | Eval              │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Governance: 84-Mentor Council (Weighted Voting)     │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Prototypes: Souls FSM | Deck v2 | Thinking | Brand  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      EXTERNAL SERVICES                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  Gemini  │  │  Stripe  │  │  SendGrid│  │  Redis   │   │
│  │   API    │  │ Payment  │  │  Email   │  │  Cache   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                       DATA LAYER                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ MongoDB  │  │   JSON   │  │Quarantine│  │ Archive  │   │
│  │  Users   │  │ Laptops  │  │  Failed  │  │   Old    │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Frontend Architecture

### Technology Stack
- **Framework**: Vanilla JavaScript (ESM modules)
- **Styling**: Custom CSS with CSS variables
- **State Management**: Class-based modules with IndexedDB
- **PWA**: Service Worker + Web App Manifest
- **Build**: Native ES modules (no bundler for development)

### Module Structure

Each section (Matchmaker, Versus, etc.) follows this pattern:

```
section/
├── index.html        # HTML structure
├── section.css       # Section-specific styles
└── section.mjs       # Business logic (class-based)
```

### Shared Utilities

```
app/shared/
├── components/       # Reusable UI components
│   ├── card.mjs     # Laptop card component
│   ├── modal.mjs    # Modal dialogs
│   └── toast.mjs    # Toast notifications
└── utils/           # Utility functions
    ├── api.mjs      # API client
    ├── storage.mjs  # IndexedDB wrapper
    ├── validators.mjs # Form validation
    └── error-handler.mjs # Error handling
```

### Data Flow

1. **User Action** → UI Event Handler
2. **Event Handler** → Business Logic (Class Method)
3. **Business Logic** → API Client
4. **API Client** → Backend API
5. **Backend API** → AI POD / Database
6. **Response** → UI Update

### PWA Features

- **Service Worker**: Cache-first for static assets, network-first for API
- **IndexedDB**: Client-side storage for offline data
- **App Manifest**: Installable app configuration
- **Push Notifications**: Price drop alerts (Pro/Ultimate)

## Backend Architecture

### Technology Stack
- **Runtime**: Node.js 18+ with ES modules
- **Framework**: Express.js
- **Auth**: JWT with refresh tokens
- **Database**: MongoDB (users, sessions) + JSON files (laptops)
- **Cache**: Redis (sessions, rate limiting)
- **AI**: Google Gemini API

### API Structure

```
api/
├── config.mjs           # Configuration loader
├── server.mjs           # Express app setup
├── middleware/          # Express middleware
│   ├── auth.mjs        # JWT verification
│   ├── rate-limit.mjs  # Tier-based rate limiting
│   └── error.mjs       # Error handling
└── routes/             # API endpoints
    ├── auth.mjs        # Authentication
    ├── matchmaker.mjs  # Laptop recommendations
    ├── versus.mjs      # Comparison
    ├── command.mjs     # AI chat
    ├── intel.mjs       # Price tracking
    └── laptops.mjs     # Laptop data
```

### Authentication Flow

```
1. User signs up/logs in
   ↓
2. Server validates credentials
   ↓
3. Server generates JWT (access + refresh tokens)
   ↓
4. Client stores tokens in IndexedDB
   ↓
5. Client includes JWT in Authorization header
   ↓
6. Middleware verifies JWT on protected routes
   ↓
7. Token expires → Use refresh token to get new JWT
```

### Rate Limiting

Tier-based rate limiting with Redis:

- **Free**: 10 requests/minute
- **Pro**: 30 requests/minute
- **Ultimate**: 60 requests/minute

### Error Handling

Centralized error handler with:
- HTTP status codes
- User-friendly messages
- Detailed logging (OTEL)
- Error reporting (Sentry integration ready)

## AI POD System

### Persona System

**Syeddy v2.3.0** - The primary AI persona:
- **Personality**: One Piece-inspired (Luffy-esque enthusiasm)
- **Language**: Manglish (Malaysian English)
- **Expertise**: Laptop recommendations, tech specs
- **Tone**: Friendly (9/10), Formal (4/10), Expert (8/10)

### Pipelines

1. **TOON (Token-Optimized Object Notation)**
   - Converts JSON to compact format
   - 30-60% token savings
   - Abbreviates common fields

2. **RAG (Retrieval-Augmented Generation)**
   - Fetches relevant laptop data
   - Enriches context for AI
   - Tier-specific features (Pro/Ultimate get advanced RAG)

3. **Context Builder**
   - Assembles prompt with persona, data, history
   - Manages token budget
   - Applies governance rules

4. **Eval Pipeline**
   - Measures AI response quality
   - Tracks accuracy, faithfulness, helpfulness
   - Triggers retraining alerts

### Governance System

**84-Mentor Council**:
- 84 specialized mentors across 10 departments
- Weighted voting (1.0-2.0 based on expertise)
- Composite score must be ≥99/100 for production
- Red lines trigger automatic rejection

### Prototypes

1. **Souls FSM** - Visual state indicator
2. **Deck v2** - Stackable card UI for responses
3. **Thinking v1** - Loading/processing animations
4. **Branding v1** - Watermarks and provenance

## Data Architecture

### Data Sources

1. **Primary**: JSON files in `data/` directory
2. **ETL Sources**:
   - Shopee API/scraper
   - Lazada API/scraper
   - OEM websites (ASUS, Acer, etc.)

### Data Flow

```
ETL Pipeline:
1. Fetch → Scrape/API calls to sources
   ↓
2. Transform → Normalize, validate, enrich
   ↓
3. Validate → Schema validation, quarantine failures
   ↓
4. Load → Update JSON files + MongoDB
```

### Data Quality

- **Schema Validation**: Ajv JSON Schema
- **Quarantine System**: Failed entries go to `data/quarantine.json`
- **Archive System**: Discontinued laptops go to `data/archive.json`
- **Reports**: Daily quality reports in `data/reports.json`

### Data Files

- `laptops.json` - Active laptop catalog
- `brands.json` - Brand information
- `segments.json` - Market segments (gaming, business, etc.)
- `search-index.json` - Search configuration
- `price-drops.json` - Price drop tracking
- `quarantine.json` - Failed validation entries
- `archive.json` - Discontinued laptops
- `reports.json` - Data quality reports

## Security Architecture

### Authentication
- JWT with HS256 algorithm
- Access token: 7 days
- Refresh token: 30 days
- Secure, HttpOnly cookies

### Authorization
- Tier-based access control
- Feature flags per tier
- Quota enforcement

### Security Measures
- **CSP**: Strict Content Security Policy
- **HTTPS**: TLS 1.3 enforced
- **Rate Limiting**: Per-tier quotas
- **Input Validation**: Comprehensive sanitization
- **Password Hashing**: bcrypt with 12 rounds
- **Session Management**: Redis-backed sessions
- **PDPA Compliance**: Malaysian privacy laws

## Observability

### OpenTelemetry Integration

**Traces**:
- Request flows
- API call latency
- Database queries
- External API calls (Gemini)

**Metrics**:
- Request counts
- Error rates
- Response times
- Token usage
- Cache hit rates

**Logs**:
- Structured JSON logging
- Correlation IDs
- Error details
- Audit trail

### Monitoring Dashboards

- API performance
- AI token usage
- User activity
- Error tracking
- System health

## Deployment Architecture

### Hosting
- **Primary**: Netlify (CDN + Edge Functions)
- **Backup**: Cloudflare Pages
- **API**: Node.js on cloud provider (AWS/GCP/Azure)

### CI/CD Pipeline

```
1. Commit to feature branch
   ↓
2. Run tests (unit + integration)
   ↓
3. Code review + approval
   ↓
4. Merge to main
   ↓
5. Build production assets
   ↓
6. Run E2E tests
   ↓
7. Deploy to staging
   ↓
8. Manual QA verification
   ↓
9. Deploy to production
```

### Infrastructure

```
┌─────────────┐
│   Netlify   │ ← PWA (static files)
│     CDN     │
└─────────────┘
       ↓
┌─────────────┐
│  Cloud VM   │ ← API (Node.js + Express)
│  (AWS/GCP)  │
└─────────────┘
       ↓
┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│   MongoDB   │   │    Redis    │   │   Gemini    │
│   Atlas     │   │    Cloud    │   │     API     │
└─────────────┘   └─────────────┘   └─────────────┘
```

## Performance Optimization

### Frontend
- Lazy loading for routes
- Image optimization (WebP, responsive)
- Code splitting (by section)
- Service Worker caching
- IndexedDB for offline data

### Backend
- Redis caching
- Database indexing
- Connection pooling
- Compression middleware
- CDN for static assets

### AI
- TOON format for token savings
- Streaming responses
- Context caching
- Tier-based model selection (Flash vs Pro)

## Scalability Considerations

### Horizontal Scaling
- Stateless API servers
- Redis for session storage
- Load balancer (Nginx/HAProxy)

### Vertical Scaling
- Database read replicas
- Redis cluster
- CDN edge locations

### Bottlenecks
1. **Gemini API**: Rate limits and costs
   - Solution: Caching, tier quotas
2. **Database**: Query performance
   - Solution: Indexing, caching
3. **ETL Pipeline**: Data freshness
   - Solution: Scheduled jobs, parallelization

## Future Architecture

### Phase 2 (Q2 2025)
- Native mobile apps (React Native)
- GraphQL API
- Real-time price updates (WebSocket)
- Advanced RAG with vector embeddings

### Phase 3 (Q3 2025)
- Microservices architecture
- Event-driven system (Kafka)
- Multi-region deployment
- ML model training pipeline

---

**Document Version**: 1.0.0
**Last Updated**: 2025-01-15
**Maintained by**: AI Bradaa Engineering Team
