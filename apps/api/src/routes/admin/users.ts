import { Hono } from "hono";
import { db } from "../../db";
import { user } from "../../db/schemas";
import { eq, desc, ilike, sql } from "drizzle-orm";

const app = new Hono();

/**
 * Get all users with pagination and filtering
 * GET /admin/users
 */
app.get("/", async (c) => {
  try {
    const {
      page = "1",
      limit = "20",
      search = "",
      role = "",
      status = "",
      sortBy = "createdAt",
      sortOrder = "desc",
    } = c.req.query();

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const limitInt = parseInt(limit);

    // Build where conditions
    const conditions = [];

    if (search) {
      conditions.push(
        sql`(LOWER(${user.name}) ILIKE ${'%' + search.toLowerCase() + '%'} OR LOWER(${user.email}) ILIKE ${'%' + search.toLowerCase() + '%'})`
      );
    }

    if (role) {
      conditions.push(eq(user.role, role as any));
    }

    if (status) {
      conditions.push(eq(user.status, status as any));
    }

    const whereClause = conditions.length > 0 ? sql`${conditions.join(" AND ")}` : sql`1=1`;

    // Build order by clause
    const orderByColumn = {
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    }[sortBy] || user.createdAt;

    const orderDirection = sortOrder === "asc" ? sql`ASC` : sql`DESC`;

    // Get total count
    const [{ count }] = await db
      .select({ count: sql`COUNT(*)::int` })
      .from(user)
      .where(whereClause);

    // Get users
    const users = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        phone: user.phone,
        avatar: user.avatar,
        emailVerified: user.emailVerified,
        placeCount: user.placeCount,
        subscriptionStatus: user.subscriptionStatus,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })
      .from(user)
      .where(whereClause)
      .orderBy(sql`${orderByColumn} ${orderDirection}`)
      .limit(limitInt)
      .offset(offset);

    return c.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: limitInt,
        total: count,
        totalPages: Math.ceil(count / limitInt),
      },
    });
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return c.json(
      {
        error: "Failed to fetch users",
        message: "Unable to retrieve users"
      },
      500
    );
  }
});

/**
 * Get user by ID
 * GET /admin/users/:userId
 */
app.get("/:userId", async (c) => {
  try {
    const { userId } = c.req.param();

    const [userData] = await db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (!userData) {
      return c.json(
        {
          error: "User not found",
          message: "The specified user does not exist"
        },
        404
      );
    }

    return c.json({ user: userData });
  } catch (error) {
    console.error("Failed to fetch user:", error);
    return c.json(
      {
        error: "Failed to fetch user",
        message: "Unable to retrieve user details"
      },
      500
    );
  }
});

/**
 * Update user
 * PUT /admin/users/:userId
 */
app.put("/:userId", async (c) => {
  try {
    const { userId } = c.req.param();
    const updates = await c.req.json();

    // Remove sensitive fields that shouldn't be updated directly
    const { id, createdAt, updatedAt, ...allowedUpdates } = updates;

    // Validate role if being updated
    if (allowedUpdates.role && !["admin", "owner", "traveler"].includes(allowedUpdates.role)) {
      return c.json(
        {
          error: "Invalid role",
          message: "Role must be one of: admin, owner, traveler"
        },
        400
      );
    }

    // Validate status if being updated
    if (allowedUpdates.status && !["active", "suspended", "pending"].includes(allowedUpdates.status)) {
      return c.json(
        {
          error: "Invalid status",
          message: "Status must be one of: active, suspended, pending"
        },
        400
      );
    }

    const [updatedUser] = await db
      .update(user)
      .set({
        ...allowedUpdates,
        updatedAt: new Date(),
      })
      .where(eq(user.id, userId))
      .returning();

    if (!updatedUser) {
      return c.json(
        {
          error: "User not found",
          message: "The specified user does not exist"
        },
        404
      );
    }

    return c.json({
      success: true,
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Failed to update user:", error);
    return c.json(
      {
        error: "Failed to update user",
        message: "Unable to update user details"
      },
      500
    );
  }
});

/**
 * Update user status (suspend/activate)
 * PATCH /admin/users/:userId/status
 */
app.patch("/:userId/status", async (c) => {
  try {
    const { userId } = c.req.param();
    const { status, reason } = await c.req.json();

    if (!["active", "suspended", "pending"].includes(status)) {
      return c.json(
        {
          error: "Invalid status",
          message: "Status must be one of: active, suspended, pending"
        },
        400
      );
    }

    const [updatedUser] = await db
      .update(user)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(user.id, userId))
      .returning();

    if (!updatedUser) {
      return c.json(
        {
          error: "User not found",
          message: "The specified user does not exist"
        },
        404
      );
    }

    return c.json({
      success: true,
      message: `User ${status} successfully`,
      user: updatedUser,
      reason: reason || null,
    });
  } catch (error) {
    console.error("Failed to update user status:", error);
    return c.json(
      {
        error: "Failed to update user status",
        message: "Unable to update user status"
      },
      500
    );
  }
});

/**
 * Get user statistics
 * GET /admin/users/stats
 */
app.get("/stats", async (c) => {
  try {
    // Get user counts by role
    const roleStats = await db
      .select({
        role: user.role,
        count: sql`COUNT(*)::int`,
      })
      .from(user)
      .groupBy(user.role);

    // Get user counts by status
    const statusStats = await db
      .select({
        status: user.status,
        count: sql`COUNT(*)::int`,
      })
      .from(user)
      .groupBy(user.status);

    // Get recent users (last 30 days)
    const recentUsers = await db
      .select({
        count: sql`COUNT(*)::int`,
      })
      .from(user)
      .where(sql`${user.createdAt} >= NOW() - INTERVAL '30 days'`);

    // Get users with places
    const usersWithPlaces = await db
      .select({
        count: sql`COUNT(*)::int`,
      })
      .from(user)
      .where(sql`${user.placeCount} > 0`);

    const stats = {
      totalUsers: roleStats.reduce((sum, stat) => sum + stat.count, 0),
      byRole: roleStats.reduce((acc, stat) => {
        acc[stat.role] = stat.count;
        return acc;
      }, {} as Record<string, number>),
      byStatus: statusStats.reduce((acc, stat) => {
        acc[stat.status] = stat.count;
        return acc;
      }, {} as Record<string, number>),
      recentUsers: recentUsers[0]?.count || 0,
      usersWithPlaces: usersWithPlaces[0]?.count || 0,
    };

    return c.json({ stats });
  } catch (error) {
    console.error("Failed to fetch user stats:", error);
    return c.json(
      {
        error: "Failed to fetch user statistics",
        message: "Unable to retrieve user statistics"
      },
      500
    );
  }
});

export { app as usersRoutes };