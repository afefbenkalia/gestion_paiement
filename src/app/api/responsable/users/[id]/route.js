import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// GET - Récupérer un utilisateur par ID
export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || session.user.role !== 'RESPONSABLE') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const { id } = await params;
    const userId = parseInt(id);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        cv: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    // Vérifier que c'est un formateur ou coordinateur
    if (user.role === 'RESPONSABLE') {
      return NextResponse.json(
        { error: 'Accès non autorisé à cet utilisateur' },
        { status: 403 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Erreur GET user:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PUT - Mettre à jour un utilisateur (incluant activate/deactivate)
export async function PUT(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || session.user.role !== 'RESPONSABLE') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const { id } = await params;
    const userId = parseInt(id);
    const body = await request.json();

    // Vérifier que l'utilisateur existe et n'est pas un responsable
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    if (existingUser.role === 'RESPONSABLE') {
      return NextResponse.json(
        { error: 'Impossible de modifier un responsable' },
        { status: 403 }
      );
    }

    // Préparer les données à mettre à jour
    const updateData = {};

    // Activer/Désactiver
    if (body.status !== undefined) {
      if (body.status === 'ACTIVE' || body.status === 'INACTIVE') {
        updateData.status = body.status;
      } else {
        return NextResponse.json(
          { error: 'Le statut doit être ACTIVE ou INACTIVE' },
          { status: 400 }
        );
      }
    }

    // Mettre à jour le nom
    if (body.name !== undefined) {
      updateData.name = body.name;
    }

    // Mettre à jour l'email (vérifier qu'il n'existe pas déjà)
    if (body.email !== undefined && body.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: body.email },
      });

      if (emailExists) {
        return NextResponse.json(
          { error: 'Cet email est déjà utilisé' },
          { status: 400 }
        );
      }

      updateData.email = body.email;
    }

    // Mettre à jour le CV
    if (body.cv !== undefined) {
      updateData.cv = body.cv;
    }

    // Mettre à jour le mot de passe si fourni
    if (body.password) {
      updateData.password = await bcrypt.hash(body.password, 10);
    }

    // Mettre à jour le rôle (si nécessaire)
    if (body.role !== undefined) {
      if (body.role === 'FORMATEUR' || body.role === 'COORDINATEUR') {
        updateData.role = body.role;
      } else {
        return NextResponse.json(
          { error: 'Le rôle doit être FORMATEUR ou COORDINATEUR' },
          { status: 400 }
        );
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        cv: true,
        createdAt: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Erreur PUT user:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE - Supprimer un utilisateur
export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || session.user.role !== 'RESPONSABLE') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const { id } = await params;
    const userId = parseInt(id);

    // Vérifier que l'utilisateur existe et n'est pas un responsable
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    if (existingUser.role === 'RESPONSABLE') {
      return NextResponse.json(
        { error: 'Impossible de supprimer un responsable' },
        { status: 403 }
      );
    }

    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({ message: 'Utilisateur supprimé avec succès' });
  } catch (error) {
    console.error('Erreur DELETE user:', error);
    
    // Gérer les erreurs de contrainte de clé étrangère
    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: 'Impossible de supprimer cet utilisateur car il est lié à des données' },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

