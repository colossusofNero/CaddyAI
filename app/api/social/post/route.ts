import { NextRequest, NextResponse } from 'next/server';

const SOCIAL_API_URL = process.env.SOCIAL_API_URL || 'https://copperline-social-api.vercel.app';
const SOCIAL_API_KEY = process.env.SOCIAL_API_KEY!;

export async function POST(request: NextRequest) {
  if (!SOCIAL_API_KEY) {
    return NextResponse.json({ error: 'Social API not configured' }, { status: 500 });
  }

  const body = await request.json();

  const response = await fetch(`${SOCIAL_API_URL}/api/post`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': SOCIAL_API_KEY,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();
  return NextResponse.json(data, { status: response.ok ? 200 : response.status });
}
