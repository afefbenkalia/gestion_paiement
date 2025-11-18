import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
//app/api/responsable/sessions/[id]/route.js


// GET - Récupérer une session spécifique par ID
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || session.user.role !== 'RESPONSABLE') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const { id } = params;
    const sessionId = parseInt(id);

    if (Number.isNaN(sessionId)) {
      return NextResponse.json({ error: 'ID de session invalide' }, { status: 400 });
    }

    const sessionData = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        formateurs: {
          include: {
            formateur: {
              select: { 
                id: true, 
                name: true, 
                email: true,
                tel: true 
              },
            },
          },
        },
        coordinateur: {
          select: { 
            id: true, 
            name: true, 
            email: true,
            tel: true 
          },
        },
        fiche: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!sessionData) {
      return NextResponse.json({ error: 'Session non trouvée' }, { status: 404 });
    }

    const formattedSession = {
      id: sessionData.id,
      titre: sessionData.titre,
      dateDebut: sessionData.dateDebut,
      dateFin: sessionData.dateFin,
      classe: sessionData.classe,
      specialite: sessionData.specialite,
      promotion: sessionData.promotion,
      niveau: sessionData.niveau,
      semestre: sessionData.semestre,
      dureeJours: Math.ceil(
        (new Date(sessionData.dateFin) - new Date(sessionData.dateDebut)) / (1000 * 60 * 60 * 24)
      ),
      formateurs: sessionData.formateurs.map((f) => ({
        id: f.formateur.id,
        name: f.formateur.name,
        email: f.formateur.email,
        tel: f.formateur.tel,
      })),
      coordinateur: sessionData.coordinateur
        ? { 
            id: sessionData.coordinateur.id, 
            name: sessionData.coordinateur.name,
            email: sessionData.coordinateur.email,
            tel: sessionData.coordinateur.tel,
          }
        : null,
      fiche: sessionData.fiche ? {
        id: sessionData.fiche.id,
      } : null,
      createdAt: sessionData.createdAt,
      updatedAt: sessionData.updatedAt,
    };

    return NextResponse.json(formattedSession);
  } catch (error) {
    console.error('Erreur GET session by ID:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}



// PUT - Mettre à jour une session
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || session.user.role !== 'RESPONSABLE') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const { id } = params;
    const sessionId = parseInt(id);

    if (Number.isNaN(sessionId)) {
      return NextResponse.json({ error: 'ID de session invalide' }, { status: 400 });
    }

    const body = await request.json();
    const {
      titre,
      dateDebut,
      dateFin,
      classe,
      specialite,
      promotion,
      niveau,
      semestre,
      formateurIds = [],
      coordinateurId = null,
    } = body ?? {};

    // Vérifier que la session existe
    const existingSession = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!existingSession) {
      return NextResponse.json({ error: 'Session non trouvée' }, { status: 404 });
    }

    // Validation des champs obligatoires
    if (!titre || !dateDebut || !dateFin) {
      return NextResponse.json(
        { error: 'Titre, date de début et date de fin sont requis.' },
        { status: 400 }
      );
    }

    const parsedStart = new Date(dateDebut);
    const parsedEnd = new Date(dateFin);
    
    if (Number.isNaN(parsedStart.getTime()) || Number.isNaN(parsedEnd.getTime())) {
      return NextResponse.json(
        { error: 'Les dates fournies sont invalides.' },
        { status: 400 }
      );
    }

    if (parsedEnd < parsedStart) {
      return NextResponse.json(
        { error: 'La date de fin doit être postérieure à la date de début.' },
        { status: 400 }
      );
    }

    // Validation de la longueur des champs selon le schéma Prisma
    if (titre.length > 255) {
      return NextResponse.json(
        { error: 'Le titre ne doit pas dépasser 255 caractères.' },
        { status: 400 }
      );
    }

    if (classe && classe.length > 50) {
      return NextResponse.json(
        { error: 'La classe ne doit pas dépasser 50 caractères.' },
        { status: 400 }
      );
    }

    if (specialite && specialite.length > 150) {
      return NextResponse.json(
        { error: 'La spécialité ne doit pas dépasser 150 caractères.' },
        { status: 400 }
      );
    }

    if (promotion && promotion.length > 50) {
      return NextResponse.json(
        { error: 'La promotion ne doit pas dépasser 50 caractères.' },
        { status: 400 }
      );
    }

    if (niveau && niveau.length > 50) {
      return NextResponse.json(
        { error: 'Le niveau ne doit pas dépasser 50 caractères.' },
        { status: 400 }
      );
    }

    if (semestre && semestre.length > 50) {
      return NextResponse.json(
        { error: 'Le semestre ne doit pas dépasser 50 caractères.' },
        { status: 400 }
      );
    }

    const parsedCoordinateurId = coordinateurId && coordinateurId !== '' 
      ? Number(coordinateurId) 
      : null;

    const parsedFormateurIds = Array.isArray(formateurIds)
      ? formateurIds
          .map((id) => Number(id))
          .filter((id) => !Number.isNaN(id))
      : [];

    // Vérifier l'existence des utilisateurs référencés
    if (parsedCoordinateurId) {
      const coordinateurExists = await prisma.user.findUnique({
        where: { id: parsedCoordinateurId },
      });
      
      if (!coordinateurExists || coordinateurExists.role !== 'COORDINATEUR') {
        return NextResponse.json(
          { error: 'Le coordinateur sélectionné n\'existe pas ou n\'a pas le bon rôle.' },
          { status: 400 }
        );
      }
    }

    if (parsedFormateurIds.length > 0) {
      const formateursExist = await prisma.user.findMany({
        where: { 
          id: { in: parsedFormateurIds },
          role: 'FORMATEUR'
        },
      });
      
      if (formateursExist.length !== parsedFormateurIds.length) {
        return NextResponse.json(
          { error: 'Un ou plusieurs formateurs sélectionnés n\'existent pas ou n\'ont pas le bon rôle.' },
          { status: 400 }
        );
      }
    }

    // Mise à jour de la session avec transaction pour gérer les relations
    const updatedSession = await prisma.$transaction(async (tx) => {
      // Supprimer les relations formateurs existantes
      await tx.sessionFormateur.deleteMany({
        where: { sessionId: sessionId },
      });

      // Mettre à jour la session
      return await tx.session.update({
        where: { id: sessionId },
        data: {
          titre: titre.trim(),
          dateDebut: parsedStart,
          dateFin: parsedEnd,
          classe: classe || null,
          specialite: specialite || null,
          promotion: promotion || null,
          niveau: niveau || null,
          semestre: semestre || null,
          coordinateurId: parsedCoordinateurId,
          formateurs:
            parsedFormateurIds.length > 0
              ? {
                  create: parsedFormateurIds.map((id) => ({
                    formateurId: id,
                  })),
                }
              : undefined,
        },
        include: {
          formateurs: {
            include: {
              formateur: {
                select: { 
                  id: true, 
                  name: true, 
                  email: true,
                  tel: true 
                },
              },
            },
          },
          coordinateur: {
            select: { 
              id: true, 
              name: true, 
              email: true,
              tel: true 
            },
          },
        },
      });
    });

    const formattedSession = {
      id: updatedSession.id,
      titre: updatedSession.titre,
      dateDebut: updatedSession.dateDebut,
      dateFin: updatedSession.dateFin,
      classe: updatedSession.classe,
      specialite: updatedSession.specialite,
      promotion: updatedSession.promotion,
      niveau: updatedSession.niveau,
      semestre: updatedSession.semestre,
      formateurs: updatedSession.formateurs.map((f) => ({
        id: f.formateur.id,
        name: f.formateur.name,
        email: f.formateur.email,
        tel: f.formateur.tel,
      })),
      coordinateur: updatedSession.coordinateur
        ? {
            id: updatedSession.coordinateur.id,
            name: updatedSession.coordinateur.name,
            email: updatedSession.coordinateur.email,
            tel: updatedSession.coordinateur.tel,
          }
        : null,
      updatedAt: updatedSession.updatedAt,
    };

    return NextResponse.json(formattedSession);
  } catch (error) {
    console.error('Erreur PUT session:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Une session avec ces caractéristiques existe déjà.' },
        { status: 400 }
      );
    }
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Session non trouvée.' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE - Supprimer une session
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || session.user.role !== 'RESPONSABLE') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const { id } = params;
    const sessionId = parseInt(id);

    if (Number.isNaN(sessionId)) {
      return NextResponse.json({ error: 'ID de session invalide' }, { status: 400 });
    }

    // Vérifier que la session existe
    const existingSession = await prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!existingSession) {
      return NextResponse.json({ error: 'Session non trouvée' }, { status: 404 });
    }

    // Vérifier si la session est liée à une fiche de paie
    if (existingSession.ficheId) {
      return NextResponse.json(
        { error: 'Impossible de supprimer une session liée à une fiche de paie.' },
        { status: 400 }
      );
    }

    // Supprimer la session (les relations seront supprimées en cascade)
    await prisma.session.delete({
      where: { id: sessionId },
    });

    return NextResponse.json({ 
      message: 'Session supprimée avec succès',
      deletedId: sessionId 
    });
  } catch (error) {
    console.error('Erreur DELETE session:', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Session non trouvée.' },
        { status: 404 }
      );
    }

    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: 'Impossible de supprimer la session car elle est référencée ailleurs.' },
        { status: 400 }
      );
    }
    
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}