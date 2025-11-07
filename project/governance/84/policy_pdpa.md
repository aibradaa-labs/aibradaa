# PDPA Compliance Policy (INTERNAL ONLY)

**Version:** 2.0.0
**Last Updated:** 2025-11-07
**Effective Date:** 2025-11-06
**Review Cadence:** Quarterly
**Owner:** Safety & Governance + Legal & Compliance

---

## Purpose

This policy operationalizes Personal Data Protection Act (PDPA) 2010 (Malaysia) compliance for AI Bradaa. It defines data collection, consent, retention, and user rights enforcement.

**Binding Authority:** This policy is a binding source per DOC 2. All data operations must comply.

---

## Scope

**Applies to:**
- All user data collected through AI Bradaa surfaces (Command, Versus, Explorer, Intel, Appendices, Camera Tech)
- Server-side logs, telemetry, analytics
- Client-side storage (localStorage prohibited, sessionStorage limited)
- Third-party integrations and affiliates
- Owner-internal analytics and debugging tools

**Does NOT apply to:**
- Anonymized aggregate statistics (no PII linkage)
- Public internet data (news, specs, reviews)
- Development environment test data (synthetic only)

---

## Principles (Non-Negotiable)

### 1. Least-Data Collection
- Collect **minimum data necessary** for declared purpose only
- Purpose must be explicit, specific, and documented
- No speculative or "just in case" collection
- Regular data minimization audits (quarterly)

### 2. Explicit Consent
- Consent obtained **before first data write**
- Consent must be:
  - **Granular:** Per data type and purpose
  - **Revocable:** User can withdraw anytime
  - **Documented:** Consent receipt generated and stored
  - **Time-bound:** Re-confirm annually for active users

### 3. User Rights
- **Right to Access:** User can export all their data within 48h
- **Right to Erasure:** "Forget me" completed within 72h
- **Right to Rectification:** User can correct inaccurate data
- **Right to Object:** User can object to processing and opt-out
- **Right to Data Portability:** Export in JSON format

### 4. Purpose Limitation
- Data used only for declared purpose
- No purpose expansion without new consent
- Clear documentation of all purposes in consent UI

### 5. Transparency
- Privacy policy in plain language (English + Bahasa Malaysia)
- Data collection disclosed upfront (before signup)
- Breach notification within 72h (per PDPA requirements)

---

## Data Classification

### Tier 1: Personal Identifiers (PII)
**Examples:** Email, phone, name, IP address, device ID
**Consent Required:** YES (explicit, granular)
**TTL:** 365 days or user-specified (shorter allowed)
**Encryption:** At rest (AES-256) and in transit (TLS 1.3)
**Access:** Owner only; never exposed to client

### Tier 2: Usage Data
**Examples:** Feature usage, session duration, button clicks, query patterns
**Consent Required:** YES (explicit, can be bundled with Tier 1)
**TTL:** 90 days
**Encryption:** At rest (AES-256)
**Access:** Owner + sanitized aggregates for analytics

### Tier 3: Technical Logs
**Examples:** Error logs, performance metrics, API traces
**Consent Required:** YES (implied consent for service operation)
**TTL:** 30 days
**Encryption:** At rest (recommended, not required)
**Access:** Owner + debugging tools

### Tier 4: Anonymized Aggregates
**Examples:** "50% of users activated within 7 days"
**Consent Required:** NO (not personal data)
**TTL:** Indefinite (no PII linkage)
**Encryption:** Not required
**Access:** Owner + internal analytics

---

## Consent Management

### Consent Workflow

1. **First Visit (Pre-Signup):**
   - Display privacy policy summary
   - No data collection except anonymous page view
   - Clear opt-in required for any data write

2. **Signup:**
   - Explicit consent for:
     - Account creation (email, password hash)
     - Usage analytics (session data, feature usage)
     - Technical logs (error tracking, performance)
   - Optional consent for:
     - Marketing communications
     - Product research participation

