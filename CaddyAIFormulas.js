/**
 * CaddyAI Excel Formula Converter
 * Converts Excel formulas from CaddyAI_1.14.xlsx to JavaScript functions
 * Maintains exact calculation logic and handles all Excel functions
 */

class CaddyAICalculator {
  constructor() {
    this.LARGE_NEGATIVE = -1000000000;
  }

  /**
   * Validates input arrays and ensures they have the same length
   * @param {Array} arrays - Arrays to validate
   * @param {string} functionName - Name of calling function for error messages
   */
  validateInputArrays(arrays, functionName) {
    if (!arrays.every(arr => Array.isArray(arr))) {
      throw new Error(`${functionName}: All inputs must be arrays`);
    }

    const lengths = arrays.map(arr => arr.length);
    if (!lengths.every(len => len === lengths[0])) {
      throw new Error(`${functionName}: All input arrays must have the same length`);
    }

    if (lengths[0] === 0) {
      throw new Error(`${functionName}: Input arrays cannot be empty`);
    }
  }

  /**
   * JavaScript equivalent of Excel's MAX function
   * @param {Array} values - Array of numeric values
   * @returns {number} Maximum value
   */
  MAX(values) {
    if (!Array.isArray(values) || values.length === 0) {
      throw new Error('MAX: Input must be a non-empty array');
    }

    const numericValues = values.filter(v => typeof v === 'number' && !isNaN(v));
    if (numericValues.length === 0) {
      throw new Error('MAX: No numeric values found');
    }

    return Math.max(...numericValues);
  }

  /**
   * JavaScript equivalent of Excel's INDEX function
   * @param {Array} array - Source array
   * @param {number} index - 1-based index (Excel style)
   * @returns {*} Value at specified index
   */
  INDEX(array, index) {
    if (!Array.isArray(array)) {
      throw new Error('INDEX: First argument must be an array');
    }

    if (!Number.isInteger(index) || index < 1 || index > array.length) {
      throw new Error(`INDEX: Index ${index} is out of bounds for array of length ${array.length}`);
    }

    return array[index - 1]; // Convert to 0-based indexing
  }

  /**
   * JavaScript equivalent of Excel's MATCH function
   * @param {*} lookupValue - Value to search for
   * @param {Array} lookupArray - Array to search in
   * @param {number} matchType - 0 for exact match
   * @returns {number} 1-based index of match
   */
  MATCH(lookupValue, lookupArray, matchType = 0) {
    if (!Array.isArray(lookupArray)) {
      throw new Error('MATCH: Second argument must be an array');
    }

    if (matchType !== 0) {
      throw new Error('MATCH: Only exact match (matchType = 0) is supported');
    }

    const index = lookupArray.findIndex(item => item === lookupValue);
    if (index === -1) {
      throw new Error(`MATCH: Value ${lookupValue} not found in array`);
    }

    return index + 1; // Convert to 1-based indexing
  }

  /**
   * JavaScript equivalent of Excel's XLOOKUP function
   * @param {*} lookupValue - Value to search for
   * @param {Array} lookupArray - Array to search in
   * @param {Array} returnArray - Array to return values from
   * @param {*} ifNotFound - Value to return if not found (optional)
   * @returns {*} Matched value from return array
   */
  XLOOKUP(lookupValue, lookupArray, returnArray, ifNotFound = null) {
    if (!Array.isArray(lookupArray) || !Array.isArray(returnArray)) {
      throw new Error('XLOOKUP: Lookup and return arrays must be arrays');
    }

    if (lookupArray.length !== returnArray.length) {
      throw new Error('XLOOKUP: Lookup and return arrays must have the same length');
    }

    const index = lookupArray.findIndex(item => item === lookupValue);
    if (index === -1) {
      if (ifNotFound !== null) {
        return ifNotFound;
      }
      throw new Error(`XLOOKUP: Value ${lookupValue} not found in lookup array`);
    }

    return returnArray[index];
  }

