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

import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface RichTextEditorProps {
  value: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  readOnly?: boolean;
}

export function RichTextEditor({
  value,
  onChange,
  disabled,
  readOnly = false,
}: RichTextEditorProps) {
  const [isLinkOpen, setIsLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: false,
      }),
      LinkExtension.configure({
        autolink: true,
        HTMLAttributes: {
          class:
            "text-blue-500 underline cursor-pointer hover:text-blue-700 transition-colors",
        },
      }),
    ],
    content: value,
    editable: !disabled,
    immediatelyRender: false,
    onUpdate: ({ editor }) => (onChange ? onChange(editor.getHTML()) : null),
    editorProps: {
      attributes: {
        class:
          "min-h-[120px] w-full bg-transparent px-3 py-2 text-sm focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 [&_ol]:list-decimal [&_ul]:list-disc [&_ol]:ml-5 [&_ul]:ml-5 [&_li]:mt-1 [&_p]:mb-2",
      },
    },
  });

  if (!editor) {
    return (
      <Skeleton className="h-[160px] w-full rounded-md border border-input shadow-sm" />
    );
  }

  const handleOpenLinkClick = (open: boolean) => {
    if (open) {
      if (editor.isActive("link")) {
        // Si ya hay un enlace seleccionado, funcionará como Toggle (lo quita) y no abre el popover
        editor.chain().focus().unsetLink().run();
        setIsLinkOpen(false);
      } else {
        // Si no hay enlace, limpiamos el input y abrimos el popover
        setLinkUrl("");
        setIsLinkOpen(true);
      }
    } else {
      setIsLinkOpen(false);
    }
  };

  const applyLink = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (linkUrl.trim()) {
      editor.chain().focus().setLink({ href: linkUrl }).run();
    }
    setIsLinkOpen(false);
    setLinkUrl("");
  };

  return (
    <div
      className={cn(
        "flex flex-col rounded-md border border-input shadow-sm focus-within:ring-1 focus-within:ring-ring",
        disabled && "opacity-50 cursor-not-allowed",
      )}
    >
      {!readOnly ? (
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

          <Popover open={isLinkOpen} onOpenChange={handleOpenLinkClick}>
            <PopoverTrigger asChild>
              <button
                type="button"
                className={cn(
                  "p-1.5 rounded-sm hover:bg-muted focus:outline-none",
                  editor.isActive("link") && "bg-muted text-blue-500",
                )}
              >
                <LinkIcon className="h-4 w-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              className="w-80 p-3 shadow-md"
              side="bottom"
              align="start"
            >
              <form onSubmit={applyLink} className="flex gap-2 items-center">
                <Input
                  id="link_url"
                  name="link_url"
                  type="url"
                  placeholder="https://ejemplo.com"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  className="h-8 flex-1"
                  autoFocus
                />
                <Button type="submit" size="sm" className="h-8">
                  Añadir
                </Button>
              </form>
            </PopoverContent>
          </Popover>

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
      ) : null}

      <EditorContent editor={editor} />
    </div>
  );
}
