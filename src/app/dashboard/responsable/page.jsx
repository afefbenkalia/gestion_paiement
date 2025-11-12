'use client'
import { useEffect, useState } from 'react'

export default function ResponsableDashboard() {
  const [users, setUsers] = useState([])

  useEffect(() => {
    fetch('/api/pending-users')
      .then(res => res.json())
      .then(data => setUsers(data))
  }, [])

  async function handleAction(id, action) {
    await fetch('/api/update-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action }),
    })
    setUsers(users.filter(u => u.id !== id))
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Demandes d'inscription</h2>
      {users.length === 0 && <p>Aucune demande en attente.</p>}
      {users.map(u => (
        <div key={u.id} className="border p-4 mb-3 rounded flex justify-between items-center">
          <div>
            <p><strong>{u.name}</strong> ({u.role})</p>
            <p>Email : {u.email}</p>
            {u.cv && <p>CV : {u.cv}</p>}
            {u.specialite && <p>Spécialité : {u.specialite}</p>}
          </div>
          <div className="flex gap-2">
            <button onClick={() => handleAction(u.id, 'APPROVED')} className="bg-green-600 text-white px-3 py-1 rounded">
              Accepter
            </button>
            <button onClick={() => handleAction(u.id, 'REJECTED')} className="bg-red-600 text-white px-3 py-1 rounded">
              Refuser
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
