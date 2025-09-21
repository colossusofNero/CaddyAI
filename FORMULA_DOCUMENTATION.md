# CaddyAI Excel Formula Documentation

This document provides detailed explanations of all Excel formulas converted to JavaScript, maintaining exact calculation logic and handling.

## Overview

The CaddyAI system uses complex Excel formulas to:
1. **Score club options** based on distance, hazards, and course conditions
2. **Calculate optimal aim points** considering wind, player tendencies, and course hazards
3. **Generate readable aim directives** for golfers

## Formula Categories

### 1. Scoring Calculations (AG49:AG77)

**Excel Formula Pattern:**
```excel
=IF(D49="","",
   IF(J49,-1000000000,
      MAX(0, ROUND(10/(1+EXP((H49-120)/25)),2) - AC49)
   )
)
```

**Logic Breakdown:**
- **Input Validation:** If club name (D column) is empty, return empty string
- **Hazard Check:** If hazard flag (J column) is true, return large negative value (-1,000,000,000)
- **Sigmoid Calculation:** Uses sigmoid function `10/(1+EXP((distance-120)/25))` centered at 120 yards
  - Produces values from 0 to 10
  - Distance of 120 yards gives maximum score of 5
  - Closer distances give higher scores, further distances give lower scores
- **Penalty Adjustment:** Subtract penalty value (AC column) from sigmoid result
- **Floor at Zero:** Use MAX(0, result) to prevent negative scores

**JavaScript Implementation:**
```javascript
calculateScoringValues(clubNames, hazardFlags, distances, penalties) {
  return clubNames.map((clubName, index) => {
    if (!clubName || clubName === "") return "";
    if (hazardFlags[index]) return this.LARGE_NEGATIVE;

    const distance = distances[index];
    const penalty = penalties[index] || 0;
    const sigmoidValue = 10 / (1 + this.EXP((distance - 120) / 25));
    const roundedSigmoid = this.ROUND(sigmoidValue, 2);

    return Math.max(0, roundedSigmoid - penalty);
  });
}
```

### 2. Optimal Club Selection (B80:D83)

#### B80: Maximum Score
**Excel Formula:** `=MAX(AG49:AG77)`
- Finds the highest scoring value among all club options

#### C80: Best Score Index (Alternative Method)
**Excel Formula:** `=_xlfn.XMATCH(MAX(K49:K77), K49:K77, 0)`
- Alternative method using XMATCH to find index of maximum value

#### B81-D81: Optimal Club Details
**Excel Formulas:**
```excel
B81: =INDEX(A49:A77, MATCH(MAX(AG49:AG77), AG49:AG77, 0))
C81: =INDEX(B49:B77, MATCH(MAX(AG49:AG77), AG49:AG77, 0))
D81: =INDEX(C49:C77, MATCH(MAX(AG49:AG77), AG49:AG77, 0))
```

**Logic:**
1. Find maximum score in AG column
2. Use MATCH to find the row index of that maximum score
3. Use INDEX to retrieve corresponding values from A, B, C columns (club name, distance label, club type)

#### B82: Second Maximum Score (LET Formula)
**Excel Formula:**
```excel
=_xlfn.LET(
    _xlpm.vals, $AG$49:$AG$77,
    _xlpm.maxVal, MAX(_xlpm.vals),
    _xlpm.filtered, _xlfn._xlws.FILTER(_xlpm.vals, _xlpm.vals <> _xlpm.maxVal),
    MAX(_xlpm.filtered)
)
```

**Logic:**
1. Store all scoring values in variable
2. Find maximum value
3. Filter out all instances of the maximum value
4. Find maximum of the filtered array (second highest value)

#### B83-D83: Second Best Club Details
**Excel Formulas:**
```excel
B83: =_xlfn.XLOOKUP(B82,AG49:AG77,A49:A77)
C83: =_xlfn.XLOOKUP(B82,AG49:AG77,B49:B77)
D83: =_xlfn.XLOOKUP(B82,AG49:AG77,C49:C77)
```

**Logic:**
- Use XLOOKUP to find club details corresponding to second maximum score

### 3. Wind Offset Calculations (B88, C88)

