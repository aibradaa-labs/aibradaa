# Security Implementation Roadmap
## JWT, OAuth2, AES-256, PDPA Compliance

**Version:** 1.0
**Last Updated:** 2025-11-11 16:00 MYT (Asia/Kuala_Lumpur)
**Status:** Implementation Guide
**Target Completion:** Phase 12 (Q1 2026)

---

## 🎯 Executive Summary

This roadmap outlines the complete security architecture for AI Bradaa, covering:
1. **Authentication** (JWT, OAuth2)
2. **Authorization** (Role-based access control)
3. **Encryption** (AES-256 at rest, TLS 1.3 in transit)
4. **PDPA Compliance** (Malaysia Personal Data Protection Act)
5. **Vulnerability Mitigation** (OWASP Top 10)
6. **Incident Response** (Security breach procedures)

**Current Status:** ⚠️ Partial implementation (JWT basic, no OAuth2 yet, no 2FA)
**Target:** ✅ Production-ready security by Phase 12 launch

---

## 🔐 1. Authentication System

### **1.1 JWT (JSON Web Tokens)**

#### **Status:** 🟡 Partially Implemented

**Current Implementation:**
- Basic JWT generation in `netlify/functions/auth.mjs`
- HS256 algorithm (symmetric key)
- No token rotation
- No refresh tokens

**Target Implementation:**

```javascript
// netlify/functions/utils/jwt.mjs
import jwt from 'jsonwebtoken';
import fs from 'fs';

// Use RS256 (asymmetric) for better security
const PRIVATE_KEY = fs.readFileSync(process.env.JWT_PRIVATE_KEY_PATH, 'utf8');
const PUBLIC_KEY = fs.readFileSync(process.env.JWT_PUBLIC_KEY_PATH, 'utf8');

/**
 * Generate access token (short-lived: 15 minutes)
 */
export function generateAccessToken(payload) {
  return jwt.sign(
    {
      sub: payload.user_id,  // Subject (user ID)
      email: payload.email,
      tier: payload.tier,
      abo84: payload.abo84_beta_access,
      type: 'access'
    },
    PRIVATE_KEY,
    {
      algorithm: 'RS256',
      expiresIn: '15m',
      issuer: 'aibradaa.com',
      audience: 'aibradaa-api'
    }
  );
}

/**
 * Generate refresh token (long-lived: 30 days)
 */
export function generateRefreshToken(payload) {
  return jwt.sign(
    {
      sub: payload.user_id,
      type: 'refresh',
      jti: generateUUID()  // Unique token ID for revocation
    },
    PRIVATE_KEY,
    {
      algorithm: 'RS256',
      expiresIn: '30d',
      issuer: 'aibradaa.com',
      audience: 'aibradaa-api'
    }
  );
}

/**
 * Verify token
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, PUBLIC_KEY, {
      algorithms: ['RS256'],
      issuer: 'aibradaa.com',
      audience: 'aibradaa-api'
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expired');
    }
    throw new Error('Invalid token');
  }
}
```

**Implementation Steps:**

1. **Generate RSA Key Pair**
   ```bash
   # Generate 2048-bit RSA keys
   openssl genrsa -out private.pem 2048
   openssl rsa -in private.pem -pubout -out public.pem

   # Store in Netlify environment variables
   JWT_PRIVATE_KEY=$(cat private.pem)
   JWT_PUBLIC_KEY=$(cat public.pem)
   ```

2. **Store Token Hash in Database**
   ```sql
   -- sessions table (already defined in DATABASE_SCHEMA_SPECIFICATION.md)
   INSERT INTO sessions (user_id, token_hash, expires_at, ip_address, user_agent)
   VALUES (
     user_id,
     SHA256(access_token),  -- Store hash, not raw token
     NOW() + INTERVAL '15 minutes',
     client_ip,
     user_agent
   );
   ```

