"use client"
import { useEffect, useState } from "react"
import { tunisianBanks } from "@/data/tunisianBanks"

export default function CoordinateurProfilePage() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [profileForm, setProfileForm] = useState({
    fonction: "",
    cin: "",
    rib: "",
    banque: "",
    tel: ""
  })
  const [cvFile, setCvFile] = useState(null)
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirm: "" })
  const [msg, setMsg] = useState(null)
  const [activeTab, setActiveTab] = useState("profile")
  const [bankSuggestions, setBankSuggestions] = useState([])
  const [showBankSuggestions, setShowBankSuggestions] = useState(false)

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
        setProfileForm({
          fonction: data.fonction || "",
          cin: data.cin || "",
          rib: data.rib || "",
          banque: data.banque || "",
          tel: data.tel || ""
        })
        setLoading(false)
      })
      .catch(() => {
        if (!mounted) return
        setMsg({ type: "error", text: "Erreur réseau" })
        setLoading(false)
      })
    return () => (mounted = false)
  }, [])

  const handleBankChange = (e) => {
    const value = e.target.value
    setProfileForm({ ...profileForm, banque: value })
    
    if (value.length > 1) {
      const filtered = tunisianBanks.filter(bank =>
        bank.toLowerCase().includes(value.toLowerCase())
      )
      setBankSuggestions(filtered)
      setShowBankSuggestions(true)
    } else {
      setBankSuggestions([])
      setShowBankSuggestions(false)
    }
  }

  const selectBank = (bank) => {
    setProfileForm({ ...profileForm, banque: bank })
    setBankSuggestions([])
    setShowBankSuggestions(false)
  }

  async function submitProfile(e) {
    e.preventDefault()
    setMsg(null)
    try {
      const formData = new FormData()
      Object.keys(profileForm).forEach(key => {
        if (profileForm[key]) formData.append(key, profileForm[key])
      })
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

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8 text-white">
            <h1 className="text-3xl font-bold">Profil Coordinateur</h1>
            <p className="text-blue-100 mt-2">Gérez vos informations personnelles et votre compte</p>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab("profile")}
                className={`py-4 px-6 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === "profile"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Informations Personnelles
              </button>
              <button
                onClick={() => setActiveTab("password")}
                className={`py-4 px-6 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === "password"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                Sécurité
              </button>
            </nav>
          </div>

          {/* Content */}
          <div className="p-6">
            {msg && (
              <div className={`mb-6 p-4 rounded-lg ${
                msg.type === "error" 
                  ? "bg-red-50 text-red-700 border border-red-200" 
                  : "bg-green-50 text-green-700 border border-green-200"
              }`}>
                {msg.text}
              </div>
            )}

            {activeTab === "profile" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Informations */}
                <div className="lg:col-span-1">
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Informations du Compte</h2>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-500">Rôle</p>
                        <p className="font-medium">{user.role}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium">{user.email}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Membre depuis</p>
                        <p className="font-medium">{new Date(user.createdAt).toLocaleDateString('fr-FR')}</p>
                      </div>
                      {user.cv && (
                        <div>
                          <p className="text-sm text-gray-500">CV</p>
                          <a 
                            className="text-blue-600 hover:text-blue-800 font-medium underline flex items-center" 
                            href={user.cv} 
                            target="_blank" 
                            rel="noreferrer"
                          >
                            Voir le CV
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Formulaire */}
                <div className="lg:col-span-2">
                  <form onSubmit={submitProfile} className="space-y-6">
                    <h2 className="text-lg font-semibold text-gray-900">Modifier les Informations</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Fonction</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          value={profileForm.fonction}
                          onChange={(e) => setProfileForm({ ...profileForm, fonction: e.target.value })}
                          placeholder="Votre fonction"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">CIN</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          value={profileForm.cin}
                          onChange={(e) => setProfileForm({ ...profileForm, cin: e.target.value })}
                          placeholder="Numéro CIN"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">RIB</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          value={profileForm.rib}
                          onChange={(e) => setProfileForm({ ...profileForm, rib: e.target.value })}
                          placeholder="Numéro RIB"
                        />
                      </div>

                      <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Banque</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          value={profileForm.banque}
                          onChange={handleBankChange}
                          onFocus={() => profileForm.banque.length > 1 && setShowBankSuggestions(true)}
                          onBlur={() => setTimeout(() => setShowBankSuggestions(false), 200)}
                          placeholder="Nom de la banque"
                        />
                        {showBankSuggestions && bankSuggestions.length > 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                            {bankSuggestions.map((bank, index) => (
                              <div
                                key={index}
                                className="px-4 py-2 hover:bg-blue-50 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0"
                                onMouseDown={() => selectBank(bank)}
                              >
                                <div className="text-sm text-gray-700">{bank}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
                        <input
                          type="tel"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          value={profileForm.tel}
                          onChange={(e) => setProfileForm({ ...profileForm, tel: e.target.value })}
                          placeholder="Numéro de téléphone"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">CV (PDF/DOC)</label>
                      <div className="flex items-center gap-4">
                        <input
                          type="file"
                          accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                          onChange={(e) => setCvFile(e.target.files?.[0] || null)}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end pt-4">
                      <button 
                        type="submit"
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium"
                      >
                        Enregistrer les modifications
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {activeTab === "password" && (
              <div className="max-w-md">
                <form onSubmit={submitPassword} className="space-y-6">
                  <h2 className="text-lg font-semibold text-gray-900">Changer le mot de passe</h2>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mot de passe actuel</label>
                    <input
                      type="password"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      value={pwForm.currentPassword}
                      onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                      placeholder="Entrez votre mot de passe actuel"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nouveau mot de passe</label>
                    <input
                      type="password"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      value={pwForm.newPassword}
                      onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
                      placeholder="Entrez le nouveau mot de passe"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Confirmer le nouveau mot de passe</label>
                    <input
                      type="password"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      value={pwForm.confirm}
                      onChange={(e) => setPwForm({ ...pwForm, confirm: e.target.value })}
                      placeholder="Confirmez le nouveau mot de passe"
                    />
                  </div>
                  
                  <div className="flex justify-end pt-4">
                    <button
                      type="submit"
                      className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors font-medium"
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