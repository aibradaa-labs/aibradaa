/**
 * ABO-84 Downloads API
 * GET /api/abo84-downloads
 *
 * Returns available ABO-84 downloads based on user's tier
 * ULTIMATE TIER ONLY - All others blocked
 */

import { getAvailableDownloads, checkABO84Access } from './utils/abo84-access.mjs';

export async function handler(event, context) {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  // Handle OPTIONS for CORS
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  // Only GET allowed
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Get user from auth context or headers
    const user = context.clientContext?.user || JSON.parse(event.headers['x-user-context'] || '{}');

    if (!user || !user.id) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({
          error: 'Unauthorized',
          message: 'Please log in to access ABO-84 downloads',
          loginUrl: '/auth.html',
          abo84: {
            name: 'ABO-84 Beta',
            description: 'AI-powered coding assistant exclusive to Ultimate tier',
            requiredTier: 'Ultimate',
            requiredPrice: 'RM80/month'
          }
        })
      };
    }

    // Get user's tier
    const userTier = user.tier || user.subscription?.tier || 'free';

    // Check ABO-84 access
    const accessCheck = checkABO84Access(userTier);

    if (!accessCheck.hasAccess) {
      return {
        statusCode: 403,
        headers,
        body: JSON.stringify({
          error: 'Access Denied',
          message: 'ABO-84 Beta is exclusive to Ultimate tier subscribers',
          currentTier: userTier,
          currentPrice: userTier === 'free' ? 'RM0/month' : (userTier === 'pro' ? 'RM30/month' : 'Unknown'),
          requiredTier: 'ultimate',
          requiredPrice: 'RM80/month',
          upgradeUrl: '/pricing.html#ultimate',
          benefits: [
            'Desktop app for Windows, macOS, and Linux',
            'VS Code extension for integrated coding',
            'CLI tool for terminal workflows',
            'Ollama integration for local LLM privacy',
            'Advanced code analysis and bug detection',
            'Security vulnerability scanning',
            'Performance optimization suggestions',
            'AI-powered code generation'
          ]
        })
      };
    }

    // User has Ultimate tier - return downloads
    const downloads = getAvailableDownloads(userTier);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        tier: userTier,
        abo84: {
          access: true,
          downloads: downloads.available,
          totalDownloads: downloads.totalCount,
          features: downloads.features
        },
        documentation: {
          quickStart: '/docs/abo84/quick-start',
          vsCodeSetup: '/docs/abo84/vscode-extension',
          cliUsage: '/docs/abo84/cli-guide',
          ollamaIntegration: '/docs/abo84/ollama-setup'
        },
        support: {
          email: 'support@aibradaa.com',
          discord: 'https://discord.gg/aibradaa',
          docs: '/docs/abo84'
        }
      })
    };

  } catch (error) {
    console.error('[ABO-84 Downloads Error]', error);

    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: 'Failed to fetch ABO-84 downloads',
        support: 'support@aibradaa.com'
      })
    };
  }
}
