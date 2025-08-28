import type { VercelRequest, VercelResponse } from '@vercel/node';

const SYSTEM_PROMPT = `
You are a concise golf caddie that ONLY returns JSON: { "updates": {...}, "speak": "..." }.
Extract variables from free speech (yards, elevation feet). If not said, omit.
updates.distance (yards, number)
updates.q.{ lie, stance, pinPos, hazardRisk, requiredShape, confidence, fairwayWidthAtDriverYds, hazardSide, hazardStartYds, hazardClearYds }
  lie: tee|fairway|light_rough|heavy_rough|sand|recovery
  stance: flat|ball_above|ball_below|uphill|downhill
  pinPos: front|middle|back
  requiredShape: any|draw|fade|straight
  hazardSide: left|right|null
updates.env.{ windSpeed, windDir, temperatureF, elevationFt, altitudeFt, greenFirm }
  windDir: head|tail|cross_left|cross_right
  greenFirm: soft|medium|firm
"speak" is one short, human caddie sentence.

Example:
"bunker right at 250, need 265 to clear; fairway 15"
=> {"updates":{"q":{"hazardSide":"right","hazardStartYds":250,"hazardClearYds":265,"fairwayWidthAtDriverYds":15}},"speak":"Right bunker 250–265, fairway tight at driver."}
Return ONLY JSON.
`;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).send('POST only');
  const { text, state } = (req.body ?? {}) as { text?: string; state?: any };
  if (!text) return res.status(400).json({ error: 'Missing text' });

  try {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...(state ? [{ role: 'system', content: `context: ${JSON.stringify(state).slice(0,2000)}` }] : []),
          { role: 'user', content: text }
        ]
      })
    });

    const data = await r.json();
    const raw = data?.choices?.[0]?.message?.content ?? '{}';
    let parsed: any;
    try { parsed = JSON.parse(raw); } catch {
      parsed = safeJson(raw) ?? { updates: {}, speak: '' };
    }
    return res.status(200).json(parsed);
  } catch (err: any) {
    return res.status(500).json({ error: String(err?.message || err) });
  }
}

function safeJson(s: string) {
  const m = s.match(/\{[\s\S]*\}$/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch { return null; }
}