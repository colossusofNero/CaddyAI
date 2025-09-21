import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Conditions, ShotRecommendation, VoiceInputState } from '../../types';

interface ShotState {
  targetDistance: number | null;
  currentConditions: Conditions;
  recommendation: ShotRecommendation | null;
  voiceInput: VoiceInputState;
}

const initialConditions: Conditions = {
  windSpeed: 5,
  windDirection: 0,
  temperature: 72,
  humidity: 50,
  elevation: 0,
  lie: 'fairway',
};

const initialState: ShotState = {
  targetDistance: null,
  currentConditions: initialConditions,
  recommendation: null,
  voiceInput: {
    isListening: false,
    transcript: '',
    confidence: 0,
  },
};

const shotSlice = createSlice({
  name: 'shot',
  initialState,
  reducers: {
    updateTargetDistance: (state, action: PayloadAction<number>) => {
      state.targetDistance = action.payload;
    },
    updateConditions: (state, action: PayloadAction<Partial<Conditions>>) => {
      state.currentConditions = { ...state.currentConditions, ...action.payload };
    },
    setRecommendation: (state, action: PayloadAction<ShotRecommendation>) => {
      state.recommendation = action.payload;
    },
    clearRecommendation: (state) => {
      state.recommendation = null;
    },
    updateVoiceInput: (state, action: PayloadAction<Partial<VoiceInputState>>) => {
      state.voiceInput = { ...state.voiceInput, ...action.payload };
    },
    resetShot: (state) => {
      state.targetDistance = null;
      state.recommendation = null;
      state.voiceInput = {
        isListening: false,
        transcript: '',
        confidence: 0,
      };
    },
  },
});

export const {
  updateTargetDistance,
  updateConditions,
  setRecommendation,
  clearRecommendation,
  updateVoiceInput,
  resetShot,
} = shotSlice.actions;

export default shotSlice.reducer;