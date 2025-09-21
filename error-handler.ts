// Error Handler for Voice AI System
// Handles ambiguous inputs, validation errors, and recovery strategies

export interface ErrorContext {
  errorType: ErrorType;
  originalInput: string;
  attemptNumber: number;
  sessionContext: any;
  suggestedFixes: string[];
  confidence: number;
}

export type ErrorType =
  | 'AMBIGUOUS_INPUT'
  | 'MISSING_INFORMATION'
  | 'INVALID_VALUE'
  | 'CONFLICTING_CONDITIONS'
  | 'SPEECH_RECOGNITION_ERROR'
  | 'TIMEOUT'
  | 'UNSUPPORTED_COMMAND'
  | 'CONTEXT_LOST';

export interface ErrorRecoveryStrategy {
  type: 'clarify' | 'suggest' | 'fallback' | 'restart';
  message: string;
  actions: string[];
  priority: number;
}

export interface ErrorHandlerOptions {
  maxRetries: number;
  timeoutMs: number;
  enableFuzzyMatching: boolean;
  verboseErrors: boolean;
  personalityStyle: 'professional' | 'casual' | 'encouraging';
}

export class VoiceErrorHandler {
  private options: ErrorHandlerOptions;
  private errorHistory: ErrorContext[] = [];
  private recoveryStrategies: Map<ErrorType, ErrorRecoveryStrategy[]> = new Map();

  constructor(options?: Partial<ErrorHandlerOptions>) {
    this.options = {
      maxRetries: 3,
      timeoutMs: 5000,
      enableFuzzyMatching: true,
      verboseErrors: false,
      personalityStyle: 'professional',
      ...options
    };

    this.initializeRecoveryStrategies();
  }

  private initializeRecoveryStrategies(): void {
    // Ambiguous input strategies
    this.recoveryStrategies.set('AMBIGUOUS_INPUT', [
      {
        type: 'clarify',
        message: 'I heard multiple possible values. Which did you mean?',
        actions: ['Repeat more clearly', 'Use specific numbers', 'Speak slower'],
        priority: 1
      },
      {
        type: 'suggest',
        message: 'Did you mean one of these options?',
        actions: ['Choose from suggestions', 'Provide more context'],
        priority: 2
      }
    ]);

    // Missing information strategies
    this.recoveryStrategies.set('MISSING_INFORMATION', [
      {
        type: 'clarify',
        message: 'I need more information to help you.',
        actions: ['Answer specific question', 'Provide missing details'],
        priority: 1
      },
      {
        type: 'suggest',
        message: 'Here are some typical values for this condition.',
        actions: ['Use suggested values', 'Provide custom values'],
        priority: 2
      }
    ]);

    // Invalid value strategies
    this.recoveryStrategies.set('INVALID_VALUE', [
      {
        type: 'clarify',
        message: 'That value seems outside the normal range.',
        actions: ['Double-check your input', 'Provide corrected value'],
        priority: 1
      },
      {
        type: 'suggest',
        message: 'Did you mean a different unit or value?',
        actions: ['Confirm units', 'Provide new value'],
        priority: 2
      }
    ]);

    // Conflicting conditions strategies
    this.recoveryStrategies.set('CONFLICTING_CONDITIONS', [
      {
        type: 'clarify',
        message: 'I heard conflicting information about the conditions.',
        actions: ['Clarify which is correct', 'Provide updated information'],
        priority: 1
      },
      {
        type: 'fallback',
        message: 'Let me use the most recent information you provided.',
        actions: ['Confirm current conditions', 'Start over if needed'],
        priority: 2
      }
    ]);

    // Speech recognition error strategies
    this.recoveryStrategies.set('SPEECH_RECOGNITION_ERROR', [
      {
        type: 'clarify',
        message: 'I had trouble understanding that. Could you try again?',
        actions: ['Speak more clearly', 'Use different words', 'Check microphone'],
        priority: 1
      },
      {
        type: 'fallback',
        message: 'You can also try spelling out numbers.',
        actions: ['Spell numbers', 'Use simple words', 'Speak slower'],
        priority: 2
      }
    ]);

    // Timeout strategies
    this.recoveryStrategies.set('TIMEOUT', [
      {
        type: 'clarify',
        message: 'I didn\'t hear a response. Are you still there?',
        actions: ['Try speaking again', 'Check connection'],
        priority: 1
      },
      {
        type: 'fallback',
        message: 'Let\'s start over with your shot conditions.',
        actions: ['Begin new session', 'Provide basic information'],
        priority: 2
      }
    ]);

    // Unsupported command strategies
    this.recoveryStrategies.set('UNSUPPORTED_COMMAND', [
      {
        type: 'suggest',
        message: 'I don\'t recognize that command. Here\'s what I can help with:',
        actions: ['Use supported commands', 'Ask for help'],
        priority: 1
      },
      {
        type: 'fallback',
        message: 'Try describing your shot conditions instead.',
        actions: ['Describe distance and conditions', 'Start basic recommendation'],
        priority: 2
      }
    ]);

    // Context lost strategies
    this.recoveryStrategies.set('CONTEXT_LOST', [
      {
        type: 'clarify',
        message: 'I seem to have lost track of our conversation.',
        actions: ['Summarize current situation', 'Start fresh'],
        priority: 1
      },
      {
        type: 'restart',
        message: 'Let\'s start over with your shot.',
        actions: ['Provide shot distance', 'Describe conditions'],
        priority: 2
      }
    ]);
  }

