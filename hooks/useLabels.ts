/**
 * useLabels hook
 * Returns Firebase-backed display labels with DEFAULT_LABELS as the initial value.
 * Components render immediately without waiting for Firebase.
 */

'use client';

import { useState, useEffect } from 'react';
import { subscribeToLabels } from '@/services/labelService';
import { DEFAULT_LABELS, type Labels } from '@/lib/labels/defaults';

export function useLabels(): { labels: Labels; loading: boolean } {
  const [labels, setLabels] = useState<Labels>(DEFAULT_LABELS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToLabels((updated) => {
      setLabels(updated);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return { labels, loading };
}
