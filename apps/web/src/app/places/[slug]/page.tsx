import type { Metadata } from "next";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Calendar,
  ChevronRight,
  Flag,
  Heart,
  Mail,
  MapPin,
  Navigation,
  Phone,
  Share,
  Shield,
  Sparkles,
  Star,
  Ticket,
} from "lucide-react";

import { CollectionCard } from "@/components/collections/collection-card";
import { PlaceCard } from "@/components/places/place-card";
import { PlacesMap } from "@/components/places/places-map";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import {
  getPlaceKindLabel,
  getPlacePriceUnitLabel,
  isMonetizedPlaceKind,
  isStayPlaceKind,
  normalizePlaceKind,
} from "@/lib/place-kind";
import { PlaceDetailBookingCard } from "./components/booking-card";
import { PlaceDetailAmenitiesSection } from "./components/amenities-section";
import { PlaceDetailDatePicker } from "./components/date-picker";
import { PlaceDetailGalleryModal } from "./components/gallery-modal";

const priceFormatter = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  minimumFractionDigits: 0,
});

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

const sanitizeHtml = (value: string) =>
  value
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "")
    .replace(/javascript:/gi, "");

const renderDescriptionHtml = (value: string | null | undefined) => {
  if (!value) return "";
  const hasHtmlTag = /<\/?[a-z][\s\S]*>/i.test(value);
  if (hasHtmlTag) {
    return sanitizeHtml(value);
  }
  return value
    .split("\n")
    .map((line) => escapeHtml(line))
    .join("<br />");
};

const toNumber = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return undefined;
};

const toBoolean = (value: unknown): boolean | undefined => {
  if (typeof value === "boolean") {
    return value;
  }
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
};

const toStringValue = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : undefined;
};

type DetailFact = { label: string; value: string };

type KindSection = {
  title: string;
  facts: DetailFact[];
  tags: string[];
  notes: string[];
  sidebarCtaLabel: string;
};

