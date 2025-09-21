/**
 * Performance Test Scenarios - Comprehensive performance testing data
 */

const performanceScenarios = {
  // Voice processing test scenarios
  voice: {
    standardCommands: [
      "How far to the pin?",
      "What club should I use?",
      "What's the wind doing?",
      "Distance to the green",
      "Tell me about this hole",
      "Club recommendation please",
      "Yardage to the flag",
      "Wind direction and speed"
    ],

    rapidSequence: [
      "Distance to pin",
      "Club for 150 yards",
      "Wind check",
      "Hazards ahead",
      "Green layout",
      "Uphill or downhill",
      "Best target line",
      "Club up or down"
    ],

    complexCommands: [
      "How far to carry the water hazard on the left and what club should I use considering the 15 mph crosswind?",
      "Tell me the distance to the pin, factor in the uphill lie, and recommend a club for a soft landing",
      "What's my yardage to clear the bunker, what's the wind doing, and should I go for the pin or lay up?",
      "Distance to the front, middle, and back of the green with wind adjustments for each target"
    ]
  },

  // Calculation performance scenarios
  calculations: {
    distance: [
      {
        type: "distance_calculation",
        inputs: { lat1: 40.7128, lon1: -74.0060, lat2: 40.7589, lon2: -73.9851 }
      },
      {
        type: "distance_calculation",
        inputs: { lat1: 33.8121, lon1: -117.9190, lat2: 33.8145, lon2: -117.9201 }
      },
      {
        type: "distance_calculation",
        inputs: { lat1: 28.0836, lon1: -82.4053, lat2: 28.0850, lon2: -82.4070 }
      }
    ],

    clubRecommendation: {
      simple: [
        {
          type: "club_recommendation",
          inputs: { distance: 150, conditions: { wind: 0, elevation: 0 } }
        },
        {
          type: "club_recommendation",
          inputs: { distance: 200, conditions: { wind: 5, elevation: 10 } }
        }
      ],

      complex: [
        {
          type: "club_recommendation",
          inputs: {
            distance: 165,
            conditions: {
              wind: { speed: 15, direction: 45 },
              elevation: -20,
              temperature: 95,
              humidity: 85,
              altitude: 5000
            },
            hazards: [
              { type: "water", distance: 180, width: 30 },
              { type: "bunker", distance: 140, width: 20 }
            ],
            pin: { position: "back_right", accessibility: 0.7 }
          }
        }
      ]
    },

    batch: [
      { type: "distance", inputs: { target: "pin" } },
      { type: "distance", inputs: { target: "green_front" } },
      { type: "distance", inputs: { target: "green_back" } },
      { type: "wind_adjustment", inputs: { windSpeed: 12, direction: 90 } },
      { type: "elevation_adjustment", inputs: { elevationChange: 15 } },
      { type: "club_recommendation", inputs: { distance: 155 } },
      { type: "hazard_analysis", inputs: { hazards: ["water", "bunker"] } },
      { type: "optimal_target", inputs: { pin: "middle", green: "large" } },
      { type: "shot_shape", inputs: { wind: "crosswind", pin: "tucked" } },
      { type: "landing_angle", inputs: { club: "7iron", conditions: "firm" } }
    ]
  },

  // GPS performance scenarios
  gps: {
    acquisition: [
      {
        scenario: "cold_start",
        environment: "open_sky",
        expectedAccuracy: 3,
        expectedTime: 30000 // 30 seconds
      },
      {
        scenario: "warm_start",
        environment: "partial_cover",
        expectedAccuracy: 5,
        expectedTime: 10000 // 10 seconds
      },
      {
        scenario: "hot_start",
        environment: "clear_view",
        expectedAccuracy: 3,
        expectedTime: 5000 // 5 seconds
      },
      {
        scenario: "difficult",
        environment: "tree_cover",
        expectedAccuracy: 8,
        expectedTime: 60000 // 60 seconds
      }
    ],

    movement: [
      {
        scenario: "walking_pace",
        speed: 1.5, // m/s
        duration: 600000, // 10 minutes
        updateInterval: 2000 // 2 seconds
      },
      {
        scenario: "cart_speed",
        speed: 8.0, // m/s
        duration: 300000, // 5 minutes
        updateInterval: 1000 // 1 second
      },
      {
        scenario: "stationary",
        speed: 0,
        duration: 1200000, // 20 minutes
        updateInterval: 5000 // 5 seconds
      }
    ]
  },

  // Memory performance scenarios
  memory: {
    intensive: [
      {
        operation: "course_data_load",
        dataSize: 50, // MB
        complexity: "high"
      },
      {
        operation: "historical_rounds_analysis",
        rounds: 100,
        calculations: "extensive"
      },
      {
        operation: "voice_model_loading",
        modelSize: 25, // MB
        languages: 3
      },
      {
        operation: "weather_data_processing",
        locations: 50,
        timespan: "7_days"
      }
    ],

    typical: [
      {
        operation: "shot_calculation",
        complexity: "standard"
      },
      {
        operation: "voice_processing",
        duration: 5 // seconds
      },
      {
        operation: "gps_update",
        frequency: "normal"
      },
      {
        operation: "ui_rendering",
        complexity: "standard"
      }
    ]
  },

  // Network performance scenarios
  network: {
    slowConnection: {
      type: "slow_3g",
      bandwidth: "400kbps",
      latency: "400ms",
      packetLoss: "1%"
    },

    fastConnection: {
      type: "4g_lte",
      bandwidth: "10Mbps",
      latency: "50ms",
      packetLoss: "0.1%"
    },

    intermittent: {
      type: "unstable",
      bandwidth: "variable",
      latency: "100-2000ms",
      dropouts: "frequent"
    }
  },

  // Device performance scenarios
  devices: {
    entryLevel: [
      {
        operation: "app_launch",
        expectedTime: 5000,
        memoryLimit: "2GB",
        cpuLimit: "single_core"
      },
      {
        operation: "voice_processing",
        expectedTime: 3000,
        qualityReduction: 0.1
      },
      {
        operation: "calculation_batch",
        batchSize: 5,
        expectedTime: 2000
      }
    ],

    midRange: [
      {
        operation: "app_launch",
        expectedTime: 3000,
        memoryLimit: "4GB",
        cpuLimit: "quad_core"
      },
      {
        operation: "voice_processing",
        expectedTime: 1500,
        qualityReduction: 0.05
      },
      {
        operation: "calculation_batch",
        batchSize: 10,
        expectedTime: 1500
      }
    ],

    highEnd: [
      {
        operation: "app_launch",
        expectedTime: 1000,
        memoryLimit: "8GB",
        cpuLimit: "octa_core"
      },
      {
        operation: "voice_processing",
        expectedTime: 500,
        qualityReduction: 0
      },
      {
        operation: "calculation_batch",
        batchSize: 20,
        expectedTime: 800
      }
    ]
  },

  // Degradation scenarios
  degradation: {
    resourceConstraints: [
      {
        type: "low_memory",
        severity: "moderate",
        memoryLimit: "100MB",
        expectedBehavior: "reduce_cache"
      },
      {
        type: "low_memory",
        severity: "severe",
        memoryLimit: "50MB",
        expectedBehavior: "disable_non_essential"
      },
      {
        type: "low_battery",
        severity: "moderate",
        batteryLevel: 20,
        expectedBehavior: "reduce_gps_frequency"
      },
      {
        type: "low_battery",
        severity: "severe",
        batteryLevel: 5,
        expectedBehavior: "enter_power_save"
      },
      {
        type: "poor_network",
        severity: "moderate",
        bandwidth: "50kbps",
        expectedBehavior: "reduce_data_quality"
      },
      {
        type: "poor_network",
        severity: "severe",
        bandwidth: "10kbps",
        expectedBehavior: "offline_mode"
      }
    ]
  },

  // Real-world usage scenarios
  realWorld: {
    fullRound: {
      operations: [
        {
          type: "tee_shot_analysis",
          frequency: 18, // per round
          complexity: "high"
        },
        {
          type: "approach_shot_recommendation",
          frequency: 30, // per round
          complexity: "high"
        },
        {
          type: "distance_check",
          frequency: 60, // per round
          complexity: "low"
        },
        {
          type: "weather_update",
          frequency: 6, // per round
          complexity: "medium"
        },
        {
          type: "score_tracking",
          frequency: 18, // per round
          complexity: "low"
        }
      ],
      intervalBetweenShots: 300000, // 5 minutes
      totalDuration: 14400000 // 4 hours
    },

    tournament: {
      playersPerGroup: 4,
      groupsOnCourse: 36, // 144 players
      operationsPerPlayer: [
        {
          type: "shot_recommendation",
          frequency: 0.05 // per second per player
        },
        {
          type: "distance_calculation",
          frequency: 0.1 // per second per player
        },
        {
          type: "score_update",
          frequency: 0.002 // per second per player
        }
      ],
      peakUsageTimes: [
        { start: "07:00", end: "09:00", loadMultiplier: 1.5 },
        { start: "11:00", end: "13:00", loadMultiplier: 2.0 },
        { start: "15:00", end: "17:00", loadMultiplier: 1.8 }
      ]
    },

    practice: {
      operations: [
        {
          type: "driving_range_analysis",
          frequency: 0.05, // per second
          duration: 3600000 // 1 hour
        },
        {
          type: "swing_analysis",
          frequency: 0.02, // per second
          complexity: "high"
        },
        {
          type: "distance_tracking",
          frequency: 0.1, // per second
          accuracy: "high"
        }
      ]
    }
  },

  // Load testing scenarios
  loadTesting: {
    concurrentUsers: {
      userProfiles: [
        {
          type: "casual_golfer",
          operationsPerMinute: 5,
          sessionDuration: 3600000, // 1 hour
          peakProbability: 0.3
        },
        {
          type: "serious_golfer",
          operationsPerMinute: 12,
          sessionDuration: 14400000, // 4 hours
          peakProbability: 0.6
        },
        {
          type: "professional",
          operationsPerMinute: 20,
          sessionDuration: 18000000, // 5 hours
          peakProbability: 0.9
        }
      ],

      scalingSteps: [
        { users: 10, duration: 60000 },
        { users: 25, duration: 60000 },
        { users: 50, duration: 120000 },
        { users: 100, duration: 300000 },
        { users: 250, duration: 300000 },
        { users: 500, duration: 600000 }
      ]
    },

    stressTest: {
      scenarios: [
        {
          name: "memory_stress",
          operations: [
            { type: "memory_allocation", size: "100MB", iterations: 50 },
            { type: "memory_fragmentation", iterations: 100 },
            { type: "garbage_collection", frequency: "high" }
          ]
        },
        {
          name: "cpu_stress",
          operations: [
            { type: "calculation_intensive", iterations: 1000 },
            { type: "concurrent_processing", threads: 8 },
            { type: "algorithm_complexity", level: "high" }
          ]
        },
        {
          name: "io_stress",
          operations: [
            { type: "file_operations", frequency: "high" },
            { type: "network_requests", concurrency: 20 },
            { type: "database_operations", complexity: "high" }
          ]
        }
      ]
    }
  },

  // Battery optimization scenarios
  battery: {
    activeUsage: [
      {
        scenario: "typical_round",
        features: ["gps", "voice", "calculations", "display"],
        intensity: "normal",
        duration: 14400000 // 4 hours
      },
      {
        scenario: "intensive_round",
        features: ["gps", "voice", "calculations", "display", "video", "analytics"],
        intensity: "high",
        duration: 18000000 // 5 hours
      },
      {
        scenario: "practice_session",
        features: ["gps", "calculations", "analytics"],
        intensity: "medium",
        duration: 3600000 // 1 hour
      }
    ],

    backgroundUsage: [
      {
        scenario: "course_sync",
        features: ["location_updates", "weather_sync"],
        frequency: "hourly",
        duration: 28800000 // 8 hours
      },
      {
        scenario: "minimal_background",
        features: ["essential_updates"],
        frequency: "daily",
        duration: 86400000 // 24 hours
      }
    ]
  },

  // Regression test scenarios
  regression: {
    coreOperations: [
      {
        operation: "distance_calculation",
        baseline: { averageTime: 200, accuracy: 0.999 },
        tolerance: { time: 0.1, accuracy: 0.001 }
      },
      {
        operation: "voice_processing",
        baseline: { averageTime: 1500, accuracy: 0.95 },
        tolerance: { time: 0.2, accuracy: 0.05 }
      },
      {
        operation: "app_launch_cold",
        baseline: { averageTime: 2500 },
        tolerance: { time: 0.15 }
      },
      {
        operation: "club_recommendation",
        baseline: { averageTime: 800, accuracy: 0.90 },
        tolerance: { time: 0.15, accuracy: 0.05 }
      }
    ],

    memoryLeaks: [
      {
        scenario: "extended_session",
        duration: 7200000, // 2 hours
        acceptableGrowth: 20 // MB
      },
      {
        scenario: "rapid_operations",
        operations: 1000,
        interval: 100, // ms
        acceptableGrowth: 10 // MB
      }
    ]
  },

  // Accessibility performance scenarios
  accessibility: {
    voiceOnly: [
      {
        scenario: "navigation",
        commands: ["Go to settings", "Open profile", "Start round"],
        expectedResponseTime: 1000
      },
      {
        scenario: "information_retrieval",
        commands: ["Distance to pin", "Current wind", "Hole information"],
        expectedResponseTime: 2000
      }
    ],

    highContrast: [
      {
        scenario: "rendering_performance",
        elements: ["buttons", "text", "graphics"],
        expectedImpact: 0.1 // 10% performance impact
      }
    ]
  },

  // Integration performance scenarios
  integration: {
    externalServices: [
      {
        service: "weather_api",
        operations: ["current_conditions", "forecast", "alerts"],
        expectedLatency: 500,
        timeout: 5000
      },
      {
        service: "course_database",
        operations: ["course_search", "hole_data", "hazard_info"],
        expectedLatency: 200,
        timeout: 3000
      },
      {
        service: "user_profile_sync",
        operations: ["upload", "download", "merge"],
        expectedLatency: 1000,
        timeout: 10000
      }
    ]
  }
};

module.exports = { performanceScenarios };