// Voice Output Generator
// Generates natural, conversational recommendations and responses

import { GolfConditions } from './golf-nlp-parser';

export interface ClubRecommendation {
  primaryClub: {
    type: string;
    number?: number;
    name: string;
    takeback: string;
    facePosition: string;
    reason: string;
  };

  backupClub: {
    type: string;
    number?: number;
    name: string;
    takeback: string;
    facePosition: string;
    reason: string;
  };

  aimPoint: {
    direction: string;
    adjustment: string;
    reason: string;
  };

  stance: {
    ballPosition: string;
    weight: string;
    alignment: string;
    special?: string;
  };

  confidence: number;
  warnings: string[];
}

export interface OutputOptions {
  verbosityLevel: 'concise' | 'detailed' | 'comprehensive';
  includeExplanations: boolean;
  useGolfTerminology: boolean;
  personalityStyle: 'professional' | 'casual' | 'encouraging';
}

export class VoiceOutputGenerator {
  private options: OutputOptions;
  private clubDatabase: ClubDatabase;

  constructor(options?: Partial<OutputOptions>) {
    this.options = {
      verbosityLevel: 'detailed',
      includeExplanations: true,
      useGolfTerminology: true,
      personalityStyle: 'professional',
      ...options
    };
    this.clubDatabase = new ClubDatabase();
  }

  // Main method to generate spoken recommendation
  generateRecommendation(conditions: GolfConditions): {
    spokenText: string;
    recommendation: ClubRecommendation;
  } {
    // Generate the recommendation logic
    const recommendation = this.calculateRecommendation(conditions);

    // Generate natural speech text
    const spokenText = this.generateSpokenText(recommendation, conditions);

    return { spokenText, recommendation };
  }

  private calculateRecommendation(conditions: GolfConditions): ClubRecommendation {
    const baseDistance = conditions.distance?.value || 150;
    let adjustedDistance = baseDistance;

    // Adjust for elevation
    if (conditions.elevation) {
      const elevationAdjustment = this.calculateElevationAdjustment(conditions.elevation);
      adjustedDistance += elevationAdjustment;
    }

    // Adjust for wind
    if (conditions.wind) {
      const windAdjustment = this.calculateWindAdjustment(conditions.wind);
      adjustedDistance += windAdjustment;
    }

    // Adjust for temperature
    if (conditions.temperature) {
      const tempAdjustment = this.calculateTemperatureAdjustment(conditions.temperature);
      adjustedDistance += tempAdjustment;
    }

    // Adjust for lie
    const lieAdjustment = this.calculateLieAdjustment(conditions.lie);
    adjustedDistance += lieAdjustment;

    // Select clubs based on adjusted distance
    const primaryClub = this.clubDatabase.selectClub(adjustedDistance, conditions.lie);
    const backupClub = this.clubDatabase.selectBackupClub(adjustedDistance, conditions.lie);

    // Calculate aim point adjustments
    const aimPoint = this.calculateAimPoint(conditions);

    // Calculate stance recommendations
    const stance = this.calculateStance(conditions, primaryClub);

    // Determine confidence and warnings
    const { confidence, warnings } = this.assessRecommendationQuality(conditions, adjustedDistance);

    return {
      primaryClub,
      backupClub,
      aimPoint,
      stance,
      confidence,
      warnings
    };
  }

  private generateSpokenText(recommendation: ClubRecommendation, conditions: GolfConditions): string {
    const parts: string[] = [];

    // Opening based on personality style
    parts.push(this.generateOpening(recommendation.confidence));

    // Primary club recommendation
    parts.push(this.generateClubRecommendation(recommendation.primaryClub, 'primary'));

    // Backup option if verbosity allows
    if (this.options.verbosityLevel !== 'concise') {
      parts.push(this.generateClubRecommendation(recommendation.backupClub, 'backup'));
    }

    // Aim point adjustments
    if (recommendation.aimPoint.adjustment !== 'none') {
      parts.push(this.generateAimAdjustment(recommendation.aimPoint));
    }

    // Stance recommendations
    parts.push(this.generateStanceAdvice(recommendation.stance));

    // Warnings if any
    if (recommendation.warnings.length > 0 && this.options.verbosityLevel === 'comprehensive') {
      parts.push(this.generateWarnings(recommendation.warnings));
    }

    // Closing
    parts.push(this.generateClosing());

    return parts.filter(part => part.length > 0).join(' ');
  }

