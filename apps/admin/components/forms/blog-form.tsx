"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import type { BlogPost } from "@/hooks/use-blogs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { FileUpload } from "@/components/ui/file-upload";
import { MultiFileUpload } from "@/components/ui/multi-file-upload";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TagsInput } from "@/components/ui/tags-input";
import { Textarea } from "@/components/ui/textarea";
import { TiptapEditor } from "@/components/ui/tiptap-editor";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { Eye, Heart, MessageCircle, Share2 } from "lucide-react";

const CATEGORIES = [
  "travel",
  "food",
  "culture",
  "history",
  "activity",
  "lifestyle",
  "business",
] as const;
const STATUSES = ["published", "draft", "pending_review", "archived"] as const;
const LANGUAGES = ["tr", "en"] as const;
const READING_LEVELS = ["easy", "medium", "hard"] as const;
const AUDIENCES = ["travelers", "locals", "business_owners", "all"] as const;

const CATEGORY_LABELS: Record<(typeof CATEGORIES)[number], string> = {
  travel: "Seyahat",
  food: "Yeme & İçme",
  culture: "Kültür",
  history: "Tarih",
  activity: "Aktivite",
  lifestyle: "Yaşam Tarzı",
  business: "İş Dünyası",
};

const STATUS_LABELS: Record<(typeof STATUSES)[number], string> = {
  published: "Yayında",
  draft: "Taslak",
  pending_review: "İncelemede",
  archived: "Arşivlendi",
};

const LANGUAGE_LABELS: Record<(typeof LANGUAGES)[number], string> = {
  tr: "Türkçe",
  en: "İngilizce",
};

const STATUS_BADGE_STYLES: Record<(typeof STATUSES)[number], string> = {
  published: "border-emerald-200 bg-emerald-500/10 text-emerald-700",
  draft: "border-slate-200 bg-slate-500/10 text-slate-700",
  pending_review: "border-amber-200 bg-amber-500/10 text-amber-700",
  archived: "border-rose-200 bg-rose-500/10 text-rose-700",
};

const blogFormSchema = z.object({
  title: z.string().min(2, {
    message: "Başlık en az 2 karakter olmalıdır.",
  }),
  slug: z.string().optional(),
  excerpt: z.string().optional(),
  content: z.string().min(10, {
    message: "İçerik en az 10 karakter olmalıdır.",
  }),
  category: z.enum(CATEGORIES),
  status: z.enum(STATUSES),
  language: z.enum(LANGUAGES),
  readingLevel: z.enum(READING_LEVELS),
  targetAudience: z.enum(AUDIENCES),
  heroImage: z.string().optional().or(z.literal("")),
  featuredImage: z.string().optional().or(z.literal("")),
  images: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  featured: z.boolean().default(false),
  publishedAt: z.string().optional(),
  readTime: z
    .preprocess((value) => {
      if (value === "" || value === null || typeof value === "undefined") {
        return undefined;
      }
      const parsed = Number(value);
      return Number.isNaN(parsed) ? undefined : parsed;
    }, z.number().int().positive())
    .optional(),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  seoKeywords: z.array(z.string()).default([]),
});

export type BlogFormValues = z.infer<typeof blogFormSchema>;

export type BlogFormSubmitValues = Omit<
  BlogFormValues,
  "tags" | "seoKeywords" | "images"
> & {
  tags: string;
  seoKeywords: string;
  images: string;
};

const defaultValues: BlogFormValues = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  category: "travel",
  status: "draft",
  language: "tr",
  readingLevel: "medium",
  targetAudience: "travelers",
  heroImage: "",
  featuredImage: "",
  images: [],
  tags: [],
  featured: false,
  publishedAt: "",
  readTime: undefined,
  seoTitle: "",
  seoDescription: "",
  seoKeywords: [],
};

const generateSlug = (text: string) =>
  text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");

const normalizeArray = (value?: string | string[] | null) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [value];
  } catch {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
};

