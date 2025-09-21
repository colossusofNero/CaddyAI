/**
 * CaddyAI Device Testing Matrix Configuration
 * Comprehensive device compatibility and testing setup
 */

const deviceTestMatrix = {
  // iOS Device Testing Matrix
  ios: {
    devices: [
      // iPhone Models
      {
        name: "iPhone 12 Mini",
        model: "iPhone13,1",
        screenSize: { width: 375, height: 812, density: 476 },
        chipset: "A14 Bionic",
        memory: "4GB",
        storage: ["64GB", "128GB", "256GB"],
        osVersions: ["iOS 14.0", "iOS 14.8", "iOS 15.0", "iOS 15.7"],
        testPriority: "medium",
        marketShare: 3.2,
        features: {
          faceId: true,
          nfc: true,
          lidar: false,
          ultraWideband: true,
          wireless_charging: true,
          camera: "dual"
        }
      },
      {
        name: "iPhone 13",
        model: "iPhone14,5",
        screenSize: { width: 390, height: 844, density: 460 },
        chipset: "A15 Bionic",
        memory: "4GB",
        storage: ["128GB", "256GB", "512GB"],
        osVersions: ["iOS 15.0", "iOS 15.7", "iOS 16.0", "iOS 16.6"],
        testPriority: "high",
        marketShare: 8.7,
        features: {
          faceId: true,
          nfc: true,
          lidar: false,
          ultraWideband: true,
          wireless_charging: true,
          camera: "dual"
        }
      },
      {
        name: "iPhone 13 Pro",
        model: "iPhone14,2",
        screenSize: { width: 390, height: 844, density: 460 },
        chipset: "A15 Bionic",
        memory: "6GB",
        storage: ["128GB", "256GB", "512GB", "1TB"],
        osVersions: ["iOS 15.0", "iOS 15.7", "iOS 16.0", "iOS 16.6"],
        testPriority: "high",
        marketShare: 6.4,
        features: {
          faceId: true,
          nfc: true,
          lidar: true,
          ultraWideband: true,
          wireless_charging: true,
          camera: "triple",
          promotionDisplay: true
        }
      },
      {
        name: "iPhone 14",
        model: "iPhone15,3",
        screenSize: { width: 390, height: 844, density: 460 },
        chipset: "A15 Bionic",
        memory: "6GB",
        storage: ["128GB", "256GB", "512GB"],
        osVersions: ["iOS 16.0", "iOS 16.6", "iOS 17.0", "iOS 17.3"],
        testPriority: "critical",
        marketShare: 12.1,
        features: {
          faceId: true,
          nfc: true,
          lidar: false,
          ultraWideband: true,
          wireless_charging: true,
          camera: "dual",
          emergencySOS: true
        }
      },
      {
        name: "iPhone 14 Pro",
        model: "iPhone15,2",
        screenSize: { width: 393, height: 852, density: 460 },
        chipset: "A16 Bionic",
        memory: "6GB",
        storage: ["128GB", "256GB", "512GB", "1TB"],
        osVersions: ["iOS 16.0", "iOS 16.6", "iOS 17.0", "iOS 17.3"],
        testPriority: "critical",
        marketShare: 7.8,
        features: {
          faceId: true,
          nfc: true,
          lidar: true,
          ultraWideband: true,
          wireless_charging: true,
          camera: "triple",
          promotionDisplay: true,
          dynamicIsland: true,
          alwaysOnDisplay: true
        }
      },
      {
        name: "iPhone 15",
        model: "iPhone16,4",
        screenSize: { width: 393, height: 852, density: 460 },
        chipset: "A16 Bionic",
        memory: "6GB",
        storage: ["128GB", "256GB", "512GB"],
        osVersions: ["iOS 17.0", "iOS 17.3"],
        testPriority: "critical",
        marketShare: 15.3,
        features: {
          faceId: true,
          nfc: true,
          lidar: false,
          ultraWideband: true,
          wireless_charging: true,
          camera: "dual",
          usbC: true,
          actionButton: false,
          dynamicIsland: true
        }
      },
      {
        name: "iPhone 15 Pro",
        model: "iPhone16,1",
        screenSize: { width: 393, height: 852, density: 460 },
        chipset: "A17 Pro",
        memory: "8GB",
        storage: ["128GB", "256GB", "512GB", "1TB"],
        osVersions: ["iOS 17.0", "iOS 17.3"],
        testPriority: "critical",
        marketShare: 9.2,
        features: {
          faceId: true,
          nfc: true,
          lidar: true,
          ultraWideband: true,
          wireless_charging: true,
          camera: "triple",
          promotionDisplay: true,
          dynamicIsland: true,
          alwaysOnDisplay: true,
          usbC: true,
          actionButton: true,
          titanium: true
        }
      },

      // iPad Models
      {
        name: "iPad Air (5th gen)",
        model: "iPad13,1",
        screenSize: { width: 820, height: 1180, density: 264 },
        chipset: "M1",
        memory: "8GB",
        storage: ["64GB", "256GB"],
        osVersions: ["iPadOS 15.0", "iPadOS 16.0", "iPadOS 17.0"],
        testPriority: "medium",
        marketShare: 2.1,
        features: {
          touchId: true,
          pencilSupport: "gen2",
          faceId: false,
          camera: "single"
        }
      },
      {
        name: "iPad Pro 11-inch (4th gen)",
        model: "iPad14,3",
        screenSize: { width: 834, height: 1194, density: 264 },
        chipset: "M2",
        memory: "8GB",
        storage: ["128GB", "256GB", "512GB", "1TB", "2TB"],
        osVersions: ["iPadOS 16.0", "iPadOS 17.0"],
        testPriority: "high",
        marketShare: 1.8,
        features: {
          faceId: true,
          lidar: true,
          pencilSupport: "gen2",
          promotionDisplay: true,
          camera: "dual",
          thunderbolt: true
        }
      }
    ],

    testConfigurations: [
      {
        name: "iOS 14 Compatibility",
        devices: ["iPhone 12 Mini"],
        osVersions: ["iOS 14.0", "iOS 14.8"],
        testTypes: ["functionality", "performance", "ui"],
        priority: "medium"
      },
      {
        name: "iOS 15 Standard",
        devices: ["iPhone 13", "iPhone 13 Pro", "iPad Air"],
        osVersions: ["iOS 15.0", "iOS 15.7"],
        testTypes: ["functionality", "performance", "voice", "gps"],
        priority: "high"
      },
      {
        name: "iOS 16 Mainstream",
        devices: ["iPhone 14", "iPhone 14 Pro"],
        osVersions: ["iOS 16.0", "iOS 16.6"],
        testTypes: ["full_suite"],
        priority: "critical"
      },
      {
        name: "iOS 17 Latest",
        devices: ["iPhone 15", "iPhone 15 Pro", "iPad Pro"],
        osVersions: ["iOS 17.0", "iOS 17.3"],
        testTypes: ["full_suite", "new_features"],
        priority: "critical"
      }
    ]
  },

  // Android Device Testing Matrix
  android: {
    devices: [
      // Samsung Galaxy S Series
      {
        name: "Samsung Galaxy S21",
        model: "SM-G991U",
        manufacturer: "Samsung",
        screenSize: { width: 384, height: 854, density: 421 },
        chipset: "Snapdragon 888",
        memory: "8GB",
        storage: ["128GB", "256GB"],
        androidVersions: ["Android 11", "Android 12", "Android 13"],
        testPriority: "high",
        marketShare: 4.2,
        features: {
          fingerprint: "ultrasonic",
          nfc: true,
          wireless_charging: true,
          camera: "triple",
          spen: false,
          oneUI: "3.1"
        }
      },
      {
        name: "Samsung Galaxy S22",
        model: "SM-S901U",
        manufacturer: "Samsung",
        screenSize: { width: 384, height: 854, density: 425 },
        chipset: "Snapdragon 8 Gen 1",
        memory: "8GB",
        storage: ["128GB", "256GB"],
        androidVersions: ["Android 12", "Android 13", "Android 14"],
        testPriority: "critical",
        marketShare: 6.7,
        features: {
          fingerprint: "ultrasonic",
          nfc: true,
          wireless_charging: true,
          camera: "triple",
          spen: false,
          oneUI: "4.1"
        }
      },
      {
        name: "Samsung Galaxy S23",
        model: "SM-S911U",
        manufacturer: "Samsung",
        screenSize: { width: 384, height: 854, density: 425 },
        chipset: "Snapdragon 8 Gen 2",
        memory: "8GB",
        storage: ["128GB", "256GB", "512GB"],
        androidVersions: ["Android 13", "Android 14"],
        testPriority: "critical",
        marketShare: 8.9,
        features: {
          fingerprint: "ultrasonic",
          nfc: true,
          wireless_charging: true,
          camera: "triple",
          spen: false,
          oneUI: "5.1"
        }
      },

      // Google Pixel Series
      {
        name: "Google Pixel 6",
        model: "GB7N6",
        manufacturer: "Google",
        screenSize: { width: 411, height: 891, density: 411 },
        chipset: "Google Tensor",
        memory: "8GB",
        storage: ["128GB", "256GB"],
        androidVersions: ["Android 12", "Android 13", "Android 14"],
        testPriority: "high",
        marketShare: 3.1,
        features: {
          fingerprint: "optical",
          nfc: true,
          wireless_charging: true,
          camera: "dual",
          pureAndroid: true,
          magicEraser: true
        }
      },
      {
        name: "Google Pixel 7",
        model: "GVU6C",
        manufacturer: "Google",
        screenSize: { width: 411, height: 891, density: 416 },
        chipset: "Google Tensor G2",
        memory: "8GB",
        storage: ["128GB", "256GB"],
        androidVersions: ["Android 13", "Android 14"],
        testPriority: "critical",
        marketShare: 4.5,
        features: {
          fingerprint: "optical",
          nfc: true,
          wireless_charging: true,
          camera: "dual",
          pureAndroid: true,
          faceUnlock: true
        }
      },
      {
        name: "Google Pixel 8",
        model: "GX7AS",
        manufacturer: "Google",
        screenSize: { width: 411, height: 891, density: 428 },
        chipset: "Google Tensor G3",
        memory: "8GB",
        storage: ["128GB", "256GB"],
        androidVersions: ["Android 14"],
        testPriority: "critical",
        marketShare: 3.8,
        features: {
          fingerprint: "optical",
          nfc: true,
          wireless_charging: true,
          camera: "dual",
          pureAndroid: true,
          aiFeatures: true,
          magicEraser: true
        }
      },

      // OnePlus Series
      {
        name: "OnePlus 9",
        model: "LE2115",
        manufacturer: "OnePlus",
        screenSize: { width: 412, height: 915, density: 402 },
        chipset: "Snapdragon 888",
        memory: "8GB",
        storage: ["128GB", "256GB"],
        androidVersions: ["Android 11", "Android 12", "Android 13"],
        testPriority: "medium",
        marketShare: 2.3,
        features: {
          fingerprint: "optical",
          nfc: true,
          wireless_charging: true,
          camera: "triple",
          oxygenOS: "11.0",
          hasselblad: true
        }
      },

      // Xiaomi Series
      {
        name: "Xiaomi Mi 11",
        model: "M2011K2G",
        manufacturer: "Xiaomi",
        screenSize: { width: 393, height: 851, density: 515 },
        chipset: "Snapdragon 888",
        memory: "8GB",
        storage: ["128GB", "256GB"],
        androidVersions: ["Android 11", "Android 12", "Android 13"],
        testPriority: "medium",
        marketShare: 1.9,
        features: {
          fingerprint: "optical",
          nfc: true,
          wireless_charging: true,
          camera: "triple",
          miui: "12.0"
        }
      },

      // Budget/Entry-Level Devices
      {
        name: "Samsung Galaxy A54",
        model: "SM-A546U",
        manufacturer: "Samsung",
        screenSize: { width: 360, height: 800, density: 403 },
        chipset: "Exynos 1380",
        memory: "6GB",
        storage: ["128GB", "256GB"],
        androidVersions: ["Android 13", "Android 14"],
        testPriority: "high",
        marketShare: 5.1,
        features: {
          fingerprint: "optical",
          nfc: true,
          wireless_charging: false,
          camera: "triple",
          oneUI: "5.1",
          budget: true
        }
      },

      // Tablets
      {
        name: "Samsung Galaxy Tab S8",
        model: "SM-X700",
        manufacturer: "Samsung",
        screenSize: { width: 753, height: 1037, density: 274 },
        chipset: "Snapdragon 8 Gen 1",
        memory: "8GB",
        storage: ["128GB", "256GB"],
        androidVersions: ["Android 12", "Android 13", "Android 14"],
        testPriority: "medium",
        marketShare: 1.2,
        features: {
          fingerprint: "optical",
          spen: true,
          dex: true,
          camera: "dual",
          tablet: true
        }
      }
    ],

    testConfigurations: [
      {
        name: "Android 11 Legacy",
        devices: ["Samsung Galaxy S21", "OnePlus 9", "Xiaomi Mi 11"],
        androidVersions: ["Android 11"],
        testTypes: ["functionality", "compatibility"],
        priority: "medium"
      },
      {
        name: "Android 12 Standard",
        devices: ["Samsung Galaxy S22", "Google Pixel 6", "Google Pixel 7"],
        androidVersions: ["Android 12", "Android 13"],
        testTypes: ["functionality", "performance", "voice", "gps"],
        priority: "high"
      },
      {
        name: "Android 13/14 Latest",
        devices: ["Samsung Galaxy S23", "Google Pixel 7", "Google Pixel 8", "Samsung Galaxy A54"],
        androidVersions: ["Android 13", "Android 14"],
        testTypes: ["full_suite"],
        priority: "critical"
      },
      {
        name: "Budget Device Testing",
        devices: ["Samsung Galaxy A54"],
        androidVersions: ["Android 13", "Android 14"],
        testTypes: ["performance", "memory_constraints", "battery"],
        priority: "high"
      }
    ]
  },

  // Test Execution Matrix
  testExecution: {
    testTypes: {
      functionality: {
        description: "Core app functionality testing",
        tests: [
          "app_launch",
          "voice_recognition",
          "distance_calculation",
          "club_recommendation",
          "gps_accuracy",
          "ui_navigation"
        ],
        duration: "2 hours",
        automation: "full"
      },

      performance: {
        description: "Performance and benchmarking tests",
        tests: [
          "app_launch_time",
          "voice_processing_speed",
          "calculation_performance",
          "memory_usage",
          "battery_drain",
          "network_efficiency"
        ],
        duration: "4 hours",
        automation: "full"
      },

      voice: {
        description: "Voice recognition and processing tests",
        tests: [
          "accent_recognition",
          "noise_handling",
          "command_accuracy",
          "response_time",
          "context_understanding"
        ],
        duration: "3 hours",
        automation: "partial"
      },

      gps: {
        description: "GPS and location-based tests",
        tests: [
          "gps_acquisition_time",
          "location_accuracy",
          "movement_tracking",
          "course_mapping",
          "distance_precision"
        ],
        duration: "2 hours",
        automation: "full"
      },

      ui: {
        description: "User interface and experience tests",
        tests: [
          "screen_adaptation",
          "touch_responsiveness",
          "accessibility",
          "dark_mode",
          "orientation_handling"
        ],
        duration: "3 hours",
        automation: "partial"
      },

      compatibility: {
        description: "OS and device compatibility tests",
        tests: [
          "os_version_support",
          "feature_availability",
          "permission_handling",
          "crash_recovery",
          "data_migration"
        ],
        duration: "2 hours",
        automation: "full"
      },

      new_features: {
        description: "Testing of latest OS features integration",
        tests: [
          "dynamic_island_integration",
          "action_button_support",
          "live_activities",
          "lock_screen_widgets",
          "shortcuts_integration"
        ],
        duration: "1 hour",
        automation: "manual"
      },

      memory_constraints: {
        description: "Testing under memory-limited conditions",
        tests: [
          "low_memory_handling",
          "background_app_refresh",
          "cache_management",
          "graceful_degradation"
        ],
        duration: "2 hours",
        automation: "full"
      },

      battery: {
        description: "Battery usage and optimization tests",
        tests: [
          "active_usage_drain",
          "background_usage_drain",
          "power_saving_mode",
          "charging_optimization"
        ],
        duration: "8 hours",
        automation: "full"
      },

      full_suite: {
        description: "Complete test suite execution",
        tests: ["all_above"],
        duration: "12 hours",
        automation: "mixed"
      }
    },

    executionPlan: {
      daily: {
        description: "Daily regression testing",
        devices: ["iPhone 15", "iPhone 14", "Samsung Galaxy S23", "Google Pixel 7"],
        testTypes: ["functionality", "performance"],
        duration: "6 hours",
        schedule: "03:00 UTC"
      },

      weekly: {
        description: "Comprehensive weekly testing",
        devices: "all_critical_priority",
        testTypes: ["full_suite"],
        duration: "24 hours",
        schedule: "Saturday 00:00 UTC"
      },

      pre_release: {
        description: "Pre-release validation testing",
        devices: "all_devices",
        testTypes: ["full_suite", "compatibility"],
        duration: "48 hours",
        trigger: "release_candidate"
      },

      feature_validation: {
        description: "New feature validation",
        devices: "latest_models",
        testTypes: ["functionality", "ui", "new_features"],
        duration: "8 hours",
        trigger: "feature_branch_merge"
      }
    }
  },

  // Cloud Testing Configuration
  cloudTesting: {
    providers: [
      {
        name: "AWS Device Farm",
        capabilities: {
          realDevices: true,
          automation: "full",
          concurrency: 10,
          video_recording: true,
          screenshot: true,
          logs: "comprehensive"
        },
        deviceCoverage: {
          ios: ["iPhone 12-15", "iPad Air", "iPad Pro"],
          android: ["Samsung S21-S23", "Pixel 6-8", "OnePlus 9"]
        },
        cost: "per_minute",
        integration: "jenkins"
      },
      {
        name: "Firebase Test Lab",
        capabilities: {
          realDevices: true,
          automation: "full",
          concurrency: 15,
          video_recording: true,
          screenshot: true,
          logs: "basic"
        },
        deviceCoverage: {
          android: ["all_major_models"],
          ios: ["limited_selection"]
        },
        cost: "per_hour",
        integration: "github_actions"
      },
      {
        name: "BrowserStack App Live",
        capabilities: {
          realDevices: true,
          automation: "limited",
          concurrency: 5,
          video_recording: true,
          screenshot: true,
          logs: "basic"
        },
        deviceCoverage: {
          ios: ["extensive"],
          android: ["extensive"]
        },
        cost: "subscription",
        integration: "manual"
      }
    ],

    testEnvironments: {
      staging: {
        provider: "AWS Device Farm",
        devices: "subset_critical",
        parallelization: 5,
        retention: "7_days"
      },
      production: {
        provider: "Firebase Test Lab",
        devices: "full_matrix",
        parallelization: 10,
        retention: "30_days"
      }
    }
  },

  // Device Lab Configuration
  physicalLab: {
    devices: [
      {
        name: "iPhone 15 Pro",
        location: "Lab Station 1",
        status: "available",
        lastMaintenance: "2024-01-15",
        accessories: ["charger", "stand", "test_jig"]
      },
      {
        name: "Samsung Galaxy S23",
        location: "Lab Station 2",
        status: "available",
        lastMaintenance: "2024-01-10",
        accessories: ["charger", "stand", "test_jig"]
      }
    ],

    maintenance: {
      schedule: "weekly",
      tasks: [
        "battery_calibration",
        "storage_cleanup",
        "os_updates",
        "app_cache_clear"
      ]
    },

    reservation: {
      system: "jenkins_integration",
      maxDuration: "4_hours",
      conflicts: "automatic_resolution"
    }
  },

  // Test Data Management
  testData: {
    courses: [
      {
        name: "Pebble Beach Golf Links",
        location: "California, USA",
        holes: 18,
        difficulty: "championship",
        features: ["ocean_views", "wind_conditions", "elevation_changes"]
      },
      {
        name: "St. Andrews Old Course",
        location: "Scotland, UK",
        holes: 18,
        difficulty: "championship",
        features: ["links_style", "pot_bunkers", "wind_conditions"]
      },
      {
        name: "Local Municipal Course",
        location: "Generic, USA",
        holes: 18,
        difficulty: "recreational",
        features: ["standard_layout", "minimal_hazards"]
      }
    ],

    userProfiles: [
      {
        type: "beginner",
        handicap: 25,
        distances: {
          driver: 200,
          "7iron": 120,
          pw: 90
        }
      },
      {
        type: "intermediate",
        handicap: 15,
        distances: {
          driver: 250,
          "7iron": 150,
          pw: 120
        }
      },
      {
        type: "advanced",
        handicap: 5,
        distances: {
          driver: 280,
          "7iron": 170,
          pw: 140
        }
      }
    ],

    weatherConditions: [
      {
        type: "calm",
        wind: { speed: 0, direction: 0 },
        temperature: 75,
        humidity: 50
      },
      {
        type: "windy",
        wind: { speed: 20, direction: 45 },
        temperature: 70,
        humidity: 60
      },
      {
        type: "extreme",
        wind: { speed: 35, direction: 180 },
        temperature: 95,
        humidity: 85
      }
    ]
  },

  // Reporting and Analytics
  reporting: {
    testResults: {
      format: "junit_xml",
      storage: "s3_bucket",
      retention: "90_days",
      aggregation: "daily"
    },

    dashboards: [
      {
        name: "Device Compatibility",
        metrics: [
          "pass_rate_by_device",
          "failure_trends",
          "performance_comparison"
        ],
        updateFrequency: "hourly"
      },
      {
        name: "Test Execution",
        metrics: [
          "test_duration",
          "resource_utilization",
          "queue_times"
        ],
        updateFrequency: "real_time"
      }
    ],

    alerts: [
      {
        condition: "pass_rate < 90%",
        recipients: ["qa_team", "dev_team"],
        severity: "high"
      },
      {
        condition: "new_device_failure",
        recipients: ["qa_lead"],
        severity: "medium"
      }
    ]
  }
};

module.exports = { deviceTestMatrix };