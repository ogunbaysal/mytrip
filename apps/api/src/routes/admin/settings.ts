import { Hono } from "hono";
import { db } from "../../db";
import { settings, user } from "../../db/schemas";
import { eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { auth } from "../../lib/auth";

const router = new Hono();

// GET /settings
router.get("/", async (c) => {
  const allSettings = await db.select().from(settings);
  
  // Convert array to object for easier frontend consumption
  const settingsMap = allSettings.reduce((acc, curr) => {
    acc[curr.key] = curr.value;
    return acc;
  }, {} as Record<string, any>);

  return c.json(settingsMap);
});

// PATCH /settings/:key
router.patch(
  "/:key",
  zValidator(
    "json",
    z.object({
      value: z.record(z.string(), z.any()),
    })
  ) as any,
  async (c) => {
    const key = c.req.param("key");
    const { value } = await c.req.json(); // Use c.req.json() directly if validator types fail validation inference context

    // Check if distinct setting exists
    const existing = await db
      .select()
      .from(settings)
      .where(eq(settings.key, key))
      .limit(1);

    if (existing.length > 0) {
      // Update
      const updated = await db
        .update(settings)
        .set({ 
            value: { ...existing[0].value as object, ...value },
            updatedAt: new Date()
        })
        .where(eq(settings.key, key))
        .returning();
      return c.json(updated[0]);
    } else {
      // Create
      const created = await db
        .insert(settings)
        .values({ key, value })
        .returning();
      return c.json(created[0]);
    }
  }
);

// PUT /profile
router.put(
  "/profile",
  zValidator(
    "json",
    z.object({
      name: z.string().optional(),
      bio: z.string().optional(),
      phone: z.string().optional(),
      avatar: z.string().optional(), // image url
    })
  ) as any,
  async (c) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    
    // In Better Auth, user id comes from session.user.id
    const userId = session.user.id;
    const body = await c.req.json();

    const updated = await db
        .update(user)
        .set({
            ...body,
            updatedAt: new Date()
        })
        .where(eq(user.id, userId))
        .returning();

    return c.json(updated[0]);
  }
);

export default router;
