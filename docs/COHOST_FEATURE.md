# Fonctionnalité de Gestion des Co-hôtes

## Description

Cette fonctionnalité permet aux hôtes de désigner des co-hôtes pour leurs annonces et de gérer leurs permissions.

## Fonctionnalités

### Pour les hôtes

1. **Ajouter un co-hôte**
   - Rechercher un utilisateur par email
   - Sélectionner l'utilisateur dans les résultats
   - Définir les permissions :
     - Peut modifier l'annonce
     - Peut gérer les réservations
     - Peut répondre aux messages
   - Ajouter l'utilisateur comme co-hôte

2. **Gérer les co-hôtes existants**
   - Voir la liste des co-hôtes pour chaque annonce
   - Modifier les permissions d'un co-hôte
   - Retirer un co-hôte

3. **Permissions disponibles**
   - `can_edit_listing` : Permet de modifier les détails de l'annonce
   - `can_manage_bookings` : Permet de gérer les réservations (accepter/refuser)
   - `can_respond_messages` : Permet de répondre aux messages des voyageurs

## Interface utilisateur

### Page "Mes annonces"

Chaque carte d'annonce comporte maintenant un bouton **"Co-hôtes"** qui ouvre une modal de gestion.

### Modal de gestion des co-hôtes

La modal comprend :
- Un champ de recherche pour trouver des utilisateurs par email
- Une section pour définir les permissions du nouveau co-hôte
- Une liste des co-hôtes actuels avec leurs permissions
- Des actions pour modifier ou retirer des co-hôtes

## API Endpoints

### Backend

1. **GET /api/v1/users/search?q={email}**
   - Recherche des utilisateurs par email
   - Réservé aux hôtes
   - Retourne max 10 résultats

2. **GET /api/v1/users/cohosts**
   - Liste tous les co-hôtes des annonces de l'hôte
   - Inclut les informations utilisateur

3. **POST /api/v1/users/cohosts**
   - Crée une nouvelle permission de co-hôte
   - Body: `{ listing_id, cohost_id, can_edit_listing?, can_manage_bookings?, can_respond_messages? }`

4. **PUT /api/v1/users/cohosts/:id**
   - Met à jour les permissions d'un co-hôte
   - Body: `{ can_edit_listing?, can_manage_bookings?, can_respond_messages? }`

5. **DELETE /api/v1/users/cohosts/:id**
   - Supprime une permission de co-hôte

## Base de données

### Table `cohost_permissions`

```sql
CREATE TABLE cohost_permissions (
  id SERIAL PRIMARY KEY,
  listing_id INTEGER REFERENCES listings(id),
  host_id INTEGER REFERENCES users(id),
  cohost_id INTEGER REFERENCES users(id),
  can_edit_listing BOOLEAN DEFAULT FALSE,
  can_manage_bookings BOOLEAN DEFAULT FALSE,
  can_respond_messages BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Fichiers modifiés/créés

### Frontend

- `src/services/user.service.ts` : Ajout des méthodes API pour les co-hôtes
- `src/components/ManageCohosts.tsx` : Composant principal de gestion
- `src/components/ManageCohosts.css` : Styles du composant
- `src/pages/MyListings.tsx` : Intégration du bouton et de la modal
- `src/pages/MyListings.css` : Ajout du style pour le bouton co-hôtes

### Backend

- `src/controllers/user.controller.ts` : Ajout de `searchUsers` et amélioration de `getCohosts`
- `src/routes/v1/user.routes.ts` : Ajout de la route de recherche

## Utilisation

1. Accédez à la page "Mes annonces"
2. Cliquez sur le bouton **"Co-hôtes"** d'une annonce
3. Dans la modal :
   - Entrez un email dans le champ de recherche
   - Cliquez sur **"Rechercher"**
   - Sélectionnez un utilisateur dans les résultats
   - Cochez les permissions souhaitées
   - Cliquez sur **"Ajouter comme co-hôte"**

Pour modifier les permissions d'un co-hôte existant :
1. Modifiez les cases à cocher dans la section "Co-hôtes actuels"
2. Cliquez sur **"Sauvegarder"**

Pour retirer un co-hôte :
1. Cliquez sur le bouton **"Retirer"** à côté du co-hôte
2. Confirmez l'action

## Notes techniques

- Le rôle de l'utilisateur est automatiquement mis à jour en "cohost" lors de l'ajout
- Les permissions sont spécifiques à chaque annonce
- Un utilisateur peut être co-hôte pour plusieurs annonces
- La recherche est limitée à 10 résultats pour des raisons de performance
