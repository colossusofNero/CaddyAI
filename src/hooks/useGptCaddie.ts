export function useGptCaddie(appState: {
  distance: number;
  q: any;
  env: any;
  setDistance: (n: number) => void;
  setQ: (u: any) => void;
  setEnv: (u: any) => void;
  speak: (s: string) => void;
}) {
  return {
    async interpretAndApply(text: string) {
      const res = await fetch('/api/interpret', {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({
          text,
          state: { distance: appState.distance, q: appState.q, env: appState.env }
        })
      });
      if (!res.ok) throw new Error(await res.text());
      const { updates, speak } = await res.json();

      if (updates?.distance != null && Number.isFinite(updates.distance)) {
        appState.setDistance(Math.round(updates.distance));
      }
      if (updates?.q) {
        appState.setQ({ ...appState.q, ...updates.q });
      }
      if (updates?.env) {
        appState.setEnv({ ...appState.env, ...updates.env });
      }
      if (speak) appState.speak(speak);
    }
  };
}