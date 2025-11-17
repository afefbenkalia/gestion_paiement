"use client"

import { useEffect, useState } from "react"

export default function FormateurProfilePage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [profileForm, setProfileForm] = useState({ specialite: "" })
  const [cvFile, setCvFile] = useState(null)
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
        setProfileForm({ specialite: data.specialite || "" })
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
      const formData = new FormData()
      formData.append("specialite", profileForm.specialite)
      if (cvFile) formData.append("cv", cvFile)

      const res = await fetch("/api/profile", {
        method: "PATCH",
        body: formData,
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
      <h1 className="text-2xl font-bold">Profil Formateur</h1>

      {msg && (
        <div className={`p-3 rounded ${msg.type === "error" ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}>
          {msg.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="col-span-1">
          <h2 className="font-semibold mb-2">Informations</h2>
          <p><strong>Rôle :</strong> {user.role}</p>
          <p><strong>Créé le :</strong> {new Date(user.createdAt).toLocaleDateString()}</p>
          {user.specialite && <p><strong>Spécialité :</strong> {user.specialite}</p>}
          {user.cv && (
            <p>
              <strong>CV :</strong> <a className="text-blue-600 underline" href={user.cv} target="_blank" rel="noreferrer">Voir le CV</a>
            </p>
          )}
        </div>

        <div className="col-span-1">
          <form onSubmit={submitProfile} className="space-y-3">
            <h2 className="font-semibold">Modifier le profil</h2>
            <div>
              <label className="block text-sm">Spécialité</label>
              <input className="w-full border p-2 rounded" value={profileForm.specialite} onChange={(e) => setProfileForm({ ...profileForm, specialite: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm">Uploader CV (pdf/doc)</label>
              <input type="file" accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={(e) => setCvFile(e.target.files?.[0] || null)} />
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
