/**
 * Stripe Webhook Handler
 * Handle Stripe subscription events
 * Update user tier in database
 * Send confirmation emails
 *
 * 84-Mentor Approved: Revenue Protection System
 * Handles:
 * - checkout.session.completed
 * - customer.subscription.created
 * - customer.subscription.updated
 * - customer.subscription.deleted
 * - invoice.payment_succeeded
 * - invoice.payment_failed
 */

import Stripe from 'stripe';
import {
  successResponse,
  errorResponse,
  parseBody,
} from './utils/response.mjs';
import db from '../../database/connection.mjs';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

/**
 * Stripe price ID to tier mapping
 * Based on /configs/tiers.json
 */
const PRICE_ID_TO_TIER = {
  [process.env.STRIPE_PRICE_ID_PRO]: 'pro',
  [process.env.STRIPE_PRICE_ID_ULTIMATE]: 'ultimate',
  [process.env.STRIPE_PRICE_ID_ENTERPRISE]: 'enterprise', // Phase 2
};

/**
 * Update user tier in database
 */
async function updateUserTier(userId, tier, subscriptionId, metadata = {}) {
  try {
    if (!db.isHealthy()) {
      await db.connect();
    }

    await db.query(
      `UPDATE users
       SET tier = $1,
           stripe_subscription_id = $2,
           subscription_metadata = $3,
           updated_at = NOW()
       WHERE id = $4`,
      [tier, subscriptionId, JSON.stringify(metadata), userId]
    );

    console.log(`[Stripe] Updated user ${userId} to tier: ${tier}`);

  } catch (error) {
    console.error('[Stripe] Failed to update user tier:', error);
    throw error;
  }
}

/**
 * Cancel user subscription (downgrade to free)
 */
async function cancelUserSubscription(userId, subscriptionId) {
  try {
    if (!db.isHealthy()) {
      await db.connect();
    }

    await db.query(
      `UPDATE users
       SET tier = 'free',
           stripe_subscription_id = NULL,
           subscription_metadata = NULL,
           subscription_cancelled_at = NOW(),
           updated_at = NOW()
       WHERE id = $1 AND stripe_subscription_id = $2`,
      [userId, subscriptionId]
    );

    console.log(`[Stripe] Cancelled subscription for user ${userId}`);

  } catch (error) {
    console.error('[Stripe] Failed to cancel subscription:', error);
    throw error;
  }
}

/**
 * Log webhook event
 */
async function logWebhookEvent(eventId, eventType, data, status = 'success', errorMessage = null) {
  try {
    if (!db.isHealthy()) {
      await db.connect();
    }

    await db.query(
      `INSERT INTO stripe_webhook_log (event_id, event_type, data, status, error_message, timestamp)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (event_id) DO NOTHING`,
      [eventId, eventType, JSON.stringify(data), status, errorMessage]
    );

  } catch (error) {
    console.error('[Stripe] Failed to log webhook event:', error);
    // Don't throw - logging failure shouldn't block webhook processing
  }
}

/**
 * Send confirmation email (placeholder)
 */
async function sendConfirmationEmail(userId, eventType, tier) {
  try {
    // TODO: Integrate with email service (SendGrid, SES, etc.)
    console.log(`[Stripe] Sending email to user ${userId}: ${eventType} (tier: ${tier})`);

    // Placeholder for email service integration
    if (process.env.EMAIL_WEBHOOK_URL) {
      await fetch(process.env.EMAIL_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          eventType,
          tier,
          timestamp: new Date().toISOString(),
        }),
      });
    }

  } catch (error) {
    console.error('[Stripe] Failed to send confirmation email:', error);
    // Don't throw - email failure shouldn't block webhook processing
  }
}

/**
 * Handle checkout.session.completed
 */
async function handleCheckoutCompleted(session) {
  console.log('[Stripe] Handling checkout.session.completed');

  const userId = session.metadata?.userId;
  const priceId = session.line_items?.data[0]?.price?.id;

  if (!userId) {
    throw new Error('Missing userId in session metadata');
  }

  if (!priceId) {
    throw new Error('Missing price ID in session line items');
  }

  const tier = PRICE_ID_TO_TIER[priceId];

  if (!tier) {
    throw new Error(`Unknown price ID: ${priceId}`);
  }

  // Update user tier
  await updateUserTier(userId, tier, session.subscription, {
    checkoutSessionId: session.id,
    priceId,
    amountTotal: session.amount_total,
    currency: session.currency,
  });

  // Send confirmation email
  await sendConfirmationEmail(userId, 'checkout_completed', tier);
}

/**
 * Handle customer.subscription.created
 */
