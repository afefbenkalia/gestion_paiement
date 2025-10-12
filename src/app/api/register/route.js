import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function POST(req) {
  try {
    const { name, email, password, role } = await req.json()

    if (!name || !email || !password || !role)
      return Response.json({ error: "Tous les champs sont requis" }, { status: 400 })

    // Empêcher l'inscription en tant que RESPONSABLE
    if (role === "RESPONSABLE") {
      return Response.json({ error: "Inscription non autorisée pour ce rôle" }, { status: 403 })
    }

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser)
      return Response.json({ error: "Cet utilisateur existe déjà" }, { status: 400 })

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, role },
    })

    return Response.json({ message: "Compte créé avec succès", user })
  } catch (err) {
    console.error(err)
    return Response.json({ error: "Erreur serveur" }, { status: 500 })
  }
}