  // Main error handling method
  handleError(error: Partial<ErrorContext>): {
    shouldRetry: boolean;
    response: string;
    actions: string[];
    recoveryStrategy: ErrorRecoveryStrategy | null;
  } {
    // Create full error context
    const fullError: ErrorContext = {
      errorType: 'AMBIGUOUS_INPUT',
      originalInput: '',
      attemptNumber: 1,
      sessionContext: null,
      suggestedFixes: [],
      confidence: 0,
      ...error
    };

    // Add to error history
    this.errorHistory.push(fullError);

    // Check if we should give up
    if (fullError.attemptNumber >= this.options.maxRetries) {
      return this.generateGiveUpResponse(fullError);
    }

    // Find appropriate recovery strategy
    const strategy = this.selectRecoveryStrategy(fullError);

    // Generate response based on strategy
    const response = this.generateErrorResponse(fullError, strategy);

    return {
      shouldRetry: true,
      response: response.message,
      actions: response.actions,
      recoveryStrategy: strategy
    };
  }

  private selectRecoveryStrategy(error: ErrorContext): ErrorRecoveryStrategy {
    const strategies = this.recoveryStrategies.get(error.errorType) || [];

    if (strategies.length === 0) {
      // Fallback strategy
      return {
        type: 'clarify',
        message: 'I\'m having trouble understanding. Could you try rephrasing?',
        actions: ['Try different words', 'Be more specific'],
        priority: 1
      };
    }

    // Consider error history to avoid repeating failed strategies
    const usedStrategies = this.errorHistory
      .filter(e => e.errorType === error.errorType)
      .map(e => e.suggestedFixes)
      .flat();

    // Find unused strategy with highest priority
    for (const strategy of strategies.sort((a, b) => a.priority - b.priority)) {
      const hasBeenUsed = usedStrategies.some(fix =>
        strategy.actions.some(action => action.includes(fix))
      );

      if (!hasBeenUsed) {
        return strategy;
      }
    }

    // If all strategies have been used, use the highest priority one
    return strategies[0];
  }

  private generateErrorResponse(error: ErrorContext, strategy: ErrorRecoveryStrategy): {
    message: string;
    actions: string[];
  } {
    let message = strategy.message;

    // Customize message based on personality style
    message = this.adaptMessageToPersonality(message, error);

    // Add specific context if available
    if (error.originalInput && this.options.verboseErrors) {
      message += ` I heard: "${error.originalInput}"`;
    }

    // Add attempt number context for multiple failures
    if (error.attemptNumber > 1) {
      message += ` Let's try attempt ${error.attemptNumber}.`;
    }

    return {
      message,
      actions: strategy.actions
    };
  }

