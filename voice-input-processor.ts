// Voice Input Processor
// Combines NLP parsing and grammar system for complete input recognition

import { GolfNLPParser, GolfConditions } from './golf-nlp-parser';
import { VoiceGrammarSystem } from './voice-command-grammar';

export interface ProcessedInput {
  intent: string;
  confidence: number;
  conditions: GolfConditions;
  missingInformation: string[];
  validationErrors: string[];
  needsConfirmation: boolean;
  sessionContext: SessionContext;
}

export interface SessionContext {
  previousConditions: GolfConditions | null;
  conversationState: 'initial' | 'collecting_info' | 'confirming' | 'recommending';
  attempts: number;
  lastRecommendation: any | null;
}

export interface InputProcessingOptions {
  requireConfirmation: boolean;
  maxAttempts: number;
  confidenceThreshold: number;
  enableContextualUnderstanding: boolean;
}

export class VoiceInputProcessor {
  private nlpParser: GolfNLPParser;
  private grammarSystem: VoiceGrammarSystem;
  private sessionContext: SessionContext;
  private options: InputProcessingOptions;

  constructor(options?: Partial<InputProcessingOptions>) {
    this.nlpParser = new GolfNLPParser();
    this.grammarSystem = new VoiceGrammarSystem();
    this.sessionContext = this.initializeSession();
    this.options = {
      requireConfirmation: true,
      maxAttempts: 3,
      confidenceThreshold: 0.7,
      enableContextualUnderstanding: true,
      ...options
    };
  }

  private initializeSession(): SessionContext {
    return {
      previousConditions: null,
      conversationState: 'initial',
      attempts: 0,
      lastRecommendation: null
    };
  }

  // Main processing method
  async processInput(rawInput: string): Promise<ProcessedInput> {
    this.sessionContext.attempts++;

    // Step 1: Parse using grammar system for intent recognition
    const grammarResult = this.grammarSystem.parseInput(rawInput);

    // Step 2: Parse using NLP for condition extraction
    const conditions = this.nlpParser.parse(rawInput);

    // Step 3: Merge with context if enabled
    const mergedConditions = this.options.enableContextualUnderstanding
      ? this.mergeWithContext(conditions)
      : conditions;

    // Step 4: Validate parsed conditions
    const validation = this.nlpParser.validateConditions(mergedConditions);

    // Step 5: Determine missing information
    const missingInfo = this.identifyMissingInformation(
      grammarResult.intent,
      mergedConditions,
      grammarResult.missingSlots
    );

    // Step 6: Update session state
    this.updateSessionState(grammarResult.intent, mergedConditions);

    return {
      intent: grammarResult.intent,
      confidence: grammarResult.confidence,
      conditions: mergedConditions,
      missingInformation: missingInfo,
      validationErrors: validation.errors,
      needsConfirmation: this.shouldRequireConfirmation(grammarResult, mergedConditions),
      sessionContext: { ...this.sessionContext }
    };
  }

  private mergeWithContext(newConditions: GolfConditions): GolfConditions {
    if (!this.sessionContext.previousConditions) {
      return newConditions;
    }

    const merged: GolfConditions = {
      distance: newConditions.distance || this.sessionContext.previousConditions.distance,
      elevation: newConditions.elevation || this.sessionContext.previousConditions.elevation,
      wind: newConditions.wind || this.sessionContext.previousConditions.wind,
      lie: newConditions.lie || this.sessionContext.previousConditions.lie,
      temperature: newConditions.temperature || this.sessionContext.previousConditions.temperature,
      humidity: newConditions.humidity || this.sessionContext.previousConditions.humidity,
      hazards: newConditions.hazards.length > 0
        ? newConditions.hazards
        : this.sessionContext.previousConditions.hazards
    };

    return merged;
  }

  private identifyMissingInformation(
    intent: string,
    conditions: GolfConditions,
    missingSlots: string[]
  ): string[] {
    const missing: string[] = [];

    // Check grammar-based missing slots
    missing.push(...missingSlots);

    // Check essential conditions for club recommendation
    if (intent === 'GET_CLUB_RECOMMENDATION') {
      if (!conditions.distance) {
        missing.push('distance');
      }

      // Optional but recommended information
      if (this.sessionContext.conversationState === 'initial') {
        if (!conditions.wind && missing.length === 0) {
          missing.push('wind'); // Only ask for wind if no other info missing
        }
      }
    }

    return [...new Set(missing)]; // Remove duplicates
  }

  private shouldRequireConfirmation(
    grammarResult: any,
    conditions: GolfConditions
  ): boolean {
    if (!this.options.requireConfirmation) {
      return false;
    }

    // Require confirmation if confidence is low
    if (grammarResult.confidence < this.options.confidenceThreshold) {
      return true;
    }

    // Require confirmation for complex conditions
    const conditionCount = Object.values(conditions).filter(v =>
      v !== null && (Array.isArray(v) ? v.length > 0 : true)
    ).length;

    return conditionCount >= 4; // Many conditions = confirm
  }

  private updateSessionState(intent: string, conditions: GolfConditions): void {
    this.sessionContext.previousConditions = conditions;

    switch (intent) {
      case 'GET_CLUB_RECOMMENDATION':
        this.sessionContext.conversationState = 'collecting_info';
        break;

      case 'CONFIRM_RECOMMENDATION':
        this.sessionContext.conversationState = 'recommending';
        break;

      case 'UPDATE_CONDITIONS':
        this.sessionContext.conversationState = 'collecting_info';
        break;

      default:
        // Keep current state
        break;
    }
  }

