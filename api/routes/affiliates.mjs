/**
 * Affiliates Routes
 * Handles affiliate link redirects and tracking
 */

import express from 'express';

const router = express.Router();

/**
 * In-memory affiliate tracking
 * In production, store in database
 */
const clicks = new Map();

/**
 * GET /out/:id/:slug
 * Affiliate redirect with tracking
 */
router.get('/:id/:slug', async (req, res) => {
  try {
    const { id, slug } = req.params;
    const { ref = 'aibradaa' } = req.query;

    // Track click
    const clickId = `${id}-${slug}`;
    const clickData = {
      id: clickId,
      laptopId: id,
      slug,
      timestamp: new Date().toISOString(),
      userAgent: req.get('user-agent'),
      ip: req.ip,
      referer: req.get('referer'),
      ref,
    };

    // Store click
    if (!clicks.has(clickId)) {
      clicks.set(clickId, []);
    }
    clicks.get(clickId).push(clickData);

    // Log for analytics
    console.log('Affiliate click:', clickData);

    // Get redirect URL from affiliate mappings
    const redirectUrl = getAffiliateUrl(id, slug);

    if (!redirectUrl) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Affiliate link not found',
      });
    }

    // Redirect to affiliate URL
    res.redirect(302, redirectUrl);
  } catch (error) {
    console.error('Affiliate redirect error:', error);

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to process affiliate redirect',
    });
  }
});

/**
 * GET /api/affiliates/stats
 * Get affiliate click statistics (admin only)
 */
router.get('/stats', async (req, res) => {
  try {
    // In production, check admin role
    const stats = {
      totalClicks: Array.from(clicks.values()).reduce((sum, arr) => sum + arr.length, 0),
      uniqueProducts: clicks.size,
      clicksByProduct: {},
    };

    clicks.forEach((clickArray, productId) => {
      stats.clicksByProduct[productId] = {
        count: clickArray.length,
        lastClick: clickArray[clickArray.length - 1]?.timestamp,
      };
    });

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Affiliate stats error:', error);

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch affiliate stats',
    });
  }
});

/**
 * Get affiliate URL for a laptop
 * In production, load from configs/affiliate.json
 */
function getAffiliateUrl(laptopId, slug) {
  // Mock affiliate mappings
  const affiliates = {
    'macbook-pro-14-m4': {
      lazada: 'https://www.lazada.com.my/products/macbook-pro-14-m4?aff_token=YOUR_TOKEN',
      shopee: 'https://shopee.com.my/macbook-pro-14-m4?aff_sid=YOUR_SID',
    },
    'asus-rog-zephyrus-g14': {
      lazada: 'https://www.lazada.com.my/products/asus-rog-zephyrus-g14?aff_token=YOUR_TOKEN',
      shopee: 'https://shopee.com.my/asus-rog-zephyrus-g14?aff_sid=YOUR_SID',
    },
  };

  // Default to Lazada if no slug specified
  const platform = slug || 'lazada';
  const urls = affiliates[laptopId];

  if (!urls) {
    return null;
  }

  return urls[platform] || urls.lazada || null;
}

export default router;
