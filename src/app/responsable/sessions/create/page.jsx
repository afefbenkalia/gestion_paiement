'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateSessionPage() {
  const router = useRouter();

  const [titre, setTitre] = useState('');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [nbHeures, setNbHeures] = useState('');
  const [formateurIds, setFormateurIds] = useState([]); // multiple select
  const [coordinateurId, setCoordinateurId] = useState('');

  const [formateurs, setFormateurs] = useState([]);
  const [coordinateurs, setCoordinateurs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const [formateursRes, coordRes] = await Promise.all([
          fetch('/api/users?role=FORMATEUR'),
          fetch('/api/users?role=COORDINATEUR'),
        ]);

        if (formateursRes.ok && coordRes.ok) {
          const formateursData = await formateursRes.json();
          const coordData = await coordRes.json();
          setFormateurs(formateursData);
          setCoordinateurs(coordData);
        }
      } catch (error) {
        console.error('Erreur chargement utilisateurs:', error);
      }
    }
    fetchUsers();
  }, []);

  const handleFormateursChange = (e) => {
    const options = e.target.options;
    const selected = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) selected.push(options[i].value);
    }
    setFormateurIds(selected);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/responsable/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titre,
          dateDebut,
          dateFin,
          nbHeures,
          formateurIds,
          coordinateurId,
        }),
      });

      if (res.ok) {
        alert('Session créée avec succès ✅');
        router.push('/responsable/sessions');
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Erreur lors de la création de la session ❌');
      }
    } catch (error) {
      console.error('Erreur création session:', error);
      alert('Erreur interne du serveur.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-8">Créer une nouvelle session</h1>

      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
        <div>
          <label className="block font-medium mb-1">Titre</label>
          <input
            type="text"
            value={titre}
            onChange={(e) => setTitre(e.target.value)}
            required
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-medium mb-1">Date début</label>
            <input
              type="date"
              value={dateDebut}
              onChange={(e) => setDateDebut(e.target.value)}
              required
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          <div>
            <label className="block font-medium mb-1">Date fin</label>
            <input
              type="date"
              value={dateFin}
              onChange={(e) => setDateFin(e.target.value)}
              required
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>
        </div>

        <div>
          <label className="block font-medium mb-1">Nombre d'heures</label>
          <input
            type="number"
            value={nbHeures}
            onChange={(e) => setNbHeures(e.target.value)}
            required
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Formateurs multiple select */}
          <div>
            <label className="block font-medium mb-1">Formateurs</label>
            <select
              multiple
              value={formateurIds}
              onChange={handleFormateursChange}
              className="w-full border rounded-lg px-3 py-2"
            >
              {formateurs.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          {/* Coordinateur single select */}
          <div>
            <label className="block font-medium mb-1">Coordinateur</label>
            <select
              value={coordinateurId}
              onChange={(e) => setCoordinateurId(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">-- Aucun --</option>
              {coordinateurs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
        >
          {loading ? 'Création...' : 'Créer la session'}
        </button>
      </form>
    </div>
  );
}
