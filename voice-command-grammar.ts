// Voice Command Grammar System
// Defines structured grammar for voice commands and natural language processing

export interface VoiceGrammar {
  intents: Intent[];
  entities: Entity[];
  slots: Slot[];
  utteranceTemplates: UtteranceTemplate[];
}

export interface Intent {
  name: string;
  description: string;
  confidence: number;
  requiredSlots: string[];
  optionalSlots: string[];
}

export interface Entity {
  name: string;
  type: 'number' | 'string' | 'enum' | 'custom';
  values?: string[];
  patterns?: RegExp[];
  synonyms?: Record<string, string[]>;
}

export interface Slot {
  name: string;
  entity: string;
  required: boolean;
  prompts: string[];
  validationRules?: ValidationRule[];
}

export interface UtteranceTemplate {
  intent: string;
  patterns: string[];
  examples: string[];
}

export interface ValidationRule {
  type: 'range' | 'regex' | 'custom';
  parameters: any;
  errorMessage: string;
}

export class VoiceGrammarSystem {
  private grammar: VoiceGrammar;

  constructor() {
    this.grammar = this.initializeGrammar();
  }

  private initializeGrammar(): VoiceGrammar {
    return {
      intents: [
        {
          name: 'GET_CLUB_RECOMMENDATION',
          description: 'Get club recommendation based on conditions',
          confidence: 0.8,
          requiredSlots: ['distance'],
          optionalSlots: ['elevation', 'wind', 'lie', 'temperature', 'humidity', 'hazards']
        },
        {
          name: 'UPDATE_CONDITIONS',
          description: 'Update specific playing conditions',
          confidence: 0.7,
          requiredSlots: ['condition_type', 'condition_value'],
          optionalSlots: []
        },
        {
          name: 'CONFIRM_RECOMMENDATION',
          description: 'Confirm or reject the given recommendation',
          confidence: 0.9,
          requiredSlots: ['confirmation'],
          optionalSlots: ['reason']
        },
        {
          name: 'REQUEST_ALTERNATIVES',
          description: 'Request alternative club recommendations',
          confidence: 0.8,
          requiredSlots: [],
          optionalSlots: ['reason']
        }
      ],

      entities: [
        {
          name: 'DISTANCE_VALUE',
          type: 'number',
          patterns: [/(\d+)\s*(?:yards?|yds?|y|feet?|ft)?/gi]
        },
        {
          name: 'DISTANCE_TARGET',
          type: 'enum',
          values: ['pin', 'hole', 'green', 'flag', 'stick'],
          synonyms: {
            'pin': ['pin', 'stick', 'flagstick'],
            'hole': ['hole', 'cup'],
            'green': ['green', 'putting green'],
            'flag': ['flag', 'flagstick']
          }
        },
        {
          name: 'ELEVATION_DIRECTION',
          type: 'enum',
          values: ['uphill', 'downhill'],
          synonyms: {
            'uphill': ['up', 'uphill', 'above', 'elevated'],
            'downhill': ['down', 'downhill', 'below']
          }
        },
        {
          name: 'WIND_DIRECTION',
          type: 'enum',
          values: ['headwind', 'tailwind', 'crosswind', 'left', 'right'],
          synonyms: {
            'headwind': ['head', 'headwind', 'into', 'against'],
            'tailwind': ['tail', 'tailwind', 'helping', 'behind'],
            'crosswind': ['cross', 'crosswind', 'side'],
            'left': ['left', 'left to right'],
            'right': ['right', 'right to left']
          }
        },
        {
          name: 'LIE_TYPE',
          type: 'enum',
          values: ['tee', 'fairway', 'light_rough', 'heavy_rough', 'sand', 'recovery'],
          synonyms: {
            'tee': ['tee', 'teeing ground', 'tee box'],
            'fairway': ['fairway', 'short grass'],
            'light_rough': ['light rough', 'first cut', 'semi rough'],
            'heavy_rough': ['heavy rough', 'thick rough', 'deep rough', 'cabbage'],
            'sand': ['sand', 'bunker', 'trap', 'beach'],
            'recovery': ['recovery', 'trouble', 'trees', 'woods']
          }
        },
        {
          name: 'HAZARD_TYPE',
          type: 'enum',
          values: ['bunker', 'greenside_bunker', 'water'],
          synonyms: {
            'bunker': ['bunker', 'sand', 'trap'],
            'greenside_bunker': ['greenside bunker', 'green side bunker'],
            'water': ['water', 'pond', 'lake', 'creek', 'stream', 'hazard']
          }
        },
        {
          name: 'LOCATION',
          type: 'enum',
          values: ['front', 'right', 'left', 'behind'],
          synonyms: {
            'front': ['front', 'ahead', 'before'],
            'right': ['right', 'right side'],
            'left': ['left', 'left side'],
            'behind': ['behind', 'back', 'past']
          }
        },
        {
          name: 'CLUB_TYPE',
          type: 'enum',
          values: ['driver', 'wood', 'hybrid', 'iron', 'wedge', 'putter'],
          synonyms: {
            'driver': ['driver', 'big dog', '1 wood'],
            'wood': ['wood', 'fairway wood', '3 wood', '5 wood'],
            'hybrid': ['hybrid', 'rescue', 'utility'],
            'iron': ['iron', 'long iron', 'mid iron', 'short iron'],
            'wedge': ['wedge', 'pitching wedge', 'sand wedge', 'lob wedge'],
            'putter': ['putter', 'flat stick']
          }
        },
        {
          name: 'CONFIRMATION',
          type: 'enum',
          values: ['yes', 'no', 'maybe'],
          synonyms: {
            'yes': ['yes', 'yeah', 'yep', 'correct', 'right', 'good', 'sounds good', 'that works'],
            'no': ['no', 'nah', 'nope', 'wrong', 'incorrect', 'not right'],
            'maybe': ['maybe', 'unsure', 'not sure', 'possibly']
          }
        }
      ],

      slots: [
        {
          name: 'distance',
          entity: 'DISTANCE_VALUE',
          required: true,
          prompts: [
            "What's the distance to the pin?",
            "How far is it?",
            "Distance to the hole?"
          ],
          validationRules: [
            {
              type: 'range',
              parameters: { min: 1, max: 600 },
              errorMessage: 'Distance must be between 1 and 600 yards'
            }
          ]
        },
        {
          name: 'elevation',
          entity: 'ELEVATION_DIRECTION',
          required: false,
          prompts: [
            "Is it uphill or downhill?",
            "What's the elevation change?",
            "Playing up or down?"
          ]
        },
        {
          name: 'wind',
          entity: 'WIND_DIRECTION',
          required: false,
          prompts: [
            "What are the wind conditions?",
            "How's the wind?",
            "Wind direction and speed?"
          ]
        },
        {
          name: 'lie',
          entity: 'LIE_TYPE',
          required: false,
          prompts: [
            "What's your lie?",
            "Where is the ball?",
            "Tee, fairway, or rough?"
          ]
        },
        {
          name: 'temperature',
          entity: 'DISTANCE_VALUE',
          required: false,
          prompts: [
            "What's the temperature?",
            "How warm is it?",
            "Temperature today?"
          ],
          validationRules: [
            {
              type: 'range',
              parameters: { min: -20, max: 120 },
              errorMessage: 'Temperature must be between -20 and 120 degrees'
            }
          ]
        },
        {
          name: 'humidity',
          entity: 'DISTANCE_VALUE',
          required: false,
          prompts: [
            "What's the humidity?",
            "How humid is it?",
            "Humidity level?"
          ],
          validationRules: [
            {
              type: 'range',
              parameters: { min: 0, max: 100 },
              errorMessage: 'Humidity must be between 0 and 100 percent'
            }
          ]
        }
      ],

      utteranceTemplates: [
        {
          intent: 'GET_CLUB_RECOMMENDATION',
          patterns: [
            'I have {distance} yards {elevation?} {wind?}',
            '{distance} to the {target} {elevation?}',
            'It\'s {distance} yards {wind?} from the {lie?}',
            '{distance} out {elevation?} {wind?}'
          ],
          examples: [
            '150 yards to the pin',
            'I have 350 yards uphill with a 10 mph headwind',
            '120 yards to the flag from the fairway',
            '75 yards out downhill'
          ]
        },
        {
          intent: 'UPDATE_CONDITIONS',
          patterns: [
            'Actually it\'s {condition_type} {condition_value}',
            'Change {condition_type} to {condition_value}',
            'Make that {condition_value} {condition_type}',
            'Update {condition_type} {condition_value}'
          ],
          examples: [
            'Actually it\'s 140 yards',
            'Change wind to 5 mph tailwind',
            'Make that heavy rough',
            'Update temperature to 75 degrees'
          ]
        },
        {
          intent: 'CONFIRM_RECOMMENDATION',
          patterns: [
            '{confirmation}',
            '{confirmation} that {reason?}',
            'I {confirmation} {reason?}',
            '{confirmation} {reason?}'
          ],
          examples: [
            'Yes',
            'Yes that sounds good',
            'No that\'s not right',
            'Maybe, I\'m not sure about the wind'
          ]
        },
        {
          intent: 'REQUEST_ALTERNATIVES',
          patterns: [
            'What else?',
            'Any other options?',
            'What about alternatives?',
            'Give me another option {reason?}'
          ],
          examples: [
            'What else?',
            'Any other options?',
            'Give me another option because I don\'t like that club'
          ]
        }
      ]
    };
  }

