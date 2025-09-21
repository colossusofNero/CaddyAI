const jwt = require('jsonwebtoken');
const { cache } = require('../config/redis');
const logger = require('./logger');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const JWT_REFRESH_EXPIRE = process.env.JWT_REFRESH_EXPIRE || '30d';

if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
  throw new Error('JWT secrets must be defined in environment variables');
}

class JWTUtils {
  static generateTokens(payload) {
    const accessToken = jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRE,
      issuer: 'caddyai',
      audience: 'caddyai-users'
    });

    const refreshToken = jwt.sign(payload, JWT_REFRESH_SECRET, {
      expiresIn: JWT_REFRESH_EXPIRE,
      issuer: 'caddyai',
      audience: 'caddyai-users'
    });

    return { accessToken, refreshToken };
  }

  static verifyAccessToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET, {
        issuer: 'caddyai',
        audience: 'caddyai-users'
      });
    } catch (error) {
      throw new Error('Invalid access token');
    }
  }

  static verifyRefreshToken(token) {
    try {
      return jwt.verify(token, JWT_REFRESH_SECRET, {
        issuer: 'caddyai',
        audience: 'caddyai-users'
      });
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  static async blacklistToken(token) {
    try {
      const decoded = jwt.decode(token);
      if (decoded && decoded.exp) {
        const ttl = decoded.exp - Math.floor(Date.now() / 1000);
        if (ttl > 0) {
          await cache.set(`blacklist:${token}`, true, ttl);
        }
      }
    } catch (error) {
      logger.error('Error blacklisting token:', error);
    }
  }

  static async isTokenBlacklisted(token) {
    try {
      return await cache.exists(`blacklist:${token}`);
    } catch (error) {
      logger.error('Error checking blacklisted token:', error);
      return false;
    }
  }

  static extractTokenFromHeader(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }

  static getTokenExpiration(token) {
    try {
      const decoded = jwt.decode(token);
      return decoded ? decoded.exp : null;
    } catch (error) {
      return null;
    }
  }

  static createPasswordResetToken(userId) {
    return jwt.sign(
      { userId, type: 'password_reset' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
  }

  static verifyPasswordResetToken(token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded.type !== 'password_reset') {
        throw new Error('Invalid token type');
      }
      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired reset token');
    }
  }

  static createEmailVerificationToken(userId, email) {
    return jwt.sign(
      { userId, email, type: 'email_verification' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
  }

  static verifyEmailVerificationToken(token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      if (decoded.type !== 'email_verification') {
        throw new Error('Invalid token type');
      }
      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired verification token');
    }
  }
}

module.exports = JWTUtils;