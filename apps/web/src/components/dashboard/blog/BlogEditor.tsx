"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle,
  ChevronLeft,
  Clock,
  Eye,
  FileText,
  ImageIcon,
  PanelRightClose,
  PanelRightOpen,
  Save,
  Search,
  Send,
  Settings,
  Tag,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TipTapEditor } from "@/components/ui/tiptap-editor";
import { FileUpload } from "@/components/ui/file-upload";
import { StatusBadge } from "@/components/dashboard";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

const STATUS_CONFIG = {
  draft: {
    icon: FileText,
    color: "bg-slate-100 text-slate-600",
    message: "Bu blog taslak durumunda. İncelemeye gönderilebilir.",
  },
  pending_review: {
    icon: Clock,
    color: "bg-amber-100 text-amber-600",
    message: "Blog inceleniyor. 24-48 saat içinde sonuçlanır.",
  },
  published: {
    icon: CheckCircle,
    color: "bg-emerald-100 text-emerald-600",
    message: "Blog yayında. Düzenleme için taslağa alın.",
  },
  rejected: {
    icon: AlertTriangle,
    color: "bg-red-100 text-red-600",
    message: "Blog reddedildi. Geribildirime göre düzenleyin.",
  },
  archived: {
    icon: FileText,
    color: "bg-slate-100 text-slate-600",
    message: "Blog arşivlenmiş durumda.",
  },
} as const;

type BlogEditorForm = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  heroImage: string;
  featuredImage: string;
  categoryId: string;
  tags: string[];
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string[];
  language: "tr" | "en";
};

interface BlogEditorProps {
  mode: "create" | "edit";
  blogId?: string;
}

function normalizeStringArray(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).filter(Boolean);
  }
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item)).filter(Boolean);
      }
    } catch {
      return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }
  return [];
}

