import { Hono } from "hono";
import { db } from "../../db/index.ts";
import { blogPost, user } from "../../db/schemas/index.ts";
import { eq, desc, ilike, sql, and } from "drizzle-orm";
import { nanoid } from "nanoid";

const app = new Hono();

// Helper to safely parse JSON text fields
function parseJsonField(value: string | null | undefined): string[] {
  if (!value) return [];
  if (typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    // If not valid JSON, try splitting by comma
    if (value.includes(",")) {
      return value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return value ? [value] : [];
  }
}

// Transform blog post to have parsed arrays
function transformBlogPost(post: any) {
  return {
    ...post,
    tags: parseJsonField(post.tags),
    seoKeywords: parseJsonField(post.seoKeywords),
    images: parseJsonField(post.images),
  };
}

/**
 * Get all blog posts with pagination and filtering
 * GET /admin/blog
 */
app.get("/", async (c) => {
  try {
    const {
      page = "1",
      limit = "20",
      search = "",
      category = "",
      status = "",
      language = "",
      featured = "",
      authorId = "",
      sortBy = "createdAt",
      sortOrder = "desc",
    } = c.req.query();

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const limitInt = parseInt(limit);

    // Build where conditions
    const conditions = [];

    if (search) {
      conditions.push(
        sql`(LOWER(${blogPost.title}) ILIKE ${"%" + search.toLowerCase() + "%"} OR LOWER(${blogPost.excerpt}) ILIKE ${"%" + search.toLowerCase() + "%"} OR LOWER(${blogPost.content}) ILIKE ${"%" + search.toLowerCase() + "%"})`,
      );
    }

    if (category) {
      conditions.push(eq(blogPost.category, category as any));
    }

    if (status) {
      conditions.push(eq(blogPost.status, status as any));
    }

    if (language) {
      conditions.push(eq(blogPost.language, language as any));
    }

    if (featured !== "") {
      conditions.push(eq(blogPost.featured, featured === "true"));
    }

    if (authorId) {
      conditions.push(eq(blogPost.authorId, authorId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : sql`1=1`;

    // Build order by clause
    const orderByColumn =
      {
        title: blogPost.title,
        category: blogPost.category,
        status: blogPost.status,
        language: blogPost.language,
        views: blogPost.views,
        likeCount: blogPost.likeCount,
        commentCount: blogPost.commentCount,
        publishedAt: blogPost.publishedAt,
        createdAt: blogPost.createdAt,
        updatedAt: blogPost.updatedAt,
      }[sortBy] || blogPost.createdAt;

    const orderDirection = sortOrder === "asc" ? sql`ASC` : sql`DESC`;

    // Get total count
    const [{ count }] = await db
      .select({ count: sql`COUNT(*)::int` })
      .from(blogPost)
      .where(whereClause);

    // Get blog posts with author info
    const blogPosts = await db
      .select({
        id: blogPost.id,
        slug: blogPost.slug,
        title: blogPost.title,
        excerpt: blogPost.excerpt,
        content: blogPost.content,
        heroImage: blogPost.heroImage,
        featuredImage: blogPost.featuredImage,
        images: blogPost.images,
        category: blogPost.category,
        tags: blogPost.tags,
        status: blogPost.status,
        featured: blogPost.featured,
        authorId: blogPost.authorId,
        publishedAt: blogPost.publishedAt,
        views: blogPost.views,
        readTime: blogPost.readTime,
        likeCount: blogPost.likeCount,
        commentCount: blogPost.commentCount,
        shareCount: blogPost.shareCount,
        seoTitle: blogPost.seoTitle,
        seoDescription: blogPost.seoDescription,
        seoKeywords: blogPost.seoKeywords,
        language: blogPost.language,
        readingLevel: blogPost.readingLevel,
        targetAudience: blogPost.targetAudience,
        createdAt: blogPost.createdAt,
        updatedAt: blogPost.updatedAt,
        authorName: user.name,
        authorEmail: user.email,
      })
      .from(blogPost)
      .leftJoin(user, eq(blogPost.authorId, user.id))
      .where(whereClause)
      .orderBy(sql`${orderByColumn} ${orderDirection}`)
      .limit(limitInt)
      .offset(offset);

    return c.json({
      blogPosts: blogPosts.map(transformBlogPost),
      pagination: {
        page: parseInt(page),
        limit: limitInt,
        total: Number(count),
        totalPages: Math.ceil(Number(count) / limitInt),
      },
    });
  } catch (error) {
    console.error("Failed to fetch blog posts:", error);
    return c.json(
      {
        error: "Failed to fetch blog posts",
        message: "Unable to retrieve blog posts",
      },
      500,
    );
  }
});

/**
 * Get blog post by ID
 * GET /admin/blog/:postId
 */
app.get("/:postId", async (c) => {
  try {
    const { postId } = c.req.param();

    const [postData] = await db
      .select({
        id: blogPost.id,
        slug: blogPost.slug,
        title: blogPost.title,
        excerpt: blogPost.excerpt,
        content: blogPost.content,
        heroImage: blogPost.heroImage,
        featuredImage: blogPost.featuredImage,
        images: blogPost.images,
        category: blogPost.category,
        tags: blogPost.tags,
        status: blogPost.status,
        featured: blogPost.featured,
        authorId: blogPost.authorId,
        publishedAt: blogPost.publishedAt,
        views: blogPost.views,
        readTime: blogPost.readTime,
        likeCount: blogPost.likeCount,
        commentCount: blogPost.commentCount,
        shareCount: blogPost.shareCount,
        seoTitle: blogPost.seoTitle,
        seoDescription: blogPost.seoDescription,
        seoKeywords: blogPost.seoKeywords,
        language: blogPost.language,
        readingLevel: blogPost.readingLevel,
        targetAudience: blogPost.targetAudience,
        createdAt: blogPost.createdAt,
        updatedAt: blogPost.updatedAt,
        authorName: user.name,
        authorEmail: user.email,
      })
      .from(blogPost)
      .leftJoin(user, eq(blogPost.authorId, user.id))
      .where(eq(blogPost.id, postId))
      .limit(1);

    if (!postData) {
      return c.json(
        {
          error: "Blog post not found",
          message: "The specified blog post does not exist",
        },
        404,
      );
    }

    return c.json({ blogPost: transformBlogPost(postData) });
  } catch (error) {
    console.error("Failed to fetch blog post:", error);
    return c.json(
      {
        error: "Failed to fetch blog post",
        message: "Unable to retrieve blog post details",
      },
      500,
    );
  }
});

/**
 * Create new blog post
 * POST /admin/blog
 */
app.post("/", async (c) => {
  try {
    const postData = await c.req.json();

    const newBlogPost = {
      id: nanoid(),
      slug:
        postData.slug ||
        `${postData.title.toLowerCase().replace(/\s+/g, "-")}-${nanoid(6)}`,
      title: postData.title,
      excerpt: postData.excerpt,
      content: postData.content,
      heroImage: postData.heroImage,
      featuredImage: postData.featuredImage,
      images: postData.images,
      category: postData.category,
      tags: postData.tags,
      status: postData.status || "draft",
      featured: postData.featured || false,
      authorId: postData.authorId,
      publishedAt: postData.publishedAt,
      views: postData.views || 0,
      readTime: postData.readTime,
      likeCount: postData.likeCount || 0,
      commentCount: postData.commentCount || 0,
      shareCount: postData.shareCount || 0,
      seoTitle: postData.seoTitle,
      seoDescription: postData.seoDescription,
      seoKeywords: postData.seoKeywords,
      language: postData.language || "tr",
      readingLevel: postData.readingLevel || "medium",
      targetAudience: postData.targetAudience || "travelers",
    };

    const [createdBlogPost] = await db
      .insert(blogPost)
      .values(newBlogPost)
      .returning();

    return c.json({
      success: true,
      message: "Blog post created successfully",
      blogPost: createdBlogPost,
    });
  } catch (error) {
    console.error("Failed to create blog post:", error);
    return c.json(
      {
        error: "Failed to create blog post",
        message: "Unable to create new blog post",
      },
      500,
    );
  }
});

/**
 * Update blog post
 * PUT /admin/blog/:postId
 */
app.put("/:postId", async (c) => {
  try {
    const { postId } = c.req.param();
    const updates = await c.req.json();

    // Remove fields that shouldn't be updated directly
    const {
      id,
      createdAt,
      updatedAt,
      authorName,
      authorEmail,
      ...allowedUpdates
    } = updates;

    // Set publishedAt if status is being changed to published
    if (allowedUpdates.status === "published" && !updates.publishedAt) {
      allowedUpdates.publishedAt = new Date();
    }

    const [updatedBlogPost] = await db
      .update(blogPost)
      .set({
        ...allowedUpdates,
        updatedAt: new Date(),
      })
      .where(eq(blogPost.id, postId))
      .returning();

    if (!updatedBlogPost) {
      return c.json(
        {
          error: "Blog post not found",
          message: "The specified blog post does not exist",
        },
        404,
      );
    }

    return c.json({
      success: true,
      message: "Blog post updated successfully",
      blogPost: updatedBlogPost,
    });
  } catch (error) {
    console.error("Failed to update blog post:", error);
    return c.json(
      {
        error: "Failed to update blog post",
        message: "Unable to update blog post details",
      },
      500,
    );
  }
});

/**
 * Update blog post status
 * PATCH /admin/blog/:postId/status
 */
app.patch("/:postId/status", async (c) => {
  try {
    const { postId } = c.req.param();
    const { status } = await c.req.json();

    if (
      !["published", "draft", "archived", "pending_review"].includes(status)
    ) {
      return c.json(
        {
          error: "Invalid status",
          message:
            "Status must be one of: published, draft, archived, pending_review",
        },
        400,
      );
    }

    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    // Set publishedAt if status is being changed to published
    if (status === "published") {
      updateData.publishedAt = new Date();
    }

    const [updatedBlogPost] = await db
      .update(blogPost)
      .set(updateData)
      .where(eq(blogPost.id, postId))
      .returning();

    if (!updatedBlogPost) {
      return c.json(
        {
          error: "Blog post not found",
          message: "The specified blog post does not exist",
        },
        404,
      );
    }

    return c.json({
      success: true,
      message: `Blog post ${status} successfully`,
      blogPost: updatedBlogPost,
    });
  } catch (error) {
    console.error("Failed to update blog post status:", error);
    return c.json(
      {
        error: "Failed to update blog post status",
        message: "Unable to update blog post status",
      },
      500,
    );
  }
});

/**
 * Toggle blog post featured status
 * PATCH /admin/blog/:postId/feature
 */
app.patch("/:postId/feature", async (c) => {
  try {
    const { postId } = c.req.param();

    const [currentPost] = await db
      .select({ featured: blogPost.featured })
      .from(blogPost)
      .where(eq(blogPost.id, postId))
      .limit(1);

    if (!currentPost) {
      return c.json(
        {
          error: "Blog post not found",
          message: "The specified blog post does not exist",
        },
        404,
      );
    }

    const [updatedBlogPost] = await db
      .update(blogPost)
      .set({
        featured: !currentPost.featured,
        updatedAt: new Date(),
      })
      .where(eq(blogPost.id, postId))
      .returning();

    return c.json({
      success: true,
      message: `Blog post ${updatedBlogPost.featured ? "featured" : "unfeatured"} successfully`,
      blogPost: updatedBlogPost,
    });
  } catch (error) {
    console.error("Failed to toggle blog post featured status:", error);
    return c.json(
      {
        error: "Failed to toggle blog post featured status",
        message: "Unable to update blog post featured status",
      },
      500,
    );
  }
});

/**
 * Delete blog post
 * DELETE /admin/blog/:postId
 */
app.delete("/:postId", async (c) => {
  try {
    const { postId } = c.req.param();

    const [deletedBlogPost] = await db
      .delete(blogPost)
      .where(eq(blogPost.id, postId))
      .returning();

    if (!deletedBlogPost) {
      return c.json(
        {
          error: "Blog post not found",
          message: "The specified blog post does not exist",
        },
        404,
      );
    }

    return c.json({
      success: true,
      message: "Blog post deleted successfully",
      blogPost: deletedBlogPost,
    });
  } catch (error) {
    console.error("Failed to delete blog post:", error);
    return c.json(
      {
        error: "Failed to delete blog post",
        message: "Unable to delete blog post",
      },
      500,
    );
  }
});

/**
 * Get blog statistics
 * GET /admin/blog/stats
 */
app.get("/stats", async (c) => {
  try {
    // Get blog post counts by status
    const statusStats = await db
      .select({
        status: blogPost.status,
        count: sql`COUNT(*)::int`,
      })
      .from(blogPost)
      .groupBy(blogPost.status);

    // Get blog post counts by category
    const categoryStats = await db
      .select({
        category: blogPost.category,
        count: sql`COUNT(*)::int`,
      })
      .from(blogPost)
      .groupBy(blogPost.category);

    // Get blog post counts by language
    const languageStats = await db
      .select({
        language: blogPost.language,
        count: sql`COUNT(*)::int`,
      })
      .from(blogPost)
      .groupBy(blogPost.language);

    // Get engagement stats
    const engagementStats = await db
      .select({
        totalViews: sql`SUM(${blogPost.views})::int`,
        totalLikes: sql`SUM(${blogPost.likeCount})::int`,
        totalComments: sql`SUM(${blogPost.commentCount})::int`,
        totalShares: sql`SUM(${blogPost.shareCount})::int`,
        avgReadTime: sql`AVG(${blogPost.readTime})::decimal(10,2)`,
      })
      .from(blogPost);

    // Get recent posts (last 30 days)
    const recentPosts = await db
      .select({
        count: sql`COUNT(*)::int`,
      })
      .from(blogPost)
      .where(sql`${blogPost.createdAt} >= NOW() - INTERVAL '30 days'`);

    // Get published posts
    const publishedPosts = await db
      .select({
        count: sql`COUNT(*)::int`,
      })
      .from(blogPost)
      .where(eq(blogPost.status, "published"));

    const stats = {
      totalPosts: statusStats.reduce(
        (sum, stat) => sum + Number(stat.count),
        0,
      ),
      byStatus: statusStats.reduce(
        (acc, stat) => {
          acc[stat.status] = Number(stat.count);
          return acc;
        },
        {} as Record<string, number>,
      ),
      byCategory: categoryStats.reduce(
        (acc, stat) => {
          acc[stat.category] = Number(stat.count);
          return acc;
        },
        {} as Record<string, number>,
      ),
      byLanguage: languageStats.reduce(
        (acc, stat) => {
          acc[stat.language] = Number(stat.count);
          return acc;
        },
        {} as Record<string, number>,
      ),
      totalViews: Number(engagementStats[0]?.totalViews || 0),
      totalLikes: Number(engagementStats[0]?.totalLikes || 0),
      totalComments: Number(engagementStats[0]?.totalComments || 0),
      totalShares: Number(engagementStats[0]?.totalShares || 0),
      averageReadTime: Number(engagementStats[0]?.avgReadTime) || 0,
      recentPosts: Number(recentPosts[0]?.count || 0),
      publishedPosts: Number(publishedPosts[0]?.count || 0),
    };

    return c.json({ stats });
  } catch (error) {
    console.error("Failed to fetch blog stats:", error);
    return c.json(
      {
        error: "Failed to fetch blog statistics",
        message: "Unable to retrieve blog statistics",
      },
      500,
    );
  }
});

export { app as blogRoutes };
