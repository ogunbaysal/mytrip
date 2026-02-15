import { Context } from "hono";
import { webAuth } from "./web-auth.ts";

type HeadersWithSetCookie = Headers & {
  getSetCookie?: () => string[];
};

function getSetCookieValues(headers: Headers): string[] {
  const cookieHeaders = (headers as HeadersWithSetCookie).getSetCookie?.();

  if (cookieHeaders && cookieHeaders.length > 0) {
    return cookieHeaders;
  }

  const setCookie = headers.get("set-cookie");
  return setCookie ? [setCookie] : [];
}

function forwardSetCookieHeaders(c: Context, headers: Headers) {
  const cookies = getSetCookieValues(headers);

  for (const cookie of cookies) {
    c.header("Set-Cookie", cookie, { append: true });
  }
}

export async function getSessionFromRequest(c: Context) {
  try {
    const { headers, response } = await webAuth.api.getSession({
      headers: c.req.raw.headers,
      returnHeaders: true,
    });

    if (headers) {
      forwardSetCookieHeaders(c, headers);
    }

    if (!response?.session || !response.user) {
      return null;
    }

    const userId = response.session.userId || response.user.id;
    if (!userId) {
      return null;
    }

    return {
      ...response,
      user: {
        ...response.user,
        id: userId,
      },
    };
  } catch (error) {
    console.error("Session resolution error:", error);
    return null;
  }
}
