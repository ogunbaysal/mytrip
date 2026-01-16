import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Star,
  Share,
  Heart,
  Grid3X3,
  Home,
  Sparkles,
  DoorOpen,
  Calendar,
  ChevronRight,
  Shield,
  Clock,
  Ban,
  Dog,
  PartyPopper,
  AlertTriangle,
  Flag,
} from "lucide-react";

import { CollectionCard } from "@/components/collections/collection-card";
import { PlaceCard } from "@/components/places/place-card";
import { PlacesMap } from "@/components/places/places-map";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { api } from "@/lib/api";
import { PlaceDetailBookingCard } from "./components/booking-card";
import { PlaceDetailGalleryModal } from "./components/gallery-modal";
import { PlaceDetailDatePicker } from "./components/date-picker";

const priceFormatter = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  minimumFractionDigits: 0,
});

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
  const detail = await api.places.getBySlug(slug);

  if (!detail) {
    notFound();
  }

  // Mock data for fields not yet in API
  const host = detail.host ?? {
    id: "host-1",
    name: "Ahmet",
    avatar: "/images/avatars/host-1.jpg",
    isSuperhost: true,
    joinedDate: "Mayıs 2021",
    reviewCount: 12,
    isVerified: true,
    responseRate: 100,
    responseTime: "bir saat içinde",
    description: "Misafirlerime en iyi deneyimi sunmak için buradayım.",
  };

  const ratings = detail.ratings ?? {
    overall: detail.rating,
    cleanliness: 5.0,
    accuracy: 5.0,
    communication: 5.0,
    location: 4.9,
    checkIn: 5.0,
    value: 4.7,
  };

  const reviews = detail.reviews ?? [
    {
      id: "r1",
      author: { name: "Mehmet", avatar: "/images/avatars/user-1.jpg" },
      date: "Aralık 2024",
      comment: "Harika bir konaklama deneyimi yaşadık.",
      rating: 5,
    },
    {
      id: "r2",
      author: { name: "Ayşe", avatar: "/images/avatars/user-2.jpg" },
      date: "Kasım 2024",
      comment: "Konum mükemmeldi, ev sahibi çok ilgiliydi.",
      rating: 5,
    },
  ];

  const rules = detail.rules ?? {
    checkInTime: "14:00",
    checkOutTime: "11:00",
    selfCheckIn: true,
    maxGuests: detail.maxGuests ?? 4,
    smokingAllowed: false,
    petsAllowed: false,
    partiesAllowed: false,
  };

  const safety = detail.safety ?? {
    hasSmokAlarm: true,
    hasCarbonMonoxideAlarm: true,
    hasSecurityCamera: false,
  };

  const maxGuests = detail.maxGuests ?? 2;
  const bedrooms = detail.bedrooms ?? 1;
  const beds = detail.beds ?? 1;
  const bathrooms = detail.bathrooms ?? 1;
  const cancellationPolicy =
    detail.cancellationPolicy ?? "Ücretsiz iptal: 14 gün öncesine kadar";

  // Get first 5 images for the gallery grid
  const galleryImages = [detail.heroImage, ...detail.gallery].slice(0, 5);

  return (
    <div className="pb-24">
      {/* Header Section */}
      <section className="mx-auto max-w-7xl px-4 pt-6 md:px-6">
        {/* Title */}
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          {detail.name}
        </h1>

        {/* Details Row */}
        <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
          {/* Left - Rating, Reviews, Location */}
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-current" />
              <span className="font-medium">{detail.rating.toFixed(1)}</span>
            </div>
            <span className="text-muted-foreground">·</span>
            <span className="underline">
              {detail.reviewCount} değerlendirme
            </span>
            {host.isSuperhost && (
              <>
                <span className="text-muted-foreground">·</span>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Shield className="h-4 w-4" />
                  <span>Süper Ev Sahibi</span>
                </div>
              </>
            )}
            <span className="text-muted-foreground">·</span>
            <span className="underline text-muted-foreground">
              {detail.district}, {detail.city}
            </span>
          </div>

          {/* Right - Share & Save */}
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

      {/* Image Grid */}
      <section className="mx-auto mt-6 max-w-7xl px-4 md:px-6">
        <div className="relative grid grid-cols-1 gap-2 overflow-hidden rounded-xl md:grid-cols-4 md:grid-rows-2">
          {/* Main Large Image */}
          <div className="relative aspect-[4/3] md:col-span-2 md:row-span-2 md:aspect-auto">
            <Image
              src={galleryImages[0] || "/images/placeholder.jpg"}
              alt={detail.name}
              fill
              priority
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>

          {/* Small Images */}
          {galleryImages.slice(1, 5).map((image, index) => (
            <div
              key={index}
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
          ))}

          {/* Show All Photos Button */}
          <PlaceDetailGalleryModal
            images={[detail.heroImage, ...detail.gallery]}
            placeName={detail.name}
          />
        </div>
      </section>

      {/* Main Content */}
      <section className="mx-auto mt-8 max-w-7xl px-4 md:px-6">
        <div className="grid gap-12 lg:grid-cols-[1fr_370px]">
          {/* Left Column */}
          <div className="space-y-8">
            {/* Host & Property Info */}
            <div className="flex items-start justify-between gap-6">
              <div className="space-y-1">
                <h2 className="text-xl font-semibold md:text-2xl">
                  {detail.type === "stay"
                    ? "Tümü kiralık"
                    : detail.type === "experience"
                      ? "Deneyim"
                      : "Restoran"}{" "}
                  · Ev sahibi: {host.name}
                </h2>
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <span>{maxGuests} misafir</span>
                  <span>·</span>
                  <span>{bedrooms} yatak odası</span>
                  <span>·</span>
                  <span>{beds} yatak</span>
                  <span>·</span>
                  <span>{bathrooms} banyo</span>
                </div>
              </div>
              <div className="relative shrink-0">
                <Avatar className="h-14 w-14">
                  <AvatarImage src={host.avatar} alt={host.name} />
                  <AvatarFallback>{host.name[0]}</AvatarFallback>
                </Avatar>
                {host.isSuperhost && (
                  <div className="absolute -bottom-1 -right-1 rounded-full bg-rose-500 p-1">
                    <Shield className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Property Highlights */}
            <div className="space-y-6">
              <div className="flex gap-6">
                <Home className="h-8 w-8 shrink-0 text-muted-foreground" />
                <div>
                  <h3 className="font-medium">Tüm ev</h3>
                  <p className="text-sm text-muted-foreground">
                    Daireyi kendinize ait olarak kullanacaksınız
                  </p>
                </div>
              </div>
              <div className="flex gap-6">
                <Sparkles className="h-8 w-8 shrink-0 text-muted-foreground" />
                <div>
                  <h3 className="font-medium">Gelişmiş Temizlik</h3>
                  <p className="text-sm text-muted-foreground">
                    Bu ev sahibi 5 adımlı gelişmiş temizlik sürecine bağlı kaldı
                  </p>
                </div>
              </div>
              <div className="flex gap-6">
                <DoorOpen className="h-8 w-8 shrink-0 text-muted-foreground" />
                <div>
                  <h3 className="font-medium">Kendi kendine giriş</h3>
                  <p className="text-sm text-muted-foreground">
                    Tuş takımı ile kendiniz giriş yapın
                  </p>
                </div>
              </div>
              {cancellationPolicy && (
                <div className="flex gap-6">
                  <Calendar className="h-8 w-8 shrink-0 text-muted-foreground" />
                  <div>
                    <h3 className="font-medium">{cancellationPolicy}</h3>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Description */}
            <div className="space-y-4">
              <p className="whitespace-pre-line text-muted-foreground">
                {detail.description}
              </p>
              <button className="flex items-center gap-1 font-medium underline">
                Daha fazla göster
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <Separator />

            {/* Where You'll Sleep */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold md:text-2xl">
                Nerede uyuyacaksınız
              </h2>
              <div className="max-w-xs rounded-xl border p-6">
                <div className="mb-4 aspect-[4/3] overflow-hidden rounded-lg bg-muted">
                  {detail.gallery[0] && (
                    <Image
                      src={detail.gallery[0]}
                      alt="Yatak odası"
                      width={320}
                      height={240}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>
                <h3 className="font-medium">Yatak odası</h3>
                <p className="text-sm text-muted-foreground">
                  {beds} çift kişilik yatak
                </p>
              </div>
            </div>

            <Separator />

            {/* Amenities */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold md:text-2xl">
                Bu mekanın sunduğu olanaklar
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {detail.amenities.slice(0, 10).map((amenity) => (
                  <div key={amenity.label} className="flex items-center gap-4">
                    <span className="text-2xl">{amenity.icon}</span>
                    <span>{amenity.label}</span>
                  </div>
                ))}
              </div>
              {detail.amenities.length > 10 && (
                <Button variant="outline" className="mt-4">
                  Tüm {detail.amenities.length} olanağı göster
                </Button>
              )}
            </div>

            <Separator />

            {/* Date Picker */}
            <PlaceDetailDatePicker />
          </div>

          {/* Right Column - Booking Card (Sticky) */}
          <div className="hidden lg:block">
            <div className="sticky top-24">
              <PlaceDetailBookingCard
                nightlyPrice={detail.nightlyPrice}
                rating={detail.rating}
                reviewCount={detail.reviewCount}
              />
              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Flag className="h-4 w-4" />
                <button className="underline">Bu ilanı bildir</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="mx-auto mt-12 max-w-7xl border-t px-4 pt-12 md:px-6">
        <div className="space-y-8">
          {/* Rating Summary */}
          <div className="flex items-center gap-2">
            <Star className="h-6 w-6 fill-current" />
            <span className="text-xl font-semibold">
              {ratings.overall.toFixed(1)}
            </span>
            <span className="text-muted-foreground">·</span>
            <span className="text-xl font-semibold">
              {detail.reviewCount} değerlendirme
            </span>
          </div>

          {/* Rating Categories */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { label: "Temizlik", value: ratings.cleanliness },
              { label: "Doğruluk", value: ratings.accuracy },
              { label: "İletişim", value: ratings.communication },
              { label: "Konum", value: ratings.location },
              { label: "Giriş", value: ratings.checkIn },
              { label: "Değer", value: ratings.value },
            ].map((category) => (
              <div
                key={category.label}
                className="flex items-center justify-between gap-4"
              >
                <span className="text-sm">{category.label}</span>
                <div className="flex items-center gap-2">
                  <div className="h-1 w-24 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full bg-foreground"
                      style={{ width: `${(category.value / 5) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs">{category.value.toFixed(1)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Reviews Grid */}
          <div className="grid gap-8 sm:grid-cols-2">
            {reviews.map((review) => (
              <div key={review.id} className="space-y-4">
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarImage
                      src={review.author.avatar}
                      alt={review.author.name}
                    />
                    <AvatarFallback>{review.author.name[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{review.author.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {review.date}
                    </p>
                  </div>
                </div>
                <p className="text-muted-foreground">{review.comment}</p>
              </div>
            ))}
          </div>

          {detail.reviewCount > 2 && (
            <Button variant="outline">
              Tüm {detail.reviewCount} değerlendirmeyi göster
            </Button>
          )}
        </div>
      </section>

      {/* Map Section */}
      <section className="mx-auto mt-12 max-w-7xl border-t px-4 pt-12 md:px-6">
        <div className="space-y-6">
          <h2 className="text-xl font-semibold md:text-2xl">
            Nerede olacaksınız
          </h2>
          <div className="h-[400px] overflow-hidden rounded-xl">
            <PlacesMap places={[detail]} />
          </div>
          <div className="space-y-4">
            <h3 className="font-semibold">
              {detail.district}, {detail.city}
            </h3>
            <p className="text-muted-foreground">
              {detail.locationDescription ?? detail.shortDescription}
            </p>
            <button className="flex items-center gap-1 font-medium underline">
              Daha fazla göster
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Host Section */}
      <section className="mx-auto mt-12 max-w-7xl border-t px-4 pt-12 md:px-6">
        <div className="space-y-6">
          <div className="flex items-start gap-6">
            <div className="relative">
              <Avatar className="h-16 w-16">
                <AvatarImage src={host.avatar} alt={host.name} />
                <AvatarFallback>{host.name[0]}</AvatarFallback>
              </Avatar>
              {host.isSuperhost && (
                <div className="absolute -bottom-1 -right-1 rounded-full bg-rose-500 p-1.5">
                  <Shield className="h-3 w-3 text-white" />
                </div>
              )}
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-semibold md:text-2xl">
                Ev sahibi: {host.name}
              </h2>
              <p className="text-sm text-muted-foreground">
                {host.joinedDate} tarihinde katıldı
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              <span>{host.reviewCount} Değerlendirme</span>
            </div>
            {host.isVerified && (
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>Kimlik doğrulandı</span>
              </div>
            )}
            {host.isSuperhost && (
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>Süper Ev Sahibi</span>
              </div>
            )}
          </div>

          {host.isSuperhost && (
            <div className="space-y-2">
              <p className="font-medium">{host.name} bir Süper Ev Sahibidir</p>
              <p className="text-sm text-muted-foreground">
                Süper Ev Sahipleri, misafirlere harika konaklamalar sunmaya
                kendini adamış deneyimli, yüksek puanlı ev sahipleridir.
              </p>
            </div>
          )}

          {host.responseRate && (
            <p className="text-sm text-muted-foreground">
              Yanıt oranı: %{host.responseRate}
            </p>
          )}
          {host.responseTime && (
            <p className="text-sm text-muted-foreground">
              Yanıt süresi: {host.responseTime}
            </p>
          )}

          <Button variant="outline" size="lg">
            Ev sahibiyle iletişime geç
          </Button>

          <div className="flex items-start gap-4 rounded-lg bg-muted/50 p-4 text-xs text-muted-foreground">
            <Shield className="h-5 w-5 shrink-0" />
            <p>
              Ödemenizi korumak için hiçbir zaman MyTrip web sitesi veya
              uygulaması dışında para transferi yapmayın veya iletişim kurmayın.
            </p>
          </div>
        </div>
      </section>

      {/* Things to Know */}
      <section className="mx-auto mt-12 max-w-7xl border-t px-4 pt-12 md:px-6">
        <div className="space-y-6">
          <h2 className="text-xl font-semibold md:text-2xl">
            Bilmeniz gerekenler
          </h2>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* House Rules */}
            <div className="space-y-4">
              <h3 className="font-medium">Ev kuralları</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-center gap-3">
                  <Clock className="h-5 w-5 shrink-0" />
                  Giriş: {rules.checkInTime} sonrası
                </li>
                <li className="flex items-center gap-3">
                  <Clock className="h-5 w-5 shrink-0" />
                  Çıkış: {rules.checkOutTime}
                </li>
                {rules.selfCheckIn && (
                  <li className="flex items-center gap-3">
                    <DoorOpen className="h-5 w-5 shrink-0" />
                    Kilit kutusuyla kendi kendine giriş
                  </li>
                )}
                {rules.maxGuests && (
                  <li className="flex items-center gap-3">
                    <Home className="h-5 w-5 shrink-0" />
                    Maksimum {rules.maxGuests} misafir
                  </li>
                )}
                {!rules.smokingAllowed && (
                  <li className="flex items-center gap-3">
                    <Ban className="h-5 w-5 shrink-0" />
                    Sigara içilmez
                  </li>
                )}
                {!rules.petsAllowed && (
                  <li className="flex items-center gap-3">
                    <Dog className="h-5 w-5 shrink-0" />
                    Evcil hayvan yok
                  </li>
                )}
                {!rules.partiesAllowed && (
                  <li className="flex items-center gap-3">
                    <PartyPopper className="h-5 w-5 shrink-0" />
                    Parti veya etkinlik yok
                  </li>
                )}
              </ul>
            </div>

            {/* Safety */}
            <div className="space-y-4">
              <h3 className="font-medium">Sağlık ve güvenlik</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                {safety.hasCarbonMonoxideAlarm && (
                  <li className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 shrink-0" />
                    Karbon monoksit alarmı
                  </li>
                )}
                {safety.hasSmokAlarm && (
                  <li className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 shrink-0" />
                    Duman alarmı
                  </li>
                )}
                {safety.hasSecurityCamera && (
                  <li className="flex items-center gap-3">
                    <Shield className="h-5 w-5 shrink-0" />
                    Mülkte güvenlik kamerası
                  </li>
                )}
              </ul>
              <button className="flex items-center gap-1 text-sm font-medium underline">
                Daha fazla göster
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* Cancellation Policy */}
            <div className="space-y-4">
              <h3 className="font-medium">İptal politikası</h3>
              <p className="text-sm text-muted-foreground">
                {cancellationPolicy}
              </p>
              <button className="flex items-center gap-1 text-sm font-medium underline">
                Daha fazla göster
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Related Collections */}
      {detail.featuredCollections && detail.featuredCollections.length > 0 && (
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
      )}

      {/* Nearby Places */}
      {detail.nearbyPlaces && detail.nearbyPlaces.length > 0 && (
        <section className="mx-auto mt-12 max-w-7xl border-t px-4 pt-12 md:px-6">
          <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
            <h2 className="text-xl font-semibold">Yakındaki öneriler</h2>
            <Link
              href="/places"
              className="text-sm font-semibold text-primary hover:text-primary/80"
            >
              Tüm konaklamaları gör
            </Link>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {detail.nearbyPlaces.map((place) => (
              <PlaceCard key={place.id} place={place} />
            ))}
          </div>
        </section>
      )}

      {/* Mobile Booking Bar */}
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
              <span className="text-muted-foreground">
                · {detail.reviewCount} değerlendirme
              </span>
            </div>
          </div>
          <Button className="bg-rose-500 hover:bg-rose-600">
            Rezervasyon yap
          </Button>
        </div>
      </div>
    </div>
  );
}
