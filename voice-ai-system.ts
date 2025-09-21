// Main Voice AI System
// Integrates all components for complete golf voice AI functionality

import { GolfNLPParser, GolfConditions } from './golf-nlp-parser';
import { VoiceGrammarSystem } from './voice-command-grammar';
import { VoiceInputProcessor, ProcessedInput } from './voice-input-processor';
import { VoiceOutputGenerator, ClubRecommendation } from './voice-output-generator';
import { VoiceErrorHandler } from './error-handler';
import { DialogueManager, DialogueState } from './dialogue-manager';
import { SpeechManager, SpeechConfig } from './speech-api-integration';

export interface VoiceAIConfig {
  speechConfig: SpeechConfig;
  personalityStyle: 'professional' | 'casual' | 'encouraging';
  verbosityLevel: 'concise' | 'detailed' | 'comprehensive';
  enableContextualUnderstanding: boolean;
  requireConfirmation: boolean;
  maxRetries: number;
  confidenceThreshold: number;
}

export interface VoiceAIResponse {
  spokenText: string;
  audioData?: ArrayBuffer;
  recommendation?: ClubRecommendation;
  state: DialogueState;
  needsInput: boolean;
  expectedInput?: string[];
  confidence: number;
  sessionId: string;
}

export interface VoiceAISession {
  id: string;
  startTime: Date;
  lastActivity: Date;
  conditions: Partial<GolfConditions>;
  recommendation: ClubRecommendation | null;
  state: DialogueState;
  attemptCount: number;
}

export class VoiceAISystem {
  private nlpParser: GolfNLPParser;
  private grammarSystem: VoiceGrammarSystem;
  private inputProcessor: VoiceInputProcessor;
  private outputGenerator: VoiceOutputGenerator;
  private errorHandler: VoiceErrorHandler;
  private dialogueManager: DialogueManager;
  private speechManager: SpeechManager;
  private config: VoiceAIConfig;

  constructor(config: VoiceAIConfig) {
    this.config = config;
    this.initializeComponents();
  }

  private initializeComponents(): void {
    // Initialize core NLP components
    this.nlpParser = new GolfNLPParser();
    this.grammarSystem = new VoiceGrammarSystem();

    // Initialize input processor
    this.inputProcessor = new VoiceInputProcessor({
      requireConfirmation: this.config.requireConfirmation,
      maxAttempts: this.config.maxRetries,
      confidenceThreshold: this.config.confidenceThreshold,
      enableContextualUnderstanding: this.config.enableContextualUnderstanding
    });

    // Initialize output generator
    this.outputGenerator = new VoiceOutputGenerator({
      verbosityLevel: this.config.verbosityLevel,
      includeExplanations: this.config.verbosityLevel !== 'concise',
      useGolfTerminology: true,
      personalityStyle: this.config.personalityStyle
    });

    // Initialize error handler
    this.errorHandler = new VoiceErrorHandler({
      maxRetries: this.config.maxRetries,
      personalityStyle: this.config.personalityStyle,
      enableFuzzyMatching: true,
      verboseErrors: this.config.verbosityLevel === 'comprehensive'
    });

    // Initialize dialogue manager
    this.dialogueManager = new DialogueManager({
      skillLevel: 'intermediate',
      communicationStyle: this.config.verbosityLevel === 'concise' ? 'concise' : 'detailed',
      preferredUnits: 'imperial'
    });

    // Initialize speech manager
    this.speechManager = new SpeechManager(this.config.speechConfig);
  }

  // Main entry point for processing voice input
  async processVoiceInput(audioData: ArrayBuffer): Promise<VoiceAIResponse> {
    try {
      // Step 1: Convert speech to text
      const speechResult = await this.speechManager.recognizeSpeech(audioData);

      if (!speechResult.transcript || speechResult.confidence < 0.5) {
        return this.handleLowConfidenceSpeech(speechResult);
      }

      // Step 2: Process the text input
      return this.processTextInput(speechResult.transcript);

    } catch (error) {
      console.error('Voice processing error:', error);
      return this.generateErrorResponse('Sorry, I had trouble understanding your voice. Please try again.');
    }
  }