3. **Consent Receipt:**
   - Generated immediately upon consent
   - Contains:
     - Consent ID (UUID)
     - Timestamp (MYT)
     - Data types consented to
     - Purposes declared
     - Withdrawal instructions
   - Stored server-side; user can view/export anytime

4. **Consent Revocation:**
   - User can revoke via Settings > Privacy > Manage Consent
   - Partial revocation allowed (e.g., revoke analytics but keep account)
   - Revocation effective immediately
   - Data deletion workflow triggered automatically

### Consent Record Schema

```json
{
  "consent_id": "UUID",
  "user_id": "UUID",
  "timestamp_myt": "2025-11-07T08:45:00+08:00",
  "ip_address_hash": "SHA256:...",
  "user_agent_hash": "SHA256:...",
  "consented_to": [
    {"data_type": "account", "purpose": "service provision", "status": "active"},
    {"data_type": "usage", "purpose": "analytics", "status": "active"},
    {"data_type": "logs", "purpose": "debugging", "status": "active"}
  ],
  "revocations": [],
  "last_reviewed": "2025-11-07T08:45:00+08:00",
  "next_review_due": "2026-11-07"
}
```

---

## Retention & TTL

### Time-to-Live Policies

| Data Type          | Default TTL | User Override | Auto-Delete | Archive Path |
|--------------------|-------------|---------------|-------------|--------------|
| Account (PII)      | 365 days    | YES (shorter) | YES         | N/A (erased) |
| Usage analytics    | 90 days     | NO            | YES         | `data/archive/usage/` |
| Technical logs     | 30 days     | NO            | YES         | `data/archive/logs/` |
| Audit logs         | 90 days     | NO            | NO          | `data/audit/` |
| Consent receipts   | 7 years     | NO            | NO          | `data/consent/` |
| Anonymized aggregates | Indefinite | NO          | NO          | N/A |

### TTL Enforcement

- **Automated:** Cron job runs daily at 02:00 MYT
- **Verification:** Weekly audit to confirm deletions
- **Exceptions:** Audit logs and consent receipts (legal hold)
- **User-Initiated:** "Forget me" request overrides TTL (immediate)

---

## User Rights Implementation

### Right to Access (Export)

**Endpoint:** `/api/user/export`
**Method:** POST (authenticated)
**Response Time:** <48h
**Format:** JSON (structured, machine-readable)
**Contents:**
- Account details (email, created date, tier)
- Consent receipts
- Usage history (sessions, features used)
- Saved comparisons, alerts
- All user-generated content

**Sample Export:**
```json
{
  "export_id": "UUID",
  "generated_at": "2025-11-07T10:00:00+08:00",
  "user": {
    "email": "user@example.com",
    "created_at": "2025-10-01T12:00:00+08:00",
    "tier": "Pro",
    "locale": "en"
  },
  "consent_receipts": [...],
  "usage_history": [...],
  "saved_comparisons": [...],
  "notes": "Export complete. Valid for 7 days."
}
```

### Right to Erasure ("Forget Me")

**Endpoint:** `/api/user/forget`
**Method:** POST (authenticated)
**Response Time:** <72h
**Process:**
1. User initiates request via Settings > Privacy > Delete Account
2. Confirmation email sent (to prevent accidental deletion)
3. User confirms via email link (valid 24h)
4. Deletion workflow triggered:
   - Account deactivated immediately
   - PII erased within 72h
   - Usage data anonymized (linkage broken)
   - Audit log entry created (retained per legal requirement)
5. Confirmation email sent upon completion

**Exceptions (Not Deleted):**
- Audit logs (legal hold, 90 days)
- Consent receipts (legal hold, 7 years)
- Anonymized aggregates (no PII linkage)
- Affiliate transaction records (legal hold, 7 years)

### Right to Rectification

**Endpoint:** `/api/user/update`
**Method:** PATCH (authenticated)
**Allowed Updates:**
- Email (with verification)
- Locale preference
- Tier downgrade (Pro → Free)
- Saved comparisons/alerts

