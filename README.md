# MiniBnB - Application Full Stack

Application web type Airbnb avec gestion d'annonces, réservations et messagerie.

## 📋 Stack technique

- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Base de données**: PostgreSQL
- **Authentification**: JWT (access + refresh tokens)
- **Documentation API**: OpenAPI/Swagger
- **Tests**: Jest + Supertest

## 🏗️ Structure du projet

```
fullstack2026/
├── backend/          # API REST Node.js/Express
│   ├── src/
│   │   ├── config/       # Configuration
│   │   ├── controllers/  # Contrôleurs
│   │   ├── middleware/   # Middlewares
│   │   ├── models/       # Modèles
│   │   ├── routes/       # Routes API v1
│   │   └── utils/        # Utilitaires
│   └── package.json
├── frontend/         # Application React SPA
│   ├── src/
│   │   ├── components/   # Composants
│   │   ├── contexts/     # Contextes React
│   │   ├── pages/        # Pages
│   │   └── services/     # Services API
│   └── package.json
├── database/         # Scripts SQL
│   ├── schema.sql    # Schéma de base
│   └── seed.sql      # Données de test
└── docs/            # Documentation
```

## 🚀 Installation

### Prérequis

- Node.js 18+ et npm
- PostgreSQL 14+
- Git

### 1. Configuration de la base de données

**Option A : Si PostgreSQL est installé**

```bash
# Créer la base de données PostgreSQL
createdb minibnb

# Exécuter le schéma
psql minibnb < database/schema.sql

# Optionnel : Ajouter des données de test
psql minibnb < database/seed.sql
```

**Option B : Installation via Homebrew (macOS)**

```bash
# Installer PostgreSQL
brew install postgresql@15
brew services start postgresql@15

# Ajouter au PATH (ajouter à ~/.zshrc)
export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"

# Puis créer la base de données
createdb minibnb
psql minibnb < database/schema.sql
```

**Option C : Utiliser Docker**

```bash
# Démarrer PostgreSQL dans Docker
docker run --name minibnb-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=minibnb \
  -p 5432:5432 \
  -d postgres:15

# Exécuter le schéma
docker exec -i minibnb-postgres psql -U postgres -d minibnb < database/schema.sql
```

**Script d'aide automatique :**

```bash
./setup-database.sh
```

> 💡 **Note** : Si vous rencontrez des erreurs, consultez `docs/INSTALLATION.md` pour plus de détails.

### 2. Configuration du Backend

```bash
cd backend
npm install
```

Créer un fichier `.env` dans `backend/` avec :

```env
PORT=3000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=minibnb
DB_USER=thomasfoltzer  # Votre nom d'utilisateur système (pas "postgres" sur macOS/Homebrew)
DB_PASSWORD=  # Généralement vide pour l'utilisateur local
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
CORS_ORIGIN=http://localhost:5173
```

```bash
# Démarrer le serveur de développement
npm run dev
```

Le serveur démarre sur `http://localhost:3000`
La documentation Swagger est disponible sur `http://localhost:3000/api-docs`

### 3. Configuration du Frontend

```bash
cd frontend
npm install
```

Créer un fichier `.env` dans `frontend/` avec :

```env
VITE_API_URL=http://localhost:3000/api/v1
```

```bash
# Démarrer le serveur de développement
npm run dev
```

L'application démarre sur `http://localhost:5173`

## ✨ Fonctionnalités

### Authentification
- ✅ Inscription et connexion utilisateurs
- ✅ JWT avec access tokens (15 min) et refresh tokens (7 jours)
- ✅ Gestion automatique du refresh token

### Gestion des rôles
- ✅ **Utilisateur** : Rôle par défaut
- ✅ **Hôte** : Peut créer et gérer des annonces
- ✅ **Co-hôte** : Permissions déléguées par un hôte
  - Modifier les annonces
  - Gérer les réservations
  - Répondre aux messages

### Annonces
- ✅ Création, consultation, modification, suppression
- ✅ Filtres (ville, pays, prix, nombre de personnes)
- ✅ Images et équipements
- ✅ Cache HTTP (5 minutes)

### Réservations
- ✅ Création avec vérification des conflits de dates
- ✅ Calcul automatique du prix total
- ✅ Gestion des statuts (pending, confirmed, cancelled, completed)
- ✅ Visibilité pour le loueur et l'hôte

### Messagerie
- ✅ Conversations liées aux annonces
- ✅ Envoi et réception de messages
- ✅ Marquage des messages comme lus
- ✅ Accès pour les co-hôtes (selon permissions)

## 🎯 Exigences techniques respectées

### API REST
- ✅ Méthodes HTTP appropriées (GET, POST, PUT, PATCH, DELETE)
- ✅ Codes de statut HTTP normalisés (200, 201, 400, 401, 403, 404, 409, 500)
- ✅ Versionning de l'API (`/api/v1/`)
- ✅ Validation des données (express-validator)
- ✅ Gestion centralisée des erreurs

### Sécurité
- ✅ Authentification JWT avec refresh tokens
- ✅ Hash des mots de passe (bcrypt)
- ✅ Rate limiting (100 req/15min)
- ✅ Headers de sécurité (Helmet)
- ✅ CORS configuré

### Cache
- ✅ Cache HTTP côté navigateur (headers Cache-Control)
- ✅ Cache client avec React Query (5 min staleTime)

### Qualité
- ✅ Validation des données (backend + frontend)
- ✅ Gestion des erreurs complète
- ✅ Tests automatisés (Jest)
- ✅ Documentation API (Swagger/OpenAPI)
- ✅ Architecture documentée

## 📚 Documentation

- **Architecture** : Voir `docs/ARCHITECTURE.md`
- **API** : Accéder à `http://localhost:3000/api-docs` une fois le backend démarré

## 🧪 Tests

```bash
cd backend
npm test
```

## 📝 Scripts disponibles

### Backend
- `npm run dev` : Démarre le serveur de développement
- `npm run build` : Compile TypeScript
- `npm start` : Démarre le serveur en production
- `npm test` : Lance les tests

### Frontend
- `npm run dev` : Démarre le serveur de développement
- `npm run build` : Build de production
- `npm run preview` : Prévisualise le build de production

## 🔧 Configuration

### Variables d'environnement Backend

- `PORT` : Port du serveur (défaut: 3000)
- `NODE_ENV` : Environnement (development/production)
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` : Configuration PostgreSQL
- `JWT_SECRET` : Clé secrète pour JWT (à changer en production)
- `JWT_ACCESS_EXPIRY` : Durée de vie du access token (défaut: 15m)
- `JWT_REFRESH_EXPIRY` : Durée de vie du refresh token (défaut: 7d)
- `CORS_ORIGIN` : Origine autorisée pour CORS

### Variables d'environnement Frontend

- `VITE_API_URL` : URL de l'API backend (défaut: http://localhost:3000/api/v1)

## 📄 Licence

Ce projet est réalisé dans le cadre d'un TP/Examen pour Ynov 2026.
