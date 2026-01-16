"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  Trash2,
  Edit,
  Eye,
  FileText,
  MoreVertical,
  Calendar,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  PageHeader,
  DashboardCard,
  StatusBadge,
  EmptyState,
  ProgressBar,
} from "@/components/dashboard";
import { api } from "@/lib/api";

type BlogStatus = "draft" | "pending_review" | "published" | "archived";

const STATUS_OPTIONS: { value: BlogStatus | "all"; label: string }[] = [
  { value: "all", label: "Tüm Durumlar" },
  { value: "published", label: "Yayında" },
  { value: "draft", label: "Taslak" },
  { value: "pending_review", label: "İncelemede" },
  { value: "archived", label: "Arşivlenmiş" },
];

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

  const usagePercentage = usage
    ? Math.round(((usage.blogs.current || 0) / (usage.blogs.max || 1)) * 100)
    : 0;

  const canAddBlog =
    usage && (usage.blogs.current || 0) < (usage.blogs.max || 1);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("tr-TR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Blog Yazılarım"
        description="Yayınlanmış yazılarınızı ve taslakları yönetin"
        icon={<FileText className="size-5" />}
        actions={
          canAddBlog ? (
            <Link href="/dashboard/blogs/create">
              <Button className="gap-2">
                <Plus className="size-4" />
                Blog Yazısı Ekle
              </Button>
            </Link>
          ) : (
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => (window.location.href = "/pricing")}
            >
              <TrendingUp className="size-4" />
              Planı Yükselt
            </Button>
          )
        }
      />

      {/* Search and Filters */}
      <DashboardCard padding="md">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Blog ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as BlogStatus | "all")
            }
            className="h-10 rounded-lg border border-border bg-white px-3 text-sm transition-colors hover:border-primary/50 focus:border-primary focus:outline-none"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </DashboardCard>

      {/* Content */}
      {isLoading ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">
              Bloglar yükleniyor...
            </p>
          </div>
        </div>
      ) : filteredBlogs.length === 0 ? (
        <EmptyState
          icon={<FileText className="size-8" />}
          title={
            searchQuery || statusFilter !== "all"
              ? "Sonuç Bulunamadı"
              : "Henüz Blog Yok"
          }
          description={
            searchQuery || statusFilter !== "all"
              ? "Arama kriterlerinize uygun blog bulunamadı. Filtreleri değiştirmeyi deneyin."
              : "İlk blog yazınızı oluşturarak içerik pazarlamasına başlayın."
          }
          actionLabel="İlk Blog Yazısını Ekle"
          actionHref={canAddBlog ? "/dashboard/blogs/create" : undefined}
          onAction={
            !canAddBlog ? () => (window.location.href = "/pricing") : undefined
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredBlogs.map((blog, index) => (
            <motion.div
              key={blog.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <DashboardCard hoverable padding="none">
                {/* Image / Banner */}
                <div className="relative aspect-video bg-gradient-to-br from-emerald-50 to-teal-100">
                  {blog.heroImage ? (
                    <Image
                      src={blog.heroImage}
                      alt={blog.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <FileText className="size-12 text-emerald-300" />
                    </div>
                  )}

                  {/* Status badge */}
                  <div className="absolute left-3 top-3">
                    <StatusBadge status={blog.status as BlogStatus} />
                  </div>

                  {/* Actions dropdown */}
                  <div className="absolute right-3 top-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="size-8 bg-white/90 backdrop-blur-sm hover:bg-white"
                        >
                          <MoreVertical className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/blog/${blog.slug}`}
                            target="_blank"
                            className="flex items-center gap-2"
                          >
                            <Eye className="size-4" />
                            Görüntüle
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/dashboard/blogs/${blog.id}/edit`}
                            className="flex items-center gap-2"
                          >
                            <Edit className="size-4" />
                            Düzenle
                          </Link>
                        </DropdownMenuItem>
                        {blog.status !== "published" &&
                          blog.status !== "pending_review" && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() =>
                                  handleDelete(blog.id, blog.title)
                                }
                                className="text-red-600 focus:text-red-600"
                                disabled={deleteBlogMutation.isPending}
                              >
                                <Trash2 className="mr-2 size-4" />
                                Sil
                              </DropdownMenuItem>
                            </>
                          )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="mb-1 font-semibold text-foreground line-clamp-1">
                    {blog.title}
                  </h3>

                  <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5">
                      {blog.category || "Genel"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="size-3" />
                      {formatDate(blog.createdAt)}
                    </span>
                  </div>

                  {blog.excerpt && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {blog.excerpt}
                    </p>
                  )}
                </div>
              </DashboardCard>
            </motion.div>
          ))}
        </div>
      )}

      {/* Usage Footer */}
      {usage && (
        <DashboardCard padding="md">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="font-semibold text-foreground">Plan Kullanımı</h3>
              <p className="text-sm text-muted-foreground">
                {usage.blogs.current} / {usage.blogs.max} blog kullanılıyor
              </p>
            </div>

            <div className="w-full md:w-64">
              <ProgressBar
                value={usagePercentage}
                showLabel
                label={`${usagePercentage}%`}
              />
            </div>

            {!canAddBlog && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => (window.location.href = "/pricing")}
              >
                Planı Yükselt
              </Button>
            )}
          </div>
        </DashboardCard>
      )}
    </div>
  );
}
