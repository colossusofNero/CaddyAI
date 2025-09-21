const { cache } = require('../config/redis');
const logger = require('../utils/logger');

/**
 * Generic caching middleware
 */
const cacheMiddleware = (options = {}) => {
  const {
    ttl = 300, // 5 minutes default
    keyGenerator = null,
    condition = null,
    excludeHeaders = ['authorization', 'cookie']
  } = options;

  return async (req, res, next) => {
    try {
      // Generate cache key
      let cacheKey;
      if (keyGenerator && typeof keyGenerator === 'function') {
        cacheKey = keyGenerator(req);
      } else {
        cacheKey = generateDefaultCacheKey(req, excludeHeaders);
      }

      // Check condition if provided
      if (condition && !condition(req)) {
        return next();
      }

      // Try to get cached response
      const cachedResponse = await cache.get(cacheKey);
      if (cachedResponse) {
        logger.debug(`Cache hit for key: ${cacheKey}`);

        return res.json({
          ...cachedResponse,
          meta: {
            ...cachedResponse.meta,
            cached: true,
            cacheKey: process.env.NODE_ENV === 'development' ? cacheKey : undefined
          }
        });
      }

      // Store original json method
      const originalJson = res.json;

      // Override res.json to cache response
      res.json = function(data) {
        // Only cache successful responses
        if (res.statusCode < 400 && data.success !== false) {
          cache.set(cacheKey, data, ttl)
            .catch(error => logger.error('Cache set error:', error));
        }

        // Call original json method
        originalJson.call(this, data);
      };

      logger.debug(`Cache miss for key: ${cacheKey}`);
      next();
    } catch (error) {
      logger.error('Cache middleware error:', error);
      // Continue without caching on error
      next();
    }
  };
};

/**
 * Cache middleware specifically for calculation results
 */
const calculationCache = cacheMiddleware({
  ttl: 300, // 5 minutes
  keyGenerator: (req) => {
    const userId = req.user?.id || 'anonymous';
    const inputData = req.body;

    // Create hash of input parameters for consistent caching
    const inputHash = require('crypto')
      .createHash('md5')
      .update(JSON.stringify({
        distance: inputData.distance,
        wind: inputData.wind,
        elevation: inputData.elevation,
        lie: inputData.lie,
        pin_position: inputData.pin_position,
        temperature: inputData.temperature
      }))
      .digest('hex');

    return `calc:${userId}:${inputHash}`;
  },
  condition: (req) => {
    // Only cache if user is authenticated and distance is provided
    return req.user && req.body.distance;
  }
});

/**
 * Cache middleware for user profile data
 */
const profileCache = cacheMiddleware({
  ttl: 600, // 10 minutes
  keyGenerator: (req) => `profile:${req.user.id}`,
  condition: (req) => req.method === 'GET' && req.user
});

/**
 * Cache middleware for clubs data
 */
const clubsCache = cacheMiddleware({
  ttl: 1800, // 30 minutes
  keyGenerator: (req) => `clubs:${req.user.id}`,
  condition: (req) => req.method === 'GET' && req.user
});

/**
 * Cache middleware for subscription data
 */
const subscriptionCache = cacheMiddleware({
  ttl: 300, // 5 minutes
  keyGenerator: (req) => `subscription:${req.user.id}`,
  condition: (req) => req.method === 'GET' && req.user
});

/**
 * Invalidate cache for specific patterns
 */
const invalidateCache = async (pattern) => {
  try {
    // This would typically use Redis SCAN with pattern matching
    // For now, we'll implement basic key deletion
    await cache.del(pattern);
    logger.info(`Cache invalidated for pattern: ${pattern}`);
  } catch (error) {
    logger.error('Cache invalidation error:', error);
  }
};

/**
 * Invalidate user-specific caches
 */
const invalidateUserCache = async (userId, types = ['profile', 'clubs', 'subscription']) => {
  try {
    const keys = types.map(type => `${type}:${userId}`);
    await Promise.all(keys.map(key => cache.del(key)));
    logger.info(`User cache invalidated for user: ${userId}`);
  } catch (error) {
    logger.error('User cache invalidation error:', error);
  }
};

/**
 * Generate default cache key from request
 */
const generateDefaultCacheKey = (req, excludeHeaders = []) => {
  const userId = req.user?.id || 'anonymous';
  const method = req.method;
  const path = req.route?.path || req.path;
  const query = req.query;

  // Include relevant headers (excluding sensitive ones)
  const headers = Object.keys(req.headers)
    .filter(key => !excludeHeaders.includes(key.toLowerCase()))
    .reduce((obj, key) => {
      obj[key] = req.headers[key];
      return obj;
    }, {});

  const keyData = {
    userId,
    method,
    path,
    query,
    headers: Object.keys(headers).length > 0 ? headers : undefined
  };

  return require('crypto')
    .createHash('md5')
    .update(JSON.stringify(keyData))
    .digest('hex');
};

/**
 * Middleware to set cache headers for client-side caching
 */
const setCacheHeaders = (options = {}) => {
  const {
    maxAge = 300, // 5 minutes
    public: isPublic = false,
    mustRevalidate = false,
    noStore = false
  } = options;

  return (req, res, next) => {
    if (noStore) {
      res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
    } else {
      let cacheControl = isPublic ? 'public' : 'private';
      cacheControl += `, max-age=${maxAge}`;

      if (mustRevalidate) {
        cacheControl += ', must-revalidate';
      }

      res.set('Cache-Control', cacheControl);
    }

    next();
  };
};

/**
 * Cache warming utility for frequently accessed data
 */
const warmCache = async (userId) => {
  try {
    logger.info(`Warming cache for user: ${userId}`);

    // This would pre-load frequently accessed data
    // Implementation depends on your data access patterns

    logger.info(`Cache warmed for user: ${userId}`);
  } catch (error) {
    logger.error('Cache warming error:', error);
  }
};

/**
 * Get cache statistics
 */
const getCacheStats = async () => {
  try {
    // This would typically use Redis INFO command
    // For now, return basic stats
    return {
      status: 'connected',
      // Add more stats as needed
    };
  } catch (error) {
    logger.error('Cache stats error:', error);
    return { status: 'error', error: error.message };
  }
};

/**
 * Flush all cache data (use with caution)
 */
const flushCache = async () => {
  try {
    // This would typically use Redis FLUSHDB
    logger.warn('Cache flush requested');
    return true;
  } catch (error) {
    logger.error('Cache flush error:', error);
    return false;
  }
};

module.exports = {
  // Middleware functions
  cacheMiddleware,
  calculationCache,
  profileCache,
  clubsCache,
  subscriptionCache,
  setCacheHeaders,

  // Cache management functions
  invalidateCache,
  invalidateUserCache,
  warmCache,
  getCacheStats,
  flushCache,

  // Utility functions
  generateDefaultCacheKey
};