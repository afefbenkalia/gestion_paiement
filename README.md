# Système de Gestion des Paiements pour un centre de formation

Application web complète pour la gestion des sessions de formation, des fiches de paie et du suivi des paiements pour les formateurs et coordinateurs.

## 🎯 Vue d'ensemble

Système multi-rôles permettant de gérer l'ensemble du cycle de vie des sessions de formation, depuis leur création jusqu'au paiement des intervenants (formateurs et coordinateurs).

## 👥 Rôles et Fonctionnalités

###  RESPONSABLE

**Gestion des Sessions**
- Créer, modifier et supprimer des sessions de formation
- Assigner des coordinateurs et formateurs aux sessions
- Définir les paramètres de session (dates, spécialité, classe, niveau, etc.)
- Recherche avancée et filtrage des sessions
- Vue détaillée de chaque session avec toutes ses informations

**Gestion des Utilisateurs**
- Validation/rejet des nouvelles inscriptions
- Gestion des coordinateurs et formateurs (consultation, modification, suppression)
- Activation/désactivation de comptes
- Notifications en temps réel des nouvelles inscriptions

**Gestion des Paiements**
- Génération de fiches de paie pour formations et coordinations
- Export des données (Excel, PDF)
- Historique complet des paiements
- Suivi de l'avancement des paiements (graphique par semaine/mois/année)

**Paramètres Système**
- Configuration des taux horaires (formation regroupement/tutorat, coordination)
- Gestion des retenues (TVA)
- Paramètres globaux du système

**Statistiques et Tableaux de Bord**
- Nombre total de sessions, coordinateurs et formateurs
- Progression des paiements avec visualisation graphique (Chart.js)
- Sélection de période (semaine, mois, année)

###  COORDINATEUR

**Mes Sessions**
- Consultation des sessions dont il est coordinateur
- Vue détaillée avec informations complètes

**Fiches de Paie**
- Consultation des fiches de coordination
- Détails : montant brut, retenues, montant net
- Génération et téléchargement de PDF
- Informations bancaires (RIB, banque)

**Historique**
- Liste complète des fiches de paie traitées (type COORDINATION uniquement)
- Recherche et filtrage par numéro, période, montant

**Profil**
- Mise à jour des informations personnelles (fonction, CIN, téléphone)
- Champs RIB et Banque en lecture seule (sécurisé)
- Upload de CV
- Changement de mot de passe

###  FORMATEUR

**Mes Sessions**
- Consultation des sessions où il intervient
- Informations sur le coordinateur et les autres formateurs
- Accès aux fiches de paie par session

**Fiches de Paie**
- Consultation détaillée des fiches de formation
- Détails bancaires et retenues

**Historique**
- Liste des fiches traitées (type FORMATION uniquement)

**Profil**
- Mise à jour de la spécialité, CIN, téléphone
- RIB et Banque en lecture seule
- Upload de CV
- Changement de mot de passe sécurisé

## 🛠️ Technologies Utilisées

### Frontend
- **Next.js 15** - Framework React avec App Router
- **React 19** - Bibliothèque UI
- **Tailwind CSS 4** - Framework CSS utility-first
- **Framer Motion** - Animations fluides
- **Chart.js + react-chartjs-2** - Graphiques et statistiques
- **Lucide React** - Icônes modernes
- **React Hook Form + Zod** - Gestion et validation de formulaires
- **Sonner** - Notifications toast élégantes

### Backend
- **Next.js API Routes** - Endpoints REST
- **NextAuth.js** - Authentification et gestion de sessions
- **Prisma ORM** - Gestion de base de données
- **MySQL** - Base de données relationnelle

### Utilitaires
- **PDFLib + PDFKit** - Génération de PDF
- **XLSX** - Export Excel
- **Tesseract.js** - OCR pour extraction RIB
- **Nodemailer** - Envoi d'emails
- **bcryptjs** - Hachage de mots de passe
- **written-number** - Conversion nombres en lettres (français)

## 📋 Fonctionnalités Clés

### Authentification
- Inscription avec validation par responsable
- Connexion sécurisée avec NextAuth
- Gestion des sessions utilisateur
- Statuts : INACTIVE, ACTIVE
- Page d'attente pour utilisateurs non validés

