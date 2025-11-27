import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function seedFicheDePaie() {
  console.log("🌱 Seeding Fiches de paie...");

  // Récupérer quelques users et sessions pour utiliser leurs IDs
  const responsable1 = await prisma.user.findFirst({ where: { email: "mehdi.resp@test.com" } });
  const responsable2 = await prisma.user.findFirst({ where: { email: "sana.resp@test.com" } });

  const coordinateurs = await prisma.user.findMany({ where: { role: "COORDINATEUR" } });
  const formateurs = await prisma.user.findMany({ where: { role: "FORMATEUR" } });
  const sessions = await prisma.session.findMany();

  if (!responsable1 || !responsable2) {
    console.error("⚠️ Responsables non trouvés, vérifie que le seeder des users a bien été exécuté.");
    process.exit(1);
  }

  // Seed fiches de paie
  await prisma.ficheDePaie.createMany({
    data: [
      {
        numMemoire: "MEM-001",
        nomResponsable: responsable1.name,
        periode: "Janvier 2025",
        typeFiche: "FORMATION",
        responsableId: responsable1.id,
        coordinateurId: coordinateurs[0]?.id,
        formateurId: formateurs[0]?.id,
        sessionId: sessions[0]?.id,
        montantTotalBrut: 1050,
        montantTotalNet: 900,
      },
      {
        numMemoire: "MEM-002",
        nomResponsable: responsable1.name,
        periode: "Janvier 2025",
        typeFiche: "FORMATION",
        responsableId: responsable1.id,
        coordinateurId: coordinateurs[1]?.id,
        formateurId: formateurs[1]?.id,
        sessionId: sessions[1]?.id,
        montantTotalBrut: 1200,
        montantTotalNet: 1000,
      },
      {
        numMemoire: "MEM-003",
        nomResponsable: responsable1.name,
        periode: "Février 2025",
        typeFiche: "COORDINATION",
        responsableId: responsable1.id,
        coordinateurId: coordinateurs[2]?.id,
        montantTotalBrut: 780,
        montantTotalNet: 700,
      },
      {
        numMemoire: "MEM-004",
        nomResponsable: responsable2.name,
        periode: "Mars 2025",
        typeFiche: "REGLEMENT",
        responsableId: responsable2.id,
        montantTotalBrut: 500,
        montantTotalNet: 450,
      },
      {
        numMemoire: "MEM-005",
        nomResponsable: responsable2.name,
        periode: "Mars 2025",
        typeFiche: "FORMATION",
        responsableId: responsable2.id,
        formateurId: formateurs[2]?.id,
        montantTotalBrut: 1100,
        montantTotalNet: 950,
      }
    ],
    skipDuplicates: true, // éviter doublons si le seeder est lancé plusieurs fois
  });

  console.log("🌱 SEED Fiches de paie terminé avec succès !");
}

seedFicheDePaie()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
