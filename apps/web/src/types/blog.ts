export type BlogComment = {
  id: string;
  userId?: string | null;
  authorName: string;
  content: string;
  createdAt: string;
};

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  heroImage: string | null;
  featuredImage?: string | null;
  publishedAt: string | null;
  readTime: number | null;
  categoryId?: string | null;
  categorySlug?: string | null;
  categoryName?: string | null;
  authorName?: string | null;
  authorAvatar?: string | null;
  views?: number;
  commentCount?: number;
};

export type BlogSection = {
  title?: string;
  paragraphs: string[];
  image?: {
    src: string;
    alt: string;
  };
};

export type BlogPostDetail = BlogPost & {
  content?: string | null;
  tags?: string[];
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string[];
  relatedPosts?: BlogPost[];
  intro?: string;
  sections?: BlogSection[];
  tips?: string[];
  likeCount?: number;
  shareCount?: number;
  images?: string[];
};
