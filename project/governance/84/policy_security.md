# Security Baseline Policy (INTERNAL ONLY)

**Version:** 2.0.0
**Last Updated:** 2025-11-07
**Effective Date:** 2025-11-06
**Review Cadence:** Quarterly + Post-Incident
**Owner:** Safety & Governance + Platform

---

## Purpose

This policy defines the minimum security baseline for AI Bradaa across all surfaces, infrastructure, and operations. Compliance is mandatory and merge-blocking.

**Binding Authority:** This policy is a binding source per DOC 2. All code and infrastructure changes must pass security gates.

---

## Scope

**Applies to:**
- All client-side code (PWA, HTML, CSS, JavaScript)
- All server-side APIs and serverless functions
- All data stores (databases, caches, logs)
- All third-party integrations and dependencies
- All deployment pipelines and infrastructure

**Threat Model:**
- **XSS (Cross-Site Scripting):** Primary concern for PWA
- **Injection Attacks:** SQL, NoSQL, command injection
- **CSRF (Cross-Site Request Forgery):** API endpoints
- **Data Breaches:** Unauthorized access to PII
- **Supply Chain:** Compromised dependencies
- **DDoS:** Service disruption

---

## Security Principles (Non-Negotiable)

### 1. Defense in Depth
- Multiple layers of security controls
- No single point of failure
- Assume breach mentality (containment plans ready)

### 2. Least Privilege
- Minimal permissions by default
- Role-based access control (RBAC)
- Just-in-time access for sensitive operations

### 3. Secure by Default
- Opt-in for permissive features
- No debug mode in production
- Secrets never committed to git

### 4. Fail Securely
- Errors do not expose sensitive data
- Graceful degradation without security compromise
- Rollback mechanisms tested and ready

### 5. Audit Everything
- All security-relevant events logged
- Tamper-proof audit trails
- Retention per PDPA policy (90 days)

---

## Content Security Policy (CSP)

### CSP Directive (Strict)

**Location:** `/configs/csp_meta.txt` → injected into `index.html`

**Policy:**
```
Content-Security-Policy:
  default-src 'none';
  script-src 'self' https://cdn.jsdelivr.net https://unpkg.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: https:;
  connect-src 'self' https://api.aibradaa.com;
  frame-ancestors 'none';
  base-uri 'self';
  form-action 'self';
  upgrade-insecure-requests;
  block-all-mixed-content;
```

**Enforcement:**
- **No inline scripts:** All JavaScript loaded as ESM modules
- **No inline styles:** All CSS in external files or `<style>` tags (exception: critical CSS)
- **No `unsafe-eval`:** Prohibited everywhere
- **SRI Required:** All external scripts and styles must have integrity hashes

### CSP Violations

**Reporting Endpoint:** `/api/csp-report`
**Monitoring:** Violations logged and alerted (Prometheus + Grafana)
**Action:** Violations in production trigger incident review

**Violation Response:**
1. Log violation (timestamp, blocked-uri, violated-directive)
2. Alert owner if >10 violations/hour
3. Review within 24h
4. Fix or whitelist (documented in ADR)

---

## Subresource Integrity (SRI)

### Requirements

**All External Resources:**
- Scripts: `<script src="..." integrity="sha384-..." crossorigin="anonymous">`
- Styles: `<link rel="stylesheet" href="..." integrity="sha384-..." crossorigin="anonymous">`

**Hash Generation:**
```bash
openssl dgst -sha384 -binary script.js | openssl base64 -A
```

**CI Check:** Pre-merge hook verifies all external resources have SRI

### SRI Failures

**Browser Behavior:** Resource blocked if hash mismatch
**Fallback:** None (fail securely)
**Monitoring:** SRI failures logged to `/api/sri-failure`

---

## HTTPS & Transport Security

### TLS Configuration

**Minimum Version:** TLS 1.3 (TLS 1.2 acceptable if 1.3 unavailable)
**Cipher Suites:** Modern, forward-secret only (ECDHE, AES-GCM)
**Certificate:** Let's Encrypt (auto-renewed); RSA 2048+ or ECC 256+
**HSTS Header:** `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`

### HTTP Headers (Mandatory)

```
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
Cross-Origin-Opener-Policy: same-origin (where safe)
Cross-Origin-Embedder-Policy: require-corp (where safe)
```

**COOP/COEP Exceptions:**
- Affiliate `/out/*` routes (open in new window, no COOP)
- Third-party embeds (if any, explicit whitelist)

---

## Authentication & Session Management

### Authentication

**Signup/Login:**
- Email + password (min 12 chars, complexity enforced)
- Password hashing: Argon2id (recommended) or bcrypt (min cost 12)
- Rate limiting: 5 failed attempts → 15min lockout; 10 attempts → 1h lockout
- No password hints or recovery questions (email-based reset only)

**2FA (Pro Tier):**
- TOTP (Time-based One-Time Password) via authenticator app
- Setup success rate target: ≥98%
- Recovery codes (10 codes, one-time use, stored hashed)
- Backup email verification as fallback

