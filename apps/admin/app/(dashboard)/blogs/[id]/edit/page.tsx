"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  Save,
  FileText,
  Plus,
  X,
  User,
  Calendar,
  Clock,
  Tag,
  Search
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

const blogEditSchema = z.object({
  title: z.string().min(1, "Başlık zorunludur"),
  slug: z.string().min(1, "Slug zorunludur"),
  excerpt: z.string().min(10, "Özet en az 10 karakter olmalıdır"),
  content: z.string().min(50, "İçerik en az 50 karakter olmalıdır"),
  status: z.enum(["PUBLISHED", "DRAFT", "ARCHIVED", "SCHEDULED"]),
  featured: z.boolean(),
  category: z.string().min(1, "Kategori zorunludur"),
  tags: z.array(z.string()),
  coverImage: z.string().optional(),
  readTime: z.number().min(1, "Okuma süresi en az 1 dakika olmalıdır"),
  publishedAt: z.string().optional(),
  seoTitle: z.string().min(1, "SEO başlığı zorunludur"),
  seoDescription: z.string().min(10, "SEO açıklaması en az 10 karakter olmalıdır"),
  seoKeywords: z.array(z.string()),
})

type BlogEditForm = z.infer<typeof blogEditSchema>

interface Blog {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  author: {
    id: string
    name: string
    email: string
    avatar: string | null
  }
  status: "PUBLISHED" | "DRAFT" | "ARCHIVED" | "SCHEDULED"
  featured: boolean
  category: string
  tags: string[]
  coverImage: string | null
  readTime: number
  publishedAt: string
  createdAt: string
  updatedAt: string
  stats: {
    views: number
    likes: number
    comments: number
    shares: number
  }
  seo: {
    title: string
    description: string
    keywords: string[]
  }
}

