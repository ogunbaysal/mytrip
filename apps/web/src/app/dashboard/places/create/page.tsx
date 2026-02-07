"use client";

import { useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Building2,
  ChevronLeft,
  DollarSign,
  FileText,
  Info,
  Mail,
  MapPin,
  Phone,
  Save,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TipTapEditor } from "@/components/ui/tiptap-editor";
import { CoordinateMapPicker } from "@/components/ui/coordinate-map-picker";
import { GalleryUpload } from "@/components/ui/gallery-upload";
import {
  DashboardCard,
  PageHeader,
  ProgressBar,
  SectionHeader,
} from "@/components/dashboard";
import { api } from "@/lib/api";

const DEFAULT_COORDS = { lat: 39.0, lng: 35.0 };

const FEATURE_OPTIONS = [
  { id: "wifi", label: "Wi-Fi" },
  { id: "parking", label: "Otopark" },
  { id: "pool", label: "Havuz" },
  { id: "spa", label: "Spa & Wellness" },
  { id: "restaurant", label: "Restoran" },
  { id: "bar", label: "Bar" },
  { id: "air_conditioning", label: "Klima" },
  { id: "sea_view", label: "Deniz Manzarası" },
  { id: "beach_access", label: "Plaja Erişim" },
  { id: "family_friendly", label: "Aile Dostu" },
];

type FormState = {
  name: string;
  categoryId: string;
  shortDescription: string;
  description: string;
  address: string;
  cityId: string;
  districtId: string;
  location: { lat: number; lng: number };
  contactInfo: { phone: string; email: string; website: string };
  nightlyPrice: string;
  features: string[];
  images: string[];
  businessDocumentFileId: string;
  businessDocumentUrl: string;
  businessDocumentFilename: string;
};

