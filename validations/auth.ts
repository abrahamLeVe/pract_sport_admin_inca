import { z } from "zod";

// 1. ESQUEMAS
export const signupSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.email("Introduce un correo electrónico válido"),
  password: z
    .string()
    .min(6, "La contraseña debe tener al menos 6 caracteres")
    .regex(/[A-Z]/, "Debe contener al menos una mayúscula")
    .regex(/[a-z]/, "Debe contener al menos una minúscula")
    .regex(/[0-9]/, "Debe contener al menos un número"),
  role: z.enum(["SUPERADMIN", "ADMIN", "CLIENT"]),
});

export const loginSchema = z.object({
  identifier: z
    .email({ message: "Debe ser un correo electrónico válido" })
    .or(z.string().min(3, "El nombre de usuario es demasiado corto")),
  password: z.string().min(1, "La contraseña es obligatoria"),
});

export const EditUserSchema = z.object({
  id: z.coerce.number(),
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  email: z.email("Introduce un correo electrónico válido"),
  password: z
    .string()
    .min(6, "La contraseña debe tener al menos 6 caracteres")
    .regex(/[A-Z]/, "Debe contener al menos una mayúscula")
    .regex(/[a-z]/, "Debe contener al menos una minúscula")
    .regex(/[0-9]/, "Debe contener al menos un número")
    .or(z.literal("")),
  role: z.enum(["SUPERADMIN", "ADMIN", "CLIENT"]),
  status: z.enum(["activo", "inactivo"]),
});

// 2. TIPOS INFERIDOS
export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type EditUserInput = z.infer<typeof EditUserSchema>;

// 3. PROPS DE COMPONENTES
export interface EditUserFormProps {
  initialData: EditUserInput;
}

// ============================================================================
// 4. INTERFAZ PARA LA TABLA
// ============================================================================
export interface UserTableItem {
  id: number; // Usamos string o number dependiendo de si usas UUIDs o IDs seriales
  name: string | null;
  email: string;
  image_url: string | null; // Aquí vendrá el avatar del usuario
  role: string;
  status: string;
  created_at: Date;

  // 🔥 Campo virtual para la DataTable
  is_active?: boolean;
}
