"use server";

import { auth, signIn } from "@/auth";
import pool from "@/lib/db";
import {
  LoginInput,
  loginSchema,
  SignupInput,
  signupSchema,
} from "@/validations/auth";
import { ActionState } from "@/validations/core";
import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import z from "zod";

export async function registerUserAction(
  prevState: ActionState<SignupInput>,
  formData: FormData,
): Promise<ActionState<SignupInput>> {
  const session = await auth();

  if (!session || !session.user?.id) {
    return {
      success: false,
      message: "No autorizado. Debes iniciar sesión para realizar esta acción.",
      zodErrors: null,
      data: {
        name: formData.get("name") as string,
        email: formData.get("email") as string,
        password: "",
        role: "CLIENT",
      },
    };
  }

  const fields: SignupInput = {
    name: formData.get("name")?.toString() || "",
    email: formData.get("email")?.toString() || "",
    password: formData.get("password")?.toString() || "",
    role:
      (formData.get("role") as "SUPERADMIN" | "ADMIN" | "CLIENT") || "CLIENT",
  };

  const validateFields = signupSchema.safeParse(fields);

  if (!validateFields.success) {
    const flattenedErrors = z.flattenError(validateFields.error);
    return {
      success: false,
      message: "Validación fallida",
      zodErrors: flattenedErrors.fieldErrors,
      data: fields,
    };
  }

  try {
    const { name, email, password, role } = validateFields.data;
    const hashedPassword = await bcrypt.hash(password, 10);

    const adminLogueadoId = parseInt(session.user.id, 10);

    const query = `
      INSERT INTO users (name, email, password, role, status, created_by)
      VALUES ($1, $2, $3, $4, 'activo', $5)
    `;

    await pool.query(query, [
      name,
      email,
      hashedPassword,
      role,
      adminLogueadoId,
    ]);
  } catch (error: any) {
    const errorMessage =
      error.code === "23505"
        ? "El correo electrónico ya está registrado."
        : "Error interno del servidor";

    return {
      success: false,
      message: errorMessage,
      zodErrors: { email: ["El correo ya existe."] },
      data: fields,
    };
  }

  redirect("/dashboard/users");
}

export async function loginAction(
  prevState: ActionState<LoginInput>,
  formData: FormData,
): Promise<ActionState<LoginInput>> {
  const fields = {
    identifier: formData.get("identifier") as string,
    password: formData.get("password") as string,
  };

  const validateFields = loginSchema.safeParse(fields);

  if (!validateFields.success) {
    const flattenedErrors = z.flattenError(validateFields.error);
    return {
      success: false,
      message: "Validación fallida",
      zodErrors: flattenedErrors.fieldErrors,
      data: fields,
    };
  }

  try {
    await signIn("credentials", {
      identifier: validateFields.data.identifier,
      password: validateFields.data.password,
      redirect: true,
      redirectTo: "/dashboard",
    });

    return {
      success: true,
      message: "Redireccionando...",
      zodErrors: null,
      data: fields,
    };
  } catch (error) {
    if (error instanceof AuthError) {
      return {
        success: false,
        message: "Credenciales incorrectas o acceso no autorizado.",
        zodErrors: null,
        data: {
          identifier: validateFields.data.identifier,
          password: "",
        },
      };
    }
    throw error;
  }
}
