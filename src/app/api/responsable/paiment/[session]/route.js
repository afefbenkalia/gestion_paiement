import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import {
  buildSessionPaiementPayload,
  computeCoordinateurAmounts,
  computeFormateurAmounts,
  formatPeriode,
  generateMemoireNumber,
  getSystemParameters,
  SESSION_PAIEMENT_INCLUDE,
} from '@/lib/paiement';

const normalizePositive = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return parsed;
};

async function fetchSession(sessionId) {
  return prisma.session.findUnique({
    where: { id: sessionId },
    include: SESSION_PAIEMENT_INCLUDE,
  });
}

async function upsertFormateurFiche({
  sessionRecord,
  sessionId,
  formateurId,
  totalTutorat,
  totalRegroupement,
  responsableId,
  responsableName,
  periode,
  systemParameters,
}) {
  const amounts = computeFormateurAmounts(
    { totalTutorat, totalRegroupement },
    systemParameters
  );

  const existingFiche = await prisma.ficheDePaie.findFirst({
    where: {
      sessionId,
      typeFiche: 'FORMATION',
      formateurId,
    },
  });

  const data = {
    nomResponsable: responsableName,
    periode,
    sessionId,
    responsableId,
    formateurId,
    coordinateurId: null,
    typeFiche: 'FORMATION',
    totalTutorat,
    totalRegroupement,
    montantTotalBrut: amounts.montantBrut,
    montantTotalNet: amounts.montantNet,
  };

  if (existingFiche) {
    await prisma.ficheDePaie.update({
      where: { id: existingFiche.id },
      data,
    });
  } else {
    await prisma.ficheDePaie.create({
      data: {
        ...data,
        numMemoire: generateMemoireNumber({
          type: 'FORM',
          sessionId,
          targetId: formateurId,
        }),
      },
    });
  }
}

async function upsertCoordinateurFiche({
  sessionRecord,
  sessionId,
  responsableId,
  responsableName,
  periode,
  systemParameters,
}) {
  if (!sessionRecord.coordinateur) {
    throw new Error('Aucun coordinateur assigné à cette session.');
  }

  const { montantBrut, montantNet } = computeCoordinateurAmounts(systemParameters);

  const existingFiche = await prisma.ficheDePaie.findFirst({
    where: {
      sessionId,
      typeFiche: 'COORDINATION',
    },
  });

  const data = {
    nomResponsable: responsableName,
    periode,
    sessionId,
    responsableId,
    coordinateurId: sessionRecord.coordinateur.id,
    formateurId: null,
    typeFiche: 'COORDINATION',
    totalTutorat: null,
    totalRegroupement: null,
    montantTotalBrut: montantBrut,
    montantTotalNet: montantNet,
  };

  if (existingFiche) {
    await prisma.ficheDePaie.update({
      where: { id: existingFiche.id },
      data,
    });
  } else {
    await prisma.ficheDePaie.create({
      data: {
        ...data,
        numMemoire: generateMemoireNumber({
          type: 'COORD',
          sessionId,
          targetId: sessionRecord.coordinateur.id,
        }),
      },
    });
  }
}

async function upsertReglementFiche({
  sessionId,
  sessionRecord,
  responsableId,
  responsableName,
  periode,
}) {
  const formateurFiches = sessionRecord.fichesSession.filter(
    (fiche) => fiche.typeFiche === 'FORMATION'
  );
  const coordinateurFiche = sessionRecord.fichesSession.find(
    (fiche) => fiche.typeFiche === 'COORDINATION'
  );

  if (formateurFiches.length === 0 && !coordinateurFiche) {
    throw new Error(
      'Impossible de générer le mémoire de règlement : aucune fiche formateur ou coordinateur.'
    );
  }

  const totalTutorat = formateurFiches.reduce(
    (sum, fiche) => sum + normalizePositive(fiche.totalTutorat),
    0
  );
  const totalRegroupement = formateurFiches.reduce(
    (sum, fiche) => sum + normalizePositive(fiche.totalRegroupement),
    0
  );
  const montantTotalBrut =
    formateurFiches.reduce((sum, fiche) => sum + Number(fiche.montantTotalBrut || 0), 0) +
    Number(coordinateurFiche?.montantTotalBrut || 0);

  const montantTotalNet =
    formateurFiches.reduce((sum, fiche) => sum + Number(fiche.montantTotalNet || 0), 0) +
    Number(coordinateurFiche?.montantTotalNet || 0);

  const existingFiche = sessionRecord.fichesSession.find(
    (fiche) => fiche.typeFiche === 'REGLEMENT'
  );

  const data = {
    nomResponsable: responsableName,
    periode,
    sessionId,
    responsableId,
    typeFiche: 'REGLEMENT',
    coordinateurId: sessionRecord.coordinateur?.id ?? null,
    formateurId: null,
    totalTutorat,
    totalRegroupement,
    montantTotalBrut,
    montantTotalNet,
  };

  let reglement;
  if (existingFiche) {
    reglement = await prisma.ficheDePaie.update({
      where: { id: existingFiche.id },
      data,
    });
  } else {
    reglement = await prisma.ficheDePaie.create({
      data: {
        ...data,
        numMemoire: generateMemoireNumber({
          type: 'REG',
          sessionId,
        }),
      },
    });
  }

  await prisma.session.update({
    where: { id: sessionId },
    data: { ficheId: reglement.id },
  });
}

