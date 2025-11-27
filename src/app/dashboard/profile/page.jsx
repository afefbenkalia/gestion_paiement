"use client"

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

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

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [editMode, setEditMode] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordFeedback, setPasswordFeedback] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
    if (session?.user?.id) fetchProfile()
  }, [session, status])

  async function fetchProfile() {
    try {
      const res = await fetch(`/api/profile?id=${session.user.id}`)
      if (res.ok) {
        const data = await res.json()
        setUser(data)
      }
    } catch (error) {
      console.error('Erreur:', error)
    }
  }

  function handlePasswordChange(e) {
    const password = e.target.value
    setNewPassword(password)
    if (password) {
      const feedback = getPasswordStrength(password)
      setPasswordFeedback(feedback.message)
    } else {
      setPasswordFeedback('')
    }
  }

  async function handleUpdatePassword(e) {
    e.preventDefault()
    setMessage('')

    if (!newPassword) {
      setMessage('❌ Veuillez entrer un nouveau mot de passe')
      return
    }

    if (!isSecurePassword(newPassword)) {
      setMessage('❌ Le mot de passe doit contenir au moins 6 caractères, une majuscule, une minuscule et un chiffre.')
      return
    }

    if (newPassword !== confirmPassword) {
      setMessage('❌ Les mots de passe ne correspondent pas')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: session.user.id,
          password: newPassword,
        }),
      })

      if (res.ok) {
        setMessage('✅ Mot de passe mis à jour avec succès')
        setNewPassword('')
        setConfirmPassword('')
        setPasswordFeedback('')
        setEditMode(false)
      } else {
        const error = await res.json()
        setMessage('❌ ' + error.error)
      }
    } catch (error) {
      setMessage('❌ Erreur lors de la mise à jour')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || !user) return <p className="p-4">Chargement...</p>

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-center text-2xl font-semibold mb-6">Mon Profil</h2>

        <div className="space-y-4 mb-6">
          <div>
            <p className="text-gray-600 text-sm">Nom</p>
            <p className="font-medium">{user.name}</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Email</p>
            <p className="font-medium">{user.email}</p>
          </div>
          <div>
            <p className="text-gray-600 text-sm">Rôle</p>
            <p className="font-medium">{user.role}</p>
          </div>
          {user.specialite && (
            <div>
              <p className="text-gray-600 text-sm">Spécialité</p>
              <p className="font-medium">{user.specialite}</p>
            </div>
          )}
        </div>

        {!editMode ? (
          <button
            onClick={() => setEditMode(true)}
            className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
          >
            Changer le mot de passe
          </button>
        ) : (
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nouveau mot de passe</label>
              <input
                type="password"
                placeholder="Nouveau mot de passe"
                className="border p-2 rounded w-full"
                value={newPassword}
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

            <div>
              <label className="block text-sm font-medium mb-1">Confirmer le mot de passe</label>
              <input
                type="password"
                placeholder="Confirmer le mot de passe"
                className="border p-2 rounded w-full"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={!isSecurePassword(newPassword) || newPassword !== confirmPassword || loading}
                className="flex-1 bg-green-600 text-white p-2 rounded hover:bg-green-700 disabled:bg-gray-400"
              >
                {loading ? 'Mise à jour...' : 'Mettre à jour'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditMode(false)
                  setNewPassword('')
                  setConfirmPassword('')
                  setPasswordFeedback('')
                  setMessage('')
                }}
                className="flex-1 bg-gray-400 text-white p-2 rounded hover:bg-gray-500"
              >
                Annuler
              </button>
            </div>

            {message && (
              <p className={`text-sm text-center ${
                message.includes('✅') ? 'text-green-600' : 'text-red-600'
              }`}>
                {message}
              </p>
            )}
          </form>
        )}
      </div>
    </div>
  )
}