  /**
   * JavaScript equivalent of Excel's ROUND function
   * @param {number} value - Number to round
   * @param {number} digits - Number of decimal places
   * @returns {number} Rounded value
   */
  ROUND(value, digits) {
    if (typeof value !== 'number' || typeof digits !== 'number') {
      throw new Error('ROUND: Both arguments must be numbers');
    }

    const factor = Math.pow(10, digits);
    return Math.round(value * factor) / factor;
  }

  /**
   * JavaScript equivalent of Excel's EXP function
   * @param {number} value - Exponent value
   * @returns {number} e raised to the power of value
   */
  EXP(value) {
    if (typeof value !== 'number') {
      throw new Error('EXP: Argument must be a number');
    }
    return Math.exp(value);
  }

  /**
   * Calculates scoring values for each option (AG49:AG77 formulas)
   * Excel Formula: =IF(D="","",IF(J,-1000000000,MAX(0, ROUND(10/(1+EXP((H-120)/25)),2) - AC)))
   *
   * @param {Array} clubNames - Column D values (club names)
   * @param {Array} hazardFlags - Column J values (hazard boolean flags)
   * @param {Array} distances - Column H values (distances)
   * @param {Array} penalties - Column AC values (penalty values)
   * @returns {Array} Calculated scoring values
   */
  calculateScoringValues(clubNames, hazardFlags, distances, penalties) {
    this.validateInputArrays([clubNames, hazardFlags, distances, penalties], 'calculateScoringValues');

    return clubNames.map((clubName, index) => {
      // If club name is empty, return empty string
      if (!clubName || clubName === "") {
        return "";
      }

      // If hazard flag is true, return large negative value
      if (hazardFlags[index]) {
        return this.LARGE_NEGATIVE;
      }

      // Calculate sigmoid-based score with penalty
      const distance = distances[index];
      const penalty = penalties[index] || 0;

      // Sigmoid calculation: 10/(1+EXP((H-120)/25))
      const sigmoidValue = 10 / (1 + this.EXP((distance - 120) / 25));
      const roundedSigmoid = this.ROUND(sigmoidValue, 2);

      // Return max of 0 and (sigmoid - penalty)
      return Math.max(0, roundedSigmoid - penalty);
    });
  }

  /**
   * Finds the maximum scoring value (B80 formula)
   * Excel Formula: =MAX(AG49:AG77)
   *
   * @param {Array} scoringValues - AG column values
   * @returns {number} Maximum scoring value
   */
  findMaxScore(scoringValues) {
    if (!Array.isArray(scoringValues)) {
      throw new Error('findMaxScore: Input must be an array');
    }

    const numericScores = scoringValues.filter(score =>
      typeof score === 'number' && !isNaN(score) && score !== ""
    );

    if (numericScores.length === 0) {
      throw new Error('findMaxScore: No valid numeric scores found');
    }

    return this.MAX(numericScores);
  }

  /**
   * Finds the second highest scoring value (B82 formula)
   * Excel Formula: =LET(vals, AG49:AG77, maxVal, MAX(vals), filtered, FILTER(vals, vals <> maxVal), MAX(filtered))
   *
   * @param {Array} scoringValues - AG column values
   * @returns {number} Second highest scoring value
   */
  findSecondMaxScore(scoringValues) {
    if (!Array.isArray(scoringValues)) {
      throw new Error('findSecondMaxScore: Input must be an array');
    }

    const numericScores = scoringValues.filter(score =>
      typeof score === 'number' && !isNaN(score) && score !== ""
    );

    if (numericScores.length < 2) {
      throw new Error('findSecondMaxScore: Need at least 2 valid scores');
    }

    const maxVal = this.MAX(numericScores);
    const filtered = numericScores.filter(val => val !== maxVal);

    if (filtered.length === 0) {
      throw new Error('findSecondMaxScore: All scores are identical');
    }

    return this.MAX(filtered);
  }

