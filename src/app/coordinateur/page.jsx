'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

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
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!session || session.user.role !== 'COORDINATEUR' || (session.user.status !== 'ACTIVE')) {
    return null
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          Bienvenue, {session.user.name}
        </h1>
        <p className="text-lg text-gray-600">
          Votre rôle : <span className="font-semibold text-green-600">{session.user.role}</span>
        </p>
        <div className="mt-6 p-4 bg-green-50 rounded-lg">
          <p className="text-green-800">
            Vous pouvez gérer les formateurs et leurs fiches de paie.
          </p>
        </div>
      </div>
    </div>
  )
}

