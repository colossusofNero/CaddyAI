const User = require('../models/User');
const JWTUtils = require('../utils/jwt');
const logger = require('../utils/logger');

const authenticate = async (req, res, next) => {
  try {
    const token = JWTUtils.extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    // Check if token is blacklisted
    const isBlacklisted = await JWTUtils.isTokenBlacklisted(token);
    if (isBlacklisted) {
      return res.status(401).json({
        success: false,
        message: 'Token is no longer valid'
      });
    }

    // Verify token
    const decoded = JWTUtils.verifyAccessToken(token);

    // Get user from database
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive'
      });
    }

    // Add user to request object
    req.user = user;
    req.token = token;

    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const userRole = req.user.role || 'user';
    if (!roles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Insufficient permissions'
      });
    }

    next();
  };
};

const optional = async (req, res, next) => {
  try {
    const token = JWTUtils.extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      return next();
    }

    // Check if token is blacklisted
    const isBlacklisted = await JWTUtils.isTokenBlacklisted(token);
    if (isBlacklisted) {
      return next();
    }

    // Verify token
    const decoded = JWTUtils.verifyAccessToken(token);

    // Get user from database
    const user = await User.findById(decoded.userId);
    if (user && user.isActive) {
      req.user = user;
      req.token = token;
    }

    next();
  } catch (error) {
    // For optional auth, we just continue without user
    logger.debug('Optional auth failed:', error.message);
    next();
  }
};

const requireEmailVerification = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  if (!req.user.emailVerified) {
    return res.status(403).json({
      success: false,
      message: 'Email verification required',
      code: 'EMAIL_NOT_VERIFIED'
    });
  }

  next();
};

const requireSubscription = (requiredPlan = 'basic') => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    try {
      // This would typically check subscription status from database
      // For now, we'll assume all authenticated users have basic access
      const subscription = { plan: 'basic', status: 'active' };

      if (subscription.status !== 'active') {
        return res.status(402).json({
          success: false,
          message: 'Active subscription required',
          code: 'SUBSCRIPTION_REQUIRED'
        });
      }

      const planHierarchy = ['free', 'basic', 'premium', 'professional'];
      const userPlanIndex = planHierarchy.indexOf(subscription.plan);
      const requiredPlanIndex = planHierarchy.indexOf(requiredPlan);

      if (userPlanIndex < requiredPlanIndex) {
        return res.status(402).json({
          success: false,
          message: `${requiredPlan} subscription required`,
          code: 'UPGRADE_REQUIRED',
          currentPlan: subscription.plan,
          requiredPlan
        });
      }

      req.subscription = subscription;
      next();
    } catch (error) {
      logger.error('Subscription check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error checking subscription status'
      });
    }
  };
};

const rateLimitByUser = (req, res, next) => {
  if (req.user) {
    req.rateLimitKey = `user:${req.user.id}`;
  } else {
    req.rateLimitKey = `ip:${req.ip}`;
  }
  next();
};

module.exports = {
  authenticate,
  authorize,
  optional,
  requireEmailVerification,
  requireSubscription,
  rateLimitByUser
};