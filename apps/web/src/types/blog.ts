export type BlogCategory = "rehber" | "deneyim" | "gurme" | "mikrotrend";

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImage: string;
  publishedAt: string;
  readTimeMinutes: number;
  category: BlogCategory;
};

export type BlogPostSection = {
  title?: string;
  paragraphs: string[];
  image?: {
    src: string;
    alt: string;
  };
};

export type BlogPostDetail = BlogPost & {
  heroImage: string;
  intro: string;
  sections: BlogPostSection[];
  tips?: string[];
};
