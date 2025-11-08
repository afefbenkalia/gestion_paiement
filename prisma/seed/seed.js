// prisma/seed.js
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🧩 Seeding database...');

  // --- Création des utilisateurs ---
  const passwordHash = await bcrypt.hash('123456', 10);

  const responsable = await prisma.user.create({
    data: {
      name: 'Houda Responsable',
      email: 'responsable@example.com',
      password: passwordHash,
      role: 'RESPONSABLE',
    },
  });

  const coordinateur = await prisma.user.create({
    data: {
      name: 'Ali Coordinateur',
      email: 'coordinateur@example.com',
      password: passwordHash,
      role: 'COORDINATEUR',
    },
  });

  const formateur = await prisma.user.create({
    data: {
      name: 'Sami Formateur',
      email: 'formateur@example.com',
      password: passwordHash,
      role: 'FORMATEUR',
      cv: 'Expérience de 5 ans dans la formation technique.',
    },
  });

  console.log('✅ Utilisateurs créés');

  // --- Création d’une fiche de paie ---
  const fiche = await prisma.ficheDePaie.create({
    data: {
      numMemoire: 'FP-001',
      nomResponsable: responsable.name,
      fonction: 'Responsable Pédagogique',
      classe: 'DSI3.1',
      specialite: 'Développement Web',
      niveau: 'Licence',
      promotion: '2025',
      semestre: 'S1',
      periode: 'Septembre - Décembre 2025',
      responsableId: responsable.id,
      coordinateurId: coordinateur.id,
    },
  });

  console.log('✅ Fiche de paie créée');

  // --- Création des sessions ---
  await prisma.session.createMany({
    data: [
      {
        titre: 'Programmation Java',
        dateDebut: new Date('2025-09-10'),
        dateFin: new Date('2025-09-20'),
        nbHeures: 20,
        formateurId: formateur.id,
        coordinateurId: coordinateur.id,
        ficheId: fiche.id,
      },
      {
        titre: 'Développement Web avec React',
        dateDebut: new Date('2025-10-01'),
        dateFin: new Date('2025-10-10'),
        nbHeures: 25,
        formateurId: formateur.id,
        coordinateurId: coordinateur.id,
        ficheId: fiche.id,
      },
    ],
  });

  console.log('✅ Sessions créées');
  console.log('🌱 Base de données initialisée avec succès !');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
