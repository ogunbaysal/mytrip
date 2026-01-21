"use client";

import * as React from "react";
import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
  Image as ImageIcon,
  Heading1,
  Heading2,
  Heading3,
  Minus,
  Code,
  Unlink,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TipTapEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  disabled?: boolean;
  minHeight?: string;
  className?: string;
  onImageUpload?: (file: File) => Promise<{ url: string }>;
}

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title?: string;
}

function ToolbarButton({
  onClick,
  isActive = false,
  disabled = false,
  children,
  title,
}: ToolbarButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "flex size-8 items-center justify-center rounded-md transition-colors",
        isActive
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-slate-100 hover:text-foreground",
        disabled && "cursor-not-allowed opacity-50"
      )}
    >
      {children}
    </button>
  );
}

function ToolbarDivider() {
  return <div className="mx-1 h-6 w-px bg-slate-200" />;
}

interface EditorToolbarProps {
  editor: Editor | null;
  disabled?: boolean;
  onImageUpload?: (file: File) => Promise<{ url: string }>;
}

function EditorToolbar({ editor, disabled, onImageUpload }: EditorToolbarProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  if (!editor) return null;

  const addLink = () => {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL girin:", previousUrl);

    if (url === null) return;

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: url })
      .run();
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !onImageUpload) return;

    try {
      const result = await onImageUpload(file);
      editor.chain().focus().setImage({ src: result.url }).run();
    } catch (error) {
      console.error("Image upload failed:", error);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const addImageFromUrl = () => {
    const url = window.prompt("Görsel URL'si girin:");
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-slate-200 bg-slate-50/50 p-2">
      {/* Headings */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={editor.isActive("heading", { level: 1 })}
        disabled={disabled}
        title="Başlık 1"
      >
        <Heading1 className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive("heading", { level: 2 })}
        disabled={disabled}
        title="Başlık 2"
      >
        <Heading2 className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        isActive={editor.isActive("heading", { level: 3 })}
        disabled={disabled}
        title="Başlık 3"
      >
        <Heading3 className="size-4" />
      </ToolbarButton>

      <ToolbarDivider />

      {/* Text Formatting */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive("bold")}
        disabled={disabled}
        title="Kalın"
      >
        <Bold className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive("italic")}
        disabled={disabled}
        title="İtalik"
      >
        <Italic className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive("strike")}
        disabled={disabled}
        title="Üstü Çizili"
      >
        <Strikethrough className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        isActive={editor.isActive("code")}
        disabled={disabled}
        title="Kod"
      >
        <Code className="size-4" />
      </ToolbarButton>

      <ToolbarDivider />

      {/* Lists */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive("bulletList")}
        disabled={disabled}
        title="Madde Listesi"
      >
        <List className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive("orderedList")}
        disabled={disabled}
        title="Numaralı Liste"
      >
        <ListOrdered className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive("blockquote")}
        disabled={disabled}
        title="Alıntı"
      >
        <Quote className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        disabled={disabled}
        title="Yatay Çizgi"
      >
        <Minus className="size-4" />
      </ToolbarButton>

      <ToolbarDivider />

      {/* Link */}
      <ToolbarButton
        onClick={addLink}
        isActive={editor.isActive("link")}
        disabled={disabled}
        title="Bağlantı Ekle"
      >
        <LinkIcon className="size-4" />
      </ToolbarButton>
      {editor.isActive("link") && (
        <ToolbarButton
          onClick={() => editor.chain().focus().unsetLink().run()}
          disabled={disabled}
          title="Bağlantıyı Kaldır"
        >
          <Unlink className="size-4" />
        </ToolbarButton>
      )}

      {/* Image */}
      <ToolbarButton
        onClick={() =>
          onImageUpload ? fileInputRef.current?.click() : addImageFromUrl()
        }
        disabled={disabled}
        title="Görsel Ekle"
      >
        <ImageIcon className="size-4" />
      </ToolbarButton>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      <div className="flex-1" />

      {/* Undo/Redo */}
      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={disabled || !editor.can().undo()}
        title="Geri Al"
      >
        <Undo className="size-4" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={disabled || !editor.can().redo()}
        title="Yinele"
      >
        <Redo className="size-4" />
      </ToolbarButton>
    </div>
  );
}

export function TipTapEditor({
  content,
  onChange,
  placeholder = "İçeriğinizi buraya yazın...",
  disabled = false,
  minHeight = "400px",
  className,
  onImageUpload,
}: TipTapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Image.configure({
        HTMLAttributes: {
          class: "max-w-full h-auto rounded-lg my-4",
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline hover:text-primary/80",
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content,
    editable: !disabled,
    immediatelyRender: false, // Fix SSR hydration mismatch
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },

    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm sm:prose-base max-w-none focus:outline-none p-4",
          "prose-headings:font-semibold prose-headings:text-foreground",
          "prose-p:text-foreground prose-p:leading-relaxed",
          "prose-a:text-primary prose-a:no-underline hover:prose-a:underline",
          "prose-blockquote:border-l-primary prose-blockquote:bg-slate-50 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-lg",
          "prose-code:bg-slate-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono",
          "prose-img:rounded-lg prose-img:shadow-md"
        ),
        style: `min-height: ${minHeight}`,
      },
    },
  });

  // Sync content changes from outside
  React.useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  // Update editable state
  React.useEffect(() => {
    editor?.setEditable(!disabled);
  }, [disabled, editor]);

  const characterCount = editor?.storage.characterCount?.characters() ?? 0;
  const wordCount = editor?.getText().split(/\s+/).filter(Boolean).length ?? 0;

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-white",
        disabled && "opacity-60",
        className
      )}
    >
      <EditorToolbar
        editor={editor}
        disabled={disabled}
        onImageUpload={onImageUpload}
      />
      <EditorContent editor={editor} />
      <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50/50 px-4 py-2 text-xs text-muted-foreground">
        <span>{wordCount} kelime</span>
        <span>{editor?.getText().length || 0} karakter</span>
      </div>
    </div>
  );
}

export { useEditor, EditorContent };
export type { Editor };
