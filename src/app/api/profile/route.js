import { NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import bcrypt from "bcryptjs"
import prisma from "@/lib/prisma"
import fs from "fs/promises"
import path from "path"

// Récupération de l'utilisateur depuis le token
async function getUserFromToken(req) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token) return null
  const id = Number(token.sub)
  if (!id) return null
  const user = await prisma.user.findUnique({
    where: { id },
    select: { 
      id: true, 
      name: true, 
      email: true, 
      role: true, 
      status: true, 
      createdAt: true, 
      password: true, 
      cv: true, 
      specialite: true,
      fonction: true,
      cin: true,
      rib: true,
      banque: true,
      tel: true
    },
  })
  return user
}

// Fonctions de validation
function validateCIN(cin) {
  if (!cin) return true // Champ optionnel
  const cinRegex = /^\d{8}$/
  return cinRegex.test(cin)
}

function validateRIB(rib) {
  if (!rib) return true // Champ optionnel
  const ribRegex = /^\d{20}$/
  return ribRegex.test(rib)
}

export async function GET(req) {
  try {
    const user = await getUserFromToken(req)
    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })

    const { password, ...safe } = user
    return NextResponse.json(safe)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// Modifier le profil
export async function PATCH(req) {
  try {
    const user = await getUserFromToken(req)
    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    
    const contentType = req.headers.get("content-type") || ""
    let updateData = {}

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData()
      const name = form.get("name") || undefined
      const email = form.get("email") || undefined
      const specialite = form.get("specialite") || undefined
      const fonction = form.get("fonction") || undefined
      const cin = form.get("cin") || undefined
      const rib = form.get("rib") || undefined
      const banque = form.get("banque") || undefined
      const tel = form.get("tel") || undefined
      const cvFile = form.get("cv")

      // Validation CIN et RIB
      if (cin && !validateCIN(cin)) {
        return NextResponse.json({ error: "Le CIN doit contenir exactement 8 chiffres" }, { status: 400 })
      }
      if (rib && !validateRIB(rib)) {
        return NextResponse.json({ error: "Le RIB doit contenir exactement 20 chiffres" }, { status: 400 })
      }

      // RESPONSABLE: name & email
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

      // COORDINATEUR: fonction, cin, rib, banque, tel
      if (user.role === "COORDINATEUR") {
        if (fonction) updateData.fonction = String(fonction)
        if (cin) updateData.cin = String(cin)
        if (rib) updateData.rib = String(rib)
        if (banque) updateData.banque = String(banque)
        if (tel) updateData.tel = String(tel)
      }

      // FORMATEUR: specialite, cin, rib, banque, tel
      if (user.role === "FORMATEUR") {
        if (specialite) updateData.specialite = String(specialite)
        if (cin) updateData.cin = String(cin)
        if (rib) updateData.rib = String(rib)
        if (banque) updateData.banque = String(banque)
        if (tel) updateData.tel = String(tel)
      }

      // CV pour tous les rôles
      if (cvFile && typeof cvFile === "object" && cvFile.size) {
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
      const { name, email, specialite, fonction, cin, rib, banque, tel } = body

      // Validation CIN et RIB
      if (cin && !validateCIN(cin)) {
        return NextResponse.json({ error: "Le CIN doit contenir exactement 8 chiffres" }, { status: 400 })
      }
      if (rib && !validateRIB(rib)) {
        return NextResponse.json({ error: "Le RIB doit contenir exactement 20 chiffres" }, { status: 400 })
      }

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
      } else if (user.role === "COORDINATEUR") {
        if (fonction) updateData.fonction = fonction
        if (cin) updateData.cin = cin
        if (rib) updateData.rib = rib
        if (banque) updateData.banque = banque
        if (tel) updateData.tel = tel
      } else if (user.role === "FORMATEUR") {
        if (specialite) updateData.specialite = specialite
        if (cin) updateData.cin = cin
        if (rib) updateData.rib = rib
        if (banque) updateData.banque = banque
        if (tel) updateData.tel = tel
      }
    }

    // Filtrer les champs autorisés par rôle
    const allowedFields = {}
    
    if (user.role === "RESPONSABLE") {
      allowedFields.name = updateData.name
      allowedFields.email = updateData.email
    } else if (user.role === "COORDINATEUR") {
      allowedFields.fonction = updateData.fonction
      allowedFields.cin = updateData.cin
      allowedFields.rib = updateData.rib
      allowedFields.banque = updateData.banque
      allowedFields.tel = updateData.tel
      allowedFields.cv = updateData.cv
    } else if (user.role === "FORMATEUR") {
      allowedFields.specialite = updateData.specialite
      allowedFields.cin = updateData.cin
      allowedFields.rib = updateData.rib
      allowedFields.banque = updateData.banque
      allowedFields.tel = updateData.tel
      allowedFields.cv = updateData.cv
    }

    updateData = Object.fromEntries(Object.entries(allowedFields).filter(([, v]) => v !== undefined))

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: updateData,
      select: { 
        id: true, 
        name: true, 
        email: true, 
        role: true, 
        createdAt: true, 
        specialite: true, 
        fonction: true,
        cin: true,
        rib: true,
        banque: true,
        tel: true,
        cv: true 
      },
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