import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import bcrypt from 'bcryptjs';

// GET - Récupérer tous les formateurs et coordinateurs
export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || session.user.role !== 'RESPONSABLE') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role'); // FORMATEUR ou COORDINATEUR
    const status = searchParams.get('status'); // ACTIVE ou INACTIVE

    const where = {
      role: {
        in: ['FORMATEUR', 'COORDINATEUR'],
      },
    };

    if (role && (role === 'FORMATEUR' || role === 'COORDINATEUR')) {
      where.role = role;
    }

    if (status && (status === 'ACTIVE' || status === 'INACTIVE')) {
      where.status = status;
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        cv: true,
        createdAt: true,
      },
      orderBy: [
        { role: 'asc' },
        { name: 'asc' },
      ],
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error('Erreur GET users:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST - Créer un nouvel utilisateur (formateur ou coordinateur)
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user || session.user.role !== 'RESPONSABLE') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, password, role, cv } = body;

    // Validations
    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: 'Tous les champs obligatoires doivent être remplis' },
        { status: 400 }
      );
    }

    if (role !== 'FORMATEUR' && role !== 'COORDINATEUR') {
      return NextResponse.json(
        { error: 'Le rôle doit être FORMATEUR ou COORDINATEUR' },
        { status: 400 }
      );
    }

    // Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Cet email est déjà utilisé' },
        { status: 400 }
      );
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        cv: cv || null,
        status: 'INACTIVE', // Par défaut inactif
      },
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

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error('Erreur POST users:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