  // Process text input (can be used directly or from speech recognition)
  async processTextInput(text: string): Promise<VoiceAIResponse> {
    try {
      // Step 1: Parse the input
      const processedInput = await this.inputProcessor.processInput(text);

      // Step 2: Handle any errors
      if (processedInput.validationErrors.length > 0) {
        return this.handleInputErrors(processedInput);
      }

      // Step 3: Process through dialogue manager
      const dialogueResponse = this.dialogueManager.processInput(processedInput);

      // Step 4: Generate appropriate response
      const response = await this.generateResponse(dialogueResponse, processedInput);

      return response;

    } catch (error) {
      console.error('Text processing error:', error);
      return this.generateErrorResponse('I encountered an error processing your input. Please try again.');
    }
  }

  private async handleLowConfidenceSpeech(speechResult: any): Promise<VoiceAIResponse> {
    const errorResponse = this.errorHandler.handleError({
      errorType: 'SPEECH_RECOGNITION_ERROR',
      originalInput: speechResult.transcript || '',
      attemptNumber: 1,
      confidence: speechResult.confidence,
      suggestedFixes: ['Speak more clearly', 'Check microphone']
    });

    return {
      spokenText: errorResponse.response,
      audioData: await this.synthesizeSpeech(errorResponse.response),
      state: this.dialogueManager.getCurrentState(),
      needsInput: true,
      expectedInput: errorResponse.actions,
      confidence: 0,
      sessionId: this.dialogueManager.getContext().sessionId
    };
  }

  private async handleInputErrors(processedInput: ProcessedInput): Promise<VoiceAIResponse> {
    const errorResponse = this.errorHandler.handleError({
      errorType: 'INVALID_VALUE',
      originalInput: processedInput.conditions.toString(),
      attemptNumber: processedInput.sessionContext.attempts,
      validationErrors: processedInput.validationErrors,
      confidence: processedInput.confidence
    });

    return {
      spokenText: errorResponse.response,
      audioData: await this.synthesizeSpeech(errorResponse.response),
      state: this.dialogueManager.getCurrentState(),
      needsInput: true,
      expectedInput: errorResponse.actions,
      confidence: processedInput.confidence,
      sessionId: this.dialogueManager.getContext().sessionId
    };
  }

  private async generateResponse(dialogueResponse: any, processedInput: ProcessedInput): Promise<VoiceAIResponse> {
    let spokenText = dialogueResponse.message;
    let recommendation: ClubRecommendation | undefined;
    let audioData: ArrayBuffer | undefined;

    // If we're providing a recommendation, generate it
    if (dialogueResponse.state === 'PROVIDING_RECOMMENDATION') {
      const context = this.dialogueManager.getContext();
      if (context.conditions) {
        const recommendationResult = this.outputGenerator.generateRecommendation(context.conditions as GolfConditions);
        recommendation = recommendationResult.recommendation;
        spokenText = recommendationResult.spokenText;
      }
    }

    // Generate audio
    audioData = await this.synthesizeSpeech(spokenText);

    return {
      spokenText,
      audioData,
      recommendation,
      state: dialogueResponse.state,
      needsInput: !!dialogueResponse.expectedResponse,
      expectedInput: dialogueResponse.expectedResponse,
      confidence: processedInput.confidence,
      sessionId: this.dialogueManager.getContext().sessionId
    };
  }

  private async generateErrorResponse(message: string): Promise<VoiceAIResponse> {
    return {
      spokenText: message,
      audioData: await this.synthesizeSpeech(message),
      state: this.dialogueManager.getCurrentState(),
      needsInput: true,
      confidence: 0,
      sessionId: this.dialogueManager.getContext().sessionId
    };
  }

  private async synthesizeSpeech(text: string): Promise<ArrayBuffer> {
    try {
      const result = await this.speechManager.synthesizeSpeech(text, {
        speakingRate: this.config.personalityStyle === 'casual' ? 1.1 : 1.0,
        pitch: this.config.personalityStyle === 'encouraging' ? 0.1 : 0.0,
        audioEncoding: 'MP3'
      });
      return result.audioData;
    } catch (error) {
      console.error('Speech synthesis error:', error);
      throw error;
    }
  }

