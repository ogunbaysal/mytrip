"use client"

import * as React from "react"
import { X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface TagsInputProps {
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  badgeVariant?: "default" | "secondary" | "outline"
}

export function TagsInput({
  value = [],
  onChange,
  placeholder = "Etiket ekle...",
  disabled = false,
  className,
  badgeVariant = "secondary",
}: TagsInputProps) {
  const [inputValue, setInputValue] = React.useState("")

  const handleAddTag = () => {
    const tag = inputValue.trim()
    if (tag && !value.includes(tag)) {
      onChange([...value, tag])
      setInputValue("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    onChange(value.filter((t) => t !== tagToRemove))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddTag()
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="text-sm"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddTag}
          disabled={disabled || !inputValue.trim()}
        >
          Ekle
        </Button>
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((tag) => (
            <Badge
              key={tag}
              variant={badgeVariant}
              className="gap-1 pr-1"
            >
              {tag}
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-1 rounded-full hover:bg-foreground/10 p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </Badge>
          ))}
        </div>
      )}
    </div>
  )
}
