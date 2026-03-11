/**
 * useRoundAnalytics Hook
 *
 * Web equivalent of the mobile roundAnalyticsStore.
 *
 * Manages in-memory state for an active round and delegates all
 * Firestore reads/writes to shotAnalyticsService.
 *
 * Usage (mirrors the mobile integration guide exactly):
 *
 *   const { startRound, recordOptimizerRun, recordAIClubSelection,
 *           recordHoleScore, endRound, currentRoundId } = useRoundAnalytics();
 */

'use client';

import { useState, useCallback, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  recordOptimizerRun as svcRecordOptRun,
  recordAIClubSelection as svcRecordSelection,
  saveHoleAnalytics,
  finaliseRound,
  getClubAnalytics,
  getRoundSummaries,
} from '@/lib/api/shotAnalyticsService';
import type {
  RecordOptimizerRunInput,
  RecordHoleScoreInput,
  EndRoundInput,
  RoundAnalyticsEvent,
  RoundSummary,
  ClubAnalytics,
  RoundAnalyticsState,
} from '@/types/shotAnalytics';

export function useRoundAnalytics() {
  const { user } = useAuth();

  // ── In-memory state ─────────────────────────────────────────────────────────
  const [state, setState] = useState<RoundAnalyticsState>({
    currentRoundId: null,
    currentHoleNumber: 1,
    isRoundActive: false,
    optimizerRunsByHole: {},
    aiSelectionsByHole: {},
  });

  // Accumulate raw events in a ref so inference can run without a Firestore read
  const inMemoryEvents = useRef<RoundAnalyticsEvent[]>([]);

  // ── Round lifecycle ─────────────────────────────────────────────────────────

  const startRound = useCallback(
    async (roundId: string) => {
      if (!user) return;
      inMemoryEvents.current = [];
      setState({
        currentRoundId: roundId,
        currentHoleNumber: 1,
        isRoundActive: true,
        optimizerRunsByHole: {},
        aiSelectionsByHole: {},
      });
      console.log('[RoundAnalytics] Round started:', roundId);
    },
    [user]
  );

  const endRound = useCallback(
    async (input: EndRoundInput): Promise<RoundSummary | null> => {
      if (!user || !state.currentRoundId) return null;

      try {
        const summary = await finaliseRound(user.uid, state.currentRoundId, input);

        // Reset state
        inMemoryEvents.current = [];
        setState({
          currentRoundId: null,
          currentHoleNumber: 1,
          isRoundActive: false,
          optimizerRunsByHole: {},
          aiSelectionsByHole: {},
        });

        console.log('[RoundAnalytics] Round ended:', state.currentRoundId);
        return summary;
      } catch (err) {
        console.error('[RoundAnalytics] endRound failed:', err);
        return null;
      }
    },
    [user, state.currentRoundId]
  );

  // ── Event recording ─────────────────────────────────────────────────────────

  const recordOptimizerRun = useCallback(
    async (input: RecordOptimizerRunInput) => {
      if (!user || !state.currentRoundId) {
        console.warn('[RoundAnalytics] recordOptimizerRun: no active round');
        return;
      }

      try {
        await svcRecordOptRun(user.uid, state.currentRoundId, input);

        // Mirror event into in-memory accumulator
        const event: RoundAnalyticsEvent = {
          ...input,
          eventType: 'optimizer_run',
          eventId: `opt_${Date.now()}`,
          roundId: state.currentRoundId,
          userId: user.uid,
          timestamp: { toMillis: () => Date.now(), toDate: () => new Date() } as any,
        };
        inMemoryEvents.current.push(event);

        setState((prev) => ({
          ...prev,
          currentHoleNumber: input.holeNumber,
          optimizerRunsByHole: {
            ...prev.optimizerRunsByHole,
            [input.holeNumber]: [...(prev.optimizerRunsByHole[input.holeNumber] ?? []), event as any],
          },
        }));
      } catch (err) {
        console.error('[RoundAnalytics] recordOptimizerRun failed:', err);
      }
    },
    [user, state.currentRoundId]
  );

  const recordAIClubSelection = useCallback(
    async (selectedClub: string, holeNumber?: number) => {
      if (!user || !state.currentRoundId) {
        console.warn('[RoundAnalytics] recordAIClubSelection: no active round');
        return;
      }

      const hole = holeNumber ?? state.currentHoleNumber;

      try {
        await svcRecordSelection(user.uid, state.currentRoundId, hole, selectedClub);

        const event: RoundAnalyticsEvent = {
          eventType: 'ai_club_selection',
          eventId: `sel_${Date.now()}`,
          roundId: state.currentRoundId,
          userId: user.uid,
          holeNumber: hole,
          timestamp: { toMillis: () => Date.now(), toDate: () => new Date() } as any,
          selectedClub,
        };
        inMemoryEvents.current.push(event);

        setState((prev) => ({
          ...prev,
          aiSelectionsByHole: {
            ...prev.aiSelectionsByHole,
            [hole]: [...(prev.aiSelectionsByHole[hole] ?? []), event as any],
          },
        }));
      } catch (err) {
        console.error('[RoundAnalytics] recordAIClubSelection failed:', err);
      }
    },
    [user, state.currentRoundId, state.currentHoleNumber]
  );

  const recordHoleScore = useCallback(
    async (input: RecordHoleScoreInput) => {
      if (!user || !state.currentRoundId) {
        console.warn('[RoundAnalytics] recordHoleScore: no active round');
        return;
      }

      try {
        const holeAnalytics = await saveHoleAnalytics(
          user.uid,
          state.currentRoundId,
          input,
          inMemoryEvents.current
        );

        console.log(
          `[RoundAnalytics] Hole ${input.holeNumber} saved — ${holeAnalytics.shots.length} shots inferred, compliance ${(holeAnalytics.complianceRate * 100).toFixed(0)}%`
        );

        setState((prev) => ({
          ...prev,
          currentHoleNumber: input.holeNumber + 1,
        }));
      } catch (err) {
        console.error('[RoundAnalytics] recordHoleScore failed:', err);
      }
    },
    [user, state.currentRoundId]
  );

  // ── Read helpers ────────────────────────────────────────────────────────────

  const fetchClubAnalytics = useCallback(async (): Promise<ClubAnalytics[]> => {
    if (!user) return [];
    try {
      return await getClubAnalytics(user.uid);
    } catch (err) {
      console.error('[RoundAnalytics] fetchClubAnalytics failed:', err);
      return [];
    }
  }, [user]);

  const fetchRoundSummaries = useCallback(
    async (limitCount = 20): Promise<RoundSummary[]> => {
      if (!user) return [];
      try {
        return await getRoundSummaries(user.uid, limitCount);
      } catch (err) {
        console.error('[RoundAnalytics] fetchRoundSummaries failed:', err);
        return [];
      }
    },
    [user]
  );

  return {
    // State
    currentRoundId: state.currentRoundId,
    currentHoleNumber: state.currentHoleNumber,
    isRoundActive: state.isRoundActive,

    // Actions (match mobile integration guide API)
    startRound,
    endRound,
    recordOptimizerRun,
    recordAIClubSelection,
    recordHoleScore,

    // Read
    fetchClubAnalytics,
    fetchRoundSummaries,
  };
}
