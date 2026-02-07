"use client";

import Link from "next/link";
import { useState } from "react";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useBlogComments, useDeleteBlogComment } from "@/hooks/use-blogs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const STATUS_LABELS: Record<string, string> = {
  pending: "Beklemede",
  published: "Yayında",
  rejected: "Reddedildi",
  spam: "Spam",
};

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  pending: "outline",
  published: "default",
  rejected: "secondary",
  spam: "destructive",
};

export default function BlogCommentsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");

  const { data, isLoading } = useBlogComments({
    page: String(page),
    limit: "20",
    search: search.trim() || undefined,
    status: status === "all" ? undefined : status,
  });

  const { mutate: deleteComment, isPending: isDeleting } = useDeleteBlogComment();

  const comments = data?.comments || [];
  const pagination = data?.pagination;

  const handleDelete = (id: string) => {
    if (!window.confirm("Bu yorumu silmek istediğinize emin misiniz?")) return;

    deleteComment(id, {
      onSuccess: () => toast.success("Yorum silindi"),
      onError: (error: Error) => toast.error(error.message || "Yorum silinemedi"),
    });
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="space-y-1">
        <h2 className="text-3xl font-bold tracking-tight">Blog Yorumları</h2>
        <p className="text-sm text-muted-foreground">Yorumları inceleyin, yayınlayın veya düzenleyin.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Yorum, yazar veya blog adı ara..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="h-9 w-full min-w-[220px] max-w-[360px]"
        />

        <Select
          value={status}
          onValueChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="h-9 w-[180px]">
            <SelectValue placeholder="Durum" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Durumlar</SelectItem>
            <SelectItem value="pending">Beklemede</SelectItem>
            <SelectItem value="published">Yayında</SelectItem>
            <SelectItem value="rejected">Reddedildi</SelectItem>
            <SelectItem value="spam">Spam</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Yorum</TableHead>
              <TableHead>Yazar</TableHead>
              <TableHead>Blog</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Tarih</TableHead>
              <TableHead className="w-[140px] text-right">İşlemler</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Yükleniyor...
                </TableCell>
              </TableRow>
            ) : comments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Yorum bulunamadı.
                </TableCell>
              </TableRow>
            ) : (
              comments.map((comment) => (
                <TableRow key={comment.id}>
                  <TableCell>
                    <p className="max-w-[440px] line-clamp-2 text-sm">{comment.content}</p>
                  </TableCell>
                  <TableCell>{comment.authorName || "Anonim"}</TableCell>
                  <TableCell>
                    {comment.blogSlug ? (
                      <Link className="hover:underline" href={`/blogs/${comment.blogId}`}>
                        {comment.blogTitle || "Blog"}
                      </Link>
                    ) : (
                      comment.blogTitle || "-"
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANTS[comment.status] || "outline"}>
                      {STATUS_LABELS[comment.status] || comment.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(comment.createdAt).toLocaleString("tr-TR")}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button asChild variant="ghost" size="icon">
                        <Link href={`/blogs/comments/${comment.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button asChild variant="ghost" size="icon">
                        <Link href={`/blogs/comments/${comment.id}/edit`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-600"
                        onClick={() => handleDelete(comment.id)}
                        disabled={isDeleting}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Sayfa {pagination?.page || page} / {pagination?.totalPages || 1} - Toplam {pagination?.total || 0} yorum
        </div>
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            disabled={(pagination?.page || page) <= 1}
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
          >
            Önceki
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={(pagination?.page || page) >= (pagination?.totalPages || 1)}
            onClick={() => setPage((prev) => prev + 1)}
          >
            Sonraki
          </Button>
        </div>
      </div>
    </div>
  );
}
