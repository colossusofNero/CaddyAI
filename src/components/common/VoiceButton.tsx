import React, { useState, useCallback } from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  Animated,
  Vibration,
} from 'react-native';
import { useVoice } from '../../hooks/useVoice';

interface VoiceButtonProps {
  onTranscript: (transcript: string) => void;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export const VoiceButton: React.FC<VoiceButtonProps> = ({
  onTranscript,
  disabled = false,
  size = 'large',
}) => {
  const { startListening, stopListening, isListening, transcript } = useVoice();
  const [pulseAnimation] = useState(new Animated.Value(1));

  const handlePress = useCallback(async () => {
    if (disabled) return;

    Vibration.vibrate(50);

    if (isListening) {
      await stopListening();
      if (transcript) {
        onTranscript(transcript);
      }
    } else {
      await startListening();
      startPulseAnimation();
    }
  }, [isListening, transcript, onTranscript, disabled, startListening, stopListening]);

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const stopPulseAnimation = () => {
    pulseAnimation.stopAnimation();
    pulseAnimation.setValue(1);
  };

  React.useEffect(() => {
    if (!isListening) {
      stopPulseAnimation();
    }
  }, [isListening]);

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { width: 60, height: 60, borderRadius: 30 };
      case 'medium':
        return { width: 80, height: 80, borderRadius: 40 };
      case 'large':
        return { width: 120, height: 120, borderRadius: 60 };
      default:
        return { width: 120, height: 120, borderRadius: 60 };
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.pulseCircle,
          getSizeStyles(),
          {
            transform: [{ scale: pulseAnimation }],
            opacity: isListening ? 0.3 : 0,
          },
        ]}
      />
      <TouchableOpacity
        style={[
          styles.button,
          getSizeStyles(),
          isListening && styles.listeningButton,
          disabled && styles.disabledButton,
        ]}
        onPress={handlePress}
        disabled={disabled}
        accessibilityLabel={isListening ? 'Stop listening' : 'Start voice input'}
        accessibilityHint="Tap to start or stop voice input for shot distance"
      >
        <View style={styles.iconContainer}>
          <Text style={[styles.icon, isListening && styles.listeningIcon]}>
            🎤
          </Text>
          <Text style={[styles.label, size === 'small' && styles.smallLabel]}>
            {isListening ? 'Listening...' : 'TAP TO SPEAK'}
          </Text>
        </View>
      </TouchableOpacity>
      {transcript && !isListening && (
        <View style={styles.transcriptContainer}>
          <Text style={styles.transcriptText}>{transcript}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  listeningButton: {
    backgroundColor: '#F44336',
  },
  disabledButton: {
    backgroundColor: '#9E9E9E',
    elevation: 0,
    shadowOpacity: 0,
  },
  pulseCircle: {
    position: 'absolute',
    backgroundColor: '#4CAF50',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 32,
    marginBottom: 4,
  },
  listeningIcon: {
    fontSize: 36,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  smallLabel: {
    fontSize: 10,
  },
  transcriptContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    maxWidth: 300,
  },
  transcriptText: {
    fontSize: 14,
    color: '#212121',
    textAlign: 'center',
  },
});