export default function CreatePlacePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isBusinessDocumentUploading, setIsBusinessDocumentUploading] =
    useState(false);

  const [formData, setFormData] = useState<FormState>({
    name: "",
    categoryId: "",
    shortDescription: "",
    description: "",
    address: "",
    cityId: "",
    districtId: "",
    location: DEFAULT_COORDS,
    contactInfo: { phone: "", email: "", website: "" },
    nightlyPrice: "",
    features: [],
    images: [],
    businessDocumentFileId: "",
    businessDocumentUrl: "",
    businessDocumentFilename: "",
  });

  const { data: usageData } = useQuery({
    queryKey: ["usage"],
    queryFn: () => api.subscriptions.getUsage(),
  });

  const { data: categoriesData, isLoading: isCategoriesLoading } = useQuery({
    queryKey: ["owner-place-categories"],
    queryFn: () => api.owner.places.categories(),
  });

  const { data: citiesData, isLoading: isCitiesLoading } = useQuery({
    queryKey: ["owner-place-cities"],
    queryFn: () => api.owner.places.cities(),
  });

  const { data: districtsData, isLoading: isDistrictsLoading } = useQuery({
    queryKey: ["owner-place-districts", formData.cityId],
    queryFn: () => api.owner.places.districts(formData.cityId),
    enabled: Boolean(formData.cityId),
  });

  const createPlaceMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => api.owner.places.create(payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["owner-places"] }),
        queryClient.invalidateQueries({ queryKey: ["usage"] }),
      ]);
      router.push("/dashboard/places");
    },
    onError: (error: Error) => {
      alert(error.message || "Mekan oluşturulamadı");
    },
  });

  const categories = categoriesData?.categories ?? [];
  const cities = citiesData?.cities ?? [];
  const districts = districtsData?.districts ?? [];

  const usage = usageData?.usage;
  const placesUsed = usage?.places.current || 0;
  const placesMax = usage?.places.max || 1;
  const canAddPlace = placesUsed < placesMax;
  const usagePercentage = Math.round((placesUsed / placesMax) * 100);

  const selectedCityName = useMemo(
    () => cities.find((city) => city.id === formData.cityId)?.name || "",
    [cities, formData.cityId],
  );

  const selectedDistrictName = useMemo(
    () =>
      districts.find((district) => district.id === formData.districtId)?.name ||
      "",
    [districts, formData.districtId],
  );

  const toggleFeature = (featureId: string) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.includes(featureId)
        ? prev.features.filter((item) => item !== featureId)
        : [...prev.features, featureId],
    }));
  };

  const handleBusinessDocumentUpload = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    try {
      setIsBusinessDocumentUploading(true);
      const response = await api.owner.upload.single(
        selectedFile,
        "business_document",
      );
      setFormData((prev) => ({
        ...prev,
        businessDocumentFileId: response.fileId,
        businessDocumentUrl: response.url,
        businessDocumentFilename: selectedFile.name,
      }));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Belge yüklenemedi";
      alert(message);
    } finally {
      setIsBusinessDocumentUploading(false);
      event.target.value = "";
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!formData.name.trim()) {
      alert("Mekan adı zorunludur");
      return;
    }

    if (!formData.categoryId) {
      alert("Kategori seçimi zorunludur");
      return;
    }

    if (!formData.address.trim()) {
      alert("Adres zorunludur");
      return;
    }

    if (!formData.cityId || !formData.districtId) {
      alert("İl ve ilçe seçimi zorunludur");
      return;
    }

    if (!Number.isFinite(formData.location.lat) || !Number.isFinite(formData.location.lng)) {
      alert("Harita üzerinden geçerli konum seçin");
      return;
    }

    if (formData.images.length === 0) {
      alert("En az bir görsel yüklemelisiniz");
      return;
    }

    if (!formData.businessDocumentFileId) {
      alert("İşletme belgesi PDF yüklemek zorunludur");
      return;
    }

    const parsedNightlyPrice =
      formData.nightlyPrice.trim().length > 0
        ? Number(formData.nightlyPrice.replace(",", "."))
        : undefined;

    if (
      parsedNightlyPrice !== undefined &&
      (!Number.isFinite(parsedNightlyPrice) || parsedNightlyPrice < 0)
    ) {
      alert("Gecelik fiyat geçersiz");
      return;
    }

    const payload = {
      name: formData.name.trim(),
      categoryId: formData.categoryId,
      shortDescription: formData.shortDescription.trim() || undefined,
      description: formData.description.trim() || undefined,
      address: formData.address.trim(),
      cityId: formData.cityId,
      districtId: formData.districtId,
      city: selectedCityName,
      district: selectedDistrictName,
      location: {
        lat: Number(formData.location.lat.toFixed(6)),
        lng: Number(formData.location.lng.toFixed(6)),
      },
      contactInfo:
        formData.contactInfo.phone ||
        formData.contactInfo.email ||
        formData.contactInfo.website
          ? {
              phone: formData.contactInfo.phone.trim() || undefined,
              email: formData.contactInfo.email.trim() || undefined,
              website: formData.contactInfo.website.trim() || undefined,
            }
          : undefined,
      nightlyPrice: parsedNightlyPrice,
      features: formData.features,
      images: formData.images,
      businessDocumentFileId: formData.businessDocumentFileId,
    };

    createPlaceMutation.mutate(payload);
  };

  if (!canAddPlace) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Yeni Mekan Ekle"
          icon={<Building2 className="size-5" />}
          breadcrumbs={[
            { label: "Mekanlar", href: "/dashboard/places" },
            { label: "Yeni Mekan" },
          ]}
        />

        <DashboardCard padding="lg">
          <div className="text-center">
            <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-500">
              <AlertTriangle className="size-8" />
            </div>
            <h2 className="mb-2 text-xl font-bold text-foreground">
              Mekan Limiti Aşıldı
            </h2>
            <p className="mb-6 text-muted-foreground">
              {placesUsed} / {placesMax} mekan limitinize ulaştınız.
            </p>
            <Button onClick={() => router.push("/pricing")}>Planı Yükselt</Button>
          </div>
        </DashboardCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Yeni Mekan Ekle"
        description="Mekan bilgilerini doldurun ve onaya gönderin"
        icon={<Building2 className="size-5" />}
        breadcrumbs={[
          { label: "Mekanlar", href: "/dashboard/places" },
          { label: "Yeni Mekan" },
        ]}
        actions={
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/places")}
            className="gap-2"
          >
            <ChevronLeft className="size-4" />
            Geri
          </Button>
        }
      />

      <DashboardCard padding="md">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="font-semibold text-foreground">Kullanım Durumu</h3>
            <p className="text-sm text-muted-foreground">
              {placesUsed} / {placesMax} mekan kullanılıyor
            </p>
          </div>
          <div className="w-full md:w-64">
            <ProgressBar value={usagePercentage} showLabel label={`${usagePercentage}%`} />
          </div>
        </div>
      </DashboardCard>

      <form onSubmit={handleSubmit} className="space-y-6">
        <DashboardCard padding="md">
          <SectionHeader
            title="Mekan Görselleri"
            subtitle="Görsel ekleyin ve sıralayın. İlk görsel ana görsel olur."
            icon={<Info className="size-5" />}
            size="sm"
            className="mb-6"
          />

          <GalleryUpload
            value={formData.images}
            onChange={(images) => setFormData((prev) => ({ ...prev, images }))}
            disabled={createPlaceMutation.isPending}
          />
        </DashboardCard>

        <DashboardCard padding="md">
          <SectionHeader
            title="Temel Bilgiler"
            subtitle="Mekan adı, kategori ve açıklama"
            icon={<Info className="size-5" />}
            size="sm"
            className="mb-6"
          />

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Mekan Adı *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, name: event.target.value }))
                }
                placeholder="Örn: Aegean Ula Boat Tours"
              />
            </div>

            <div className="space-y-2">
              <Label>Kategori *</Label>
              <Select
                value={formData.categoryId || undefined}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, categoryId: value }))
                }
                disabled={isCategoriesLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Kategori seçin" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="shortDescription">Kısa Açıklama</Label>
              <Input
                id="shortDescription"
                value={formData.shortDescription}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    shortDescription: event.target.value,
                  }))
                }
                placeholder="Listelerde görünecek kısa özet"
                maxLength={500}
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label>Detaylı Açıklama</Label>
              <TipTapEditor
                content={formData.description}
                onChange={(description: string) =>
                  setFormData((prev) => ({ ...prev, description }))
                }
              />
            </div>
          </div>
        </DashboardCard>

        <DashboardCard padding="md">
          <SectionHeader
            title="Konum Bilgileri"
            subtitle="İl ve ilçe seçin, haritadan pin bırakın"
            icon={<MapPin className="size-5" />}
            size="sm"
            className="mb-6"
          />

          <div className="grid gap-6 md:grid-cols-2">
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="address">Açık Adres *</Label>
              <textarea
                id="address"
                value={formData.address}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, address: event.target.value }))
                }
                className="flex min-h-[90px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Tam adres"
              />
            </div>

            <div className="space-y-2">
              <Label>Şehir *</Label>
              <Select
                value={formData.cityId || undefined}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    cityId: value,
                    districtId: "",
                  }))
                }
                disabled={isCitiesLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Şehir seçin" />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((city) => (
                    <SelectItem key={city.id} value={city.id}>
                      {city.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>İlçe *</Label>
              <Select
                value={formData.districtId || undefined}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, districtId: value }))
                }
                disabled={!formData.cityId || isDistrictsLoading}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={formData.cityId ? "İlçe seçin" : "Önce şehir seçin"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {districts.map((district) => (
                    <SelectItem key={district.id} value={district.id}>
                      {district.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="md:col-span-2 space-y-3">
              <p className="text-sm text-muted-foreground">
                Haritada konuma tıklayın veya pini sürükleyin.
              </p>
              <CoordinateMapPicker
                latitude={formData.location.lat}
                longitude={formData.location.lng}
                onChange={(coords) =>
                  setFormData((prev) => ({ ...prev, location: coords }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Enlem</Label>
              <Input value={String(formData.location.lat)} readOnly />
            </div>

            <div className="space-y-2">
              <Label>Boylam</Label>
              <Input value={String(formData.location.lng)} readOnly />
            </div>
          </div>
        </DashboardCard>

        <DashboardCard padding="md">
          <SectionHeader
            title="İletişim Bilgileri"
            subtitle="Opsiyonel"
            icon={<Phone className="size-5" />}
            size="sm"
            className="mb-6"
          />

          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                value={formData.contactInfo.phone}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    contactInfo: { ...prev.contactInfo, phone: event.target.value },
                  }))
                }
                placeholder="+90 5xx xxx xx xx"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-posta</Label>
              <Input
                id="email"
                type="email"
                value={formData.contactInfo.email}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    contactInfo: { ...prev.contactInfo, email: event.target.value },
                  }))
                }
                placeholder="info@ornek.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Web Sitesi</Label>
              <Input
                id="website"
                type="url"
                value={formData.contactInfo.website}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    contactInfo: {
                      ...prev.contactInfo,
                      website: event.target.value,
                    },
                  }))
                }
                placeholder="https://"
              />
            </div>
          </div>
        </DashboardCard>

        <DashboardCard padding="md">
          <SectionHeader
            title="Fiyatlandırma"
            subtitle="Fiyat seviyesi API tarafından otomatik hesaplanır"
            icon={<DollarSign className="size-5" />}
            size="sm"
            className="mb-6"
          />

          <div className="space-y-2">
            <Label htmlFor="nightlyPrice">Gecelik Fiyat (₺)</Label>
            <Input
              id="nightlyPrice"
              type="number"
              min="0"
              step="0.01"
              value={formData.nightlyPrice}
              onChange={(event) =>
                setFormData((prev) => ({
                  ...prev,
                  nightlyPrice: event.target.value,
                }))
              }
              placeholder="Örn: 3500"
            />
          </div>
        </DashboardCard>

        <DashboardCard padding="md">
          <SectionHeader
            title="Özellikler"
            subtitle="Mekana ait öne çıkan özellikleri işaretleyin"
            icon={<Info className="size-5" />}
            size="sm"
            className="mb-6"
          />

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURE_OPTIONS.map((feature) => {
              const checked = formData.features.includes(feature.id);
              return (
                <label
                  key={feature.id}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border p-3"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleFeature(feature.id)}
                    className="h-4 w-4"
                  />
                  <span className="text-sm">{feature.label}</span>
                </label>
              );
            })}
          </div>
        </DashboardCard>

        <DashboardCard padding="md">
          <SectionHeader
            title="İşletme Belgesi (PDF)"
            subtitle="Doğrulama için zorunlu"
            icon={<FileText className="size-5" />}
            size="sm"
            className="mb-6"
          />

          <div className="space-y-4">
            {formData.businessDocumentFileId ? (
              <div className="rounded-lg border p-3">
                <div className="text-sm font-medium">
                  {formData.businessDocumentFilename || "Yüklenen belge"}
                </div>
                {formData.businessDocumentUrl && (
                  <a
                    href={formData.businessDocumentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-primary underline"
                  >
                    Belgeyi görüntüle
                  </a>
                )}
              </div>
            ) : null}

            <label className="inline-flex">
              <Input
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handleBusinessDocumentUpload}
                disabled={isBusinessDocumentUploading || createPlaceMutation.isPending}
              />
              <Button
                type="button"
                variant="outline"
                disabled={isBusinessDocumentUploading || createPlaceMutation.isPending}
                asChild
              >
                <span>
                  <Upload className="mr-2 size-4" />
                  {isBusinessDocumentUploading
                    ? "Belge Yükleniyor..."
                    : "PDF Belge Yükle / Değiştir"}
                </span>
              </Button>
            </label>
          </div>
        </DashboardCard>

        <div className="flex items-center justify-between rounded-xl border border-border bg-white p-4 shadow-sm">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push("/dashboard/places")}
          >
            İptal
          </Button>

          <Button
            type="submit"
            disabled={createPlaceMutation.isPending || isBusinessDocumentUploading}
            className="min-w-[170px] gap-2"
          >
            {createPlaceMutation.isPending ? (
              <>
                <span className="inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Gönderiliyor...
              </>
            ) : (
              <>
                <Save className="size-4" />
                Mekanı Onaya Gönder
              </>
            )}
          </Button>
        </div>

        <DashboardCard padding="md">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500">
              <Mail className="size-5" />
            </div>
            <div>
              <h4 className="mb-1 font-semibold text-foreground">Onay Süreci</h4>
              <p className="text-sm text-muted-foreground">
                Mekanınız ve işletme belgeniz yöneticiler tarafından incelenir.
                Onaylandığında yayınlanır.
              </p>
            </div>
          </div>
        </DashboardCard>
      </form>
    </div>
  );
}
