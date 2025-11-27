import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-slate-100 text-slate-900 antialiased">

      {/* NAVBAR */}
      <nav className="w-full bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">

          {/* Logo */}
           <div className="flex items-center gap-3">
            {/* Remplacement PF par icône */}
            <div className="w-11 h-11 bg-blue-500 rounded-full flex items-center justify-center shadow-md">
              <svg
                className="w-6 h-6 text-white"
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
            <span className="text-xl font-bold tracking-tight">PayFlow</span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-5">
            <Link href="/login" className="text-sm text-slate-700 hover:text-blue-600 transition font-medium">
              Connexion
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium shadow hover:shadow-md transition"
            >
              S'inscrire
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <header className="mx-auto max-w-6xl px-6 pt-24 pb-20 text-center">
        <h1 className="text-6xl font-extrabold tracking-tight leading-tight">
          Gérez vos paiements en toute
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mt-1">
            simplicité et professionnalisme.
          </span>
        </h1>

        <p className="mt-6 text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          PayFlow vous aide à automatiser les fiches de paie, suivre les paiements,
          gérer vos collaborateurs et visualiser vos données grâce à une interface claire et puissante.
        </p>


       
      </header>

      {/* FEATURES */}
      <section className="mx-auto max-w-7xl px-6 pb-28">
        <h2 className="text-center text-3xl font-bold mb-14 text-slate-900">
          Fonctionnalités clés
        </h2>

        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: "Analyses intelligentes",
              desc: "Des tableaux clairs, rapports automatiques et indicateurs fiables.",
              icon: "📊",
            },
            {
              title: "Export professionnel",
              desc: "Générez automatiquement des fiches de paie PDF impeccables.",
              icon: "📄",
            },
            {
              title: "Gestion centralisée",
              desc: "Une plateforme unique pour tous vos employés et paiements.",
              icon: "🗂️",
            },
          ].map((f, i) => (
            <div
              key={i}
              className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm hover:shadow-lg transition hover:-translate-y-1"
            >
              <div className="text-4xl mb-3">{f.icon}</div>
              <h3 className="text-lg font-semibold text-slate-900">{f.title}</h3>
              <p className="mt-2 text-slate-600 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-slate-200 py-8 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} PayFlow — Tous droits réservés.
      </footer>

    </main>
  );
}
