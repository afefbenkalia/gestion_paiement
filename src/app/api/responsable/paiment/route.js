import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import {
  buildSessionPaiementPayload,
  getSystemParameters,
  SESSION_PAIEMENT_INCLUDE,
} from '@/lib/paiement';
//app/api/responsable/paiment/route.js
async function fetchSessionsWithPaiements() {
  return prisma.session.findMany({
    orderBy: { dateDebut: 'desc' },
    include: SESSION_PAIEMENT_INCLUDE,
  });
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || session.user.role !== 'RESPONSABLE') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const systemParameters = getSystemParameters();
    const sessions = await fetchSessionsWithPaiements();
    const detailedSessions = sessions
      .map((s) => buildSessionPaiementPayload(s, systemParameters))
      .filter(Boolean);

    const summaries = detailedSessions.map((item) => ({
      id: item.session.id,
      titre: item.session.titre,
      periode: item.session.periode,
      dateDebut: item.session.dateDebut,
      dateFin: item.session.dateFin,
      nbFormateurs: item.formateurs.length,
      coordinateur: item.coordinateur,
      summary: item.summary,
      ficheReglementId: item.fiches.reglement?.id ?? null,
      statut: item.fiches.reglement ? 'COMPLET' : 'EN ATTENTE',
    }));

    return NextResponse.json({
      sessions: summaries,
      systemParameters,
    });
  } catch (error) {
    console.error('Erreur GET paiements:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