  // Public API methods
  async startSession(): Promise<VoiceAIResponse> {
    this.dialogueManager.resetSession();

    const greeting = "Welcome to your AI golf caddy! I'm here to help you choose the perfect club. Tell me about your shot - distance, conditions, and lie.";

    return {
      spokenText: greeting,
      audioData: await this.synthesizeSpeech(greeting),
      state: 'GREETING',
      needsInput: true,
      expectedInput: ['shot_conditions'],
      confidence: 1.0,
      sessionId: this.dialogueManager.getContext().sessionId
    };
  }

  getSession(): VoiceAISession {
    const context = this.dialogueManager.getContext();
    return {
      id: context.sessionId,
      startTime: context.startTime,
      lastActivity: context.lastActivity,
      conditions: context.conditions,
      recommendation: context.recommendation,
      state: context.currentState,
      attemptCount: context.attemptCount
    };
  }

  resetSession(): void {
    this.dialogueManager.resetSession();
    this.inputProcessor.resetSession();
  }

  updateConfiguration(updates: Partial<VoiceAIConfig>): void {
    this.config = { ...this.config, ...updates };

    // Update individual components
    if (updates.personalityStyle) {
      this.outputGenerator.updateOptions({ personalityStyle: updates.personalityStyle });
      this.errorHandler.updateOptions({ personalityStyle: updates.personalityStyle });
    }

    if (updates.verbosityLevel) {
      this.outputGenerator.updateOptions({
        verbosityLevel: updates.verbosityLevel,
        includeExplanations: updates.verbosityLevel !== 'concise'
      });
    }

    if (updates.speechConfig) {
      this.speechManager.updateConfig(updates.speechConfig);
    }
  }

  // Utility methods
  async recordAndProcess(durationMs: number = 5000): Promise<VoiceAIResponse> {
    try {
      const audioData = await SpeechManager.recordAudio(durationMs);
      return this.processVoiceInput(audioData);
    } catch (error) {
      console.error('Recording error:', error);
      return this.generateErrorResponse('I had trouble accessing your microphone. Please check your audio settings.');
    }
  }

  async playResponse(response: VoiceAIResponse): Promise<void> {
    if (response.audioData) {
      await SpeechManager.playAudio(response.audioData, 'MP3');
    }
  }

  getStatistics(): {
    sessionInfo: VoiceAISession;
    errorStats: any;
    speechConfig: SpeechConfig;
  } {
    return {
      sessionInfo: this.getSession(),
      errorStats: this.errorHandler.getErrorStatistics(),
      speechConfig: this.speechManager.getConfig()
    };
  }

  // Example usage methods
  static async createGolfCaddy(apiKey: string, provider: 'google' | 'azure' = 'google'): Promise<VoiceAISystem> {
    const config: VoiceAIConfig = {
      speechConfig: {
        provider,
        apiKey,
        region: provider === 'azure' ? 'eastus' : undefined,
        language: 'en-US',
        sampleRate: 16000,
        enableProfanityFilter: false,
        enableAutomaticPunctuation: true,
        enableWordTimeOffsets: true
      },
      personalityStyle: 'professional',
      verbosityLevel: 'detailed',
      enableContextualUnderstanding: true,
      requireConfirmation: true,
      maxRetries: 3,
      confidenceThreshold: 0.7
    };

    return new VoiceAISystem(config);
  }

  // Demo/testing methods
  async processGolfScenario(scenario: {
    distance: number;
    elevation?: string;
    wind?: string;
    lie?: string;
    temperature?: number;
  }): Promise<VoiceAIResponse> {
    const inputText = this.scenarioToText(scenario);
    return this.processTextInput(inputText);
  }

  private scenarioToText(scenario: any): string {
    const parts: string[] = [];

    parts.push(`${scenario.distance} yards to the pin`);

    if (scenario.elevation) {
      parts.push(scenario.elevation);
    }

    if (scenario.wind) {
      parts.push(`with ${scenario.wind} wind`);
    }

    if (scenario.lie) {
      parts.push(`from the ${scenario.lie}`);
    }

    if (scenario.temperature) {
      parts.push(`temperature is ${scenario.temperature} degrees`);
    }

    return parts.join(', ');
  }
}

// Export for easy consumption
export default VoiceAISystem;