export type BlogCategory = string;

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  heroImage: string | null;
  featuredImage: string | null;
  publishedAt: string | null;
  readTime: number | null;
  category: string | null;
  authorName?: string | null;
  authorAvatar?: string | null;
  views?: number;
};

export type BlogPostDetail = BlogPost & {
  content: string | null;
  tags: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  relatedPosts?: BlogPost[];
};

