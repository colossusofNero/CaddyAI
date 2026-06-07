/**
 * Mint a custom token, exchange it for an ID token via the Firebase Auth
 * REST API, then hit /api/stripe/subscription so we can see the real error
 * body the dev-server is returning.
 */
import { config } from 'dotenv';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

config({ path: '.env.local' });

const uid = process.argv[2] ?? 'ZOR4qaBeDeUQL9X7bfjUTyaTyIo2';
const BASE = process.env.AUDIT_BASE ?? 'http://localhost:3010';

const sa = process.env.FIREBASE_SERVICE_ACCOUNT;
const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
if (!sa || !apiKey) {
  console.error('Need FIREBASE_SERVICE_ACCOUNT and NEXT_PUBLIC_FIREBASE_API_KEY in .env.local');
  process.exit(1);
}

if (!getApps().length) {
  initializeApp({ credential: cert(JSON.parse(sa)) });
}
const customToken = await getAuth().createCustomToken(uid);

// Exchange the custom token for an ID token via the identitytoolkit REST API.
const exchangeResp = await fetch(
  `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${apiKey}`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: customToken, returnSecureToken: true }),
  }
);
const exchange = await exchangeResp.json();
if (!exchangeResp.ok) {
  console.error('Token exchange failed:', exchange);
  process.exit(2);
}
const idToken = exchange.idToken;
console.log(`[probe] got ID token (len=${idToken.length})`);

// Now hit the API.
const apiResp = await fetch(`${BASE}/api/stripe/subscription?userId=${uid}`, {
  headers: { Authorization: `Bearer ${idToken}` },
});
const text = await apiResp.text();
console.log(`[probe] /api/stripe/subscription → ${apiResp.status}`);
console.log(`[probe] content-type: ${apiResp.headers.get('content-type')}`);
console.log('[probe] body:');
console.log(text.slice(0, 4000));
