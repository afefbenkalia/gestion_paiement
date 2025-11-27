import React from 'react'
import { FormateurSidebar } from '@/components/formateur-sidebar'

export default function FormateurLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <FormateurSidebar />
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  )
}
