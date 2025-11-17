import { getToken } from "next-auth/jwt"
import { NextResponse } from "next/server"

export async function middleware(req) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  const { pathname } = req.nextUrl

  // Redirection si non authentifié
  if (!token) {
    if (pathname.startsWith("/dashboard") || 
        pathname.startsWith("/formateur") || 
        pathname.startsWith("/coordinateur") ||
        pathname.startsWith("/responsable")) {
      return NextResponse.redirect(new URL("/login", req.url))
    }
  }

  // Protection des routes par rôle
  if (token) {
    // Route réservée au RESPONSABLE (routes /responsable/* et /dashboard/responsable/*)
    if (pathname.startsWith("/responsable")) {
      if (token.role !== "RESPONSABLE") {
        return NextResponse.redirect(new URL("/dashboard", req.url))
      }
      // Laisse passer - l'utilisateur est authentifié et est RESPONSABLE
    }

    if (pathname.startsWith("/dashboard/responsable") && token.role !== "RESPONSABLE") {
      return NextResponse.redirect(new URL("/dashboard", req.url))
    }

    // Redirection des anciennes routes vers les nouvelles
    if (pathname === "/dashboard/formateur" || pathname === "/dashboard/formateur/") {
      if (token.status === "INACTIVE" || token.status === "PENDING") {
        return NextResponse.redirect(new URL("/pending", req.url))
      }
      return NextResponse.redirect(new URL("/formateur", req.url))
    }

    if (pathname === "/dashboard/coordinateur" || pathname === "/dashboard/coordinateur/") {
      if (token.status === "INACTIVE" || token.status === "PENDING") {
        return NextResponse.redirect(new URL("/pending", req.url))
      }
      return NextResponse.redirect(new URL("/coordinateur", req.url))
    }

    if (pathname === "/dashboard/pending" || pathname === "/dashboard/pending/") {
      return NextResponse.redirect(new URL("/pending", req.url))
    }

    // Protection des nouvelles routes /formateur et /coordinateur
    if (pathname.startsWith("/formateur")) {
      if (token.role !== "FORMATEUR") {
        return NextResponse.redirect(new URL("/dashboard", req.url))
      }
      // Rediriger vers /pending si le statut est INACTIVE
      if (token.status === "INACTIVE" || token.status === "PENDING") {
        return NextResponse.redirect(new URL("/pending", req.url))
      }
    }

    if (pathname.startsWith("/coordinateur")) {
      if (token.role !== "COORDINATEUR") {
        return NextResponse.redirect(new URL("/dashboard", req.url))
      }
      // Rediriger vers /pending si le statut est INACTIVE
      if (token.status === "INACTIVE" || token.status === "PENDING") {
        return NextResponse.redirect(new URL("/pending", req.url))
      }
    }

    // Les RESPONSABLES ne doivent jamais accéder à la page /pending
    if (pathname.startsWith("/pending")) {
      if (token.role === "RESPONSABLE") {
        return NextResponse.redirect(new URL("/dashboard/responsable", req.url))
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/dashboard/:path*", 
    "/formateur/:path*", 
    "/coordinateur/:path*",
    "/responsable/:path*",
    "/pending/:path*"
  ],
}