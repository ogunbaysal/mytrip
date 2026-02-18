"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useQueryClient } from "@tanstack/react-query"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { TiptapEditor } from "@/components/ui/tiptap-editor"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { PlaceKindCapabilities } from "@/components/places/place-kind-capabilities"
import {
  type Place,
  type PlaceKind,
  usePlace,
  usePlaceFeatures,
  usePlaceKinds,
  useUpdatePlace,
} from "@/hooks/use-places"
import { PlaceKindSelect } from "@/components/places/place-kind-select"
import {
  fetchDistrictCenter,
  getDistrictCenterQueryKey,
  useCities,
  useDistrictData,
  useDistricts,
} from "@/hooks/use-locations"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, FileText, Loader2, Upload } from "lucide-react"
import Link from "next/link"
import { useEffect, useState, type ChangeEvent } from "react"
import { GalleryUpload } from "@/components/ui/gallery-upload"
import { Skeleton } from "@/components/ui/skeleton"
import { CoordinateMapPicker } from "@/components/ui/coordinate-map-picker"
import { api } from "@/lib/api"

const formSchema = z.object({
  images: z.array(z.string()).optional(),
  name: z.string().min(2, "Mekan adı en az 2 karakter olmalıdır"),
  kind: z.string().min(1, "Yer türü seçimi zorunludur"),
  description: z.string().min(10, "Açıklama en az 10 karakter olmalıdır"),
  shortDescription: z.string().max(160, "Kısa açıklama 160 karakteri geçemez").optional(),
  address: z.string().min(5, "Adres zorunludur"),
  city: z.string().min(2, "Şehir zorunludur"),
  district: z.string().min(2, "İlçe zorunludur"),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  priceLevel: z.string().optional(),
  nightlyPrice: z.string().optional(),
  businessDocumentFileId: z.string().optional(),
  status: z.enum(["active", "inactive", "pending", "suspended", "rejected"]),
  contactInfo: z.object({
      phone: z.string().optional(),
      email: z.string().email("Geçerli bir e-posta giriniz").optional().or(z.literal("")),
      website: z.string().url("Geçerli bir URL giriniz").optional().or(z.literal("")),
  }).optional(),
  features: z.array(z.string()).optional(),
})

const COMMON_FEATURES = [
  { id: "wifi", label: "Wi-Fi" },
  { id: "parking", label: "Otopark" },
  { id: "pool", label: "Havuz" },
  { id: "spa", label: "Spa & Wellness" },
  { id: "gym", label: "Spor Salonu" },
  { id: "restaurant", label: "Restoran" },
  { id: "bar", label: "Bar" },
  { id: "room-service", label: "Oda Servisi" },
  { id: "air-conditioning", label: "Klima" },
  { id: "heating", label: "Isıtma" },
  { id: "sea-view", label: "Deniz Manzarası" },
  { id: "beach-access", label: "Plaja Erişim" },
  { id: "pet-friendly", label: "Evcil Hayvan Dostu" },
  { id: "wheelchair-accessible", label: "Engelli Erişimi" },
  { id: "family-friendly", label: "Aile Dostu" },
];

function normalizeAmenitySlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s_-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeFeatureList(values: string[] | undefined): string[] {
  if (!values || values.length === 0) return [];
  const normalized = values.map((value) => normalizeAmenitySlug(value)).filter(Boolean);
  return Array.from(new Set(normalized));
}

function formatFeatureLabel(featureSlug: string): string {
  return featureSlug
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toLocaleUpperCase("tr-TR") + word.slice(1))
    .join(" ");
}

function normalizeKindToken(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .trim()
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[\s-]+/g, "_");
}

function resolveRawPlaceKindValue(place: Place): string {
  const candidates = [
    place.kind,
    place.categoryId,
    place.kindSlug,
    place.categorySlug,
    place.kindName,
    place.categoryName,
    place.type,
    place.category,
  ]
    .filter((value): value is string => Boolean(value && value.trim()))
    .map((value) => value.trim());

  return candidates[0] ?? "";
}

function resolveKindIdFromRawValue(
  rawValue: string,
  kinds: PlaceKind[],
): string | null {
  if (!rawValue) return null;
  const normalizedRawValue = normalizeKindToken(rawValue);

  const matchedKind = kinds.find((kind) => {
    const normalizedId = normalizeKindToken(kind.id);
    const normalizedSlug = normalizeKindToken(kind.slug);
    const normalizedName = normalizeKindToken(kind.name);
    return (
      rawValue === kind.id ||
      rawValue === kind.slug ||
      normalizedRawValue === normalizedId ||
      normalizedRawValue === normalizedSlug ||
      normalizedRawValue === normalizedName
    );
  });

  if (matchedKind) return matchedKind.id;

  return null;
}

