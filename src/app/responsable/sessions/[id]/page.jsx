'use client';
import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Clock, Users, User, Mail, Phone, MapPin, Download, Check, X } from 'lucide-react';

// Petit carousel responsive sans dépendances
function Carousel({ items = [], renderItem, maxVisible = 3, perPage }) {
  const [page, setPage] = React.useState(0);
  const initialVisible = perPage ?? maxVisible;
  const [visible, setVisible] = React.useState(initialVisible);
  const containerRef = React.useRef(null);

  // Ajuster visible selon la largeur - SI perPage est fourni, on l'utilise toujours
  React.useEffect(() => {
    if (perPage !== undefined) {
      setVisible(perPage);
      setPage(0);
      return;
    }

    // Sinon, on utilise la logique responsive normale
    const update = () => {
      const w = window.innerWidth;
      if (w < 640) setVisible(1);
      else if (w < 1024) setVisible(2);
      else setVisible(maxVisible);
      setPage(0);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [maxVisible, perPage]);

  const pages = Math.max(1, Math.ceil(items.length / visible));

  React.useEffect(() => {
    if (page >= pages) setPage(0);
  }, [pages, page]);

  const prev = () => setPage((p) => Math.max(0, p - 1));
  const next = () => setPage((p) => Math.min(p + 1, pages - 1));

  return (
    <div>
      <div className="relative">
        <div className="overflow-hidden" ref={containerRef}>
          <div
            className="flex transition-transform duration-300 ease-in-out"
            style={{ width: `${(items.length / visible) * 100}%`, transform: `translateX(-${page * 100}%)` }}
          >
            {items.map((it, idx) => (
              <div key={it.id ?? idx} style={{ flex: `0 0 ${100 / visible}%` }} className="px-2">
                {renderItem(it, idx)}
              </div>
            ))}
          </div>
        </div>

        {/* Controls */}
        {pages > 1 && (
          <>
            <button onClick={prev} className="absolute left-1 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-1 shadow hidden md:block">
              ‹
            </button>
            <button onClick={next} className="absolute right-1 top-1/2 -translate-y-1/2 bg-white/80 rounded-full p-1 shadow hidden md:block">
              ›
            </button>
          </>
        )}
      </div>

      {/* Dots */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-3">
          {Array.from({ length: pages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i)}
              className={`w-2 h-2 rounded-full ${i === page ? 'bg-gray-800' : 'bg-gray-300'}`}
              aria-label={`Page ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SessionDetailPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formateurs, setFormateurs] = useState([]);
  const [coordinateurs, setCoordinateurs] = useState([]);
  const [selectedFormateurs, setSelectedFormateurs] = useState([]);
  
  // Mettre les formateurs assignés en tête pour les mettre en avant
  const orderedFormateurs = React.useMemo(() => {
    if (!formateurs) return [];
    const assigned = formateurs.filter((f) => selectedFormateurs.includes(f.id));
    const others = formateurs.filter((f) => !selectedFormateurs.includes(f.id));
    return [...assigned, ...others];
  }, [formateurs, selectedFormateurs]);

  useEffect(() => {
    if (id) {
      fetchSession();
    }
  }, [id]);

  useEffect(() => {
    if (session) {
      fetchUsers();
    }
  }, [session?.id]);

  // Calculer et formater la durée entre dateDebut et dateFin
  const formatDuration = (start, end) => {
    if (!start || !end) return session?.dureeJours ? `${session.dureeJours} jours` : 'N/A';
    try {
      const s = new Date(start);
      const e = new Date(end);
      if (isNaN(s) || isNaN(e)) return session?.dureeJours ? `${session.dureeJours} jours` : 'N/A';

      // Nombre total de jours
      const msPerDay = 1000 * 60 * 60 * 24;
      const days = Math.round((e - s) / msPerDay);

      // Calculer les mois entiers entre les deux dates
      let months = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth());
      // Ajuster si le jour de fin est avant le jour de début
      if (e.getDate() < s.getDate()) months -= 1;

      if (months >= 1) {
        // Calculer jours restants après les mois entiers
        const mid = new Date(s.getFullYear(), s.getMonth() + months, s.getDate());
        let remainingDays = Math.round((e - mid) / msPerDay);
        if (isNaN(remainingDays) || remainingDays < 0) remainingDays = 0;
        return remainingDays > 0 ? `${months} mois et ${remainingDays} j` : `${months} mois`;
      }

      return `${days} jours`;
    } catch (err) {
      return session?.dureeJours ? `${session.dureeJours} jours` : 'N/A';
    }
  };

  const fetchSession = async () => {
    try {
      const res = await fetch(`/api/responsable/sessions/${id}`);
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json();
      setSession(data);
      setSelectedFormateurs(data.formateurs?.map((f) => f.id) || []);
    } catch (err) {
      console.error('Erreur lors du chargement de la session:', err);
      router.push('/responsable/sessions');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const [resFormateurs, resCoord] = await Promise.all([
        fetch('/api/users?role=FORMATEUR'),
        fetch('/api/users?role=COORDINATEUR'),
      ]);

      if (resFormateurs.ok) {
        const fetchedFormateurs = await resFormateurs.json();
        // Ne plus vérifier la disponibilité (fonctionnalité supprimée)
        // On affiche tous les formateurs et on permet d'accepter quel que soit l'agenda
        setFormateurs(fetchedFormateurs);
      }
      if (resCoord.ok) {
        const allCoordinateurs = await resCoord.json();
        if (session?.coordinateur) {
          setCoordinateurs(allCoordinateurs.filter(c => c.id !== session.coordinateur.id));
        } else {
          setCoordinateurs(allCoordinateurs);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
    }
  };

  useEffect(() => {
    if (coordinateurs.length > 0 || formateurs.length > 0) {
      const updateCoordinateurs = async () => {
        try {
          const res = await fetch('/api/users?role=COORDINATEUR');
          if (res.ok) {
            const allCoordinateurs = await res.json();
            if (session?.coordinateur) {
              setCoordinateurs(allCoordinateurs.filter(c => c.id !== session.coordinateur.id));
            } else {
              setCoordinateurs(allCoordinateurs);
            }
          }
        } catch (error) {
          console.error('Erreur lors de la mise à jour des coordinateurs:', error);
        }
      };
      updateCoordinateurs();
    }
  }, [session?.coordinateur]);

  const handleAssignCoordinateur = async (coordinateurId) => {
    try {
      const res = await fetch(`/api/responsable/sessions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coordinateurId: coordinateurId || null }),
      });
      
      if (res.ok) {
        const updatedSession = await res.json();
        setSession(updatedSession);
        await fetchUsers();
      } else {
        const error = await res.json();
      }
    } catch (err) {
      console.error('Erreur:', err);
    }
  };

  // Utilitaire pour mettre à jour la liste des formateurs assignés côté serveur
  const updateAssignedFormateurs = async (newAssignedIds) => {
    try {
      const res = await fetch(`/api/responsable/sessions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formateurIds: newAssignedIds }),
      });

      if (res.ok) {
        const updatedSession = await res.json();
        setSession(updatedSession);
        setSelectedFormateurs(newAssignedIds);
      } else {
        const err = await res.json();
        console.error('Erreur API assignation formateurs:', err);
        alert(err?.error || 'Erreur lors de la mise à jour des formateurs');
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour des formateurs:', error);
    }
  };

  // Fonction pour gérer l'acceptation d'un formateur (assignation)
  const handleAcceptFormateur = async (formateurId) => {
    try {
      if (selectedFormateurs.includes(formateurId)) return;
      const newAssigned = [...selectedFormateurs, formateurId];
      await updateAssignedFormateurs(newAssigned);
      alert('Formateur accepté et assigné à la session');
    } catch (error) {
      console.error('Erreur lors de l\'acceptation:', error);
    }
  };

  // Fonction pour retirer un formateur (désassignation)
  const handleRemoveFormateur = async (formateurId) => {
    try {
      if (!selectedFormateurs.includes(formateurId)) return;
      const newAssigned = selectedFormateurs.filter((fid) => fid !== formateurId);
      await updateAssignedFormateurs(newAssigned);
      alert('Formateur retiré de la session');
    } catch (error) {
      console.error('Erreur lors du retrait:', error);
    }
  };

  // Fonction pour télécharger le CV
  const handleDownloadCV = async (formateurId) => {
    try {
      // Si votre API expose un endpoint de téléchargement, redirigez
      // Exemple hypothétique : /api/users/{id}/cv
      window.open(`/api/users/${formateurId}/cv`, '_blank');
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-64">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-muted-foreground">Chargement...</p>
      </div>
    </div>
  );

  if (!session) return (
    <div className="text-center py-10">
      <div className="text-destructive mb-4">Session non trouvée</div>
      <Button onClick={() => router.push('/responsable/sessions')}>
        Retour aux sessions
      </Button>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Détails de la Formation</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne gauche - Détails et sections principales */}
        <div className="lg:col-span-2 space-y-6">
          {/* Détails de la formation */}
          <Card>
            <CardHeader>
              <CardTitle>Détails de la Formation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Nom de la formation</Label>
                  <p className="font-semibold">{session.titre}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Durée</Label>
                  <p className="font-semibold">{formatDuration(session.dateDebut, session.dateFin)}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Date de début</Label>
                  <p className="font-semibold">
                    {new Date(session.dateDebut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Date de fin</Label>
                  <p className="font-semibold">
                    {new Date(session.dateFin).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
  
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Formateur</Label>
                  <div className="font-semibold">
                    {session.formateurs && session.formateurs.length > 0 ? (
                      <p>
                        {session.formateurs.map((f) => (
                           <span key={f.id}> {f.name} , </span>
                        ))}
                      </p>
                    ) : (
                      <p>Non spécifié</p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Coordinateurs assignés - N'afficher que si aucun coordinateur n'est assigné */}
          {!session.coordinateur && coordinateurs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Coordinateur assignés</CardTitle>
              </CardHeader>
              <CardContent>
                <Carousel
                  items={coordinateurs}
                  maxVisible={3}
                  perPage={3} // FORCER 3 éléments visibles
                  renderItem={(coordinateur) => (
                    <div className="bg-white border rounded-lg p-6">
                      <div className="flex flex-col items-center text-center space-y-3">
                          <div className="flex items-center justify-center w-20 h-20 bg-linear-to-br from-blue-400 to-purple-500 text-white rounded-full text-2xl font-bold">
                          {coordinateur.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-base">{coordinateur.name}</h3>
                        </div>
                        <div className="space-y-1 w-full text-sm">
                          <p className="flex items-center justify-center gap-2 text-blue-600">
                            <Mail className="h-3 w-3" />
                            {coordinateur.email}
                          </p>
                          {coordinateur.telephone && (
                            <p className="flex items-center justify-center gap-2 text-blue-600">
                              <Phone className="h-3 w-3" />
                              {coordinateur.telephone}
                            </p>
                          )}
                        </div>
                        <div className="w-full space-y-2 pt-2">
                          <Button size="sm" className="w-full bg-orange-500 hover:bg-orange-600 text-white" onClick={() => handleDownloadCV(coordinateur.id)}>
                            <Download className="h-3 w-3 mr-2" />
                            Télécharger CV
                          </Button>

                          <Button 
                            size="sm" 
                            className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                            onClick={() => handleAssignCoordinateur(coordinateur.id)}
                          >
                            assigné
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                />
              </CardContent>
            </Card>
          )}

          {/* Formateurs assignés */}
          <Card>
            <CardHeader>
              <CardTitle>Formateurs assignés</CardTitle>
            </CardHeader>
            <CardContent>
              {formateurs?.length > 0 ? (
                <Carousel
                  items={orderedFormateurs}
                  maxVisible={4}
                  perPage={4} // FORCER 3 éléments visibles
                  renderItem={(formateur) => {
                    const isAssigned = selectedFormateurs.includes(formateur.id);
                    return (
                      <div className="bg-white border rounded-lg p-4 ">
                        <div className="flex flex-col items-center text-center space-y-2 transition-transform duration-200 ease-in-out">
                <div className="w-full flex justify-center mb-1">
                            {isAssigned ? (
                              <Badge variant="secondary" className="bg-green-100 text-green-700">Assigné</Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-gray-100 text-gray-700">Disponible</Badge>
                            )}
                          </div>-


                          <div className="flex items-center justify-center w-14 h-14 bg-linear-to-br from-orange-400 to-orange-600 text-white rounded-full text-lg font-bold">
                            {formateur.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </div>

                          <h3 className="font-semibold text-sm truncate max-w-full">{formateur.name}</h3>

                          <div className="space-y-1 w-full text-xs">
                            <p className="flex items-center justify-center gap-2 text-blue-600">
                              <Mail className="h-3 w-3" />
                              {formateur.email}
                            </p>
                            {formateur.telephone && (
                              <p className="flex items-center justify-center gap-2 text-blue-600">
                                <Phone className="h-3 w-3" />
                                {formateur.telephone}
                              </p>
                            )}
                          </div>

                          <div className="w-full space-y-2 pt-1">
                            <Button size="sm" className="w-full bg-orange-500 hover:bg-orange-600 text-white py-1" onClick={() => handleDownloadCV(formateur.id)}>
                              <Download className="h-3 w-3 mr-2" />
                              Télécharger CV
                            </Button>

                            {isAssigned ? (
                              <Button size="sm" variant="destructive" className="w-full py-1" onClick={() => handleRemoveFormateur(formateur.id)}>
                                Retirer
                              </Button>
                            ) : (
                              <Button size="sm" className="bg-green-500 hover:bg-green-600 text-white w-full py-1" onClick={() => handleAcceptFormateur(formateur.id)}>
                                <Check className="h-3 w-3 mr-1" />
                                Accepter
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  }}
                />
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">Aucun formateur disponible</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Colonne droite - Coordinateur actuel */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Coordinateur</CardTitle>
            </CardHeader>
            <CardContent>
              {session.coordinateur ? (
                <div className="bg-white rounded-lg">
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="flex items-center justify-center w-24 h-24 bg-linear-to-br from-blue-400 to-purple-500 text-white rounded-full text-2xl font-bold">
                      {session.coordinateur.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{session.coordinateur.name}</h3>
                      <p className="text-sm text-muted-foreground">Coordinateur Formation</p>
                    </div>
                    <div className="space-y-2 w-full">
                      <p className="text-sm flex items-center justify-center gap-2 text-blue-600">
                        <Mail className="h-4 w-4" />
                        {session.coordinateur.email}
                      </p>
                      {session.coordinateur.telephone && (
                        <p className="text-sm flex items-center justify-center gap-2 text-blue-600">
                          <Phone className="h-4 w-4" />
                          {session.coordinateur.telephone}
                        </p>
                      )}
                      {session.coordinateur.adresse && (
                        <p className="text-sm flex items-center justify-center gap-2 text-blue-600">
                          <MapPin className="h-4 w-4" />
                          {session.coordinateur.adresse}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      className="w-full bg-blue-500 text-white hover:bg-blue-600"
                    >
                      Voir l'historique
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleAssignCoordinateur(null)}
                      className="w-full"
                    >
                      Retirer
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed">
                  <p className="text-muted-foreground mb-4">Aucun coordinateur assigné</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}