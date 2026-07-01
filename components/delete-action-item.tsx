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
import { Trash2, Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ActionState } from "@/validations/core";
import { Button } from "./ui/button";

interface DeleteActionItemProps {
  id: number;
  itemName: string;
  itemType: string;
  // 🔥 La firma debe ser flexible para aceptar los argumentos opcionales
  action: (
    id: number,
    modelType?: string,
    modelId?: number,
  ) => Promise<ActionState<any>>;
  warningText?: string;
  modelType?: string;
  modelId?: number;
}

export function DeleteActionItem({
  id,
  itemName,
  itemType,
  action,
  warningText = "Esta acción no se puede deshacer.",
  modelId,
  modelType,
}: DeleteActionItemProps) {
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);

  const handleDelete = () => {
    startTransition(async () => {
      // Pasamos los parámetros de forma dinámica
      const response = await action(id, modelType, modelId);

      if (response.success) {
        toast.success(response.message);
        setIsOpen(false);
      } else {
        toast.error(response.message || "Error al eliminar");
      }
    });
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant={"ghost"}
          className="hover:bg-destructive/10 dark:hover:bg-destructive/10 text-destructive transition-colors"
          disabled={isPending}
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Trash2 className="h-4 w-4" />
              {/* Esto valida que modelType exista; si existe, muestra el texto */}
              {modelType ? <span>Eliminar</span> : <span>Papelera</span>}
            </>
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
          <AlertDialogDescription>
            Estás a punto de eliminar {itemType}{" "}
            <strong className="text-foreground font-medium">{itemName}</strong>.{" "}
            {warningText}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? "Procesando..." : `Sí, eliminar`}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
