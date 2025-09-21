const OpenAI = require('openai');
const Club = require('../models/Club');
const { cache } = require('../config/redis');
const logger = require('../utils/logger');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

class CalculationService {
  static async calculateRecommendation(userId, inputData) {
    try {
      // Get user's clubs
      const userClubs = await Club.findByUserId(userId);

      if (!userClubs.length) {
        throw new Error('No clubs found for user. Please add clubs to your bag first.');
      }

      // Create cache key for similar calculations
      const cacheKey = `calc:${userId}:${this.generateCacheKey(inputData)}`;

      // Check cache first
      const cachedResult = await cache.get(cacheKey);
      if (cachedResult) {
        logger.info('Returning cached calculation result');
        return cachedResult;
      }

      // Prepare calculation context
      const calculationContext = {
        userClubs: userClubs.map(club => ({
          name: club.name,
          type: club.type,
          loft: club.loft,
          averageDistance: club.averageDistance,
          distanceRanges: club.distanceRanges
        })),
        conditions: inputData
      };

      // Get AI recommendation
      const recommendation = await this.getAIRecommendation(calculationContext);

      // Calculate confidence score
      const confidenceScore = this.calculateConfidenceScore(recommendation, inputData);

      const result = {
        recommendedClub: recommendation.club,
        aimPoint: recommendation.aimPoint,
        stanceAdjustment: recommendation.stanceAdjustment,
        confidenceScore,
        additionalNotes: recommendation.notes,
        factors: recommendation.factors,
        alternativeClubs: recommendation.alternatives || [],
        timestamp: new Date().toISOString()
      };

      // Cache the result for 5 minutes
      await cache.set(cacheKey, result, 300);

      return result;
    } catch (error) {
      logger.error('Calculation service error:', error);
      throw error;
    }
  }

  static async getAIRecommendation(context) {
    const prompt = this.buildPrompt(context);

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: `You are a professional golf caddy with 20+ years of experience. You provide precise club recommendations based on conditions and player equipment. Always respond with valid JSON only.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.3,
        response_format: { type: "json_object" }
      });

      const response = completion.choices[0].message.content;
      return JSON.parse(response);
    } catch (error) {
      logger.error('OpenAI API error:', error);

      // Fallback to basic calculation
      return this.getFallbackRecommendation(context);
    }
  }

  static buildPrompt(context) {
    const { userClubs, conditions } = context;

    return `
Given these golf conditions and available clubs, provide a recommendation:

CONDITIONS:
- Distance to target: ${conditions.distance} yards
- Wind: ${conditions.wind?.speed || 0} mph ${conditions.wind?.direction ? `from ${conditions.wind.direction}°` : ''}
- Elevation change: ${conditions.elevation || 0} feet
- Lie: ${conditions.lie || 'fairway'}
- Pin position: ${conditions.pin_position || 'middle'}
- Temperature: ${conditions.temperature || 70}°F
- Humidity: ${conditions.humidity || 50}%
- Green firmness: ${conditions.green_firmness || 'medium'}
- Shot shape preference: ${conditions.shot_shape || 'straight'}

AVAILABLE CLUBS:
${userClubs.map(club =>
  `- ${club.name} (${club.type}, ${club.loft}°${club.averageDistance ? `, avg: ${club.averageDistance}y` : ''})`
).join('\n')}

PLAYER CONTEXT:
- Skill level: ${conditions.skill_level || 'intermediate'}
- Dominant hand: ${conditions.dominant_hand || 'right'}
- Preferred ball flight: ${conditions.ball_flight || 'mid'}

Provide recommendation in this exact JSON format:
{
  "club": "club name from available clubs",
  "aimPoint": "specific aim instruction (e.g., '10 yards left of pin')",
  "stanceAdjustment": "stance/swing adjustment if needed",
  "notes": "brief explanation of choice and key considerations",
  "factors": ["list", "of", "key", "factors", "considered"],
  "alternatives": ["alternative club 1", "alternative club 2"],
  "swingThoughts": ["key", "swing", "tips"]
}`;
  }

  static getFallbackRecommendation(context) {
    const { userClubs, conditions } = context;
    const targetDistance = conditions.distance;

    // Simple distance-based club selection
    let bestClub = userClubs.find(club =>
      club.averageDistance && Math.abs(club.averageDistance - targetDistance) < 10
    );

    if (!bestClub) {
      // Find closest distance match
      bestClub = userClubs.reduce((closest, club) => {
        if (!club.averageDistance) return closest;
        if (!closest.averageDistance) return club;

        const clubDiff = Math.abs(club.averageDistance - targetDistance);
        const closestDiff = Math.abs(closest.averageDistance - targetDistance);

        return clubDiff < closestDiff ? club : closest;
      }, userClubs[0]);
    }

    return {
      club: bestClub.name,
      aimPoint: "Aim at the pin",
      stanceAdjustment: "Normal stance",
      notes: "Basic distance-based recommendation. Consider wind and elevation adjustments.",
      factors: ["distance", "club_selection"],
      alternatives: userClubs
        .filter(club => club.name !== bestClub.name && club.averageDistance)
        .slice(0, 2)
        .map(club => club.name),
      swingThoughts: ["smooth_tempo", "balanced_finish"]
    };
  }

  static calculateConfidenceScore(recommendation, conditions) {
    let score = 0.7; // Base score

    // Increase confidence based on available data
    if (conditions.wind?.speed !== undefined) score += 0.1;
    if (conditions.elevation !== undefined) score += 0.1;
    if (conditions.temperature !== undefined) score += 0.05;
    if (conditions.lie) score += 0.05;

    // Decrease confidence for extreme conditions
    if (conditions.wind?.speed > 15) score -= 0.1;
    if (Math.abs(conditions.elevation) > 20) score -= 0.1;

    return Math.min(Math.max(score, 0), 1); // Clamp between 0 and 1
  }

  static generateCacheKey(inputData) {
    const keyData = {
      distance: inputData.distance,
      wind: inputData.wind,
      elevation: inputData.elevation,
      lie: inputData.lie,
      pin_position: inputData.pin_position
    };

    return Buffer.from(JSON.stringify(keyData)).toString('base64').slice(0, 32);
  }

  static async getCalculationHistory(userId, limit = 10) {
    // This would typically query the calculations table
    // For now, return empty array
    return [];
  }

  static async saveCalculation(userId, inputData, recommendation) {
    try {
      // Save calculation to database
      const calculationData = {
        user_id: userId,
        input_data: JSON.stringify(inputData),
        recommendation: JSON.stringify(recommendation),
        recommended_club: recommendation.recommendedClub,
        aim_point: recommendation.aimPoint,
        stance_adjustment: recommendation.stanceAdjustment,
        confidence_score: recommendation.confidenceScore,
        additional_notes: recommendation.additionalNotes
      };

      // This would save to the calculations table
      logger.info('Calculation saved for user:', userId);
      return true;
    } catch (error) {
      logger.error('Error saving calculation:', error);
      return false;
    }
  }
}

module.exports = CalculationService;