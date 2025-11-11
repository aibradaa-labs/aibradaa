/**
 * ABO-84 Access Control Middleware
 * Version: 1.0.0
 *
 * CRITICAL: ABO-84 Beta is EXCLUSIVE to Ultimate tier (RM80/month) ONLY
 *
 * Access Policy:
 * ✅ Ultimate tier (RM80/month) - Full access to all ABO-84 features
 * ❌ Pro tier (RM30/month) - NO ACCESS
 * ❌ Free tier (RM0/month) - NO ACCESS
 * ❌ Public/Unauthenticated - NO ACCESS
 */

import tiersConfig from '../../configs/tiers.json' with { type: 'json' };

/**
 * Check if user has ABO-84 access based on their tier
 * @param {string} tier - User's subscription tier ('free', 'pro', 'ultimate')
 * @returns {{hasAccess: boolean, reason: string, upgradeUrl: string|null}}
 */
export function checkABO84Access(tier) {
  const tierConfig = tiersConfig.tiers[tier];

  if (!tierConfig) {
    return {
      hasAccess: false,
      reason: 'Invalid tier',
      upgradeUrl: null
    };
  }

  const abo84Config = tierConfig.features.abo84;

  if (!abo84Config || !abo84Config.access) {
    return {
      hasAccess: false,
      reason: abo84Config?.reason || 'ABO-84 Beta requires Ultimate tier',
      upgradeUrl: '/pricing.html#ultimate',
      requiredTier: 'ultimate',
      requiredPrice: 'RM80/month'
    };
  }

  return {
    hasAccess: true,
    downloads: abo84Config.downloads,
    features: abo84Config.features
  };
}

/**
 * Middleware for ABO-84 download endpoints
 * Blocks all non-Ultimate users from accessing ABO-84 downloads
 */
export async function requireUltimateTier(handler) {
  return async (event, context) => {
    // Get user from auth context
    const user = context.clientContext?.user || event.headers['x-user-tier'];

    if (!user) {
      return {
        statusCode: 401,
        body: JSON.stringify({
          error: 'Unauthorized',
          message: 'Authentication required to access ABO-84',
          loginUrl: '/auth.html'
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
        body: JSON.stringify({
          error: 'Access Denied',
          message: accessCheck.reason,
          currentTier: userTier,
          requiredTier: accessCheck.requiredTier,
          requiredPrice: accessCheck.requiredPrice,
          upgradeUrl: accessCheck.upgradeUrl,
          note: 'ABO-84 Beta is a premium coding assistant exclusive to Ultimate tier subscribers.'
        })
      };
    }

    // User has access, proceed with handler
    return handler(event, context);
  };
}

/**
 * Get available ABO-84 downloads for user's tier
 * @param {string} tier - User's tier
 * @returns {object} Available downloads
 */
export function getAvailableDownloads(tier) {
  const accessCheck = checkABO84Access(tier);

  if (!accessCheck.hasAccess) {
    return {
      available: [],
      message: accessCheck.reason,
      upgradeUrl: accessCheck.upgradeUrl
    };
  }

  const downloads = [];

  // Desktop downloads
  if (accessCheck.downloads.desktop) {
    if (accessCheck.downloads.desktop.windows) {
      downloads.push({
        platform: 'windows',
        name: 'ABO-84 Beta for Windows',
        format: '.exe',
        url: '/downloads/abo84/abo84-setup-windows.exe',
        size: '~120 MB',
        requirements: 'Windows 10/11 (64-bit)'
      });
    }
    if (accessCheck.downloads.desktop.macos) {
      downloads.push({
        platform: 'macos',
        name: 'ABO-84 Beta for macOS',
        format: '.dmg',
        url: '/downloads/abo84/abo84-setup-macos.dmg',
        size: '~110 MB',
        requirements: 'macOS 11+ (Intel & Apple Silicon)'
      });
    }
    if (accessCheck.downloads.desktop.linux) {
      downloads.push({
        platform: 'linux',
        name: 'ABO-84 Beta for Linux',
        format: '.AppImage',
        url: '/downloads/abo84/abo84-linux.AppImage',
        size: '~115 MB',
        requirements: 'Ubuntu 20.04+, Debian 11+, Fedora 35+'
      });
    }
  }

  // VS Code Extension
  if (accessCheck.downloads.vscodeExtension) {
    downloads.push({
      platform: 'vscode',
      name: 'ABO-84 VS Code Extension',
      format: '.vsix',
      url: 'https://marketplace.visualstudio.com/items?itemName=aibradaa.abo84-beta',
      size: '~8 MB',
      requirements: 'VS Code 1.85+'
    });
  }

  // CLI Tool
  if (accessCheck.downloads.cli) {
    downloads.push({
      platform: 'cli',
      name: 'ABO-84 CLI',
      format: 'npm',
        installCommand: 'npm install -g abo84-beta',
      url: 'https://www.npmjs.com/package/abo84-beta',
      size: '~25 MB',
      requirements: 'Node.js 18+'
    });
  }

  // Ollama Integration
  if (accessCheck.downloads.ollama) {
    downloads.push({
      platform: 'ollama',
      name: 'ABO-84 for Ollama',
      format: 'ollama',
      installCommand: 'ollama install aibradaa/abo84-beta',
      url: 'https://ollama.com/aibradaa/abo84-beta',
      size: '~3.5 GB',
      requirements: 'Ollama 0.1.0+'
    });
  }

  return {
    available: downloads,
    totalCount: downloads.length,
    features: accessCheck.features
  };
}

/**
 * Validate ABO-84 license key (for offline activation)
 * @param {string} licenseKey - License key from user
 * @param {string} userId - User ID
 * @returns {{valid: boolean, tier: string, expiresAt: string}}
 */
export async function validateABO84License(licenseKey, userId) {
  // TODO: Implement license validation logic
  // For now, check if user has Ultimate tier subscription

  // License format: ABO84-ULTIMATE-{userId}-{timestamp}-{checksum}
  const parts = licenseKey.split('-');

  if (parts[0] !== 'ABO84' || parts[1] !== 'ULTIMATE') {
    return {
      valid: false,
      error: 'Invalid license key format'
    };
  }

  // TODO: Verify checksum, expiry, user ID match

  return {
    valid: true,
    tier: 'ultimate',
    userId: parts[2],
    issuedAt: new Date(parseInt(parts[3])),
    expiresAt: null // Ultimate licenses don't expire while subscription active
  };
}

export default {
  checkABO84Access,
  requireUltimateTier,
  getAvailableDownloads,
  validateABO84License
};
