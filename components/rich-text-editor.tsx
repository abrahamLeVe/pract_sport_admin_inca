"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Italic, List, ListOrdered } from "lucide-react";
import { cn } from "@/lib/utils";

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
    extensions: [StarterKit],
    content: value,
    editable: !disabled,
    // 🔥 FIX 1: Apagamos el renderizado inmediato para que Next.js no lance el warning amarillo
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        // 🔥 FIX 2: Añadimos clases CSS puras para forzar a Tailwind a mostrar las listas y márgenes
        class:
          "min-h-[120px] w-full rounded-b-md border-0 bg-transparent px-3 py-2 text-sm focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 [&_ol]:list-decimal [&_ul]:list-disc [&_ol]:ml-5 [&_ul]:ml-5 [&_li]:mt-1 [&_p]:mb-2",
      },
    },
  });

  if (!editor) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex flex-col rounded-md border border-input shadow-sm focus-within:ring-1 focus-within:ring-ring",
        disabled && "opacity-50 cursor-not-allowed",
      )}
    >
      {/* Barra de herramientas */}
      <div className="flex items-center gap-1 border-b border-input bg-muted/50 p-1 rounded-t-md">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          className={cn(
            "p-1.5 rounded-sm hover:bg-muted transition-colors",
            editor.isActive("bold") && "bg-muted text-foreground font-bold",
          )}
          title="Negrita"
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          className={cn(
            "p-1.5 rounded-sm hover:bg-muted transition-colors",
            editor.isActive("italic") && "bg-muted text-foreground font-bold",
          )}
          title="Cursiva"
        >
          <Italic className="h-4 w-4" />
        </button>
        <div className="w-px h-4 bg-border mx-1" />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cn(
            "p-1.5 rounded-sm hover:bg-muted transition-colors",
            editor.isActive("bulletList") &&
              "bg-muted text-foreground font-bold",
          )}
          title="Lista de viñetas"
        >
          <List className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={cn(
            "p-1.5 rounded-sm hover:bg-muted transition-colors",
            editor.isActive("orderedList") &&
              "bg-muted text-foreground font-bold",
          )}
          title="Lista numerada"
        >
          <ListOrdered className="h-4 w-4" />
        </button>
      </div>

      {/* Área de escritura */}
      <EditorContent editor={editor} />
    </div>
  );
}
