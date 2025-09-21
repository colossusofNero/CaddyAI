const Stripe = require('stripe');
const { db } = require('../config/database');
const logger = require('../utils/logger');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const SUBSCRIPTION_PLANS = {
  free: {
    name: 'Free',
    price: 0,
    features: ['basic_calculations', 'limited_requests'],
    aiRequestsLimit: 10
  },
  basic: {
    name: 'Basic',
    price: 9.99,
    priceId: 'price_basic_monthly', // This would be your actual Stripe price ID
    features: ['unlimited_calculations', 'weather_integration', 'basic_analytics'],
    aiRequestsLimit: 100
  },
  premium: {
    name: 'Premium',
    price: 19.99,
    priceId: 'price_premium_monthly',
    features: ['all_basic_features', 'voice_commands', 'advanced_analytics', 'course_mapping'],
    aiRequestsLimit: 500
  },
  professional: {
    name: 'Professional',
    price: 39.99,
    priceId: 'price_professional_monthly',
    features: ['all_premium_features', 'coaching_insights', 'tournament_mode', 'priority_support'],
    aiRequestsLimit: -1 // unlimited
  }
};

class StripeService {
  static async createCustomer(userId, email, name) {
    try {
      const customer = await stripe.customers.create({
        email,
        name,
        metadata: {
          userId: userId
        }
      });

      // Update user's subscription record with Stripe customer ID
      await db('subscriptions').insert({
        user_id: userId,
        stripe_customer_id: customer.id,
        plan_type: 'free',
        status: 'active',
        ai_requests_limit: SUBSCRIPTION_PLANS.free.aiRequestsLimit,
        features: JSON.stringify(SUBSCRIPTION_PLANS.free.features)
      });

      logger.info(`Stripe customer created: ${customer.id} for user: ${userId}`);
      return customer;
    } catch (error) {
      logger.error('Error creating Stripe customer:', error);
      throw error;
    }
  }

  static async createSubscription(userId, priceId, paymentMethodId) {
    try {
      // Get customer
      const subscription = await db('subscriptions').where({ user_id: userId }).first();

      if (!subscription?.stripe_customer_id) {
        throw new Error('Customer not found');
      }

      // Attach payment method to customer
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: subscription.stripe_customer_id,
      });

      // Set as default payment method
      await stripe.customers.update(subscription.stripe_customer_id, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      // Create subscription
      const stripeSubscription = await stripe.subscriptions.create({
        customer: subscription.stripe_customer_id,
        items: [{ price: priceId }],
        payment_settings: {
          payment_method_types: ['card'],
          save_default_payment_method: 'on_subscription',
        },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          userId: userId
        }
      });

      // Update database
      const planType = this.getPlanFromPriceId(priceId);
      await db('subscriptions')
        .where({ user_id: userId })
        .update({
          stripe_subscription_id: stripeSubscription.id,
          plan_type: planType,
          status: stripeSubscription.status,
          price: SUBSCRIPTION_PLANS[planType].price,
          current_period_start: new Date(stripeSubscription.current_period_start * 1000),
          current_period_end: new Date(stripeSubscription.current_period_end * 1000),
          ai_requests_limit: SUBSCRIPTION_PLANS[planType].aiRequestsLimit,
          features: JSON.stringify(SUBSCRIPTION_PLANS[planType].features)
        });

