import { useEffect, useState } from "react";

const isBrowser = typeof window !== "undefined";

function readStorage<T>(key: string, initialValue: T): T {
  if (!isBrowser) return initialValue;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return initialValue;
    // Try JSON first, fall back to raw string (handles legacy "light"/"dark")
    try {
      return JSON.parse(raw) as T;
    } catch {
      return (raw as unknown) as T;
    }
  } catch {
    return initialValue;
  }
}

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [state, setState] = useState<T>(() => readStorage<T>(key, initialValue));

  // write-through
  useEffect(() => {
    if (!isBrowser) return;
    try {
      const value = state as unknown;
      const toWrite =
        typeof value === "string" ? (value as string) : JSON.stringify(value);
      window.localStorage.setItem(key, toWrite);
    } catch {
      /* ignore quota/security errors */
    }
  }, [key, state]);

  // optional: cross-tab sync
  useEffect(() => {
    if (!isBrowser) return;
    const onStorage = (e: StorageEvent) => {
      if (e.key !== key) return;
      setState(prev => readStorage<T>(key, prev));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [key]);

  return [state, setState] as const;
}
