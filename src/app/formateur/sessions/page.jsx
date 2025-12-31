'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar, User, Users, Loader2, BookOpen } from 'lucide-react'

export default function SessionsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [sessions, setSessions] = useState([])
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

    const fetchSessions = async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/formateur/sessions')
        if (!res.ok) throw new Error('Erreur lors de la récupération des sessions')
        const data = await res.json()
        setSessions(data || [])
      } catch (err) {
        setError(err.message || 'Erreur')
      } finally {
        setLoading(false)
      }
    }

    fetchSessions()
  }, [session, status, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <span className="ml-3 text-gray-600 font-medium">Chargement des sessions...</span>
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Mes sessions</h1>
        <p className="text-gray-600">Liste des sessions où vous intervenez</p>
      </motion.div>

      {sessions.length === 0 ? (
        <div className="text-center py-20 bg-white/80 rounded-2xl shadow-inner border border-gray-200/60">
          <div className="max-w-md mx-auto">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Aucune session trouvée</h3>
            <p className="text-gray-500 mb-6">Vous n'êtes affecté à aucune session pour l'instant.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {sessions.map((session, i) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: i * 0.06 }}
              whileHover={{ y: -5, scale: 1.02 }}
              className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-200/60 overflow-hidden group flex flex-col h-full min-h-[360px]"
            >
              <div className="p-6 pb-4 border-b border-gray-100 relative">
                {session.specialite && (
                  <div className="absolute top-3 right-3">
                    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-[11px] font-semibold bg-linear-to-r from-blue-500 to-blue-600 text-white shadow-md">
                      {session.specialite}
                    </span>
                  </div>
                )}
                <h3 className="text-xl font-bold text-gray-900 pr-28 leading-tight group-hover:text-blue-700 transition-colors">
                  {session.titre}
                </h3>
              </div>

              <div className="p-6 flex flex-col gap-4 h-full">
                <div className="flex items-center gap-2 text-sm text-gray-600 p-3 bg-gray-50 rounded-lg">
                  <Calendar className="w-4 h-4 text-gray-400 shrink-0" />
                  <div className="flex flex-wrap items-center gap-1">
                    <span className="font-medium">Du</span>
                    <strong className="text-gray-900">
                      {new Date(session.dateDebut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }).replace('.', '')}
                    </strong>
                    <span className="font-medium">au</span>
                    <strong className="text-gray-900">
                      {new Date(session.dateFin).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }).replace('.', '')}
                    </strong>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-gray-700">Coordinateur</span>
                    </div>
                    <p className="text-sm text-gray-900 font-semibold">{session.coordinateur?.name || 'Non attribué'}</p>
                  </div>

                  <div className="p-3 bg-orange-50/50 rounded-xl border border-orange-100">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-4 h-4 text-orange-600" />
                      <span className="text-sm font-medium text-gray-700">Formateurs</span>
                    </div>
                    <p className="text-sm text-gray-900 font-semibold line-clamp-2">
                      {Array.isArray(session.formateurs) && session.formateurs.length > 0
                        ? session.formateurs.map((f) => f.name).join(', ')
                        : 'Non attribué'}
                    </p>
                  </div>
                </div>


                <div className="mt-auto flex gap-2 pt-2">
                  <a
                    href={`/formateur/fiches/${session.id}`}
                    className="ml-auto bg-linear-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:opacity-95 transition-colors"
                  >
                    Voir fiche
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
