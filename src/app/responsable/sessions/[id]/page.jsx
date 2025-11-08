'use client';
//responsable/sessions/[id]/page.jsx
import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SessionDetailPage({ params }) {
  const router = useRouter();
  const { id } = use(params);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formateurs, setFormateurs] = useState([]);
  const [coordinateurs, setCoordinateurs] = useState([]);

  useEffect(() => {
    fetchSession();
    fetchUsers();
  }, [id]);

  const fetchSession = async () => {
    try {
      const res = await fetch(`/api/responsable/sessions/${id}`);
      if (res.ok) {
        const data = await res.json();
        console.log('Session récupérée:', data);
        setSession(data);
      } else {
        console.error('Erreur lors de la récupération de la session:', res.status);
        router.push('/responsable/sessions');
      }
    } catch (error) {
      console.error('Erreur lors de la récupération de la session:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      // Récupérer les formateurs
      const resFormateurs = await fetch('/api/users?role=FORMATEUR');
      if (resFormateurs.ok) {
        const dataFormateurs = await resFormateurs.json();
        console.log('Formateurs récupérés:', dataFormateurs);
        setFormateurs(dataFormateurs);
      } else {
        console.error('Erreur lors de la récupération des formateurs:', resFormateurs.status);
      }

      // Récupérer les coordinateurs
      const resCoord = await fetch('/api/users?role=COORDINATEUR');
      if (resCoord.ok) {
        const dataCoord = await resCoord.json();
        console.log('Coordinateurs récupérés:', dataCoord);
        setCoordinateurs(dataCoord);
      } else {
        console.error('Erreur lors de la récupération des coordinateurs:', resCoord.status);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
    }
  };

  const handleAssignFormateur = async (formateurId) => {
    try {
      const res = await fetch(`/api/responsable/sessions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formateurId: parseInt(formateurId) }),
      });

      if (res.ok) {
        fetchSession();
        alert('Formateur assigné avec succès');
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleAssignCoordinateur = async (coordinateurId) => {
    try {
      const res = await fetch(`/api/responsable/sessions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coordinateurId: parseInt(coordinateurId) }),
      });

      if (res.ok) {
        fetchSession();
        alert('Coordinateur assigné avec succès');
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl">Chargement...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl">Session non trouvée</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link href="/responsable/sessions" className="text-blue-600 hover:underline">
          ← Retour aux sessions
        </Link>
      </div>

      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h1 className="text-3xl font-bold mb-4">{session.titre}</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-500">Date de début</p>
            <p className="font-semibold">
              {new Date(session.dateDebut).toLocaleDateString('fr-FR')}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Date de fin</p>
            <p className="font-semibold">
              {new Date(session.dateFin).toLocaleDateString('fr-FR')}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Durée</p>
            <p className="font-semibold">{session.dureeJours} jours</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Nombre d'heures</p>
            <p className="font-semibold">{session.nbHeures}h</p>
          </div>
        </div>

        <div className="mt-4 p-4 bg-green-50 rounded">
          <p className="text-sm text-gray-500">Montant total</p>
          <p className="text-2xl font-bold text-green-600">{session.montant} DT</p>
        </div>
      </div>

      {/* Coordinateur assigné */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Coordinateur</h2>
        
        {session.coordinateur ? (
          <div className="flex items-center gap-4 p-4 bg-blue-50 rounded">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
              {session.coordinateur.name.substring(0, 2).toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="font-semibold">{session.coordinateur.name}</p>
              <p className="text-sm text-gray-600">{session.coordinateur.email}</p>
            </div>
            <button
              onClick={() => handleAssignCoordinateur(null)}
              className="text-red-600 hover:underline text-sm"
            >
              Retirer
            </button>
          </div>
        ) : (
          <div>
            <p className="text-gray-500 mb-4">Aucun coordinateur assigné</p>
            {coordinateurs.length === 0 ? (
              <p className="text-gray-400 italic">Aucun coordinateur disponible</p>
            ) : (
              <select
                onChange={(e) => handleAssignCoordinateur(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
              >
                <option value="">Sélectionner un coordinateur</option>
                {coordinateurs.map((coord) => (
                  <option key={coord.id} value={coord.id}>
                    {coord.name} - {coord.email}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}
      </div>

      {/* Formateurs assignés */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Formateurs assignés</h2>
        
        {session.formateur ? (
          <div className="flex items-center gap-4 p-4 bg-orange-50 rounded mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
              {session.formateur.name.substring(0, 2).toUpperCase()}
            </div>
            <div className="flex-1">
              <p className="font-semibold">{session.formateur.name}</p>
              <p className="text-sm text-gray-600">{session.formateur.email}</p>
              {session.formateur.cv && (
                <a
                  href={session.formateur.cv}
                  target="_blank"
                  className="text-blue-600 text-sm hover:underline"
                >
                  📄 Télécharger CV
                </a>
              )}
            </div>
            <button
              onClick={() => handleAssignFormateur(null)}
              className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              Retirer
            </button>
          </div>
        ) : (
          <div>
            <p className="text-gray-500 mb-4">Aucun formateur assigné</p>
            {formateurs.length === 0 ? (
              <p className="text-gray-400 italic">Aucun formateur disponible</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {formateurs.map((formateur) => (
                <div
                  key={formateur.id}
                  className="border rounded-lg p-4 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center text-white font-bold">
                      {formateur.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold">{formateur.name}</p>
                      <p className="text-sm text-gray-600">{formateur.email}</p>
                    </div>
                  </div>
                  {formateur.cv && (
                    <a
                      href={formateur.cv}
                      target="_blank"
                      className="text-blue-600 text-sm hover:underline block mb-2"
                    >
                      📄 Voir CV
                    </a>
                  )}
                  <button
                    onClick={() => handleAssignFormateur(formateur.id)}
                    className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  >
                    Accepter
                  </button>
                </div>
              ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Fiche de paie associée */}
      {session.fiche && (
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h2 className="text-xl font-bold mb-4">Fiche de paie associée</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Numéro mémoire</p>
              <p className="font-semibold">{session.fiche.numMemoire}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Spécialité</p>
              <p className="font-semibold">{session.fiche.specialite}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Niveau</p>
              <p className="font-semibold">{session.fiche.niveau}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Période</p>
              <p className="font-semibold">{session.fiche.periode}</p>
            </div>
          </div>
          <Link
            href={`/responsable/fiches/${session.fiche.id}`}
            className="mt-4 inline-block bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            Voir la fiche complète
          </Link>
        </div>
      )}
    </div>
  );
}