const toDateTimeLocal = (value?: string | Date | null) => {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";

  const pad = (num: number) => String(num).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const stripHtml = (html: string) =>
  html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

interface BlogFormProps {
  mode?: "create" | "edit";
  initialData?: BlogPost | null;
  onSubmit: (data: BlogFormSubmitValues) => void;
  isSubmitting?: boolean;
  onCancel?: () => void;
}

export function BlogForm({
  mode = "create",
  initialData,
  onSubmit,
  isSubmitting = false,
  onCancel,
}: BlogFormProps) {
  const form = useForm<BlogFormValues>({
    resolver: zodResolver(blogFormSchema) as any,
    defaultValues,
  });

  useEffect(() => {
    if (!initialData) return;

    form.reset({
      title: initialData.title || "",
      slug: initialData.slug || "",
      excerpt: initialData.excerpt || "",
      content: initialData.content || "",
      category: initialData.category || "travel",
      status: initialData.status || "draft",
      language: initialData.language || "tr",
      readingLevel: initialData.readingLevel || "medium",
      targetAudience: initialData.targetAudience || "travelers",
      heroImage: initialData.heroImage || "",
      featuredImage: initialData.featuredImage || "",
      images: normalizeArray(initialData.images),
      tags: normalizeArray(initialData.tags),
      featured: Boolean(initialData.featured),
      publishedAt: toDateTimeLocal(initialData.publishedAt),
      readTime: initialData.readTime ?? undefined,
      seoTitle: initialData.seoTitle || "",
      seoDescription: initialData.seoDescription || "",
      seoKeywords: normalizeArray(initialData.seoKeywords),
    });
  }, [form, initialData]);

  const titleValue = form.watch("title");
  const slugValue = form.watch("slug");
  const excerptValue = form.watch("excerpt");
  const contentValue = form.watch("content");
  const statusValue = form.watch("status");
  const categoryValue = form.watch("category");
  const languageValue = form.watch("language");
  const featuredValue = form.watch("featured");
  const heroImageValue = form.watch("heroImage");
  const readTimeValue = form.watch("readTime");
  const seoTitleValue = form.watch("seoTitle");
  const seoDescriptionValue = form.watch("seoDescription");

  useEffect(() => {
    if (!titleValue) return;
    if (!form.getFieldState("title").isDirty) return;
    if (form.getFieldState("slug").isDirty) return;

    form.setValue("slug", generateSlug(titleValue), { shouldValidate: true });
  }, [form, titleValue]);

  const contentText = useMemo(
    () => stripHtml(contentValue || ""),
    [contentValue],
  );
  const wordCount = contentText ? contentText.split(" ").length : 0;
  const characterCount = contentText.length;
  const estimatedReadTime = wordCount
    ? Math.max(1, Math.ceil(wordCount / 220))
    : 0;

  useEffect(() => {
    if (!estimatedReadTime) return;
    if (form.getFieldState("readTime").isDirty) return;
    if (readTimeValue) return;

    form.setValue("readTime", estimatedReadTime, { shouldValidate: true });
  }, [estimatedReadTime, form, readTimeValue]);

  const handleSubmit = (values: BlogFormValues) => {
    const publishedAtValue = values.publishedAt?.trim();
    const parsedDate = publishedAtValue
      ? new Date(publishedAtValue)
      : undefined;
    const resolvedPublishedAt =
      parsedDate && !Number.isNaN(parsedDate.getTime())
        ? parsedDate.toISOString()
        : undefined;

    const serializeArray = (value?: string[]) => JSON.stringify(value || []);

    onSubmit({
      ...values,
      publishedAt: resolvedPublishedAt,
      readTime: values.readTime || undefined,
      tags: serializeArray(values.tags),
      seoKeywords: serializeArray(values.seoKeywords),
      images: serializeArray(values.images),
    });
  };

  const submitLabel = mode === "edit" ? "Güncelle" : "Oluştur";
  const submittingLabel =
    mode === "edit" ? "Güncelleniyor..." : "Oluşturuluyor...";

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <Tabs defaultValue="content" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="content">İçerik</TabsTrigger>
                <TabsTrigger value="media">Medya</TabsTrigger>
                <TabsTrigger value="seo">SEO</TabsTrigger>
              </TabsList>

              <TabsContent value="content" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Başlık ve İçerik</CardTitle>
                    <CardDescription>
                      Blog yazısının başlığını, özetini ve ana içeriğini
                      düzenleyin.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Başlık</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Blog yazısı başlığı..."
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="slug"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>URL Yolu (Slug)</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="ornek-blog-yazisi"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription className="text-xs">
                              Otomatik oluşturulur. Önizleme:{" "}
                              {`/blog/${slugValue || "ornek-baslik"}`}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="excerpt"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Özet</FormLabel>
                          <FormControl>
                            <Textarea
                              className="min-h-[100px]"
                              placeholder="Kısa özet..."
                              {...field}
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            {`Arama ve liste görünümü için 140-180 karakter idealdir. (${(excerptValue || "").length} karakter)`}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>İçerik</FormLabel>
                          <FormControl>
                            <TiptapEditor
                              value={field.value}
                              onChange={field.onChange}
                              onImageUpload={(file) => api.upload.single(file)}
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            İçeriği bloklara ayırın, başlıkları hiyerarşik
                            kullanın.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="media" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Görseller</CardTitle>
                    <CardDescription>
                      Kapak, öne çıkan ve galeri görsellerini buradan yönetin.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 lg:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="heroImage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Kapak Görseli</FormLabel>
                            <FormControl>
                              <FileUpload
                                value={field.value}
                                onChange={field.onChange}
                                onRemove={() => field.onChange("")}
                                label="Kapak Görseli Yükle"
                                aspectRatio="video"
                              />
                            </FormControl>
                            <FormDescription className="text-xs">
                              Detay sayfasında üst bölümde görünür.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="featuredImage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Öne Çıkan Görsel</FormLabel>
                            <FormControl>
                              <FileUpload
                                value={field.value}
                                onChange={field.onChange}
                                onRemove={() => field.onChange("")}
                                label="Öne Çıkan Görsel Yükle"
                                aspectRatio="square"
                              />
                            </FormControl>
                            <FormDescription className="text-xs">
                              Liste ve kart görünümlerinde kullanılır.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="images"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Galeri</FormLabel>
                          <FormControl>
                            <MultiFileUpload
                              values={field.value || []}
                              onChange={field.onChange}
                              maxFiles={12}
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            Ek görselleri burada yükleyebilir ve maksimum 12
                            görsel ekleyebilirsiniz.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="seo" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>SEO Ayarları</CardTitle>
                    <CardDescription>
                      Arama motorları ve sosyal paylaşım için başlık ve açıklama
                      belirleyin.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="seoTitle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SEO Başlığı</FormLabel>
                          <FormControl>
                            <Input placeholder="Meta title..." {...field} />
                          </FormControl>
                          <FormDescription className="text-xs">
                            {`Önerilen: 50-60 karakter. (${(field.value || "").length} karakter)`}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="seoDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SEO Açıklaması</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Meta description..."
                              {...field}
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            {`Önerilen: 140-160 karakter. (${(field.value || "").length} karakter)`}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="seoKeywords"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SEO Anahtar Kelimeler</FormLabel>
                          <FormControl>
                            <TagsInput
                              value={field.value || []}
                              onChange={field.onChange}
                              placeholder="Kelime ekle..."
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Arama Önizlemesi</CardTitle>
                    <CardDescription>
                      Google arama sonucunda nasıl görüneceğine dair önizleme.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="text-xs text-muted-foreground">
                      {`https://tatildesen.com/blog/${slugValue || "ornek-baslik"}`}
                    </div>
                    <div className="text-base font-semibold text-primary">
                      {seoTitleValue || titleValue || "SEO Başlığı"}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {seoDescriptionValue ||
                        excerptValue ||
                        "Bu alanda yazınızın kısa açıklaması görünecek."}
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-6 lg:sticky lg:top-6">
            <Card>
              <CardHeader>
                <CardTitle>Yayın Ayarları</CardTitle>
                <CardDescription>
                  Yayın durumu ve görünürlük kontrolü.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Durum</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Durum seçiniz" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft">Taslak</SelectItem>
                          <SelectItem value="published">Yayında</SelectItem>
                          <SelectItem value="pending_review">
                            İncelemede
                          </SelectItem>
                          <SelectItem value="archived">Arşivlendi</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="featured"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Öne Çıkan</FormLabel>
                        <FormDescription className="text-xs">
                          Blog listelerinde öne çıkarılır.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="publishedAt"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Yayın Tarihi</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          value={field.value || ""}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Boş bırakılırsa yayın sırasında otomatik atanır.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="readTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Okuma Süresi (dk)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          value={field.value ?? ""}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        {estimatedReadTime
                          ? `Önerilen okuma süresi: ${estimatedReadTime} dk`
                          : "Okuma süresini dakika olarak belirleyin."}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="rounded-lg border bg-muted/40 p-2">
                    <div className="text-muted-foreground">Kelime</div>
                    <div className="text-base font-semibold">{wordCount}</div>
                  </div>
                  <div className="rounded-lg border bg-muted/40 p-2">
                    <div className="text-muted-foreground">Karakter</div>
                    <div className="text-base font-semibold">
                      {characterCount}
                    </div>
                  </div>
                  <div className="rounded-lg border bg-muted/40 p-2">
                    <div className="text-muted-foreground">Tahmini</div>
                    <div className="text-base font-semibold">
                      {estimatedReadTime ? `${estimatedReadTime} dk` : "-"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sınıflandırma</CardTitle>
                <CardDescription>
                  İçeriği doğru kategori ve hedef kitleyle eşleştirin.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kategori</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Kategori seçiniz" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="travel">Seyahat</SelectItem>
                          <SelectItem value="food">Yeme & İçme</SelectItem>
                          <SelectItem value="culture">Kültür</SelectItem>
                          <SelectItem value="history">Tarih</SelectItem>
                          <SelectItem value="activity">Aktivite</SelectItem>
                          <SelectItem value="lifestyle">Yaşam Tarzı</SelectItem>
                          <SelectItem value="business">İş Dünyası</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Etiketler</FormLabel>
                      <FormControl>
                        <TagsInput
                          value={field.value || []}
                          onChange={field.onChange}
                          placeholder="Etiket ekle..."
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        İçeriği filtrelemek ve keşfedilebilirliği artırmak için
                        kullanılır.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dil</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Dil seçiniz" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="tr">Türkçe</SelectItem>
                          <SelectItem value="en">İngilizce</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="readingLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Okuma Seviyesi</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seviye seçiniz" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="easy">Kolay</SelectItem>
                          <SelectItem value="medium">Orta</SelectItem>
                          <SelectItem value="hard">Zor</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="targetAudience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hedef Kitle</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Kitle seçiniz" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="travelers">Gezginler</SelectItem>
                          <SelectItem value="locals">Yerel Halk</SelectItem>
                          <SelectItem value="business_owners">
                            İşletme Sahipleri
                          </SelectItem>
                          <SelectItem value="all">Herkes</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Önizleme</CardTitle>
                <CardDescription>
                  Yayın görünümünün hızlı özeti.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="overflow-hidden rounded-xl border bg-muted/40">
                  {heroImageValue ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={heroImageValue}
                      alt="Hero"
                      className="h-40 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-40 items-center justify-center text-xs text-muted-foreground">
                      Kapak görseli ekleyin
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">
                      {CATEGORY_LABELS[categoryValue]}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn("border", STATUS_BADGE_STYLES[statusValue])}
                    >
                      {STATUS_LABELS[statusValue]}
                    </Badge>
                    <Badge variant="secondary">
                      {LANGUAGE_LABELS[languageValue]}
                    </Badge>
                    {featuredValue && (
                      <Badge className="bg-yellow-400 text-black">
                        Öne Çıkan
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="text-lg font-semibold leading-tight">
                      {titleValue || "Başlık önizlemesi"}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {excerptValue || "Blog özetiniz burada görünecek."}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span>{LANGUAGE_LABELS[languageValue]}</span>
                    <span>
                      {readTimeValue || estimatedReadTime
                        ? `${readTimeValue || estimatedReadTime} dk okuma`
                        : "Okuma süresi"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {mode === "edit" && initialData && (
              <Card>
                <CardHeader>
                  <CardTitle>İstatistikler</CardTitle>
                  <CardDescription>
                    Yayına girdikten sonra oluşan veriler.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border bg-muted/40 p-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Eye className="h-4 w-4" /> Görüntülenme
                    </div>
                    <div className="text-lg font-semibold">
                      {initialData.views}
                    </div>
                  </div>
                  <div className="rounded-lg border bg-muted/40 p-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Heart className="h-4 w-4" /> Beğeni
                    </div>
                    <div className="text-lg font-semibold">
                      {initialData.likeCount}
                    </div>
                  </div>
                  <div className="rounded-lg border bg-muted/40 p-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MessageCircle className="h-4 w-4" /> Yorum
                    </div>
                    <div className="text-lg font-semibold">
                      {initialData.commentCount}
                    </div>
                  </div>
                  <div className="rounded-lg border bg-muted/40 p-3">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Share2 className="h-4 w-4" /> Paylaşım
                    </div>
                    <div className="text-lg font-semibold">
                      {initialData.shareCount}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <Separator />

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button type="button" variant="outline" onClick={() => onCancel?.()}>
            Vazgeç
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? submittingLabel : submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}
