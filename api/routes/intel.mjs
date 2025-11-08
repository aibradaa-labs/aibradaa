/**
 * Intel Routes
 * Handles laptop news, price drops, and ETL refresh triggers
 */

import express from 'express';
import { requireTier } from '../middleware/auth.mjs';
import { applyTierLimiter } from '../middleware/rate-limit.mjs';

const router = express.Router();

/**
 * GET /api/intel/feed
 * Get aggregated laptop news and price drops
 */
router.get('/feed', applyTierLimiter, async (req, res) => {
  try {
    const { limit = 20, offset = 0, category = 'all' } = req.query;

    // Mock data for now (in production, fetch from database)
    const feed = generateMockFeed(parseInt(limit), parseInt(offset), category);

    res.json({
      success: true,
      data: {
        items: feed,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: 100, // Mock total
        },
      },
    });
  } catch (error) {
    console.error('Intel feed error:', error);

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch Intel feed',
    });
  }
});

/**
 * POST /api/intel/refresh
 * Trigger ETL refresh (Pro/Ultimate only)
 */
router.post('/refresh', requireTier('pro'), async (req, res) => {
  try {
    const { source = 'all' } = req.body;

    // Trigger ETL refresh asynchronously
    // In production, this would queue a job
    console.log(`ETL refresh triggered by user ${req.user.id} for source: ${source}`);

    // Mock response
    const jobId = `etl-${Date.now()}`;

    res.json({
      success: true,
      data: {
        jobId,
        status: 'queued',
        message: 'ETL refresh has been queued. Check back in a few minutes.',
        source,
      },
    });
  } catch (error) {
    console.error('Intel refresh error:', error);

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to trigger refresh',
    });
  }
});

/**
 * GET /api/intel/price-drops
 * Get recent price drops
 */
router.get('/price-drops', applyTierLimiter, async (req, res) => {
  try {
    const { days = 7, minDiscount = 10 } = req.query;

    // Mock data
    const priceDrops = [
      {
        id: 'macbook-pro-14-m4',
        name: 'MacBook Pro 14" M4',
        oldPrice: 7999,
        newPrice: 7199,
        discount: 10,
        percentage: 10.0,
        currency: 'MYR',
        source: 'Lazada',
        timestamp: new Date().toISOString(),
      },
      {
        id: 'asus-rog-zephyrus-g14',
        name: 'ASUS ROG Zephyrus G14',
        oldPrice: 5499,
        newPrice: 4799,
        discount: 12.73,
        percentage: 12.73,
        currency: 'MYR',
        source: 'Shopee',
        timestamp: new Date().toISOString(),
      },
    ];

    res.json({
      success: true,
      data: {
        priceDrops,
        filters: {
          days: parseInt(days),
          minDiscount: parseFloat(minDiscount),
        },
      },
    });
  } catch (error) {
    console.error('Price drops error:', error);

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch price drops',
    });
  }
});

/**
 * Generate mock Intel feed
 */
function generateMockFeed(limit, offset, category) {
  const categories = ['news', 'price-drop', 'new-release', 'deal'];
  const items = [];

  for (let i = offset; i < offset + limit; i++) {
    const itemCategory = category === 'all' ? categories[i % categories.length] : category;

    items.push({
      id: `intel-${i}`,
      category: itemCategory,
      title: `${itemCategory === 'news' ? 'Breaking' : 'Hot'}: Sample Intel Item ${i}`,
      description: 'This is a sample Intel feed item for testing.',
      url: `${process.env.APP_URL || 'https://www.aibradaa.com'}/intel/${i}`,
      source: ['TechNave', 'SoyaCincau', 'Lowyat'][i % 3],
      timestamp: new Date(Date.now() - i * 3600000).toISOString(),
      metadata: {
        views: Math.floor(Math.random() * 1000),
        upvotes: Math.floor(Math.random() * 100),
      },
    });
  }

  return items;
}

export default router;
