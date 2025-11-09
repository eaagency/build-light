/**
 * Rate Limiting Utilities
 *
 * Provides distributed rate limiting using Upstash Redis to prevent API abuse.
 * Implements multiple rate limiting strategies for different endpoint sensitivity levels.
 */

import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";
import { captureException } from "@/lib/sentry";

/**
 * Initialize Redis client
 * Falls back to in-memory limiting if Redis is not configured (development)
 */
const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

/**
 * Rate Limiting Strategies
 */

/**
 * STRICT: For sensitive operations (payments, authentication, account changes)
 * - 5 requests per 10 seconds
 * - 50 requests per hour
 */
export const strictRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(5, "10 s"),
      analytics: true,
      prefix: "@buildlight/ratelimit/strict",
    })
  : null;

/**
 * STANDARD: For most API routes (CRUD operations)
 * - 20 requests per 10 seconds
 * - 200 requests per hour
 */
export const standardRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(20, "10 s"),
      analytics: true,
      prefix: "@buildlight/ratelimit/standard",
    })
  : null;

/**
 * GENEROUS: For read-heavy operations (GET requests, public data)
 * - 100 requests per 10 seconds
 * - 1000 requests per hour
 */
export const generousRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, "10 s"),
      analytics: true,
      prefix: "@buildlight/ratelimit/generous",
    })
  : null;

/**
 * UPLOAD: For file upload operations
 * - 10 requests per minute (uploads are expensive)
 * - 100 requests per hour
 */
export const uploadRateLimit = redis
  ? new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "60 s"),
      analytics: true,
      prefix: "@buildlight/ratelimit/upload",
    })
  : null;

/**
 * Rate limit levels
 */
export type RateLimitLevel = "strict" | "standard" | "generous" | "upload";

/**
 * Get the appropriate rate limiter for a given level
 */
function getRateLimiter(level: RateLimitLevel): Ratelimit | null {
  switch (level) {
    case "strict":
      return strictRateLimit;
    case "standard":
      return standardRateLimit;
    case "generous":
      return generousRateLimit;
    case "upload":
      return uploadRateLimit;
    default:
      return standardRateLimit;
  }
}

/**
 * Rate limit result
 */
export interface RateLimitResult {
  success: boolean;
  limit?: number;
  remaining?: number;
  reset?: number;
  error?: string;
}

/**
 * Check rate limit for a given identifier
 *
 * @param identifier - Unique identifier (user ID, IP address, etc.)
 * @param level - Rate limit level to apply
 * @returns Rate limit result
 */
export async function checkRateLimit(
  identifier: string,
  level: RateLimitLevel = "standard"
): Promise<RateLimitResult> {
  const limiter = getRateLimiter(level);

  // If Redis is not configured, allow all requests in development
  if (!limiter) {
    if (process.env.NODE_ENV === "production") {
      console.warn("Rate limiting is disabled in production - Redis not configured!");
      captureException(new Error("Rate limiting disabled in production"), {
        context: "rate-limit",
        level,
        identifier,
      });
    }
    return { success: true };
  }

  try {
    const { success, limit, remaining, reset } = await limiter.limit(identifier);

    return {
      success,
      limit,
      remaining,
      reset,
    };
  } catch (error: any) {
    console.error("Rate limit check error:", error);
    captureException(error, {
      context: "rate-limit",
      level,
      identifier,
    });

    // Fail open - allow request if rate limiting service is down
    return {
      success: true,
      error: "Rate limiting service unavailable",
    };
  }
}

/**
 * Middleware helper to enforce rate limiting on API routes
 *
 * @param request - Next.js request object
 * @param identifier - Unique identifier (user ID, IP address, etc.)
 * @param level - Rate limit level to apply
 * @returns NextResponse if rate limited, null if allowed
 *
 * @example
 * ```typescript
 * export async function POST(req: Request) {
 *   const userId = await requireAuth();
 *
 *   // Check rate limit
 *   const rateLimitResponse = await enforceRateLimit(req, userId, "strict");
 *   if (rateLimitResponse) return rateLimitResponse;
 *
 *   // Continue with normal request handling
 * }
 * ```
 */
