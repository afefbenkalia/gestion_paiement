import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

// GET /api/responsable/sessions/[id]
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const sessionId = parseInt(id);

    const sessionData = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        coordinateur: true,
        fiche: true,
        formateurs: {
          include: {
            formateur: true,
          },
        },
      },
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
    // Ajoutez await ici aussi
    const { id } = await params;
    const sessionId = parseInt(id);
    const body = await request.json();

    let updatedSession;

    // Si on assigne un coordinateur
    if (body.coordinateurId !== undefined) {
      updatedSession = await prisma.session.update({
        where: { id: sessionId },
        data: {
          coordinateurId: body.coordinateurId || null,
        },
        include: {
          coordinateur: true,
          fiche: true,
          formateurs: {
            include: { formateur: true },
          },
        },
      });
    }

    // Si on assigne des formateurs
    if (body.formateurIds && Array.isArray(body.formateurIds)) {
      // On supprime d'abord les anciens liens
      await prisma.sessionFormateur.deleteMany({
        where: { sessionId: sessionId },
      });

      // Puis on insère les nouveaux
      if (body.formateurIds.length > 0) {
        const formateurLinks = body.formateurIds.map((fid) => ({
          sessionId: sessionId,
          formateurId: fid,
        }));

        await prisma.sessionFormateur.createMany({
          data: formateurLinks,
        });
      }

      // Récupérer la session mise à jour
      updatedSession = await prisma.session.findUnique({
        where: { id: sessionId },
        include: {
          coordinateur: true,
          fiche: true,
          formateurs: {
            include: { formateur: true },
          },
        },
      });
    }

    if (!updatedSession) {
      return NextResponse.json({ error: 'Aucune mise à jour effectuée' }, { status: 400 });
    }

    // Correction du problème .map sur undefined
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