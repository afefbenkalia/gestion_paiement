import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';

// GET /api/responsable/sessions/[id]
export async function GET(request, { params }) {
  try {
    const id = parseInt(params.id);

    const sessionData = await prisma.session.findUnique({
      where: { id },
      include: {
        coordinateur: true,
        fiche: true,
        formateurs: {
          include: {
            formateur: true, //  on inclut les données du formateur ici
          },
        },
      },
    });

    if (!sessionData) {
      return NextResponse.json({ error: 'Session non trouvée' }, { status: 404 });
    }

    const formattedSession = {
      ...sessionData,
      formateurs: sessionData.formateurs.map((sf) => sf.formateur),
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
    const id = parseInt(params.id);
    const body = await request.json();

    let updatedSession;

    //  Si on assigne un coordinateur
    if (body.coordinateurId !== undefined) {
      updatedSession = await prisma.session.update({
        where: { id },
        data: {
          coordinateurId: body.coordinateurId || null,
        },
      });
    }

    //  Si on assigne des formateurs (multiple)
    if (body.formateurIds && Array.isArray(body.formateurIds)) {
      // On supprime d’abord les anciens liens
      await prisma.sessionFormateur.deleteMany({
        where: { sessionId: id },
      });

      // Puis on insère les nouveaux
      const formateurLinks = body.formateurIds.map((fid) => ({
        sessionId: id,
        formateurId: fid,
      }));

      await prisma.sessionFormateur.createMany({
        data: formateurLinks,
      });

      updatedSession = await prisma.session.findUnique({
        where: { id },
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

    const formatted = {
      ...updatedSession,
      formateurs: updatedSession.formateurs.map((sf) => sf.formateur),
    };

    return NextResponse.json(formatted, { status: 200 });
  } catch (error) {
    console.error('Erreur PUT session:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
