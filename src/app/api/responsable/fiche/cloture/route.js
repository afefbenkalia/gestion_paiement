import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

/**
 * API route to archive (cloture) all fiches of a session
 * Sets the cloture field to true for all fiches related to the session
 */
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check authorization - only RESPONSABLE can archive fiches
    if (!session || !session.user || session.user.role !== 'RESPONSABLE') {
      return NextResponse.json(
        { error: 'Non autorisé. Seul un responsable peut clôturer une fiche.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { sessionId } = body;

    // Validate input
    if (!sessionId || typeof sessionId !== 'number') {
      return NextResponse.json(
        { error: 'ID de session invalide.' },
        { status: 400 }
      );
    }

    // Check if session exists
    const sessionData = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        fichesSession: true,
      },
    });

    if (!sessionData) {
      return NextResponse.json(
        { error: 'Session introuvable.' },
        { status: 404 }
      );
    }

    // Check if there are any fiches for this session
    if (sessionData.fichesSession.length === 0) {
      return NextResponse.json(
        { error: 'Aucune fiche à clôturer pour cette session.' },
        { status: 400 }
      );
    }

    // Check if all fiches are already closed
    const allClosed = sessionData.fichesSession.every(fiche => fiche.cloture);
    if (allClosed) {
      return NextResponse.json(
        { error: 'Toutes les fiches de cette session sont déjà clôturées.' },
        { status: 400 }
      );
    }

    // Update ALL fiches of this session to set cloture to true
    const updateResult = await prisma.ficheDePaie.updateMany({
      where: { sessionId: sessionId },
      data: { cloture: true },
    });

    return NextResponse.json({
      message: `${updateResult.count} fiche(s) clôturée(s) avec succès.`,
      count: updateResult.count,
    });
  } catch (error) {
    console.error('Erreur lors de la clôture des fiches:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la clôture.' },
      { status: 500 }
    );
  }
}

/**
 * API route to unarchive (reopen) all fiches of a session
 * Sets the cloture field to false for all fiches related to the session
 */
export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check authorization
    if (!session || !session.user || session.user.role !== 'RESPONSABLE') {
      return NextResponse.json(
        { error: 'Non autorisé.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { sessionId } = body;

    // Validate input
    if (!sessionId || typeof sessionId !== 'number') {
      return NextResponse.json(
        { error: 'ID de session invalide.' },
        { status: 400 }
      );
    }

    // Check if session exists
    const sessionData = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        fichesSession: true,
      },
    });

    if (!sessionData) {
      return NextResponse.json(
        { error: 'Session introuvable.' },
        { status: 404 }
      );
    }

    // Check if there are any fiches for this session
    if (sessionData.fichesSession.length === 0) {
      return NextResponse.json(
        { error: 'Aucune fiche à réouvrir pour cette session.' },
        { status: 400 }
      );
    }

    // Check if all fiches are already open
    const allOpen = sessionData.fichesSession.every(fiche => !fiche.cloture);
    if (allOpen) {
      return NextResponse.json(
        { error: 'Toutes les fiches de cette session sont déjà ouvertes.' },
        { status: 400 }
      );
    }

    // Update ALL fiches of this session to set cloture to false
    const updateResult = await prisma.ficheDePaie.updateMany({
      where: { sessionId: sessionId },
      data: { cloture: false },
    });

    return NextResponse.json({
      message: `${updateResult.count} fiche(s) réouverte(s) avec succès.`,
      count: updateResult.count,
    });
  } catch (error) {
    console.error('Erreur lors de la réouverture des fiches:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la réouverture.' },
      { status: 500 }
    );
  }
}
