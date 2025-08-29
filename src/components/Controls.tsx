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
}
