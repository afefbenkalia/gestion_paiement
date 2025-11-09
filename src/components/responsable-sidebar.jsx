'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import {
  Home,
  GraduationCap,
  Users,
  User,
  CreditCard,
  BarChart3,
  FileText,
  FileSpreadsheet,
  Settings,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function ResponsableSidebar() {
  const pathname = usePathname();

  const menuItems = [
    {
      title: 'Home',
      href: '/',
      icon: Home,
    },
    {
      section: 'GESTION',
      items: [
        {
          title: 'Session',
          href: '/responsable/sessions',
          icon: GraduationCap,
        },
        {
          title: 'Coordinateur',
          href: '/responsable/coordinateurs',
          icon: Users,
        },
        {
          title: 'Formateur',
          href: '/responsable/formateurs',
          icon: User,
        },
        {
          title: 'Paiement',
          href: '/responsable/paiements',
          icon: CreditCard,
        },
        {
          title: 'Utilisateurs',
          href: '/responsable/users',
          icon: Users,
        },
      ],
    },
    {
      section: 'RAPPORT',
      items: [
        {
          title: 'Export PDF',
          href: '/responsable/export/pdf',
          icon: FileText,
        },
        {
          title: 'Export Excel',
          href: '/responsable/export/excel',
          icon: FileSpreadsheet,
        },
      ],
    },
  ];

  const isActive = (href) => {
    if (href === '/dashboard/responsable') {
      return pathname === href;
    }
    return pathname?.startsWith(href);
  };

  return (
    <div className="flex flex-col h-screen w-64 bg-gray-50 border-r border-gray-200">
      <div className="flex-1 overflow-y-auto py-6">
        <nav className="space-y-1 px-3">
          {/* Home */}
          <Link
            href="/dashboard/responsable"
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              isActive('/dashboard/responsable')
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-700 hover:bg-gray-100'
            )}
          >
            <Home className="h-5 w-5" />
            <span>Home</span>
          </Link>

          {/* GESTION Section */}
          <div className="mt-6">
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              GESTION
            </div>
            <div className="mt-1 space-y-1">
              {menuItems
                .find((item) => item.section === 'GESTION')
                ?.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                        active
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </Link>
                  );
                })}
            </div>
          </div>

          {/* RAPPORT Section */}
          <div className="mt-6">
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              RAPPORT
            </div>
            <div className="mt-1 space-y-1">
              {menuItems
                .find((item) => item.section === 'RAPPORT')
                ?.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                        active
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </Link>
                  );
                })}
            </div>
          </div>
        </nav>
      </div>

      {/* Bottom Actions */}
      <div className="border-t border-gray-200 p-4 space-y-1">
        <Link
          href="/responsable/settings"
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
            isActive('/responsable/settings')
              ? 'bg-blue-100 text-blue-700'
              : 'text-gray-700 hover:bg-gray-100'
          )}
        >
          <Settings className="h-5 w-5" />
          <span>Settings</span>
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}