  private adaptMessageToPersonality(message: string, error: ErrorContext): string {
    const style = this.options.personalityStyle;

    switch (style) {
      case 'casual':
        return message
          .replace('I need', 'I\'d like')
          .replace('Could you', 'Can you')
          .replace('I apologize', 'Sorry about that');

      case 'encouraging':
        const encouragements = [
          'No worries! ',
          'That\'s okay! ',
          'Don\'t worry about it! '
        ];
        const randomEncouragement = encouragements[Math.floor(Math.random() * encouragements.length)];
        return randomEncouragement + message.toLowerCase();

      default: // professional
        return message;
    }
  }

  private generateGiveUpResponse(error: ErrorContext): {
    shouldRetry: boolean;
    response: string;
    actions: string[];
    recoveryStrategy: ErrorRecoveryStrategy;
  } {
    const style = this.options.personalityStyle;
    let message = '';

    switch (style) {
      case 'casual':
        message = `I'm having a tough time understanding after ${error.attemptNumber} tries. Let's start fresh.`;
        break;
      case 'encouraging':
        message = `Don't worry! Sometimes these things happen. Let's begin again and take it step by step.`;
        break;
      default:
        message = `I apologize, but I'm unable to process your request after ${error.attemptNumber} attempts. Let's restart.`;
    }

    const restartStrategy: ErrorRecoveryStrategy = {
      type: 'restart',
      message,
      actions: [
        'Say "start over"',
        'Begin with distance to pin',
        'Describe your shot simply'
      ],
      priority: 1
    };

    return {
      shouldRetry: false,
      response: message,
      actions: restartStrategy.actions,
      recoveryStrategy: restartStrategy
    };
  }

  // Specific error handling methods
  handleAmbiguousDistance(possibleValues: number[]): {
    message: string;
    suggestions: string[];
  } {
    const style = this.options.personalityStyle;
    const values = possibleValues.join(' or ');

    let message = '';
    switch (style) {
      case 'casual':
        message = `I heard a few different distances. Did you say ${values} yards?`;
        break;
      case 'encouraging':
        message = `Great! I want to make sure I got the distance right. Was it ${values} yards?`;
        break;
      default:
        message = `I detected multiple possible distances: ${values} yards. Which is correct?`;
    }

    return {
      message,
      suggestions: possibleValues.map(v => `${v} yards`)
    };
  }

  handleInvalidRange(value: number, validRange: [number, number], unit: string): {
    message: string;
    suggestions: string[];
  } {
    const [min, max] = validRange;
    const style = this.options.personalityStyle;

    let message = '';
    switch (style) {
      case 'casual':
        message = `Hmm, ${value} ${unit} seems a bit off. Usually it's between ${min} and ${max} ${unit}.`;
        break;
      case 'encouraging':
        message = `That's okay! ${value} ${unit} is outside the typical range of ${min}-${max} ${unit}. What did you mean?`;
        break;
      default:
        message = `The value ${value} ${unit} is outside the valid range of ${min}-${max} ${unit}. Please provide a corrected value.`;
    }

    return {
      message,
      suggestions: [
        `Try ${Math.round((min + max) / 2)} ${unit}`,
        `Check if you meant different units`,
        `Verify your measurement`
      ]
    };
  }

  handleConflictingWindConditions(wind1: any, wind2: any): {
    message: string;
    options: string[];
  } {
    const style = this.options.personalityStyle;

    let message = '';
    switch (style) {
      case 'casual':
        message = `I heard both "${wind1.speed} mph ${wind1.direction}" and "${wind2.speed} mph ${wind2.direction}". Which one's right?`;
        break;
      case 'encouraging':
        message = `No problem! I just want to confirm the wind. Is it "${wind1.speed} mph ${wind1.direction}" or "${wind2.speed} mph ${wind2.direction}"?`;
        break;
      default:
        message = `I received conflicting wind information. Please confirm: "${wind1.speed} mph ${wind1.direction}" or "${wind2.speed} mph ${wind2.direction}"?`;
    }

    return {
      message,
      options: [
        `${wind1.speed} mph ${wind1.direction}`,
        `${wind2.speed} mph ${wind2.direction}`,
        'Let me say it again'
      ]
    };
  }

