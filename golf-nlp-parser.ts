// Golf Voice AI NLP Parser
// Handles recognition and parsing of golf terminology and conditions

export interface GolfConditions {
  distance: {
    value: number;
    unit: 'yards' | 'feet';
    target: 'pin' | 'hole' | 'green' | 'flag';
  } | null;

  elevation: {
    value: number;
    direction: 'uphill' | 'downhill';
    unit: 'feet' | 'yards';
  } | null;

  wind: {
    speed: number;
    direction: 'headwind' | 'tailwind' | 'crosswind' | 'left' | 'right';
    unit: 'mph' | 'kmh';
  } | null;

  lie: 'tee' | 'fairway' | 'light_rough' | 'heavy_rough' | 'sand' | 'recovery' | null;

  temperature: {
    value: number;
    unit: 'fahrenheit' | 'celsius';
  } | null;

  humidity: {
    value: number;
    unit: 'percent';
  } | null;

  hazards: Array<{
    type: 'bunker' | 'greenside_bunker' | 'water';
    location: 'front' | 'right' | 'left' | 'behind';
    startDistance?: number;
    clearDistance: number;
  }>;
}

export class GolfNLPParser {
  private distancePatterns = [
    // Distance patterns
    /(\d+)\s*(yards?|yds?|y)\s*(?:to\s*(?:the\s*)?(pin|hole|green|flag|stick))?/gi,
    /(\d+)\s*(?:yards?|yds?|y)?\s*(?:to\s*(?:the\s*)?(pin|hole|green|flag|stick))/gi,
    /(\d+)\s*out/gi,
  ];

  private elevationPatterns = [
    /(\d+)\s*(feet?|ft|yards?|yds?|y)\s*(up|uphill|down|downhill)/gi,
    /(up|uphill|down|downhill)\s*(\d+)\s*(feet?|ft|yards?|yds?|y)?/gi,
    /(playing\s*)?(up|uphill|down|downhill)/gi,
  ];

  private windPatterns = [
    /(\d+)\s*(mph|kmh|kilometers?\s*per\s*hour|miles?\s*per\s*hour)\s*(head|tail|cross|left|right)(?:wind)?/gi,
    /(head|tail|cross|left|right)(?:wind)?\s*(\d+)\s*(mph|kmh)?/gi,
    /(no\s*wind|calm|still)/gi,
  ];

  private liePatterns = [
    /(tee|teeing\s*ground|tee\s*box)/gi,
    /(fairway|short\s*grass)/gi,
    /(light\s*rough|first\s*cut|semi\s*rough)/gi,
    /(heavy\s*rough|thick\s*rough|deep\s*rough|cabbage)/gi,
    /(sand|bunker|trap|beach)/gi,
    /(recovery|trouble|trees|woods)/gi,
  ];

  private temperaturePatterns = [
    /(\d+)\s*degrees?\s*(fahrenheit|celsius|f|c)?/gi,
    /temperature\s*(?:is\s*)?(\d+)/gi,
  ];

  private humidityPatterns = [
    /(\d+)\s*percent\s*humidity/gi,
    /humidity\s*(?:is\s*)?(\d+)\s*percent?/gi,
  ];

  private hazardPatterns = [
    /(bunker|sand|trap)\s*(?:at\s*)?(\d+)\s*(?:yards?)?(?:\s*on\s*the\s*)?(front|right|left|behind|back)?/gi,
    /(water|pond|lake|creek|stream)\s*(?:at\s*)?(\d+)\s*(?:yards?)?(?:\s*on\s*the\s*)?(front|right|left|behind|back)?/gi,
    /(greenside\s*bunker|green\s*side\s*bunker)\s*(?:at\s*)?(\d+)?\s*(?:yards?)?/gi,
  ];

  parse(input: string): GolfConditions {
    const conditions: GolfConditions = {
      distance: null,
      elevation: null,
      wind: null,
      lie: null,
      temperature: null,
      humidity: null,
      hazards: []
    };

    // Parse distance
    conditions.distance = this.parseDistance(input);

    // Parse elevation
    conditions.elevation = this.parseElevation(input);

    // Parse wind
    conditions.wind = this.parseWind(input);

    // Parse lie
    conditions.lie = this.parseLie(input);

    // Parse temperature
    conditions.temperature = this.parseTemperature(input);

    // Parse humidity
    conditions.humidity = this.parseHumidity(input);

    // Parse hazards
    conditions.hazards = this.parseHazards(input);

    return conditions;
  }

  private parseDistance(input: string): GolfConditions['distance'] {
    for (const pattern of this.distancePatterns) {
      const match = pattern.exec(input.toLowerCase());
      if (match) {
        const value = parseInt(match[1]);
        const target = match[2] || 'pin';
        return {
          value,
          unit: 'yards',
          target: this.normalizeTarget(target)
        };
      }
    }
    return null;
  }

  private parseElevation(input: string): GolfConditions['elevation'] {
    for (const pattern of this.elevationPatterns) {
      const match = pattern.exec(input.toLowerCase());
      if (match) {
        let value: number;
        let direction: 'uphill' | 'downhill';
        let unit: 'feet' | 'yards' = 'feet';

        if (match[1] && /\d+/.test(match[1])) {
          value = parseInt(match[1]);
          direction = match[3]?.includes('up') ? 'uphill' : 'downhill';
          unit = match[2]?.includes('yard') ? 'yards' : 'feet';
        } else if (match[2] && /\d+/.test(match[2])) {
          value = parseInt(match[2]);
          direction = match[1]?.includes('up') ? 'uphill' : 'downhill';
          unit = match[3]?.includes('yard') ? 'yards' : 'feet';
        } else {
          value = 0;
          direction = match[1]?.includes('up') || match[2]?.includes('up') ? 'uphill' : 'downhill';
        }

        return { value, direction, unit };
      }
    }
    return null;
  }

