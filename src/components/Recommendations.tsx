import React from "react";

type Eval = {
  club: string;
  aimLateralYds: number;
  targetCarry: number;
  intendedShape: string;
  expStrokes: number;
  leaveYds: number;
  leaveLie: string;
  reasons: string[];
};

type Props = {
  best?: Eval;
  backup?: Eval | null;
  list: Eval[];
  onUseBest?: () => void;
  onUseBackup?: () => void;
};

export default function Recommendations({ best, backup, list, onUseBest, onUseBackup }: Props) {
  return (
    <section className="space-y-4">
      <div className="p-4 bg-gradient-to-br from-emerald-50 to-white rounded-2xl shadow border">
        <h2 className="text-lg font-semibold mb-3">Your Caddie Says</h2>

        {(best || backup) ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {best && (
              <div className="p-4 rounded-xl bg-white shadow-inner border">
                <div className="text-xs uppercase tracking-wide text-emerald-600">Primary</div>
                <div className="text-3xl font-bold text-emerald-700">{best.club}</div>
                <div className="mt-1 text-gray-700">
                  Aim: {best.aimLateralYds > 0 ? `${Math.abs(best.aimLateralYds)}y R` : best.aimLateralYds < 0 ? `${Math.abs(best.aimLateralYds)}y L` : "Center"}
                </div>
                <div className="text-gray-700">Target carry: {best.targetCarry.toFixed(0)} yds</div>
                <div className="text-gray-700">Shape: {best.intendedShape}</div>
                <div className="mt-2 text-gray-500">E[strokes]: {best.expStrokes.toFixed(2)}</div>
                <ul className="list-disc list-inside text-gray-600 space-y-1 mt-2">
                  {best.reasons?.length ? best.reasons.map((r, i) => (<li key={i}>{r}</li>)) : <li>Optimal expected leave & risk balance</li>}
                </ul>
                {onUseBest && (
                  <button onClick={onUseBest} className="mt-3 px-3 py-2 rounded-xl bg-emerald-600 text-white shadow hover:bg-emerald-700">
                    Use Primary → Next shot
                  </button>
                )}
              </div>
            )}
            {backup && (
              <div className="p-4 rounded-xl bg-white shadow-inner border">
                <div className="text-xs uppercase tracking-wide text-gray-500">Backup</div>
                <div className="text-3xl font-bold text-gray-800">{backup.club}</div>
                <div className="mt-1 text-gray-700">
                  Aim: {backup.aimLateralYds > 0 ? `${Math.abs(backup.aimLateralYds)}y R` : backup.aimLateralYds < 0 ? `${Math.abs(backup.aimLateralYds)}y L` : "Center"}
                </div>
                <div className="text-gray-700">Target carry: {backup.targetCarry.toFixed(0)} yds</div>
                <div className="text-gray-700">Shape: {backup.intendedShape}</div>
                <div className="mt-2 text-gray-500">E[strokes]: {backup.expStrokes.toFixed(2)}</div>
                <ul className="list-disc list-inside text-gray-600 space-y-1 mt-2">
                  {backup.reasons?.length ? backup.reasons.map((r, i) => (<li key={i}>{r}</li>)) : <li>Solid alternative if conditions change</li>}
                </ul>
                {onUseBackup && (
                  <button onClick={onUseBackup} className="mt-3 px-3 py-2 rounded-xl bg-gray-700 text-white shadow hover:bg-gray-800">
                    Use Backup → Next shot
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-gray-600">No feasible plan; consider laying up aggressively.</div>
        )}
      </div>

      <div className="p-4 bg-white/90 rounded-2xl shadow border">
        <h3 className="font-semibold mb-2">Other Good Options</h3>
        <div className="space-y-2">
          {list.slice(2, 6).map((t, i) => (
            <div key={i} className="p-3 rounded-xl bg-gray-50 border">
              <div className="flex justify-between text-sm">
                <div className="font-medium">{i + 3}. {t.club}</div>
                <div className="text-gray-600">E: {t.expStrokes.toFixed(2)}</div>
              </div>
              <div className="text-xs text-gray-600">
                carry {t.targetCarry.toFixed(0)}y · {t.intendedShape} · aim {t.aimLateralYds === 0 ? "center" : `${t.aimLateralYds>0?"+":""}${t.aimLateralYds}y`}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
