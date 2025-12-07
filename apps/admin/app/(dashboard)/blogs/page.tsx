"use client"

import { useBlogs, useBlogStats } from "@/hooks/use-blogs"
import { BlogsTable } from "@/components/tables/blogs-table"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default function BlogsPage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState<string>("")
  const [status, setStatus] = useState<string>("")
  const [language, setLanguage] = useState<string>("")

  const { data: blogData, isLoading: isBlogsLoading } = useBlogs({
    page: page.toString(),
    limit: "10",
    search: search,
    category: category === "all" ? "" : category,
    status: status === "all" ? "" : status,
    language: language === "all" ? "" : language,
  })

  // We could also display stats here using useBlogStats()

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

      <div className="flex items-center space-x-2">
        <Input
          placeholder="Ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 w-[150px] lg:w-[250px]"
        />
        <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="h-8 w-[150px]">
                <SelectValue placeholder="Kategori" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">Tümü</SelectItem>
                <SelectItem value="travel">Seyahat</SelectItem>
                <SelectItem value="food">Yeme & İçme</SelectItem>
                <SelectItem value="culture">Kültür</SelectItem>
                <SelectItem value="history">Tarih</SelectItem>
                <SelectItem value="activity">Aktivite</SelectItem>
                <SelectItem value="lifestyle">Yaşam Tarzı</SelectItem>
                <SelectItem value="business">İş Dünyası</SelectItem>
            </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-8 w-[150px]">
                <SelectValue placeholder="Durum" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">Tümü</SelectItem>
                <SelectItem value="published">Yayında</SelectItem>
                <SelectItem value="draft">Taslak</SelectItem>
                <SelectItem value="pending_review">İncelemede</SelectItem>
                <SelectItem value="archived">Arşivlendi</SelectItem>
            </SelectContent>
        </Select>
         <Select value={language} onValueChange={setLanguage}>
            <SelectTrigger className="h-8 w-[100px]">
                <SelectValue placeholder="Dil" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">Tümü</SelectItem>
                <SelectItem value="tr">Türkçe</SelectItem>
                <SelectItem value="en">İngilizce</SelectItem>
            </SelectContent>
        </Select>
      </div>

      <div className="hidden h-full flex-1 flex-col space-y-8 md:flex">
        <BlogsTable data={blogData?.blogPosts || []} isLoading={isBlogsLoading} />
      </div>
    </div>
  )
}