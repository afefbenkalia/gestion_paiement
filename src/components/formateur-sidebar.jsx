"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { GraduationCap, User, FileText, LogOut } from 'lucide-react'

export function FormateurSidebar() {
  const { data: session } = useSession()
  const pathname = usePathname()

  const menu = [
    { title: 'Mes sessions', href: '/formateur/sessions', icon: GraduationCap },
    { title: 'Historique fiches de paie', href: '/formateur/historique', icon: FileText },
  ]

  const isActive = (href) => {
    if (href === '/formateur') return pathname === href || pathname === '/formateur'
    return pathname?.startsWith(href)
  }

  const name = session?.user?.name || 'Formateur'

  return (
    <aside className="w-64 bg-white border-r min-h-screen py-6 px-4 hidden md:flex flex-col">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center font-semibold">{(name || 'F').charAt(0)}</div>
          <div>
            <div className="text-sm font-semibold">{name}</div>
            <div className="text-xs text-gray-500">Formateur</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 mt-6">
        <ul className="space-y-1">
          {menu.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg ${active ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'}`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{item.title}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="mt-6 pt-4 border-t">
        <Link
          href="/formateur/profile"
          className={`flex items-center gap-3 px-3 py-2 rounded-lg ${isActive('/formateur/profile') ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700 hover:bg-gray-100'}`}
        >
          <User className="w-4 h-4" />
          <span className="text-sm font-medium">Gérer le profil</span>
        </Link>

        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full text-left mt-3 flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm font-medium">Se déconnecter</span>
        </button>
      </div>
    </aside>
  )
}
