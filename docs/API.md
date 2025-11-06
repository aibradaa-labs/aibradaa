# AI Bradaa API Documentation

Complete API reference for integrating with AI Bradaa's backend services.

## Base URL

```
Production: https://aibradaa.netlify.app/api
Development: http://localhost:3000/api
```

## Authentication

Most endpoints require authentication via JWT tokens.

### Headers

```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

---

## Endpoints

### Authentication

#### Register User

Create a new user account.

**POST** `/auth/register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123",
  "name": "John Doe"
}
```

**Response:** `201 Created`
```json
{
  "message": "User registered successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

**Errors:**
- `400` - Invalid email or weak password
- `409` - Email already exists

---

#### Login

Authenticate and receive JWT token.

**POST** `/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response:** `200 OK`
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

**Errors:**
- `401` - Invalid credentials
- `400` - Missing email or password

---

#### Request Magic Link

Get passwordless login link via email.

**POST** `/auth/magic-link`

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:** `200 OK`
```json
{
  "message": "Magic link sent to your email"
}
```

---

#### Verify Magic Link

Exchange magic link token for JWT.

**GET** `/auth/verify/:token`

**Response:** `200 OK`
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

**Errors:**
- `400` - Invalid or expired token

---

### Recommendations

#### Get Laptop Recommendations

Get personalized laptop recommendations based on criteria.

**POST** `/recommendations`

**Authentication:** Required

**Request Body:**
```json
{
  "budget": 5000,
  "usage": "gaming",
  "preferences": {
    "portability": "medium",
    "brand": ["ASUS", "MSI"],
    "screenSize": "15.6",
    "minRam": 16
  }
}
```

**Response:** `200 OK`
```json
{
  "recommendations": [
    {
      "id": "laptop-001",
      "brand": "ASUS",
      "model": "ROG Strix G15",
      "price_MYR": 4999,
      "score_composite": 92,
      "matchScore": 95,
      "reason": "Excellent gaming performance within budget",
      "specs": {
        "cpu": { "gen": "AMD Ryzen 7", "cores": 8 },
        "ram": { "gb": 16 },
        "storage": { "gb": 512 },
        "gpu": { "model": "RTX 4060" }
      }
    }
  ],
  "totalResults": 5
}
```

---

#### Save Recommendation

Save recommendation for later viewing.

**POST** `/recommendations/save`

**Authentication:** Required

**Request Body:**
```json
{
  "recommendationId": "rec-123",
  "laptopId": "laptop-001"
}
```

**Response:** `201 Created`
```json
{
  "message": "Recommendation saved"
}
```

---

### Comparison

#### Compare Laptops

Get detailed side-by-side comparison.

**POST** `/compare`

**Request Body:**
```json
{
  "laptopIds": ["laptop-001", "laptop-002", "laptop-003"]
}
```

**Response:** `200 OK`
```json
{
  "comparison": {
    "laptops": [...],
    "insights": [
      "Laptop A offers best value for money",
      "Laptop B has the highest performance"
    ],
    "winner": {
      "overall": "laptop-001",
      "performance": "laptop-002",
      "value": "laptop-001"
    }
  }
}
```

---

### Chat

#### Send Chat Message

Interact with AI Bradaa Command.

**POST** `/chat`

**Authentication:** Required

**Request Body:**
```json
{
  "message": "What's the best laptop for video editing under RM 8000?",
  "context": {
    "previousMessages": [],
    "currentPage": "/sections/command.html"
  }
}
```

**Response:** `200 OK`
```json
{
  "response": "For video editing under RM 8000, I recommend...",
  "suggestions": [
    "Tell me more about the MacBook Pro",
    "Compare with Windows alternatives"
  ]
}
```

**Streaming Response:**

Set `Accept: text/event-stream` header for streaming responses.

```
data: {"chunk": "For video editing"}
data: {"chunk": " under RM 8000"}
data: {"done": true}
```

---

### Camera Analysis

#### Analyze Laptop Image

Identify laptop from uploaded image.

**POST** `/camera/analyze`

**Authentication:** Optional (rate-limited without auth)

**Request Body:**
```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
}
```

**Response:** `200 OK`
```json
{
  "identified": {
    "id": "laptop-045",
    "brand": "Dell",
    "model": "XPS 15",
    "confidence": "high",
    "price_MYR": 7499
  },
  "analysis": {
    "observations": [
      "Distinctive infinity edge display",
      "Silver aluminum chassis",
      "Dell logo clearly visible"
    ],
    "confidenceScore": 95
  },
  "similar": [...],
  "alternatives": [...]
}
```

**Errors:**
- `400` - Invalid image format or size too large
- `500` - Analysis failed

---

### User Profile

#### Get User Profile

Retrieve user information and preferences.

**GET** `/users/profile`

**Authentication:** Required

**Response:** `200 OK`
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "preferences": {
      "favoriteChairs": [...],
      "searchHistory": [...]
    },
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```

---

#### Update User Profile

Update user information.

**PATCH** `/users/profile`

**Authentication:** Required

**Request Body:**
```json
{
  "name": "John Updated",
  "preferences": {
    "newsletter": true
  }
}
```

**Response:** `200 OK`
```json
{
  "message": "Profile updated",
  "user": {...}
}
```

---

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

- **Unauthenticated:** 20 requests/minute
- **Authenticated:** 100 requests/minute
- **Camera Analysis:** 10 requests/minute (heavy processing)

**Rate Limit Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640000000
```

**429 Response:**
```json
{
  "error": {
    "message": "Rate limit exceeded. Try again in 30 seconds.",
    "statusCode": 429,
    "retryAfter": 30
  }
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "error": {
    "message": "Human-readable error message",
    "statusCode": 400,
    "details": "Additional context (development only)",
    "timestamp": "2025-01-01T00:00:00.000Z"
  }
}
```

### Common Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (valid token, insufficient permissions)
- `404` - Not Found
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

---

## Webhooks

*Coming soon - webhook support for real-time updates*

---

## SDKs & Libraries

### JavaScript/TypeScript

```javascript
import { AiBradaaClient } from '@aibradaa/sdk';

const client = new AiBradaaClient({
  apiKey: 'your-jwt-token',
  baseUrl: 'https://aibradaa.netlify.app/api'
});

// Get recommendations
const recommendations = await client.recommendations.get({
  budget: 5000,
  usage: 'gaming'
});

// Chat
const response = await client.chat.send('Best laptop for students?');
```

*SDK coming in Phase 2*

---

## CORS

Cross-Origin Resource Sharing is enabled for:

- `https://aibradaa.netlify.app`
- `http://localhost:3000` (development)

---

## Changelog

### v1.0.0 (2025-01-01)
- Initial API release
- Authentication endpoints
- Recommendations
- Comparison
- Chat interface
- Camera analysis

---

## Support

For API issues or questions:
- GitHub Issues: https://github.com/aibradaa-labs/aibradaa/issues
- Email: support@aibradaa.com
