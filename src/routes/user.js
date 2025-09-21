const express = require('express');
const { authenticate } = require('../middleware/auth');
const { validateProfileUpdate, validateClubData, validateUUID } = require('../middleware/validation');
const { catchAsync, AppError } = require('../middleware/errorHandler');
const User = require('../models/User');
const Club = require('../models/Club');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @swagger
 * /api/v1/user/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 */
router.get('/profile', authenticate, catchAsync(async (req, res) => {
  const user = req.user;
  const stats = await User.getUserStats(user.id);

  res.json({
    success: true,
    data: {
      ...user,
      stats
    }
  });
}));

/**
 * @swagger
 * /api/v1/user/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phone:
 *                 type: string
 *               handicap:
 *                 type: number
 *               skillLevel:
 *                 type: string
 *                 enum: [beginner, intermediate, advanced, professional]
 *               dominantHand:
 *                 type: string
 *                 enum: [left, right]
 *               preferences:
 *                 type: object
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.put('/profile',
  authenticate,
  validateProfileUpdate,
  catchAsync(async (req, res) => {
    const userId = req.user.id;
    const updateData = req.body;

    const updatedUser = await User.updateById(userId, updateData);

    if (!updatedUser) {
      throw new AppError('User not found', 404);
    }

    logger.info(`Profile updated for user: ${req.user.email}`);

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    });
  })
);

/**
 * @swagger
 * /api/v1/user/clubs:
 *   get:
 *     summary: Get user's clubs
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Clubs retrieved successfully
 */
router.get('/clubs', authenticate, catchAsync(async (req, res) => {
  const userId = req.user.id;
  const clubs = await Club.findByUserId(userId);

  res.json({
    success: true,
    data: clubs
  });
}));

/**
 * @swagger
 * /api/v1/user/clubs:
 *   post:
 *     summary: Add a new club to user's bag
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - type
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [driver, fairway_wood, hybrid, iron, wedge, putter]
 *               brand:
 *                 type: string
 *               model:
 *                 type: string
 *               loft:
 *                 type: integer
 *               shaftFlex:
 *                 type: string
 *               averageDistance:
 *                 type: integer
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Club added successfully
 */
router.post('/clubs',
  authenticate,
  validateClubData,
  catchAsync(async (req, res) => {
    const userId = req.user.id;
    const clubData = req.body;

    const newClub = await Club.create(userId, clubData);

    logger.info(`Club added for user ${req.user.email}: ${clubData.name}`);

    res.status(201).json({
      success: true,
      message: 'Club added successfully',
      data: newClub
    });
  })
);

/**
 * @swagger
 * /api/v1/user/clubs/{id}:
 *   put:
 *     summary: Update a club
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [driver, fairway_wood, hybrid, iron, wedge, putter]
 *               brand:
 *                 type: string
 *               model:
 *                 type: string
 *               loft:
 *                 type: integer
 *               averageDistance:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Club updated successfully
 */
router.put('/clubs/:id',
  authenticate,
  validateUUID,
  catchAsync(async (req, res) => {
    const clubId = req.params.id;
    const userId = req.user.id;
    const updateData = req.body;

    const updatedClub = await Club.updateById(clubId, userId, updateData);

    if (!updatedClub) {
      throw new AppError('Club not found', 404);
    }

    logger.info(`Club updated for user ${req.user.email}: ${clubId}`);

    res.json({
      success: true,
      message: 'Club updated successfully',
      data: updatedClub
    });
  })
);

/**
 * @swagger
 * /api/v1/user/clubs/{id}:
 *   delete:
 *     summary: Delete a club
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Club deleted successfully
 */
router.delete('/clubs/:id',
  authenticate,
  validateUUID,
  catchAsync(async (req, res) => {
    const clubId = req.params.id;
    const userId = req.user.id;

    const deleted = await Club.deleteById(clubId, userId);

    if (!deleted) {
      throw new AppError('Club not found', 404);
    }

    logger.info(`Club deleted for user ${req.user.email}: ${clubId}`);

    res.json({
      success: true,
      message: 'Club deleted successfully'
    });
  })
);

/**
 * @swagger
 * /api/v1/user/clubs/reorder:
 *   put:
 *     summary: Reorder clubs in bag
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - clubs
 *             properties:
 *               clubs:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     orderIndex:
 *                       type: integer
 *     responses:
 *       200:
 *         description: Clubs reordered successfully
 */
router.put('/clubs/reorder',
  authenticate,
  catchAsync(async (req, res) => {
    const userId = req.user.id;
    const { clubs } = req.body;

    if (!clubs || !Array.isArray(clubs)) {
      throw new AppError('Clubs array is required', 400);
    }

    await Club.reorderClubs(userId, clubs);

    res.json({
      success: true,
      message: 'Clubs reordered successfully'
    });
  })
);

/**
 * @swagger
 * /api/v1/user/clubs/setup-default:
 *   post:
 *     summary: Set up default clubs for new user
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Default clubs created successfully
 */
router.post('/clubs/setup-default',
  authenticate,
  catchAsync(async (req, res) => {
    const userId = req.user.id;

    // Check if user already has clubs
    const existingClubs = await Club.findByUserId(userId);
    if (existingClubs.length > 0) {
      throw new AppError('User already has clubs configured', 400);
    }

    const defaultClubs = Club.getDefaultClubs();
    const createdClubs = [];

    for (const clubData of defaultClubs) {
      const club = await Club.create(userId, clubData);
      createdClubs.push(club);
    }

    logger.info(`Default clubs setup for user: ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Default clubs created successfully',
      data: createdClubs
    });
  })
);

/**
 * @swagger
 * /api/v1/user/clubs/stats:
 *   get:
 *     summary: Get club usage statistics
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Club statistics retrieved successfully
 */
router.get('/clubs/stats',
  authenticate,
  catchAsync(async (req, res) => {
    const userId = req.user.id;
    const stats = await Club.getClubStats(userId);

    res.json({
      success: true,
      data: stats
    });
  })
);

/**
 * @swagger
 * /api/v1/user/deactivate:
 *   post:
 *     summary: Deactivate user account
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Account deactivated successfully
 */
router.post('/deactivate',
  authenticate,
  catchAsync(async (req, res) => {
    const userId = req.user.id;

    await User.deactivate(userId);

    logger.info(`Account deactivated for user: ${req.user.email}`);

    res.json({
      success: true,
      message: 'Account deactivated successfully'
    });
  })
);

module.exports = router;