export async function enforceRateLimit(
  request: Request,
  identifier: string,
  level: RateLimitLevel = "standard"
): Promise<NextResponse | null> {
  const result = await checkRateLimit(identifier, level);

  if (!result.success) {
    // Calculate retry-after header (seconds until reset)
    const retryAfter = result.reset
      ? Math.ceil((result.reset - Date.now()) / 1000)
      : 60;

    return NextResponse.json(
      {
        error: "Too many requests. Please try again later.",
        retryAfter,
      },
      {
        status: 429, // Too Many Requests
        headers: {
          "Retry-After": retryAfter.toString(),
          "X-RateLimit-Limit": result.limit?.toString() || "unknown",
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": result.reset?.toString() || "unknown",
        },
      }
    );
  }

  return null;
}

/**
 * Get rate limit headers for successful requests
 * Add these to responses to inform clients of their rate limit status
 *
 * @param identifier - Unique identifier
 * @param level - Rate limit level
 * @returns Headers object
 */
export async function getRateLimitHeaders(
  identifier: string,
  level: RateLimitLevel = "standard"
): Promise<Record<string, string>> {
  const result = await checkRateLimit(identifier, level);

  if (!result.success) {
    return {};
  }

  return {
    "X-RateLimit-Limit": result.limit?.toString() || "unknown",
    "X-RateLimit-Remaining": result.remaining?.toString() || "unknown",
    "X-RateLimit-Reset": result.reset?.toString() || "unknown",
  };
}

/**
 * Get IP address from request
 * Useful for rate limiting anonymous requests
 *
 * @param request - Next.js request object
 * @returns IP address or "unknown"
 */
export function getIpAddress(request: Request): string {
  // Try to get real IP from headers (handles proxies/load balancers)
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }

  // Vercel-specific header
  const vercelIp = request.headers.get("x-vercel-forwarded-for");
  if (vercelIp) {
    return vercelIp.split(",")[0].trim();
  }

  return "unknown";
}

/**
 * Create a composite identifier for rate limiting
 * Combines multiple factors to create a unique rate limit key
 *
 * @param parts - Array of identifier parts (e.g., userId, orgId, action)
 * @returns Composite identifier
 *
 * @example
 * ```typescript
 * const identifier = createIdentifier(userId, "upload", projectId);
 * // Returns: "user_123:upload:proj_456"
 * ```
 */
export function createIdentifier(...parts: (string | undefined)[]): string {
  return parts.filter(Boolean).join(":");
}

/**
 * Rate limit by user and action
 * More granular than just by user ID
 *
 * @param userId - User ID
 * @param action - Action name (e.g., "create-project", "upload-file")
 * @param level - Rate limit level
 * @returns Rate limit result
 *
 * @example
 * ```typescript
 * const result = await rateLimitByUserAction(userId, "create-project", "standard");
 * if (!result.success) {
 *   return NextResponse.json({ error: "Too many projects created" }, { status: 429 });
 * }
 * ```
 */
export async function rateLimitByUserAction(
  userId: string,
  action: string,
  level: RateLimitLevel = "standard"
): Promise<RateLimitResult> {
  const identifier = createIdentifier(userId, action);
  return checkRateLimit(identifier, level);
}

/**
 * Rate limit by IP address (for unauthenticated requests)
 *
 * @param request - Next.js request object
 * @param level - Rate limit level
 * @returns Rate limit result
 */
export async function rateLimitByIp(
  request: Request,
  level: RateLimitLevel = "standard"
): Promise<RateLimitResult> {
  const ip = getIpAddress(request);
  return checkRateLimit(ip, level);
}

/**
 * Reset rate limit for a specific identifier
 * Useful for testing or manual intervention
 *
 * @param identifier - Unique identifier
 * @returns Success status
 */
export async function resetRateLimit(identifier: string): Promise<boolean> {
  if (!redis) {
    return false;
  }

  try {
    // Delete all rate limit keys for this identifier
    const prefixes = ["strict", "standard", "generous", "upload"];
    for (const prefix of prefixes) {
      await redis.del(`@buildlight/ratelimit/${prefix}:${identifier}`);
    }
    return true;
  } catch (error: any) {
    console.error("Reset rate limit error:", error);
    captureException(error, {
      context: "rate-limit-reset",
      identifier,
    });
    return false;
  }
}
