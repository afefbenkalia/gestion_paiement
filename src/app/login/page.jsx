"use client";

import Image from "next/image";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if (res.error) return setError(res.error);

    const response = await fetch("/api/auth/session");
    const session = await response.json();

    if (session.user.role === "RESPONSABLE") router.push("/dashboard/responsable");
    else if (["INACTIVE", "PENDING"].includes(session.user.status)) router.push("/pending");
    else if (session.user.status === "ACTIVE") {
      if (session.user.role === "FORMATEUR") router.push("/formateur/sessions");
      if (session.user.role === "COORDINATEUR") router.push("/coordinateur");
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
            Connectez-vous à votre plateforme de gestion des paiements.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-gradient-to-br from-white via-slate-50 to-slate-100 p-4">
        <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-lg p-8">

          <h2 className="text-3xl font-bold text-center text-slate-900 mb-2">
            Connexion
          </h2>
          <p className="text-center text-slate-600 mb-6">
            Accédez à votre espace personnel
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            <input
              type="email"
              placeholder="Email"
              className="px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 transition"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <input
              type="password"
              placeholder="Mot de passe"
              className="px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 transition"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition mt-2 shadow">
              Se connecter
            </button>

            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}

            {/* LINK TO REGISTER */}
            <p className="text-center text-sm text-slate-600 mt-4">
              Vous n’avez pas de compte ?{" "}
              <a href="/register" className="text-blue-600 font-semibold hover:underline">
                Créer un compte
              </a>
            </p>

          </form>
        </div>
      </div>
    </div>
  );
}
