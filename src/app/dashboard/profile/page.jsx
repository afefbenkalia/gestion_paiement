"use client"

import { useEffect, useState } from "react"

export default function ProfilePage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
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

  if (loading) return <p className="p-6">Chargement...</p>

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 shadow rounded mt-8 space-y-6">
      <h1 className="text-2xl font-bold">Mon profil</h1>

      {msg && (
        <div className={`p-3 rounded ${msg.type === "error" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
          {msg.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="col-span-1">
          <h2 className="font-semibold mb-2">Informations</h2>
          <p><strong>Email :</strong> {user.email}</p>
          <p><strong>Rôle :</strong> {user.role}</p>
          <p><strong>Créé le :</strong> {new Date(user.createdAt).toLocaleDateString()}</p>
        </div>

        <div className="col-span-1">
          <form onSubmit={submitProfile} className="space-y-3">
            <h2 className="font-semibold">Modifier le profil</h2>
            <div>
              <label className="block text-sm">Nom</label>
              <input className="w-full border p-2 rounded" value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm">Email</label>
              <input type="email" className="w-full border p-2 rounded" value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} />
            </div>
            <div>
              <button className="px-4 py-2 bg-blue-600 text-white rounded">Enregistrer</button>
            </div>
          </form>
        </div>
      </div>

      <div>
        <form onSubmit={submitPassword} className="space-y-3 max-w-md">
          <h2 className="font-semibold">Changer le mot de passe</h2>
          <div>
            <label className="block text-sm">Mot de passe actuel</label>
            <input type="password" className="w-full border p-2 rounded" value={pwForm.currentPassword} onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm">Nouveau mot de passe</label>
            <input type="password" className="w-full border p-2 rounded" value={pwForm.newPassword} onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm">Confirmer le nouveau mot de passe</label>
            <input type="password" className="w-full border p-2 rounded" value={pwForm.confirm} onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })} />
          </div>
          <div>
            <button className="px-4 py-2 bg-red-600 text-white rounded">Changer le mot de passe</button>
          </div>
        </form>
      </div>
    </div>
  )
}
