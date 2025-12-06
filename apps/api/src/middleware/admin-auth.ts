import { Context, Next } from "hono";
import { auth } from "../lib/auth";

/**
 * Middleware to protect admin routes
 * Ensures user is authenticated and has admin role
 */
export const adminAuth = async (c: Context, next: Next) => {
  try {
    // Get session from Better Auth
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });

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

    // Check if user has admin role
    if (session.user.role !== "admin") {
      return c.json(
        {
          error: "Insufficient permissions",
          message: "Admin access required for this resource"
        },
        403
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
 * Used for routes where both admin and resource owners can access
 */
export const adminOrOwnerAuth = async (c: Context, next: Next) => {
  try {
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });

    if (!session || !session.user) {
      return c.json(
        {
          error: "Authentication required",
          message: "Please sign in to access this resource"
        },
        401
      );
    }

    // Allow admin and owner roles
    const userRole = session.user.role || "";
    if (!["admin", "owner"].includes(userRole)) {
      return c.json(
        {
          error: "Insufficient permissions",
          message: "Admin or owner access required for this resource"
        },
        403
      );
    }

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