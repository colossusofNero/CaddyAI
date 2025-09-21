// Dialogue Manager
// Manages conversation flow, confirmation dialogues, and state transitions

import { GolfConditions } from './golf-nlp-parser';
import { ProcessedInput } from './voice-input-processor';
import { ClubRecommendation } from './voice-output-generator';

export type DialogueState =
  | 'GREETING'
  | 'COLLECTING_CONDITIONS'
  | 'CONFIRMING_CONDITIONS'
  | 'PROVIDING_RECOMMENDATION'
  | 'HANDLING_FEEDBACK'
  | 'CLARIFYING_ERROR'
  | 'ENDING_SESSION';

export interface DialogueContext {
  currentState: DialogueState;
  previousState: DialogueState | null;
  conditions: Partial<GolfConditions>;
  recommendation: ClubRecommendation | null;
  pendingQuestion: string | null;
  expectedResponse: string[] | null;
  attemptCount: number;
  sessionId: string;
  startTime: Date;
  lastActivity: Date;
  userData: UserProfile;
}

export interface UserProfile {
  name?: string;
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  preferredUnits: 'imperial' | 'metric';
  communicationStyle: 'concise' | 'detailed';
  previousSessions: number;
}

export interface DialogueFlow {
  states: DialogueStateDefinition[];
  transitions: DialogueTransition[];
  globalHandlers: GlobalHandler[];
}

export interface DialogueStateDefinition {
  state: DialogueState;
  entryActions: string[];
  exitActions: string[];
  timeoutMs?: number;
  retryLimit?: number;
}

export interface DialogueTransition {
  from: DialogueState;
  to: DialogueState;
  trigger: string;
  condition?: (context: DialogueContext, input: ProcessedInput) => boolean;
  actions?: string[];
}

export interface GlobalHandler {
  trigger: string;
  action: (context: DialogueContext) => Partial<DialogueContext>;
  priority: number;
}

export interface DialogueResponse {
  message: string;
  expectedResponse?: string[];
  actions?: string[];
  state: DialogueState;
  timeout?: number;
}

export class DialogueManager {
  private context: DialogueContext;
  private flow: DialogueFlow;
  private stateHandlers: Map<DialogueState, (input: ProcessedInput) => DialogueResponse>;

  constructor(userProfile?: Partial<UserProfile>) {
    this.context = this.initializeContext(userProfile);
    this.flow = this.defineDialogueFlow();
    this.stateHandlers = new Map();
    this.initializeStateHandlers();
  }

  private initializeContext(userProfile?: Partial<UserProfile>): DialogueContext {
    return {
      currentState: 'GREETING',
      previousState: null,
      conditions: {},
      recommendation: null,
      pendingQuestion: null,
      expectedResponse: null,
      attemptCount: 0,
      sessionId: this.generateSessionId(),
      startTime: new Date(),
      lastActivity: new Date(),
      userData: {
        skillLevel: 'intermediate',
        preferredUnits: 'imperial',
        communicationStyle: 'detailed',
        previousSessions: 0,
        ...userProfile
      }
    };
  }

