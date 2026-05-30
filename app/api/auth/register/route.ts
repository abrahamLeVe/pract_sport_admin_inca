// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, role = "CLIENT" } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json(
        { message: "Todos los campos son obligatorios" },
        { status: 400 },
      );
    }

    // Encriptar la contraseña antes de guardarla
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertar el nuevo usuario en la base de datos
    const query = `
      INSERT INTO users (name, email, password, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, name, email, role
    `;
    const values = [name, email, hashedPassword, role];
    const result = await pool.query(query, values);

    const newUser = result.rows[0];

    return NextResponse.json(
      { message: "Usuario creado con éxito", user: newUser },
      { status: 201 },
    );
  } catch (error: any) {
    // Código 23505 indica violación de restricción única (Unique constraint / Email duplicado)
    if (error.code === "23505") {
      return NextResponse.json(
        { message: "El correo electrónico ya está registrado" },
        { status: 409 },
      );
    }

    console.error("Error en el registro:", error);
    return NextResponse.json(
      { message: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
