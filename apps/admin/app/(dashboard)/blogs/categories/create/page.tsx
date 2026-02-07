"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useCreateBlogCategory } from "@/hooks/use-blogs";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

const formSchema = z.object({
  name: z.string().min(2, "Kategori adı en az 2 karakter olmalıdır"),
  slug: z.string().min(2, "Slug en az 2 karakter olmalıdır"),
  description: z.string().optional(),
  sortOrder: z.coerce.number().int().min(0),
  active: z.boolean().default(true),
});

export default function CreateBlogCategoryPage() {
  const router = useRouter();
  const { mutate: createCategory, isPending } = useCreateBlogCategory();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      sortOrder: 0,
      active: true,
    },
  });

  const nameValue = form.watch("name");
  const slugDirty = form.getFieldState("slug").isDirty;

  const autoSlug = (value: string) =>
    value
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\-ğüşöçıİĞÜŞÖÇ]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

  useEffect(() => {
    if (!nameValue || slugDirty) return;
    const nextSlug = autoSlug(nameValue);
    if (form.getValues("slug") !== nextSlug) {
      form.setValue("slug", nextSlug);
    }
  }, [form, nameValue, slugDirty]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    createCategory(values, {
      onSuccess: () => {
        toast.success("Blog kategorisi oluşturuldu");
        router.push("/blogs/categories");
      },
      onError: (error: Error) => {
        toast.error(error.message || "Kategori oluşturulamadı");
      },
    });
  };

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="outline" size="icon">
          <Link href="/blogs/categories">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Yeni Blog Kategorisi</h1>
          <p className="text-sm text-muted-foreground">Kategori bilgilerini girin.</p>
        </div>
      </div>

      <div className="max-w-2xl rounded-lg border p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-5">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ad</FormLabel>
                  <FormControl>
                    <Input placeholder="Örn: Gezi Rehberi" {...field} />
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
                  <FormLabel>Slug</FormLabel>
                  <FormControl>
                    <Input placeholder="gezi-rehberi" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Açıklama</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Kategori açıklaması..."
                      rows={4}
                      value={field.value || ""}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="sortOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sıra</FormLabel>
                    <FormControl>
                      <Input type="number" min={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex h-full items-center justify-between rounded-lg border px-4 py-3">
                    <FormLabel>Aktif</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex items-center gap-2">
              <Button type="submit" disabled={isPending}>
                {isPending ? "Kaydediliyor..." : "Kaydet"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.push("/blogs/categories")}>
                Vazgeç
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