3. **Implement Refresh Token Flow**
   ```javascript
   // netlify/functions/auth-refresh.mjs
   export async function handler(event, context) {
     const { refresh_token } = JSON.parse(event.body);

     // 1. Verify refresh token
     const payload = verifyToken(refresh_token);
     if (payload.type !== 'refresh') {
       return errorResponse('Invalid refresh token', 401);
     }

     // 2. Check if token revoked
     const session = await sql`
       SELECT * FROM sessions
       WHERE token_hash = ${SHA256(refresh_token)}
         AND revoked = FALSE
     `;
     if (session.length === 0) {
       return errorResponse('Token revoked', 401);
     }

     // 3. Generate new access token
     const user = await getUserById(payload.sub);
     const new_access_token = generateAccessToken(user);

     // 4. Return new token
     return successResponse({
       access_token: new_access_token,
       expires_in: 900  // 15 minutes in seconds
     });
   }
   ```

**Timeline:** 2 weeks (Phase 11.11)

---

### **1.2 OAuth2 (Third-Party Login)**

#### **Status:** ❌ Not Implemented

**Providers to Support:**
1. **Google** (primary, largest user base)
2. **Facebook** (secondary)
3. **GitHub** (for developers)

**Implementation:**

#### **Google OAuth2**

```javascript
// netlify/functions/auth-google.mjs
import { OAuth2Client } from 'google-auth-library';

const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI  // https://aibradaa.com/.netlify/functions/auth-google-callback
);

/**
 * Step 1: Redirect user to Google consent screen
 */
export async function handler(event, context) {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',  // Get refresh token
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email'
    ],
    state: generateCSRFToken()  // Prevent CSRF attacks
  });

  return {
    statusCode: 302,
    headers: { Location: authUrl }
  };
}
```

```javascript
// netlify/functions/auth-google-callback.mjs
/**
 * Step 2: Handle callback from Google
 */
export async function handler(event, context) {
  const { code, state } = event.queryStringParameters;

  // 1. Verify CSRF token
  if (!verifyCSRFToken(state)) {
    return errorResponse('Invalid state parameter', 400);
  }

  // 2. Exchange code for tokens
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  // 3. Get user info
  const ticket = await oauth2Client.verifyIdToken({
    idToken: tokens.id_token,
    audience: process.env.GOOGLE_CLIENT_ID
  });
  const payload = ticket.getPayload();

  // 4. Find or create user
  let user = await sql`
    SELECT * FROM users WHERE google_id = ${payload.sub}
  `;

  if (user.length === 0) {
    // Create new user
    user = await sql`
      INSERT INTO users (email, google_id, google_email, nickname, avatar_url, email_verified)
      VALUES (
        ${payload.email},
        ${payload.sub},
        ${payload.email},
        ${payload.given_name},
        ${payload.picture},
        TRUE
      )
      RETURNING *
    `;
  }

  // 5. Generate JWT tokens
  const access_token = generateAccessToken(user[0]);
  const refresh_token = generateRefreshToken(user[0]);

  // 6. Redirect to app with tokens
  return {
    statusCode: 302,
    headers: {
      Location: `https://aibradaa.com/app?access_token=${access_token}&refresh_token=${refresh_token}`,
      'Set-Cookie': `refresh_token=${refresh_token}; HttpOnly; Secure; SameSite=Strict; Max-Age=2592000`  // 30 days
    }
  };
}
```

**Configuration:**
1. Create OAuth app in Google Cloud Console
2. Set redirect URI: `https://aibradaa.com/.netlify/functions/auth-google-callback`
3. Store client ID and secret in Netlify environment variables

**Timeline:** 1 week per provider (3 weeks total, Phase 11.11)

---

### **1.3 Two-Factor Authentication (2FA)**

#### **Status:** ❌ Not Implemented

**Implementation: TOTP (Time-based One-Time Password)**

