"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

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
    name: "",
    email: "",
    password: "",
    role: "FORMATEUR",
    specialite: "",
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

    data.append("name", form.name);
    data.append("email", form.email);
    data.append("password", form.password);
    data.append("role", form.role);
    if (form.role === "FORMATEUR") data.append("specialite", form.specialite);
    if (form.cv) data.append("cv", form.cv);

    const res = await fetch("/api/register", { method: "POST", body: data });
    const result = await res.json();

    if (res.ok) {
      const signRes = await signIn('credentials', {
        redirect: false,
        email: form.email,
        password: form.password,
      });

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
    <div className="min-h-screen flex">

      {/* LEFT SIDE */}
      <div className="hidden lg:flex lg:w-1/2 bg-blue-700 items-center justify-center p-10">
        <div className="text-white text-center max-w-md">

          {/* ICONE */}
          <div className="w-32 h-32 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
            <svg
              className="w-16 h-16 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 8.25h19.5m-19.5 0V6A2.25 2.25 0 0 1 4.5 3.75h15A2.25 2.25 0 0 1 21.75 6v2.25m-19.5 0v9A2.25 2.25 0 0 0 4.5 19.5h15a2.25 2.25 0 0 0 2.25-2.25v-9m-12 6h2.25"
              />
            </svg>
        </div>

        <h1 className="text-4xl font-bold mb-4">PayFlow</h1>
        <p className="text-blue-100 text-lg">
            Solution moderne pour gérer, suivre et automatiser vos paiements en toute simplicité.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE FORM */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-gradient-to-br from-white via-slate-50 to-slate-100 p-4">
        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-lg p-8">

          <h2 className="text-3xl font-bold text-center text-slate-900 mb-2">
            Créer un compte
          </h2>
          <p className="text-center text-slate-600 mb-6">
Rejoignez PayFlow en quelques secondes
</p>

<form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="Nom complet"
                className="border p-2 rounded w-full"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div>
              <input
                type="email"
                placeholder="Email"
                className="border p-2 rounded w-full"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

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

            <div>
              <select
                className="border p-2 rounded w-full"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <option value="FORMATEUR">Formateur</option>
                <option value="APPRENANT">Apprenant</option>
              </select>
            </div>

            {form.role === "FORMATEUR" && (
              <>
                <div>
                  <input
                    type="text"
                    placeholder="Spécialité"
                    className="border p-2 rounded w-full"
                    value={form.specialite}
                    onChange={(e) => setForm({ ...form, specialite: e.target.value })}
                  />
                </div>
                <div>
                  <input
                    type="file"
                    accept=".pdf"
                    className="border p-2 rounded w-full"
                    onChange={(e) => setForm({ ...form, cv: e.target.files[0] })}
                  />
                </div>
              </>
            )}

            <button 
              type="submit"
              className="bg-blue-600 text-white p-2 rounded w-full hover:bg-blue-700 disabled:bg-gray-400" 
              disabled={!isSecurePassword(form.password)}
            >
              S'inscrire
            </button>
            {message && <p className="text-center text-sm mt-2">{message}</p>}
          </form>
        </div>
      </div>
    </div>
  );
}
