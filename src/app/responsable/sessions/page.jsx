'use client';
//app/responsable/sessions/page.jsx
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search, Calendar, User, Users, Loader2, Pencil, Trash2, X, BookOpen } from 'lucide-react';

export default function SessionsPage() {
  const [allSessions, setAllSessions] = useState([]);
  const [filteredSessions, setFilteredSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
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

  // Charger toutes les sessions une seule fois au début
  useEffect(() => {
    const fetchAllSessions = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/responsable/sessions');
        if (res.ok) {
          const data = await res.json();
          setAllSessions(data);
          setFilteredSessions(data);
        } else {
          setAllSessions([]);
          setFilteredSessions([]);
        }
      } catch (error) {
        console.error('Erreur:', error);
        setAllSessions([]);
        setFilteredSessions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAllSessions();
  }, []);

  // Filtrer les sessions localement quand le terme de recherche change
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredSessions(allSessions);
      return;
    }

    const term = searchTerm.toLowerCase().trim();
    
    const filtered = allSessions.filter(session => {
      // Recherche dans le titre
      if (session.titre?.toLowerCase().includes(term)) return true;
      
      // Recherche dans la spécialité
      if (session.specialite?.toLowerCase().includes(term)) return true;
      
      // Recherche dans le nom du coordinateur
      if (session.coordinateur?.name?.toLowerCase().includes(term)) return true;
      
      // Recherche dans les noms des formateurs
      if (Array.isArray(session.formateurs)) {
        const formateurMatch = session.formateurs.some(
          formateur => formateur.name?.toLowerCase().includes(term)
        );
        if (formateurMatch) return true;
      }
      
      // Recherche dans la classe
      if (session.classe?.toLowerCase().includes(term)) return true;
      
      // Recherche dans la promotion
      if (session.promotion?.toLowerCase().includes(term)) return true;
      
      // Recherche dans le niveau
      if (session.niveau?.toLowerCase().includes(term)) return true;
      
      // Recherche dans le semestre
      if (session.semestre?.toLowerCase().includes(term)) return true;

      return false;
    });

    setFilteredSessions(filtered);
  }, [searchTerm, allSessions]);

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
        // Mettre à jour les deux états localement
        setAllSessions((prev) => prev.filter((session) => session.id !== sessionId));
        setFilteredSessions((prev) => prev.filter((session) => session.id !== sessionId));
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

  const resetSearch = () => {
    setSearchTerm('');
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50/30 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-12"
        >
          <div className="mb-6 lg:mb-0">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">🎓 Gestion des Sessions</h1>
            <p className="text-gray-600 text-lg">Créez et gérez vos sessions de formation</p>
          </div>
          <Link
            href="/responsable/sessions/create"
            className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-6 py-3.5 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 flex items-center gap-2"
          >
            <span className="text-lg">+</span>
            Nouvelle Session
          </Link>
        </motion.div>

        {/* Search Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-200/60 p-6 mb-12 backdrop-blur-sm"
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-5">
            <div className="flex items-center gap-3 mb-4 md:mb-0">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Search className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Recherche avancée</h2>
                <p className="text-sm text-gray-500">Trouvez rapidement vos sessions</p>
              </div>
            </div>
            {searchTerm && (
              <button
                onClick={resetSearch}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <X className="w-4 h-4" />
                Effacer la recherche
              </button>
            )}
          </div>
          
          <div className="relative">
            <input
              type="text"
              placeholder="Rechercher par titre, spécialité, formateur, coordinateur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-5 py-4 pl-14 border border-gray-300 rounded-xl focus:ring-3 focus:ring-blue-200 focus:border-blue-500 focus:outline-none text-base transition-all duration-200 bg-gray-50/50"
            />
            <Search className="w-5 h-5 text-gray-400 absolute left-5 top-1/2 transform -translate-y-1/2" />
          </div>
        </motion.div>

        {/* Sessions Grid */}
        {filteredSessions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20 bg-white/80 rounded-2xl shadow-inner border border-gray-200/60"
          >
            <div className="max-w-md mx-auto">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                {searchTerm ? 'Aucune session trouvée' : 'Aucune session créée'}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm 
                  ? 'Essayez de modifier vos critères de recherche' 
                  : 'Commencez par créer votre première session de formation'
                }
              </p>
              {!searchTerm && (
                <Link
                  href="/responsable/sessions/create"
                  className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition-colors"
                >
                  <span>+</span>
                  Créer une session
                </Link>
              )}
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {filteredSessions.map((session, i) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-200/60 overflow-hidden group"
              >
                {/* Header with fixed badge */}
                <div className="p-6 pb-4 border-b border-gray-100 relative">
                  {/* Fixed Speciality Badge */}
                  {session.specialite && (
                    <div className="absolute top-4 right-4">
                      <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-sm">
                        {session.specialite}
                      </span>
                    </div>
                  )}
                  
                  <h3 className="text-xl font-bold text-gray-900 pr-20 leading-tight group-hover:text-blue-700 transition-colors">
                    {session.titre}
                  </h3>
                </div>

                {/* Content */}
                <div className="p-6">
                  {/* Date Info */}
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-4 p-3 bg-gray-50 rounded-lg">
                    <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <div className="flex flex-wrap items-center gap-1">
                      <span className="font-medium">Du</span>
                      <strong className="text-gray-900">
                        {new Date(session.dateDebut).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        }).replace('.', '')}
                      </strong>
                      <span className="font-medium">au</span>
                      <strong className="text-gray-900">
                        {new Date(session.dateFin).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        }).replace('.', '')}
                      </strong>
                    </div>
                  </div>

                  {/* Personnel Grid */}
                  <div className="grid grid-cols-1 gap-3 mb-6">
                    <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-gray-700">Coordinateur</span>
                      </div>
                      <p className="text-sm text-gray-900 font-semibold">
                        {session.coordinateur?.name || 'Non attribué'}
                      </p>
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

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-gray-100">
                    <Link
                      href={`/responsable/sessions/${session.id}`}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2.5 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200 text-center flex items-center justify-center gap-2 group/btn"
                    >
                      <span>Voir détails</span>
                      <span className="group-hover/btn:translate-x-0.5 transition-transform">→</span>
                    </Link>
                    <div className="flex gap-2">
                      <Link
                        href={`/responsable/sessions/${session.id}/edit`}
                        className="flex-1 bg-white border border-gray-300 text-gray-700 px-3 py-2.5 rounded-lg font-medium hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 text-center flex items-center justify-center gap-1"
                      >
                        <Pencil className="w-4 h-4" />
                        Modifier
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(session.id)}
                        disabled={deletingId === session.id}
                        className="flex-1 bg-white border border-red-200 text-red-600 px-3 py-2.5 rounded-lg font-medium hover:bg-red-50 hover:border-red-300 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-center flex items-center justify-center gap-1"
                      >
                        {deletingId === session.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                        {deletingId === session.id ? '...' : 'Supprimer'}
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}