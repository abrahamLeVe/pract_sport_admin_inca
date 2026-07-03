"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { ActionState } from "@/validations/core";
import { AlertCircle } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";

interface FormFeedbackProps {
  formState: ActionState<any>;
}

export function FormFeedback({ formState }: FormFeedbackProps) {
  // 1. Manejo del Toast (Éxitos)
  useEffect(() => {
    if (formState.success && formState.message) {
      toast.success(formState.message);
    }
  }, [formState]);

  // 2. Manejo del Alert (Errores persistentes)
  if (formState.success || !formState.message) return null;

  return (
    <Alert variant="destructive" className="mt-4">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription className="text-sm font-medium">
        {formState.message}
      </AlertDescription>
    </Alert>
  );
}
