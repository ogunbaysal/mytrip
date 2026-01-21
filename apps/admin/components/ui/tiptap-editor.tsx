"use client"

import * as React from "react"
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { Toggle } from "@/components/ui/toggle"
import { 
  Bold, 
  Italic, 
  Strikethrough,
  List, 
  ListOrdered, 
  Heading1, 
  Heading2, 
  Heading3,
  Quote, 
  Undo, 
  Redo, 
  Code,
  Link as LinkIcon,
  Unlink,
  Image as ImageIcon,
  Minus
} from "lucide-react"
import { cn } from "@/lib/utils"

interface TiptapEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  minHeight?: string
  onImageUpload?: (file: File) => Promise<{ url: string }>
}

export function TiptapEditor({ 
  value, 
  onChange, 
  placeholder = "İçeriğinizi buraya yazın...",
  disabled = false,
  minHeight = "400px",
  onImageUpload
}: TiptapEditorProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg my-4',
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline hover:text-primary/80',
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value,
    editable: !disabled,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: cn(
          'prose prose-sm dark:prose-invert max-w-none focus:outline-none p-4',
          'prose-headings:font-semibold',
          'prose-a:text-primary prose-a:no-underline hover:prose-a:underline',
          'prose-blockquote:border-l-primary prose-blockquote:bg-muted prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r',
          'prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono',
          'prose-img:rounded-lg prose-img:shadow-md'
        ),
        style: `min-height: ${minHeight}`,
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  // Sync content changes from outside
  React.useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value)
    }
  }, [value, editor])

  // Update editable state
  React.useEffect(() => {
    editor?.setEditable(!disabled)
  }, [disabled, editor])

  const addLink = () => {
    if (!editor) return
    const previousUrl = editor.getAttributes('link').href
    const url = window.prompt('URL girin:', previousUrl)
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !editor) return

    try {
      if (onImageUpload) {
        const result = await onImageUpload(file)
        editor.chain().focus().setImage({ src: result.url }).run()
      } else {
        // Default: use admin upload endpoint
        const formData = new FormData()
        formData.append('file', file)
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'}/api/admin/upload`, {
          method: 'POST',
          body: formData,
          credentials: 'include'
        })
        if (!response.ok) throw new Error('Upload failed')
        const data = await response.json()
        editor.chain().focus().setImage({ src: data.url }).run()
      }
    } catch (error) {
      console.error('Image upload failed:', error)
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const addImageFromUrl = () => {
    const url = window.prompt('Görsel URL\'si girin:')
    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }

  if (!editor) {
    return (
      <div className="flex items-center justify-center min-h-[200px] border rounded-md bg-muted/40">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  const wordCount = editor.getText().split(/\s+/).filter(Boolean).length

  return (
    <div className={cn(
      "flex flex-col border rounded-lg overflow-hidden bg-background",
      disabled && "opacity-60"
    )}>
      {/* Toolbar */}
      <div className="flex flex-wrap gap-0.5 border-b p-2 bg-muted/40">
        {/* Headings */}
        <Toggle
          size="sm"
          pressed={editor.isActive('heading', { level: 1 })}
          onPressedChange={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          disabled={disabled}
          title="Başlık 1"
        >
          <Heading1 className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive('heading', { level: 2 })}
          onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          disabled={disabled}
          title="Başlık 2"
        >
          <Heading2 className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive('heading', { level: 3 })}
          onPressedChange={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          disabled={disabled}
          title="Başlık 3"
        >
          <Heading3 className="h-4 w-4" />
        </Toggle>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Text formatting */}
        <Toggle
          size="sm"
          pressed={editor.isActive('bold')}
          onPressedChange={() => editor.chain().focus().toggleBold().run()}
          disabled={disabled}
          title="Kalın"
        >
          <Bold className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive('italic')}
          onPressedChange={() => editor.chain().focus().toggleItalic().run()}
          disabled={disabled}
          title="İtalik"
        >
          <Italic className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive('strike')}
          onPressedChange={() => editor.chain().focus().toggleStrike().run()}
          disabled={disabled}
          title="Üstü Çizili"
        >
          <Strikethrough className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive('code')}
          onPressedChange={() => editor.chain().focus().toggleCode().run()}
          disabled={disabled}
          title="Kod"
        >
          <Code className="h-4 w-4" />
        </Toggle>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Lists */}
        <Toggle
          size="sm"
          pressed={editor.isActive('bulletList')}
          onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
          disabled={disabled}
          title="Madde Listesi"
        >
          <List className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive('orderedList')}
          onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
          disabled={disabled}
          title="Numaralı Liste"
        >
          <ListOrdered className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          pressed={editor.isActive('blockquote')}
          onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
          disabled={disabled}
          title="Alıntı"
        >
          <Quote className="h-4 w-4" />
        </Toggle>
        <Toggle
          size="sm"
          onPressedChange={() => editor.chain().focus().setHorizontalRule().run()}
          disabled={disabled}
          title="Yatay Çizgi"
        >
          <Minus className="h-4 w-4" />
        </Toggle>

        <div className="w-px h-6 bg-border mx-1" />

        {/* Link */}
        <Toggle
          size="sm"
          pressed={editor.isActive('link')}
          onPressedChange={addLink}
          disabled={disabled}
          title="Bağlantı"
        >
          <LinkIcon className="h-4 w-4" />
        </Toggle>
        {editor.isActive('link') && (
          <Toggle
            size="sm"
            onPressedChange={() => editor.chain().focus().unsetLink().run()}
            disabled={disabled}
            title="Bağlantıyı Kaldır"
          >
            <Unlink className="h-4 w-4" />
          </Toggle>
        )}

        {/* Image */}
        <Toggle
          size="sm"
          onPressedChange={() => onImageUpload ? fileInputRef.current?.click() : addImageFromUrl()}
          disabled={disabled}
          title="Görsel Ekle"
        >
          <ImageIcon className="h-4 w-4" />
        </Toggle>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />

        {/* Undo/Redo */}
        <div className="ml-auto flex gap-0.5">
          <Toggle
            size="sm"
            onPressedChange={() => editor.chain().focus().undo().run()}
            disabled={disabled || !editor.can().undo()}
            title="Geri Al"
          >
            <Undo className="h-4 w-4" />
          </Toggle>
          <Toggle
            size="sm"
            onPressedChange={() => editor.chain().focus().redo().run()}
            disabled={disabled || !editor.can().redo()}
            title="Yinele"
          >
            <Redo className="h-4 w-4" />
          </Toggle>
        </div>
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} />

      {/* Footer with word count */}
      <div className="flex items-center justify-between border-t px-4 py-2 text-xs text-muted-foreground bg-muted/20">
        <span>{wordCount} kelime</span>
        <span>{editor.getText().length} karakter</span>
      </div>
    </div>
  )
}
