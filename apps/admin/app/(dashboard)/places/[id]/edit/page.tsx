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
  status: z.enum(["active", "inactive", "pending", "suspended"])
})

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
    },
  })

  const watchedCity = form.watch("city")
  const { data: cities } = useCities()
  const { data: districts } = useDistricts(watchedCity)

  useEffect(() => {
    if (place) {
      form.reset({
        name: place.name,
        type: place.type,
        category: place.category,
        categoryId: place.categoryId || "", // Set categoryId if available
        description: place.description,
        shortDescription: place.shortDescription || "",
        address: place.address,
        city: place.city,
        district: place.district,
        latitude: place.location?.coordinates?.[1]?.toString() || "",
        longitude: place.location?.coordinates?.[0]?.toString() || "",
        priceLevel: place.priceLevel?.toString() || "",
        nightlyPrice: place.nightlyPrice || "",
        status: place.status,
        images: place.images || [],
      })
    }
  }, [place, form])

  function onSubmit(values: z.infer<typeof formSchema>) {
    const apiData = {
        ...values,
        location: values.latitude && values.longitude ? { type: "Point", coordinates: [parseFloat(values.longitude), parseFloat(values.latitude)] } : undefined,
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
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                                name="status"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Durum</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Seçiniz" /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                <SelectItem value="active">Aktif</SelectItem>
                                                <SelectItem value="pending">Beklemede</SelectItem>
                                                <SelectItem value="suspended">Askıya Alınmış</SelectItem>
                                                <SelectItem value="inactive">Pasif</SelectItem>
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
                                    <Select onValueChange={field.onChange} value={field.value || ""}>
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
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                <Button type="submit" size="lg" disabled={isUpdating}>
                    {isUpdating ? "Güncelleniyor..." : "Değişiklikleri Kaydet"}
                </Button>
            </div>
        </form>
      </Form>
    </div>
  )
}