"use client"

import { useEffect, useState } from "react"
import { User, Mail, Calendar, Lock, Shield } from "lucide-react"

export default function ResponsableProfilePage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("info")
  const [profileForm, setProfileForm] = useState({ name: "", email: "" })
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirm: "" })
  const [msg, setMsg] = useState(null)

  useEffect(() => {
    let mounted = true
    fetch("/api/profile")
      .then((res) => res.json())
      .then((data) => {
        if (!mounted) return
        if (data.error) {
          setMsg({ type: "error", text: data.error })
          setLoading(false)
          return
        }
        setUser(data)
        setProfileForm({ name: data.name || "", email: data.email || "" })
        setLoading(false)
      })
      .catch(() => {
        if (!mounted) return
        setMsg({ type: "error", text: "Erreur réseau" })
        setLoading(false)
      })
    return () => (mounted = false)
  }, [])

  async function submitProfile(e) {
    e.preventDefault()
    setMsg(null)
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileForm),
      })
      const data = await res.json()
      if (!res.ok) return setMsg({ type: "error", text: data.error || "Erreur" })
      setUser(data.user)
      setMsg({ type: "success", text: data.message })
    } catch (err) {
      setMsg({ type: "error", text: "Erreur réseau" })
    }
  }

  async function submitPassword(e) {
    e.preventDefault()
    setMsg(null)
    if (pwForm.newPassword !== pwForm.confirm) return setMsg({ type: "error", text: "Les nouveaux mots de passe ne correspondent pas" })
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }),
      })
      const data = await res.json()
      if (!res.ok) return setMsg({ type: "error", text: data.error || "Erreur" })
      setPwForm({ currentPassword: "", newPassword: "", confirm: "" })
      setMsg({ type: "success", text: data.message })
    } catch (err) {
      setMsg({ type: "error", text: "Erreur réseau" })
    }
  }

  const getInitials = (name) => {
    return name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "R"
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-linear-to-r from-blue-600 to-blue-700 px-6 py-8 text-white">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-white bg-opacity-20 text-blue-500 flex items-center justify-center text-2xl font-bold">
                {getInitials(user?.name)}
              </div>
              <div>
                <h1 className="text-3xl font-bold">{user?.name}</h1>
                <p className="text-blue-100 mt-1">{user?.email}</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          {msg && (
            <div className="mx-6 mt-6">
              <div className={`p-4 rounded-lg border ${msg.type === "error" ? "bg-red-50 text-red-700 border-red-200" : "bg-green-50 text-green-700 border-green-200"}`}>
                {msg.text}
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="border-b border-gray-200 px-6">
            <nav className="flex gap-8">
              <button
                onClick={() => setActiveTab("info")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "info"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Informations Personnelles
                </div>
              </button>
              <button
                onClick={() => setActiveTab("security")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "security"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Sécurité
                </div>
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="p-6">
            {activeTab === "info" ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Sidebar Info */}
                <div className="lg:col-span-1">
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations du Compte</h2>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500">Rôle</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Shield className="h-4 w-4 text-blue-500" />
                          <p className="font-medium">{user?.role}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Mail className="h-4 w-4 text-blue-500" />
                          <p className="font-medium text-sm truncate">{user?.email}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Membre depuis</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar className="h-4 w-4 text-blue-500" />
                          <p className="font-medium">{new Date(user?.createdAt).toLocaleDateString("fr-FR")}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Main Form */}
                <div className="lg:col-span-2">
                  <form onSubmit={submitProfile} className="space-y-6">
                    <h2 className="text-lg font-semibold text-gray-900">Modifier les Informations</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nom complet
                        </label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          value={profileForm.name}
                          onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                          required
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Adresse email
                        </label>
                        <input
                          type="email"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          value={profileForm.email}
                          onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-4">
                      <button
                        type="submit"
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium"
                      >
                        Enregistrer les modifications
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            ) : (
              <div className="max-w-2xl">
                <form onSubmit={submitPassword} className="space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">Changer le mot de passe</h2>
                    <p className="text-sm text-gray-600">Assurez-vous que votre nouveau mot de passe est sécurisé</p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Mot de passe actuel
                      </label>
                      <input
                        type="password"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        value={pwForm.currentPassword}
                        onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nouveau mot de passe
                      </label>
                      <input
                        type="password"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        value={pwForm.newPassword}
                        onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirmer le nouveau mot de passe
                      </label>
                      <input
                        type="password"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        value={pwForm.confirm}
                        onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <button
                      type="submit"
                      className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors font-medium"
                    >
                      Changer le mot de passe
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
