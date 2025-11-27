import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import * as XLSX from 'xlsx';

function sanitizeFilename(name) {
  if (!name) return 'fichier';
  try {
    const noDiacritics = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return noDiacritics
      .replace(/[<>:\"/\\|?*\x00-\x1F]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\s/g, '_');
  } catch {
    return 'fichier';
  }
}

const formatDate = (value) => {
  if (!value) return '';
  try {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(new Date(value));
  } catch {
    return '';
  }
};

function generateFormationExcel(session, fiche, formateur) {
  const retenue = (fiche.montantTotalBrut ?? 0) - (fiche.montantTotalNet ?? 0);

  const data = [
     // Tableau formateur
    ['Nom et Prénom', 'N° CIN', 'RIB', 'Banque'],
    [formateur?.name || '-', formateur?.cin || '-', formateur?.rib || '-', formateur?.banque || '-'],
    [],
     // Tableau heures et montants
    ['Total regroupement', 'Total tutorat', 'Total heures', 'Montant Brut', 'Retenue', 'Montant Net'],
    [
      fiche.totalRegroupement ?? 0,
      fiche.totalTutorat ?? 0,
      (fiche.totalRegroupement ?? 0) + (fiche.totalTutorat ?? 0),
      `${(fiche.montantTotalBrut ?? 0).toFixed(3)} TND`,
      `${retenue.toFixed(3)} TND`,
      `${(fiche.montantTotalNet ?? 0).toFixed(3)} TND`
    ],
  ];

  return data;
}

function generateCoordinationExcel(session, fiche, coordinateur) {
  const retenue = (fiche.montantTotalBrut ?? 0) - (fiche.montantTotalNet ?? 0);

  const data = [
     // Tableau coordinateur
    ['Nom et Prénom', 'Fonction', 'N° CIN', 'RIB', 'Banque'],
    [
      coordinateur?.name || 'Non renseigné',
      coordinateur?.fonction || 'Coordinateur',
      coordinateur?.cin || '',
      coordinateur?.rib || '',
      coordinateur?.banque || ''
    ],
    [],
     // Tableau montants
    ['Montant Brut', 'Retenue', 'Montant Net'],
    [
      `${(fiche.montantTotalBrut ?? 0).toFixed(3)} TND`,
      `${retenue.toFixed(3)} TND`,
      `${(fiche.montantTotalNet ?? 0).toFixed(3)} TND`
    ],
  ];

  return data;
}

function generateReglementExcel(session, fiche, formateurs, coordFiche, coordinateur) {
  const totalFormateursNet = formateurs?.reduce((sum, f) => sum + (f.fiche?.montantNet || 0), 0) || 0;
  const totalFormateursBrut = formateurs?.reduce((sum, f) => sum + (f.fiche?.montantBrut || 0), 0) || 0;
  const totalCoordinationNet = coordFiche?.montantNet || 0;
  const totalCoordinationBrut = coordFiche?.montantBrut || 0;
  const totalGeneralBrut = totalFormateursBrut + totalCoordinationBrut;

  const data = [
     // Tableau formateurs
    ['Nom et Prénom', 'N° CIN', 'Total regr', 'Total tutorat', 'Total heures', 'Montant brut', 'Retenues', 'Montant net', 'RIB', 'Banque']
  ];

  formateurs?.forEach((formateur) => {
    const brut = formateur.fiche?.montantBrut ?? 0;
    const net = formateur.fiche?.montantNet ?? 0;
    const retenue = brut - net;
    data.push([
      formateur.name || 'Non renseigné',
      formateur.cin || '',
      formateur.fiche?.totalRegroupement || 0,
      formateur.fiche?.totalTutorat || 0,
      formateur.fiche?.totalHeures || 0,
      `${brut.toFixed(3)} TND`,
      `${retenue.toFixed(3)} TND`,
      `${net.toFixed(3)} TND`,
      formateur.rib || '',
      formateur.banque || ''
    ]);
  });

  data.push(['TOTAL (brut)', '', '', '', '', `${totalFormateursBrut.toFixed(3)} TND`]);
  data.push([]);
   // Tableau coordination
  data.push(['Nom et prénom', 'N° CIN', 'Montant brut', 'Retenues', 'Montant net', 'Total brut', 'RIB', 'Banque']);
  data.push([
    coordinateur?.name || 'Non renseigné',
    coordinateur?.cin || '',
    `${(coordFiche?.montantBrut ?? 0).toFixed(3)} TND`,
    `${((coordFiche?.montantBrut ?? 0) - (coordFiche?.montantNet ?? 0)).toFixed(3)} TND`,
    `${(coordFiche?.montantNet ?? 0).toFixed(3)} TND`,
    `${(coordFiche?.montantBrut ?? 0).toFixed(3)} TND`,
    coordinateur?.rib || '',
    coordinateur?.banque || ''
  ]);
  data.push([]);
   // Total général
  data.push(['Total général brut', `${totalGeneralBrut.toFixed(3)} TND`]);

  return data;
}

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const ficheId = Number(id);

    if (Number.isNaN(ficheId)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
    }

    const sessionAuth = await getServerSession(authOptions);
    if (!sessionAuth || !sessionAuth.user || sessionAuth.user.role !== 'RESPONSABLE') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const fiche = await prisma.ficheDePaie.findUnique({
      where: { id: ficheId },
      include: {
        session: {
          include: {
            coordinateur: true,
            formateurs: {
              include: {
                formateur: true,
              },
            },
            fichesSession: true,
          },
        },
        formateur: true,
        coordinateur: true,
      },
    });

    if (!fiche) {
      return NextResponse.json({ error: 'Fiche non trouvée' }, { status: 404 });
    }

    const session = fiche.session;
    const formatPeriode = (dateDebut, dateFin) => {
      if (!dateDebut || !dateFin) return '';
      try {
        const formatter = new Intl.DateTimeFormat('fr-FR', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });
        return `Du ${formatter.format(dateDebut)} au ${formatter.format(dateFin)}`;
      } catch {
        return '';
      }
    };
    session.periode = formatPeriode(session.dateDebut, session.dateFin);

    let data;
    let filename;

     const safeTitle = sanitizeFilename(session.titre);

     if (fiche.typeFiche === 'FORMATION') {
      data = generateFormationExcel(session, fiche, fiche.formateur);
       filename = `${safeTitle}_formation.xlsx`;
    } else if (fiche.typeFiche === 'COORDINATION') {
      data = generateCoordinationExcel(session, fiche, fiche.coordinateur);
       filename = `${safeTitle}_coordination.xlsx`;
    } else if (fiche.typeFiche === 'REGLEMENT') {
      const formateurs = session.formateurs.map((sf) => {
        const formateurFiche = session.fichesSession.find(
          (f) => f.typeFiche === 'FORMATION' && f.formateurId === sf.formateur.id
        );
        return {
          ...sf.formateur,
          fiche: formateurFiche ? {
            montantBrut: formateurFiche.montantTotalBrut,
            montantNet: formateurFiche.montantTotalNet,
            totalRegroupement: formateurFiche.totalRegroupement,
            totalTutorat: formateurFiche.totalTutorat,
            totalHeures: (formateurFiche.totalRegroupement ?? 0) + (formateurFiche.totalTutorat ?? 0),
          } : null,
        };
      });

      const coordFiche = session.fichesSession.find((f) => f.typeFiche === 'COORDINATION');
      data = generateReglementExcel(
        session,
        fiche,
        formateurs,
        coordFiche ? {
          montantBrut: coordFiche.montantTotalBrut,
          montantNet: coordFiche.montantTotalNet,
        } : null,
        session.coordinateur
      );
      filename = `${safeTitle}_reglement.xlsx`;
    } else {
      return NextResponse.json({ error: 'Type de fiche non supporté' }, { status: 400 });
    }

    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Fiche');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return new Response(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Erreur export Excel fiche:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
