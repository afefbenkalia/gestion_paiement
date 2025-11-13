'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search, Calendar, User, Users, Loader2, Pencil, Trash2 } from 'lucide-react';

export default function SessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtreFormateur, setFiltreFormateur] = useState('');
  const [filtreCoordinateur, setFiltreCoordinateur] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const formatDuration = (start, end) => {
    if (!start || !end) return 'N/A';
    try {
      const s = new Date(start);
      const e = new Date(end);
      if (isNaN(s) || isNaN(e)) return 'N/A';

      const msPerDay = 1000 * 60 * 60 * 24;
      const days = Math.round((e - s) / msPerDay);

      let months = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth());
      if (e.getDate() < s.getDate()) months -= 1;

      if (months >= 1) {
        const mid = new Date(s.getFullYear(), s.getMonth() + months, s.getDate());
        let remainingDays = Math.round((e - mid) / msPerDay);
        if (isNaN(remainingDays) || remainingDays < 0) remainingDays = 0;
        return remainingDays > 0 ? `${months} mois et ${remainingDays} jours` : `${months} mois`;
      }
      return `${days} jours`;
    } catch {
      return 'N/A';
    }
  };

  useEffect(() => {
    const fetchSessions = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (filtreFormateur.trim()) params.append('formateurName', filtreFormateur.trim());
        if (filtreCoordinateur.trim()) params.append('coordinateurName', filtreCoordinateur.trim());

        const res = await fetch(`/api/responsable/sessions?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setSessions(data);
        } else {
          setSessions([]);
        }
      } catch (error) {
        console.error('Erreur:', error);
        setSessions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [filtreFormateur, filtreCoordinateur]);

  const handleDelete = async (sessionId) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette session ?')) {
      return;
    }

    setDeletingId(sessionId);
    try {
      const res = await fetch(`/api/responsable/sessions/${sessionId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setSessions((prev) => prev.filter((session) => session.id !== sessionId));
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Erreur lors de la suppression de la session ❌');
      }
    } catch (error) {
      console.error('Erreur suppression session:', error);
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <span className="ml-3 text-gray-600 font-medium">Chargement des sessions...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <h1 className="text-3xl font-extrabold text-gray-800 mb-4 md:mb-0">🎓 Gestion des Sessions</h1>
        <Link
          href="/responsable/sessions/create"
          className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-md hover:shadow-lg transition-transform transform hover:scale-105"
        >
          + Nouvelle Session
        </Link>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white/80 backdrop-blur-md rounded-2xl shadow p-6 mb-10 border border-gray-100"
      >
        <h2 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <Search className="w-5 h-5 text-gray-500" /> Filtres de recherche
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Nom du formateur</label>
            <input
              type="text"
              placeholder="Ex: Ahmed, Mariem..."
              value={filtreFormateur}
              onChange={(e) => setFiltreFormateur(e.target.value)}
              className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-sm text-gray-600 mb-1 block">Nom du coordinateur</label>
            <input
              type="text"
              placeholder="Ex: Sami, Asma..."
              value={filtreCoordinateur}
              onChange={(e) => setFiltreCoordinateur(e.target.value)}
              className="w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-400 focus:outline-none"
            />
          </div>
        </div>
      </motion.div>

      {sessions.length === 0 ? (
        <div className="text-center text-gray-500 py-20 bg-white/60 rounded-2xl shadow-inner">
          <p className="text-lg">Aucune session trouvée 😕</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessions.map((session, i) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-shadow border border-gray-100 overflow-hidden"
            >
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-1">{session.titre}</h3>
                <p className="text-sm text-gray-500 mb-4 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  Du <strong>{new Date(session.dateDebut).toLocaleDateString('fr-FR')}</strong> au{' '}
                  <strong>{new Date(session.dateFin).toLocaleDateString('fr-FR')}</strong>
                </p>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 bg-blue-50 rounded-xl">
                    <p className="text-gray-500 flex items-center gap-1">
                      <User className="w-4 h-4 text-blue-500" /> Coordinateur
                    </p>
                    <p className="font-medium text-gray-800">
                      {session.coordinateur?.name || 'Non attribué'}
                    </p>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-xl">
                    <p className="text-gray-500 flex items-center gap-1">
                      <Users className="w-4 h-4 text-orange-500" /> Formateurs
                    </p>
                    <p className="font-medium text-gray-800">
                      {Array.isArray(session.formateurs) && session.formateurs.length > 0
                        ? session.formateurs.map((f) => f.name).join(', ')
                        : 'Non attribué'}
                    </p>
                  </div>
                </div>

                <div className="mt-4 border-t pt-3 text-sm text-gray-600">
                  <p>
                    Durée :{' '}
                    <span className="font-semibold text-gray-800">
                      {formatDuration(session.dateDebut, session.dateFin)}
                    </span>
                  </p>
                  <p>
                    Heures : <span className="font-semibold">{session.nbHeures}h</span>
                  </p>
                </div>

                <div className="mt-6 flex justify-end">
                  <div className="flex gap-2">
                    <Link
                      href={`/responsable/sessions/${session.id}`}
                      className="text-sm bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg shadow hover:scale-105 transition-transform flex items-center gap-1"
                    >
                      Voir détails →
                    </Link>
                    <Link
                      href={`/responsable/sessions/${session.id}/edit`}
                      className="text-sm bg-white border border-blue-500 text-blue-600 px-4 py-2 rounded-lg shadow hover:bg-blue-50 transition-colors flex items-center gap-2"
                    >
                      <Pencil className="w-4 h-4" />
                      Modifier
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleDelete(session.id)}
                      disabled={deletingId === session.id}
                      className="text-sm bg-red-500 text-white px-4 py-2 rounded-lg shadow hover:bg-red-600 transition-colors flex items-center gap-2 disabled:opacity-70"
                    >
                      <Trash2 className="w-4 h-4" />
                      {deletingId === session.id ? 'Suppression...' : 'Supprimer'}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
