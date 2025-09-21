/**
 * Voice Test Runner - Framework for automated voice input testing
 */

const fs = require('fs').promises;
const path = require('path');

class VoiceTestRunner {
  constructor(config = {}) {
    this.config = {
      recordingPath: config.recordingPath || './test-recordings',
      speechApiEndpoint: config.speechApiEndpoint || 'mock://speech-api',
      timeout: config.timeout || 5000,
      noiseProfiles: config.noiseProfiles || this.getDefaultNoiseProfiles(),
      ...config
    };

    this.mockSpeechService = null;
    this.testResults = [];
  }

  async initialize() {
    // Set up mock speech recognition service for testing
    this.mockSpeechService = new MockSpeechRecognitionService();
    await this.mockSpeechService.initialize();

    // Create recording directory if it doesn't exist
    try {
      await fs.mkdir(this.config.recordingPath, { recursive: true });
    } catch (error) {
      console.warn('Could not create recording directory:', error.message);
    }
  }

  async cleanup() {
    if (this.mockSpeechService) {
      await this.mockSpeechService.cleanup();
    }

    // Save test results
    await this.saveTestResults();
  }

  /**
   * Test a single voice command
   */
  async testCommand(command, options = {}) {
    const startTime = Date.now();

    try {
      // If command has audio file, use it; otherwise use mock
      let audioInput;
      if (command.audioFile) {
        audioInput = await this.loadAudioFile(command.audioFile);
      } else {
        audioInput = this.generateMockAudio(command.text, command.accent || 'neutral');
      }

      // Apply noise/effects if specified
      if (options.noise) {
        audioInput = this.addNoise(audioInput, options.noise);
      }

      if (options.speechRate) {
        audioInput = this.adjustSpeechRate(audioInput, options.speechRate);
      }

      if (options.volume) {
        audioInput = this.adjustVolume(audioInput, options.volume);
      }

      // Process through speech recognition
      const recognitionResult = await this.mockSpeechService.recognize(audioInput, {
        timeout: this.config.timeout
      });

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      // Analyze results
      const result = {
        command: command.text,
        recognized: recognitionResult.success,
        transcription: recognitionResult.transcription,
        confidence: recognitionResult.confidence,
        intent: recognitionResult.intent,
        entities: recognitionResult.entities,
        processingTime,
        needsClarification: recognitionResult.needsClarification,
        needsMoreInfo: recognitionResult.needsMoreInfo,
        clarificationPrompt: recognitionResult.clarificationPrompt,
        errorHandled: recognitionResult.errorHandled,
        helpOffered: recognitionResult.helpOffered,
        audioConfirmation: options.audioFeedback && recognitionResult.success,
        timestamp: new Date().toISOString()
      };

      this.testResults.push(result);
      return result;

    } catch (error) {
      const endTime = Date.now();
      const result = {
        command: command.text,
        recognized: false,
        error: error.message,
        processingTime: endTime - startTime,
        timestamp: new Date().toISOString()
      };

      this.testResults.push(result);
      return result;
    }
  }

  /**
   * Test multiple commands with specific accent
   */
  async testAccent(accentConfig) {
    const results = [];

    for (const command of accentConfig.commands) {
      const result = await this.testCommand({
        text: command,
        accent: accentConfig.accent
      });
      results.push(result);
    }

    return results;
  }

  /**
   * Test commands with background noise
   */
  async testWithNoise(noiseType, commands) {
    const results = [];

    for (const command of commands) {
      const result = await this.testCommand(command, {
        noise: noiseType
      });
      results.push(result);
    }

    return results;
  }

  /**
   * Test commands with different speech rates
   */
  async testWithSpeechRate(rate, commands) {
    const results = [];

    for (const command of commands) {
      const result = await this.testCommand(command, {
        speechRate: rate
      });
      results.push(result);
    }

    return results;
  }

  /**
   * Test commands with different volumes
   */
  async testWithVolume(volume, commands) {
    const results = [];

    for (const command of commands) {
      const result = await this.testCommand(command, {
        volume: volume
      });
      results.push(result);
    }

    return results;
  }

  /**
   * Test a conversation flow with context
   */
  async testConversationFlow(flow) {
    const results = [];
    let context = {};

    for (let i = 0; i < flow.commands.length; i++) {
      const command = flow.commands[i];

      // Set up context from previous commands
      if (i > 0) {
        command.context = context;
      }

      const result = await this.testCommand(command);

      // Update context based on result
      if (result.recognized && result.entities) {
        context = { ...context, ...result.entities };
      }

      result.usedContext = i > 0 && command.context !== undefined;
      results.push(result);
    }

    return results;
  }

