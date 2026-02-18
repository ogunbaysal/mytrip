"use client";

import { FileText, Images, Info, MapPin, Wallet } from "lucide-react";

import { DashboardCard, SectionHeader } from "@/components/dashboard";
import {
  PLACE_FEATURE_OPTIONS,
} from "@/components/dashboard/places/place-kind-module-renderer";
import type { PlaceContactInfoValue } from "@/components/dashboard/places/place-contact-section";
import { getPlaceKindLabel } from "@/lib/place-kind";

type PlaceCreatePreviewProps = {
  kindId: string;
  kindName?: string | null;
  name: string;
  shortDescription: string;
  description: string;
  address: string;
  cityName: string;
  districtName: string;
  location: { lat: number; lng: number };
  contactInfo: PlaceContactInfoValue;
  nightlyPrice: string;
  features: string[];
  images: string[];
  businessDocumentFileId: string;
  businessDocumentFilename: string;
  businessDocumentUrl: string;
  supportsRooms?: boolean;
  supportsMenu?: boolean;
  supportsPackages?: boolean;
  typeModuleHighlights?: string[];
};

const stripHtml = (value: string) =>
  value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();

export function PlaceCreatePreview({
  kindId,
  kindName,
  name,
  shortDescription,
  description,
  address,
  cityName,
  districtName,
  location,
  contactInfo,
  nightlyPrice,
  features,
  images,
  businessDocumentFileId,
  businessDocumentFilename,
  businessDocumentUrl,
  supportsRooms,
  supportsMenu,
  supportsPackages,
  typeModuleHighlights,
}: PlaceCreatePreviewProps) {
  const resolvedKindLabel = getPlaceKindLabel(kindName || kindId);
  const selectedFeatureLabels = PLACE_FEATURE_OPTIONS.filter((option) =>
    features.includes(option.id),
  ).map((option) => option.label);
  const resolvedDescription = stripHtml(description);

  return (
    <div className="space-y-6">
      <DashboardCard padding="md">
        <SectionHeader
          title="Temel Ozet"
          subtitle="Gonderim oncesi temel bilgileri kontrol edin"
          icon={<Info className="size-5" />}
          size="sm"
          className="mb-6"
        />

        <div className="grid gap-3 text-sm md:grid-cols-2">
          <div className="rounded-lg border p-3">
            <div className="text-muted-foreground">Yer Turu</div>
            <div className="font-medium">{resolvedKindLabel}</div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="text-muted-foreground">Mekan Adi</div>
            <div className="font-medium">{name || "-"}</div>
          </div>
          <div className="rounded-lg border p-3 md:col-span-2">
            <div className="text-muted-foreground">Kisa Aciklama</div>
            <div className="font-medium">{shortDescription || "-"}</div>
          </div>
          <div className="rounded-lg border p-3 md:col-span-2">
            <div className="text-muted-foreground">Detayli Aciklama</div>
            <div className="font-medium">{resolvedDescription || "-"}</div>
          </div>
        </div>
      </DashboardCard>

      <DashboardCard padding="md">
        <SectionHeader
          title="Konum Ozeti"
          subtitle="Adres ve koordinatlar"
          icon={<MapPin className="size-5" />}
          size="sm"
          className="mb-6"
        />

        <div className="grid gap-3 text-sm md:grid-cols-2">
          <div className="rounded-lg border p-3 md:col-span-2">
            <div className="text-muted-foreground">Adres</div>
            <div className="font-medium">{address || "-"}</div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="text-muted-foreground">Sehir</div>
            <div className="font-medium">{cityName || "-"}</div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="text-muted-foreground">Ilce</div>
            <div className="font-medium">{districtName || "-"}</div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="text-muted-foreground">Enlem</div>
            <div className="font-medium">{location.lat.toFixed(6)}</div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="text-muted-foreground">Boylam</div>
            <div className="font-medium">{location.lng.toFixed(6)}</div>
          </div>
        </div>
      </DashboardCard>

      <DashboardCard padding="md">
        <SectionHeader
          title="Tur Detaylari"
          subtitle="Fiyatlama, moduller ve medya"
          icon={<Wallet className="size-5" />}
          size="sm"
          className="mb-6"
        />

        <div className="grid gap-3 text-sm md:grid-cols-2">
          <div className="rounded-lg border p-3">
            <div className="text-muted-foreground">Gecelik Fiyat</div>
            <div className="font-medium">{nightlyPrice.trim() ? `${nightlyPrice} TRY` : "-"}</div>
          </div>
          <div className="rounded-lg border p-3">
            <div className="text-muted-foreground">Secili Ozellik</div>
            <div className="font-medium">{selectedFeatureLabels.length}</div>
          </div>
          <div className="rounded-lg border p-3 md:col-span-2">
            <div className="text-muted-foreground">Aktif Moduller</div>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${supportsRooms ? "bg-emerald-50 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
                Oda
              </span>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${supportsMenu ? "bg-emerald-50 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
                Menu
              </span>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${supportsPackages ? "bg-emerald-50 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
                Paket
              </span>
            </div>
          </div>
          {typeModuleHighlights && typeModuleHighlights.length > 0 ? (
            <div className="rounded-lg border p-3 md:col-span-2">
              <div className="text-muted-foreground">Tur Ozel Ozet</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {typeModuleHighlights.map((item, index) => (
                  <span
                    key={`${item}-${index}`}
                    className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
          <div className="rounded-lg border p-3 md:col-span-2">
            <div className="text-muted-foreground">Iletisim</div>
            <div className="mt-1 font-medium">
              {contactInfo.phone || contactInfo.email || contactInfo.website
                ? [contactInfo.phone, contactInfo.email, contactInfo.website]
                    .filter(Boolean)
                    .join(" • ")
                : "-"}
            </div>
          </div>
          <div className="rounded-lg border p-3 md:col-span-2">
            <div className="mb-2 flex items-center gap-2 text-muted-foreground">
              <Images className="size-4" />
              Gorseller ({images.length})
            </div>
            {images.length > 0 ? (
              <div className="grid grid-cols-3 gap-2 md:grid-cols-6">
                {images.slice(0, 6).map((url, index) => (
                  <div key={`${url}-${index}`} className="aspect-square overflow-hidden rounded-md border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Mekan gorseli ${index + 1}`} className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="font-medium">-</div>
            )}
          </div>
          <div className="rounded-lg border p-3 md:col-span-2">
            <div className="mb-1 flex items-center gap-2 text-muted-foreground">
              <FileText className="size-4" />
              Isletme Belgesi
            </div>
            <div className="font-medium">{businessDocumentFileId ? (businessDocumentFilename || "Yuklenen belge") : "-"}</div>
            {businessDocumentFileId && businessDocumentUrl ? (
              <a
                href={businessDocumentUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-1 inline-block text-primary underline"
              >
                Belgeyi goruntule
              </a>
            ) : null}
          </div>
        </div>
      </DashboardCard>
    </div>
  );
}
