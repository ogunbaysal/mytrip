"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { User, Mail, Phone, Calendar, LogOut } from "lucide-react";

import { api } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [originalData, setOriginalData] = useState({
    name: "",
    phone: "",
    bio: "",
  });

  const { data: session, isLoading } = useQuery({
    queryKey: ["session"],
    queryFn: () => authClient.getSession(),
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (session?.data?.user) {
      const user = session.data.user as any;
      const name = user.name || "";
      const phone = user.phone || "";
      const bio = user.bio || "";
      setName(name);
      setPhone(phone);
      setBio(bio);
      setOriginalData({ name, phone, bio });
    }
  }, [session]);

  const updateProfile = useMutation({
    mutationFn: async () => {
      await api.profile.update({ name, phone, bio });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["session"],
        refetchType: "all",
      });
      setIsEditing(false);
    },
    onError: (error: Error) => {
      console.error("Profile update failed:", error);
      alert(error.message || "Güncelleme başarısız");
    },
  });

  const handleCancel = () => {
    const user = session?.data?.user as any;
    if (user) {
      setName(user.name || "");
      setPhone(user.phone || "");
      setBio(user.bio || "");
    }
    setIsEditing(false);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate();
  };

  const logout = useMutation({
    mutationFn: async () => {
      await authClient.signOut();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["session"],
        refetchType: "all",
      });
      queryClient.clear();
      router.push("/" as Route);
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <div className="text-center">
          <div className="mb-4 size-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-muted-foreground">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (!session?.data?.user) {
    router.push("/login" as Route);
    return null;
  }

  const user = session.data.user as any;

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Profilim</h1>
            <p className="mt-2 text-muted-foreground">
              Hesap bilgilerinizi yönetin
            </p>
          </div>
          <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={handleCancel}>
                  İptal
                </Button>
                <Button onClick={handleSave} disabled={updateProfile.isPending}>
                  {updateProfile.isPending ? "Kaydediliyor..." : "Kaydet"}
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)}>Düzenle</Button>
            )}
          </div>
        </div>

        <Card className="p-8">
          <div className="mb-8 flex items-center gap-6">
            <div className="flex size-20 items-center justify-center rounded-full bg-primary/10 text-primary">
              <User className="size-10" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{user.name}</h2>
              <p className="text-muted-foreground">{user.email}</p>
              <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                  {user.role === "owner" ? "Ev Sahibi" : "Gezgin"}
                </span>
                {user.emailVerified && (
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                    Onaylı
                  </span>
                )}
              </div>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            <div>
              <Label htmlFor="name">Ad Soyad</Label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!isEditing}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="email">E-posta</Label>
              <div className="mt-1.5 flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm">
                <Mail className="size-4 text-muted-foreground" />
                {user.email}
              </div>
            </div>

            <div>
              <Label htmlFor="phone">Telefon</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={!isEditing}
                placeholder="+90 555 123 4567"
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="bio">Biyografi</Label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                disabled={!isEditing}
                placeholder="Kendinizden bahsedin..."
                className="mt-1.5 flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div className="pt-6 border-t">
              <h3 className="mb-4 text-lg font-semibold">Hesap Bilgileri</h3>
              <div className="grid gap-4 text-sm">
                <div className="flex items-center gap-3">
                  <Calendar className="size-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Katılma Tarihi:</span>
                  <span>
                    {new Date(user.createdAt).toLocaleDateString("tr-TR")}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-muted-foreground">Durum:</span>
                  <span
                    className={
                      user.status === "active"
                        ? "text-green-600"
                        : "text-red-600"
                    }
                  >
                    {user.status === "active" ? "Aktif" : "Askı"}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t">
              <Button
                variant="destructive"
                onClick={() => logout.mutate()}
                disabled={logout.isPending}
                className="w-full sm:w-auto"
              >
                <LogOut className="mr-2 size-4" />
                Çıkış Yap
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
