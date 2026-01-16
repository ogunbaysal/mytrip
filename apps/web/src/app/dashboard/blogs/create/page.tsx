"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Save,
  FileText,
  AlertTriangle,
  ChevronLeft,
  Info,
  ImageIcon,
  Search,
  Settings,
  CheckCircle,
  Tag,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  PageHeader,
  DashboardCard,
  ProgressBar,
  SectionHeader,
} from "@/components/dashboard";
import { api } from "@/lib/api";

const CATEGORY_OPTIONS = [
  { value: "travel", label: "Seyahat" },
  { value: "food", label: "Yemek" },
  { value: "culture", label: "Kultur" },
  { value: "history", label: "Tarih" },
  { value: "activity", label: "Aktivite" },
  { value: "lifestyle", label: "Yasam Tarzi" },
  { value: "business", label: "Isletme" },
] as const;

const READING_LEVEL_OPTIONS = [
  { value: "easy", label: "Kolay (2 dakika)" },
  { value: "medium", label: "Orta (5 dakika)" },
  { value: "hard", label: "Zor (10 dakika)" },
] as const;

const TARGET_AUDIENCE_OPTIONS = [
  { value: "travelers", label: "Gezginler" },
  { value: "locals", label: "Yereliler" },
  { value: "business_owners", label: "Isletme Sahipleri" },
  { value: "all", label: "Herkes" },
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
    category: "travel" as (typeof CATEGORY_OPTIONS)[number]["value"],
    tags: [] as string[],
    seoTitle: "",
    seoDescription: "",
    seoKeywords: [] as string[],
    language: "tr" as "tr" | "en",
    readingLevel: "medium" as (typeof READING_LEVEL_OPTIONS)[number]["value"],
    targetAudience:
      "travelers" as (typeof TARGET_AUDIENCE_OPTIONS)[number]["value"],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagsInput, setTagsInput] = useState("");
  const [keywordsInput, setKeywordsInput] = useState("");

  const { data: usageData } = useQuery({
    queryKey: ["usage"],
    queryFn: () => api.subscriptions.getUsage(),
  });

  const createBlogMutation = useMutation({
    mutationFn: (data: typeof formData) => api.owner.blogs.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-blogs"] });
      queryClient.invalidateQueries({ queryKey: ["usage"] });
      router.push("/dashboard/blogs");
    },
    onError: (error: Error) => {
      console.error("Create blog error:", error);
      setIsSubmitting(false);
      alert(error.message || "Blog olusturulamadi");
    },
  });

  const usage = usageData?.usage;
  const blogsUsed = usage?.blogs.current || 0;
  const blogsMax = usage?.blogs.max || 1;
  const canAddBlog = blogsUsed < blogsMax;
  const usagePercentage = Math.round((blogsUsed / blogsMax) * 100);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      alert("Blog basligi gereklidir");
      return;
    }

    if (formData.content.length < 50) {
      alert("Icerik en az 50 karakter olmalidir");
      return;
    }

    setIsSubmitting(true);
    createBlogMutation.mutate(formData);
  };

  const handleChange = (field: keyof typeof formData, value: any) => {
    if (field === "title" && !formData.slug) {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      setFormData((prev) => ({ ...prev, [field]: value, slug }));
      return;
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

  const handleAddKeyword = () => {
    const keyword = keywordsInput.trim();
    if (keyword && !formData.seoKeywords.includes(keyword)) {
      setFormData((prev) => ({
        ...prev,
        seoKeywords: [...prev.seoKeywords, keyword],
      }));
      setKeywordsInput("");
    }
  };

  const handleRemoveKeyword = (keywordToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      seoKeywords: prev.seoKeywords.filter(
        (keyword) => keyword !== keywordToRemove,
      ),
    }));
  };

  // Limit exceeded state
  if (!canAddBlog) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Yeni Blog Yazisi"
          icon={<FileText className="size-5" />}
          breadcrumbs={[
            { label: "Blog Yazilari", href: "/dashboard/blogs" },
            { label: "Yeni Yazi" },
          ]}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mx-auto max-w-lg"
        >
          <DashboardCard padding="lg">
            <div className="text-center">
              <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-500">
                <AlertTriangle className="size-8" />
              </div>
              <h2 className="mb-2 text-xl font-bold text-foreground">
                Blog Limiti Asildi
              </h2>
              <p className="mb-6 text-muted-foreground">
                {blogsUsed} / {blogsMax} blog yazisi limitinize ulastiniz. Daha
                fazla blog yazisi eklemek icin abonelik planinizi yukseltin.
              </p>
              <Button
                onClick={() => (window.location.href = "/pricing")}
                className="gap-2"
              >
                Plani Yukselt
              </Button>
            </div>
          </DashboardCard>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Yeni Blog Yazisi"
        description="Blog yazinizi olusturun ve MyTrip kullanicilarina ulasin"
        icon={<FileText className="size-5" />}
        breadcrumbs={[
          { label: "Blog Yazilari", href: "/dashboard/blogs" },
          { label: "Yeni Yazi" },
        ]}
        actions={
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/blogs")}
            className="gap-2"
          >
            <ChevronLeft className="size-4" />
            Geri
          </Button>
        }
      />

      {/* Usage Status */}
      <DashboardCard padding="md">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="font-semibold text-foreground">Kullanim Durumu</h3>
            <p className="text-sm text-muted-foreground">
              {blogsUsed} / {blogsMax} blog yazisi kullaniliyor
            </p>
          </div>
          <div className="w-full md:w-64">
            <ProgressBar
              value={usagePercentage}
              showLabel
              label={`${usagePercentage}%`}
            />
          </div>
        </div>
      </DashboardCard>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <DashboardCard padding="md">
          <SectionHeader
            title="Temel Bilgiler"
            subtitle="Blog yazinizin temel bilgilerini girin"
            icon={<Info className="size-5" />}
            size="sm"
            className="mb-6"
          />

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Blog Basligi *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleChange("title", e.target.value)}
                placeholder="Yazinizin basligi"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">URL Slug</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => handleChange("slug", e.target.value)}
                placeholder="otomatik olusturulur"
                className="bg-slate-50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Kategori *</Label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => handleChange("category", e.target.value)}
                className="flex h-10 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm transition-colors hover:border-primary/50 focus:border-primary focus:outline-none"
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
                  placeholder="Etiket ekle ve Enter basin"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddTag}
                  disabled={!tagsInput.trim()}
                >
                  <Tag className="size-4" />
                </Button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 hover:text-red-500"
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="excerpt">Ozet</Label>
              <textarea
                id="excerpt"
                value={formData.excerpt}
                onChange={(e) => handleChange("excerpt", e.target.value)}
                placeholder="Blog yazisinin kisa ozeti (1-2 cumle)"
                className="flex min-h-[100px] w-full rounded-lg border border-border bg-white px-3 py-2 text-sm transition-colors hover:border-primary/50 focus:border-primary focus:outline-none resize-none"
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                {formData.excerpt.length}/500 karakter
              </p>
            </div>
          </div>
        </DashboardCard>

        {/* Content */}
        <DashboardCard padding="md">
          <SectionHeader
            title="Icerik"
            subtitle="Blog yazinizin icerigini yazin"
            icon={<FileText className="size-5" />}
            size="sm"
            className="mb-6"
          />

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="content">Blog Icerigi *</Label>
              <textarea
                id="content"
                value={formData.content}
                onChange={(e) => handleChange("content", e.target.value)}
                placeholder="Blog yazinizin tam icerigini buraya yazin..."
                className="flex min-h-[400px] w-full rounded-lg border border-border bg-white px-3 py-2 text-sm transition-colors hover:border-primary/50 focus:border-primary focus:outline-none resize-none"
                required
              />
              <p className="text-xs text-muted-foreground">
                {formData.content.length} karakter (minimum 50)
              </p>
            </div>
          </div>
        </DashboardCard>

        {/* Images */}
        <DashboardCard padding="md">
          <SectionHeader
            title="Gorseller"
            subtitle="Blog yazinizin gorsellerini ekleyin"
            icon={<ImageIcon className="size-5" />}
            size="sm"
            className="mb-6"
          />

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="heroImage">Kapak Gorseli</Label>
              <Input
                id="heroImage"
                value={formData.heroImage}
                onChange={(e) => handleChange("heroImage", e.target.value)}
                placeholder="Gorsel URL'si giriniz"
              />
              {formData.heroImage && (
                <div className="mt-2 aspect-video overflow-hidden rounded-lg bg-slate-100">
                  <img
                    src={formData.heroImage}
                    alt="Kapak Gorseli"
                    className="size-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="featuredImage">One Cikan Gorsel</Label>
              <Input
                id="featuredImage"
                value={formData.featuredImage}
                onChange={(e) => handleChange("featuredImage", e.target.value)}
                placeholder="Gorsel URL'si giriniz (opsiyonel)"
              />
              {formData.featuredImage && (
                <div className="mt-2 aspect-video overflow-hidden rounded-lg bg-slate-100">
                  <img
                    src={formData.featuredImage}
                    alt="One Cikan Gorsel"
                    className="size-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </DashboardCard>

        {/* SEO Settings */}
        <DashboardCard padding="md">
          <SectionHeader
            title="SEO Ayarlari"
            subtitle="Arama motorlari icin optimize edin"
            icon={<Search className="size-5" />}
            size="sm"
            className="mb-6"
          />

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="seoTitle">SEO Basligi</Label>
              <Input
                id="seoTitle"
                value={formData.seoTitle}
                onChange={(e) => handleChange("seoTitle", e.target.value)}
                placeholder="Arama sonuclarinda gorunecek baslik"
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground">
                {formData.seoTitle.length}/100 karakter
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="seoKeywords">SEO Anahtar Kelimeler</Label>
              <div className="flex gap-2">
                <Input
                  id="seoKeywords"
                  value={keywordsInput}
                  onChange={(e) => setKeywordsInput(e.target.value)}
                  placeholder="Anahtar kelime ekle"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddKeyword();
                    }
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddKeyword}
                  disabled={!keywordsInput.trim()}
                >
                  <Tag className="size-4" />
                </Button>
              </div>
              {formData.seoKeywords.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.seoKeywords.map((keyword) => (
                    <span
                      key={keyword}
                      className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-sm"
                    >
                      {keyword}
                      <button
                        type="button"
                        onClick={() => handleRemoveKeyword(keyword)}
                        className="ml-1 hover:text-red-500"
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="seoDescription">SEO Aciklamasi</Label>
              <textarea
                id="seoDescription"
                value={formData.seoDescription}
                onChange={(e) => handleChange("seoDescription", e.target.value)}
                placeholder="Arama sonuclarinda gorunecek aciklama"
                className="flex min-h-[100px] w-full rounded-lg border border-border bg-white px-3 py-2 text-sm transition-colors hover:border-primary/50 focus:border-primary focus:outline-none resize-none"
                maxLength={300}
              />
              <p className="text-xs text-muted-foreground">
                {formData.seoDescription.length}/300 karakter
              </p>
            </div>
          </div>
        </DashboardCard>

        {/* Publishing Settings */}
        <DashboardCard padding="md">
          <SectionHeader
            title="Yayinlama Ayarlari"
            subtitle="Blog yazinizin dil ve hedef kitle ayarlarini yapin"
            icon={<Settings className="size-5" />}
            size="sm"
            className="mb-6"
          />

          <div className="grid gap-6 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="language">Dil</Label>
              <select
                id="language"
                value={formData.language}
                onChange={(e) => handleChange("language", e.target.value)}
                className="flex h-10 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm transition-colors hover:border-primary/50 focus:border-primary focus:outline-none"
              >
                <option value="tr">Turkce</option>
                <option value="en">Ingilizce</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="readingLevel">Okuma Seviyesi</Label>
              <select
                id="readingLevel"
                value={formData.readingLevel}
                onChange={(e) => handleChange("readingLevel", e.target.value)}
                className="flex h-10 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm transition-colors hover:border-primary/50 focus:border-primary focus:outline-none"
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
                className="flex h-10 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm transition-colors hover:border-primary/50 focus:border-primary focus:outline-none"
              >
                {TARGET_AUDIENCE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </DashboardCard>

        {/* Submit Actions */}
        <div className="flex items-center justify-between rounded-xl border border-border bg-white p-4 shadow-sm">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.push("/dashboard/blogs")}
          >
            Iptal
          </Button>

          <Button
            type="submit"
            disabled={isSubmitting || formData.content.length < 50}
            className="min-w-[150px] gap-2"
          >
            {isSubmitting ? (
              <>
                <span className="inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Gonderiliyor...
              </>
            ) : (
              <>
                <Save className="size-4" />
                Blog Yazisini Olustur
              </>
            )}
          </Button>
        </div>

        {/* Info Notice */}
        <DashboardCard padding="md">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500">
              <CheckCircle className="size-5" />
            </div>
            <div>
              <h4 className="mb-1 font-semibold text-foreground">
                Yayinlama Sureci
              </h4>
              <p className="text-sm text-muted-foreground">
                Blog yaziniz "pending_review" durumunda MyTrip yoneticileri
                tarafindan incelenecek. Onaylandiktan sonra halka acilacak. Bu
                surec genellikle 24-48 saat surer.
              </p>
            </div>
          </div>
        </DashboardCard>
      </form>
    </div>
  );
}
