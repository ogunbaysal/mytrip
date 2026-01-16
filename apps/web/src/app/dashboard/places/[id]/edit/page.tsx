"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, ArrowLeft, MapPin, Upload, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";

export default function EditPlacePage() {
  const router = useRouter();
  const params = useParams();
  const placeId = params.id as string;
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: "",
    type: "hotel" as const,
    categoryId: "",
    category: "",
    description: "",
    shortDescription: "",
    address: "",
    city: "",
    district: "",
    location: { lat: 0, lng: 0 },
    contactInfo: { phone: "", email: "", website: "" },
    priceLevel: "" as const,
    nightlyPrice: 0,
    features: [] as string[],
    images: [] as string[],
    openingHours: {},
    checkInInfo: "",
    checkOutInfo: "",
  });

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
      const location =
        typeof place.location === "string"
          ? JSON.parse(place.location)
          : place.location;
      const contactInfo =
        typeof place.contactInfo === "string"
          ? JSON.parse(place.contactInfo)
          : place.contactInfo;
      const features =
        typeof place.features === "string"
          ? JSON.parse(place.features)
          : place.features;
      const images =
        typeof place.images === "string"
          ? JSON.parse(place.images)
          : place.images;
      const openingHours =
        typeof place.openingHours === "string"
          ? JSON.parse(place.openingHours)
          : place.openingHours;
      const checkInInfo =
        typeof place.checkInInfo === "string"
          ? JSON.parse(place.checkInInfo)
          : place.checkInInfo;
      const checkOutInfo =
        typeof place.checkOutInfo === "string"
          ? JSON.parse(place.checkOutInfo)
          : place.checkOutInfo;

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
        location: location || { lat: 0, lng: 0 },
        contactInfo: contactInfo || { phone: "", email: "", website: "" },
        priceLevel: place.priceLevel || "",
        nightlyPrice: parseFloat(place.nightlyPrice || "0"),
        features: features || [],
        images: images || [],
        openingHours: openingHours || {},
        checkInInfo: checkInInfo || {},
        checkOutInfo: checkOutInfo || {},
      });
    }
  }, [place]);

  const { data: usageData } = useQuery({
    queryKey: ["usage"],
    queryFn: () => api.subscriptions.getUsage(),
  });

  const usage = usageData?.usage;
  const placesUsed = usage?.places.current || 0;
  const placesMax = usage?.places.max || 1;

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

  const handleImageUpload = () => {
    alert(
      "Görsel yükleme özelliği yakında eklenecektir.\nŞimdilik lütfen resim URL'leri giriniz.",
    );
  };

  const getStatusInfo = () => {
    if (!place) return null;

    const messages = {
      pending: {
        color: "bg-yellow-100 text-yellow-800",
        text: "Beklemede",
        detail:
          "Yöneticiler tarafından inceleniyor. Onaylandıktan sonra halka açılacak.",
      },
      active: {
        color: "bg-green-100 text-green-800",
        text: "Yayınlanmış",
        detail: "Mekanınız halka açık durumda.",
      },
      rejected: {
        color: "bg-red-100 text-red-800",
        text: "Reddedilmiş",
        detail:
          "Mekanınız reddedildi. Sebeplerini düzenleyip tekrar gönderiniz.",
      },
      inactive: {
        color: "bg-gray-100 text-gray-800",
        text: "Pasif",
        detail: "Mekanınız şu anda pasif durumda.",
      },
      suspended: {
        color: "bg-orange-100 text-orange-800",
        text: "Askıya Alınmış",
        detail: "Mekanınız askıya alındı. Destek ile iletişime geçin.",
      },
    };

    const info = messages[place.status as keyof typeof messages];
    return info;
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!place) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Card className="mx-auto max-w-md p-8 text-center">
          <AlertTriangle className="mx-auto mb-4 size-16 text-red-500" />
          <h2 className="mb-2 text-2xl font-bold">Mekan Bulunamadı</h2>
          <p className="mb-6 text-muted-foreground">
            Aradığınız mekan bulunamadı veya silinmiş olabilir.
          </p>
          <Button onClick={() => router.push("/dashboard/places")}>
            Paneye Dön
          </Button>
        </Card>
      </div>
    );
  }

  const statusInfo = getStatusInfo();

  return (
    <div className="space-y-8">
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/dashboard/places")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 size-4" />
          Mekanlara Dön
        </Button>
        <h1 className="text-3xl font-bold">{place.name} - Mekan Düzenle</h1>
        <p className="text-muted-foreground">Mekan bilgilerini güncelleyin.</p>
      </div>

      {statusInfo && (
        <Card className={`p-6 ${statusInfo.color}`}>
          <div className="flex items-start gap-3 mb-4">
            <AlertTriangle className="mt-1 size-6" />
            <div>
              <h3 className="text-lg font-semibold">{statusInfo.text}</h3>
              <p className="text-sm text-muted-foreground">
                {statusInfo.detail}
              </p>
              {place.status === "rejected" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/dashboard/places`)}
                  className="mt-4"
                >
                  Değişiklik Yap
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}

      {place.status === "active" && (
        <div className="bg-blue-50 border border-blue-200 p-4 mb-6 rounded-lg">
          <p className="text-sm text-blue-800 font-medium">
            <MapPin className="mr-2 size-4" />
            Mekan aktif durumda. Değişiklik yapıldığında mekan tekrar incelenmek
            üzere "pending" durumuna geçecek.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <Card className="p-6">
          <h2 className="mb-6 text-lg font-semibold">Temel Bilgiler</h2>

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
                className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm"
                required
              >
                <option value="hotel">Otel/Pansiyon</option>
                <option value="restaurant">Restoran</option>
                <option value="cafe">Kafe</option>
                <option value="activity">Aktivite</option>
                <option value="attraction">Gezi Yeri</option>
                <option value="transport">Ulaşım</option>
              </select>
            </div>
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

          <div className="space-y-2">
            <Label htmlFor="shortDescription">Kısa Açıklama *</Label>
            <textarea
              id="shortDescription"
              value={formData.shortDescription}
              onChange={(e) => handleChange("shortDescription", e.target.value)}
              placeholder="Mekanı 1-2 cümlelik özetleyin..."
              className="flex min-h-[80px] w-full rounded-md border bg-background px-3 py-2 text-sm"
              maxLength={500}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Açıklama</Label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Mekanın detaylı açıklamasını buraya yazın..."
              className="flex min-h-[150px] w-full rounded-md border bg-background px-3 py-2 text-sm"
              rows={6}
            />
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="mb-6 text-lg font-semibold">Konum Bilgileri</h2>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
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
          </div>

          <div className="grid gap-6 md:grid-cols-2">
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
              <Label htmlFor="location">Koordinatlar</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  step="any"
                  value={formData.location.lat}
                  onChange={(e) =>
                    handleChange("location", {
                      ...formData.location,
                      lat: parseFloat(e.target.value),
                    })
                  }
                  placeholder="Enlem"
                  className="flex-1"
                />
                <Input
                  type="number"
                  step="any"
                  value={formData.location.lng}
                  onChange={(e) =>
                    handleChange("location", {
                      ...formData.location,
                      lng: parseFloat(e.target.value),
                    })
                  }
                  placeholder="Boylam"
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="mb-6 text-lg font-semibold">İletişim Bilgileri</h2>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefon</Label>
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
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-posta</Label>
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
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={formData.contactInfo.website}
                onChange={(e) =>
                  handleChange("contactInfo", {
                    ...formData.contactInfo,
                    website: e.target.value,
                  })
                }
                placeholder="https://"
              />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="mb-6 text-lg font-semibold">Fiyatlandırma</h2>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="priceLevel">Fiyat Seviyesi</Label>
              <select
                id="priceLevel"
                value={formData.priceLevel}
                onChange={(e) => handleChange("priceLevel", e.target.value)}
                className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
                <option value="">Seçiniz</option>
                <option value="budget">Ekonomik</option>
                <option value="moderate">Orta</option>
                <option value="expensive">Lüks</option>
                <option value="luxury">Ultra Lüks</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nightlyPrice">Gecelik Fiyat</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.nightlyPrice}
                  onChange={(e) =>
                    handleChange("nightlyPrice", parseFloat(e.target.value))
                  }
                  placeholder="Örn: 2500"
                  className="flex-1"
                />
                <span className="mt-2 text-sm text-muted-foreground">
                  ₺/gece
                </span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="mb-6 text-lg font-semibold">Fotoğraflar</h2>

          <div className="border-2 border-dashed rounded-lg p-8 text-center">
            <Button
              type="button"
              variant="outline"
              onClick={handleImageUpload}
              className="mx-auto"
            >
              <Upload className="mr-2 size-6" />
              Fotoğraf Yükle
            </Button>
            <p className="mt-4 text-sm text-muted-foreground">
              {formData.images.length} fotoğraf seçildi
            </p>
            {formData.images.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setFormData((prev) => ({ ...prev, images: [] }))}
              >
                Seçimleri Temizle
              </Button>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="mb-6 text-lg font-semibold">Özellikler</h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              "Ücretsiz WiFi",
              "Havuz",
              "Ücretsiz Otopark",
              "Yüzme Havuzu",
              "Klima Kontrolü",
              "SPA",
              "24 Saat Oda",
              "Kablosuz Servisi",
              "Otopark Yeri",
              "Kurumsal Eşyalanırma",
              "Havaalan",
              "Lokasyon",
            ].map((feature) => (
              <label
                key={feature}
                className="flex items-center gap-3 cursor-pointer hover:bg-muted/50"
              >
                <input
                  type="checkbox"
                  checked={formData.features.includes(feature)}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setFormData((prev) => ({
                      ...prev,
                      features: checked
                        ? [...prev.features, feature]
                        : prev.features.filter((f) => f !== feature),
                    }));
                    setHasChanges(true);
                  }}
                  className="size-4"
                />
                <span className="text-sm">{feature}</span>
              </label>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="mb-6 text-lg font-semibold">
            Check-in & Check-out Bilgileri
          </h2>

          <div className="space-y-4 text-sm">
            <div className="space-y-2">
              <Label htmlFor="checkInInfo">Check-in Saati</Label>
              <textarea
                id="checkInInfo"
                value={formData.checkInInfo}
                onChange={(e) => handleChange("checkInInfo", e.target.value)}
                placeholder="Örn: 14:00 den sonra giriş yapabilir"
                className="flex min-h-[60px] w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="checkOutInfo">Check-out Saati</Label>
              <textarea
                id="checkOutInfo"
                value={formData.checkOutInfo}
                onChange={(e) => handleChange("checkOutInfo", e.target.value)}
                placeholder="Örn: 11:00 den önce çıkış yapması gerekiyor"
                className="flex min-h-[60px] w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </div>
          </div>
        </Card>

        <div className="flex items-center justify-between gap-4">
          <Button
            variant="outline"
            type="button"
            onClick={() => router.push("/dashboard/places")}
          >
            İptal
          </Button>

          <Button
            type="submit"
            disabled={isSubmitting || !hasChanges}
            className="min-w-[200px]"
          >
            {isSubmitting ? (
              <>
                <span className="mr-2 inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Kaydediliyor...
              </>
            ) : (
              <>
                <Save className="mr-2 size-4" />
                Değişiklikleri Kaydet
              </>
            )}
          </Button>
        </div>
      </form>

      {usage && (
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Plan Kullanımı</h3>
              <p className="text-sm text-muted-foreground">
                {placesUsed} / {placesMax} mekan kullanılıyor
              </p>
            </div>
            {(placesUsed || 0) >= (placesMax || 1) && (
              <Button
                variant="outline"
                onClick={() =>
                  (window.location.href = "/dashboard/subscription")
                }
              >
                Planı Yükselt
              </Button>
            )}
          </div>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all"
              style={{
                width: `${((placesUsed / placesMax) * 100).toFixed(0)}%`,
              }}
            />
          </div>
        </Card>
      )}
    </div>
  );
}
