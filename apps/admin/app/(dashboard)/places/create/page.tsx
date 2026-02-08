"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useMemo, useState } from "react"
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
import { useCreatePlace } from "@/hooks/use-places"
import { useCategories } from "@/hooks/use-categories"
import { useCities, useDistricts } from "@/hooks/use-locations"
import { useUsers } from "@/hooks/use-users"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { GalleryUpload } from "@/components/ui/gallery-upload"
import { CoordinateMapPicker } from "@/components/ui/coordinate-map-picker"

const formSchema = z.object({
  images: z.array(z.string()).optional(),
  name: z.string().min(2, "Mekan adı en az 2 karakter olmalıdır"),
  type: z.string().min(1, "Tip seçimi zorunludur"),
  category: z.string().optional(), // Make optional string
  categoryId: z.string().min(1, "Kategori seçimi zorunludur"),
  description: z.string().min(10, "Açıklama en az 10 karakter olmalıdır"),
  shortDescription: z.string().max(160, "Kısa açıklama 160 karakteri geçemez").optional(),
  address: z.string().min(5, "Adres zorunludur"),
  city: z.string().min(2, "Şehir zorunludur"),
  district: z.string().min(2, "İlçe zorunludur"),
  ownerId: z.string().min(1, "Mekan sahibi seçimi zorunludur"),
  latitude: z.string().optional(), // In production convert to number
  longitude: z.string().optional(),
  priceLevel: z.string().optional(), // 1-4 scale usually
  nightlyPrice: z.string().optional(),
})

const DEFAULT_COORDS = { lat: 39.0, lng: 35.0 }

