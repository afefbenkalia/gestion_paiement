'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ResponsableSidebar } from '@/components/responsable-sidebar';
import { Calendar, Users, User, Bell, Trash2, Trash } from 'lucide-react';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { Line } from 'react-chartjs-2';
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

export default function ResponsableDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState({ sessions: 0, coordinateurs: 0, formateurs: 0 });
  const [loadingStats, setLoadingStats] = useState(true);
  const [notifOpen, setNotifOpen] = useState(false);
  const [pending, setPending] = useState([]);
  const [readIds, setReadIds] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('notif_read_ids');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [deletedIds, setDeletedIds] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('notif_deleted_ids');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [paymentRange, setPaymentRange] = useState('week');

  const paymentSeries = useMemo(
    () => ({
      week: {
        labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
        paid: [1200, 1850, 2100, 2450, 3000, 3420, 3800],
        pending: [400, 350, 300, 250, 200, 180, 150],
      },
      month: {
        labels: ['S1', 'S2', 'S3', 'S4'],
        paid: [8200, 12350, 16800, 21250],
        pending: [1600, 1450, 1100, 950],
      },
      year: {
        labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jui', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'],
        paid: [5200, 7600, 9800, 12500, 14500, 16800, 19300, 21400, 23800, 26200, 28500, 31200],
        pending: [2100, 1800, 1600, 1500, 1400, 1300, 1200, 1100, 1000, 900, 850, 800],
      },
    }),
    [],
  );

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          position: 'top',
          labels: { boxWidth: 12, color: '#0f172a' },
        },
        tooltip: {
          callbacks: {
            label: (ctx) => `${ctx.dataset.label}: ${ctx.parsed.y.toLocaleString('fr-FR')} TND`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#334155' },
        },
        y: {
          beginAtZero: true,
          grid: { color: '#f1f5f9' },
          ticks: {
            color: '#334155',
            callback: (value) => `${Number(value).toLocaleString('fr-FR')} TND`,
          },
        },
      },
    }),
    [],
  );

  const chartData = useMemo(() => {
    const serie = paymentSeries[paymentRange];
    return {
      labels: serie.labels,
      datasets: [
        {
          label: 'Payé',
          data: serie.paid,
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37, 99, 235, 0.15)',
          pointBackgroundColor: '#1d4ed8',
          tension: 0.35,
          fill: true,
        },
        {
          label: 'En attente',
          data: serie.pending,
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245, 158, 11, 0.18)',
          pointBackgroundColor: '#d97706',
          borderDash: [6, 4],
          tension: 0.35,
          fill: true,
        },
      ],
    };
  }, [paymentRange, paymentSeries]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'RESPONSABLE') {
      router.push('/dashboard');
    }
  }, [session, status, router]);

  // Fetch stats and pending users when authenticated as RESPONSABLE
  useEffect(() => {
    const fetchAll = async () => {
      try {
        if (status !== 'authenticated' || session?.user?.role !== 'RESPONSABLE') return;
        setLoadingStats(true);
        const [sessionsRes, coordsRes, formsRes, pendingRes] = await Promise.all([
          fetch('/api/responsable/sessions'),
          fetch('/api/users?role=COORDINATEUR'),
          fetch('/api/users?role=FORMATEUR'),
          fetch('/api/recent-users'),
        ]);

        const sessions = sessionsRes.ok ? await sessionsRes.json() : [];
        const coords = coordsRes.ok ? await coordsRes.json() : [];
        const forms = formsRes.ok ? await formsRes.json() : [];
        const pend = pendingRes.ok ? await pendingRes.json() : [];

        setStats({ sessions: sessions.length, coordinateurs: coords.length, formateurs: forms.length });
        const list = Array.isArray(pend) ? pend : [];
        const filtered = list.filter(u => !deletedIds.includes(u.id));
        setPending(filtered);
      } catch (e) {
        toast.error("Impossible de charger les statistiques");
      } finally {
        setLoadingStats(false);
      }
    };
    fetchAll();
  }, [status, session, deletedIds]);

  // Lightweight polling for "real-time" notifications, only when authorized
  useEffect(() => {
    if (status !== 'authenticated' || session?.user?.role !== 'RESPONSABLE') return;
    let mounted = true;
    const timer = setInterval(async () => {
      try {
        const res = await fetch('/api/recent-users');
        if (!res.ok) return;
        const list = await res.json();
        if (!mounted) return;
        const next = Array.isArray(list) ? list.filter(u => !deletedIds.includes(u.id)) : [];
        if (next.length > pending.length) {
          toast.info(`${next.length - pending.length} nouvelle(s) inscription(s)`);
        }
        setPending(next);
      } catch (_) {
        // ignore
      }
    }, 20000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [pending.length, status, session, deletedIds]);

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

  const unreadCount = pending.filter(p => !readIds.includes(p.id)).length;

  const formatRelativeTime = (dateStr) => {
    const d = new Date(dateStr);
    const diffMs = Date.now() - d.getTime();
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return 'à l’instant';
    if (minutes < 60) return `${minutes} min`; 
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} j`;
    return d.toLocaleDateString();
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <ResponsableSidebar />
      <main className="flex-1 overflow-y-auto">
        <Toaster richColors position="top-right" />
        <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
          <header className="flex items-start justify-between gap-4">
            <div className="space-y-2">
            <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide">
              Tableau de bord Responsable
            </p>
            <h1 className="text-3xl font-bold text-gray-900">Bienvenue, {userName} </h1>
            <p className="text-gray-600">
              Consultez les principales fonctionnalités de gestion et suivez l’activité de vos sessions,
              formateurs et coordinateurs.
            </p>
            </div>

            {/* Notifications */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotifOpen((v) => !v)}
                className="relative rounded-full p-2 bg-white shadow border hover:shadow-md transition"
                aria-label="Notifications"
              >
                <Bell className="w-5 h-5 text-gray-700" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] rounded-full px-1.5 py-0.5">
                    {unreadCount}
                  </span>
                )}
              </button>
              {notifOpen && (
                <div className="absolute right-0 mt-2 w-96 bg-white border rounded-xl shadow-xl z-10">
                  <div className="flex items-center justify-between p-2 border-b">
                    <div className="text-sm font-semibold">Nouveaux inscrits</div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          const newReadIds = pending.map(p => p.id);
                          setReadIds(newReadIds);
                          localStorage.setItem('notif_read_ids', JSON.stringify(newReadIds));
                        }}
                        className="text-xs text-blue-600 hover:text-blue-700"
                        aria-label="Marquer comme lus"
                        >
                        Marquer comme lus
                        </button>
                        <button
                        type="button"
                        onClick={() => {
                          const allIds = pending.map(p => p.id);
                          const newDeletedIds = Array.from(new Set([...(deletedIds || []), ...allIds]));
                          const newReadIds = Array.from(new Set([...(readIds || []), ...allIds]));
                          setPending([]);
                          setDeletedIds(newDeletedIds);
                          setReadIds(newReadIds);
                          localStorage.setItem('notif_deleted_ids', JSON.stringify(newDeletedIds));
                          localStorage.setItem('notif_read_ids', JSON.stringify(newReadIds));
                        }}
                        className="text-red-600 hover:text-red-700 p-1"
                        aria-label="Supprimer tout"
                        >
                        <Trash className="w-4 h-4" />
                        </button>
                      </div>
                      </div>
                      <div className="max-h-80 overflow-y-auto">
                      {pending.length === 0 ? (
                        <div className="p-4 text-sm text-gray-500">Aucune nouvelle inscription</div>
                      ) : (
                        pending.map((u) => {
                        const read = readIds.includes(u.id);
                        return (
                          <div
                            key={u.id}
                            className={`flex items-start gap-3 px-4 py-3 border-b last:border-0 hover:bg-gray-50 ${read ? '' : 'bg-blue-50/40'}`}
                          >
                            <div className={`h-9 w-9 rounded-full flex items-center justify-center ${read ? 'bg-gray-200' : 'bg-blue-600'} text-white font-semibold shrink-0`}>
                              {(u.name || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <div className="text-sm">
                                <span className={`font-semibold ${read ? 'text-gray-900' : 'text-blue-800'}`}>{u.name || 'Utilisateur'}</span>
                                <span className="text-gray-700"> a créé un compte</span>
                              </div>
                              <div className="text-xs text-gray-500 mt-0.5">
                                {u.email} • {u.createdAt ? formatRelativeTime(u.createdAt) : ''}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {!read && <span className="h-2 w-2 rounded-full bg-blue-600" />}
                              <button
                                type="button"
                                onClick={() => {
                                  const newPending = pending.filter(p => p.id !== u.id);
                                  const newReadIds = readIds.filter(id => id !== u.id);
                                  const newDeletedIds = Array.from(new Set([...(deletedIds || []), u.id]));
                                  setPending(newPending);
                                  setReadIds(newReadIds);
                                  setDeletedIds(newDeletedIds);
                                  localStorage.setItem('notif_read_ids', JSON.stringify(newReadIds));
                                  localStorage.setItem('notif_deleted_ids', JSON.stringify(newDeletedIds));
                                }}
                                className="p-1 hover:bg-gray-200 rounded transition"
                                aria-label="Supprimer"
                              >
                                <Trash2 className="w-4 h-4 text-gray-500 hover:text-red-600" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                  <div className="p-3 text-right">
                    <Link href="/responsable/users" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                      Voir tout
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </header>

          {/* Stat cards */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border rounded-xl p-5 shadow-sm hover:shadow transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Sessions</p>
                  <p className="text-3xl font-bold mt-1">{stats.sessions}</p>
                </div>
                <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
                  <Calendar className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="bg-white border rounded-xl p-5 shadow-sm hover:shadow transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Coordinateurs</p>
                  <p className="text-3xl font-bold mt-1">{stats.coordinateurs}</p>
                </div>
                <div className="p-3 rounded-lg bg-indigo-50 text-indigo-600">
                  <User className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="bg-white border rounded-xl p-5 shadow-sm hover:shadow transition">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Formateurs</p>
                  <p className="text-3xl font-bold mt-1">{stats.formateurs}</p>
                </div>
                <div className="p-3 rounded-lg bg-orange-50 text-orange-600">
                  <Users className="w-6 h-6" />
                </div>
              </div>
            </div>
          </section>

          {/* Paiements - progression */}
          <section className="bg-white border rounded-xl p-6 shadow-sm hover:shadow transition">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <p className="text-sm text-gray-500">Progression des paiements</p>
                <h2 className="text-xl font-semibold text-gray-900">Suivi des encaissements</h2>
              </div>
              <div className="flex items-center gap-2 bg-gray-100 rounded-full p-1 w-fit">
                {[
                  { key: 'week', label: 'Semaine' },
                  { key: 'month', label: 'Mois' },
                  { key: 'year', label: 'Année' },
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setPaymentRange(item.key)}
                    className={`px-3 py-1.5 text-sm rounded-full transition ${
                      paymentRange === item.key
                        ? 'bg-white shadow text-blue-700'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-6 h-80">
              <Line data={chartData} options={chartOptions} />
            </div>
          </section>

          {/* Quick actions */}
          <section className="grid grid-cols-1 ">
            <Link href="/responsable/sessions/create" className="bg-white border rounded-xl p-6 shadow-sm hover:shadow transition group">
              <div className="font-semibold text-gray-900 group-hover:text-blue-700">Créer une nouvelle session</div>
              <p className="text-sm text-gray-500 mt-1">Ajoutez rapidement une session de formation</p>
            </Link>
            
          </section>
        </div>
      </main>
    </div>
  );
}
