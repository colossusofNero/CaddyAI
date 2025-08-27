export const config = { runtime: 'edge' };

type Body = {
  text: string;
  state?: any;
};

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('POST only', { status: 405 });
  }

  const { text, state } = (await req.json()) as Body;

  // JSON schema for structured output
  const schema = {
    name: "CaddieVoiceUpdate",
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        updates: {
          type: "object",
          additionalProperties: false,
          properties: {
            distance: { type: ["number","null"] },
            q: {
              type: "object",
              additionalProperties: false,
              properties: {
                lie: { enum: ["tee","fairway","light_rough","heavy_rough","sand","recovery"] },
                stance: { enum: ["flat","ball_above","ball_below","uphill","downhill"] },
                pinPos: { enum: ["front","middle","back"] },
                hazardRisk: { type: "number", minimum: 1, maximum: 5 },
                requiredShape: { enum: ["any","draw","fade","straight"] },
                confidence: { type: "number", minimum: 1, maximum: 5 },
                fairwayWidthAtDriverYds: { type: ["number","null"] },
                hazardSide: { enum: ["left","right",null] },
                hazardStartYds: { type: ["number","null"] },
                hazardClearYds: { type: ["number","null"] }
              }
            },
            env: {
              type: "object",
              additionalProperties: false,
              properties: {
                windSpeed: { type: "number" },
                windDir: { enum: ["head","tail","cross_left","cross_right"] },
                temperatureF: { type: "number" },
                elevationFt: { type: "number" },
                altitudeFt: { type: "number" },
                greenFirm: { enum: ["soft","medium","firm"] }
              }
            }
          }
        },
        speak: { type: "string" }
      },
      required: ["updates","speak"]
    }
  } as const;

  const sys =
`You are a concise golf caddie. Only output the JSON that matches the schema.
Read free-form speech like: "bunker right at 250, need 265 to clear; fairway 15; what's the play?"
Extract values conservatively. Units: yards for distance, feet for elevation.
If a value isn't present, omit it. "speak" is one short sentence a human caddie would say.`;

  const body = {
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: sys },
      { role: "user", content: text },
      ...(state ? [{ role: "system", content: `context: ${JSON.stringify(state).slice(0, 2000)}` }] : [])
    ],
    response_format: { type: "json_schema", json_schema: schema }
  };

  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY!}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });

  if (!r.ok) {
    const err = await r.text();
    return new Response(JSON.stringify({ error: err }), { status: 500, headers: { "Content-Type": "application/json" } });
  }

  const data = await r.json();
  // Try to read parsed JSON from chat completions API
  let parsed;
  try {
    // First try the structured output
    parsed = data?.choices?.[0]?.message?.parsed;
    
    // If not available, try parsing the content
    if (!parsed && data?.choices?.[0]?.message?.content) {
      parsed = JSON.parse(data.choices[0].message.content);
    }
    
    // Fallback
    if (!parsed) {
      parsed = { updates: {}, speak: "I didn't understand that command." };
    }
  } catch (error) {
    console.error('API parsing error:', error);
    parsed = { updates: {}, speak: "Sorry, I had trouble processing that." };
  }

  console.log('API sending response:', parsed);

  return new Response(JSON.stringify(parsed), { headers: { "Content-Type": "application/json" } });
}