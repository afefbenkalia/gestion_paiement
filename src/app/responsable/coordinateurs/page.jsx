'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Mail, Phone, Calendar, BookOpen, Eye } from 'lucide-react';

export default function CoordinateursPage() {
  const [coordinateurs, setCoordinateurs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCoordinateurs();
  }, []);

  const fetchCoordinateurs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ role: 'COORDINATEUR', status: 'ACTIVE' });

      const res = await fetch(`/api/responsable/users?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setCoordinateurs(data);
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeSinceCreation = (createdAt) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now - created);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const months = (now.getFullYear() - created.getFullYear()) * 12 + (now.getMonth() - created.getMonth());
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;

    if (months < 1) {
      return `${diffDays} jour${diffDays > 1 ? 's' : ''}`;
    }
    if (years > 0) {
      return remainingMonths > 0 ? `${years} an${years > 1 ? 's' : ''} ${remainingMonths} mois` : `${years} an${years > 1 ? 's' : ''}`;
    }
    return `${months} mois`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Coordinateurs</h1>
        <p className="text-gray-600">Liste des coordinateurs actifs ({coordinateurs.length})</p>
      </div>

      {/* Cards Grid */}
      {coordinateurs.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          Aucun coordinateur actif trouvé
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coordinateurs.map((coordinateur) => (
            <div
              key={coordinateur.id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200 overflow-hidden"
            >
              <div className="bg-linear-to-r from-blue-500 to-blue-600 px-6 py-4">
                <div className="flex items-start justify-between">
                  <h3 className="text-xl font-bold text-white truncate">
                    {coordinateur.name}
                  </h3>
                  <span className="px-2 py-1 text-xs font-semibold rounded-full bg-white bg-opacity-20 text-blue-500">
                    {getTimeSinceCreation(coordinateur.createdAt)}
                  </span>
                </div>
              </div>
              <div className="p-6 space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="h-4 w-4 text-gray-400 shrink-0" />
                  <span className="truncate">{coordinateur.email}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone className="h-4 w-4 text-gray-400 shrink-0" />
                  <span>{coordinateur.tel || 'Non renseigné'}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <BookOpen className="h-4 w-4 text-gray-400 shrink-0" />
                  <span className="font-medium text-blue-600">
                    {coordinateur.sessionCount} session{coordinateur.sessionCount > 1 ? 's' : ''} assignée{coordinateur.sessionCount > 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              <div className="px-6 pb-6">
                <Link
                  href={`/responsable/coordinateurs/${coordinateur.id}`}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                >
                  <Eye className="h-4 w-4" />
                  Voir détails
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

