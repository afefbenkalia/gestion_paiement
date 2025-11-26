'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import CoordinateurSidebar from '@/components/coordinateur-sidebar'
import CoordinateurSessionsPage from './sessions/page'

export default function CoordinateurDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/login')
      return
    }

    // Vérifier le rôle
    if (session.user.role !== 'COORDINATEUR') {
      router.push('/dashboard')
      return
    }

    // Vérifier le statut - rediriger vers /pending si INACTIVE
    if (session.user.status === 'INACTIVE' || session.user.status === 'PENDING') {
      router.push('/pending')
      return
    }

    // S'assurer que le statut est ACTIVE
    if (session.user.status !== 'ACTIVE') {
      router.push('/pending')
      return
    }

    // Par défaut afficher la page des sessions (on reste sur la même route)
    // Pas de redirection nécessaire — la page va rendre le composant sessions ci-dessous
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <CoordinateurSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement...</p>
          </div>
        </div>
      </div>
    )
  }

  // lorsque l'auth est validée, afficher la liste des sessions par défaut
  if (session && session.user && session.user.role === 'COORDINATEUR' && session.user.status === 'ACTIVE') {
    return <CoordinateurSessionsPage />
  }

  return null
}

