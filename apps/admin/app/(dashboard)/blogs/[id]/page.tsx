"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Edit,
  Eye,
  Globe,
  Heart,
  MessageCircle,
  Share2,
  User,
} from "lucide-react";
import { useBlog } from "@/hooks/use-blogs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

const STATUS_LABELS: Record<string, string> = {
  published: "Yayında",
  draft: "Taslak",
  pending_review: "İncelemede",
  archived: "Arşivlendi",
};

const STATUS_VARIANTS: Record<
  string,
  "default" | "secondary" | "destructive" | "outline"
> = {
  published: "default",
  draft: "secondary",
  pending_review: "outline",
  archived: "destructive",
};

export default function BlogDetailPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;
  const { data: blog, isLoading } = useBlog(postId);

  if (isLoading) {
    return (
      <div className="space-y-4 p-8">
        <div className="flex justify-between">
          <Skeleton className="h-10 w-[100px]" />
          <Skeleton className="h-10 w-[100px]" />
        </div>
        <Skeleton className="h-[220px] w-full rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-8 w-[300px]" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="flex h-full flex-col items-center justify-center space-y-4 p-8">
        <h2 className="text-2xl font-bold">Blog yazısı bulunamadı</h2>
        <Button onClick={() => router.push("/blogs")}>Bloglara Dön</Button>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Geri
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Blog Detayı</h1>
        </div>
        <Button asChild>
          <Link href={`/blogs/${blog.id}/edit`}>
            <Edit className="mr-2 h-4 w-4" /> Düzenle
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {blog.heroImage && (
            <div className="relative aspect-video overflow-hidden rounded-lg border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={blog.heroImage}
                alt={blog.title}
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "https://placehold.co/1280x720?text=No+Image";
                }}
              />
            </div>
          )}

          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{blog.categoryName || "Kategorisiz"}</Badge>
              <Badge variant={STATUS_VARIANTS[blog.status] || "outline"}>
                {STATUS_LABELS[blog.status] || blog.status}
              </Badge>
              {blog.featured && (
                <Badge className="bg-yellow-500 text-black">⭐ Öne Çıkan</Badge>
              )}
            </div>

            <h2 className="text-4xl font-extrabold">{blog.title}</h2>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center">
                <User className="mr-1 h-4 w-4" /> {blog.authorName || "Bilinmiyor"}
              </div>
              <div className="flex items-center">
                <Calendar className="mr-1 h-4 w-4" />
                {new Date(blog.createdAt).toLocaleDateString("tr-TR")}
              </div>
              <div className="flex items-center">
                <Globe className="mr-1 h-4 w-4" /> {blog.language.toUpperCase()}
              </div>
            </div>

            <Separator />

            <div className="prose max-w-none dark:prose-invert">
              {blog.excerpt ? (
                <p className="text-xl italic text-muted-foreground">{blog.excerpt}</p>
              ) : null}
              <div
                className="prose prose-lg max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: blog.content || "" }}
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
                <div className="flex flex-col items-center justify-center rounded-lg bg-muted/50 p-4">
                  <Eye className="mb-2 h-6 w-6 text-blue-500" />
                  <span className="text-2xl font-bold">{blog.views}</span>
                  <span className="text-xs text-muted-foreground">Görüntülenme</span>
                </div>
                <div className="flex flex-col items-center justify-center rounded-lg bg-muted/50 p-4">
                  <Heart className="mb-2 h-6 w-6 text-red-500" />
                  <span className="text-2xl font-bold">{blog.likeCount}</span>
                  <span className="text-xs text-muted-foreground">Beğeni</span>
                </div>
                <div className="flex flex-col items-center justify-center rounded-lg bg-muted/50 p-4">
                  <MessageCircle className="mb-2 h-6 w-6 text-green-500" />
                  <span className="text-2xl font-bold">{blog.commentCount}</span>
                  <span className="text-xs text-muted-foreground">Yorum</span>
                </div>
                <div className="flex flex-col items-center justify-center rounded-lg bg-muted/50 p-4">
                  <Share2 className="mb-2 h-6 w-6 text-purple-500" />
                  <span className="text-2xl font-bold">{blog.shareCount}</span>
                  <span className="text-xs text-muted-foreground">Paylaşım</span>
                </div>
              </div>
              <div className="flex items-center justify-between rounded bg-muted/20 p-2">
                <div className="flex items-center text-sm">
                  <BookOpen className="mr-2 h-4 w-4" /> Okuma Süresi
                </div>
                <span className="font-medium">{blog.readTime || 0} dk</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>SEO Bilgileri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <span className="block text-xs font-semibold uppercase text-muted-foreground">
                  SEO Başlığı
                </span>
                <p>{blog.seoTitle || "-"}</p>
              </div>
              <div>
                <span className="block text-xs font-semibold uppercase text-muted-foreground">
                  SEO Açıklaması
                </span>
                <p className="line-clamp-3">{blog.seoDescription || "-"}</p>
              </div>
              <div>
                <span className="block text-xs font-semibold uppercase text-muted-foreground">
                  Anahtar Kelimeler
                </span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {blog.seoKeywords.length > 0 ? (
                    blog.seoKeywords.map((keyword) => (
                      <Badge key={keyword} variant="secondary" className="text-xs">
                        {keyword}
                      </Badge>
                    ))
                  ) : (
                    <span>-</span>
                  )}
                </div>
              </div>
              <div>
                <span className="block text-xs font-semibold uppercase text-muted-foreground">
                  Slug
                </span>
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
                {blog.tags.length > 0 ? (
                  blog.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">Etiket yok</span>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
