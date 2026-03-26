import { NextRequest, NextResponse } from 'next/server';

const TIKTOK_CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY!;
const TIKTOK_REDIRECT_URI = process.env.TIKTOK_REDIRECT_URI || 'https://copperlinegolf.com/auth/tiktok/callback';

export async function GET(request: NextRequest) {
  if (!TIKTOK_CLIENT_KEY) {
    return NextResponse.json({ error: 'TikTok not configured' }, { status: 500 });
  }

  const state = Math.random().toString(36).substring(2, 18);

  const authUrl = new URL('https://www.tiktok.com/v2/auth/authorize/');
  authUrl.searchParams.set('client_key', TIKTOK_CLIENT_KEY);
  authUrl.searchParams.set('redirect_uri', TIKTOK_REDIRECT_URI);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'user.info.basic,video.upload,video.publish');
  authUrl.searchParams.set('state', state);

  const response = NextResponse.redirect(authUrl.toString());
  response.cookies.set('tiktok_oauth_state', state, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  });

  return response;
}
