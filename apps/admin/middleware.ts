import { NextResponse, type NextRequest } from "next/server";

type Session = {
  user?: {
    id?: string;
  } | null;
} | null;

type HeadersWithSetCookie = Headers & {
  getSetCookie?: () => string[];
};

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "https://api.tatildesen.com";

function getSetCookieValues(headers: Headers): string[] {
  const cookies = (headers as HeadersWithSetCookie).getSetCookie?.();
  if (cookies && cookies.length > 0) {
    return cookies;
  }

  const setCookie = headers.get("set-cookie");
  return setCookie ? [setCookie] : [];
}

function appendSetCookies(response: NextResponse, cookies: string[]) {
  for (const cookie of cookies) {
    response.headers.append("set-cookie", cookie);
  }
}

export default async function authMiddleware(request: NextRequest) {
  const cookieHeader = request.headers.get("cookie") || "";

  let session: Session = null;
  let setCookies: string[] = [];

  try {
    const sessionResponse = await fetch(`${API_BASE_URL}/api/auth/get-session`, {
      method: "GET",
      headers: {
        cookie: cookieHeader,
      },
      cache: "no-store",
    });

    setCookies = getSetCookieValues(sessionResponse.headers);

    if (sessionResponse.ok) {
      session = (await sessionResponse.json()) as Session;
    }
  } catch {
    session = null;
  }

  if (!session?.user?.id) {
    const redirect = NextResponse.redirect(new URL("/login", request.url));
    appendSetCookies(redirect, setCookies);
    return redirect;
  }

  const response = NextResponse.next();
  appendSetCookies(response, setCookies);
  return response;
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
