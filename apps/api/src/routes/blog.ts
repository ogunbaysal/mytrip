import { Hono } from "hono";
import { db } from "../db/index.ts";
import { blogPost, user } from "../db/schemas/index.ts";
import { eq, desc, ilike, sql, and, gt } from "drizzle-orm";

const app = new Hono();

/**
 * Get all blog posts with pagination and filtering
 * GET /blog
 */
app.get("/", async (c) => {
  try {
    const {
      page = "1",
      limit = "12",
      search = "",
      category = "",
      language = "tr",
      featured = "",
      sortBy = "publishedAt",
      sortOrder = "desc",
    } = c.req.query();

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const limitInt = parseInt(limit);

    // Build where conditions for public API (only published posts)
    const conditions = [eq(blogPost.status, "published")];

    if (search) {
      conditions.push(
        sql`(LOWER(${blogPost.title}) ILIKE ${'%' + search.toLowerCase() + '%'} OR LOWER(${blogPost.excerpt}) ILIKE ${'%' + search.toLowerCase() + '%'} OR LOWER(${blogPost.content}) ILIKE ${'%' + search.toLowerCase() + '%'} OR LOWER(${blogPost.seoTitle}) ILIKE ${'%' + search.toLowerCase() + '%'} OR LOWER(${blogPost.seoDescription}) ILIKE ${'%' + search.toLowerCase() + '%'})`
      );
    }

    if (category) {
      conditions.push(eq(blogPost.category, category as any));
    }

    if (language) {
      conditions.push(eq(blogPost.language, language as any));
    }

    if (featured !== "") {
      conditions.push(eq(blogPost.featured, featured === "true"));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : sql`1=1`;

    // Build order by clause
    const orderByColumn = {
      title: blogPost.title,
      category: blogPost.category,
      views: blogPost.views,
      likeCount: blogPost.likeCount,
      commentCount: blogPost.commentCount,
      publishedAt: blogPost.publishedAt,
      createdAt: blogPost.createdAt,
    }[sortBy] || blogPost.publishedAt;

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
        heroImage: blogPost.heroImage,
        featuredImage: blogPost.featuredImage,
        category: blogPost.category,
        tags: blogPost.tags,
        featured: blogPost.featured,
        publishedAt: blogPost.publishedAt,
        views: blogPost.views,
        readTime: blogPost.readTime,
        likeCount: blogPost.likeCount,
        commentCount: blogPost.commentCount,
        shareCount: blogPost.shareCount,
        seoTitle: blogPost.seoTitle,
        seoDescription: blogPost.seoDescription,
        language: blogPost.language,
        readingLevel: blogPost.readingLevel,
        targetAudience: blogPost.targetAudience,
        createdAt: blogPost.createdAt,
        authorName: user.name,
        authorAvatar: user.avatar,
      })
      .from(blogPost)
      .innerJoin(user, eq(blogPost.authorId, user.id))
      .where(whereClause)
      .orderBy(sql`${orderByColumn} ${orderDirection}`)
      .limit(limitInt)
      .offset(offset);

    return c.json({
      blogPosts,
      pagination: {
        page: parseInt(page),
        limit: limitInt,
        total: Number(count),
        totalPages: Math.ceil(Number(count) / limitInt),
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
      {
        error: "Failed to fetch blog posts",
        message: "Unable to retrieve blog posts"
      },
      500
    );
  }
});

/**
 * Get featured blog posts
 * GET /blog/featured
 */
app.get("/featured", async (c) => {
  try {
    const { limit = "6", language = "tr" } = c.req.query();
    const limitInt = parseInt(limit);

    const featuredPosts = await db
      .select({
        id: blogPost.id,
        slug: blogPost.slug,
        title: blogPost.title,
        excerpt: blogPost.excerpt,
        heroImage: blogPost.heroImage,
        featuredImage: blogPost.featuredImage,
        category: blogPost.category,
        tags: blogPost.tags,
        featured: blogPost.featured,
        publishedAt: blogPost.publishedAt,
        views: blogPost.views,
        readTime: blogPost.readTime,
        likeCount: blogPost.likeCount,
        commentCount: blogPost.commentCount,
        language: blogPost.language,
        authorName: user.name,
        authorAvatar: user.avatar,
      })
      .from(blogPost)
      .innerJoin(user, eq(blogPost.authorId, user.id))
      .where(and(eq(blogPost.status, "published"), eq(blogPost.featured, true), eq(blogPost.language, language as any)))
      .orderBy(desc(blogPost.publishedAt))
      .limit(limitInt);

    return c.json({
      blogPosts: featuredPosts,
      count: featuredPosts.length,
    });
  } catch (error) {
    console.error("Failed to fetch featured blog posts:", error);
    return c.json(
      {
        error: "Failed to fetch featured blog posts",
        message: "Unable to retrieve featured blog posts"
      },
      500
    );
  }
});

/**
 * Get popular blog posts
 * GET /blog/popular
 */
app.get("/popular", async (c) => {
  try {
    const { limit = "6", language = "tr" } = c.req.query();
    const limitInt = parseInt(limit);

    const popularPosts = await db
      .select({
        id: blogPost.id,
        slug: blogPost.slug,
        title: blogPost.title,
        excerpt: blogPost.excerpt,
        heroImage: blogPost.heroImage,
        featuredImage: blogPost.featuredImage,
        category: blogPost.category,
        tags: blogPost.tags,
        publishedAt: blogPost.publishedAt,
        views: blogPost.views,
        readTime: blogPost.readTime,
        likeCount: blogPost.likeCount,
        commentCount: blogPost.commentCount,
        shareCount: blogPost.shareCount,
        language: blogPost.language,
        authorName: user.name,
        authorAvatar: user.avatar,
      })
      .from(blogPost)
      .innerJoin(user, eq(blogPost.authorId, user.id))
      .where(and(
        eq(blogPost.status, "published"),
        eq(blogPost.language, language as any),
        gt(blogPost.views, 0)
      ))
      .orderBy(desc(blogPost.views), desc(blogPost.likeCount), desc(blogPost.publishedAt))
      .limit(limitInt);

    return c.json({
      blogPosts: popularPosts,
      count: popularPosts.length,
    });
  } catch (error) {
    console.error("Failed to fetch popular blog posts:", error);
    return c.json(
      {
        error: "Failed to fetch popular blog posts",
        message: "Unable to retrieve popular blog posts"
      },
      500
    );
  }
});

/**
 * Get blog post by slug
 * GET /blog/:slug
 */
app.get("/:slug", async (c) => {
  try {
    const { slug } = c.req.param();

    const [postData] = await db
      .select({
        id: blogPost.id,
        slug: blogPost.slug,
        title: blogPost.title,
        content: blogPost.content,
        heroImage: blogPost.heroImage,
        featuredImage: blogPost.featuredImage,
        images: blogPost.images,
        category: blogPost.category,
        tags: blogPost.tags,
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
        authorAvatar: user.avatar,
        authorBio: user.name, // You might want to add a bio field to user table
      })
      .from(blogPost)
      .innerJoin(user, eq(blogPost.authorId, user.id))
      .where(and(eq(blogPost.slug, slug), eq(blogPost.status, "published")))
      .limit(1);

    if (!postData) {
      return c.json(
        {
          error: "Blog post not found",
          message: "The specified blog post does not exist or is not available"
        },
        404
      );
    }

    // Increment view count
    await db
      .update(blogPost)
      .set({ views: sql`${blogPost.views} + 1` })
      .where(eq(blogPost.id, postData.id));

    // Get related posts (same category, excluding current post)
    const relatedPosts = await db
      .select({
        id: blogPost.id,
        slug: blogPost.slug,
        title: blogPost.title,
        excerpt: blogPost.excerpt,
        heroImage: blogPost.heroImage,
        category: blogPost.category,
        tags: blogPost.tags,
        publishedAt: blogPost.publishedAt,
        readTime: blogPost.readTime,
        language: blogPost.language,
        authorName: user.name,
      })
      .from(blogPost)
      .innerJoin(user, eq(blogPost.authorId, user.id))
      .where(and(
        eq(blogPost.status, "published"),
        eq(blogPost.category, postData.category),
        eq(blogPost.language, postData.language),
        sql`${blogPost.id} != ${postData.id}`
      ))
      .orderBy(desc(blogPost.publishedAt))
      .limit(4);

    return c.json({
      blogPost: {
        ...postData,
        views: postData.views + 1, // Return incremented count
      },
      relatedPosts,
    });
  } catch (error) {
    console.error("Failed to fetch blog post:", error);
    return c.json(
      {
        error: "Failed to fetch blog post",
        message: "Unable to retrieve blog post details"
      },
      500
    );
  }
});

/**
 * Get blog categories
 * GET /blog/categories
 */
app.get("/categories", async (c) => {
  try {
    const { language = "tr" } = c.req.query();

    const categories = await db
      .select({
        category: blogPost.category,
        count: sql`COUNT(*)::int`,
      })
      .from(blogPost)
      .where(and(eq(blogPost.status, "published"), eq(blogPost.language, language as any)))
      .groupBy(blogPost.category)
      .orderBy(sql`COUNT(*) DESC`);

    const categoryNames = {
      travel: "Travel",
      food: "Food",
      culture: "Culture",
      history: "History",
      activity: "Activities",
      lifestyle: "Lifestyle",
      business: "Business",
    };

    return c.json({
      categories: categories.map(cat => ({
        name: cat.category,
        displayName: categoryNames[cat.category as keyof typeof categoryNames] || cat.category,
        count: Number(cat.count),
        slug: cat.category.toLowerCase(),
      })),
    });
  } catch (error) {
    console.error("Failed to fetch blog categories:", error);
    return c.json(
      {
        error: "Failed to fetch blog categories",
        message: "Unable to retrieve blog categories"
      },
      500
    );
  }
});

/**
 * Get blog tags
 * GET /blog/tags
 */
app.get("/tags", async (c) => {
  try {
    const { language = "tr", limit = "50" } = c.req.query();
    const limitInt = parseInt(limit);

    // Get all posts with tags for the specified language
    const posts = await db
      .select({
        tags: blogPost.tags,
      })
      .from(blogPost)
      .where(and(
        eq(blogPost.status, "published"),
        eq(blogPost.language, language as any),
        sql`${blogPost.tags} IS NOT NULL`
      ));

    // Extract and count tags
    const tagCounts = new Map<string, number>();
    posts.forEach(post => {
      try {
        const tags = JSON.parse(post.tags || "[]");
        tags.forEach((tag: string) => {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        });
      } catch (error) {
        // Skip invalid JSON
      }
    });

    // Sort by count and limit
    const sortedTags = Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limitInt)
      .map(([tag, count]) => ({
        name: tag,
        count,
        slug: tag.toLowerCase().replace(/\s+/g, '-'),
      }));

    return c.json({
      tags: sortedTags,
    });
  } catch (error) {
    console.error("Failed to fetch blog tags:", error);
    return c.json(
      {
        error: "Failed to fetch blog tags",
        message: "Unable to retrieve blog tags"
      },
      500
    );
  }
});

/**
 * Get latest blog posts
 * GET /blog/latest
 */
app.get("/latest", async (c) => {
  try {
    const { limit = "4", language = "tr" } = c.req.query();
    const limitInt = parseInt(limit);

    const latestPosts = await db
      .select({
        id: blogPost.id,
        slug: blogPost.slug,
        title: blogPost.title,
        excerpt: blogPost.excerpt,
        heroImage: blogPost.heroImage,
        category: blogPost.category,
        publishedAt: blogPost.publishedAt,
        readTime: blogPost.readTime,
        language: blogPost.language,
        authorName: user.name,
        authorAvatar: user.avatar,
      })
      .from(blogPost)
      .innerJoin(user, eq(blogPost.authorId, user.id))
      .where(and(eq(blogPost.status, "published"), eq(blogPost.language, language as any)))
      .orderBy(desc(blogPost.publishedAt))
      .limit(limitInt);

    return c.json({
      blogPosts: latestPosts,
      count: latestPosts.length,
    });
  } catch (error) {
    console.error("Failed to fetch latest blog posts:", error);
    return c.json(
      {
        error: "Failed to fetch latest blog posts",
        message: "Unable to retrieve latest blog posts"
      },
      500
    );
  }
});

export { app as blogRoutes };