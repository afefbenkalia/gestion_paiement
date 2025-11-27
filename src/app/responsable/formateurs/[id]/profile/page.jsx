'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { tunisianBanks } from '@/data/tunisianBanks'
import RibOcrUpload from '@/components/RibOcrUpload'

export default function FormateurProfileManagePage() {
  const params = useParams()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)
  const [user, setUser] = useState(null)
  const [form, setForm] = useState({ rib: '', banque: '' })
  const [errors, setErrors] = useState({})
  const [bankSuggestions, setBankSuggestions] = useState([])
  const [showBankSuggestions, setShowBankSuggestions] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/responsable/users/${params.id}`)
        if (!res.ok) throw new Error('Impossible de charger le profil')
        const data = await res.json()
        setUser(data)
        setForm({ rib: data.rib || '', banque: data.banque || '' })
      } catch (e) {
        setMsg({ type: 'error', text: e.message || 'Erreur de chargement' })
      } finally {
        setLoading(false)
      }
    }
    if (params.id) load()
  }, [params.id])

  const validateRIB = (rib) => {
    if (!rib) return ''
    const ribRegex = /^\d{20}$/
    return ribRegex.test(rib) ? '' : 'Le RIB doit contenir exactement 20 chiffres'
  }

  const handleRibChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 20)
    setForm((prev) => ({ ...prev, rib: value }))
    const err = validateRIB(value)
    setErrors((prev) => ({ ...prev, rib: err }))
  }

  const handleBankChange = (e) => {
    const value = e.target.value
    setForm((prev) => ({ ...prev, banque: value }))
    if (value.length > 1) {
      const filtered = tunisianBanks.filter((b) => b.toLowerCase().includes(value.toLowerCase()))
      setBankSuggestions(filtered)
      setShowBankSuggestions(true)
    } else {
      setBankSuggestions([])
      setShowBankSuggestions(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMsg(null)
    if (errors.rib) {
      setMsg({ type: 'error', text: 'Veuillez corriger les erreurs dans le formulaire' })
      return
    }
    try {
      setSaving(true)
      const res = await fetch(`/api/responsable/users/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rib: form.rib || null, banque: form.banque || null }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Échec de la mise à jour')
      setMsg({ type: 'success', text: 'Profil mis à jour avec succès' })
    } catch (e) {
      setMsg({ type: 'error', text: e.message || 'Erreur lors de la sauvegarde' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-col justify-center items-center min-h-screen">
        <p className="text-xl mb-4">Formateur non trouvé</p>
        <Link href={`/responsable/formateurs/${params.id}`} className="text-blue-600 hover:underline">
          Retour au profil
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-linear-to-r from-blue-600 to-blue-700 px-6 py-8 text-white">
            <h1 className="text-3xl font-bold">Profil Formateur</h1>
            <p className="text-blue-100 mt-2">Gérer les informations financières du formateur</p>
          </div>

          <div className="p-6">
            {msg && (
              <div className={`mb-6 p-4 rounded-lg ${
                msg.type === 'error'
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-green-50 text-green-700 border border-green-200'
              }`}>
                {msg.text}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1">
                <div className="bg-gray-50 rounded-lg p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations du Compte</h2>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">Nom</p>
                      <p className="font-medium">{user.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{user.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Téléphone</p>
                      <p className="font-medium">{user.tel || 'Non renseigné'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Rôle</p>
                      <p className="font-medium">{user.role}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Membre depuis</p>
                      <p className="font-medium">{new Date(user.createdAt).toLocaleDateString('fr-FR')}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <h2 className="text-lg font-semibold text-gray-900">Modifier les Informations</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        RIB <span className="text-xs text-gray-500 ml-1">(20 chiffres)</span>
                      </label>
                      <input
                        type="text"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.rib ? 'border-red-300' : 'border-gray-300'}`}
                        value={form.rib}
                        onChange={handleRibChange}
                        placeholder="12345678901234567890"
                        maxLength={20}
                      />
                      {errors.rib && <p className="mt-1 text-sm text-red-600">{errors.rib}</p>}
                      <div className="mt-2">
                        <RibOcrUpload onRibExtracted={(rib) => {
                          setForm((prev) => ({ ...prev, rib }))
                          setErrors((prev) => ({ ...prev, rib: '' }))
                        }} />
                      </div>
                    </div>

                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Banque</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        value={form.banque}
                        onChange={handleBankChange}
                        onFocus={() => form.banque.length > 1 && setShowBankSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowBankSuggestions(false), 200)}
                        placeholder="Nom de la banque"
                      />
                      {showBankSuggestions && bankSuggestions.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                          {bankSuggestions.map((bank, index) => (
                            <div
                              key={index}
                              className="px-4 py-2 hover:bg-blue-50 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0"
                              onMouseDown={() => {
                                setForm((prev) => ({ ...prev, banque: bank }))
                                setBankSuggestions([])
                              }}
                            >
                              <div className="text-sm text-gray-700">{bank}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      type="submit"
                      disabled={!!errors.rib}
                      className={`px-6 py-2 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium ${errors.rib ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                    >
                      {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
                    </button>
                    <Link href={`/responsable/formateurs/${params.id}`} className="ml-3 text-gray-600 hover:text-gray-800">
                      Annuler
                    </Link>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
