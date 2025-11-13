import { NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import bcrypt from "bcryptjs"
import prisma from "@/lib/prisma"

// Utilise le token JWT fourni par NextAuth pour protéger les endpoints.
// GET -> renvoie les infos publiques du user
// PATCH -> met à jour name/email
// PUT -> changement de mot de passe (currentPassword + newPassword)



//récupération de l’utilisateur depuis le token
async function getUserFromToken(req) {
  //Vérifier l’identité de l’utilisateur grâce à un token JWT (NextAuth)
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return null
  const id = Number(token.sub)
  if (!id) return null
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, name: true, email: true, role: true, createdAt: true, password: true },
  })
  return user
}

export async function GET(req) {
  try {
    //Vérifie si le token est valide (utilisateur connecté)
    const user = await getUserFromToken(req)
    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

    // sans mot de passe 
    const { password, ...safe } = user
    return NextResponse.json(safe)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
// modifier le profil (name, email)
export async function PATCH(req) {
  try {
    //recupere l'utilisateur connecté
    const user = await getUserFromToken(req)
    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

    const body = await req.json()
    const { name, email } = body

    if (!name || !email) {
      return NextResponse.json({ error: "Nom et email requis" }, { status: 400 })
    }

    // Si email changé, vérifier unicité
    if (email !== user.email) {
      const existing = await prisma.user.findUnique({ where: { email } })
      if (existing) return NextResponse.json({ error: "Email déjà utilisé" }, { status: 400 })
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { name, email },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    })

    return NextResponse.json({ message: "Profil mis à jour", user: updated })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function PUT(req) {
  try {
    const user = await getUserFromToken(req)
    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

    const body = await req.json()
    const { currentPassword, newPassword } = body
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "currentPassword et newPassword requis" }, { status: 400 })
    }

    const valid = await bcrypt.compare(currentPassword, user.password)
    if (!valid) return NextResponse.json({ error: "Mot de passe actuel incorrect" }, { status: 400 })

    const hashed = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({ where: { id: user.id }, data: { password: hashed } })

    return NextResponse.json({ message: "Mot de passe mis à jour" })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
