import prisma from "@/lib/prisma"
// verifier la validite des donnees 
export async function POST(req) {
  const { id, action } = await req.json()
  if (!id || !action) return Response.json({ error: "Données invalides" }, { status: 400 })
//met a jour le status de l'utilisateur
  await prisma.user.update({
    where: { id },
    data: { status: action },
  })

  return Response.json({ message: "Statut mis à jour avec succès" })
}