export function BlogEditor({ mode, blogId }: BlogEditorProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [formData, setFormData] = React.useState<BlogEditorForm>({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    heroImage: "",
    featuredImage: "",
    categoryId: "",
    tags: [],
    seoTitle: "",
    seoDescription: "",
    seoKeywords: [],
    language: "tr",
  });

  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [hasChanges, setHasChanges] = React.useState(false);
  const [tagsInput, setTagsInput] = React.useState("");
  const [keywordsInput, setKeywordsInput] = React.useState("");
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  const { data: blogData, isLoading: isBlogLoading } = useQuery({
    queryKey: ["blog-detail", blogId],
    queryFn: () => api.owner.blogs.getById(blogId!),
    enabled: mode === "edit" && !!blogId,
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["owner-blog-categories"],
    queryFn: () => api.owner.blogs.categories(),
  });

  const categories = categoriesData?.categories || [];
  const blog = blogData?.blog;
  const blogStatus = (blog?.status || "draft") as keyof typeof STATUS_CONFIG;
  const isPublished = blogStatus === "published";
  const statusConfig = STATUS_CONFIG[blogStatus] || STATUS_CONFIG.draft;
  const StatusIcon = statusConfig.icon;

  React.useEffect(() => {
    if (!blog) return;

    setFormData({
      title: blog.title || "",
      slug: blog.slug || "",
      excerpt: blog.excerpt || "",
      content: blog.content || "",
      heroImage: blog.heroImage || "",
      featuredImage: blog.featuredImage || "",
      categoryId: blog.categoryId || "",
      tags: normalizeStringArray(blog.tags),
      seoTitle: blog.seoTitle || "",
      seoDescription: blog.seoDescription || "",
      seoKeywords: normalizeStringArray(blog.seoKeywords),
      language: blog.language || "tr",
    });
  }, [blog]);

  React.useEffect(() => {
    if (mode !== "create") return;
    if (formData.categoryId) return;
    if (categories.length === 0) return;

    setFormData((prev) => ({ ...prev, categoryId: categories[0].id }));
  }, [categories, formData.categoryId, mode]);

  const createBlogMutation = useMutation({
    mutationFn: (data: BlogEditorForm) =>
      api.owner.blogs.create({
        ...data,
        categoryId: data.categoryId || undefined,
      }),
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
    mutationFn: (data: BlogEditorForm) =>
      api.owner.blogs.update(blogId!, {
        ...data,
        categoryId: data.categoryId || undefined,
      }),
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

  const generateSlug = (title: string) => {
    const turkishMap: Record<string, string> = {
      ç: "c",
      ğ: "g",
      ı: "i",
      ö: "o",
      ş: "s",
      ü: "u",
      Ç: "c",
      Ğ: "g",
      İ: "i",
      Ö: "o",
      Ş: "s",
      Ü: "u",
    };

    return title
      .toLowerCase()
      .replace(/[çğıöşüÇĞİÖŞÜ]/g, (char) => turkishMap[char] || char)
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleChange = <K extends keyof BlogEditorForm>(
    field: K,
    value: BlogEditorForm[K],
  ) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value };

      if (
        field === "title" &&
        (mode === "create" || !prev.slug || prev.slug === generateSlug(prev.title))
      ) {
        updated.slug = generateSlug(String(value));
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

    if (!formData.categoryId) {
      alert("Kategori seçimi zorunludur");
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
    handleChange(
      "tags",
      formData.tags.filter((item) => item !== tagToRemove),
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
      formData.seoKeywords.filter((item) => item !== keywordToRemove),
    );
  };

  const handleEditorImageUpload = async (file: File) => {
    return api.owner.upload.single(file, "blog_content");
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
              <div className="mt-1 flex items-center gap-2">
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
              <Eye className="mr-2 size-4" /> Önizle
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
            <Button onClick={handlePublish} disabled={publishBlogMutation.isPending || hasChanges}>
              {publishBlogMutation.isPending ? (
                <>
                  <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  <span className="ml-2">Gönderiliyor...</span>
                </>
              ) : (
                <>
                  <Send className="mr-2 size-4" /> İncelemeye Gönder
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
            {sidebarOpen ? (
              <PanelRightClose className="size-5" />
            ) : (
              <PanelRightOpen className="size-5" />
            )}
          </Button>
        </div>
      </header>

      {mode === "edit" && (
        <div className={cn("flex items-center gap-2 px-4 py-2 text-sm", statusConfig.color)}>
          <StatusIcon className="size-4" />
          <span>{statusConfig.message}</span>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            <Input
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="Blog başlığını girin..."
              disabled={isPublished}
              className="border-0 bg-transparent px-0 text-3xl font-bold placeholder:text-slate-300 focus-visible:ring-0"
            />

            <TipTapEditor
              content={formData.content}
              onChange={(content) => handleChange("content", content)}
              placeholder="Hikayenizi buraya yazın..."
              disabled={isPublished}
              minHeight="600px"
              onImageUpload={handleEditorImageUpload}
            />
          </div>
        </div>

        <aside
          className={cn(
            "w-[440px] shrink-0 overflow-y-auto border-l border-border bg-slate-50 transition-all lg:block",
            sidebarOpen ? "block" : "hidden",
          )}
        >
          <div className="space-y-6 p-5">
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

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase text-muted-foreground">
                <ImageIcon className="mr-1 inline size-3" /> Kapak Görseli
              </Label>
              <FileUpload
                value={formData.heroImage}
                onChange={(url) => handleChange("heroImage", url)}
                onRemove={() => handleChange("heroImage", "")}
                disabled={isPublished}
                aspectRatio="video"
                label="Kapak görseli yükle"
                uploadFn={(file) => api.owner.upload.single(file, "blog_hero")}
              />
            </div>

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
                uploadFn={(file) => api.owner.upload.single(file, "blog_featured")}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase text-muted-foreground">Özet</Label>
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

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase text-muted-foreground">Kategori</Label>
              <select
                value={formData.categoryId}
                onChange={(e) => handleChange("categoryId", e.target.value)}
                disabled={isPublished}
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none disabled:opacity-60"
              >
                <option value="">Kategori seçin</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase text-muted-foreground">
                <Tag className="mr-1 inline size-3" /> Etiketler
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

            <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Search className="size-4" /> SEO Ayarları
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
                    {formData.seoKeywords.map((keyword) => (
                      <span
                        key={keyword}
                        className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs"
                      >
                        {keyword}
                        {!isPublished && (
                          <button type="button" onClick={() => handleRemoveKeyword(keyword)}>
                            <X className="size-3" />
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4 rounded-lg border border-slate-200 bg-white p-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Settings className="size-4" /> Yayın Ayarları
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Dil</Label>
                <select
                  value={formData.language}
                  onChange={(e) => handleChange("language", e.target.value as "tr" | "en")}
                  disabled={isPublished}
                  className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none disabled:opacity-60"
                >
                  <option value="tr">Türkçe</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
