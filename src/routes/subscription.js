const express = require('express');
const { authenticate } = require('../middleware/auth');
const { catchAsync, AppError } = require('../middleware/errorHandler');
const StripeService = require('../services/stripeService');
const User = require('../models/User');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @swagger
 * /api/v1/subscription/plans:
 *   get:
 *     summary: Get available subscription plans
 *     tags: [Subscription]
 *     responses:
 *       200:
 *         description: Available plans retrieved successfully
 */
router.get('/plans', catchAsync(async (req, res) => {
  const plans = StripeService.getPlans();

  res.json({
    success: true,
    data: plans
  });
}));

/**
 * @swagger
 * /api/v1/subscription/current:
 *   get:
 *     summary: Get current subscription status
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current subscription retrieved successfully
 */
router.get('/current', authenticate, catchAsync(async (req, res) => {
  const userId = req.user.id;
  const subscription = await StripeService.getSubscription(userId);

  if (!subscription) {
    throw new AppError('No subscription found', 404);
  }

  res.json({
    success: true,
    data: {
      planType: subscription.plan_type,
      status: subscription.status,
      price: subscription.price,
      currentPeriodStart: subscription.current_period_start,
      currentPeriodEnd: subscription.current_period_end,
      aiRequestsUsed: subscription.ai_requests_used,
      aiRequestsLimit: subscription.ai_requests_limit,
      features: typeof subscription.features === 'string'
        ? JSON.parse(subscription.features)
        : subscription.features,
      canceledAt: subscription.canceled_at
    }
  });
}));

/**
 * @swagger
 * /api/v1/subscription/create:
 *   post:
 *     summary: Create a new subscription
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - priceId
 *               - paymentMethodId
 *             properties:
 *               priceId:
 *                 type: string
 *                 description: Stripe price ID
 *               paymentMethodId:
 *                 type: string
 *                 description: Stripe payment method ID
 *     responses:
 *       200:
 *         description: Subscription created successfully
 */
router.post('/create', authenticate, catchAsync(async (req, res) => {
  const { priceId, paymentMethodId } = req.body;
  const userId = req.user.id;

  if (!priceId || !paymentMethodId) {
    throw new AppError('Price ID and payment method ID are required', 400);
  }

  // Check if user already has an active subscription
  const existingSubscription = await StripeService.getSubscription(userId);
  if (existingSubscription && existingSubscription.status === 'active') {
    throw new AppError('User already has an active subscription', 400);
  }

  // Create Stripe customer if doesn't exist
  if (!existingSubscription?.stripe_customer_id) {
    await StripeService.createCustomer(
      userId,
      req.user.email,
      `${req.user.firstName} ${req.user.lastName}`
    );
  }

  const subscription = await StripeService.createSubscription(userId, priceId, paymentMethodId);

  logger.info(`Subscription created for user: ${req.user.email}`);

  res.json({
    success: true,
    message: 'Subscription created successfully',
    data: {
      subscriptionId: subscription.id,
      status: subscription.status,
      clientSecret: subscription.latest_invoice.payment_intent.client_secret
    }
  });
}));

/**
 * @swagger
 * /api/v1/subscription/update:
 *   put:
 *     summary: Update subscription plan
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - priceId
 *             properties:
 *               priceId:
 *                 type: string
 *                 description: New Stripe price ID
 *     responses:
 *       200:
 *         description: Subscription updated successfully
 */
router.put('/update', authenticate, catchAsync(async (req, res) => {
  const { priceId } = req.body;
  const userId = req.user.id;

  if (!priceId) {
    throw new AppError('Price ID is required', 400);
  }

  const subscription = await StripeService.updateSubscription(userId, priceId);

  logger.info(`Subscription updated for user: ${req.user.email}`);

  res.json({
    success: true,
    message: 'Subscription updated successfully',
    data: {
      subscriptionId: subscription.id,
      status: subscription.status
    }
  });
}));

/**
 * @swagger
 * /api/v1/subscription/cancel:
 *   post:
 *     summary: Cancel subscription
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscription canceled successfully
 */
router.post('/cancel', authenticate, catchAsync(async (req, res) => {
  const userId = req.user.id;

  const subscription = await StripeService.cancelSubscription(userId);

  logger.info(`Subscription canceled for user: ${req.user.email}`);

  res.json({
    success: true,
    message: 'Subscription will be canceled at the end of the current billing period',
    data: {
      subscriptionId: subscription.id,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000)
    }
  });
}));

/**
 * @swagger
 * /api/v1/subscription/usage:
 *   get:
 *     summary: Get subscription usage statistics
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Usage statistics retrieved successfully
 */
router.get('/usage', authenticate, catchAsync(async (req, res) => {
  const userId = req.user.id;
  const subscription = await StripeService.getSubscription(userId);

  if (!subscription) {
    throw new AppError('No subscription found', 404);
  }

  const canUseAI = await StripeService.canUseAI(userId);

  res.json({
    success: true,
    data: {
      aiRequestsUsed: subscription.ai_requests_used,
      aiRequestsLimit: subscription.ai_requests_limit,
      remainingRequests: subscription.ai_requests_limit === -1
        ? 'unlimited'
        : subscription.ai_requests_limit - subscription.ai_requests_used,
      canUseAI,
      periodStart: subscription.current_period_start,
      periodEnd: subscription.current_period_end
    }
  });
}));

/**
 * @swagger
 * /api/v1/subscription/webhook:
 *   post:
 *     summary: Handle Stripe webhooks
 *     tags: [Subscription]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 */
router.post('/webhook', express.raw({ type: 'application/json' }), catchAsync(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new AppError('Webhook secret not configured', 500);
  }

  let event;

  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    logger.error('Webhook signature verification failed:', err.message);
    throw new AppError('Invalid webhook signature', 400);
  }

  await StripeService.handleWebhook(event);

  logger.info(`Webhook processed: ${event.type}`);

  res.json({ received: true });
}));

/**
 * @swagger
 * /api/v1/subscription/payment-methods:
 *   get:
 *     summary: Get customer payment methods
 *     tags: [Subscription]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payment methods retrieved successfully
 */
router.get('/payment-methods', authenticate, catchAsync(async (req, res) => {
  const userId = req.user.id;
  const subscription = await StripeService.getSubscription(userId);

  if (!subscription?.stripe_customer_id) {
    throw new AppError('No customer found', 404);
  }

  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  const paymentMethods = await stripe.paymentMethods.list({
    customer: subscription.stripe_customer_id,
    type: 'card',
  });

  res.json({
    success: true,
    data: paymentMethods.data
  });
}));

module.exports = router;