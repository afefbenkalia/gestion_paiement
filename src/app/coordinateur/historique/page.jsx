'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function CoordinateurHistoriquePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [fiches, setFiches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/login')
      return
    }

    if (session.user.role !== 'COORDINATEUR') {
      router.push('/dashboard')
      return
    }

    if (session.user.status !== 'ACTIVE') {
      router.push('/pending')
      return
    }

    const fetchFiches = async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/coordinateur/historique')
        if (!res.ok) throw new Error('Erreur lors de la récupération de l\'historique')
        const data = await res.json()
        setFiches(data || [])
      } catch (err) {
        setError(err.message || 'Erreur')
      } finally {
        setLoading(false)
      }
    }

    fetchFiches()
  }, [session, status, router])

  const filtered = fiches.filter((f) => {
    const q = query.trim().toLowerCase()
    if (statusFilter && f.etat !== statusFilter) return false
    if (!q) return true
    return (
      (f.numMemoire && f.numMemoire.toLowerCase().includes(q)) ||
      (f.periode && f.periode.toLowerCase().includes(q)) ||
      (String(f.montantTotalNet || '').toLowerCase().includes(q))
    )
  })

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="bg-gradient-to-r from-white to-gray-50 p-6 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Historique — Fiches de paie</h2>
            <p className="text-sm text-gray-500 mt-1">Historique des fiches pour les sessions dont vous êtes coordinateur</p>
          </div>
          
        </div>

        <div className="mt-6 bg-white border border-gray-100 rounded-lg shadow-sm">
          {loading && (
            <div className="p-6 text-gray-600">Chargement de l'historique...</div>
          )}

          {error && (
            <div className="p-6 text-red-600">{error}</div>
          )}

          {!loading && !error && (
            <div className="overflow-x-auto">
              {fiches.length === 0 ? (
                <div className="p-6 text-gray-500">Aucune fiche trouvée pour vos sessions.</div>
              ) : (
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Numéro</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Période</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant net</th>
                      <th className="px-6 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {filtered.map((f) => (
                      <tr key={f.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{f.numMemoire}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{f.periode}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{new Date(f.createdAt).toLocaleDateString('fr-FR')}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{f.montantTotalNet ? Number(f.montantTotalNet).toLocaleString('fr-FR', { style: 'currency', currency: 'dtn' }) : 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                        
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <a className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors" href={`/coordinateur/fiches/${f.sessionId || f.id}`}>Voir</a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