export default function CreatePlacePage() {
  const router = useRouter()
  const { mutate: createPlace, isPending } = useCreatePlace()
  const { data: categories } = useCategories()
  const { data: cities } = useCities()
  const [ownerSearchInput, setOwnerSearchInput] = useState("")
  const [ownerSearch, setOwnerSearch] = useState("")
  const [ownerPage, setOwnerPage] = useState(1)
  const [selectedOwnerSnapshot, setSelectedOwnerSnapshot] = useState<{
    id: string
    name: string
    email: string
  } | null>(null)

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setOwnerSearch(ownerSearchInput.trim())
      setOwnerPage(1)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [ownerSearchInput])

  const ownerParams = useMemo(
    () => ({
      page: String(ownerPage),
      limit: "20",
      search: ownerSearch || undefined,
      role: "owner",
      status: "active",
      sortBy: "name",
      sortOrder: "asc" as const,
    }),
    [ownerPage, ownerSearch],
  )

  const { data: ownersData, isLoading: isOwnersLoading } = useUsers(ownerParams)
  const owners = useMemo(() => ownersData?.users ?? [], [ownersData?.users])
  const ownerPagination = ownersData?.pagination

  useEffect(() => {
    const totalPages = Math.max(ownerPagination?.totalPages ?? 1, 1)
    if (ownerPage > totalPages) {
      setOwnerPage(totalPages)
    }
  }, [ownerPage, ownerPagination?.totalPages])
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      images: [],
      name: "",
      type: "hotel",
      category: "", // Legacy
      categoryId: "",
      description: "",
      shortDescription: "",
      address: "",
      city: "",
      district: "",
      ownerId: "",
      priceLevel: "moderate",
      latitude: "",
      longitude: "",
      nightlyPrice: "",
    },
  })
  const selectedOwnerId = form.watch("ownerId")

  useEffect(() => {
    if (!selectedOwnerId) {
      return
    }

    const matchedOwner = owners.find((owner) => owner.id === selectedOwnerId)
    if (matchedOwner) {
      setSelectedOwnerSnapshot({
        id: matchedOwner.id,
        name: matchedOwner.name,
        email: matchedOwner.email,
      })
    }
  }, [owners, selectedOwnerId])

  const watchedCity = form.watch("city")
  const { data: districts } = useDistricts(watchedCity)

  function onSubmit(values: z.infer<typeof formSchema>) {
    const parsedLat = Number(values.latitude)
    const parsedLng = Number(values.longitude)
    const hasValidCoordinates =
      !Number.isNaN(parsedLat) && !Number.isNaN(parsedLng)

    // Transform values for API
    const apiData = {
        ...values,
        category: categories?.find(c => c.id === values.categoryId)?.name || values.category || "", // Fallback
        location: hasValidCoordinates
          ? { lat: parsedLat, lng: parsedLng }
          : undefined,
        priceLevel: values.priceLevel || undefined,
    }

    createPlace(apiData, {
      onSuccess: () => {
        toast.success("Mekan başarıyla oluşturuldu")
        router.push("/places")
      },
      onError: (error: Error) => {
        toast.error(error.message || "Mekan oluşturulurken bir hata oluştu")
      }
    })
  }

  const latitudeText = form.watch("latitude")
  const longitudeText = form.watch("longitude")
  const parsedLatitude = latitudeText ? Number(latitudeText) : Number.NaN
  const parsedLongitude = longitudeText ? Number(longitudeText) : Number.NaN
  const mapLatitude = Number.isNaN(parsedLatitude)
    ? DEFAULT_COORDS.lat
    : parsedLatitude
  const mapLongitude = Number.isNaN(parsedLongitude)
    ? DEFAULT_COORDS.lng
    : parsedLongitude

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center space-x-4 mb-6">
        <Button variant="outline" size="icon" asChild>
          <Link href="/places">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h2 className="text-3xl font-bold tracking-tight">Yeni Mekan Ekle</h2>
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
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Seçiniz" /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="hotel">Otel</SelectItem>
                                                <SelectItem value="restaurant">Restoran</SelectItem>
                                                <SelectItem value="activity">Aktivite</SelectItem>
                                                <SelectItem value="museum">Müze</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="categoryId"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Kategori</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Kategori Seçiniz" /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                {categories?.map((cat) => (
                                                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                                ))}
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
                        <FormField
                            control={form.control}
                            name="ownerId"
                            render={({ field }) => {
                              const hasSelectedOwnerInCurrentPage = owners.some(
                                (owner) => owner.id === field.value,
                              )
                              const totalPages = Math.max(ownerPagination?.totalPages ?? 1, 1)
                              const canGoPrev = ownerPage > 1
                              const canGoNext = ownerPage < totalPages

                              return (
                                <FormItem>
                                  <FormLabel>Mekan Sahibi</FormLabel>
                                  <div className="space-y-3">
                                    <Input
                                      value={ownerSearchInput}
                                      onChange={(event) =>
                                        setOwnerSearchInput(event.target.value)
                                      }
                                      placeholder="İsim veya e-posta ile ara"
                                    />
                                    <Select
                                      onValueChange={field.onChange}
                                      value={field.value}
                                    >
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue
                                            placeholder={
                                              isOwnersLoading
                                                ? "Mekan sahipleri yükleniyor..."
                                                : "Mekan sahibi seçin"
                                            }
                                          />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {selectedOwnerSnapshot &&
                                          !hasSelectedOwnerInCurrentPage && (
                                            <SelectItem value={selectedOwnerSnapshot.id}>
                                              {selectedOwnerSnapshot.name} ({selectedOwnerSnapshot.email})
                                            </SelectItem>
                                          )}
                                        {owners.length === 0 ? (
                                          <SelectItem value="__no_results__" disabled>
                                            Sonuç bulunamadı
                                          </SelectItem>
                                        ) : (
                                          owners.map((owner) => (
                                            <SelectItem key={owner.id} value={owner.id}>
                                              {owner.name} ({owner.email})
                                            </SelectItem>
                                          ))
                                        )}
                                      </SelectContent>
                                    </Select>
                                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                                      <div className="inline-flex items-center gap-1">
                                        {isOwnersLoading && (
                                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        )}
                                        <span>
                                          Toplam {ownerPagination?.total ?? 0} mekan sahibi
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          onClick={() => setOwnerPage((prev) => Math.max(1, prev - 1))}
                                          disabled={isOwnersLoading || !canGoPrev}
                                        >
                                          Önceki
                                        </Button>
                                        <span>
                                          Sayfa {ownerPagination?.page ?? ownerPage}/{totalPages}
                                        </span>
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          onClick={() =>
                                            setOwnerPage((prev) => Math.min(totalPages, prev + 1))
                                          }
                                          disabled={isOwnersLoading || !canGoNext}
                                        >
                                          Sonraki
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                  <FormMessage />
                                </FormItem>
                              )
                            }}
                        />
                    </CardContent>
                </Card>
                </div>

                <div className="space-y-4">
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
                                            <Select onValueChange={(val) => {
                                                field.onChange(val)
                                                form.setValue("district", "") // Reset district when city changes
                                            }} value={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Şehir seçin" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
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
                                            <Select onValueChange={field.onChange} value={field.value} disabled={!watchedCity}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder={watchedCity ? "İlçe seçin" : "Önce şehir seçin"} />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
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
                                            <Select onValueChange={field.onChange} value={field.value}>
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
                </div>
            </div>

            <div className="flex justify-end">
                <Button type="submit" size="lg" disabled={isPending}>
                    {isPending ? "Oluşturuluyor..." : "Mekanı Oluştur"}
                </Button>
            </div>
        </form>
      </Form>
    </div>
  )
}
