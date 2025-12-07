"use client"

import { useBlog } from "@/hooks/use-blogs"
import { useParams, useRouter } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Edit, Calendar, User, Eye, Heart, MessageCircle, Share2, Globe, BookOpen } from "lucide-react"
import Link from "next/link"

export default function BlogDetailPage() {
  const params = useParams()
  const router = useRouter()
  const postId = params.id as string
  const { data: blog, isLoading } = useBlog(postId)

  if (isLoading) {
    return (
        <div className="space-y-4 p-8">
            <div className="flex justify-between">
                 <Skeleton className="h-10 w-[100px]" />
                 <Skeleton className="h-10 w-[100px]" />
            </div>
            <Skeleton className="h-[200px] w-full rounded-lg" />
            <div className="space-y-2">
                <Skeleton className="h-8 w-[300px]" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
            </div>
        </div>
    )
  }

  if (!blog) {
      return (
          <div className="flex flex-col items-center justify-center h-full p-8 space-y-4">
              <h2 className="text-2xl font-bold">Blog yazısı bulunamadı</h2>
              <Button onClick={() => router.push("/blogs")}>Bloglara Dön</Button>
          </div>
      )
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Geri
            </Button>
            <h2 className="text-3xl font-bold tracking-tight">Blog Detayı</h2>
        </div>
        <Button asChild>
            <Link href={`/blogs/${blog.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" /> Düzenle
            </Link>
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
            {blog.heroImage && (
                <div className="rounded-lg overflow-hidden border aspect-video relative">
                    {/* In a real app use Next.js Image */}
                    <img 
                        src={blog.heroImage} 
                        alt={blog.title} 
                        className="object-cover w-full h-full"
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://placehold.co/600x400?text=No+Image";
                        }}
                    />
                </div>
            )}
            
            <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{blog.category.toUpperCase()}</Badge>
                    <Badge variant={blog.status === "published" ? "default" : "secondary"}>
                        {blog.status === "published" ? "Yayında" : blog.status === "draft" ? "Taslak" : blog.status}
                    </Badge>
                     {blog.featured && <Badge className="bg-yellow-500 text-black">⭐ Öne Çıkan</Badge>}
                </div>

                <h1 className="text-4xl font-extrabold">{blog.title}</h1>
                
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center">
                        <User className="mr-1 h-4 w-4" /> {blog.authorName || "Bilinmiyor"}
                    </div>
                    <div className="flex items-center">
                        <Calendar className="mr-1 h-4 w-4" /> {new Date(blog.createdAt).toLocaleDateString("tr-TR")}
                    </div>
                     <div className="flex items-center">
                        <Globe className="mr-1 h-4 w-4" /> {blog.language.toUpperCase()}
                    </div>
                </div>

                <Separator />
                
                <div className="prose max-w-none dark:prose-invert">
                    <p className="text-xl text-muted-foreground italic">{blog.excerpt}</p>
                    <div 
                        className="prose prose-lg dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: blog.content }}
                    />
                </div>
            </div>
        </div>

        <div className="space-y-6">
             <Card>
                <CardHeader>
                    <CardTitle>İstatistikler</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col items-center justify-center p-4 bg-muted/50 rounded-lg">
                            <Eye className="h-6 w-6 text-blue-500 mb-2" />
                            <span className="text-2xl font-bold">{blog.views}</span>
                            <span className="text-xs text-muted-foreground">Görüntülenme</span>
                        </div>
                         <div className="flex flex-col items-center justify-center p-4 bg-muted/50 rounded-lg">
                            <Heart className="h-6 w-6 text-red-500 mb-2" />
                            <span className="text-2xl font-bold">{blog.likeCount}</span>
                            <span className="text-xs text-muted-foreground">Beğeni</span>
                        </div>
                         <div className="flex flex-col items-center justify-center p-4 bg-muted/50 rounded-lg">
                            <MessageCircle className="h-6 w-6 text-green-500 mb-2" />
                            <span className="text-2xl font-bold">{blog.commentCount}</span>
                            <span className="text-xs text-muted-foreground">Yorum</span>
                        </div>
                         <div className="flex flex-col items-center justify-center p-4 bg-muted/50 rounded-lg">
                            <Share2 className="h-6 w-6 text-purple-500 mb-2" />
                            <span className="text-2xl font-bold">{blog.shareCount}</span>
                            <span className="text-xs text-muted-foreground">Paylaşım</span>
                        </div>
                    </div>
                     <div className="flex items-center justify-between p-2 bg-muted/20 rounded">
                        <div className="flex items-center text-sm">
                            <BookOpen className="mr-2 h-4 w-4" /> Okuma Süresi
                        </div>
                        <span className="font-medium">{blog.readTime} dk</span>
                    </div>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>SEO Bilgileri</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                    <div>
                        <span className="font-semibold block text-xs uppercase text-muted-foreground">SEO Başlığı</span>
                        <p>{blog.seoTitle || "-"}</p>
                    </div>
                    <div>
                        <span className="font-semibold block text-xs uppercase text-muted-foreground">SEO Açıklaması</span>
                        <p className="line-clamp-3">{blog.seoDescription || "-"}</p>
                    </div>
                    <div>
                        <span className="font-semibold block text-xs uppercase text-muted-foreground">Anahtar Kelimeler</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                            {Array.isArray(blog.seoKeywords) && blog.seoKeywords.length > 0 
                                ? blog.seoKeywords.map((k, i) => <Badge key={i} variant="secondary" className="text-xs">{k}</Badge>)
                                : <span>-</span>
                            }
                        </div>
                    </div>
                     <div>
                        <span className="font-semibold block text-xs uppercase text-muted-foreground">Slug</span>
                        <p className="font-mono text-xs">{blog.slug}</p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Etiketler</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-2">
                         {Array.isArray(blog.tags) && blog.tags.length > 0 
                                ? blog.tags.map((t, i) => <Badge key={i} variant="outline">{t}</Badge>)
                                : <span className="text-sm text-muted-foreground">Etiket yok</span>
                            }
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  )
}