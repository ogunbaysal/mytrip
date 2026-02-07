"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { BlogsTable } from "@/components/tables/blogs-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBlogCategories, useBlogs } from "@/hooks/use-blogs";

export default function BlogsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [language, setLanguage] = useState<string>("all");

  const { data: blogCategories = [] } = useBlogCategories();

  const categoryOptions = useMemo(
    () =>
      [...blogCategories].sort((a, b) => {
        if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
        return a.name.localeCompare(b.name, "tr");
      }),
    [blogCategories],
  );

  const { data: blogData, isLoading: isBlogsLoading } = useBlogs({
    page: String(page),
    limit: "10",
    search: search.trim() || undefined,
    category: category === "all" ? undefined : category,
    status: status === "all" ? undefined : status,
    language: language === "all" ? undefined : language,
  });

  const pagination = blogData?.pagination;

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Blog Yönetimi</h2>
        <div className="flex items-center space-x-2">
          <Button asChild>
            <Link href="/blogs/create">
              <Plus className="mr-2 h-4 w-4" /> Yeni Yazı Ekle
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Başlık veya içerik ara..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="h-9 w-full min-w-[220px] max-w-[360px]"
        />

        <Select
          value={category}
          onValueChange={(value) => {
            setCategory(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="h-9 w-[220px]">
            <SelectValue placeholder="Kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Kategoriler</SelectItem>
            {categoryOptions.map((item) => (
              <SelectItem key={item.id} value={item.slug}>
                {item.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={status}
          onValueChange={(value) => {
            setStatus(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="h-9 w-[180px]">
            <SelectValue placeholder="Durum" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tüm Durumlar</SelectItem>
            <SelectItem value="published">Yayında</SelectItem>
            <SelectItem value="draft">Taslak</SelectItem>
            <SelectItem value="pending_review">İncelemede</SelectItem>
            <SelectItem value="archived">Arşivlendi</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={language}
          onValueChange={(value) => {
            setLanguage(value);
            setPage(1);
          }}
        >
          <SelectTrigger className="h-9 w-[130px]">
            <SelectValue placeholder="Dil" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tümü</SelectItem>
            <SelectItem value="tr">Türkçe</SelectItem>
            <SelectItem value="en">İngilizce</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <BlogsTable
        data={blogData?.blogPosts || []}
        isLoading={isBlogsLoading}
        page={pagination?.page || page}
        totalPages={pagination?.totalPages || 1}
        total={pagination?.total || 0}
        onPageChange={setPage}
      />
    </div>
  );
}
