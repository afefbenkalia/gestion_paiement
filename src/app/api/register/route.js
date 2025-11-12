import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { writeFile } from "fs/promises"
import path from "path"

export async function POST(req) {
  try {
    const formData = await req.formData()
    const name = formData.get("name")
    const email = formData.get("email")
    const password = formData.get("password")
    const role = formData.get("role")
    const specialite = formData.get("specialite") || null
    const file = formData.get("cv")

    if (!name || !email || !password || !role) {
      return Response.json({ error: "Tous les champs sont requis" }, { status: 400 })
    }

    if (role === "RESPONSABLE") {
      return Response.json({ error: "Inscription non autorisée pour ce rôle" }, { status: 403 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) return Response.json({ error: "Cet utilisateur existe déjà" }, { status: 400 })

    const hashed = await bcrypt.hash(password, 10)
    let cvPath = null

    // 🔽 Enregistrement du fichier CV
    if (file && file.name) {
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const filePath = path.join(process.cwd(), "public/uploads", file.name)
      await writeFile(filePath, buffer)
      cvPath = `/uploads/${file.name}`
    }

    const user = await prisma.user.create({
      data: { name, email, password: hashed, role, specialite, cv: cvPath },
    })

    return Response.json({ message: "Inscription réussie", user })
  } catch (err) {
    console.error(err)
    return Response.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