function buildKindSection(
  normalizedKind: string,
  typeProfile: Record<string, unknown> | null | undefined,
  nightlyPrice: number,
  checkInInfo?: string,
  checkOutInfo?: string,
): KindSection {
  const profile = typeProfile ?? {};
  const facts: DetailFact[] = [];
  const tags: string[] = [];
  const notes: string[] = [];

  if (isStayPlaceKind(normalizedKind)) {
    const starRating = toNumber(profile.starRating);
    const minimumStay = toNumber(profile.minimumStayNights);
    const poolAvailable = toBoolean(profile.poolAvailable);
    const cleaningFee = toNumber(profile.cleaningFee);

    if (starRating) facts.push({ label: "Yıldız", value: `${starRating}` });
    if (minimumStay) {
      facts.push({ label: "Minimum konaklama", value: `${minimumStay} gece` });
    }
    if (poolAvailable !== undefined) {
      tags.push(poolAvailable ? "Havuz mevcut" : "Havuz yok");
    }
    if (cleaningFee && cleaningFee > 0) {
      facts.push({
        label: "Temizlik ücreti",
        value: priceFormatter.format(cleaningFee),
      });
    }
    if (checkInInfo) facts.push({ label: "Giriş", value: checkInInfo });
    if (checkOutInfo) facts.push({ label: "Çıkış", value: checkOutInfo });

    return {
      title: "Konaklama detayları",
      facts,
      tags,
      notes,
      sidebarCtaLabel: "Rezervasyon yap",
    };
  }

  const startingPrice =
    toNumber(profile.startingPrice) ?? (nightlyPrice > 0 ? nightlyPrice : undefined);
  const averageDurationMinutes = toNumber(profile.averageDurationMinutes);
  const requiresReservation = toBoolean(profile.requiresReservation);
  const safetyRequirements = toStringValue(profile.safetyRequirements);

  if (startingPrice) {
    facts.push({ label: "Başlangıç fiyatı", value: priceFormatter.format(startingPrice) });
  }
  if (averageDurationMinutes) {
    facts.push({
      label: "Ortalama süre",
      value: `${averageDurationMinutes} dakika`,
    });
  }
  if (requiresReservation !== undefined) {
    tags.push(requiresReservation ? "Rezervasyon gerekli" : "Anlık katılım mümkün");
  }
  if (safetyRequirements) {
    notes.push(safetyRequirements);
  }

  return {
    title: "Aktivite bilgileri",
    facts,
    tags,
    notes,
    sidebarCtaLabel: "Paketleri incele",
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const detail = await api.places.getBySlug(slug);

  if (!detail) {
    notFound();
  }

  return {
    title: detail.name,
    description: detail.shortDescription,
  };
}

export default async function PlaceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const detail = await api.places.getBySlug(slug);

  if (!detail) {
    notFound();
  }

  const descriptionHtml = renderDescriptionHtml(detail.description);
  const kindSource = detail.kind || detail.kindSlug || detail.kindName || detail.type;
  const normalizedKind = normalizePlaceKind(kindSource);
  const kindLabel = getPlaceKindLabel(kindSource, detail.type);
  const isStayKind = isStayPlaceKind(normalizedKind);
  const hasBookablePrice =
    detail.nightlyPrice > 0 && isMonetizedPlaceKind(normalizedKind);
  const bookingPriceUnitLabel = getPlacePriceUnitLabel(normalizedKind);
  const kindSection = buildKindSection(
    normalizedKind,
    detail.typeProfile,
    detail.nightlyPrice,
    detail.checkInInfo,
    detail.checkOutInfo,
  );
  const highlightChips = detail.shortHighlights.filter((item) => item.trim().length > 0);

  const galleryImages = Array.from(
    new Set([detail.heroImage, ...detail.gallery].filter(Boolean)),
  );
  const hasGalleryGrid = galleryImages.length > 1;
  const locationLabel = [detail.district, detail.city].filter(Boolean).join(", ");
  const locationHeading = locationLabel || "Konum bilgisi";
  const locationDescription =
    detail.locationDescription ||
    (locationLabel
      ? `${kindLabel} ${locationLabel} bölgesinde konumlanır.`
      : `${kindLabel} merkezi bir konumda yer alır.`);
  const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${detail.coordinates.lat},${detail.coordinates.lng}`;

  const primaryImage = galleryImages[0] || detail.imageUrl;
  const contactInfo = detail.contactInfo ?? null;
  const contactRows = [
    contactInfo?.phone
      ? {
          icon: <Phone className="h-4 w-4" />,
          label: "Telefon",
          value: (
            <a href={`tel:${contactInfo.phone}`} className="underline">
              {contactInfo.phone}
            </a>
          ),
        }
      : null,
    contactInfo?.email
      ? {
          icon: <Mail className="h-4 w-4" />,
          label: "E-posta",
          value: (
            <a href={`mailto:${contactInfo.email}`} className="underline">
              {contactInfo.email}
            </a>
          ),
        }
      : null,
    contactInfo?.website
      ? {
          icon: <ChevronRight className="h-4 w-4" />,
          label: "Web sitesi",
          value: (
            <a
              href={
                contactInfo.website.startsWith("http")
                  ? contactInfo.website
                  : `https://${contactInfo.website}`
              }
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              {contactInfo.website}
            </a>
          ),
        }
      : null,
  ].filter(Boolean) as Array<{ icon: ReactNode; label: string; value: ReactNode }>;

  const showDatePicker = isStayKind;
  const showStayBookingCard = isStayKind && hasBookablePrice;
  const showMobileBookingBar = showStayBookingCard;

  return (
    <div className="pb-24">
      <section className="mx-auto max-w-7xl px-4 pt-6 md:px-6">
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{detail.name}</h1>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="rounded-full bg-primary/10 px-3 py-1 font-medium text-primary">
              {kindLabel}
            </span>
            {(detail.rating > 0 || detail.reviewCount > 0) && (
              <>
                <span className="text-muted-foreground">·</span>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-current" />
                  <span className="font-medium">{detail.rating.toFixed(1)}</span>
                </div>
                {detail.reviewCount > 0 ? (
                  <span className="underline">{detail.reviewCount} değerlendirme</span>
                ) : null}
              </>
            )}
            {(detail.district || detail.city) && (
              <>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground underline">
                  {[detail.district, detail.city].filter(Boolean).join(", ")}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 text-sm font-medium underline hover:text-muted-foreground">
              <Share className="h-4 w-4" />
              Paylaş
            </button>
            <button className="flex items-center gap-2 text-sm font-medium underline hover:text-muted-foreground">
              <Heart className="h-4 w-4" />
              Kaydet
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-6 max-w-7xl px-4 md:px-6">
        <div
          className={
            hasGalleryGrid
              ? "relative grid grid-cols-1 gap-2 overflow-hidden rounded-xl md:grid-cols-4 md:grid-rows-2"
              : "relative overflow-hidden rounded-xl"
          }
        >
          <div
            className={
              hasGalleryGrid
                ? "relative aspect-[4/3] md:col-span-2 md:row-span-2 md:aspect-auto md:min-h-[360px]"
                : "relative aspect-[4/3] md:aspect-[16/7]"
            }
          >
            <Image
              src={primaryImage}
              alt={detail.name}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>

          {hasGalleryGrid
            ? galleryImages.slice(1, 5).map((image, index) => (
            <div
              key={image + index}
              className={`relative hidden aspect-square md:block ${
                index === 1 ? "rounded-tr-xl" : ""
              } ${index === 3 ? "rounded-br-xl" : ""}`}
            >
              <Image
                src={image}
                alt={`${detail.name} - ${index + 2}`}
                fill
                className="object-cover"
                sizes="25vw"
              />
            </div>
          ))
            : null}

          <PlaceDetailGalleryModal images={galleryImages} placeName={detail.name} />
        </div>
      </section>

      <section className="mx-auto mt-8 max-w-7xl px-4 md:px-6">
        <div className="grid gap-12 lg:grid-cols-[1fr_370px]">
          <div className="space-y-8">
            <div className="flex items-start justify-between gap-6">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold md:text-2xl">{kindSection.title}</h2>
                {highlightChips.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    {highlightChips.map((item) => (
                      <span
                        key={item}
                        className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 font-medium text-foreground/80"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                ) : null}
              </div>

              {isStayKind && detail.host ? (
                <div className="relative shrink-0">
                  <Avatar className="h-14 w-14">
                    <AvatarImage src={detail.host.avatar} alt={detail.host.name} />
                    <AvatarFallback>{detail.host.name[0]}</AvatarFallback>
                  </Avatar>
                  {detail.host.isSuperhost && (
                    <div className="absolute -bottom-1 -right-1 rounded-full bg-rose-500 p-1">
                      <Shield className="h-3 w-3 text-white" />
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {descriptionHtml ? (
              <div className="space-y-3 border-t pt-8">
                <h3 className="text-lg font-semibold">Açıklama</h3>
                <div
                  className="prose prose-sm max-w-none text-muted-foreground [&_*]:text-inherit"
                  dangerouslySetInnerHTML={{ __html: descriptionHtml }}
                />
              </div>
            ) : null}

            {(kindSection.facts.length > 0 || kindSection.tags.length > 0 || kindSection.notes.length > 0) ? (
              <div id="kind-details" className="space-y-5 border-t pt-8">
                <h3 className="text-lg font-semibold">{kindSection.title}</h3>

                {kindSection.facts.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {kindSection.facts.map((fact) => (
                      <div key={fact.label} className="rounded-xl border p-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          {fact.label}
                        </p>
                        <p className="mt-1 text-base font-semibold">{fact.value}</p>
                      </div>
                    ))}
                  </div>
                ) : null}

                {kindSection.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {kindSection.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}

                {kindSection.notes.length > 0 ? (
                  <div className="space-y-2">
                    {kindSection.notes.map((note) => (
                      <p key={note} className="text-sm text-muted-foreground">
                        {note}
                      </p>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}

            <PlaceDetailAmenitiesSection amenities={detail.amenities} />

            {showDatePicker ? (
              <div className="border-t pt-8">
                <PlaceDetailDatePicker city={detail.city} />
              </div>
            ) : null}

            {(detail.reviews?.length ?? 0) > 0 ? (
              <div className="space-y-6 border-t pt-8">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 fill-current" />
                  <span className="text-lg font-semibold">{detail.rating.toFixed(1)}</span>
                  {detail.reviewCount > 0 ? (
                    <span className="text-muted-foreground">· {detail.reviewCount} değerlendirme</span>
                  ) : null}
                </div>

                <div className="grid gap-8 sm:grid-cols-2">
                  {detail.reviews?.map((review) => (
                    <div key={review.id} className="space-y-4">
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarImage src={review.author.avatar} alt={review.author.name} />
                          <AvatarFallback>{review.author.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{review.author.name}</p>
                          <p className="text-sm text-muted-foreground">{review.date}</p>
                        </div>
                      </div>
                      <p className="text-muted-foreground">{review.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className="hidden lg:block">
            <div className="sticky top-24 space-y-4">
              {showStayBookingCard ? (
                <PlaceDetailBookingCard
                  placeSlug={slug}
                  nightlyPrice={detail.nightlyPrice}
                  rating={detail.rating}
                  reviewCount={detail.reviewCount}
                  maxGuests={toNumber(detail.typeProfile?.maxGuests) ?? 4}
                />
              ) : hasBookablePrice ? (
                <div className="rounded-2xl border bg-card p-6 shadow-sm">
                  <p className="text-xl font-semibold">
                    {priceFormatter.format(detail.nightlyPrice)}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Fiyat tipi: {bookingPriceUnitLabel}
                  </p>
                  <Button className="mt-4 w-full" asChild>
                    <a href="#kind-details">{kindSection.sidebarCtaLabel}</a>
                  </Button>
                </div>
              ) : null}

              {contactRows.length > 0 ? (
                <div className="rounded-2xl border bg-card p-6 shadow-sm">
                  <p className="text-base font-semibold">İletişim</p>
                  <div className="mt-4 space-y-3 text-sm">
                    {contactRows.map((row) => (
                      <div key={row.label} className="flex items-start gap-2">
                        <span className="mt-0.5 text-muted-foreground">{row.icon}</span>
                        <div>
                          <p className="text-xs uppercase text-muted-foreground">{row.label}</p>
                          <div className="font-medium">{row.value}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Flag className="h-4 w-4" />
                <button className="underline">Bu ilanı bildir</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-12 max-w-7xl border-t px-4 pt-12 md:px-6">
        <div className="space-y-6">
          <h2 className="text-xl font-semibold md:text-2xl">Konum</h2>
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
              <div className="h-[340px] md:h-[400px]">
                <PlacesMap
                  places={[detail]}
                  markerMode="pin"
                  showSearchAsMoveToggle={false}
                  initialZoom={13}
                />
              </div>
            </div>

            <aside className="flex h-full flex-col rounded-2xl border border-border/70 bg-card p-5 shadow-sm">
              <h3 className="text-base font-semibold">Bölge bilgisi</h3>
              <div className="mt-4 flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 text-primary" />
                <p className="font-medium">{locationHeading}</p>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {locationDescription}
              </p>
              <Button asChild variant="outline" className="mt-5 w-full">
                <a href={directionsUrl} target="_blank" rel="noreferrer">
                  <Navigation className="mr-2 h-4 w-4" />
                  Yol tarifi al
                </a>
              </Button>
            </aside>
          </div>
        </div>
      </section>

      {isStayKind && detail.host ? (
        <section className="mx-auto mt-12 max-w-7xl border-t px-4 pt-12 md:px-6">
          <div className="space-y-6">
            <div className="flex items-start gap-6">
              <div className="relative">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={detail.host.avatar} alt={detail.host.name} />
                  <AvatarFallback>{detail.host.name[0]}</AvatarFallback>
                </Avatar>
                {detail.host.isSuperhost ? (
                  <div className="absolute -bottom-1 -right-1 rounded-full bg-rose-500 p-1.5">
                    <Shield className="h-3 w-3 text-white" />
                  </div>
                ) : null}
              </div>
              <div className="space-y-1">
                <h2 className="text-xl font-semibold md:text-2xl">İşletme: {detail.host.name}</h2>
                {detail.host.joinedDate ? (
                  <p className="text-sm text-muted-foreground">
                    {detail.host.joinedDate} tarihinde katıldı
                  </p>
                ) : null}
              </div>
            </div>

            <div className="flex flex-wrap gap-6 text-sm">
              {detail.host.reviewCount > 0 ? (
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  <span>{detail.host.reviewCount} değerlendirme</span>
                </div>
              ) : null}
              {detail.host.isVerified ? (
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <span>Kimlik doğrulandı</span>
                </div>
              ) : null}
              {detail.host.isSuperhost ? (
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  <span>Süper ev sahibi</span>
                </div>
              ) : null}
            </div>

            {detail.host.responseRate ? (
              <p className="text-sm text-muted-foreground">Yanıt oranı: %{detail.host.responseRate}</p>
            ) : null}
            {detail.host.responseTime ? (
              <p className="text-sm text-muted-foreground">Yanıt süresi: {detail.host.responseTime}</p>
            ) : null}

            <Button variant="outline" size="lg">
              İşletmeyle iletişime geç
            </Button>

            <div className="flex items-start gap-4 rounded-lg bg-muted/50 p-4 text-xs text-muted-foreground">
              <Shield className="h-5 w-5 shrink-0" />
              <p>
                Ödemenizi korumak için TatilDesen dışındaki yönlendirmelerle ödeme yapmayın.
              </p>
            </div>
          </div>
        </section>
      ) : null}

      {detail.featuredCollections && detail.featuredCollections.length > 0 ? (
        <section className="mx-auto mt-12 max-w-7xl border-t px-4 pt-12 md:px-6">
          <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
            <h2 className="text-xl font-semibold">Önerilen koleksiyonlar</h2>
            <Link
              href="/collections"
              className="text-sm font-semibold text-primary hover:text-primary/80"
            >
              Tüm koleksiyonları gör
            </Link>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {detail.featuredCollections.map((collection) => (
              <CollectionCard key={collection.id} collection={collection} />
            ))}
          </div>
        </section>
      ) : null}

      {detail.nearbyPlaces && detail.nearbyPlaces.length > 0 ? (
        <section className="mx-auto mt-12 max-w-7xl border-t px-4 pt-12 md:px-6">
          <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
            <h2 className="text-xl font-semibold">Yakındaki öneriler</h2>
            <Link
              href="/places"
              className="text-sm font-semibold text-primary hover:text-primary/80"
            >
              Tüm mekanları gör
            </Link>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {detail.nearbyPlaces.map((place) => (
              <PlaceCard key={place.id} place={place} />
            ))}
          </div>
        </section>
      ) : null}

      {showMobileBookingBar ? (
        <div className="fixed bottom-0 left-0 right-0 border-t bg-background p-4 lg:hidden">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-lg font-semibold">
                {priceFormatter.format(detail.nightlyPrice)}
              </span>
              <span className="text-sm text-muted-foreground"> gece</span>
              <div className="flex items-center gap-1 text-sm">
                <Star className="h-3 w-3 fill-current" />
                <span>{detail.rating.toFixed(1)}</span>
                {detail.reviewCount > 0 ? (
                  <span className="text-muted-foreground">· {detail.reviewCount} değerlendirme</span>
                ) : null}
              </div>
            </div>
            <Button className="bg-rose-500 hover:bg-rose-600" asChild>
              <Link href={`/bookings?place=${encodeURIComponent(slug)}`}>
                <Calendar className="mr-2 h-4 w-4" />
                Rezervasyon yap
              </Link>
            </Button>
          </div>
        </div>
      ) : hasBookablePrice ? (
        <div className="fixed bottom-0 left-0 right-0 border-t bg-background p-4 lg:hidden">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-lg font-semibold">
                {priceFormatter.format(detail.nightlyPrice)}
              </span>
              <span className="text-sm text-muted-foreground"> {bookingPriceUnitLabel}</span>
            </div>
            <Button asChild>
              <a href="#kind-details">
                <Ticket className="mr-2 h-4 w-4" />
                {kindSection.sidebarCtaLabel}
              </a>
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