  private parseWind(input: string): GolfConditions['wind'] {
    if (/no\s*wind|calm|still/gi.test(input)) {
      return { speed: 0, direction: 'headwind', unit: 'mph' };
    }

    for (const pattern of this.windPatterns) {
      const match = pattern.exec(input.toLowerCase());
      if (match) {
        const speed = parseInt(match[1] || match[2]);
        const direction = this.normalizeWindDirection(match[3] || match[1]);
        const unit = match[2]?.includes('km') || match[3]?.includes('km') ? 'kmh' : 'mph';

        return { speed, direction, unit };
      }
    }
    return null;
  }

  private parseLie(input: string): GolfConditions['lie'] {
    const lieMap: Record<string, GolfConditions['lie']> = {
      'tee': 'tee',
      'fairway': 'fairway',
      'light': 'light_rough',
      'heavy': 'heavy_rough',
      'sand': 'sand',
      'recovery': 'recovery'
    };

    for (const [key, value] of Object.entries(lieMap)) {
      for (const pattern of this.liePatterns) {
        if (pattern.test(input.toLowerCase()) && input.toLowerCase().includes(key)) {
          return value;
        }
      }
    }
    return null;
  }

  private parseTemperature(input: string): GolfConditions['temperature'] {
    for (const pattern of this.temperaturePatterns) {
      const match = pattern.exec(input.toLowerCase());
      if (match) {
        const value = parseInt(match[1]);
        const unit = match[2]?.toLowerCase().includes('c') ? 'celsius' : 'fahrenheit';
        return { value, unit };
      }
    }
    return null;
  }

  private parseHumidity(input: string): GolfConditions['humidity'] {
    for (const pattern of this.humidityPatterns) {
      const match = pattern.exec(input.toLowerCase());
      if (match) {
        const value = parseInt(match[1]);
        return { value, unit: 'percent' };
      }
    }
    return null;
  }

  private parseHazards(input: string): GolfConditions['hazards'] {
    const hazards: GolfConditions['hazards'] = [];

    for (const pattern of this.hazardPatterns) {
      let match;
      while ((match = pattern.exec(input.toLowerCase())) !== null) {
        const type = this.normalizeHazardType(match[1]);
        const distance = match[2] ? parseInt(match[2]) : 0;
        const location = this.normalizeLocation(match[3] || 'front');

        hazards.push({
          type,
          location,
          clearDistance: distance,
          startDistance: distance > 10 ? distance - 10 : distance
        });
      }
    }

    return hazards;
  }

  private normalizeTarget(target: string): 'pin' | 'hole' | 'green' | 'flag' {
    const targetMap: Record<string, 'pin' | 'hole' | 'green' | 'flag'> = {
      'pin': 'pin',
      'hole': 'hole',
      'green': 'green',
      'flag': 'flag',
      'stick': 'pin'
    };
    return targetMap[target.toLowerCase()] || 'pin';
  }

  private normalizeWindDirection(direction: string): 'headwind' | 'tailwind' | 'crosswind' | 'left' | 'right' {
    const directionMap: Record<string, 'headwind' | 'tailwind' | 'crosswind' | 'left' | 'right'> = {
      'head': 'headwind',
      'tail': 'tailwind',
      'cross': 'crosswind',
      'left': 'left',
      'right': 'right'
    };
    return directionMap[direction.toLowerCase()] || 'headwind';
  }

  private normalizeHazardType(type: string): 'bunker' | 'greenside_bunker' | 'water' {
    if (type.includes('greenside') || type.includes('green side')) {
      return 'greenside_bunker';
    }
    if (type.includes('bunker') || type.includes('sand') || type.includes('trap')) {
      return 'bunker';
    }
    return 'water';
  }

  private normalizeLocation(location: string): 'front' | 'right' | 'left' | 'behind' {
    const locationMap: Record<string, 'front' | 'right' | 'left' | 'behind'> = {
      'front': 'front',
      'right': 'right',
      'left': 'left',
      'behind': 'behind',
      'back': 'behind'
    };
    return locationMap[location.toLowerCase()] || 'front';
  }

  // Helper method to validate parsed conditions
  validateConditions(conditions: GolfConditions): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (conditions.distance && (conditions.distance.value < 0 || conditions.distance.value > 600)) {
      errors.push('Distance must be between 0 and 600 yards');
    }

    if (conditions.elevation && Math.abs(conditions.elevation.value) > 100) {
      errors.push('Elevation change seems excessive (over 100 feet)');
    }

    if (conditions.wind && (conditions.wind.speed < 0 || conditions.wind.speed > 50)) {
      errors.push('Wind speed must be between 0 and 50 mph');
    }

    if (conditions.temperature &&
        (conditions.temperature.value < -20 || conditions.temperature.value > 120)) {
      errors.push('Temperature seems out of range for golf conditions');
    }

    if (conditions.humidity &&
        (conditions.humidity.value < 0 || conditions.humidity.value > 100)) {
      errors.push('Humidity must be between 0 and 100 percent');
    }

    return { valid: errors.length === 0, errors };
  }
}