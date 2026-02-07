"use client";

import { type ChangeEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, MessageCircle } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type BlogCommentsSectionProps = {
  slug: string;
};

function formatDate(value: string) {
  try {
    return new Intl.DateTimeFormat("tr-TR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function BlogCommentsSection({ slug }: BlogCommentsSectionProps) {
  const queryClient = useQueryClient();
  const [content, setContent] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["blog-comments", slug],
    queryFn: () => api.blog.listComments(slug, { page: 1, limit: 50 }),
  });

  const comments = data?.comments || [];

  const submitComment = useMutation({
    mutationFn: async () => {
      return api.blog.submitComment(slug, {
        content,
        guestName: guestName.trim() || undefined,
        guestEmail: guestEmail.trim() || undefined,
      });
    },
    onSuccess: (response) => {
      setContent("");
      setFeedback(response.message || "Yorumunuz incelemeye alındı.");
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["blog-comments", slug] });
    },
    onError: (err: Error) => {
      setFeedback(null);
      setError(err.message || "Yorum gönderilirken bir hata oluştu.");
    },
  });

  const commentCountText = useMemo(
    () => `${comments.length} yayınlanmış yorum`,
    [comments.length],
  );

  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold text-foreground">Yorumlar</h2>
        <p className="text-sm text-muted-foreground">{commentCountText}</p>
      </div>

      <div className="rounded-2xl border border-border/70 bg-white p-5">
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <Input
              placeholder="Adınız (opsiyonel)"
              value={guestName}
              onChange={(event) => setGuestName(event.target.value)}
            />
            <Input
              type="email"
              placeholder="E-posta (opsiyonel)"
              value={guestEmail}
              onChange={(event) => setGuestEmail(event.target.value)}
            />
          </div>
          <textarea
            placeholder="Yorumunuzu yazın..."
            className="min-h-[120px] w-full resize-none rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            value={content}
            onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
              setContent(event.target.value)
            }
          />
          {feedback ? <p className="text-sm text-emerald-600">{feedback}</p> : null}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <div className="flex justify-end">
            <Button
              type="button"
              disabled={submitComment.isPending || content.trim().length < 2}
              onClick={() => {
                setFeedback(null);
                setError(null);
                submitComment.mutate();
              }}
            >
              {submitComment.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gönderiliyor...
                </>
              ) : (
                "Yorum Gönder"
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Tüm yorumlar önce moderasyon sürecinden geçer ve onaylandıktan sonra yayınlanır.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Yorumlar yükleniyor...
          </div>
        ) : comments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border/70 bg-white p-6 text-sm text-muted-foreground">
            Henüz yayınlanmış yorum yok.
          </div>
        ) : (
          comments.map((comment) => (
            <article key={comment.id} className="rounded-2xl border border-border/70 bg-white p-5">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
                  <MessageCircle className="h-4 w-4 text-primary" />
                  {comment.authorName}
                </div>
                <span className="text-xs text-muted-foreground">
                  {formatDate(comment.createdAt)}
                </span>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-6 text-foreground/90">
                {comment.content}
              </p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
