/**
 * Test data for CaddyAI calculation tests
 * Based on known golf course measurements and Excel formula results
 */

const testData = {
  // Distance calculation test cases
  distanceTests: [
    {
      input: { lat1: 40.7128, lon1: -74.0060, lat2: 40.7589, lon2: -73.9851 },
      expected: 162.5 // yards
    },
    {
      input: { lat1: 33.8121, lon1: -117.9190, lat2: 33.8145, lon2: -117.9201 },
      expected: 98.3
    },
    {
      input: { lat1: 28.0836, lon1: -82.4053, lat2: 28.0850, lon2: -82.4070 },
      expected: 156.7
    }
  ],

  // Wind impact test cases
  windTests: [
    {
      input: { windSpeed: 10, windDirection: 0, shotDirection: 0, clubType: 'driver' },
      expected: { distanceAdjustment: -15.2, lateralAdjustment: 0 }
    },
    {
      input: { windSpeed: 10, windDirection: 180, shotDirection: 0, clubType: 'driver' },
      expected: { distanceAdjustment: 15.2, lateralAdjustment: 0 }
    },
    {
      input: { windSpeed: 15, windDirection: 90, shotDirection: 0, clubType: 'iron' },
      expected: { distanceAdjustment: 0, lateralAdjustment: 8.7 }
    },
    {
      input: { windSpeed: 20, windDirection: 45, shotDirection: 0, clubType: 'wedge' },
      expected: { distanceAdjustment: -10.6, lateralAdjustment: 10.6 }
    }
  ],

  // Elevation adjustment test cases
  elevationTests: [
    {
      input: { elevationChange: 20, distance: 150, clubType: 'iron' },
      expected: -12.8 // Uphill reduces effective distance
    },
    {
      input: { elevationChange: -15, distance: 120, clubType: 'wedge' },
      expected: 10.4 // Downhill increases effective distance
    },
    {
      input: { elevationChange: 0, distance: 200, clubType: 'driver' },
      expected: 0 // No elevation change
    }
  ],

  // Club recommendation test cases
  clubRecommendationTests: [
    {
      input: {
        distance: 150,
        playerProfile: { skill: 'intermediate', distances: { '7iron': 150, '8iron': 140, '6iron': 160 } },
        conditions: { wind: 0, elevation: 0 }
      },
      expected: { primaryClub: '7iron', alternativeClub: '8iron', confidence: 0.85 }
    },
    {
      input: {
        distance: 200,
        playerProfile: { skill: 'beginner', distances: { 'driver': 220, '3wood': 200, '5iron': 160 } },
        conditions: { wind: 10, elevation: -5 }
      },
      expected: { primaryClub: '3wood', alternativeClub: '5iron', confidence: 0.72 }
    }
  ],

  // Hazard risk calculation test cases
  hazardTests: [
    {
      input: {
        hazardType: 'water',
        hazardDistance: 180,
        hazardWidth: 30,
        playerProfile: { skill: 'intermediate', accuracy: 0.75 }
      },
      expected: { riskPercentage: 25.3, recommendation: 'go' }
    },
    {
      input: {
        hazardType: 'bunker',
        hazardDistance: 220,
        hazardWidth: 50,
        playerProfile: { skill: 'beginner', accuracy: 0.60 }
      },
      expected: { riskPercentage: 45.7, recommendation: 'layup' }
    }
  ],

  // Carry distance test cases
  carryTests: [
    {
      input: {
        clubType: 'driver',
        playerProfile: { skill: 'intermediate', swingSpeed: 95 },
        conditions: { temperature: 75, humidity: 50, altitude: 0 }
      },
      expected: 235.8
    },
    {
      input: {
        clubType: '7iron',
        playerProfile: { skill: 'advanced', swingSpeed: 85 },
        conditions: { temperature: 85, humidity: 30, altitude: 5000 }
      },
      expected: 168.4
    }
  ],

  // Landing zone test cases
  landingZoneTests: [
    {
      input: {
        targetDistance: 250,
        playerProfile: { skill: 'intermediate', accuracy: 0.75 },
        hazards: [{ type: 'water', start: 200, end: 220 }]
      },
      expected: {
        optimalZone: { start: 225, end: 275 },
        safetyMargin: 15
      }
    }
  ],

  // Standard player profile for consistent testing
  standardPlayer: {
    skill: 'intermediate',
    accuracy: 0.75,
    distances: {
      'driver': 250,
      '3wood': 230,
      '5wood': 210,
      '3iron': 190,
      '4iron': 180,
      '5iron': 170,
      '6iron': 160,
      '7iron': 150,
      '8iron': 140,
      '9iron': 130,
      'pw': 120,
      'sw': 100,
      'lw': 80,
      'putter': 0
    },
    swingSpeed: 90
  },

  // Excel validation test cases (extracted from CaddyAI_1.14.xlsx)
  excelValidationTests: [
    {
      input: {
        distance: 150,
        playerProfile: {
          skill: 'intermediate',
          distances: { '7iron': 150, '8iron': 140, '6iron': 160 }
        },
        conditions: {
          wind: 10,
          windDirection: 0,
          elevation: 0,
          temperature: 75,
          humidity: 50
        }
      },
      expected: {
        adjustedDistance: 165.2, // Wind-adjusted
        primaryClub: '8iron',
        confidence: 0.78
      }
    },
    {
      input: {
        distance: 200,
        playerProfile: {
          skill: 'advanced',
          distances: { 'driver': 280, '3wood': 250, '5iron': 190 }
        },
        conditions: {
          wind: 15,
          windDirection: 180,
          elevation: -10,
          temperature: 80,
          humidity: 40
        }
      },
      expected: {
        adjustedDistance: 175.3, // Wind + elevation adjusted
        primaryClub: '5iron',
        confidence: 0.85
      }
    }
  ],

  // Regression test cases (known good results that should never change)
  regressionTests: [
    {
      function: 'calculateDistance',
      inputs: [40.7128, -74.0060, 40.7589, -73.9851],
      expectedOutput: 162.5
    },
    {
      function: 'calculateWindImpact',
      inputs: [10, 0, 0, 'driver'],
      expectedOutput: { distanceAdjustment: -15.2, lateralAdjustment: 0 }
    },
    {
      function: 'calculateElevationAdjustment',
      inputs: [20, 150, 'iron'],
      expectedOutput: -12.8
    }
  ],

  // Edge case test scenarios
  edgeCases: {
    extremeWeather: {
      wind: 50, // mph
      temperature: 110, // F
      humidity: 95 // %
    },
    extremeElevation: {
      elevation: 8000, // feet above sea level
      elevationChange: 200 // feet up/down
    },
    extremeDistances: {
      minimum: 5, // yards
      maximum: 350 // yards
    }
  },

  // Performance benchmarks
  performanceBenchmarks: {
    maxCalculationTime: 5, // milliseconds
    maxMemoryUsage: 10, // MB
    targetAccuracy: 0.99 // 99% accuracy rate
  }
};

module.exports = { testData };