const DEFAULT_COORDS = { lat: 39.0, lng: 35.0 };
const PRICE_LEVEL_OPTIONS = ["budget", "moderate", "expensive", "luxury"];
const STATUS_OPTIONS = ["active", "pending", "suspended", "inactive", "rejected"];

function parseLocationInput(input: unknown): { lat: string; lng: string } {
  if (!input) return { lat: "", lng: "" };

  let value: Record<string, unknown> = {};
  if (typeof input === "object" && input !== null) {
    value = input as Record<string, unknown>;
  }
  if (typeof input === "string") {
    try {
      const parsed = JSON.parse(input);
      if (typeof parsed === "object" && parsed !== null) {
        value = parsed as Record<string, unknown>;
      }
    } catch {
      return { lat: "", lng: "" };
    }
  }

  const directLat = Number(value.lat);
  const directLng = Number(value.lng);
  if (!Number.isNaN(directLat) && !Number.isNaN(directLng)) {
    return { lat: String(directLat), lng: String(directLng) };
  }

  const coordinates = Array.isArray(value.coordinates) ? value.coordinates : [];
  const coordLng = Number(coordinates[0]);
  const coordLat = Number(coordinates[1]);
  if (!Number.isNaN(coordLat) && !Number.isNaN(coordLng)) {
    return { lat: String(coordLat), lng: String(coordLng) };
  }

  return { lat: "", lng: "" };
}

function parseCoordinates(
  location?:
    | {
        latitude: number | string | null
        longitude: number | string | null
      }
    | null,
): { lat: number; lng: number } | null {
  if (!location) return null

  if (location.latitude === null || location.latitude === undefined) return null
  if (location.longitude === null || location.longitude === undefined) return null
  if (
    typeof location.latitude === "string" &&
    location.latitude.trim() === ""
  ) {
    return null
  }
  if (
    typeof location.longitude === "string" &&
    location.longitude.trim() === ""
  ) {
    return null
  }

  const lat = Number(location.latitude)
  const lng = Number(location.longitude)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null
  }

  return { lat, lng }
}

