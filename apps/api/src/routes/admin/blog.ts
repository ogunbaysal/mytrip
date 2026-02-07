import { Hono } from "hono";
import { and, asc, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "../../db/index.ts";
import {
  blog,
  blogCategory,
  blogComment,
  file,
  user,
} from "../../db/schemas/index.ts";
import {
  estimateReadTimeMinutes,
  getBlogCommentCountMap,
  getBlogImageFileIdsMap,
  getBlogImagesMap,
  makeUniqueSlug,
  normalizeSlug,
  parseJsonStringArray,
  resolveBlogCategoryId,
  resolveSingleFileId,
  serializeJsonStringArray,
  syncBlogImages,
  withDefaultPublishedAt,
} from "../../lib/blog-relations.ts";
import { resolvePublicFileUrl } from "../../lib/place-relations.ts";

const app = new Hono();

function parseTimestamp(value: unknown): Date | null | undefined {
  if (value === null) return null;
  if (typeof value === "undefined") return undefined;
  if (value instanceof Date) return value;
  if (typeof value !== "string") return undefined;

  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value || "", 10);
  if (Number.isNaN(parsed) || parsed <= 0) return fallback;
  return parsed;
}

type BlogRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  heroImageId: string | null;
  featuredImageId: string | null;
  categoryId: string | null;
  categoryName: string | null;
  categorySlug: string | null;
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
  authorName: string | null;
  authorEmail: string | null;
};