      logger.info(`Subscription created: ${stripeSubscription.id} for user: ${userId}`);
      return stripeSubscription;
    } catch (error) {
      logger.error('Error creating subscription:', error);
      throw error;
    }
  }

  static async cancelSubscription(userId) {
    try {
      const subscription = await db('subscriptions').where({ user_id: userId }).first();

      if (!subscription?.stripe_subscription_id) {
        throw new Error('No active subscription found');
      }

      // Cancel at period end to allow continued access until billing period ends
      const stripeSubscription = await stripe.subscriptions.update(
        subscription.stripe_subscription_id,
        {
          cancel_at_period_end: true
        }
      );

      // Update database
      await db('subscriptions')
        .where({ user_id: userId })
        .update({
          status: 'canceled',
          canceled_at: new Date()
        });

      logger.info(`Subscription canceled: ${subscription.stripe_subscription_id} for user: ${userId}`);
      return stripeSubscription;
    } catch (error) {
      logger.error('Error canceling subscription:', error);
      throw error;
    }
  }

  static async updateSubscription(userId, newPriceId) {
    try {
      const subscription = await db('subscriptions').where({ user_id: userId }).first();

      if (!subscription?.stripe_subscription_id) {
        throw new Error('No active subscription found');
      }

      // Get current subscription
      const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id);

      // Update subscription
      const updatedSubscription = await stripe.subscriptions.update(
        subscription.stripe_subscription_id,
        {
          items: [{
            id: stripeSubscription.items.data[0].id,
            price: newPriceId,
          }],
          proration_behavior: 'always_invoice',
        }
      );

      // Update database
      const planType = this.getPlanFromPriceId(newPriceId);
      await db('subscriptions')
        .where({ user_id: userId })
        .update({
          plan_type: planType,
          price: SUBSCRIPTION_PLANS[planType].price,
          current_period_end: new Date(updatedSubscription.current_period_end * 1000),
          ai_requests_limit: SUBSCRIPTION_PLANS[planType].aiRequestsLimit,
          features: JSON.stringify(SUBSCRIPTION_PLANS[planType].features)
        });

      logger.info(`Subscription updated: ${subscription.stripe_subscription_id} for user: ${userId}`);
      return updatedSubscription;
    } catch (error) {
      logger.error('Error updating subscription:', error);
      throw error;
    }
  }

  static async handleWebhook(event) {
    try {
      switch (event.type) {
        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object);
          break;

        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object);
          break;

        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object);
          break;

        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object);
          break;

        default:
          logger.info(`Unhandled webhook event: ${event.type}`);
      }
    } catch (error) {
      logger.error('Error handling webhook:', error);
      throw error;
    }
  }

  static async handlePaymentSucceeded(invoice) {
    const subscriptionId = invoice.subscription;

    await db('subscriptions')
      .where({ stripe_subscription_id: subscriptionId })
      .update({
        status: 'active',
        ai_requests_used: 0 // Reset monthly usage
      });

    logger.info(`Payment succeeded for subscription: ${subscriptionId}`);
  }

  static async handlePaymentFailed(invoice) {
    const subscriptionId = invoice.subscription;

    await db('subscriptions')
      .where({ stripe_subscription_id: subscriptionId })
      .update({ status: 'past_due' });

    logger.info(`Payment failed for subscription: ${subscriptionId}`);
  }

  static async handleSubscriptionUpdated(subscription) {
    await db('subscriptions')
      .where({ stripe_subscription_id: subscription.id })
      .update({
        status: subscription.status,
        current_period_start: new Date(subscription.current_period_start * 1000),
        current_period_end: new Date(subscription.current_period_end * 1000)
      });

    logger.info(`Subscription updated: ${subscription.id}`);
  }

  static async handleSubscriptionDeleted(subscription) {
    await db('subscriptions')
      .where({ stripe_subscription_id: subscription.id })
      .update({
        status: 'canceled',
        plan_type: 'free',
        price: 0,
        ai_requests_limit: SUBSCRIPTION_PLANS.free.aiRequestsLimit,
        features: JSON.stringify(SUBSCRIPTION_PLANS.free.features),
        canceled_at: new Date()
      });

    logger.info(`Subscription deleted: ${subscription.id}`);
  }

  static async getSubscription(userId) {
    return db('subscriptions').where({ user_id: userId }).first();
  }

  static async incrementAIRequestUsage(userId) {
    const result = await db('subscriptions')
      .where({ user_id: userId })
      .increment('ai_requests_used', 1)
      .returning(['ai_requests_used', 'ai_requests_limit']);

    return result[0];
  }

  static async canUseAI(userId) {
    const subscription = await this.getSubscription(userId);

    if (!subscription) {
      return false;
    }

    // Unlimited usage for professional plan
    if (subscription.ai_requests_limit === -1) {
      return true;
    }

    return subscription.ai_requests_used < subscription.ai_requests_limit;
  }

  static getPlanFromPriceId(priceId) {
    for (const [planType, plan] of Object.entries(SUBSCRIPTION_PLANS)) {
      if (plan.priceId === priceId) {
        return planType;
      }
    }
    throw new Error(`Unknown price ID: ${priceId}`);
  }

  static getPlans() {
    return SUBSCRIPTION_PLANS;
  }
}

module.exports = StripeService;