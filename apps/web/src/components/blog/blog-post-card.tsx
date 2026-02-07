"use client";

import Image from "next/image";
import Link from "next/link";

import { useLocalizedFormatting } from "@/lib/i18n";
import type { BlogPost } from "@/types";

export function BlogPostCard({ post }: { post: BlogPost }) {
  const { formatDate } = useLocalizedFormatting();
  const categoryLabel = post.categoryName || post.categorySlug || "";

  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group grid gap-4 rounded-3xl border border-border bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl md:grid-cols-[280px_1fr]"
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl">
        <Image
          src={post.heroImage || post.featuredImage || "/images/placeholders/blog-placeholder.jpg"}
          alt={post.title}
          fill
          className="object-cover transition duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 280px"
        />
      </div>
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          {categoryLabel && (
             <span className="rounded-full bg-primary/10 px-3 py-1 text-primary">
               {categoryLabel}
             </span>
          )}
          <span className="text-muted-foreground">
            {post.publishedAt ? formatDate(post.publishedAt) : ""}
          </span>
          {post.readTime && <span className="text-muted-foreground">• {post.readTime} dk</span>}
        </div>
        <h3 className="text-lg font-semibold leading-snug text-foreground group-hover:text-primary">
          {post.title}
        </h3>
        <p className="text-sm text-muted-foreground line-clamp-2">{post.excerpt || ""}</p>
        <span className="text-sm font-semibold text-primary group-hover:underline">Yazıyı oku →</span>
      </div>
    </Link>
  );
}
