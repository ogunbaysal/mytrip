import { Hono } from "hono";
import { auth } from "../../lib/auth";
import { db } from "../../db";
import { user, session as sessionTable } from "../../db/schemas";
import { eq, desc, sql } from "drizzle-orm";

type Variables = {
  adminUser: typeof user.$inferSelect;
  adminSession: typeof sessionTable.$inferSelect;
}

const app = new Hono<{ Variables: Variables }>();

/**
 * Get current admin session
 * GET /admin/auth/session
 */
app.get("/session", async (c) => {
  const adminUser = c.get("adminUser");
  const adminSession = c.get("adminSession");

  return c.json({
    user: adminUser,
    session: adminSession,
  });
});

/**
 * Get all admin users (super admin only)
 * GET /admin/auth/admins
 */
app.get("/admins", async (c) => {
  try {
    const admins = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        placeCount: user.placeCount,
      })
      .from(user)
      .where(eq(user.role, "admin"))
      .orderBy(desc(user.createdAt));

    return c.json({ admins });
  } catch (error) {
    console.error("Failed to fetch admins:", error);
    return c.json(
      {
        error: "Failed to fetch admins",
        message: "Unable to retrieve admin users"
      },
      500
    );
  }
});

/**
 * Create new admin user (super admin only)
 * POST /admin/auth/admins
 */
app.post("/admins", async (c) => {
  try {
    const { name, email, password } = await c.req.json();

    if (!name || !email || !password) {
      return c.json(
        {
          error: "Missing required fields",
          message: "Name, email, and password are required"
        },
        400
      );
    }

    // Check if user already exists
    const existingUser = await db
      .select()
      .from(user)
      .where(eq(user.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return c.json(
        {
          error: "User already exists",
          message: "A user with this email already exists"
        },
        409
      );
    }

    // Create admin user using Better Auth
    const result = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name,
      },
    });

    // Update user role to admin in database
    if (result.user) {
      await db
        .update(user)
        .set({ role: "admin" })
        .where(eq(user.id, result.user.id));
    }

    return c.json({
      success: true,
      message: "Admin user created successfully",
      user: {
        id: result.user?.id,
        name: result.user?.name,
        email: result.user?.email,
        role: "admin",
      },
    });
  } catch (error) {
    console.error("Failed to create admin:", error);
    return c.json(
      {
        error: "Failed to create admin",
        message: "Unable to create admin user"
      },
      500
    );
  }
});

/**
 * Get all active sessions
 * GET /admin/auth/sessions
 */
app.get("/sessions", async (c) => {
  try {
    const sessions = await db
      .select({
        id: sessionTable.id,
        userId: sessionTable.userId,
        ipAddress: sessionTable.ipAddress,
        userAgent: sessionTable.userAgent,
        createdAt: sessionTable.createdAt,
        updatedAt: sessionTable.updatedAt,
        expiresAt: sessionTable.expiresAt,
        userName: user.name,
        userEmail: user.email,
        userRole: user.role,
      })
      .from(sessionTable)
      .leftJoin(user, eq(sessionTable.userId, user.id))
      .where(
        sql`${sessionTable.expiresAt} > NOW()` // Only active sessions
      )
      .orderBy(desc(sessionTable.updatedAt));

    return c.json({ sessions });
  } catch (error) {
    console.error("Failed to fetch sessions:", error);
    return c.json(
      {
        error: "Failed to fetch sessions",
        message: "Unable to retrieve active sessions"
      },
      500
    );
  }
});

/**
 * Revoke a session
 * DELETE /admin/auth/sessions/:sessionId
 */
app.delete("/sessions/:sessionId", async (c) => {
  try {
    const { sessionId } = c.req.param();

    // Delete the session
    const result = await db
      .delete(sessionTable)
      .where(eq(sessionTable.id, sessionId))
      .returning();

    if (result.length === 0) {
      return c.json(
        {
          error: "Session not found",
          message: "The specified session does not exist"
        },
        404
      );
    }

    return c.json({
      success: true,
      message: "Session revoked successfully",
    });
  } catch (error) {
    console.error("Failed to revoke session:", error);
    return c.json(
      {
        error: "Failed to revoke session",
        message: "Unable to revoke the specified session"
      },
      500
    );
  }
});

export { app as authRoutes };