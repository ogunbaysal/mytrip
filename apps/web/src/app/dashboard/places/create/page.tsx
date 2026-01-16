"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save, Upload, MapPin, CheckCircle, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function CreatePlacePage() {
  const router = useRouter();
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

  const { data: usageData } = useQuery({
    queryKey: ["usage"],
    queryFn: () => api.subscriptions.getUsage(),
  });

  const createPlaceMutation = useMutation({
    mutationFn: (data: typeof formData) => api.owner.places.create(data),
    onSuccess: (data) => {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.images.length === 0) {
      alert("En az bir fotoğraf yükleyiniz");
      return;
    }

    setIsSubmitting(true);
    createPlaceMutation.mutate(formData);
  };

  const handleChange = (field: keyof typeof formData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = () => {
    alert(
      "Görsel yükleme özelliği yakında eklenecektir.\nŞimdilik lütfen resim URL'leri giriniz.",
    );
  };

  if (!canAddPlace) {
    return (
      <div className="container mx-auto px-4 py-12 md:px-6">
        <div className="mx-auto max-w-4xl">
          <Card className="p-8 text-center">
            <AlertTriangle className="mx-auto mb-4 size-16 text-yellow-500" />
            <h2 className="mb-2 text-2xl font-bold">Mekan Limiti Aşıldı</h2>
            <p className="mb-6 text-muted-foreground">
              {placesUsed} / {placesMax} mekan limitinize ulaştınız. Daha fazla
              mekan eklemek için lütfen abonelik planınızı yükseltiniz.
            </p>
            <Button
              onClick={() => (window.location.href = "/dashboard/subscription")}
            >
              Planı Yükselt
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 md:px-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">Yeni Mekan Ekle</h1>
          <p className="text-muted-foreground">
            Mekan bilgilerini doldurun ve MyTrip yöneticileri tarafından
            incelenmek üzere gönderin. Tüm mekanlar onaylandıktan sonra halka
            açılacak.
          </p>
        </div>

        <Card className="p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Kullanım Durumu</h3>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                {placesUsed} / {placesMax} mekan
              </span>
              <span
                className={cn(
                  "text-sm font-medium",
                  placesUsed >= placesMax ? "text-red-500" : "text-green-500",
                )}
              >
                {placesUsed >= placesMax ? "Lımite Ulaşıldı" : "Yeriniz Var"}
              </span>
            </div>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all"
              style={{
                width: `${((placesUsed / placesMax) * 100).toFixed(0)}%`,
              }}
            />
          </div>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-8">
          <Card className="p-6">
            <h3 className="mb-6 text-lg font-semibold">Temel Bilgiler</h3>

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
                  <option value="activity">Aktivite/Tur</option>
                  <option value="attraction">Gezi Yeri</option>
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
                onChange={(e) =>
                  handleChange("shortDescription", e.target.value)
                }
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
                placeholder="Mekanın detaylı açıklaması..."
                className="flex min-h-[150px] w-full rounded-md border bg-background px-3 py-2 text-sm"
                rows={6}
              />
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-6 text-lg font-semibold">Konum Bilgileri</h3>

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
                  <Button type="button" variant="outline" size="icon">
                    <MapPin className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-6 text-lg font-semibold">İletişim Bilgileri</h3>

            <div className="grid gap-6 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="phone">Telefon *</Label>
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
                  required
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
                  type="url"
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
            <h3 className="mb-6 text-lg font-semibold">Fiyatlandırma</h3>

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
                <Input
                  id="nightlyPrice"
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
                <span className="flex items-center mt-2">₺</span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-6 text-lg font-semibold">Fotoğraflar</h3>

            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <Button
                type="button"
                variant="outline"
                onClick={handleImageUpload}
                className="mx-auto"
              >
                <Upload className="mr-2 size-4" />
                Fotoğraf Yükle
              </Button>
              <p className="mt-4 text-sm text-muted-foreground">
                En az bir fotoğraf yüklemelisiniz. Toplam{" "}
                {formData.images.length} fotoğraf seçildi.
              </p>
              {formData.images.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, images: [] }))
                  }
                >
                  Seçimleri Temizle
                </Button>
              )}
            </div>
          </Card>

          <div className="flex items-center justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard/places")}
            >
              İptal
            </Button>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="min-w-[150px]"
            >
              {isSubmitting ? (
                <>
                  <span className="mr-2 inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                  Gönderiliyor...
                </>
              ) : (
                <>
                  <Save className="mr-2 size-4" />
                  Mekanı Gönder
                </>
              )}
            </Button>
          </div>
        </form>

        <Card className="p-6 mt-8">
          <div className="flex items-start gap-3">
            <CheckCircle className="mt-0.5 size-5 shrink-0 text-primary" />
            <div className="text-sm text-muted-foreground">
              <p className="mb-2 font-semibold">Onay Süreci</p>
              <p>
                Mekanınız MyTrip yöneticileri tarafından incelenecek. Bu süreç
                genellikle 24-48 saat sürer. Onaylandıktan sonra mekanınız halka
                açılacak. Onaylanma durumunu Dashboard sayfasından takip
                edebilirsiniz.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
