'use client'

import writtenNumber from 'written-number'
import { formatDate, formatAmount, amountToWords } from '@/lib/utils'

writtenNumber.defaults.lang = 'fr'

export default function FicheDetail({ fiche }) {
  const session = fiche?.session || {}
  const form = fiche?.formateur || {}
  const coord = fiche?.coordinateur || {}
  const resp = fiche?.responsable || {}

  const retenue = (fiche?.montantBrut ?? fiche?.montantTotalBrut ?? 0) - (fiche?.montantNet ?? fiche?.montantTotalNet ?? 0)

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex items-start justify-between mb-6 border p-4 rounded">
        <div>
          <h2 className="text-lg font-bold">MEMOIRE INDIVIDUELLE : {fiche?.typeFiche ?? 'FORMATION'}</h2>
          <p className="text-sm text-gray-600 mt-2">N° Mémoire: <span className="font-semibold">{fiche?.numMemoire || 'N/A'}</span></p>
          <p className="text-sm text-gray-600">Date mémoire: <span className="font-semibold">{fiche?.updatedAt ? formatDate(fiche.updatedAt) : 'N/A'}</span></p>
        </div>
        <div className="text-sm text-gray-600 text-right">
          <p>Réf :</p>
          <p>Version :</p>
          <p>Date d'application: {formatDate(new Date())}</p>
        </div>
      </div>

      <div className="mb-4 p-3 border rounded bg-gray-50">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-gray-500">Responsable</div>
            <div className="font-semibold">{fiche?.nomResponsable || resp.name || 'N/A'}</div>
            <div className="text-xs text-gray-500 mt-2">Période</div>
            <div className="font-medium">{session.dateDebut ? formatDate(session.dateDebut) : ''} — {session.dateFin ? formatDate(session.dateFin) : ''}</div>
            <div className="text-xs text-gray-500 mt-2">Classe / Spécialité</div>
            <div className="font-medium">{session.classe || 'N/A'} / {session.specialite || 'N/A'}</div>
          </div>

          <div>
            <div className="text-xs text-gray-500">Formateur</div>
            <div className="font-semibold">{form.name || 'N/A'}</div>
            <div className="mt-3 text-xs text-gray-500">Montant Brut</div>
            <div className="font-medium">{formatAmount(fiche?.montantBrut ?? fiche?.montantTotalBrut)}</div>
            <div className="mt-3 text-xs text-gray-500">Montant Net</div>
            <div className="font-medium">{formatAmount(fiche?.montantNet ?? fiche?.montantTotalNet)}</div>
          </div>
        </div>
      </div>

      <div className="mb-6">
        {fiche?.typeFiche === 'COORDINATION' ? (
          <>
            <h3 className="font-semibold mb-2">Informations Coordinateur</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 border rounded p-3 bg-white">
              <div>
                <p className="text-xs text-gray-500">Nom et Prénom</p>
                <p className="font-medium">{coord.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Fonction</p>
                <p className="font-medium">{coord.fonction || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">N° CIN</p>
                <p className="font-medium">{coord.cin || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">RIB / Banque</p>
                <p className="font-medium">{coord.rib || 'N/A'} {coord.banque ? '/ ' + coord.banque : ''}</p>
              </div>
            </div>
          </>
        ) : (
          <>
            <h3 className="font-semibold mb-2">Informations Formateur</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 border rounded p-3 bg-white">
              <div>
                <p className="text-xs text-gray-500">Nom et Prénom</p>
                <p className="font-medium">{form.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">N° CIN</p>
                <p className="font-medium">{form.cin || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">RIB</p>
                <p className="font-medium">{form.rib || 'N/A'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Banque</p>
                <p className="font-medium">{form.banque || 'N/A'}</p>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="mb-6">
        <h3 className="font-semibold mb-2">Montants</h3>
        { (fiche?.totalRegroupement != null || fiche?.totalTutorat != null) ? (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-2 text-center border rounded p-2 bg-white">
            <div className="font-semibold">Total regroupement</div>
            <div className="font-semibold">Total tutorat</div>
            <div className="font-semibold">Total heures</div>
            <div className="font-semibold">Montant Brut</div>
            <div className="font-semibold">Retenue</div>
            <div className="font-semibold">Montant Net</div>

            <div>{fiche?.totalRegroupement ?? 0}</div>
            <div>{fiche?.totalTutorat ?? 0}</div>
            <div>{(fiche?.totalTutorat ?? 0) + (fiche?.totalRegroupement ?? 0)}</div>
            <div>{formatAmount(fiche?.montantBrut ?? fiche?.montantTotalBrut)}</div>
            <div>{formatAmount(retenue)}</div>
            <div>{formatAmount(fiche?.montantNet ?? fiche?.montantTotalNet)}</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-center border rounded p-2 bg-white">
            <div className="font-semibold">Montant Brut</div>
            <div className="font-semibold">Retenue</div>
            <div className="font-semibold">Montant Net</div>

            <div>{formatAmount(fiche?.montantBrut ?? fiche?.montantTotalBrut)}</div>
            <div>{formatAmount(retenue)}</div>
            <div>{formatAmount(fiche?.montantNet ?? fiche?.montantTotalNet)}</div>
          </div>
        )}

        <div className="mt-3 border rounded p-3 bg-gray-50">
          <div className="text-xs font-semibold">Montant en toutes lettres</div>
          <div className="mt-1">{amountToWords(fiche?.montantBrut ?? fiche?.montantTotalBrut ?? 0)}</div>
        </div>
      </div>
    </div>
  )
}