  private defineDialogueFlow(): DialogueFlow {
    return {
      states: [
        {
          state: 'GREETING',
          entryActions: ['welcomeUser', 'explainCapabilities'],
          exitActions: ['logSessionStart']
        },
        {
          state: 'COLLECTING_CONDITIONS',
          entryActions: ['promptForConditions'],
          exitActions: ['validateConditions'],
          timeoutMs: 30000,
          retryLimit: 3
        },
        {
          state: 'CONFIRMING_CONDITIONS',
          entryActions: ['summarizeConditions'],
          exitActions: ['finalizeConditions'],
          timeoutMs: 15000,
          retryLimit: 2
        },
        {
          state: 'PROVIDING_RECOMMENDATION',
          entryActions: ['calculateRecommendation', 'presentRecommendation'],
          exitActions: ['logRecommendation']
        },
        {
          state: 'HANDLING_FEEDBACK',
          entryActions: ['processFeedback'],
          exitActions: ['adjustRecommendation'],
          timeoutMs: 20000,
          retryLimit: 2
        },
        {
          state: 'CLARIFYING_ERROR',
          entryActions: ['identifyError', 'suggestCorrection'],
          exitActions: ['clearError'],
          timeoutMs: 25000,
          retryLimit: 3
        },
        {
          state: 'ENDING_SESSION',
          entryActions: ['summarizeSession', 'sayGoodbye'],
          exitActions: ['logSessionEnd', 'cleanup']
        }
      ],

      transitions: [
        {
          from: 'GREETING',
          to: 'COLLECTING_CONDITIONS',
          trigger: 'user_provides_conditions',
          condition: (context, input) => this.hasBasicConditions(input.conditions)
        },
        {
          from: 'GREETING',
          to: 'COLLECTING_CONDITIONS',
          trigger: 'user_ready'
        },
        {
          from: 'COLLECTING_CONDITIONS',
          to: 'CONFIRMING_CONDITIONS',
          trigger: 'conditions_complete',
          condition: (context, input) => this.areConditionsSufficient(input.conditions)
        },
        {
          from: 'COLLECTING_CONDITIONS',
          to: 'CLARIFYING_ERROR',
          trigger: 'error_detected',
          condition: (context, input) => input.validationErrors.length > 0
        },
        {
          from: 'CONFIRMING_CONDITIONS',
          to: 'PROVIDING_RECOMMENDATION',
          trigger: 'conditions_confirmed'
        },
        {
          from: 'CONFIRMING_CONDITIONS',
          to: 'COLLECTING_CONDITIONS',
          trigger: 'conditions_rejected'
        },
        {
          from: 'PROVIDING_RECOMMENDATION',
          to: 'HANDLING_FEEDBACK',
          trigger: 'feedback_received'
        },
        {
          from: 'PROVIDING_RECOMMENDATION',
          to: 'ENDING_SESSION',
          trigger: 'recommendation_accepted'
        },
        {
          from: 'HANDLING_FEEDBACK',
          to: 'PROVIDING_RECOMMENDATION',
          trigger: 'recommendation_updated'
        },
        {
          from: 'CLARIFYING_ERROR',
          to: 'COLLECTING_CONDITIONS',
          trigger: 'error_resolved'
        },
        {
          from: 'CLARIFYING_ERROR',
          to: 'ENDING_SESSION',
          trigger: 'max_attempts_reached'
        }
      ],

      globalHandlers: [
        {
          trigger: 'start_over',
          action: (context) => ({
            currentState: 'COLLECTING_CONDITIONS',
            conditions: {},
            recommendation: null,
            attemptCount: 0
          }),
          priority: 1
        },
        {
          trigger: 'help',
          action: (context) => ({ pendingQuestion: 'help_requested' }),
          priority: 2
        },
        {
          trigger: 'goodbye',
          action: (context) => ({ currentState: 'ENDING_SESSION' }),
          priority: 1
        }
      ]
    };
  }

  private initializeStateHandlers(): void {
    this.stateHandlers.set('GREETING', this.handleGreeting.bind(this));
    this.stateHandlers.set('COLLECTING_CONDITIONS', this.handleCollectingConditions.bind(this));
    this.stateHandlers.set('CONFIRMING_CONDITIONS', this.handleConfirmingConditions.bind(this));
    this.stateHandlers.set('PROVIDING_RECOMMENDATION', this.handleProvidingRecommendation.bind(this));
    this.stateHandlers.set('HANDLING_FEEDBACK', this.handleFeedback.bind(this));
    this.stateHandlers.set('CLARIFYING_ERROR', this.handleClarifyingError.bind(this));
    this.stateHandlers.set('ENDING_SESSION', this.handleEndingSession.bind(this));
  }

