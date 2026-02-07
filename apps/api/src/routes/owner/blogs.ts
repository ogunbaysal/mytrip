import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "../../db/index.ts";
import {
  blog,
  blogCategory,
  file,
  subscription,
  subscriptionPlan,
} from "../../db/schemas/index.ts";
import { getSessionFromRequest } from "../../lib/session.ts";
import {
  estimateReadTimeMinutes,
  makeUniqueSlug,
  parseJsonStringArray,
  resolveBlogCategoryId,
  resolveSingleFileId,
  serializeJsonStringArray,
  syncBlogImages,
} from "../../lib/blog-relations.ts";
import { resolvePublicFileUrl } from "../../lib/place-relations.ts";

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
  categoryId: z.string().optional(),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  featured: z.boolean().optional(),
  seoTitle: z.string().max(100).optional(),
  seoDescription: z.string().max(300).optional(),
  seoKeywords: z.array(z.string()).optional(),
  language: z.enum(["tr", "en"]).default("tr"),
});

const updateBlogSchema = createBlogSchema.partial();

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value || "", 10);
  if (Number.isNaN(parsed) || parsed <= 0) return fallback;
  return parsed;
}

async function checkBlogLimit(
  userId: string,
): Promise<{ allowed: boolean; current: number; max: number }> {
  const [subscriptionData] = await db
    .select({
      maxBlogs: subscriptionPlan.maxBlogs,
      endDate: subscription.endDate,
      status: subscription.status,
    })
    .from(subscription)
    .innerJoin(subscriptionPlan, eq(subscription.planId, subscriptionPlan.id))
    .where(eq(subscription.userId, userId))
    .orderBy(desc(subscription.createdAt))
    .limit(1);

  if (!subscriptionData) {
    return { allowed: false, current: 0, max: 0 };
  }

  const endDate = new Date(subscriptionData.endDate);
  const now = new Date();
  if (endDate < now || subscriptionData.status !== "active") {
    return { allowed: false, current: 0, max: 0 };
  }

  const [blogCount] = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(blog)
    .where(eq(blog.authorId, userId));

  const maxBlogs = subscriptionData.maxBlogs || 0;
  return {
    allowed: Number(blogCount.count || 0) < maxBlogs,
    current: Number(blogCount.count || 0),
    max: maxBlogs,
  };
}

type OwnerBlogRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  heroImageId: string | null;
  featuredImageId: string | null;
  categoryId: string | null;
  categorySlug: string | null;
  categoryName: string | null;
  tags: string | null;
  status: "published" | "draft" | "archived" | "pending_review";
  featured: boolean;
  authorId: string | null;
  publishedAt: Date | null;
  views: number;
  readTime: number | null;
  likeCount: number;
  shareCount: number;
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string | null;
  language: "tr" | "en";
  createdAt: Date;
  updatedAt: Date;
};

async function getFileUrlMap(fileIds: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (fileIds.length === 0) return map;

  const rows = await db
    .select({ id: file.id, url: file.url })
    .from(file)
    .where(inArray(file.id, fileIds));

  for (const row of rows) {
    map.set(row.id, resolvePublicFileUrl(row.url));
  }

  return map;
}

async function hydrateOwnerBlogs(rows: OwnerBlogRow[]) {
  if (rows.length === 0) return [];

  const fileIds = Array.from(
    new Set(
      rows
        .flatMap((row) => [row.heroImageId, row.featuredImageId])
        .filter((value): value is string => Boolean(value)),
    ),
  );
  const fileUrlMap = await getFileUrlMap(fileIds);

  return rows.map((row) => ({
    ...row,
    heroImage: row.heroImageId ? (fileUrlMap.get(row.heroImageId) ?? null) : null,
    featuredImage: row.featuredImageId
      ? (fileUrlMap.get(row.featuredImageId) ?? null)
      : null,
    category: row.categorySlug,
    tags: parseJsonStringArray(row.tags),
    seoKeywords: parseJsonStringArray(row.seoKeywords),
  }));
}