  /**
   * Test command sequence with pronoun resolution
   */
  async testCommandSequence(sequence) {
    const results = [];
    let referenceContext = {};

    for (const command of sequence.commands) {
      const result = await this.testCommand({
        ...command,
        referenceContext
      });

      // Check if pronouns were resolved correctly
      if (command.expectedReferences) {
        result.pronounResolved = this.validatePronounResolution(
          result.entities,
          command.expectedReferences
        );
      }

      // Update reference context
      if (result.entities) {
        referenceContext = { ...referenceContext, ...result.entities };
      }

      results.push(result);
    }

    return results;
  }

  /**
   * Test integrated command (voice + calculation)
   */
  async testIntegratedCommand(testConfig) {
    const voiceResult = await this.testCommand(testConfig.command);

    if (!voiceResult.recognized) {
      return {
        voiceRecognized: false,
        calculationTriggered: false,
        responseDelivered: false
      };
    }

    // Mock calculation trigger
    const calculationTriggered = await this.mockCalculationService(
      voiceResult.intent,
      voiceResult.entities
    );

    // Mock response delivery
    const responseDelivered = calculationTriggered &&
      await this.mockResponseService(calculationTriggered);

    return {
      voiceRecognized: true,
      calculationTriggered: !!calculationTriggered,
      responseDelivered: !!responseDelivered,
      voiceResult,
      calculationResult: calculationTriggered
    };
  }

  /**
   * Run load testing
   */
  async runLoadTest(commands, loadConfig) {
    const { concurrent, iterations } = loadConfig;
    const allResults = [];

    for (let i = 0; i < iterations; i++) {
      const batch = [];

      // Create concurrent promises
      for (let j = 0; j < concurrent; j++) {
        const command = commands[Math.floor(Math.random() * commands.length)];
        batch.push(this.testCommand(command));
      }

      // Wait for batch completion
      const batchResults = await Promise.all(batch);
      allResults.push(...batchResults);
    }

    // Analyze results
    const successCount = allResults.filter(r => r.recognized).length;
    const totalResponseTime = allResults.reduce((sum, r) => sum + r.processingTime, 0);

    return {
      totalTests: allResults.length,
      successCount,
      overallSuccessRate: successCount / allResults.length,
      averageResponseTime: totalResponseTime / allResults.length,
      results: allResults
    };
  }

  // Mock/Helper Methods

  async loadAudioFile(filename) {
    try {
      const audioPath = path.join(this.config.recordingPath, filename);
      const audioData = await fs.readFile(audioPath);
      return audioData;
    } catch (error) {
      throw new Error(`Could not load audio file: ${filename}`);
    }
  }

  generateMockAudio(text, accent = 'neutral') {
    // Mock audio generation based on text and accent
    return {
      text,
      accent,
      duration: text.length * 100, // Rough estimate
      quality: 'mock'
    };
  }

  addNoise(audioInput, noiseType) {
    const noiseProfile = this.config.noiseProfiles[noiseType];
    if (!noiseProfile) {
      return audioInput;
    }

    // Mock noise addition
    return {
      ...audioInput,
      noise: noiseProfile,
      quality: audioInput.quality * noiseProfile.qualityReduction
    };
  }

  adjustSpeechRate(audioInput, rate) {
    const rates = {
      'very_slow': 0.5,
      'slow': 0.75,
      'normal': 1.0,
      'fast': 1.25,
      'very_fast': 1.5
    };

    return {
      ...audioInput,
      speechRate: rates[rate] || 1.0
    };
  }

  adjustVolume(audioInput, volume) {
    const volumes = {
      'very_quiet': 0.2,
      'quiet': 0.4,
      'normal': 1.0,
      'loud': 1.5,
      'very_loud': 2.0
    };

    return {
      ...audioInput,
      volume: volumes[volume] || 1.0
    };
  }

  validatePronounResolution(entities, expectedReferences) {
    // Check if pronouns were resolved to expected entities
    for (const [pronoun, expectedEntity] of Object.entries(expectedReferences)) {
      if (!entities[pronoun] || entities[pronoun] !== expectedEntity) {
        return false;
      }
    }
    return true;
  }

