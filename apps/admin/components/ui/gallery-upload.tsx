"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { ImagePlus, Loader2, Star, Trash2, ArrowLeft, ArrowRight } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface GalleryUploadProps {
  value?: string[]
  onChange: (value: string[]) => void
  disabled?: boolean
}

export function GalleryUpload({ value = [], onChange, disabled }: GalleryUploadProps) {
  const [isUploading, setIsUploading] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)
    const newUrls: string[] = []

    try {
      // Upload files sequentially or in parallel
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const formData = new FormData()
        formData.append("file", file)

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "https://api.tatildesen.com"}/api/admin/upload`, {
            method: "POST",
            body: formData,
            credentials: 'include'
        })
        
        if (!response.ok) {
           throw new Error(`Upload failed for file ${file.name}`)
        }

        const data = await response.json()
        newUrls.push(data.url)
      }

      onChange([...value, ...newUrls])
      toast.success(`${newUrls.length} görsel başarıyla yüklendi`)
    } catch (error) {
        toast.error("Görsel yüklenirken hata oluştu")
        console.error(error)
    } finally {
      setIsUploading(false)
      if (inputRef.current) {
        inputRef.current.value = ""
      }
    }
  }

  const handleRemove = (urlToRemove: string) => {
    onChange(value.filter((url) => url !== urlToRemove))
  }

  const moveImage = (index: number, direction: 'left' | 'right') => {
    if (direction === 'left' && index === 0) return
    if (direction === 'right' && index === value.length - 1) return

    const newIndex = direction === 'left' ? index - 1 : index + 1
    const newValue = [...value]
    const [movedItem] = newValue.splice(index, 1)
    newValue.splice(newIndex, 0, movedItem)
    onChange(newValue)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {value.map((url, index) => (
          <div key={url} className={cn("relative aspect-square rounded-lg overflow-hidden border bg-muted group", index === 0 && "ring-2 ring-primary ring-offset-2")}>
            <div className="absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <Button 
                    type="button"
                    onClick={() => handleRemove(url)}
                    variant="destructive"
                    size="icon"
                    className="h-6 w-6"
                >
                    <Trash2 className="h-3 w-3" />
                </Button>
            </div>
            
            {/* Sorting Controls */}
            <div className="absolute bottom-2 left-0 right-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity flex justify-center gap-1 px-2">
                 <Button 
                    type="button"
                    onClick={() => moveImage(index, 'left')}
                    variant="secondary"
                    size="icon"
                    className="h-6 w-6 bg-white/80 hover:bg-white"
                    disabled={index === 0}
                >
                    <ArrowLeft className="h-3 w-3" />
                </Button>
                 <Button 
                    type="button"
                    onClick={() => moveImage(index, 'right')}
                    variant="secondary"
                    size="icon"
                    className="h-6 w-6 bg-white/80 hover:bg-white"
                    disabled={index === value.length - 1}
                >
                    <ArrowRight className="h-3 w-3" />
                </Button>
            </div>

            {index === 0 && (
                <div className="absolute top-2 left-2 z-10 bg-primary text-primary-foreground text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                    <Star className="h-3 w-3 fill-current" />
                    Ana Görsel
                </div>
            )}
            
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt="Place Image"
              className="object-cover w-full h-full"
            />
          </div>
        ))}
        
        <div className="aspect-square">
             <Button
                type="button"
                variant="outline"
                disabled={disabled || isUploading}
                onClick={() => inputRef.current?.click()}
                className="w-full h-full border-dashed flex flex-col gap-2 bg-transparent hover:bg-muted"
            >
                {isUploading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                    <ImagePlus className="h-8 w-8 text-muted-foreground" />
                )}
                <span className="text-xs text-muted-foreground">{isUploading ? "Yükleniyor..." : "Görsel Ekle"}</span>
            </Button>
        </div>
      </div>
      
       <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleUpload}
            disabled={disabled || isUploading}
        />
        <div className="text-xs text-muted-foreground">
            * İlk sıradaki görsel &quot;Ana Görsel (Primary)&quot; olarak kullanılacaktır. Sıralamayı değiştirmek için oklara tıklayın.
        </div>
    </div>
  )
}
