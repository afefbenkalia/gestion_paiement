'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function SessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtreFormateur, setFiltreFormateur] = useState('');
  const [filtreCoordinateur, setFiltreCoordinateur] = useState('');

  useEffect(() => {
    const fetchSessions = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (filtreFormateur) params.append('formateurId', filtreFormateur);
        if (filtreCoordinateur) params.append('coordinateurId', filtreCoordinateur);

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

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Chargement...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Liste des Sessions</h1>
        <Link
          href="/responsable/sessions/create"
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          + Nouvelle Session
        </Link>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Filtres</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="ID du formateur"
            value={filtreFormateur}
            onChange={(e) => setFiltreFormateur(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
          />
          <input
            type="text"
            placeholder="ID du coordinateur"
            value={filtreCoordinateur}
            onChange={(e) => setFiltreCoordinateur(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>
      </div>

      {/* Liste des sessions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sessions.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500">Aucune session trouvée</div>
        ) : (
          sessions.map((session) => (
            <div key={session.id} className="bg-white rounded-lg shadow p-6">
              <h3 className="text-xl font-bold mb-2">{session.titre}</h3>
              <p>Durée: {session.dureeJours} jours</p>
              <p>Heures: {session.nbHeures}h</p>
              <p>Montant: {session.montant} DT</p>
              <p>Du: {new Date(session.dateDebut).toLocaleDateString('fr-FR')}</p>
              <p>Au: {new Date(session.dateFin).toLocaleDateString('fr-FR')}</p>

              <div className="mt-3 p-3 bg-orange-50 rounded">
                <p className="text-xs text-gray-500">Formateurs</p>
                <p className="font-medium">
                  {session.formateurs || 'Non attribué'}
                </p>
              </div>

              <div className="mt-3 p-3 bg-blue-50 rounded">
                <p className="text-xs text-gray-500">Coordinateur</p>
                <p className="font-medium">{session.coordinateur || 'Non attribué'}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