export default function BlogEditPage() {
  const params = useParams()
  const router = useRouter()
  const [blog, setBlog] = useState<Blog | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newTag, setNewTag] = useState("")
  const [newKeyword, setNewKeyword] = useState("")

  const form = useForm<BlogEditForm>({
    resolver: zodResolver(blogEditSchema),
    defaultValues: {
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      status: "DRAFT",
      featured: false,
      category: "",
      tags: [],
      coverImage: "",
      readTime: 5,
      publishedAt: "",
      seoTitle: "",
      seoDescription: "",
      seoKeywords: [],
    },
  })

  // Generate slug from title
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9ğüşıöç\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-')
  }

  // Update slug when title changes
  const handleTitleChange = (title: string) => {
    form.setValue("title", title)
    if (!form.getValues("slug") || form.getValues("slug") === generateSlug(form.watch("title"))) {
      form.setValue("slug", generateSlug(title))
    }
  }

  useEffect(() => {
    const fetchBlog = async () => {
      try {
        setLoading(true)
        // Simulate API call to fetch blog details
        await new Promise(resolve => setTimeout(resolve, 1000))

        // Mock blog data - in real app, this would be an API call
        const mockBlog: Blog = {
          id: params.id as string,
          title: "Muğla'nın Gizli Cennetleri: Keşfedilmeyi Bekleyen 10 Harika Nokta",
          slug: "muglanin-gizli-cennetleri-kesfedilmeyi-bekleyen-10-harika-nokta",
          excerpt: "Ege'nin incisi Muğla, sadece turistik yerlerden çok daha fazlasını sunuyor. İşte turistlerin az bildiği, doğanın ve tarihin buluştuğu 10 harika nokta...",
          content: `# Muğla'nın Gizli Cennetleri: Keşfedilmeyi Bekleyen 10 Harika Nokta

Ege'nin incisi Muğla, sadece turistik yerlerden çok daha fazlasını sunuyor. Binlerce yıllık tarihi, el değmemiş plajları, zeytinlikleri ve geleneksel köyleriyle bu bölge, keşfedilmeyi bekleyen hazinelerle dolu.

## 1. Sedir Adası

Cleopatra'nın adıyla anılan bu büyüleyici ada, eşsiz kumları ve tarihi kalıntılarıyla ziyaretçilerini büyülüyor. Rivayete göre ada, Mısır Kraliçesi Kleopatra ve Roma Generali Marcus Antonius için özel olarak yaratılmış.

## 2. Akyaka

Azmak Nehri'nin denizle birleştiği noktada yer alan Akyaka, masmavi suları ve şifalı olduğu söylenen çam ormanlarıyla ünlü. Rafting ve doğa yürüyüşleri için ideal bir rota.

...ve daha fazlası için yazının devamını okuyun.`,
          author: {
            id: "author1",
            name: "Elif Kaya",
            email: "elif.kaya@example.com",
            avatar: null,
          },
          status: "PUBLISHED",
          featured: true,
          category: "Gezi Rehberi",
          tags: ["Muğla", "Gezi", "Doğa", "Tarih", "Plajlar"],
          coverImage: "/blog-images/mugla-gizli-cennetler.jpg",
          readTime: 8,
          publishedAt: "2024-11-10T09:00:00Z",
          createdAt: "2024-11-08T14:30:00Z",
          updatedAt: "2024-11-14T10:30:00Z",
          stats: {
            views: 2847,
            likes: 156,
            comments: 23,
            shares: 89,
          },
          seo: {
            title: "Muğla'nın Gizli Cennetleri: Keşfedilmeyi Bekleyen 10 Harika Nokta",
            description: "Ege'nin incisi Muğla'nın turistlerin az bildiği, doğanın ve tarihin buluştuğu 10 harika noktasını keşfedin.",
            keywords: ["Muğla", "gezilecek yerler", "tatil", "ege bölgesi", "turistik yerler"],
          }
        }

        setBlog(mockBlog)
        form.reset({
          title: mockBlog.title,
          slug: mockBlog.slug,
          excerpt: mockBlog.excerpt,
          content: mockBlog.content,
          status: mockBlog.status,
          featured: mockBlog.featured,
          category: mockBlog.category,
          tags: mockBlog.tags,
          coverImage: mockBlog.coverImage || "",
          readTime: mockBlog.readTime,
          publishedAt: mockBlog.publishedAt,
          seoTitle: mockBlog.seo.title,
          seoDescription: mockBlog.seo.description,
          seoKeywords: mockBlog.seo.keywords,
        })
      } catch (error) {
        toast.error("Blog yazısı yüklenemedi")
        router.push("/blogs")
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchBlog()
    }
  }, [params.id, router, form])

  const onSubmit = async (data: BlogEditForm) => {
    if (!blog) return

    try {
      setSaving(true)

      // Simulate API call to update blog
      await new Promise(resolve => setTimeout(resolve, 1500))

      // In a real app, this would be an API call
      console.log("Updating blog:", {
        id: blog.id,
        ...data,
        updatedAt: new Date().toISOString(),
      })

      toast.success("Blog yazısı başarıyla güncellendi")
      router.push(`/blogs/${blog.id}`)
    } catch (error) {
      toast.error("Blog yazısı güncellenemedi")
    } finally {
      setSaving(false)
    }
  }

  const addTag = () => {
    if (newTag.trim()) {
      const currentTags = form.getValues("tags")
      form.setValue("tags", [...currentTags, newTag.trim()])
      setNewTag("")
    }
  }

  const removeTag = (index: number) => {
    const currentTags = form.getValues("tags")
    form.setValue("tags", currentTags.filter((_, i) => i !== index))
  }

  const addKeyword = () => {
    if (newKeyword.trim()) {
      const currentKeywords = form.getValues("seoKeywords")
      form.setValue("seoKeywords", [...currentKeywords, newKeyword.trim()])
      setNewKeyword("")
    }
  }

  const removeKeyword = (index: number) => {
    const currentKeywords = form.getValues("seoKeywords")
    form.setValue("seoKeywords", currentKeywords.filter((_, i) => i !== index))
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" disabled>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Blog Yazısını Düzenle</h1>
        </div>
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="animate-pulse space-y-4">
                <div className="h-10 bg-gray-200 rounded"></div>
                <div className="h-20 bg-gray-200 rounded"></div>
                <div className="h-40 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!blog) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/blogs/${params.id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Blog Yazısını Düzenle</h1>
        </div>
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">Blog yazısı bulunamadı.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/blogs/${blog.id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Blog Yazısını Düzenle</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/blogs/${blog.id}`}>
              İptal
            </Link>
          </Button>
          <Button
            onClick={form.handleSubmit(onSubmit)}
            disabled={saving}
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Kaydediliyor...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Kaydet
              </>
            )}
          </Button>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Temel Bilgiler
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="title">Başlık</Label>
                    <Input
                      id="title"
                      {...form.register("title")}
                      placeholder="Blog yazısı başlığı..."
                      onChange={(e) => handleTitleChange(e.target.value)}
                    />
                    {form.formState.errors.title && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.title.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="slug">Slug</Label>
                    <Input
                      id="slug"
                      {...form.register("slug")}
                      placeholder="url-adresi-formatinda"
                    />
                    {form.formState.errors.slug && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.slug.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="excerpt">Özet</Label>
                    <Textarea
                      id="excerpt"
                      {...form.register("excerpt")}
                      placeholder="Blog yazısının kısa özeti..."
                      rows={3}
                    />
                    {form.formState.errors.excerpt && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.excerpt.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Kategori</Label>
                    <Input
                      id="category"
                      {...form.register("category")}
                      placeholder="Örn: Gezi Rehberi, Teknoloji, Yaşam"
                    />
                    {form.formState.errors.category && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.category.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="readTime">Okuma Süresi (dakika)</Label>
                    <Input
                      id="readTime"
                      type="number"
                      min="1"
                      {...form.register("readTime", { valueAsNumber: true })}
                      placeholder="5"
                    />
                    {form.formState.errors.readTime && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.readTime.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="coverImage">Kapak Görseli</Label>
                    <Input
                      id="coverImage"
                      {...form.register("coverImage")}
                      placeholder="/gorsel-yolu.jpg"
                    />
                    {form.formState.errors.coverImage && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.coverImage.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="publishedAt">Yayınlanma Tarihi</Label>
                    <Input
                      id="publishedAt"
                      type="datetime-local"
                      {...form.register("publishedAt")}
                    />
                    {form.formState.errors.publishedAt && (
                      <p className="text-sm text-destructive">
                        {form.formState.errors.publishedAt.message}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Content */}
            <Card>
              <CardHeader>
                <CardTitle>İçerik</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Textarea
                  {...form.register("content")}
                  placeholder="Blog yazısının tam içeriği... Markdown formatında yazabilirsiniz."
                  rows={12}
                />
                {form.formState.errors.content && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.content.message}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Tags */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Etiketler
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Yeni etiket ekle..."
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                  />
                  <Button type="button" onClick={addTag}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {form.watch("tags").map((tag, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(index)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* SEO Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  SEO Ayarları
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="seoTitle">SEO Başlığı</Label>
                  <Input
                    id="seoTitle"
                    {...form.register("seoTitle")}
                    placeholder="Arama motorlarında görünecek başlık"
                  />
                  {form.formState.errors.seoTitle && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.seoTitle.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="seoDescription">SEO Açıklaması</Label>
                  <Textarea
                    id="seoDescription"
                    {...form.register("seoDescription")}
                    placeholder="Arama motorlarında görünecek açıklama..."
                    rows={3}
                  />
                  {form.formState.errors.seoDescription && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.seoDescription.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>SEO Anahtar Kelimeler</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                      placeholder="Anahtar kelime ekle..."
                      onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addKeyword())}
                    />
                    <Button type="button" onClick={addKeyword}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {form.watch("seoKeywords").map((keyword, index) => (
                      <Badge key={index} variant="outline" className="flex items-center gap-1">
                        {keyword}
                        <button
                          type="button"
                          onClick={() => removeKeyword(index)}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Status & Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Yayın Ayarları</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Durum</Label>
                  <Select
                    value={form.watch("status")}
                    onValueChange={(value) => form.setValue("status", value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Durum seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PUBLISHED">Yayınlandı</SelectItem>
                      <SelectItem value="DRAFT">Taslak</SelectItem>
                      <SelectItem value="SCHEDULED">Planlanmış</SelectItem>
                      <SelectItem value="ARCHIVED">Arşivlendi</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.status && (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.status.message}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="featured">Öne Çıkan</Label>
                    <p className="text-sm text-muted-foreground">
                      Blog yazısını ana sayfada ve aramalarda öne çıkar
                    </p>
                  </div>
                  <Switch
                    id="featured"
                    checked={form.watch("featured")}
                    onCheckedChange={(checked) => form.setValue("featured", checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Author Info */}
            <Card>
              <CardHeader>
                <CardTitle>Yazar Bilgisi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={blog.author.avatar || undefined} alt={blog.author.name} />
                    <AvatarFallback>
                      <User className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{blog.author.name}</div>
                    <div className="text-sm text-muted-foreground">{blog.author.email}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Blog Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Performans İstatistikleri</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Görüntülenme:</span>
                    <span className="font-medium">{blog.stats.views.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Beğeni:</span>
                    <span className="font-medium">{blog.stats.likes}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Yorum:</span>
                    <span className="font-medium">{blog.stats.comments}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Paylaşım:</span>
                    <span className="font-medium">{blog.stats.shares}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Info Card */}
            <Card>
              <CardHeader>
                <CardTitle>Yazı Bilgileri</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-sm space-y-2">
                  <p className="text-muted-foreground">
                    <strong>Yazı ID:</strong> #{blog.id}
                  </p>
                  <p className="text-muted-foreground">
                    <strong>Oluşturulma:</strong> {new Date(blog.createdAt).toLocaleDateString("tr-TR")}
                  </p>
                  <p className="text-muted-foreground">
                    <strong>Güncelleme:</strong> {new Date(blog.updatedAt).toLocaleDateString("tr-TR")}
                  </p>
                  <p className="text-muted-foreground">
                    <strong>Yayınlanma:</strong> {new Date(blog.publishedAt).toLocaleDateString("tr-TR")}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}