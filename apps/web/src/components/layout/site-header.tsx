"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { Search, X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { PlaceSearchForm } from "@/components/places/place-search-form";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { HeaderSearchBar, ProfileDropdown } from "@/components/header";

export function SiteHeader() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: () => authClient.getSession(),
    staleTime: 1000 * 60 * 5,
    enabled: mounted,
    refetchOnWindowFocus: true,
  });

  const logout = useMutation({
    mutationFn: async () => {
      await authClient.signOut();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["session"],
        refetchType: "all",
      });
      router.refresh();
    },
  });

  const user = session?.data?.user as {
    name: string;
    email: string;
    image?: string;
    avatar?: string;
    role?: string;
  } | null;

  // Loading/SSR state
  if (!mounted) {
    return (
      <header className="sticky top-0 z-[100] border-b border-gray-200/80 bg-white">
        <div className="mx-auto flex w-full max-w-[1440px] min-w-0 items-center gap-2 px-4 py-4 sm:gap-4 sm:px-6 md:gap-6">
          {/* Logo */}
          <Link
            href="/"
            className="flex shrink-0 items-center text-primary"
            aria-label="TatilDesen ana sayfa"
          >
            <span className="text-2xl font-semibold tracking-tight">
              TatilDesen
            </span>
          </Link>

          {/* Center placeholder */}
          <div className="hidden flex-1 justify-center lg:flex">
            <div className="h-12 w-96 animate-pulse rounded-full bg-gray-100" />
          </div>

          {/* Mobile placeholder */}
          <div className="flex min-w-0 flex-1 lg:hidden">
            <div className="h-12 w-full max-w-xs animate-pulse rounded-full bg-gray-100" />
          </div>

          {/* Right placeholder */}
          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            <div className="hidden h-5 w-20 animate-pulse rounded bg-gray-100 md:block" />
            <div className="size-10 animate-pulse rounded-full bg-gray-100" />
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-[1000] border-b border-gray-200/80 bg-white">
      <div className="mx-auto flex w-full max-w-[1440px] min-w-0 items-center gap-2 px-4 py-4 sm:gap-4 sm:px-6 md:gap-6">
        {/* Logo */}
        <Link
          href="/"
          className="flex shrink-0 items-center text-primary"
          aria-label="TatilDesen ana sayfa"
        >
          <span className="text-2xl font-semibold tracking-tight">TatilDesen</span>
        </Link>

        {/* Desktop Search Bar */}
        <div className="hidden flex-1 justify-center lg:flex">
          <HeaderSearchBar />
        </div>

        {/* Mobile/Tablet Search Trigger */}
        <div className="flex min-w-0 flex-1 lg:hidden">
          <Dialog
            open={isMobileSearchOpen}
            onOpenChange={setIsMobileSearchOpen}
          >
            <DialogTrigger asChild>
              <button
                type="button"
                className="flex h-12 w-full min-w-0 max-w-md items-center justify-between rounded-full border border-gray-200 bg-white px-3 shadow-md transition-shadow hover:shadow-lg sm:px-4"
              >
                <span className="truncate text-sm font-medium text-foreground">
                  Nereye gitmek istiyorsun?
                </span>
                <span className="ml-2 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                  <Search className="size-4" aria-hidden />
                </span>
              </button>
            </DialogTrigger>
            <DialogContent
              showCloseButton={false}
              className="left-0 top-0 z-[10000] h-[100dvh] w-screen max-w-none translate-x-0 translate-y-0 rounded-none border-none bg-white p-0 shadow-none"
            >
              <div className="flex h-full min-h-0 flex-col">
                <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                  <p className="text-sm font-semibold text-foreground">
                    Arama Filtreleri
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsMobileSearchOpen(false)}
                    className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
                    aria-label="Kapat"
                  >
                    <X className="size-5" />
                  </button>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto p-4">
                  <PlaceSearchForm
                    className="rounded-2xl border border-gray-200 bg-white p-4 shadow-none backdrop-blur-0 supports-[backdrop-filter]:bg-white"
                    onSubmitSuccess={() => setIsMobileSearchOpen(false)}
                  />
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Right Section */}
        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          {/* İşletme Ol Link - Only show for non-owners or logged out users */}
          {(!user || user.role !== "owner") && (
            <Link
              href={"/pricing" as Route}
              className="hidden rounded-full px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-gray-100 md:block"
            >
              İşletme Ol
            </Link>
          )}

          {/* Profile Dropdown */}
          <ProfileDropdown
            user={user}
            onLogout={() => logout.mutate()}
            isLoggingOut={logout.isPending}
          />
        </div>
      </div>
    </header>
  );
}
