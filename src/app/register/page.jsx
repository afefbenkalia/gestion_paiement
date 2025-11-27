"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function RegisterPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "FORMATEUR",
    specialite: "",
    cv: null,
  });

  const [message, setMessage] = useState("");
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    const data = new FormData();

    data.append("name", form.name);
    data.append("email", form.email);
    data.append("password", form.password);
    data.append("role", form.role);
    if (form.role === "FORMATEUR") data.append("specialite", form.specialite);
    if (form.cv) data.append("cv", form.cv);

    const res = await fetch("/api/register", { method: "POST", body: data });
    const result = await res.json();

    if (res.ok) {
      await signIn("credentials", {
        redirect: false,
        email: form.email,
        password: form.password,
      });

      router.push("/pending");
      setMessage("Compte créé avec succès !");
    } else {
      setMessage(result.error);
    }
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

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            <input
              type="text"
              placeholder="Nom complet"
              className="px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 transition"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />

            <input
              type="email"
              placeholder="Email"
              className="px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 transition"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />

            <input
              type="password"
              placeholder="Mot de passe"
              className="px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 transition"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />

            <select
              className="px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 transition"
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
                className="px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 transition"
                value={form.specialite}
                onChange={(e) => setForm({ ...form, specialite: e.target.value })}
              />
            )}

            <input
              type="file"
              accept=".pdf,.doc,.docx"
              className="px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 text-slate-700 focus:ring-2 focus:ring-blue-500 transition"
              onChange={(e) => setForm({ ...form, cv: e.target.files[0] })}
            />

            <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition mt-2 shadow">
              S'inscrire
            </button>

            {message && (
              <p className="text-center text-sm text-blue-700 mt-2">{message}</p>
            )}

            {/* LINK TO LOGIN */}
            <p className="text-center text-sm text-slate-600 mt-4">
              Vous avez déjà un compte ?{" "}
              <a href="/login" className="text-blue-600 font-semibold hover:underline">
                Se connecter
              </a>
            </p>

          </form>
        </div>
      </div>
    </div>
  );
}
