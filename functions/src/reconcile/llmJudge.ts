import Anthropic from '@anthropic-ai/sdk';
import {
  AgentDecision,
  Confidence,
  ReconcileInputs,
  ReconcileResult,
} from './types';

const MODEL = 'claude-opus-4-7';

const SYSTEM_PROMPT = `You are a golf shot-reconciliation agent. The user calls a club-selection
optimizer multiple times per hole; some calls are real shots, others are exploratory
("what club would I hit if I were over there?"). A deterministic rules engine has
already produced an initial decision for each call. Your job is to resolve cases
where the rules engine's kept count doesn't match the scorecard.

Rules already applied:
1. Wrong tee box — calls within ~5yd of an unselected tee box are dropped.
2. Dense cluster — calls within ~8yd + 90s of each other are collapsed to the latest.
3. Stroke-count target — kept count must equal (strokes - putts).
4. FIR/GIR consistency — calls that contradict the scorecard's lie are dropped.
5. Up-and-down match — calls within ~30yd of green with GIR=no are confirmed.
6. Chain continuity — calls that don't line up with the previous shot's landing
   are flagged low confidence.

Your goal: revise the decisions so the final kept count equals (strokes - putts),
keeping the calls that best match the scorecard narrative. Prefer dropping
exploratory calls over keeping them.

You MUST return a decision for every event id provided. For each kept event,
explain in one short sentence why it survives. For each dropped event, explain
why it was exploratory.`;

const OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    decisions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          eventId: { type: 'string' },
          kept: { type: 'boolean' },
          confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
          reason: { type: 'string' },
        },
        required: ['eventId', 'kept', 'confidence', 'reason'],
        additionalProperties: false,
      },
    },
    summary: { type: 'string' },
  },
  required: ['decisions', 'summary'],
  additionalProperties: false,
} as const;

interface JudgeOutput {
  decisions: Array<{
    eventId: string;
    kept: boolean;
    confidence: Confidence;
    reason: string;
  }>;
  summary: string;
}

// Calls Claude to revise decisions when the rules engine flags ambiguity.
// Returns a new ReconcileResult with the judge's revised decisions, or the
// original result unchanged if the judge call fails.
export async function runLlmJudge(
  inputs: ReconcileInputs,
  rulesResult: ReconcileResult,
  apiKey: string
): Promise<ReconcileResult> {
  if (!apiKey) {
    console.warn('[llmJudge] No API key — skipping');
    return rulesResult;
  }

  const client = new Anthropic({ apiKey });

  const userPrompt = buildUserPrompt(inputs, rulesResult);

  try {
    const response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 4096,
      thinking: { type: 'disabled' },
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
      output_config: {
        format: { type: 'json_schema', schema: OUTPUT_SCHEMA },
      },
    });

    const block = response.content.find(b => b.type === 'text');
    if (!block || block.type !== 'text') {
      console.warn('[llmJudge] No text block in response');
      return rulesResult;
    }

    const parsed = JSON.parse(block.text) as JudgeOutput;

    // Merge: judge's decision wins per event id. Anything the judge doesn't
    // mention falls back to the rules engine's decision.
    const judgeById = new Map(parsed.decisions.map(d => [d.eventId, d]));
    const merged: AgentDecision[] = rulesResult.decisions.map(rd => {
      const j = judgeById.get(rd.eventId);
      if (!j) return rd;
      return {
        eventId: rd.eventId,
        kept: j.kept,
        confidence: j.confidence,
        reason: j.reason,
        // Preserve the rules' ruleId if the rules engine fired, else mark as judge
        ruleId: rd.ruleId || 'llm-judge',
      };
    });

    const actualKept = merged.filter(d => d.kept).length;
    console.log(`[llmJudge] ${parsed.summary}`);

    return {
      decisions: merged,
      expectedKept: rulesResult.expectedKept,
      actualKept,
      needsLlmJudge: false, // judge has run; consumers shouldn't loop
    };
  } catch (err) {
    if (err instanceof Anthropic.APIError) {
      console.error(`[llmJudge] API error ${err.status}: ${err.message}`);
    } else {
      console.error('[llmJudge] Unexpected error:', err);
    }
    return rulesResult;
  }
}

function buildUserPrompt(
  inputs: ReconcileInputs,
  rulesResult: ReconcileResult
): string {
  const { events, scorecard, selectedTeeColor, courseHole } = inputs;
  const decisionById = new Map(rulesResult.decisions.map(d => [d.eventId, d]));

  const lines: string[] = [];
  lines.push(`Hole ${scorecard.holeNumber} — par ${scorecard.par}`);
  lines.push(
    `Scorecard: ${scorecard.strokes} strokes, ${scorecard.putts} putts, FIR=${scorecard.fairwayHit ?? 'unknown'}, GIR=${scorecard.greenInRegulation ?? 'unknown'}`
  );
  lines.push(`Selected tee: ${selectedTeeColor}`);
  lines.push(
    `Expected kept count = strokes - putts = ${rulesResult.expectedKept}`
  );
  lines.push(`Rules engine produced: ${rulesResult.actualKept} kept (mismatch)`);

  if (courseHole?.greenCenter) {
    lines.push(
      `Green center: ${courseHole.greenCenter.latitude.toFixed(5)}, ${courseHole.greenCenter.longitude.toFixed(5)}`
    );
  }
  if (courseHole?.teeBoxes?.length) {
    lines.push(
      'Tee boxes: ' +
        courseHole.teeBoxes
          .map(t => `${t.color} @ ${t.position.latitude.toFixed(5)}, ${t.position.longitude.toFixed(5)}`)
          .join('; ')
    );
  }
  lines.push('');
  lines.push('Events (chronological):');

  for (const e of events) {
    const dec = decisionById.get(e.eventId);
    const gps = e.gpsPosition
      ? `${e.gpsPosition.latitude.toFixed(5)}, ${e.gpsPosition.longitude.toFixed(5)}`
      : 'no gps';
    const lie = (e.payload?.lie as string | undefined) ?? 'unknown';
    const club = (e.payload?.clubConsidered as string | undefined) ?? '';
    const tsOffset = events[0]
      ? Math.round((e.timestamp - events[0].timestamp) / 1000)
      : 0;
    const decStr = dec
      ? `rules: ${dec.kept ? 'KEEP' : 'drop'} (${dec.ruleId || 'no-rule'}) — ${dec.reason || 'no reason'}`
      : 'rules: undecided';
    lines.push(
      `  ${e.eventId} | +${tsOffset}s | gps=${gps} | lie=${lie}${club ? ` | club=${club}` : ''} | ${decStr}`
    );
  }

  lines.push('');
  lines.push(
    `Return a decision for ALL ${events.length} events. Final kept count must equal ${rulesResult.expectedKept}.`
  );

  return lines.join('\n');
}
