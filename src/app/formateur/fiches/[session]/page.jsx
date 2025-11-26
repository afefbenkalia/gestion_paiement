'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { FormateurSidebar } from '@/components/formateur-sidebar'
import { Loader2 } from 'lucide-react'
import FicheDetail from '@/components/fiche-detail'
import { formatDate, formatAmount } from '@/lib/utils'

export default function FicheDetailPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const sessionId = params?.session
  const [fiche, setFiche] = useState(null)
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
    if (!sessionId) {
      setError('Session invalide')
      setLoading(false)
      return
    }

    const fetchFiche = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/formateur/fiches/${sessionId}`)
        if (!res.ok) throw new Error('Fiche introuvable')
        const data = await res.json()
        setFiche(data)
      } catch (err) {
        setError(err.message || 'Erreur')
      } finally {
        setLoading(false)
      }
    }

    fetchFiche()
  }, [session, status, sessionId, router])

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      <span className="ml-3">Chargement de la fiche...</span>
    </div>
  )

  if (error) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-red-600">{error}</div>
    </div>
  )

  if (!fiche) return null

  return (
    <div className="flex min-h-screen bg-gray-50">
      <FormateurSidebar />
      <main className="flex-1 p-8">
        <div className="w-11/12 mx-auto px-4">
          <FicheDetail fiche={fiche} />

          <div className="mt-4">
            <button onClick={() => router.push('/formateur/historique')} className="px-4 py-2 bg-gray-100 rounded-lg">Retour</button>
          </div>
        </div>
      </main>
    </div>
  )
}
