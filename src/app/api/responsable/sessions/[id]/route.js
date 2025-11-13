import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const sessionInclude = {
  coordinateur: true,
  fiche: true,
  formateurs: {
    include: {
      formateur: true,
    },
  },
};

// GET /api/responsable/sessions/[id]
export async function GET(request, { params }) {
  try {
    const { id } = params;
    const sessionId = Number(id);

    const sessionData = await prisma.session.findUnique({
      where: { id: sessionId },
      include: sessionInclude,
    });

    if (!sessionData) {
      return NextResponse.json({ error: 'Session non trouvée' }, { status: 404 });
    }

    const formattedSession = {
      ...sessionData,
      formateurs: sessionData.formateurs?.map((sf) => sf.formateur) || [],
    };

    return NextResponse.json(formattedSession, { status: 200 });
  } catch (error) {
    console.error('Erreur GET session:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PUT /api/responsable/sessions/[id]
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || session.user.role !== 'RESPONSABLE') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const { id } = params;
    const sessionId = Number(id);

    if (Number.isNaN(sessionId)) {
      return NextResponse.json({ error: 'Identifiant invalide' }, { status: 400 });
    }

    const body = await request.json();

    const dataToUpdate = {};
    let shouldUpdateSession = false;

    if (body.titre !== undefined) {
      dataToUpdate.titre = String(body.titre).trim();
      shouldUpdateSession = true;
    }

    if (body.dateDebut !== undefined) {
      const parsed = new Date(body.dateDebut);
      if (Number.isNaN(parsed.getTime())) {
        return NextResponse.json({ error: 'Date de début invalide.' }, { status: 400 });
      }
      dataToUpdate.dateDebut = parsed;
      shouldUpdateSession = true;
    }

    if (body.dateFin !== undefined) {
      const parsed = new Date(body.dateFin);
      if (Number.isNaN(parsed.getTime())) {
        return NextResponse.json({ error: 'Date de fin invalide.' }, { status: 400 });
      }
      dataToUpdate.dateFin = parsed;
      shouldUpdateSession = true;
    }

    if (body.nbHeures !== undefined) {
      const parsed = Number(body.nbHeures);
      if (Number.isNaN(parsed) || parsed <= 0) {
        return NextResponse.json({ error: 'Nombre d’heures invalide.' }, { status: 400 });
      }
      dataToUpdate.nbHeures = parsed;
      shouldUpdateSession = true;
    }

    if (body.coordinateurId !== undefined) {
      const parsed =
        body.coordinateurId === null || body.coordinateurId === ''
          ? null
          : Number(body.coordinateurId);
      if (parsed !== null && Number.isNaN(parsed)) {
        return NextResponse.json({ error: 'Identifiant coordinateur invalide.' }, { status: 400 });
      }
      dataToUpdate.coordinateurId = parsed;
      shouldUpdateSession = true;
    }

    const formateurIds =
      body.formateurIds !== undefined
        ? Array.isArray(body.formateurIds)
          ? body.formateurIds.map((id) => Number(id)).filter((id) => !Number.isNaN(id))
          : null
        : undefined;

    if (formateurIds === null) {
      return NextResponse.json(
        { error: 'Le format des formateurs est invalide.' },
        { status: 400 }
      );
    }

    if (!shouldUpdateSession && formateurIds === undefined) {
      return NextResponse.json(
        { error: 'Aucun champ valide fourni pour la mise à jour.' },
        { status: 400 }
      );
    }

    const updatedSession = await prisma.$transaction(async (tx) => {
      if (shouldUpdateSession) {
        await tx.session.update({
          where: { id: sessionId },
          data: dataToUpdate,
        });
      }

      if (formateurIds !== undefined) {
        await tx.sessionFormateur.deleteMany({
          where: { sessionId },
        });

        if (formateurIds.length > 0) {
          await tx.sessionFormateur.createMany({
            data: formateurIds.map((formateurId) => ({
              sessionId,
              formateurId,
            })),
          });
        }
      }

      return tx.session.findUnique({
        where: { id: sessionId },
        include: sessionInclude,
      });
    });

    if (!updatedSession) {
      return NextResponse.json({ error: 'Session non trouvée' }, { status: 404 });
    }

    const formatted = {
      ...updatedSession,
      formateurs: updatedSession.formateurs?.map((sf) => sf.formateur) || [],
    };

    return NextResponse.json(formatted, { status: 200 });
  } catch (error) {
    console.error('Erreur PUT session:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || session.user.role !== 'RESPONSABLE') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const { id } = params;
    const sessionId = Number(id);

    if (Number.isNaN(sessionId)) {
      return NextResponse.json({ error: 'Identifiant invalide' }, { status: 400 });
    }

    await prisma.session.delete({
      where: { id: sessionId },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Erreur DELETE session:', error);
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Session non trouvée' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}