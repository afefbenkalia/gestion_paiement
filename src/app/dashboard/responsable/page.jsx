'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ResponsableSidebar } from '@/components/responsable-sidebar';

export default function ResponsableDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'RESPONSABLE') {
      router.push('/dashboard');
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== 'RESPONSABLE') {
    return null;
  }

  const userName = session.user.name || 'Responsable';

  return (
    <div className="flex min-h-screen bg-gray-50">
      <ResponsableSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">
          <header className="space-y-2">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide">
              Tableau de bord Responsable
            </p>
            <h1 className="text-3xl font-bold text-gray-900">Bienvenue, {userName} </h1>
            <p className="text-gray-600">
              Consultez les principales fonctionnalités de gestion et suivez l’activité de vos sessions,
              formateurs et coordinateurs.
            </p>
          </header>

         
        </div>
      </main>
    </div>
  );
}
