"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Save,
  MapPin,
  Upload,
  AlertTriangle,
  Building2,
  Phone,
  Globe,
  Mail,
  DollarSign,
  ImageIcon,
  Info,
  ChevronLeft,
  Eye,
  Clock,
  Wifi,
  Car,
  Wind,
  Waves,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  PageHeader,
  DashboardCard,
  ProgressBar,
  SectionHeader,
  StatusBadge,
} from "@/components/dashboard";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

const PLACE_TYPES = [
  { value: "hotel", label: "Otel/Pansiyon" },
  { value: "villa", label: "Villa" },
  { value: "restaurant", label: "Restoran" },
  { value: "cafe", label: "Kafe" },
  { value: "activity", label: "Aktivite/Tur" },
  { value: "attraction", label: "Gezi Yeri" },
];

const PRICE_LEVELS = [
  { value: "", label: "Seçiniz" },
  { value: "budget", label: "Ekonomik" },
  { value: "moderate", label: "Orta" },
  { value: "expensive", label: "Lüks" },
  { value: "luxury", label: "Ultra Lüks" },
];

const FEATURES = [
  { id: "wifi", label: "Ücretsiz WiFi", icon: Wifi },
  { id: "parking", label: "Ücretsiz Otopark", icon: Car },
  { id: "pool", label: "Yüzme Havuzu", icon: Waves },
  { id: "ac", label: "Klima", icon: Wind },
  { id: "spa", label: "SPA", icon: Sparkles },
  { id: "24h", label: "24 Saat Resepsiyon", icon: Clock },
];

