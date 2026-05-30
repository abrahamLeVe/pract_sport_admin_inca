import { auth } from "@/auth";

export default auth((req) => {
  const estaEnDashboard = req.nextUrl.pathname.startsWith("/dashboard");

  const estaLogueado = !!req.auth;

  if (estaEnDashboard && !estaLogueado) {
    const urlLogin = new URL("/", req.nextUrl.origin);
    return Response.redirect(urlLogin);
  }
});

export const config = {
  matcher: [
    /*
     * Coincide con todas las rutas de solicitud excepto las que empiezan por:
     * - api (rutas de API externas o endpoints móviles)
     * - _next/static (archivos estáticos internos)
     * - _next/image (optimización de imágenes nativa)
     * - favicon.ico, placeholder.png (imágenes fijas en public)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|placeholder.png|.*\\.png|.*\\.jpg).*)",
  ],
};
