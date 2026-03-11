/**
 * Round Analytics Store
 *
 * Zustand store for managing the analytics state during and after a round.
 * Connects the event tracker, inference engine, and aggregator.
 */

import { create } from 'zustand';
import {
  RoundAnalyticsState,
  InferredShotRecord,
  HoleAnalytics,
  ClubAnalytics,
  RoundAnalyticsSummary,
} from '../types/roundAnalytics.types';
import {
  initRoundTracker,
  restoreRoundTracker,
  trackOptimizerRun,
  trackAIClubSelection,
  processHoleScore,
  clearRoundTracker,
} from '../services/roundEventTracker';
import {
  buildClubAnalytics,
  buildRoundSummary,
  loadShotsForAnalytics,
  persistClubAnalytics,
  loadClubAnalytics,
  loadRecentRoundSummaries,
} from '../services/analyticsAggregator';

interface RoundAnalyticsActions {
  // Round lifecycle
  startRound: (roundId: string) => Promise<void>;
  restoreRound: () => Promise<void>;
  endRound: (params: {
    courseId?: string;
    courseName?: string;
    date: string;
  }) => Promise<RoundAnalyticsSummary | null>;

  // Event capture (called during play)
  recordOptimizerRun: (params: Parameters<typeof trackOptimizerRun>[0]) => Promise<string>;
  recordAIClubSelection: (club: string, holeNumber: number) => Promise<void>;
  recordHoleScore: (params: {
    holeNumber: number;
    par: number;
    score: number;
    fairwayInRegulation: boolean | null;
    greenInRegulation: boolean;
    putts: number;
    penaltyStrokes?: number;
  }) => Promise<void>;

  // Analytics loading
  loadClubStats: () => Promise<void>;
  loadHistoricalRounds: () => Promise<void>;

  // State
  reset: () => void;
}

const initialState: RoundAnalyticsState = {
  currentRoundId: null,
  currentHoleNumber: 1,
  optimizerEvents: [],
  aiSelectionEvents: [],
  holeScoreEvents: [],
  inferredShots: [],
  holeAnalytics: [],
  clubAnalytics: [],
  recentRoundSummaries: [],
  isProcessing: false,
  lastError: null,
};

export const useRoundAnalyticsStore = create<RoundAnalyticsState & RoundAnalyticsActions>(
  (set, get) => ({
    ...initialState,

    startRound: async (roundId: string) => {
      await initRoundTracker(roundId);
      set({
        ...initialState,
        currentRoundId: roundId,
      });
    },

    restoreRound: async () => {
      const restored = await restoreRoundTracker();
      if (restored) {
        console.log('[RoundAnalyticsStore] Round tracker restored from storage');
      }
    },

    recordOptimizerRun: async (params) => {
      const eventId = await trackOptimizerRun(params);
      return eventId;
    },

    recordAIClubSelection: async (club: string, holeNumber: number) => {
      await trackAIClubSelection(club, holeNumber);
    },

    recordHoleScore: async (params) => {
      set({ isProcessing: true, lastError: null });
      try {
        const result = await processHoleScore(params);
        if (result) {
          set(state => ({
            inferredShots: [...state.inferredShots, ...result.shots],
            holeAnalytics: [...state.holeAnalytics, result.holeAnalytics],
            isProcessing: false,
          }));

          console.log(
            `[RoundAnalyticsStore] Hole ${params.holeNumber} analytics saved. ` +
            `${result.shots.length} shots inferred.`
          );
        } else {
          set({ isProcessing: false });
        }
      } catch (e: any) {
        set({ isProcessing: false, lastError: e.message });
        console.error('[RoundAnalyticsStore] Error processing hole score:', e);
      }
    },

    endRound: async ({ courseId, courseName, date }) => {
      const state = get();
      if (!state.currentRoundId) return null;

      set({ isProcessing: true });

      try {
        const summary = buildRoundSummary({
          roundId: state.currentRoundId,
          courseId,
          courseName,
          date,
          holeAnalytics: state.holeAnalytics,
          allShots: state.inferredShots,
        });

        const newClubAnalytics = buildClubAnalytics(state.inferredShots);
        await persistClubAnalytics(newClubAnalytics);

        await clearRoundTracker();

        set(prevState => ({
          ...initialState,
          clubAnalytics: newClubAnalytics,
          recentRoundSummaries: [summary, ...prevState.recentRoundSummaries].slice(0, 20),
          isProcessing: false,
        }));

        console.log(
          `[RoundAnalyticsStore] Round ended. ` +
          `Score: ${summary.scoreRelativeToPar >= 0 ? '+' : ''}${summary.scoreRelativeToPar}, ` +
          `GIR: ${(summary.girPercentage * 100).toFixed(0)}%, ` +
          `FIR: ${(summary.fairwayPercentage * 100).toFixed(0)}%, ` +
          `AI compliance: ${(summary.overallComplianceRate * 100).toFixed(0)}%`
        );

        return summary;
      } catch (e: any) {
        set({ isProcessing: false, lastError: e.message });
        console.error('[RoundAnalyticsStore] Error ending round:', e);
        return null;
      }
    },

    loadClubStats: async () => {
      set({ isProcessing: true });
      try {
        const clubAnalytics = await loadClubAnalytics();
        set({ clubAnalytics, isProcessing: false });
      } catch (e: any) {
        set({ isProcessing: false, lastError: e.message });
      }
    },

    loadHistoricalRounds: async () => {
      set({ isProcessing: true });
      try {
        const recentRoundSummaries = await loadRecentRoundSummaries();
        set({ recentRoundSummaries, isProcessing: false });
      } catch (e: any) {
        set({ isProcessing: false, lastError: e.message });
      }
    },

    reset: () => {
      set(initialState);
    },
  })
);