export default function EditPlacePage() {
  const router = useRouter();
  const params = useParams();
  const placeId = params.id as string;
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: "",
    type: "hotel" as string,
    categoryId: "",
    category: "",
    description: "",
    shortDescription: "",
    address: "",
    city: "",
    district: "",
    location: { lat: 0, lng: 0 },
    contactInfo: { phone: "", email: "", website: "" },
    priceLevel: "" as string,
    nightlyPrice: 0,
    features: [] as string[],
    images: [] as string[],
    openingHours: {},
    checkInInfo: "",
    checkOutInfo: "",
  });

  const [imageUrl, setImageUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const { data: placeData, isLoading } = useQuery({
    queryKey: ["owner-place-detail", placeId],
    queryFn: () => api.owner.places.getById(placeId),
    enabled: !!placeId,
  });

  const place = placeData?.place;

  useEffect(() => {
    if (place) {
      const parseJSON = (val: any, fallback: any) => {
        if (!val) return fallback;
        if (typeof val === "string") {
          try {
            return JSON.parse(val);
          } catch {
            return fallback;
          }
        }
        return val;
      };

      setFormData({
        name: place.name || "",
        type: place.type || "hotel",
        categoryId: place.categoryId || "",
        category: place.category || "",
        description: place.description || "",
        shortDescription: place.shortDescription || "",
        address: place.address || "",
        city: place.city || "",
        district: place.district || "",
        location: parseJSON(place.location, { lat: 0, lng: 0 }),
        contactInfo: parseJSON(place.contactInfo, {
          phone: "",
          email: "",
          website: "",
        }),
        priceLevel: place.priceLevel || "",
        nightlyPrice: parseFloat(place.nightlyPrice || "0"),
        features: parseJSON(place.features, []),
        images: parseJSON(place.images, []),
        openingHours: parseJSON(place.openingHours, {}),
        checkInInfo: place.checkInInfo || "",
        checkOutInfo: place.checkOutInfo || "",
      });
    }
  }, [place]);

  const updatePlaceMutation = useMutation({
    mutationFn: (data: typeof formData) =>
      api.owner.places.update(placeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["owner-place-detail", placeId],
      });
      queryClient.invalidateQueries({ queryKey: ["owner-places"] });
      router.push("/dashboard/places");
    },
    onError: (error: Error) => {
      console.error("Update place error:", error);
      setIsSubmitting(false);
      alert(error.message || "Güncelleme başarısız oldu");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!hasChanges) {
      alert("Değişiklik bulunamadı");
      return;
    }

    setIsSubmitting(true);
    updatePlaceMutation.mutate(formData);
  };

  const handleChange = (field: keyof typeof formData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleAddImage = () => {
    if (imageUrl.trim()) {
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, imageUrl.trim()],
      }));
      setImageUrl("");
      setHasChanges(true);
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
    setHasChanges(true);
  };

  const toggleFeature = (feature: string) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter((f) => f !== feature)
        : [...prev.features, feature],
    }));
    setHasChanges(true);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Mekan yükleniyor...</p>
        </div>
      </div>
    );
  }

  // Not found state
  if (!place) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Mekan Düzenle"
          icon={<Building2 className="size-5" />}
          breadcrumbs={[
            { label: "Mekanlar", href: "/dashboard/places" },
            { label: "Düzenle" },
          ]}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mx-auto max-w-lg"
        >
          <DashboardCard padding="lg">
            <div className="text-center">
              <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-red-50 text-red-500">
                <AlertTriangle className="size-8" />
              </div>
              <h2 className="mb-2 text-xl font-bold text-foreground">
                Mekan Bulunamadı
              </h2>
              <p className="mb-6 text-muted-foreground">
                Aradığınız mekan bulunamadı veya silinmiş olabilir.
              </p>
              <Button onClick={() => router.push("/dashboard/places")}>
                Mekanlara Dön
              </Button>
            </div>
          </DashboardCard>
        </motion.div>
      </div>
    );
  }

  const statusMessages: Record<
    string,
    { title: string; description: string; type: "warning" | "info" | "error" }
  > = {
    pending: {
      title: "Mekanınız inceleniyor",
      description:
        "Yöneticiler tarafından inceleniyor. Onaylandıktan sonra halka açılacak.",
      type: "warning",
    },
    active: {
      title: "Mekan yayında",
      description:
        "Değişiklik yapıldığında mekan tekrar inceleme durumuna geçecek.",
      type: "info",
    },
    rejected: {
      title: "Mekan reddedildi",
      description:
        "Lütfen gerekli değişiklikleri yapıp tekrar inceleme için gönderin.",
      type: "error",
    },
    inactive: {
      title: "Mekan pasif",
      description: "Mekanınız şu anda pasif durumda.",
      type: "warning",
    },
    suspended: {
      title: "Mekan askıya alındı",
      description: "Mekanınız askıya alındı. Destek ile iletişime geçin.",
      type: "error",
    },
  };

  const statusMessage = statusMessages[place.status];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title={place.name}
        description="Mekan bilgilerini güncelleyin"
        icon={<Building2 className="size-5" />}
        breadcrumbs={[
          { label: "Mekanlar", href: "/dashboard/places" },
          { label: "Düzenle" },
        ]}
        actions={
          <div className="flex items-center gap-3">
            <StatusBadge status={place.status} size="md" />
            <Link href={`/places/${place.slug}`} target="_blank">
              <Button variant="outline" size="sm" className="gap-2">
                <Eye className="size-4" />
                Görüntüle
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard/places")}
              className="gap-2"
            >
              <ChevronLeft className="size-4" />
              Geri
            </Button>
          </div>
        }
      />

      {/* Status Banner */}
      {statusMessage && (
        <DashboardCard padding="md">
          <div
            className={cn(
              "flex items-start gap-3 rounded-xl p-4",
              statusMessage.type === "warning" && "bg-amber-50",
              statusMessage.type === "info" && "bg-blue-50",
              statusMessage.type === "error" && "bg-red-50",
            )}
          >
            <AlertTriangle
              className={cn(
                "mt-0.5 size-5 shrink-0",
                statusMessage.type === "warning" && "text-amber-600",
                statusMessage.type === "info" && "text-blue-600",
                statusMessage.type === "error" && "text-red-600",
              )}
            />
            <div>
              <h4
                className={cn(
                  "font-semibold",
                  statusMessage.type === "warning" && "text-amber-800",
                  statusMessage.type === "info" && "text-blue-800",
                  statusMessage.type === "error" && "text-red-800",
                )}
              >
                {statusMessage.title}
              </h4>
              <p
                className={cn(
                  "text-sm",
                  statusMessage.type === "warning" && "text-amber-700",
                  statusMessage.type === "info" && "text-blue-700",
                  statusMessage.type === "error" && "text-red-700",
                )}
              >
                {statusMessage.description}
              </p>
            </div>
          </div>
        </DashboardCard>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <DashboardCard padding="md">
          <SectionHeader
            title="Temel Bilgiler"
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
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Örn: Sunset Hotel"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Mekan Tipi *</Label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) => handleChange("type", e.target.value)}
                className="flex h-10 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm transition-colors hover:border-primary/50 focus:border-primary focus:outline-none"
                required
              >
                {PLACE_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Kategori *</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => handleChange("category", e.target.value)}
                placeholder="Örn: Lüks, Butik, Aile"
                required
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="shortDescription">Kısa Açıklama *</Label>
              <textarea
                id="shortDescription"
                value={formData.shortDescription}
                onChange={(e) =>
                  handleChange("shortDescription", e.target.value)
                }
                placeholder="Mekanı 1-2 cümleyle özetleyin..."
                className="flex min-h-[80px] w-full rounded-lg border border-border bg-white px-3 py-2 text-sm transition-colors hover:border-primary/50 focus:border-primary focus:outline-none resize-none"
                maxLength={500}
                required
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="description">Detaylı Açıklama</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Mekanın detaylı açıklaması..."
                className="flex min-h-[150px] w-full rounded-lg border border-border bg-white px-3 py-2 text-sm transition-colors hover:border-primary/50 focus:border-primary focus:outline-none resize-none"
              />
            </div>
          </div>
        </DashboardCard>

        {/* Location Information */}
        <DashboardCard padding="md">
          <SectionHeader
            title="Konum Bilgileri"
            icon={<MapPin className="size-5" />}
            size="sm"
            className="mb-6"
          />

          <div className="grid gap-6 md:grid-cols-2">
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="address">Adres *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleChange("address", e.target.value)}
                placeholder="Mahalle, Sokak No, İlçe, Şehir"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="city">Şehir *</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleChange("city", e.target.value)}
                placeholder="Örn: Muğla"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="district">İlçe</Label>
              <Input
                id="district"
                value={formData.district}
                onChange={(e) => handleChange("district", e.target.value)}
                placeholder="Örn: Bodrum"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lat">Enlem</Label>
              <Input
                id="lat"
                type="number"
                step="any"
                value={formData.location.lat || ""}
                onChange={(e) =>
                  handleChange("location", {
                    ...formData.location,
                    lat: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="37.0344"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lng">Boylam</Label>
              <Input
                id="lng"
                type="number"
                step="any"
                value={formData.location.lng || ""}
                onChange={(e) =>
                  handleChange("location", {
                    ...formData.location,
                    lng: parseFloat(e.target.value) || 0,
                  })
                }
                placeholder="27.4305"
              />
            </div>
          </div>
        </DashboardCard>

        {/* Contact Information */}
        <DashboardCard padding="md">
          <SectionHeader
            title="İletişim Bilgileri"
            icon={<Phone className="size-5" />}
            size="sm"
            className="mb-6"
          />

          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefon</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="phone"
                  type="tel"
                  value={formData.contactInfo.phone}
                  onChange={(e) =>
                    handleChange("contactInfo", {
                      ...formData.contactInfo,
                      phone: e.target.value,
                    })
                  }
                  placeholder="+90 555 123 4567"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-posta</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={formData.contactInfo.email}
                  onChange={(e) =>
                    handleChange("contactInfo", {
                      ...formData.contactInfo,
                      email: e.target.value,
                    })
                  }
                  placeholder="iletisim@mekan.com"
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="website"
                  type="url"
                  value={formData.contactInfo.website}
                  onChange={(e) =>
                    handleChange("contactInfo", {
                      ...formData.contactInfo,
                      website: e.target.value,
                    })
                  }
                  placeholder="https://"
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </DashboardCard>

        {/* Pricing */}
        <DashboardCard padding="md">
          <SectionHeader
            title="Fiyatlandırma"
            icon={<DollarSign className="size-5" />}
            size="sm"
            className="mb-6"
          />

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="priceLevel">Fiyat Seviyesi</Label>
              <select
                id="priceLevel"
                value={formData.priceLevel}
                onChange={(e) => handleChange("priceLevel", e.target.value)}
                className="flex h-10 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm transition-colors hover:border-primary/50 focus:border-primary focus:outline-none"
              >
                {PRICE_LEVELS.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nightlyPrice">Gecelik Fiyat (₺)</Label>
              <Input
                id="nightlyPrice"
                type="number"
                step="0.01"
                min="0"
                value={formData.nightlyPrice || ""}
                onChange={(e) =>
                  handleChange("nightlyPrice", parseFloat(e.target.value) || 0)
                }
                placeholder="Örn: 2500"
              />
            </div>
          </div>
        </DashboardCard>

        {/* Features */}
        <DashboardCard padding="md">
          <SectionHeader
            title="Özellikler"
            icon={<CheckCircle2 className="size-5" />}
            size="sm"
            className="mb-6"
          />

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              const isSelected = formData.features.includes(feature.label);
              return (
                <button
                  key={feature.id}
                  type="button"
                  onClick={() => toggleFeature(feature.label)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl border p-3 text-left transition-all",
                    isSelected
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border hover:border-primary/50",
                  )}
                >
                  <div
                    className={cn(
                      "flex size-9 items-center justify-center rounded-lg",
                      isSelected ? "bg-primary text-white" : "bg-slate-100",
                    )}
                  >
                    <Icon className="size-4" />
                  </div>
                  <span className="text-sm font-medium">{feature.label}</span>
                </button>
              );
            })}
          </div>
        </DashboardCard>

        {/* Photos */}
        <DashboardCard padding="md">
          <SectionHeader
            title="Fotoğraflar"
            icon={<ImageIcon className="size-5" />}
            size="sm"
            className="mb-6"
          />

          {/* Add Image URL */}
          <div className="mb-4 flex gap-2">
            <Input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Fotoğraf URL'si girin..."
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleAddImage}
              disabled={!imageUrl.trim()}
            >
              <Upload className="mr-2 size-4" />
              Ekle
            </Button>
          </div>

          {/* Image Grid */}
          {formData.images.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {formData.images.map((img, index) => (
                <div
                  key={index}
                  className="group relative aspect-video overflow-hidden rounded-lg bg-slate-100"
                >
                  <img
                    src={img}
                    alt={`Fotoğraf ${index + 1}`}
                    className="size-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    ×
                  </button>
                  {index === 0 && (
                    <span className="absolute bottom-2 left-2 rounded-full bg-black/70 px-2 py-0.5 text-xs text-white">
                      Kapak
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-slate-50 py-12">
              <ImageIcon className="mb-3 size-12 text-slate-300" />
              <p className="text-sm text-muted-foreground">
                Henüz fotoğraf eklenmedi
              </p>
            </div>
          )}
        </DashboardCard>

        {/* Check-in/out Info */}
        <DashboardCard padding="md">
          <SectionHeader
            title="Giriş/Çıkış Bilgileri"
            icon={<Clock className="size-5" />}
            size="sm"
            className="mb-6"
          />

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="checkInInfo">Check-in Bilgisi</Label>
              <textarea
                id="checkInInfo"
                value={formData.checkInInfo}
                onChange={(e) => handleChange("checkInInfo", e.target.value)}
                placeholder="Örn: 14:00 sonrası giriş yapılabilir"
                className="flex min-h-[80px] w-full rounded-lg border border-border bg-white px-3 py-2 text-sm transition-colors hover:border-primary/50 focus:border-primary focus:outline-none resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="checkOutInfo">Check-out Bilgisi</Label>
              <textarea
                id="checkOutInfo"
                value={formData.checkOutInfo}
                onChange={(e) => handleChange("checkOutInfo", e.target.value)}
                placeholder="Örn: 11:00 öncesi çıkış yapılmalı"
                className="flex min-h-[80px] w-full rounded-lg border border-border bg-white px-3 py-2 text-sm transition-colors hover:border-primary/50 focus:border-primary focus:outline-none resize-none"
              />
            </div>
          </div>
        </DashboardCard>

        {/* Submit Actions */}
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
            disabled={isSubmitting || !hasChanges}
            className="min-w-[180px] gap-2"
          >
            {isSubmitting ? (
              <>
                <span className="inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Kaydediliyor...
              </>
            ) : (
              <>
                <Save className="size-4" />
                Değişiklikleri Kaydet
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
