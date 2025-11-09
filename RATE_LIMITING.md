# Rate Limiting Implementation

## Overview

BuildLight implements distributed rate limiting using **Upstash Redis** to prevent API abuse, protect server resources, and ensure fair usage across all users.

**Key Benefits:**
- ✅ **Prevents API Abuse** - Blocks malicious actors from overwhelming the system
- ✅ **Protects Resources** - Prevents excessive database queries and external API calls
- ✅ **Fair Usage** - Ensures all users get equal access to resources
- ✅ **Graceful Degradation** - Falls back safely if Redis is unavailable
- ✅ **Production-Ready** - Distributed rate limiting works across multiple servers

---

## Rate Limiting Strategies

BuildLight implements **4 rate limiting levels** for different endpoint sensitivity:

### 1. **STRICT** - For Sensitive Operations
**Limits:** 5 requests per 10 seconds (50/hour)

**Use Cases:**
- Payment operations (checkout, billing portal)
- Account changes
- Deletion operations (projects, documents)

**Example:**
```typescript
// app/api/checkout/route.ts
const rateLimitResponse = await enforceRateLimit(req, userId, "strict");
if (rateLimitResponse) return rateLimitResponse;
```

### 2. **STANDARD** - For Most API Routes
**Limits:** 20 requests per 10 seconds (200/hour)

**Use Cases:**
- CRUD operations (create, update)
- Folder creation
- Document sharing
- Search requests

**Example:**
```typescript
// app/api/projects/route.ts (POST)
const rateLimitResponse = await enforceRateLimit(req, userId, "standard");
if (rateLimitResponse) return rateLimitResponse;
```

### 3. **GENEROUS** - For Read-Heavy Operations
**Limits:** 100 requests per 10 seconds (1000/hour)

**Use Cases:**
- GET requests (list projects, view documents)
- Browsing folders
- Fetching project details

**Example:**
```typescript
// app/api/projects/route.ts (GET)
const rateLimitResponse = await enforceRateLimit(req, userId, "generous");
if (rateLimitResponse) return rateLimitResponse;
```

### 4. **UPLOAD** - For File Upload Operations
**Limits:** 10 requests per minute (100/hour)

**Use Cases:**
- File uploads to Google Drive
- Document uploads

**Example:**
```typescript
// app/api/projects/[id]/documents/route.ts (POST)
const rateLimitResponse = await enforceRateLimit(req, userId, "upload");
if (rateLimitResponse) return rateLimitResponse;
```

---

## Implementation Details

### Setup Required

**1. Create Upstash Redis Database**

Visit [console.upstash.com](https://console.upstash.com) and:
1. Create a free account
2. Create a new Redis database (choose region closest to your Vercel deployment)
3. Copy the **REST URL** and **REST Token**
4. Add to `.env.local` and `.env.production`:

```bash
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token_here
```

**2. Environment Variables**

- `UPSTASH_REDIS_REST_URL` - Redis REST API endpoint
- `UPSTASH_REDIS_REST_TOKEN` - Authentication token

**Note:** If these are not set, rate limiting will be **disabled** in development. In production, a warning will be logged to Sentry.

### How It Works

**1. Sliding Window Algorithm**

BuildLight uses the **sliding window** rate limiting algorithm:
- More accurate than fixed windows
- Prevents burst attacks at window boundaries
- Evenly distributes requests over time

**Example:** With a 10-second window and 20 request limit:
- User makes 10 requests at 0:00
- User makes 10 more requests at 0:05
- At 0:10, first batch expires and user can make 10 more
- This prevents 20 requests all at once every 10 seconds

**2. Distributed Rate Limiting**

Using Redis ensures rate limits work correctly across:
- Multiple Vercel serverless functions
- Different geographic regions
- Horizontal scaling

**3. User Identification**

Rate limits are applied per:
- **Authenticated users** - By Clerk user ID
- **Anonymous users** - By IP address (for public endpoints)
- **Composite keys** - By user + action (e.g., `user_123:upload:proj_456`)

**4. Response Headers**

All rate-limited responses include headers:
```
X-RateLimit-Limit: 20          # Maximum requests allowed
X-RateLimit-Remaining: 15       # Requests remaining in window
X-RateLimit-Reset: 1736294400   # Unix timestamp when limit resets
Retry-After: 8                  # Seconds until retry allowed
```

---

## API Routes with Rate Limiting

### Projects API

| Route | Method | Rate Limit | Reason |
|-------|--------|------------|--------|
| `/api/projects` | GET | Generous | Read-heavy, frequent polling |
| `/api/projects` | POST | Standard | Create project |
| `/api/projects/[id]` | GET | Generous | Read project details |
| `/api/projects/[id]` | PATCH | Standard | Update project |
| `/api/projects/[id]` | DELETE | **Strict** | Sensitive deletion |

### Documents API

| Route | Method | Rate Limit | Reason |
|-------|--------|------------|--------|
| `/api/projects/[id]/documents` | GET | Generous | List documents |
| `/api/projects/[id]/documents` | POST | **Upload** | File upload (expensive) |
| `/api/projects/[id]/documents/search` | POST | Standard | Search operation |
| `/api/projects/[id]/documents/create-folder` | POST | Standard | Folder creation |
| `/api/projects/[id]/documents/folders/[folderId]` | GET | Generous | Browse folder |
| `/api/projects/[id]/documents/[documentId]` | DELETE | **Strict** | Sensitive deletion |
| `/api/projects/[id]/documents/[documentId]/share` | POST | Standard | Share document |
| `/api/projects/[id]/documents/[documentId]/share` | GET | Standard | Get share link |

### Payment API

| Route | Method | Rate Limit | Reason |
|-------|--------|------------|--------|
| `/api/checkout` | POST | **Strict** | Payment operation (very sensitive) |
| `/api/billing-portal` | POST | **Strict** | Billing changes (very sensitive) |

---

## Usage Examples

### Basic Rate Limiting

```typescript
import { enforceRateLimit } from "@/lib/rate-limit";
import { requireAuth } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const userId = await requireAuth();

    // Check rate limit
    const rateLimitResponse = await enforceRateLimit(req, userId, "standard");
    if (rateLimitResponse) return rateLimitResponse;

    // Continue with normal request handling
    // ...
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

### Rate Limiting by Action

For more granular control, rate limit by user + action:

```typescript
import { rateLimitByUserAction } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const userId = await requireAuth();

  // Rate limit specifically for project creation
  const result = await rateLimitByUserAction(userId, "create-project", "standard");

  if (!result.success) {
    return NextResponse.json(
      { error: "Too many projects created. Please try again later." },
      { status: 429 }
    );
  }

  // Continue with project creation
}
```

### Rate Limiting Anonymous Users (by IP)

```typescript
import { rateLimitByIp } from "@/lib/rate-limit";

