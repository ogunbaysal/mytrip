"use client";

import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  AlertTriangle,
  Building2,
  ChevronLeft,
  Clock,
  DollarSign,
  Eye,
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
  SectionHeader,
  StatusBadge,
} from "@/components/dashboard";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

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
  checkInInfo: string;
  checkOutInfo: string;
};

function parseJSON<T>(value: unknown, fallback: T): T {
  if (!value) return fallback;
  if (typeof value === "object") return value as T;

  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }

  return fallback;
}

function toStringArray(value: unknown): string[] {
  const parsed = parseJSON<unknown>(value, value);
  if (!Array.isArray(parsed)) return [];
  return parsed.map((item) => String(item)).filter(Boolean);
}

function normalizeCoordinates(value: unknown): { lat: number; lng: number } {
  const parsed = parseJSON<{ lat?: unknown; lng?: unknown }>(value, DEFAULT_COORDS);
  const lat = Number(parsed.lat);
  const lng = Number(parsed.lng);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return DEFAULT_COORDS;
  }

  return { lat, lng };
}

function extractCheckInfo(value: unknown, key: "checkIn" | "checkOut"): string {
  const parsed = parseJSON<{ checkIn?: unknown; checkOut?: unknown } | string>(
    value,
    "",
  );

  if (typeof parsed === "string") return parsed;
  const nested = parsed[key];
  return typeof nested === "string" ? nested : "";
}

