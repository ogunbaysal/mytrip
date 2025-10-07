import Image from "next/image";
import { notFound } from "next/navigation";

import { PlaceCard } from "@/components/places/place-card";
import { COLLECTION_DETAILS, COLLECTION_DETAILS_BY_SLUG } from "@/lib/data/collection-details";

const CONTAINER_CLASS = "mx-auto w-full max-w-[1100px] px-4 md:px-6";

type PageParams = Promise<{ slug: string }>;

export const dynamic = "force-static";

export function generateStaticParams() {
  return COLLECTION_DETAILS.map((collection) => ({ slug: collection.slug }));
}

export async function generateMetadata({ params }: { params: PageParams }) {
  const { slug } = await params;
  const collection = COLLECTION_DETAILS_BY_SLUG.get(slug);

  if (!collection) {
    notFound();
  }

  return {
    title: `${collection.name} | MyTrip`,
    description: collection.description,
  };
}

export default async function CollectionDetailPage({ params }: { params: PageParams }) {
  const { slug } = await params;
  const collection = COLLECTION_DETAILS_BY_SLUG.get(slug);

  if (!collection) {
    notFound();
  }

  return (
    <div className="space-y-16 pb-24 pt-10 md:pt-14">
      <section className={`${CONTAINER_CLASS}`}>
        <div className="relative overflow-hidden rounded-3xl bg-black/40">
          <Image
            src={collection.heroImage}
            alt={collection.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 1100px"
            priority
          />
          <div className="relative z-10 flex flex-col gap-6 bg-gradient-to-t from-black/70 via-black/30 to-black/10 p-8 text-white md:p-12">
            <div className="inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
              <span className="rounded-full bg-white/20 px-3 py-1">{collection.duration}</span>
              <span className="rounded-full bg-white/10 px-3 py-1">{collection.season}</span>
            </div>
            <div className="space-y-4">
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{collection.name}</h1>
              <p className="max-w-2xl text-base text-white/90 md:text-lg">{collection.intro}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {collection.bestFor.map((item) => (
                <span
                  key={item}
                  className="rounded-full bg-white/15 px-4 py-1 text-sm font-medium text-white shadow-sm"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className={`${CONTAINER_CLASS}`}>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {collection.highlights.map((highlight) => (
            <div
              key={highlight.title}
              className="rounded-2xl border border-border bg-white/80 p-6 shadow-sm shadow-black/5"
            >
              <h2 className="text-lg font-semibold text-foreground">{highlight.title}</h2>
              <p className="mt-3 text-sm text-muted-foreground">{highlight.description}</p>
            </div>
          ))}
          <div className="rounded-2xl border border-dashed border-primary/50 bg-primary/5 p-6 shadow-sm shadow-black/5">
            <h2 className="text-lg font-semibold text-primary">Planlama notları</h2>
            <ul className="mt-3 space-y-2 text-sm text-primary/90">
              <li>
                <span className="font-semibold">Toplam öneri:</span> {collection.itemCount}
              </li>
              <li>
                <span className="font-semibold">Önerilen sezon:</span> {collection.season}
              </li>
              <li>
                <span className="font-semibold">Süre:</span> {collection.duration}
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className={`${CONTAINER_CLASS} space-y-6`}>
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Rota planı</h2>
          <p className="text-sm text-muted-foreground">
            Her güne özel önerilerle hazırlanan planı takip ederek rotayı kolayca uygulayın.
          </p>
        </div>
        <div className="space-y-4">
          {collection.itinerary.map((item) => (
            <div
              key={item.day}
              className="rounded-2xl border border-border bg-white p-5 shadow-sm shadow-black/5 md:flex md:items-start md:gap-6"
            >
              <div className="min-w-[120px] rounded-xl bg-primary/10 px-3 py-2 text-sm font-semibold text-primary">
                {item.day}
              </div>
              <div className="mt-3 space-y-2 md:mt-0">
                <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className={`${CONTAINER_CLASS} space-y-6`}>
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Yerel ipuçları</h2>
          <p className="text-sm text-muted-foreground">
            MyTrip editörlerinin rotayı kusursuz yaşamanız için önerdiği küçük hatırlatmalar.
          </p>
        </div>
        <ul className="grid gap-4 md:grid-cols-2">
          {collection.tips.map((tip) => (
            <li
              key={tip}
              className="flex items-start gap-3 rounded-2xl border border-border bg-white/90 p-5 text-sm text-muted-foreground shadow-sm"
            >
              <span className="mt-1 inline-flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                •
              </span>
              <span>{tip}</span>
            </li>
          ))}
        </ul>
      </section>

      {collection.featuredPlaces.length > 0 && (
        <section className={`${CONTAINER_CLASS} space-y-4`}>
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">Öne çıkan konaklamalar</h2>
            <p className="text-sm text-muted-foreground">
              Rotayı yaşarken konaklayabileceğiniz MyTrip editör önerileri.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {collection.featuredPlaces.map((place) => (
              <PlaceCard key={place.id} place={place} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
