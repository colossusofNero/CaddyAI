// src/components/Controls.tsx
import React, { useState } from 'react';

type HazardType = 'bunker' | 'greenside' | 'water';
type HazardSide = 'left' | 'right' | 'front_left' | 'front_right' | 'back_left' | 'back_right';

interface Hazard {
  type: HazardType;
  side: HazardSide;
  startYds: number;
  clearYds: number;
  risk: number; // 1-5
}

type PPM = Record<string, { carry: number; total: number }>;

type Props = {
  distance: number;
  setDistance: (v: number) => void;
  q: { hazards: Hazard[]; lie: string; stance: string; pinPos: string; requiredShape: string; confidence: number; fairwayWidthAtDriverYds: number | null; };
  setQ: (fn: (prev: any) => any) => void;
  env: { windSpeed: number; windDir: string; temperatureF: number; elevationFt: number; altitudeFt: number; greenFirm: string; };
  setEnv: (fn: (prev: any) => any) => void;

  // NEW: live edit of club distances from active profile
  ppm?: PPM;
  updateClub?: (club: string, spec: Partial<{ carry: number; total: number }>) => void;
};

const numberOr = (v: any, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

export default function Controls({ distance, setDistance, q, setQ, env, setEnv, ppm, updateClub }: Props) {
  const hazards = Array.isArray(q.hazards) ? q.hazards : [];
  const [showClubs, setShowClubs] = useState(false);

  const updateQ = (patch: Partial<typeof q>) => setQ((prev: any) => ({ ...prev, ...patch }));
  const updateHazard = (idx: number, patch: Partial<Hazard>) => {
    setQ((prev: any) => {
      const next = [...(prev.hazards || [])];
      next[idx] = { ...next[idx], ...patch };
      return { ...prev, hazards: next };
    });
  };
  const addHazard = () => {
    setQ((prev: any) => ({
      ...prev,
      hazards: [...(prev.hazards || []), { type: 'bunker', side: 'right', startYds: 250, clearYds: 265, risk: 3 } as Hazard]
    }));
  };
  const removeHazard = (idx: number) => {
    setQ((prev: any) => {
      const next = [...(prev.hazards || [])];
      next.splice(idx, 1);
      return { ...prev, hazards: next };
    });
  };

  return (
    <div className="space-y-6">
      {/* Distance & Environment */}
      <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold mb-3">Shot Setup</h3>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm text-gray-600 dark:text-gray-300">
            Distance to target (yds)
            <input
              type="number"
              value={distance}
              onChange={(e) => setDistance(numberOr(e.target.value, distance))}
              className="mt-1 w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
            />
          </label>

          <label className="text-sm text-gray-600 dark:text-gray-300">
            Lie
            <select
              value={q.lie}
              onChange={(e) => updateQ({ lie: e.target.value })}
              className="mt-1 w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
            >
              <option value="tee">Tee</option>
              <option value="fairway">Fairway</option>
              <option value="light_rough">Light rough</option>
              <option value="heavy_rough">Heavy rough</option>
              <option value="sand">Sand</option>
              <option value="recovery">Recovery</option>
            </select>
          </label>

          <label className="text-sm text-gray-600 dark:text-gray-300">
            Wind speed (mph)
            <input
              type="number"
              value={env.windSpeed}
              onChange={(e) => setEnv((prev: any) => ({ ...prev, windSpeed: numberOr(e.target.value, prev.windSpeed) }))}
              className="mt-1 w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
            />
          </label>

          <label className="text-sm text-gray-600 dark:text-gray-300">
            Wind direction
            <select
              value={env.windDir}
              onChange={(e) => setEnv((prev: any) => ({ ...prev, windDir: e.target.value }))}
              className="mt-1 w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
            >
              <option value="head">Head</option>
              <option value="tail">Tail</option>
              <option value="cross_left">Cross (Left→Right)</option>
              <option value="cross_right">Cross (Right→Left)</option>
            </select>
          </label>

          <label className="text-sm text-gray-600 dark:text-gray-300">
            Elevation change (ft)
            <input
              type="number"
              value={env.elevationFt}
              onChange={(e) => setEnv((prev: any) => ({ ...prev, elevationFt: numberOr(e.target.value, prev.elevationFt) }))}
              className="mt-1 w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
            />
          </label>

          <label className="text-sm text-gray-600 dark:text-gray-300">
            Fairway @ driver (yds)
            <input
              type="number"
              value={q.fairwayWidthAtDriverYds ?? ''}
              onChange={(e) => updateQ({ fairwayWidthAtDriverYds: e.target.value === '' ? null : numberOr(e.target.value, q.fairwayWidthAtDriverYds ?? 0) })}
              placeholder="(optional)"
              className="mt-1 w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
            />
          </label>
        </div>
      </div>

      {/* Hazards */}
      <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">Hazards</h3>
          <button onClick={addHazard} className="px-3 py-1.5 rounded-lg bg-gray-900 text-white text-sm hover:bg-black">
            Add hazard
          </button>
        </div>
        <p className="text-xs text-red-600 dark:text-red-400 mb-3">
          Water is avoid-at-all-cost. The caddie will not recommend shots that land in a water band.
        </p>

        {hazards.length === 0 ? (
          <div className="text-sm text-gray-500 dark:text-gray-400">No hazards added.</div>
        ) : (
          <div className="space-y-3">
            {hazards.map((hz, i) => (
              <div key={i} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end border border-gray-200 dark:border-gray-700 rounded-xl p-3">
                <label className="text-sm text-gray-600 dark:text-gray-300 md:col-span-1">
                  Type
                  <select
                    value={hz.type}
                    onChange={(e) => updateHazard(i, { type: e.target.value as HazardType })}
                    className="mt-1 w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border"
                  >
                    <option value="bunker">Bunker</option>
                    <option value="greenside">Greenside bunker</option>
                    <option value="water">Water</option>
                  </select>
                </label>

                <label className="text-sm text-gray-600 dark:text-gray-300 md:col-span-1">
                  Side
                  <select
                    value={hz.side}
                    onChange={(e) => updateHazard(i, { side: e.target.value as HazardSide })}
                    className="mt-1 w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border"
                  >
                    <option value="left">Left</option>
                    <option value="right">Right</option>
                    <option value="front_left">Front-left</option>
                    <option value="front_right">Front-right</option>
                    <option value="back_left">Back-left</option>
                    <option value="back_right">Back-right</option>
                  </select>
                </label>

                <label className="text-sm text-gray-600 dark:text-gray-300 md:col-span-1">
                  Start (yds)
                  <input
                    type="number"
                    value={hz.startYds}
                    onChange={(e) => updateHazard(i, { startYds: numberOr(e.target.value, hz.startYds) })}
                    className="mt-1 w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border"
                  />
                </label>

                <label className="text-sm text-gray-600 dark:text-gray-300 md:col-span-1">
                  Clear (yds)
                  <input
                    type="number"
                    value={hz.clearYds}
                    onChange={(e) => updateHazard(i, { clearYds: numberOr(e.target.value, hz.clearYds) })}
                    className="mt-1 w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border"
                  />
                </label>

                <label className="text-sm text-gray-600 dark:text-gray-300 md:col-span-1">
                  Risk (1-5)
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={hz.risk}
                    onChange={(e) => updateHazard(i, { risk: Math.max(1, Math.min(5, numberOr(e.target.value, hz.risk))) })}
                    className="mt-1 w-full px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800 border"
                  />
                </label>

                <div className="md:col-span-1 flex md:justify-end">
                  <button onClick={() => removeHazard(i)} className="px-3 py-2 rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300 dark:border-red-900/40">
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Club distances (today) */}
      {ppm && updateClub && (
        <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Club Distances (today)</h3>
            <button
              onClick={() => setShowClubs((s) => !s)}
              className="text-sm px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 border dark:border-gray-700"
            >
              {showClubs ? "Hide" : "Edit"}
            </button>
          </div>
          {showClubs && (
            <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
              {Object.entries(ppm).map(([club, spec]) => (
                <div key={club} className="flex items-center gap-2 border border-gray-200 dark:border-gray-700 rounded-xl p-2">
                  <div className="w-16 font-semibold">{club}</div>
                  <label className="text-xs text-gray-600 dark:text-gray-300">
                    Carry
                    <input
                      type="number"
                      value={spec?.carry ?? 0}
                      onChange={(e) => updateClub(club, { carry: numberOr(e.target.value, spec?.carry ?? 0) })}
                      className="mt-0.5 w-24 px-2 py-1 rounded bg-gray-50 dark:bg-gray-800 border"
                    />
                  </label>
                  <label className="text-xs text-gray-600 dark:text-gray-300">
                    Total
                    <input
                      type="number"
                      value={spec?.total ?? 0}
                      onChange={(e) => updateClub(club, { total: numberOr(e.target.value, spec?.total ?? 0) })}
                      className="mt-0.5 w-24 px-2 py-1 rounded bg-gray-50 dark:bg-gray-800 border"
                    />
                  </label>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
