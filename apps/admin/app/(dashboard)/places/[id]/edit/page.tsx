"use client"

import { zodResolver } from "@hookform/resolvers/zod"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { usePlace, useUpdatePlace } from "@/hooks/use-places"
import { useCategories } from "@/hooks/use-categories"
import { useCities, useDistricts } from "@/hooks/use-locations"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useEffect } from "react"
import { GalleryUpload } from "@/components/ui/gallery-upload"
import { Skeleton } from "@/components/ui/skeleton"
import { CoordinateMapPicker } from "@/components/ui/coordinate-map-picker"

const formSchema = z.object({
  images: z.array(z.string()).optional(),
  name: z.string().min(2, "Mekan adı en az 2 karakter olmalıdır"),
  type: z.string().min(1, "Tip seçimi zorunludur"),
  category: z.string().optional(),
  categoryId: z.string().min(1, "Kategori seçimi zorunludur"),
  description: z.string().min(10, "Açıklama en az 10 karakter olmalıdır"),
  shortDescription: z.string().max(160, "Kısa açıklama 160 karakteri geçemez").optional(),
  address: z.string().min(5, "Adres zorunludur"),
  city: z.string().min(2, "Şehir zorunludur"),
  district: z.string().min(2, "İlçe zorunludur"),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  priceLevel: z.string().optional(),
  nightlyPrice: z.string().optional(),
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
    { id: "room_service", label: "Oda Servisi" },
    { id: "air_conditioning", label: "Klima" },
    { id: "heating", label: "Isıtma" },
    { id: "sea_view", label: "Deniz Manzarası" },
    { id: "beach_access", label: "Plaja Erişim" },
    { id: "pet_friendly", label: "Evcil Hayvan Dostu" },
    { id: "wheelchair_accessible", label: "Engelli Erişimi" },
    { id: "family_friendly", label: "Aile Dostu" },
];

const DEFAULT_COORDS = { lat: 39.0, lng: 35.0 };
const TYPE_OPTIONS = [
  { value: "hotel", label: "Otel" },
  { value: "restaurant", label: "Restoran" },
  { value: "cafe", label: "Kafe" },
  { value: "activity", label: "Aktivite" },
  { value: "attraction", label: "Gezi Noktası" },
  { value: "transport", label: "Ulaşım" },
];
const PRICE_LEVEL_OPTIONS = ["budget", "moderate", "expensive", "luxury"];
const STATUS_OPTIONS = ["active", "pending", "suspended", "inactive", "rejected"];

function parseLocationInput(input: unknown): { lat: string; lng: string } {
  if (!input) return { lat: "", lng: "" };

  let value = input as any;
  if (typeof input === "string") {
    try {
      value = JSON.parse(input);
    } catch {
      return { lat: "", lng: "" };
    }
  }

  const directLat = Number(value?.lat);
  const directLng = Number(value?.lng);
  if (!Number.isNaN(directLat) && !Number.isNaN(directLng)) {
    return { lat: String(directLat), lng: String(directLng) };
  }

  const coordLng = Number(value?.coordinates?.[0]);
  const coordLat = Number(value?.coordinates?.[1]);
  if (!Number.isNaN(coordLat) && !Number.isNaN(coordLng)) {
    return { lat: String(coordLat), lng: String(coordLng) };
  }

  return { lat: "", lng: "" };
}

export default function EditPlacePage() {
  const router = useRouter()
  const params = useParams()
  const placeId = params.id as string

  const { data: place, isLoading: isPlaceLoading } = usePlace(placeId)
  const { mutate: updatePlace, isPending: isUpdating } = useUpdatePlace()
  const { data: categories } = useCategories()


  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      images: [],
      name: "",
      type: "hotel",
      category: "",
      categoryId: "",
      description: "",
      shortDescription: "",
      address: "",
      city: "",
      district: "",
      priceLevel: "",
      latitude: "",
      longitude: "",
      nightlyPrice: "",
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

  useEffect(() => {
    if (place) {
      const coords = parseLocationInput(place.location);
      const normalizedType = TYPE_OPTIONS.some((opt) => opt.value === place.type)
        ? place.type
        : "activity";
      const normalizedStatus: z.infer<typeof formSchema>["status"] =
        STATUS_OPTIONS.includes(place.status)
          ? (place.status as z.infer<typeof formSchema>["status"])
          : "pending";
      const normalizedPriceLevel = PRICE_LEVEL_OPTIONS.includes(place.priceLevel)
        ? place.priceLevel
        : "";
      const matchedCategoryId =
        place.categoryId ||
        categories?.find(
          (cat) =>
            cat.name.toLowerCase() === (place.category || "").toLowerCase() ||
            cat.slug.toLowerCase() === (place.categorySlug || "").toLowerCase(),
        )?.id ||
        "";
      form.reset({
        name: place.name,
        type: normalizedType,
        category: place.category,
        categoryId: matchedCategoryId,
        description: place.description,
        shortDescription: place.shortDescription || "",
        address: place.address,
        city: place.city,
        district: place.district,
        latitude: coords.lat,
        longitude: coords.lng,
        priceLevel: normalizedPriceLevel,
        nightlyPrice: place.nightlyPrice || "",
        status: normalizedStatus,
        images: place.images || [],
        contactInfo: {
            phone: place.contactInfo?.phone || "",
            email: place.contactInfo?.email || "",
            website: place.contactInfo?.website || "",
        },
        features: place.features || [],
      })
    }
  }, [place, form, categories])

  function onSubmit(values: z.infer<typeof formSchema>) {
    const parsedLat = Number(values.latitude);
    const parsedLng = Number(values.longitude);
    const hasValidCoordinates =
      !Number.isNaN(parsedLat) && !Number.isNaN(parsedLng);

    const apiData = {
        ...values,
        location: hasValidCoordinates
          ? { lat: parsedLat, lng: parsedLng }
          : undefined,
        priceLevel: values.priceLevel || undefined,
        category: categories?.find(c => c.id === values.categoryId)?.name || values.category || "", // Sync category name
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
  const selectedCategoryId = form.watch("categoryId");
  const selectedCity = form.watch("city");
  const selectedDistrict = form.watch("district");
  const parsedLatitude = latitudeText ? Number(latitudeText) : Number.NaN;
  const parsedLongitude = longitudeText ? Number(longitudeText) : Number.NaN;
  const mapLatitude = Number.isNaN(parsedLatitude)
    ? DEFAULT_COORDS.lat
    : parsedLatitude;
  const mapLongitude = Number.isNaN(parsedLongitude)
    ? DEFAULT_COORDS.lng
    : parsedLongitude;
  const hasCurrentCategoryInOptions = Boolean(
    selectedCategoryId &&
      categories?.some((cat) => cat.id === selectedCategoryId),
  );
  const normalizedCityValue = selectedCity || "";
  const normalizedDistrictValue = selectedDistrict || "";
  const hasCurrentCityInOptions = Boolean(
    normalizedCityValue && cities?.some((city) => city.name === normalizedCityValue),
  );
  const hasCurrentDistrictInOptions = Boolean(
    normalizedDistrictValue &&
      districts?.some((districtName) => districtName === normalizedDistrictValue),
  );

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
                            <CardDescription>Mekanın adı, tipi ve açıklaması.</CardDescription>
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
                                name="type"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Tip</FormLabel>
                                        <Select
                                          key={`type-${field.value ?? "empty"}`}
                                          name={field.name}
                                          onValueChange={field.onChange}
                                          value={field.value || ""}
                                        >
                                            <FormControl><SelectTrigger><SelectValue placeholder="Seçiniz" /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                {field.value &&
                                                  !TYPE_OPTIONS.some((option) => option.value === field.value) && (
                                                  <SelectItem value={field.value}>
                                                    {field.value}
                                                  </SelectItem>
                                                )}
                                                {TYPE_OPTIONS.map((option) => (
                                                  <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
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
                            name="categoryId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Kategori</FormLabel>
                                        <Select
                                          key={`category-${field.value ?? "empty"}-${categories?.length ?? 0}`}
                                          name={field.name}
                                          onValueChange={field.onChange}
                                          value={field.value || ""}
                                        >
                                            <FormControl><SelectTrigger><SelectValue placeholder="Kategori Seçiniz" /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                {field.value && !hasCurrentCategoryInOptions && (
                                                  <SelectItem value={field.value}>
                                                    {place.category || "Mevcut Kategori"}
                                                  </SelectItem>
                                                )}
                                                {categories?.map((cat) => (
                                                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
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
                                                    form.setValue("district", "") // Reset district when city changes
                                                }}
                                                value={field.value || ""}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Şehir seçin" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
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
                                                onValueChange={field.onChange}
                                                value={field.value || ""}
                                                disabled={!normalizedCityValue}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder={normalizedCityValue ? "İlçe seçin" : "Önce şehir seçin"} />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
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
                                    form.setValue("latitude", String(lat), {
                                      shouldDirty: true,
                                      shouldValidate: true,
                                    })
                                    form.setValue("longitude", String(lng), {
                                      shouldDirty: true,
                                      shouldValidate: true,
                                    })
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
                                            {COMMON_FEATURES.map((feature) => (
                                                <FormField
                                                    key={feature.id}
                                                    control={form.control}
                                                    name="features"
                                                    render={({ field }) => {
                                                        return (
                                                            <FormItem
                                                                key={feature.id}
                                                                className="flex flex-row items-start space-x-3 space-y-0"
                                                            >
                                                                <FormControl>
                                                                    <input
                                                                        type="checkbox"
                                                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                                                        checked={field.value?.includes(feature.id)}
                                                                        onChange={(checked) => {
                                                                            return checked.target.checked
                                                                                ? field.onChange([...(field.value || []), feature.id])
                                                                                : field.onChange(
                                                                                    field.value?.filter(
                                                                                        (value) => value !== feature.id
                                                                                    )
                                                                                )
                                                                        }}
                                                                    />
                                                                </FormControl>
                                                                <FormLabel className="font-normal">
                                                                    {feature.label}
                                                                </FormLabel>
                                                            </FormItem>
                                                        )
                                                    }}
                                                />
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
