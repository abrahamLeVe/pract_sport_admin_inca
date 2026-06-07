"use client";

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

interface ToggleStatusActionItemProps {
  id: number;
  itemName: string;
  itemType: string;
  currentStatus: string;
  action: (
    id: number,
    status: string,
  ) => Promise<{ success: boolean; message: string }>;
}

export function ToggleStatusActionItem({
  id,
  itemName,
  itemType,
  currentStatus,
  action,
}: ToggleStatusActionItemProps) {
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const isActivating = currentStatus === "inactivo";

  const handleToggle = () => {
    startTransition(async () => {
      const response = await action(id, currentStatus);
      if (response.success) {
        toast.success(response.message);
        setIsOpen(false);
      } else {
        toast.error(response.message);
      }
    });
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <DropdownMenuItem
          onSelect={(e) => e.preventDefault()}
          disabled={isPending}
          className={cn(
            "cursor-pointer rounded-lg gap-2 transition-colors w-full mt-1",
            isActivating
              ? "text-emerald-600 focus:text-emerald-600 "
              : "text-amber-600 focus:text-amber-600 ",
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
                ? `Activar ${itemType}`
                : `Desactivar ${itemType}`}
          </span>
        </DropdownMenuItem>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Confirmas esta acción?</AlertDialogTitle>
          <AlertDialogDescription>
            Estás a punto de{" "}
            <strong className="text-foreground font-medium">
              {isActivating ? "activar" : "desactivar"}
            </strong>{" "}
            la visibilidad de la {itemType}{" "}
            <span className="font-semibold text-foreground">"{itemName}"</span>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
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