  // Generate appropriate response based on processing result
  generateResponse(result: ProcessedInput): {
    type: 'question' | 'confirmation' | 'recommendation' | 'error';
    message: string;
    suggestedActions?: string[];
  } {
    // Handle validation errors first
    if (result.validationErrors.length > 0) {
      return {
        type: 'error',
        message: `I noticed some issues: ${result.validationErrors.join(', ')}. Please try again.`,
        suggestedActions: ['Try rephrasing your input', 'Check your numbers']
      };
    }

    // Handle missing information
    if (result.missingInformation.length > 0) {
      const missingSlot = result.missingInformation[0];
      const prompt = this.grammarSystem.getSlotPrompt(missingSlot);

      return {
        type: 'question',
        message: prompt,
        suggestedActions: this.getSuggestionsForSlot(missingSlot)
      };
    }

    // Handle confirmation requests
    if (result.needsConfirmation) {
      const confirmation = this.grammarSystem.generateConfirmation(
        this.conditionsToSlots(result.conditions)
      );

      return {
        type: 'confirmation',
        message: confirmation,
        suggestedActions: ['Say yes or no', 'Make corrections if needed']
      };
    }

    // Handle low confidence
    if (result.confidence < this.options.confidenceThreshold) {
      return {
        type: 'error',
        message: "I'm not sure I understood that correctly. Could you please rephrase?",
        suggestedActions: [
          'Try being more specific',
          'Use clear numbers for distances',
          'Mention wind and elevation clearly'
        ]
      };
    }

    // Ready for recommendation
    return {
      type: 'recommendation',
      message: 'Great! Let me analyze these conditions and give you a recommendation.',
      suggestedActions: ['Wait for club recommendation']
    };
  }

  private conditionsToSlots(conditions: GolfConditions): Record<string, any> {
    const slots: Record<string, any> = {};

    if (conditions.distance) {
      slots.distance = conditions.distance.value;
    }
    if (conditions.elevation) {
      slots.elevation = conditions.elevation.direction;
    }
    if (conditions.wind) {
      slots.wind = conditions.wind.direction;
      slots.wind_speed = conditions.wind.speed;
    }
    if (conditions.lie) {
      slots.lie = conditions.lie;
    }
    if (conditions.temperature) {
      slots.temperature = conditions.temperature.value;
    }

    return slots;
  }

  private getSuggestionsForSlot(slotName: string): string[] {
    const suggestions: Record<string, string[]> = {
      distance: [
        'Say "150 yards"',
        'Try "350 to the pin"',
        'Use "125 yards out"'
      ],
      elevation: [
        'Say "uphill" or "downhill"',
        'Try "5 feet uphill"',
        'Use "playing down"'
      ],
      wind: [
        'Say "10 mph headwind"',
        'Try "5 mph tailwind"',
        'Use "crosswind from the right"'
      ],
      lie: [
        'Say "fairway" or "rough"',
        'Try "from the tee"',
        'Use "sand" or "bunker"'
      ],
      temperature: [
        'Say "75 degrees"',
        'Try "cold" or "warm"',
        'Use specific temperature'
      ]
    };

    return suggestions[slotName] || ['Try being more specific'];
  }

  // Helper methods for session management
  resetSession(): void {
    this.sessionContext = this.initializeSession();
  }

  getSessionContext(): SessionContext {
    return { ...this.sessionContext };
  }

  updateSessionContext(updates: Partial<SessionContext>): void {
    this.sessionContext = { ...this.sessionContext, ...updates };
  }

  // Check if we should give up due to too many attempts
  shouldGiveUp(): boolean {
    return this.sessionContext.attempts >= this.options.maxAttempts;
  }

  // Generate helpful error message when giving up
  generateGiveUpMessage(): string {
    return `I'm having trouble understanding your input after ${this.options.maxAttempts} attempts.
            Let's start over. Try saying something like "I have 150 yards to the pin with a
            10 mph headwind from the fairway."`;
  }

  // Contextual understanding helpers
  handlePartialUpdate(updateType: string, updateValue: any): ProcessedInput {
    if (!this.sessionContext.previousConditions) {
      throw new Error('No previous conditions to update');
    }

    const updatedConditions = { ...this.sessionContext.previousConditions };

    switch (updateType.toLowerCase()) {
      case 'distance':
        updatedConditions.distance = {
          value: updateValue,
          unit: 'yards',
          target: 'pin'
        };
        break;

      case 'wind':
        if (typeof updateValue === 'object') {
          updatedConditions.wind = updateValue;
        }
        break;

      case 'elevation':
        if (typeof updateValue === 'object') {
          updatedConditions.elevation = updateValue;
        }
        break;

      case 'lie':
        updatedConditions.lie = updateValue;
        break;

      case 'temperature':
        updatedConditions.temperature = {
          value: updateValue,
          unit: 'fahrenheit'
        };
        break;
    }

    this.sessionContext.previousConditions = updatedConditions;

    return {
      intent: 'UPDATE_CONDITIONS',
      confidence: 0.9,
      conditions: updatedConditions,
      missingInformation: [],
      validationErrors: [],
      needsConfirmation: false,
      sessionContext: { ...this.sessionContext }
    };
  }
}