  // Main processing method
  processInput(input: ProcessedInput): DialogueResponse {
    this.context.lastActivity = new Date();

    // Check for global handlers first
    const globalResponse = this.checkGlobalHandlers(input);
    if (globalResponse) {
      return globalResponse;
    }

    // Process based on current state
    const handler = this.stateHandlers.get(this.context.currentState);
    if (!handler) {
      throw new Error(`No handler found for state: ${this.context.currentState}`);
    }

    const response = handler(input);

    // Check for state transitions
    this.checkTransitions(input);

    return response;
  }

  private checkGlobalHandlers(input: ProcessedInput): DialogueResponse | null {
    const intent = input.intent.toLowerCase();

    for (const handler of this.flow.globalHandlers) {
      if (intent.includes(handler.trigger)) {
        const updates = handler.action(this.context);
        this.updateContext(updates);

        return this.generateGlobalResponse(handler.trigger);
      }
    }

    return null;
  }

  private generateGlobalResponse(trigger: string): DialogueResponse {
    switch (trigger) {
      case 'start_over':
        return {
          message: "No problem! Let's start fresh. What's the distance to the pin?",
          expectedResponse: ['distance'],
          state: 'COLLECTING_CONDITIONS'
        };

      case 'help':
        return {
          message: this.generateHelpMessage(),
          expectedResponse: ['continue', 'start_over'],
          state: this.context.currentState
        };

      case 'goodbye':
        return {
          message: "Thanks for using the golf assistant! Have a great round!",
          state: 'ENDING_SESSION'
        };

      default:
        return {
          message: "I understand. How can I help you?",
          state: this.context.currentState
        };
    }
  }

  private generateHelpMessage(): string {
    const helpMessages = {
      'GREETING': "I can help you choose the right golf club! Just tell me the distance to the pin and any conditions like wind or elevation.",
      'COLLECTING_CONDITIONS': "I need to know: distance to pin, wind conditions, elevation changes, and your lie. Try saying something like '150 yards uphill with 10 mph headwind from the fairway.'",
      'CONFIRMING_CONDITIONS': "I'm confirming the conditions you told me. Say 'yes' if correct, or tell me what needs to be changed.",
      'PROVIDING_RECOMMENDATION': "I've given you a club recommendation. You can ask for alternatives, provide feedback, or accept the suggestion.",
      'HANDLING_FEEDBACK': "Tell me what you think about the recommendation or if you need adjustments.",
      'CLARIFYING_ERROR': "I'm trying to understand your input better. Please be more specific or try rephrasing."
    };

    return helpMessages[this.context.currentState] || "I'm here to help with your golf club selection!";
  }

  // State-specific handlers
  private handleGreeting(input: ProcessedInput): DialogueResponse {
    const isReturningUser = this.context.userData.previousSessions > 0;
    const userStyle = this.context.userData.communicationStyle;

    let message = '';
    if (isReturningUser) {
      message = userStyle === 'concise'
        ? "Welcome back! Ready for your next shot?"
        : "Good to see you again! I'm ready to help with your club selection. What's your situation?";
    } else {
      message = userStyle === 'concise'
        ? "Hi! Tell me about your shot: distance, conditions, lie."
        : "Welcome to your AI golf caddy! I'll help you choose the perfect club. Tell me the distance to the pin and any course conditions.";
    }

    // Check if user already provided conditions in greeting
    if (this.hasBasicConditions(input.conditions)) {
      this.context.conditions = { ...this.context.conditions, ...input.conditions };
      this.transitionToState('COLLECTING_CONDITIONS');
      return this.handleCollectingConditions(input);
    }

    return {
      message,
      expectedResponse: ['distance', 'shot_conditions'],
      state: 'COLLECTING_CONDITIONS',
      timeout: 30000
    };
  }

