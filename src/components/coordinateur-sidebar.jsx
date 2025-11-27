'use client'

import Link from 'next/link'
import { signOut, useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { Calendar, FileText, User, LogOut } from 'lucide-react'

export default function CoordinateurSidebar() {
  const { data: session } = useSession()
  const pathname = usePathname()

  const isActive = (path) => pathname?.startsWith(path)

  const name = session?.user?.name || 'Coordinateur'

  return (
    <aside className="w-64 bg-white border-r min-h-screen py-6 px-4 hidden md:flex flex-col">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">{(name || 'C').charAt(0)}</div>
          <div>
            <div className="text-sm font-semibold">{name}</div>
            <div className="text-xs text-gray-500">Coordinateur</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 mt-6">
        <ul className="space-y-1">
          <li>
            <Link
              href="/coordinateur/sessions"
              className={`flex items-center gap-3 px-3 py-2 rounded-lg ${isActive('/coordinateur/sessions') ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              <Calendar className="w-4 h-4" />
              <span className="text-sm font-medium">Mes sessions</span>
            </Link>
          </li>

          <li>
            <Link
              href="/coordinateur/historique"
              className={`flex items-center gap-3 px-3 py-2 rounded-lg ${isActive('/coordinateur/historique') ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
            >
              <FileText className="w-4 h-4" />
              <span className="text-sm font-medium">Historique fiches de paie</span>
            </Link>
          </li>
        </ul>
      </nav>

      <div className="mt-6 pt-4 border-t">
        <Link
          href="/coordinateur/profile"
          className={`flex items-center gap-3 px-3 py-2 rounded-lg ${isActive('/coordinateur/profile') ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
        >
          <User className="w-4 h-4" />
          <span className="text-sm font-medium">Gérer le profil</span>
        </Link>

        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="w-full text-left mt-3 flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm font-medium">Se déconnecter</span>
        </button>
      </div>
    </aside>
  )
}
