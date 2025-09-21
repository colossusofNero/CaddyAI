/**
 * Voice Test Scenarios - Comprehensive test data for voice input testing
 */

const voiceTestScenarios = {
  // Standard distance request commands
  distanceCommands: [
    { text: "How far is it to the pin?", expectedIntent: "distance_request" },
    { text: "What's the yardage?", expectedIntent: "distance_request" },
    { text: "Distance to the pin", expectedIntent: "distance_request" },
    { text: "How many yards to the flag?", expectedIntent: "distance_request" },
    { text: "Yardage to the hole", expectedIntent: "distance_request" },
    { text: "How far to the green?", expectedIntent: "distance_request" },
    { text: "Distance to front of green", expectedIntent: "distance_request" },
    { text: "Back pin distance", expectedIntent: "distance_request" }
  ],

  // Club recommendation commands
  clubCommands: [
    { text: "What club should I use?", expectedIntent: "club_recommendation" },
    { text: "Which club do you recommend?", expectedIntent: "club_recommendation" },
    { text: "What club for 150 yards?", expectedIntent: "club_recommendation" },
    { text: "Club recommendation please", expectedIntent: "club_recommendation" },
    { text: "Help me pick a club", expectedIntent: "club_recommendation" },
    { text: "What iron should I hit?", expectedIntent: "club_recommendation" },
    { text: "Driver or 3 wood?", expectedIntent: "club_recommendation" }
  ],

  // Weather and wind commands
  weatherCommands: [
    { text: "What's the wind doing?", expectedIntent: "weather_request" },
    { text: "How strong is the wind?", expectedIntent: "weather_request" },
    { text: "Wind direction?", expectedIntent: "weather_request" },
    { text: "Tell me about the wind", expectedIntent: "weather_request" },
    { text: "What are the conditions?", expectedIntent: "weather_request" },
    { text: "Weather update", expectedIntent: "weather_request" },
    { text: "Is it windy?", expectedIntent: "weather_request" }
  ],

  // Course information commands
  courseCommands: [
    { text: "Tell me about this hole", expectedIntent: "course_info" },
    { text: "What hazards are there?", expectedIntent: "course_info" },
    { text: "Hole information", expectedIntent: "course_info" },
    { text: "Any water hazards?", expectedIntent: "course_info" },
    { text: "Where are the bunkers?", expectedIntent: "course_info" },
    { text: "Course layout", expectedIntent: "course_info" }
  ],

  // Standard commands for consistent testing
  standardCommands: [
    { text: "How far to the pin?" },
    { text: "What club should I use?" },
    { text: "What's the wind doing?" },
    { text: "Tell me about this hole" },
    { text: "Distance to the green" },
    { text: "Club recommendation" }
  ],

  // Accent variations
  accents: {
    american: [
      {
        accent: "southern",
        commands: [
          "How far y'all think it is to that pin?",
          "What club should I be usin' here?",
          "Tell me 'bout this here hole"
        ]
      },
      {
        accent: "northeast",
        commands: [
          "How fah to the pin?",
          "What club should I use heah?",
          "What's the wind doin'?"
        ]
      },
      {
        accent: "midwest",
        commands: [
          "How far to the pin, eh?",
          "What club should I use, you betcha?",
          "Tell me about this hole here"
        ]
      }
    ],
    british: [
      {
        accent: "british",
        commands: [
          "How far to the pin, please?",
          "Which club would you suggest?",
          "What's the wind like?",
          "Could you tell me about this hole?"
        ]
      }
    ],
    nonNative: [
      {
        accent: "spanish",
        commands: [
          "How far ees eet to the peen?",
          "What club should I yuse?",
          "Tell me about dees hole"
        ]
      },
      {
        accent: "asian",
        commands: [
          "How far to pin?",
          "What crab should use?",
          "Wind direction pease?"
        ]
      }
    ]
  },

  // Interrupted speech patterns
  interruptedCommands: [
    { text: "How far... uh... how far is it to the pin?", expectedIntent: "distance_request" },
    { text: "What club... sorry... what club should I use?", expectedIntent: "club_recommendation" },
    { text: "Tell me... wait... tell me about the wind", expectedIntent: "weather_request" },
    { text: "Distance to... to the... to the green", expectedIntent: "distance_request" }
  ],

  // Partial/incomplete commands
  partialCommands: [
    { text: "How far...", needsMoreInfo: true },
    { text: "What club...", needsMoreInfo: true },
    { text: "Tell me about...", needsMoreInfo: true },
    { text: "Distance", needsMoreInfo: true },
    { text: "Wind", needsMoreInfo: true }
  ],

  // Conversation flows with context
  conversationFlows: {
    basic: {
      commands: [
        { text: "How far to the pin?", expectedIntent: "distance_request" },
        { text: "What club should I use?", expectedIntent: "club_recommendation", usesContext: true },
        { text: "What about the wind?", expectedIntent: "weather_request" },
        { text: "Is that still the right club?", expectedIntent: "club_recommendation", usesContext: true }
      ]
    },
    detailed: {
      commands: [
        { text: "Tell me about hole 7", expectedIntent: "course_info" },
        { text: "How far to carry the water?", expectedIntent: "distance_request", usesContext: true },
        { text: "What club would clear it safely?", expectedIntent: "club_recommendation", usesContext: true },
        { text: "What if I lay up instead?", expectedIntent: "club_recommendation", usesContext: true }
      ]
    }
  },

  // Pronoun reference tests
  pronounReferences: [
    {
      commands: [
        { text: "How far to the pin?", expectedReferences: {} },
        { text: "What club for that distance?", expectedReferences: { "that": "distance_to_pin" } },
        { text: "Is it into the wind?", expectedReferences: { "it": "shot" } }
      ]
    }
  ],

  // Gibberish/unrecognizable input
  gibberish: [
    { text: "asdkjfh aslkdjf" },
    { text: "blah blah blah" },
    { text: "mmhmm yeah uh huh" },
    { text: "♪♫♪♫ music playing ♪♫♪♫" }
  ],

  // Ambiguous commands requiring clarification
  ambiguousCommands: [
    { text: "How far?", needsClarification: true, clarificationOptions: ["to pin", "to green", "to hazard"] },
    { text: "What should I use?", needsClarification: true, clarificationOptions: ["club", "strategy", "target"] },
    { text: "Tell me about it", needsClarification: true, clarificationOptions: ["hole", "shot", "conditions"] }
  ],

  // Performance test scenarios
  performanceTests: [
    { command: { text: "How far to the pin?" }, maxTime: 2000 },
    { command: { text: "What club should I use?" }, maxTime: 2000 },
    { command: { text: "What's the wind doing?" }, maxTime: 1500 },
    { command: { text: "Tell me about this hole" }, maxTime: 2500 }
  ],

  // Distance extraction tests
  distanceExtraction: [
    { command: { text: "It's 150 yards to the pin" }, expectedDistance: 150 },
    { command: { text: "The pin is one hundred yards away" }, expectedDistance: 100 },
    { command: { text: "About two hundred yards to the green" }, expectedDistance: 200 },
    { command: { text: "Seventy-five yard shot" }, expectedDistance: 75 }
  ],

  // Club name extraction tests
  clubExtraction: [
    { command: { text: "I'm thinking seven iron" }, expectedClub: "7iron" },
    { command: { text: "Should I hit driver?" }, expectedClub: "driver" },
    { command: { text: "Maybe a pitching wedge" }, expectedClub: "pw" },
    { command: { text: "Three wood or five iron?" }, expectedClub: "3wood" } // First mentioned
  ],

  // Integration test scenarios
  integrationTests: [
    {
      command: { text: "How far to the pin?" },
      expectedFlow: {
        voiceRecognition: true,
        gpsLookup: true,
        distanceCalculation: true,
        voiceResponse: true
      }
    },
    {
      command: { text: "What club for 150 yards into a 15 mph headwind?" },
      expectedFlow: {
        voiceRecognition: true,
        windCalculation: true,
        clubRecommendation: true,
        voiceResponse: true
      }
    }
  ],

  // Speech impediment handling
  speechImpediments: [
    {
      command: { text: "How far to da pin?" }, // R/L confusion
      expectedIntent: "distance_request"
    },
    {
      command: { text: "What cwub should I use?" }, // L/R confusion
      expectedIntent: "club_recommendation"
    },
    {
      command: { text: "Teww me about dis howe" }, // TH/D substitution
      expectedIntent: "course_info"
    }
  ],

  // Foreign golf terms in English
  foreignGolfTerms: [
    {
      command: { text: "How far to the pin, por favor?" },
      expectedTranslation: "please",
      expectedIntent: "distance_request"
    },
    {
      command: { text: "What club for dis shot, ja?" },
      expectedTranslation: "yes",
      expectedIntent: "club_recommendation"
    }
  ],

  // Complex multi-part commands
  complexCommands: [
    {
      command: { text: "How far to the pin and what club should I use considering the 15 mph wind?" },
      expectedIntents: ["distance_request", "club_recommendation"],
      expectedEntities: { windSpeed: 15, windUnit: "mph" }
    },
    {
      command: { text: "Tell me the yardage to carry the water and recommend a safe club" },
      expectedIntents: ["distance_request", "club_recommendation"],
      expectedEntities: { hazard: "water", strategy: "safe" }
    }
  ],

  // Noise simulation scenarios
  noiseScenarios: {
    windNoise: {
      type: "wind",
      level: 0.3,
      commands: ["How far to the pin?", "What club should I use?"]
    },
    cartNoise: {
      type: "engine",
      level: 0.4,
      commands: ["Distance to green", "Wind direction?"]
    },
    conversationNoise: {
      type: "speech",
      level: 0.5,
      commands: ["Club recommendation", "Tell me about this hole"]
    }
  },

  // Volume variation tests
  volumeTests: {
    whisper: {
      volume: 0.2,
      commands: ["How far?", "What club?"]
    },
    normal: {
      volume: 1.0,
      commands: ["How far to the pin?", "What club should I use?"]
    },
    shouting: {
      volume: 2.0,
      commands: ["HOW FAR TO THE PIN?", "WHAT CLUB SHOULD I USE?"]
    }
  },

  // Speed variation tests
  speedTests: {
    slow: {
      rate: 0.5,
      commands: ["How... far... to... the... pin?", "What... club... should... I... use?"]
    },
    fast: {
      rate: 1.5,
      commands: ["Howfartothepinwhatclubshouldluse?", "Distancetogreenandwindspeed?"]
    }
  }
};

module.exports = { voiceTestScenarios };