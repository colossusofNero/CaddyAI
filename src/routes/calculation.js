const express = require('express');
const { authenticate, requireSubscription } = require('../middleware/auth');
const { validateCalculationInput, validatePagination } = require('../middleware/validation');
const { catchAsync } = require('../middleware/errorHandler');
const CalculationService = require('../services/calculationService');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @swagger
 * /api/v1/calculate:
 *   post:
 *     summary: Get club recommendation based on shot conditions
 *     tags: [Calculation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - distance
 *             properties:
 *               distance:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 600
 *                 description: Distance to target in yards
 *               wind:
 *                 type: object
 *                 properties:
 *                   speed:
 *                     type: number
 *                     minimum: 0
 *                     maximum: 50
 *                     description: Wind speed in mph
 *                   direction:
 *                     type: number
 *                     minimum: 0
 *                     maximum: 360
 *                     description: Wind direction in degrees
 *               elevation:
 *                 type: integer
 *                 minimum: -100
 *                 maximum: 100
 *                 description: Elevation change in feet
 *               lie:
 *                 type: string
 *                 enum: [fairway, rough, sand, fringe, tee, hazard]
 *                 description: Ball lie condition
 *               pin_position:
 *                 type: string
 *                 enum: [front, middle, back]
 *                 description: Pin position on green
 *               temperature:
 *                 type: number
 *                 description: Temperature in Fahrenheit
 *               humidity:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *                 description: Humidity percentage
 *               green_firmness:
 *                 type: string
 *                 enum: [soft, medium, firm]
 *                 description: Green firmness
 *               shot_shape:
 *                 type: string
 *                 enum: [draw, fade, straight]
 *                 description: Preferred shot shape
 *     responses:
 *       200:
 *         description: Club recommendation generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     recommendedClub:
 *                       type: string
 *                     aimPoint:
 *                       type: string
 *                     stanceAdjustment:
 *                       type: string
 *                     confidenceScore:
 *                       type: number
 *                     additionalNotes:
 *                       type: string
 *                     factors:
 *                       type: array
 *                       items:
 *                         type: string
 *                     alternativeClubs:
 *                       type: array
 *                       items:
 *                         type: string
 */
router.post('/',
  authenticate,
  requireSubscription('basic'),
  validateCalculationInput,
  catchAsync(async (req, res) => {
    const inputData = req.body;
    const userId = req.user.id;

    // Add user context to input data
    inputData.skill_level = req.user.skillLevel;
    inputData.dominant_hand = req.user.dominantHand;

    logger.info(`Calculation request from user ${userId}:`, {
      distance: inputData.distance,
      conditions: {
        wind: inputData.wind,
        elevation: inputData.elevation,
        lie: inputData.lie
      }
    });

    const recommendation = await CalculationService.calculateRecommendation(userId, inputData);

    // Save calculation to database
    await CalculationService.saveCalculation(userId, inputData, recommendation);

    // Emit real-time update if socket.io is available
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${userId}`).emit('calculation_complete', {
        id: Date.now(), // Would be actual ID from database
        recommendation,
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      data: recommendation,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown'
      }
    });
  })
);

/**
 * @swagger
 * /api/v1/calculate/history:
 *   get:
 *     summary: Get user's calculation history
 *     tags: [Calculation]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Calculation history retrieved successfully
 */
router.get('/history',
  authenticate,
  validatePagination,
  catchAsync(async (req, res) => {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const calculations = await CalculationService.getCalculationHistory(
      userId,
      limit,
      (page - 1) * limit
    );

    res.json({
      success: true,
      data: calculations,
      pagination: {
        page,
        limit,
        total: calculations.length,
        pages: Math.ceil(calculations.length / limit)
      }
    });
  })
);

/**
 * @swagger
 * /api/v1/calculate/feedback:
 *   post:
 *     summary: Provide feedback on a calculation
 *     tags: [Calculation]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - calculationId
 *               - feedback
 *             properties:
 *               calculationId:
 *                 type: string
 *                 format: uuid
 *               feedback:
 *                 type: object
 *                 properties:
 *                   used_recommendation:
 *                     type: boolean
 *                   actual_result:
 *                     type: string
 *                     enum: [short, on_target, long, left, right]
 *                   rating:
 *                     type: integer
 *                     minimum: 1
 *                     maximum: 5
 *                   notes:
 *                     type: string
 *     responses:
 *       200:
 *         description: Feedback recorded successfully
 */
router.post('/feedback',
  authenticate,
  catchAsync(async (req, res) => {
    const { calculationId, feedback } = req.body;
    const userId = req.user.id;

    // This would update the calculation record with feedback
    logger.info(`Feedback received for calculation ${calculationId} from user ${userId}:`, feedback);

    res.json({
      success: true,
      message: 'Feedback recorded successfully'
    });
  })
);

/**
 * @swagger
 * /api/v1/calculate/stats:
 *   get:
 *     summary: Get user's calculation statistics
 *     tags: [Calculation]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 */
router.get('/stats',
  authenticate,
  catchAsync(async (req, res) => {
    const userId = req.user.id;

    // This would generate statistics from the user's calculations
    const stats = {
      totalCalculations: 0,
      mostUsedClub: null,
      averageConfidence: 0,
      accuracyRate: 0,
      commonConditions: {}
    };

    res.json({
      success: true,
      data: stats
    });
  })
);

module.exports = router;