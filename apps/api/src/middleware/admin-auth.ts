import { Context, Next } from "hono";
import { auth } from "../lib/auth.ts";

type HeadersWithSetCookie = Headers & {
  getSetCookie?: () => string[];
};

function forwardSetCookieHeaders(c: Context, headers: Headers) {
  const cookies =
    (headers as HeadersWithSetCookie).getSetCookie?.() ??
    (headers.get("set-cookie") ? [headers.get("set-cookie") as string] : []);

  for (const cookie of cookies) {
    c.header("Set-Cookie", cookie, { append: true });
  }
}

/**
 * Middleware to protect admin routes
 * Ensures user is authenticated and is an admin (exists in admin table)
 */
export const adminAuth = async (c: Context, next: Next) => {
  try {
    // Get session from Better Auth
    const { headers, response: session } = await auth.api.getSession({
      headers: c.req.raw.headers,
      returnHeaders: true,
    });

    if (headers) {
      forwardSetCookieHeaders(c, headers);
    }

    // Check if user is authenticated
    if (!session || !session.user) {
      return c.json(
        {
          error: "Authentication required",
          message: "Please sign in to access this resource"
        },
        401
      );
    }

    // Check if user is active
    if (session.user.status !== "active") {
      return c.json(
        {
          error: "Account suspended",
          message: "Your admin account has been suspended"
        },
        403
      );
    }

    // Set user and session in context for use in routes
    c.set("adminUser", session.user);
    c.set("adminSession", session.session);

    await next();
  } catch (error) {
    console.error("Admin auth middleware error:", error);
    return c.json(
      {
        error: "Authentication error",
        message: "Failed to verify admin credentials"
      },
      500
    );
  }
};

/**
 * Middleware to check for admin or owner role
 * WARNING: Currently only supports Admin check as Owner auth is separate.
 * TODO: Implement cross-check for Owner (Web User) session.
 */
export const adminOrOwnerAuth = async (c: Context, next: Next) => {
  try {
    const { headers, response: session } = await auth.api.getSession({
      headers: c.req.raw.headers,
      returnHeaders: true,
    });

    if (headers) {
      forwardSetCookieHeaders(c, headers);
    }

    if (!session || !session.user) {
      // TODO: Try to check Web User session here if needed
      return c.json(
        {
          error: "Authentication required",
          message: "Please sign in to access this resource"
        },
        401
      );
    }

    // If session exists in Admin Auth, they are an admin.
    // Check status
    if (session.user.status !== "active") {
      return c.json(
        {
          error: "Account suspended",
          message: "Your account has been suspended"
        },
        403
      );
    }

    c.set("adminUser", session.user);
    c.set("adminSession", session.session);

    await next();
  } catch (error) {
    console.error("Admin/Owner auth middleware error:", error);
    return c.json(
      {
        error: "Authentication error",
        message: "Failed to verify credentials"
      },
      500
    );
  }
};