```javascript
// netlify/functions/auth-2fa-enable.mjs
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

export async function handler(event, context) {
  const user = await extractUser(event);  // From JWT

  // 1. Generate TOTP secret
  const secret = speakeasy.generateSecret({
    name: `AI Bradaa (${user.email})`,
    issuer: 'AI Bradaa'
  });

  // 2. Generate QR code
  const qrCodeDataURL = await QRCode.toDataURL(secret.otpauth_url);

  // 3. Store secret (encrypted) in database (NOT yet enabled)
  await sql`
    UPDATE users
    SET totp_secret = ${secret.base32},
        totp_enabled = FALSE
    WHERE id = ${user.id}
  `;

  // 4. Return QR code to user
  return successResponse({
    qr_code: qrCodeDataURL,
    manual_entry_key: secret.base32,
    message: 'Scan QR code with Google Authenticator, then verify to enable 2FA'
  });
}
```

```javascript
// netlify/functions/auth-2fa-verify.mjs
/**
 * Verify TOTP token and enable 2FA
 */
export async function handler(event, context) {
  const user = await extractUser(event);
  const { token } = JSON.parse(event.body);

  // 1. Get user's TOTP secret
  const userData = await sql`
    SELECT totp_secret FROM users WHERE id = ${user.id}
  `;

  // 2. Verify token
  const verified = speakeasy.totp.verify({
    secret: userData[0].totp_secret,
    encoding: 'base32',
    token,
    window: 2  // Allow 2 time steps (60 seconds) tolerance
  });

  if (!verified) {
    return errorResponse('Invalid 2FA token', 401);
  }

  // 3. Enable 2FA
  const backup_codes = generateBackupCodes(10);  // Generate 10 backup codes
  await sql`
    UPDATE users
    SET totp_enabled = TRUE,
        backup_codes = ${backup_codes}
    WHERE id = ${user.id}
  `;

  // 4. Return backup codes
  return successResponse({
    message: '2FA enabled successfully',
    backup_codes,
    warning: 'Store these backup codes in a safe place. You will need them to access your account if you lose your device.'
  });
}
```

**Timeline:** 1 week (Phase 11.12)

---

## 🔒 2. Encryption

### **2.1 Encryption at Rest (AES-256)**

#### **Status:** ✅ Implemented (Neon PostgreSQL managed)

**What's Encrypted:**
- All data in Neon PostgreSQL database (automatic AES-256)
- Backups (Neon managed, encrypted before storage)

**Additional Encryption (Application-Level):**

```javascript
// netlify/functions/utils/encryption.mjs
import crypto from 'crypto';

const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');  // 32 bytes (256 bits)
const IV_LENGTH = 16;  // AES block size

/**
 * Encrypt sensitive data (e.g., TOTP secrets, backup codes)
 */
export function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return iv.toString('hex') + ':' + encrypted;
}

/**
 * Decrypt sensitive data
 */
export function decrypt(text) {
  const parts = text.split(':');
  const iv = Buffer.from(parts.shift(), 'hex');
  const encrypted = parts.join(':');

  const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
```

**Usage:**
```javascript
// Store encrypted TOTP secret
const encrypted_secret = encrypt(totp_secret);
await sql`
  UPDATE users
  SET totp_secret = ${encrypted_secret}
  WHERE id = ${user_id}
`;

// Retrieve and decrypt
const user = await sql`SELECT totp_secret FROM users WHERE id = ${user_id}`;
const decrypted_secret = decrypt(user[0].totp_secret);
```

**Timeline:** 3 days (Phase 11.12)

---

### **2.2 Encryption in Transit (TLS 1.3)**

#### **Status:** ✅ Implemented (Netlify managed)