// FIX: Add this function to handle params properly
export async function GET(request, { params }) {
  try {
    // FIX: Await the params
    const { session } = await params;
    const sessionAuth = await getServerSession(authOptions);

    if (!sessionAuth || !sessionAuth.user || sessionAuth.user.role !== 'RESPONSABLE') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const sessionId = Number(session);

    if (Number.isNaN(sessionId)) {
      return NextResponse.json({ error: 'ID de session invalide' }, { status: 400 });
    }

    const record = await fetchSession(sessionId);

    if (!record) {
      return NextResponse.json({ error: 'Session non trouvée' }, { status: 404 });
    }

    const systemParameters = getSystemParameters();
    const payload = buildSessionPaiementPayload(record, systemParameters);

    return NextResponse.json(payload);
  } catch (error) {
    console.error('Erreur GET paiement session:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    // FIX: Await the params
    const { session } = await params;
    const sessionAuth = await getServerSession(authOptions);

    if (!sessionAuth || !sessionAuth.user || sessionAuth.user.role !== 'RESPONSABLE') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const sessionId = Number(session);

    if (Number.isNaN(sessionId)) {
      return NextResponse.json({ error: 'ID de session invalide' }, { status: 400 });
    }

    const body = await request.json();
    const type = body?.type;

    if (!type) {
      return NextResponse.json({ error: 'Type de fiche requis' }, { status: 400 });
    }

    const sessionRecord = await fetchSession(sessionId);

    if (!sessionRecord) {
      return NextResponse.json({ error: 'Session non trouvée' }, { status: 404 });
    }

    const systemParameters = getSystemParameters();
    const responsableId = Number(sessionAuth.user.id);
    const responsableName = sessionAuth.user.name || sessionAuth.user.email || 'Responsable';
    const periode = formatPeriode(sessionRecord.dateDebut, sessionRecord.dateFin);

    if (!responsableId) {
      return NextResponse.json({ error: 'Identifiant responsable manquant' }, { status: 400 });
    }

    if (type === 'FORMATION') {
      const formateurId = Number(body?.formateurId);

      if (!formateurId) {
        return NextResponse.json({ error: 'Formateur requis' }, { status: 400 });
      }

      const belongsToSession = sessionRecord.formateurs.some(
        (sf) => sf.formateurId === formateurId || sf.formateur?.id === formateurId
      );

      if (!belongsToSession) {
        return NextResponse.json(
          { error: 'Ce formateur n\'est pas assigné à la session.' },
          { status: 400 }
        );
      }

      const totalTutorat = normalizePositive(body?.totalTutorat);
      const totalRegroupement = normalizePositive(body?.totalRegroupement);

      await upsertFormateurFiche({
        sessionRecord,
        sessionId,
        formateurId,
        totalTutorat,
        totalRegroupement,
        responsableId,
        responsableName,
        periode,
        systemParameters,
      });
    } else if (type === 'COORDINATION') {
      try {
        await upsertCoordinateurFiche({
          sessionRecord,
          sessionId,
          responsableId,
          responsableName,
          periode,
          systemParameters,
        });
      } catch (coordinationError) {
        return NextResponse.json({ error: coordinationError.message }, { status: 400 });
      }
    } else if (type === 'REGLEMENT') {
      try {
        await upsertReglementFiche({
          sessionId,
          sessionRecord,
          responsableId,
          responsableName,
          periode,
        });
      } catch (reglementError) {
        return NextResponse.json({ error: reglementError.message }, { status: 400 });
      }
    } else {
      return NextResponse.json({ error: 'Type de fiche invalide' }, { status: 400 });
    }

    const refreshed = await fetchSession(sessionId);
    const payload = buildSessionPaiementPayload(refreshed, systemParameters);

    return NextResponse.json(payload);
  } catch (error) {
    console.error('Erreur POST paiement session:', error);
    return NextResponse.json({ error: error.message || 'Erreur serveur' }, { status: 500 });
  }
}