import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { NextRequest, NextResponse } from "next/server";

const handlers = toNextJsHandler(auth.handler);

export const GET = handlers.GET;

export async function POST(req: NextRequest) {
  const isSignOut = req.nextUrl.pathname.endsWith("/sign-out");

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

    res = await handlers.POST(modifiedReq);
  } else {
    res = await handlers.POST(req);
  }

  // Bank-Grade Cookie Deletion Enforcement on sign-out
  if (isSignOut) {
    const responseWithHeaders = new NextResponse(res.body, {
      status: res.status,
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
    ];

    for (const name of cookieNames) {
      responseWithHeaders.headers.append(
        "Set-Cookie",
        `${name}=; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/; HttpOnly; Secure; SameSite=None`
      );
    }

    return responseWithHeaders;
  }

  return res;
}
