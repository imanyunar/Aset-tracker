import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toNextJsHandler } from "better-auth/next-js";
import { NextRequest, NextResponse } from "next/server";

const handlers = toNextJsHandler(auth.handler);

function addCorsHeaders(res: Response, req: NextRequest): Response {
  const origin = req.headers.get("origin");
  if (!origin) return res;

  const response = new NextResponse(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers: res.headers,
  });

  response.headers.set("Access-Control-Allow-Origin", origin);
  response.headers.set("Access-Control-Allow-Credentials", "true");
  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,PATCH,DELETE,OPTIONS"
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With, Accept, Origin, Cookie"
  );
  return response;
}

export async function GET(req: NextRequest) {
  const res = await handlers.GET(req);
  return addCorsHeaders(res, req);
}

export async function POST(req: NextRequest) {
  // Asynchronously prune expired sessions in the background
  prisma.session
    .deleteMany({
      where: { expiresAt: { lt: new Date() } },
    })
    .catch(() => {});

  const isSignOut = req.nextUrl.pathname.endsWith("/sign-out");

  if (isSignOut) {
    // 1. Direct DB session purging by extracting session token from Cookie or Bearer header
    try {
      const cookieHeader = req.headers.get("cookie") || "";
      const match = cookieHeader.match(
        /(?:better-auth\.session_token|__Secure-better-auth\.session_token)=([^;]+)/
      );
      if (match) {
        const rawToken = decodeURIComponent(match[1].trim());
        const strippedToken = rawToken.split(".")[0];
        await prisma.session.deleteMany({
          where: {
            OR: [
              { token: rawToken },
              { token: strippedToken },
            ],
          },
        });
      }

      const authHeader = req.headers.get("authorization");
      if (authHeader?.startsWith("Bearer ")) {
        const bearerToken = authHeader.substring(7).trim();
        await prisma.session.deleteMany({
          where: { token: bearerToken },
        });
      }
    } catch (dbErr) {
      console.error("[Auth] DB session cleanup error:", dbErr);
    }
  }

  let res: Response;
  if (isSignOut) {
    let bodyText = "";
    try {
      bodyText = await req.text();
    } catch {
      bodyText = "";
    }

    const effectiveBody = !bodyText || bodyText.trim() === "" ? "{}" : bodyText;
    const newHeaders = new Headers(req.headers);
    newHeaders.set("content-type", "application/json");

    const modifiedReq = new NextRequest(req.url, {
      method: req.method,
      headers: newHeaders,
      body: effectiveBody,
    });

    try {
      res = await handlers.POST(modifiedReq);
    } catch {
      res = NextResponse.json({ success: true, message: "Signed out" });
    }
  } else {
    res = await handlers.POST(req);
  }

  // Bank-Grade Cookie Deletion Enforcement on sign-out
  if (isSignOut) {
    const responseWithHeaders = new NextResponse(res.body, {
      status: res.status || 200,
      statusText: res.statusText,
      headers: res.headers,
    });

    const cookieNames = [
      "better-auth.session_token",
      "__Secure-better-auth.session_token",
      "better-auth.session_data",
      "__Secure-better-auth.session_data",
      "better-auth.dont_remember",
      "__Secure-better-auth.dont_remember",
      "better-auth.account_data",
      "__Secure-better-auth.account_data",
    ];

    for (const name of cookieNames) {
      responseWithHeaders.headers.append(
        "Set-Cookie",
        `${name}=; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/; HttpOnly; Secure; SameSite=None`
      );
    }

    return addCorsHeaders(responseWithHeaders, req);
  }

  return addCorsHeaders(res, req);
}

