"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

import { BlogPostCard } from "@/components/blog/blog-post-card";
import { BLOG_POSTS } from "@/lib/data/blog-posts";
import type { BlogCategory } from "@/types";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80";

const CATEGORY_FILTERS: { value: BlogCategory | "tum"; label: string }[] = [
  { value: "tum", label: "Tümü" },
  { value: "rehber", label: "Rehber" },
  { value: "deneyim", label: "Deneyim" },
  { value: "gurme", label: "Gurme" },
  { value: "mikrotrend", label: "Mikro Trend" },
];

export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState<(typeof CATEGORY_FILTERS)[number]["value"]>("tum");

  const posts = useMemo(() => {
    const sorted = [...BLOG_POSTS].sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
    if (activeCategory === "tum") return sorted;
    return sorted.filter((post) => post.category === activeCategory);
  }, [activeCategory]);

  return (
    <div className="space-y-14 pb-24 pt-10 md:space-y-16 md:pt-14">
      <section className="mx-auto w-full max-w-[1100px] px-4 md:px-6">
        <div className="relative overflow-hidden rounded-3xl">
          <Image
            src={HERO_IMAGE}
            alt="MyTrip blog"
            fill
            className="object-cover"
            priority
            sizes="(max-width: 768px) 100vw, 1100px"
          />
          <div className="relative z-10 space-y-5 bg-gradient-to-t from-black/70 via-black/30 to-black/10 p-8 text-white md:p-12">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
              MyTrip Hikayeler
            </span>
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                MyTrip editörlerinden ilham veren yolculuk hikayeleri
              </h1>
              <p className="max-w-2xl text-sm text-white/85 md:text-base">
                Gurme keşifleri, mavi yolculuk rotaları ve yerel deneyimlerle dolu yeni sezon içeriklerini keşfedin.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1100px] space-y-6 px-4 md:px-6">
        <div className="flex flex-wrap gap-2">
          {CATEGORY_FILTERS.map((category) => (
            <button
              key={category.value}
              type="button"
              onClick={() => setActiveCategory(category.value)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                activeCategory === category.value
                  ? "bg-primary text-white shadow"
                  : "bg-white text-muted-foreground hover:bg-primary/10"
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
            <h2 className="text-xl font-semibold text-foreground">Son yazılar</h2>
            <span className="text-sm text-muted-foreground">{posts.length} içerik</span>
          </div>
          {posts.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border/70 bg-white p-8 text-center text-sm text-muted-foreground">
              Bu kategoride henüz içerik bulunmuyor.
            </div>
          ) : (
            <div className="grid gap-5">
              {posts.map((post) => (
                <BlogPostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
