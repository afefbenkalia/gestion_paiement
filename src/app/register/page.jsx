'use client'

import { useState } from 'react'

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'FORMATEUR' })
  const [message, setMessage] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    if (res.ok) {
      setMessage('✅ Compte créé avec succès !')
      setForm({ name: '', email: '', password: '', role: 'FORMATEUR' })
    } else {
      setMessage('❌ ' + data.error)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md w-80 flex flex-col gap-3">
        <h2 className="text-center text-lg font-semibold">Créer un compte</h2>

        <input
          className="border p-2 rounded"
          type="text"
          placeholder="Nom complet"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />

        <input
          className="border p-2 rounded"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />

        <input
          className="border p-2 rounded"
          type="password"
          placeholder="Mot de passe"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />

        <select
          className="border p-2 rounded"
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
          required
        >
          <option value="FORMATEUR">Formateur</option>
          <option value="COORDINATEUR">Coordinateur</option>
        
        </select>

        <button className="bg-blue-600 text-white p-2 rounded">S'inscrire</button>
        {message && <p className="text-center text-sm mt-2">{message}</p>}

        <p className="text-center text-sm mt-3">
          Déjà un compte ?{" "}
          <a href="/login" className="text-blue-600 hover:underline">Se connecter</a>
        </p>
      </form>
    </div>
  )
}