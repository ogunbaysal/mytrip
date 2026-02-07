"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useBlogComment, useUpdateBlogComment } from "@/hooks/use-blogs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

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

export default function BlogCommentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const commentId = params.id as string;

  const { data: comment, isLoading } = useBlogComment(commentId);
  const { mutate: updateComment, isPending } = useUpdateBlogComment();

  const handleStatusChange = (
    status: "pending" | "published" | "rejected" | "spam",
  ) => {
    updateComment(
      { commentId, payload: { status } },
      {
        onSuccess: () => toast.success("Yorum durumu güncellendi"),
        onError: (error: Error) => toast.error(error.message || "Durum güncellenemedi"),
      },
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4 p-8 pt-6">
        <Skeleton className="h-9 w-[280px]" />
        <Skeleton className="h-[360px] w-full" />
      </div>
    );
  }

  if (!comment) {
    return (
      <div className="space-y-4 p-8 pt-6">
        <h1 className="text-2xl font-semibold">Yorum bulunamadı</h1>
        <Button asChild>
          <Link href="/blogs/comments">Listeye Dön</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Yorum Detayı</h1>
            <p className="text-sm text-muted-foreground">
              {comment.blogTitle || "Blog"} - {new Date(comment.createdAt).toLocaleString("tr-TR")}
            </p>
          </div>
        </div>

        <Button asChild>
          <Link href={`/blogs/comments/${comment.id}/edit`}>
            <Pencil className="mr-2 h-4 w-4" /> Düzenle
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader>
            <CardTitle>Yorum İçeriği</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap text-sm leading-7">{comment.content}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bilgiler</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="space-y-1">
              <p className="text-muted-foreground">Durum</p>
              <Badge variant={STATUS_VARIANTS[comment.status] || "outline"}>
                {STATUS_LABELS[comment.status] || comment.status}
              </Badge>
            </div>

            <div className="space-y-1">
              <p className="text-muted-foreground">Yazar</p>
              <p>{comment.authorName || "Anonim"}</p>
              {comment.authorEmail ? (
                <p className="text-xs text-muted-foreground">{comment.authorEmail}</p>
              ) : null}
            </div>

            <div className="space-y-1">
              <p className="text-muted-foreground">Blog</p>
              <p>{comment.blogTitle || "-"}</p>
              {comment.blogSlug ? (
                <Link href={`/blogs/${comment.blogId}`} className="text-xs text-primary hover:underline">
                  Blog detayına git
                </Link>
              ) : null}
            </div>

            <div className="space-y-1">
              <p className="text-muted-foreground">Durumu Güncelle</p>
              <Select
                value={comment.status}
                onValueChange={(value) =>
                  handleStatusChange(
                    value as "pending" | "published" | "rejected" | "spam",
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Durum seç" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Beklemede</SelectItem>
                  <SelectItem value="published">Yayında</SelectItem>
                  <SelectItem value="rejected">Reddedildi</SelectItem>
                  <SelectItem value="spam">Spam</SelectItem>
                </SelectContent>
              </Select>
              {isPending ? <p className="text-xs text-muted-foreground">Güncelleniyor...</p> : null}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
