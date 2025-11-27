import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import * as XLSX from 'xlsx';

function parseDate(value) {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function buildWhere({ type, statut, start, end, q }) {
  const where = {};
  if (type && type !== 'ALL') where.typeFiche = type;
  if (statut && statut !== 'ALL') where.session = { ...(where.session || {}), statut };
  const startDate = parseDate(start);
  const endDate = parseDate(end);
  if (startDate || endDate) {
    where.session = {
      ...(where.session || {}),
      dateDebut: startDate ? { gte: startDate } : undefined,
      dateFin: endDate ? { lte: endDate } : undefined,
    };
  }
  if (q) {
    const contains = { contains: q };
    where.OR = [
      { numMemoire: contains },
      { periode: contains },
      { nomResponsable: contains },
      { session: { titre: contains } },
      { formateur: { name: contains } },
      { coordinateur: { name: contains } },
    ];
  }
  return where;
}

function mapRows(fiches) {
  return fiches.map((f) => ({
    ID: f.id,
    Type: f.typeFiche,
    'N° Mémoire': f.numMemoire,
    Session: f.session ? `${f.session.id} - ${f.session.titre || ''}` : '',
    Période: f.periode || '',
    'Formateur/Coord.': f.formateur?.name || f.coordinateur?.name || '',
    'Total Tutorat': f.totalTutorat ?? '',
    'Total Regroupement': f.totalRegroupement ?? '',
    'Montant Brut (TND)': f.montantTotalBrut ?? 0,
    'Montant Net (TND)': f.montantTotalNet ?? 0,
    Statut: f.session?.statut || '',
    'Nom Responsable': f.nomResponsable || '',
    'Créée le': f.createdAt ? new Date(f.createdAt).toLocaleString('fr-FR') : '',
  }));
}

export async function GET(request) {
  const url = new URL(request.url);
  const searchParams = url.searchParams;
  const format = searchParams.get('format') || 'json';
  const type = searchParams.get('type') || 'ALL'; // FORMATION | COORDINATION | REGLEMENT | ALL
  const statut = searchParams.get('statut') || 'ALL'; // COMPLET | EN_ATTENTE | ALL
  const start = searchParams.get('start'); // YYYY-MM-DD
  const end = searchParams.get('end'); // YYYY-MM-DD
  const q = searchParams.get('q') || '';

  const sessionAuth = await getServerSession(authOptions);
  if (!sessionAuth || !sessionAuth.user || sessionAuth.user.role !== 'RESPONSABLE') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  const where = buildWhere({ type, statut, start, end, q });

  const fiches = await prisma.ficheDePaie.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      session: { select: { id: true, titre: true, dateDebut: true, dateFin: true } },
      formateur: { select: { id: true, name: true, email: true } },
      coordinateur: { select: { id: true, name: true, email: true } },
    },
  });

  if (format === 'xlsx') {
    const rows = mapRows(fiches);
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Fiches');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    const filenameParts = ['fiches'];
    if (type !== 'ALL') filenameParts.push(type.toLowerCase());
    if (statut !== 'ALL') filenameParts.push(statut.toLowerCase());
    const filename = `${filenameParts.join('_')}.xlsx`;

    return new Response(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  }

  // default JSON preview
  return NextResponse.json({ data: fiches });
}
