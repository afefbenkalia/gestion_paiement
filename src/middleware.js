import { getToken } from "next-auth/jwt"
import { NextResponse } from "next/server"

export async function middleware(req) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const { pathname } = req.nextUrl

  // Redirection si non authentifié
  if (!token && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  // Protection des routes par rôle
  if (token) {
    // Route réservée au RESPONSABLE
    if (pathname.startsWith("/dashboard/responsable") && token.role !== "RESPONSABLE") {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    // Route réservée au COORDINATEUR
    if (pathname.startsWith("/dashboard/coordinateur") && token.role !== "COORDINATEUR") {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    // Route réservée au FORMATEUR
    if (pathname.startsWith("/dashboard/formateur") && token.role !== "FORMATEUR") {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*"],
}