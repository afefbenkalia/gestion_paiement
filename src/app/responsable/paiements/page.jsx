'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, ClipboardCheck, Euro, Users } from 'lucide-react';

const currencyFormatter = new Intl.NumberFormat('fr-TN', {
  style: 'currency',
  currency: 'TND',
  minimumFractionDigits: 2,
});

const formatAmount = (value) => currencyFormatter.format(Number(value || 0));

export default function PaiementsPage() {
  const [sessions, setSessions] = useState([]);
  const [systemParameters, setSystemParameters] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-6 flex flex-col gap-2">
        <div>
          <h1 className="text-3xl font-bold">Paiements</h1>
          <p className="text-gray-600">
            Consultez l’état des fiches formateurs, coordinateurs et mémoires de règlement.
          </p>
        </div>

        {systemParameters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <Card className="shadow-sm">
              <CardContent className="py-4">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  Prix horaire formateur
                </p>
                <p className="text-xl font-semibold">
                  {formatAmount(systemParameters.prixHeureFormation)}
                </p>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="py-4">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4 text-primary" />
                  Coordination par session
                </p>
                <p className="text-xl font-semibold">
                  {formatAmount(systemParameters.prixCoordinationFixe)}
                </p>
              </CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardContent className="py-4">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Euro className="h-4 w-4 text-primary" />
                  TVA appliquée
                </p>
                <p className="text-xl font-semibold">{systemParameters.tva}%</p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      <Card className="shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl">Sessions & fiches de paie</CardTitle>
          {error && (
            <p className="text-sm text-destructive">
              {error}{' '}
              <button
                type="button"
                onClick={fetchSessions}
                className="underline underline-offset-2 ml-1"
              >
                Réessayer
              </button>
            </p>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-16 text-center text-muted-foreground">Chargement des sessions…</div>
          ) : sessions.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              Aucune session n’a encore de fiches de paiement.
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((session) => (
                <Card key={session.id} className="border shadow-sm">
                  <CardHeader className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-lg">{session.titre}</CardTitle>
                        <Badge
                          variant={session.statut === 'COMPLET' ? 'default' : 'secondary'}
                          className={
                            session.statut === 'COMPLET'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }
                        >
                          {session.statut === 'COMPLET' ? 'Mémoire validé' : 'En attente'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                        <CalendarDays className="h-4 w-4" />
                        {session.periode}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {session.nbFormateurs} formateur(s) •{' '}
                        {session.coordinateur ? session.coordinateur.name : 'Aucun coordinateur'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs uppercase text-muted-foreground tracking-wide">
                        Total net
                      </p>
                      <p className="text-xl font-semibold">
                        {formatAmount(session.summary.totalNet)}
                      </p>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                      <div className="p-3 rounded-lg bg-slate-50">
                        <p className="text-xs text-muted-foreground uppercase">Formateurs (net)</p>
                        <p className="text-lg font-semibold">
                          {formatAmount(session.summary.totalFormateursNet)}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-50">
                        <p className="text-xs text-muted-foreground uppercase">Coordination (net)</p>
                        <p className="text-lg font-semibold">
                          {formatAmount(session.summary.totalCoordinateurNet)}
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-50">
                        <p className="text-xs text-muted-foreground uppercase">
                          Fiches manquantes
                        </p>
                        <p className="text-lg font-semibold">
                          {session.summary.pendingFormateurs || 0}
                        </p>
                      </div>
                    </div>
                    <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <p className="text-sm text-muted-foreground">
                        {session.summary.pendingFormateurs > 0
                          ? `${session.summary.pendingFormateurs} fiche(s) formateur à compléter.`
                          : 'Toutes les fiches formateurs sont complètes.'}
                      </p>
                      <Button asChild>
                        <Link href={`/responsable/paiements/session/${session.id}`}>
                          Ouvrir les fiches
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

