"use client";

import { useMemo, useState } from "react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { resolveSafeRedirect } from "@/lib/redirect";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const redirectTo = resolveSafeRedirect(
    searchParams.get("redirect"),
    "/" as Route,
  );
  const token = searchParams.get("token");
  const error = searchParams.get("error");

  const tokenErrorMessage = useMemo(() => {
    if (error === "INVALID_TOKEN") {
      return "Bağlantı süresi dolmuş veya geçersiz. Lütfen yeni bir bağlantı isteyin.";
    }

    if (!token) {
      return "Sıfırlama bağlantısı geçerli değil. Lütfen yeni bir bağlantı isteyin.";
    }

    return null;
  }, [error, token]);

  const loginHref =
    redirectTo === "/"
      ? ("/login" as Route)
      : (`/login?redirect=${encodeURIComponent(redirectTo)}` as Route);

  const resetPassword = useMutation({
    mutationFn: async () => {
      if (!token) {
        throw new Error("Token eksik. Yeni bir bağlantı talep edin.");
      }
      if (password.length < 8) {
        throw new Error("Şifre en az 8 karakter olmalıdır");
      }
      if (password !== confirmPassword) {
        throw new Error("Şifreler eşleşmiyor");
      }

      const result = await authClient.resetPassword({
        token,
        newPassword: password,
      });

      if (result.error) {
        throw new Error(
          result.error.message || "Şifre sıfırlama başarısız oldu",
        );
      }

      return result.data;
    },
    onSuccess: () => {
      toast.success("Şifreniz güncellendi. Giriş yapabilirsiniz.");
      router.push(loginHref);
    },
    onError: (error: Error) => {
      console.error("Password reset failed:", error);
      toast.error(error.message || "Şifre güncellenemedi");
    },
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    resetPassword.mutate();
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md p-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold">Şifre Sıfırla</h1>
          <p className="mt-2 text-muted-foreground">
            Yeni şifrenizi belirleyin ve hesabınıza yeniden erişin
          </p>
        </div>

        {tokenErrorMessage ? (
          <div className="space-y-4">
            <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {tokenErrorMessage}
            </div>
            <Link
              href="/forgot-password"
              className="inline-flex w-full items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-primary hover:underline"
            >
              Yeni bağlantı iste
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium"
              >
                Yeni Şifre
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="En az 8 karakter"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-1.5 block text-sm font-medium"
              >
                Şifre Tekrar
              </label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Şifrenizi tekrar girin"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={resetPassword.isPending}
            >
              {resetPassword.isPending
                ? "Şifre güncelleniyor..."
                : "Şifreyi güncelle"}
            </Button>
          </form>
        )}

        <div className="mt-6 text-center text-sm">
          <span className="text-muted-foreground">Giriş ekranına dön </span>
          <Link
            href={loginHref}
            className="font-medium text-primary hover:underline"
          >
            Giriş yap
          </Link>
        </div>
      </Card>
    </div>
  );
}
