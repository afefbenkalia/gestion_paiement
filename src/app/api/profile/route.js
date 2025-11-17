import { NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import bcrypt from "bcryptjs"
import prisma from "@/lib/prisma"
import fs from "fs/promises"
import path from "path"

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
    select: { id: true, name: true, email: true, role: true, status: true, createdAt: true, password: true, cv: true, specialite: true },
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
    const contentType = req.headers.get("content-type") || ""

    let updateData = {}

    if (contentType.includes("multipart/form-data")) {
      // gérer upload de CV + champs texte
      const form = await req.formData()
      const name = form.get("name") || undefined
      const email = form.get("email") || undefined
      const specialite = form.get("specialite") || undefined
      const cvFile = form.get("cv")


      // Only accept name/email when role is RESPONSABLE
      if (user.role === "RESPONSABLE") {
        if (name) updateData.name = String(name)
        if (email) {
          if (String(email) !== user.email) {
            const existing = await prisma.user.findUnique({ where: { email: String(email) } })
            if (existing) return NextResponse.json({ error: "Email déjà utilisé" }, { status: 400 })
          }
          updateData.email = String(email)
        }
      }

      // role-specific: specialite only for FORMATEUR
      if (user.role === "FORMATEUR" && specialite) updateData.specialite = String(specialite)

      if (cvFile && typeof cvFile === "object" && cvFile.size) {
        // sauvegarder le fichier dans /public/uploads
        const uploadsDir = path.join(process.cwd(), "public", "uploads")
        await fs.mkdir(uploadsDir, { recursive: true })
        const filename = `${Date.now()}-${cvFile.name}`
        const buffer = Buffer.from(await cvFile.arrayBuffer())
        const filePath = path.join(uploadsDir, filename)
        await fs.writeFile(filePath, buffer)
        updateData.cv = `/uploads/${filename}`
      }
    } else {
      const body = await req.json()
      const { name, email, specialite } = body

      // Only require name/email when updating a RESPONSABLE
      if (user.role === "RESPONSABLE") {
        if (!name || !email) {
          return NextResponse.json({ error: "Nom et email requis" }, { status: 400 })
        }

        if (email !== user.email) {
          const existing = await prisma.user.findUnique({ where: { email } })
          if (existing) return NextResponse.json({ error: "Email déjà utilisé" }, { status: 400 })
        }

        updateData.name = name
        updateData.email = email
      } else {
        // For FORMATEUR and COORDINATEUR we accept only their allowed fields
        if (user.role === "FORMATEUR" && specialite) updateData.specialite = specialite
      }
    }

    // Restreindre ce qui peut être modifié selon le rôle
    if (user.role === "RESPONSABLE") {
      // Responsable: only name & email
      const allowed = { name: updateData.name, email: updateData.email }
      updateData = Object.fromEntries(Object.entries(allowed).filter(([, v]) => v !== undefined))
    } else if (user.role === "COORDINATEUR") {
      // Coordinateur: allow only cv
      const allowed = { cv: updateData.cv }
      updateData = Object.fromEntries(Object.entries(allowed).filter(([, v]) => v !== undefined))
    } else if (user.role === "FORMATEUR") {
      // Formateur: allow specialite and cv only
      const allowed = { specialite: updateData.specialite, cv: updateData.cv }
      updateData = Object.fromEntries(Object.entries(allowed).filter(([, v]) => v !== undefined))
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: { id: true, name: true, email: true, role: true, createdAt: true, specialite: true, cv: true },
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
