import React from 'react'
import CoordinateurSidebar from '@/components/coordinateur-sidebar'

export default function CoordinateurLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <CoordinateurSidebar />
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  )
}
