/**
 * User Flow Test Scenarios - Comprehensive end-to-end test definitions
 */

const userFlowScenarios = {
  // New User Onboarding Flows
  newUserOnboarding: {
    complete: {
      name: "Complete New User Onboarding",
      type: "onboarding",
      description: "Full onboarding flow for new user",
      steps: [
        {
          name: "app_launch",
          type: "navigation",
          target: "welcome_screen",
          critical: true
        },
        {
          name: "create_account",
          type: "input",
          data: {
            email: "test@example.com",
            password: "TestPass123!",
            confirmPassword: "TestPass123!"
          },
          submit: true,
          critical: true
        },
        {
          name: "verify_email",
          type: "api_call",
          endpoint: "/auth/verify",
          method: "POST",
          critical: true
        },
        {
          name: "tutorial_start",
          type: "navigation",
          target: "tutorial_screen"
        },
        {
          name: "tutorial_voice_demo",
          type: "voice_input",
          command: "How far to the pin?",
          minConfidence: 0.8
        },
        {
          name: "tutorial_calculation_demo",
          type: "calculation",
          type: "distance",
          inputs: { lat1: 40.7128, lon1: -74.0060, lat2: 40.7589, lon2: -73.9851 }
        },
        {
          name: "profile_setup",
          type: "input",
          data: {
            handicap: "15",
            skillLevel: "intermediate",
            preferredUnits: "yards",
            voiceEnabled: true
          },
          submit: true,
          critical: true
        },
        {
          name: "club_distance_setup",
          type: "input",
          data: {
            driver: "250",
            "7iron": "150",
            pw: "120"
          },
          submit: true
        },
        {
          name: "location_permission",
          type: "api_call",
          endpoint: "/permissions/location",
          method: "POST"
        },
        {
          name: "onboarding_complete",
          type: "validation",
          validations: [
            { field: "profile", rule: "complete" },
            { field: "permissions", rule: "granted" }
          ]
        }
      ]
    },

    incomplete: {
      name: "Incomplete Profile Setup",
      type: "onboarding",
      description: "User abandons onboarding partway through",
      steps: [
        {
          name: "app_launch",
          type: "navigation",
          target: "welcome_screen",
          critical: true
        },
        {
          name: "create_account",
          type: "input",
          data: {
            email: "incomplete@example.com",
            password: "TestPass123!"
          },
          submit: true,
          critical: true
        },
        {
          name: "verify_email",
          type: "api_call",
          endpoint: "/auth/verify",
          method: "POST",
          critical: true
        },
        {
          name: "profile_setup_partial",
          type: "input",
          data: {
            handicap: "12"
          },
          submit: false // User abandons here
        },
        {
          name: "app_backgrounded",
          type: "navigation",
          target: "background"
        }
      ]
    },

    skipTutorial: {
      name: "Skip Tutorial Onboarding",
      type: "onboarding",
      description: "Experienced user skips tutorial",
      steps: [
        {
          name: "app_launch",
          type: "navigation",
          target: "welcome_screen",
          critical: true
        },
        {
          name: "create_account",
          type: "input",
          data: {
            email: "experienced@example.com",
            password: "TestPass123!"
          },
          submit: true,
          critical: true
        },
        {
          name: "skip_tutorial",
          type: "navigation",
          target: "skip_tutorial_button",
          action: "tap"
        },
        {
          name: "profile_setup",
          type: "input",
          data: {
            handicap: "8",
            skillLevel: "advanced",
            skipTutorial: true
          },
          submit: true,
          critical: true
        }
      ]
    },

    accountError: {
      name: "Account Creation Error",
      type: "onboarding",
      description: "Handle account creation failure",
      steps: [
        {
          name: "app_launch",
          type: "navigation",
          target: "welcome_screen",
          critical: true
        },
        {
          name: "create_account_invalid",
          type: "input",
          data: {
            email: "invalid-email",
            password: "weak"
          },
          submit: true
        },
        {
          name: "handle_validation_error",
          type: "validation",
          validations: [
            { field: "email", rule: "valid_format", message: "Invalid email format" },
            { field: "password", rule: "strength", message: "Password too weak" }
          ]
        },
        {
          name: "retry_account_creation",
          type: "input",
          data: {
            email: "valid@example.com",
            password: "StrongPass123!"
          },
          submit: true
        }
      ]
    }
  },

  // Shot Recommendation Flows
  shotRecommendation: {
    standard: {
      name: "Standard Shot Recommendation",
      type: "shot_recommendation",
      description: "Get club recommendation for typical shot",
      steps: [
        {
          name: "navigate_to_course",
          type: "navigation",
          target: "course_screen"
        },
        {
          name: "get_gps_location",
          type: "api_call",
          endpoint: "/location/current",
          method: "GET"
        },
        {
          name: "calculate_distance",
          type: "calculation",
          type: "distance",
          inputs: { target: "pin" },
          minAccuracy: 0.95
        },
        {
          name: "get_weather_conditions",
          type: "api_call",
          endpoint: "/weather/current",
          method: "GET"
        },
        {
          name: "calculate_recommendation",
          type: "calculation",
          type: "club_recommendation",
          inputs: {
            distance: 150,
            wind: { speed: 10, direction: 0 },
            elevation: 0
          },
          minAccuracy: 0.90
        },
        {
          name: "display_recommendation",
          type: "validation",
          validations: [
            { field: "recommendation", rule: "present" },
            { field: "confidence", rule: "above_threshold" }
          ]
        }
      ]
    },

    voice: {
      name: "Voice-Activated Recommendation",
      type: "shot_recommendation",
      description: "Get recommendation using voice command",
      steps: [
        {
          name: "voice_activation",
          type: "voice_input",
          command: "What club should I use?",
          minConfidence: 0.8
        },
        {
          name: "process_voice_intent",
          type: "calculation",
          type: "intent_processing",
          inputs: { intent: "club_recommendation" }
        },
        {
          name: "get_current_conditions",
          type: "api_call",
          endpoint: "/conditions/current",
          method: "GET"
        },
        {
          name: "generate_recommendation",
          type: "calculation",
          type: "club_recommendation",
          inputs: { source: "voice" }
        },
        {
          name: "voice_response",
          type: "voice_input",
          command: "I recommend using your 7 iron",
          options: { output: true }
        }
      ]
    },

    alternatives: {
      name: "Alternative Recommendations",
      type: "shot_recommendation",
      description: "Provide multiple club options",
      steps: [
        {
          name: "primary_recommendation",
          type: "calculation",
          type: "club_recommendation",
          inputs: { distance: 155 }
        },
        {
          name: "calculate_alternatives",
          type: "calculation",
          type: "alternative_clubs",
          inputs: { primaryClub: "7iron", distance: 155 }
        },
        {
          name: "risk_assessment",
          type: "calculation",
          type: "risk_analysis",
          inputs: { alternatives: ["6iron", "7iron", "8iron"] }
        },
        {
          name: "display_alternatives",
          type: "validation",
          validations: [
            { field: "alternatives", rule: "multiple_options" },
            { field: "risk_levels", rule: "calculated" }
          ]
        }
      ]
    },

    noGPS: {
      name: "No GPS Available",
      type: "shot_recommendation",
      description: "Handle GPS unavailable scenario",
      steps: [
        {
          name: "attempt_gps",
          type: "api_call",
          endpoint: "/location/current",
          method: "GET",
          expectedFailure: true
        },
        {
          name: "fallback_to_manual",
          type: "navigation",
          target: "manual_distance_input"
        },
        {
          name: "manual_distance_entry",
          type: "input",
          data: { distance: "145" },
          submit: true
        },
        {
          name: "manual_conditions_entry",
          type: "input",
          data: {
            wind: "10",
            windDirection: "headwind",
            elevation: "uphill"
          },
          submit: true
        },
        {
          name: "calculate_with_manual_data",
          type: "calculation",
          type: "club_recommendation",
          inputs: { source: "manual" }
        }
      ]
    },

    weatherConditions: {
      name: "Weather Condition Integration",
      type: "shot_recommendation",
      description: "Factor weather into recommendations",
      steps: [
        {
          name: "get_detailed_weather",
          type: "api_call",
          endpoint: "/weather/detailed",
          method: "GET"
        },
        {
          name: "analyze_wind_impact",
          type: "calculation",
          type: "wind_adjustment",
          inputs: {
            windSpeed: 15,
            windDirection: 45,
            shotDirection: 0
          }
        },
        {
          name: "analyze_temperature_impact",
          type: "calculation",
          type: "temperature_adjustment",
          inputs: { temperature: 95 }
        },
        {
          name: "analyze_humidity_impact",
          type: "calculation",
          type: "humidity_adjustment",
          inputs: { humidity: 85 }
        },
        {
          name: "integrate_weather_factors",
          type: "calculation",
          type: "club_recommendation",
          inputs: { weatherAdjusted: true }
        }
      ]
    }
  },

  // Profile Management Flows
  profileManagement: {
    updateStats: {
      name: "Update Personal Statistics",
      type: "profile_management",
      description: "Update user's golf statistics",
      steps: [
        {
          name: "navigate_to_profile",
          type: "navigation",
          target: "profile_screen"
        },
        {
          name: "edit_stats",
          type: "navigation",
          target: "edit_stats_button",
          action: "tap"
        },
        {
          name: "update_handicap",
          type: "input",
          data: { handicap: "12" }
        },
        {
          name: "update_average_score",
          type: "input",
          data: { averageScore: "85" }
        },
        {
          name: "update_driving_distance",
          type: "input",
          data: { drivingDistance: "245" }
        },
        {
          name: "save_stats",
          type: "input",
          submit: true
        },
        {
          name: "validate_stats_update",
          type: "validation",
          validations: [
            { field: "handicap", rule: "within_range" },
            { field: "averageScore", rule: "reasonable" }
          ]
        }
      ]
    },

    clubCalibration: {
      name: "Club Distance Calibration",
      type: "profile_management",
      description: "Calibrate individual club distances",
      steps: [
        {
          name: "navigate_to_clubs",
          type: "navigation",
          target: "club_settings"
        },
        {
          name: "start_calibration",
          type: "navigation",
          target: "calibrate_button",
          action: "tap"
        },
        {
          name: "calibrate_driver",
          type: "input",
          data: { club: "driver", distance: "265" }
        },
        {
          name: "calibrate_7iron",
          type: "input",
          data: { club: "7iron", distance: "155" }
        },
        {
          name: "calibrate_pw",
          type: "input",
          data: { club: "pw", distance: "125" }
        },
        {
          name: "accuracy_check",
          type: "calculation",
          type: "accuracy_validation",
          inputs: { calibratedClubs: 3 }
        },
        {
          name: "save_calibration",
          type: "input",
          submit: true
        }
      ]
    },

    deviceSync: {
      name: "Device Synchronization",
      type: "profile_management",
      description: "Sync profile across devices",
      steps: [
        {
          name: "initiate_sync",
          type: "api_call",
          endpoint: "/sync/start",
          method: "POST"
        },
        {
          name: "upload_local_data",
          type: "api_call",
          endpoint: "/sync/upload",
          method: "PUT",
          data: { profile: "user_profile_data" }
        },
        {
          name: "download_remote_data",
          type: "api_call",
          endpoint: "/sync/download",
          method: "GET"
        },
        {
          name: "merge_data",
          type: "calculation",
          type: "data_merge",
          inputs: { local: "local_data", remote: "remote_data" }
        },
        {
          name: "consistency_check",
          type: "validation",
          validations: [
            { field: "profile_data", rule: "consistent" },
            { field: "club_distances", rule: "synchronized" }
          ]
        },
        {
          name: "complete_sync",
          type: "api_call",
          endpoint: "/sync/complete",
          method: "POST"
        }
      ]
    },

    dataExport: {
      name: "Data Export",
      type: "profile_management",
      description: "Export user data",
      steps: [
        {
          name: "navigate_to_export",
          type: "navigation",
          target: "data_export_screen"
        },
        {
          name: "select_export_format",
          type: "input",
          data: { format: "CSV" }
        },
        {
          name: "select_data_types",
          type: "input",
          data: {
            rounds: true,
            statistics: true,
            clubData: true
          }
        },
        {
          name: "generate_export",
          type: "api_call",
          endpoint: "/export/generate",
          method: "POST"
        },
        {
          name: "validate_export",
          type: "validation",
          validations: [
            { field: "file_size", rule: "greater_than_zero" },
            { field: "format", rule: "csv_valid" }
          ]
        }
      ]
    }
  },

  // Subscription Management Flows
  subscription: {
    premiumUpgrade: {
      name: "Premium Upgrade",
      type: "subscription",
      description: "Upgrade to premium subscription",
      steps: [
        {
          name: "view_premium_features",
          type: "navigation",
          target: "premium_screen"
        },
        {
          name: "select_subscription_plan",
          type: "input",
          data: { plan: "monthly" }
        },
        {
          name: "enter_payment_info",
          type: "input",
          data: {
            cardNumber: "4111111111111111",
            expiryDate: "12/25",
            cvv: "123"
          },
          submit: true
        },
        {
          name: "process_payment",
          type: "api_call",
          endpoint: "/payment/process",
          method: "POST"
        },
        {
          name: "activate_premium",
          type: "api_call",
          endpoint: "/subscription/activate",
          method: "POST"
        },
        {
          name: "unlock_features",
          type: "validation",
          validations: [
            { field: "premium_features", rule: "unlocked" },
            { field: "subscription_status", rule: "active" }
          ]
        }
      ]
    },

    paymentFailure: {
      name: "Payment Failure Handling",
      type: "subscription",
      description: "Handle payment processing failure",
      steps: [
        {
          name: "attempt_payment",
          type: "api_call",
          endpoint: "/payment/process",
          method: "POST",
          expectedFailure: true
        },
        {
          name: "display_error_message",
          type: "validation",
          validations: [
            { field: "error_message", rule: "displayed" },
            { field: "retry_option", rule: "available" }
          ]
        },
        {
          name: "offer_alternative_payment",
          type: "navigation",
          target: "alternative_payment_methods"
        },
        {
          name: "retry_with_different_card",
          type: "input",
          data: {
            cardNumber: "4000000000000002",
            expiryDate: "01/26",
            cvv: "456"
          },
          submit: true
        }
      ]
    },

    freeTrial: {
      name: "Free Trial Activation",
      type: "subscription",
      description: "Activate free trial period",
      steps: [
        {
          name: "start_trial",
          type: "navigation",
          target: "start_trial_button",
          action: "tap"
        },
        {
          name: "activate_trial",
          type: "api_call",
          endpoint: "/trial/activate",
          method: "POST"
        },
        {
          name: "set_trial_duration",
          type: "calculation",
          type: "trial_setup",
          inputs: { duration: 7 } // 7 days
        },
        {
          name: "enable_trial_features",
          type: "validation",
          validations: [
            { field: "trial_status", rule: "active" },
            { field: "trial_features", rule: "enabled" }
          ]
        }
      ]
    },

    cancellation: {
      name: "Subscription Cancellation",
      type: "subscription",
      description: "Cancel active subscription",
      steps: [
        {
          name: "navigate_to_subscription",
          type: "navigation",
          target: "subscription_settings"
        },
        {
          name: "request_cancellation",
          type: "navigation",
          target: "cancel_subscription_button",
          action: "tap"
        },
        {
          name: "confirm_cancellation",
          type: "input",
          data: { confirmCancel: true },
          submit: true
        },
        {
          name: "process_cancellation",
          type: "api_call",
          endpoint: "/subscription/cancel",
          method: "POST"
        },
        {
          name: "retain_data_check",
          type: "validation",
          validations: [
            { field: "user_data", rule: "preserved" },
            { field: "subscription_status", rule: "cancelled" }
          ]
        }
      ]
    }
  },

  // Round Management Flows
  roundManagement: {
    startRound: {
      name: "Start New Round",
      type: "round_management",
      description: "Begin a new golf round",
      steps: [
        {
          name: "navigate_to_new_round",
          type: "navigation",
          target: "new_round_screen"
        },
        {
          name: "select_course",
          type: "input",
          data: { course: "Pebble Beach Golf Links" }
        },
        {
          name: "select_tees",
          type: "input",
          data: { tees: "blue" }
        },
        {
          name: "confirm_weather_conditions",
          type: "api_call",
          endpoint: "/weather/course",
          method: "GET"
        },
        {
          name: "start_round",
          type: "navigation",
          target: "start_round_button",
          action: "tap"
        },
        {
          name: "initialize_round_tracking",
          type: "api_call",
          endpoint: "/round/start",
          method: "POST"
        }
      ]
    },

    shotTracking: {
      name: "Shot Tracking During Round",
      type: "round_management",
      description: "Track shots during active round",
      steps: [
        {
          name: "hole_1_tee_shot",
          type: "voice_input",
          command: "Driver, 250 yards down the middle"
        },
        {
          name: "record_tee_shot",
          type: "api_call",
          endpoint: "/shot/record",
          method: "POST",
          data: { club: "driver", distance: 250, accuracy: "fairway" }
        },
        {
          name: "approach_shot",
          type: "voice_input",
          command: "7 iron to the green"
        },
        {
          name: "record_approach",
          type: "api_call",
          endpoint: "/shot/record",
          method: "POST",
          data: { club: "7iron", target: "green" }
        },
        {
          name: "update_statistics",
          type: "calculation",
          type: "statistics_update",
          inputs: { shots: 2, hole: 1 }
        }
      ]
    },

    pauseResume: {
      name: "Pause and Resume Round",
      type: "round_management",
      description: "Handle round interruption and resumption",
      steps: [
        {
          name: "pause_round",
          type: "navigation",
          target: "pause_round_button",
          action: "tap"
        },
        {
          name: "save_round_state",
          type: "api_call",
          endpoint: "/round/pause",
          method: "POST"
        },
        {
          name: "app_backgrounded",
          type: "navigation",
          target: "background"
        },
        {
          name: "wait_period",
          type: "wait",
          duration: 30000 // 30 seconds
        },
        {
          name: "app_resumed",
          type: "navigation",
          target: "foreground"
        },
        {
          name: "resume_round",
          type: "api_call",
          endpoint: "/round/resume",
          method: "POST"
        },
        {
          name: "verify_data_integrity",
          type: "validation",
          validations: [
            { field: "round_data", rule: "intact" },
            { field: "shot_history", rule: "preserved" }
          ]
        }
      ]
    },

    completeRound: {
      name: "Complete Round",
      type: "round_management",
      description: "Finish round and generate scorecard",
      steps: [
        {
          name: "final_hole_completion",
          type: "input",
          data: { hole: 18, score: 4 },
          submit: true
        },
        {
          name: "calculate_final_score",
          type: "calculation",
          type: "scorecard_calculation",
          inputs: { holes: 18 }
        },
        {
          name: "generate_statistics",
          type: "calculation",
          type: "round_statistics",
          inputs: { completedRound: true }
        },
        {
          name: "save_round",
          type: "api_call",
          endpoint: "/round/complete",
          method: "POST"
        },
        {
          name: "display_scorecard",
          type: "validation",
          validations: [
            { field: "scorecard", rule: "complete" },
            { field: "statistics", rule: "calculated" }
          ]
        }
      ]
    }
  },

  // Settings and Preferences
  settings: {
    preferences: {
      name: "Update App Preferences",
      type: "settings",
      steps: [
        {
          name: "navigate_to_settings",
          type: "navigation",
          target: "settings_screen"
        },
        {
          name: "update_units",
          type: "input",
          data: { units: "meters" }
        },
        {
          name: "update_voice_prompts",
          type: "input",
          data: { voicePrompts: false }
        },
        {
          name: "save_preferences",
          type: "input",
          submit: true
        }
      ]
    },

    voiceConfiguration: {
      name: "Configure Voice Settings",
      type: "settings",
      steps: [
        {
          name: "voice_settings",
          type: "navigation",
          target: "voice_settings_screen"
        },
        {
          name: "test_microphone",
          type: "voice_input",
          command: "Testing microphone"
        },
        {
          name: "adjust_sensitivity",
          type: "input",
          data: { sensitivity: 80 }
        },
        {
          name: "save_voice_settings",
          type: "input",
          submit: true
        }
      ]
    },

    notifications: {
      name: "Notification Preferences",
      type: "settings",
      steps: [
        {
          name: "notification_settings",
          type: "navigation",
          target: "notification_settings"
        },
        {
          name: "enable_weather_alerts",
          type: "input",
          data: { weatherAlerts: true }
        },
        {
          name: "enable_course_updates",
          type: "input",
          data: { courseUpdates: true }
        },
        {
          name: "save_notification_settings",
          type: "input",
          submit: true
        }
      ]
    }
  },

  // Error Recovery Scenarios
  errorRecovery: {
    networkError: {
      name: "Network Error Recovery",
      type: "error_recovery",
      steps: [
        {
          name: "simulate_network_loss",
          type: "api_call",
          endpoint: "/test/network-error",
          method: "GET",
          expectedFailure: true
        },
        {
          name: "detect_error",
          type: "validation",
          validations: [
            { field: "network_status", rule: "error_detected" }
          ]
        },
        {
          name: "show_offline_mode",
          type: "navigation",
          target: "offline_mode"
        },
        {
          name: "restore_network",
          type: "api_call",
          endpoint: "/test/restore-network",
          method: "POST"
        },
        {
          name: "resume_functionality",
          type: "validation",
          validations: [
            { field: "functionality", rule: "restored" }
          ]
        }
      ]
    },

    appCrash: {
      name: "App Crash Recovery",
      type: "error_recovery",
      steps: [
        {
          name: "simulate_crash",
          type: "navigation",
          target: "crash_simulation"
        },
        {
          name: "detect_crash",
          type: "validation",
          validations: [
            { field: "crash_detected", rule: "true" }
          ]
        },
        {
          name: "restore_app",
          type: "navigation",
          target: "app_restart"
        },
        {
          name: "recover_data",
          type: "api_call",
          endpoint: "/recovery/data",
          method: "GET"
        }
      ]
    },

    storageFull: {
      name: "Storage Full Handling",
      type: "error_recovery",
      steps: [
        {
          name: "simulate_storage_full",
          type: "api_call",
          endpoint: "/test/storage-full",
          method: "POST"
        },
        {
          name: "detect_storage_issue",
          type: "validation",
          validations: [
            { field: "storage_available", rule: "insufficient" }
          ]
        },
        {
          name: "offer_cleanup",
          type: "navigation",
          target: "storage_cleanup"
        },
        {
          name: "perform_cleanup",
          type: "api_call",
          endpoint: "/cleanup/storage",
          method: "POST"
        }
      ]
    }
  },

  // Accessibility Flows
  accessibility: {
    voiceOnly: {
      name: "Voice-Only Navigation",
      type: "accessibility",
      steps: [
        {
          name: "enable_voice_only_mode",
          type: "voice_input",
          command: "Enable voice only mode"
        },
        {
          name: "voice_navigation_test",
          type: "voice_input",
          command: "Go to settings"
        },
        {
          name: "voice_input_test",
          type: "voice_input",
          command: "Change units to meters"
        }
      ]
    },

    screenReader: {
      name: "Screen Reader Compatibility",
      type: "accessibility",
      steps: [
        {
          name: "enable_screen_reader",
          type: "navigation",
          target: "accessibility_settings"
        },
        {
          name: "test_element_accessibility",
          type: "validation",
          validations: [
            { field: "buttons", rule: "screen_reader_accessible" },
            { field: "text", rule: "screen_reader_accessible" }
          ]
        }
      ]
    },

    highContrast: {
      name: "High Contrast Mode",
      type: "accessibility",
      steps: [
        {
          name: "enable_high_contrast",
          type: "input",
          data: { highContrast: true }
        },
        {
          name: "validate_contrast",
          type: "validation",
          validations: [
            { field: "contrast_ratio", rule: "meets_wcag_aa" }
          ]
        }
      ]
    }
  },

  // Performance Testing
  performance: {
    concurrentUsers: {
      name: "Concurrent User Load Test",
      type: "performance",
      steps: [
        {
          name: "simulate_load",
          type: "calculation",
          type: "load_simulation",
          inputs: { users: 50, duration: 60000 }
        }
      ]
    },

    rapidCommands: {
      name: "Rapid Command Processing",
      type: "performance",
      steps: [
        {
          name: "rapid_voice_commands",
          type: "voice_input",
          command: "Distance to pin",
          options: { rapid: true }
        },
        {
          name: "rapid_calculations",
          type: "calculation",
          type: "distance",
          inputs: { rapid: true }
        }
      ]
    },

    stressTest: {
      name: "System Stress Test",
      type: "performance",
      steps: [
        {
          name: "memory_stress",
          type: "calculation",
          type: "memory_stress",
          inputs: { duration: 30000 }
        },
        {
          name: "cpu_stress",
          type: "calculation",
          type: "cpu_stress",
          inputs: { duration: 30000 }
        }
      ]
    }
  },

  // Integration Testing
  integration: {
    courseManagement: {
      name: "Course Management System Integration",
      type: "integration",
      steps: [
        {
          name: "connect_to_cms",
          type: "api_call",
          endpoint: "/integration/cms/connect",
          method: "POST"
        },
        {
          name: "sync_course_data",
          type: "api_call",
          endpoint: "/integration/cms/sync",
          method: "GET"
        }
      ]
    },

    fitnessTracker: {
      name: "Fitness Tracker Integration",
      type: "integration",
      steps: [
        {
          name: "pair_device",
          type: "api_call",
          endpoint: "/integration/fitness/pair",
          method: "POST"
        },
        {
          name: "sync_health_data",
          type: "api_call",
          endpoint: "/integration/fitness/sync",
          method: "GET"
        }
      ]
    },

    golfAnalytics: {
      name: "Golf Analytics Platform Export",
      type: "integration",
      steps: [
        {
          name: "prepare_export_data",
          type: "calculation",
          type: "data_preparation",
          inputs: { format: "golf_analytics" }
        },
        {
          name: "export_to_platform",
          type: "api_call",
          endpoint: "/integration/analytics/export",
          method: "POST"
        }
      ]
    }
  },

  // Edge Cases
  edgeCases: {
    extremeWeather: {
      name: "Extreme Weather Conditions",
      type: "edge_case",
      steps: [
        {
          name: "simulate_extreme_wind",
          type: "api_call",
          endpoint: "/test/weather/extreme",
          method: "POST",
          data: { wind: 50, temperature: 110 }
        },
        {
          name: "calculate_with_extreme_conditions",
          type: "calculation",
          type: "club_recommendation",
          inputs: { extremeWeather: true }
        }
      ]
    },

    highAltitude: {
      name: "High Altitude Course",
      type: "edge_case",
      steps: [
        {
          name: "set_altitude",
          type: "input",
          data: { altitude: 8000 }
        },
        {
          name: "adjust_calculations",
          type: "calculation",
          type: "altitude_adjustment",
          inputs: { altitude: 8000 }
        }
      ]
    },

    unusualLayout: {
      name: "Unusual Course Layout",
      type: "edge_case",
      steps: [
        {
          name: "analyze_layout",
          type: "calculation",
          type: "layout_analysis",
          inputs: { layout: "unusual" }
        },
        {
          name: "adapt_recommendations",
          type: "calculation",
          type: "adaptive_recommendation",
          inputs: { layout: "analyzed" }
        }
      ]
    }
  },

  // Regression Testing
  regression: {
    coreFeatures: {
      name: "Core Feature Regression",
      type: "regression",
      steps: [
        {
          name: "test_distance_calculation",
          type: "calculation",
          type: "distance",
          inputs: { lat1: 40.7128, lon1: -74.0060, lat2: 40.7589, lon2: -73.9851 }
        },
        {
          name: "test_voice_recognition",
          type: "voice_input",
          command: "How far to the pin?"
        },
        {
          name: "test_club_recommendation",
          type: "calculation",
          type: "club_recommendation",
          inputs: { distance: 150 }
        }
      ]
    },

    dataPreservation: {
      name: "Data Preservation During Updates",
      type: "regression",
      steps: [
        {
          name: "backup_user_data",
          type: "api_call",
          endpoint: "/backup/create",
          method: "POST"
        },
        {
          name: "simulate_update",
          type: "api_call",
          endpoint: "/test/update",
          method: "POST"
        },
        {
          name: "verify_data_integrity",
          type: "validation",
          validations: [
            { field: "user_data", rule: "intact" },
            { field: "settings", rule: "preserved" }
          ]
        }
      ]
    }
  },

  // Security Testing
  security: {
    authentication: {
      name: "Secure Authentication",
      type: "security",
      steps: [
        {
          name: "test_login",
          type: "api_call",
          endpoint: "/auth/login",
          method: "POST",
          data: { email: "user@example.com", password: "SecurePass123!" }
        },
        {
          name: "validate_token_security",
          type: "validation",
          validations: [
            { field: "token", rule: "secure_format" },
            { field: "token_expiry", rule: "appropriate_duration" }
          ]
        }
      ]
    },

    privacy: {
      name: "Privacy Protection",
      type: "security",
      steps: [
        {
          name: "check_data_encryption",
          type: "validation",
          validations: [
            { field: "user_data", rule: "encrypted" },
            { field: "location_data", rule: "encrypted" }
          ]
        },
        {
          name: "verify_privacy_compliance",
          type: "validation",
          validations: [
            { field: "data_collection", rule: "gdpr_compliant" },
            { field: "user_consent", rule: "obtained" }
          ]
        }
      ]
    },

    unauthorizedAccess: {
      name: "Unauthorized Access Prevention",
      type: "security",
      steps: [
        {
          name: "attempt_unauthorized_access",
          type: "api_call",
          endpoint: "/protected/endpoint",
          method: "GET",
          data: { invalid_token: "fake_token" },
          expectedFailure: true
        },
        {
          name: "verify_access_blocked",
          type: "validation",
          validations: [
            { field: "access_denied", rule: "true" },
            { field: "security_log", rule: "recorded" }
          ]
        }
      ]
    }
  }
};

module.exports = { userFlowScenarios };