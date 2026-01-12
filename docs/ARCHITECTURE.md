# Architecture MiniBnB

## Vue d'ensemble

MiniBnB est une application web full stack de type Airbnb avec une architecture en 3 tiers :

1. **Frontend** : Application React SPA (Single Page Application)
2. **Backend** : API REST Node.js/Express
3. **Base de données** : PostgreSQL

## Structure du projet

```
fullstack2026/
├── backend/              # API REST
│   ├── src/
│   │   ├── config/       # Configuration (DB, etc.)
│   │   ├── controllers/  # Contrôleurs métier
│   │   ├── middleware/   # Middlewares (auth, validation, cache)
│   │   ├── models/       # Modèles de données
│   │   ├── routes/       # Routes API
│   │   │   └── v1/       # Version 1 de l'API
│   │   ├── utils/        # Utilitaires (JWT, password)
│   │   └── server.ts     # Point d'entrée
│   └── package.json
├── frontend/             # Application React
│   ├── src/
│   │   ├── components/   # Composants réutilisables
│   │   ├── contexts/     # Contextes React (Auth)
│   │   ├── pages/        # Pages de l'application
│   │   ├── services/     # Services API
│   │   └── App.tsx       # Composant principal
│   └── package.json
├── database/             # Scripts SQL
│   ├── schema.sql        # Schéma de base de données
│   └── seed.sql          # Données de test
└── docs/                 # Documentation
```

## Architecture Backend

### API REST - Version 1

Toutes les routes sont préfixées par `/api/v1/` pour permettre le versionning.

#### Routes disponibles :

- **Auth** (`/api/v1/auth`)
  - `POST /register` - Inscription
  - `POST /login` - Connexion
  - `POST /refresh` - Rafraîchir le token

- **Users** (`/api/v1/users`)
  - `GET /profile` - Profil utilisateur
  - `PUT /profile` - Mettre à jour le profil
  - `POST /become-host` - Devenir hôte
  - `GET /cohosts` - Liste des co-hôtes
  - `POST /cohosts` - Créer un co-hôte
  - `PUT /cohosts/:id` - Mettre à jour un co-hôte
  - `DELETE /cohosts/:id` - Supprimer un co-hôte

- **Listings** (`/api/v1/listings`)
  - `GET /` - Liste des annonces (avec filtres)
  - `GET /:id` - Détails d'une annonce
  - `GET /my-listings` - Mes annonces
  - `POST /` - Créer une annonce
  - `PUT /:id` - Mettre à jour une annonce
  - `DELETE /:id` - Supprimer une annonce

- **Bookings** (`/api/v1/bookings`)
  - `GET /` - Liste des réservations (hôte)
  - `GET /my-bookings` - Mes réservations
  - `GET /:id` - Détails d'une réservation
  - `POST /` - Créer une réservation
  - `PATCH /:id/status` - Mettre à jour le statut
  - `DELETE /:id` - Annuler une réservation

- **Messages** (`/api/v1/messages`)
  - `GET /conversations` - Liste des conversations
  - `GET /conversations/:id` - Détails d'une conversation
  - `POST /conversations` - Créer une conversation
  - `GET /conversations/:id/messages` - Messages d'une conversation
  - `POST /conversations/:id/messages` - Envoyer un message
  - `POST /conversations/:id/read` - Marquer comme lu

### Sécurité

- **Authentification JWT** : Access tokens (15 min) + Refresh tokens (7 jours)
- **Hash des mots de passe** : bcrypt avec 10 rounds
- **Rate limiting** : 100 requêtes par 15 minutes par IP
- **Helmet** : Headers de sécurité HTTP
- **CORS** : Configuration pour le frontend

### Cache

- **Cache HTTP** : Headers `Cache-Control` sur les requêtes GET (5 minutes)
- **Cache client** : React Query avec staleTime de 5 minutes

## Architecture Frontend

### Technologies

- **React 18** avec TypeScript
- **React Router** pour la navigation
- **React Query** pour la gestion des données et du cache
- **React Hook Form** pour les formulaires
- **Axios** pour les requêtes HTTP

### Gestion d'état

- **AuthContext** : État d'authentification global
- **React Query** : Cache et synchronisation des données serveur

### Services API

Tous les appels API sont centralisés dans le dossier `services/` :
- `api.ts` : Configuration Axios avec intercepteurs
- `auth.service.ts` : Authentification
- `user.service.ts` : Gestion utilisateur
- `listing.service.ts` : Annonces
- `booking.service.ts` : Réservations
- `message.service.ts` : Messagerie

## Base de données

### Schéma principal

- **users** : Utilisateurs (user, host, cohost)
- **listings** : Annonces
- **bookings** : Réservations
- **conversations** : Conversations de messagerie
- **messages** : Messages
- **cohost_permissions** : Permissions des co-hôtes

### Relations

- Un utilisateur peut être hôte de plusieurs annonces
- Une annonce peut avoir plusieurs réservations
- Une annonce peut avoir plusieurs conversations
- Une conversation peut avoir plusieurs messages
- Un hôte peut déléguer des permissions à des co-hôtes

## Gestion des rôles

### Rôles disponibles

1. **user** : Utilisateur standard (par défaut)
2. **host** : Hôte (peut créer et gérer des annonces)
3. **cohost** : Co-hôte (permissions déléguées par un hôte)

### Permissions des co-hôtes

- `can_edit_listing` : Modifier les annonces
- `can_manage_bookings` : Gérer les réservations
- `can_respond_messages` : Répondre aux messages

## Bonnes pratiques REST

✅ **Méthodes HTTP appropriées** : GET, POST, PUT, PATCH, DELETE
✅ **Codes de statut HTTP** : 200, 201, 400, 401, 403, 404, 409, 500
✅ **Versionning de l'API** : `/api/v1/`
✅ **Validation des données** : express-validator
✅ **Gestion des erreurs** : Middleware centralisé
✅ **Documentation API** : Swagger/OpenAPI

## Tests

- **Backend** : Jest + Supertest
- Tests unitaires pour les contrôleurs
- Tests d'intégration pour les routes

## Déploiement

### Prérequis

- Node.js 18+
- PostgreSQL 14+
- npm ou yarn

### Installation

1. Installer les dépendances backend et frontend
2. Configurer les variables d'environnement
3. Créer la base de données et exécuter les migrations
4. Démarrer les serveurs

Voir le README.md pour les instructions détaillées.