  // Parse natural language input using the grammar system
  parseInput(input: string): {
    intent: string;
    confidence: number;
    slots: Record<string, any>;
    missingSlots: string[];
  } {
    const normalizedInput = input.toLowerCase().trim();

    // Find best matching intent
    let bestIntent = '';
    let bestConfidence = 0;
    let extractedSlots: Record<string, any> = {};

    for (const intent of this.grammar.intents) {
      const templates = this.grammar.utteranceTemplates.filter(t => t.intent === intent.name);

      for (const template of templates) {
        for (const pattern of template.patterns) {
          const { match, confidence, slots } = this.matchPattern(pattern, normalizedInput);

          if (match && confidence > bestConfidence) {
            bestIntent = intent.name;
            bestConfidence = confidence * intent.confidence;
            extractedSlots = { ...extractedSlots, ...slots };
          }
        }
      }
    }

    // Check for missing required slots
    const intent = this.grammar.intents.find(i => i.name === bestIntent);
    const missingSlots = intent
      ? intent.requiredSlots.filter(slot => !extractedSlots[slot])
      : [];

    return {
      intent: bestIntent,
      confidence: bestConfidence,
      slots: extractedSlots,
      missingSlots
    };
  }

  private matchPattern(pattern: string, input: string): {
    match: boolean;
    confidence: number;
    slots: Record<string, any>;
  } {
    const slots: Record<string, any> = {};
    let confidence = 0;

    // Convert pattern to regex and extract slots
    const slotRegex = /{(\w+)(\?)?}/g;
    let regexPattern = pattern;
    const slotNames: string[] = [];

    let match;
    while ((match = slotRegex.exec(pattern)) !== null) {
      const slotName = match[1];
      const isOptional = match[2] === '?';
      slotNames.push(slotName);

      // Find corresponding entity for this slot
      const slot = this.grammar.slots.find(s => s.name === slotName);
      if (slot) {
        const entity = this.grammar.entities.find(e => e.name === slot.entity);
        if (entity && entity.patterns) {
          const entityPattern = isOptional
            ? `(${entity.patterns[0].source})?`
            : `(${entity.patterns[0].source})`;
          regexPattern = regexPattern.replace(`{${slotName}${isOptional ? '?' : ''}}`, entityPattern);
        }
      }
    }

    const regex = new RegExp(regexPattern, 'gi');
    const regexMatch = regex.exec(input);

    if (regexMatch) {
      confidence = 0.8; // Base confidence for regex match

      // Extract slot values
      slotNames.forEach((slotName, index) => {
        const value = regexMatch[index + 1];
        if (value) {
          slots[slotName] = this.normalizeSlotValue(slotName, value);
          confidence += 0.1; // Bonus for each filled slot
        }
      });

      return { match: true, confidence: Math.min(confidence, 1.0), slots };
    }

    return { match: false, confidence: 0, slots: {} };
  }

