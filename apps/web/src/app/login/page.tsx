"use client";

import { useState } from "react";
import type { Route } from "next";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import { resolveSafeRedirect } from "@/lib/redirect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const redirectTo = resolveSafeRedirect(searchParams.get("redirect"), "/" as Route);
  const registerHref =
    redirectTo === "/"
      ? ("/register" as Route)
      : (`/register?redirect=${encodeURIComponent(redirectTo)}` as Route);

  const login = useMutation({
    mutationFn: async () => {
      const result = await authClient.signIn.email({
        email,
        password,
        fetchOptions: {
          credentials: "include",
        },
      });
      if (result.error) {
        throw new Error(result.error.message || "Login failed");
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
      console.error("Login failed:", error);
      alert(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login.mutate();
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md p-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold">Giriş Yap</h1>
          <p className="mt-2 text-muted-foreground">
            Hesabınıza erişmek için giriş yapın
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
              placeholder="•••••••"
            />
          </div>

          <Button type="submit" className="w-full" disabled={login.isPending}>
            {login.isPending ? "Giriş yapılıyor..." : "Giriş Yap"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-muted-foreground">Hesabınız yok mu? </span>
          <Link
            href={registerHref}
            className="font-medium text-primary hover:underline"
          >
            Kayıt ol
          </Link>
        </div>
      </Card>
    </div>
  );
}