  /**
   * Gets optimal club details based on maximum score (B81, C81, D81 formulas)
   * B81: =INDEX(A49:A77, MATCH(MAX(AG49:AG77), AG49:AG77, 0))
   * C81: =INDEX(B49:B77, MATCH(MAX(AG49:AG77), AG49:AG77, 0))
   * D81: =INDEX(C49:C77, MATCH(MAX(AG49:AG77), AG49:AG77, 0))
   *
   * @param {Array} clubNames - Column A values
   * @param {Array} distanceLabels - Column B values
   * @param {Array} clubTypes - Column C values
   * @param {Array} scoringValues - Column AG values
   * @returns {Object} Object with club, distance, and type
   */
  getOptimalClubDetails(clubNames, distanceLabels, clubTypes, scoringValues) {
    this.validateInputArrays([clubNames, distanceLabels, clubTypes, scoringValues], 'getOptimalClubDetails');

    const maxScore = this.findMaxScore(scoringValues);
    const matchIndex = this.MATCH(maxScore, scoringValues, 0);

    return {
      club: this.INDEX(clubNames, matchIndex),
      distance: this.INDEX(distanceLabels, matchIndex),
      type: this.INDEX(clubTypes, matchIndex)
    };
  }

  /**
   * Gets second best club details using XLOOKUP (B83, C83, D83 formulas)
   * B83: =XLOOKUP(B82,AG49:AG77,A49:A77)
   * C83: =XLOOKUP(B82,AG49:AG77,B49:B77)
   * D83: =XLOOKUP(B82,AG49:AG77,C49:C77)
   *
   * @param {Array} clubNames - Column A values
   * @param {Array} distanceLabels - Column B values
   * @param {Array} clubTypes - Column C values
   * @param {Array} scoringValues - Column AG values
   * @returns {Object} Object with second best club details
   */
  getSecondBestClubDetails(clubNames, distanceLabels, clubTypes, scoringValues) {
    this.validateInputArrays([clubNames, distanceLabels, clubTypes, scoringValues], 'getSecondBestClubDetails');

    const secondMaxScore = this.findSecondMaxScore(scoringValues);

    return {
      club: this.XLOOKUP(secondMaxScore, scoringValues, clubNames),
      distance: this.XLOOKUP(secondMaxScore, scoringValues, distanceLabels),
      type: this.XLOOKUP(secondMaxScore, scoringValues, clubTypes)
    };
  }

  /**
   * Calculates wind offset for aiming (B88, C88 formulas)
   * Complex LET formula with wind calculations
   *
   * @param {Object} params - Wind calculation parameters
   * @returns {number} Wind offset value
   */
  calculateWindOffset(params) {
    const {
      clubCarry,      // Carry distance for selected club
      windSpeed,      // Wind speed
      windDirection,  // Wind direction string
      baseShape,      // Base 5-iron shape value
      handedness,     // "Right" or "Left"
      naturalShape,   // "Draw", "Fade", or neutral
      shapeMult,      // Shape multiplier
      heightMult      // Height multiplier
    } = params;

    // Validate required parameters
    const required = ['clubCarry', 'windSpeed', 'windDirection', 'baseShape', 'handedness', 'naturalShape', 'shapeMult', 'heightMult'];
    for (const param of required) {
      if (params[param] === undefined || params[param] === null) {
        throw new Error(`calculateWindOffset: Missing required parameter: ${param}`);
      }
    }

    // Wind angle lookup
    const windAngles = {
      "Cross_R_to_L": -90,
      "Cross_L_to_R": 90
    };
    const windAngle = windAngles[windDirection] || 0;

    // Calculate yards per MPH
    const ydsPerMPH = clubCarry / 100;

    // Calculate crosswind component
    const crossMPH = (windDirection === "Head" || windDirection === "Tail") ?
      0 : windSpeed * Math.sin(windAngle * Math.PI / 180);

    // Calculate wind drift
    const windDrift = crossMPH * ydsPerMPH * heightMult;

    // Calculate curve sign based on natural shape and handedness
    let curveSign = 0;
    if (naturalShape === "Draw") {
      curveSign = handedness === "Right" ? -1 : 1;
    } else if (naturalShape === "Fade") {
      curveSign = handedness === "Right" ? 1 : -1;
    }

    // Calculate natural curve
    const naturalCurve = baseShape * shapeMult * curveSign;

    // Return negative of total offset (as per Excel formula)
    return -(windDrift + naturalCurve);
  }