  async mockCalculationService(intent, entities) {
    // Mock the calculation service response
    await new Promise(resolve => setTimeout(resolve, 100)); // Simulate processing

    switch (intent) {
      case 'distance_request':
        return { distance: 150, confidence: 0.9 };
      case 'club_recommendation':
        return { club: '7iron', alternatives: ['8iron', '6iron'] };
      case 'weather_request':
        return { wind: '10mph NE', temperature: '75°F' };
      default:
        return null;
    }
  }

  async mockResponseService(calculationResult) {
    // Mock response delivery
    await new Promise(resolve => setTimeout(resolve, 50));
    return calculationResult !== null;
  }

  getDefaultNoiseProfiles() {
    return {
      quiet_indoor: { level: 0.1, qualityReduction: 0.95 },
      wind_noise: { level: 0.3, qualityReduction: 0.8 },
      cart_noise: { level: 0.4, qualityReduction: 0.75 },
      conversation_noise: { level: 0.5, qualityReduction: 0.7 }
    };
  }

  async saveTestResults() {
    if (this.testResults.length === 0) return;

    const resultsFile = path.join(this.config.recordingPath, 'test-results.json');
    try {
      await fs.writeFile(resultsFile, JSON.stringify(this.testResults, null, 2));
    } catch (error) {
      console.warn('Could not save test results:', error.message);
    }
  }
}

/**
 * Mock Speech Recognition Service for testing
 */
class MockSpeechRecognitionService {
  constructor() {
    this.intentPatterns = this.buildIntentPatterns();
  }

  async initialize() {
    // Mock initialization
  }

  async cleanup() {
    // Mock cleanup
  }

  async recognize(audioInput, options = {}) {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // Mock recognition based on audio input
    if (!audioInput || !audioInput.text) {
      return {
        success: false,
        error: 'No audio input'
      };
    }

    // Simulate quality degradation effects
    let confidence = 0.95;

    if (audioInput.noise) {
      confidence *= audioInput.noise.qualityReduction;
    }

    if (audioInput.volume < 0.3) {
      confidence *= 0.7; // Quiet speech reduces confidence
    }

    if (audioInput.speechRate > 1.3) {
      confidence *= 0.8; // Fast speech reduces confidence
    }

    // Determine intent and entities
    const { intent, entities } = this.parseIntent(audioInput.text);

    // Simulate recognition failure for very low confidence
    if (confidence < 0.5) {
      return {
        success: false,
        confidence,
        needsClarification: true,
        clarificationPrompt: "I didn't catch that. Could you repeat your request?"
      };
    }

    return {
      success: true,
      transcription: audioInput.text,
      confidence,
      intent,
      entities,
      needsClarification: confidence < 0.7,
      clarificationPrompt: confidence < 0.7 ? "Did you mean...?" : null
    };
  }

  buildIntentPatterns() {
    return {
      distance_request: [
        /how far.*pin/i,
        /distance.*pin/i,
        /yardage/i,
        /how many yards/i
      ],
      club_recommendation: [
        /what club/i,
        /which club/i,
        /recommend.*club/i,
        /club.*use/i
      ],
      weather_request: [
        /wind/i,
        /weather/i,
        /temperature/i,
        /conditions/i
      ],
      course_info: [
        /tell me about.*hole/i,
        /hole.*info/i,
        /course.*info/i,
        /hazards/i
      ]
    };
  }

  parseIntent(text) {
    let intent = 'unknown';
    const entities = {};

    // Match intent patterns
    for (const [intentName, patterns] of Object.entries(this.intentPatterns)) {
      for (const pattern of patterns) {
        if (pattern.test(text)) {
          intent = intentName;
          break;
        }
      }
      if (intent !== 'unknown') break;
    }

    // Extract entities based on intent
    switch (intent) {
      case 'distance_request':
        const pinMatch = text.match(/pin|flag|hole/i);
        if (pinMatch) entities.target = 'pin';
        break;

      case 'club_recommendation':
        const distanceMatch = text.match(/(\d+)\s*yards?/i);
        if (distanceMatch) entities.distance = parseInt(distanceMatch[1]);
        break;

      case 'weather_request':
        if (text.match(/wind/i)) entities.weatherType = 'wind';
        if (text.match(/temperature/i)) entities.weatherType = 'temperature';
        break;
    }

    return { intent, entities };
  }
}

module.exports = { VoiceTestRunner };