  // Fuzzy matching for common errors
  suggestCorrections(input: string, validOptions: string[]): string[] {
    if (!this.options.enableFuzzyMatching) {
      return [];
    }

    const suggestions: Array<{option: string, score: number}> = [];

    for (const option of validOptions) {
      const score = this.calculateSimilarity(input.toLowerCase(), option.toLowerCase());
      if (score > 0.6) { // Only suggest if reasonably similar
        suggestions.push({ option, score });
      }
    }

    return suggestions
      .sort((a, b) => b.score - a.score)
      .slice(0, 3) // Top 3 suggestions
      .map(s => s.option);
  }

  private calculateSimilarity(str1: string, str2: string): number {
    // Simple Levenshtein-based similarity
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) {
      return 1.0;
    }

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j] + 1      // deletion
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  // Context-aware error detection
  detectPotentialErrors(input: string, context: any): ErrorContext[] {
    const errors: ErrorContext[] = [];

    // Check for conflicting information
    const numbers = input.match(/\d+/g);
    if (numbers && numbers.length > 2) {
      errors.push({
        errorType: 'AMBIGUOUS_INPUT',
        originalInput: input,
        attemptNumber: 1,
        sessionContext: context,
        suggestedFixes: ['Clarify which numbers refer to what'],
        confidence: 0.8
      });
    }

    // Check for units mismatch
    if (input.includes('feet') && input.includes('yards')) {
      errors.push({
        errorType: 'CONFLICTING_CONDITIONS',
        originalInput: input,
        attemptNumber: 1,
        sessionContext: context,
        suggestedFixes: ['Use consistent units'],
        confidence: 0.9
      });
    }

    // Check for unrealistic values
    const largeNumbers = numbers?.filter(n => parseInt(n) > 500);
    if (largeNumbers && largeNumbers.length > 0) {
      errors.push({
        errorType: 'INVALID_VALUE',
        originalInput: input,
        attemptNumber: 1,
        sessionContext: context,
        suggestedFixes: ['Check if distance is in correct units'],
        confidence: 0.7
      });
    }

    return errors;
  }

  // Error reporting and analytics
  getErrorStatistics(): {
    totalErrors: number;
    errorsByType: Record<ErrorType, number>;
    commonPatterns: string[];
    successRate: number;
  } {
    const errorsByType: Record<ErrorType, number> = {} as any;

    for (const error of this.errorHistory) {
      errorsByType[error.errorType] = (errorsByType[error.errorType] || 0) + 1;
    }

    const commonPatterns = this.identifyCommonErrorPatterns();
    const successRate = this.calculateSuccessRate();

    return {
      totalErrors: this.errorHistory.length,
      errorsByType,
      commonPatterns,
      successRate
    };
  }

  private identifyCommonErrorPatterns(): string[] {
    const patterns: Record<string, number> = {};

    for (const error of this.errorHistory) {
      const pattern = `${error.errorType}_attempt_${error.attemptNumber}`;
      patterns[pattern] = (patterns[pattern] || 0) + 1;
    }

    return Object.entries(patterns)
      .filter(([_, count]) => count >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([pattern, _]) => pattern);
  }

  private calculateSuccessRate(): number {
    if (this.errorHistory.length === 0) return 1.0;

    const maxAttempts = Math.max(...this.errorHistory.map(e => e.attemptNumber));
    const failedSessions = this.errorHistory.filter(e => e.attemptNumber >= this.options.maxRetries).length;
    const totalSessions = Math.ceil(this.errorHistory.length / maxAttempts);

    return Math.max(0, (totalSessions - failedSessions) / totalSessions);
  }

  // Utility methods
  clearErrorHistory(): void {
    this.errorHistory = [];
  }

  updateOptions(newOptions: Partial<ErrorHandlerOptions>): void {
    this.options = { ...this.options, ...newOptions };
  }
}