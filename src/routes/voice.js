const express = require('express');
const multer = require('multer');
const { authenticate, requireSubscription } = require('../middleware/auth');
const { catchAsync, AppError } = require('../middleware/errorHandler');
const VoiceService = require('../services/voiceService');
const CalculationService = require('../services/calculationService');
const logger = require('../utils/logger');

const router = express.Router();

// Configure multer for audio uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 25 * 1024 * 1024, // 25MB limit
    files: 1
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'audio/wav',
      'audio/mp3',
      'audio/mpeg',
      'audio/mp4',
      'audio/webm',
      'audio/ogg'
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError(`Unsupported file type: ${file.mimetype}`, 400), false);
    }
  }
});

/**
 * @swagger
 * /api/v1/voice/transcribe:
 *   post:
 *     summary: Convert speech to text
 *     tags: [Voice]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - audio
 *             properties:
 *               audio:
 *                 type: string
 *                 format: binary
 *                 description: Audio file (WAV, MP3, WebM, etc.)
 *     responses:
 *       200:
 *         description: Audio transcribed successfully
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
 *                     transcription:
 *                       type: string
 *                       description: Transcribed text
 */
router.post('/transcribe',
  authenticate,
  requireSubscription('premium'),
  upload.single('audio'),
  catchAsync(async (req, res) => {
    if (!req.file) {
      throw new AppError('Audio file is required', 400);
    }

    // Validate audio input
    VoiceService.validateAudioInput(req.file.buffer, req.file.mimetype);

    // Convert speech to text
    const transcription = await VoiceService.speechToText(req.file.buffer);

    logger.info(`Audio transcribed for user: ${req.user.email}`);

    res.json({
      success: true,
      data: {
        transcription,
        duration: req.file.size, // Approximate
        format: req.file.mimetype
      }
    });
  })
);

/**
 * @swagger
 * /api/v1/voice/parse:
 *   post:
 *     summary: Parse voice input to extract golf parameters
 *     tags: [Voice]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *                 description: Transcribed or typed golf shot description
 *     responses:
 *       200:
 *         description: Voice input parsed successfully
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
 *                     parsedData:
 *                       type: object
 *                       description: Extracted golf shot parameters
 *                     originalText:
 *                       type: string
 */
router.post('/parse',
  authenticate,
  requireSubscription('premium'),
  catchAsync(async (req, res) => {
    const { text } = req.body;

    if (!text || typeof text !== 'string') {
      throw new AppError('Text is required', 400);
    }

    if (text.length > 1000) {
      throw new AppError('Text too long. Maximum 1000 characters.', 400);
    }

    const parsedData = await VoiceService.parseVoiceInput(text);

    logger.info(`Voice input parsed for user: ${req.user.email}`);

    res.json({
      success: true,
      data: {
        parsedData,
        originalText: text
      }
    });
  })
);

/**
 * @swagger
 * /api/v1/voice/speak:
 *   post:
 *     summary: Convert text to speech
 *     tags: [Voice]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *                 description: Text to convert to speech
 *               voice:
 *                 type: string
 *                 enum: [alloy, echo, fable, onyx, nova, shimmer]
 *                 default: alloy
 *                 description: Voice to use for speech synthesis
 *     responses:
 *       200:
 *         description: Text converted to speech successfully
 *         content:
 *           audio/mpeg:
 *             schema:
 *               type: string
 *               format: binary
 */
router.post('/speak',
  authenticate,
  requireSubscription('premium'),
  catchAsync(async (req, res) => {
    const { text, voice = 'alloy' } = req.body;

    if (!text || typeof text !== 'string') {
      throw new AppError('Text is required', 400);
    }

    const sanitizedText = VoiceService.sanitizeTextForSpeech(text);

    if (!sanitizedText) {
      throw new AppError('Invalid text content', 400);
    }

    const audioBuffer = await VoiceService.textToSpeech(sanitizedText, voice);

    logger.info(`Text-to-speech generated for user: ${req.user.email}`);

    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.length,
      'Content-Disposition': 'attachment; filename="speech.mp3"'
    });

    res.send(audioBuffer);
  })
);

