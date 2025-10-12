'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function Dashboard() {
  const { data: session } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (session) {
      // Rediriger vers le dashboard spécifique selon le rôle
      switch (session.user.role) {
        case 'RESPONSABLE':
          router.push('/dashboard/responsable')
          break
        case 'COORDINATEUR':
          router.push('/dashboard/coordinateur')
          break
        case 'FORMATEUR':
          router.push('/dashboard/formateur')
          break
        default:
          router.push('/dashboard')
      }
    }
  }, [session, router])

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirection vers votre dashboard...</p>
      </div>
    </div>
  )
}