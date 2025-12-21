/**
 * iGolf HMAC Signature Generation API Route
 *
 * Server-side signature generation to protect the secret key.
 * Clients call this endpoint to get a valid signature for iGolf API requests.
 *
 * Authentication Flow:
 * 1. Client requests signature with action name
 * 2. Server generates Unix timestamp
 * 3. Server creates signature string: action + apiKey + timestamp + secretKey
 * 4. Server computes HMAC-SHA256 hash
 * 5. Server returns: signature + apiKey + timestamp
 * 6. Client constructs iGolf API URL with returned values
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * Rate limiting cache (in-memory)
 * In production, use Redis or similar
 */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 60; // 60 requests per minute

/**
 * Simple rate limiting
 */
function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const limit = rateLimitMap.get(identifier);

  if (!limit || now > limit.resetAt) {
    rateLimitMap.set(identifier, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (limit.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }

  limit.count++;
  return true;
}

/**
 * Generate HMAC-SHA256 signature for iGolf API
 */
function generateSignature(action: string, apiKey: string, timestamp: number, secretKey: string): string {
  const signatureString = `${action}${apiKey}${timestamp}${secretKey}`;
  return crypto.createHmac('sha256', secretKey).update(signatureString).digest('hex');
}

/**
 * POST /api/igolf/signature
 *
 * Request body:
 * {
 *   "action": "CourseList" | "CourseDetails" | "StateList" | "CountryList"
 * }
 *
 * Response:
 * {
 *   "signature": "abc123...",
 *   "apiKey": "your-api-key",
 *   "timestamp": 1234567890
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Check if iGolf is enabled
    const igolfEnabled = process.env.NEXT_PUBLIC_IGOLF_ENABLED === 'true';
    if (!igolfEnabled) {
      return NextResponse.json(
        { error: 'iGolf integration is not enabled' },
        { status: 503 }
      );
    }

    // Validate environment variables
    const apiKey = process.env.NEXT_PUBLIC_IGOLF_API_KEY;
    const secretKey = process.env.IGOLF_SECRET_KEY;

    if (!apiKey || !secretKey) {
      console.error('iGolf API credentials not configured');
      return NextResponse.json(
        { error: 'iGolf API credentials not configured' },
        { status: 500 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { action } = body;

    // Validate action
    const validActions = ['CourseList', 'CourseDetails', 'StateList', 'CountryList'];
    if (!action || !validActions.includes(action)) {
      return NextResponse.json(
        { error: `Invalid action. Must be one of: ${validActions.join(', ')}` },
        { status: 400 }
      );
    }

    // Rate limiting (by IP address)
    const clientIp = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(clientIp)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    // Generate timestamp
    const timestamp = Math.floor(Date.now() / 1000);

    // Generate HMAC-SHA256 signature
    const signature = generateSignature(action, apiKey, timestamp, secretKey);

    // Return signature + apiKey (never return secretKey)
    return NextResponse.json({
      signature,
      apiKey,
      timestamp,
    });
  } catch (error) {
    console.error('Error generating iGolf signature:', error);
    return NextResponse.json(
      { error: 'Failed to generate signature' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/igolf/signature
 * Not allowed - only POST is supported
 */
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST with action in request body.' },
    { status: 405 }
  );
}
