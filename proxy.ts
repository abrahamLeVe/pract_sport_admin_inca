import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";

export async function proxy(request: NextRequest) {
  const session = await auth();
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/dashboard")) {
    if (!session) {
      const urlLogin = request.nextUrl.clone();
      urlLogin.pathname = "/";

      urlLogin.searchParams.set("error", "SessionExpired");

      return NextResponse.redirect(urlLogin);
    }
  }

  return NextResponse.next();
}
