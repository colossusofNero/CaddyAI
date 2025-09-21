const express = require('express');
const { validateRegister, validateLogin, validatePasswordReset } = require('../middleware/validation');
const { authenticate } = require('../middleware/auth');
const { catchAsync, AppError } = require('../middleware/errorHandler');
const User = require('../models/User');
const JWTUtils = require('../utils/jwt');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - firstName
 *               - lastName
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phone:
 *                 type: string
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *               handicap:
 *                 type: number
 *               skillLevel:
 *                 type: string
 *                 enum: [beginner, intermediate, advanced, professional]
 *     responses:
 *       201:
 *         description: User registered successfully
 */
router.post('/register', validateRegister, catchAsync(async (req, res) => {
  const {
    email,
    password,
    firstName,
    lastName,
    phone,
    dateOfBirth,
    handicap,
    skillLevel,
    dominantHand,
    preferences
  } = req.body;

  // Check if user already exists
  const existingUser = await User.findByEmail(email);
  if (existingUser) {
    throw new AppError('User with this email already exists', 400);
  }

  // Create new user
  const user = await User.create({
    email,
    password,
    firstName,
    lastName,
    phone,
    dateOfBirth,
    handicap,
    skillLevel,
    dominantHand,
    preferences
  });

  // Generate tokens
  const { accessToken, refreshToken } = JWTUtils.generateTokens({
    userId: user.id,
    email: user.email
  });

  logger.info(`New user registered: ${email}`);

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user,
      accessToken,
      refreshToken
    }
  });
}));

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post('/login', validateLogin, catchAsync(async (req, res) => {
  const { email, password } = req.body;

  // Find user and include password for verification
  const user = await User.findByEmail(email);
  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  // Check if user is active
  if (!user.isActive) {
    throw new AppError('Account is deactivated', 401);
  }

  // Get user record with password hash for comparison
  const userWithPassword = await require('../config/database').db('users')
    .where({ email: email.toLowerCase() })
    .first();

  // Verify password
  const isPasswordValid = await User.comparePassword(password, userWithPassword.password_hash);
  if (!isPasswordValid) {
    throw new AppError('Invalid email or password', 401);
  }

  // Update last login
  await User.updateLastLogin(user.id);

  // Generate tokens
  const { accessToken, refreshToken } = JWTUtils.generateTokens({
    userId: user.id,
    email: user.email
  });

  logger.info(`User logged in: ${email}`);

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user,
      accessToken,
      refreshToken
    }
  });
}));

/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 */
router.post('/refresh', catchAsync(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new AppError('Refresh token required', 400);
  }

  // Verify refresh token
  const decoded = JWTUtils.verifyRefreshToken(refreshToken);

  // Get user
  const user = await User.findById(decoded.userId);
  if (!user || !user.isActive) {
    throw new AppError('Invalid refresh token', 401);
  }

  // Generate new tokens
  const { accessToken, refreshToken: newRefreshToken } = JWTUtils.generateTokens({
    userId: user.id,
    email: user.email
  });

  res.json({
    success: true,
    data: {
      accessToken,
      refreshToken: newRefreshToken
    }
  });
}));

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: Logout user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 */
router.post('/logout', authenticate, catchAsync(async (req, res) => {
  const token = req.token;

  // Blacklist the token
  await JWTUtils.blacklistToken(token);

  logger.info(`User logged out: ${req.user.email}`);

  res.json({
    success: true,
    message: 'Logout successful'
  });
}));

/**
 * @swagger
 * /api/v1/auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 */
router.get('/me', authenticate, catchAsync(async (req, res) => {
  res.json({
    success: true,
    data: req.user
  });
}));

/**
 * @swagger
 * /api/v1/auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Password reset email sent
 */
router.post('/forgot-password', validatePasswordReset, catchAsync(async (req, res) => {
  const { email } = req.body;

  const user = await User.findByEmail(email);
  if (!user) {
    // Don't reveal if email exists or not
    return res.json({
      success: true,
      message: 'If an account with this email exists, a password reset link has been sent'
    });
  }

  // Generate password reset token
  const resetToken = JWTUtils.createPasswordResetToken(user.id);

  // In a real app, you would send an email here
  logger.info(`Password reset requested for: ${email}`);

  res.json({
    success: true,
    message: 'If an account with this email exists, a password reset link has been sent',
    // In development, return the token for testing
    ...(process.env.NODE_ENV === 'development' && { resetToken })
  });
}));

/**
 * @swagger
 * /api/v1/auth/reset-password:
 *   post:
 *     summary: Reset password with token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *             properties:
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password reset successfully
 */
router.post('/reset-password', catchAsync(async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    throw new AppError('Token and password are required', 400);
  }

  // Verify reset token
  const decoded = JWTUtils.verifyPasswordResetToken(token);

  // Update password
  await User.updatePassword(decoded.userId, password);

  logger.info(`Password reset completed for user: ${decoded.userId}`);

  res.json({
    success: true,
    message: 'Password reset successfully'
  });
}));

module.exports = router;