**Configuration:**
- Netlify automatically provisions SSL certificates (Let's Encrypt)
- TLS 1.3 enforced
- HTTP → HTTPS redirect
- HSTS header enabled (see netlify.toml)

**Additional Security Headers:**
```toml
# netlify.toml
[[headers]]
  for = "/*"
  [headers.values]
    Strict-Transport-Security = "max-age=63072000; includeSubDomains; preload"
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "geolocation=(), microphone=(), camera=()"
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://accounts.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; connect-src 'self' https://generativelanguage.googleapis.com; frame-src 'self' https://accounts.google.com; object-src 'none'"
```

**No action needed** (already configured).

---

## 🛡️ 3. PDPA Compliance (Malaysia)

### **3.1 Data Protection Principles**

**PDPA Requirements:**
1. **General Principle** - Process data lawfully
2. **Notice & Choice** - Inform users, get consent
3. **Disclosure** - Only disclose for intended purpose
4. **Security** - Protect data from loss, misuse
5. **Retention** - Don't keep data longer than necessary
6. **Data Integrity** - Keep data accurate and up-to-date
7. **Access** - Allow users to access their data

**Implementation Status:**

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| **Consent Management** | 🟡 Partial | Privacy policy exists, need explicit consent checkbox |
| **Data Access** | ❌ Not Implemented | Users can't export data yet |
| **Data Deletion** | ❌ Not Implemented | Users can't delete account yet |
| **Audit Logs** | 🟡 Partial | `audit_logs` table exists, need to log all access |
| **Retention Policy** | ✅ Implemented | Conversations auto-delete after 90 days |
| **Security** | ✅ Implemented | AES-256, TLS 1.3, JWT |

---

### **3.2 Consent Management**

**Implementation:**

```javascript
// netlify/functions/users-update-consent.mjs
export async function handler(event, context) {
  const user = await extractUser(event);
  const { marketing_consent } = JSON.parse(event.body);

  // Update consent
  await sql`
    UPDATE users
    SET marketing_consent = ${marketing_consent},
        marketing_consent_date = NOW(),
        updated_at = NOW()
    WHERE id = ${user.id}
  `;

  // Log consent change (PDPA audit trail)
  await sql`
    INSERT INTO audit_logs (user_id, action, changes, timestamp)
    VALUES (
      ${user.id},
      'consent_updated',
      ${JSON.stringify({ marketing_consent })},
      NOW()
    )
  `;

  return successResponse({ message: 'Consent updated' });
}
```

**Frontend:**
```html
<!-- Signup form -->
<form id="signup-form">
  <input type="email" name="email" required />
  <input type="password" name="password" required />

  <label>
    <input type="checkbox" name="privacy_policy" required />
    I agree to the <a href="/privacy-policy">Privacy Policy</a> *
  </label>

  <label>
    <input type="checkbox" name="marketing_consent" />
    I consent to receiving marketing emails (optional)
  </label>

  <button type="submit">Sign Up</button>
</form>
```

**Timeline:** 2 days (Phase 11.12)

---

### **3.3 Data Access Request (Right to Access)**

**Implementation:**

```javascript
// netlify/functions/users-export-data.mjs
export async function handler(event, context) {
  const user = await extractUser(event);

  // 1. Gather all user data
  const userData = await sql`SELECT * FROM users WHERE id = ${user.id}`;
  const subscriptions = await sql`SELECT * FROM subscriptions WHERE user_id = ${user.id}`;
  const conversations = await sql`SELECT * FROM conversations WHERE user_id = ${user.id}`;
  const quotas = await sql`SELECT * FROM quotas WHERE user_id = ${user.id}`;
  const analytics = await sql`SELECT * FROM analytics WHERE user_id = ${user.id} LIMIT 1000`;

  // 2. Redact sensitive fields
  delete userData[0].password_hash;
  delete userData[0].totp_secret;

  // 3. Format as JSON
  const export_data = {
    user: userData[0],
    subscriptions,
    conversations,
    quotas,
    analytics,
    export_date: new Date().toISOString()
  };

  // 4. Log data access
  await sql`
    INSERT INTO audit_logs (user_id, action, resource_type, timestamp)
    VALUES (${user.id}, 'data_exported', 'user', NOW())
  `;

  // 5. Return JSON download
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="aibradaa-data-${user.id}.json"`
    },
    body: JSON.stringify(export_data, null, 2)
  };
}
```

**Timeline:** 2 days (Phase 11.12)

---

### **3.4 Data Deletion Request (Right to be Forgotten)**

**Implementation:**

```javascript
// netlify/functions/users-delete-account.mjs
export async function handler(event, context) {
  const user = await extractUser(event);
  const { password, confirmation } = JSON.parse(event.body);

  // 1. Verify password
  const userData = await sql`SELECT password_hash FROM users WHERE id = ${user.id}`;
  const valid = await bcrypt.compare(password, userData[0].password_hash);
  if (!valid || confirmation !== 'DELETE MY ACCOUNT') {
    return errorResponse('Invalid password or confirmation text', 401);
  }

  // 2. Cancel active subscriptions
  await sql`
    UPDATE subscriptions
    SET status = 'canceled',
        cancel_at_period_end = TRUE,
        canceled_at = NOW()
    WHERE user_id = ${user.id}
      AND status IN ('active', 'trialing')
  `;

  // 3. Mark user as deleted (soft delete)
  await sql`
    UPDATE users
    SET status = 'deleted',
        email = 'deleted-' || id || '@deleted.aibradaa.com',
        password_hash = NULL,
        totp_secret = NULL,
        updated_at = NOW()
    WHERE id = ${user.id}
  `;

  // 4. Delete conversations (PDPA right to be forgotten)
  await sql`
    DELETE FROM conversations WHERE user_id = ${user.id}
  `;

  // 5. Anonymize analytics (keep for business metrics, remove PII)
  await sql`
    UPDATE analytics
    SET user_id = NULL
    WHERE user_id = ${user.id}
  `;

  // 6. Log deletion
  await sql`
    INSERT INTO audit_logs (user_id, action, timestamp)
    VALUES (${user.id}, 'user_deleted', NOW())
  `;

  // 7. Revoke all sessions
  await sql`
    UPDATE sessions
    SET revoked = TRUE,
        revoked_at = NOW(),
        revocation_reason = 'account_deleted'
    WHERE user_id = ${user.id}
  `;

  return successResponse({ message: 'Account deleted successfully' });
}
```

**Timeline:** 2 days (Phase 11.12)

---

## 🚨 4. Vulnerability Mitigation (OWASP Top 10)

### **4.1 Injection Attacks**

**Risk:** SQL Injection, NoSQL Injection

**Mitigation:**
- ✅ Use parameterized queries (Neon serverless driver automatically escapes)
- ✅ Never concatenate user input into SQL

```javascript
// ❌ BAD: SQL Injection vulnerability
const email = event.queryStringParameters.email;
const user = await sql`SELECT * FROM users WHERE email = '${email}'`;

