import { DEFAULT_SYSTEM_PARAMETERS } from '@/data/systemParameters';

const safeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  if (Number.isFinite(parsed)) {
    return parsed;
  }
  return fallback;
};

const clampNonNegative = (value) => {
  const parsed = safeNumber(value, 0);
  return parsed < 0 ? 0 : parsed;
};

export function getSystemParameters(overrides = {}) {
  const resolved = {
    prixHeureFormation:
      overrides.prixHeureFormation ??
      process.env.PRIX_HEURE_FORMATION ??
      process.env.NEXT_PUBLIC_PRIX_HEURE_FORMATION,
    prixCoordinationFixe:
      overrides.prixCoordinationFixe ??
      process.env.PRIX_COORDINATION_FIXE ??
      process.env.NEXT_PUBLIC_PRIX_COORDINATION_FIXE,
    tva:
      overrides.tva ??
      process.env.TVA_TAUX ??
      process.env.NEXT_PUBLIC_TVA_TAUX,
  };

  return {
    prixHeureFormation: clampNonNegative(
      resolved.prixHeureFormation ?? DEFAULT_SYSTEM_PARAMETERS.prixHeureFormation
    ),
    prixCoordinationFixe: clampNonNegative(
      resolved.prixCoordinationFixe ?? DEFAULT_SYSTEM_PARAMETERS.prixCoordinationFixe
    ),
    tva: clampNonNegative(resolved.tva ?? DEFAULT_SYSTEM_PARAMETERS.tva),
  };
}

export function formatPeriode(dateDebut, dateFin) {
  if (!dateDebut || !dateFin) return '';
  try {
    const formatter = new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    return `Du ${formatter.format(dateDebut)} au ${formatter.format(dateFin)}`;
  } catch (error) {
    console.warn('Erreur formatPeriode:', error);
    return '';
  }
}

export function generateMemoireNumber({ type, sessionId, targetId }) {
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  const suffix = targetId ? `-${targetId}` : '';
  return `MEM-${type}-${sessionId}${suffix}-${random}`;
}

export function computeFormateurAmounts({ totalTutorat = 0, totalRegroupement = 0 }, params) {
  const finalParams = params ?? getSystemParameters();
  const regroupement = clampNonNegative(totalRegroupement);
  const tutorat = clampNonNegative(totalTutorat);
  const totalHeures = regroupement + tutorat;
  const montantBrut = totalHeures * finalParams.prixHeureFormation;
  const retenue = montantBrut * (finalParams.tva / 100);
  const montantNet = montantBrut + retenue;
  return { totalHeures, montantBrut, montantNet };
}

export function computeCoordinateurAmounts(params) {
  const finalParams = params ?? getSystemParameters();
  const montantBrut = finalParams.prixCoordinationFixe;
  const retenue = montantBrut * (finalParams.tva / 100);
  const montantNet = montantBrut + retenue;
  return { montantBrut, montantNet };
}

function serializeFiche(fiche) {
  if (!fiche) return null;
  const totalTutorat = clampNonNegative(fiche.totalTutorat);
  const totalRegroupement = clampNonNegative(fiche.totalRegroupement);
  return {
    id: fiche.id,
    type: fiche.typeFiche,
    numMemoire: fiche.numMemoire,
    periode: fiche.periode,
    montantBrut: safeNumber(fiche.montantTotalBrut),
    montantNet: safeNumber(fiche.montantTotalNet),
    totalTutorat,
    totalRegroupement,
    totalHeures: totalTutorat + totalRegroupement,
    createdAt: fiche.createdAt,
    updatedAt: fiche.updatedAt,
    nomResponsable: fiche.nomResponsable,
  };
}

