
"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useCategories, useDeleteCategory } from "@/hooks/use-categories";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";

export default function CategoriesPage() {
  const { data: categories, isLoading } = useCategories();
  const { mutate: deleteCategory } = useDeleteCategory();

  if (isLoading) {
    return <div>Yükleniyor...</div>;
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Kategoriler</h2>
        <div className="flex items-center space-x-2">
          <Link href="/categories/create">
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Yeni Kategori
            </Button>
          </Link>
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ad</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Açıklama</TableHead>
              <TableHead>Oluşturulma Tarihi</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories?.map((category) => (
              <TableRow key={category.id}>
                <TableCell className="font-medium">{category.name}</TableCell>
                <TableCell>{category.slug}</TableCell>
                <TableCell>{category.description || "-"}</TableCell>
                <TableCell>
                  {format(new Date(category.createdAt), "d MMMM yyyy", {
                    locale: tr,
                  })}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <Link href={`/categories/${category.id}/edit`}>
                        <DropdownMenuItem>Düzenle</DropdownMenuItem>
                      </Link>
                      <DropdownMenuItem
                        className="text-red-600 focus:text-red-600"
                        onClick={() => {
                          if (confirm("Bu kategoriyi silmek istediğinize emin misiniz?")) {
                            deleteCategory(category.id);
                          }
                        }}
                      >
                        Sil
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {categories?.length === 0 && (
                <TableRow>
                    <TableCell colSpan={5} className="text-center h-24">
                        Henüz kategori bulunmuyor.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
