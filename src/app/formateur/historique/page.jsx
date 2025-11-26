'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { FormateurSidebar } from '@/components/formateur-sidebar'

export default function HistoriquePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [fiches, setFiches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/login')
      return
    }

    if (session.user.role !== 'FORMATEUR') {
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
        const res = await fetch('/api/formateur/historique')
        if (!res.ok) throw new Error('Erreur lors de la récupération des fiches')
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

  return (
    <div className="flex min-h-screen bg-gray-50">
      <FormateurSidebar />

      <main className="flex-1 p-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Historique - Fiches de paie</h2>

          {loading && <div className="text-gray-600">Chargement des fiches...</div>}
          {error && <div className="text-red-600">{error}</div>}

          {!loading && !error && (
            <div className="space-y-3">
              {fiches.length === 0 ? (
                <div className="text-gray-600">Aucune fiche trouvée.</div>
              ) : (
                fiches.map((f) => (
                  <div key={f.id} className="p-4 border rounded-md flex items-center justify-between">
                    <div>
                      <div className="font-medium">{f.numMemoire}</div>
                      <div className="text-sm text-gray-500">Période: {f.periode} - État: {f.etat}</div>
                      <div className="text-sm text-gray-600">Net: {f.montantTotalNet ?? 'N/A'}</div>
                    </div>
                    <div className="ml-4">
                      <a
                        href={f.sessionId ? `/formateur/fiches/${f.sessionId}` : `/formateur/fiches/${f.id}`}
                        className="inline-flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                      >
                        Voir détail
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