export async function POST(req: Request) {
  // Rate limit by IP for unauthenticated endpoints
  const result = await rateLimitByIp(req, "standard");

  if (!result.success) {
    return NextResponse.json(
      { error: "Too many requests from your IP. Please try again later." },
      { status: 429 }
    );
  }

  // Continue with request
}
```

### Composite Identifiers

Combine multiple factors for fine-grained rate limiting:

```typescript
import { createIdentifier, checkRateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const userId = await requireAuth();
  const { projectId } = await params;

  // Rate limit per user per project
  const identifier = createIdentifier(userId, "upload", projectId);
  const result = await checkRateLimit(identifier, "upload");

  if (!result.success) {
    return NextResponse.json(
      { error: "Too many uploads to this project. Please wait." },
      { status: 429 }
    );
  }

  // Continue with upload
}
```

---

## Error Responses

### Rate Limited Response (429)

When a user exceeds their rate limit:

```json
{
  "error": "Too many requests. Please try again later.",
  "retryAfter": 8
}
```

**Headers:**
```
HTTP/1.1 429 Too Many Requests
Retry-After: 8
X-RateLimit-Limit: 20
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1736294400
```

### Client-Side Handling

BuildLight's toast notification system automatically handles 429 errors:

```typescript
// components/document-browser.tsx
try {
  const response = await fetch(`/api/projects/${projectId}/documents`, {
    method: "POST",
    body: formData,
  });

  if (response.status === 429) {
    const data = await response.json();
    showError(`Rate limit exceeded. Please try again in ${data.retryAfter} seconds.`);
    return;
  }

  // Handle success
} catch (error) {
  captureException(error);
  showError("Upload failed. Please try again.");
}
```

---

## Testing Rate Limits

### Manual Testing

**Test in Development (without Redis):**
```bash
# Rate limiting will be disabled, but code will still execute
curl -X POST http://localhost:3000/api/projects \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Project"}'
```

**Test in Production (with Redis):**
```bash
# Rapidly make requests to trigger rate limit
for i in {1..25}; do
  curl -X POST https://buildlight.com/api/projects \
    -H "Authorization: Bearer YOUR_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"name":"Test Project '$i'"}' &
done
wait
```

Expected result: First 20 requests succeed, remaining 5 return 429.

### Reset Rate Limit (Development/Testing)

```typescript
import { resetRateLimit } from "@/lib/rate-limit";

// Reset rate limit for a specific user
await resetRateLimit("user_123");

