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
import { useRouter, useParams } from "next/navigation"
import { useBlog, useUpdateBlog } from "@/hooks/use-blogs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useEffect } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { ImageUpload } from "@/components/ui/image-upload"
import { TiptapEditor } from "@/components/ui/tiptap-editor"
import { TagsInput } from "@/components/ui/tags-input"

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
  tags: z.array(z.string()).default([]),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  seoKeywords: z.array(z.string()).default([]),
})

type BlogFormValues = z.infer<typeof blogFormSchema>

const generateSlug = (text: string) => {
    return text
        .toString()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

export default function EditBlogPage() {
  const router = useRouter()
  const params = useParams()
  const postId = params.id as string

  const { data: blog, isLoading } = useBlog(postId)
  const { mutate: updateBlog, isPending } = useUpdateBlog()

  const form = useForm<BlogFormValues>({
    resolver: zodResolver(blogFormSchema) as any,
    defaultValues: {
      status: "draft",
      language: "tr",
      readingLevel: "medium",
      targetAudience: "travelers",
      category: "travel",
      content: "",
    },
  })

  // Pre-fill form when data is loaded
  useEffect(() => {
    if (blog) {
        // Tags and seoKeywords are already parsed as arrays by the API
        const parseTags = Array.isArray(blog.tags) ? blog.tags : [];
        const parseKeywords = Array.isArray(blog.seoKeywords) ? blog.seoKeywords : [];

        form.reset({
            title: blog.title,
            slug: blog.slug,
            excerpt: blog.excerpt || "",
            content: blog.content || "",
            category: blog.category,
            status: blog.status,
            language: blog.language,
            readingLevel: blog.readingLevel,
            targetAudience: blog.targetAudience,
            heroImage: blog.heroImage || "",
            featuredImage: blog.featuredImage || "",
            tags: parseTags,
            seoTitle: blog.seoTitle || "",
            seoDescription: blog.seoDescription || "",
            seoKeywords: parseKeywords,
        })
    }
  }, [blog, form])

  // Auto-generate slug from title
  const title = form.watch("title");
  
  // NOTE: For edit page, we might NOT want to auto-update slug if it already exists to preserve SEO.
  // However, the user request "Update slug according to title" was explicit.
  // I will make it so it updates ONLY if the slug field is pristine (not touched by user in this session) OR if we assume user wants this behavior.
  // A safer approach for Edit page: Only update if slug is empty, OR provide a button.
  // But given standard "CMS" behavior requested in a rush, I will add it but maybe check if title changed?
  // Actually, standard behavior in many simple CMS is: if I change title, I might want slug to change.
  // I will add the effect but verify it doesn't loop. All good.
  
  useEffect(() => {
      // Only update slug if the form is dirty (meaning user typed title)
      // We don't want to overwrite the existing slug on initial load
      if (form.getFieldState("title").isDirty && title) {
          const slug = generateSlug(title);
          form.setValue("slug", slug, { shouldValidate: true });
      }
  }, [title, form]);


  function onSubmit(data: BlogFormValues) {
    // Tags and seoKeywords are already arrays from the form
    updateBlog({ postId, data }, {
      onSuccess: () => {
        toast.success("Blog yazısı başarıyla güncellendi")
      },
      onError: (error) => {
        toast.error("Güncelleme hatası: " + error.message)
      },
    })
  }

  if (isLoading) {
    return (
        <div className="space-y-4 p-8">
            <div className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-[250px]" />
                    <Skeleton className="h-4 w-[200px]" />
                </div>
            </div>
            <Skeleton className="h-[400px] w-full" />
        </div>
    )
  }

  if (!blog) {
      return <div className="p-8">Blog yazısı bulunamadı.</div>
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Blog Yazısını Düzenle</h2>
      </div>
      <Separator />
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-2 space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Genel Bilgiler</CardTitle>
                        <CardDescription>Blog yazısının temel içeriğini düzenleyiniz.</CardDescription>
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
                                <FormDescription>Başlığa göre otomatik güncellenir (Başlık değişince).</FormDescription>
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
                                    <TagsInput
                                        value={field.value || []}
                                        onChange={field.onChange}
                                        placeholder="Kelime ekle..."
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
                        <CardTitle>Yayın Ayarları</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Durum</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
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
                                <Select onValueChange={field.onChange} value={field.value}>
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
                                <Select onValueChange={field.onChange} value={field.value}>
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
                                    <TagsInput
                                        value={field.value || []}
                                        onChange={field.onChange}
                                        placeholder="Etiket ekle..."
                                    />
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
                                <Select onValueChange={field.onChange} value={field.value}>
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
                                <Select onValueChange={field.onChange} value={field.value}>
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
              Vazgeç
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Güncelleniyor..." : "Güncelle"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}