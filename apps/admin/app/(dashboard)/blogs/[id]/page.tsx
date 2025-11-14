"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  Calendar,
  User,
  Eye,
  MessageSquare,
  Heart,
  Edit,
  Share,
  Bookmark,
  Tag,
  Clock,
  FileText
} from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

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

export default function BlogDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [blog, setBlog] = useState<Blog | null>(null)
  const [loading, setLoading] = useState(true)

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
          content: `
# Muğla'nın Gizli Cennetleri: Keşfedilmeyi Bekleyen 10 Harika Nokta

Ege'nin incisi Muğla, sadece turistik yerlerden çok daha fazlasını sunuyor. Binlerce yıllık tarihi, el değmemiş plajları, zeytinlikleri ve geleneksel köyleriyle bu bölge, keşfedilmeyi bekleyen hazinelerle dolu.

## 1. Sedir Adası

Cleopatra'nın adıyla anılan bu büyüleyici ada, eşsiz kumları ve tarihi kalıntılarıyla ziyaretçilerini büyülüyor. Rivayete göre ada, Mısır Kraliçesi Kleopatra ve Roma Generali Marcus Antonius için özel olarak yaratılmış.

## 2. Akyaka

Azmak Nehri'nin denizle birleştiği noktada yer alan Akyaka, masmavi suları ve şifalı olduğu söylenen çam ormanlarıyla ünlü. Rafting ve doğa yürüyüşleri için ideal bir rota.

## 3. Göcek Koyları

Yatçıların cenneti olan Göcek, 12 adet koyu ve saklı plajlarıyla tatilcilerin favori duraklarından. Özellikle Tombulbuk Koyu'nun güzelliği anlatılmaz yaşanır.

## 4. Kayaköy

Rumların terk ettiği bu hayalet köy, zamanın durduğu hissi veren taş evleri ve kiliseleriyle unutulmaz bir deneyim sunuyor. Tarihe tanıklık etmek için perfect bir yer.

## 5. Ölüdeniz

Dünyanın en güzel plajlarından biri olan Ölüdeniz, turkuaz suları ve yamaç paraşütü imkanlarıyla adrenalin tutkunlarını da ağırlıyor.

...ve daha fazla harika nokta sizleri bekliyor!
          `,
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
  }, [params.id, router])

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "PUBLISHED": return "default"
      case "DRAFT": return "secondary"
      case "SCHEDULED": return "outline"
      case "ARCHIVED": return "destructive"
      default: return "outline"
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" disabled>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Blog Detayı</h1>
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
                <div className="h-48 bg-gray-200 rounded"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
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
            <Link href="/blogs">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Blog Detayı</h1>
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
            <Link href="/blogs">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Blog Detayı</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/blogs/${blog.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Düzenle
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Blog Header Card */}
          <Card>
            <CardHeader>
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={getStatusBadgeVariant(blog.status)}>
                    {blog.status}
                  </Badge>
                  {blog.featured && (
                    <Badge variant="secondary">Öne Çıkan</Badge>
                  )}
                </div>
                <h2 className="text-2xl font-bold leading-tight">{blog.title}</h2>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(blog.publishedAt).toLocaleDateString("tr-TR")}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {blog.readTime} dk okuma
                  </span>
                  <span>•</span>
                  <span>{blog.category}</span>
                </div>
                <p className="text-muted-foreground leading-relaxed">
                  {blog.excerpt}
                </p>
                <div className="flex flex-wrap gap-2">
                  {blog.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      <Tag className="h-3 w-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Cover Image */}
              {blog.coverImage && (
                <div className="space-y-3">
                  <h3 className="font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Kapak Görseli
                  </h3>
                  <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                    <FileText className="h-12 w-12 text-gray-400" />
                  </div>
                </div>
              )}

              <Separator />

              {/* Content */}
              <div>
                <h3 className="font-medium mb-4">İçerik</h3>
                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {blog.content}
                  </div>
                </div>
              </div>

              <Separator />

              {/* SEO Information */}
              <div>
                <h3 className="font-medium mb-3">SEO Bilgileri</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-medium">SEO Başlığı:</span>
                    <p className="text-muted-foreground mt-1">{blog.seo.title}</p>
                  </div>
                  <div>
                    <span className="font-medium">SEO Açıklaması:</span>
                    <p className="text-muted-foreground mt-1">{blog.seo.description}</p>
                  </div>
                  <div>
                    <span className="font-medium">Anahtar Kelimeler:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {blog.seo.keywords.map((keyword, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Performans İstatistikleri
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">{blog.stats.views.toLocaleString()}</div>
                  <div className="text-xs text-muted-foreground">Görüntülenme</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-red-600">{blog.stats.likes}</div>
                  <div className="text-xs text-muted-foreground">Beğeni</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">{blog.stats.comments}</div>
                  <div className="text-xs text-muted-foreground">Yorum</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-purple-600">{blog.stats.shares}</div>
                  <div className="text-xs text-muted-foreground">Paylaşım</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Author Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Yazar Bilgisi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={blog.author.avatar || undefined} alt={blog.author.name} />
                  <AvatarFallback>
                    <User className="h-6 w-6" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{blog.author.name}</div>
                  <div className="text-sm text-muted-foreground">{blog.author.email}</div>
                </div>
              </div>
              <Button variant="outline" className="w-full" size="sm">
                <MessageSquare className="h-4 w-4 mr-2" />
                Yazarla İletişime Geç
              </Button>
            </CardContent>
          </Card>

          {/* Quick Info */}
          <Card>
            <CardHeader>
              <CardTitle>Yazı Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Yazı ID:</span>
                  <span className="font-mono">#{blog.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Slug:</span>
                  <span className="text-xs truncate max-w-[150px]">{blog.slug}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Durum:</span>
                  <Badge variant={getStatusBadgeVariant(blog.status)} className="text-xs">
                    {blog.status}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Öne Çıkan:</span>
                  <Badge variant={blog.featured ? "default" : "secondary"} className="text-xs">
                    {blog.featured ? "Evet" : "Hayır"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Okuma Süresi:</span>
                  <span>{blog.readTime} dk</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Yayınlanma:</span>
                  <span>{new Date(blog.publishedAt).toLocaleDateString("tr-TR")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Oluşturulma:</span>
                  <span>{new Date(blog.createdAt).toLocaleDateString("tr-TR")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Güncelleme:</span>
                  <span>{new Date(blog.updatedAt).toLocaleDateString("tr-TR")}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Hızlı İşlemler</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full" asChild>
                <Link href={`/blogs/${blog.id}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Yazıyı Düzenle
                </Link>
              </Button>
              <Button variant="outline" className="w-full">
                <Eye className="h-4 w-4 mr-2" />
                Site Görünümü
              </Button>
              <Button variant="outline" className="w-full">
                <Share className="h-4 w-4 mr-2" />
                Sosyal Medya Paylaş
              </Button>
              <Button variant="outline" className="w-full">
                <Bookmark className="h-4 w-4 mr-2" />
                Analytics
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}