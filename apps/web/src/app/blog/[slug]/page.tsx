import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BlogPostCard } from "@/components/blog/blog-post-card";
import { api } from "@/lib/api";

const CATEGORY_LABELS: Record<string, string> = {
  rehber: "Rehber",
  deneyim: "Deneyim",
  gurme: "Gurme",
  mikrotrend: "Mikro Trend",
};

export const dynamic = "force-static";
export const revalidate = 3600;

export async function generateStaticParams() {
  const { blogPosts } = await api.blog.list({ limit: 100 });
  return blogPosts.map((post) => ({ slug: post.slug }));
}

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await api.blog.getBySlug(slug);

  if (!data || !data.blogPost) {
    return {
        title: "Blog | TatilDesen",
    };
  }
  
  const { blogPost: detail } = data;

  return {
    title: `${detail.title} | TatilDesen Blog`,
    description: detail.seoDescription || detail.excerpt,
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await api.blog.getBySlug(slug);

  if (!data || !data.blogPost) {
    notFound();
  }

  const { blogPost: detail, relatedPosts } = data;
  const categoryLabel = detail.category ? (CATEGORY_LABELS[detail.category] || detail.category) : "";

  return (
    <article className="space-y-16 pb-24">
      <section className="relative overflow-hidden h-[60vh] min-h-[400px]">
        <Image
          src={detail.heroImage || detail.featuredImage || "/images/placeholders/blog-placeholder.jpg"}
          alt={detail.title}
          fill
          className="object-cover"
          priority
          sizes="(max-width: 768px) 100vw, 1200px"
        />
        <div className="relative z-10 mx-auto flex h-full w-full max-w-[960px] flex-col justify-end gap-6 bg-gradient-to-t from-black/80 via-black/40 to-black/10 px-4 pb-16 text-white md:px-0 md:pb-24">
          <div className="inline-flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
            {categoryLabel && (
                <span className="rounded-full bg-white/15 px-3 py-1">
                {categoryLabel}
                </span>
            )}
            {detail.publishedAt && <span>{formatDate(detail.publishedAt)}</span>}
            {detail.readTime && <span>• {detail.readTime} dk</span>}
          </div>
          <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">{detail.title}</h1>
          <p className="max-w-2xl text-sm text-white/80 md:text-base">{detail.excerpt}</p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[820px] space-y-12 px-4 md:px-0">
         <div 
           className="prose prose-lg prose-neutral max-w-none prose-headings:font-semibold prose-a:text-primary"
           dangerouslySetInnerHTML={{ __html: detail.content || "" }} 
         />
      </section>

      {relatedPosts && relatedPosts.length > 0 && (
        <section className="mx-auto w-full max-w-[960px] space-y-4 px-4 md:px-0">
          <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
            <h2 className="text-xl font-semibold text-foreground">Diğer yazılar</h2>
            <Link
              href="/blog"
              className="text-sm font-semibold text-primary transition hover:text-primary/80"
            >
              Tüm yazıları gör →
            </Link>
          </div>
          <div className="grid gap-4">
            {relatedPosts.map((post) => (
              <BlogPostCard key={post.id} post={post} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
