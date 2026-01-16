"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Save,
  Eye,
  AlertTriangle,
  FileText,
  ChevronLeft,
  Info,
  ImageIcon,
  Search,
  Settings,
  CheckCircle,
  Tag,
  X,
  Clock,
  Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  PageHeader,
  DashboardCard,
  ProgressBar,
  SectionHeader,
  StatusBadge,
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

const STATUS_CONFIG = {
  draft: {
    label: "Taslak",
    icon: FileText,
    bgColor: "bg-slate-50",
    textColor: "text-slate-600",
    borderColor: "border-slate-200",
    message:
      "Bu blog yazisi taslak durumunda. Duzenleyip incelemeye gonderebilirsiniz.",
  },
  pending_review: {
    label: "Inceleniyor",
    icon: Clock,
    bgColor: "bg-amber-50",
    textColor: "text-amber-600",
    borderColor: "border-amber-200",
    message:
      "Blog yaziniz inceleniyor. Onay sureci genellikle 24-48 saat surer.",
  },
  published: {
    label: "Yayinda",
    icon: CheckCircle,
    bgColor: "bg-emerald-50",
    textColor: "text-emerald-600",
    borderColor: "border-emerald-200",
    message:
      "Bu blog yazisi yayinda. Duzenleme yapmak icin once taslaga geri alin.",
  },
  rejected: {
    label: "Reddedildi",
    icon: AlertTriangle,
    bgColor: "bg-red-50",
    textColor: "text-red-600",
    borderColor: "border-red-200",
    message:
      "Blog yaziniz reddedildi. Lutfen geribildirime gore duzenleyip tekrar gonderin.",
  },
  archived: {
    label: "Arsivlendi",
    icon: FileText,
    bgColor: "bg-slate-50",
    textColor: "text-slate-600",
    borderColor: "border-slate-200",
    message: "Bu blog yazisi arsivlenmis durumda.",
  },
};

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
  const [hasChanges, setHasChanges] = useState(false);
  const [tagsInput, setTagsInput] = useState("");
  const [keywordsInput, setKeywordsInput] = useState("");

  const { data: blogData, isLoading } = useQuery({
    queryKey: ["blog-detail", blogId],
    queryFn: () => api.owner.blogs.getById(blogId),
    enabled: !!blogId,
  });

  const blog = blogData?.blog;
  const blogStatus = (blog?.status || "draft") as keyof typeof STATUS_CONFIG;
  const isPublished = blogStatus === "published";
  const statusConfig = STATUS_CONFIG[blogStatus] || STATUS_CONFIG.draft;
  const StatusIcon = statusConfig.icon;

  const { data: usageData } = useQuery({
    queryKey: ["usage"],
    queryFn: () => api.subscriptions.getUsage(),
  });

  const usage = usageData?.usage;
  const blogsUsed = usage?.blogs.current || 0;
  const blogsMax = usage?.blogs.max || 1;
  const usagePercentage = Math.round((blogsUsed / blogsMax) * 100);

  const updateBlogMutation = useMutation({
    mutationFn: (data: typeof formData) => api.owner.blogs.update(blogId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-detail", blogId] });
      queryClient.invalidateQueries({ queryKey: ["owner-blogs"] });
      setHasChanges(false);
      setIsSubmitting(false);
    },
    onError: (error: Error) => {
      console.error("Update blog error:", error);
      setIsSubmitting(false);
      alert(error.message || "Guncelleme basarisiz oldu");
    },
  });

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
      alert(error.message || "Yayinlanma basarisiz oldu");
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
    setFormData((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSaveAsDraft = async () => {
    if (!hasChanges) return;

    setIsSubmitting(true);
    updateBlogMutation.mutate(formData);
  };

  const handlePublish = () => {
    if (hasChanges) {
      alert(
        "Degisikliklerinizi kaydediniz. Once kaydedin ve sonra inceleye gonderin.",
      );
      return;
    }

    if (
      window.confirm(
        "Blog yazisini inceleme icin gondermek istediginize emin misiniz?",
      )
    ) {
      publishBlogMutation.mutate();
    }
  };

  const handleAddTag = () => {
    const tag = tagsInput.trim();
    if (tag && !formData.tags.includes(tag)) {
      handleChange("tags", [...formData.tags, tag]);
      setTagsInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    handleChange(
      "tags",
      formData.tags.filter((tag) => tag !== tagToRemove),
    );
  };

  const handleAddKeyword = () => {
    const keyword = keywordsInput.trim();
    if (keyword && !formData.seoKeywords.includes(keyword)) {
      handleChange("seoKeywords", [...formData.seoKeywords, keyword]);
      setKeywordsInput("");
    }
  };

  const handleRemoveKeyword = (keywordToRemove: string) => {
    handleChange(
      "seoKeywords",
      formData.seoKeywords.filter((keyword) => keyword !== keywordToRemove),
    );
  };

  const canPublish = blogStatus === "draft" && !hasChanges;

  if (!blogId || isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Blog Yazisini Duzenle"
        description={blog?.title || "Blog yazisi duzenleniyor"}
        icon={<FileText className="size-5" />}
        breadcrumbs={[
          { label: "Blog Yazilari", href: "/dashboard/blogs" },
          { label: "Duzenle" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Link href={`/blog/${blog?.slug}`} target="_blank">
              <Button variant="outline" size="sm" className="gap-2">
                <Eye className="size-4" />
                Onizleme
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard/blogs")}
              className="gap-2"
            >
              <ChevronLeft className="size-4" />
              Geri
            </Button>
          </div>
        }
      />

      {/* Status Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <DashboardCard
          padding="md"
          className={`border-l-4 ${statusConfig.borderColor}`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${statusConfig.bgColor} ${statusConfig.textColor}`}
            >
              <StatusIcon className="size-5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-foreground">
                  Durum: {statusConfig.label}
                </h3>
                <StatusBadge status={blogStatus} />
              </div>
              <p className="text-sm text-muted-foreground">
                {statusConfig.message}
              </p>
            </div>
          </div>
        </DashboardCard>
      </motion.div>

      {/* Usage Status */}
      <DashboardCard padding="md">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="font-semibold text-foreground">Plan Kullanimi</h3>
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

      <form className="space-y-6">
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
                disabled={isPublished}
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
                disabled={isPublished}
                className="bg-slate-50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Kategori *</Label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => handleChange("category", e.target.value)}
                className="flex h-10 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm transition-colors hover:border-primary/50 focus:border-primary focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isPublished}
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
                  disabled={isPublished}
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
                  disabled={!tagsInput.trim() || isPublished}
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
                      {!isPublished && (
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 hover:text-red-500"
                        >
                          <X className="size-3" />
                        </button>
                      )}
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
                className="flex min-h-[100px] w-full rounded-lg border border-border bg-white px-3 py-2 text-sm transition-colors hover:border-primary/50 focus:border-primary focus:outline-none resize-none disabled:cursor-not-allowed disabled:opacity-50"
                maxLength={500}
                disabled={isPublished}
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
                className="flex min-h-[400px] w-full rounded-lg border border-border bg-white px-3 py-2 text-sm transition-colors hover:border-primary/50 focus:border-primary focus:outline-none resize-none disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isPublished}
                required
              />
              <p className="text-xs text-muted-foreground">
                {formData.content.length} karakter
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
                disabled={isPublished}
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
                disabled={isPublished}
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
                disabled={isPublished}
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
                  disabled={isPublished}
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
                  disabled={!keywordsInput.trim() || isPublished}
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
                      {!isPublished && (
                        <button
                          type="button"
                          onClick={() => handleRemoveKeyword(keyword)}
                          className="ml-1 hover:text-red-500"
                        >
                          <X className="size-3" />
                        </button>
                      )}
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
                className="flex min-h-[100px] w-full rounded-lg border border-border bg-white px-3 py-2 text-sm transition-colors hover:border-primary/50 focus:border-primary focus:outline-none resize-none disabled:cursor-not-allowed disabled:opacity-50"
                maxLength={300}
                disabled={isPublished}
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
                className="flex h-10 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm transition-colors hover:border-primary/50 focus:border-primary focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isPublished}
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
                className="flex h-10 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm transition-colors hover:border-primary/50 focus:border-primary focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
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
                className="flex h-10 w-full rounded-lg border border-border bg-white px-3 py-2 text-sm transition-colors hover:border-primary/50 focus:border-primary focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
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

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleSaveAsDraft}
              disabled={!hasChanges || isSubmitting || isPublished}
              className="gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Kaydediliyor...
                </>
              ) : (
                <>
                  <Save className="size-4" />
                  Taslak Olarak Kaydet
                </>
              )}
            </Button>

            {blogStatus === "draft" && (
              <Button
                type="button"
                onClick={handlePublish}
                disabled={publishBlogMutation.isPending || hasChanges}
                className="gap-2"
              >
                {publishBlogMutation.isPending ? (
                  <>
                    <span className="inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Gonderiliyor...
                  </>
                ) : (
                  <>
                    <Send className="size-4" />
                    Incelemeye Gonder
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
