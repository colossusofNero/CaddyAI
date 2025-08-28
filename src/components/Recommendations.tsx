import React from "react";

type Eval = {
  club?: string;
  carry?: number;
  expectedStrokes?: number;
  leaveYds?: number;
  notes?: string[];
};

type Props = {
  best?: Eval;
  backup?: Eval;
  list: Eval[];
  onUseBest?: () => void;
  onUseBackup?: () => void;
};

const fmt = (n: unknown, digits = 0) =>
  typeof n === "number" && Number.isFinite(n) ? n.toFixed(digits) : "—";

export default function Recommendations({ best, backup, list, onUseBest, onUseBackup }: Props) {
  return (
    <section className="space-y-4">
      <div className="p-4 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-900/10 dark:to-transparent rounded-2xl shadow border border-emerald-200 dark:border-emerald-900/40">
        <h2 className="text-lg font-semibold mb-3 text-emerald-900 dark:text-emerald-200">Your Caddie Says</h2>

        {(best || backup) ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {best && (
              <div className="p-4 rounded-xl bg-white dark:bg-gray-900 shadow-inner border border-gray-200 dark:border-gray-700">
                <div className="text-xs uppercase tracking-wide text-emerald-600 dark:text-emerald-400">Primary</div>
                <div className="text-3xl font-bold text-emerald-700 dark:text-emerald-300">{best.club ?? "—"}</div>
                <div className="mt-1 text-gray-700 dark:text-gray-300">Target carry: {fmt(best.carry)} yds</div>
                <div className="text-gray-700 dark:text-gray-300">Projected leave: {fmt(best.leaveYds)} yds</div>
                <div className="mt-2 text-gray-500 dark:text-gray-400">E[strokes]: {fmt(best.expectedStrokes, 2)}</div>
                {!!best.notes?.length && (
                  <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1 mt-2">
                    {best.notes.map((r, i) => (<li key={i}>{r}</li>))}
                  </ul>
                )}
                {onUseBest && (
                  <button onClick={onUseBest} className="mt-3 px-3 py-2 rounded-xl bg-emerald-600 text-white shadow hover:bg-emerald-700">
                    Use Primary → Next shot
                  </button>
                )}
              </div>
            )}
            {backup && (
              <div className="p-4 rounded-xl bg-white dark:bg-gray-900 shadow-inner border border-gray-200 dark:border-gray-700">
                <div className="text-xs uppercase tracking-wide text-gray-500">Backup</div>
                <div className="text-3xl font-bold text-gray-800 dark:text-gray-200">{backup.club ?? "—"}</div>
                <div className="mt-1 text-gray-700 dark:text-gray-300">Target carry: {fmt(backup.carry)} yds</div>
                <div className="text-gray-700 dark:text-gray-300">Projected leave: {fmt(backup.leaveYds)} yds</div>
                <div className="mt-2 text-gray-500 dark:text-gray-400">E[strokes]: {fmt(backup.expectedStrokes, 2)}</div>
                {!!backup.notes?.length && (
                  <ul className="list-disc list-inside text-gray-600 dark:text-gray-400 space-y-1 mt-2">
                    {backup.notes.map((r, i) => (<li key={i}>{r}</li>))}
                  </ul>
                )}
                {onUseBackup && (
                  <button onClick={onUseBackup} className="mt-3 px-3 py-2 rounded-xl bg-gray-700 text-white shadow hover:bg-gray-800">
                    Use Backup → Next shot
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-gray-600 dark:text-gray-400">No feasible plan; consider laying up aggressively.</div>
        )}
      </div>

      <div className="p-4 bg-white/90 dark:bg-gray-900 rounded-2xl shadow border border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Other Good Options</h3>
        <div className="space-y-2">
          {(list ?? []).slice(2, 6).map((t, i) => (
            <div key={i} className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between text-sm">
                <div className="font-medium text-gray-800 dark:text-gray-200">{i + 3}. {t.club ?? "—"}</div>
                <div className="text-gray-600 dark:text-gray-400">E: {fmt(t.expectedStrokes, 2)}</div>
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                carry {fmt(t.carry)}y · leave {fmt(t.leaveYds)}y
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