  private handleCollectingConditions(input: ProcessedInput): DialogueResponse {
    // Merge new conditions with existing
    this.context.conditions = { ...this.context.conditions, ...input.conditions };

    // Check if we have validation errors
    if (input.validationErrors.length > 0) {
      this.transitionToState('CLARIFYING_ERROR');
      return {
        message: `I noticed an issue: ${input.validationErrors[0]}. Could you clarify?`,
        expectedResponse: ['corrected_input'],
        state: 'CLARIFYING_ERROR'
      };
    }

    // Check if we have enough information
    if (this.areConditionsSufficient(this.context.conditions)) {
      this.transitionToState('CONFIRMING_CONDITIONS');
      return this.handleConfirmingConditions(input);
    }

    // Ask for missing information
    const missing = this.identifyMissingConditions();
    const question = this.generateQuestionForMissing(missing[0]);

    return {
      message: question,
      expectedResponse: [missing[0]],
      state: 'COLLECTING_CONDITIONS',
      timeout: 25000
    };
  }

  private handleConfirmingConditions(input: ProcessedInput): DialogueResponse {
    if (input.intent === 'CONFIRM_RECOMMENDATION') {
      const confirmation = this.extractConfirmation(input);

      if (confirmation === 'yes') {
        this.transitionToState('PROVIDING_RECOMMENDATION');
        return {
          message: "Perfect! Let me calculate the best club for these conditions.",
          state: 'PROVIDING_RECOMMENDATION'
        };
      } else if (confirmation === 'no') {
        this.transitionToState('COLLECTING_CONDITIONS');
        return {
          message: "No problem! What needs to be corrected?",
          expectedResponse: ['corrections'],
          state: 'COLLECTING_CONDITIONS'
        };
      }
    }

    // Generate confirmation message
    const summary = this.generateConditionsSummary();
    return {
      message: `Let me confirm: ${summary}. Is this correct?`,
      expectedResponse: ['yes', 'no', 'corrections'],
      state: 'CONFIRMING_CONDITIONS',
      timeout: 20000
    };
  }

  private handleProvidingRecommendation(input: ProcessedInput): DialogueResponse {
    // This would integrate with the VoiceOutputGenerator
    const message = "I recommend your 7-iron with a 3/4 takeback and square clubface. This should carry the ball the right distance given the conditions.";

    this.context.recommendation = {
      primaryClub: {
        type: 'iron',
        number: 7,
        name: '7-iron',
        takeback: '3/4',
        facePosition: 'square',
        reason: 'Perfect for this distance and conditions'
      }
    } as ClubRecommendation;

    return {
      message,
      expectedResponse: ['feedback', 'accept', 'alternatives'],
      state: 'HANDLING_FEEDBACK',
      timeout: 30000
    };
  }

  private handleFeedback(input: ProcessedInput): DialogueResponse {
    if (input.intent === 'CONFIRM_RECOMMENDATION') {
      const confirmation = this.extractConfirmation(input);

      if (confirmation === 'yes') {
        this.transitionToState('ENDING_SESSION');
        return {
          message: "Excellent! Trust your swing and commit to the shot. Good luck!",
          state: 'ENDING_SESSION'
        };
      }
    }

    if (input.intent === 'REQUEST_ALTERNATIVES') {
      return {
        message: "Sure! As an alternative, consider your 6-iron with a full swing, or your 8-iron with a smooth, controlled swing.",
        expectedResponse: ['feedback', 'accept'],
        state: 'HANDLING_FEEDBACK'
      };
    }

    return {
      message: "I understand your concern. What specific aspect would you like me to adjust?",
      expectedResponse: ['specific_feedback'],
      state: 'HANDLING_FEEDBACK'
    };
  }

  private handleClarifyingError(input: ProcessedInput): DialogueResponse {
    this.context.attemptCount++;

    if (this.context.attemptCount >= 3) {
      this.transitionToState('ENDING_SESSION');
      return {
        message: "I'm having trouble understanding. Let's try again later. Thanks for your patience!",
        state: 'ENDING_SESSION'
      };
    }

    return {
      message: "Thanks for clarifying! Let's continue with the updated information.",
      expectedResponse: ['continue'],
      state: 'COLLECTING_CONDITIONS'
    };
  }

