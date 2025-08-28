import React from "react";

type Props = {
  distance: number;
  setDistance: (n: number) => void;
  q: any; setQ: (u: any) => void;
  env: any; setEnv: (u: any) => void;
};

function liePenaltyPct(lie: string) {
  switch (lie) {
    case "light_rough": return 0.05;
    case "heavy_rough": return 0.10;
    case "sand": return 0.05;
    case "recovery": return 0.12;
    default: return 0;
  }
}

export default function Controls({ distance, setDistance, q, setQ, env, setEnv }: Props) {
  const liePct = liePenaltyPct(q.lie);
  const clubUp = liePct > 0 ? Math.max(1, Math.round(liePct / 0.08)) : 0;

  return (
    <section className="space-y-4">
      <div className="p-4 bg-white/90 rounded-2xl shadow border">
        <h3 className="font-semibold mb-3">Shot Setup</h3>

        <label className="text-sm font-medium">Distance to Hole (yds)</label>
        <input
          type="number"
          value={distance}
          onChange={(e) => setDistance(parseInt(e.target.value || "0", 10))}
          className="mt-2 w-full rounded-xl border p-2"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
          <div>
            <label className="text-sm font-medium">Lie</label>
            <select
              value={q.lie}
              onChange={(e) => setQ({ ...q, lie: e.target.value })}
              className="mt-2 w-full rounded-xl border p-2"
            >
              <option value="tee">Tee</option>
              <option value="fairway">Fairway</option>
              <option value="light_rough">Light Rough</option>
              <option value="heavy_rough">Heavy Rough</option>
              <option value="sand">Sand</option>
              <option value="recovery">Recovery</option>
            </select>
            {q.lie !== "tee" && q.lie !== "fairway" && (
              <div className="mt-2 text-[12px] text-amber-800 bg-amber-50 rounded-lg p-2">
                Lie effect: −{(liePct * 100).toFixed(0)}% carry. Suggest club up ~{clubUp} club{clubUp>1 ? "s" : ""}.
              </div>
            )}
          </div>

          <div>
            <label className="text-sm font-medium">Stance</label>
            <select
              value={q.stance}
              onChange={(e) => setQ({ ...q, stance: e.target.value })}
              className="mt-2 w-full rounded-xl border p-2"
            >
              <option value="flat">Flat</option>
              <option value="ball_above">Ball Above Feet</option>
              <option value="ball_below">Ball Below Feet</option>
              <option value="uphill">Uphill</option>
              <option value="downhill">Downhill</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Pin Position</label>
            <select
              value={q.pinPos}
              onChange={(e) => setQ({ ...q, pinPos: e.target.value })}
              className="mt-2 w-full rounded-xl border p-2"
            >
              <option value="front">Front</option>
              <option value="middle">Middle</option>
              <option value="back">Back</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Required Shape</label>
            <select
              value={q.requiredShape}
              onChange={(e) => setQ({ ...q, requiredShape: e.target.value })}
              className="mt-2 w-full rounded-xl border p-2"
            >
              <option value="any">Any</option>
              <option value="draw">Draw</option>
              <option value="fade">Fade</option>
              <option value="straight">Straight</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Hazard Risk (1–5)</label>
            <input
              type="range"
              min={1} max={5} value={q.hazardRisk}
              onChange={(e) => setQ({ ...q, hazardRisk: Number(e.target.value) })}
              className="mt-2 w-full"
            />
            <div className="text-xs text-gray-600">Perceived danger: {q.hazardRisk}</div>
          </div>
        </div>
      </div>

      {/* Wind & Conditions */}
      <div className="p-4 bg-white/90 rounded-2xl shadow border">
        <h3 className="font-semibold mb-3">Conditions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-sm font-medium">Wind Speed (mph)</label>
            <input
              type="number"
              value={env.windSpeed}
              onChange={(e) => setEnv({ ...env, windSpeed: parseFloat(e.target.value || "0") })}
              className="mt-2 w-full rounded-xl border p-2"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Wind Direction</label>
            <select
              value={env.windDir}
              onChange={(e) => setEnv({ ...env, windDir: e.target.value })}
              className="mt-2 w-full rounded-xl border p-2"
            >
              <option value="head">Headwind</option>
              <option value="tail">Tailwind</option>
              <option value="cross_left">Cross (L → R)</option>
              <option value="cross_right">Cross (R → L)</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Elevation to Target (ft)</label>
            <input
              type="number"
              value={env.elevationFt}
              onChange={(e) => setEnv({ ...env, elevationFt: parseFloat(e.target.value || "0") })}
              className="mt-2 w-full rounded-xl border p-2"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Air Temp (°F)</label>
            <input
              type="number"
              value={env.temperatureF}
              onChange={(e) => setEnv({ ...env, temperatureF: parseFloat(e.target.value || "0") })}
              className="mt-2 w-full rounded-xl border p-2"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Altitude (ft ASL)</label>
            <input
              type="number"
              value={env.altitudeFt}
              onChange={(e) => setEnv({ ...env, altitudeFt: parseFloat(e.target.value || "0") })}
              className="mt-2 w-full rounded-xl border p-2"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Green Firmness</label>
            <select
              value={env.greenFirm}
              onChange={(e) => setEnv({ ...env, greenFirm: e.target.value })}
              className="mt-2 w-full rounded-xl border p-2"
            >
              <option value="soft">Soft</option>
              <option value="medium">Medium</option>
              <option value="firm">Firm</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tee hazard + fairway geometry (shows mainly for tee shots) */}
      <div className="p-4 bg-white/90 rounded-2xl shadow border">
        <h3 className="font-semibold mb-3">Tee Geometry & Hazards</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-sm font-medium">Hazard Side</label>
            <select
              value={q.hazardSide ?? ""}
              onChange={(e) => setQ({ ...q, hazardSide: (e.target.value || null) })}
              className="mt-2 w-full rounded-xl border p-2"
            >
              <option value="">None</option>
              <option value="left">Left</option>
              <option value="right">Right</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">Hazard Starts (yds)</label>
            <input
              type="number"
              value={q.hazardStartYds ?? ""}
              onChange={(e) => setQ({ ...q, hazardStartYds: e.target.value === "" ? null : parseFloat(e.target.value) })}
              placeholder="e.g., 250"
              className="mt-2 w-full rounded-xl border p-2"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Need to Carry (yds)</label>
            <input
              type="number"
              value={q.hazardClearYds ?? ""}
              onChange={(e) => setQ({ ...q, hazardClearYds: e.target.value === "" ? null : parseFloat(e.target.value) })}
              placeholder="e.g., 265"
              className="mt-2 w-full rounded-xl border p-2"
            />
          </div>
        </div>

        <div className="mt-3">
          <label className="text-sm font-medium">Fairway width at Driver (yds)</label>
          <input
            type="number"
            value={q.fairwayWidthAtDriverYds ?? ""}
            onChange={(e) => setQ({ ...q, fairwayWidthAtDriverYds: e.target.value === "" ? null : parseFloat(e.target.value) })}
            placeholder="e.g., 15"
            className="mt-2 w-full rounded-xl border p-2"
          />
          <div className="text-[11px] text-gray-500 mt-1">
            “The fairway narrows to about 15 yards at my driver length.”
          </div>
        </div>
      </div>
    </section>
  );
}