### Session Management

**Session Tokens:**
- Cryptographically random (128-bit minimum)
- Stored server-side (Redis or database)
- Client receives opaque token (no JWT in client storage)
- Flags: `httpOnly`, `secure`, `SameSite=Strict`

**Session Lifecycle:**
- Timeout: 1h inactivity (Guest/Free), 4h (Pro)
- Absolute expiry: 24h (all tiers)
- Token rotation: On privilege escalation (e.g., settings change)
- Invalidation: On logout, password change, "forget me"

**Client Storage:**
- **No localStorage for sensitive data** (PDPA compliance)
- **sessionStorage:** Allowed for transient UI state only (no PII)
- **Cookies:** Session token only (`httpOnly`, `secure`, `SameSite=Strict`)

---

## API Security

### Input Validation

**All Inputs Validated:**
- Type checking (string, number, boolean, array, object)
- Length limits (e.g., query ≤1000 chars)
- Regex patterns for structured inputs (email, UUID, etc.)
- Schema validation (JSON Schema draft-07)

**Sanitization:**
- HTML escaped for display (prevent XSS)
- SQL parameterized queries only (no string concatenation)
- NoSQL queries validated (no injection via `$where`, `$regex`)
- Command injection prevented (no shell execution with user input)

### Rate Limiting

**Per Endpoint:**
| Endpoint         | Tier   | Rate Limit        | Burst | Lockout |
|------------------|--------|-------------------|-------|---------|
| `/api/command`   | Guest  | 10 req/min        | 20    | 5min    |
|                  | Free   | 30 req/min        | 50    | 5min    |
|                  | Pro    | 100 req/min       | 150   | 5min    |
| `/api/login`     | All    | 5 req/min         | 10    | 15min   |
| `/api/export`    | Free   | 5 req/hour        | 10    | 1h      |
|                  | Pro    | 20 req/hour       | 30    | 1h      |

**Implementation:** Token bucket algorithm; Redis-backed
**Response:** HTTP 429 Too Many Requests; Retry-After header

### CORS Policy

**Allowed Origins:**
- `https://aibradaa.com`
- `https://*.aibradaa.com` (subdomains)
- `http://localhost:*` (development only)

**Credentials:** `Access-Control-Allow-Credentials: true`
**Headers:** Explicit whitelist (no `*` wildcard)
**Methods:** GET, POST, PATCH, DELETE (OPTIONS for preflight)

### Error Handling

**Production Errors:**
- Generic messages to client (e.g., "An error occurred")
- Detailed errors logged server-side (with trace_id)
- No stack traces or internal paths exposed
- No database error messages leaked

**Error Response Format:**
```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred. Please try again.",
    "trace_id": "abc123...",
    "support_url": "https://aibradaa.com/support"
  }
}
```

---

## Secrets Management

### Secret Storage

**Prohibited:**
- Secrets in git (even private repos)
- Secrets in client-side code
- Secrets in environment variables (production)

**Allowed:**
- Secrets in secure vault (e.g., AWS Secrets Manager, HashiCorp Vault)
- Secrets in Netlify environment variables (server-side functions only)
- Secrets in owner-controlled files (e.g., `.env.local` not committed)

### Secret Rotation