type HydratedBlogRow = Omit<BlogRow, "tags" | "seoKeywords"> & {
  heroImage: string | null;
  featuredImage: string | null;
  images: string[];
  imageFileIds: string[];
  tags: string[];
  seoKeywords: string[];
  commentCount: number;
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

async function hydrateBlogs(rows: BlogRow[]): Promise<HydratedBlogRow[]> {
  if (rows.length === 0) return [];

  const blogIds = rows.map((row) => row.id);
  const fileIds = Array.from(
    new Set(
      rows
        .flatMap((row) => [row.heroImageId, row.featuredImageId])
        .filter((value): value is string => Boolean(value)),
    ),
  );

  const [imagesMap, imageFileIdsMap, commentCountMap, fileUrlMap] = await Promise.all([
    getBlogImagesMap(blogIds),
    getBlogImageFileIdsMap(blogIds),
    getBlogCommentCountMap(blogIds, "all"),
    getFileUrlMap(fileIds),
  ]);

  return rows.map((row) => ({
    ...row,
    heroImage: row.heroImageId ? (fileUrlMap.get(row.heroImageId) ?? null) : null,
    featuredImage: row.featuredImageId
      ? (fileUrlMap.get(row.featuredImageId) ?? null)
      : null,
    images: imagesMap.get(row.id) ?? [],
    imageFileIds: imageFileIdsMap.get(row.id) ?? [],
    tags: parseJsonStringArray(row.tags),
    seoKeywords: parseJsonStringArray(row.seoKeywords),
    commentCount: commentCountMap.get(row.id) ?? 0,
  }));
}

const baseBlogSelect = {
  id: blog.id,
  slug: blog.slug,
  title: blog.title,
  excerpt: blog.excerpt,
  content: blog.content,
  heroImageId: blog.heroImageId,
  featuredImageId: blog.featuredImageId,
  categoryId: blog.categoryId,
  categoryName: blogCategory.name,
  categorySlug: blogCategory.slug,
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
  authorName: user.name,
  authorEmail: user.email,
};

async function getBlogById(postId: string): Promise<HydratedBlogRow | null> {
  const [row] = await db
    .select(baseBlogSelect)
    .from(blog)
    .leftJoin(blogCategory, eq(blog.categoryId, blogCategory.id))
    .leftJoin(user, eq(blog.authorId, user.id))
    .where(eq(blog.id, postId))
    .limit(1);

  if (!row) return null;
  const [hydrated] = await hydrateBlogs([row]);
  return hydrated ?? null;
}

// ---------------------------------------------------------------------------
// Blog categories
// ---------------------------------------------------------------------------

app.get("/categories", async (c) => {
  try {
    const includeInactive = c.req.query("includeInactive") === "true";
    const whereClause = includeInactive ? undefined : eq(blogCategory.active, true);

    const categories = await db
      .select({
        id: blogCategory.id,
        slug: blogCategory.slug,
        name: blogCategory.name,
        description: blogCategory.description,
        sortOrder: blogCategory.sortOrder,
        active: blogCategory.active,
        createdAt: blogCategory.createdAt,
        updatedAt: blogCategory.updatedAt,
      })
      .from(blogCategory)
      .where(whereClause)
      .orderBy(asc(blogCategory.sortOrder), asc(blogCategory.name));

    const categoryIds = categories.map((category) => category.id);
    const usageRows =
      categoryIds.length > 0
        ? await db
            .select({
              categoryId: blog.categoryId,
              count: sql<number>`COUNT(*)::int`,
            })
            .from(blog)
            .where(inArray(blog.categoryId, categoryIds))
            .groupBy(blog.categoryId)
        : [];

    const usageMap = new Map<string, number>();
    for (const row of usageRows) {
      if (row.categoryId) usageMap.set(row.categoryId, Number(row.count));
    }

    return c.json({
      categories: categories.map((category) => ({
        ...category,
        blogCount: usageMap.get(category.id) ?? 0,
      })),
    });
  } catch (error) {
    console.error("Failed to fetch blog categories:", error);
    return c.json(
      { error: "Failed to fetch blog categories", message: "Unable to load categories" },
      500,
    );
  }
});

app.get("/categories/:id", async (c) => {
  try {
    const { id } = c.req.param();
    const [category] = await db
      .select()
      .from(blogCategory)
      .where(eq(blogCategory.id, id))
      .limit(1);

    if (!category) {
      return c.json(
        { error: "Category not found", message: "Blog category does not exist" },
        404,
      );
    }

    return c.json({ category });
  } catch (error) {
    console.error("Failed to fetch blog category:", error);
    return c.json(
      { error: "Failed to fetch blog category", message: "Unable to load category" },
      500,
    );
  }
});

app.post("/categories", async (c) => {
  try {
    const payload = await c.req.json();
    const name = String(payload.name || "").trim();

    if (name.length < 2) {
      return c.json(
        { error: "Invalid category name", message: "Name must be at least 2 characters" },
        400,
      );
    }

    const slug = normalizeSlug(payload.slug || name);
    if (!slug) {
      return c.json({ error: "Invalid slug", message: "Slug could not be generated" }, 400);
    }

    const [existingBySlug] = await db
      .select({ id: blogCategory.id })
      .from(blogCategory)
      .where(eq(blogCategory.slug, slug))
      .limit(1);

    if (existingBySlug) {
      return c.json(
        { error: "Duplicate slug", message: "A blog category with this slug already exists" },
        409,
      );
    }

    const [created] = await db
      .insert(blogCategory)
      .values({
        id: nanoid(),
        slug,
        name,
        description: payload.description ? String(payload.description) : null,
        sortOrder:
          typeof payload.sortOrder === "number"
            ? payload.sortOrder
            : parsePositiveInt(String(payload.sortOrder || ""), 0),
        active: payload.active === false ? false : true,
      })
      .returning();

    return c.json({
      success: true,
      message: "Blog category created successfully",
      category: created,
    });
  } catch (error) {
    console.error("Failed to create blog category:", error);
    return c.json(
      { error: "Failed to create blog category", message: "Unable to create category" },
      500,
    );
  }
});

app.put("/categories/:id", async (c) => {
  try {
    const { id } = c.req.param();
    const payload = await c.req.json();
    const [existing] = await db
      .select()
      .from(blogCategory)
      .where(eq(blogCategory.id, id))
      .limit(1);

    if (!existing) {
      return c.json(
        { error: "Category not found", message: "Blog category does not exist" },
        404,
      );
    }

    const nextName = payload.name ? String(payload.name).trim() : existing.name;
    const nextSlug = payload.slug
      ? normalizeSlug(payload.slug)
      : payload.name
        ? normalizeSlug(payload.name)
        : existing.slug;

    if (!nextSlug) {
      return c.json({ error: "Invalid slug", message: "Slug could not be generated" }, 400);
    }

    const [duplicateSlug] = await db
      .select({ id: blogCategory.id })
      .from(blogCategory)
      .where(and(eq(blogCategory.slug, nextSlug), sql`${blogCategory.id} <> ${id}`))
      .limit(1);

    if (duplicateSlug) {
      return c.json(
        { error: "Duplicate slug", message: "A blog category with this slug already exists" },
        409,
      );
    }

    const [updated] = await db
      .update(blogCategory)
      .set({
        name: nextName,
        slug: nextSlug,
        description:
          "description" in payload ? (payload.description ? String(payload.description) : null) : existing.description,
        sortOrder:
          "sortOrder" in payload
            ? typeof payload.sortOrder === "number"
              ? payload.sortOrder
              : parsePositiveInt(String(payload.sortOrder || ""), 0)
            : existing.sortOrder,
        active: "active" in payload ? Boolean(payload.active) : existing.active,
        updatedAt: new Date(),
      })
      .where(eq(blogCategory.id, id))
      .returning();

    return c.json({
      success: true,
      message: "Blog category updated successfully",
      category: updated,
    });
  } catch (error) {
    console.error("Failed to update blog category:", error);
    return c.json(
      { error: "Failed to update blog category", message: "Unable to update category" },
      500,
    );
  }
});

app.delete("/categories/:id", async (c) => {
  try {
    const { id } = c.req.param();
    const [usage] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(blog)
      .where(eq(blog.categoryId, id));

    if (Number(usage?.count || 0) > 0) {
      return c.json(
        {
          error: "Category is in use",
          message: "Cannot delete category while blogs are assigned to it",
        },
        400,
      );
    }

    const [deleted] = await db
      .delete(blogCategory)
      .where(eq(blogCategory.id, id))
      .returning();

    if (!deleted) {
      return c.json(
        { error: "Category not found", message: "Blog category does not exist" },
        404,
      );
    }

    return c.json({
      success: true,
      message: "Blog category deleted successfully",
      category: deleted,
    });
  } catch (error) {
    console.error("Failed to delete blog category:", error);
    return c.json(
      { error: "Failed to delete blog category", message: "Unable to delete category" },
      500,
    );
  }
});

// ---------------------------------------------------------------------------
// Blog comments moderation
// ---------------------------------------------------------------------------

app.get("/comments", async (c) => {
  try {
    const page = parsePositiveInt(c.req.query("page"), 1);
    const limit = parsePositiveInt(c.req.query("limit"), 20);
    const offset = (page - 1) * limit;

    const status = c.req.query("status") || "";
    const blogId = c.req.query("blogId") || "";
    const search = (c.req.query("search") || "").trim();

    const conditions: any[] = [];
    if (status) conditions.push(eq(blogComment.status, status as any));
    if (blogId) conditions.push(eq(blogComment.blogId, blogId));
    if (search) {
      conditions.push(
        or(
          ilike(blogComment.content, `%${search}%`),
          ilike(blogComment.guestName, `%${search}%`),
          ilike(blog.title, `%${search}%`),
        ),
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [{ count }] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(blogComment)
      .leftJoin(blog, eq(blogComment.blogId, blog.id))
      .where(whereClause);

    const rows = await db
      .select({
        id: blogComment.id,
        blogId: blogComment.blogId,
        blogTitle: blog.title,
        blogSlug: blog.slug,
        userId: blogComment.userId,
        userName: user.name,
        userEmail: user.email,
        guestName: blogComment.guestName,
        guestEmail: blogComment.guestEmail,
        content: blogComment.content,
        status: blogComment.status,
        adminNote: blogComment.adminNote,
        publishedAt: blogComment.publishedAt,
        createdAt: blogComment.createdAt,
        updatedAt: blogComment.updatedAt,
      })
      .from(blogComment)
      .leftJoin(blog, eq(blogComment.blogId, blog.id))
      .leftJoin(user, eq(blogComment.userId, user.id))
      .where(whereClause)
      .orderBy(desc(blogComment.createdAt))
      .limit(limit)
      .offset(offset);

    return c.json({
      comments: rows.map((row) => ({
        ...row,
        authorName: row.userName || row.guestName || "Anonim",
        authorEmail: row.userEmail || row.guestEmail || null,
      })),
      pagination: {
        page,
        limit,
        total: Number(count || 0),
        totalPages: Math.ceil(Number(count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Failed to fetch blog comments:", error);
    return c.json(
      { error: "Failed to fetch blog comments", message: "Unable to load comments" },
      500,
    );
  }
});

app.get("/comments/:commentId", async (c) => {
  try {
    const { commentId } = c.req.param();
    const [row] = await db
      .select({
        id: blogComment.id,
        blogId: blogComment.blogId,
        blogTitle: blog.title,
        blogSlug: blog.slug,
        userId: blogComment.userId,
        userName: user.name,
        userEmail: user.email,
        guestName: blogComment.guestName,
        guestEmail: blogComment.guestEmail,
        content: blogComment.content,
        status: blogComment.status,
        adminNote: blogComment.adminNote,
        publishedAt: blogComment.publishedAt,
        createdAt: blogComment.createdAt,
        updatedAt: blogComment.updatedAt,
      })
      .from(blogComment)
      .leftJoin(blog, eq(blogComment.blogId, blog.id))
      .leftJoin(user, eq(blogComment.userId, user.id))
      .where(eq(blogComment.id, commentId))
      .limit(1);

    if (!row) {
      return c.json({ error: "Comment not found", message: "Comment does not exist" }, 404);
    }

    return c.json({
      comment: {
        ...row,
        authorName: row.userName || row.guestName || "Anonim",
        authorEmail: row.userEmail || row.guestEmail || null,
      },
    });
  } catch (error) {
    console.error("Failed to fetch blog comment:", error);
    return c.json(
      { error: "Failed to fetch blog comment", message: "Unable to load comment" },
      500,
    );
  }
});

app.patch("/comments/:commentId", async (c) => {
  try {
    const { commentId } = c.req.param();
    const payload = await c.req.json();

    const [existing] = await db
      .select()
      .from(blogComment)
      .where(eq(blogComment.id, commentId))
      .limit(1);

    if (!existing) {
      return c.json({ error: "Comment not found", message: "Comment does not exist" }, 404);
    }

    const nextStatus =
      payload.status && ["pending", "published", "rejected", "spam"].includes(payload.status)
        ? payload.status
        : existing.status;

    const [updated] = await db
      .update(blogComment)
      .set({
        content:
          "content" in payload
            ? String(payload.content || "").trim()
            : existing.content,
        status: nextStatus as any,
        adminNote:
          "adminNote" in payload
            ? payload.adminNote
              ? String(payload.adminNote)
              : null
            : existing.adminNote,
        publishedAt:
          nextStatus === "published"
            ? existing.publishedAt ?? new Date()
            : null,
        updatedAt: new Date(),
      })
      .where(eq(blogComment.id, commentId))
      .returning();

    return c.json({
      success: true,
      message: "Comment updated successfully",
      comment: updated,
    });
  } catch (error) {
    console.error("Failed to update blog comment:", error);
    return c.json(
      { error: "Failed to update blog comment", message: "Unable to update comment" },
      500,
    );
  }
});

app.delete("/comments/:commentId", async (c) => {
  try {
    const { commentId } = c.req.param();
    const [deleted] = await db
      .delete(blogComment)
      .where(eq(blogComment.id, commentId))
      .returning();

    if (!deleted) {
      return c.json({ error: "Comment not found", message: "Comment does not exist" }, 404);
    }

    return c.json({
      success: true,
      message: "Comment deleted successfully",
      comment: deleted,
    });
  } catch (error) {
    console.error("Failed to delete blog comment:", error);
    return c.json(
      { error: "Failed to delete blog comment", message: "Unable to delete comment" },
      500,
    );
  }
});

// ---------------------------------------------------------------------------
// Blog CRUD
// ---------------------------------------------------------------------------

app.get("/", async (c) => {
  try {
    const page = parsePositiveInt(c.req.query("page"), 1);
    const limit = parsePositiveInt(c.req.query("limit"), 20);
    const offset = (page - 1) * limit;

    const search = (c.req.query("search") || "").trim();
    const category = (c.req.query("category") || "").trim();
    const status = (c.req.query("status") || "").trim();
    const language = (c.req.query("language") || "").trim();
    const featured = c.req.query("featured");
    const authorId = (c.req.query("authorId") || "").trim();
    const sortBy = (c.req.query("sortBy") || "createdAt").trim();
    const sortOrder = c.req.query("sortOrder") === "asc" ? "asc" : "desc";

    const conditions: any[] = [];

    if (search) {
      conditions.push(
        or(
          ilike(blog.title, `%${search}%`),
          ilike(blog.excerpt, `%${search}%`),
          ilike(blog.content, `%${search}%`),
        ),
      );
    }

    if (category) {
      conditions.push(
        or(eq(blog.categoryId, category), eq(blogCategory.slug, category)),
      );
    }

    if (status) {
      conditions.push(eq(blog.status, status as any));
    }

    if (language) {
      conditions.push(eq(blog.language, language as any));
    }

    if (featured !== undefined && featured !== "") {
      conditions.push(eq(blog.featured, featured === "true"));
    }

    if (authorId) {
      conditions.push(eq(blog.authorId, authorId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const orderByColumn =
      {
        title: blog.title,
        category: blogCategory.name,
        status: blog.status,
        language: blog.language,
        views: blog.views,
        likeCount: blog.likeCount,
        publishedAt: blog.publishedAt,
        createdAt: blog.createdAt,
        updatedAt: blog.updatedAt,
      }[sortBy] || blog.createdAt;

    const [{ count }] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(blog)
      .leftJoin(blogCategory, eq(blog.categoryId, blogCategory.id))
      .where(whereClause);

    const rows = await db
      .select(baseBlogSelect)
      .from(blog)
      .leftJoin(blogCategory, eq(blog.categoryId, blogCategory.id))
      .leftJoin(user, eq(blog.authorId, user.id))
      .where(whereClause)
      .orderBy(sortOrder === "asc" ? asc(orderByColumn) : desc(orderByColumn))
      .limit(limit)
      .offset(offset);

    const blogPosts = await hydrateBlogs(rows);

    return c.json({
      blogPosts,
      pagination: {
        page,
        limit,
        total: Number(count || 0),
        totalPages: Math.ceil(Number(count || 0) / limit),
      },
    });
  } catch (error) {
    console.error("Failed to fetch blog posts:", error);
    return c.json(
      { error: "Failed to fetch blog posts", message: "Unable to retrieve blog posts" },
      500,
    );
  }
});

app.get("/stats", async () => {
  try {
    const [statusStats, categoryStats, languageStats, engagementStats, recentPosts, publishedPosts, commentsStats] =
      await Promise.all([
        db
          .select({ status: blog.status, count: sql<number>`COUNT(*)::int` })
          .from(blog)
          .groupBy(blog.status),
        db
          .select({
            categorySlug: blogCategory.slug,
            categoryName: blogCategory.name,
            count: sql<number>`COUNT(*)::int`,
          })
          .from(blog)
          .leftJoin(blogCategory, eq(blog.categoryId, blogCategory.id))
          .groupBy(blogCategory.slug, blogCategory.name),
        db
          .select({ language: blog.language, count: sql<number>`COUNT(*)::int` })
          .from(blog)
          .groupBy(blog.language),
        db
          .select({
            totalViews: sql<number>`COALESCE(SUM(${blog.views}), 0)::int`,
            totalLikes: sql<number>`COALESCE(SUM(${blog.likeCount}), 0)::int`,
            totalShares: sql<number>`COALESCE(SUM(${blog.shareCount}), 0)::int`,
            avgReadTime: sql<number>`COALESCE(AVG(${blog.readTime}), 0)::decimal(10,2)`,
          })
          .from(blog),
        db
          .select({ count: sql<number>`COUNT(*)::int` })
          .from(blog)
          .where(sql`${blog.createdAt} >= NOW() - INTERVAL '30 days'`),
        db
          .select({ count: sql<number>`COUNT(*)::int` })
          .from(blog)
          .where(eq(blog.status, "published")),
        db
          .select({ totalComments: sql<number>`COUNT(*)::int` })
          .from(blogComment),
      ]);

    const stats = {
      totalPosts: statusStats.reduce((sum, item) => sum + Number(item.count), 0),
      byStatus: statusStats.reduce(
        (acc, item) => ({ ...acc, [item.status]: Number(item.count) }),
        {} as Record<string, number>,
      ),
      byCategory: categoryStats.reduce(
        (acc, item) => ({
          ...acc,
          [item.categorySlug || item.categoryName || "uncategorized"]: Number(item.count),
        }),
        {} as Record<string, number>,
      ),
      byLanguage: languageStats.reduce(
        (acc, item) => ({ ...acc, [item.language]: Number(item.count) }),
        {} as Record<string, number>,
      ),
      totalViews: Number(engagementStats[0]?.totalViews || 0),
      totalLikes: Number(engagementStats[0]?.totalLikes || 0),
      totalComments: Number(commentsStats[0]?.totalComments || 0),
      totalShares: Number(engagementStats[0]?.totalShares || 0),
      averageReadTime: Number(engagementStats[0]?.avgReadTime || 0),
      recentPosts: Number(recentPosts[0]?.count || 0),
      publishedPosts: Number(publishedPosts[0]?.count || 0),
    };

    return new Response(
      JSON.stringify({
        success: true,
        stats,
      }),
      {
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Failed to fetch blog stats:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to fetch blog stats",
        message: "Unable to retrieve blog statistics",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
});

app.get("/:postId", async (c) => {
  try {
    const { postId } = c.req.param();
    const post = await getBlogById(postId);

    if (!post) {
      return c.json(
        { error: "Blog post not found", message: "The specified blog post does not exist" },
        404,
      );
    }

    return c.json({ blogPost: post });
  } catch (error) {
    console.error("Failed to fetch blog post:", error);
    return c.json(
      { error: "Failed to fetch blog post", message: "Unable to retrieve blog post details" },
      500,
    );
  }
});

app.post("/", async (c) => {
  try {
    const payload = await c.req.json();
    const title = String(payload.title || "").trim();

    if (title.length < 2) {
      return c.json({ error: "Invalid title", message: "Title is required" }, 400);
    }

    const slug = payload.slug ? normalizeSlug(String(payload.slug)) : makeUniqueSlug(title);
    const categoryId = await resolveBlogCategoryId({
      categoryId: payload.categoryId,
      categorySlug: payload.category || payload.categorySlug,
      categoryName: payload.categoryName,
    });
    const heroImageId = await resolveSingleFileId(payload.heroImageId ?? payload.heroImage);
    const featuredImageId = await resolveSingleFileId(
      payload.featuredImageId ?? payload.featuredImage,
    );

    const parsedPublishedAt = parseTimestamp(payload.publishedAt);
    if (typeof parsedPublishedAt === "undefined") {
      return c.json(
        { error: "Invalid publishedAt", message: "publishedAt has invalid format" },
        400,
      );
    }

    const status = payload.status || "draft";
    const [created] = await db
      .insert(blog)
      .values({
        id: nanoid(),
        slug,
        title,
        excerpt: payload.excerpt ? String(payload.excerpt) : null,
        content: payload.content ? String(payload.content) : null,
        heroImageId,
        featuredImageId,
        categoryId,
        tags: serializeJsonStringArray(payload.tags),
        status,
        featured: Boolean(payload.featured),
        authorId: payload.authorId || null,
        publishedAt: withDefaultPublishedAt({
          status,
          publishedAt: parsedPublishedAt,
        }),
        views: Number(payload.views || 0),
        readTime: estimateReadTimeMinutes(String(payload.content || "")),
        likeCount: Number(payload.likeCount || 0),
        shareCount: Number(payload.shareCount || 0),
        seoTitle: payload.seoTitle ? String(payload.seoTitle) : null,
        seoDescription: payload.seoDescription ? String(payload.seoDescription) : null,
        seoKeywords: serializeJsonStringArray(payload.seoKeywords),
        language: payload.language || "tr",
      })
      .returning({ id: blog.id });

    await syncBlogImages(created.id, payload.images);

    const saved = await getBlogById(created.id);

    return c.json({
      success: true,
      message: "Blog post created successfully",
      blogPost: saved,
    });
  } catch (error) {
    console.error("Failed to create blog post:", error);
    return c.json(
      { error: "Failed to create blog post", message: "Unable to create new blog post" },
      500,
    );
  }
});

app.put("/:postId", async (c) => {
  try {
    const { postId } = c.req.param();
    const updates = await c.req.json();

    const [existing] = await db
      .select()
      .from(blog)
      .where(eq(blog.id, postId))
      .limit(1);

    if (!existing) {
      return c.json(
        { error: "Blog post not found", message: "The specified blog post does not exist" },
        404,
      );
    }

    const hasHeroField =
      "heroImageId" in updates || "heroImage" in updates;
    const hasFeaturedField =
      "featuredImageId" in updates || "featuredImage" in updates;

    const heroImageId = hasHeroField
      ? await resolveSingleFileId(updates.heroImageId ?? updates.heroImage)
      : existing.heroImageId;
    const featuredImageId = hasFeaturedField
      ? await resolveSingleFileId(updates.featuredImageId ?? updates.featuredImage)
      : existing.featuredImageId;

    const categoryId =
      "categoryId" in updates ||
      "category" in updates ||
      "categorySlug" in updates ||
      "categoryName" in updates
        ? await resolveBlogCategoryId({
            categoryId: updates.categoryId,
            categorySlug: updates.category || updates.categorySlug,
            categoryName: updates.categoryName,
          })
        : existing.categoryId;

    const parsedPublishedAt = "publishedAt" in updates
      ? parseTimestamp(updates.publishedAt)
      : existing.publishedAt;

    if (typeof parsedPublishedAt === "undefined") {
      return c.json(
        { error: "Invalid publishedAt", message: "publishedAt has invalid format" },
        400,
      );
    }

    const nextStatus = updates.status || existing.status;
    const nextContent =
      "content" in updates ? String(updates.content || "") : existing.content || "";

    await db
      .update(blog)
      .set({
        slug:
          "slug" in updates
            ? normalizeSlug(String(updates.slug || existing.slug))
            : existing.slug,
        title: "title" in updates ? String(updates.title || "") : existing.title,
        excerpt:
          "excerpt" in updates
            ? updates.excerpt
              ? String(updates.excerpt)
              : null
            : existing.excerpt,
        content: "content" in updates ? nextContent : existing.content,
        heroImageId,
        featuredImageId,
        categoryId,
        tags:
          "tags" in updates
            ? serializeJsonStringArray(updates.tags)
            : existing.tags,
        status: nextStatus,
        featured:
          "featured" in updates ? Boolean(updates.featured) : existing.featured,
        authorId:
          "authorId" in updates ? updates.authorId || null : existing.authorId,
        publishedAt: withDefaultPublishedAt({
          status: nextStatus,
          publishedAt: parsedPublishedAt,
        }),
        readTime: estimateReadTimeMinutes(nextContent),
        seoTitle:
          "seoTitle" in updates
            ? updates.seoTitle
              ? String(updates.seoTitle)
              : null
            : existing.seoTitle,
        seoDescription:
          "seoDescription" in updates
            ? updates.seoDescription
              ? String(updates.seoDescription)
              : null
            : existing.seoDescription,
        seoKeywords:
          "seoKeywords" in updates
            ? serializeJsonStringArray(updates.seoKeywords)
            : existing.seoKeywords,
        language:
          "language" in updates ? (updates.language || "tr") : existing.language,
        updatedAt: new Date(),
      })
      .where(eq(blog.id, postId));

    if ("images" in updates) {
      await syncBlogImages(postId, updates.images);
    }

    const saved = await getBlogById(postId);
    return c.json({
      success: true,
      message: "Blog post updated successfully",
      blogPost: saved,
    });
  } catch (error) {
    console.error("Failed to update blog post:", error);
    return c.json(
      { error: "Failed to update blog post", message: "Unable to update blog post details" },
      500,
    );
  }
});

app.patch("/:postId/status", async (c) => {
  try {
    const { postId } = c.req.param();
    const { status } = await c.req.json();
    const allowed = ["published", "draft", "archived", "pending_review"];

    if (!allowed.includes(status)) {
      return c.json(
        { error: "Invalid status", message: `Status must be one of: ${allowed.join(", ")}` },
        400,
      );
    }

    const [updated] = await db
      .update(blog)
      .set({
        status,
        publishedAt: withDefaultPublishedAt({
          status,
          publishedAt: null,
        }),
        updatedAt: new Date(),
      })
      .where(eq(blog.id, postId))
      .returning({ id: blog.id });

    if (!updated) {
      return c.json(
        { error: "Blog post not found", message: "The specified blog post does not exist" },
        404,
      );
    }

    const saved = await getBlogById(postId);

    return c.json({
      success: true,
      message: `Blog post ${status} successfully`,
      blogPost: saved,
    });
  } catch (error) {
    console.error("Failed to update blog post status:", error);
    return c.json(
      { error: "Failed to update blog post status", message: "Unable to update blog post status" },
      500,
    );
  }
});

app.patch("/:postId/feature", async (c) => {
  try {
    const { postId } = c.req.param();

    const [current] = await db
      .select({ featured: blog.featured })
      .from(blog)
      .where(eq(blog.id, postId))
      .limit(1);

    if (!current) {
      return c.json(
        { error: "Blog post not found", message: "The specified blog post does not exist" },
        404,
      );
    }

    await db
      .update(blog)
      .set({
        featured: !current.featured,
        updatedAt: new Date(),
      })
      .where(eq(blog.id, postId));

    const saved = await getBlogById(postId);

    return c.json({
      success: true,
      message: `Blog post ${saved?.featured ? "featured" : "unfeatured"} successfully`,
      blogPost: saved,
    });
  } catch (error) {
    console.error("Failed to toggle blog post featured status:", error);
    return c.json(
      { error: "Failed to toggle blog post featured status", message: "Unable to update featured status" },
      500,
    );
  }
});

app.delete("/:postId", async (c) => {
  try {
    const { postId } = c.req.param();
    const [deleted] = await db
      .delete(blog)
      .where(eq(blog.id, postId))
      .returning({ id: blog.id });

    if (!deleted) {
      return c.json(
        { error: "Blog post not found", message: "The specified blog post does not exist" },
        404,
      );
    }

    return c.json({
      success: true,
      message: "Blog post deleted successfully",
      blogPost: deleted,
    });
  } catch (error) {
    console.error("Failed to delete blog post:", error);
    return c.json(
      { error: "Failed to delete blog post", message: "Unable to delete blog post" },
      500,
    );
  }
});

export { app as blogRoutes };
