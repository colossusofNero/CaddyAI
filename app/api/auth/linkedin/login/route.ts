import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'crypto';

const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID!;
const REDIRECT_URI = 'https://copperlinegolf.com/api/auth/linkedin/callback';

export async function GET(request: NextRequest) {
  const state = randomBytes(16).toString('hex');

  const authUrl = new URL('https://www.linkedin.com/oauth/v2/authorization');
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', LINKEDIN_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('scope', 'openid profile email w_member_social w_organization_social');

  const response = NextResponse.redirect(authUrl.toString());
  response.cookies.set('linkedin_oauth_state', state, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 600,
  });
  return response;
}
