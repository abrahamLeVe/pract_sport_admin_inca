"use client";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { ActionState } from "@/validations/core";
import { Loader2, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

interface DeleteActionItemProps {
  id: number;
  action: (id: number, ...args: any[]) => Promise<ActionState<any>>;
  actionArgs?: any[];
  title?: string;
  description?: string;
  variant?: "ghost" | "destructive" | "outline";
  size?: "default" | "sm" | "icon";
  showText?: boolean;
  disabled?: boolean;
  buttonText?: string;
  asMenuItem?: boolean;
  onSuccess?: () => void; // 🔥 1. Agregamos esta propiedad
}

export function DeleteActionItem({
  id,
  action,
  actionArgs = [],
  title = "¿Estás seguro?",
  description = "Esta acción no se puede deshacer. Se eliminará permanentemente.",
  variant = "destructive",
  size = "icon",
  showText = false,
  disabled = false,
  buttonText = "Eliminar",
  asMenuItem = false,
  onSuccess, // 🔥 2. La recibimos aquí
}: DeleteActionItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const res = await action(id, ...actionArgs);

      if (res.success) {
        toast.success(res.message);
        setIsOpen(false);
        if (onSuccess) onSuccess(); // 🔥 3. Le avisamos a la tabla que ya terminamos para que cierre el menú
      } else {
        toast.error(res.message || "Error al eliminar");
      }
    });
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        {asMenuItem ? (
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault(); // Mantiene el menú abierto temporalmente para que el Modal pueda existir
              setIsOpen(true);
            }}
            disabled={disabled || isPending}
            className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer w-full"
          >
            <Trash2 className={`h-4 w-4 ${showText ? "mr-2" : ""}`} />
            {showText && buttonText}
          </DropdownMenuItem>
        ) : (
          <Button
            variant={variant}
            size={size}
            disabled={disabled || isPending}
            className={
              variant === "ghost"
                ? "text-destructive hover:bg-destructive/10"
                : ""
            }
          >
            <Trash2 className={`h-4 w-4 ${showText ? "mr-2" : ""}`} />
            {showText && buttonText}
          </Button>
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Procesando...
              </>
            ) : (
              "Sí, confirmar"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
