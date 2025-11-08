//api/responsable/sessions/[id]/route.js
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET - Récupérer une session par ID
export async function GET(request, { params }) {
  try {
    // Récupérer la session avec les headers
    const headers = new Headers(request.headers);
    const session = await getServerSession(authOptions);
    
    console.log('Session récupérée:', session ? 'exists' : 'null');
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }
    
    if (session.user.role !== 'RESPONSABLE') {
      return NextResponse.json(
        { error: 'Accès non autorisé. Rôle requis: RESPONSABLE, Rôle actuel: ' + session.user.role },
        { status: 403 }
      );
    }

    const { id } = await params;
    const sessionData = await prisma.session.findUnique({
      where: { id: parseInt(id) },
      include: {
        formateur: {
          select: {
            id: true,
            name: true,
            email: true,
            cv: true,
            role: true,
          },
        },
        coordinateur: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        fiche: {
          include: {
            responsable: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            coordinateur: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!sessionData) {
      return NextResponse.json(
        { error: 'Session non trouvée' },
        { status: 404 }
      );
    }

    // Calculer les informations supplémentaires
    const dureeJours = Math.ceil(
      (new Date(sessionData.dateFin) - new Date(sessionData.dateDebut)) / (1000 * 60 * 60 * 24)
    );
    const montant = sessionData.nbHeures * 50; 

    return NextResponse.json({
      ...sessionData,
      dureeJours,
      montant,
    });
  } catch (error) {
    console.error('Erreur lors de la récupération de la session:', error);
    console.error('Stack:', error.stack);
    return NextResponse.json(
      { error: 'Erreur serveur', details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour une session
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'RESPONSABLE') {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const data = await request.json();
    const { titre, dateDebut, dateFin, nbHeures, formateurId, coordinateurId, ficheId } = data;

    // Validations
    if (dateFin && dateDebut && new Date(dateFin) < new Date(dateDebut)) {
      return NextResponse.json(
        { error: 'La date de fin doit être après la date de début' },
        { status: 400 }
      );
    }

    if (nbHeures && nbHeures <= 0) {
      return NextResponse.json(
        { error: 'Le nombre d\'heures doit être positif' },
        { status: 400 }
      );
    }

    const updatedSession = await prisma.session.update({
      where: { id: parseInt(id) },
      data: {
        ...(titre && { titre }),
        ...(dateDebut && { dateDebut: new Date(dateDebut) }),
        ...(dateFin && { dateFin: new Date(dateFin) }),
        ...(nbHeures && { nbHeures: parseFloat(nbHeures) }),
        ...(formateurId !== undefined && { formateurId: formateurId ? parseInt(formateurId) : null }),
        ...(coordinateurId !== undefined && { coordinateurId: coordinateurId ? parseInt(coordinateurId) : null }),
        ...(ficheId !== undefined && { ficheId: ficheId ? parseInt(ficheId) : null }),
      },
      include: {
        formateur: true,
        coordinateur: true,
        fiche: true,
      },
    });

    return NextResponse.json(updatedSession);
  } catch (error) {
    console.error('Erreur lors de la mise à jour de la session:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer une session
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'RESPONSABLE') {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    const { id } = await params;
    await prisma.session.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ 
      message: 'Session supprimée avec succès' 
    });
  } catch (error) {
    console.error('Erreur lors de la suppression de la session:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}





