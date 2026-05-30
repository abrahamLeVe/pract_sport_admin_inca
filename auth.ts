import pool from "@/lib/db";
import PostgresAdapter from "@auth/pg-adapter";
import bcrypt from "bcryptjs";
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { loginSchema } from "./validations/auth";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PostgresAdapter(pool),
  session: { strategy: "jwt" },
  providers: [
    CredentialsProvider({
      name: "Credenciales",
      credentials: { identifier: {}, password: {} },
      async authorize(credentials) {
        const { identifier, password } =
          await loginSchema.parseAsync(credentials);

        const consulta =
          "SELECT id, name, email, password, role, status FROM users WHERE email = $1 OR name = $1";
        const resultado = await pool.query(consulta, [identifier]);
        const user = resultado.rows[0];
        console.log("Usuario encontrado:", user);
        // En tu authorize de auth.ts
        if (
          !user ||
          !user.password ||
          user.role === "CLIENT" ||
          user.status !== "activo"
        ) {
          return null;
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        console.log("Contraseña válida:", isValidPassword);
        if (!isValidPassword) return null;

        return {
          id: user.id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
});