  /**
   * Calculates hazard bias for aiming (B93 formula)
   * Complex hazard detection and bias calculation
   *
   * @param {Object} params - Hazard calculation parameters
   * @returns {number} Hazard bias value
   */
  calculateHazardBias(params) {
    const {
      targetCarry,    // Target carry distance
      hazards,        // Array of hazard objects with {type, side, startYard, endYard}
      waterBias = 10, // Bias for water hazards
      bunkerBias = 5  // Bias for bunkers/greenside hazards
    } = params;

    if (!targetCarry || !Array.isArray(hazards)) {
      throw new Error('calculateHazardBias: Missing required parameters');
    }

    // Count hazards by type and side
    let leftWater = false;
    let rightWater = false;
    let leftBunker = false;
    let rightBunker = false;

    hazards.forEach(hazard => {
      // Check if target carry is within hazard range
      if (targetCarry >= hazard.startYard && targetCarry < hazard.endYard) {
        if (hazard.type === "water") {
          if (hazard.side === "left") leftWater = true;
          if (hazard.side === "right") rightWater = true;
        } else if (hazard.type === "bunker" || hazard.type === "greenside") {
          if (hazard.side === "left") leftBunker = true;
          if (hazard.side === "right") rightBunker = true;
        }
      }
    });

    // Calculate bias (positive pushes right, negative pushes left)
    const waterBiasValue = waterBias * (Number(leftWater) - Number(rightWater));
    const bunkerBiasValue = bunkerBias * (Number(leftBunker) - Number(rightBunker));

    return waterBiasValue + bunkerBiasValue;
  }

  /**
   * Calculates stance offset for pin position (B99, C99, E99 formulas)
   * Handles above/below pin adjustments
   *
   * @param {Object} params - Stance calculation parameters
   * @returns {number} Stance offset value
   */
  calculateStanceOffset(params) {
    const {
      pinDistance,     // Distance to pin (D50 or E81)
      pinPosition,     // Pin position string (e.g., "ABOVE", "BELOW")
      stancePercent,   // Stance adjustment percentage
      handedness,      // "Right" or "Left"
      defaultPercent = 3 // Default percentage if not specified
    } = params;

    // Return 0 if pin distance is empty or pin position is empty
    if (!pinDistance || !pinPosition) {
      return 0;
    }

    let offset = 0;
    const percent = stancePercent || defaultPercent;

    // Check pin position and calculate offset
    if (pinPosition.toUpperCase().includes("ABOVE")) {
      offset = percent * pinDistance / 100;
    } else if (pinPosition.toUpperCase().includes("BELOW")) {
      offset = -percent * pinDistance / 100;
    }

    // Apply handedness multiplier (left-handed gets negative)
    const handMultiplier = handedness && handedness.toUpperCase().startsWith("L") ? -1 : 1;

    return offset * handMultiplier;
  }

  /**
   * Calculates total aim offset (B94, C94 formulas)
   * B94: =IF(AND(B88="",B93=""),"", N(B88) + N(B93) + N($C$99))
   *
   * @param {number} windOffset - Wind offset value
   * @param {number} hazardBias - Hazard bias value
   * @param {number} stanceOffset - Stance offset value
   * @returns {number|string} Total offset or empty string
   */
  calculateTotalAimOffset(windOffset, hazardBias, stanceOffset) {
    // If both wind offset and hazard bias are empty, return empty string
    if ((windOffset === "" || windOffset === null || windOffset === undefined) &&
        (hazardBias === "" || hazardBias === null || hazardBias === undefined)) {
      return "";
    }

    // Convert to numbers (N function equivalent)
    const numWindOffset = Number(windOffset) || 0;
    const numHazardBias = Number(hazardBias) || 0;
    const numStanceOffset = Number(stanceOffset) || 0;

    return numWindOffset + numHazardBias + numStanceOffset;
  }

