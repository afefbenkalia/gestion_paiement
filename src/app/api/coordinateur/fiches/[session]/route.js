import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (session.user.role !== 'COORDINATEUR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const userId = Number(session.user.id)
    const param = Number(params.session)

    if (!param) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

    // First try to get by fiche id (param as fiche id)
    let fiche = await prisma.ficheDePaie.findUnique({
      where: { id: param },
      include: { session: true, formateur: true, coordinateur: true, responsable: true },
    })

    if (fiche) {
      const isCoordinatorOfFiche = fiche.coordinateurId === userId
      const isCoordinatorOfSession = fiche.session && fiche.session.coordinateurId === userId
      if (!isCoordinatorOfFiche && !isCoordinatorOfSession) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      return NextResponse.json(fiche)
    }

    // Otherwise treat param as sessionId; fetch all fiches for that session and pick the coordinator fiche first
    const fiches = await prisma.ficheDePaie.findMany({
      where: { sessionId: param },
      include: { session: true, formateur: true, coordinateur: true, responsable: true },
    })

    if (!fiches || fiches.length === 0) return NextResponse.json({ error: 'Fiche introuvable' }, { status: 404 })

    // Prefer fiche for coordination authored by this coordinator
    let selected = fiches.find((f) => f.typeFiche === 'COORDINATION' && f.coordinateurId === userId)

    // Fallback: any fiche explicitly assigned to this coordinator
    if (!selected) selected = fiches.find((f) => f.coordinateurId === userId)

    // Next fallback: if session's coordinator is the user, prefer a coordination fiche
    if (!selected) {
      const session = fiches[0].session
      if (session && session.coordinateurId === userId) {
        selected = fiches.find((f) => f.typeFiche === 'COORDINATION') || fiches[0]
      }
    }

    if (!selected) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    return NextResponse.json(selected)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
