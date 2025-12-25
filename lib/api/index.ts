/**
 * Copperline Golf API
 * Centralized exports for all API modules
 */

// Type exports
export * from './types';

// API modules
export { clubsApi } from './clubs';
export { roundsApi } from './rounds';
export { coursesApi } from './courses';
export { syncManager } from './sync';
export { realtimeManager } from './realtime';

// Real-time subscriptions
export {
  subscribeToActiveGolfersCount,
  subscribeToOnlineGolfersAtCourse,
  subscribeToActiveRound,
  subscribeToCoursReounds,
  updateLastActivity,
} from './realtime';

// Base client utilities
export { ApiClient, createOptimisticUpdate, debounce } from './client';
