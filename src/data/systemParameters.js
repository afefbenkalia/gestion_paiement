export const DEFAULT_SYSTEM_PARAMETERS = {
  /**
   * Prix d'une heure de formation pour un formateur.
   */
  prixHeureFormation: 30,
  /**
   * Montant fixe versé au coordinateur pour une session.
   */
  prixCoordinationFixe: 300,
  /**
   * TVA appliquée (en pourcentage).
   */
  tva: 15,
};

export function describeSystemParameters(params = DEFAULT_SYSTEM_PARAMETERS) {
  return {
    ...DEFAULT_SYSTEM_PARAMETERS,
    ...params,
  };
}

