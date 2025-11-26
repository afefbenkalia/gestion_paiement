import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-200 selection:text-blue-900">
      
      {/* --- NAVIGATION --- */}
      <nav className="fixed top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-6 w-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-800">PayFlow</span>
            </div>

            {/* Liens Desktop */}
            <div className="hidden items-center space-x-8 md:flex">
              <Link href="#" className="text-sm font-medium text-slate-600 hover:text-blue-600">Produit</Link>
              <Link href="#" className="text-sm font-medium text-slate-600 hover:text-blue-600">Solutions</Link>
              <Link href="#" className="text-sm font-medium text-slate-600 hover:text-blue-600">Tarifs</Link>
            </div>

            {/* Boutons Auth */}
            <div className="flex items-center gap-4">
              <Link href="/login" className="hidden text-sm font-medium text-slate-600 hover:text-blue-600 md:block">
                Connexion
              </Link>
              <Link href="/register" className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/30">
                Ouvrir un compte
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <section className="relative overflow-hidden pt-32 pb-20 lg:pt-48 lg:pb-32">
        {/* Cercles de fond décoratifs */}
        <div className="absolute top-0 left-1/2 -z-10 h-[600px] w-[600px] -translate-x-1/2 rounded-full bg-blue-100/50 blur-3xl filter" />
        <div className="absolute bottom-0 right-0 -z-10 h-[400px] w-[400px] rounded-full bg-indigo-100/50 blur-3xl filter" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
         

            {/* Illustration Graphique (Mockup fait en CSS) */}
            <div className="relative mx-auto w-full max-w-[500px] lg:mr-0">
              
              {/* Carte Principale (Effet Verre) */}
              <div className="relative z-10 rounded-3xl border border-white/50 bg-white/60 p-6 backdrop-blur-xl shadow-2xl shadow-blue-900/10">
                {/* Header Carte */}
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <p className="text-sm text-slate-500">Solde total</p>
                    <h3 className="text-3xl font-bold text-slate-800">24,500.00 €</h3>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                    </svg>
                  </div>
                </div>

                {/* Graphique simulé */}
                <div className="flex items-end justify-between gap-2 h-32 mb-6">
                  {[40, 70, 45, 90, 65, 85, 55].map((h, i) => (
                    <div key={i} className="w-full bg-blue-100 rounded-t-md relative group">
                      <div 
                        className="absolute bottom-0 left-0 right-0 bg-blue-600 rounded-t-md transition-all duration-500 group-hover:bg-blue-500"
                        style={{ height: `${h}%` }}
                      ></div>
                    </div>
                  ))}
                </div>

                {/* Liste transactions */}
                <div className="space-y-4">
                  {[1, 2].map((item) => (
                    <div key={item} className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-100 shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${item === 1 ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                          {item === 1 ? '↓' : '↑'}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{item === 1 ? 'Paiement reçu' : 'Abonnement'}</p>
                          <p className="text-xs text-slate-500">Aujourd'hui, 14:00</p>
                        </div>
                      </div>
                      <span className={`font-semibold ${item === 1 ? 'text-green-600' : 'text-slate-800'}`}>
                        {item === 1 ? '+ 450.00 €' : '- 29.00 €'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

       

            </div>
          </div>
        </div>
      </section>

      {/* --- FEATURES SECTION (Rapide aperçu) --- */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: "Sécurité Maximale", desc: "Chiffrement de bout en bout pour toutes vos transactions.", icon: "🛡️" },
              { title: "Analyses Détaillées", desc: "Visualisez vos dépenses et revenus avec des graphiques clairs.", icon: "📊" },
              { title: "Support 24/7", desc: "Une équipe dédiée pour répondre à toutes vos questions.", icon: "💬" },
            ].map((feature, idx) => (
              <div key={idx} className="p-6 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-blue-50 hover:border-blue-100 transition duration-300">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-slate-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
}