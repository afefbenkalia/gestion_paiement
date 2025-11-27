'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CalendarDays, 
  ClipboardCheck, 
  Euro, 
  Users, 
  Wallet, 
  Settings2, 
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Save,
  X
} from 'lucide-react';

const formatAmount = (value) => {
  const numeric = Number(value ?? 0);
  if (!Number.isFinite(numeric)) return '0,000 TND';
  const fraction = Math.round(Math.abs(numeric * 100)) % 100;
  const formatter = new Intl.NumberFormat('fr-TN', {
    style: 'currency',
    currency: 'TND',
    minimumFractionDigits: fraction === 0 ? 0 : 3, // Affichage standard comptable 3 décimales en Tunisie souvent
    maximumFractionDigits: 3,
  });
  return formatter.format(numeric);
};

const formatPercent = (value) => {
  if (value == null || value === '') return '';
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return '';
  const fraction = Math.round(Math.abs(numeric * 100)) % 100;
  return fraction === 0 ? numeric.toFixed(0) : numeric.toFixed(2);
};

export default function PaiementsPage() {
  const [sessions, setSessions] = useState([]);
  const [systemParameters, setSystemParameters] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [editingParameters, setEditingParameters] = useState(false);

  const tvaDisplay = formatPercent(systemParameters?.tva);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/responsable/paiment', { cache: 'no-store' });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Impossible de charger les paiements.');
      }

      setSessions(data.sessions ?? []);
      setSystemParameters(data.systemParameters ?? null);
      setError('');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Erreur inattendue.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveParameters = async () => {
    if (!systemParameters) return;
    setSaving(true);
    try {
      const res = await fetch('/api/responsable/paiment', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(systemParameters),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur lors de la sauvegarde');
      fetchSessions();
      setEditingParameters(false);
    } catch (e) {
      console.error(e);
      alert('Erreur lors de la sauvegarde des paramètres');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingParameters(false);
    fetchSessions();
  };

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* En-tête de page avec fond subtil */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
                Gestion des Paiements
              </h1>
              <p className="text-slate-500 mt-1 text-sm md:text-base">
                Supervision financière, validation des honoraires et règlements.
              </p>
            </div>
            
            {!loading && systemParameters && (
               <div className="flex items-center gap-2">
                 {!editingParameters ? (
                    <Button 
                      variant="outline" 
                      onClick={() => setEditingParameters(true)}
                      className="border-slate-300 text-slate-700 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                    >
                      <Settings2 className="mr-2 h-4 w-4" />
                      Configurer les tarifs
                    </Button>
                 ) : (
                   <div className="flex gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
                      <Button variant="ghost" onClick={handleCancelEdit} disabled={saving} className="text-slate-500">
                        <X className="mr-2 h-4 w-4" /> Annuler
                      </Button>
                      <Button onClick={handleSaveParameters} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white">
                        <Save className="mr-2 h-4 w-4" /> 
                        {saving ? 'Sauvegarde...' : 'Enregistrer'}
                      </Button>
                   </div>
                 )}
               </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl space-y-8">
        
        {/* Section Paramètres system (Style Dashboard) */}
        {systemParameters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Carte: Prix Formateur */}
            <Card className={`relative overflow-hidden transition-all duration-200 ${editingParameters ? 'ring-2 ring-blue-500 border-transparent shadow-lg' : 'border-slate-200 shadow-sm hover:shadow-md'}`}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-slate-500 mb-1">Prix horaire Formateur</p>
                    {editingParameters ? (
                      <div className="mt-2">
                        <input
                          type="number"
                          min={0}
                          step={0.5}
                          className="text-2xl font-bold text-slate-900 bg-slate-50 border border-slate-300 rounded px-3 py-1 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={systemParameters.prixHeureFormation}
                          onChange={(e) => setSystemParameters({ ...systemParameters, prixHeureFormation: Number(e.target.value) })}
                        />
                      </div>
                    ) : (
                      <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
                        {formatAmount(systemParameters.prixHeureFormation)}
                        <span className="text-sm font-normal text-slate-400 ml-1">/h</span>
                      </h3>
                    )}
                  </div>
                  <div className="p-3 bg-blue-50 rounded-full text-blue-600">
                    <Users className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
              {editingParameters && <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />}
            </Card>

            {/* Carte: Coordination */}
            <Card className={`relative overflow-hidden transition-all duration-200 ${editingParameters ? 'ring-2 ring-blue-500 border-transparent shadow-lg' : 'border-slate-200 shadow-sm hover:shadow-md'}`}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-slate-500 mb-1">Forfait Coordination</p>
                    {editingParameters ? (
                      <div className="mt-2">
                         <input
                          type="number"
                          min={0}
                          step={10}
                          className="text-2xl font-bold text-slate-900 bg-slate-50 border border-slate-300 rounded px-3 py-1 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={systemParameters.prixCoordinationFixe}
                          onChange={(e) => setSystemParameters({ ...systemParameters, prixCoordinationFixe: Number(e.target.value) })}
                        />
                      </div>
                    ) : (
                      <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
                        {formatAmount(systemParameters.prixCoordinationFixe)}
                        <span className="text-sm font-normal text-slate-400 ml-1">/session</span>
                      </h3>
                    )}
                  </div>
                  <div className="p-3 bg-indigo-50 rounded-full text-indigo-600">
                    <ClipboardCheck className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
              {editingParameters && <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />}
            </Card>

            {/* Carte: TVA */}
            <Card className={`relative overflow-hidden transition-all duration-200 ${editingParameters ? 'ring-2 ring-blue-500 border-transparent shadow-lg' : 'border-slate-200 shadow-sm hover:shadow-md'}`}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-slate-500 mb-1">Taux de TVA</p>
                    {editingParameters ? (
                      <div className="mt-2 flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step={1}
                          className="text-2xl font-bold text-slate-900 bg-slate-50 border border-slate-300 rounded px-3 py-1 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={systemParameters.tva}
                          onChange={(e) => setSystemParameters({ ...systemParameters, tva: Number(e.target.value) })}
                        />
                        <span className="text-slate-400 font-bold">%</span>
                      </div>
                    ) : (
                      <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
                        {tvaDisplay ? `${tvaDisplay}%` : '-'}
                      </h3>
                    )}
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-full text-emerald-600">
                    <Euro className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
              {editingParameters && <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />}
            </Card>
          </div>
        )}

        {/* Section Liste des Sessions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
             <h2 className="text-xl font-bold text-slate-800">Sessions & États de paie</h2>
             {error && (
              <div className="text-sm text-red-600 bg-red-50 px-3 py-1 rounded flex items-center">
                <AlertCircle className="w-4 h-4 mr-2"/>
                {error}
                <button onClick={fetchSessions} className="ml-2 underline hover:text-red-800">Réessayer</button>
              </div>
            )}
          </div>

          {loading ? (
             <div className="grid grid-cols-1 gap-4">
               {[1, 2, 3].map((i) => (
                 <div key={i} className="h-40 bg-white rounded-xl shadow-sm border border-slate-100 animate-pulse"></div>
               ))}
             </div>
          ) : sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed border-slate-300 text-slate-500">
              <ClipboardCheck className="h-12 w-12 text-slate-200 mb-4" />
              <p className="text-lg font-medium">Aucune session trouvée</p>
              <p className="text-sm text-slate-400">Les fiches de paiement apparaîtront ici une fois les sessions créées.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {sessions.map((session) => (
                <Card key={session.id} className="group border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden bg-white">
                  <div className="flex flex-col lg:flex-row">
                    
                    {/* Colonne Gauche : Info Session */}
                    <div className="flex-1 p-6 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-100">
                      <div>
                        <div className="flex items-start justify-between gap-4 mb-2">
                           <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                            {session.titre}
                           </h3>
                           <Badge 
                            variant="outline" 
                            className={`whitespace-nowrap ${
                              session.statut === 'COMPLET' 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}
                          >
                            {session.statut === 'COMPLET' ? (
                              <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Validé</span>
                            ) : (
                              <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3" /> En attente</span>
                            )}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-4 text-sm text-slate-600 mt-4">
                          <div className="flex items-center gap-2">
                            <CalendarDays className="h-4 w-4 text-slate-400" />
                            <span>{session.periode}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-slate-400" />
                            <span>{session.nbFormateurs} formateur(s)</span>
                          </div>
                          <div className="flex items-center gap-2 sm:col-span-2">
                            <ClipboardCheck className="h-4 w-4 text-slate-400" />
                            <span className="truncate">Coordinateur: {session.coordinateur ? session.coordinateur.name : 'Non assigné'}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-6">
                        {session.summary.pendingFormateurs > 0 ? (
                           <div className="bg-amber-50 text-amber-800 text-xs px-3 py-2 rounded-md border border-amber-100 flex items-center gap-2">
                              <AlertCircle className="w-4 h-4" />
                              <strong>Action requise :</strong> {session.summary.pendingFormateurs} fiche(s) formateur incomplète(s).
                           </div>
                        ) : (
                          <div className="bg-emerald-50 text-emerald-800 text-xs px-3 py-2 rounded-md border border-emerald-100 flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4" />
                              Toutes les fiches formateurs sont prêtes.
                           </div>
                        )}
                      </div>
                    </div>

                    {/* Colonne Droite : Données Financières */}
                    <div className="lg:w-[320px] bg-slate-50/50 p-6 flex flex-col justify-center gap-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500">Formateurs (Net)</span>
                          <span className="font-semibold text-slate-700">{formatAmount(session.summary.totalFormateursNet)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-slate-500">Coordination (Net)</span>
                          <span className="font-semibold text-slate-700">{formatAmount(session.summary.totalCoordinateurNet)}</span>
                        </div>
                        <div className="h-px bg-slate-200 my-2"></div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-900 font-bold uppercase text-xs tracking-wider">Total à payer</span>
                          <span className="font-bold text-xl text-blue-700">{formatAmount(session.summary.totalNet)}</span>
                        </div>
                      </div>

                      <Button asChild className="w-full bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 hover:border-blue-300 shadow-sm mt-2 transition-all">
                        <Link href={`/responsable/paiements/session/${session.id}`} className="flex items-center justify-center">
                          Gérer les détails <ChevronRight className="ml-1 w-4 h-4" />
                        </Link>
                      </Button>
                    </div>

                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}