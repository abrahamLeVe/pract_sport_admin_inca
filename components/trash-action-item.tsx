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

interface TrashActionItemProps {
  id: number;
  action: (id: number, ...args: any[]) => Promise<ActionState<any>>;
  actionArgs?: any[];
  title?: string;
  description?: string;
  variant?: "ghost" | "destructive" | "outline" | "default" | "secondary";
  confirmVariant?: "destructive" | "default"; // 🔥 Nuevo: Color del botón de confirmación
  size?: "default" | "sm" | "icon";
  showText?: boolean;
  disabled?: boolean;
  buttonText?: string;
  asMenuItem?: boolean;
  onSuccess?: () => void;
  icon?: React.ReactNode; // 🔥 Nuevo: Icono opcional
}

export function TrashActionItem({
  id,
  action,
  actionArgs = [],
  title = "¿Estás seguro?",
  description = "Esta acción no se puede deshacer.",
  variant = "destructive",
  confirmVariant = "destructive", // Por defecto rojo
  size = "icon",
  showText = false,
  disabled = false,
  buttonText = "Eliminar",
  asMenuItem = false,
  onSuccess,
  icon = <Trash2 className="h-4 w-4" />, // Por defecto basura
}: TrashActionItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const handleAction = () => {
    startTransition(async () => {
      const res = await action(id, ...actionArgs);

      if (res.success) {
        toast.success(res.message);
        setIsOpen(false);
        if (onSuccess) onSuccess();
      } else {
        toast.error(res.message || "Error al realizar la acción");
      }
    });
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        {asMenuItem ? (
          <DropdownMenuItem
            onSelect={(e) => {
              e.preventDefault();
              setIsOpen(true);
            }}
            disabled={disabled || isPending}
            // Cambia el color del texto si es destructivo o no
            className={`cursor-pointer w-full ${variant === "destructive" ? "text-destructive focus:bg-destructive/10 focus:text-destructive" : ""}`}
          >
            {/* Si el icono es un componente, pasamos el className. Si es un elemento, lo clonamos */}
            {icon && <span className={showText ? "mr-2" : ""}>{icon}</span>}
            {showText && buttonText}
          </DropdownMenuItem>
        ) : (
          <Button
            variant={variant}
            size={size}
            disabled={disabled || isPending}
            title={buttonText}
          >
            {icon && <span className={showText ? "mr-2" : ""}>{icon}</span>}
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
            variant={confirmVariant} // 🔥 Usamos la variante flexible
            onClick={handleAction}
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
