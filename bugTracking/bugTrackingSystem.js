/**
 * CaddyAI Bug Tracking System Configuration
 * Comprehensive bug tracking, workflow, and management system
 */

const bugTrackingSystem = {
  // Bug Classification System
  bugClassification: {
    severity: {
      critical: {
        level: 1,
        description: "App crashes, data loss, security vulnerabilities, complete feature failure",
        sla: {
          responseTime: "1 hour",
          resolutionTime: "24 hours",
          escalationTime: "2 hours"
        },
        examples: [
          "App crashes on launch",
          "GPS data corruption",
          "Voice commands cause app freeze",
          "Distance calculations return negative values",
          "User data deleted unexpectedly"
        ],
        autoAssign: ["senior_developer", "tech_lead"],
        notifications: ["slack_critical", "email", "sms"]
      },

      high: {
        level: 2,
        description: "Major feature failures, significant performance issues, incorrect calculations",
        sla: {
          responseTime: "4 hours",
          resolutionTime: "3 days",
          escalationTime: "8 hours"
        },
        examples: [
          "Voice recognition accuracy below 80%",
          "Club recommendations consistently wrong",
          "GPS accuracy off by more than 10 yards",
          "App launch time exceeds 5 seconds",
          "Battery drain exceeds 10% per hour"
        ],
        autoAssign: ["developer", "qa_engineer"],
        notifications: ["slack_high", "email"]
      },

      medium: {
        level: 3,
        description: "Minor feature issues, UI problems, non-critical performance degradation",
        sla: {
          responseTime: "1 day",
          resolutionTime: "1 week",
          escalationTime: "3 days"
        },
        examples: [
          "UI elements misaligned on specific devices",
          "Voice response time occasionally slow",
          "Minor calculation inaccuracies",
          "Settings don't persist correctly",
          "Help text unclear or missing"
        ],
        autoAssign: ["developer"],
        notifications: ["slack_medium"]
      },

      low: {
        level: 4,
        description: "Cosmetic issues, enhancement requests, documentation problems",
        sla: {
          responseTime: "3 days",
          resolutionTime: "1 month",
          escalationTime: "1 week"
        },
        examples: [
          "Typos in user interface",
          "Color scheme improvements",
          "Feature enhancement requests",
          "Documentation updates",
          "Code cleanup suggestions"
        ],
        autoAssign: ["junior_developer"],
        notifications: ["slack_low"]
      }
    },

    priority: {
      p0: {
        description: "Blocking release, affects all users",
        color: "#FF0000",
        icon: "🔴"
      },
      p1: {
        description: "High impact, affects major functionality",
        color: "#FF8000",
        icon: "🟠"
      },
      p2: {
        description: "Medium impact, affects some users",
        color: "#FFFF00",
        icon: "🟡"
      },
      p3: {
        description: "Low impact, minor issues",
        color: "#00FF00",
        icon: "🟢"
      }
    },

    category: {
      voice_processing: {
        description: "Voice recognition, command processing, audio issues",
        owner: "voice_team",
        labels: ["voice", "audio", "speech"],
        commonIssues: [
          "recognition_accuracy",
          "background_noise",
          "accent_handling",
          "command_parsing"
        ]
      },

      calculations: {
        description: "Distance calculations, club recommendations, golf math",
        owner: "algorithm_team",
        labels: ["calculation", "math", "algorithm"],
        commonIssues: [
          "distance_accuracy",
          "wind_adjustment",
          "elevation_calculation",
          "club_recommendation"
        ]
      },

      gps_location: {
        description: "GPS accuracy, location services, course mapping",
        owner: "platform_team",
        labels: ["gps", "location", "mapping"],
        commonIssues: [
          "gps_accuracy",
          "location_acquisition",
          "course_mapping",
          "coordinate_conversion"
        ]
      },

      user_interface: {
        description: "UI/UX issues, layout problems, accessibility",
        owner: "frontend_team",
        labels: ["ui", "ux", "frontend", "accessibility"],
        commonIssues: [
          "layout_issues",
          "button_responsiveness",
          "accessibility_compliance",
          "dark_mode_support"
        ]
      },

      performance: {
        description: "Speed, memory usage, battery consumption, responsiveness",
        owner: "performance_team",
        labels: ["performance", "optimization", "speed"],
        commonIssues: [
          "slow_launch",
          "memory_leak",
          "battery_drain",
          "calculation_speed"
        ]
      },

      device_compatibility: {
        description: "Device-specific issues, OS compatibility",
        owner: "platform_team",
        labels: ["compatibility", "device", "os"],
        commonIssues: [
          "ios_specific",
          "android_specific",
          "device_model_issue",
          "os_version_compatibility"
        ]
      },

      data_management: {
        description: "Data storage, sync, backup, corruption",
        owner: "backend_team",
        labels: ["data", "storage", "sync"],
        commonIssues: [
          "data_corruption",
          "sync_failure",
          "storage_full",
          "backup_restore"
        ]
      }
    },

    component: {
      voice_engine: {
        description: "Speech recognition and processing components",
        codebase: ["src/voice/", "lib/speech/"],
        tests: ["tests/voice/", "tests/integration/voice/"]
      },

      calculation_engine: {
        description: "Golf calculation and recommendation algorithms",
        codebase: ["src/calculations/", "lib/golf/"],
        tests: ["tests/calculation.test.js", "tests/integration/calculations/"]
      },

      gps_service: {
        description: "Location services and GPS handling",
        codebase: ["src/location/", "lib/gps/"],
        tests: ["tests/gps/", "tests/integration/location/"]
      },

      ui_framework: {
        description: "User interface components and layouts",
        codebase: ["src/components/", "src/screens/"],
        tests: ["tests/ui/", "tests/e2e/"]
      },

      data_layer: {
        description: "Data storage, sync, and management",
        codebase: ["src/data/", "src/storage/"],
        tests: ["tests/data/", "tests/storage/"]
      }
    }
  },

  // Bug Workflow States
  workflow: {
    states: {
      new: {
        description: "Newly reported, awaiting triage",
        nextStates: ["triaged", "duplicate", "invalid"],
        permissions: ["reporter", "triage_team"],
        autoActions: ["assign_triage", "send_acknowledgment"],
        color: "#E6E6FA"
      },

      triaged: {
        description: "Reviewed and categorized, ready for assignment",
        nextStates: ["assigned", "backlog", "duplicate", "wont_fix"],
        permissions: ["triage_team", "tech_lead"],
        autoActions: ["estimate_effort", "set_milestone"],
        color: "#FFE4B5"
      },

      assigned: {
        description: "Assigned to developer, work not started",
        nextStates: ["in_progress", "backlog", "blocked"],
        permissions: ["assignee", "tech_lead"],
        autoActions: ["notify_assignee", "add_to_sprint"],
        color: "#F0E68C"
      },

      in_progress: {
        description: "Developer actively working on fix",
        nextStates: ["ready_for_review", "blocked", "assigned"],
        permissions: ["assignee"],
        autoActions: ["update_progress", "log_work_time"],
        color: "#87CEEB"
      },

      blocked: {
        description: "Progress halted due to dependencies or issues",
        nextStates: ["in_progress", "assigned"],
        permissions: ["assignee", "tech_lead"],
        autoActions: ["notify_blocker", "escalate_if_long"],
        color: "#F08080"
      },

      ready_for_review: {
        description: "Fix complete, awaiting code review",
        nextStates: ["in_review", "in_progress", "ready_for_testing"],
        permissions: ["assignee", "reviewer"],
        autoActions: ["request_review", "run_automated_tests"],
        color: "#98FB98"
      },

      in_review: {
        description: "Code review in progress",
        nextStates: ["in_progress", "ready_for_testing", "ready_for_review"],
        permissions: ["reviewer"],
        autoActions: ["notify_review_status"],
        color: "#DDA0DD"
      },

      ready_for_testing: {
        description: "Code reviewed, ready for QA testing",
        nextStates: ["testing", "in_progress"],
        permissions: ["qa_team", "assignee"],
        autoActions: ["deploy_to_test", "notify_qa"],
        color: "#F0FFFF"
      },

      testing: {
        description: "QA team testing the fix",
        nextStates: ["verified", "reopened", "ready_for_testing"],
        permissions: ["qa_team"],
        autoActions: ["run_test_suite", "document_test_results"],
        color: "#FFB6C1"
      },

      verified: {
        description: "Fix tested and verified, ready for release",
        nextStates: ["closed", "reopened"],
        permissions: ["qa_team", "release_manager"],
        autoActions: ["prepare_release_notes", "tag_for_release"],
        color: "#90EE90"
      },

      closed: {
        description: "Bug fixed and released to users",
        nextStates: ["reopened"],
        permissions: ["release_manager"],
        autoActions: ["update_metrics", "notify_reporter"],
        color: "#D3D3D3"
      },

      reopened: {
        description: "Previously closed bug reported again",
        nextStates: ["triaged", "assigned"],
        permissions: ["anyone"],
        autoActions: ["escalate_priority", "notify_original_assignee"],
        color: "#FFE4E1"
      },

      duplicate: {
        description: "Duplicate of existing bug",
        nextStates: ["closed"],
        permissions: ["triage_team"],
        autoActions: ["link_to_original", "merge_comments"],
        color: "#C0C0C0"
      },

      invalid: {
        description: "Not a valid bug (user error, feature request, etc.)",
        nextStates: ["closed"],
        permissions: ["triage_team"],
        autoActions: ["provide_explanation", "suggest_alternatives"],
        color: "#C0C0C0"
      },

      wont_fix: {
        description: "Valid bug but won't be fixed (design decision, cost, etc.)",
        nextStates: ["closed"],
        permissions: ["tech_lead", "product_manager"],
        autoActions: ["document_decision", "suggest_workaround"],
        color: "#C0C0C0"
      }
    },

    transitions: [
      { from: "new", to: "triaged", trigger: "triage_complete", permissions: ["triage_team"] },
      { from: "triaged", to: "assigned", trigger: "assign_developer", permissions: ["tech_lead"] },
      { from: "assigned", to: "in_progress", trigger: "start_work", permissions: ["assignee"] },
      { from: "in_progress", to: "ready_for_review", trigger: "submit_fix", permissions: ["assignee"] },
      { from: "ready_for_review", to: "in_review", trigger: "start_review", permissions: ["reviewer"] },
      { from: "in_review", to: "ready_for_testing", trigger: "approve_review", permissions: ["reviewer"] },
      { from: "ready_for_testing", to: "testing", trigger: "start_testing", permissions: ["qa_team"] },
      { from: "testing", to: "verified", trigger: "pass_testing", permissions: ["qa_team"] },
      { from: "verified", to: "closed", trigger: "release", permissions: ["release_manager"] }
    ]
  },

  // Bug Reporting Templates
  reportingTemplates: {
    voice_issue: {
      title: "[Voice] Brief description of the issue",
      fields: {
        device: { type: "select", options: ["iPhone 15", "iPhone 14", "Samsung S23", "Pixel 7"] },
        os_version: { type: "text", placeholder: "e.g., iOS 17.0.1" },
        voice_command: { type: "text", placeholder: "Exact command spoken" },
        expected_response: { type: "textarea", placeholder: "What should have happened" },
        actual_response: { type: "textarea", placeholder: "What actually happened" },
        ambient_noise: { type: "select", options: ["Quiet", "Moderate", "Noisy"] },
        accent: { type: "select", options: ["American", "British", "Australian", "Other"] },
        reproducible: { type: "boolean" },
        steps_to_reproduce: { type: "textarea", required: true }
      }
    },

    calculation_error: {
      title: "[Calculation] Incorrect result",
      fields: {
        calculation_type: { type: "select", options: ["Distance", "Club Recommendation", "Wind Adjustment", "Elevation"] },
        input_values: { type: "textarea", placeholder: "All input parameters" },
        expected_result: { type: "text", placeholder: "Expected calculation result" },
        actual_result: { type: "text", placeholder: "Actual calculation result" },
        gps_coordinates: { type: "text", placeholder: "Lat/Long if GPS-related" },
        weather_conditions: { type: "textarea", placeholder: "Wind, temperature, etc." },
        course_information: { type: "text", placeholder: "Course name and hole number" }
      }
    },

    gps_accuracy: {
      title: "[GPS] Location accuracy issue",
      fields: {
        device_location: { type: "text", placeholder: "Actual GPS coordinates" },
        app_location: { type: "text", placeholder: "Location shown in app" },
        accuracy_error: { type: "text", placeholder: "Distance error in yards/meters" },
        environment: { type: "select", options: ["Open sky", "Tree cover", "Buildings", "Indoor"] },
        acquisition_time: { type: "text", placeholder: "Time to acquire GPS signal" },
        course_location: { type: "text", placeholder: "Golf course name and location" },
        weather_conditions: { type: "text", placeholder: "Clear, cloudy, rain, etc." }
      }
    },

    performance_issue: {
      title: "[Performance] App performance problem",
      fields: {
        issue_type: { type: "select", options: ["Slow launch", "Freezing", "Battery drain", "Memory usage", "Crash"] },
        device_specs: { type: "textarea", placeholder: "Device model, RAM, storage available" },
        app_version: { type: "text", required: true },
        frequency: { type: "select", options: ["Always", "Often", "Sometimes", "Rarely"] },
        performance_metrics: { type: "textarea", placeholder: "Launch time, memory usage, etc." },
        other_apps_running: { type: "textarea", placeholder: "Other apps open during issue" },
        device_storage: { type: "text", placeholder: "Available storage space" }
      }
    },

    ui_bug: {
      title: "[UI] User interface issue",
      fields: {
        screen_affected: { type: "text", placeholder: "Which screen/page" },
        ui_element: { type: "text", placeholder: "Button, text, image, etc." },
        device_orientation: { type: "select", options: ["Portrait", "Landscape", "Both"] },
        display_size: { type: "text", placeholder: "Screen resolution or device model" },
        accessibility_mode: { type: "boolean", label: "Using accessibility features?" },
        dark_mode: { type: "boolean", label: "Dark mode enabled?" },
        screenshot: { type: "file", accept: "image/*" },
        expected_appearance: { type: "textarea", placeholder: "How it should look" }
      }
    }
  },

  // Automated Bug Detection
  automatedDetection: {
    crashReporting: {
      enabled: true,
      providers: ["Crashlytics", "Sentry"],
      autoCreateBug: true,
      severity: "critical",
      grouping: {
        byStackTrace: true,
        byDeviceModel: false,
        byOSVersion: false
      }
    },

    performanceMonitoring: {
      enabled: true,
      thresholds: {
        app_launch_time: { warning: 3000, critical: 5000 }, // milliseconds
        voice_processing: { warning: 2000, critical: 5000 },
        calculation_time: { warning: 500, critical: 1000 },
        memory_usage: { warning: 150, critical: 200 }, // MB
        battery_drain: { warning: 5, critical: 10 } // % per hour
      },
      autoCreateBug: {
        critical: true,
        warning: false
      }
    },

    accuracyMonitoring: {
      enabled: true,
      calculations: {
        distance_variance: { threshold: 5 }, // yards
        club_recommendation_accuracy: { threshold: 0.8 }, // 80% minimum
        voice_recognition_accuracy: { threshold: 0.85 } // 85% minimum
      },
      reportingFrequency: "daily",
      autoCreateBug: true
    },

    userBehaviorAnalytics: {
      enabled: true,
      patterns: {
        repeated_voice_commands: "recognition_issue",
        frequent_app_restarts: "crash_or_freeze",
        quick_session_exits: "usability_problem"
      },
      thresholds: {
        pattern_frequency: 0.1, // 10% of users
        confidence_level: 0.8
      }
    }
  },

  // Bug Metrics and Analytics
  metrics: {
    kpis: {
      bug_discovery_rate: {
        description: "Bugs found per week",
        target: "< 10 new bugs per week",
        trend: "decreasing"
      },

      bug_fix_rate: {
        description: "Bugs fixed per week",
        target: "> bug discovery rate",
        trend: "stable_or_increasing"
      },

      critical_bug_resolution_time: {
        description: "Time to fix critical bugs",
        target: "< 24 hours",
        measurement: "average"
      },

      customer_reported_bugs: {
        description: "Bugs reported by users vs found internally",
        target: "< 30% customer reported",
        trend: "decreasing"
      },

      regression_rate: {
        description: "Fixed bugs that reoccur",
        target: "< 5%",
        trend: "decreasing"
      },

      test_coverage: {
        description: "Code coverage by automated tests",
        target: "> 85%",
        trend: "increasing"
      }
    },

    reports: {
      daily: {
        metrics: ["new_bugs", "resolved_bugs", "critical_bugs_open"],
        recipients: ["team_leads", "product_manager"],
        format: "slack_summary"
      },

      weekly: {
        metrics: ["bug_trends", "performance_metrics", "team_velocity"],
        recipients: ["engineering_team", "management"],
        format: "dashboard_report"
      },

      monthly: {
        metrics: ["quality_trends", "user_satisfaction", "release_quality"],
        recipients: ["executive_team", "stakeholders"],
        format: "executive_summary"
      },

      release: {
        metrics: ["bugs_fixed", "known_issues", "quality_score"],
        recipients: ["all_teams", "support_team"],
        format: "release_notes"
      }
    }
  },

  // Integration Configuration
  integrations: {
    jira: {
      enabled: true,
      url: "https://caddyai.atlassian.net",
      project_key: "CAI",
      issue_types: {
        bug: "Bug",
        story: "Story",
        task: "Task",
        epic: "Epic"
      },
      custom_fields: {
        device_model: "customfield_10001",
        os_version: "customfield_10002",
        app_version: "customfield_10003",
        severity_level: "customfield_10004"
      },
      workflows: {
        bug_workflow: "Bug Workflow",
        release_workflow: "Release Workflow"
      }
    },

    slack: {
      enabled: true,
      channels: {
        critical_bugs: "#critical-bugs",
        bug_reports: "#bug-reports",
        qa_updates: "#qa-updates",
        releases: "#releases"
      },
      notifications: {
        new_critical_bug: true,
        bug_assigned: true,
        bug_resolved: true,
        sla_breach: true
      }
    },

    github: {
      enabled: true,
      repository: "caddyai/mobile-app",
      integration_type: "bidirectional",
      issue_sync: true,
      pr_linking: true,
      automated_labels: true
    },

    crashlytics: {
      enabled: true,
      auto_bug_creation: true,
      crash_grouping: "smart",
      severity_mapping: {
        crash: "critical",
        exception: "high",
        warning: "medium"
      }
    },

    testRail: {
      enabled: true,
      project_id: 1,
      test_run_sync: true,
      bug_to_test_linking: true,
      result_reporting: "automated"
    }
  },

  // Team Configuration
  teams: {
    triage_team: {
      members: ["qa_lead", "tech_lead", "product_manager"],
      responsibilities: ["bug_classification", "priority_assignment", "initial_routing"],
      availability: "business_hours",
      escalation_contact: "engineering_manager"
    },

    voice_team: {
      members: ["voice_engineer_1", "voice_engineer_2", "ml_specialist"],
      expertise: ["speech_recognition", "nlp", "audio_processing"],
      categories: ["voice_processing"],
      on_call: "voice_engineer_1"
    },

    algorithm_team: {
      members: ["senior_dev_1", "golf_expert", "data_scientist"],
      expertise: ["golf_calculations", "algorithms", "mathematics"],
      categories: ["calculations"],
      on_call: "senior_dev_1"
    },

    platform_team: {
      members: ["mobile_dev_1", "mobile_dev_2", "devops_engineer"],
      expertise: ["ios", "android", "gps", "device_integration"],
      categories: ["gps_location", "device_compatibility"],
      on_call: "mobile_dev_1"
    },

    frontend_team: {
      members: ["ui_dev_1", "ui_dev_2", "ux_designer"],
      expertise: ["react_native", "ui_design", "accessibility"],
      categories: ["user_interface"],
      on_call: "ui_dev_1"
    },

    qa_team: {
      members: ["qa_engineer_1", "qa_engineer_2", "automation_engineer"],
      responsibilities: ["testing", "verification", "test_automation"],
      coverage: "24_7",
      escalation_contact: "qa_manager"
    }
  },

  // SLA and Escalation Rules
  sla: {
    response_times: {
      critical: "1 hour",
      high: "4 hours",
      medium: "1 day",
      low: "3 days"
    },

    resolution_times: {
      critical: "24 hours",
      high: "3 days",
      medium: "1 week",
      low: "1 month"
    },

    escalation_rules: [
      {
        condition: "critical_bug_no_response_2_hours",
        action: "escalate_to_engineering_manager",
        notification: ["slack", "email", "phone"]
      },
      {
        condition: "high_bug_no_progress_1_day",
        action: "escalate_to_tech_lead",
        notification: ["slack", "email"]
      },
      {
        condition: "bug_reopened_3_times",
        action: "escalate_to_senior_engineer",
        notification: ["slack"]
      },
      {
        condition: "critical_bug_missed_sla",
        action: "escalate_to_cto",
        notification: ["phone", "email"]
      }
    ],

    business_impact: {
      app_unusable: "critical",
      feature_broken: "high",
      degraded_performance: "medium",
      cosmetic_issue: "low"
    }
  }
};

module.exports = { bugTrackingSystem };