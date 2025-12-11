
import { Hono } from "hono";
import { db } from "../../db/index.ts";
import { placeCategory } from "../../db/schemas/index.ts";
import { eq, desc, ilike, sql } from "drizzle-orm";
import { nanoid } from "nanoid";

const app = new Hono();

// GET /admin/categories
app.get("/", async (c) => {
  try {
    const categories = await db
      .select()
      .from(placeCategory)
      .orderBy(desc(placeCategory.createdAt));

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
      .from(placeCategory)
      .where(eq(placeCategory.id, id))
      .limit(1);

    if (!category) return c.json({ error: "Category not found" }, 404);
    return c.json({ category });
  } catch (error) {
    return c.json({ error: "Failed to fetch category" }, 500);
  }
});

// POST /admin/categories
app.post("/", async (c) => {
  try {
    const data = await c.req.json();
    const slug = data.slug || data.name.toLowerCase().replace(/\s+/g, "-") + "-" + nanoid(4);

    const [newCategory] = await db
      .insert(placeCategory)
      .values({
        id: nanoid(),
        name: data.name,
        slug,
        icon: data.icon,
        description: data.description,
      })
      .returning();

    return c.json({ success: true, category: newCategory });
  } catch (error) {
    console.error("Create category error:", error);
    return c.json({ error: "Failed to create category" }, 500);
  }
});

// PUT /admin/categories/:id
app.put("/:id", async (c) => {
  try {
    const { id } = c.req.param();
    const data = await c.req.json();
    const { id: _, createdAt, updatedAt, ...updates } = data;

    const [updatedCategory] = await db
      .update(placeCategory)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(placeCategory.id, id))
      .returning();

    if (!updatedCategory) return c.json({ error: "Category not found" }, 404);
    return c.json({ success: true, category: updatedCategory });
  } catch (error) {
    console.error("Update category error:", error);
    return c.json({ error: "Failed to update category" }, 500);
  }
});

// DELETE /admin/categories/:id
app.delete("/:id", async (c) => {
  try {
    const { id } = c.req.param();
    const [deleted] = await db
      .delete(placeCategory)
      .where(eq(placeCategory.id, id))
      .returning();

    if (!deleted) return c.json({ error: "Category not found" }, 404);
    return c.json({ success: true, message: "Category deleted" });
  } catch (error) {
    console.error("Delete category error:", error);
    // Likely FK constraint error if places exist
    return c.json({ error: "Failed to delete category. It might be in use." }, 500);
  }
});

export default app;
