'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'

export default function PendingPage() {
  const router = useRouter()
  const { data: session, status: sessionStatus } = useSession()
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState(null)

  useEffect(() => {
    // Vérifier d'abord avec la session (plus rapide)
    if (sessionStatus === 'loading') return

    // Si pas de session, rediriger vers login
    if (sessionStatus === 'unauthenticated' || !session) {
      router.push('/login')
      return
    }

    // Les RESPONSABLES ne devraient jamais voir cette page - rediriger immédiatement
    if (session.user.role === 'RESPONSABLE') {
      router.push('/responsable/users')
      return
    }

    // Vérifier le statut de l'utilisateur via l'API pour avoir les données complètes
    const checkStatus = async () => {
      try {
        const res = await fetch('/api/profile')
        if (res.ok) {
          const data = await res.json()
          setUser(data)

          // Si le statut devient ACTIVE, rediriger vers le dashboard approprié
          if (data.status === 'ACTIVE') {
            if (data.role === 'FORMATEUR') {
              router.push('/formateur')
            } else if (data.role === 'COORDINATEUR') {
              router.push('/coordinateur')
            } else {
              router.push('/dashboard')
            }
          }
          // Si le statut est INACTIVE mais que l'utilisateur n'est pas FORMATEUR ou COORDINATEUR, rediriger
          else if (data.status === 'INACTIVE' && data.role !== 'FORMATEUR' && data.role !== 'COORDINATEUR') {
            router.push('/dashboard')
          }
        } else {
          // Si non authentifié, rediriger vers login
          router.push('/login')
        }
      } catch (error) {
        console.error('Erreur lors de la vérification du statut:', error)
        router.push('/login')
      } finally {
        setIsLoading(false)
      }
    }

    // Seulement vérifier l'API si l'utilisateur est FORMATEUR ou COORDINATEUR
    if (session && (session.user.role === 'FORMATEUR' || session.user.role === 'COORDINATEUR')) {
      checkStatus()
    } else {
      setIsLoading(false)
    }
  }, [router, session, sessionStatus])

  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: '/login' })
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="animate-pulse">
          <div className="text-4xl mb-4">⏳</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 px-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
        {/* Icon avec animation */}
        <div className="text-6xl mb-6 animate-bounce">⏳</div>

        {/* Titre */}
        <h1 className="text-2xl font-bold text-gray-800 mb-3">
          Compte en attente d'approbation
        </h1>

        {/* Message descriptif */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-gray-700 text-sm">
            Votre compte a été créé avec succès. Un responsable examinera votre demande et vous notifiera dès que votre compte sera approuvé.
          </p>
        </div>

        {/* Informations utilisateur */}
        {user && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-gray-600 mb-2">
              <span className="font-semibold">Nom :</span> {user.name}
            </p>
            <p className="text-sm text-gray-600 mb-2">
              <span className="font-semibold">Email :</span> {user.email}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-semibold">Rôle :</span> {user.role === 'FORMATEUR' ? 'Formateur' : 'Coordinateur'}
            </p>
          </div>
        )}

        

        {/* Bouton de déconnexion */}
        <button
          onClick={handleLogout}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
        >
          Se déconnecter
        </button>

        {/* Note en bas */}
        <p className="text-xs text-gray-500 mt-6">
          Cette page se rafraîchira automatiquement. Vous pouvez consulter vos emails pour plus de détails.
        </p>
      </div>
    </div>
  )
}