// ✅ GOOD: Parameterized query
const email = event.queryStringParameters.email;
const user = await sql`SELECT * FROM users WHERE email = ${email}`;
```

---

### **4.2 Broken Authentication**

**Risk:** Weak passwords, session hijacking

**Mitigation:**
- ✅ Password hashing (bcrypt, cost factor 12)
- ✅ JWT with expiry (15 min access token, 30 day refresh token)
- ✅ 2FA (TOTP) for Ultimate tier
- 🟡 Implement rate limiting on login endpoint (future)

```javascript
// netlify/functions/auth-login.mjs
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 5,  // Limit each IP to 5 login attempts per window
  message: 'Too many login attempts, please try again later'
});

export async function handler(event, context) {
  // Check rate limit
  const ip = event.headers['x-forwarded-for'] || event.headers['client-ip'];
  if (await isRateLimited(ip, 'login', 5, 15 * 60)) {
    return errorResponse('Too many login attempts', 429);
  }

  // ... rest of login logic
}
```

**Timeline:** 1 week (Phase 11.12)

---

### **4.3 Sensitive Data Exposure**

**Risk:** Exposing passwords, tokens, API keys

**Mitigation:**
- ✅ Never return `password_hash` in API responses
- ✅ Never log sensitive data (passwords, tokens)
- ✅ Use HTTPS only (TLS 1.3)
- ✅ Store JWT in HttpOnly cookies (not localStorage)

```javascript
// ❌ BAD: Exposing sensitive data
return successResponse({
  user: {
    id: user.id,
    email: user.email,
    password_hash: user.password_hash,  // ❌ NEVER RETURN THIS
    totp_secret: user.totp_secret  // ❌ NEVER RETURN THIS
  }
});

