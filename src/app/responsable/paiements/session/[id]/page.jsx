'use client';
//src/app/responsable/paiements/session/[id]/page.jsx
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ClipboardCheck, Loader2, ShieldCheck, Users } from 'lucide-react';

const currencyFormatter = new Intl.NumberFormat('fr-TN', {
  style: 'currency',
  currency: 'TND',
  minimumFractionDigits: 2,
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
      'Fiche formateur enregistrée.'
    );
  };

  const handleCoordinateurSubmit = () => {
    runAction({ type: 'COORDINATION' }, 'Fiche coordinateur mise à jour.');
  };

  const handleReglementSubmit = () => {
    runAction({ type: 'REGLEMENT' }, 'Mémoire de règlement généré.');
  };

  const computePreview = (formateurId) => {
    if (!systemParameters) return { heures: 0, brut: 0, net: 0 };
    const values = formateurValues[formateurId] || {};
    const tutorat = Number(values.totalTutorat) || 0;
    const regroupement = Number(values.totalRegroupement) || 0;
    const heures = tutorat + regroupement;
    const montantBrut = heures * systemParameters.prixHeureFormation;
    const montantNet = montantBrut / (1 + (systemParameters.tva / 100));
    return { heures, montantBrut, montantNet };
  };

  const coordinateurFiche = data?.fiches?.coordinateur;
  const reglementFiche = data?.fiches?.reglement;

  if (!sessionId) {
    return (
      <div className="p-8">
        <p className="text-destructive">Identifiant de session manquant.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-96 text-muted-foreground gap-4">
        <Loader2 className="h-8 w-8 animate-spin" />
        Chargement des fiches de paiement…
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto py-12 text-center space-y-4">
        <p className="text-destructive">{error}</p>
        <Button onClick={() => router.back()} variant="outline">
          Retour
        </Button>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
      <div className="flex flex-col gap-3">
        <Button
          variant="ghost"
          className="w-fit px-0 text-muted-foreground"
          asChild
        >
          <Link href="/responsable/paiements" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Retour aux paiements
          </Link>
        </Button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">{data.session.titre}</h1>
            {reglementFiche ? (
              <Badge className="bg-emerald-100 text-emerald-800">Mémoire validé</Badge>
            ) : (
              <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                En attente
              </Badge>
            )}
          </div>
          <p className="text-gray-600 mt-1">{data.session.periode}</p>
        </div>
      </div>

      {feedback && (
        <div
          className={`rounded-lg border px-4 py-3 ${
            feedback.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {feedback.message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Informations session</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs uppercase text-muted-foreground">Classe</p>
              <p className="font-medium">{data.session.classe || 'Non renseignée'}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">Spécialité</p>
              <p className="font-medium">{data.session.specialite || 'Non renseignée'}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">Promotion</p>
              <p className="font-medium">{data.session.promotion || 'Non renseignée'}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">Niveau</p>
              <p className="font-medium">{data.session.niveau || 'Non renseigné'}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Paramètres système</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Prix horaire formateur</span>
              <span className="font-semibold">
                {formatAmount(systemParameters?.prixHeureFormation)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Montant coordination</span>
              <span className="font-semibold">
                {formatAmount(systemParameters?.prixCoordinationFixe)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>TVA appliquée</span>
              <span className="font-semibold">{systemParameters?.tva}%</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Fiches des formateurs
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Renseignez les heures tutorat et regroupement pour chaque formateur.
            </p>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {data.formateurs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucun formateur assigné à cette session.
            </p>
          ) : (
            data.formateurs.map((formateur) => {
              const preview = computePreview(formateur.id);
              return (
                <div
                  key={formateur.id}
                  className="border rounded-lg p-4 space-y-4 shadow-sm"
                >
                  <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-semibold">{formateur.name}</p>
                      <p className="text-sm text-muted-foreground">{formateur.email}</p>
                      <p className="text-xs text-muted-foreground">
                        CIN: {formateur.cin || '—'} • RIB: {formateur.rib || '—'}
                      </p>
                    </div>
                    <Badge
                      variant={formateur.fiche ? 'default' : 'secondary'}
                      className={
                        formateur.fiche
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }
                    >
                      {formateur.fiche ? 'Fiche enregistrée' : 'En attente'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <div>
                      <p className="text-xs uppercase text-muted-foreground mb-1">
                        Total regroupement
                      </p>
                      <Input
                        type="number"
                        min="0"
                        step="0.25"
                        value={formateurValues[formateur.id]?.totalRegroupement ?? ''}
                        onChange={(e) =>
                          handleFormateurChange(formateur.id, 'totalRegroupement', e.target.value)
                        }
                      />
                    </div>
                    <div>
                      <p className="text-xs uppercase text-muted-foreground mb-1">
                        Total tutorat
                      </p>
                      <Input
                        type="number"
                        min="0"
                        step="0.25"
                        value={formateurValues[formateur.id]?.totalTutorat ?? ''}
                        onChange={(e) =>
                          handleFormateurChange(formateur.id, 'totalTutorat', e.target.value)
                        }
                      />
                    </div>
                    <div className="rounded-lg bg-slate-50 p-3 text-sm">
                      <p className="text-xs uppercase text-muted-foreground">Heures totales</p>
                      <p className="font-semibold">{preview.heures.toFixed(2)}</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-3 text-sm space-y-1">
                      <p className="text-xs uppercase text-muted-foreground">Montant brut</p>
                      <p className="font-semibold">{formatAmount(preview.montantBrut)}</p>
                      <p className="text-xs uppercase text-muted-foreground">Montant net</p>
                      <p className="font-semibold">{formatAmount(preview.montantNet)}</p>
                    </div>
                  </div>

                  {formateur.fiche && (
                    <div className="text-xs text-muted-foreground">
                      Dernière mise à jour :{' '}
                      {new Date(formateur.fiche.updatedAt).toLocaleString('fr-FR')}
                      {' • '}
                      Mémoire n° {formateur.fiche.numMemoire}
                    </div>
                  )}

                  <div className="flex flex-col gap-2 md:flex-row md:justify-end">
                    <Button
                      variant="outline"
                      disabled={!formateur.fiche || downloadKey === `formation-${formateur.id}`}
                      onClick={() =>
                        downloadPdf({
                          key: `formation-${formateur.id}`,
                          filename: `memoire-formation-${data.session.id}-${formateur.id}.pdf`,
                          payload: {
                            sessionId: data.session.id,
                            type: 'FORMATION',
                            formateurId: formateur.id,
                          },
                        })
                      }
                    >
                      {downloadKey === `formation-${formateur.id}` && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Exporter PDF
                    </Button>
                    <Button
                      onClick={() => handleFormateurSubmit(formateur.id)}
                      disabled={pendingActionId === formateur.id}
                    >
                      {pendingActionId === formateur.id && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Enregistrer la fiche
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5 text-primary" />
              Fiche coordinateur
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.coordinateur ? (
              <>
                <div>
                  <p className="text-sm font-semibold">{data.coordinateur.name}</p>
                  <p className="text-sm text-muted-foreground">{data.coordinateur.email}</p>
                  <p className="text-xs text-muted-foreground">
                    RIB: {data.coordinateur.rib || '—'} • Banque:{' '}
                    {data.coordinateur.banque || '—'}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 p-3 text-sm space-y-1">
                  <p className="text-xs uppercase text-muted-foreground">Montant brut</p>
                  <p className="font-semibold">
                    {formatAmount(coordinateurFiche?.montantBrut || systemParameters?.prixCoordinationFixe)}
                  </p>
                  <p className="text-xs uppercase text-muted-foreground">Montant net</p>
                  <p className="font-semibold">
                    {coordinateurFiche
                      ? formatAmount(coordinateurFiche.montantNet)
                      : formatAmount(
                          (systemParameters?.prixCoordinationFixe || 0) /
                            (1 + (systemParameters?.tva || 0) / 100)
                        )}
                  </p>
                </div>
                {coordinateurFiche && (
                  <p className="text-xs text-muted-foreground">
                    Mémoire n° {coordinateurFiche.numMemoire} — mis à jour le{' '}
                    {new Date(coordinateurFiche.updatedAt).toLocaleString('fr-FR')}
                  </p>
                )}
                <div className="flex flex-col gap-2 sm:flex-row sm:justify-start">
                  <Button
                    variant="outline"
                    disabled={!coordinateurFiche || downloadKey === 'coordination'}
                    onClick={() =>
                      downloadPdf({
                        key: 'coordination',
                        filename: `memoire-coordination-${data.session.id}.pdf`,
                        payload: {
                          sessionId: data.session.id,
                          type: 'COORDINATION',
                        },
                      })
                    }
                  >
                    {downloadKey === 'coordination' && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Exporter PDF
                  </Button>
                  <Button
                    onClick={handleCoordinateurSubmit}
                    disabled={pendingActionId === 'COORDINATION'}
                  >
                    {pendingActionId === 'COORDINATION' && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {coordinateurFiche ? 'Mettre à jour la fiche' : 'Créer la fiche coordinateur'}
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Aucun coordinateur n’est assigné à cette session.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              Mémoire de règlement
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-slate-50 p-3 text-sm space-y-1">
              <div className="flex justify-between">
                <span>Total formateurs (net)</span>
                <span className="font-semibold">
                  {formatAmount(data.summary.totalFormateursNet)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Total coordination (net)</span>
                <span className="font-semibold">
                  {formatAmount(data.summary.totalCoordinateurNet)}
                </span>
              </div>
              <div className="flex justify-between text-base font-semibold">
                <span>Total net</span>
                <span>{formatAmount(data.summary.totalNet)}</span>
              </div>
            </div>
            {reglementFiche && (
              <p className="text-xs text-muted-foreground">
                Mémoire n° {reglementFiche.numMemoire} — généré le{' '}
                {new Date(reglementFiche.updatedAt).toLocaleString('fr-FR')}
              </p>
            )}
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-start">
              <Button
                variant="outline"
                disabled={!reglementFiche || downloadKey === 'reglement'}
                onClick={() =>
                  downloadPdf({
                    key: 'reglement',
                    filename: `memoire-reglement-${data.session.id}.pdf`,
                    payload: {
                      sessionId: data.session.id,
                      type: 'REGLEMENT',
                    },
                  })
                }
              >
                {downloadKey === 'reglement' && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Exporter PDF
              </Button>
              <Button
                onClick={handleReglementSubmit}
                disabled={pendingActionId === 'REGLEMENT' || data.summary.totalNet === 0}
              >
                {pendingActionId === 'REGLEMENT' && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {reglementFiche ? 'Mettre à jour le mémoire' : 'Générer le mémoire'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

