import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { db } from "../../db/index.ts";
import {
  blogPost,
  subscription,
  subscriptionPlan,
  user,
} from "../../db/schemas/index.ts";
import { eq, and, desc, sql, gte, lte } from "drizzle-orm";
import { getSessionFromRequest } from "../../lib/session.ts";

const app = new Hono();

const blogStatusEnum = [
  "draft",
  "pending_review",
  "published",
  "archived",
] as const;

const createBlogSchema = z.object({
  title: z.string().min(2).max(200),
  slug: z.string().min(1).max(200).optional(),
  excerpt: z.string().max(500).optional(),
  content: z.string().min(10),
  heroImage: z.string().optional(),
  featuredImage: z.string().optional(),
  images: z.array(z.string()).optional(),
  category: z.enum([
    "travel",
    "food",
    "culture",
    "history",
    "activity",
    "lifestyle",
    "business",
  ]),
  tags: z.array(z.string()).optional(),
  featured: z.boolean().optional(),
  seoTitle: z.string().max(100).optional(),
  seoDescription: z.string().max(300).optional(),
  seoKeywords: z.array(z.string()).optional(),
  language: z.enum(["tr", "en"]).default("tr"),
  readingLevel: z.enum(["easy", "medium", "hard"]).default("medium"),
  targetAudience: z
    .enum(["travelers", "locals", "business_owners", "all"])
    .default("travelers"),
});

const updateBlogSchema = createBlogSchema.partial();

async function checkBlogLimit(
  userId: string,
): Promise<{ allowed: boolean; current: number; max: number }> {
  const [subscriptionData] = await db
    .select({
      planLimits: subscriptionPlan.limits,
      endDate: subscription.endDate,
      status: subscription.status,
    })
    .from(subscription)
    .innerJoin(subscriptionPlan, eq(subscription.planId, subscriptionPlan.id))
    .where(eq(subscription.userId, userId))
    .limit(1);

  if (!subscriptionData) {
    return { allowed: false, current: 0, max: 0 };
  }

  const endDate = new Date(subscriptionData.endDate);
  const now = new Date();
  if (endDate < now || subscriptionData.status !== "active") {
    return { allowed: false, current: 0, max: 0 };
  }

  const planLimits =
    typeof subscriptionData.planLimits === "string"
      ? JSON.parse(subscriptionData.planLimits)
      : subscriptionData.planLimits;

  const [blogCount] = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(blogPost)
    .where(eq(blogPost.authorId, userId));

  const maxBlogs = planLimits?.maxBlogs || 0;
  return {
    allowed: (blogCount.count as number) < maxBlogs,
    current: blogCount.count as number,
    max: maxBlogs,
  };
}

