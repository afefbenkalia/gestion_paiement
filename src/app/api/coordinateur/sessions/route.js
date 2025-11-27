import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (session.user.role !== 'COORDINATEUR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const userId = Number(session.user.id)

    const sessions = await prisma.session.findMany({
      where: { coordinateurId: userId },
      include: {
        coordinateur: true,
        formateurs: { include: { formateur: true } },
        _count: { select: { fichesSession: true } },
      },
      orderBy: { id: 'desc' },
    })

    const data = sessions.map((s) => ({
      id: s.id,
      titre: s.titre,
      specialite: s.specialite,
      dateDebut: s.dateDebut,
      dateFin: s.dateFin,
      classe: s.classe,
      promotion: s.promotion,
      niveau: s.niveau,
      coordinateur: s.coordinateur ? { id: s.coordinateur.id, name: s.coordinateur.name } : null,
      formateurs: Array.isArray(s.formateurs) ? s.formateurs.map((sf) => ({ id: sf.formateur.id, name: sf.formateur.name })) : [],
      participantsCount: s._count?.fichesSession ?? 0,
    }))

    return NextResponse.json(data)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
