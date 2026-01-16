"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import {
  Search,
  User,
  LogOut,
  Calendar,
  MapPin,
  Settings,
  CheckCircle,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { PlaceSearchForm } from "@/components/places/place-search-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

type NavItem =
  | {
      label: string;
      href: Route;
    }
  | {
      label: string;
      href: Route;
      query: Record<string, string>;
    };

const NAV_ITEMS: NavItem[] = [
  { label: "Konaklamalar", href: "/places" },
  { label: "Deneyimler", href: "/collections" },
  { label: "Restoranlar", href: "/places", query: { type: "restaurant" } },
  { label: "Hikayeler", href: "/blog" },
];

const HERO_EYEBROW = "Muğla, Türkiye";
const GUESTS_HELPER = "Kaç kişi?";

export function SiteHeader() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isDesktopSearchOpen, setIsDesktopSearchOpen] = useState(false);
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

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const user = session?.data?.user as any;

  if (!mounted) {
    return (
      <header className="sticky top-0 z-40 border-b border-transparent bg-page/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1200px] items-center gap-4 px-4 py-4 md:px-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-primary"
            aria-label="MyTrip ana sayfa"
          >
            <span className="text-2xl font-semibold tracking-tight">
              MyTrip
            </span>
          </Link>

          <div className="flex flex-1 lg:hidden">
            <Dialog
              open={isMobileSearchOpen}
              onOpenChange={setIsMobileSearchOpen}
            >
              <DialogTrigger asChild>
                <button
                  type="button"
                  className="flex h-11 w-full max-w-xs items-center justify-between rounded-full border border-border bg-white px-4 text-left text-sm font-medium shadow-sm transition hover:shadow-lg"
                >
                  <span className="truncate text-foreground/90">
                    {HERO_EYEBROW}
                  </span>
                  <span className="inline-flex size-8 items-center justify-center rounded-full bg-primary text-white">
                    <Search className="size-4" aria-hidden />
                  </span>
                </button>
              </DialogTrigger>
              <DialogContent className="border-none bg-transparent p-0 shadow-none sm:max-w-2xl">
                <PlaceSearchForm
                  onSubmitSuccess={() => setIsMobileSearchOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>

          <div className="hidden flex-1 justify-center lg:flex">
            <Dialog
              open={isDesktopSearchOpen}
              onOpenChange={setIsDesktopSearchOpen}
            >
              <DialogTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "flex h-12 w-full max-w-xl items-center rounded-full border border-border bg-white px-5 shadow-sm transition hover:shadow-lg",
                  )}
                >
                  <div className="flex flex-1 items-center gap-3 text-left">
                    <span className="text-sm font-semibold text-foreground">
                      {HERO_EYEBROW}
                    </span>
                    <span className="h-5 w-px bg-border" aria-hidden />
                    <span className="text-sm text-muted-foreground">
                      {GUESTS_HELPER}
                    </span>
                  </div>
                  <span className="inline-flex size-9 items-center justify-center rounded-full bg-primary text-white">
                    <Search className="size-4" aria-hidden />
                  </span>
                </button>
              </DialogTrigger>
              <DialogContent className="border-none bg-transparent p-0 shadow-none sm:max-w-4xl">
                <PlaceSearchForm
                  onSubmitSuccess={() => setIsDesktopSearchOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </div>

          <nav className="ml-auto hidden items-center gap-1 xl:flex">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.label}
                href={
                  "query" in item
                    ? { pathname: item.href, query: item.query }
                    : item.href
                }
                className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-white hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2 xl:ml-6">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full px-4 py-2 text-sm font-medium"
                onClick={() => router.push("/login" as Route)}
              >
                Giriş
              </Button>
              <Button
                size="sm"
                className="rounded-full px-4 py-2 text-sm font-medium"
                onClick={() => router.push("/register" as Route)}
              >
                Kayıt Ol
              </Button>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-40 border-b border-transparent bg-page/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1200px] items-center gap-4 px-4 py-4 md:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 text-primary"
          aria-label="MyTrip ana sayfa"
        >
          <span className="text-2xl font-semibold tracking-tight">MyTrip</span>
        </Link>

        <div className="flex flex-1 lg:hidden">
          <Dialog
            open={isMobileSearchOpen}
            onOpenChange={setIsMobileSearchOpen}
          >
            <DialogTrigger asChild>
              <button
                type="button"
                className="flex h-11 w-full max-w-xs items-center justify-between rounded-full border border-border bg-white px-4 text-left text-sm font-medium shadow-sm transition hover:shadow-lg"
              >
                <span className="truncate text-foreground/90">
                  {HERO_EYEBROW}
                </span>
                <span className="inline-flex size-8 items-center justify-center rounded-full bg-primary text-white">
                  <Search className="size-4" aria-hidden />
                </span>
              </button>
            </DialogTrigger>
            <DialogContent className="border-none bg-transparent p-0 shadow-none sm:max-w-2xl">
              <PlaceSearchForm
                onSubmitSuccess={() => setIsMobileSearchOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>

        <div className="hidden flex-1 justify-center lg:flex">
          <Dialog
            open={isDesktopSearchOpen}
            onOpenChange={setIsDesktopSearchOpen}
          >
            <DialogTrigger asChild>
              <button
                type="button"
                className={cn(
                  "flex h-12 w-full max-w-xl items-center rounded-full border border-border bg-white px-5 shadow-sm transition hover:shadow-lg",
                )}
              >
                <div className="flex flex-1 items-center gap-3 text-left">
                  <span className="text-sm font-semibold text-foreground">
                    {HERO_EYEBROW}
                  </span>
                  <span className="h-5 w-px bg-border" aria-hidden />
                  <span className="text-sm text-muted-foreground">
                    {GUESTS_HELPER}
                  </span>
                </div>
                <span className="inline-flex size-9 items-center justify-center rounded-full bg-primary text-white">
                  <Search className="size-4" aria-hidden />
                </span>
              </button>
            </DialogTrigger>
            <DialogContent className="border-none bg-transparent p-0 shadow-none sm:max-w-4xl">
              <PlaceSearchForm
                onSubmitSuccess={() => setIsDesktopSearchOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>

        <nav className="ml-auto hidden items-center gap-1 xl:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.label}
              href={
                "query" in item
                  ? { pathname: item.href, query: item.query }
                  : item.href
              }
              className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-white hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 xl:ml-6">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="relative h-10 rounded-full border border-border bg-white px-1 shadow-sm hover:bg-white/90"
                >
                  <Avatar className="size-8">
                    <AvatarImage
                      src={user.image || user.avatar}
                      alt={user.name}
                    />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden md:inline ml-2 mr-1 text-sm font-medium">
                    {user.name}
                  </span>
                  {logout.isPending && (
                    <span className="absolute -top-1 -right-1 flex size-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                      <span className="relative inline-flex size-3 rounded-full bg-primary"></span>
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="flex items-center gap-3 py-2">
                  <Avatar className="size-8">
                    <AvatarImage
                      src={user.image || user.avatar}
                      alt={user.name}
                    />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">{user.name}</span>
                    <span className="text-xs text-muted-foreground line-clamp-1">
                      {user.email}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {user.role === "owner" && (
                  <DropdownMenuItem
                    onClick={() => router.push("/dashboard" as Route)}
                  >
                    <Settings className="mr-2 size-4" />
                    İşletme Paneli
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => router.push("/profile" as Route)}
                >
                  <User className="mr-2 size-4" />
                  Profilim
                </DropdownMenuItem>
                {user.role === "traveler" && (
                  <DropdownMenuItem
                    onClick={() => router.push("/pricing" as Route)}
                  >
                    <CheckCircle className="mr-2 size-4" />
                    İşletme Ol
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => router.push("/bookings" as Route)}
                >
                  <Calendar className="mr-2 size-4" />
                  Rezervasyonlarım
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => router.push("/places" as Route)}
                >
                  <MapPin className="mr-2 size-4" />
                  Favori Mekanlar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => logout.mutate()}
                  disabled={logout.isPending}
                >
                  {logout.isPending ? (
                    <>
                      <span className="mr-2 inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
                      Çıkış yapılıyor...
                    </>
                  ) : (
                    <>
                      <LogOut className="mr-2 size-4" />
                      Çıkış Yap
                    </>
                  )}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full px-4 py-2 text-sm font-medium"
                onClick={() => router.push("/login" as Route)}
              >
                Giriş
              </Button>
              <Button
                size="sm"
                className="rounded-full px-4 py-2 text-sm font-medium"
                onClick={() => router.push("/register" as Route)}
              >
                Kayıt Ol
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