  private generateOpening(confidence: number): string {
    const style = this.options.personalityStyle;

    if (confidence > 0.9) {
      switch (style) {
        case 'casual':
          return "Alright, I've got a solid read on this shot.";
        case 'encouraging':
          return "Perfect! This is a great opportunity for a solid shot.";
        default:
          return "Based on the conditions, I have a confident recommendation.";
      }
    } else if (confidence > 0.7) {
      switch (style) {
        case 'casual':
          return "Here's what I'm thinking for this shot.";
        case 'encouraging':
          return "You can definitely handle this shot well.";
        default:
          return "Considering all factors, here's my recommendation.";
      }
    } else {
      switch (style) {
        case 'casual':
          return "This is a tricky one, but here's my best call.";
        case 'encouraging':
          return "Don't worry, we can work with these conditions.";
        default:
          return "Given the challenging conditions, I recommend:";
      }
    }
  }

  private generateClubRecommendation(club: any, type: 'primary' | 'backup'): string {
    const prefix = type === 'primary' ? 'I recommend your' : 'As a backup option, consider your';

    const clubText = `${prefix} ${club.name}`;
    const takebackText = `with a ${club.takeback} takeback`;
    const faceText = `and ${club.facePosition} clubface`;

    let result = `${clubText} ${takebackText} ${faceText}.`;

    // Add explanation if enabled
    if (this.options.includeExplanations && club.reason) {
      result += ` ${club.reason}.`;
    }

    return result;
  }

  private generateAimAdjustment(aimPoint: any): string {
    let aimText = '';

    switch (aimPoint.direction) {
      case 'left':
        aimText = `Aim slightly left of your target`;
        break;
      case 'right':
        aimText = `Aim slightly right of your target`;
        break;
      case 'center':
        aimText = `Aim directly at your target`;
        break;
    }

    if (aimPoint.adjustment !== 'none') {
      aimText += ` to account for ${aimPoint.adjustment}`;
    }

    if (this.options.includeExplanations && aimPoint.reason) {
      aimText += `. ${aimPoint.reason}`;
    } else {
      aimText += '.';
    }

    return aimText;
  }

  private generateStanceAdvice(stance: any): string {
    const stanceParts: string[] = [];

    // Ball position
    if (stance.ballPosition !== 'center') {
      stanceParts.push(`Position the ball ${stance.ballPosition} in your stance`);
    }

    // Weight distribution
    if (stance.weight !== 'even') {
      stanceParts.push(`favor your ${stance.weight} side`);
    }

    // Special stance adjustments
    if (stance.special) {
      stanceParts.push(stance.special);
    }

    if (stanceParts.length > 0) {
      return `For your stance: ${stanceParts.join(', ')}.`;
    }

    return 'Use your normal stance for this shot.';
  }

  private generateWarnings(warnings: string[]): string {
    if (warnings.length === 0) return '';

    const style = this.options.personalityStyle;
    let prefix = '';

    switch (style) {
      case 'casual':
        prefix = 'Just a heads up: ';
        break;
      case 'encouraging':
        prefix = 'Keep in mind: ';
        break;
      default:
        prefix = 'Please note: ';
    }

    return `${prefix}${warnings.join(', ')}.`;
  }

  private generateClosing(): string {
    const style = this.options.personalityStyle;

    switch (style) {
      case 'casual':
        return "Trust your swing and commit to the shot!";
      case 'encouraging':
        return "You've got this! Execute with confidence.";
      default:
        return "Good luck with your shot.";
    }
  }

  // Calculation helper methods
  private calculateElevationAdjustment(elevation: GolfConditions['elevation']): number {
    if (!elevation) return 0;

    const feetChange = elevation.value;
    const direction = elevation.direction;
    const adjustment = feetChange * 2; // Rule of thumb: 2 yards per foot

    return direction === 'uphill' ? adjustment : -adjustment;
  }

  private calculateWindAdjustment(wind: GolfConditions['wind']): number {
    if (!wind) return 0;

    const windSpeed = wind.speed;
    const direction = wind.direction;

    switch (direction) {
      case 'headwind':
        return windSpeed * 2; // Add yards for headwind
      case 'tailwind':
        return -windSpeed * 1.5; // Subtract yards for tailwind
      case 'crosswind':
      case 'left':
      case 'right':
        return windSpeed * 0.5; // Minor distance adjustment for crosswind
      default:
        return 0;
    }
  }

  private calculateTemperatureAdjustment(temperature: GolfConditions['temperature']): number {
    if (!temperature) return 0;

    const temp = temperature.unit === 'celsius'
      ? (temperature.value * 9/5) + 32
      : temperature.value;

    // Ball travels farther in warmer air
    const baseTemp = 70;
    const tempDiff = temp - baseTemp;
    return tempDiff * 0.2; // Rough estimate: 0.2 yards per degree
  }

