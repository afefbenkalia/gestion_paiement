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
