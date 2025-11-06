/**
 * Verify Routes
 * Handles verification of Deck exports (watermark authenticity)
 */

import express from 'express';
import crypto from 'crypto';
import { config } from '../config.mjs';

const router = express.Router();

/**
 * POST /api/verify/export
 * Verify authenticity of an exported Deck
 */
router.post('/export', async (req, res) => {
  try {
    const { content, signature } = req.body;

    if (!content || !signature) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Content and signature are required',
      });
    }

    // Verify signature
    const expectedSignature = generateSignature(content);
    const isValid = signature === expectedSignature;

    res.json({
      success: true,
      data: {
        valid: isValid,
        verified: isValid,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Verification error:', error);

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to verify export',
    });
  }
});

/**
 * POST /api/verify/watermark
 * Check if content contains valid AI Bradaa watermark
 */
router.post('/watermark', async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Content is required',
      });
    }

    // Check for watermark patterns
    const watermarkPatterns = [
      /Powered by AI Bradaa/i,
      /www\.aibradaa\.com/i,
      /84-Mentor Council/i,
    ];

    const hasWatermark = watermarkPatterns.some((pattern) => pattern.test(content));

    // Extract metadata if present
    let metadata = null;
    const metadataMatch = content.match(/<!--\s*AI_BRADAA_META:\s*({.*?})\s*-->/s);
    if (metadataMatch) {
      try {
        metadata = JSON.parse(metadataMatch[1]);
      } catch (e) {
        console.warn('Failed to parse metadata:', e);
      }
    }

    res.json({
      success: true,
      data: {
        hasWatermark,
        authentic: hasWatermark,
        metadata,
      },
    });
  } catch (error) {
    console.error('Watermark check error:', error);

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to check watermark',
    });
  }
});

/**
 * Generate signature for content
 * Uses HMAC-SHA256 with secret key
 */
function generateSignature(content) {
  const secret = config.auth.jwtSecret;
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(content);
  return hmac.digest('hex');
}

export default router;