  private calculateLieAdjustment(lie: GolfConditions['lie']): number {
    const adjustments: Record<string, number> = {
      'tee': -5, // Easier to hit farther from tee
      'fairway': 0, // Baseline
      'light_rough': 5, // Slightly harder
      'heavy_rough': 15, // Much harder
      'sand': 20, // Very difficult
      'recovery': 25 // Extremely difficult
    };

    return adjustments[lie || 'fairway'] || 0;
  }

  private calculateAimPoint(conditions: GolfConditions): any {
    let direction = 'center';
    let adjustment = 'none';
    let reason = '';

    // Check for crosswind
    if (conditions.wind && (conditions.wind.direction === 'left' || conditions.wind.direction === 'right')) {
      const windSpeed = conditions.wind.speed;
      if (windSpeed > 10) {
        direction = conditions.wind.direction === 'left' ? 'right' : 'left';
        adjustment = 'crosswind';
        reason = `The strong crosswind will push your ball ${conditions.wind.direction}`;
      }
    }

    // Check for hazards that might require aim adjustment
    if (conditions.hazards.length > 0) {
      const primaryHazard = conditions.hazards[0];
      if (primaryHazard.location === 'right') {
        direction = 'left';
        adjustment = 'hazard avoidance';
        reason = `There's a ${primaryHazard.type} on the right side`;
      } else if (primaryHazard.location === 'left') {
        direction = 'right';
        adjustment = 'hazard avoidance';
        reason = `There's a ${primaryHazard.type} on the left side`;
      }
    }

    return { direction, adjustment, reason };
  }

  private calculateStance(conditions: GolfConditions, club: any): any {
    let ballPosition = 'center';
    let weight = 'even';
    let alignment = 'square';
    let special = '';

    // Adjust ball position based on club type
    if (club.type === 'driver' || club.type === 'wood') {
      ballPosition = 'forward';
    } else if (club.type === 'wedge') {
      ballPosition = 'back';
    }

    // Adjust for elevation
    if (conditions.elevation) {
      if (conditions.elevation.direction === 'uphill') {
        weight = 'back';
        special = 'lean slightly away from the slope';
      } else {
        weight = 'front';
        special = 'lean slightly into the slope';
      }
    }

    // Adjust for lie conditions
    if (conditions.lie === 'sand') {
      special = 'dig your feet in for stability and open the clubface slightly';
    } else if (conditions.lie === 'heavy_rough') {
      special = 'take a wider stance for better balance';
    }

    return { ballPosition, weight, alignment, special };
  }

  private assessRecommendationQuality(conditions: GolfConditions, adjustedDistance: number): {
    confidence: number;
    warnings: string[];
  } {
    let confidence = 1.0;
    const warnings: string[] = [];

    // Reduce confidence for missing information
    if (!conditions.wind) confidence -= 0.1;
    if (!conditions.elevation) confidence -= 0.05;
    if (!conditions.lie) confidence -= 0.05;

    // Check for challenging conditions
    if (conditions.wind && conditions.wind.speed > 15) {
      confidence -= 0.2;
      warnings.push('strong wind conditions may affect accuracy');
    }

    if (conditions.elevation && Math.abs(conditions.elevation.value) > 20) {
      confidence -= 0.15;
      warnings.push('significant elevation change requires careful club selection');
    }

    if (conditions.lie === 'heavy_rough' || conditions.lie === 'sand') {
      confidence -= 0.1;
      warnings.push('difficult lie may require adjusted technique');
    }

    if (conditions.hazards.length > 2) {
      confidence -= 0.1;
      warnings.push('multiple hazards require strategic shot placement');
    }

    // Extreme distances
    if (adjustedDistance < 50 || adjustedDistance > 250) {
      confidence -= 0.1;
      if (adjustedDistance > 250) {
        warnings.push('long shot may require maximum effort');
      }
    }

    return { confidence: Math.max(confidence, 0.3), warnings };
  }

  // Update output options
  updateOptions(newOptions: Partial<OutputOptions>): void {
    this.options = { ...this.options, ...newOptions };
  }

  // Generate different types of responses
  generateErrorResponse(error: string): string {
    const style = this.options.personalityStyle;

    switch (style) {
      case 'casual':
        return `Hmm, looks like there's an issue: ${error}. Let's try again.`;
      case 'encouraging':
        return `No worries! ${error} Let's get this sorted out.`;
      default:
        return `I apologize, but ${error}. Please provide the information again.`;
    }
  }

