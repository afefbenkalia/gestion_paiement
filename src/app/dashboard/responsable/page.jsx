'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function ResponsableDashboard() {
  const { data: session } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (session && session.user.role !== 'RESPONSABLE') {
      router.push('/dashboard')
    }
  }, [session, router])

  if (!session) return <p className="text-center mt-8">Chargement...</p>

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          Bienvenue, {session.user.name}
        </h1>
        <p className="text-lg text-gray-600">
          Votre rôle : <span className="font-semibold text-blue-600">{session.user.role}</span>
        </p>
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-blue-800">
            Vous avez accès à toutes les fonctionnalités administratives du système.
          </p>
        </div>
      </div>
    </div>
  )
}