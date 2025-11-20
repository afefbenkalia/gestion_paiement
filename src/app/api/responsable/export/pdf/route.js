// app/api/responsable/export/pdf/route.js
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { buildSessionPaiementPayload, SESSION_PAIEMENT_INCLUDE } from '@/lib/paiement';
import { generateFormationPDF, generateCoordinationPDF, generateReglementPDF } from '@/lib/pdf-generator';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || session.user.role !== 'RESPONSABLE') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const body = await request.json();
    const { sessionId, type, formateurId } = body ?? {};
    const parsedSessionId = Number(sessionId);

    if (!parsedSessionId) {
      return NextResponse.json({ error: 'Session invalide' }, { status: 400 });
    }

    if (!type || !['FORMATION', 'COORDINATION', 'REGLEMENT'].includes(type)) {
      return NextResponse.json({ error: 'Type de fiche invalide' }, { status: 400 });
    }

    const sessionRecord = await prisma.session.findUnique({
      where: { id: parsedSessionId },
      include: SESSION_PAIEMENT_INCLUDE,
    });

    if (!sessionRecord) {
      return NextResponse.json({ error: 'Session non trouvée' }, { status: 404 });
    }

    const payload = buildSessionPaiementPayload(sessionRecord);

    if (!payload) {
      return NextResponse.json({ error: 'Aucune donnée disponible' }, { status: 404 });
    }

    let pdfBuffer;
    let filename;

    if (type === 'FORMATION') {
      const parsedFormateurId = Number(formateurId);
      if (!parsedFormateurId) {
        return NextResponse.json({ error: 'Formateur requis' }, { status: 400 });
      }

      const formateur = payload.formateurs.find((f) => f.id === parsedFormateurId);
      if (!formateur || !formateur.fiche) {
        return NextResponse.json({ error: 'Fiche formateur introuvable' }, { status: 400 });
      }

      pdfBuffer = await generateFormationPDF(payload.session, formateur.fiche, formateur);
      filename = `memoire-formation-${payload.session.id}-${formateur.id}.pdf`;
    }

    if (type === 'COORDINATION') {
      if (!payload.coordinateur || !payload.fiches.coordinateur) {
        return NextResponse.json({ error: 'Fiche coordinateur introuvable' }, { status: 400 });
      }

      pdfBuffer = await generateCoordinationPDF(payload.session, payload.fiches.coordinateur, payload.coordinateur);
      filename = `memoire-coordination-${payload.session.id}.pdf`;
    }

    if (type === 'REGLEMENT') {
      if (!payload.fiches.reglement) {
        return NextResponse.json({ error: 'Mémoire de règlement indisponible' }, { status: 400 });
      }

      pdfBuffer = await generateReglementPDF(
        payload.session, 
        payload.fiches.reglement, 
        payload.formateurs, 
        payload.fiches.coordinateur, 
        payload.coordinateur
      );
      filename = `memoire-reglement-${payload.session.id}.pdf`;
    }

    if (!pdfBuffer) {
      return NextResponse.json({ error: 'Impossible de générer le PDF' }, { status: 500 });
    }

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Erreur export PDF:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}