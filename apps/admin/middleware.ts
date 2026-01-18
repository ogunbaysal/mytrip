import { betterFetch } from "@better-fetch/fetch";
import type { Session } from "better-auth/types";
import { NextResponse, type NextRequest } from "next/server";

export default async function authMiddleware(request: NextRequest) {
  const cookies = request.headers.get("cookie") || "";

  // Debug: log cookies in production to verify they're being received
  console.log("[Middleware] Cookies received:", cookies ? "present" : "empty");

  const { data: session, error } = await betterFetch<Session>(
    "/api/auth/get-session",
    {
      baseURL: process.env.NEXT_PUBLIC_API_URL || "https://api.tatildesen.com",
      headers: {
        cookie: cookies,
      },
      credentials: "include",
    },
  );

  console.log("[Middleware] Session check:", {
    hasSession: !!session,
    error: error?.message,
    path: request.nextUrl.pathname,
  });

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
