"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { useBlogComment, useUpdateBlogComment } from "@/hooks/use-blogs";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

const formSchema = z.object({
  content: z.string().min(2, "Yorum en az 2 karakter olmalıdır"),
  status: z.enum(["pending", "published", "rejected", "spam"]),
  adminNote: z.string().optional(),
});

export default function EditBlogCommentPage() {
  const params = useParams();
  const router = useRouter();
  const commentId = params.id as string;

  const { data: comment, isLoading } = useBlogComment(commentId);
  const { mutate: updateComment, isPending } = useUpdateBlogComment();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: "",
      status: "pending",
      adminNote: "",
    },
  });

  useEffect(() => {
    if (!comment) return;
    form.reset({
      content: comment.content,
      status: comment.status,
      adminNote: comment.adminNote || "",
    });
  }, [form, comment]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    updateComment(
      {
        commentId,
        payload: {
          content: values.content,
          status: values.status,
          adminNote: values.adminNote || null,
        },
      },
      {
        onSuccess: () => {
          toast.success("Yorum güncellendi");
          router.push(`/blogs/comments/${commentId}`);
        },
        onError: (error: Error) => {
          toast.error(error.message || "Yorum güncellenemedi");
        },
      },
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4 p-8 pt-6">
        <Skeleton className="h-9 w-[300px]" />
        <Skeleton className="h-[420px] w-full max-w-3xl" />
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
      <div className="flex items-center gap-4">
        <Button asChild variant="outline" size="icon">
          <Link href={`/blogs/comments/${commentId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Yorumu Düzenle</h1>
          <p className="text-sm text-muted-foreground">{comment.blogTitle || "Blog"}</p>
        </div>
      </div>

      <div className="max-w-3xl rounded-lg border p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Durum</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Durum seç" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="pending">Beklemede</SelectItem>
                      <SelectItem value="published">Yayında</SelectItem>
                      <SelectItem value="rejected">Reddedildi</SelectItem>
                      <SelectItem value="spam">Spam</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Yorum</FormLabel>
                  <FormControl>
                    <Textarea rows={8} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="adminNote"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Admin Notu</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Opsiyonel moderasyon notu"
                      value={field.value || ""}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center gap-2">
              <Button type="submit" disabled={isPending}>
                {isPending ? "Kaydediliyor..." : "Kaydet"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.push(`/blogs/comments/${commentId}`)}>
                Vazgeç
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
