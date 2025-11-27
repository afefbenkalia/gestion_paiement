import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import {
  buildSessionPaiementPayload,
  SESSION_PAIEMENT_INCLUDE,
} from '@/lib/paiement';

const PARAMS_FILE_PATH = path.join(process.cwd(), 'src/data/systemParameters.json');

/**
 * Lit les paramètres système dans le fichier JSON
 */
function readSystemParameters() {
  try {
    const data = fs.readFileSync(PARAMS_FILE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    console.warn('Erreur lecture systemParameters.json, fallback aux defaults', e);
    // fallback aux valeurs par défaut
    return null;
  }
}

/**
 * Écrit les paramètres système dans le fichier JSON
 */
function writeSystemParameters(params) {
  try {
    fs.writeFileSync(PARAMS_FILE_PATH, JSON.stringify(params, null, 2), 'utf-8');
    return true;
  } catch (e) {
    console.error('Erreur écriture systemParameters.json', e);
    return false;
  }
}

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

    const systemParameters = readSystemParameters();
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
      reglementCloture: Boolean(item.fiches.reglement?.cloture),
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

export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== 'RESPONSABLE') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const body = await request.json();

    // Validation simple
    if (
      typeof body.prixHeureFormation !== 'number' ||
      body.prixHeureFormation < 0 ||
      typeof body.prixCoordinationFixe !== 'number' ||
      body.prixCoordinationFixe < 0 ||
      typeof body.tva !== 'number' ||
      body.tva < 0 ||
      body.tva > 100
    ) {
      return NextResponse.json({ error: 'Paramètres invalides' }, { status: 400 });
    }

    // Écriture dans le fichier JSON
    const saved = writeSystemParameters({
      prixHeureFormation: body.prixHeureFormation,
      prixCoordinationFixe: body.prixCoordinationFixe,
      tva: body.tva,
    });

    if (!saved) {
      return NextResponse.json({ error: 'Erreur sauvegarde paramètres' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Paramètres sauvegardés avec succès' });
  } catch (error) {
    console.error('Erreur PUT paiements:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