// Reset for composite identifier
await resetRateLimit("user_123:upload:proj_456");
```

---

## Monitoring & Analytics

### Upstash Dashboard

View rate limiting analytics:
1. Go to [console.upstash.com](https://console.upstash.com)
2. Select your Redis database
3. View metrics:
   - Total requests
   - Rate limited requests
   - Most active users/IPs

### Sentry Integration

Rate limit errors are automatically logged to Sentry:

```typescript
// lib/rate-limit.ts
if (process.env.NODE_ENV === "production" && !limiter) {
  captureException(new Error("Rate limiting disabled in production"), {
    context: "rate-limit",
    level,
    identifier,
  });
}
```

---

## Security Best Practices

### 1. Always Use Server-Side Rate Limiting

**❌ NEVER rely on client-side rate limiting alone:**
```typescript
// BAD: Client can bypass this
if (uploadCount > 10) {
  alert("Too many uploads");
  return;
}
```

**✅ ALWAYS enforce on the server:**
```typescript
// GOOD: Cannot be bypassed
const rateLimitResponse = await enforceRateLimit(req, userId, "upload");
if (rateLimitResponse) return rateLimitResponse;
```

### 2. Use Appropriate Limits

- **Payment operations** - STRICT (5/10s)
- **Mutations (POST/PATCH/DELETE)** - STANDARD (20/10s)
- **Reads (GET)** - GENEROUS (100/10s)
- **File uploads** - UPLOAD (10/minute)

### 3. Rate Limit by User + Action

For sensitive operations, use composite identifiers:

```typescript
// Rate limit file uploads per project
const identifier = createIdentifier(userId, "upload", projectId);
const result = await checkRateLimit(identifier, "upload");
```

### 4. Monitor Abuse Patterns

Set up Sentry alerts for:
- High rate of 429 responses from single user
- Multiple users hitting limits (potential DDoS)
- Rate limiting service failures

---

## Troubleshooting

### Rate Limiting Not Working

**1. Check Environment Variables**

```bash
# Verify Redis is configured
echo $UPSTASH_REDIS_REST_URL
echo $UPSTASH_REDIS_REST_TOKEN
```

**2. Check Logs**

In development:
```typescript
// lib/rate-limit.ts will log:
console.warn("Rate limiting is disabled in production - Redis not configured!");
```

In production, check Sentry for warnings.

**3. Verify Upstash Redis is Reachable**

```bash
# Test Redis connection
curl https://your-redis-url.upstash.io/ping \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Expected response: `{"result":"PONG"}`

### Users Reporting Rate Limit Errors

**1. Check if legitimate traffic:**
- Review user's recent activity in Upstash dashboard
- Check if pattern indicates abuse or normal usage spike

**2. Temporarily increase limits (if needed):**
```typescript
// lib/rate-limit.ts
export const standardRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(30, "10 s"), // Increased from 20
      // ...
    })
  : null;
```

**3. Reset rate limit for specific user:**
```typescript
// In API route or admin tool
import { resetRateLimit } from "@/lib/rate-limit";
await resetRateLimit("user_123");
```

### Rate Limiting Service Down

**Fail-Open Behavior:**

If Redis is unavailable, rate limiting **automatically disables** to prevent blocking all traffic:

```typescript
// lib/rate-limit.ts
try {
  const { success, limit, remaining, reset } = await limiter.limit(identifier);
  // ...
} catch (error: any) {
  console.error("Rate limit check error:", error);
  captureException(error, { context: "rate-limit" });

  // Fail open - allow request if rate limiting service is down
  return { success: true, error: "Rate limiting service unavailable" };
}
```

This ensures BuildLight remains available even if Upstash has an outage.

---

## Production Deployment

### Vercel Environment Variables

Add to Vercel project settings:

```
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token_here
```

### Edge Functions Support

Rate limiting works with Vercel Edge Functions:
- Redis is accessed via REST API (no TCP connections needed)
- Low latency (~1-5ms added per request)
- Works globally across all Vercel regions

### Costs

**Upstash Free Tier:**
- 10,000 commands/day
- 256MB storage
- Good for ~100-500 daily active users

**Upstash Pro ($0.20 per 100K commands):**
- Unlimited commands
- Pay-per-use pricing
- Good for production scale

**Estimated Costs:**
- 1,000 users × 100 requests/day = 100,000 requests/day
- 100,000 ÷ 100,000 × $0.20 = **$0.20/day** (~$6/month)

---

## Future Enhancements

Potential improvements for rate limiting:

1. **Per-Organization Limits** - Different limits based on subscription tier (Starter vs Pro)
2. **Adaptive Rate Limiting** - Automatically adjust limits based on system load
3. **Custom Limits per User** - Allow admins to set custom limits for specific users
4. **Rate Limit Bypass Tokens** - Allow trusted integrations to bypass limits
5. **Detailed Analytics Dashboard** - In-app view of rate limit usage
6. **IP Reputation** - Block known malicious IPs automatically

---

## Summary

✅ **Rate limiting is ENABLED** for all BuildLight API routes
✅ **4 rate limit levels** - Strict, Standard, Generous, Upload
✅ **Distributed** - Works across multiple servers via Redis
✅ **Graceful degradation** - Falls back if Redis is unavailable
✅ **Production-ready** - Integrated with Sentry error tracking

**Security Status:** ✅ **PROTECTED FROM API ABUSE**

---

## Resources

- [Upstash Console](https://console.upstash.com) - Redis dashboard
- [Upstash Docs](https://docs.upstash.com/redis) - Redis documentation
- [Rate Limiting Best Practices](https://www.cloudflare.com/learning/bots/what-is-rate-limiting/) - Cloudflare guide
- [Sentry Dashboard](https://sentry.io) - Error monitoring

---

## Changelog

| Date | Change | Reason |
|------|--------|--------|
| 2025-01-09 | Initial implementation | Critical Issue #6 - No rate limiting |
| 2025-01-09 | Added all API routes | Comprehensive protection |
| 2025-01-09 | Documentation completed | Developer reference |
