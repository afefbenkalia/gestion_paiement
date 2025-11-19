// prisma/seed.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding table FicheDePaie...");

  // ⚠️ Adapte ces IDs selon ta base
  const responsableId = 5;
  const coordinateurId = 6;
  const formateurId = 19;
  const sessionId = 1;

  const fiches = [
    {
      numMemoire: "FP-SEED-001",
      nomResponsable: "Responsable Seed 1",
      periode: "Janvier 2025",
      typeFiche: "FORMATION",
    },
    {
      numMemoire: "FP-SEED-002",
      nomResponsable: "Responsable Seed 2",
      periode: "Février 2025",
      typeFiche: "FORMATION",
    },
    {
      numMemoire: "FP-SEED-003",
      nomResponsable: "Responsable Seed 3",
      periode: "Mars 2025",
      typeFiche: "COORDINATION",
    },
    {
      numMemoire: "FP-SEED-004",
      nomResponsable: "Responsable Seed 4",
      periode: "Avril 2025",
      typeFiche: "FORMATION",
    },
    {
      numMemoire: "FP-SEED-005",
      nomResponsable: "Responsable Seed 5",
      periode: "Mai 2025",
      typeFiche: "COORDINATION",
    }
  ];

  for (const fiche of fiches) {
    await prisma.ficheDePaie.create({
      data: {
        ...fiche,
        responsableId,
        coordinateurId,
        formateurId,
        sessionId,
      }
    });
  }

  console.log("✅ 5 fiches de paie créées !");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Erreur seed :", e);
    await prisma.$disconnect();
    process.exit(1);
  });
