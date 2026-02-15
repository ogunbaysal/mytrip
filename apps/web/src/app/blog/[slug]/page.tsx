import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BlogCommentsSection } from "@/components/blog/blog-comments-section";
import { BlogPostCard } from "@/components/blog/blog-post-card";
import { api } from "@/lib/api";

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
  const categoryLabel = detail.categoryName || detail.categorySlug || "";
  const authorName = detail.authorName?.trim() || "TatilDesen Editörleri";
  const authorInitial = authorName.charAt(0).toUpperCase();

  return (
    <article className="space-y-16 pb-24">
      <section className="relative isolate h-[68vh] min-h-[420px] overflow-hidden">
        <Image
          src={detail.heroImage || detail.featuredImage || "/images/placeholders/blog-placeholder.png"}
          alt={detail.title}
          fill
          className="object-cover"
          priority
          sizes="(max-width: 768px) 100vw, 1200px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.2),transparent_58%)]" />

        <div className="relative z-10 mx-auto flex h-full w-full max-w-[960px] items-end px-4 pb-10 md:px-6 md:pb-16">
          <div className="w-full max-w-3xl rounded-3xl border border-white/20 bg-black/35 p-6 text-white backdrop-blur-sm md:p-8">
            <div className="inline-flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/75">
              {categoryLabel && (
                <span className="rounded-full bg-white/15 px-3 py-1">{categoryLabel}</span>
              )}
              {detail.publishedAt && <span>{formatDate(detail.publishedAt)}</span>}
              {detail.readTime && <span>• {detail.readTime} dk</span>}
            </div>

            <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-5xl">
              {detail.title}
            </h1>
            {detail.excerpt ? (
              <p className="mt-4 max-w-2xl text-sm text-white/85 md:text-base">
                {detail.excerpt}
              </p>
            ) : null}

            <div className="mt-6 flex items-center gap-3 border-t border-white/20 pt-4">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-sm font-semibold text-white">
                {authorInitial}
              </span>
              <div className="space-y-0.5">
                <p className="text-xs uppercase tracking-[0.16em] text-white/60">Yazar</p>
                <p className="text-sm font-medium text-white">{authorName}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[960px] space-y-12 px-4 md:px-6">
        <div className="rounded-3xl border border-border/70 bg-white p-6 shadow-sm md:p-10">
          <div
            className="max-w-none text-[1.06rem] leading-8 text-foreground/90 [&_h2]:mt-12 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h3]:mt-10 [&_h3]:text-xl [&_h3]:font-semibold [&_p]:my-5 [&_p]:text-foreground/85 [&_a]:font-medium [&_a]:text-primary [&_a]:underline-offset-4 hover:[&_a]:underline [&_blockquote]:my-8 [&_blockquote]:rounded-r-2xl [&_blockquote]:border-l-4 [&_blockquote]:border-primary/40 [&_blockquote]:bg-primary/5 [&_blockquote]:px-6 [&_blockquote]:py-4 [&_blockquote]:italic [&_ul]:my-6 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6 [&_ol]:my-6 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-6 [&_li]:pl-1 [&_img]:my-8 [&_img]:w-full [&_img]:rounded-2xl [&_img]:border [&_img]:border-border/70 [&_img]:shadow-sm [&_figure]:my-8 [&_figcaption]:mt-3 [&_figcaption]:text-center [&_figcaption]:text-sm [&_figcaption]:text-muted-foreground [&_hr]:my-10 [&_hr]:border-border/70 [&_pre]:my-6 [&_pre]:overflow-x-auto [&_pre]:rounded-2xl [&_pre]:bg-slate-950 [&_pre]:p-4 [&_pre]:text-sm [&_pre]:text-slate-100 [&_code]:rounded [&_code]:bg-slate-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[0.9em] [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-inherit"
            dangerouslySetInnerHTML={{ __html: detail.content || "" }}
          />
        </div>
        <BlogCommentsSection slug={detail.slug} />
      </section>

      {relatedPosts && relatedPosts.length > 0 && (
        <section className="mx-auto w-full max-w-[960px] space-y-4 px-4 md:px-6">
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
