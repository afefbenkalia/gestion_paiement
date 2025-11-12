/*
  Warnings:

  - You are about to drop the column `heures` on the `fichedepaie` table. All the data in the column will be lost.
  - You are about to drop the column `mois` on the `fichedepaie` table. All the data in the column will be lost.
  - You are about to drop the column `montant` on the `fichedepaie` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `fichedepaie` table. All the data in the column will be lost.
  - You are about to drop the column `isAccepted` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `specialite` on the `user` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[numMemoire]` on the table `FicheDePaie` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `classe` to the `FicheDePaie` table without a default value. This is not possible if the table is not empty.
  - Added the required column `coordinateurId` to the `FicheDePaie` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fonction` to the `FicheDePaie` table without a default value. This is not possible if the table is not empty.
  - Added the required column `niveau` to the `FicheDePaie` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nomResponsable` to the `FicheDePaie` table without a default value. This is not possible if the table is not empty.
  - Added the required column `numMemoire` to the `FicheDePaie` table without a default value. This is not possible if the table is not empty.
  - Added the required column `periode` to the `FicheDePaie` table without a default value. This is not possible if the table is not empty.
  - Added the required column `promotion` to the `FicheDePaie` table without a default value. This is not possible if the table is not empty.
  - Added the required column `responsableId` to the `FicheDePaie` table without a default value. This is not possible if the table is not empty.
  - Added the required column `semestre` to the `FicheDePaie` table without a default value. This is not possible if the table is not empty.
  - Added the required column `specialite` to the `FicheDePaie` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `FicheDePaie` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `fichedepaie` DROP FOREIGN KEY `FicheDePaie_userId_fkey`;

-- DropIndex
DROP INDEX `FicheDePaie_userId_fkey` ON `fichedepaie`;

-- AlterTable
ALTER TABLE `fichedepaie` DROP COLUMN `heures`,
    DROP COLUMN `mois`,
    DROP COLUMN `montant`,
    DROP COLUMN `userId`,
    ADD COLUMN `classe` VARCHAR(50) NOT NULL,
    ADD COLUMN `coordinateurId` INTEGER NOT NULL,
    ADD COLUMN `fonction` VARCHAR(150) NOT NULL,
    ADD COLUMN `niveau` VARCHAR(100) NOT NULL,
    ADD COLUMN `nomResponsable` VARCHAR(200) NOT NULL,
    ADD COLUMN `numMemoire` VARCHAR(100) NOT NULL,
    ADD COLUMN `periode` VARCHAR(150) NOT NULL,
    ADD COLUMN `promotion` VARCHAR(100) NOT NULL,
    ADD COLUMN `responsableId` INTEGER NOT NULL,
    ADD COLUMN `semestre` VARCHAR(50) NOT NULL,
    ADD COLUMN `specialite` VARCHAR(150) NOT NULL,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL;

-- AlterTable
ALTER TABLE `user` DROP COLUMN `isAccepted`,
    DROP COLUMN `specialite`,
    ADD COLUMN `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'INACTIVE',
    MODIFY `cv` TEXT NULL;

-- CreateTable
CREATE TABLE `Session` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `titre` VARCHAR(255) NOT NULL,
    `dateDebut` DATETIME(3) NOT NULL,
    `dateFin` DATETIME(3) NOT NULL,
    `nbHeures` DOUBLE NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `coordinateurId` INTEGER NULL,
    `ficheId` INTEGER NULL,

    INDEX `Session_coordinateurId_idx`(`coordinateurId`),
    INDEX `Session_ficheId_idx`(`ficheId`),
    INDEX `Session_dateDebut_idx`(`dateDebut`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SessionFormateur` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sessionId` INTEGER NOT NULL,
    `formateurId` INTEGER NOT NULL,

    INDEX `SessionFormateur_formateurId_idx`(`formateurId`),
    UNIQUE INDEX `SessionFormateur_sessionId_formateurId_key`(`sessionId`, `formateurId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `FicheDePaie_numMemoire_key` ON `FicheDePaie`(`numMemoire`);

-- CreateIndex
CREATE INDEX `FicheDePaie_responsableId_idx` ON `FicheDePaie`(`responsableId`);

-- CreateIndex
CREATE INDEX `FicheDePaie_coordinateurId_idx` ON `FicheDePaie`(`coordinateurId`);

-- CreateIndex
CREATE INDEX `FicheDePaie_numMemoire_idx` ON `FicheDePaie`(`numMemoire`);

-- CreateIndex
CREATE INDEX `FicheDePaie_specialite_idx` ON `FicheDePaie`(`specialite`);

-- CreateIndex
CREATE INDEX `User_email_idx` ON `User`(`email`);

-- CreateIndex
CREATE INDEX `User_role_idx` ON `User`(`role`);

-- AddForeignKey
ALTER TABLE `FicheDePaie` ADD CONSTRAINT `FicheDePaie_responsableId_fkey` FOREIGN KEY (`responsableId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FicheDePaie` ADD CONSTRAINT `FicheDePaie_coordinateurId_fkey` FOREIGN KEY (`coordinateurId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Session` ADD CONSTRAINT `Session_coordinateurId_fkey` FOREIGN KEY (`coordinateurId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Session` ADD CONSTRAINT `Session_ficheId_fkey` FOREIGN KEY (`ficheId`) REFERENCES `FicheDePaie`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SessionFormateur` ADD CONSTRAINT `SessionFormateur_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `Session`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SessionFormateur` ADD CONSTRAINT `SessionFormateur_formateurId_fkey` FOREIGN KEY (`formateurId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
