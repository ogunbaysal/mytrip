"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Search,
  Filter,
  Trash2,
  Edit,
  Eye,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

const STATUS_COLORS = {
  draft: "bg-gray-100 text-gray-800",
  pending_review: "bg-yellow-100 text-yellow-800",
  published: "bg-green-100 text-green-800",
  archived: "bg-blue-100 text-blue-800",
} as const;

const STATUS_LABELS = {
  draft: "Taslak",
  pending_review: "İnceleniyor",
  published: "Yayınlanmış",
  archived: "Arşivlendi",
} as const;

type BlogStatus = keyof typeof STATUS_COLORS;

export default function BlogsPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<BlogStatus | "all">("all");

  const { data: blogsData, isLoading } = useQuery({
    queryKey: ["owner-blogs", statusFilter, searchQuery],
    queryFn: () =>
      api.owner.blogs.list({
        page: 1,
        limit: 20,
        status: statusFilter === "all" ? undefined : statusFilter,
      }),
  });

  const { data: usageData } = useQuery({
    queryKey: ["usage"],
    queryFn: () => api.subscriptions.getUsage(),
  });

  const deleteBlogMutation = useMutation({
    mutationFn: (blogId: string) => api.owner.blogs.delete(blogId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["owner-blogs"] });
      queryClient.invalidateQueries({ queryKey: ["usage"] });
    },
    onError: (error: Error) => {
      console.error("Delete error:", error);
      alert(error.message || "Silme işlemi başarısız oldu");
    },
  });

  const blogs = blogsData?.blogs || [];
  const usage = usageData?.usage;

  const filteredBlogs = blogs.filter((blog) => {
    const matchesSearch =
      !searchQuery ||
      blog.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || blog.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleDelete = (blogId: string, blogTitle: string) => {
    if (
      window.confirm(
        `${blogTitle} blog yazısını silmek istediğinize emin misiniz?`,
      )
    ) {
      deleteBlogMutation.mutate(blogId);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="mb-2 text-3xl font-bold">Blog Yazılarıım</h1>
        <p className="text-muted-foreground">
          Yayınlanmış yazılarınızı ve taslakları yönetin
        </p>
      </div>

      <Card className="p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Blog ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as BlogStatus | "all")
              }
              className="rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="all">Tüm Durumlar</option>
              <option value="draft">Taslak</option>
              <option value="pending_review">İnceleniyor</option>
              <option value="published">Yayınlanmış</option>
              <option value="archived">Arşivlendi</option>
            </select>
          </div>

          <Link href="/dashboard/blogs/create">
            <Button>
              <Plus className="mr-2 size-4" />
              Blog Yazısı Ekle
            </Button>
          </Link>
        </div>
      </Card>

      {isLoading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      ) : filteredBlogs.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-lg text-muted-foreground">
            {searchQuery || statusFilter !== "all"
              ? "Arama kriterlerinize uygun blog bulunamadı."
              : "Henüz blog yazısı eklemediniz."}
          </p>
          <Link href="/dashboard/blogs/create">
            <Button>
              <Plus className="mr-2 size-4" />
              İlk Blog Yazısını Ekle
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredBlogs.map((blog) => (
            <Card key={blog.id} className="overflow-hidden">
              <div className="aspect-video relative bg-muted">
                {blog.heroImage ? (
                  <div
                    className="h-full w-full bg-cover bg-center"
                    style={{ backgroundImage: `url(${blog.heroImage})` }}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-primary/10 text-primary">
                    <FileText className="size-16" />
                  </div>
                )}
                <div
                  className={cn(
                    "absolute top-3 right-3 px-3 py-1 text-xs font-semibold rounded-full",
                    STATUS_COLORS[blog.status as BlogStatus],
                  )}
                >
                  {STATUS_LABELS[blog.status as BlogStatus]}
                </div>
              </div>

              <div className="p-4 space-y-3">
                <div>
                  <h3 className="text-lg font-semibold">{blog.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {blog.category} •{" "}
                    {new Date(blog.createdAt).toLocaleDateString("tr-TR")}
                  </p>
                </div>

                {blog.excerpt && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {blog.excerpt}
                  </p>
                )}

                <div className="flex gap-2">
                  <Link href={`/blog/${blog.slug}`} target="_blank">
                    <Button variant="outline" size="sm">
                      <Eye className="size-4" />
                    </Button>
                  </Link>

                  <Link href={`/dashboard/blogs/${blog.id}/edit`}>
                    <Button variant="outline" size="sm">
                      <Edit className="size-4" />
                    </Button>
                  </Link>

                  {blog.status !== "published" &&
                    blog.status !== "pending_review" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(blog.id, blog.title)}
                        disabled={deleteBlogMutation.isPending}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {usage && (
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Plan Kullanımı</h3>
              <p className="text-sm text-muted-foreground">
                {usage.blogs.current} / {usage.blogs.max} blog kullanılıyor
              </p>
            </div>
            {(usage.blogs.current || 0) >= (usage.blogs.max || 1) && (
              <Button
                variant="outline"
                onClick={() =>
                  (window.location.href = "/dashboard/subscription")
                }
              >
                Planı Yükselt
              </Button>
            )}
          </div>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all"
              style={{
                width: `${((usage.blogs.current || 0) / (usage.blogs.max || 1)) * 100}%`,
              }}
            />
          </div>
        </Card>
      )}
    </div>
  );
}