app.get("/", async (c) => {
  try {
    const session = await getSessionFromRequest(c);
    if (!session?.user?.id) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const userId = session.user.id;
    const { page = "1", limit = "20", status } = c.req.query();
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const limitInt = parseInt(limit);

    const whereConditions = [eq(blogPost.authorId, userId)];
    if (status && blogStatusEnum.includes(status as any)) {
      whereConditions.push(eq(blogPost.status, status as any));
    }

    const [totalCount] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(blogPost)
      .where(and(...whereConditions));

    const blogs = await db
      .select()
      .from(blogPost)
      .where(and(...whereConditions))
      .orderBy(desc(blogPost.createdAt))
      .limit(limitInt)
      .offset(offset);

    return c.json({
      blogs,
      pagination: {
        page: parseInt(page),
        limit: limitInt,
        total: totalCount.count,
        totalPages: Math.ceil(totalCount.count / limitInt),
      },
    });
  } catch (error) {
    console.error("Get owner blogs error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.post("/", zValidator("json", createBlogSchema), async (c) => {
  try {
    const session = await getSessionFromRequest(c);
    if (!session?.user?.id) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const userId = session.user.id;
    const data = c.req.valid("json");
    const { nanoid } = await import("nanoid");

    const limitCheck = await checkBlogLimit(userId);
    if (!limitCheck.allowed) {
      return c.json(
        {
          error: "Plan limit reached",
          message: `Blog limitinize ulaştınız (${limitCheck.current}/${limitCheck.max}). Lütfen abonelik planınızı yükseltin.`,
          current: limitCheck.current,
          max: limitCheck.max,
        },
        403,
      );
    }

    const slug =
      data.slug ||
      data.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    const [newBlog] = await db
      .insert(blogPost)
      .values({
        id: nanoid(),
        slug,
        authorId: userId,
        ...data,
        images: data.images ? JSON.stringify(data.images) : null,
        tags: data.tags ? JSON.stringify(data.tags) : null,
        seoKeywords: data.seoKeywords ? JSON.stringify(data.seoKeywords) : null,
        status: "pending_review",
        featured: false,
        publishedAt: null,
        views: 0,
        readTime: Math.ceil(data.content.split(/\s+/).length / 200),
        likeCount: 0,
        commentCount: 0,
        shareCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return c.json(
      {
        success: true,
        message:
          "Blog yazınız başarıyla oluşturuldu. İncelendikten sonra yayınlanacaktır.",
        blog: newBlog,
      },
      201,
    );
  } catch (error) {
    console.error("Create blog error:", error);
    if (error instanceof z.ZodError) {
      return c.json({ error: "Validation failed", issues: error.issues }, 400);
    }
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.get("/:id", async (c) => {
  try {
    const session = await getSessionFromRequest(c);
    if (!session?.user?.id) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const userId = session.user.id;
    const id = c.req.param("id");

    const [blogData] = await db
      .select()
      .from(blogPost)
      .where(and(eq(blogPost.id, id), eq(blogPost.authorId, userId)))
      .limit(1);

    if (!blogData) {
      return c.json({ error: "Blog post not found" }, 404);
    }

    return c.json({ blog: blogData });
  } catch (error) {
    console.error("Get blog error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.put("/:id", zValidator("json", updateBlogSchema), async (c) => {
  try {
    const session = await getSessionFromRequest(c);
    if (!session?.user?.id) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const userId = session.user.id;
    const id = c.req.param("id");
    const data = c.req.valid("json");

    const [existingBlog] = await db
      .select()
      .from(blogPost)
      .where(and(eq(blogPost.id, id), eq(blogPost.authorId, userId)))
      .limit(1);

    if (!existingBlog) {
      return c.json({ error: "Blog post not found" }, 404);
    }

    const [updatedBlog] = await db
      .update(blogPost)
      .set({
        ...data,
        images: data.images ? JSON.stringify(data.images) : existingBlog.images,
        tags: data.tags ? JSON.stringify(data.tags) : existingBlog.tags,
        seoKeywords: data.seoKeywords
          ? JSON.stringify(data.seoKeywords)
          : existingBlog.seoKeywords,
        readTime: data.content
          ? Math.ceil(data.content.split(/\s+/).length / 200)
          : existingBlog.readTime,
        updatedAt: new Date(),
      })
      .where(and(eq(blogPost.id, id), eq(blogPost.authorId, userId)))
      .returning();

    return c.json({
      success: true,
      message: "Blog yazınız başarıyla güncellendi",
      blog: updatedBlog,
    });
  } catch (error) {
    console.error("Update blog error:", error);
    if (error instanceof z.ZodError) {
      return c.json({ error: "Validation failed", issues: error.issues }, 400);
    }
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.post("/:id/publish", async (c) => {
  try {
    const session = await getSessionFromRequest(c);
    if (!session?.user?.id) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const userId = session.user.id;
    const id = c.req.param("id");

    const [existingBlog] = await db
      .select({ status: blogPost.status })
      .from(blogPost)
      .where(and(eq(blogPost.id, id), eq(blogPost.authorId, userId)))
      .limit(1);

    if (!existingBlog) {
      return c.json({ error: "Blog post not found" }, 404);
    }

    if (existingBlog.status !== "draft") {
      return c.json(
        {
          error: "Blog cannot be submitted",
          message:
            "Sadece taslak durumundaki blog yazıları incelenmek üzere gönderilebilir",
        },
        400,
      );
    }

    await db
      .update(blogPost)
      .set({ status: "pending_review", updatedAt: new Date() })
      .where(and(eq(blogPost.id, id), eq(blogPost.authorId, userId)));

    return c.json({
      success: true,
      message: "Blog yazınız incelenmek üzere gönderildi",
    });
  } catch (error) {
    console.error("Publish blog error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.delete("/:id", async (c) => {
  try {
    const session = await getSessionFromRequest(c);
    if (!session?.user?.id) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const userId = session.user.id;
    const id = c.req.param("id");

    const [existingBlog] = await db
      .select()
      .from(blogPost)
      .where(and(eq(blogPost.id, id), eq(blogPost.authorId, userId)))
      .limit(1);

    if (!existingBlog) {
      return c.json({ error: "Blog post not found" }, 404);
    }

    await db
      .delete(blogPost)
      .where(and(eq(blogPost.id, id), eq(blogPost.authorId, userId)));

    return c.json({
      success: true,
      message: "Blog yazısı başarıyla silindi",
    });
  } catch (error) {
    console.error("Delete blog error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

export { app as blogsRoutes };
