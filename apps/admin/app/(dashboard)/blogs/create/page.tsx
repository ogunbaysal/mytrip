"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  FileText,
  Calendar,
  User,
  Tag,
  Image,
  Link,
  Save,
  Eye,
  AlertCircle,
  Upload,
  Plus,
  X
} from "lucide-react"
import { toast } from "sonner"

export default function CreateBlogPage() {
  const router = useRouter()
  const [isSaving, setIsSaving] = useState(false)
  const [isPreview, setIsPreview] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    content: "",
    excerpt: "",
    author: "",
    category: "",
    tags: [] as string[],
    featuredImage: "",
    images: [] as string[],
    seoTitle: "",
    seoDescription: "",
    isPublished: false,
    isFeatured: false,
    publishDate: new Date().toISOString().split('T')[0]
  })

  const [newTag, setNewTag] = useState("")
  const [newImage, setNewImage] = useState("")

  const categories = [
    { value: "travel-guide", label: "Seyahat Rehberi" },
    { value: "destination", label: "Rota Önerileri" },
    { value: "culture", label: "Kültür ve Tarih" },
    { value: "food", label: "Yeme İçme" },
    { value: "activity", label: "Aktiviteler" },
    { value: "accommodation", label: "Konaklama" },
    { value: "lifestyle", label: "Yaşam Tarzı" },
    { value: "news", label: "Haberler" }
  ]

  const authors = [
    { value: "admin", label: "Admin User" },
    { value: "editor1", label: "Editor One" },
    { value: "editor2", label: "Editor Two" },
    { value: "guest1", label: "Guest Author" }
  ]

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  const handleTitleChange = (title: string) => {
    handleInputChange("title", title)
    if (!formData.slug) {
      handleInputChange("slug", generateSlug(title))
    }
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }))
      setNewTag("")
    }
  }

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }))
  }

  const addImage = () => {
    if (newImage.trim() && !formData.images.includes(newImage.trim())) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, newImage.trim()]
      }))
      setNewImage("")
    }
  }

  const removeImage = (image: string) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter(img => img !== image)
    }))
  }

  const handleSave = async () => {
    if (!formData.title || !formData.content || !formData.author) {
      toast.error("Lütfen zorunlu alanları doldurun")
      return
    }

    setIsSaving(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      toast.success("Blog yazısı başarıyla oluşturuldu")
      router.push("/blogs")
    } catch (error) {
      toast.error("Blog yazısı oluşturulurken bir hata oluştu")
    } finally {
      setIsSaving(false)
    }
  }

  const handlePublish = async () => {
    if (!formData.title || !formData.content || !formData.author) {
      toast.error("Lütfen zorunlu alanları doldurun")
      return
    }

    setIsSaving(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      handleInputChange("isPublished", true)
      toast.success("Blog yazısı yayınlandı")
      router.push("/blogs")
    } catch (error) {
      toast.error("Blog yazısı yayınlanırken bir hata oluştu")
    } finally {
      setIsSaving(false)
    }
  }

  const handlePreview = () => {
    setIsPreview(!isPreview)
  }

  if (isPreview) {
    return (
      <div className="flex-1 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={() => setIsPreview(false)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Düzenlemeye Dön
            </Button>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Blog Önizleme</h2>
              <p className="text-muted-foreground">
                Oluşturduğunuz blog yazısının nasıl görüneceğini kontrol edin.
              </p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  {formData.isFeatured && (
                    <Badge variant="secondary">Öne Çıkan</Badge>
                  )}
                  {formData.isPublished ? (
                    <Badge className="bg-green-100 text-green-800">Yayında</Badge>
                  ) : (
                    <Badge variant="outline">Taslak</Badge>
                  )}
                </div>
                <CardTitle className="text-3xl mb-2">{formData.title || "Başlık"}</CardTitle>
                <CardDescription className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <User className="h-4 w-4 mr-1" />
                    {formData.author || "Yazar"}
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {formData.publishDate ? new Date(formData.publishDate).toLocaleDateString('tr-TR') : new Date().toLocaleDateString('tr-TR')}
                  </div>
                  <div className="flex items-center">
                    <FileText className="h-4 w-4 mr-1" />
                    {Math.ceil(formData.content.length / 1000)} dk okuma süresi
                  </div>
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {formData.featuredImage && (
              <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                <Image className="h-8 w-8 text-gray-400" />
                <span className="ml-2 text-sm text-gray-500">{formData.featuredImage}</span>
              </div>
            )}

            {formData.excerpt && (
              <div className="text-lg text-muted-foreground border-l-4 border-gray-200 pl-4">
                {formData.excerpt}
              </div>
            )}

            <div>
              <h3 className="font-semibold mb-4">İçerik</h3>
              <div className="prose max-w-none">
                {formData.content ? (
                  <div className="whitespace-pre-wrap">{formData.content}</div>
                ) : (
                  <p className="text-muted-foreground">Blog içeriği eklenmemiş.</p>
                )}
              </div>
            </div>

            {formData.tags.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Etiketler</h3>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <Badge key={index} variant="outline">
                      <Tag className="h-3 w-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {formData.images.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">Görseller</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {formData.images.map((image, index) => (
                    <div key={index} className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center">
                      <Image className="h-8 w-8 text-gray-400" />
                      <span className="ml-2 text-sm text-gray-500">{image}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Geri
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Yeni Blog Yazısı</h2>
            <p className="text-muted-foreground">
              Platforma yeni bir blog yazısı ekleyin.
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handlePreview}>
            <Eye className="h-4 w-4 mr-2" />
            Önizle
          </Button>
          <Button variant="outline" onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Kaydediliyor..." : "Taslak Olarak Kaydet"}
          </Button>
          <Button onClick={handlePublish} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Yayınlanıyor..." : "Yayınla"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Temel Bilgiler</CardTitle>
              <CardDescription>
                Blog yazısının temel bilgilerini girin.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Başlık *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="Blog yazısının başlığını girin"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">URL (Slug)</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => handleInputChange("slug", e.target.value)}
                  placeholder="url-slug"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="author">Yazar *</Label>
                  <Select value={formData.author} onValueChange={(value) => handleInputChange("author", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Yazar seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {authors.map(author => (
                        <SelectItem key={author.value} value={author.value}>
                          {author.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Kategori</Label>
                  <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Kategori seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="excerpt">Özet</Label>
                <Textarea
                  id="excerpt"
                  value={formData.excerpt}
                  onChange={(e) => handleInputChange("excerpt", e.target.value)}
                  rows={3}
                  placeholder="Blog yazısının kısa özetini girin..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">İçerik *</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => handleInputChange("content", e.target.value)}
                  rows={15}
                  placeholder="Blog yazısının içeriğini buraya yazın..."
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Medya</CardTitle>
              <CardDescription>
                Blog yazısına görseller ekleyin.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="featuredImage">Öne Çıkan Görsel</Label>
                <Input
                  id="featuredImage"
                  value={formData.featuredImage}
                  onChange={(e) => handleInputChange("featuredImage", e.target.value)}
                  placeholder="Öne çıkan görselin URL'i"
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Ek Görseller</Label>
                <div className="flex space-x-2">
                  <Input
                    value={newImage}
                    onChange={(e) => setNewImage(e.target.value)}
                    placeholder="Görsel URL'i veya adı"
                    onKeyPress={(e) => e.key === "Enter" && addImage()}
                  />
                  <Button onClick={addImage} size="sm">
                    <Upload className="h-4 w-4 mr-1" />
                    Ekle
                  </Button>
                </div>

                {formData.images.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {formData.images.map((image, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Image className="h-4 w-4 text-gray-400" />
                          <span className="text-sm">{image}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeImage(image)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>SEO Ayarları</CardTitle>
              <CardDescription>
                Arama motoru optimizasyonu ayarları.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="seoTitle">SEO Başlığı</Label>
                <Input
                  id="seoTitle"
                  value={formData.seoTitle}
                  onChange={(e) => handleInputChange("seoTitle", e.target.value)}
                  placeholder="Arama sonuçlarında görünecek başlık"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="seoDescription">SEO Açıklaması</Label>
                <Textarea
                  id="seoDescription"
                  value={formData.seoDescription}
                  onChange={(e) => handleInputChange("seoDescription", e.target.value)}
                  rows={3}
                  placeholder="Arama sonuçlarında görünecek açıklama"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Yayın Durumu</CardTitle>
              <CardDescription>
                Blog yazısının yayın ayarlarını yapılandırın.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="publishDate">Yayın Tarihi</Label>
                <Input
                  id="publishDate"
                  type="date"
                  value={formData.publishDate}
                  onChange={(e) => handleInputChange("publishDate", e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Yayınla</Label>
                  <p className="text-sm text-muted-foreground">
                    Yazıyı hemen yayınla
                  </p>
                </div>
                <Switch
                  checked={formData.isPublished}
                  onCheckedChange={(checked) => handleInputChange("isPublished", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Öne Çıkan</Label>
                  <p className="text-sm text-muted-foreground">
                    Ana sayfada görünsün
                  </p>
                </div>
                <Switch
                  checked={formData.isFeatured}
                  onCheckedChange={(checked) => handleInputChange("isFeatured", checked)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Etiketler</CardTitle>
              <CardDescription>
                Blog yazısına etiketler ekleyin.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Etiket ekleyin"
                  onKeyPress={(e) => e.key === "Enter" && addTag()}
                />
                <Button onClick={addTag} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center">
                      <Tag className="h-3 w-3 mr-1" />
                      {tag}
                      <X
                        className="h-3 w-3 ml-1 cursor-pointer"
                        onClick={() => removeTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-blue-500" />
                <span>İpuçları</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>• Başlık SEO uyumlu olmalıdır.</p>
              <p>• Özet okuyucunun ilgisini çekmelidir.</p>
              <p>• İçerik özgün ve değerli olmalıdır.</p>
              <p>• Etiketler keşfedilebilirliği artırır.</p>
              <p>• Görseller içerikle uyumlu olmalıdır.</p>
              <p>• SEO başlığı 60 karakterden kısa olmalıdır.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>İstatistikler</CardTitle>
              <CardDescription>
                Yazı bilgileri
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span>Karakter sayısı:</span>
                <span className="font-medium">{formData.content.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Kelime sayısı:</span>
                <span className="font-medium">{formData.content.split(/\s+/).filter(w => w).length}</span>
              </div>
              <div className="flex justify-between">
                <span>Tahmini okuma süresi:</span>
                <span className="font-medium">{Math.max(1, Math.ceil(formData.content.length / 1000))} dk</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}