'use client';
import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SessionDetailPage({ params }) {
  const { id } = use(params);

  const router = useRouter();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formateurs, setFormateurs] = useState([]);
  const [coordinateurs, setCoordinateurs] = useState([]);
  const [selectedFormateurs, setSelectedFormateurs] = useState([]);

  useEffect(() => {
    if (id) {
      fetchSession();
      fetchUsers();
    }
  }, [id]);

  const fetchSession = async () => {
    try {
      const res = await fetch(`/api/responsable/sessions/${id}`);
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json();
      setSession(data);
      setSelectedFormateurs(data.formateurs?.map((f) => f.id) || []);
    } catch (err) {
      console.error('Erreur lors du chargement de la session:', err);
      router.push('/responsable/sessions');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const [resFormateurs, resCoord] = await Promise.all([
        fetch('/api/users?role=FORMATEUR'),
        fetch('/api/users?role=COORDINATEUR'),
      ]);

      if (resFormateurs.ok) setFormateurs(await resFormateurs.json());
      if (resCoord.ok) setCoordinateurs(await resCoord.json());
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
    }
  };

  const handleAssignCoordinateur = async (coordinateurId) => {
    try {
      const res = await fetch(`/api/responsable/sessions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coordinateurId }),
      });
      if (res.ok) {
        fetchSession();
        alert('Coordinateur mis à jour ');
      }
    } catch (err) {
      console.error('Erreur:', err);
    }
  };

  const handleAssignFormateurs = async () => {
    try {
      const res = await fetch(`/api/responsable/sessions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formateurIds: selectedFormateurs }),
      });
      if (res.ok) {
        fetchSession();
        alert('Formateurs assignés avec succès ✅');
      }
    } catch (err) {
      console.error('Erreur:', err);
    }
  };

  if (loading) return <div className="text-center py-10">Chargement...</div>;

  if (!session)
    return (
      <div className="text-center py-10 text-red-600">
        Session non trouvée 
      </div>
    );

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <Link
        href="/responsable/sessions"
        className="text-blue-600 hover:underline mb-4 block"
      >
        ← Retour aux sessions
      </Link>

      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h1 className="text-3xl font-bold mb-4">{session.titre}</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Date début</p>
            <p>{new Date(session.dateDebut).toLocaleDateString('fr-FR')}</p>
          </div>
          <div>
            <p className="text-gray-500">Date fin</p>
            <p>{new Date(session.dateFin).toLocaleDateString('fr-FR')}</p>
          </div>
          <div>
            <p className="text-gray-500">Durée</p>
            <p>{session.dureeJours} jours</p>
          </div>
          <div>
            <p className="text-gray-500">Heures</p>
            <p>{session.nbHeures}h</p>
          </div>
        </div>

      
      </div>

      {/* COORDINATEUR */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-3">Coordinateur</h2>
        {session.coordinateur ? (
          <div className="flex items-center justify-between bg-blue-50 p-3 rounded">
            <div>
              <p className="font-semibold">{session.coordinateur.name}</p>
              <p className="text-sm text-gray-600">
                {session.coordinateur.email}
              </p>
            </div>
            <button
              onClick={() => handleAssignCoordinateur(null)}
              className="text-red-600 hover:underline text-sm"
            >
              Retirer
            </button>
          </div>
        ) : (
          <select
            onChange={(e) => handleAssignCoordinateur(parseInt(e.target.value))}
            className="w-full border rounded px-3 py-2"
          >
            <option value="">Sélectionner un coordinateur</option>
            {coordinateurs.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} - {c.email}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* FORMATEURS */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-3">Formateurs</h2>
        <select
          multiple
          value={selectedFormateurs}
          onChange={(e) => {
            const selected = Array.from(e.target.selectedOptions, (o) =>
              parseInt(o.value)
            );
            setSelectedFormateurs(selected);
          }}
          className="w-full border rounded px-3 py-2 h-40"
        >
          {formateurs.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name} - {f.email}
            </option>
          ))}
        </select>

        <button
          onClick={handleAssignFormateurs}
          className="mt-4 bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded"
        >
           Sauvegarder les formateurs
        </button>

        {session.formateurs?.length > 0 && (
          <div className="mt-6">
            <h3 className="font-semibold mb-2">Formateurs actuels :</h3>
            <ul className="list-disc ml-6">
              {session.formateurs.map((f) => (
                <li key={f.id}>
                  {f.name} — <span className="text-sm text-gray-600">{f.email}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* FICHE DE PAIE */}
      {session.fiche && (
        <div className="bg-white shadow rounded-lg p-6 mt-6">
          <h2 className="text-xl font-semibold mb-3">Fiche associée</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Spécialité</p>
              <p>{session.fiche.specialite}</p>
            </div>
            <div>
              <p className="text-gray-500">Période</p>
              <p>{session.fiche.periode}</p>
            </div>
          </div>
          <Link
            href={`/responsable/fiches/${session.fiche.id}`}
            className="mt-4 inline-block bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded"
          >
            Voir la fiche complète
          </Link>
        </div>
      )}
    </div>
  );
}
