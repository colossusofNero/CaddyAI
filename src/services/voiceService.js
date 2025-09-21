const OpenAI = require('openai');
const logger = require('../utils/logger');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

class VoiceService {
  /**
   * Convert audio buffer to text using OpenAI Whisper
   */
  static async speechToText(audioBuffer, format = 'webm') {
    try {
      const transcription = await openai.audio.transcriptions.create({
        file: audioBuffer,
        model: 'whisper-1',
        response_format: 'json',
        language: 'en'
      });

      logger.info('Speech transcribed successfully');
      return transcription.text;
    } catch (error) {
      logger.error('Speech to text error:', error);
      throw new Error('Failed to transcribe audio');
    }
  }

  /**
   * Convert text to speech using OpenAI TTS
   */
  static async textToSpeech(text, voice = 'alloy') {
    try {
      const response = await openai.audio.speech.create({
        model: 'tts-1',
        voice: voice, // alloy, echo, fable, onyx, nova, shimmer
        input: text,
        response_format: 'mp3'
      });

      logger.info('Text to speech generated successfully');
      return Buffer.from(await response.arrayBuffer());
    } catch (error) {
      logger.error('Text to speech error:', error);
      throw new Error('Failed to generate speech');
    }
  }

  /**
   * Parse voice input to extract golf shot parameters
   */
  static async parseVoiceInput(transcribedText) {
    try {
      const prompt = `
Parse this golf shot description and extract the relevant parameters in JSON format.

Input: "${transcribedText}"

Extract these parameters if mentioned:
- distance (in yards)
- wind (speed in mph and direction like "into", "following", "left to right", etc.)
- elevation (uphill/downhill in feet or general terms)
- lie (fairway, rough, sand, fringe, etc.)
- pin_position (front, middle, back)
- shot_shape (draw, fade, straight)
- target (pin, left side, right side, etc.)
- course_conditions (firm, soft, wet, dry)
- pressure_situation (casual, tournament, practice)

If something isn't mentioned, don't include it in the response.

Examples:
"I'm 150 yards out with a 10 mph headwind" -> {"distance": 150, "wind": {"speed": 10, "direction": "into"}}
"130 to the pin, pin is back, slight uphill" -> {"distance": 130, "pin_position": "back", "elevation": 5}

Return ONLY valid JSON:`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [
          {
            role: "system",
            content: "You are a golf assistant that parses voice commands. Return only valid JSON with extracted parameters."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 300,
        temperature: 0.1,
        response_format: { type: "json_object" }
      });

      const response = completion.choices[0].message.content;
      const parsedData = JSON.parse(response);

      logger.info('Voice input parsed successfully:', parsedData);
      return parsedData;
    } catch (error) {
      logger.error('Voice parsing error:', error);

      // Fallback: try to extract basic distance
      const distanceMatch = transcribedText.match(/(\d+)\s*(?:yards?|y)/i);
      if (distanceMatch) {
        return { distance: parseInt(distanceMatch[1]) };
      }

      throw new Error('Failed to parse voice input');
    }
  }

  /**
   * Generate spoken recommendation from calculation result
   */
  static generateSpokenRecommendation(recommendation) {
    try {
      const {
        recommendedClub,
        aimPoint,
        stanceAdjustment,
        additionalNotes,
        confidenceScore
      } = recommendation;

      let spokenText = `I recommend the ${recommendedClub}`;

      if (aimPoint && aimPoint !== 'Aim at the pin') {
        spokenText += `. ${aimPoint}`;
      }

      if (stanceAdjustment && stanceAdjustment !== 'Normal stance') {
        spokenText += `. ${stanceAdjustment}`;
      }

      if (additionalNotes) {
        const cleanNotes = additionalNotes
          .replace(/\b(Note:|Remember:|Also:)\s*/gi, '')
          .replace(/\.$/, '');
        spokenText += `. ${cleanNotes}`;
      }

      // Add confidence indicator for low confidence
      if (confidenceScore < 0.6) {
        spokenText += '. This recommendation has lower confidence due to limited information.';
      }

      spokenText += '. Good luck with your shot!';

      logger.info('Spoken recommendation generated');
      return spokenText;
    } catch (error) {
      logger.error('Error generating spoken recommendation:', error);
      return 'I recommend taking your time and choosing a club that feels right for the distance.';
    }
  }

  /**
   * Process complete voice interaction: speech -> text -> parse -> calculate -> speak
   */
  static async processVoiceInteraction(audioBuffer, userId, calculationService) {
    try {
      // Step 1: Convert speech to text
      const transcribedText = await this.speechToText(audioBuffer);

      // Step 2: Parse voice input to extract parameters
      const parsedData = await this.parseVoiceInput(transcribedText);

      // Validate that we have at least distance
      if (!parsedData.distance) {
        throw new Error('Could not extract distance from voice input. Please specify the distance to target.');
      }

      // Step 3: Get calculation recommendation
      const recommendation = await calculationService.calculateRecommendation(userId, parsedData);

      // Step 4: Generate spoken response
      const spokenRecommendation = this.generateSpokenRecommendation(recommendation);

      // Step 5: Convert to speech
      const audioBuffer = await this.textToSpeech(spokenRecommendation);

      return {
        transcribedText,
        parsedData,
        recommendation,
        spokenRecommendation,
        audioBuffer: audioBuffer.toString('base64'), // Return as base64 for API response
        originalAudio: audioBuffer
      };
    } catch (error) {
      logger.error('Voice interaction processing error:', error);
      throw error;
    }
  }

  /**
   * Get available TTS voices
   */
  static getAvailableVoices() {
    return [
      { id: 'alloy', name: 'Alloy', description: 'Neutral, balanced voice' },
      { id: 'echo', name: 'Echo', description: 'Clear, crisp voice' },
      { id: 'fable', name: 'Fable', description: 'Warm, storytelling voice' },
      { id: 'onyx', name: 'Onyx', description: 'Deep, authoritative voice' },
      { id: 'nova', name: 'Nova', description: 'Bright, energetic voice' },
      { id: 'shimmer', name: 'Shimmer', description: 'Gentle, soothing voice' }
    ];
  }

  /**
   * Clean and prepare text for TTS
   */
  static sanitizeTextForSpeech(text) {
    return text
      .replace(/[^\w\s.,!?-]/g, '') // Remove special characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
      .substring(0, 4000); // Limit length for TTS API
  }

  /**
   * Validate audio format and size
   */
  static validateAudioInput(buffer, mimetype) {
    const maxSize = 25 * 1024 * 1024; // 25MB limit
    const supportedFormats = [
      'audio/wav',
      'audio/mp3',
      'audio/mpeg',
      'audio/mp4',
      'audio/webm',
      'audio/ogg'
    ];

    if (buffer.length > maxSize) {
      throw new Error('Audio file too large. Maximum size is 25MB.');
    }

    if (!supportedFormats.includes(mimetype)) {
      throw new Error(`Unsupported audio format: ${mimetype}`);
    }

    return true;
  }
}

module.exports = VoiceService;