async function handleSubscriptionCreated(subscription) {
  console.log('[Stripe] Handling customer.subscription.created');

  const userId = subscription.metadata?.userId;
  const priceId = subscription.items?.data[0]?.price?.id;

  if (!userId) {
    throw new Error('Missing userId in subscription metadata');
  }

  const tier = PRICE_ID_TO_TIER[priceId] || 'free';

  await updateUserTier(userId, tier, subscription.id, {
    status: subscription.status,
    currentPeriodStart: subscription.current_period_start,
    currentPeriodEnd: subscription.current_period_end,
  });

  await sendConfirmationEmail(userId, 'subscription_created', tier);
}

/**
 * Handle customer.subscription.updated
 */
async function handleSubscriptionUpdated(subscription) {
  console.log('[Stripe] Handling customer.subscription.updated');

  const userId = subscription.metadata?.userId;
  const priceId = subscription.items?.data[0]?.price?.id;

  if (!userId) {
    throw new Error('Missing userId in subscription metadata');
  }

  // Check if subscription is active
  if (subscription.status === 'active') {
    const tier = PRICE_ID_TO_TIER[priceId] || 'free';

    await updateUserTier(userId, tier, subscription.id, {
      status: subscription.status,
      currentPeriodStart: subscription.current_period_start,
      currentPeriodEnd: subscription.current_period_end,
    });
  } else if (['canceled', 'unpaid', 'incomplete_expired'].includes(subscription.status)) {
    // Downgrade to free
    await cancelUserSubscription(userId, subscription.id);
  }
}

/**
 * Handle customer.subscription.deleted
 */
async function handleSubscriptionDeleted(subscription) {
  console.log('[Stripe] Handling customer.subscription.deleted');

  const userId = subscription.metadata?.userId;

  if (!userId) {
    throw new Error('Missing userId in subscription metadata');
  }

  await cancelUserSubscription(userId, subscription.id);
  await sendConfirmationEmail(userId, 'subscription_cancelled', 'free');
}

/**
 * Handle invoice.payment_succeeded
 */
async function handlePaymentSucceeded(invoice) {
  console.log('[Stripe] Handling invoice.payment_succeeded');

  const subscriptionId = invoice.subscription;

  if (!subscriptionId) {
    // One-time payment, not a subscription
    return;
  }

  // Fetch subscription to get metadata
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const userId = subscription.metadata?.userId;

  if (!userId) {
    throw new Error('Missing userId in subscription metadata');
  }

  const priceId = subscription.items?.data[0]?.price?.id;
  const tier = PRICE_ID_TO_TIER[priceId] || 'free';

  // Ensure tier is still active
  await updateUserTier(userId, tier, subscriptionId, {
    status: subscription.status,
    currentPeriodStart: subscription.current_period_start,
    currentPeriodEnd: subscription.current_period_end,
    lastPaymentDate: invoice.created,
  });

  await sendConfirmationEmail(userId, 'payment_succeeded', tier);
}

/**
 * Handle invoice.payment_failed
 */
async function handlePaymentFailed(invoice) {
  console.log('[Stripe] Handling invoice.payment_failed');

  const subscriptionId = invoice.subscription;

  if (!subscriptionId) {
    return;
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const userId = subscription.metadata?.userId;

  if (!userId) {
    throw new Error('Missing userId in subscription metadata');
  }

  // Send payment failed notification
  await sendConfirmationEmail(userId, 'payment_failed', subscription.tier);

  // TODO: Implement grace period logic
  // - Don't immediately downgrade
  // - Allow 3-day grace period (from /configs/tiers.json)
  // - Send reminder emails
}

/**
 * Main webhook handler
 */
export async function handler(event, context) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return errorResponse('Method not allowed', 405);
  }

  const sig = event.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('[Stripe] STRIPE_WEBHOOK_SECRET not configured');
    return errorResponse('Webhook secret not configured', 500);
  }

  let stripeEvent;

  try {
    // Verify webhook signature
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      webhookSecret
    );

  } catch (error) {
    console.error('[Stripe] Webhook signature verification failed:', error.message);
    return errorResponse('Invalid signature', 400);
  }

  console.log(`[Stripe] Webhook received: ${stripeEvent.type} (${stripeEvent.id})`);

  try {
    // Handle event
    switch (stripeEvent.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(stripeEvent.data.object);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(stripeEvent.data.object);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(stripeEvent.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(stripeEvent.data.object);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(stripeEvent.data.object);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(stripeEvent.data.object);
        break;

      default:
        console.log(`[Stripe] Unhandled event type: ${stripeEvent.type}`);
    }

    // Log event as success
    await logWebhookEvent(stripeEvent.id, stripeEvent.type, stripeEvent.data.object, 'success');

    return successResponse({
      success: true,
      received: true,
      eventId: stripeEvent.id,
      eventType: stripeEvent.type,
    });

  } catch (error) {
    console.error('[Stripe] Webhook processing error:', error);

    // Log event as failed
    await logWebhookEvent(stripeEvent.id, stripeEvent.type, stripeEvent.data.object, 'failed', error.message);

    return errorResponse(
      'Webhook processing failed',
      500,
      process.env.NODE_ENV !== 'production' ? error.message : null
    );
  }
}
