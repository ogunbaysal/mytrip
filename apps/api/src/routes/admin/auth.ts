import { Hono } from "hono";
import { auth } from "../../lib/auth.ts";
import { db } from "../../db/index.ts";
import { admin, adminSession, adminRoles, adminPermissions, adminRolePermissions } from "../../db/schemas/index.ts";
import { eq, desc, sql, and } from "drizzle-orm";

type Variables = {
  adminUser: typeof admin.$inferSelect;
  adminSession: typeof adminSession.$inferSelect;
}

const app = new Hono<{ Variables: Variables }>();

/**
 * Get current admin session
 * GET /admin/auth/session
 */
app.get("/session", async (c) => {
  const adminUser = c.get("adminUser");
  const session = c.get("adminSession");

  return c.json({
    user: adminUser, // Frontend expects 'user' key often, but contains admin data
    session: session,
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
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: adminRoles.name, // Return role name
        roleId: admin.roleId,
        status: admin.status,
        createdAt: admin.createdAt,
        lastLoginAt: admin.lastLoginAt,
      })
      .from(admin)
      .leftJoin(adminRoles, eq(admin.roleId, adminRoles.id))
      .orderBy(desc(admin.createdAt));

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
 * Get specific admin detail
 * GET /admin/auth/admins/:id
 */
app.get("/admins/:id", async (c) => {
  try {
    const { id } = c.req.param();
    const adminUser = await db
      .select({
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: adminRoles.name,
        roleId: admin.roleId,
        status: admin.status,
        createdAt: admin.createdAt,
        lastLoginAt: admin.lastLoginAt,
      })
      .from(admin)
      .leftJoin(adminRoles, eq(admin.roleId, adminRoles.id))
      .where(eq(admin.id, id))
      .limit(1);

    if (adminUser.length === 0) {
      return c.json({ error: "Admin not found" }, 404);
    }

    return c.json({ admin: adminUser[0] });
  } catch (error) {
    console.error("Failed to fetch admin:", error);
    return c.json({ error: "Failed to fetch admin" }, 500);
  }
});

/**
 * Update admin user
 * PUT /admin/auth/admins/:id
 */
app.put("/admins/:id", async (c) => {
  try {
    const { id } = c.req.param();
    const { name, email, roleId, status } = await c.req.json();
    const currentAdmin = c.get("adminUser");

    // TODO: Add permission check for 'manage:admins' or similar

    // Update logic
    await db
      .update(admin)
      .set({
        name,
        email, // Note: Changing email might require re-verification or auth system update depending on config
        roleId,
        status,
        updatedAt: new Date(),
      })
      .where(eq(admin.id, id));

    return c.json({ success: true, message: "Admin updated successfully" });
  } catch (error) {
    console.error("Failed to update admin:", error);
    return c.json({ error: "Failed to update admin" }, 500);
  }
});

/**
 * Create new admin user (super admin only / permission restricted)
 * POST /admin/auth/admins
 */
app.post("/admins", async (c) => {
  try {
    const adminUser = c.get("adminUser");
    
    // Check permission
    const hasPermission = await db
        .select()
        .from(adminRolePermissions)
        .innerJoin(adminPermissions, eq(adminRolePermissions.permissionId, adminPermissions.id))
        .where(
            and(
                eq(adminRolePermissions.roleId, adminUser.roleId || ""),
                eq(adminPermissions.slug, "create:admin")
            )
        )
        .limit(1);

    if (hasPermission.length === 0) {
        return c.json(
            {
                error: "Insufficient permissions",
                message: "You do not have permission to create admin accounts"
            },
            403
        );
    }

    const { name, email, password, roleId } = await c.req.json();
    // ... rest of logic

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
      .from(admin)
      .where(eq(admin.email, email))
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

    // Manually assign role in DB since it's restricted in auth config
    if (result.user && roleId) {
      await db
        .update(admin)
        .set({ roleId })
        .where(eq(admin.id, result.user.id));
    }

    return c.json({
      success: true,
      message: "Admin user created successfully",
      user: {
        id: result.user?.id,
        name: result.user?.name,
        email: result.user?.email,
        roleId: roleId,
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
        id: adminSession.id,
        userId: adminSession.userId,
        ipAddress: adminSession.ipAddress,
        userAgent: adminSession.userAgent,
        createdAt: adminSession.createdAt,
        updatedAt: adminSession.updatedAt,
        expiresAt: adminSession.expiresAt,
        userName: admin.name,
        userEmail: admin.email,
        // userRole: admin.role, // role is now roleId or relation
      })
      .from(adminSession)
      .leftJoin(admin, eq(adminSession.userId, admin.id))
      .where(
        sql`${adminSession.expiresAt} > NOW()` // Only active sessions
      )
      .orderBy(desc(adminSession.updatedAt));

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
      .delete(adminSession)
      .where(eq(adminSession.id, sessionId))
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