**Not Allowed:**
- Historical usage data (immutable for audit)
- Consent receipts (append-only)

### Right to Data Portability

**Included in Export:** YES (JSON format, standard schema)
**Interoperability:** Export can be imported into compatible systems
**Documentation:** Schema documented in `/docs/data_export_schema.json`

---

## Security Safeguards

### Encryption

- **At Rest:** AES-256 for all Tier 1 & 2 data
- **In Transit:** TLS 1.3 minimum; no plaintext transmission
- **Key Management:** Server-side only; rotation every 90 days
- **Client:** No PII stored in localStorage or cookies (session tokens only, httpOnly + secure)

### Access Controls

- **Owner:** Full access to all data (audit-logged)
- **Internal Tools:** Sanitized/anonymized views only
- **Third Parties:** No access (affiliate redirects do not share PII)
- **Debugging:** PII masked in logs (email → e***@***.com, IP → XX.XX.*.*)

### Breach Protocol

**Detection → Notification → Remediation**

1. **Detection:**
   - Automated monitoring for unauthorized access
   - SIEM alerts on anomalies
   - User reports via security@aibradaa.com

2. **Assessment (<4h):**
   - Scope: What data? How many users?
   - Impact: PII exposed? Risk level?
   - Containment: Stop ongoing breach

3. **Notification (<72h per PDPA):**
   - Affected users notified by email
   - PDPA Commissioner notified if high risk
   - Public disclosure if >1000 users affected

4. **Remediation:**
   - Root cause analysis
   - Fix deployed and verified
   - Post-mortem published (sanitized)
   - Dissent ledger entry created

---

## Third-Party Compliance

### Affiliate Partners

- **Data Shared:** None (redirect only)
- **Tokens:** Affiliate tokens embedded in `/out/*` URLs
- **Tracking:** Server-side click logging (no PII)
- **Agreement:** Partners bound by DPA (Data Processing Agreement)

### Analytics (If Any)

- **Preference:** Self-hosted (no third-party SDKs)
- **If Third-Party Required:** Must be GDPR/PDPA compliant
- **DPA Required:** YES (signed before integration)
- **PII Sharing:** NEVER (only anonymized aggregates)

---

## Audit & Compliance

### Quarterly Audits

**Checklist:**
- [ ] TTL enforcement verified (sample 50 records)
- [ ] Consent receipts valid and accessible
- [ ] User export requests completed within 48h
- [ ] "Forget me" requests completed within 72h
- [ ] Encryption at rest verified
- [ ] Access logs reviewed (no unauthorized access)
- [ ] Breach incidents reviewed (if any)
- [ ] Privacy policy updated (if changes)

**Owner Responsibilities:**
- Conduct audit
- Document findings
- Remediate critical issues within 48h
- Remediate high issues within 2 weeks

### Annual Transparency Report

**Published Internally (Not Public):**
- Total users by tier
- Consent revocations (count, not PII)
- Export requests (count, avg response time)
- "Forget me" requests (count, avg completion time)
- Breaches (if any, sanitized summary)
- PDPA complaints (if any, resolution summary)

---

## Contact & Escalation

**Privacy Officer:** Owner
**Email:** privacy@aibradaa.com (internal, not yet public)
**Escalation Path:** Safety & Governance → Executive Board
**PDPA Commissioner:** If required, contact via official channels

---

## References

- **PDPA 2010 (Malaysia):** Full text at [Official Gazette]
- **DOC 1:** Internal governance and operational details
- **DOC 2:** Engineering blueprint and compliance requirements
- **Dissent Ledger:** All P1+ privacy decisions logged

---

**Policy Owner:** Muhammad Taqi Usmani (Chief Ethics Officer)
**Reviewed By:** Bruce Schneier (Chief Security Advisor), Executive Board
**Next Review:** 2026-02-07 (Quarterly)
**Version History:** v2.0.0 (2025-11-07) - Complete PDPA framework established
