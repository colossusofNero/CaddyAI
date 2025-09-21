/**
 * Unit Tests for CaddyAI Excel Formula Converter
 * Tests all converted Excel formulas for accuracy and edge cases
 */

const CaddyAICalculator = require('./CaddyAIFormulas');

describe('CaddyAICalculator', () => {
  let calculator;

  beforeEach(() => {
    calculator = new CaddyAICalculator();
  });

  describe('Basic Excel Function Equivalents', () => {
    test('MAX function should return maximum value', () => {
      expect(calculator.MAX([1, 5, 3, 9, 2])).toBe(9);
      expect(calculator.MAX([0, -5, -10])).toBe(0);
      expect(calculator.MAX([100])).toBe(100);
    });

    test('MAX function should handle invalid inputs', () => {
      expect(() => calculator.MAX([])).toThrow('MAX: Input must be a non-empty array');
      expect(() => calculator.MAX(['a', 'b', 'c'])).toThrow('MAX: No numeric values found');
      expect(() => calculator.MAX(null)).toThrow('MAX: Input must be a non-empty array');
    });

    test('INDEX function should return correct value', () => {
      const arr = ['A', 'B', 'C', 'D'];
      expect(calculator.INDEX(arr, 1)).toBe('A');
      expect(calculator.INDEX(arr, 4)).toBe('D');
    });

    test('INDEX function should handle invalid inputs', () => {
      const arr = ['A', 'B', 'C'];
      expect(() => calculator.INDEX(arr, 0)).toThrow();
      expect(() => calculator.INDEX(arr, 5)).toThrow();
      expect(() => calculator.INDEX(null, 1)).toThrow();
    });

    test('MATCH function should find correct index', () => {
      const arr = [10, 20, 30, 40];
      expect(calculator.MATCH(30, arr, 0)).toBe(3);
      expect(calculator.MATCH(10, arr, 0)).toBe(1);
    });

    test('MATCH function should handle not found', () => {
      const arr = [10, 20, 30];
      expect(() => calculator.MATCH(50, arr, 0)).toThrow();
    });

    test('XLOOKUP function should return correct value', () => {
      const lookupArray = ['A', 'B', 'C'];
      const returnArray = [10, 20, 30];
      expect(calculator.XLOOKUP('B', lookupArray, returnArray)).toBe(20);
      expect(calculator.XLOOKUP('D', lookupArray, returnArray, 'NotFound')).toBe('NotFound');
    });

    test('ROUND function should round correctly', () => {
      expect(calculator.ROUND(3.14159, 2)).toBe(3.14);
      expect(calculator.ROUND(3.14159, 0)).toBe(3);
      expect(calculator.ROUND(123.456, -1)).toBe(120);
    });

    test('EXP function should calculate exponential', () => {
      expect(calculator.EXP(0)).toBe(1);
      expect(calculator.EXP(1)).toBeCloseTo(2.718, 3);
      expect(calculator.EXP(2)).toBeCloseTo(7.389, 3);
    });
  });

  describe('Scoring Calculation Functions (AG49:AG77)', () => {
    test('calculateScoringValues should handle basic calculation', () => {
      const clubNames = ['Driver', '3-Wood', '5-Iron', ''];
      const hazardFlags = [false, false, false, false];
      const distances = [280, 230, 150, 120];
      const penalties = [0, 0.5, 1.0, 0];

      const results = calculator.calculateScoringValues(clubNames, hazardFlags, distances, penalties);

      expect(results).toHaveLength(4);
      expect(results[3]).toBe(''); // Empty club name
      expect(results[0]).toBeGreaterThan(0); // Should be positive for Driver
      expect(results[1]).toBeGreaterThan(0); // Should be positive for 3-Wood
    });

    test('calculateScoringValues should handle hazard flags', () => {
      const clubNames = ['Driver', '3-Wood'];
      const hazardFlags = [true, false];
      const distances = [280, 230];
      const penalties = [0, 0];

      const results = calculator.calculateScoringValues(clubNames, hazardFlags, distances, penalties);

      expect(results[0]).toBe(-1000000000); // Large negative for hazard
      expect(results[1]).toBeGreaterThan(0); // Positive for safe club
    });

    test('calculateScoringValues should validate input arrays', () => {
      expect(() => {
        calculator.calculateScoringValues(['Driver'], [false], [280], []); // Different lengths
      }).toThrow();

      expect(() => {
        calculator.calculateScoringValues([], [], [], []); // Empty arrays
      }).toThrow();
    });

    test('sigmoid calculation should match Excel formula', () => {
      // Test specific values that should match Excel
      const clubNames = ['Test'];
      const hazardFlags = [false];
      const distances = [120]; // Distance = 120 should give max sigmoid value
      const penalties = [0];

      const results = calculator.calculateScoringValues(clubNames, hazardFlags, distances, penalties);

      // At distance 120, sigmoid should be 10/(1+exp(0)) = 5
      expect(results[0]).toBeCloseTo(5, 2);
    });
  });

  describe('Optimal Club Selection (B80-D83)', () => {
    test('findMaxScore should return maximum score', () => {
      const scores = [3.5, 7.2, 2.1, 8.9, 4.3];
      expect(calculator.findMaxScore(scores)).toBe(8.9);
    });

    test('findSecondMaxScore should return second highest', () => {
      const scores = [3.5, 7.2, 2.1, 8.9, 4.3];
      expect(calculator.findSecondMaxScore(scores)).toBe(7.2);
    });

    test('getOptimalClubDetails should return correct club', () => {
      const clubNames = ['Driver', '3-Wood', '5-Iron'];
      const distanceLabels = ['280y', '230y', '150y'];
      const clubTypes = ['Driver', 'Wood', 'Iron'];
      const scores = [5.0, 8.5, 3.2]; // 3-Wood has highest score

      const result = calculator.getOptimalClubDetails(clubNames, distanceLabels, clubTypes, scores);

      expect(result.club).toBe('3-Wood');
      expect(result.distance).toBe('230y');
      expect(result.type).toBe('Wood');
    });

    test('getSecondBestClubDetails should return second best club', () => {
      const clubNames = ['Driver', '3-Wood', '5-Iron'];
      const distanceLabels = ['280y', '230y', '150y'];
      const clubTypes = ['Driver', 'Wood', 'Iron'];
      const scores = [5.0, 8.5, 3.2]; // Driver should be second best

      const result = calculator.getSecondBestClubDetails(clubNames, distanceLabels, clubTypes, scores);

      expect(result.club).toBe('Driver');
      expect(result.distance).toBe('280y');
      expect(result.type).toBe('Driver');
    });
  });

  describe('Wind Offset Calculations (B88, C88)', () => {
    test('calculateWindOffset should handle crosswind from right to left', () => {
      const params = {
        clubCarry: 200,
        windSpeed: 10,
        windDirection: 'Cross_R_to_L',
        baseShape: 5,
        handedness: 'Right',
        naturalShape: 'Draw',
        shapeMult: 1.2,
        heightMult: 1.1
      };

      const result = calculator.calculateWindOffset(params);

      // Should be negative (aim left to compensate for right-to-left wind)
      expect(result).toBeLessThan(0);
      expect(typeof result).toBe('number');
    });

    test('calculateWindOffset should handle headwind/tailwind', () => {
      const params = {
        clubCarry: 200,
        windSpeed: 10,
        windDirection: 'Head',
        baseShape: 5,
        handedness: 'Right',
        naturalShape: 'Draw',
        shapeMult: 1.2,
        heightMult: 1.1
      };

      const result = calculator.calculateWindOffset(params);

      // Wind drift should be 0 for head/tail wind, only natural curve applies
      expect(result).toBeCloseTo(-6, 1); // -(5 * 1.2 * -1) for right-handed draw
    });

    test('calculateWindOffset should validate required parameters', () => {
      expect(() => {
        calculator.calculateWindOffset({
          clubCarry: 200,
          // Missing other required parameters
        });
      }).toThrow();
    });

    test('calculateWindOffset should handle left-handed golfer', () => {
      const params = {
        clubCarry: 200,
        windSpeed: 0,
        windDirection: 'Head',
        baseShape: 5,
        handedness: 'Left',
        naturalShape: 'Draw',
        shapeMult: 1.0,
        heightMult: 1.0
      };

      const result = calculator.calculateWindOffset(params);

      // Left-handed draw should be opposite of right-handed
      expect(result).toBeCloseTo(5, 1); // -(5 * 1.0 * 1) for left-handed draw
    });
  });

  describe('Hazard Bias Calculations (B93)', () => {
    test('calculateHazardBias should detect water hazards', () => {
      const params = {
        targetCarry: 150,
        hazards: [
          { type: 'water', side: 'left', startYard: 140, endYard: 160 },
          { type: 'bunker', side: 'right', startYard: 140, endYard: 160 }
        ]
      };

      const result = calculator.calculateHazardBias(params);

      // Should bias right (positive) to avoid left water and right bunker
      // Water bias (10) for left water, bunker bias (5) for right bunker
      expect(result).toBe(5); // 10 * 1 - 5 * 1 = 5
    });

    test('calculateHazardBias should handle no hazards in range', () => {
      const params = {
        targetCarry: 200,
        hazards: [
          { type: 'water', side: 'left', startYard: 140, endYard: 160 }
        ]
      };

      const result = calculator.calculateHazardBias(params);
      expect(result).toBe(0);
    });

    test('calculateHazardBias should handle symmetric hazards', () => {
      const params = {
        targetCarry: 150,
        hazards: [
          { type: 'water', side: 'left', startYard: 140, endYard: 160 },
          { type: 'water', side: 'right', startYard: 140, endYard: 160 }
        ]
      };

      const result = calculator.calculateHazardBias(params);
      expect(result).toBe(0); // Should cancel out
    });
  });

  describe('Stance Offset Calculations (B99, C99, E99)', () => {
    test('calculateStanceOffset should handle above pin', () => {
      const params = {
        pinDistance: 20,
        pinPosition: 'ABOVE',
        stancePercent: 5,
        handedness: 'Right'
      };

      const result = calculator.calculateStanceOffset(params);
      expect(result).toBe(1); // 5% of 20 = 1
    });

    test('calculateStanceOffset should handle below pin', () => {
      const params = {
        pinDistance: 20,
        pinPosition: 'BELOW',
        stancePercent: 5,
        handedness: 'Right'
      };

      const result = calculator.calculateStanceOffset(params);
      expect(result).toBe(-1); // Negative for below
    });

    test('calculateStanceOffset should handle left-handed golfer', () => {
      const params = {
        pinDistance: 20,
        pinPosition: 'ABOVE',
        stancePercent: 5,
        handedness: 'Left'
      };

      const result = calculator.calculateStanceOffset(params);
      expect(result).toBe(-1); // Left-handed gets opposite sign
    });

    test('calculateStanceOffset should use default percentage', () => {
      const params = {
        pinDistance: 30,
        pinPosition: 'ABOVE',
        handedness: 'Right'
        // No stancePercent provided
      };

      const result = calculator.calculateStanceOffset(params);
      expect(result).toBe(0.9); // 3% (default) of 30 = 0.9
    });

    test('calculateStanceOffset should return 0 for empty inputs', () => {
      const params = {
        pinDistance: '',
        pinPosition: 'ABOVE',
        stancePercent: 5,
        handedness: 'Right'
      };

      const result = calculator.calculateStanceOffset(params);
      expect(result).toBe(0);
    });
  });

  describe('Total Aim Offset Calculation (B94, C94)', () => {
    test('calculateTotalAimOffset should sum all offsets', () => {
      const result = calculator.calculateTotalAimOffset(5.5, -2.0, 1.5);
      expect(result).toBe(5.0);
    });

    test('calculateTotalAimOffset should handle empty inputs', () => {
      const result = calculator.calculateTotalAimOffset('', '', 1.5);
      expect(result).toBe('');
    });

    test('calculateTotalAimOffset should handle null values', () => {
      const result = calculator.calculateTotalAimOffset(null, undefined, 2.0);
      expect(result).toBe('');
    });

    test('calculateTotalAimOffset should convert strings to numbers', () => {
      const result = calculator.calculateTotalAimOffset('5.5', '-2', '1.5');
      expect(result).toBe(5.0);
    });
  });

  describe('Aim Directive Generation (B95, C95)', () => {
    test('generateAimDirective should create left directive', () => {
      const result = calculator.generateAimDirective(-5.7);
      expect(result).toBe('Aim LEFT 6 yds');
    });

    test('generateAimDirective should create right directive', () => {
      const result = calculator.generateAimDirective(3.2);
      expect(result).toBe('Aim RIGHT 3 yds');
    });

    test('generateAimDirective should create center directive', () => {
      const result = calculator.generateAimDirective(0);
      expect(result).toBe('Aim CENTER');
    });

    test('generateAimDirective should handle empty input', () => {
      const result = calculator.generateAimDirective('');
      expect(result).toBe('');

      const result2 = calculator.generateAimDirective(null);
      expect(result2).toBe('');
    });

    test('generateAimDirective should round distances', () => {
      const result = calculator.generateAimDirective(2.6);
      expect(result).toBe('Aim RIGHT 3 yds');

      const result2 = calculator.generateAimDirective(-1.4);
      expect(result2).toBe('Aim LEFT 1 yds');
    });
  });

  describe('Complete Calculation Workflow', () => {
    test('calculateComplete should process full workflow', () => {
      const inputData = {
        // Club data arrays (A49:AC77)
        clubNames: ['Driver', '3-Wood', '5-Iron'],
        hazardFlags: [false, false, false],
        distances: [280, 230, 150],
        penalties: [0, 0.5, 1.0],
        distanceLabels: ['280y', '230y', '150y'],
        clubTypes: ['Driver', 'Wood', 'Iron'],

        // Wind and player data
        windSpeed: 10,
        windDirection: 'Cross_R_to_L',
        baseShape: 5,
        handedness: 'Right',
        naturalShape: 'Draw',

        // Optimal club parameters
        optimalCarry: 230,
        optimalShapeMult: 1.2,
        optimalHeightMult: 1.1,
        optimalPinDistance: 20,
        optimalStancePercent: 3,

        // Second club parameters
        secondCarry: 280,
        secondShapeMult: 1.5,
        secondHeightMult: 1.3,
        secondPinDistance: 25,
        secondStancePercent: 3,

        // Course data
        targetCarry: 200,
        hazards: [
          { type: 'water', side: 'left', startYard: 190, endYard: 210 }
        ],
        pinPosition: 'ABOVE'
      };

      const results = calculator.calculateComplete(inputData);

      // Check that all expected results are present
      expect(results).toHaveProperty('scoringValues');
      expect(results).toHaveProperty('maxScore');
      expect(results).toHaveProperty('secondMaxScore');
      expect(results).toHaveProperty('optimalClub');
      expect(results).toHaveProperty('secondBestClub');
      expect(results).toHaveProperty('optimalWindOffset');
      expect(results).toHaveProperty('secondWindOffset');
      expect(results).toHaveProperty('hazardBias');
      expect(results).toHaveProperty('optimalTotalOffset');
      expect(results).toHaveProperty('secondTotalOffset');
      expect(results).toHaveProperty('optimalAimDirective');
      expect(results).toHaveProperty('secondAimDirective');

      // Check that results are reasonable
      expect(Array.isArray(results.scoringValues)).toBe(true);
      expect(typeof results.maxScore).toBe('number');
      expect(typeof results.optimalClub.club).toBe('string');
      expect(typeof results.optimalAimDirective).toBe('string');
    });

    test('calculateComplete should handle errors gracefully', () => {
      const invalidData = {
        clubNames: ['Driver'],
        hazardFlags: [false, false], // Mismatched array length
        distances: [280],
        penalties: [0]
      };

      expect(() => calculator.calculateComplete(invalidData)).toThrow();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle arrays with mixed data types', () => {
      const scores = [3.5, '', 'invalid', 8.9, null, undefined, 4.3];
      expect(calculator.findMaxScore(scores)).toBe(8.9);
    });

    test('should handle very large and very small numbers', () => {
      const scores = [1e-10, 1e10, -1e10];
      expect(calculator.findMaxScore(scores)).toBe(1e10);
    });

    test('should maintain precision in calculations', () => {
      const result = calculator.calculateWindOffset({
        clubCarry: 200.5,
        windSpeed: 12.3,
        windDirection: 'Cross_L_to_R',
        baseShape: 4.7,
        handedness: 'Right',
        naturalShape: 'Fade',
        shapeMult: 1.15,
        heightMult: 1.05
      });

      expect(typeof result).toBe('number');
      expect(isFinite(result)).toBe(true);
    });
  });
});

// Helper functions for test setup
function createTestData(size = 5) {
  return {
    clubNames: Array(size).fill().map((_, i) => `Club${i}`),
    hazardFlags: Array(size).fill(false),
    distances: Array(size).fill().map((_, i) => 150 + i * 20),
    penalties: Array(size).fill(0)
  };
}

function createWindParams(overrides = {}) {
  return {
    clubCarry: 200,
    windSpeed: 10,
    windDirection: 'Cross_R_to_L',
    baseShape: 5,
    handedness: 'Right',
    naturalShape: 'Draw',
    shapeMult: 1.0,
    heightMult: 1.0,
    ...overrides
  };
}