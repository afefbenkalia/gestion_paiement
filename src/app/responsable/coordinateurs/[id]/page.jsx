'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Mail, Phone, MapPin, Calendar, Edit, Download } from 'lucide-react';
import Link from 'next/link';

export default function CoordinateurDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [coordinateur, setCoordinateur] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('toutes');

  useEffect(() => {
    if (params.id) {
      fetchCoordinateurDetails();
    }
  }, [params.id]);

  const fetchCoordinateurDetails = async () => {
    try {
      setLoading(true);
      const [userRes, sessionsRes] = await Promise.all([
        fetch(`/api/responsable/users/${params.id}`),
        fetch(`/api/responsable/sessions?coordinateurId=${params.id}`),
      ]);

      if (userRes.ok) {
        const userData = await userRes.json();
        setCoordinateur(userData);
      }

      if (sessionsRes.ok) {
        const sessionsData = await sessionsRes.json();
        setSessions(sessionsData);
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl">Chargement...</div>
      </div>
    );
  }

  if (!coordinateur) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <p className="text-xl mb-4">Coordinateur non trouvé</p>
        <Link href="/responsable/coordinateurs" className="text-blue-600 hover:underline">
          Retour à la liste
        </Link>
      </div>
    );
  }

  const getInitials = (name) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getSessionStatus = (session) => {
    const now = new Date();
    const start = new Date(session.dateDebut);
    const end = new Date(session.dateFin);

    if (now < start) return 'À venir';
    if (now > end) return 'Terminée';
    return 'En cours';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'En cours':
        return 'bg-green-100 text-green-700';
      case 'Terminée':
        return 'bg-gray-100 text-gray-700';
      case 'À venir':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-blue-100 text-blue-700';
    }
  };

  const filteredSessions = sessions.filter((session) => {
    const status = getSessionStatus(session);
    if (activeTab === 'toutes') return true;
    if (activeTab === 'en-cours') return status === 'En cours';
    if (activeTab === 'terminees') return status === 'Terminée';
    if (activeTab === 'a-venir') return status === 'À venir';
    return true;
  });

  const totalFormations = sessions.length;

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      {/* Header */}
      <h1 className="text-3xl font-bold mb-8">Détails du Coordinateur</h1>

      {/* Profile Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Left Card - Profile Info */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold mb-4">
              {getInitials(coordinateur.name)}
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">{coordinateur.name}</h2>
            <p className="text-sm text-gray-500 mb-6">Coordinateur</p>

            <div className="w-full space-y-3 mb-6">
              {coordinateur.email && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="w-4 h-4 text-blue-500" />
                  <span className="truncate">{coordinateur.email}</span>
                </div>
              )}
              {coordinateur.tel && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="w-4 h-4 text-blue-500" />
                  <span>{coordinateur.tel}</span>
                </div>
              )}
              {coordinateur.specialite && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4 text-blue-500" />
                  <span>{coordinateur.specialite}</span>
                </div>
              )}
              {coordinateur.createdAt && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  <span>Membre depuis {new Date(coordinateur.createdAt).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}</span>
                </div>
              )}
            </div>

            <Link
              href={`/responsable/coordinateurs/${params.id}/profile`}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition"
            >
              <Edit className="w-4 h-4" />
              Modifier le profil
            </Link>

            {coordinateur.cv && (
              <a
                href={coordinateur.cv}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="w-full mt-3 bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition"
              >
                <Download className="w-4 h-4" />
                Télécharger CV
              </a>
            )}
          </div>
        </div>

        {/* Right Cards - Stats */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-500 mb-2">Sessions assignées</h3>
            <div className="flex flex-col items-center justify-center py-6">
              <div className="text-5xl font-bold text-gray-900 mb-2">{totalFormations}</div>
              <div className="text-sm text-gray-500">Session{totalFormations > 1 ? 's' : ''}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Sessions History */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Historique des Sessions</h2>
          <div className="text-sm text-gray-500">{sessions.length} session{sessions.length > 1 ? 's' : ''} au total</div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('toutes')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
              activeTab === 'toutes'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Toutes
          </button>
          <button
            onClick={() => setActiveTab('en-cours')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
              activeTab === 'en-cours'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            En cours
          </button>
          <button
            onClick={() => setActiveTab('terminees')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
              activeTab === 'terminees'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Terminées
          </button>
          <button
            onClick={() => setActiveTab('a-venir')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
              activeTab === 'a-venir'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            À venir
          </button>
        </div>

        {/* Sessions List */}
        {filteredSessions.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Aucune formation trouvée pour ce filtre
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSessions.map((session) => {
              const status = getSessionStatus(session);
              const now = new Date();
              const start = new Date(session.dateDebut);
              const end = new Date(session.dateFin);
              
              // Calcul de la durée en mois et jours
              const yearsDiff = end.getFullYear() - start.getFullYear();
              const monthsDiff = end.getMonth() - start.getMonth();
              const totalMonths = yearsDiff * 12 + monthsDiff;
              
              // Calculer les jours restants
              const dayStart = start.getDate();
              const dayEnd = end.getDate();
              const extraDays = dayEnd >= dayStart ? dayEnd - dayStart : 0;
              
              let dureeText = '';
              if (totalMonths > 0) {
                dureeText = `${totalMonths} mois`;
                if (extraDays > 0) {
                  dureeText += ` et ${extraDays} jour${extraDays > 1 ? 's' : ''}`;
                }
              } else {
                const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
                dureeText = `${totalDays} jour${totalDays > 1 ? 's' : ''}`;
              }
              
              // Calcul de la progression réelle
              let progression = 0;
              if (status === 'Terminée') {
                progression = 100;
              } else if (status === 'En cours') {
                const elapsed = now - start;
                const total = end - start;
                progression = Math.min(Math.round((elapsed / total) * 100), 99);
              } else {
                progression = 0; // À venir: pas de progression
              }

              return (
                <div
                  key={session.id}
                  className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">{session.titre}</h3>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                        status
                      )}`}
                    >
                      {status}
                    </span>
                  </div>

                  <p className="text-sm text-gray-600 mb-4">
                    {new Date(session.dateDebut).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}{' '}
                    -{' '}
                    {new Date(session.dateFin).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>

                  <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
                    <div>
                      <span className="text-gray-500">Durée</span>
                      <p className="font-medium">{dureeText}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Formateurs</span>
                      <p className="font-medium">{session.formateurs?.length || 0}</p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  {status !== 'À venir' && (
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Progression</span>
                        <span>{progression}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            status === 'Terminée' ? 'bg-green-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${progression}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <Link
                    href={`/responsable/sessions/${session.id}`}
                    className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-2 rounded-lg text-sm font-medium transition"
                  >
                    Voir détails
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