// ✅ GOOD: Only return safe fields
return successResponse({
  user: {
    id: user.id,
    email: user.email,
    nickname: user.nickname,
    tier: user.tier
  }
});
```

---

### **4.4 XML External Entities (XXE)**

**Risk:** N/A (we don't parse XML)

---

### **4.5 Broken Access Control**

**Risk:** User A accesses User B's data

**Mitigation:**
- ✅ Always check `user_id` in database queries
- ✅ Never trust client-provided IDs

```javascript
// ❌ BAD: No access control
const conversation_id = event.queryStringParameters.id;
const conversation = await sql`SELECT * FROM conversations WHERE id = ${conversation_id}`;

// ✅ GOOD: Check ownership
const user = await extractUser(event);
const conversation_id = event.queryStringParameters.id;
const conversation = await sql`
  SELECT * FROM conversations
  WHERE id = ${conversation_id}
    AND user_id = ${user.id}
`;
if (conversation.length === 0) {
  return errorResponse('Conversation not found or access denied', 403);
}
```

---

### **4.6 Security Misconfiguration**

**Risk:** Default credentials, exposed error messages

**Mitigation:**
- ✅ No default credentials (all secrets in Netlify env vars)
- ✅ Error messages don't expose stack traces in production
- ✅ Security headers configured (HSTS, CSP, etc.)

```javascript
// netlify/functions/utils/error-tracker.mjs
export function logError(error, context) {
  // Log full error details to Syeddy Debugger
  console.error('[ERROR]', {
    message: error.message,
    stack: error.stack,
    context
  });

  // Return sanitized error to user
  if (process.env.NODE_ENV === 'production') {
    return {
      error: 'An error occurred. Please try again later.',
      code: 'INTERNAL_ERROR'
    };
  } else {
    return {
      error: error.message,
      stack: error.stack
    };
  }
}
```

---

### **4.7 Cross-Site Scripting (XSS)**

**Risk:** Injecting malicious scripts via user input

**Mitigation:**
- ✅ CSP header blocks inline scripts
- ✅ Sanitize user input before rendering

```javascript
// netlify/functions/utils/sanitize.mjs
import DOMPurify from 'isomorphic-dompurify';

export function sanitizeHTML(dirty) {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
    ALLOWED_ATTR: ['href']
  });
}

// Usage
const user_bio = sanitizeHTML(event.body.bio);
await sql`UPDATE users SET bio = ${user_bio} WHERE id = ${user.id}`;
```

**Timeline:** 2 days (Phase 11.12)

---

### **4.8 Insecure Deserialization**

**Risk:** Arbitrary code execution via JSON deserialization

**Mitigation:**
- ✅ Only accept JSON from trusted sources
- ✅ Validate JSON schema before processing

```javascript
import Ajv from 'ajv';

const ajv = new Ajv();
const schema = {
  type: 'object',
  properties: {
    email: { type: 'string', format: 'email' },
    password: { type: 'string', minLength: 8 }
  },
  required: ['email', 'password'],
  additionalProperties: false
};

const validate = ajv.compile(schema);

export async function handler(event, context) {
  const body = JSON.parse(event.body);

  if (!validate(body)) {
    return errorResponse('Invalid request body', 400, validate.errors);
  }

  // ... rest of logic
}
```

---

### **4.9 Using Components with Known Vulnerabilities**

**Risk:** Outdated npm packages with security flaws

**Mitigation:**
- ✅ Run `npm audit` monthly
- ✅ Automated Dependabot PRs on GitHub

```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# If fix breaks app, review manually
npm audit fix --force
```

**Timeline:** Ongoing (monthly check)

---

### **4.10 Insufficient Logging & Monitoring**

**Risk:** Can't detect breaches or debug issues

**Mitigation:**
- ✅ Audit logs table (logs all data access)
- ✅ Syeddy Debugger (error tracking)
- 🟡 Future: Integrate Sentry or similar

```sql
-- Detect suspicious activity (multiple failed logins)
SELECT user_id, COUNT(*) AS failed_attempts
FROM audit_logs
WHERE action = 'login_failed'
  AND timestamp > NOW() - INTERVAL '15 minutes'
