import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import fs from 'fs'
import path from 'path'

const PAYMENTS_FILE = path.join(process.cwd(), 'src', 'data', 'payments.json')

function readPayments() {
  try {
    if (!fs.existsSync(PAYMENTS_FILE)) return []
    const raw = fs.readFileSync(PAYMENTS_FILE, 'utf8')
    return JSON.parse(raw || '[]')
  } catch (e) {
    console.error('readPayments error', e)
    return []
  }
}

function writePayments(payments) {
  try {
    fs.writeFileSync(PAYMENTS_FILE, JSON.stringify(payments, null, 2), 'utf8')
    return true
  } catch (e) {
    console.error('writePayments error', e)
    return false
  }
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Only RESPONSABLE or COORDINATEUR can initiate virement
    if (!['RESPONSABLE', 'COORDINATEUR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const { ficheId, amount, bank, rib, reference, date } = body || {}
    if (!ficheId || !amount) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    // Validate fiche exists
    const fiche = await prisma.ficheDePaie.findUnique({ where: { id: Number(ficheId) }, include: { formateur: true, coordinateur: true, session: true } })
    if (!fiche) return NextResponse.json({ error: 'Fiche introuvable' }, { status: 404 })

    // Basic access: RESPONSABLE can pay any, COORDINATEUR only if they are coord
    if (session.user.role === 'COORDINATEUR') {
      const userId = Number(session.user.id)
      const isCoord = fiche.coordinateurId === userId || (fiche.session && fiche.session.coordinateurId === userId)
      if (!isCoord) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const payments = readPayments()
    const nextId = (payments.reduce((m, p) => Math.max(m, p.id || 0), 0) || 0) + 1
    const payment = {
      id: nextId,
      ficheId: Number(ficheId),
      amount: Number(amount),
      bank: bank || null,
      rib: rib || null,
      reference: reference || null,
      date: date || new Date().toISOString(),
      createdBy: { id: Number(session.user.id), name: session.user.name, role: session.user.role },
      createdAt: new Date().toISOString(),
    }

    payments.push(payment)
    const ok = writePayments(payments)
    if (!ok) return NextResponse.json({ error: 'Unable to save payment' }, { status: 500 })

    return NextResponse.json(payment)
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