### Gestion des Sessions
- Création avec formulaire complet (dates, spécialité, classe, niveau, semestre, promotion)
- Assignment multiple de formateurs
- Assignment d'un coordinateur
- Modification et suppression 
- Recherche avancée multi-critères
- Cartes de session avec design moderne et responsive

### Fiches de Paie
- Génération automatique avec calculs (brut, retenues, net)
- Distinction FORMATION / COORDINATION
- Répartition des heure : regroupement et tutorat pour les formations
- Informations complètes : session, responsable, dates
- Montants en chiffres et en lettres
- Génération PDF avec mise en page professionnelle

### Gestion des Paiements
- Liste des fiches en attente 
- États : EN ATTENTE, EN COURS, VALIDE
- Export Excel de la liste complète
- Export PDF individuel 

### Statistiques et Tableaux de Bord
- Dashboard responsable avec KPIs (sessions, coordinateurs, formateurs)
- Graphique de progression des paiements (payé vs en attente)
- Sélecteur de période : semaine, mois, année
- Notifications en temps réel

### Extraction RIB avec OCR (Tesseract.js)
**Fonctionnalité d'automatisation pour les profils coordinateur et formateur**
- **Upload d'Image** : Support des formats courants (JPG, PNG, PDF)
- **Reconnaissance Optique de Caractères (OCR)** : 
  - Utilise Tesseract.js pour extraire le texte de l'image
  - Traitement côté client pour sécurité et rapidité
- **Extraction Intelligente du RIB** :
  - Détection automatique de la séquence de 20 chiffres consécutifs
  - Remplissage automatique du champ RIB
  - Validation format (exactement 20 chiffres)



### Autocomplete Banques Tunisiennes
**Liste intelligente pour sélection rapide**
- **Source de Données** : Liste pré-chargée dans `src/data/tunisianBanks.js`
- **Recherche Dynamique** :
  - Filtrage en temps réel au fur et à mesure de la saisie
  - Recherche insensible à la casse
- **Interface Utilisateur** :
  - Dropdown responsive avec scroll
  - Fermeture automatique après sélection
  - Validation de l'entrée utilisateur

### Profil Utilisateur
- Mise à jour informations personnelles
- Validation CIN (8 chiffres) et RIB (20 chiffres)
- **OCR pour Extraction RIB** : 
  - Upload d'image (RIB)
  - Reconnaissance automatique du texte via Tesseract.js
  - Extraction intelligente du numéro RIB (20 chiffres)
  - Validation et remplissage automatique du champ RIB
- **Autocomplete Banques Tunisiennes** :
  - Liste complète des banques tunisiennes pré-chargée
  - Suggestions dynamiques au fur et à mesure de la saisie
  - Sélection simple par clic
  - Dropdown intuitif et responsive
- Upload CV 
- Changement de mot de passe sécurisé
- Champs RIB/Banque en lecture seule pour formateurs et coordinateurs

### Export et Rapports
- Export Excel des paiements (liste complète avec filtres)
- Génération PDF individuelle des fiches
- Téléchargement direct depuis navigateur

## 🚀 Installation

```bash
# Cloner le repository
git clone <repository-url>
cd gestion_paiement

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env.local
# Éditer .env.local avec vos paramètres (DATABASE_URL, NEXTAUTH_SECRET, etc.)

# Initialiser la base de données
npx prisma migrate dev

# Seed initial (optionnel)
npm run prisma:seed

# Lancer le serveur de développement
npm run dev
```

L'application sera accessible sur `http://localhost:3000`



## 🔒 Sécurité

- Hachage de mots de passe avec bcryptjs
- Sessions sécurisées avec NextAuth
- Validation côté client et serveur (Zod)
- Protection des routes par middleware
- Vérification des rôles sur chaque endpoint API
- RIB et informations bancaires en lecture seule pour formateurs/coordinateurs

## 📊 Graphiques et Visualisations

- Chart.js pour graphiques de progression des paiements
- Affichage dynamique par période (semaine, mois, année)
- Animations et interactions fluides

## 🎨 Design et UX

- Interface moderne et responsive
- Palette de couleurs cohérente (bleu principal)
- Animations avec Framer Motion
- Cartes avec effets hover
- Messages d'erreur clairs

## 📝 Scripts NPM

```bash
npm run dev          # Serveur de développement
npm run build        # Build de production
npm start            # Serveur de production
npm run lint         # Linter ESLint
npm run prisma:seed  # Seed de la base de données
```



