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
    const coordinateurId = searchParams.get('coordinateurId');
    const formateurId = searchParams.get('formateurId');

    const where = {};

    if (coordinateurId) {
      where.coordinateurId = parseInt(coordinateurId);
    }

    if (formateurId) {
      where.formateurs = {
        some: {
          formateurId: parseInt(formateurId),
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
      formateurs:
        s.formateurs.length > 0
          ? s.formateurs.map((f) => f.formateur.name).join(', ')
          : 'Non attribué',
      coordinateur: s.coordinateur ? s.coordinateur.name : 'Non attribué',
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

    if (!session || session.user.role !== 'RESPONSABLE') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const data = await request.json();
    const { titre, dateDebut, dateFin, nbHeures, formateurIds, coordinateurId } = data;

    if (!titre || !dateDebut || !dateFin || !nbHeures) {
      return NextResponse.json(
        { error: 'Champs obligatoires manquants' },
        { status: 400 }
      );
    }

    if (new Date(dateFin) < new Date(dateDebut)) {
      return NextResponse.json(
        { error: 'La date de fin doit être après la date de début' },
        { status: 400 }
      );
    }

    const newSession = await prisma.session.create({
      data: {
        titre,
        dateDebut: new Date(dateDebut),
        dateFin: new Date(dateFin),
        nbHeures: parseFloat(nbHeures),
        coordinateurId: coordinateurId ? parseInt(coordinateurId) : null,
        formateurs: {
          create: Array.isArray(formateurIds)
            ? formateurIds.map((id) => ({
                formateur: { connect: { id: parseInt(id) } },
              }))
            : [],
        },
      },
      include: {
        formateurs: { select: { formateur: { select: { name: true } } } },
        coordinateur: { select: { name: true } },
      },
    });

    return NextResponse.json(
      {
        ...newSession,
        formateurs:
          newSession.formateurs.length > 0
            ? newSession.formateurs.map((f) => f.formateur.name).join(', ')
            : 'Non attribué',
        coordinateur: newSession.coordinateur
          ? newSession.coordinateur.name
          : 'Non attribué',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erreur POST session:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'RESPONSABLE') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const url = new URL(request.url);
    const sessionId = url.pathname.split('/').pop();

    if (!sessionId) {
      return NextResponse.json({ error: 'ID de session manquant' }, { status: 400 });
    }

    await prisma.session.delete({
      where: { id: parseInt(sessionId) },
    });

    return NextResponse.json({ message: 'Session supprimée' });
  } catch (error) {
    console.error('Erreur DELETE session:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
