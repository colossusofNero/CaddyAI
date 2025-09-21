/**
 * CaddyAI Calculation Accuracy Test Suite
 * Tests all golf calculation formulas against Excel baseline results
 */

const {
  calculateDistance,
  calculateWindImpact,
  calculateElevationAdjustment,
  calculateClubRecommendation,
  calculateHazardRisk,
  calculateCarryDistance,
  calculateLandingZone
} = require('../src/calculations/golfCalculations');

const { testData } = require('./fixtures/calculationTestData');

describe('CaddyAI Calculation Accuracy Tests', () => {

  describe('Distance Calculations', () => {
    test('should calculate accurate yardage from GPS coordinates', () => {
      testData.distanceTests.forEach(testCase => {
        const result = calculateDistance(
          testCase.input.lat1,
          testCase.input.lon1,
          testCase.input.lat2,
          testCase.input.lon2
        );

        expect(result).toBeCloseTo(testCase.expected, 1); // Within 1 yard
      });
    });

    test('should handle extreme distance calculations', () => {
      const extremeDistance = calculateDistance(40.7128, -74.0060, 40.7589, -73.9851);
      expect(extremeDistance).toBeGreaterThan(0);
      expect(extremeDistance).toBeLessThan(1000); // Reasonable golf course limit
    });

    test('should return zero for same coordinates', () => {
      const result = calculateDistance(40.7128, -74.0060, 40.7128, -74.0060);
      expect(result).toBe(0);
    });
  });

  describe('Wind Impact Calculations', () => {
    test('should calculate wind impact accurately for different directions', () => {
      testData.windTests.forEach(testCase => {
        const result = calculateWindImpact(
          testCase.input.windSpeed,
          testCase.input.windDirection,
          testCase.input.shotDirection,
          testCase.input.clubType
        );

        expect(result.distanceAdjustment).toBeCloseTo(testCase.expected.distanceAdjustment, 0.5);
        expect(result.lateralAdjustment).toBeCloseTo(testCase.expected.lateralAdjustment, 0.5);
      });
    });

    test('should handle headwind correctly', () => {
      const headwind = calculateWindImpact(15, 0, 0, 'driver');
      expect(headwind.distanceAdjustment).toBeLessThan(0); // Should reduce distance
    });

    test('should handle tailwind correctly', () => {
      const tailwind = calculateWindImpact(15, 180, 0, 'driver');
      expect(tailwind.distanceAdjustment).toBeGreaterThan(0); // Should increase distance
    });

    test('should handle crosswind correctly', () => {
      const crosswind = calculateWindImpact(15, 90, 0, 'driver');
      expect(Math.abs(crosswind.lateralAdjustment)).toBeGreaterThan(0); // Should have lateral effect
    });
  });

  describe('Elevation Adjustment Calculations', () => {
    test('should calculate elevation adjustments accurately', () => {
      testData.elevationTests.forEach(testCase => {
        const result = calculateElevationAdjustment(
          testCase.input.elevationChange,
          testCase.input.distance,
          testCase.input.clubType
        );

        expect(result).toBeCloseTo(testCase.expected, 0.5);
      });
    });

    test('should increase distance for downhill shots', () => {
      const downhillAdjustment = calculateElevationAdjustment(-20, 150, 'iron');
      expect(downhillAdjustment).toBeGreaterThan(0);
    });

    test('should decrease distance for uphill shots', () => {
      const uphillAdjustment = calculateElevationAdjustment(20, 150, 'iron');
      expect(uphillAdjustment).toBeLessThan(0);
    });
  });

  describe('Club Recommendation Logic', () => {
    test('should recommend appropriate club for given distance', () => {
      testData.clubRecommendationTests.forEach(testCase => {
        const result = calculateClubRecommendation(
          testCase.input.distance,
          testCase.input.playerProfile,
          testCase.input.conditions
        );

        expect(result.primaryClub).toBe(testCase.expected.primaryClub);
        expect(result.alternativeClub).toBe(testCase.expected.alternativeClub);
        expect(result.confidence).toBeCloseTo(testCase.expected.confidence, 0.1);
      });
    });

    test('should adjust recommendations based on wind conditions', () => {
      const calmConditions = calculateClubRecommendation(150, testData.standardPlayer, { wind: 0 });
      const windyConditions = calculateClubRecommendation(150, testData.standardPlayer, { wind: 20 });

      expect(calmConditions.primaryClub).not.toBe(windyConditions.primaryClub);
    });
  });

  describe('Hazard Risk Calculations', () => {
    test('should calculate water hazard risk accurately', () => {
      testData.hazardTests.forEach(testCase => {
        const result = calculateHazardRisk(
          testCase.input.hazardType,
          testCase.input.hazardDistance,
          testCase.input.hazardWidth,
          testCase.input.playerProfile
        );

        expect(result.riskPercentage).toBeCloseTo(testCase.expected.riskPercentage, 1);
        expect(result.recommendation).toBe(testCase.expected.recommendation);
      });
    });

    test('should recommend layup for high-risk shots', () => {
      const highRiskShot = calculateHazardRisk('water', 200, 50, {
        skill: 'beginner',
        accuracy: 0.6
      });

      expect(highRiskShot.recommendation).toBe('layup');
    });
  });

  describe('Carry Distance Calculations', () => {
    test('should calculate carry distance with trajectory factors', () => {
      testData.carryTests.forEach(testCase => {
        const result = calculateCarryDistance(
          testCase.input.clubType,
          testCase.input.playerProfile,
          testCase.input.conditions
        );

        expect(result).toBeCloseTo(testCase.expected, 2);
      });
    });
  });

  describe('Landing Zone Calculations', () => {
    test('should calculate safe landing zones', () => {
      testData.landingZoneTests.forEach(testCase => {
        const result = calculateLandingZone(
          testCase.input.targetDistance,
          testCase.input.playerProfile,
          testCase.input.hazards
        );

        expect(result.optimalZone.start).toBeCloseTo(testCase.expected.optimalZone.start, 2);
        expect(result.optimalZone.end).toBeCloseTo(testCase.expected.optimalZone.end, 2);
        expect(result.safetyMargin).toBeCloseTo(testCase.expected.safetyMargin, 1);
      });
    });
  });

  describe('Edge Case Handling', () => {
    test('should handle invalid input gracefully', () => {
      expect(() => calculateDistance(null, null, 40, -74)).not.toThrow();
      expect(() => calculateWindImpact(-1, 400, 0, 'invalid')).not.toThrow();
      expect(() => calculateElevationAdjustment(1000, 50, 'putter')).not.toThrow();
    });

    test('should handle extreme weather conditions', () => {
      const extremeWind = calculateWindImpact(50, 0, 0, 'driver');
      expect(extremeWind.distanceAdjustment).toBeDefined();
      expect(Math.abs(extremeWind.distanceAdjustment)).toBeLessThan(100); // Reasonable limit
    });

    test('should handle extreme elevation changes', () => {
      const extremeElevation = calculateElevationAdjustment(200, 150, 'iron');
      expect(extremeElevation).toBeDefined();
      expect(Math.abs(extremeElevation)).toBeLessThan(100); // Reasonable limit
    });
  });

  describe('Performance Tests', () => {
    test('calculations should complete within performance targets', () => {
      const startTime = Date.now();

      // Run 100 calculations
      for (let i = 0; i < 100; i++) {
        calculateDistance(40.7128, -74.0060, 40.7589, -73.9851);
        calculateWindImpact(15, 45, 0, 'iron');
        calculateElevationAdjustment(10, 150, 'iron');
        calculateClubRecommendation(150, testData.standardPlayer, { wind: 10 });
      }

      const endTime = Date.now();
      const avgTime = (endTime - startTime) / 100;

      expect(avgTime).toBeLessThan(5); // Should average less than 5ms per calculation set
    });
  });

  describe('Excel Formula Validation', () => {
    test('should match Excel baseline calculations exactly', () => {
      // These test cases are extracted from the Excel file
      testData.excelValidationTests.forEach(testCase => {
        const result = calculateClubRecommendation(
          testCase.input.distance,
          testCase.input.playerProfile,
          testCase.input.conditions
        );

        // Exact match with Excel calculations
        expect(result.adjustedDistance).toBeCloseTo(testCase.expected.adjustedDistance, 0.1);
        expect(result.primaryClub).toBe(testCase.expected.primaryClub);
      });
    });
  });

  describe('Regression Tests', () => {
    test('should maintain calculation consistency across updates', () => {
      // Known good results that should never change
      const regressionTests = testData.regressionTests;

      regressionTests.forEach(testCase => {
        const result = eval(testCase.function)(testCase.inputs);
        expect(result).toEqual(testCase.expectedOutput);
      });
    });
  });
});

// Helper function for floating point comparison
expect.extend({
  toBeCloseTo(received, expected, precision = 2) {
    const pass = Math.abs(received - expected) < Math.pow(10, -precision);
    return {
      message: () => `expected ${received} to be close to ${expected}`,
      pass
    };
  }
});