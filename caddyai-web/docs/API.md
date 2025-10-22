# CaddyAI API Documentation

> Complete API reference for the CaddyAI Web Application

**Version**: 1.0.0
**Base URL**: `https://caddyai.com/api`
**Authentication**: Firebase Auth Required

---

## Table of Contents

- [Authentication](#authentication)
- [Users API](#users-api)
- [Clubs API](#clubs-api)
- [Courses API](#courses-api)
- [Rounds API](#rounds-api)
- [Weather API](#weather-api)
- [Recommendations API](#recommendations-api)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)

---

## Authentication

All API requests require authentication using Firebase Auth tokens.

### Getting an Auth Token

```typescript
import { auth } from '@/lib/firebase';

// Get current user token
const token = await auth.currentUser?.getIdToken();

// Use in API requests
const response = await fetch('/api/endpoint', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

### Auth Endpoints

#### POST `/api/auth/login`
Login with email and password.

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response**:
```json
{
  "user": {
    "uid": "abc123",
    "email": "user@example.com",
    "displayName": "John Doe"
  },
  "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### POST `/api/auth/logout`
Logout current user.

**Response**:
```json
{
  "message": "Successfully logged out"
}
```

---

## Users API

### GET `/api/users/me`
Get current user profile.

**Response**:
```json
{
  "uid": "abc123",
  "email": "user@example.com",
  "profile": {
    "hand": "right",
    "handicap": 15,
    "shotShape": "straight",
    "height": "5'10\"",
    "curve": "slight",
    "yearsPlaying": 5,
    "frequency": "weekly",
    "avgDriveDistance": 250,
    "strengths": ["driving", "approach"],
    "goals": "Lower handicap to 10"
  },
  "createdAt": "2025-01-01T00:00:00Z",
  "lastActive": "2025-10-21T15:30:00Z"
}
```

### PUT `/api/users/me`
Update current user profile.

**Request Body**:
```json
{
  "profile": {
    "handicap": 14,
    "avgDriveDistance": 260,
    "goals": "Lower handicap to 8"
  }
}
```

**Response**:
```json
{
  "message": "Profile updated successfully",
  "profile": { /* updated profile */ }
}
```

### DELETE `/api/users/me`
Delete current user account.

**Response**:
```json
{
  "message": "Account deleted successfully"
}
```

---

## Clubs API

### GET `/api/clubs`
Get all clubs for current user.

**Response**:
```json
{
  "clubs": [
    {
      "id": "club123",
      "type": "driver",
      "name": "TaylorMade Driver",
      "distance": 250,
      "takeback": "full",
      "faceAngle": "square",
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-10-21T15:30:00Z"
    },
    {
      "id": "club124",
      "type": "7iron",
      "name": "Titleist 7-Iron",
      "distance": 150,
      "takeback": "three-quarter",
      "faceAngle": "slightly-open",
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-10-21T15:30:00Z"
    }
  ],
  "count": 14
}
```

### POST `/api/clubs`
Add a new club.

**Request Body**:
```json
{
  "type": "7iron",
  "name": "Titleist 7-Iron",
  "distance": 150,
  "takeback": "full",
  "faceAngle": "square"
}
```

**Response**:
```json
{
  "message": "Club added successfully",
  "club": {
    "id": "club125",
    /* club details */
  }
}
```

### PUT `/api/clubs/:clubId`
Update a club.

**Request Body**:
```json
{
  "distance": 155,
  "takeback": "three-quarter"
}
```

**Response**:
```json
{
  "message": "Club updated successfully",
  "club": { /* updated club */ }
}
```

### DELETE `/api/clubs/:clubId`
Delete a club.

**Response**:
```json
{
  "message": "Club deleted successfully"
}
```

---

## Courses API

### GET `/api/courses/search`
Search for golf courses.

**Query Parameters**:
- `q` (string): Search query (course name)
- `location` (string): Location (city, state, zip)
- `radius` (number): Search radius in miles (default: 25)
- `limit` (number): Results per page (default: 20, max: 100)
- `offset` (number): Pagination offset (default: 0)

**Example**:
```
GET /api/courses/search?q=pebble&location=Carmel,CA&radius=10
```

**Response**:
```json
{
  "courses": [
    {
      "id": "course123",
      "name": "Pebble Beach Golf Links",
      "location": {
        "address": "1700 17 Mile Dr",
        "city": "Pebble Beach",
        "state": "CA",
        "zip": "93953",
        "country": "USA",
        "coordinates": {
          "lat": 36.5679,
          "lng": -121.9489
        }
      },
      "details": {
        "par": 72,
        "yardage": 6828,
        "slope": 145,
        "rating": 75.5,
        "holes": 18
      },
      "rating": 4.9,
      "reviewCount": 1234
    }
  ],
  "total": 1,
  "limit": 20,
  "offset": 0
}
```

### GET `/api/courses/:courseId`
Get detailed course information.

**Response**:
```json
{
  "id": "course123",
  "name": "Pebble Beach Golf Links",
  "location": { /* location details */ },
  "details": { /* course details */ },
  "holes": [
    {
      "number": 1,
      "par": 4,
      "yardage": {
        "black": 377,
        "blue": 351,
        "white": 338,
        "red": 292
      },
      "handicap": 11,
      "description": "A slight dogleg right..."
    }
    /* ... more holes */
  ],
  "amenities": ["pro-shop", "restaurant", "driving-range"],
  "photos": [/* array of photo URLs */],
  "rating": 4.9,
  "reviews": [/* array of reviews */]
}
```

### POST `/api/courses/:courseId/favorite`
Add course to favorites.

**Response**:
```json
{
  "message": "Course added to favorites",
  "courseId": "course123"
}
```

### DELETE `/api/courses/:courseId/favorite`
Remove course from favorites.

**Response**:
```json
{
  "message": "Course removed from favorites"
}
```

---

## Rounds API

### GET `/api/rounds`
Get all rounds for current user.

**Query Parameters**:
- `limit` (number): Results per page (default: 20)
- `offset` (number): Pagination offset
- `status` (string): Filter by status (`active`, `completed`)

**Response**:
```json
{
  "rounds": [
    {
      "id": "round123",
      "courseId": "course123",
      "courseName": "Pebble Beach Golf Links",
      "date": "2025-10-21",
      "tees": "blue",
      "score": 87,
      "status": "completed",
      "weather": {
        "temp": 72,
        "wind": "10mph NW",
        "conditions": "partly-cloudy"
      },
      "stats": {
        "fairwaysHit": 8,
        "greensInRegulation": 9,
        "putts": 32
      }
    }
  ],
  "total": 15,
  "limit": 20,
  "offset": 0
}
```

### POST `/api/rounds`
Start a new round.

**Request Body**:
```json
{
  "courseId": "course123",
  "tees": "blue",
  "date": "2025-10-21"
}
```

**Response**:
```json
{
  "message": "Round started successfully",
  "round": {
    "id": "round124",
    /* round details */
  }
}
```

### GET `/api/rounds/:roundId`
Get detailed round information.

**Response**:
```json
{
  "id": "round123",
  "courseId": "course123",
  "courseName": "Pebble Beach Golf Links",
  "date": "2025-10-21",
  "tees": "blue",
  "status": "completed",
  "holes": [
    {
      "number": 1,
      "par": 4,
      "score": 5,
      "putts": 2,
      "fairwayHit": true,
      "greenInRegulation": false,
      "shots": [
        {
          "club": "driver",
          "distance": 250,
          "result": "fairway"
        }
      ]
    }
    /* ... more holes */
  ],
  "totalScore": 87,
  "stats": { /* detailed stats */ }
}
```

### PUT `/api/rounds/:roundId`
Update round information.

**Request Body**:
```json
{
  "holes": [
    {
      "number": 1,
      "score": 4
    }
  ]
}
```

**Response**:
```json
{
  "message": "Round updated successfully",
  "round": { /* updated round */ }
}
```

### POST `/api/rounds/:roundId/complete`
Mark round as completed.

**Response**:
```json
{
  "message": "Round completed successfully",
  "round": { /* completed round */ },
  "stats": { /* round statistics */ }
}
```

---

## Weather API

### GET `/api/weather`
Get current weather for a location.

**Query Parameters**:
- `lat` (number): Latitude
- `lng` (number): Longitude

**Example**:
```
GET /api/weather?lat=36.5679&lng=-121.9489
```

**Response**:
```json
{
  "current": {
    "temp": 72,
    "feelsLike": 70,
    "humidity": 65,
    "pressure": 1013,
    "windSpeed": 10,
    "windDirection": "NW",
    "windGust": 15,
    "conditions": "partly-cloudy",
    "description": "Partly cloudy with light winds",
    "visibility": 10,
    "uvIndex": 5
  },
  "forecast": [
    {
      "time": "14:00",
      "temp": 73,
      "conditions": "partly-cloudy",
      "windSpeed": 12
    }
  ]
}
```

---

## Recommendations API

### POST `/api/recommendations`
Get club recommendation for a shot.

**Request Body**:
```json
{
  "distance": 150,
  "elevation": 5,
  "wind": {
    "speed": 10,
    "direction": "headwind"
  },
  "temperature": 72,
  "humidity": 65,
  "shotShape": "straight"
}
```

**Response**:
```json
{
  "recommendation": {
    "club": "7iron",
    "clubName": "Titleist 7-Iron",
    "confidence": 0.92,
    "adjustedDistance": 155,
    "reasoning": [
      "5 yards uphill adds ~5 yards to effective distance",
      "10mph headwind adds ~5 yards",
      "Temperature optimal"
    ],
    "alternatives": [
      {
        "club": "6iron",
        "confidence": 0.75,
        "note": "If you want to club up"
      },
      {
        "club": "8iron",
        "confidence": 0.68,
        "note": "With full swing"
      }
    ]
  }
}
```

---

## Error Handling

All API errors follow this format:

```json
{
  "error": {
    "code": "INVALID_REQUEST",
    "message": "The request was invalid",
    "details": {
      "field": "email",
      "reason": "Invalid email format"
    }
  }
}
```

### Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `INVALID_REQUEST` | 400 | Invalid request parameters |
| `CONFLICT` | 409 | Resource conflict (e.g., duplicate) |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily unavailable |

---

## Rate Limiting

API requests are rate limited to ensure fair usage:

- **Authenticated requests**: 1000 requests per hour
- **Unauthenticated requests**: 100 requests per hour

Rate limit headers are included in every response:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 998
X-RateLimit-Reset: 1698345600
```

When rate limit is exceeded:

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Try again in 3600 seconds."
  }
}
```

---

## Code Examples

### TypeScript/React

```typescript
import { auth } from '@/lib/firebase';

async function getClubs() {
  const token = await auth.currentUser?.getIdToken();

  const response = await fetch('/api/clubs', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error.message);
  }

  return response.json();
}
```

### cURL

```bash
# Get clubs
curl -X GET https://caddyai.com/api/clubs \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"

# Add a club
curl -X POST https://caddyai.com/api/clubs \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "7iron",
    "distance": 150
  }'
```

---

## Versioning

The API uses URL versioning. Current version is `v1`.

```
https://caddyai.com/api/v1/clubs
```

When breaking changes are introduced, a new version will be released with advance notice.

---

## Support

For API support:
- **Email**: api@caddyai.com
- **Documentation**: https://caddyai.com/docs
- **Status**: https://status.caddyai.com

---

**Last Updated**: October 21, 2025
**Version**: 1.0.0
