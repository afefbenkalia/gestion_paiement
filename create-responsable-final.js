// create-responsable-final.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  try {
    // Générer le hash
    const password = "admin123";
    const hashedPassword = await bcrypt.hash(password, 10);
    
    console.log("🔑 Hash généré:", hashedPassword);
    console.log("📧 Email: responsable@admin.com");
    console.log("🔐 Mot de passe: admin123");
    
    // Supprimer l'ancien responsable
    await prisma.user.deleteMany({
      where: {
        email: "responsable@admin.com"
      }
    });
    
    console.log("🗑️ Ancien responsable supprimé");
    
    // Créer le nouveau responsable
    const responsable = await prisma.user.create({
      data: {
        name: "Admin Responsable",
        email: "responsable@admin.com",
        password: hashedPassword,
        role: "RESPONSABLE"
      }
    });
    
    console.log("✅ Nouveau responsable créé avec succès!");
    console.log("ID:", responsable.id);
    
    // Vérification
    const verify = await bcrypt.compare("admin123", hashedPassword);
    console.log("🔍 Vérification du hash:", verify);
    
  } catch (error) {
    console.error("❌ Erreur:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();