import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';


// app/api/responsable/sessions/route.js

// GET - Récupérer toutes les sessions (sans filtres, car le filtrage se fait côté client)
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || session.user.role !== 'RESPONSABLE') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const sessions = await prisma.session.findMany({
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
      orderBy: { dateDebut: 'desc' },
    });

    const result = sessions.map((s) => ({
      id: s.id,
      titre: s.titre,
      dateDebut: s.dateDebut,
      dateFin: s.dateFin,
      classe: s.classe,
      specialite: s.specialite,
      promotion: s.promotion,
      niveau: s.niveau,
      semestre: s.semestre,
      dureeJours: Math.ceil(
        (new Date(s.dateFin) - new Date(s.dateDebut)) / (1000 * 60 * 60 * 24)
      ),
      formateurs: s.formateurs.map((f) => ({
        id: f.formateur.id,
        name: f.formateur.name,
        email: f.formateur.email,
        tel: f.formateur.tel,
      })),
      coordinateur: s.coordinateur
        ? { 
            id: s.coordinateur.id, 
            name: s.coordinateur.name,
            email: s.coordinateur.email,
            tel: s.coordinateur.tel,
          }
        : null,
      fiche: s.fiche ? {
        id: s.fiche.id,
      } : null,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Erreur GET sessions:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}




// POST - Créer une nouvelle session
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || session.user.role !== 'RESPONSABLE') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
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

    // Validation des champs requis
    if (!titre || !dateDebut || !dateFin) {
      return NextResponse.json(
        { error: 'Titre, date de début et date de fin sont requis.' },
        { status: 400 }
      );
    }

    // Validation des dates
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

    // Création de la session
    const createdSession = await prisma.session.create({
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

    const formattedSession = {
      id: createdSession.id,
      titre: createdSession.titre,
      dateDebut: createdSession.dateDebut,
      dateFin: createdSession.dateFin,
      classe: createdSession.classe,
      specialite: createdSession.specialite,
      promotion: createdSession.promotion,
      niveau: createdSession.niveau,
      semestre: createdSession.semestre,
      formateurs: createdSession.formateurs.map((f) => ({
        id: f.formateur.id,
        name: f.formateur.name,
        email: f.formateur.email,
        tel: f.formateur.tel,
      })),
      coordinateur: createdSession.coordinateur
        ? {
            id: createdSession.coordinateur.id,
            name: createdSession.coordinateur.name,
            email: createdSession.coordinateur.email,
            tel: createdSession.coordinateur.tel,
          }
        : null,
      createdAt: createdSession.createdAt,
      updatedAt: createdSession.updatedAt,
    };

    return NextResponse.json(formattedSession, { status: 201 });
  } catch (error) {
    console.error('Erreur POST session:', error);
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Une session avec ces caractéristiques existe déjà.' },
        { status: 400 }
      );
    }
    
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}