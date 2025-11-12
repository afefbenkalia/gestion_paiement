'use client'
import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()

    const res = await signIn('credentials', {
      redirect: false,
      email,
      password,
    })

    if (res.error) {
      setError(res.error)
    } else {
      // 🔽 Ici la redirection après connexion
      const response = await fetch('/api/auth/session')
      const session = await response.json()

      if (session?.user?.role === 'RESPONSABLE') {
        router.push('/dashboard/responsable')
      } else {
        router.push('/dashboard/pending')
      }
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md w-80 flex flex-col gap-3">
        <h2 className="text-center text-lg font-semibold">Connexion</h2>

        <input
          type="email"
          placeholder="Email"
          className="border p-2 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Mot de passe"
          className="border p-2 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button className="bg-blue-600 text-white p-2 rounded">Se connecter</button>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
      </form>
    </div>
  )
}
