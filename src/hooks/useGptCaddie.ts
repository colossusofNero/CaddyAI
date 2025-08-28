export function useGptCaddie(app: {
  distance: number;
  q: any;
  env: any;
  setDistance: (n:number)=>void;
  setQ: (u:any)=>void;
  setEnv: (u:any)=>void;
  speak: (s:string)=>void;
  recommend: (s:{distanceToHole:number; q:any; env:any}) => { best:any; backup:any };
  describe: (best?:any, backup?:any, q?:any)=>string;
}) {
  return {
    async interpretAndApply(text: string) {
      const res = await fetch('/api/interpret', {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({ text, state: { distance: app.distance, q: app.q, env: app.env } })
      });
      if (!res.ok) throw new Error(await res.text());
      const { updates, speak } = await res.json();

      let d = app.distance, q = app.q, env = app.env;

      if (updates?.distance != null && Number.isFinite(updates.distance)) {
        d = Math.round(updates.distance);
        app.setDistance(d);
      }
      if (updates?.q) { q = { ...q, ...updates.q }; app.setQ(q); }
      if (updates?.env) { env = { ...env, ...updates.env }; app.setEnv(env); }

      // Optional caddie line from GPT
      if (speak) app.speak(speak);

      // Always read the app's real recommendation using your math
      const { best, backup } = app.recommend({ distanceToHole: d, q, env });
      app.speak(app.describe(best, backup, q));
    }
  };
}