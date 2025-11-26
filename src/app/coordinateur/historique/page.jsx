'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import CoordinateurSidebar from '@/components/coordinateur-sidebar'

export default function CoordinateurHistoriquePage() {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-gray-600">Chargement de l'historique...</div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <CoordinateurSidebar />
      <main className="flex-1 p-8">
        <div className="w-11/12 mx-auto">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-2xl font-semibold mb-4">Historique des fiches de paie</h2>

            {fiches.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">Aucune fiche trouvée pour vos sessions.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {fiches.map((f) => (
                  <div key={f.id} className="p-3 border rounded flex items-center justify-between">
                    <div>
                      <div className="font-semibold">{f.numMemoire}</div>
                      <div className="text-sm text-gray-500">Période: {f.periode} · {new Date(f.createdAt).toLocaleDateString('fr-FR')}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <a className="px-3 py-1 bg-gray-100 rounded" href={`/coordinateur/fiches/${f.sessionId || f.id}`}>Voir détail</a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
