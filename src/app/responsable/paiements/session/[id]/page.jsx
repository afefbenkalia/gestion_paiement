'use client';

// src/app/responsable/paiements/session/[id]/page.jsx
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  ClipboardCheck, 
  Loader2, 
  ShieldCheck, 
  Users, 
  Wallet, 
  FileText, 
  Download, 
  Save, 
  Calculator,
  CheckCircle2,
  AlertCircle,
  Banknote
} from 'lucide-react';

const currencyFormatter = new Intl.NumberFormat('fr-TN', {
  style: 'currency',
  currency: 'TND',
  minimumFractionDigits: 3,
});

const formatAmount = (value) => currencyFormatter.format(Number(value || 0));

export default function SessionPaiementPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params?.id;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [formateurValues, setFormateurValues] = useState({});
  const [pendingActionId, setPendingActionId] = useState(null);
  const [downloadKey, setDownloadKey] = useState(null);

  const systemParameters = data?.systemParameters;

  useEffect(() => {
    if (!sessionId) return;
    const loadData = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/responsable/paiment/${sessionId}`, { cache: 'no-store' });
        const payload = await res.json();

        if (!res.ok) {
          throw new Error(payload.error || 'Impossible de charger la session.');
        }

        setData(payload);
        const initialValues = {};
        payload.formateurs?.forEach((formateur) => {
          initialValues[formateur.id] = {
            totalTutorat: formateur.fiche?.totalTutorat ?? '',
            totalRegroupement: formateur.fiche?.totalRegroupement ?? '',
          };
        });
        setFormateurValues(initialValues);
        setError('');
      } catch (err) {
        console.error(err);
        setError(err.message || 'Erreur inattendue.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [sessionId]);

  const handleFormateurChange = (formateurId, field, value) => {
    setFormateurValues((prev) => ({
      ...prev,
      [formateurId]: {
        ...prev[formateurId],
        [field]: value,
      },
    }));
  };

  const runAction = async (payload, successMessage) => {
    try {
      setPendingActionId(payload.formateurId ?? payload.type);
      setFeedback(null);
      const res = await fetch(`/api/responsable/paiment/${sessionId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const response = await res.json();
      if (!res.ok) {
        throw new Error(response.error || 'Action impossible.');
      }
      setData(response);
      if (payload.formateurId) {
        const updatedFormateur = response.formateurs.find(
          (formateur) => formateur.id === payload.formateurId
        );
        setFormateurValues((prev) => ({
          ...prev,
          [payload.formateurId]: {
            totalTutorat: updatedFormateur?.fiche?.totalTutorat ?? '',
            totalRegroupement: updatedFormateur?.fiche?.totalRegroupement ?? '',
          },
        }));
      }
      setFeedback({ type: 'success', message: successMessage });
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', message: err.message || 'Erreur inattendue.' });
    } finally {
      setPendingActionId(null);
    }
  };

  const downloadPdf = async ({ payload, filename, key }) => {
    try {
      setDownloadKey(key);
      const res = await fetch('/api/responsable/export/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Impossible de générer le PDF.');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setFeedback({ type: 'error', message: err.message || 'Erreur lors de l’export PDF.' });
    } finally {
      setDownloadKey(null);
    }
  };

  const handleFormateurSubmit = (formateurId) => {
    const values = formateurValues[formateurId] || {};
    runAction(
      {
        type: 'FORMATION',
        formateurId,
        totalTutorat: Number(values.totalTutorat) || 0,
        totalRegroupement: Number(values.totalRegroupement) || 0,
      },
      'Fiche formateur enregistrée avec succès.'
    );
  };

  const handleCoordinateurSubmit = () => {
    runAction({ type: 'COORDINATION' }, 'Fiche coordinateur mise à jour.');
  };

  const handleReglementSubmit = () => {
    runAction({ type: 'REGLEMENT' }, 'Mémoire de règlement généré avec succès.');
  };

  const computePreview = (formateurId) => {
    if (!systemParameters) return { heures: 0, brut: 0, net: 0 };
    const values = formateurValues[formateurId] || {};
    const tutorat = Number(values.totalTutorat) || 0;
    const regroupement = Number(values.totalRegroupement) || 0;
    const heures = tutorat + regroupement;
    const montantBrut = heures * systemParameters.prixHeureFormation;
    const montantNet = montantBrut - (montantBrut * (systemParameters.tva / 100));
    return { heures, montantBrut, montantNet };
  };

  const coordinateurFiche = data?.fiches?.coordinateur;
  const reglementFiche = data?.fiches?.reglement;

  if (!sessionId) return <div className="p-8 text-red-600">Identifiant de session manquant.</div>;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 text-slate-500 gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <p className="font-medium animate-pulse">Chargement du dossier financier...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <div className="bg-red-50 p-6 rounded-lg text-center border border-red-100 max-w-md">
          <AlertCircle className="h-10 w-10 text-red-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-red-700">Erreur de chargement</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => router.back()} variant="outline" className="bg-white hover:bg-red-50 border-red-200 text-red-700">
            Retourner à la liste
          </Button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      
      {/* --- En-tête --- */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4 max-w-6xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" asChild className="text-slate-500 hover:text-blue-600 hover:bg-blue-50">
                <Link href="/responsable/paiements">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-slate-900 flex items-center gap-2">
                  {data.session.titre}
                  {reglementFiche ? (
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Validé
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" /> En cours
                    </Badge>
                  )}
                </h1>
                <p className="text-slate-500 text-sm">{data.session.periode}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 text-xs md:text-sm text-slate-600">
              <Banknote className="w-4 h-4 text-blue-600" />
              <span>Prix Heure: <strong>{formatAmount(systemParameters?.prixHeureFormation)}/h</strong></span>
              <Separator orientation="vertical" className="h-4 bg-slate-300" />
              <span>TVA: <strong>{systemParameters?.tva}%</strong></span>

            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
        
        {/* Feedback Message */}
        {feedback && (
          <div className={`flex items-center gap-3 p-4 rounded-lg border shadow-sm animate-in slide-in-from-top-2 ${
            feedback.type === 'success' 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
              : 'bg-red-50 border-red-200 text-red-800'
          }`}>
             {feedback.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
             <p className="font-medium">{feedback.message}</p>
          </div>
        )}

        {/* --- Info Grid --- */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="md:col-span-4 bg-white border-slate-200 shadow-sm">
            <CardContent className="p-4 md:p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "Classe", value: data.session.classe },
                { label: "Spécialité", value: data.session.specialite },
                { label: "Promotion", value: data.session.promotion },
                { label: "Niveau", value: data.session.niveau }
              ].map((item, idx) => (
                <div key={idx} className="space-y-1">
                  <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">{item.label}</p>
                  <p className="text-slate-900 font-medium truncate" title={item.value || '-'}>{item.value || '—'}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* --- Formateurs Section --- */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Fiches Formateurs
            </h2>
            <Badge variant="secondary" className="bg-slate-100 text-slate-600">
              {data.formateurs.length} intervenant(s)
            </Badge>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {data.formateurs.length === 0 ? (
              <Card className="border-dashed border-slate-300 bg-slate-50/50 p-8 text-center text-slate-500">
                <Users className="h-10 w-10 mx-auto mb-2 text-slate-300" />
                <p>Aucun formateur assigné à cette session.</p>
              </Card>
            ) : (
              data.formateurs.map((formateur) => {
                const preview = computePreview(formateur.id);
                const isSaved = !!formateur.fiche;
                
                return (
                  <Card 
                    key={formateur.id} 
                    className={`transition-all duration-200 border-slate-200 shadow-sm hover:shadow-md ${isSaved ? 'border-l-4 border-l-blue-500' : 'border-l-4 border-l-amber-400'}`}
                  >
                    <CardContent className="p-5">
                      <div className="flex flex-col lg:flex-row gap-6">
                        
                        {/* Info Identité */}
                        <div className="lg:w-1/4 space-y-1">
                          <div className="flex items-center gap-2">
                             <h3 className="font-bold text-slate-900">{formateur.name}</h3>
                             {isSaved && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                          </div>
                          <p className="text-sm text-slate-500 truncate">{formateur.email}</p>
                          <div className="text-xs text-slate-400 mt-2 space-y-1">
                             <p>CIN: <span className="font-mono text-slate-600">{formateur.cin || '—'}</span></p>
                             <p>RIB: <span className="font-mono text-slate-600">{formateur.rib || '—'}</span></p>
                          </div>
                        </div>

                        {/* Inputs Heures */}
                        <div className="lg:w-1/3 grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-slate-600 uppercase">Tutorat (H)</label>
                            <div className="relative">
                              <Input
                                type="number"
                                min="0"
                                step="1"
                                placeholder="0"
                                className="bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-500 transition-colors pr-8 font-mono"
                                value={formateurValues[formateur.id]?.totalTutorat ?? ''}
                                onChange={(e) => handleFormateurChange(formateur.id, 'totalTutorat', e.target.value)}
                              />
                              <span className="absolute right-3 top-2 text-xs text-slate-400">h</span>
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-medium text-slate-600 uppercase">Regroup (H)</label>
                            <div className="relative">
                              <Input
                                type="number"
                                min="0"
                                step="1"
                                placeholder="0"
                                className="bg-slate-50 border-slate-200 focus:bg-white focus:border-blue-500 transition-colors pr-8 font-mono"
                                value={formateurValues[formateur.id]?.totalRegroupement ?? ''}
                                onChange={(e) => handleFormateurChange(formateur.id, 'totalRegroupement', e.target.value)}
                              />
                              <span className="absolute right-3 top-2 text-xs text-slate-400">h</span>
                            </div>
                          </div>
                          <div className="col-span-2 flex justify-between items-center bg-slate-100 rounded px-2 py-1">
                             <span className="text-xs text-slate-500">Total Heures</span>
                             <span className="text-sm font-bold text-slate-700 font-mono">{preview.heures} h</span>
                          </div>
                        </div>

                        {/* Calcul & Actions */}
                        <div className="lg:flex-1 flex flex-col justify-between gap-4">
                           {/* Boite Financière */}
                           <div className="bg-blue-50/50 rounded-lg p-3 border border-blue-100 flex justify-between items-center">
                              <div>
                                <p className="text-xs text-slate-500 uppercase mb-1">Montant Brut</p>
                                <p className="text-sm font-medium text-slate-700">{formatAmount(preview.montantBrut)}</p>
                              </div>
                              <Separator orientation="vertical" className="h-8 bg-blue-200" />
                              <div className="text-right">
                                <p className="text-xs text-emerald-600 font-bold uppercase mb-1">Net à payer</p>
                                <p className="text-lg font-bold text-emerald-700">{formatAmount(preview.montantNet)}</p>
                              </div>
                           </div>

                           <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-white"
                                disabled={!isSaved || downloadKey === `formation-${formateur.id}`}
                                onClick={() =>
                                  downloadPdf({
                                    key: `formation-${formateur.id}`,
                                    filename: `fiche-${formateur.name.replace(/\s+/g, '_')}.pdf`,
                                    payload: { sessionId: data.session.id, type: 'FORMATION', formateurId: formateur.id },
                                  })
                                }
                              >
                                {downloadKey === `formation-${formateur.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4 mr-2" />}
                                PDF
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleFormateurSubmit(formateur.id)}
                                disabled={pendingActionId === formateur.id}
                                className={isSaved ? "bg-blue-600 hover:bg-blue-700" : "bg-blue-600 hover:bg-blue-700"}
                              >
                                {pendingActionId === formateur.id ? <Loader2 className="h-4 w-4 animate-spin" /> : (isSaved ? <Save className="h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />)}
                                {isSaved ? 'Mettre à jour' : 'Enregistrer'}
                              </Button>
                           </div>
                        </div>

                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>

        <Separator className="bg-slate-200 my-8" />

        {/* --- Coordinateur & Règlement (Bottom Section) --- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Card Coordinateur */}
          <Card className="border-slate-200 shadow-sm h-full">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100 pb-3">
              <CardTitle className="flex items-center gap-2 text-base text-slate-800">
                <ClipboardCheck className="h-5 w-5 text-emerald-600" />
                Coordinateur
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {data.coordinateur ? (
                <div className="space-y-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-slate-900 text-lg">{data.coordinateur.name}</p>
                      <p className="text-sm text-slate-500">{data.coordinateur.email}</p>
                    </div>
                    <div className="text-right text-xs text-slate-400">
                      <p>RIB: {data.coordinateur.rib || '—'}</p>
                      <p>{data.coordinateur.banque || 'Banque inconnue'}</p>
                    </div>
                  </div>

                  <div className="bg-indigo-50/50 rounded-lg p-4 border border-indigo-100 space-y-2">
                    <div className="flex justify-between items-center text-sm">
                       <span className="text-slate-500">Montant Brut </span>
                       <span className="font-medium text-slate-700">{formatAmount(coordinateurFiche?.montantBrut || systemParameters?.prixCoordinationFixe)}</span>
                    </div>
                    <Separator className="bg-indigo-100" />
                    <div className="flex justify-between items-center">
                       <span className="text-emerald-700 font-bold uppercase text-xs">Net Coordination</span>
                       <span className="font-bold text-xl text-emerald-700">
                          {coordinateurFiche
                            ? formatAmount(coordinateurFiche.montantNet)
                            : formatAmount((systemParameters?.prixCoordinationFixe || 0) * (1 - (systemParameters?.tva || 0) / 100))
                          }
                       </span>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="outline"
                      className="flex-1 border-slate-200 text-slate-600"
                      disabled={!coordinateurFiche || downloadKey === 'coordination'}
                      onClick={() => downloadPdf({ key: 'coordination', filename: 'fiche_coordination.pdf', payload: { sessionId: data.session.id, type: 'COORDINATION' } })}
                    >
                      {downloadKey === 'coordination' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      <FileText className="mr-2 h-4 w-4" /> PDF
                    </Button>
                    <Button
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                      onClick={handleCoordinateurSubmit}
                      disabled={pendingActionId === 'COORDINATION'}
                    >
                      {pendingActionId === 'COORDINATION' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {coordinateurFiche ? 'Mettre à jour' : 'Valider fiche'}
                    </Button>
                  </div>
                </div>
              ) : (
                 <div className="text-center py-10 text-slate-400">
                    <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>Aucun coordinateur assigné.</p>
                 </div>
              )}
            </CardContent>
          </Card>

          {/* Card Règlement (Summary) */}
          <Card className="border-slate-200 shadow-lg ring-1 ring-slate-100 relative overflow-hidden bg-white">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-emerald-500"></div>
            <CardHeader className="bg-slate-50/30 border-b border-slate-100 pb-3">
              <CardTitle className="flex items-center gap-2 text-base text-slate-800">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                Mémoire de Règlement
              </CardTitle>
              <CardDescription>Synthèse globale de la session</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                  <span className="text-slate-500 text-sm">Total Formateurs (Net)</span>
                  <span className="font-semibold text-slate-700">{formatAmount(data.summary.totalFormateursNet)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                   <span className="text-slate-500 text-sm">Coordination (Net)</span>
                   <span className="font-semibold text-slate-700">{formatAmount(data.summary.totalCoordinateurNet)}</span>
                </div>
              </div>

              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex flex-col items-center justify-center text-center">
                 <span className="text-emerald-600 uppercase text-xs font-bold tracking-widest mb-1">Total Net à payer</span>
                 <span className="text-3xl font-extrabold text-emerald-700">{formatAmount(data.summary.totalNet)}</span>
              </div>

              {reglementFiche && (
                <p className="text-xs text-center text-slate-400">
                  Fiche généré le {new Date(reglementFiche.updatedAt).toLocaleDateString()}
                </p>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 border-slate-200 text-slate-600"
                  disabled={!reglementFiche || downloadKey === 'reglement'}
                  onClick={() => downloadPdf({ key: 'reglement', filename: `memoire_reglement_${data.session.id}.pdf`, payload: { sessionId: data.session.id, type: 'REGLEMENT' } })}
                >
                   {downloadKey === 'reglement' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                   Exporter
                </Button>
                <Button
                  className={`flex-1 ${reglementFiche ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                  onClick={handleReglementSubmit}
                  disabled={pendingActionId === 'REGLEMENT' || data.summary.totalNet === 0}
                >
                  {pendingActionId === 'REGLEMENT' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {reglementFiche ? 'Régénérer Mémoire' : 'Générer Mémoire'}
                </Button>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
}