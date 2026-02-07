"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Plus, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useBlogCategories, useDeleteBlogCategory } from "@/hooks/use-blogs";

export default function BlogCategoriesPage() {
  const { data: categories = [], isLoading } = useBlogCategories({ includeInactive: true });
  const { mutate: deleteCategory, isPending: isDeleting } = useDeleteBlogCategory();

  const sorted = useMemo(
    () =>
      [...categories].sort((a, b) => {
        if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
        return a.name.localeCompare(b.name, "tr");
      }),
    [categories],
  );

  const handleDelete = (id: string, name: string, blogCount?: number) => {
    if ((blogCount || 0) > 0) {
      toast.error("Bu kategori kullanılıyor, önce bağlı blogları taşıyın.");
      return;
    }

    if (!window.confirm(`'${name}' kategorisini silmek istediğinize emin misiniz?`)) {
      return;
    }

    deleteCategory(id, {
      onSuccess: () => toast.success("Kategori silindi"),
      onError: (error: Error) => toast.error(error.message || "Kategori silinemedi"),
    });
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">Blog Kategorileri</h2>
          <p className="text-sm text-muted-foreground">Blog kategorilerini yönetin.</p>
        </div>
        <Button asChild>
          <Link href="/blogs/categories/create">
            <Plus className="mr-2 h-4 w-4" /> Yeni Kategori
          </Link>
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ad</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Sıra</TableHead>
              <TableHead>Durum</TableHead>
              <TableHead>Blog Sayısı</TableHead>
              <TableHead className="w-[60px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Yükleniyor...
                </TableCell>
              </TableRow>
            ) : sorted.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Henüz kategori bulunmuyor.
                </TableCell>
              </TableRow>
            ) : (
              sorted.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell className="text-muted-foreground">{category.slug}</TableCell>
                  <TableCell>{category.sortOrder}</TableCell>
                  <TableCell>
                    <Badge variant={category.active ? "default" : "secondary"}>
                      {category.active ? "Aktif" : "Pasif"}
                    </Badge>
                  </TableCell>
                  <TableCell>{category.blogCount || 0}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/blogs/categories/${category.id}/edit`}>
                            <Pencil className="mr-2 h-4 w-4" /> Düzenle
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600"
                          onClick={() =>
                            handleDelete(category.id, category.name, category.blogCount)
                          }
                          disabled={isDeleting}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Sil
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
