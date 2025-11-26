import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (session.user.role !== 'FORMATEUR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const userId = Number(session.user.id)
    const sessionId = Number(params.session)

    if (!sessionId) return NextResponse.json({ error: 'Invalid session id' }, { status: 400 })

    const fiche = await prisma.ficheDePaie.findFirst({
      where: {
        sessionId: sessionId,
        formateurId: userId,
      },
      include: {
        session: true,
        formateur: true,
        coordinateur: true,
        responsable: true,
      },
    })

    if (!fiche) return NextResponse.json({ error: 'Fiche introuvable' }, { status: 404 })

    return NextResponse.json(fiche)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
