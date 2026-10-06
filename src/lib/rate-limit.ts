import { NextResponse } from "next/server";

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

// In-memory sliding window store
const memoryStore = new Map<string, RateLimitRecord>();

// Clean up expired entries every 5 minutes to prevent memory leak
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of memoryStore.entries()) {
      if (value.resetAt < now) {
        memoryStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  reset: number;
  limit: number;
}

/**
 * Checks rate limit for a specific identifier (IP address, user ID, or composite key).
 * Uses in-memory sliding window or Upstash Redis if configured in environment.
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;

  // Optional: Upstash Redis REST fallback
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (upstashUrl && upstashToken) {
    try {
      const redisKey = `ratelimit:${key}`;
      // Execute INCR and EXPIRE in pipeline
      const pipelineRes = await fetch(`${upstashUrl}/pipeline`, {
        method: "POST",
        headers: { Authorization: `Bearer ${upstashToken}` },
        body: JSON.stringify([
          ["INCR", redisKey],
          ["EXPIRE", redisKey, windowSeconds],
        ]),
      });

      if (pipelineRes.ok) {
        const results = await pipelineRes.json();
        const count = results[0]?.result || 1;
        const allowed = count <= limit;
        return {
          allowed,
          remaining: Math.max(0, limit - count),
          reset: Math.floor((now + windowMs) / 1000),
          limit,
        };
      }
    } catch (e) {
      console.warn("[RateLimit] Upstash Redis request failed, falling back to memory:", e);
    }
  }

  // In-memory implementation
  let record = memoryStore.get(key);

  if (!record || record.resetAt < now) {
    record = {
      count: 1,
      resetAt: now + windowMs,
    };
    memoryStore.set(key, record);
    return {
      allowed: true,
      remaining: limit - 1,
      reset: Math.floor(record.resetAt / 1000),
      limit,
    };
  }

  record.count += 1;
  const allowed = record.count <= limit;
  const remaining = Math.max(0, limit - record.count);

  return {
    allowed,
    remaining,
    reset: Math.floor(record.resetAt / 1000),
    limit,
  };
}

/**
 * Helper to enforce rate limiting on API handlers.
 * If exceeded, returns standard 429 Too Many Requests response with Retry-After header.
 */
export async function enforceRateLimit(
  req: Request,
  actionKey: string,
  limit = 30,
  windowSeconds = 60
): Promise<NextResponse | null> {
  // Extract client identifier (Forwarded-For IP or user-agent)
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";
  const rateLimitKey = `${actionKey}:${ip}`;

  const result = await checkRateLimit(rateLimitKey, limit, windowSeconds);

  if (!result.allowed) {
    return NextResponse.json(
      {
        error: "Terlalu banyak permintaan (Rate limit exceeded). Silakan coba lagi beberapa saat.",
        limit: result.limit,
        reset: result.reset,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(windowSeconds),
          "X-RateLimit-Limit": String(result.limit),
          "X-RateLimit-Remaining": String(result.remaining),
          "X-RateLimit-Reset": String(result.reset),
        },
      }
    );
  }

  return null;
}
