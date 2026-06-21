"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import LinkExtension from "@tiptap/extension-link";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
} from "lucide-react";

// Extensiones limpias fuera del componente
const extensions = [
  StarterKit,
  LinkExtension.configure({
    openOnClick: false,
    autolink: true,
    HTMLAttributes: {
      class:
        "text-blue-500 underline cursor-pointer hover:text-blue-700 transition-colors",
    },
  }),
];

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function RichTextEditor({
  value,
  onChange,
  disabled,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions,
    content: value,
    editable: !disabled,
    immediatelyRender: false,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class:
          "min-h-[120px] w-full bg-transparent px-3 py-2 text-sm focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 [&_ol]:list-decimal [&_ul]:list-disc [&_ol]:ml-5 [&_ul]:ml-5 [&_li]:mt-1 [&_p]:mb-2",
      },
    },
  });

  // Esqueleto ultra simple (un solo bloque del tamaño del editor)
  if (!editor) {
    return (
      <Skeleton className="h-[160px] w-full rounded-md border border-input shadow-sm" />
    );
  }

  // Lógica reducida para enlaces
  const toggleLink = () => {
    if (editor.isActive("link")) {
      editor.chain().focus().unsetLink().run();
    } else {
      const url = window.prompt("URL del enlace:", "");
      if (url) editor.chain().focus().setLink({ href: url }).run();
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col rounded-md border border-input shadow-sm focus-within:ring-1 focus-within:ring-ring",
        disabled && "opacity-50 cursor-not-allowed",
      )}
    >
      {/* Barra de herramientas minimalista */}
      <div className="flex items-center gap-1 border-b border-input bg-muted/50 p-1 rounded-t-md">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn(
            "p-1.5 rounded-sm hover:bg-muted",
            editor.isActive("bold") && "bg-muted font-bold",
          )}
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cn(
            "p-1.5 rounded-sm hover:bg-muted",
            editor.isActive("italic") && "bg-muted font-bold",
          )}
        >
          <Italic className="h-4 w-4" />
        </button>
        <div className="w-px h-4 bg-border mx-1" />
        <button
          type="button"
          onClick={toggleLink}
          className={cn(
            "p-1.5 rounded-sm hover:bg-muted",
            editor.isActive("link") && "bg-muted text-blue-500",
          )}
        >
          <LinkIcon className="h-4 w-4" />
        </button>
        <div className="w-px h-4 bg-border mx-1" />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cn(
            "p-1.5 rounded-sm hover:bg-muted",
            editor.isActive("bulletList") && "bg-muted font-bold",
          )}
        >
          <List className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={cn(
            "p-1.5 rounded-sm hover:bg-muted",
            editor.isActive("orderedList") && "bg-muted font-bold",
          )}
        >
          <ListOrdered className="h-4 w-4" />
        </button>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
}