  private normalizeSlotValue(slotName: string, value: string): any {
    const slot = this.grammar.slots.find(s => s.name === slotName);
    if (!slot) return value;

    const entity = this.grammar.entities.find(e => e.name === slot.entity);
    if (!entity) return value;

    // Handle different entity types
    switch (entity.type) {
      case 'number':
        return parseFloat(value) || 0;

      case 'enum':
        // Check synonyms
        if (entity.synonyms) {
          for (const [canonical, synonyms] of Object.entries(entity.synonyms)) {
            if (synonyms.some(syn => value.toLowerCase().includes(syn.toLowerCase()))) {
              return canonical;
            }
          }
        }
        return entity.values?.find(v => value.toLowerCase().includes(v.toLowerCase())) || value;

      default:
        return value.trim();
    }
  }

  // Generate confirmation prompts
  generateConfirmation(slots: Record<string, any>): string {
    const conditions: string[] = [];

    if (slots.distance) {
      conditions.push(`${slots.distance} yards`);
    }
    if (slots.elevation) {
      conditions.push(`${slots.elevation}`);
    }
    if (slots.wind) {
      conditions.push(`${slots.wind_speed || ''} ${slots.wind} wind`.trim());
    }
    if (slots.lie) {
      conditions.push(`from the ${slots.lie}`);
    }
    if (slots.temperature) {
      conditions.push(`${slots.temperature}°`);
    }

    return `I understand you have ${conditions.join(', ')}. Is that correct?`;
  }

  // Get prompts for missing slots
  getSlotPrompt(slotName: string): string {
    const slot = this.grammar.slots.find(s => s.name === slotName);
    if (slot && slot.prompts.length > 0) {
      return slot.prompts[Math.floor(Math.random() * slot.prompts.length)];
    }
    return `Please provide ${slotName}`;
  }

  // Validate slot values
  validateSlot(slotName: string, value: any): { valid: boolean; error?: string } {
    const slot = this.grammar.slots.find(s => s.name === slotName);
    if (!slot || !slot.validationRules) {
      return { valid: true };
    }

    for (const rule of slot.validationRules) {
      switch (rule.type) {
        case 'range':
          if (typeof value === 'number') {
            if (value < rule.parameters.min || value > rule.parameters.max) {
              return { valid: false, error: rule.errorMessage };
            }
          }
          break;

        case 'regex':
          if (typeof value === 'string' && !rule.parameters.test(value)) {
            return { valid: false, error: rule.errorMessage };
          }
          break;
      }
    }

    return { valid: true };
  }
}