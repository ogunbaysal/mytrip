import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../db/index.ts";
import { user } from "../db/schemas/index.ts";
import { eq } from "drizzle-orm";
import { getSessionFromRequest } from "../lib/session.ts";

const updateProfileSchema = z.object({
  name: z
    .string()
    .min(2, "Ad en az 2 karakter olmalıdır")
    .max(100, "Ad en fazla 100 karakter olabilir"),
  phone: z.string().optional(),
  bio: z
    .string()
    .max(500, "Biyografi en fazla 500 karakter olabilir")
    .optional(),
});

export const profileRoutes = new Hono();

profileRoutes.get("/", async (c) => {
  try {
    const session = await getSessionFromRequest(c);
    const userId = session?.session?.userId || session?.user?.id;

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const profile = await db.query.user.findFirst({
      where: eq(user.id, userId),
    });

    return c.json({ user: profile });
  } catch (error) {
    console.error("Profile get error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

profileRoutes.put("/update", async (c) => {
  try {
    const session = await getSessionFromRequest(c);
    const userId = session?.session?.userId || session?.user?.id;

    if (!userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const body = await c.req.json();
    const validated = updateProfileSchema.parse(body);

    await db
      .update(user)
      .set({
        name: validated.name,
        phone: validated.phone || null,
        bio: validated.bio || null,
        updatedAt: new Date(),
      })
      .where(eq(user.id, userId));

    const updatedProfile = await db.query.user.findFirst({
      where: eq(user.id, userId),
    });

    return c.json({
      success: true,
      message: "Profil güncellendi",
      user: updatedProfile,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: "Validation failed", issues: error.issues }, 400);
    }

    console.error("Profile update error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});
