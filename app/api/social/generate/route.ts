import { NextRequest, NextResponse } from 'next/server';

const LANGGRAPH_API_URL = process.env.LANGGRAPH_API_URL;

export async function POST(request: NextRequest) {
  if (!LANGGRAPH_API_URL) {
    return NextResponse.json({ error: 'LangGraph API not configured. Set LANGGRAPH_API_URL.' }, { status: 503 });
  }

  const { url } = await request.json();
  if (!url) return NextResponse.json({ error: 'url is required' }, { status: 400 });

  try {
    // Create thread
    const threadRes = await fetch(`${LANGGRAPH_API_URL}/threads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const thread = await threadRes.json();

    // Start run
    const runRes = await fetch(`${LANGGRAPH_API_URL}/threads/${thread.thread_id}/runs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assistant_id: 'generate_post',
        input: { links: [url] },
        config: { configurable: { textOnlyMode: false, skipContentRelevancyCheck: true, skipUsedUrlsCheck: true } },
      }),
    });
    const run = await runRes.json();

    return NextResponse.json({ thread_id: thread.thread_id, run_id: run.run_id, status: run.status });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
