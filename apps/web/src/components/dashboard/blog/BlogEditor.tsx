"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Save,
  Eye,
  Send,
  ChevronLeft,
  FileText,
  ImageIcon,
  Search,
  Settings,
  Tag,
  X,
  Clock,
  CheckCircle,
  AlertTriangle,
  PanelRightClose,
  PanelRightOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TipTapEditor } from "@/components/ui/tiptap-editor";
import { FileUpload } from "@/components/ui/file-upload";
import { StatusBadge } from "@/components/dashboard";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

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
  { value: "easy", label: "Kolay (2 dk)" },
  { value: "medium", label: "Orta (5 dk)" },
  { value: "hard", label: "Zor (10 dk)" },
] as const;

const TARGET_AUDIENCE_OPTIONS = [
  { value: "travelers", label: "Gezginler" },
  { value: "locals", label: "Yereliler" },
  { value: "business_owners", label: "İşletme Sahipleri" },
  { value: "all", label: "Herkes" },
] as const;

const STATUS_CONFIG = {
  draft: {
    label: "Taslak",
    icon: FileText,
    color: "bg-slate-100 text-slate-600",
    message: "Bu blog taslak durumunda. İncelemeye gönderilebilir.",
  },
  pending_review: {
    label: "İnceleniyor",
    icon: Clock,
    color: "bg-amber-100 text-amber-600",
    message: "Blog inceleniyor. 24-48 saat içinde sonuçlanır.",
  },
  published: {
    label: "Yayında",
    icon: CheckCircle,
    color: "bg-emerald-100 text-emerald-600",
    message: "Blog yayında. Düzenleme için taslağa alın.",
  },
  rejected: {
    label: "Reddedildi",
    icon: AlertTriangle,
    color: "bg-red-100 text-red-600",
    message: "Blog reddedildi. Geribildirime göre düzenleyin.",
  },
  archived: {
    label: "Arşiv",
    icon: FileText,
    color: "bg-slate-100 text-slate-600",
    message: "Blog arşivlenmiş durumda.",
  },
};

interface BlogEditorProps {
  mode: "create" | "edit";
  blogId?: string;
}