const ownerBlogSelect = {
  id: blog.id,
  slug: blog.slug,
  title: blog.title,
  excerpt: blog.excerpt,
  content: blog.content,
  heroImageId: blog.heroImageId,
  featuredImageId: blog.featuredImageId,
  categoryId: blog.categoryId,
  categorySlug: blogCategory.slug,
  categoryName: blogCategory.name,
  tags: blog.tags,
  status: blog.status,
  featured: blog.featured,
  authorId: blog.authorId,
  publishedAt: blog.publishedAt,
  views: blog.views,
  readTime: blog.readTime,
  likeCount: blog.likeCount,
  shareCount: blog.shareCount,
  seoTitle: blog.seoTitle,
  seoDescription: blog.seoDescription,
  seoKeywords: blog.seoKeywords,
  language: blog.language,
  createdAt: blog.createdAt,
  updatedAt: blog.updatedAt,
};

app.get("/categories", async (c) => {
  try {
    const categories = await db
      .select({
        id: blogCategory.id,
        slug: blogCategory.slug,
        name: blogCategory.name,
        description: blogCategory.description,
      })
      .from(blogCategory)
      .where(eq(blogCategory.active, true))
      .orderBy(asc(blogCategory.sortOrder), asc(blogCategory.name));

    return c.json({ categories });
  } catch (error) {
    console.error("Get owner blog categories error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.get("/", async (c) => {
  try {
    const session = await getSessionFromRequest(c);
    if (!session?.user?.id) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const userId = session.user.id;
    const page = parsePositiveInt(c.req.query("page"), 1);
    const limit = parsePositiveInt(c.req.query("limit"), 20);
    const offset = (page - 1) * limit;
    const status = c.req.query("status");

    const whereConditions = [eq(blog.authorId, userId)];
    if (status && blogStatusEnum.includes(status as any)) {
      whereConditions.push(eq(blog.status, status as any));
    }

    const [totalCount] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(blog)
      .where(and(...whereConditions));

    const rows = await db
      .select(ownerBlogSelect)
      .from(blog)
      .leftJoin(blogCategory, eq(blog.categoryId, blogCategory.id))
      .where(and(...whereConditions))
      .orderBy(desc(blog.createdAt))
      .limit(limit)
      .offset(offset);

    const blogs = await hydrateOwnerBlogs(rows);

    return c.json({
      blogs,
      pagination: {
        page,
        limit,
        total: Number(totalCount.count || 0),
        totalPages: Math.ceil(Number(totalCount.count || 0) / limit),
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

    const categoryId = await resolveBlogCategoryId({
      categoryId: data.categoryId,
      categorySlug: data.category,
    });
    const heroImageId = await resolveSingleFileId(data.heroImage);
    const featuredImageId = await resolveSingleFileId(data.featuredImage);

    const [created] = await db
      .insert(blog)
      .values({
        id: nanoid(),
        slug: data.slug ? data.slug.trim() : makeUniqueSlug(data.title),
        title: data.title.trim(),
        excerpt: data.excerpt || null,
        content: data.content,
        heroImageId,
        featuredImageId,
        categoryId,
        tags: serializeJsonStringArray(data.tags),
        status: "pending_review",
        featured: false,
        authorId: userId,
        publishedAt: null,
        views: 0,
        readTime: estimateReadTimeMinutes(data.content),
        likeCount: 0,
        shareCount: 0,
        seoTitle: data.seoTitle || null,
        seoDescription: data.seoDescription || null,
        seoKeywords: serializeJsonStringArray(data.seoKeywords),
        language: data.language || "tr",
      })
      .returning({ id: blog.id });

    await syncBlogImages(created.id, data.images);

    const [savedRow] = await db
      .select(ownerBlogSelect)
      .from(blog)
      .leftJoin(blogCategory, eq(blog.categoryId, blogCategory.id))
      .where(eq(blog.id, created.id))
      .limit(1);

    const [saved] = await hydrateOwnerBlogs(savedRow ? [savedRow] : []);

    return c.json(
      {
        success: true,
        message:
          "Blog yazınız başarıyla oluşturuldu. İncelendikten sonra yayınlanacaktır.",
        blog: saved,
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

    const [row] = await db
      .select(ownerBlogSelect)
      .from(blog)
      .leftJoin(blogCategory, eq(blog.categoryId, blogCategory.id))
      .where(and(eq(blog.id, id), eq(blog.authorId, userId)))
      .limit(1);

    if (!row) {
      return c.json({ error: "Blog post not found" }, 404);
    }

    const [hydrated] = await hydrateOwnerBlogs([row]);
    return c.json({ blog: hydrated });
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

    const [existing] = await db
      .select()
      .from(blog)
      .where(and(eq(blog.id, id), eq(blog.authorId, userId)))
      .limit(1);

    if (!existing) {
      return c.json({ error: "Blog post not found" }, 404);
    }

    const categoryId =
      "categoryId" in data || "category" in data
        ? await resolveBlogCategoryId({
            categoryId: data.categoryId,
            categorySlug: data.category,
          })
        : existing.categoryId;

    const heroImageId =
      "heroImage" in data ? await resolveSingleFileId(data.heroImage) : existing.heroImageId;
    const featuredImageId =
      "featuredImage" in data
        ? await resolveSingleFileId(data.featuredImage)
        : existing.featuredImageId;

    const nextContent =
      "content" in data ? String(data.content || "") : existing.content || "";

    await db
      .update(blog)
      .set({
        title: "title" in data ? String(data.title || "") : existing.title,
        slug:
          "slug" in data
            ? String(data.slug || existing.slug).trim()
            : existing.slug,
        excerpt:
          "excerpt" in data
            ? data.excerpt
              ? String(data.excerpt)
              : null
            : existing.excerpt,
        content: "content" in data ? nextContent : existing.content,
        heroImageId,
        featuredImageId,
        categoryId,
        tags:
          "tags" in data ? serializeJsonStringArray(data.tags) : existing.tags,
        seoTitle:
          "seoTitle" in data
            ? data.seoTitle
              ? String(data.seoTitle)
              : null
            : existing.seoTitle,
        seoDescription:
          "seoDescription" in data
            ? data.seoDescription
              ? String(data.seoDescription)
              : null
            : existing.seoDescription,
        seoKeywords:
          "seoKeywords" in data
            ? serializeJsonStringArray(data.seoKeywords)
            : existing.seoKeywords,
        language: "language" in data ? data.language || "tr" : existing.language,
        readTime: estimateReadTimeMinutes(nextContent),
        updatedAt: new Date(),
      })
      .where(and(eq(blog.id, id), eq(blog.authorId, userId)));

    if ("images" in data) {
      await syncBlogImages(id, data.images);
    }

    const [row] = await db
      .select(ownerBlogSelect)
      .from(blog)
      .leftJoin(blogCategory, eq(blog.categoryId, blogCategory.id))
      .where(and(eq(blog.id, id), eq(blog.authorId, userId)))
      .limit(1);

    const [saved] = await hydrateOwnerBlogs(row ? [row] : []);

    return c.json({
      success: true,
      message: "Blog yazınız başarıyla güncellendi",
      blog: saved,
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
      .select({ status: blog.status })
      .from(blog)
      .where(and(eq(blog.id, id), eq(blog.authorId, userId)))
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
      .update(blog)
      .set({ status: "pending_review", updatedAt: new Date() })
      .where(and(eq(blog.id, id), eq(blog.authorId, userId)));

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

    const [existing] = await db
      .select({ id: blog.id })
      .from(blog)
      .where(and(eq(blog.id, id), eq(blog.authorId, userId)))
      .limit(1);

    if (!existing) {
      return c.json({ error: "Blog post not found" }, 404);
    }

    await db.delete(blog).where(and(eq(blog.id, id), eq(blog.authorId, userId)));

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