export function buildSessionPaiementPayload(sessionRecord, params) {
  if (!sessionRecord) return null;
  const systemParams = params ?? getSystemParameters();
  const fichesSession = sessionRecord.fichesSession ?? [];
  const formateurFiches = fichesSession.filter((fiche) => fiche.typeFiche === 'FORMATION');
  const coordinateurFiche = fichesSession.find((fiche) => fiche.typeFiche === 'COORDINATION');
  const reglementFiche = fichesSession.find((fiche) => fiche.typeFiche === 'REGLEMENT');

  const formateurs = (sessionRecord.formateurs ?? [])
    .map((sf) => ({
      id: sf.formateur.id,
      name: sf.formateur.name,
      email: sf.formateur.email,
      fonction: sf.formateur.fonction,
      cin: sf.formateur.cin,
      rib: sf.formateur.rib,
      banque: sf.formateur.banque,
      tel: sf.formateur.tel,
      fiche:
        formateurFiches
          .filter((fiche) => fiche.formateurId === sf.formateur.id)
          .map(serializeFiche)[0] ?? null,
    }))
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

  const totalFormateursBrut = formateurFiches.reduce(
    (sum, fiche) => sum + safeNumber(fiche.montantTotalBrut),
    0
  );
  const totalFormateursNet = formateurFiches.reduce(
    (sum, fiche) => sum + safeNumber(fiche.montantTotalNet),
    0
  );
  const totalTutorat = formateurFiches.reduce(
    (sum, fiche) => sum + clampNonNegative(fiche.totalTutorat),
    0
  );
  const totalRegroupement = formateurFiches.reduce(
    (sum, fiche) => sum + clampNonNegative(fiche.totalRegroupement),
    0
  );

  const coordFicheSerialized = serializeFiche(coordinateurFiche);
  const reglementFicheSerialized = serializeFiche(reglementFiche);

  const summary = {
    totalFormateursBrut,
    totalFormateursNet,
    totalCoordinateurBrut: coordFicheSerialized?.montantBrut ?? 0,
    totalCoordinateurNet: coordFicheSerialized?.montantNet ?? 0,
    totalBrut: totalFormateursBrut + (coordFicheSerialized?.montantBrut ?? 0),
    totalNet: totalFormateursNet + (coordFicheSerialized?.montantNet ?? 0),
    totalTutorat,
    totalRegroupement,
    pendingFormateurs: formateurs.filter((formateur) => !formateur.fiche).length,
  };

  return {
    session: {
      id: sessionRecord.id,
      titre: sessionRecord.titre,
      classe: sessionRecord.classe,
      specialite: sessionRecord.specialite,
      promotion: sessionRecord.promotion,
      niveau: sessionRecord.niveau,
      semestre: sessionRecord.semestre,
      dateDebut: sessionRecord.dateDebut,
      dateFin: sessionRecord.dateFin,
      periode: formatPeriode(sessionRecord.dateDebut, sessionRecord.dateFin),
    },
    coordinateur: sessionRecord.coordinateur
      ? {
          id: sessionRecord.coordinateur.id,
          name: sessionRecord.coordinateur.name,
          email: sessionRecord.coordinateur.email,
          fonction: sessionRecord.coordinateur.fonction,
          cin: sessionRecord.coordinateur.cin,
          rib: sessionRecord.coordinateur.rib,
          banque: sessionRecord.coordinateur.banque,
          tel: sessionRecord.coordinateur.tel,
        }
      : null,
    formateurs,
    fiches: {
      formateurs: formateurFiches.map(serializeFiche),
      coordinateur: coordFicheSerialized,
      reglement: reglementFicheSerialized,
    },
    summary,
    systemParameters: systemParams,
  };
}

export const SESSION_PAIEMENT_INCLUDE = {
  coordinateur: {
    select: {
      id: true,
      name: true,
      email: true,
      fonction: true,
      cin: true,
      rib: true,
      banque: true,
      tel: true,
    },
  },
  formateurs: {
    include: {
      formateur: {
        select: {
          id: true,
          name: true,
          email: true,
          fonction: true,
          cin: true,
          rib: true,
          banque: true,
          tel: true,
        },
      },
    },
  },
  fichesSession: true,
};