GROUP BY user_id
HAVING COUNT(*) > 5;
```

---

## 🚨 5. Incident Response Plan

### **5.1 Security Breach Procedure**

**Steps:**

1. **Detect Breach**
   - Unusual database queries
   - Spike in failed login attempts
   - User reports unauthorized access

2. **Contain Breach**
   - Revoke all JWT tokens (update JWT secret key)
   - Disable affected accounts
   - Block attacker IP ranges

3. **Investigate**
   - Review audit logs
   - Identify compromised accounts
   - Determine attack vector

4. **Notify Users (PDPA Requirement)**
   - Email affected users within 72 hours
   - Explain what data was compromised
   - Advise password reset

5. **Remediate**
   - Patch vulnerability
   - Deploy fix to production
   - Verify no backdoors remain

6. **Post-Mortem**
   - Document incident
   - Update security policies
   - Conduct security training

**Contacts:**
- Security Lead: security@aibradaa.com
- PDPA Officer: pdpa@aibradaa.com
- Malaysia PDPA Commissioner: (if breach affects >1000 users)

---

## 📅 Implementation Timeline

| Phase | Task | Duration | Target Date |
|-------|------|----------|-------------|
| **11.11** | JWT RS256 migration | 2 weeks | 2025-11-25 |
| **11.11** | OAuth2 (Google, Facebook, GitHub) | 3 weeks | 2025-12-16 |
| **11.12** | 2FA (TOTP) | 1 week | 2025-12-23 |
| **11.12** | Application-level encryption (TOTP secrets) | 3 days | 2025-12-26 |
| **11.12** | PDPA consent management | 2 days | 2025-12-28 |
| **11.12** | Data export (Right to Access) | 2 days | 2025-12-30 |
| **11.12** | Data deletion (Right to be Forgotten) | 2 days | 2026-01-01 |
| **11.12** | XSS sanitization | 2 days | 2026-01-03 |
| **11.12** | Rate limiting (login, API) | 1 week | 2026-01-10 |
| **12.1** | Security audit (external firm) | 2 weeks | 2026-01-24 |
| **12.1** | Penetration testing | 1 week | 2026-01-31 |

**Total Duration:** ~12 weeks (Nov 2025 - Jan 2026)
**Target Production Launch:** February 2026 (Phase 12)

---

## ✅ Security Checklist (Pre-Launch)

- [ ] JWT uses RS256 (asymmetric) with 15-min expiry
- [ ] Refresh token flow implemented
- [ ] OAuth2 (Google, Facebook, GitHub) working
- [ ] 2FA (TOTP) available for Ultimate tier
- [ ] TOTP secrets encrypted with AES-256
- [ ] Password reset flow secure (email verification)
- [ ] PDPA consent checkbox on signup
- [ ] Data export endpoint working
- [ ] Data deletion endpoint working
- [ ] Audit logs capture all data access
- [ ] Rate limiting on login (5 attempts/15 min)
- [ ] Rate limiting on API (tier-based)
- [ ] XSS sanitization on user input
- [ ] SQL injection prevention (parameterized queries)
- [ ] HTTPS enforced (TLS 1.3)
- [ ] Security headers configured (HSTS, CSP, etc.)
- [ ] Error messages don't expose sensitive info
- [ ] Secrets stored in Netlify env vars (not Git)
- [ ] npm audit clean (no high/critical vulnerabilities)
- [ ] Security audit by external firm passed
- [ ] Penetration testing passed
- [ ] Incident response plan documented

---

**Document Status:** ✅ Implementation Roadmap
**Next Review:** 2026-02-01 (Pre-Phase 12 Launch)
**Owner:** AI Bradaa Security Team

**Related Documents:**
- `DATABASE_SCHEMA_SPECIFICATION.md` - Database security (encryption, audit logs)
- `.env.example` - Environment variables (JWT keys, OAuth secrets)
- `ARCHITECTURE.md` - System architecture
