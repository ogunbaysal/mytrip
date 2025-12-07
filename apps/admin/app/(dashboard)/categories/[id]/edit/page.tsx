
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Textarea } from "@/components/ui/textarea";
import { useCategory, useUpdateCategory } from "@/hooks/use-categories";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

const formSchema = z.object({
  name: z.string().min(2, "Kategori adı en az 2 karakter olmalıdır"),
  description: z.string().optional(),
  icon: z.string().optional(),
});

export default function EditCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const { data: category, isLoading } = useCategory(id);
  const { mutate: updateCategory, isPending } = useUpdateCategory();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      icon: "",
    },
  });

  // Reset form when data is loaded
  useEffect(() => {
    if (category) {
      form.reset({
        name: category.name,
        description: category.description || "",
        icon: category.icon || "",
      });
    }
  }, [category, form]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    updateCategory({ id, data: values }, {
      onSuccess: () => {
        router.push("/categories");
      },
    });
  }

  if (isLoading) return <div>Yükleniyor...</div>;

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center space-x-4 mb-6">
        <Link href="/categories">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h2 className="text-3xl font-bold tracking-tight">Kategoriyi Düzenle</h2>
      </div>

      <div className="max-w-2xl">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kategori Adı</FormLabel>
                  <FormControl>
                    <Input placeholder="Örn: Butik Otel" {...field} />
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
                        placeholder="Kategori hakkında kısa açıklama..." 
                        {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
                control={form.control}
                name="icon"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>İkon (Opsiyonel)</FormLabel>
                        <FormControl>
                            <Input placeholder="Örn: hotel, star..." {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <Button type="submit" disabled={isPending}>
              {isPending ? "Güncelleniyor..." : "Güncelle"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
