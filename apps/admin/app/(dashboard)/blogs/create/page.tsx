"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useCreateBlog } from "@/hooks/use-blogs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useEffect } from "react"
import { ImageUpload } from "@/components/ui/image-upload"
import { TiptapEditor } from "@/components/ui/tiptap-editor"

const CATEGORIES = ["travel", "food", "culture", "history", "activity", "lifestyle", "business"] as const
const STATUSES = ["published", "draft", "pending_review", "archived"] as const
const LANGUAGES = ["tr", "en"] as const
const READING_LEVELS = ["easy", "medium", "hard"] as const
const AUDIENCES = ["travelers", "locals", "business_owners", "all"] as const

const blogFormSchema = z.object({
  title: z.string().min(2, {
    message: "Başlık en az 2 karakter olmalıdır.",
  }),
  slug: z.string().optional(),
  excerpt: z.string().optional(),
  content: z.string().min(10, {
    message: "İçerik en az 10 karakter olmalıdır.",
  }),
  category: z.enum(CATEGORIES),
  status: z.enum(STATUSES),
  language: z.enum(LANGUAGES),
  readingLevel: z.enum(READING_LEVELS),
  targetAudience: z.enum(AUDIENCES),
  heroImage: z.string().optional().or(z.literal("")),
  featuredImage: z.string().optional().or(z.literal("")),
  tags: z.string().optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  seoKeywords: z.string().optional(),
})

type BlogFormValues = z.infer<typeof blogFormSchema>

const defaultValues: BlogFormValues = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  category: "travel",
  status: "draft",
  language: "tr",
  readingLevel: "medium",
  targetAudience: "travelers",
  heroImage: "",
  featuredImage: "",
  tags: "",
  seoTitle: "",
  seoDescription: "",
  seoKeywords: "",
}

// Slug generation utility
const generateSlug = (text: string) => {
    return text
        .toString()
        .toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '');            // Trim - from end of text
}

export default function CreateBlogPage() {
  const router = useRouter()
  const { mutate: createBlog, isPending } = useCreateBlog()

  const form = useForm<BlogFormValues>({
    resolver: zodResolver(blogFormSchema) as any,
    defaultValues,
  })

  // Auto-generate slug from title
  const title = form.watch("title");
  useEffect(() => {
      if (title) {
          const slug = generateSlug(title);
          form.setValue("slug", slug, { shouldValidate: true });
      }
  }, [title, form]);

  function onSubmit(data: BlogFormValues) {
    const formattedData = {
      ...data,
      tags: data.tags ? data.tags.split(",").map(t => t.trim()) : [],
      seoKeywords: data.seoKeywords ? data.seoKeywords.split(",").map(t => t.trim()) : [],
    }

    createBlog(formattedData, {
      onSuccess: () => {
        toast.success("Blog yazısı başarıyla oluşturuldu")
        router.push("/blogs")
      },
      onError: (error) => {
        toast.error("Blog yazısı oluşturulurken bir hata oluştu: " + error.message)
      },
    })
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Yeni Blog Yazısı</h2>
      </div>
      <Separator />
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-2 space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Genel Bilgiler</CardTitle>
                        <CardDescription>Blog yazısının temel içeriğini giriniz.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Başlık</FormLabel>
                                <FormControl>
                                <Input placeholder="Blog yazısı başlığı..." {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="slug"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>URL Yolu (Slug)</FormLabel>
                                <FormControl>
                                <Input placeholder="ornek-blog-yazisi" {...field} />
                                </FormControl>
                                <FormDescription>Başlığa göre otomatik oluşturulur.</FormDescription>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="excerpt"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Özet</FormLabel>
                                <FormControl>
                                <Textarea className="min-h-[100px]" placeholder="Kısa özet..." {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="content"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>İçerik</FormLabel>
                                <FormControl>
                                    <TiptapEditor
                                        value={field.value}
                                        onChange={(val) => field.onChange(val)}
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
                        <CardTitle>Görseller</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <FormField
                            control={form.control}
                            name="heroImage"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Kapak Görseli</FormLabel>
                                <FormControl>
                                    <ImageUpload 
                                        value={field.value} 
                                        onChange={field.onChange}
                                        onRemove={() => field.onChange("")}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="featuredImage"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Öne Çıkan Görsel</FormLabel>
                                <FormControl>
                                     <ImageUpload 
                                        value={field.value} 
                                        onChange={field.onChange}
                                        onRemove={() => field.onChange("")}
                                        label="Öne Çıkan Görsel Yükle"
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
                        <CardTitle>SEO Ayarları</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <FormField
                            control={form.control}
                            name="seoTitle"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>SEO Başlığı</FormLabel>
                                <FormControl>
                                <Input placeholder="Meta title..." {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="seoDescription"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>SEO Açıklaması</FormLabel>
                                <FormControl>
                                <Textarea placeholder="Meta description..." {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="seoKeywords"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>SEO Anahtar Kelimeler</FormLabel>
                                <FormControl>
                                <Input placeholder="virgül ile ayırın: seyahat, tatil, otel" {...field} />
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
                        <CardTitle>Yayın Ayarları</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Durum</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                    <SelectValue placeholder="Durum seçiniz" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="draft">Taslak</SelectItem>
                                    <SelectItem value="published">Yayında</SelectItem>
                                    <SelectItem value="pending_review">İncelemede</SelectItem>
                                    <SelectItem value="archived">Arşivlendi</SelectItem>
                                </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="category"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Kategori</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                    <SelectValue placeholder="Kategori seçiniz" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="travel">Seyahat</SelectItem>
                                    <SelectItem value="food">Yeme & İçme</SelectItem>
                                    <SelectItem value="culture">Kültür</SelectItem>
                                    <SelectItem value="history">Tarih</SelectItem>
                                    <SelectItem value="activity">Aktivite</SelectItem>
                                    <SelectItem value="lifestyle">Yaşam Tarzı</SelectItem>
                                    <SelectItem value="business">İş Dünyası</SelectItem>
                                </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="language"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Dil</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                    <SelectValue placeholder="Dil seçiniz" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="tr">Türkçe</SelectItem>
                                    <SelectItem value="en">İngilizce</SelectItem>
                                </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="tags"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Etiketler</FormLabel>
                                <FormControl>
                                <Input placeholder="virgül ile ayırın: gezi, istanbul" {...field} />
                                </FormControl>
                                <FormDescription>
                                    İçerikle ilgili etiketler.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle>Hedefleme</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <FormField
                            control={form.control}
                            name="readingLevel"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Okuma Seviyesi</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                    <SelectValue placeholder="Seviye seçiniz" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="easy">Kolay</SelectItem>
                                    <SelectItem value="medium">Orta</SelectItem>
                                    <SelectItem value="hard">Zor</SelectItem>
                                </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="targetAudience"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Hedef Kitle</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                    <SelectValue placeholder="Kitle seçiniz" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="travelers">Gezginler</SelectItem>
                                    <SelectItem value="locals">Yerel Halk</SelectItem>
                                    <SelectItem value="business_owners">İşletme Sahipleri</SelectItem>
                                    <SelectItem value="all">Herkes</SelectItem>
                                </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button type="button" variant="outline" className="mr-4" onClick={() => router.back()}>
              İptal
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Oluşturuluyor..." : "Oluştur"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}