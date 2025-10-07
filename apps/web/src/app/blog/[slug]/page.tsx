import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BlogPostCard } from "@/components/blog/blog-post-card";
import { BLOG_POSTS } from "@/lib/data/blog-posts";
import { BLOG_POST_DETAILS_BY_SLUG } from "@/lib/data/blog-post-details";

const CATEGORY_LABELS = {
  rehber: "Rehber",
  deneyim: "Deneyim",
  gurme: "Gurme",
  mikrotrend: "Mikro Trend",
} as const;

export const dynamic = "force-static";

export function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }));
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
  const detail = BLOG_POST_DETAILS_BY_SLUG.get(slug);

  if (!detail) {
    notFound();
  }

  return {
    title: `${detail.title} | MyTrip Blog`,
    description: detail.excerpt,
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const detail = BLOG_POST_DETAILS_BY_SLUG.get(slug);

  if (!detail) {
    notFound();
  }

  const otherPosts = BLOG_POSTS.filter((post) => post.slug !== slug).slice(0, 3);

  return (
    <article className="space-y-16 pb-24">
      <section className="relative overflow-hidden">
        <Image
          src={detail.heroImage}
          alt={detail.title}
          fill
          className="object-cover"
          priority
          sizes="(max-width: 768px) 100vw, 1200px"
        />
        <div className="relative z-10 mx-auto flex w-full max-w-[960px] flex-col gap-6 bg-gradient-to-t from-black/80 via-black/40 to-black/10 px-4 pb-16 pt-28 text-white md:px-0 md:pb-24 md:pt-40">
          <div className="inline-flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
            <span className="rounded-full bg-white/15 px-3 py-1">
              {CATEGORY_LABELS[detail.category]}
            </span>
            <span>{formatDate(detail.publishedAt)}</span>
            <span>• {detail.readTimeMinutes} dk</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">{detail.title}</h1>
          <p className="max-w-2xl text-sm text-white/80 md:text-base">{detail.intro}</p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[820px] space-y-12 px-4 md:px-0">
        {detail.sections.map((section, index) => (
          <div key={`${section.title ?? "section"}-${index}`} className="space-y-4">
            {section.title && (
              <h2 className="text-2xl font-semibold text-foreground">{section.title}</h2>
            )}
            {section.image && (
              <div className="relative aspect-[4/3] overflow-hidden rounded-3xl">
                <Image
                  src={section.image.src}
                  alt={section.image.alt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 820px) 100vw, 820px"
                />
              </div>
            )}
            <div className="space-y-3 text-base leading-relaxed text-muted-foreground">
              {section.paragraphs.map((paragraph, idx) => (
                <p key={idx}>{paragraph}</p>
              ))}
            </div>
          </div>
        ))}

        {detail.tips && detail.tips.length > 0 && (
          <div className="space-y-3 rounded-3xl border border-primary/30 bg-primary/5 p-6">
            <h3 className="text-xl font-semibold text-primary">MyTrip ipuçları</h3>
            <ul className="space-y-2 text-sm text-primary/90">
              {detail.tips.map((tip) => (
                <li key={tip} className="flex items-start gap-2">
                  <span className="mt-1 inline-flex size-5 items-center justify-center rounded-full bg-primary/10 text-primary">
                    •
                  </span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {otherPosts.length > 0 && (
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
            {otherPosts.map((post) => (
              <BlogPostCard key={post.id} post={post} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
