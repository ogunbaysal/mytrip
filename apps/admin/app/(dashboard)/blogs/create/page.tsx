"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { BlogForm } from "@/components/forms/blog-form";
import type { BlogFormSubmitValues } from "@/components/forms/blog-form";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCreateBlog } from "@/hooks/use-blogs";

export default function CreateBlogPage() {
  const router = useRouter();
  const { mutate: createBlog, isPending } = useCreateBlog();

  const handleSubmit = (data: BlogFormSubmitValues) => {
    createBlog(data, {
      onSuccess: () => {
        toast.success("Blog yazısı başarıyla oluşturuldu");
        router.push("/blogs");
      },
      onError: (error) => {
        toast.error(
          "Blog yazısı oluşturulurken bir hata oluştu: " + error.message,
        );
      },
    });
  };

  return (
    <div className="flex-1 space-y-6 p-6 pt-6 lg:p-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            className="w-fit"
          >
            <ArrowLeft className="mr-2 h-4 w-4" /> Geri
          </Button>
          <div className="space-y-1">
            <h1 className="text-3xl font-semibold tracking-tight">
              Yeni Blog Yazısı
            </h1>
            <p className="text-sm text-muted-foreground">
              İçerik, medya ve SEO ayarlarını tamamlayarak yeni yazınızı
              hazırlayın.
            </p>
          </div>
        </div>
      </div>

      <Separator />

      <BlogForm
        mode="create"
        onSubmit={handleSubmit}
        isSubmitting={isPending}
        onCancel={() => router.back()}
      />
    </div>
  );
}
