"use client";

import { useState } from "react";
import type { Route } from "next";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { resolveSafeRedirect } from "@/lib/redirect";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function ForgotPasswordPage() {
  const searchParams = useSearchParams();
  const redirectTo = resolveSafeRedirect(
    searchParams.get("redirect"),
    "/" as Route,
  );
  const loginHref =
    redirectTo === "/"
      ? ("/login" as Route)
      : (`/login?redirect=${encodeURIComponent(redirectTo)}` as Route);
  const [email, setEmail] = useState("");

  const requestReset = useMutation({
    mutationFn: async () => {
      const origin = window.location.origin;
      const resetRedirect = `${origin}/reset-password`;
      const result = await authClient.requestPasswordReset({
        email,
        redirectTo: `${resetRedirect}?redirect=${encodeURIComponent(redirectTo)}`,
      });

      if (result.error) {
        throw new Error(
          result.error.message || "Şifre sıfırlama başarısız oldu",
        );
      }

      return result.data;
    },
    onSuccess: () => {
      toast.success(
        "Eğer e-posta adresiniz sistemde kayıtlıysa, şifre sıfırlama bağlantısı gönderildi.",
      );
    },
    onError: (error: Error) => {
      console.error("Password reset request failed:", error);
      toast.error(error.message || "Şifre sıfırlama bağlantısı gönderilemedi");
    },
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    requestReset.mutate();
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md p-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold">Şifremi Unuttum</h1>
          <p className="mt-2 text-muted-foreground">
            Şifrenizi sıfırlamak için e-posta adresinizi girin
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium">
              E-posta
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="ornek@email.com"
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={requestReset.isPending}
          >
            {requestReset.isPending
              ? "Bağlantı gönderiliyor..."
              : "Sıfırlama bağlantısı gönder"}
          </Button>
        </form>

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
