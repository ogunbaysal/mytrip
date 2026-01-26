"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { BlogForm } from "@/components/forms/blog-form";
import type { BlogFormSubmitValues } from "@/components/forms/blog-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useBlog, useUpdateBlog } from "@/hooks/use-blogs";

const STATUS_LABELS: Record<string, string> = {
  published: "Yayında",
  draft: "Taslak",
  pending_review: "İncelemede",
  archived: "Arşivlendi",
};

export default function EditBlogPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;

  const { data: blog, isLoading } = useBlog(postId);
  const { mutate: updateBlog, isPending } = useUpdateBlog();

  const handleSubmit = (data: BlogFormSubmitValues) => {
    updateBlog(
      { postId, data },
      {
        onSuccess: () => {
          toast.success("Blog yazısı başarıyla güncellendi");
        },
        onError: (error) => {
          toast.error("Güncelleme hatası: " + error.message);
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6 pt-6 lg:p-8">
        <div className="space-y-3">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-8 w-[240px]" />
          <Skeleton className="h-4 w-[300px]" />
        </div>
        <Skeleton className="h-[520px] w-full rounded-xl" />
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="space-y-3 text-center">
          <h2 className="text-2xl font-semibold">Blog yazısı bulunamadı</h2>
          <Button onClick={() => router.push("/blogs")}>Bloglara Dön</Button>
        </div>
      </div>
    );
  }

  const updatedAtLabel = blog.updatedAt
    ? new Date(blog.updatedAt).toLocaleString("tr-TR")
    : null;

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
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">
                {STATUS_LABELS[blog.status] || blog.status}
              </Badge>
              <Badge variant="secondary">{blog.language.toUpperCase()}</Badge>
              {blog.featured && (
                <Badge className="bg-yellow-400 text-black">Öne Çıkan</Badge>
              )}
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">
              Blog Yazısını Düzenle
            </h1>
            <p className="text-sm text-muted-foreground">{blog.title}</p>
          </div>
          {updatedAtLabel && (
            <p className="text-xs text-muted-foreground">
              Son güncelleme: {updatedAtLabel}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/blogs/${blog.id}`}>Önizle</Link>
          </Button>
        </div>
      </div>

      <Separator />

      <BlogForm
        mode="edit"
        initialData={blog}
        onSubmit={handleSubmit}
        isSubmitting={isPending}
        onCancel={() => router.back()}
      />
    </div>
  );
}
