import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || session.user.role !== 'RESPONSABLE') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const filtreFormateur = searchParams.get('formateurName') || '';
    const filtreCoordinateur = searchParams.get('coordinateurName') || '';

    const where = {};

    if (filtreFormateur) {
      where.formateurs = {
        some: {
          formateur: {
            name: {
              contains: filtreFormateur,
            },
          },
        },
      };
    }

    if (filtreCoordinateur) {
      where.coordinateur = {
        is: {
          name: {
            contains: filtreCoordinateur,
          },
        },
      };
    }

    const sessions = await prisma.session.findMany({
      where,
      include: {
        formateurs: {
          select: {
            formateur: {
              select: { id: true, name: true },
            },
          },
        },
        coordinateur: {
          select: { id: true, name: true },
        },
      },
      orderBy: { dateDebut: 'desc' },
    });

    const result = sessions.map((s) => ({
      id: s.id,
      titre: s.titre,
      dateDebut: s.dateDebut,
      dateFin: s.dateFin,
      nbHeures: s.nbHeures,
      dureeJours: Math.ceil(
        (new Date(s.dateFin) - new Date(s.dateDebut)) / (1000 * 60 * 60 * 24)
      ),
      montant: s.nbHeures * 50,
      formateurs: s.formateurs.length > 0
        ? s.formateurs.map((f) => ({ id: f.formateur.id, name: f.formateur.name }))
        : [],
      coordinateur: s.coordinateur
        ? { id: s.coordinateur.id, name: s.coordinateur.name }
        : null,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error('Erreur GET sessions:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

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
      nbHeures,
      formateurIds = [],
      coordinateurId = null,
    } = body ?? {};

    if (!titre || !dateDebut || !dateFin || nbHeures === undefined || nbHeures === null) {
      return NextResponse.json(
        { error: 'Titre, dates et nombre d’heures sont requis.' },
        { status: 400 }
      );
    }

    const parsedStart = new Date(dateDebut);
    const parsedEnd = new Date(dateFin);
    const parsedHours = Number(nbHeures);
    const parsedCoordinateurId =
      coordinateurId !== null && coordinateurId !== ''
        ? Number(coordinateurId)
        : null;
    const parsedFormateurIds = Array.isArray(formateurIds)
      ? formateurIds
          .map((id) => Number(id))
          .filter((id) => !Number.isNaN(id))
      : [];

    if (Number.isNaN(parsedHours) || parsedHours <= 0) {
      return NextResponse.json(
        { error: 'Le nombre d’heures doit être un nombre positif.' },
        { status: 400 }
      );
    }

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

    const createdSession = await prisma.session.create({
      data: {
        titre: titre.trim(),
        dateDebut: parsedStart,
        dateFin: parsedEnd,
        nbHeures: parsedHours,
        coordinateurId: parsedCoordinateurId,
        formateurs:
          parsedFormateurIds.length > 0
            ? {
                create: parsedFormateurIds.map((id) => ({
                  formateur: {
                    connect: { id },
                  },
                })),
              }
            : undefined,
      },
      include: {
        formateurs: {
          select: {
            formateur: {
              select: { id: true, name: true },
            },
          },
        },
        coordinateur: {
          select: { id: true, name: true },
        },
      },
    });

    const formattedSession = {
      id: createdSession.id,
      titre: createdSession.titre,
      dateDebut: createdSession.dateDebut,
      dateFin: createdSession.dateFin,
      nbHeures: createdSession.nbHeures,
      dureeJours: Math.ceil(
        (new Date(createdSession.dateFin) - new Date(createdSession.dateDebut)) /
          (1000 * 60 * 60 * 24)
      ),
      montant: createdSession.nbHeures * 50,
      formateurs: createdSession.formateurs.length
        ? createdSession.formateurs.map((f) => ({
            id: f.formateur.id,
            name: f.formateur.name,
          }))
        : [],
      coordinateur: createdSession.coordinateur
        ? {
            id: createdSession.coordinateur.id,
            name: createdSession.coordinateur.name,
          }
        : null,
    };

    return NextResponse.json(formattedSession, { status: 201 });
  } catch (error) {
    console.error('Erreur POST session:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}