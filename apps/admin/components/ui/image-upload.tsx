"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { ImagePlus, X, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { client } from "@/lib/auth-client" 

interface ImageUploadProps {
  value?: string
  onChange: (value: string) => void
  onRemove: () => void
  disabled?: boolean
  label?: string
}

export function ImageUpload({ value, onChange, onRemove, disabled, label = "Görsel Yükle" }: ImageUploadProps) {
  const [isUploading, setIsUploading] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
        const formData = new FormData()
        formData.append("file", file)

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002"}/api/admin/upload`, {
            method: "POST",
            body: formData,
             // Add auth headers if needed, though simple fetch might not include cookies unless credentials: include
             // Assuming admin-auth middleware checks session cookie which fetch sends with credentials: 'include'
            credentials: 'include'
        })
        
        if (!response.ok) {
             throw new Error("Upload failed")
        }

        const data = await response.json()
        onChange(data.url)
        toast.success("Görsel yüklendi")
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

  return (
    <div className="space-y-4 w-full">
      {value ? (
        <div className="relative aspect-video w-full max-w-sm rounded-lg overflow-hidden border bg-muted">
          <Button
            type="button"
            onClick={onRemove}
            variant="destructive"
            size="icon"
            className="absolute right-2 top-2 z-10 h-6 w-6"
            disabled={disabled}
          >
            <X className="h-4 w-4" />
          </Button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Upload"
            className="object-cover w-full h-full"
          />
        </div>
      ) : (
        <div className="flex items-center gap-4">
             <Button
                type="button"
                variant="outline"
                disabled={disabled || isUploading}
                onClick={() => inputRef.current?.click()}
                className="w-full max-w-sm h-32 border-dashed flex flex-col gap-2"
            >
                {isUploading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                    <ImagePlus className="h-6 w-6" />
                )}
                <span>{isUploading ? "Yükleniyor..." : label}</span>
            </Button>
             <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleUpload}
                disabled={disabled || isUploading}
            />
        </div>
      )}
    </div>
  )
}