  private handleEndingSession(input: ProcessedInput): DialogueResponse {
    const sessionDuration = new Date().getTime() - this.context.startTime.getTime();
    const wasSuccessful = this.context.recommendation !== null;

    let message = '';
    if (wasSuccessful) {
      message = "Great session! I hope the recommendation helps your game. Feel free to ask for help with your next shot anytime!";
    } else {
      message = "Thanks for using the golf assistant. I'm here whenever you need help with club selection!";
    }

    return {
      message,
      state: 'ENDING_SESSION'
    };
  }

  // Helper methods
  private hasBasicConditions(conditions: Partial<GolfConditions>): boolean {
    return !!(conditions.distance?.value && conditions.distance.value > 0);
  }

  private areConditionsSufficient(conditions: Partial<GolfConditions>): boolean {
    return !!(
      conditions.distance?.value &&
      conditions.distance.value > 0
    );
  }

  private identifyMissingConditions(): string[] {
    const missing: string[] = [];

    if (!this.context.conditions.distance?.value) {
      missing.push('distance');
    }

    return missing;
  }

  private generateQuestionForMissing(missing: string): string {
    const questions = {
      'distance': "What's the distance to the pin?",
      'wind': "Are there any wind conditions?",
      'elevation': "Is it uphill, downhill, or level?",
      'lie': "What's your lie - fairway, rough, tee, or sand?",
      'temperature': "What's the temperature like today?",
      'hazards': "Are there any hazards I should know about?"
    };

    return questions[missing as keyof typeof questions] || `Can you tell me about ${missing}?`;
  }

  private generateConditionsSummary(): string {
    const parts: string[] = [];
    const conditions = this.context.conditions;

    if (conditions.distance) {
      parts.push(`${conditions.distance.value} yards to the ${conditions.distance.target || 'pin'}`);
    }

    if (conditions.elevation) {
      parts.push(`${conditions.elevation.direction}`);
    }

    if (conditions.wind) {
      parts.push(`${conditions.wind.speed} mph ${conditions.wind.direction} wind`);
    }

    if (conditions.lie) {
      parts.push(`from the ${conditions.lie}`);
    }

    return parts.join(', ');
  }

  private extractConfirmation(input: ProcessedInput): 'yes' | 'no' | 'unclear' {
    const intent = input.intent.toLowerCase();

    if (intent.includes('yes') || intent.includes('correct') || intent.includes('right')) {
      return 'yes';
    }

    if (intent.includes('no') || intent.includes('wrong') || intent.includes('incorrect')) {
      return 'no';
    }

    return 'unclear';
  }

  private checkTransitions(input: ProcessedInput): void {
    const currentTransitions = this.flow.transitions.filter(t => t.from === this.context.currentState);

    for (const transition of currentTransitions) {
      if (this.shouldTransition(transition, input)) {
        this.transitionToState(transition.to);
        break;
      }
    }
  }

  private shouldTransition(transition: DialogueTransition, input: ProcessedInput): boolean {
    // Check trigger match
    if (!input.intent.toLowerCase().includes(transition.trigger)) {
      return false;
    }

    // Check condition if present
    if (transition.condition) {
      return transition.condition(this.context, input);
    }

    return true;
  }

  private transitionToState(newState: DialogueState): void {
    this.context.previousState = this.context.currentState;
    this.context.currentState = newState;
    this.context.attemptCount = 0; // Reset attempt count on state change
  }

  private updateContext(updates: Partial<DialogueContext>): void {
    this.context = { ...this.context, ...updates };
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public API methods
  getCurrentState(): DialogueState {
    return this.context.currentState;
  }

  getContext(): DialogueContext {
    return { ...this.context };
  }

  resetSession(): void {
    this.context = this.initializeContext(this.context.userData);
  }

  updateUserProfile(updates: Partial<UserProfile>): void {
    this.context.userData = { ...this.context.userData, ...updates };
  }
}