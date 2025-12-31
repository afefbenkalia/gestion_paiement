import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (session.user.role !== 'FORMATEUR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const userId = Number(session.user.id)

    const fiches = await prisma.ficheDePaie.findMany({
      where: { formateurId: userId,
        typeFiche:"FORMATION"
       },
      orderBy: { createdAt: 'desc' },
    })

    const data = fiches.map((f) => ({
      id: f.id,
      numMemoire: f.numMemoire,
      periode: f.periode,
      etat: f.etat,
      sessionId: f.sessionId,
      montantTotalNet: f.montantTotalNet,
      createdAt: f.createdAt,
    }))

    return NextResponse.json(data)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