**Cadence:**
- API keys: Every 90 days
- Database passwords: Every 180 days
- Session signing keys: Every 90 days
- TLS certificates: Auto-renewed (Let's Encrypt)

**Process:**
1. Generate new secret
2. Deploy new secret alongside old (dual-mode)
3. Monitor for 24h (ensure no breakage)
4. Revoke old secret
5. Document in changelog

---

## Dependency Security

### Supply Chain Protection

**Dependency Scanning:**
- Tool: `npm audit` + Snyk (or equivalent)
- Cadence: Every PR + weekly scheduled scan
- Action: Block merge if high/critical vulnerabilities

**Dependency Policies:**
- Pin major versions in `package.json` (e.g., `"lodash": "^4.17.21"`)
- Review changelogs before upgrading
- Minimize dependencies (prefer standard library)
- No dependencies with known malware or license violations

**Vulnerability Response:**
- **Critical:** Patch within 48h
- **High:** Patch within 1 week
- **Medium:** Patch within 1 month
- **Low:** Patch in next release cycle

### Subresource Integrity (SRI)

**CDN Resources:**
- Always use SRI hashes (sha384 minimum)
- Verify integrity on every load
- Fallback: Local copy if CDN compromised

---

## Infrastructure Security

### Server Hardening

**OS & Patches:**
- Minimal OS (e.g., Alpine Linux for containers)
- Auto-patching enabled (security updates)
- No unnecessary services running

**Firewall Rules:**
- Default deny; explicit allow only
- Ports 80/443 open (HTTPS redirect)
- SSH (port 22) restricted to owner IP (if needed)
- No FTP, Telnet, or insecure protocols

**Container Security:**
- Rootless containers where possible
- Read-only filesystems for production containers
- Secrets passed via environment (not baked into images)

### Logging & Monitoring

**Security Logs:**
- All authentication attempts (success/failure)
- All authorization failures (403, 401)
- All admin actions (owner-level changes)
- All CSP/SRI violations
- All rate limit breaches

**Log Retention:**
- 30 days (technical logs)
- 90 days (audit logs)
- 7 years (consent receipts, per PDPA)

**SIEM Alerts:**
- Failed logins >5 within 1h (same user)
- CSP violations >10 within 1h
- API errors >3σ above baseline
- Unauthorized access attempts

---

## Incident Response

### Incident Classification

**P0 - Critical:**
- Active data breach or PII exposure
- Production outage >15 min (SLO breach)
- Security CVE critical (CVSS ≥9.0)

**P1 - High:**
- Suspected breach (investigation needed)
- Security CVE high (CVSS 7.0-8.9)
- Unauthorized access detected

**P2 - Medium:**
- Security CVE medium (CVSS 4.0-6.9)
- Repeated failed login attempts (potential brute force)
- CSP violations spike

### Incident Response Workflow

1. **Detection:**
   - Automated alerts (SIEM, monitoring)
   - User reports (security@aibradaa.com)
   - Owner observation

2. **Assessment (<30min for P0, <4h for P1):**
   - Scope: What systems affected?
   - Impact: Data exposed? Users affected?
   - Containment: Can we stop it now?

3. **Containment (<15min for P0):**
   - Rollback if recent deploy
   - Block malicious IPs
   - Revoke compromised credentials
   - Take affected systems offline if needed

4. **Eradication:**
   - Root cause analysis
   - Fix deployed and verified in staging
   - Deploy to production with monitoring

5. **Recovery:**
   - Restore services
   - Monitor for 48h (ensure no recurrence)
   - Notify affected users (per PDPA, <72h)

6. **Post-Mortem (Within 7 days):**
   - Timeline of incident
   - Root cause analysis
   - What went well / poorly
   - Action items (with owners and deadlines)
   - Dissent ledger entry

---

## Penetration Testing

### Cadence

**Annual:** Third-party pen test (external)
**Quarterly:** Internal security review (owner + checklist)
**Ad-hoc:** After major features or architecture changes

### Scope

**In-Scope:**
- Public-facing surfaces (PWA, API endpoints)
- Authentication and session management
- Input validation and injection attacks
- CSP/SRI enforcement
- Rate limiting and DDoS resilience

**Out-of-Scope:**
- Social engineering (owner)
- Physical security (not applicable)
- Third-party services (unless we control)

### Remediation

**Critical Findings:** Fix within 48h
**High Findings:** Fix within 1 week
**Medium Findings:** Fix within 1 month
**Low Findings:** Fix in next release cycle

**Verification:** Re-test after fixes deployed

---

## Compliance & Audits

### Security Checklist (Pre-Merge)

- [ ] CSP directive validated (no `unsafe-inline`, `unsafe-eval`)
- [ ] SRI hashes present for all external resources
- [ ] Input validation on all endpoints
- [ ] Secrets not committed to git
- [ ] Dependencies scanned (no high/critical CVEs)
- [ ] Rate limiting enforced
- [ ] Error handling secure (no leaks)
- [ ] Audit logging in place
- [ ] Rollback plan documented

### Quarterly Security Review

**Owner Responsibilities:**
- Review access logs (any unauthorized attempts?)
- Review dependency vulnerabilities (patched?)
- Review incident reports (lessons learned?)
- Review CSP violations (legitimate or attack?)
- Update security policy if needed

---

## Training & Awareness

### Owner Responsibilities

- Stay current on OWASP Top 10
- Review security bulletins (dependencies, frameworks)
- Participate in security communities
- Document security decisions in ADRs

### Secure Coding Practices

- Never trust user input (validate everything)
- Use parameterized queries (no string concatenation)
- Encode output for context (HTML, URL, JavaScript)
- Fail securely (errors don't expose data)
- Log security events (authentication, authorization)

---

## References

- **OWASP Top 10:** https://owasp.org/www-project-top-ten/
- **CSP Guide:** https://content-security-policy.com/
- **SRI Guide:** https://developer.mozilla.org/en-US/docs/Web/Security/Subresource_Integrity
- **DOC 1:** Internal governance and operational details
- **DOC 2:** Engineering blueprint and security requirements
- **Dissent Ledger:** All P1+ security decisions logged

---

## Contact & Escalation

**Security Officer:** Bruce Schneier (Chief Security Advisor)
**Email:** security@aibradaa.com (internal, not yet public)
**Escalation Path:** Safety & Governance → Executive Board
**Emergency:** Page owner immediately (P0 incidents)

---

**Policy Owner:** Bruce Schneier (Chief Security Advisor)
**Reviewed By:** Gene Kim (Platform), Muhammad Taqi Usmani (Ethics), Executive Board
**Next Review:** 2026-02-07 (Quarterly + Post-Incident)
**Version History:** v2.0.0 (2025-11-07) - Complete security baseline established