export default function EditPlacePage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const placeId = params.id as string;

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
    checkInInfo: "",
    checkOutInfo: "",
  });

  const [isBusinessDocumentUploading, setIsBusinessDocumentUploading] =
    useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const { data: placeData, isLoading: isPlaceLoading } = useQuery({
    queryKey: ["owner-place-detail", placeId],
    queryFn: () => api.owner.places.getById(placeId),
    enabled: Boolean(placeId),
  });

  const { data: categoriesData, isLoading: isCategoriesLoading } = useQuery({
    queryKey: ["owner-place-categories"],
    queryFn: () => api.owner.places.categories(),
  });

  const { data: citiesData, isLoading: isCitiesLoading } = useQuery({
    queryKey: ["place-location-cities"],
    queryFn: () => api.locations.cities(),
  });

  const { data: districtsData, isLoading: isDistrictsLoading } = useQuery({
    queryKey: ["place-location-districts", formData.cityId],
    queryFn: () => api.locations.districts(formData.cityId),
    enabled: Boolean(formData.cityId),
  });

  const place = placeData?.place;
  const categories = categoriesData?.categories ?? [];
  const cities = citiesData?.cities ?? [];
  const districts = districtsData?.districtItems ?? [];

  const selectedCityName = useMemo(
    () => cities.find((city) => city.id === formData.cityId)?.name ?? place?.city ?? "",
    [cities, formData.cityId, place?.city],
  );

  const selectedDistrictName = useMemo(
    () =>
      districts.find((district) => district.id === formData.districtId)?.name ??
      place?.district ??
      "",
    [districts, formData.districtId, place?.district],
  );

  const resolveCoordinates = (
    latitude: number | null | undefined,
    longitude: number | null | undefined,
  ): { lat: number; lng: number } | null => {
    if (
      typeof latitude !== "number" ||
      typeof longitude !== "number" ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      return null;
    }

    return { lat: latitude, lng: longitude };
  };

  useEffect(() => {
    if (!place) return;

    const contactInfo = parseJSON<{ phone?: string; email?: string; website?: string }>(
      place.contactInfo,
      {},
    );

    setFormData({
      name: place.name || "",
      categoryId: place.categoryId || "",
      shortDescription: place.shortDescription || "",
      description: place.description || "",
      address: place.address || "",
      cityId: place.cityId || "",
      districtId: place.districtId || "",
      location: normalizeCoordinates(place.location),
      contactInfo: {
        phone: contactInfo.phone || "",
        email: contactInfo.email || "",
        website: contactInfo.website || "",
      },
      nightlyPrice: place.nightlyPrice ? String(place.nightlyPrice) : "",
      features: toStringArray(place.features),
      images: toStringArray(place.images),
      businessDocumentFileId:
        place.businessDocumentFileId || place.businessDocument?.id || "",
      businessDocumentUrl: place.businessDocument?.url || "",
      businessDocumentFilename: place.businessDocument?.filename || "",
      checkInInfo: extractCheckInfo(place.checkInInfo, "checkIn"),
      checkOutInfo: extractCheckInfo(place.checkOutInfo, "checkOut"),
    });

    setHasChanges(false);
  }, [place]);

  useEffect(() => {
    if (!place?.city || formData.cityId || cities.length === 0) return;

    const matchedCity = cities.find((city) => city.name === place.city);
    if (!matchedCity) return;

    setFormData((previous) => ({
      ...previous,
      cityId: matchedCity.id,
    }));
  }, [cities, formData.cityId, place?.city]);

  useEffect(() => {
    if (!place?.district || formData.districtId || districts.length === 0) return;

    const matchedDistrict = districts.find(
      (district) => district.name === place.district,
    );
    if (!matchedDistrict) return;

    setFormData((previous) => ({
      ...previous,
      districtId: matchedDistrict.id,
    }));
  }, [districts, formData.districtId, place?.district]);

  const setFormState = (updater: (previous: FormState) => FormState) => {
    setFormData((previous) => updater(previous));
    setHasChanges(true);
  };

  const setField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setFormState((previous) => ({ ...previous, [field]: value }));
  };

  const toggleFeature = (featureId: string) => {
    setFormState((previous) => ({
      ...previous,
      features: previous.features.includes(featureId)
        ? previous.features.filter((item) => item !== featureId)
        : [...previous.features, featureId],
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
      setFormState((previous) => ({
        ...previous,
        businessDocumentFileId: response.fileId,
        businessDocumentUrl: response.url,
        businessDocumentFilename: selectedFile.name,
      }));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Belge yüklenemedi";
      toast.error(message);
    } finally {
      setIsBusinessDocumentUploading(false);
      event.target.value = "";
    }
  };

  const updatePlaceMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      api.owner.places.update(placeId, payload),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["owner-place-detail", placeId] }),
        queryClient.invalidateQueries({ queryKey: ["owner-places"] }),
      ]);
      router.push("/dashboard/places");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Mekan güncellenemedi");
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!hasChanges) {
      toast.info("Değişiklik bulunamadı");
      return;
    }

    if (!formData.name.trim()) {
      toast.error("Mekan adı zorunludur");
      return;
    }

    if (!formData.categoryId) {
      toast.error("Kategori seçimi zorunludur");
      return;
    }

    if (!formData.address.trim()) {
      toast.error("Adres zorunludur");
      return;
    }

    if (!formData.cityId || !formData.districtId) {
      toast.error("İl ve ilçe seçimi zorunludur");
      return;
    }

    if (
      !Number.isFinite(formData.location.lat) ||
      !Number.isFinite(formData.location.lng)
    ) {
      toast.error("Harita üzerinden geçerli konum seçin");
      return;
    }

    if (formData.images.length === 0) {
      toast.error("En az bir görsel yüklemelisiniz");
      return;
    }

    if (!formData.businessDocumentFileId) {
      toast.error("İşletme belgesi PDF yüklemek zorunludur");
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
      toast.error("Gecelik fiyat geçersiz");
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
      checkInInfo: { checkIn: formData.checkInInfo.trim() },
      checkOutInfo: { checkOut: formData.checkOutInfo.trim() },
    };

    updatePlaceMutation.mutate(payload);
  };

  if (isPlaceLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Mekan yükleniyor...</p>
        </div>
      </div>
    );
  }

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
              <h2 className="mb-2 text-xl font-bold text-foreground">Mekan Bulunamadı</h2>
              <p className="mb-6 text-muted-foreground">
                Aradığınız mekan bulunamadı veya silinmiş olabilir.
              </p>
              <Button onClick={() => router.push("/dashboard/places")}>Mekanlara Dön</Button>
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
        "Değişiklik yapıldığında mekan tekrar inceleme durumuna geçebilir.",
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
            onChange={(images) => setField("images", images)}
            disabled={updatePlaceMutation.isPending}
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
                onChange={(event) => setField("name", event.target.value)}
                placeholder="Örn: Aegean Ula Boat Tours"
              />
            </div>

            <div className="space-y-2">
              <Label>Kategori *</Label>
              <Select
                value={formData.categoryId || undefined}
                onValueChange={(value) => setField("categoryId", value)}
                disabled={isCategoriesLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Kategori seçin" />
                </SelectTrigger>
                <SelectContent>
                  {formData.categoryId &&
                    !categories.some((category) => category.id === formData.categoryId) && (
                      <SelectItem value={formData.categoryId}>
                        {place.category || "Seçili kategori"}
                      </SelectItem>
                    )}
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
                onChange={(event) => setField("shortDescription", event.target.value)}
                placeholder="Listelerde görünecek kısa özet"
                maxLength={500}
              />
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label>Detaylı Açıklama</Label>
              <TipTapEditor
                content={formData.description}
                onChange={(description: string) => setField("description", description)}
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
                onChange={(event) => setField("address", event.target.value)}
                className="flex min-h-[90px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Tam adres"
              />
            </div>

            <div className="space-y-2">
              <Label>Şehir *</Label>
              <Select
                value={formData.cityId || undefined}
                onValueChange={(value) => {
                  const selectedCity = cities.find((city) => city.id === value);
                  const cityCoordinates = resolveCoordinates(
                    selectedCity?.latitude,
                    selectedCity?.longitude,
                  );

                  setFormState((previous) => ({
                    ...previous,
                    cityId: value,
                    districtId: "",
                    location: cityCoordinates ?? previous.location,
                  }));
                }}
                disabled={isCitiesLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Şehir seçin" />
                </SelectTrigger>
                <SelectContent>
                  {formData.cityId && !cities.some((city) => city.id === formData.cityId) && (
                    <SelectItem value={formData.cityId}>{place.city || "Seçili şehir"}</SelectItem>
                  )}
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
                onValueChange={(value) => {
                  const requestCityId = formData.cityId;
                  const selectedDistrict = districts.find(
                    (district) => district.id === value,
                  );
                  const districtCoordinates = resolveCoordinates(
                    selectedDistrict?.latitude,
                    selectedDistrict?.longitude,
                  );

                  setFormState((previous) => ({
                    ...previous,
                    districtId: value,
                    location: districtCoordinates ?? previous.location,
                  }));

                  if (
                    districtCoordinates ||
                    !requestCityId ||
                    !selectedDistrict?.name
                  ) {
                    return;
                  }

                  void queryClient
                    .fetchQuery({
                      queryKey: [
                        "place-location-district-center",
                        requestCityId,
                        selectedDistrict.name,
                      ],
                      queryFn: () =>
                        api.locations.districtCenter(
                          requestCityId,
                          selectedDistrict.name,
                        ),
                      staleTime: 1000 * 60 * 60 * 24,
                    })
                    .then((center) => {
                      if (!center) return;

                      setFormData((previous) => {
                        if (
                          previous.cityId !== requestCityId ||
                          previous.districtId !== value
                        ) {
                          return previous;
                        }

                        return { ...previous, location: center };
                      });
                    });
                }}
                disabled={!formData.cityId || isDistrictsLoading}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={formData.cityId ? "İlçe seçin" : "Önce şehir seçin"}
                  />
                </SelectTrigger>
                <SelectContent>
                  {formData.districtId &&
                    !districts.some((district) => district.id === formData.districtId) && (
                      <SelectItem value={formData.districtId}>
                        {place.district || "Seçili ilçe"}
                      </SelectItem>
                    )}
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
                onChange={(coords) => setField("location", coords)}
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
                  setFormState((previous) => ({
                    ...previous,
                    contactInfo: {
                      ...previous.contactInfo,
                      phone: event.target.value,
                    },
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
                  setFormState((previous) => ({
                    ...previous,
                    contactInfo: {
                      ...previous.contactInfo,
                      email: event.target.value,
                    },
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
                  setFormState((previous) => ({
                    ...previous,
                    contactInfo: {
                      ...previous.contactInfo,
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
              onChange={(event) => setField("nightlyPrice", event.target.value)}
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
                disabled={isBusinessDocumentUploading || updatePlaceMutation.isPending}
              />
              <Button
                type="button"
                variant="outline"
                disabled={isBusinessDocumentUploading || updatePlaceMutation.isPending}
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

        <DashboardCard padding="md">
          <SectionHeader
            title="Giriş/Çıkış Bilgileri"
            subtitle="Opsiyonel"
            icon={<Clock className="size-5" />}
            size="sm"
            className="mb-6"
          />

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="checkInInfo">Check-in Bilgisi</Label>
              <Input
                id="checkInInfo"
                value={formData.checkInInfo}
                onChange={(event) => setField("checkInInfo", event.target.value)}
                placeholder="Örn: 14:00 sonrası"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="checkOutInfo">Check-out Bilgisi</Label>
              <Input
                id="checkOutInfo"
                value={formData.checkOutInfo}
                onChange={(event) => setField("checkOutInfo", event.target.value)}
                placeholder="Örn: 11:00 öncesi"
              />
            </div>
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
            disabled={
              updatePlaceMutation.isPending ||
              isBusinessDocumentUploading ||
              !hasChanges
            }
            className="min-w-[170px] gap-2"
          >
            {updatePlaceMutation.isPending ? (
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

        <DashboardCard padding="md">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500">
              <Mail className="size-5" />
            </div>
            <div>
              <h4 className="mb-1 font-semibold text-foreground">Onay Süreci</h4>
              <p className="text-sm text-muted-foreground">
                Güncelleme sonrası mekanınız yöneticiler tarafından tekrar incelenebilir.
              </p>
            </div>
          </div>
        </DashboardCard>
      </form>
    </div>
  );
}
