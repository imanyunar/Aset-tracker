import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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

export function middleware(req: NextRequest) {
  const origin = req.headers.get("origin");
  const isAllowed = isOriginAllowed(origin);

  // 1. Handle Preflight OPTIONS requests directly
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

  // 2. Process request & attach security headers
  const response = NextResponse.next();

  if (isAllowed && origin) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
  }

  // Enterprise Security Headers
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
  matcher: ["/api/:path*"],
};
