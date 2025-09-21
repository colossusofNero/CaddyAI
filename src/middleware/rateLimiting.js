const rateLimit = require('express-rate-limit');
const { cache } = require('../config/redis');
const logger = require('../utils/logger');
const StripeService = require('../services/stripeService');

// Store for rate limit counters
class RedisStore {
  constructor(options = {}) {
    this.prefix = options.prefix || 'rl:';
    this.expiry = options.expiry || 60;
  }

  async incr(key) {
    try {
      const fullKey = `${this.prefix}${key}`;
      const current = await cache.get(fullKey) || 0;
      const newValue = current + 1;

      await cache.set(fullKey, newValue, this.expiry);

      return {
        totalCount: newValue,
        resetTime: new Date(Date.now() + this.expiry * 1000)
      };
    } catch (error) {
      logger.error('Rate limit store error:', error);
      // Fallback to allow request if Redis fails
      return { totalCount: 1, resetTime: new Date(Date.now() + this.expiry * 1000) };
    }
  }

  async decrement(key) {
    try {
      const fullKey = `${this.prefix}${key}`;
      const current = await cache.get(fullKey) || 0;
      if (current > 0) {
        await cache.set(fullKey, current - 1, this.expiry);
      }
    } catch (error) {
      logger.error('Rate limit decrement error:', error);
    }
  }

  async resetKey(key) {
    try {
      const fullKey = `${this.prefix}${key}`;
      await cache.del(fullKey);
    } catch (error) {
      logger.error('Rate limit reset error:', error);
    }
  }
}

// Basic rate limiting for general API usage
const createBasicRateLimit = (windowMs = 15 * 60 * 1000, max = 100, message = 'Too many requests') => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message,
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({
      prefix: 'basic:',
      expiry: Math.ceil(windowMs / 1000)
    }),
    keyGenerator: (req) => {
      return req.user ? `user:${req.user.id}` : `ip:${req.ip}`;
    },
    skip: (req) => {
      // Skip rate limiting for health checks
      return req.path === '/health';
    },
    onLimitReached: (req, res, options) => {
      const identifier = req.user ? req.user.email : req.ip;
      logger.warn(`Rate limit reached for: ${identifier}`);
    }
  });
};

// Strict rate limiting for AI-powered endpoints
const createAIRateLimit = (windowMs = 60 * 1000, max = 10) => {
  return rateLimit({
    windowMs,
    max: async (req) => {
      if (!req.user) return 5; // Anonymous users get fewer requests

      try {
        // Get user's subscription plan
        const subscription = await StripeService.getSubscription(req.user.id);

        if (!subscription) return 5;

        // Different limits based on subscription
        switch (subscription.plan_type) {
          case 'professional': return 100;
          case 'premium': return 50;
          case 'basic': return 20;
          case 'free':
          default: return 10;
        }
      } catch (error) {
        logger.error('Error checking subscription for rate limit:', error);
        return 10; // Default fallback
      }
    },
    message: {
      success: false,
      message: 'AI request limit exceeded. Please upgrade your plan for higher limits.',
      code: 'AI_RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({
      prefix: 'ai:',
      expiry: Math.ceil(windowMs / 1000)
    }),
    keyGenerator: (req) => {
      return req.user ? `user:${req.user.id}` : `ip:${req.ip}`;
    },
    onLimitReached: (req, res, options) => {
      logger.warn(`AI rate limit reached for user: ${req.user?.email || req.ip}`);

      // Emit real-time notification
      const io = req.app.get('io');
      if (io && req.user) {
        io.to(`user_${req.user.id}`).emit('rate_limit_exceeded', {
          type: 'ai_requests',
          message: 'AI request limit exceeded',
          upgradeRequired: true
        });
      }
    }
  });
};

// Rate limiting for authentication endpoints
const createAuthRateLimit = () => {
  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP/user to 5 requests per windowMs
    message: {
      success: false,
      message: 'Too many authentication attempts, please try again later.',
      retryAfter: 15 * 60 // 15 minutes in seconds
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({
      prefix: 'auth:',
      expiry: 15 * 60
    }),
    keyGenerator: (req) => {
      // Use email if provided, otherwise IP
      return req.body.email || req.ip;
    },
    onLimitReached: (req, res, options) => {
      const identifier = req.body.email || req.ip;
      logger.warn(`Auth rate limit reached for: ${identifier}`);
    }
  });
};

// Rate limiting for file uploads
const createUploadRateLimit = () => {
  return rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 uploads per minute
    message: {
      success: false,
      message: 'Too many file uploads, please slow down.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({
      prefix: 'upload:',
      expiry: 60
    }),
    keyGenerator: (req) => {
      return req.user ? `user:${req.user.id}` : `ip:${req.ip}`;
    }
  });
};

// Adaptive rate limiting based on server load
const createAdaptiveRateLimit = () => {
  return async (req, res, next) => {
    try {
      // Simple server load check (can be enhanced with actual metrics)
      const serverLoad = process.cpuUsage();
      const memoryUsage = process.memoryUsage();

      const isHighLoad = memoryUsage.heapUsed / memoryUsage.heapTotal > 0.8;

      if (isHighLoad) {
        // Stricter limits under high load
        req.rateLimit = {
          windowMs: 60 * 1000,
          max: 5
        };
      }

      next();
    } catch (error) {
      logger.error('Adaptive rate limit error:', error);
      next();
    }
  };
};

// Middleware to track and enforce subscription-based AI usage
const enforceAIUsageLimit = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required for AI features'
      });
    }

    // Check if user can make AI requests
    const canUseAI = await StripeService.canUseAI(req.user.id);

    if (!canUseAI) {
      const subscription = await StripeService.getSubscription(req.user.id);

      return res.status(402).json({
        success: false,
        message: 'AI request limit exceeded for your subscription plan',
        code: 'AI_LIMIT_EXCEEDED',
        currentUsage: subscription?.ai_requests_used || 0,
        limit: subscription?.ai_requests_limit || 0,
        upgradeRequired: true
      });
    }

    // Increment usage counter
    await StripeService.incrementAIRequestUsage(req.user.id);

    next();
  } catch (error) {
    logger.error('AI usage enforcement error:', error);
    // Allow request to continue on error to avoid blocking users
    next();
  }
};

// Export configured rate limiters
module.exports = {
  // Pre-configured rate limiters
  generalRateLimit: createBasicRateLimit(15 * 60 * 1000, 100), // 100 requests per 15 minutes
  strictRateLimit: createBasicRateLimit(15 * 60 * 1000, 50),   // 50 requests per 15 minutes
  aiRateLimit: createAIRateLimit(60 * 1000, 10),               // 10 AI requests per minute
  authRateLimit: createAuthRateLimit(),                         // 5 auth attempts per 15 minutes
  uploadRateLimit: createUploadRateLimit(),                     // 10 uploads per minute

  // Factory functions for custom limits
  createBasicRateLimit,
  createAIRateLimit,
  createAuthRateLimit,
  createUploadRateLimit,
  createAdaptiveRateLimit,

  // Usage enforcement
  enforceAIUsageLimit,

  // Store class for custom implementations
  RedisStore
};