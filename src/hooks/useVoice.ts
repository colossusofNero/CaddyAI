import { useState, useCallback, useEffect } from 'react';
import Voice, {
  SpeechRecognizedEvent,
  SpeechResultsEvent,
  SpeechErrorEvent,
} from '@react-native-voice/voice';
import { Platform, PermissionsAndroid } from 'react-native';

interface UseVoiceReturn {
  isListening: boolean;
  transcript: string;
  confidence: number;
  error: string | null;
  startListening: () => Promise<void>;
  stopListening: () => Promise<void>;
  clearTranscript: () => void;
}

export const useVoice = (): UseVoiceReturn => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Voice.onSpeechStart = onSpeechStart;
    Voice.onSpeechRecognized = onSpeechRecognized;
    Voice.onSpeechEnd = onSpeechEnd;
    Voice.onSpeechError = onSpeechError;
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechPartialResults = onSpeechPartialResults;

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, []);

  const onSpeechStart = useCallback(() => {
    setIsListening(true);
    setError(null);
  }, []);

  const onSpeechRecognized = useCallback(() => {
    setError(null);
  }, []);

  const onSpeechEnd = useCallback(() => {
    setIsListening(false);
  }, []);

  const onSpeechError = useCallback((event: SpeechErrorEvent) => {
    setError(event.error?.message || 'Speech recognition error');
    setIsListening(false);
  }, []);

  const onSpeechResults = useCallback((event: SpeechResultsEvent) => {
    const results = event.value || [];
    if (results.length > 0) {
      setTranscript(results[0]);
      setConfidence(1.0);
    }
  }, []);

  const onSpeechPartialResults = useCallback((event: SpeechResultsEvent) => {
    const results = event.value || [];
    if (results.length > 0) {
      setTranscript(results[0]);
      setConfidence(0.8);
    }
  }, []);

  const requestMicrophonePermission = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'CaddyAI needs access to your microphone to use voice input for shot distances.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn('Permission request error:', err);
        return false;
      }
    }
    return true;
  };

  const startListening = useCallback(async () => {
    try {
      const hasPermission = await requestMicrophonePermission();
      if (!hasPermission) {
        setError('Microphone permission denied');
        return;
      }

      setError(null);
      setTranscript('');
      setConfidence(0);

      await Voice.start('en-US', {
        EXTRA_LANGUAGE_MODEL: 'LANGUAGE_MODEL_FREE_FORM',
        EXTRA_CALLING_PACKAGE: 'com.caddyai.app',
        EXTRA_PARTIAL_RESULTS: true,
        REQUEST_PERMISSIONS_AUTO: true,
      });
    } catch (err) {
      setError(`Failed to start voice recognition: ${err}`);
      setIsListening(false);
    }
  }, []);

  const stopListening = useCallback(async () => {
    try {
      await Voice.stop();
      setIsListening(false);
    } catch (err) {
      setError(`Failed to stop voice recognition: ${err}`);
      setIsListening(false);
    }
  }, []);

  const clearTranscript = useCallback(() => {
    setTranscript('');
    setConfidence(0);
    setError(null);
  }, []);

  return {
    isListening,
    transcript,
    confidence,
    error,
    startListening,
    stopListening,
    clearTranscript,
  };
};