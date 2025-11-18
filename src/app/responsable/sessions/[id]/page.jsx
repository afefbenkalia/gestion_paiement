'use client';
import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Mail, Phone, MapPin, Download, Check, Users, BookOpen, Calendar, User, GraduationCap } from 'lucide-react';
//app/responsable/sessions/[id]/page.jsx
// =============================
//  Petit carousel responsive
// =============================
function Carousel({ items = [], renderItem, maxVisible = 3, perPage }) {
  const [page, setPage] = React.useState(0);
  const initialVisible = perPage ?? maxVisible;
  const [visible, setVisible] = React.useState(initialVisible);
  const containerRef = React.useRef(null);

  React.useEffect(() => {
    if (perPage !== undefined) {
      setVisible(perPage);
      setPage(0);
      return;
    }

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

// =============================
//  Page principale
// =============================
export default function SessionDetailPage({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formateurs, setFormateurs] = useState([]);
  const [coordinateurs, setCoordinateurs] = useState([]);
  const [selectedFormateurs, setSelectedFormateurs] = useState([]);

  const orderedFormateurs = React.useMemo(() => {
    if (!formateurs) return [];
    const assigned = formateurs.filter((f) => selectedFormateurs.includes(f.id));
    const others = formateurs.filter((f) => !selectedFormateurs.includes(f.id));
    return [...assigned, ...others];
  }, [formateurs, selectedFormateurs]);

  useEffect(() => {
    if (id) fetchSession();
  }, [id]);

  useEffect(() => {
    if (session?.id) {
      fetchUsers();
    }
  }, [session?.id]);

  // =============================
  //  Fonction pour formater durée
  // =============================
  const formatDuration = (start, end) => {
    if (!start || !end) return session?.dureeJours ? `${session.dureeJours} jours` : 'N/A';
    try {
      const s = new Date(start);
      const e = new Date(end);
      if (isNaN(s) || isNaN(e)) return session?.dureeJours ? `${session.dureeJours} jours` : 'N/A';

      const msPerDay = 1000 * 60 * 60 * 24;
      const days = Math.round((e - s) / msPerDay);

      let months = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth());
      if (e.getDate() < s.getDate()) months -= 1;

      if (months >= 1) {
        const mid = new Date(s.getFullYear(), s.getMonth() + months, s.getDate());
        let remainingDays = Math.round((e - mid) / msPerDay);
        if (isNaN(remainingDays) || remainingDays < 0) remainingDays = 0;
        return remainingDays > 0 ? `${months} mois et ${remainingDays} jours` : `${months} mois`;
      }
      return `${days} jours`;
    } catch {
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
        const formateursData = await resFormateurs.json();
        setFormateurs(formateursData);
      }
      if (resCoord.ok) {
        const allCoord = await resCoord.json();
        // Filtrer pour exclure le coordinateur actuellement assigné
        if (session?.coordinateur) {
          setCoordinateurs(allCoord.filter(c => c.id !== session.coordinateur.id));
        } else {
          setCoordinateurs(allCoord);
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
    }
  };

  const handleAssignCoordinateur = async (coordinateurId) => {
    try {
      // Sauvegarder l'ancien coordinateur s'il existe
      const ancienCoordinateur = session?.coordinateur;
      
      const res = await fetch(`/api/responsable/sessions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          coordinateurId: coordinateurId || null,
          // Conserver tous les autres champs existants
          titre: session.titre,
          dateDebut: session.dateDebut,
          dateFin: session.dateFin,
          classe: session.classe,
          specialite: session.specialite,
          promotion: session.promotion,
          niveau: session.niveau,
          semestre: session.semestre,
          formateurIds: session.formateurs?.map(f => f.id) || []
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        
        // Mettre à jour la session avec le nouveau coordinateur
        setSession(updated);
        
        // Mettre à jour la liste des coordinateurs disponibles
        setCoordinateurs(prev => {
          // Retirer le coordinateur assigné de la liste
          let newList = prev.filter(c => c.id !== coordinateurId);
          
          // Si un ancien coordinateur existait, le remettre dans la liste
          if (ancienCoordinateur) {
            // Vérifier qu'il n'est pas déjà dans la liste
            if (!newList.find(c => c.id === ancienCoordinateur.id)) {
              newList = [...newList, ancienCoordinateur];
            }
          }
          
          return newList;
        });
      }
    } catch (err) {
      console.error('Erreur:', err);
      alert('Erreur lors de l\'assignation du coordinateur');
    }
  };

  const handleRemoveCoordinateur = async () => {
    try {
      // Sauvegarder le coordinateur actuel avant de le retirer
      const coordinateurARetirer = session?.coordinateur;
      
      if (!coordinateurARetirer) return;
      
      const res = await fetch(`/api/responsable/sessions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          coordinateurId: null,
          // Conserver tous les autres champs existants
          titre: session.titre,
          dateDebut: session.dateDebut,
          dateFin: session.dateFin,
          classe: session.classe,
          specialite: session.specialite,
          promotion: session.promotion,
          niveau: session.niveau,
          semestre: session.semestre,
          formateurIds: session.formateurs?.map(f => f.id) || []
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        
        // Mettre à jour la session (coordinateur sera null)
        setSession(updated);
        
        // Remettre le coordinateur retiré dans la liste des disponibles
        setCoordinateurs(prev => {
          // Vérifier qu'il n'est pas déjà dans la liste
          if (!prev.find(c => c.id === coordinateurARetirer.id)) {
            return [...prev, coordinateurARetirer];
          }
          return prev;
        });
      }
    } catch (err) {
      console.error('Erreur:', err);
      alert('Erreur lors de la suppression du coordinateur');
    }
  };

  const updateAssignedFormateurs = async (newAssignedIds) => {
    try {
      const res = await fetch(`/api/responsable/sessions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          formateurIds: newAssignedIds,
          // Conserver tous les autres champs existants
          titre: session.titre,
          dateDebut: session.dateDebut,
          dateFin: session.dateFin,
          classe: session.classe,
          specialite: session.specialite,
          promotion: session.promotion,
          niveau: session.niveau,
          semestre: session.semestre,
          coordinateurId: session.coordinateur?.id || null
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setSession(updated);
        setSelectedFormateurs(newAssignedIds);
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour des formateurs:', error);
    }
  };

  const handleAcceptFormateur = async (formateurId) => {
    if (selectedFormateurs.includes(formateurId)) return;
    const newAssigned = [...selectedFormateurs, formateurId];
    await updateAssignedFormateurs(newAssigned);
    alert('Formateur accepté et assigné à la session');
  };

  const handleRemoveFormateur = async (formateurId) => {
    if (!selectedFormateurs.includes(formateurId)) return;
    const newAssigned = selectedFormateurs.filter((fid) => fid !== formateurId);
    await updateAssignedFormateurs(newAssigned);
    alert('Formateur retiré de la session');
  };

  const handleDownloadCV = (formateurId) => {
    window.open(`/api/users/${formateurId}/cv`, '_blank');
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );

  if (!session)
    return (
      <div className="text-center py-10">
        <div className="text-destructive mb-4">Session non trouvée</div>
        <Button onClick={() => router.push('/responsable/sessions')}>Retour aux sessions</Button>
      </div>
    );

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Détails de la Session</h1>
          <p className="text-muted-foreground mt-2">
            Informations complètes de la session de formation
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => router.push(`/responsable/sessions/${session.id}/edit`)}
          >
            Modifier la session
          </Button>
          <Button 
            variant="outline" 
            onClick={() => router.push('/responsable/sessions')}
          >
            Retour aux sessions
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Détails de la formation */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Informations de la Session
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-muted-foreground">Titre de la session</Label>
                    <p className="font-semibold text-lg">{session.titre}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-muted-foreground">Date de début</Label>
                      <p className="font-semibold flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {new Date(session.dateDebut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Date de fin</Label>
                      <p className="font-semibold flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {new Date(session.dateFin).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-muted-foreground">Durée</Label>
                    <p className="font-semibold">{formatDuration(session.dateDebut, session.dateFin)}</p>
                  </div>

                  {session.classe && (
                    <div>
                      <Label className="text-muted-foreground">Classe</Label>
                      <p className="font-semibold">{session.classe}</p>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {session.specialite && (
                    <div>
                      <Label className="text-muted-foreground">Spécialité</Label>
                      <p className="font-semibold">{session.specialite}</p>
                    </div>
                  )}

                  {session.promotion && (
                    <div>
                      <Label className="text-muted-foreground">Promotion</Label>
                      <p className="font-semibold">{session.promotion}</p>
                    </div>
                  )}

                  {session.niveau && (
                    <div>
                      <Label className="text-muted-foreground">Niveau</Label>
                      <p className="font-semibold">{session.niveau}</p>
                    </div>
                  )}

                  {session.semestre && (
                    <div>
                      <Label className="text-muted-foreground">Semestre</Label>
                      <p className="font-semibold">{session.semestre}</p>
                    </div>
                  )}

                  <div>
                    <Label className="text-muted-foreground">Formateurs assignés</Label>
                    <div className="font-semibold">
                      {session.formateurs?.length ? (
                        <div className="flex flex-wrap gap-1">
                          {session.formateurs.map(f => (
                            <Badge key={f.id} variant="secondary" className="bg-orange-100 text-orange-700">
                              {f.name}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Aucun formateur assigné</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Liste coordinateurs disponibles */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Coordinateurs Disponibles
              </CardTitle>
            </CardHeader>
            <CardContent>
              {coordinateurs?.length > 0 ? (
                <Carousel
                  items={coordinateurs}
                  maxVisible={3}
                  perPage={3}
                  renderItem={(c) => (
                    <div className="bg-white border rounded-lg p-4">
                      <div className="flex flex-col items-center text-center space-y-2">
                        <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-400 to-purple-500 text-white rounded-full text-lg font-bold">
                          {c.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                        <h3 className="font-semibold text-sm">{c.name}</h3>
                        <p className="text-xs text-blue-600 flex items-center justify-center gap-1">
                          <Mail className="h-3 w-3" />{c.email}
                        </p>
                        {c.tel && (
                          <p className="text-xs text-blue-600 flex items-center justify-center gap-1">
                            <Phone className="h-3 w-3" />{c.tel}
                          </p>
                        )}
                        <Button 
                          size="sm" 
                          className="bg-blue-600 hover:bg-blue-700 w-full text-white py-1"
                          onClick={() => handleAssignCoordinateur(c.id)}
                        >
                          Assigner
                        </Button>
                      </div>
                    </div>
                  )}
                />
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">Aucun coordinateur disponible</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Liste formateurs */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Formateurs Disponibles
              </CardTitle>
            </CardHeader>
            <CardContent>
              {formateurs?.length > 0 ? (
                <Carousel
                  items={orderedFormateurs}
                  maxVisible={5}
                  perPage={5}
                  renderItem={(f) => {
                    const isAssigned = selectedFormateurs.includes(f.id);
                    return (
                      <div className="bg-white border rounded-lg p-4">
                        <div className="flex flex-col items-center text-center space-y-2">
                          <Badge variant="secondary" className={isAssigned ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}>
                            {isAssigned ? 'Assigné' : 'Disponible'}
                          </Badge>
                          <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-600 text-white rounded-full text-lg font-bold">
                            {f.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                          </div>
                          <h3 className="font-semibold text-sm">{f.name}</h3>
                          <p className="text-xs text-blue-600 flex items-center justify-center gap-1">
                            <Mail className="h-3 w-3" />{f.email}
                          </p>
                          {f.tel && (
                            <p className="text-xs text-blue-600 flex items-center justify-center gap-1">
                              <Phone className="h-3 w-3" />{f.tel}
                            </p>
                          )}
                          <Button 
                            size="sm" 
                            className="bg-orange-500 hover:bg-orange-600 w-full text-white py-1" 
                            onClick={() => handleDownloadCV(f.id)}
                          >
                            <Download className="h-3 w-3 mr-1" /> CV
                          </Button>
                          {isAssigned ? (
                            <Button 
                              size="sm" 
                              variant="destructive" 
                              className="w-full py-1" 
                              onClick={() => handleRemoveFormateur(f.id)}
                            >
                              Retirer
                            </Button>
                          ) : (
                            <Button 
                              size="sm" 
                              className="bg-green-500 hover:bg-green-600 w-full text-white py-1" 
                              onClick={() => handleAcceptFormateur(f.id)}
                            >
                              <Check className="h-3 w-3 mr-1" /> Assigner
                            </Button>
                          )}
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

        {/* Coordinateur actuel */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Coordinateur Actuel
              </CardTitle>
            </CardHeader>
            <CardContent>
              {session.coordinateur ? (
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-500 text-white rounded-full text-2xl font-bold">
                    {session.coordinateur.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                  <h3 className="text-xl font-bold">{session.coordinateur.name}</h3>
                  <p className="text-sm text-muted-foreground">Coordinateur Formation</p>
                  <p className="text-sm text-blue-600 flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {session.coordinateur.email}
                  </p>
                  {session.coordinateur.tel && (
                    <p className="text-sm text-blue-600 flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      {session.coordinateur.tel}
                    </p>
                  )}
                  <Button 
                    variant="destructive" 
                    className="w-full" 
                    onClick={handleRemoveCoordinateur}
                  >
                    Retirer le coordinateur
                  </Button>
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">Aucun coordinateur assigné</p>
                  <p className="text-sm text-muted-foreground">
                    Sélectionnez un coordinateur dans la liste des disponibles
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}