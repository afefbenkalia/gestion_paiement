'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, BookOpen, User, Mail, Phone } from 'lucide-react';
import { CoordinateurSwipe, FormateursSwipe } from '@/components/session-assignment-swipe';

export default function CreateSessionPage() {
  const router = useRouter();

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
  const [currentCoordinateur, setCurrentCoordinateur] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const [formateursRes, coordRes] = await Promise.all([
          fetch('/api/users?role=FORMATEUR'),
          fetch('/api/users?role=COORDINATEUR'),
        ]);

        if (formateursRes.ok && coordRes.ok) {
          const formateursData = await formateursRes.json();
          const coordData = await coordRes.json();
          setFormateurs(formateursData);
          setCoordinateurs(coordData);
        }
      } catch (error) {
        console.error('Erreur chargement utilisateurs:', error);
      }
    }
    fetchUsers();
  }, []);

  const handleFormateurToggle = (formateurId) => {
    if (formateurIds.includes(formateurId)) {
      setFormateurIds(formateurIds.filter(id => id !== formateurId));
    } else {
      setFormateurIds([...formateurIds, formateurId]);
    }
  };

  const handleCoordinateurSelect = (coordId) => {
    setCoordinateurId(coordId);
    // Mettre à jour le coordinateur actuel si disponible
    const selectedCoord = coordinateurs.find(coord => String(coord.id) === coordId);
    if (selectedCoord) {
      setCurrentCoordinateur(selectedCoord);
    }
  };

  const handleRemoveCoordinateur = () => {
    setCoordinateurId('');
    setCurrentCoordinateur(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!titre.trim()) {
        setLoading(false);
        return;
      }

      const payload = {
        titre: titre.trim(),
        dateDebut,
        dateFin,
        classe,
        specialite,
        promotion,
        niveau,
        semestre,
        formateurIds,
        coordinateurId: coordinateurId || null,
      };

      const res = await fetch('/api/responsable/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        router.push('/responsable/sessions');
      } else {
        const data = await res.json().catch(() => ({}));
      }
    } catch (error) {
      console.error('Erreur création session:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full px-4 py-6 space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Création de Session</h1>
        <p className="text-muted-foreground mt-2">
          Créer une nouvelle session de formation
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Détails de la Formation */}
          <div className="lg:col-span-2">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="titre" className="text-muted-foreground">Titre de la session *</Label>
                <Input
                  id="titre"
                  type="text"
                  value={titre}
                  onChange={(e) => setTitre(e.target.value)}
                  placeholder="Ex: Développement Web Fullstack"
                  className="font-semibold"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateDebut" className="text-muted-foreground">Date de début *</Label>
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
                <Label htmlFor="dateFin" className="text-muted-foreground">Date de fin *</Label>
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
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="promotion" className="text-muted-foreground">Promotion</Label>
                <Input
                  id="promotion"
                  type="text"
                  value={promotion}
                  onChange={(e) => setPromotion(e.target.value)}
                  placeholder="Ex: Promotion 2024, Promotion 2025"
                  className="font-semibold"
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
                />
              </div>
            </div>
          </CardContent>
        </Card>
          </div>

          {/* Coordinateur Actuel */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Coordinateur Actuel
                </CardTitle>
              </CardHeader>
              <CardContent>
                {currentCoordinateur ? (
                  <div className="flex flex-col items-center text-center space-y-4">
                    <div className="flex items-center justify-center w-20 h-20 bg-linear-to-br from-blue-400 to-purple-500 text-white rounded-full text-xl font-bold">
                      {currentCoordinateur.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    <h3 className="text-lg font-bold">{currentCoordinateur.name}</h3>
                    <p className="text-sm text-muted-foreground">Coordinateur Formation</p>
                    <p className="text-sm text-blue-600 flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      {currentCoordinateur.email}
                    </p>
                    {currentCoordinateur.tel && (
                      <p className="text-sm text-blue-600 flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        {currentCoordinateur.tel}
                      </p>
                    )}
                    <Button 
                      type="button"
                      variant="destructive" 
                      size="sm"
                      className="w-full" 
                      onClick={handleRemoveCoordinateur}
                    >
                      Retirer le coordinateur
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed">
                    <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">Aucun coordinateur assigné</p>
                    <p className="text-sm text-muted-foreground">
                      Sélectionnez un coordinateur dans la section ci-dessous
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Coordinateur Disponible */}
        <CoordinateurSwipe
          coordinateurs={coordinateurs}
          selectedId={coordinateurId}
          onSelect={handleCoordinateurSelect}
        />

        {/* Formateurs */}
        <FormateursSwipe
          formateurs={formateurs}
          selectedIds={formateurIds}
          onToggle={handleFormateurToggle}
        />

        {/* Boutons d'action */}
        <div className="flex gap-4 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/responsable/sessions')}
          >
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? 'Création...' : 'Créer la session'}
          </Button>
        </div>
      </form>
    </div>
  );
}