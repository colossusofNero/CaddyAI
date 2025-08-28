// src/hooks/usePlayerProfiles.ts
import { useEffect, useMemo, useState } from "react";

export type Handed = "right" | "left";
export type ShotShape = "draw" | "fade" | "straight";
export type Flight = "low" | "mid" | "high";

export type ClubSpec = { carry: number; total: number };
export type PPM = Record<string, ClubSpec>;

export type PlayerProfile = {
  id: string;
  name: string;
  handed: Handed;
  shotShape: ShotShape;
  flight: Flight;
  handicap: number;
  ppm: PPM;
};

const STORAGE_KEY = "caddie_profiles_v1";
const STORAGE_CURRENT_KEY = "caddie_current_profile_v1";

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function uuid() {
  // lightweight id
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const defaultPPM: PPM = {
  Driver: { carry: 245, total: 265 },
  "3w": { carry: 225, total: 240 },
  "5w": { carry: 210, total: 225 },
  "4i": { carry: 190, total: 195 },
  "5i": { carry: 175, total: 180 },
  "6i": { carry: 160, total: 165 },
  "7i": { carry: 145, total: 150 },
  "8i": { carry: 130, total: 135 },
  "9i": { carry: 115, total: 120 },
  PW: { carry: 100, total: 105 },
  GW: { carry: 85, total: 90 },
  SW: { carry: 70, total: 75 },
  LW: { carry: 55, total: 60 },
};

const defaultProfile: PlayerProfile = {
  id: uuid(),
  name: "My Profile",
  handed: "right",
  shotShape: "straight",
  flight: "mid",
  handicap: 10,
  ppm: defaultPPM,
};

export function usePlayerProfiles() {
  const [profiles, setProfiles] = useState<PlayerProfile[]>(() =>
    safeParse<PlayerProfile[]>(
      typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null,
      [defaultProfile]
    )
  );

  const [currentId, setCurrentId] = useState<string>(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(STORAGE_CURRENT_KEY) : null;
    const parsed = saved ?? "";
    const exists = profiles.find((p) => p.id === parsed);
    return exists ? parsed : profiles[0]?.id;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
  }, [profiles]);

  useEffect(() => {
    if (currentId) localStorage.setItem(STORAGE_CURRENT_KEY, currentId);
  }, [currentId]);

  const current = useMemo(
    () => profiles.find((p) => p.id === currentId) ?? profiles[0],
    [profiles, currentId]
  );

  function selectProfile(id: string) {
    if (profiles.find((p) => p.id === id)) setCurrentId(id);
  }

  function createProfile(template?: Partial<PlayerProfile>) {
    const p: PlayerProfile = {
      ...defaultProfile,
      id: uuid(),
      name: template?.name || `Profile ${profiles.length + 1}`,
      handed: template?.handed ?? defaultProfile.handed,
      shotShape: template?.shotShape ?? defaultProfile.shotShape,
      flight: template?.flight ?? defaultProfile.flight,
      handicap: template?.handicap ?? defaultProfile.handicap,
      ppm: template?.ppm ?? defaultPPM,
    };
    setProfiles((prev) => [p, ...prev]);
    setCurrentId(p.id);
    return p.id;
  }

  function deleteProfile(id: string) {
    setProfiles((prev) => prev.filter((p) => p.id !== id));
    if (currentId === id) {
      const remaining = profiles.filter((p) => p.id !== id);
      setCurrentId(remaining[0]?.id || "");
    }
  }

  function updateProfile(patch: Partial<PlayerProfile>) {
    if (!current) return;
    setProfiles((prev) =>
      prev.map((p) => (p.id === current.id ? { ...p, ...patch, id: p.id } : p))
    );
  }

  function updateClub(club: string, spec: Partial<ClubSpec>) {
    if (!current) return;
    setProfiles((prev) =>
      prev.map((p) =>
        p.id === current.id
          ? { ...p, ppm: { ...p.ppm, [club]: { ...p.ppm[club], ...spec } } }
          : p
      )
    );
  }

  function setPPM(next: PPM) {
    updateProfile({ ppm: next });
  }

  return {
    profiles,
    current,
    currentId,
    selectProfile,
    createProfile,
    deleteProfile,
    updateProfile,
    updateClub,
    setPPM,
  };
}
