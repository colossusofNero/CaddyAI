import { NextRequest, NextResponse } from 'next/server';

const LINKEDIN_CLIENT_ID = process.env.LINKEDIN_CLIENT_ID!;
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET!;
const REDIRECT_URI = 'https://copperlinegolf.com/api/auth/linkedin/callback';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error) {
    return new NextResponse(`<html><body style="font-family:monospace;background:#0f1117;color:#f87171;padding:2rem">
      <h2>LinkedIn Auth Error</h2><p>${error}</p>
    </body></html>`, { headers: { 'Content-Type': 'text/html' } });
  }

  const storedState = request.cookies.get('linkedin_oauth_state')?.value;
  if (!state || state !== storedState) {
    return new NextResponse(`<html><body style="font-family:monospace;background:#0f1117;color:#f87171;padding:2rem">
      <h2>State mismatch — possible CSRF</h2>
    </body></html>`, { headers: { 'Content-Type': 'text/html' } });
  }

  if (!code) {
    return new NextResponse(`<html><body style="font-family:monospace;background:#0f1117;color:#f87171;padding:2rem">
      <h2>No code returned from LinkedIn</h2>
    </body></html>`, { headers: { 'Content-Type': 'text/html' } });
  }

  const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      client_id: LINKEDIN_CLIENT_ID,
      client_secret: LINKEDIN_CLIENT_SECRET,
    }),
  });

  if (!tokenResponse.ok) {
    const err = await tokenResponse.text();
    return new NextResponse(`<html><body style="font-family:monospace;background:#0f1117;color:#f87171;padding:2rem">
      <h2>Token exchange failed</h2><pre>${err}</pre>
    </body></html>`, { headers: { 'Content-Type': 'text/html' } });
  }

  const tokenData = await tokenResponse.json();
  const accessToken = tokenData.access_token;
  const expiresIn = tokenData.expires_in;
  const expiryDays = Math.floor(expiresIn / 86400);

  // Fetch person ID
  let personId = 'unknown';
  try {
    const meRes = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (meRes.ok) {
      const me = await meRes.json();
      personId = me.sub ?? 'unknown';
    }
  } catch {}

  const response = new NextResponse(`<html>
<head><title>LinkedIn Auth — Copperline Golf</title></head>
<body style="font-family:monospace;background:#0f1117;color:#e8e8e8;padding:2rem;max-width:800px">
  <h2 style="color:#4ade80">✅ LinkedIn Auth Successful</h2>
  <p style="color:#9ca3af">Copy these values into Render → copperline-social-api → Environment Variables</p>

  <div style="margin:1.5rem 0">
    <div style="color:#9ca3af;font-size:0.85rem;margin-bottom:0.25rem">LINKEDIN_ACCESS_TOKEN</div>
    <div style="background:#1a1d27;border:1px solid #2a2d3a;border-radius:8px;padding:1rem;color:#67e8f9;word-break:break-all;cursor:pointer"
         onclick="navigator.clipboard.writeText('${accessToken}');this.style.borderColor='#4ade80'"
         title="Click to copy">${accessToken}</div>
  </div>

  <div style="margin:1.5rem 0">
    <div style="color:#9ca3af;font-size:0.85rem;margin-bottom:0.25rem">LINKEDIN_PERSON_URN (just the ID)</div>
    <div style="background:#1a1d27;border:1px solid #2a2d3a;border-radius:8px;padding:1rem;color:#67e8f9;cursor:pointer"
         onclick="navigator.clipboard.writeText('${personId}');this.style.borderColor='#4ade80'"
         title="Click to copy">${personId}</div>
  </div>

  <p style="color:#fbbf24">⏱ Token expires in ${expiryDays} days — bookmark <a href="https://copperlinegolf.com/api/auth/linkedin/login" style="color:#67e8f9">copperlinegolf.com/api/auth/linkedin/login</a> to refresh it</p>
  <p style="color:#6b7280;font-size:0.8rem">After updating Render, trigger a redeploy for the new token to take effect.</p>
</body></html>`, { headers: { 'Content-Type': 'text/html' } });

  response.cookies.delete('linkedin_oauth_state');
  return response;
}