  generateConfirmationRequest(conditions: GolfConditions): string {
    const conditionsList: string[] = [];

    if (conditions.distance) {
      conditionsList.push(`${conditions.distance.value} yards`);
    }
    if (conditions.elevation) {
      conditionsList.push(`${conditions.elevation.direction}`);
    }
    if (conditions.wind) {
      conditionsList.push(`${conditions.wind.speed} mph ${conditions.wind.direction} wind`);
    }
    if (conditions.lie) {
      conditionsList.push(`from the ${conditions.lie}`);
    }

    const conditionsText = conditionsList.join(', ');
    const style = this.options.personalityStyle;

    switch (style) {
      case 'casual':
        return `So I've got ${conditionsText}. Sound right?`;
      case 'encouraging':
        return `Perfect! I understand you have ${conditionsText}. Is that correct?`;
      default:
        return `Let me confirm: you have ${conditionsText}. Is this accurate?`;
    }
  }
}

// Helper class for club selection logic
class ClubDatabase {
  private clubs = {
    driver: { range: [220, 280], takeback: '3/4', face: 'square' },
    '3_wood': { range: [200, 240], takeback: '3/4', face: 'square' },
    '5_wood': { range: [180, 210], takeback: '3/4', face: 'square' },
    '3_hybrid': { range: [170, 200], takeback: '3/4', face: 'square' },
    '4_iron': { range: [160, 180], takeback: '3/4', face: 'square' },
    '5_iron': { range: [150, 170], takeback: '3/4', face: 'square' },
    '6_iron': { range: [140, 160], takeback: '3/4', face: 'square' },
    '7_iron': { range: [130, 150], takeback: '3/4', face: 'square' },
    '8_iron': { range: [120, 140], takeback: '3/4', face: 'square' },
    '9_iron': { range: [110, 130], takeback: '3/4', face: 'square' },
    'pw': { range: [100, 120], takeback: '3/4', face: 'square' },
    'sw': { range: [80, 100], takeback: '3/4', face: 'open' },
    'lw': { range: [60, 80], takeback: '1/2', face: 'open' }
  };

  selectClub(distance: number, lie: string | null): any {
    // Find best matching club
    for (const [clubName, clubData] of Object.entries(this.clubs)) {
      if (distance >= clubData.range[0] && distance <= clubData.range[1]) {
        return {
          type: this.getClubType(clubName),
          number: this.getClubNumber(clubName),
          name: this.formatClubName(clubName),
          takeback: this.adjustTakeback(clubData.takeback, lie),
          facePosition: this.adjustFace(clubData.face, lie),
          reason: this.getSelectionReason(distance, lie)
        };
      }
    }

    // Default fallback
    return {
      type: 'iron',
      number: 7,
      name: '7-iron',
      takeback: '3/4',
      facePosition: 'square',
      reason: 'This is a versatile club for this distance'
    };
  }

  selectBackupClub(distance: number, lie: string | null): any {
    const primary = this.selectClub(distance, lie);
    const backupDistance = distance + 10; // Usually one club up
    return this.selectClub(backupDistance, lie);
  }

  private getClubType(clubName: string): string {
    if (clubName === 'driver') return 'driver';
    if (clubName.includes('wood')) return 'wood';
    if (clubName.includes('hybrid')) return 'hybrid';
    if (clubName.includes('iron')) return 'iron';
    if (['pw', 'sw', 'lw'].includes(clubName)) return 'wedge';
    return 'iron';
  }

  private getClubNumber(clubName: string): number | undefined {
    const match = clubName.match(/\d+/);
    return match ? parseInt(match[0]) : undefined;
  }

  private formatClubName(clubName: string): string {
    const nameMap: Record<string, string> = {
      'driver': 'driver',
      '3_wood': '3-wood',
      '5_wood': '5-wood',
      '3_hybrid': '3-hybrid',
      '4_iron': '4-iron',
      '5_iron': '5-iron',
      '6_iron': '6-iron',
      '7_iron': '7-iron',
      '8_iron': '8-iron',
      '9_iron': '9-iron',
      'pw': 'pitching wedge',
      'sw': 'sand wedge',
      'lw': 'lob wedge'
    };
    return nameMap[clubName] || clubName;
  }

  private adjustTakeback(baseTakeback: string, lie: string | null): string {
    if (lie === 'heavy_rough' || lie === 'sand') {
      return 'full';
    }
    return baseTakeback;
  }

  private adjustFace(baseFace: string, lie: string | null): string {
    if (lie === 'sand') {
      return 'open';
    }
    return baseFace;
  }

  private getSelectionReason(distance: number, lie: string | null): string {
    const reasons: string[] = [
      `This club should carry the ball ${distance} yards`,
      'Perfect for this distance range'
    ];

    if (lie === 'heavy_rough') {
      reasons.push('with enough loft to get out of the rough');
    } else if (lie === 'sand') {
      reasons.push('to help get the ball up quickly from the sand');
    }

    return reasons.join(' ');
  }
}