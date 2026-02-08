import { Hono } from "hono";
import { and, asc, desc, eq, gt, ilike, inArray, or, sql } from "drizzle-orm";
import { db } from "../db/index.ts";
import {
  blog,
  blogCategory,
  blogComment,
  file,
  user,
} from "../db/schemas/index.ts";
import {
  getBlogCommentCountMap,
  getBlogImagesMap,
  parseJsonStringArray,
} from "../lib/blog-relations.ts";
import { resolvePublicFileUrl } from "../lib/place-relations.ts";
import { getSessionFromRequest } from "../lib/session.ts";

const app = new Hono();

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value || "", 10);
  if (Number.isNaN(parsed) || parsed <= 0) return fallback;
  return parsed;
}

type PublicBlogRow = {
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
  featured: boolean;
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
  authorId: string | null;
  authorName: string | null;
  authorAvatar: string | null;
};

type PublicBlogPayload = Omit<PublicBlogRow, "tags" | "seoKeywords"> & {
  heroImage: string | null;
  featuredImage: string | null;
  images: string[];
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

async function hydratePublicBlogs(rows: PublicBlogRow[]): Promise<PublicBlogPayload[]> {
  if (rows.length === 0) return [];

  const blogIds = rows.map((row) => row.id);
  const fileIds = Array.from(
    new Set(
      rows
        .flatMap((row) => [row.heroImageId, row.featuredImageId])
        .filter((value): value is string => Boolean(value)),
    ),
  );

  const [imagesMap, commentCountMap, fileUrlMap] = await Promise.all([
    getBlogImagesMap(blogIds),
    getBlogCommentCountMap(blogIds, "published"),
    getFileUrlMap(fileIds),
  ]);

  return rows.map((row) => ({
    ...row,
    heroImage: row.heroImageId ? (fileUrlMap.get(row.heroImageId) ?? null) : null,
    featuredImage: row.featuredImageId
      ? (fileUrlMap.get(row.featuredImageId) ?? null)
      : null,
    images: imagesMap.get(row.id) ?? [],
    tags: parseJsonStringArray(row.tags),
    seoKeywords: parseJsonStringArray(row.seoKeywords),
    commentCount: commentCountMap.get(row.id) ?? 0,
  }));
}

const basePublicSelect = {
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
  authorAvatar: user.avatar,
};

/**
 * GET /blog
 */
app.get("/", async (c) => {
  try {
    const page = parsePositiveInt(c.req.query("page"), 1);
    const limit = parsePositiveInt(c.req.query("limit"), 12);
    const offset = (page - 1) * limit;

    const search = (c.req.query("search") || "").trim();
    const category = (c.req.query("category") || "").trim();
    const language = (c.req.query("language") || "tr").trim();
    const featured = c.req.query("featured");
    const sortBy = (c.req.query("sortBy") || "publishedAt").trim();
    const sortOrder = c.req.query("sortOrder") === "asc" ? "asc" : "desc";

    const conditions: any[] = [eq(blog.status, "published")];

    if (search) {
      conditions.push(
        or(
          ilike(blog.title, `%${search}%`),
          ilike(blog.excerpt, `%${search}%`),
          ilike(blog.content, `%${search}%`),
          ilike(blog.seoTitle, `%${search}%`),
          ilike(blog.seoDescription, `%${search}%`),
          ilike(blog.tags, `%${search}%`),
        ),
      );
    }

    if (category) {
      conditions.push(or(eq(blog.categoryId, category), eq(blogCategory.slug, category)));
    }

    if (language) {
      conditions.push(eq(blog.language, language as any));
    }

    if (featured !== undefined && featured !== "") {
      conditions.push(eq(blog.featured, featured === "true"));
    }

    const whereClause = and(...conditions);

    const orderByColumn =
      {
        title: blog.title,
        category: blogCategory.name,
        views: blog.views,
        likeCount: blog.likeCount,
        publishedAt: blog.publishedAt,
        createdAt: blog.createdAt,
      }[sortBy] || blog.publishedAt;

    const [{ count }] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(blog)
      .leftJoin(blogCategory, eq(blog.categoryId, blogCategory.id))
      .where(whereClause);

    const rows = await db
      .select(basePublicSelect)
      .from(blog)
      .leftJoin(user, eq(blog.authorId, user.id))
      .leftJoin(blogCategory, eq(blog.categoryId, blogCategory.id))
      .where(whereClause)
      .orderBy(sortOrder === "asc" ? asc(orderByColumn) : desc(orderByColumn))
      .limit(limit)
      .offset(offset);

    const blogPosts = await hydratePublicBlogs(rows);

    return c.json({
      blogPosts,
      pagination: {
        page,
        limit,
        total: Number(count || 0),
        totalPages: Math.ceil(Number(count || 0) / limit),
      },
      filters: {
        search,
        category,
        language,
        featured,
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

/**
 * GET /blog/featured
 */
app.get("/featured", async (c) => {
  try {
    const limit = parsePositiveInt(c.req.query("limit"), 6);
    const language = (c.req.query("language") || "tr").trim();

    const rows = await db
      .select(basePublicSelect)
      .from(blog)
      .leftJoin(user, eq(blog.authorId, user.id))
      .leftJoin(blogCategory, eq(blog.categoryId, blogCategory.id))
      .where(
        and(
          eq(blog.status, "published"),
          eq(blog.featured, true),
          eq(blog.language, language as any),
        ),
      )
      .orderBy(desc(blog.publishedAt))
      .limit(limit);

    const blogPosts = await hydratePublicBlogs(rows);

    return c.json({
      blogPosts,
      count: blogPosts.length,
    });
  } catch (error) {
    console.error("Failed to fetch featured blog posts:", error);
    return c.json(
      {
        error: "Failed to fetch featured blog posts",
        message: "Unable to retrieve featured blog posts",
      },
      500,
    );
  }
});

/**
 * GET /blog/popular
 */
app.get("/popular", async (c) => {
  try {
    const limit = parsePositiveInt(c.req.query("limit"), 6);
    const language = (c.req.query("language") || "tr").trim();

    const rows = await db
      .select(basePublicSelect)
      .from(blog)
      .leftJoin(user, eq(blog.authorId, user.id))
      .leftJoin(blogCategory, eq(blog.categoryId, blogCategory.id))
      .where(
        and(
          eq(blog.status, "published"),
          eq(blog.language, language as any),
          gt(blog.views, 0),
        ),
      )
      .orderBy(desc(blog.views), desc(blog.likeCount), desc(blog.publishedAt))
      .limit(limit);

    const blogPosts = await hydratePublicBlogs(rows);

    return c.json({
      blogPosts,
      count: blogPosts.length,
    });
  } catch (error) {
    console.error("Failed to fetch popular blog posts:", error);
    return c.json(
      {
        error: "Failed to fetch popular blog posts",
        message: "Unable to retrieve popular blog posts",
      },
      500,
    );
  }
});

/**
 * GET /blog/categories
 */
app.get("/categories", async (c) => {
  try {
    const language = (c.req.query("language") || "tr").trim();
    const categoryRows = await db
      .select({
        id: blogCategory.id,
        slug: blogCategory.slug,
        name: blogCategory.name,
        description: blogCategory.description,
        sortOrder: blogCategory.sortOrder,
      })
      .from(blogCategory)
      .where(eq(blogCategory.active, true))
      .orderBy(asc(blogCategory.sortOrder), asc(blogCategory.name));

    const categoryIds = categoryRows.map((row) => row.id);
    const countRows =
      categoryIds.length > 0
        ? await db
            .select({
              categoryId: blog.categoryId,
              count: sql<number>`COUNT(*)::int`,
            })
            .from(blog)
            .where(
              and(
                inArray(blog.categoryId, categoryIds),
                eq(blog.status, "published"),
                eq(blog.language, language as any),
              ),
            )
            .groupBy(blog.categoryId)
        : [];

    const countMap = new Map<string, number>();
    for (const row of countRows) {
      if (row.categoryId) countMap.set(row.categoryId, Number(row.count));
    }

    return c.json({
      categories: categoryRows.map((row) => ({
        id: row.id,
        name: row.slug,
        slug: row.slug,
        displayName: row.name,
        description: row.description,
        count: countMap.get(row.id) ?? 0,
      })),
    });
  } catch (error) {
    console.error("Failed to fetch blog categories:", error);
    return c.json(
      {
        error: "Failed to fetch blog categories",
        message: "Unable to retrieve blog categories",
      },
      500,
    );
  }
});

/**
 * GET /blog/tags
 */
app.get("/tags", async (c) => {
  try {
    const language = (c.req.query("language") || "tr").trim();
    const limit = parsePositiveInt(c.req.query("limit"), 50);

    const rows = await db
      .select({ tags: blog.tags })
      .from(blog)
      .where(
        and(
          eq(blog.status, "published"),
          eq(blog.language, language as any),
          sql`${blog.tags} IS NOT NULL`,
        ),
      );

    const tagCountMap = new Map<string, number>();
    for (const row of rows) {
      for (const tag of parseJsonStringArray(row.tags)) {
        tagCountMap.set(tag, (tagCountMap.get(tag) || 0) + 1);
      }
    }

    const tags = Array.from(tagCountMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([name, count]) => ({
        name,
        count,
        slug: name.toLowerCase().replace(/\s+/g, "-"),
      }));

    return c.json({ tags });
  } catch (error) {
    console.error("Failed to fetch blog tags:", error);
    return c.json(
      { error: "Failed to fetch blog tags", message: "Unable to retrieve blog tags" },
      500,
    );
  }
});

/**
 * GET /blog/latest
 */
app.get("/latest", async (c) => {
  try {
    const limit = parsePositiveInt(c.req.query("limit"), 4);
    const language = (c.req.query("language") || "tr").trim();

    const rows = await db
      .select(basePublicSelect)
      .from(blog)
      .leftJoin(user, eq(blog.authorId, user.id))
      .leftJoin(blogCategory, eq(blog.categoryId, blogCategory.id))
      .where(and(eq(blog.status, "published"), eq(blog.language, language as any)))
      .orderBy(desc(blog.publishedAt), desc(blog.createdAt))
      .limit(limit);

    const blogPosts = await hydratePublicBlogs(rows);

    return c.json({
      blogPosts,
      count: blogPosts.length,
    });
  } catch (error) {
    console.error("Failed to fetch latest blog posts:", error);
    return c.json(
      {
        error: "Failed to fetch latest blog posts",
        message: "Unable to retrieve latest blog posts",
      },
      500,
    );
  }
});

/**
 * GET /blog/:slug/comments
 */
app.get("/:slug/comments", async (c) => {
  try {
    const { slug } = c.req.param();
    const page = parsePositiveInt(c.req.query("page"), 1);
    const limit = parsePositiveInt(c.req.query("limit"), 20);
    const offset = (page - 1) * limit;

    const [post] = await db
      .select({ id: blog.id })
      .from(blog)
      .where(and(eq(blog.slug, slug), eq(blog.status, "published")))
      .limit(1);

    if (!post) {
      return c.json(
        { error: "Blog post not found", message: "The specified blog post does not exist" },
        404,
      );
    }

    const [{ count }] = await db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(blogComment)
      .where(and(eq(blogComment.blogId, post.id), eq(blogComment.status, "published")));

    const rows = await db
      .select({
        id: blogComment.id,
        userId: blogComment.userId,
        userName: user.name,
        guestName: blogComment.guestName,
        content: blogComment.content,
        createdAt: blogComment.createdAt,
      })
      .from(blogComment)
      .leftJoin(user, eq(blogComment.userId, user.id))
      .where(and(eq(blogComment.blogId, post.id), eq(blogComment.status, "published")))
      .orderBy(desc(blogComment.createdAt))
      .limit(limit)
      .offset(offset);

    return c.json({
      comments: rows.map((row) => ({
        id: row.id,
        userId: row.userId,
        authorName: row.userName || row.guestName || "Anonim",
        content: row.content,
        createdAt: row.createdAt,
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

/**
 * POST /blog/:slug/comments
 * Anonymous comments are allowed and always created as pending.
 */
app.post("/:slug/comments", async (c) => {
  try {
    const { slug } = c.req.param();
    const payload = await c.req.json();
    const content = String(payload.content || "").trim();

    if (content.length < 2) {
      return c.json(
        { error: "Invalid content", message: "Comment must be at least 2 characters" },
        400,
      );
    }

    const [post] = await db
      .select({ id: blog.id })
      .from(blog)
      .where(and(eq(blog.slug, slug), eq(blog.status, "published")))
      .limit(1);

    if (!post) {
      return c.json(
        { error: "Blog post not found", message: "The specified blog post does not exist" },
        404,
      );
    }

    const session = await getSessionFromRequest(c);
    const userId = session?.user?.id || null;
    const guestName = payload.guestName ? String(payload.guestName).trim() : null;
    const guestEmail = payload.guestEmail ? String(payload.guestEmail).trim() : null;

    await db.insert(blogComment).values({
      id: crypto.randomUUID(),
      blogId: post.id,
      userId,
      guestName: userId ? null : guestName || "Anonim",
      guestEmail: userId ? null : guestEmail,
      content,
      status: "pending",
      publishedAt: null,
    });

    return c.json({
      success: true,
      message: "Yorumunuz incelemeye alınmıştır.",
    });
  } catch (error) {
    console.error("Failed to create blog comment:", error);
    return c.json(
      { error: "Failed to create blog comment", message: "Unable to create comment" },
      500,
    );
  }
});

/**
 * GET /blog/:slug
 */
app.get("/:slug", async (c) => {
  try {
    const { slug } = c.req.param();

    const [row] = await db
      .select(basePublicSelect)
      .from(blog)
      .leftJoin(user, eq(blog.authorId, user.id))
      .leftJoin(blogCategory, eq(blog.categoryId, blogCategory.id))
      .where(and(eq(blog.slug, slug), eq(blog.status, "published")))
      .limit(1);

    if (!row) {
      return c.json(
        {
          error: "Blog post not found",
          message: "The specified blog post does not exist or is not available",
        },
        404,
      );
    }

    await db
      .update(blog)
      .set({ views: sql`${blog.views} + 1`, updatedAt: new Date() })
      .where(eq(blog.id, row.id));

    const [hydratedPost] = await hydratePublicBlogs([{ ...row, views: row.views + 1 }]);

    const relatedRows = await db
      .select(basePublicSelect)
      .from(blog)
      .leftJoin(user, eq(blog.authorId, user.id))
      .leftJoin(blogCategory, eq(blog.categoryId, blogCategory.id))
      .where(
        and(
          eq(blog.status, "published"),
          eq(blog.language, row.language),
          row.categoryId ? eq(blog.categoryId, row.categoryId) : sql`TRUE`,
          sql`${blog.id} <> ${row.id}`,
        ),
      )
      .orderBy(desc(blog.publishedAt), desc(blog.createdAt))
      .limit(4);

    const relatedPosts = await hydratePublicBlogs(relatedRows);

    return c.json({
      blogPost: hydratedPost,
      relatedPosts,
    });
  } catch (error) {
    console.error("Failed to fetch blog post:", error);
    return c.json(
      { error: "Failed to fetch blog post", message: "Unable to retrieve blog post details" },
      500,
    );
  }
});

export { app as blogRoutes };
