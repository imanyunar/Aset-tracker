import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 1. Whitelist Allowed Origins
const ALLOWED_ORIGINS = [
  "https://nexafinance-client.vercel.app",
  "https://frontend-nine-ruby-17.vercel.app",
  "https://nexafinance-alpha.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000",
];

function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  // Allow *.vercel.app preview deployments
  if (/^https:\/\/([a-z0-9-]+)\.vercel\.app$/i.test(origin)) {
    return true;
  }
  return false;
}

// 2. High-Traffic Anti-DDoS / Rate Limiting (Sliding Window in Memory)
interface IpRateLimit {
  count: number;
  resetAt: number;
}
const rateLimitMap = new Map<string, IpRateLimit>();

// Clean up stale rate limit entries every 2 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of rateLimitMap.entries()) {
      if (record.resetAt < now) {
        rateLimitMap.delete(ip);
      }
    }
  }, 2 * 60 * 1000);
}

function checkEdgeRateLimit(ip: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || record.resetAt < now) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count += 1;
  return true;
}

// 3. Known Malicious Bot / Pentest Scanner Patterns
const BLOCKED_USER_AGENTS = [
  /sqlmap/i,
  /nikto/i,
  /acunetix/i,
  /masscan/i,
  /nmap/i,
  /wpscan/i,
  /dirbuster/i,
  /zgrab/i,
];

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const userAgent = req.headers.get("user-agent") || "";
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "127.0.0.1";

  // A. Block Automated Vulnerability Scanners
  if (BLOCKED_USER_AGENTS.some((pattern) => pattern.test(userAgent))) {
    return new NextResponse(JSON.stringify({ error: "Access Denied" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  // B. Anti-DDoS Edge Rate Limiting on API routes
  if (path.startsWith("/api/")) {
    const isAuthRoute = path.startsWith("/api/auth/");
    const limit = isAuthRoute ? 25 : 120; // 25 req/min on auth, 120 req/min on other APIs
    const windowMs = 60 * 1000;

    const allowed = checkEdgeRateLimit(ip, limit, windowMs);
    if (!allowed) {
      return new NextResponse(
        JSON.stringify({
          error: "Terlalu banyak permintaan (Rate limit exceeded). Silakan coba sesaat lagi.",
          retryAfter: 60,
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": "60",
          },
        }
      );
    }
  }

  const origin = req.headers.get("origin");
  const isAllowed = isOriginAllowed(origin);

  // C. Handle Preflight OPTIONS requests directly at the edge
  if (req.method === "OPTIONS") {
    const preflightHeaders = new Headers();
    preflightHeaders.set(
      "Access-Control-Allow-Methods",
      "GET,POST,PUT,PATCH,DELETE,OPTIONS"
    );
    preflightHeaders.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Requested-With, Accept, Origin, Cookie"
    );
    preflightHeaders.set("Access-Control-Max-Age", "86400");

    if (isAllowed && origin) {
      preflightHeaders.set("Access-Control-Allow-Origin", origin);
      preflightHeaders.set("Access-Control-Allow-Credentials", "true");
    }

    return new NextResponse(null, {
      status: 204,
      headers: preflightHeaders,
    });
  }

  // D. Process request & attach security headers
  const response = NextResponse.next();

  if (isAllowed && origin) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
  }

  // E. Anti-Google Dorking: Block search engine indexing on all APIs & private dashboards
  response.headers.set(
    "X-Robots-Tag",
    "noindex, nofollow, noarchive, nosnippet"
  );

  // F. Enterprise Security Headers (Anti-MITM / Anti-Sniffing / Anti-Clickjacking)
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload"
  );
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()"
  );

  return response;
}

export const config = {
  matcher: ["/api/:path*", "/dashboard/:path*", "/transactions/:path*"],
};
