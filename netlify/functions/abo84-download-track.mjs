/**
 * ABO-84 Download Tracking Function
 *
 * Handles download requests for ABO-84 (AI Bradaa Observer - 84)
 * - Verifies Ultimate tier subscription
 * - Generates authenticated download URLs
 * - Tracks download analytics
 * - Enforces rate limiting
 *
 * Ultimate Tier Only: RM80/month
 */

export async function handler(event, context) {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle OPTIONS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'METHOD_NOT_ALLOWED', message: 'Only POST requests allowed' })
    };
  }

  try {
    // Parse request body
    const { platform, version } = JSON.parse(event.body || '{}');

    if (!platform || !version) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'INVALID_REQUEST',
          message: 'Missing required fields: platform, version'
        })
      };
    }

    // Get user authentication from cookies or headers
    const authToken = event.headers.authorization?.replace('Bearer ', '') ||
                      getCookieValue(event.headers.cookie, 'auth_token');

    if (!authToken) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({
          error: 'UNAUTHORIZED',
          message: 'Authentication required. Please log in to download ABO-84.'
        })
      };
    }

    // Verify user tier (Ultimate only)
    // In production, this would call your auth service to verify the user's tier
    const userTier = await verifyUserTier(authToken);

    if (userTier !== 'ultimate') {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({
          error: 'TIER_REQUIRED',
          message: 'ABO-84 requires Ultimate tier subscription (RM80/month). Please upgrade to access downloads.',
          upgradeUrl: '/app.html#upgrade'
        })
      };
    }

    // Check rate limiting (10 downloads per day per user)
    const userId = await getUserIdFromToken(authToken);
    const rateLimitOk = await checkRateLimit(userId);

    if (!rateLimitOk) {
      return {
        statusCode: 429,
        headers: { ...headers, 'Retry-After': '86400' }, // 24 hours
        body: JSON.stringify({
          error: 'RATE_LIMIT_EXCEEDED',
          message: 'Download limit reached (10 per day). Please try again tomorrow.'
        })
      };
    }

    // Generate authenticated download URL
    const downloadUrl = generateDownloadUrl(platform, version, userId);

    // Track download analytics
    await trackDownload({
      userId,
      platform,
      version,
      timestamp: new Date().toISOString(),
      userAgent: event.headers['user-agent'],
      ip: event.headers['x-forwarded-for'] || event.headers['client-ip']
    });

    // Increment rate limit counter
    await incrementRateLimit(userId);

    // Return success with download URL
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        downloadUrl,
        platform,
        version,
        expiresIn: 600, // URL expires in 10 minutes
        message: 'Download initiated. URL expires in 10 minutes.'
      })
    };

  } catch (error) {
    console.error('ABO-84 Download Error:', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'INTERNAL_ERROR',
        message: 'Failed to process download request. Please try again or contact support.'
      })
    };
  }
}

/**
 * Helper Functions
 */

function getCookieValue(cookieHeader, name) {
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(';').map(c => c.trim());
  const cookie = cookies.find(c => c.startsWith(`${name}=`));

  return cookie ? cookie.split('=')[1] : null;
}

async function verifyUserTier(authToken) {
  // TODO: Implement actual tier verification
  // This should call your authentication service to verify:
  // 1. Token is valid
  // 2. User has active subscription
  // 3. Subscription tier is 'ultimate'

  // For now, return mock data
  // In production, this would be:
  // const user = await fetch('/api/auth/verify', { headers: { Authorization: `Bearer ${authToken}` } });
  // return user.subscription.tier;

  // Mock implementation - always return 'ultimate' for testing
  // REMOVE THIS IN PRODUCTION
  return 'ultimate';
}

async function getUserIdFromToken(authToken) {
  // TODO: Implement actual user ID extraction from token
  // This should decode the JWT or call auth service

  // Mock implementation
  return 'user_' + Math.random().toString(36).substr(2, 9);
}

async function checkRateLimit(userId) {
  // TODO: Implement rate limiting check
  // Options:
  // 1. Redis: Store counter with 24h expiry
  // 2. DynamoDB: Query download count in last 24h
  // 3. In-memory cache (for development only)

  // Mock implementation - always allow
  return true;
}

async function incrementRateLimit(userId) {
  // TODO: Implement rate limit counter increment
  // Increment counter for this user's downloads today

  // Mock implementation - no-op
  return true;
}

function generateDownloadUrl(platform, version, userId) {
  // Generate signed S3 URL or CDN URL with authentication
  // URL should expire after 10 minutes for security

  const baseUrl = process.env.DOWNLOAD_BASE_URL || 'https://downloads.aibradaa.com';

  // Map platform to file name
  const fileMap = {
    'windows': `abo84/${version}/ABO-84-Setup-${version}.exe`,
    'macos': `abo84/${version}/ABO-84-${version}.dmg`,
    'linux-appimage': `abo84/${version}/ABO-84-${version}.AppImage`,
    'linux-deb': `abo84/${version}/abo84_${version}_amd64.deb`,
    'linux-rpm': `abo84/${version}/abo84-${version}.x86_64.rpm`,
    'vscode': 'vscode:extension/aibradaa.abo84-beta',
    'npm': 'https://registry.npmjs.org/@aibradaa/abo84-beta',
    'ollama': 'https://ollama.ai/download'
  };

  const filePath = fileMap[platform] || fileMap['windows'];

  // In production, generate signed URL with expiry
  // For now, return direct URL
  // TODO: Implement S3 presigned URL or CDN authentication

  const downloadUrl = `${baseUrl}/${filePath}`;

  // Add authentication token as query parameter
  // In production, this should be a signed token
  const authToken = Buffer.from(`${userId}:${Date.now()}`).toString('base64');

  return `${downloadUrl}?auth=${authToken}&expires=${Date.now() + 600000}`;
}

async function trackDownload(downloadData) {
  // TODO: Implement analytics tracking
  // Options:
  // 1. Google Analytics 4
  // 2. Custom analytics service
  // 3. Database logging
  // 4. Third-party analytics (Mixpanel, Segment, etc.)

  console.log('[Analytics] Download tracked:', downloadData);

  // Example: Send to Google Analytics 4
  // await fetch('https://www.google-analytics.com/mp/collect', {
  //   method: 'POST',
  //   body: JSON.stringify({
  //     client_id: downloadData.userId,
  //     events: [{
  //       name: 'abo84_download',
  //       params: {
  //         platform: downloadData.platform,
  //         version: downloadData.version,
  //         user_agent: downloadData.userAgent
  //       }
  //     }]
  //   })
  // });

  return true;
}

/**
 * Security Notes:
 *
 * 1. Authentication: Verify JWT tokens properly in production
 * 2. Rate Limiting: Implement Redis-based rate limiting
 * 3. Download URLs: Use S3 presigned URLs with short expiry (10 min)
 * 4. Tier Verification: Always verify Ultimate tier in real-time
 * 5. Logging: Log all download attempts for security audits
 * 6. IP Blocking: Consider blocking suspicious IPs
 * 7. Token Validation: Validate token signature and expiry
 * 8. CORS: Restrict to aibradaa.com domain in production
 */