export default function EditPlacePage() {
  const queryClient = useQueryClient()
  const router = useRouter()
  const params = useParams()
  const placeId = params.id as string

  const { data: place, isLoading: isPlaceLoading } = usePlace(placeId)
  const { mutate: updatePlace, isPending: isUpdating } = useUpdatePlace()
  const { data: placeKinds, isLoading: isKindsLoading } = usePlaceKinds()
  const { data: placeFeatures = [] } = usePlaceFeatures()
  const [isBusinessDocumentUploading, setIsBusinessDocumentUploading] = useState(false)
  const [businessDocument, setBusinessDocument] = useState<{
    fileId: string
    url: string
    filename: string
  } | null>(null)


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      images: [],
      name: "",
      kind: "",
      description: "",
      shortDescription: "",
      address: "",
      city: "",
      district: "",
      priceLevel: "",
      latitude: "",
      longitude: "",
      nightlyPrice: "",
      businessDocumentFileId: "",
      status: "pending",
      contactInfo: {
          phone: "",
          email: "",
          website: "",
      },
      features: [],
    },
  })

  const watchedCity = form.watch("city")
  const { data: cities } = useCities()
  const { data: districts } = useDistricts(watchedCity)
  const { data: districtData } = useDistrictData(watchedCity)

  useEffect(() => {
    if (place) {
      const coords = parseLocationInput(place.location);
      const rawKindValue = resolveRawPlaceKindValue(place);
      const normalizedStatus: z.infer<typeof formSchema>["status"] =
        STATUS_OPTIONS.includes(place.status)
          ? (place.status as z.infer<typeof formSchema>["status"])
          : "pending";
      const normalizedPriceLevel = PRICE_LEVEL_OPTIONS.includes(place.priceLevel)
        ? place.priceLevel
        : "";
      setBusinessDocument(
        place.businessDocument
          ? {
              fileId: place.businessDocument.id,
              url: place.businessDocument.url,
              filename: place.businessDocument.filename,
            }
          : null,
      )
      form.reset({
        name: place.name,
        kind: rawKindValue,
        description: place.description,
        shortDescription: place.shortDescription || "",
        address: place.address,
        city: place.city,
        district: place.district,
        latitude: coords.lat,
        longitude: coords.lng,
        priceLevel: normalizedPriceLevel,
        nightlyPrice: place.nightlyPrice || "",
        businessDocumentFileId: place.businessDocumentFileId || "",
        status: normalizedStatus,
        images: place.images || [],
        contactInfo: {
            phone: place.contactInfo?.phone || "",
            email: place.contactInfo?.email || "",
            website: place.contactInfo?.website || "",
        },
        features: normalizeFeatureList(place.features),
      })
    }
  }, [place, form])

  useEffect(() => {
    if (!place) return;
    const currentKind = form.getValues("kind");
    if (currentKind) return;

    const rawKindValue = resolveRawPlaceKindValue(place);
    if (!rawKindValue) return;

    form.setValue("kind", rawKindValue, {
      shouldDirty: false,
      shouldValidate: false,
    });
  }, [place, form]);

  useEffect(() => {
    if (!place || !placeKinds || placeKinds.length === 0) return;
    if (form.getFieldState("kind").isDirty) return;

    const currentKind = form.getValues("kind");
    const rawKindValue = currentKind || resolveRawPlaceKindValue(place);
    const resolvedKind = resolveKindIdFromRawValue(rawKindValue, placeKinds);
    if (!resolvedKind || resolvedKind === currentKind) return;

    form.setValue("kind", resolvedKind, {
      shouldDirty: false,
      shouldValidate: true,
    });
  }, [place, placeKinds, form]);

  const handleBusinessDocumentUpload = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) return

    try {
      setIsBusinessDocumentUploading(true)
      const response = await api.upload.single(selectedFile, "business_document")
      setBusinessDocument({
        fileId: response.fileId,
        url: response.url,
        filename: selectedFile.name,
      })
      form.setValue("businessDocumentFileId", response.fileId, {
        shouldDirty: true,
      })
      toast.success("İşletme belgesi yüklendi")
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Belge yüklenemedi"
      toast.error(message)
    } finally {
      setIsBusinessDocumentUploading(false)
      event.target.value = ""
    }
  }

  function onSubmit(values: z.infer<typeof formSchema>) {
    const parsedLat = Number(values.latitude);
    const parsedLng = Number(values.longitude);
    const hasValidCoordinates =
      !Number.isNaN(parsedLat) && !Number.isNaN(parsedLng);

    const apiData = {
        ...values,
        features: normalizeFeatureList(values.features),
        location: hasValidCoordinates
          ? { lat: parsedLat, lng: parsedLng }
          : undefined,
        priceLevel: values.priceLevel || undefined,
        businessDocumentFileId:
          businessDocument?.fileId || values.businessDocumentFileId || undefined,
    }

    updatePlace({ placeId, data: apiData }, {
      onSuccess: () => {
        toast.success("Mekan başarıyla güncellendi")
        router.push(`/places/${placeId}`)
      },
      onError: (error: Error) => {
        toast.error(error.message || "Mekan güncellenirken bir hata oluştu")
      }
    })
  }

  if (isPlaceLoading) {
     return (
        <div className="flex-1 space-y-4 p-8 pt-6">
           <Skeleton className="h-8 w-64 mb-6" />
           <Skeleton className="h-[400px]" />
        </div>
     )
  }

  if (!place) {
    return (
       <div className="flex-1 p-8 pt-6 flex flex-col items-center justify-center h-[50vh]">
          <h2 className="text-2xl font-bold mb-2">Mekan Bulunamadı</h2>
          <Button onClick={() => router.push("/places")}>Listeye Dön</Button>
       </div>
    )
  }

  const latitudeText = form.watch("latitude");
  const longitudeText = form.watch("longitude");
  const selectedKindRaw = form.watch("kind");
  const rawKindFromPlace = place ? resolveRawPlaceKindValue(place) : "";
  const effectiveKindRaw = selectedKindRaw || rawKindFromPlace;
  const selectedKind =
    (placeKinds && placeKinds.length > 0
      ? resolveKindIdFromRawValue(effectiveKindRaw, placeKinds)
      : null) ?? effectiveKindRaw;
  const selectedCity = form.watch("city");
  const selectedDistrict = form.watch("district");
  const selectedFeatures = normalizeFeatureList(form.watch("features"));
  const selectedFeatureSet = new Set(selectedFeatures);
  const optionMap = new Map<string, { id: string; label: string }>();

  for (const feature of placeFeatures) {
    const normalizedId = normalizeAmenitySlug(feature.slug);
    if (!normalizedId) continue;
    optionMap.set(normalizedId, {
      id: normalizedId,
      label: feature.label?.trim() || formatFeatureLabel(normalizedId),
    });
  }

  for (const feature of COMMON_FEATURES) {
    if (!optionMap.has(feature.id)) {
      optionMap.set(feature.id, feature);
    }
  }

  for (const selectedFeature of selectedFeatures) {
    if (!optionMap.has(selectedFeature)) {
      optionMap.set(selectedFeature, {
        id: selectedFeature,
        label: formatFeatureLabel(selectedFeature),
      });
    }
  }

  const allFeatureOptions = Array.from(optionMap.values());
  const parsedLatitude = latitudeText ? Number(latitudeText) : Number.NaN;
  const parsedLongitude = longitudeText ? Number(longitudeText) : Number.NaN;
  const mapLatitude = Number.isNaN(parsedLatitude)
    ? DEFAULT_COORDS.lat
    : parsedLatitude;
  const mapLongitude = Number.isNaN(parsedLongitude)
    ? DEFAULT_COORDS.lng
    : parsedLongitude;
  const normalizedCityValue = selectedCity || "";
  const normalizedDistrictValue = selectedDistrict || "";
  const hasCurrentCityInOptions = Boolean(
    normalizedCityValue && cities?.some((city) => city.name === normalizedCityValue),
  );
  const hasCurrentDistrictInOptions = Boolean(
    normalizedDistrictValue &&
      districts?.some((districtName) => districtName === normalizedDistrictValue),
  );
  const setCoordinateFields = (coords: { lat: number; lng: number }) => {
    form.setValue("latitude", String(coords.lat), {
      shouldDirty: true,
      shouldValidate: true,
    })
    form.setValue("longitude", String(coords.lng), {
      shouldDirty: true,
      shouldValidate: true,
    })
  }
  const toggleFeature = (featureId: string, checked: boolean) => {
    const normalizedFeatureId = normalizeAmenitySlug(featureId);
    if (!normalizedFeatureId) return;

    const nextFeatures = checked
      ? [...selectedFeatures, normalizedFeatureId]
      : selectedFeatures.filter((value) => value !== normalizedFeatureId);

    form.setValue("features", normalizeFeatureList(nextFeatures), {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center space-x-4 mb-6">
        <Button variant="outline" size="icon" asChild>
          <Link href={`/places/${placeId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h2 className="text-3xl font-bold tracking-tight">Mekanı Düzenle</h2>
      </div>

       <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Mekan Görselleri</CardTitle>
                      <CardDescription>Mekanınıza ait görselleri yükleyin. İlk görsel ana görsel olacaktır.</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <FormField
                        control={form.control}
                        name="images"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <GalleryUpload
                                value={field.value?.map((image) => image) || []}
                                onChange={(newImages) => field.onChange(newImages)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Temel Bilgiler</CardTitle>
                            <CardDescription>Mekanın adı, türü ve açıklaması.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Mekan Adı</FormLabel>
                                    <FormControl><Input placeholder="Örn: Grand İstanbul Hotel" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="kind"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Yer Türü</FormLabel>
                                  <FormControl>
                                    <PlaceKindSelect
                                      value={selectedKind || field.value || rawKindFromPlace}
                                      onValueChange={field.onChange}
                                      kinds={placeKinds}
                                      disabled={isKindsLoading}
                                      includeUnknownValue
                                      unknownLabel={
                                        place?.kindName ||
                                        place?.categoryName ||
                                        place?.kindSlug ||
                                        place?.categorySlug ||
                                        place?.kind ||
                                        place?.categoryId ||
                                        "Mevcut Tür"
                                      }
                                    />
                                  </FormControl>
                                  <PlaceKindCapabilities
                                    kindId={selectedKind}
                                    kinds={placeKinds}
                                  />
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Durum</FormLabel>
                                        <Select
                                          key={`status-${field.value ?? "empty"}`}
                                          name={field.name}
                                          onValueChange={field.onChange}
                                          value={field.value || ""}
                                        >
                                            <FormControl><SelectTrigger><SelectValue placeholder="Seçiniz" /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                {field.value &&
                                                  !STATUS_OPTIONS.includes(field.value) && (
                                                  <SelectItem value={field.value}>
                                                    {field.value}
                                                  </SelectItem>
                                                )}
                                                <SelectItem value="active">Aktif</SelectItem>
                                                <SelectItem value="pending">Beklemede</SelectItem>
                                                <SelectItem value="suspended">Askıya Alınmış</SelectItem>
                                                <SelectItem value="inactive">Pasif</SelectItem>
                                                <SelectItem value="rejected">Reddedildi</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="shortDescription"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Kısa Açıklama (Opsiyonel)</FormLabel>
                                    <FormControl><Input placeholder="Listelerde görünecek kısa özet" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Detaylı Açıklama</FormLabel>
                                    <FormControl>
                                        <TiptapEditor
                                            value={field.value}
                                            onChange={field.onChange}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>
                </div>

                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>İşletme Belgesi (PDF)</CardTitle>
                            <CardDescription>
                              Mekan doğrulama süreci için işletme belgesini görüntüleyin veya güncelleyin.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <FormField
                            control={form.control}
                            name="businessDocumentFileId"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input type="hidden" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {businessDocument ? (
                            <div className="rounded-lg border p-3">
                              <div className="flex items-center gap-2 text-sm font-medium">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <span className="truncate">{businessDocument.filename}</span>
                              </div>
                              <div className="mt-3 flex gap-2">
                                <Button type="button" size="sm" variant="outline" asChild>
                                  <a href={businessDocument.url} target="_blank" rel="noreferrer">
                                    Görüntüle
                                  </a>
                                </Button>
                                <Button type="button" size="sm" variant="outline" asChild>
                                  <a href={businessDocument.url} download>
                                    İndir
                                  </a>
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                              Henüz işletme belgesi yüklenmemiş.
                            </div>
                          )}

                          <label className="inline-flex">
                            <Input
                              type="file"
                              accept="application/pdf"
                              className="hidden"
                              onChange={handleBusinessDocumentUpload}
                              disabled={isBusinessDocumentUploading}
                            />
                            <Button type="button" variant="outline" disabled={isBusinessDocumentUploading} asChild>
                              <span>
                                {isBusinessDocumentUploading ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Yükleniyor...
                                  </>
                                ) : (
                                  <>
                                    <Upload className="mr-2 h-4 w-4" />
                                    Belge Güncelle
                                  </>
                                )}
                              </span>
                            </Button>
                          </label>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>İletişim Bilgileri</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField
                                control={form.control}
                                name="contactInfo.phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Telefon</FormLabel>
                                        <FormControl><Input placeholder="+90 555 ..." {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="contactInfo.email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>E-posta</FormLabel>
                                        <FormControl><Input placeholder="info@..." {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="contactInfo.website"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Web Sitesi</FormLabel>
                                        <FormControl><Input placeholder="https://..." {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Konum Bilgileri</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <FormField
                                control={form.control}
                                name="address"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Açık Adres</FormLabel>
                                        <FormControl><Textarea placeholder="Tam adres..." {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="city"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Şehir</FormLabel>
                                            <Select
                                                key={`city-${field.value ?? "empty"}-${cities?.length ?? 0}`}
                                                name={field.name}
                                                onValueChange={(val) => {
                                                    field.onChange(val)
                                                    form.setValue("district", "", {
                                                      shouldDirty: true,
                                                      shouldValidate: true,
                                                    })

                                                    const selectedCity = cities?.find(
                                                      (city) => city.name === val,
                                                    )
                                                    const cityCoordinates = parseCoordinates(
                                                      selectedCity
                                                        ? {
                                                            latitude: selectedCity.latitude,
                                                            longitude: selectedCity.longitude,
                                                          }
                                                        : null,
                                                    )

                                                    if (cityCoordinates) {
                                                      setCoordinateFields(cityCoordinates)
                                                    }
                                                }}
                                                value={field.value || ""}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Şehir seçin" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="z-[1200]">
                                                    {field.value && !hasCurrentCityInOptions && (
                                                        <SelectItem value={field.value}>
                                                            {field.value}
                                                        </SelectItem>
                                                    )}
                                                    {cities?.map((city) => (
                                                        <SelectItem key={city.id} value={city.name}>
                                                            {city.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="district"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>İlçe</FormLabel>
                                            <Select
                                                key={`district-${field.value ?? "empty"}-${normalizedCityValue}-${districts?.length ?? 0}`}
                                                name={field.name}
                                                onValueChange={(val) => {
                                                  field.onChange(val)

                                                  const selectedDistrict = districtData?.districtItems.find(
                                                    (district) => district.name === val,
                                                  )
                                                  const districtCoordinates = parseCoordinates(
                                                    selectedDistrict
                                                      ? {
                                                          latitude: selectedDistrict.latitude,
                                                          longitude: selectedDistrict.longitude,
                                                        }
                                                      : null,
                                                  )

                                                  if (districtCoordinates) {
                                                    setCoordinateFields(districtCoordinates)
                                                    return
                                                  }

                                                  const requestCity = normalizedCityValue
                                                  const requestDistrict = val
                                                  if (!requestCity || !requestDistrict) return

                                                  void queryClient
                                                    .fetchQuery({
                                                      queryKey: getDistrictCenterQueryKey(
                                                        requestCity,
                                                        requestDistrict,
                                                      ),
                                                      queryFn: () =>
                                                        fetchDistrictCenter(
                                                          requestCity,
                                                          requestDistrict,
                                                        ),
                                                      staleTime: 1000 * 60 * 60 * 24,
                                                    })
                                                    .then((center) => {
                                                      if (!center) return

                                                      const currentCity = form.getValues("city")
                                                      const currentDistrict =
                                                        form.getValues("district")

                                                      if (
                                                        currentCity !== requestCity ||
                                                        currentDistrict !== requestDistrict
                                                      ) {
                                                        return
                                                      }

                                                      setCoordinateFields(center)
                                                    })
                                                }}
                                                value={field.value || ""}
                                                disabled={!normalizedCityValue}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder={normalizedCityValue ? "İlçe seçin" : "Önce şehir seçin"} />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent className="z-[1200]">
                                                    {field.value && !hasCurrentDistrictInOptions && (
                                                        <SelectItem value={field.value}>
                                                            {field.value}
                                                        </SelectItem>
                                                    )}
                                                    {districts?.map((district) => (
                                                        <SelectItem key={district} value={district}>
                                                            {district}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                           <div className="space-y-3">
                                <div className="text-sm text-muted-foreground">
                                  Harita üzerinden konumu tıklayarak pin bırakın.
                                </div>
                                <CoordinateMapPicker
                                  latitude={mapLatitude}
                                  longitude={mapLongitude}
                                  onChange={({ lat, lng }) => {
                                    setCoordinateFields({ lat, lng })
                                  }}
                                />
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="latitude"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Enlem (Latitude)</FormLabel>
                                            <FormControl><Input placeholder="41.0082" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="longitude"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Boylam (Longitude)</FormLabel>
                                            <FormControl><Input placeholder="28.9784" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Diğer Bilgiler</CardTitle>
                        </CardHeader>
                         <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="priceLevel"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Fiyat Seviyesi (1-4)</FormLabel>
                                            <Select
                                              key={`priceLevel-${field.value ?? "empty"}`}
                                              name={field.name}
                                              onValueChange={field.onChange}
                                              value={field.value}
                                            >
                                            <FormControl><SelectTrigger><SelectValue placeholder="Seviye" /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="budget">$ (Ucuz)</SelectItem>
                                                <SelectItem value="moderate">$$ (Orta)</SelectItem>
                                                <SelectItem value="expensive">$$$ (Pahalı)</SelectItem>
                                                <SelectItem value="luxury">$$$$ (Lüks)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                 <FormField
                                    control={form.control}
                                    name="nightlyPrice"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Gecelik Fiyat (Ops.)</FormLabel>
                                            <FormControl><Input placeholder="1500 ₺" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                         </CardContent>
                    </Card>

                     <Card>
                        <CardHeader>
                            <CardTitle>Özellikler</CardTitle>
                            <CardDescription>Mekanınızda bulunan olanakları seçin.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <FormField
                                control={form.control}
                                name="features"
                                render={() => (
                                    <FormItem>
                                        <div className="grid grid-cols-2 gap-4">
                                            {allFeatureOptions.map((feature) => (
                                                <label
                                                  key={feature.id}
                                                  className="flex cursor-pointer items-center gap-3 rounded-md border border-border p-3"
                                                >
                                                  <Checkbox
                                                    checked={selectedFeatureSet.has(feature.id)}
                                                    onCheckedChange={(checked) =>
                                                      toggleFeature(feature.id, checked === true)
                                                    }
                                                  />
                                                  <span className="text-sm font-medium leading-none">
                                                    {feature.label}
                                                  </span>
                                                </label>
                                            ))}
                                        </div>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>

            <div className="flex justify-end">
                <Button type="submit" size="lg" disabled={isUpdating}>
                    {isUpdating ? "Güncelleniyor..." : "Değişiklikleri Kaydet"}
                </Button>
            </div>
        </form>
      </Form>
    </div>
  )
}