**Excel Formula (B88):**
```excel
=_xlfn.LET(
  _xlpm.carry, _xlfn.XLOOKUP(B81, A49:A77, E49:E77, 0),
  _xlpm.spd, B11,
  _xlpm.windDir, B12,
  _xlpm.ang, _xlfn.XLOOKUP(_xlpm.windDir, {"Cross_R_to_L","Cross_L_to_R"}, {-90,90}, 0),
  _xlpm.base5i, B6,
  _xlpm.hand, B2,
  _xlpm.natShape, B4,
  _xlpm.shapeMult, B86,
  _xlpm.heightMult, C86,
  _xlpm.ydsPerMPH, _xlpm.carry / 100,
  _xlpm.crossMPH, IF(OR(_xlpm.windDir="Head", _xlpm.windDir="Tail"), 0, _xlpm.spd * SIN(RADIANS(_xlpm.ang))),
  _xlpm.windDrift, _xlpm.crossMPH * _xlpm.ydsPerMPH * _xlpm.heightMult,
  _xlpm.curveSign, IF(_xlpm.natShape = "Draw", IF(_xlpm.hand = "Right", -1, 1), IF(_xlpm.natShape = "Fade", IF(_xlpm.hand = "Right", 1, -1), 0)),
  _xlpm.naturalCurve, _xlpm.base5i * _xlpm.shapeMult * _xlpm.curveSign,
  -(_xlpm.windDrift + _xlpm.naturalCurve)
)
```

**Logic Breakdown:**
1. **Carry Distance:** Look up carry distance for selected club
2. **Wind Components:**
   - Get wind speed and direction
   - Convert direction to angle (-90° for R-to-L, +90° for L-to-R)
   - Calculate crosswind component using trigonometry
3. **Wind Drift Calculation:**
   - `ydsPerMPH = carry / 100` (approximation: 1 MPH affects 1% of carry distance)
   - `windDrift = crossMPH * ydsPerMPH * heightMult`
4. **Natural Ball Flight:**
   - Determine curve sign based on natural shape and handedness
   - Right-handed draw: curves left (negative)
   - Right-handed fade: curves right (positive)
   - Left-handed is opposite
   - `naturalCurve = base5Iron * shapeMult * curveSign`
5. **Total Offset:** Negative of sum (wind drift + natural curve)

### 4. Hazard Bias Calculation (B93)

**Excel Formula:**
```excel
=_xlfn.LET(
 _xlpm.t, _xlfn.XLOOKUP(B81, A49:A77, E49:E77, 0),
 _xlpm.waterBias, 10, _xlpm.bunkerBias, 5,
 _xlpm.LW, SUMPRODUCT(($A$25:$A$44="water")*($B$25:$B$44="left")*(_xlpm.t>=$F$25:$F$44)*(_xlpm.t<$G$25:$G$44))>0,
 _xlpm.RW, SUMPRODUCT(($A$25:$A$44="water")*($B$25:$B$44="right")*(_xlpm.t>=$F$25:$F$44)*(_xlpm.t<$G$25:$G$44))>0,
 _xlpm.LB, SUMPRODUCT((($A$25:$A$44="bunker")+($A$25:$A$44="greenside"))*($B$25:$B$44="left")*(_xlpm.t>=$F$25:$F$44)*(_xlpm.t<$G$25:$G$44))>0,
 _xlpm.RB, SUMPRODUCT((($A$25:$A$44="bunker")+($A$25:$A$44="greenside"))*($B$25:$B$44="right")*(_xlpm.t>=$F$25:$F$44)*(_xlpm.t<$G$25:$G$44))>0,
 _xlpm.waterBias*(--_xlpm.LW- --_xlpm.RW) + _xlpm.bunkerBias*(--_xlpm.LB- --_xlpm.RB)
)
```

**Logic Breakdown:**
1. **Target Distance:** Get carry distance for optimal club
2. **Hazard Detection:** Use SUMPRODUCT to detect hazards in range
   - Check if target distance falls within hazard start/end yards
   - Separate checks for water vs bunker/greenside hazards
   - Separate checks for left vs right side hazards
3. **Bias Calculation:**
   - Water hazards: 10-yard bias
   - Bunker/greenside hazards: 5-yard bias
   - Left hazards create positive bias (aim right)
   - Right hazards create negative bias (aim left)
4. **Final Result:** `waterBias * (leftWater - rightWater) + bunkerBias * (leftBunker - rightBunker)`

### 5. Stance Offset Calculations (B99, C99, E99)

