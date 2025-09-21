import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { VoiceButton } from '../components/common/VoiceButton';
import { RootState } from '../store';
import { updateTargetDistance, updateConditions } from '../store/slices/shotSlice';
import { ShotRecommendation, Conditions } from '../types';

export const MainShotScreen: React.FC = () => {
  const dispatch = useDispatch();
  const [manualDistance, setManualDistance] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);

  const {
    targetDistance,
    currentConditions,
    recommendation,
  } = useSelector((state: RootState) => state.shot);

  const { clubs } = useSelector((state: RootState) => state.clubs);
  const profile = useSelector((state: RootState) => state.profile);

  const handleVoiceTranscript = useCallback((transcript: string) => {
    const distance = extractDistanceFromText(transcript);
    if (distance) {
      dispatch(updateTargetDistance(distance));
      setShowManualInput(false);
    } else {
      Alert.alert(
        'Voice Input',
        `I heard: "${transcript}"\n\nPlease say the distance in yards, for example: "165 yards" or "one hundred sixty-five"`
      );
    }
  }, [dispatch]);

  const extractDistanceFromText = (text: string): number | null => {
    const numericMatch = text.match(/(\d+)/);
    if (numericMatch) {
      const distance = parseInt(numericMatch[1], 10);
      if (distance >= 5 && distance <= 350) {
        return distance;
      }
    }

    const wordToNumber: Record<string, number> = {
      'five': 5, 'ten': 10, 'fifteen': 15, 'twenty': 20,
      'thirty': 30, 'forty': 40, 'fifty': 50, 'sixty': 60,
      'seventy': 70, 'eighty': 80, 'ninety': 90, 'hundred': 100,
    };

    const lowerText = text.toLowerCase();
    for (const [word, num] of Object.entries(wordToNumber)) {
      if (lowerText.includes(word)) {
        return num;
      }
    }

    return null;
  };

  const handleManualSubmit = useCallback(() => {
    const distance = parseInt(manualDistance, 10);
    if (isNaN(distance) || distance < 5 || distance > 350) {
      Alert.alert('Invalid Distance', 'Please enter a distance between 5 and 350 yards.');
      return;
    }

    dispatch(updateTargetDistance(distance));
    setManualDistance('');
    setShowManualInput(false);
  }, [manualDistance, dispatch]);

  const calculatedRecommendation = useMemo(() => {
    if (!targetDistance || !clubs.length) return null;

    const baseClub = clubs.find(club =>
      Math.abs(club.carryDistance - targetDistance) <= 10
    ) || clubs.reduce((prev, current) =>
      Math.abs(current.carryDistance - targetDistance) < Math.abs(prev.carryDistance - targetDistance)
        ? current : prev
    );

    const windAdjustment = calculateWindAdjustment(currentConditions);
    const elevationAdjustment = calculateElevationAdjustment(currentConditions);
    const temperatureAdjustment = calculateTemperatureAdjustment(currentConditions);

    const totalAdjustment = windAdjustment + elevationAdjustment + temperatureAdjustment;
    const adjustedDistance = targetDistance + totalAdjustment;

    const finalClub = clubs.reduce((prev, current) =>
      Math.abs(current.carryDistance - adjustedDistance) < Math.abs(prev.carryDistance - adjustedDistance)
        ? current : prev
    );

    return {
      club: finalClub.name,
      takeback: 'full' as const,
      face: 'square' as const,
      adjustedDistance: Math.round(adjustedDistance),
      confidence: 0.85,
      reasoning: `Adjusted for wind (${windAdjustment > 0 ? '+' : ''}${windAdjustment}), elevation (${elevationAdjustment > 0 ? '+' : ''}${elevationAdjustment}), temperature (${temperatureAdjustment > 0 ? '+' : ''}${temperatureAdjustment})`,
      alternatives: [],
    };
  }, [targetDistance, clubs, currentConditions]);

  const calculateWindAdjustment = (conditions: Conditions): number => {
    const headwindFactor = Math.cos(conditions.windDirection * Math.PI / 180);
    return Math.round(conditions.windSpeed * headwindFactor * -0.8);
  };

  const calculateElevationAdjustment = (conditions: Conditions): number => {
    return Math.round(conditions.elevation * 0.1);
  };

  const calculateTemperatureAdjustment = (conditions: Conditions): number => {
    const baseTemp = 70;
    return Math.round((conditions.temperature - baseTemp) * 0.2);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.conditionsBar}>
        <Text style={styles.conditionText}>🌤️ {currentConditions.temperature}°F</Text>
        <Text style={styles.conditionText}>💨 {currentConditions.windSpeed}mph</Text>
        <Text style={styles.conditionText}>⬆️ {currentConditions.elevation}ft</Text>
      </View>

      <View style={styles.distanceSection}>
        <Text style={styles.sectionTitle}>Target Distance</Text>
        <View style={styles.distanceDisplay}>
          <Text style={styles.distanceNumber}>
            {targetDistance || '--'}
          </Text>
          <Text style={styles.distanceUnit}>YARDS</Text>
        </View>
      </View>

      <View style={styles.inputSection}>
        <VoiceButton
          onTranscript={handleVoiceTranscript}
          size="large"
        />

        <TouchableOpacity
          style={styles.manualButton}
          onPress={() => setShowManualInput(!showManualInput)}
        >
          <Text style={styles.manualButtonText}>Manual Input</Text>
        </TouchableOpacity>

        {showManualInput && (
          <View style={styles.manualInputContainer}>
            <TextInput
              style={styles.manualInput}
              placeholder="Enter distance in yards"
              value={manualDistance}
              onChangeText={setManualDistance}
              keyboardType="numeric"
              maxLength={3}
            />
            <TouchableOpacity style={styles.submitButton} onPress={handleManualSubmit}>
              <Text style={styles.submitButtonText}>Set Distance</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {calculatedRecommendation && (
        <View style={styles.recommendationSection}>
          <Text style={styles.sectionTitle}>Recommendation</Text>
          <View style={styles.recommendationCard}>
            <View style={styles.recommendationHeader}>
              <Text style={styles.clubName}>🏌️ {calculatedRecommendation.club}</Text>
              <Text style={styles.confidence}>
                💪 {Math.round(calculatedRecommendation.confidence * 100)}% confidence
              </Text>
            </View>

            <View style={styles.recommendationDetails}>
              <Text style={styles.detailText}>
                📐 {calculatedRecommendation.face} face
              </Text>
              <Text style={styles.detailText}>
                📏 {calculatedRecommendation.takeback} swing
              </Text>
              <Text style={styles.detailText}>
                🎯 {calculatedRecommendation.adjustedDistance} yards
              </Text>
            </View>

            {calculatedRecommendation.reasoning && (
              <View style={styles.reasoningSection}>
                <Text style={styles.reasoningText}>
                  {calculatedRecommendation.reasoning}
                </Text>
              </View>
            )}
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    padding: 16,
  },
  conditionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
  },
  conditionText: {
    fontSize: 14,
    color: '#616161',
    fontWeight: '500',
  },
  distanceSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 16,
  },
  distanceDisplay: {
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 24,
    borderRadius: 16,
    minWidth: 150,
  },
  distanceNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  distanceUnit: {
    fontSize: 16,
    color: '#616161',
    fontWeight: '500',
  },
  inputSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  manualButton: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
  },
  manualButtonText: {
    fontSize: 16,
    color: '#616161',
    fontWeight: '500',
  },
  manualInputContainer: {
    marginTop: 16,
    width: '100%',
    alignItems: 'center',
  },
  manualInput: {
    width: 200,
    height: 48,
    borderWidth: 2,
    borderColor: '#4CAF50',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 18,
    textAlign: 'center',
  },
  submitButton: {
    marginTop: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#4CAF50',
    borderRadius: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  recommendationSection: {
    marginBottom: 32,
  },
  recommendationCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#4CAF50',
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  clubName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212121',
  },
  confidence: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '600',
  },
  recommendationDetails: {
    marginBottom: 12,
  },
  detailText: {
    fontSize: 16,
    color: '#616161',
    marginBottom: 4,
  },
  reasoningSection: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  reasoningText: {
    fontSize: 14,
    color: '#757575',
    fontStyle: 'italic',
  },
});