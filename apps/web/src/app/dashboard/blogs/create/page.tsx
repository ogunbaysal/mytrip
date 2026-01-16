"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Save, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";

const CATEGORY_OPTIONS = [
  { value: "travel", label: "Sehat" },
  { value: "food", label: "Yemek" },
  { value: "culture", label: "Kültür" },
  { value: "history", label: "Tarih" },
  { value: "activity", label: "Aktivite" },
  { value: "lifestyle", label: "Yaşam Tarzı" },
  { value: "business", label: "İşletme" },
] as const;

export default function CreateBlogPage() {
  const router = useRouter();
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
  const [tagsInput, setTagsInput] = useState("");

  const { data: usageData } = useQuery({
    queryKey: ["usage"],
    queryFn: () => api.subscriptions.getUsage(),
  });

  const createBlogMutation = useMutation({
    mutationFn: (data: typeof formData) => api.owner.blogs.create(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["owner-blogs"] });
      queryClient.invalidateQueries({ queryKey: ["usage"] });
      router.push("/dashboard/blogs");
    },
    onError: (error: Error) => {
      console.error("Create blog error:", error);
      setIsSubmitting(false);
      alert(error.message || "Blog oluşturulamadı");
    },
  });

  const usage = usageData?.usage;
  const blogsUsed = usage?.blogs.current || 0;
  const blogsMax = usage?.blogs.max || 1;
  const canAddBlog = blogsUsed < blogsMax;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      alert("Blog başlığı gereklidir");
      return;
    }

    if (formData.content.length < 50) {
      alert("İçerik en az 50 karakter olmalıdır");
      return;
    }

    setIsSubmitting(true);
    createBlogMutation.mutate(formData);
  };

  const handleChange = (field: keyof typeof formData, value: any) => {
    if (field === "slug" && !value) {
      value = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    }
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddTag = () => {
    const tag = tagsInput.trim();
    if (tag && !formData.tags.includes(tag)) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tag],
      }));
      setTagsInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  if (!canAddBlog) {
    return (
      <div className="container mx-auto px-4 py-12 md:px-6">
        <div className="mx-auto max-w-4xl">
          <Card className="p-8 text-center">
            <h2 className="mb-2 text-2xl font-bold">Blog Limiti Aşıldı</h2>
            <p className="mb-6 text-muted-foreground">
              {blogsUsed} / {blogsMax} blog yazısı limitinize ulaştınız. Daha
              fazla blog yazısı eklemek için lütfen abonelik planınızı
              yükseltiniz.
            </p>
            <Button
              onClick={() => (window.location.href = "/dashboard/subscription")}
            >
              Planı Yükselt
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 md:px-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold">Yeni Blog Yazısı Ekle</h1>
          <p className="text-muted-foreground">
            Blog yazısı oluşturun ve MyTrip kullanıcılarına ulaşın
          </p>
        </div>

        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <FileText className="size-5 text-muted-foreground" />
              <span className="text-lg font-semibold">Kullanım Durumu</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                {blogsUsed} / {blogsMax} blog
              </span>
              <span
                className={
                  blogsUsed >= blogsMax
                    ? "text-red-500 font-medium"
                    : "text-green-500 font-medium"
                }
              >
                {blogsUsed >= blogsMax ? "Lımite Ulaşıldı" : "Yeriniz Var"}
              </span>
            </div>
          </div>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-8">
          <Card className="p-6">
            <h3 className="mb-6 text-lg font-semibold">Temel Bilgiler</h3>

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
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="excerpt">Özet</Label>
                <textarea
                  id="excerpt"
                  value={formData.excerpt}
                  onChange={(e) => handleChange("excerpt", e.target.value)}
                  placeholder="Blog yazısının kısa özeti"
                  className="flex min-h-[100px] w-full rounded-md border bg-background px-3 py-2 text-sm"
                  maxLength={500}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Kategori *</Label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => handleChange("category", e.target.value)}
                  className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm"
                  required
                >
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Etiketler</Label>
                <div className="flex gap-2">
                  <Input
                    id="tags"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="Etiket ekle ve Enter basın"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                  />
                  <div className="flex gap-1 flex-wrap">
                    {formData.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 hover:text-red-500"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-6 text-lg font-semibold">İçerik</h3>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="content">Blog İçeriği *</Label>
                <div className="mb-2 text-sm text-muted-foreground">
                  Zengin metin: {formData.content.length} karakter
                </div>
                <textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => handleChange("content", e.target.value)}
                  placeholder="Blog yazınızın tam içeriğini buraya yazın..."
                  className="flex min-h-[400px] w-full rounded-md border bg-background px-3 py-2 text-sm"
                  required
                  rows={12}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Not: Şu anda basit metin editörü kullanıyoruz. Detaylı
                formatlama için kaydettikten sonra düzenleyebilirsiniz.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="heroImage">Kapak Görseli</Label>
              <Input
                id="heroImage"
                value={formData.heroImage}
                onChange={(e) => handleChange("heroImage", e.target.value)}
                placeholder="Görsel URL'si giriniz"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="featuredImage">Öne Çıkan Görsel</Label>
              <Input
                id="featuredImage"
                value={formData.featuredImage}
                onChange={(e) => handleChange("featuredImage", e.target.value)}
                placeholder="Görsel URL'si giriniz (opsiyonel)"
              />
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-6 text-lg font-semibold">SEO Ayarları</h3>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="seoTitle">SEO Başlığı</Label>
                <Input
                  id="seoTitle"
                  value={formData.seoTitle}
                  onChange={(e) => handleChange("seoTitle", e.target.value)}
                  placeholder="Arama sonuçlarında görünecek başlık"
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="seoDescription">SEO Açıklaması</Label>
                <textarea
                  id="seoDescription"
                  value={formData.seoDescription}
                  onChange={(e) =>
                    handleChange("seoDescription", e.target.value)
                  }
                  placeholder="Arama sonuçlarında görünecek açıklama"
                  className="flex min-h-[100px] w-full rounded-md border bg-background px-3 py-2 text-sm"
                  maxLength={300}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="seoKeywords">SEO Anahtar Kelimeler</Label>
                <div className="flex gap-2">
                  <Input
                    id="seoKeywords"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="Anahtar kelime ekle ve Enter basın"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                  />
                  <div className="flex gap-1 flex-wrap">
                    {formData.seoKeywords.map((keyword) => (
                      <span
                        key={keyword}
                        className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm"
                      >
                        {keyword}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(keyword)}
                          className="ml-1 hover:text-red-500"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-6 text-lg font-semibold">Yayınlama Ayarları</h3>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="language">Dil</Label>
                <select
                  id="language"
                  value={formData.language}
                  onChange={(e) => handleChange("language", e.target.value)}
                  className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm"
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
                >
                  <option value="easy">Kolay (2 dkika)</option>
                  <option value="medium">Orta (5 dkika)</option>
                  <option value="hard">Zor (10 dkika)</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetAudience">Hedef Kitle</Label>
                <select
                  id="targetAudience"
                  value={formData.targetAudience}
                  onChange={(e) =>
                    handleChange("targetAudience", e.target.value)
                  }
                  className="flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm"
                >
                  <option value="travelers">Gezginler</option>
                  <option value="locals">Yereliler</option>
                  <option value="business_owners">İşletme Sahipleri</option>
                  <option value="all">Hepkesi</option>
                </select>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-muted/50">
            <div className="flex items-start gap-3 mb-4">
              <FileText className="size-5 text-muted-foreground" />
              <div>
                <p className="mb-2 font-semibold">Yayınlama Süreci</p>
                <p className="text-sm text-muted-foreground">
                  Blog yazınız "pending_review" durumunda MyTrip yöneticileri
                  tarafından incelenecek. Onaylandıktan sonra halka açılacak. Bu
                  süreç genellikle 24-48 saat sürer.
                </p>
              </div>
            </div>
          </Card>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard/blogs")}
            >
              İptal
            </Button>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="min-w-[200px]"
            >
              {isSubmitting ? (
                <>
                  <span className="mr-2 inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                  Gönderiliyor...
                </>
              ) : (
                <>
                  <Save className="mr-2 size-4" />
                  Blog Yazısını Oluştur
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
