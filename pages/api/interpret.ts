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
            course: {
              type: "object",
              additionalProperties: false,
              properties: {
                distanceToHole: { type: ["number","null"] },
                lie: { enum: ["tee","fairway","light_rough","heavy_rough","sand","recovery"] },
                stance: { enum: ["flat","ball_above","ball_below","uphill","downhill"] },
                pinPos: { enum: ["front","middle","back"] },
                fairwayWidth: { type: ["number","null"] },
                temperature: { type: ["number","null"] },
                elevation: { type: ["number","null"] },
                altitude: { type: ["number","null"] }
              }
            },
            env: {
              type: "object",
              additionalProperties: false,
              properties: {
                windSpeed: { type: "number" },
                windDir: { enum: ["head","tail","cross_L_to_R","cross_R_to_L"] }
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
`You are a golf caddie assistant. Parse voice commands and extract golf course information.

Examples:
- "Distance 125" → set distance to 125 yards
- "275 yards" → set distance to 275 yards  
- "Fairway width 15" → set fairway width to 15 yards
- "Wind 10 mph headwind" → set wind speed 10, direction head
- "Bunker right at 250" → add hazard info

For distance commands, put the number in BOTH "distance" and "course.distanceToHole".
Always provide a short, helpful response in "speak".
Only include fields that are mentioned. Units: yards for distance, mph for wind.`;

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
  
  console.log('OpenAI API response:', JSON.stringify(data, null, 2));
  
  let parsed;
  try {
    parsed = data?.choices?.[0]?.message?.parsed;
    if (!parsed && data?.choices?.[0]?.message?.content) {
      parsed = JSON.parse(data.choices[0].message.content);
    }
    if (!parsed) {
      throw new Error('No parsed response');
    }
  } catch (error) {
    console.error('OpenAI parsing error:', error);
    
    // Simple fallback for distance commands
    const distanceMatch = text.toLowerCase().match(/(?:distance|yards?)\s*(\d+)/);
    if (distanceMatch) {
      const distance = parseInt(distanceMatch[1]);
      parsed = {
        updates: {
          distance: distance,
          course: { distanceToHole: distance }
        },
        speak: `Got it, ${distance} yards to the pin.`
      };
    } else {
      parsed = { 
        updates: {}, 
        speak: "I didn't catch that. Try saying 'Distance 125' or 'Fairway width 15'." 
      };
    }
  }

  console.log('API sending response:', parsed);

  return new Response(JSON.stringify(parsed), { headers: { "Content-Type": "application/json" } });
}