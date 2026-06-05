"use client";

import { toggleProductStatusAction } from "@/app/actions/products";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

interface ToggleProductStatusButtonProps {
  productId: number;
  productName: string;
  currentStatus: string;
}

export function ToggleProductStatusButton({
  productId,
  productName,
  currentStatus,
}: ToggleProductStatusButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const isActivating = currentStatus === "inactivo";

  const handleToggle = () => {
    startTransition(async () => {
      const response = await toggleProductStatusAction(
        productId,
        currentStatus,
      );
      if (response.success) {
        toast.success(response.message);
        setIsOpen(false);
      } else {
        toast.error(response.message);
      }
    });
  };

  const accionTexto = isActivating ? "activar" : "desactivar";

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <DropdownMenuItem
          onSelect={(e) => e.preventDefault()}
          disabled={isPending}
          className={cn(
            "cursor-pointer rounded-lg gap-2 transition-colors w-full",
            isActivating
              ? "text-emerald-600 focus:text-emerald-600 focus:bg-emerald-50 dark:focus:bg-emerald-950/30"
              : "text-amber-600 focus:text-amber-600 focus:bg-amber-50 dark:focus:bg-amber-950/30",
          )}
        >
          {isActivating ? (
            <Eye className="h-3.5 w-3.5" />
          ) : (
            <EyeOff className="h-3.5 w-3.5" />
          )}

          <span>
            {isPending
              ? isActivating
                ? "Activando..."
                : "Desactivando..."
              : isActivating
                ? "Activar Producto"
                : "Desactivar Producto"}
          </span>
        </DropdownMenuItem>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Confirmas esta acción?</AlertDialogTitle>
          <AlertDialogDescription>
            Estás a punto de{" "}
            <strong className="text-foreground font-medium">
              {accionTexto}
            </strong>{" "}
            la visibilidad del producto{" "}
            <span className="font-semibold text-foreground">
              "{productName}"
            </span>
            .
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleToggle();
            }}
            disabled={isPending}
          >
            {isPending ? "Procesando..." : "Sí, confirmar"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
