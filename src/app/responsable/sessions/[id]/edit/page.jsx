'use client';
//app/responsable/sessions/[id]/edit/page.jsx
import { useEffect, useMemo, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Calendar, Users, Mail, Phone, BookOpen } from 'lucide-react';

const formatDateInput = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().split('T')[0];
};

export default function EditSessionPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params?.id;

  const [initialLoading, setInitialLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [titre, setTitre] = useState('');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [classe, setClasse] = useState('');
  const [specialite, setSpecialite] = useState('');
  const [promotion, setPromotion] = useState('');
  const [niveau, setNiveau] = useState('');
  const [semestre, setSemestre] = useState('');
  const [formateurIds, setFormateurIds] = useState([]);
  const [coordinateurId, setCoordinateurId] = useState('');

  const [formateurs, setFormateurs] = useState([]);
  const [coordinateurs, setCoordinateurs] = useState([]);

  useEffect(() => {
    if (!sessionId) return;

    const fetchData = async () => {
      try {
        const [sessionRes, formateursRes, coordRes] = await Promise.all([
          fetch(`/api/responsable/sessions/${sessionId}`),
          fetch('/api/users?role=FORMATEUR'),
          fetch('/api/users?role=COORDINATEUR'),
        ]);

        if (!sessionRes.ok) {
          alert('Session introuvable.');
          router.push('/responsable/sessions');
          return;
        }

        const sessionData = await sessionRes.json();
        setTitre(sessionData.titre || '');
        setDateDebut(formatDateInput(sessionData.dateDebut));
        setDateFin(formatDateInput(sessionData.dateFin));
        setClasse(sessionData.classe || '');
        setSpecialite(sessionData.specialite || '');
        setPromotion(sessionData.promotion || '');
        setNiveau(sessionData.niveau || '');
        setSemestre(sessionData.semestre || '');
        setFormateurIds(
          Array.isArray(sessionData.formateurs)
            ? sessionData.formateurs.map((f) => String(f.id))
            : []
        );
        setCoordinateurId(sessionData.coordinateur?.id ? String(sessionData.coordinateur.id) : '');

        if (formateursRes.ok) {
          const formateursData = await formateursRes.json();
          setFormateurs(formateursData);
        }

        if (coordRes.ok) {
          const coordData = await coordRes.json();
          setCoordinateurs(coordData);
        }
      } catch (error) {
        console.error('Erreur chargement session:', error);
        alert('Erreur lors du chargement des données.');
        router.push('/responsable/sessions');
      } finally {
        setInitialLoading(false);
      }
    };

    fetchData();
  }, [sessionId, router]);

  const selectedCoordinateur = useMemo(
    () => coordinateurs.find((c) => String(c.id) === String(coordinateurId)) || null,
    [coordinateurs, coordinateurId]
  );

  const selectedFormateurs = useMemo(
    () => formateurs.filter((f) => formateurIds.includes(String(f.id))),
    [formateurs, formateurIds]
  );

  const availableFormateurs = useMemo(
    () => formateurs.filter((f) => !formateurIds.includes(String(f.id))),
    [formateurs, formateurIds]
  );

  const handleFormateurSelect = (formateurId) => {
    if (!formateurIds.includes(formateurId)) {
      setFormateurIds([...formateurIds, formateurId]);
    }
  };

  const removeFormateur = (formateurId) => {
    setFormateurIds(formateurIds.filter((id) => id !== formateurId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (!titre.trim()) {
        alert('Le titre est obligatoire.');
        setSaving(false);
        return;
      }

      // Validation des dates
      const startDate = new Date(dateDebut);
      const endDate = new Date(dateFin);
      
      if (endDate < startDate) {
        alert('La date de fin doit être postérieure à la date de début.');
        setSaving(false);
        return;
      }

      // Validation de la longueur des champs
      if (titre.length > 255) {
        alert('Le titre ne doit pas dépasser 255 caractères.');
        setSaving(false);
        return;
      }

      if (classe && classe.length > 50) {
        alert('La classe ne doit pas dépasser 50 caractères.');
        setSaving(false);
        return;
      }

      if (specialite && specialite.length > 150) {
        alert('La spécialité ne doit pas dépasser 150 caractères.');
        setSaving(false);
        return;
      }

      if (promotion && promotion.length > 50) {
        alert('La promotion ne doit pas dépasser 50 caractères.');
        setSaving(false);
        return;
      }

      if (niveau && niveau.length > 50) {
        alert('Le niveau ne doit pas dépasser 50 caractères.');
        setSaving(false);
        return;
      }

      if (semestre && semestre.length > 50) {
        alert('Le semestre ne doit pas dépasser 50 caractères.');
        setSaving(false);
        return;
      }

      const payload = {
        titre: titre.trim(),
        dateDebut,
        dateFin,
        classe: classe || null,
        specialite: specialite || null,
        promotion: promotion || null,
        niveau: niveau || null,
        semestre: semestre || null,
        formateurIds: formateurIds.map(id => Number(id)),
        coordinateurId: coordinateurId ? Number(coordinateurId) : null,
      };

      const res = await fetch(`/api/responsable/sessions/${sessionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        alert('Session mise à jour avec succès ✅');
        router.push(`/responsable/sessions/${sessionId}`);
      } else {
        const data = await res.json().catch(() => ({}));
        alert(data.error || 'Erreur lors de la mise à jour de la session ❌');
      }
    } catch (error) {
      console.error('Erreur mise à jour session:', error);
      alert('Erreur interne du serveur.');
    } finally {
      setSaving(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-2 text-muted-foreground">Chargement des informations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl space-y-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Modifier la session</h1>
          <p className="text-muted-foreground mt-2">
            Mettez à jour les informations de la session de formation
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push(`/responsable/sessions/${sessionId}`)}>
          Retour
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Détails de la Formation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Informations de la Session
            </CardTitle>
            <CardDescription>
              Tous les champs marqués d'un * sont obligatoires
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="titre" className="text-muted-foreground">
                  Titre de la session *
                </Label>
                <Input
                  id="titre"
                  type="text"
                  value={titre}
                  onChange={(e) => setTitre(e.target.value)}
                  placeholder="Ex: Développement Web Fullstack"
                  className="font-semibold"
                  maxLength={255}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateDebut" className="text-muted-foreground">
                  Date de début *
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="dateDebut"
                    type="date"
                    value={dateDebut}
                    onChange={(e) => setDateDebut(e.target.value)}
                    className="pl-10 font-semibold"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateFin" className="text-muted-foreground">
                  Date de fin *
                </Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="dateFin"
                    type="date"
                    value={dateFin}
                    onChange={(e) => setDateFin(e.target.value)}
                    className="pl-10 font-semibold"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="classe" className="text-muted-foreground">Classe</Label>
                <Input
                  id="classe"
                  type="text"
                  value={classe}
                  onChange={(e) => setClasse(e.target.value)}
                  placeholder="Ex: Classe A, Groupe 1"
                  className="font-semibold"
                  maxLength={50}
                />
            
              </div>

              <div className="space-y-2">
                <Label htmlFor="specialite" className="text-muted-foreground">Spécialité</Label>
                <Input
                  id="specialite"
                  type="text"
                  value={specialite}
                  onChange={(e) => setSpecialite(e.target.value)}
                  placeholder="Ex: Informatique, Développement Web"
                  className="font-semibold"
                  maxLength={150}
                />
               
              </div>

              <div className="space-y-2">
                <Label htmlFor="promotion" className="text-muted-foreground">Promotion</Label>
                <Input
                  id="promotion"
                  type="text"
                  value={promotion}
                  onChange={(e) => setPromotion(e.target.value)}
                  placeholder="Ex: Promotion 2024"
                  className="font-semibold"
                  maxLength={50}
                />
                
              </div>

              <div className="space-y-2">
                <Label htmlFor="niveau" className="text-muted-foreground">Niveau</Label>
                <Input
                  id="niveau"
                  type="text"
                  value={niveau}
                  onChange={(e) => setNiveau(e.target.value)}
                  placeholder="Ex: Débutant, Intermédiaire, Avancé"
                  className="font-semibold"
                  maxLength={50}
                />
               
              </div>

              <div className="space-y-2">
                <Label htmlFor="semestre" className="text-muted-foreground">Semestre</Label>
                <Input
                  id="semestre"
                  type="text"
                  value={semestre}
                  onChange={(e) => setSemestre(e.target.value)}
                  placeholder="Ex: S1, S2, Semestre 1"
                  className="font-semibold"
                  maxLength={50}
                />
                
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Coordinateur */}
        <Card>
          <CardHeader>
            <CardTitle>Coordinateur</CardTitle>
            <CardDescription>
              Sélectionnez un coordinateur pour cette session (optionnel)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedCoordinateur ? (
              <div className="bg-white border rounded-lg p-6">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="flex items-center justify-center w-24 h-24 bg-gradient-to-br from-blue-400 to-purple-500 text-white rounded-full text-2xl font-bold">
                    {selectedCoordinateur.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">{selectedCoordinateur.name}</h3>
                    <p className="text-sm text-muted-foreground">Coordinateur Formation</p>
                  </div>
                  <div className="space-y-2 w-full">
                    <p className="text-sm flex items-center justify-center gap-2 text-blue-600">
                      <Mail className="h-4 w-4" />
                      {selectedCoordinateur.email}
                    </p>
                    {selectedCoordinateur.tel && (
                      <p className="text-sm flex items-center justify-center gap-2 text-blue-600">
                        <Phone className="h-4 w-4" />
                        {selectedCoordinateur.tel}
                      </p>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => setCoordinateurId('')}
                    className="w-full max-w-xs"
                  >
                    Retirer
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed">
                <div className="max-w-xs mx-auto">
                  <Label className="text-left block mb-2">Coordinateur assigné</Label>
                  <Select value={coordinateurId} onValueChange={setCoordinateurId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un coordinateur" />
                    </SelectTrigger>
                    <SelectContent>
                      {coordinateurs.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center justify-center w-6 h-6 bg-gradient-to-br from-blue-400 to-purple-500 text-white rounded-full text-xs font-bold">
                              {c.name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .toUpperCase()
                                .slice(0, 2)}
                            </div>
                            <div className="flex flex-col">
                              <span>{c.name}</span>
                              <span className="text-xs text-muted-foreground">{c.email}</span>


                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Formateurs */}
        <Card>
          <CardHeader>
            <CardTitle>Formateurs assignés</CardTitle>
            <CardDescription>
              Sélectionnez un ou plusieurs formateurs pour cette session
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedFormateurs.length > 0 ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {selectedFormateurs.map((formateur) => (
                    <div key={formateur.id} className="bg-white border rounded-lg p-6 relative">
                      <button
                        type="button"
                        onClick={() => removeFormateur(String(formateur.id))}
                        className="absolute top-2 right-2 p-1 hover:bg-gray-100 rounded-full"
                      >
                        <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                      </button>

                      <div className="flex flex-col items-center text-center space-y-3">
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                          Assigné
                        </Badge>

                        <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-600 text-white rounded-full text-2xl font-bold">
                          {formateur.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .toUpperCase()
                            .slice(0, 2)}
                        </div>

                        <h3 className="font-semibold text-lg">{formateur.name}</h3>

                        <div className="space-y-1 w-full text-sm">
                          <p className="flex items-center justify-center gap-2 text-blue-600">
                            <Mail className="h-3 w-3" />
                            {formateur.email}
                          </p>
                          {formateur.tel && (
                            <p className="flex items-center justify-center gap-2 text-blue-600">
                              <Phone className="h-3 w-3" />
                              {formateur.tel}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="bg-gray-50 border-2 border-dashed rounded-lg p-6 flex items-center justify-center">
                    <Select onValueChange={handleFormateurSelect}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="+ Ajouter un formateur" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableFormateurs.map((f) => (
                          <SelectItem key={f.id} value={String(f.id)}>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center justify-center w-6 h-6 bg-gradient-to-br from-orange-400 to-orange-600 text-white rounded-full text-xs font-bold">
                                {f.name
                                  .split(' ')
                                  .map((n) => n[0])
                                  .join('')
                                  .toUpperCase()
                                  .slice(0, 2)}
                              </div>
                              {f.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <div className="max-w-xs mx-auto">
                  <Select onValueChange={handleFormateurSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un formateur" />
                    </SelectTrigger>
                    <SelectContent>
                      {formateurs.map((f) => (
                        <SelectItem key={f.id} value={String(f.id)}>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center justify-center w-6 h-6 bg-gradient-to-br from-orange-400 to-orange-600 text-white rounded-full text-xs font-bold">
                              {f.name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .toUpperCase()
                                .slice(0, 2)}
                            </div>
                            {f.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-4 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/responsable/sessions/${sessionId}`)}
          >
            Annuler
          </Button>
          <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700">
            {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </Button>
        </div>
      </form>
    </div>
  );
}