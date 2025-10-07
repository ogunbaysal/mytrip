import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { PlacesMap } from "@/components/places/places-map";
import { CollectionCard } from "@/components/collections/collection-card";
import { PlaceCard } from "@/components/places/place-card";
import { PLACE_DETAILS, PLACE_DETAILS_BY_SLUG } from "@/lib/data/place-details";

const priceFormatter = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  minimumFractionDigits: 0,
});

export const dynamic = "force-static";

export function generateStaticParams() {
  return PLACE_DETAILS.map((detail) => ({ slug: detail.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const detail = PLACE_DETAILS_BY_SLUG.get(slug);

  if (!detail) {
    notFound();
  }

  return {
    title: `${detail.name} | MyTrip`,
    description: detail.shortDescription,
  };
}

export default async function PlaceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const detail = PLACE_DETAILS_BY_SLUG.get(slug);

  if (!detail) {
    notFound();
  }

  return (
    <div className="space-y-16 pb-24">
      <section className="relative h-[480px] w-full overflow-hidden rounded-b-[48px]">
        <Image
          src={detail.heroImage}
          alt={detail.name}
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="relative mx-auto flex h-full w-full max-w-[1100px] flex-col justify-end gap-6 px-4 pb-12 text-white md:px-6">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white/80">
              {detail.city} • {detail.district}
            </span>
            <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">{detail.name}</h1>
            <p className="max-w-2xl text-sm text-white/80 md:text-base">{detail.shortDescription}</p>
          </div>
          <div className="flex flex-col items-start gap-3 text-sm text-white/80 md:flex-row md:items-center md:gap-6">
            <span>
              <span className="text-2xl font-semibold text-white">{priceFormatter.format(detail.nightlyPrice)}</span>
              <span className="ml-2 text-sm font-medium text-white/80">gece</span>
            </span>
            {detail.checkInInfo && <span>{detail.checkInInfo}</span>}
            <Button asChild variant="secondary" className="bg-white text-primary hover:bg-white/90">
              <Link href="/contact">Misafir ilişkileriyle iletişime geç</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1100px] space-y-10 px-4 md:px-6">
        <div className="grid gap-6 md:grid-cols-[2fr_1fr] md:gap-10">
          <div className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-3">
              {detail.shortHighlights.map((item) => (
                <div
                  key={item}
                  className="rounded-3xl border border-border bg-white/90 p-4 text-sm text-muted-foreground shadow-sm shadow-black/5"
                >
                  {item}
                </div>
              ))}
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground md:text-base">{detail.description}</p>
          </div>
          <div className="space-y-3 rounded-3xl border border-border bg-white/90 p-5 shadow-sm shadow-black/5">
            <h2 className="text-lg font-semibold text-foreground">Öne çıkan olanaklar</h2>
            <ul className="grid gap-2 text-sm text-muted-foreground">
              {detail.amenities.map((amenity) => (
                <li key={amenity.label} className="flex items-center gap-3">
                  <span className="text-lg">{amenity.icon}</span>
                  <span>{amenity.label}</span>
                </li>
              ))}
            </ul>
            {detail.checkOutInfo && <p className="text-xs text-muted-foreground">{detail.checkOutInfo}</p>}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {detail.gallery.map((image) => (
            <div key={image} className="relative aspect-[4/3] overflow-hidden rounded-3xl">
              <Image src={image} alt={`${detail.name} görseli`} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1100px] space-y-6 px-4 md:px-6">
        <h2 className="text-xl font-semibold text-foreground">Konum</h2>
        <div className="h-[360px] overflow-hidden rounded-3xl border border-border bg-white shadow-sm shadow-black/5">
          <PlacesMap places={[detail]} />
        </div>
      </section>

      {detail.featuredCollections && detail.featuredCollections.length > 0 && (
        <section className="mx-auto w-full max-w-[1100px] space-y-4 px-4 md:px-6">
          <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
            <h2 className="text-xl font-semibold text-foreground">Önerilen koleksiyonlar</h2>
            <Link href="/collections" className="text-sm font-semibold text-primary hover:text-primary/80">
              Tüm koleksiyonları gör →
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {detail.featuredCollections.map((collection) => (
              <CollectionCard key={collection.id} collection={collection} />
            ))}
          </div>
        </section>
      )}

      {detail.nearbyPlaces && detail.nearbyPlaces.length > 0 && (
        <section className="mx-auto w-full max-w-[1100px] space-y-4 px-4 md:px-6">
          <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
            <h2 className="text-xl font-semibold text-foreground">Yakındaki öneriler</h2>
            <Link href="/places" className="text-sm font-semibold text-primary hover:text-primary/80">
              Tüm konaklamaları gör →
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {detail.nearbyPlaces.map((place) => (
              <PlaceCard key={place.id} place={place} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
