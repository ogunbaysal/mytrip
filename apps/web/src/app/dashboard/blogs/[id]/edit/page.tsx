"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, Eye, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";

const CATEGORY_OPTIONS = [
  { value: "travel", label: "Seyahat" },
  { value: "food", label: "Yemek" },
  { value: "culture", label: "Kültür" },
  { value: "history", label: "Tarih" },
  { value: "activity", label: "Aktivite" },
  { value: "lifestyle", label: "Yaşam Tarzı" },
  { value: "business", label: "İşletme" },
] as const;

const READING_LEVEL_OPTIONS = [
  { value: "easy", label: "Kolay (2 dakika)" },
  { value: "medium", label: "Orta (5 dakika)" },
  { value: "hard", label: "Zor (10 dakika)" },
] as const;

const TARGET_AUDIENCE_OPTIONS = [
  { value: "travelers", label: "Gezginler" },
  { value: "locals", label: "Yereliler" },
  { value: "business_owners", label: "İşletme Sahipleri" },
  { value: "all", label: "Hepkesi" },
] as const;

export default function EditBlogPage() {
  const router = useRouter();
  const params = useParams();
  const blogId = params.id as string;
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    heroImage: "",
    featuredImage: "",
    category: "travel" as const,
    tags: [] as string[],
    seoTitle: "",
    seoDescription: "",
    seoKeywords: [] as string[],
    language: "tr" as const,
    readingLevel: "medium" as const,
    targetAudience: "travelers" as const,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const { data: blogData, isLoading } = useQuery({
    queryKey: ["blog-detail", blogId],
    queryFn: () => api.owner.blogs.getById(blogId),
    enabled: !!blogId,
  });

  const blog = blogData?.blog;
  const isPublished = blog?.status === "published";

  const { data: usageData } = useQuery({
    queryKey: ["usage"],
    queryFn: () => api.subscriptions.getUsage(),
  });

  const usage = usageData?.usage;
  const blogsUsed = usage?.blogs.current || 0;
  const blogsMax = usage?.blogs.max || 1;

  const publishBlogMutation = useMutation({
    mutationFn: () => api.owner.blogs.publish(blogId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-detail", blogId] });
      queryClient.invalidateQueries({ queryKey: ["owner-blogs"] });
      queryClient.invalidateQueries({ queryKey: ["usage"] });
      setHasChanges(false);
    },
    onError: (error: Error) => {
      console.error("Publish blog error:", error);
      alert(error.message || "Yayınlanma başarısız oldu");
    },
  });

  const updateBlogMutation = useMutation({
    mutationFn: (data: typeof formData) => api.owner.blogs.update(blogId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-detail", blogId] });
      queryClient.invalidateQueries({ queryKey: ["owner-blogs"] });
      setHasChanges(false);
    },
    onError: (error: Error) => {
      console.error("Update blog error:", error);
      setIsSubmitting(false);
      alert(error.message || "Güncelleme başarısız oldu");
    },
  });

  useEffect(() => {
    if (blog) {
      setFormData({
        title: blog.title || "",
        slug: blog.slug || "",
        excerpt: blog.excerpt || "",
        content: blog.content || "",
        heroImage: blog.heroImage || "",
        featuredImage: blog.featuredImage || "",
        category: blog.category || "travel",
        tags:
          typeof blog.tags === "string"
            ? JSON.parse(blog.tags)
            : blog.tags || [],
        seoTitle: blog.seoTitle || "",
        seoDescription: blog.seoDescription || "",
        seoKeywords:
          typeof blog.seoKeywords === "string"
            ? JSON.parse(blog.seoKeywords)
            : blog.seoKeywords || [],
        language: blog.language || "tr",
        readingLevel: blog.readingLevel || "medium",
        targetAudience: blog.targetAudience || "travelers",
      });
    }
  }, [blog]);

  const handleChange = (field: keyof typeof formData, value: any) => {
    if (field === "slug" && !value) {
      const slug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      setFormData((prev) => ({ ...prev, slug }));
      return;
    }
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSaveAsDraft = async () => {
    if (!hasChanges) {
      return;
    }

    setIsSubmitting(true);
    try {
      await updateBlogMutation.mutate(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePublish = () => {
    if (!hasChanges) {
      alert("Değişiklik kaydediniz yok. Önce kaydedin ve sonra yayınılayın.");
      return;
    }

    if (
      window.confirm(
        "Blog yazısını inceleme için göndermek istediğinize emin misiniz?",
      )
    ) {
      publishBlogMutation.mutate();
    }
  };

  const canPublish = blog?.status === "draft" && !isPublished;

  if (!blogId || isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const blogLimitWarning = blogsUsed >= blogsMax;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Blog Yazısını Düzenle</h1>
          <p className="text-muted-foreground">
            {isPublished
              ? "Yayınlanmış blog yazısını düzenleyebilirsiniz"
              : "Taslak veya incelemeyi bekleyen blog yazısı"}
          </p>
        </div>
        <Link href={`/blog/${blog.slug}`} target="_blank">
          <Button variant="outline" size="sm">
            <Eye className="size-4" />
            Önizleme
          </Button>
        </Link>
      </div>

      {isPublished && (
        <Card className="p-6">
          <div className="mb-6 flex items-start gap-3 text-lg font-semibold text-red-600">
            <AlertTriangle className="mt-1 size-5" />
            <span>
              Blog yazısı yayınlanmış durumda. Düzenleme yapmak için önce
              taslağa geri almalısınız.
            </span>
          </div>
        </Card>
      )}

      <form className="space-y-6">
        <Card className="p-6">
          <h2 className="mb-6 text-lg font-semibold">Temel Bilgiler</h2>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Blog Başlığı *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleChange("title", e.target.value)}
                placeholder="Yazınızın başlığı"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">URL Slug</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => handleChange("slug", e.target.value)}
                placeholder="otomatik oluşturulur"
                disabled={isPublished}
                className="bg-muted"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="excerpt">Özet</Label>
              <textarea
                id="excerpt"
                value={formData.excerpt}
                onChange={(e) => handleChange("excerpt", e.target.value)}
                placeholder="Blog yazısının kısa özeti (1-2 cümle)"
                className="flex min-h-[80px] w-full rounded-md border bg-background px-3 py-2 text-sm"
                rows={3}
                maxLength={500}
              />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="mb-6 text-lg font-semibold">Blog İçeriği *</h2>
          <div className="space-y-4">
            <textarea
              id="content"
              value={formData.content}
              onChange={(e) => handleChange("content", e.target.value)}
              placeholder="Blog yazısının tam içeriğini buraya yazın..."
              className="flex min-h-[400px] w-full rounded-md border bg-background px-3 py-2 text-sm"
              rows={12}
              disabled={isPublished}
            />
            <p className="text-xs text-muted-foreground">
              {formData.content.length} karakter
            </p>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="mb-6 text-lg font-semibold">Kategori</h2>
          <div className="space-y-4">
            <select
              id="category"
              value={formData.category}
              onChange={(e) => handleChange("category", e.target.value)}
              className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm"
              disabled={isPublished}
            >
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="mb-6 text-lg font-semibold">Etiketler</h2>
          <div className="space-y-4">
            <Input
              id="tags"
              value={formData.tags.join(", ")}
              onChange={(e) => {
                const tags = e.target.value
                  .split(",")
                  .map((t) => t.trim())
                  .filter(Boolean);
                setFormData((prev) => ({ ...prev, tags }));
              }}
              placeholder="Etiketleri virgül ile ayırın (örn: Muğla, seyahat, tatil)"
              disabled={isPublished}
            />
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="mb-6 text-lg font-semibold">Görseller</h2>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="heroImage">Kapak Görseli</Label>
              <Input
                id="heroImage"
                value={formData.heroImage}
                onChange={(e) => handleChange("heroImage", e.target.value)}
                placeholder="Görsel URL'si giriniz"
                disabled={isPublished}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="featuredImage">Öne Çıkan Görsel</Label>
              <Input
                id="featuredImage"
                value={formData.featuredImage}
                onChange={(e) => handleChange("featuredImage", e.target.value)}
                placeholder="Öne çıkan görsel URL'si (opsiyonel)"
                disabled={isPublished}
              />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="mb-6 text-lg font-semibold">SEO Ayarları</h2>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="seoTitle">SEO Başlığı</Label>
              <Input
                id="seoTitle"
                value={formData.seoTitle}
                onChange={(e) => handleChange("seoTitle", e.target.value)}
                placeholder="Arama sonuçlarında görünecek başlık"
                disabled={isPublished}
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="seoDescription">SEO Açıklaması</Label>
              <textarea
                id="seoDescription"
                value={formData.seoDescription}
                onChange={(e) => handleChange("seoDescription", e.target.value)}
                placeholder="Google'da görünecek açıklama"
                className="flex min-h-[100px] w-full rounded-md border bg-background px-3 py-2 text-sm"
                maxLength={300}
                disabled={isPublished}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="seoKeywords">SEO Anahtar Kelimeler</Label>
              <Input
                id="seoKeywords"
                value={formData.seoKeywords.join(", ")}
                onChange={(e) => {
                  const keywords = e.target.value
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean);
                  setFormData((prev) => ({ ...prev, seoKeywords: keywords }));
                }}
                placeholder="Anahtar kelimeler (virgül ile ayırın)"
                disabled={isPublished}
              />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="mb-6 text-lg font-semibold">Yayınlama Ayarları</h2>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="language">Dil</Label>
              <select
                id="language"
                value={formData.language}
                onChange={(e) => handleChange("language", e.target.value)}
                className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm"
                disabled={isPublished}
              >
                <option value="tr">Türkçe</option>
                <option value="en">İngilizce</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="readingLevel">Okuma Seviyesi</Label>
              <select
                id="readingLevel"
                value={formData.readingLevel}
                onChange={(e) => handleChange("readingLevel", e.target.value)}
                className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm"
                disabled={isPublished}
              >
                {READING_LEVEL_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetAudience">Hedef Kitle</Label>
              <select
                id="targetAudience"
                value={formData.targetAudience}
                onChange={(e) => handleChange("targetAudience", e.target.value)}
                className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm"
                disabled={isPublished}
              >
                {TARGET_AUDIENCE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        <div className="flex items-center justify-between gap-4">
          <Button
            variant="outline"
            type="button"
            onClick={() => router.push("/dashboard/blogs")}
          >
            İptal
          </Button>

          <div className="flex gap-2">
            <Button
              variant="outline"
              type="button"
              onClick={handleSaveAsDraft}
              disabled={!hasChanges || isSubmitting || isPublished}
            >
              <Save className="mr-2 size-4" />
              Taslak Olarak Kaydet
            </Button>

            {canPublish && (
              <Button
                type="button"
                onClick={handlePublish}
                disabled={publishBlogMutation.isPending}
              >
                İncelemeye Gönder
              </Button>
            )}
          </div>
        </div>
      </form>

      {usage && (
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Plan Kullanımı</h3>
              <p className="text-sm text-muted-foreground">
                {blogsUsed} / {blogsMax} blog yazısı kullanılıyor
              </p>
            </div>
            {blogLimitWarning && (
              <Button
                variant="outline"
                onClick={() => (window.location.href = "/pricing")}
              >
                Planı Yükselt
              </Button>
            )}
          </div>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all"
              style={{
                width: `${(blogsUsed / blogsMax) * 100}%`,
              }}
            />
          </div>
        </Card>
      )}
    </div>
  );
}
