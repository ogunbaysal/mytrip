import { Hono } from "hono";
import { getSessionFromRequest } from "../lib/session.ts";
import { db } from "../db/index.ts";
import { user } from "../db/schemas/index.ts";
import { eq } from "drizzle-orm";

const app = new Hono();

app.post("/refresh-session", async (c) => {
  try {
    const session = await getSessionFromRequest(c);
    if (!session?.user?.id) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const userId = session.user.id;

    // Fetch fresh user data from database
    const [freshUser] = await db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (!freshUser) {
      return c.json({ error: "User not found" }, 404);
    }

    // Return fresh user data - this will update the session when called from auth client
    return c.json({
      success: true,
      user: {
        id: freshUser.id,
        email: freshUser.email,
        name: freshUser.name,
        role: freshUser.role,
        status: freshUser.status,
        subscriptionStatus: freshUser.subscriptionStatus,
      },
    });
  } catch (error) {
    console.error("Refresh session error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

export { app as refreshSessionRoutes };
export default app;
