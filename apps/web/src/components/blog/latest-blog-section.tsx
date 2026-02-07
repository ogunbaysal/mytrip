"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, LoaderCircle, NotebookPen } from "lucide-react";

import { api } from "@/lib/api";

import { BlogPostCard } from "./blog-post-card";

export function LatestBlogSection() {
  const { data, isLoading } = useQuery({
    queryKey: ["blog-posts", "latest-home"],
    queryFn: async () => {
      const response = await api.blog.list({ limit: 3 });
      return response.blogPosts;
    },
  });

  const posts = data ?? [];

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 text-primary">
            <NotebookPen className="size-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              Blog
            </span>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
            Son Eklenen Yazılar
          </h2>
          <p className="max-w-2xl text-base text-muted-foreground">
            Seyahat önerileri, rota fikirleri ve yerel keşif içeriklerinden son
            3 yazı.
          </p>
        </div>
        <Link
          href="/blog"
          className="group inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          Tüm Blogları Gör
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center rounded-2xl border border-dashed border-border/70 bg-white/70 py-16">
          <LoaderCircle className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-2xl bg-white/50 p-8 text-center text-sm text-muted-foreground">
          Henüz yayınlanmış blog yazısı bulunmuyor.
        </div>
      ) : (
        <div className="grid gap-5">
          {posts.map((post) => (
            <BlogPostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </section>
  );
}

