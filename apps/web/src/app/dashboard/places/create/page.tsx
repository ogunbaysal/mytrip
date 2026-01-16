"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Save,
  Upload,
  MapPin,
  CheckCircle,
  AlertTriangle,
  Building2,
  Phone,
  Globe,
  Mail,
  DollarSign,
  ImageIcon,
  Info,
  ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  PageHeader,
  DashboardCard,
  ProgressBar,
  SectionHeader,
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

export default function CreatePlacePage() {
  const router = useRouter();
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

  const { data: usageData } = useQuery({
    queryKey: ["usage"],
    queryFn: () => api.subscriptions.getUsage(),
  });

  const createPlaceMutation = useMutation({
    mutationFn: (data: typeof formData) => api.owner.places.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-places"] });
      queryClient.invalidateQueries({ queryKey: ["usage"] });
      router.push("/dashboard/places");
    },
    onError: (error: Error) => {
      console.error("Create place error:", error);
      setIsSubmitting(false);
      alert(error.message || "Mekan oluşturulamadı");
    },
  });

  const usage = usageData?.usage;
  const placesUsed = usage?.places.current || 0;
  const placesMax = usage?.places.max || 1;
  const canAddPlace = placesUsed < placesMax;
  const usagePercentage = Math.round((placesUsed / placesMax) * 100);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      alert("Mekan adı gereklidir");
      return;
    }

    if (formData.images.length === 0) {
      alert("En az bir fotoğraf eklemelisiniz");
      return;
    }

    setIsSubmitting(true);
    createPlaceMutation.mutate(formData);
  };

  const handleChange = (field: keyof typeof formData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddImage = () => {
    if (imageUrl.trim()) {
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, imageUrl.trim()],
      }));
      setImageUrl("");
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  // Limit exceeded state
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

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mx-auto max-w-lg"
        >
          <DashboardCard padding="lg">
            <div className="text-center">
              <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-500">
                <AlertTriangle className="size-8" />
              </div>
              <h2 className="mb-2 text-xl font-bold text-foreground">
                Mekan Limiti Aşıldı
              </h2>
              <p className="mb-6 text-muted-foreground">
                {placesUsed} / {placesMax} mekan limitinize ulaştınız. Daha
                fazla mekan eklemek için abonelik planınızı yükseltin.
              </p>
              <Button
                onClick={() => (window.location.href = "/pricing")}
                className="gap-2"
              >
                Planı Yükselt
              </Button>
            </div>
          </DashboardCard>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Yeni Mekan Ekle"
        description="Mekan bilgilerini doldurun ve onay için gönderin"
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

      {/* Usage Status */}
      <DashboardCard padding="md">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="font-semibold text-foreground">Kullanım Durumu</h3>
            <p className="text-sm text-muted-foreground">
              {placesUsed} / {placesMax} mekan kullanılıyor
            </p>
          </div>
          <div className="w-full md:w-64">
            <ProgressBar
              value={usagePercentage}
              showLabel
              label={`${usagePercentage}%`}
            />
          </div>
        </div>
      </DashboardCard>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <DashboardCard padding="md">
          <SectionHeader
            title="Temel Bilgiler"
            subtitle="Mekanınızın temel bilgilerini girin"
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
              <p className="text-xs text-muted-foreground">
                {formData.shortDescription.length}/500 karakter
              </p>
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
            subtitle="Mekanınızın adres ve konum bilgilerini girin"
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
            subtitle="Müşterilerin sizinle iletişim kurabileceği bilgileri girin"
            icon={<Phone className="size-5" />}
            size="sm"
            className="mb-6"
          />

          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefon *</Label>
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
                  required
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
            subtitle="Mekanınızın fiyat bilgilerini girin"
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

        {/* Photos */}
        <DashboardCard padding="md">
          <SectionHeader
            title="Fotoğraflar"
            subtitle="Mekanınızın fotoğraflarını ekleyin (en az 1 adet)"
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
              <p className="text-xs text-muted-foreground">
                Yukarıdaki alana URL yapıştırarak fotoğraf ekleyin
              </p>
            </div>
          )}

          <p className="mt-3 text-xs text-muted-foreground">
            {formData.images.length} fotoğraf eklendi. İlk fotoğraf kapak
            fotoğrafı olarak kullanılacaktır.
          </p>
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
            disabled={isSubmitting || formData.images.length === 0}
            className="min-w-[150px] gap-2"
          >
            {isSubmitting ? (
              <>
                <span className="inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Gönderiliyor...
              </>
            ) : (
              <>
                <Save className="size-4" />
                Mekanı Gönder
              </>
            )}
          </Button>
        </div>

        {/* Info Notice */}
        <DashboardCard padding="md">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500">
              <CheckCircle className="size-5" />
            </div>
            <div>
              <h4 className="mb-1 font-semibold text-foreground">
                Onay Süreci
              </h4>
              <p className="text-sm text-muted-foreground">
                Mekanınız TatilDesen yöneticileri tarafından incelenecek. Bu süreç
                genellikle 24-48 saat sürer. Onaylandıktan sonra mekanınız halka
                açılacak. Durumu "Mekanlarım" sayfasından takip edebilirsiniz.
              </p>
            </div>
          </div>
        </DashboardCard>
      </form>
    </div>
  );
}