export function BlogEditor({ mode, blogId }: BlogEditorProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [formData, setFormData] = React.useState({
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
    targetAudience: "travelers" as (typeof TARGET_AUDIENCE_OPTIONS)[number]["value"],
  });

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [hasChanges, setHasChanges] = React.useState(false);
  const [tagsInput, setTagsInput] = React.useState("");
  const [keywordsInput, setKeywordsInput] = React.useState("");
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  // Fetch existing blog for edit mode
  const { data: blogData, isLoading: isBlogLoading } = useQuery({
    queryKey: ["blog-detail", blogId],
    queryFn: () => api.owner.blogs.getById(blogId!),
    enabled: mode === "edit" && !!blogId,
  });

  const blog = blogData?.blog;
  const blogStatus = (blog?.status || "draft") as keyof typeof STATUS_CONFIG;
  const isPublished = blogStatus === "published";
  const statusConfig = STATUS_CONFIG[blogStatus] || STATUS_CONFIG.draft;
  const StatusIcon = statusConfig.icon;

  // Load blog data into form
  React.useEffect(() => {
    if (blog) {
      setFormData({
        title: blog.title || "",
        slug: blog.slug || "",
        excerpt: blog.excerpt || "",
        content: blog.content || "",
        heroImage: blog.heroImage || "",
        featuredImage: blog.featuredImage || "",
        category: blog.category || "travel",
        tags: typeof blog.tags === "string" ? JSON.parse(blog.tags) : blog.tags || [],
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

  // Mutations
  const createBlogMutation = useMutation({
    mutationFn: (data: typeof formData) => api.owner.blogs.create(data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["owner-blogs"] });
      queryClient.invalidateQueries({ queryKey: ["usage"] });
      router.push(`/dashboard/blogs/${result.blog.id}/edit`);
    },
    onError: (error: Error) => {
      console.error("Create blog error:", error);
      alert(error.message || "Blog oluşturulamadı");
      setIsSubmitting(false);
    },
  });

  const updateBlogMutation = useMutation({
    mutationFn: (data: typeof formData) => api.owner.blogs.update(blogId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-detail", blogId] });
      queryClient.invalidateQueries({ queryKey: ["owner-blogs"] });
      setHasChanges(false);
      setIsSubmitting(false);
    },
    onError: (error: Error) => {
      console.error("Update blog error:", error);
      alert(error.message || "Güncelleme başarısız");
      setIsSubmitting(false);
    },
  });

  const publishBlogMutation = useMutation({
    mutationFn: () => api.owner.blogs.publish(blogId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-detail", blogId] });
      queryClient.invalidateQueries({ queryKey: ["owner-blogs"] });
    },
    onError: (error: Error) => {
      console.error("Publish blog error:", error);
      alert(error.message || "Yayınlama başarısız");
    },
  });

  // Generate slug from title
  const generateSlug = (title: string) => {
    // Turkish character mappings
    const turkishMap: Record<string, string> = {
      ç: "c", ğ: "g", ı: "i", ö: "o", ş: "s", ü: "u",
      Ç: "c", Ğ: "g", İ: "i", Ö: "o", Ş: "s", Ü: "u",
    };
    
    return title
      .toLowerCase()
      .replace(/[çğıöşüÇĞİÖŞÜ]/g, (char) => turkishMap[char] || char)
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleChange = (field: keyof typeof formData, value: any) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };
      
      // Auto-generate slug when title changes (only if slug is empty or matches old slug pattern)
      if (field === "title" && (mode === "create" || !prev.slug || prev.slug === generateSlug(prev.title))) {
        updated.slug = generateSlug(value);
      }
      
      return updated;
    });
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      alert("Blog başlığı gereklidir");
      return;
    }

    setIsSubmitting(true);

    if (mode === "create") {
      createBlogMutation.mutate(formData);
    } else {
      updateBlogMutation.mutate(formData);
    }
  };

  const handlePublish = () => {
    if (hasChanges) {
      alert("Önce değişiklikleri kaydedin");
      return;
    }

    if (window.confirm("Blog yazısını incelemeye göndermek istediğinize emin misiniz?")) {
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
    handleChange("tags", formData.tags.filter((t) => t !== tagToRemove));
  };

  const handleAddKeyword = () => {
    const keyword = keywordsInput.trim();
    if (keyword && !formData.seoKeywords.includes(keyword)) {
      handleChange("seoKeywords", [...formData.seoKeywords, keyword]);
      setKeywordsInput("");
    }
  };

  const handleRemoveKeyword = (keywordToRemove: string) => {
    handleChange("seoKeywords", formData.seoKeywords.filter((k) => k !== keywordToRemove));
  };

  const handleImageUpload = async (file: File) => {
    return api.owner.upload.single(file);
  };

  if (mode === "edit" && isBlogLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Header */}
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-border bg-white px-6 py-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/dashboard/blogs")}
            className="size-10"
          >
            <ChevronLeft className="size-6" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">
              {mode === "create" ? "Yeni Blog Yazısı" : "Blog Düzenle"}
            </h1>
            {mode === "edit" && (
              <div className="flex items-center gap-2 mt-1">
                <StatusBadge status={blogStatus} />
                {hasChanges && (
                  <span className="text-xs text-amber-600">• Kaydedilmemiş değişiklikler</span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {mode === "edit" && blog?.slug && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`/blog/${blog.slug}`, "_blank")}
            >
              <Eye className="mr-2 size-4" />
              Önizle
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            disabled={isSubmitting || (mode === "edit" && !hasChanges) || isPublished}
          >
            {isSubmitting ? (
              <>
                <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                <span className="ml-2">Kaydediliyor...</span>
              </>
            ) : (
              <>
                <Save className="mr-2 size-4" />
                {mode === "create" ? "Oluştur" : "Kaydet"}
              </>
            )}
          </Button>

          {mode === "edit" && blogStatus === "draft" && (
            <Button
              onClick={handlePublish}
              disabled={publishBlogMutation.isPending || hasChanges}
            >
              {publishBlogMutation.isPending ? (
                <>
                  <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  <span className="ml-2">Gönderiliyor...</span>
                </>
              ) : (
                <>
                  <Send className="mr-2 size-4" />
                  İncelemeye Gönder
                </>
              )}
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden"
          >
            {sidebarOpen ? <PanelRightClose className="size-5" /> : <PanelRightOpen className="size-5" />}
          </Button>
        </div>
      </header>

      {/* Status Message */}
      {mode === "edit" && (
        <div className={cn("flex items-center gap-2 px-4 py-2 text-sm", statusConfig.color)}>
          <StatusIcon className="size-4" />
          <span>{statusConfig.message}</span>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Editor Panel */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Title */}
            <Input
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="Blog başlığını girin..."
              disabled={isPublished}
              className="border-0 bg-transparent px-0 text-3xl font-bold focus-visible:ring-0 placeholder:text-slate-300"
            />

            {/* Content Editor */}
            <TipTapEditor
              content={formData.content}
              onChange={(content) => handleChange("content", content)}
              placeholder="Hikayenizi buraya yazın..."
              disabled={isPublished}
              minHeight="600px"
              onImageUpload={handleImageUpload}
            />
          </div>
        </div>

        {/* Sidebar */}
        <aside
          className={cn(
            "w-[440px] shrink-0 overflow-y-auto border-l border-border bg-slate-50 transition-all lg:block",
            sidebarOpen ? "block" : "hidden"
          )}
        >
          <div className="p-5 space-y-6">
            {/* URL Slug */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase text-muted-foreground">
                URL Slug
              </Label>
              <Input
                value={formData.slug}
                onChange={(e) => handleChange("slug", e.target.value)}
                placeholder="url-slug"
                disabled={isPublished}
                className="text-sm"
              />
            </div>

            {/* Hero Image */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase text-muted-foreground">
                <ImageIcon className="mr-1 inline size-3" />
                Kapak Görseli
              </Label>
              <FileUpload
                value={formData.heroImage}
                onChange={(url) => handleChange("heroImage", url)}
                onRemove={() => handleChange("heroImage", "")}
                disabled={isPublished}
                aspectRatio="video"
                label="Kapak görseli yükle"
              />
            </div>

            {/* Featured Image */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase text-muted-foreground">
                Öne Çıkan Görsel
              </Label>
              <FileUpload
                value={formData.featuredImage}
                onChange={(url) => handleChange("featuredImage", url)}
                onRemove={() => handleChange("featuredImage", "")}
                disabled={isPublished}
                aspectRatio="square"
                label="Öne çıkan görsel yükle"
              />
            </div>

            {/* Excerpt */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase text-muted-foreground">
                Özet
              </Label>
              <textarea
                value={formData.excerpt}
                onChange={(e) => handleChange("excerpt", e.target.value)}
                placeholder="Blog özeti (1-2 cümle)"
                disabled={isPublished}
                maxLength={500}
                className="w-full resize-none rounded-lg border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none disabled:opacity-60"
                rows={3}
              />
              <p className="text-xs text-muted-foreground">{formData.excerpt.length}/500</p>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase text-muted-foreground">
                Kategori
              </Label>
              <select
                value={formData.category}
                onChange={(e) => handleChange("category", e.target.value)}
                disabled={isPublished}
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none disabled:opacity-60"
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase text-muted-foreground">
                <Tag className="mr-1 inline size-3" />
                Etiketler
              </Label>
              <div className="flex gap-2">
                <Input
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="Etiket ekle"
                  disabled={isPublished}
                  className="text-sm"
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
                  size="icon"
                  onClick={handleAddTag}
                  disabled={!tagsInput.trim() || isPublished}
                >
                  <Tag className="size-4" />
                </Button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs text-primary"
                    >
                      {tag}
                      {!isPublished && (
                        <button type="button" onClick={() => handleRemoveTag(tag)}>
                          <X className="size-3" />
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* SEO Section */}
            <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Search className="size-4" />
                SEO Ayarları
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">SEO Başlığı</Label>
                <Input
                  value={formData.seoTitle}
                  onChange={(e) => handleChange("seoTitle", e.target.value)}
                  placeholder={formData.title || "SEO başlığı"}
                  disabled={isPublished}
                  maxLength={100}
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">SEO Açıklaması</Label>
                <textarea
                  value={formData.seoDescription}
                  onChange={(e) => handleChange("seoDescription", e.target.value)}
                  placeholder="Arama sonuçlarında görünecek açıklama"
                  disabled={isPublished}
                  maxLength={300}
                  className="w-full resize-none rounded-lg border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none disabled:opacity-60"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Anahtar Kelimeler</Label>
                <div className="flex gap-2">
                  <Input
                    value={keywordsInput}
                    onChange={(e) => setKeywordsInput(e.target.value)}
                    placeholder="Kelime ekle"
                    disabled={isPublished}
                    className="text-sm"
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
                    size="icon"
                    onClick={handleAddKeyword}
                    disabled={!keywordsInput.trim() || isPublished}
                  >
                    +
                  </Button>
                </div>
                {formData.seoKeywords.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {formData.seoKeywords.map((kw) => (
                      <span
                        key={kw}
                        className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs"
                      >
                        {kw}
                        {!isPublished && (
                          <button type="button" onClick={() => handleRemoveKeyword(kw)}>
                            <X className="size-3" />
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Publishing Settings */}
            <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Settings className="size-4" />
                Yayın Ayarları
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Dil</Label>
                <select
                  value={formData.language}
                  onChange={(e) => handleChange("language", e.target.value)}
                  disabled={isPublished}
                  className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none disabled:opacity-60"
                >
                  <option value="tr">Türkçe</option>
                  <option value="en">English</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Okuma Seviyesi</Label>
                <select
                  value={formData.readingLevel}
                  onChange={(e) => handleChange("readingLevel", e.target.value)}
                  disabled={isPublished}
                  className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none disabled:opacity-60"
                >
                  {READING_LEVEL_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Hedef Kitle</Label>
                <select
                  value={formData.targetAudience}
                  onChange={(e) => handleChange("targetAudience", e.target.value)}
                  disabled={isPublished}
                  className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none disabled:opacity-60"
                >
                  {TARGET_AUDIENCE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
