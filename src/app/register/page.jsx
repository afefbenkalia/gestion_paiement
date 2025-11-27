"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signIn } from 'next-auth/react'

function isSecurePassword(password) {
  const hasMinLength = password.length >= 6;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  return hasMinLength && hasUpperCase && hasLowerCase && hasNumber;
}

function getPasswordStrength(password) {
  if (!password) return { strength: 'none', message: '' };
  
  const checks = [
    password.length >= 6,
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /[0-9]/.test(password)
  ];
  
  const passedChecks = checks.filter(Boolean).length;
  
  if (passedChecks === 4) return { strength: 'strong', message: '✅ Mot de passe sécurisé' };
  if (passedChecks === 3) return { strength: 'medium', message: '⚠️ Mot de passe acceptable' };
  return { strength: 'weak', message: '❌ Mot de passe faible' };
}

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'FORMATEUR',
    specialite: '',
    cv: null,
  })
  const [message, setMessage] = useState('')
  const [passwordFeedback, setPasswordFeedback] = useState('')
  const router = useRouter()

  function handlePasswordChange(e) {
    const password = e.target.value
    setForm({ ...form, password })
    const feedback = getPasswordStrength(password)
    setPasswordFeedback(feedback.message)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    
    if (!isSecurePassword(form.password)) {
      setMessage("❌ Le mot de passe doit contenir au moins 6 caractères, une majuscule, une minuscule et un chiffre.")
      return
    }

    const data = new FormData()
    data.append("name", form.name)
    data.append("email", form.email)
    data.append("password", form.password)
    data.append("role", form.role)
    if (form.role === "FORMATEUR") data.append("specialite", form.specialite)
    if (form.cv) data.append("cv", form.cv)

    const res = await fetch("/api/register", {
      method: "POST",
      body: data,
    })

    const result = await res.json()
    if (res.ok) {
      const signRes = await signIn('credentials', {
        redirect: false,
        email: form.email,
        password: form.password,
      })

      if (signRes && signRes.error) {
        setMessage("✅ Compte créé, en attente de validation du responsable. (connexion automatique échouée)")
        router.push('/pending')
      } else {
        setMessage("✅ Compte créé, en attente de validation du responsable.")
        router.push('/pending')
      }
    } else setMessage("❌ " + result.error)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md w-96 flex flex-col gap-3">
        <h2 className="text-center text-lg font-semibold">Créer un compte</h2>

        <input
          type="text"
          placeholder="Nom complet"
          className="border p-2 rounded"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />

        <input
          type="email"
          placeholder="Email"
          className="border p-2 rounded"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />

        <div>
          <input
            type="password"
            placeholder="Mot de passe"
            className="border p-2 rounded w-full"
            value={form.password}
            onChange={handlePasswordChange}
            required
          />
          {passwordFeedback && (
            <p className={`text-xs mt-1 ${
              passwordFeedback.includes('✅') ? 'text-green-600' :
              passwordFeedback.includes('⚠️') ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {passwordFeedback}
            </p>
          )}
        </div>

        <select
          className="border p-2 rounded"
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
        >
          <option value="FORMATEUR">Formateur</option>
          <option value="COORDINATEUR">Coordinateur</option>
        </select>

        {form.role === "FORMATEUR" && (
          <input
            type="text"
            placeholder="Spécialité"
            className="border p-2 rounded"
            value={form.specialite}
            onChange={(e) => setForm({ ...form, specialite: e.target.value })}
          />
        )}

        <input
          type="file"
          className="border p-2 rounded"
          accept=".pdf,.doc,.docx"
          onChange={(e) => setForm({ ...form, cv: e.target.files[0] })}
        />

        <button className="bg-blue-600 text-white p-2 rounded" disabled={!isSecurePassword(form.password)}>
          S'inscrire
        </button>
        {message && <p className="text-center text-sm mt-2">{message}</p>}
      </form>
    </div>
  )
}