/**
 * @swagger
 * /api/v1/voice/full-interaction:
 *   post:
 *     summary: Complete voice interaction - speech to calculation to speech
 *     tags: [Voice]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - audio
 *             properties:
 *               audio:
 *                 type: string
 *                 format: binary
 *                 description: Audio file with golf shot description
 *               voice:
 *                 type: string
 *                 enum: [alloy, echo, fable, onyx, nova, shimmer]
 *                 default: alloy
 *                 description: Voice for response
 *     responses:
 *       200:
 *         description: Full voice interaction completed successfully
 */
router.post('/full-interaction',
  authenticate,
  requireSubscription('premium'),
  upload.single('audio'),
  catchAsync(async (req, res) => {
    if (!req.file) {
      throw new AppError('Audio file is required', 400);
    }

    const { voice = 'alloy' } = req.body;
    const userId = req.user.id;

    // Validate audio input
    VoiceService.validateAudioInput(req.file.buffer, req.file.mimetype);

    // Process complete voice interaction
    const result = await VoiceService.processVoiceInteraction(
      req.file.buffer,
      userId,
      CalculationService
    );

    // Save the calculation
    await CalculationService.saveCalculation(userId, result.parsedData, result.recommendation);

    // Emit real-time update if socket.io is available
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${userId}`).emit('voice_calculation_complete', {
        transcription: result.transcribedText,
        recommendation: result.recommendation,
        timestamp: new Date().toISOString()
      });
    }

    logger.info(`Full voice interaction completed for user: ${req.user.email}`);

    res.json({
      success: true,
      data: {
        transcription: result.transcribedText,
        parsedData: result.parsedData,
        recommendation: result.recommendation,
        spokenRecommendation: result.spokenRecommendation,
        audioResponse: result.audioBuffer // base64 encoded audio
      }
    });
  })
);

/**
 * @swagger
 * /api/v1/voice/voices:
 *   get:
 *     summary: Get available TTS voices
 *     tags: [Voice]
 *     responses:
 *       200:
 *         description: Available voices retrieved successfully
 */
router.get('/voices', catchAsync(async (req, res) => {
  const voices = VoiceService.getAvailableVoices();

  res.json({
    success: true,
    data: voices
  });
}));

/**
 * @swagger
 * /api/v1/voice/quick-command:
 *   post:
 *     summary: Process quick voice command (distance only)
 *     tags: [Voice]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - audio
 *             properties:
 *               audio:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Quick command processed successfully
 */
router.post('/quick-command',
  authenticate,
  requireSubscription('basic'),
  upload.single('audio'),
  catchAsync(async (req, res) => {
    if (!req.file) {
      throw new AppError('Audio file is required', 400);
    }

    const userId = req.user.id;

    // Convert speech to text
    const transcription = await VoiceService.speechToText(req.file.buffer);

    // Try to extract just the distance for quick calculation
    const distanceMatch = transcription.match(/(\d+)\s*(?:yards?|y)/i);

    if (!distanceMatch) {
      throw new AppError('Could not extract distance from audio', 400);
    }

    const distance = parseInt(distanceMatch[1]);
    const inputData = { distance };

    // Add user context
    inputData.skill_level = req.user.skillLevel;
    inputData.dominant_hand = req.user.dominantHand;

    // Get quick recommendation
    const recommendation = await CalculationService.calculateRecommendation(userId, inputData);

    logger.info(`Quick voice command processed for user: ${req.user.email}`);

    res.json({
      success: true,
      data: {
        transcription,
        distance,
        recommendation: {
          recommendedClub: recommendation.recommendedClub,
          quickTip: recommendation.additionalNotes?.split('.')[0] || 'Good luck with your shot!'
        }
      }
    });
  })
);

module.exports = router;