  /**
   * Generates aim directive text (B95, C95 formulas)
   * Complex LET formula that creates readable aim instructions
   *
   * @param {number} aimOffset - Total aim offset value
   * @returns {string} Formatted aim directive
   */
  generateAimDirective(aimOffset) {
    // If offset is empty, return empty string
    if (aimOffset === "" || aimOffset === null || aimOffset === undefined) {
      return "";
    }

    const offsetValue = Number(aimOffset);

    // Determine direction based on sign
    let direction;
    const sign = Math.sign(offsetValue);

    if (sign < 0) {
      direction = "LEFT";
    } else if (sign > 0) {
      direction = "RIGHT";
    } else {
      direction = "CENTER";
    }

    // Format the directive
    let directive = `Aim ${direction}`;

    // Add distance if not center
    if (offsetValue !== 0) {
      const absRounded = Math.abs(Math.round(offsetValue));
      directive += ` ${absRounded} yds`;
    }

    return directive;
  }

  /**
   * Complete calculation workflow
   * Processes all formulas in sequence to get final aim recommendation
   *
   * @param {Object} inputData - All required input data
   * @returns {Object} Complete calculation results
   */
  calculateComplete(inputData) {
    try {
      const results = {};

      // Step 1: Calculate scoring values for all clubs (AG49:AG77)
      results.scoringValues = this.calculateScoringValues(
        inputData.clubNames,
        inputData.hazardFlags,
        inputData.distances,
        inputData.penalties
      );

      // Step 2: Find optimal and second-best clubs (B80-D83)
      results.maxScore = this.findMaxScore(results.scoringValues);
      results.secondMaxScore = this.findSecondMaxScore(results.scoringValues);
      results.optimalClub = this.getOptimalClubDetails(
        inputData.clubNames,
        inputData.distanceLabels,
        inputData.clubTypes,
        results.scoringValues
      );
      results.secondBestClub = this.getSecondBestClubDetails(
        inputData.clubNames,
        inputData.distanceLabels,
        inputData.clubTypes,
        results.scoringValues
      );

      // Step 3: Calculate aim adjustments for both clubs
      results.optimalWindOffset = this.calculateWindOffset({
        clubCarry: inputData.optimalCarry,
        windSpeed: inputData.windSpeed,
        windDirection: inputData.windDirection,
        baseShape: inputData.baseShape,
        handedness: inputData.handedness,
        naturalShape: inputData.naturalShape,
        shapeMult: inputData.optimalShapeMult,
        heightMult: inputData.optimalHeightMult
      });

      results.secondWindOffset = this.calculateWindOffset({
        clubCarry: inputData.secondCarry,
        windSpeed: inputData.windSpeed,
        windDirection: inputData.windDirection,
        baseShape: inputData.baseShape,
        handedness: inputData.handedness,
        naturalShape: inputData.naturalShape,
        shapeMult: inputData.secondShapeMult,
        heightMult: inputData.secondHeightMult
      });

      // Step 4: Calculate hazard bias
      results.hazardBias = this.calculateHazardBias({
        targetCarry: inputData.targetCarry,
        hazards: inputData.hazards
      });

      // Step 5: Calculate stance offsets
      results.optimalStanceOffset = this.calculateStanceOffset({
        pinDistance: inputData.optimalPinDistance,
        pinPosition: inputData.pinPosition,
        stancePercent: inputData.optimalStancePercent,
        handedness: inputData.handedness
      });

      results.secondStanceOffset = this.calculateStanceOffset({
        pinDistance: inputData.secondPinDistance,
        pinPosition: inputData.pinPosition,
        stancePercent: inputData.secondStancePercent,
        handedness: inputData.handedness
      });

      // Step 6: Calculate total aim offsets
      results.optimalTotalOffset = this.calculateTotalAimOffset(
        results.optimalWindOffset,
        results.hazardBias,
        results.optimalStanceOffset
      );

      results.secondTotalOffset = this.calculateTotalAimOffset(
        results.secondWindOffset,
        results.hazardBias,
        results.secondStanceOffset
      );

      // Step 7: Generate aim directives
      results.optimalAimDirective = this.generateAimDirective(results.optimalTotalOffset);
      results.secondAimDirective = this.generateAimDirective(results.secondTotalOffset);

      return results;

    } catch (error) {
      throw new Error(`calculateComplete: ${error.message}`);
    }
  }
}

module.exports = CaddyAICalculator;