/**
 * Label Service
 * Reads display strings from Firestore `config/labels` and deep-merges with defaults.
 * Firebase values override defaults, enabling label updates without code deploys.
 */

import { db } from '@/lib/firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { DEFAULT_LABELS, type Labels } from '@/lib/labels/defaults';

type Callback = (labels: Labels) => void;

function deepMerge<T extends object>(base: T, overrides: Partial<T>): T {
  const result = { ...base };
  for (const key in overrides) {
    const val = overrides[key];
    if (val && typeof val === 'object' && !Array.isArray(val) && key in base) {
      (result as any)[key] = deepMerge((base as any)[key], val as any);
    } else if (val !== undefined) {
      (result as any)[key] = val;
    }
  }
  return result;
}

let cachedLabels: Labels = DEFAULT_LABELS;
let initialized = false;
const subscribers = new Set<Callback>();

function notifySubscribers() {
  subscribers.forEach(cb => cb(cachedLabels));
}

/**
 * Initializes the real-time Firestore listener for labels.
 * Called lazily on first use.
 */
function init() {
  if (initialized) return;
  initialized = true;

  if (!db) {
    // Firebase not available — stay with defaults
    return;
  }

  const labelsRef = doc(db, 'config', 'labels');

  onSnapshot(
    labelsRef,
    (snapshot) => {
      if (snapshot.exists()) {
        const firebaseData = snapshot.data() as Partial<Labels>;
        cachedLabels = deepMerge(DEFAULT_LABELS, firebaseData);
      } else {
        cachedLabels = DEFAULT_LABELS;
      }
      notifySubscribers();
    },
    (error) => {
      console.warn('[labelService] Failed to load labels from Firebase, using defaults:', error.message);
      cachedLabels = DEFAULT_LABELS;
      notifySubscribers();
    }
  );
}

/**
 * Returns the current labels (resolved once from cache or Firebase).
 */
export async function getLabels(): Promise<Labels> {
  if (!db) return DEFAULT_LABELS;

  try {
    const labelsRef = doc(db, 'config', 'labels');
    const snapshot = await getDoc(labelsRef);
    if (snapshot.exists()) {
      return deepMerge(DEFAULT_LABELS, snapshot.data() as Partial<Labels>);
    }
  } catch (error: any) {
    console.warn('[labelService] getLabels error, using defaults:', error.message);
  }

  return DEFAULT_LABELS;
}

/**
 * Subscribes to real-time label updates.
 * Callback is invoked immediately with current labels, then on every change.
 * Returns an unsubscribe function.
 */
export function subscribeToLabels(callback: Callback): () => void {
  init();
  subscribers.add(callback);
  // Invoke immediately with current value
  callback(cachedLabels);

  return () => {
    subscribers.delete(callback);
  };
}

export { DEFAULT_LABELS };
