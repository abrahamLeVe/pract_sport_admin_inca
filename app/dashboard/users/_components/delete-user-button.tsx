"use client";

import { toggleUserStatusAction } from "@/app/actions/users";
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
} from "@/components/ui/alert-dialog"; // Importamos el modal de shadcn
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Trash2, UserCheck } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

interface ToggleUserStatusButtonProps {
  userId: number;
  userName: string;
  currentStatus: string;
}

export function DeleteUserButton({
  userId,
  userName,
  currentStatus,
}: ToggleUserStatusButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false); // Controlamos el estado de apertura
  const isActivating = currentStatus === "inactivo";

  const handleToggle = () => {
    startTransition(async () => {
      const response = await toggleUserStatusAction(userId, currentStatus);
      if (response.success) {
        toast.success(response.message);
        setIsOpen(false); // Cerramos el modal tras el éxito
      } else {
        toast.error(response.message);
      }
    });
  };

  const accionTexto = isActivating ? "activar" : "desactivar";

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      {/* El trigger envuelve al elemento del menú usando asChild */}
      <AlertDialogTrigger asChild>
        <DropdownMenuItem
          // Evitamos que el menú se cierre de golpe al hacer clic, permitiendo que el AlertDialog despierte limpio
          onSelect={(e) => e.preventDefault()}
          disabled={isPending}
          className={cn(
            "cursor-pointer rounded-lg gap-2 transition-colors w-full",
            isActivating
              ? "text-blue-600 focus:text-blue-600 focus:bg-blue-50 dark:focus:bg-blue-950/30"
              : "text-destructive focus:text-destructive focus:bg-destructive/10",
          )}
        >
          {isActivating ? (
            <UserCheck className="h-3.5 w-3.5" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}

          <span>
            {isPending
              ? isActivating
                ? "Activando..."
                : "Desactivando..."
              : isActivating
                ? "Activar Usuario"
                : "Desactivar"}
          </span>
        </DropdownMenuItem>
      </AlertDialogTrigger>

      {/* Contenido Estilizado de la Alerta Shadcn */}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Confirmas esta acción?</AlertDialogTitle>
          <AlertDialogDescription>
            Estás a punto de{" "}
            <strong className="text-foreground font-medium">
              {accionTexto}
            </strong>{" "}
            la cuenta de{" "}
            <span className="font-semibold text-foreground">{userName}</span>.
            Podrás revertir este cambio en cualquier momento desde este panel.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault(); // Evitamos el cierre automático para manejar el estado de carga
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
