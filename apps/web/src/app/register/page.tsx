"use client";

import { Suspense, useState } from "react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import { resolveSafeRedirect } from "@/lib/redirect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const redirectTo = resolveSafeRedirect(searchParams.get("redirect"), "/" as Route);
  const loginHref =
    redirectTo === "/"
      ? ("/login" as Route)
      : (`/login?redirect=${encodeURIComponent(redirectTo)}` as Route);

  const register = useMutation({
    mutationFn: async () => {
      if (password !== confirmPassword) {
        throw new Error("Şifreler eşleşmiyor");
      }
      if (password.length < 8) {
        throw new Error("Şifre en az 8 karakter olmalıdır");
      }
      const result = await authClient.signUp.email({
        email,
        password,
        name,
        fetchOptions: {
          credentials: "include",
        },
      });
      if (result.error) {
        throw new Error(result.error.message || "Kayıt başarısız");
      }
      return result.data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["session"],
        refetchType: "all",
      });
      router.push(redirectTo);
      router.refresh();
    },
    onError: (error: Error) => {
      console.error("Registration failed:", error);
      alert(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    register.mutate();
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md p-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold">Kayıt Ol</h1>
          <p className="mt-2 text-muted-foreground">Yeni bir hesap oluşturun</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="mb-1.5 block text-sm font-medium">
              Ad Soyad
            </label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Adınız Soyadınız"
            />
          </div>

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

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-sm font-medium"
            >
              Şifre
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
            disabled={register.isPending}
          >
            {register.isPending ? "Kayıt oluşturuluyor..." : "Kayıt Ol"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-muted-foreground">
            Zaten hesabınız var mı?{" "}
          </span>
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

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
          <Card className="w-full max-w-md p-8 text-center text-muted-foreground">
            Yükleniyor...
          </Card>
        </div>
      }
    >
      <RegisterPageContent />
    </Suspense>
  );
}
