"use client";

import { useRouter } from "next/navigation";
import type { Route } from "next";
import {
  Menu,
  User,
  LogOut,
  Calendar,
  MapPin,
  Settings,
  CheckCircle,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface UserData {
  name: string;
  email: string;
  image?: string;
  avatar?: string;
  role?: string;
}

interface ProfileDropdownProps {
  user: UserData | null;
  onLogout: () => void;
  isLoggingOut?: boolean;
  className?: string;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function ProfileDropdown({
  user,
  onLogout,
  isLoggingOut = false,
  className,
}: ProfileDropdownProps) {
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex items-center gap-3 rounded-full border border-gray-200 bg-white px-2 py-1.5 shadow-sm transition-shadow hover:shadow-md",
            className,
          )}
        >
          <Menu className="ml-1 size-4 text-gray-700" />
          <Avatar className="size-8">
            {user ? (
              <>
                <AvatarImage src={user.image || user.avatar} alt={user.name} />
                <AvatarFallback className="bg-gray-500 text-xs font-semibold text-white">
                  {getInitials(user.name)}
                </AvatarFallback>
              </>
            ) : (
              <AvatarFallback className="bg-gray-500 text-white">
                <User className="size-4" />
              </AvatarFallback>
            )}
          </Avatar>
          {isLoggingOut && (
            <span className="absolute -right-1 -top-1 flex size-3">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex size-3 rounded-full bg-primary" />
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {user ? (
          <>
            <DropdownMenuLabel className="flex items-center gap-3 py-2">
              <Avatar className="size-8">
                <AvatarImage src={user.image || user.avatar} alt={user.name} />
                <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{user.name}</span>
                <span className="line-clamp-1 text-xs text-muted-foreground">
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
            <DropdownMenuItem onClick={() => router.push("/profile" as Route)}>
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
            <DropdownMenuItem onClick={() => router.push("/bookings" as Route)}>
              <Calendar className="mr-2 size-4" />
              Rezervasyonlarım
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/places" as Route)}>
              <MapPin className="mr-2 size-4" />
              Favori Mekanlar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={onLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? (
                <>
                  <span className="mr-2 inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Çıkış yapılıyor...
                </>
              ) : (
                <>
                  <LogOut className="mr-2 size-4" />
                  Çıkış Yap
                </>
              )}
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuItem
              onClick={() => router.push("/register" as Route)}
              className="font-medium"
            >
              Kayıt Ol
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/login" as Route)}>
              Giriş Yap
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/pricing" as Route)}>
              İşletme Ol
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/places" as Route)}>
              Yardım
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