**Excel Formula Pattern:**
```excel
=IF(OR(E81="",$B$100=""),0,
  (IF(ISNUMBER(SEARCH("ABOVE",$B$100)),
        IF($B$98="",3,VALUE($B$98))*E81/100,
     IF(ISNUMBER(SEARCH("BELOW",$B$100)),
        -IF($B$98="",3,VALUE($B$98))*E81/100,
        0)))
  *IF(LEFT(UPPER($B$2),1)="L",-1,1)
)
```

**Logic Breakdown:**
1. **Input Validation:** Return 0 if pin distance or position is empty
2. **Pin Position Detection:**
   - Search for "ABOVE" in pin position string
   - Search for "BELOW" in pin position string
   - Use different percentage for each scenario
3. **Percentage Calculation:**
   - Use specified percentage or default to 3%
   - Apply percentage to pin distance
   - Above pin: positive offset
   - Below pin: negative offset
4. **Handedness Adjustment:**
   - Left-handed golfers get opposite sign
   - Multiply by -1 if handedness starts with "L"

### 6. Total Aim Offset (B94, C94)

**Excel Formula:**
```excel
=IF(AND(B88="",B93=""),"", N(B88) + N(B93) + N($C$99))
```

**Logic:**
- Return empty string if both wind offset and hazard bias are empty
- Otherwise, sum: windOffset + hazardBias + stanceOffset
- N() function converts text to numbers (0 for empty strings)

### 7. Aim Directive Generation (B95, C95)

**Excel Formula:**
```excel
=_xlfn.LET(_xlpm.t,N(B94),IF(B94="","","Aim "&CHOOSE(SIGN(_xlpm.t)+2,"LEFT","CENTER","RIGHT")&IF(_xlpm.t=0,""," "&TEXT(ABS(ROUND(_xlpm.t,0)),"0")&" yds")))
```

**Logic Breakdown:**
1. **Input Validation:** Return empty string if total offset is empty
2. **Direction Determination:**
   - Use SIGN() function to get -1, 0, or 1
   - Add 2 to get 1, 2, or 3 for CHOOSE function
   - CHOOSE selects "LEFT", "CENTER", or "RIGHT"
3. **Distance Formatting:**
   - If offset is 0, show only direction
   - Otherwise, add absolute rounded distance with " yds"
4. **Final Format:** "Aim [DIRECTION] [DISTANCE] yds"

## Error Handling

### Input Validation
- **Array Length Checking:** All input arrays must have the same length
- **Type Checking:** Numeric inputs validated for type and finite values
- **Empty Value Handling:** Consistent handling of empty strings, null, and undefined

### Excel Function Equivalents
- **MAX:** Filters out non-numeric values before calculation
- **INDEX:** Validates array bounds and converts from 1-based to 0-based indexing
- **MATCH:** Supports exact match only, throws error if not found
- **XLOOKUP:** Supports optional default value for not-found cases

### Edge Cases
- **Division by Zero:** Protected in sigmoid calculations
- **Very Large/Small Numbers:** Handled with appropriate precision
- **String Comparisons:** Case-insensitive where appropriate
- **Array Filtering:** Maintains original Excel behavior for empty/invalid values

## Performance Considerations

### Optimization Strategies
1. **Single Pass Processing:** Avoid multiple array iterations where possible
2. **Early Returns:** Exit calculations early for invalid inputs
3. **Efficient Lookups:** Use JavaScript Map objects for large lookup tables
4. **Memory Management:** Avoid creating unnecessary intermediate arrays

### Complexity Analysis
- **Scoring Calculations:** O(n) where n is number of clubs
- **Optimal Selection:** O(n) for finding max, O(1) for lookups
- **Wind Calculations:** O(1) - constant time operations
- **Hazard Detection:** O(h) where h is number of hazards
- **Complete Workflow:** O(n + h) - linear with inputs

## Testing Strategy

### Unit Test Coverage
- **Basic Functions:** All Excel equivalents (MAX, INDEX, MATCH, etc.)
- **Complex Formulas:** Each major calculation function
- **Edge Cases:** Empty inputs, invalid data, boundary conditions
- **Integration:** Complete workflow with realistic data

### Test Data Requirements
- **Varied Club Sets:** Different numbers and types of clubs
- **Weather Conditions:** Multiple wind scenarios
- **Course Hazards:** Various hazard configurations
- **Player Types:** Different handedness and natural ball flights
- **Pin Positions:** Above, below, and center pin locations

This documentation ensures that the JavaScript implementation maintains exact parity with the original Excel formulas while providing improved error handling and performance.