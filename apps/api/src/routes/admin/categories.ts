
import { Hono } from "hono";
import { db } from "../../db/index.ts";
import { placeKind } from "../../db/schemas/index.ts";
import { eq, desc } from "drizzle-orm";

const app = new Hono();

// GET /admin/categories
app.get("/", async (c) => {
  try {
    const categories = await db
      .select()
      .from(placeKind)
      .orderBy(desc(placeKind.createdAt));

    return c.json({ categories });
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return c.json({ error: "Failed to fetch categories" }, 500);
  }
});

// GET /admin/categories/:id
app.get("/:id", async (c) => {
  try {
    const { id } = c.req.param();
    const [category] = await db
      .select()
      .from(placeKind)
      .where(eq(placeKind.id, id))
      .limit(1);

    if (!category) return c.json({ error: "Category not found" }, 404);
    return c.json({ category });
  } catch (error) {
    return c.json({ error: "Failed to fetch category" }, 500);
  }
});

// PUT /admin/categories/:id
app.put("/:id", async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const { id: _, createdAt, updatedAt, ...updates } = data;

    const [updatedCategory] = await db
      .update(placeKind)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(placeKind.id, id))
      .returning();

    if (!updatedCategory) return c.json({ error: "Category not found" }, 404);
    return c.json({ success: true, category: updatedCategory });
  } catch (error) {
    console.error("Update category error:", error);
    return c.json({ error: "Failed to update category" }, 500);
  }
});

export default app;
