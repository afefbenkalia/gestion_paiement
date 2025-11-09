'use client';

import Link from 'next/link';

export default function FormateursPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Formateurs</h1>
        <p className="text-gray-600">Gérer les formateurs</p>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500">Page de gestion des formateurs en cours de développement...</p>
        <Link href="/responsable/users" className="text-blue-600 hover:underline mt-4 inline-block">
          Voir la liste des utilisateurs →
        </Link>
      </div>
    </div>
  );
}

