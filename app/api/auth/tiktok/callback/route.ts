import { NextRequest, NextResponse } from 'next/server';

const TIKTOK_CLIENT_KEY = process.env.TIKTOK_CLIENT_KEY!;
const TIKTOK_CLIENT_SECRET = process.env.TIKTOK_CLIENT_SECRET!;
const TIKTOK_REDIRECT_URI = process.env.TIKTOK_REDIRECT_URI || 'https://copperlinegolf.com/auth/tiktok/callback';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error) {
    console.error('[TikTok Auth] Error from TikTok:', error);
    return NextResponse.redirect(new URL('/?tiktok=error', request.url));
  }

  // Verify state cookie (CSRF protection)
  const storedState = request.cookies.get('tiktok_oauth_state')?.value;
  if (!state || state !== storedState) {
    console.error('[TikTok Auth] State mismatch');
    return NextResponse.redirect(new URL('/?tiktok=error', request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL('/?tiktok=error', request.url));
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_key: TIKTOK_CLIENT_KEY,
        client_secret: TIKTOK_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: TIKTOK_REDIRECT_URI,
      }),
    });

    if (!tokenResponse.ok) {
      const err = await tokenResponse.text();
      console.error('[TikTok Auth] Token exchange failed:', err);
      return NextResponse.redirect(new URL('/?tiktok=error', request.url));
    }

    const tokenData = await tokenResponse.json();
    console.log('[TikTok Auth] Token obtained for open_id:', tokenData.open_id);

    // Fetch basic user info
    const userInfoResponse = await fetch(
      'https://open.tiktokapis.com/v2/user/info/?fields=open_id,union_id,avatar_url,display_name',
      { headers: { Authorization: `Bearer ${tokenData.access_token}` } }
    );

    const userInfo = userInfoResponse.ok ? await userInfoResponse.json() : null;
    const displayName = userInfo?.data?.user?.display_name ?? 'Unknown';
    console.log('[TikTok Auth] Authenticated user:', displayName);

    const response = NextResponse.redirect(new URL('/?tiktok=success', request.url));
    response.cookies.delete('tiktok_oauth_state');
    return response;
  } catch (err) {
    console.error('[TikTok Auth] Unexpected error:', err);
    return NextResponse.redirect(new URL('/?tiktok=error', request.url));
  }
}
