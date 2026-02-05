# Mise à jour des permissions Co-hôtes

## Problème résolu

Les co-hôtes recevaient des permissions mais ne pouvaient pas accéder aux fonctionnalités car l'interface était réservée aux hôtes uniquement. Ce problème a été entièrement résolu.

## Changements effectués

### 1. Navigation (Navbar)

**Fichier modifié:** `frontend/src/components/Navbar.tsx`

- Les co-hôtes (role === 'cohost') peuvent maintenant accéder à :
  - **Mes annonces** : Affiche les annonces où ils sont co-hôtes
  - **Réservations reçues** : Affiche les réservations des annonces qu'ils gèrent
- Seuls les hôtes peuvent accéder à "Créer une annonce"
- Le compteur de réservations en attente inclut maintenant les co-hôtes

### 2. Page "Mes annonces" (MyListings)

**Fichiers modifiés:**
- `frontend/src/pages/MyListings.tsx`
- `frontend/src/services/listing.service.ts`
- `backend/src/controllers/listing.controller.ts`

#### Frontend
- Intégration du contexte AuthContext pour vérifier le rôle de l'utilisateur
- Les boutons d'action s'affichent selon les permissions :
  - **Voir** : Tous les utilisateurs
  - **Éditer** : Uniquement si `can_edit_listing` ou si propriétaire
  - **Co-hôtes** : Uniquement pour le propriétaire
  - **Supprimer** : Uniquement pour le propriétaire
- Le bouton "Créer" n'apparaît que pour les hôtes
- Message d'état vide adapté selon le rôle (hôte vs co-hôte)

#### Backend
- Retourne maintenant `cohost_permissions` avec chaque annonce pour les co-hôtes
- Les permissions incluent :
  - `can_edit_listing`
  - `can_manage_bookings`
  - `can_respond_messages`

### 3. Édition des annonces (EditListing)

**Fichier vérifié:** `backend/src/controllers/listing.controller.ts`

- Le backend vérifie déjà que les co-hôtes avec `can_edit_listing = true` peuvent modifier les annonces
- Aucun changement frontend nécessaire car la page utilise déjà l'API sécurisée

### 4. Réservations reçues (HostBookings)

**Fichiers modifiés:**
- `frontend/src/pages/HostBookings.tsx`
- `backend/src/controllers/booking.controller.ts`

#### Frontend
- La page accepte maintenant les co-hôtes (`role === 'cohost'`)
- Redirection uniquement si l'utilisateur n'est ni hôte ni co-hôte

#### Backend
- `getBookings()` : Récupère les réservations des annonces où le co-hôte a `can_manage_bookings = true`
- `getPendingBookingsCount()` : Compte les réservations en attente pour les co-hôtes avec permissions
- `updateBookingStatus()` : Vérifie déjà les permissions des co-hôtes

### 5. Messages

**Fichier modifié:** `backend/src/controllers/message.controller.ts`

#### getConversations()
- Les co-hôtes avec `can_respond_messages = true` voient maintenant les conversations des annonces qu'ils gèrent
- Fusion et déduplication des conversations provenant de plusieurs sources

#### Fonctions déjà sécurisées
- `getConversationById()` : Vérifie `can_respond_messages`
- `sendMessage()` : Vérifie `can_respond_messages`
- `markAsRead()` : Déjà fonctionnel

## Résumé des permissions

| Permission | Fonctionnalité | Backend | Frontend |
|-----------|---------------|---------|----------|
| `can_edit_listing` | Modifier l'annonce | ✅ | ✅ |
| `can_manage_bookings` | Voir et gérer les réservations | ✅ | ✅ |
| `can_respond_messages` | Voir et répondre aux messages | ✅ | ✅ |

## Sécurité

Toutes les vérifications de permissions sont effectuées **côté backend** :
- Les co-hôtes ne peuvent accéder qu'aux ressources pour lesquelles ils ont les permissions
- Les requêtes incluent des vérifications dans les contrôleurs
- Les permissions sont vérifiées au niveau de la base de données (JOIN avec `cohost_permissions`)

## Flux utilisateur

### Pour un co-hôte avec toutes les permissions :

1. **Navigation** : Voit "Mes annonces", "Réservations reçues", "Mes réservations", "Messages"
2. **Mes annonces** : Voit les annonces où il est co-hôte, peut les éditer
3. **Réservations reçues** : Voit et peut gérer les réservations (accepter/refuser)
4. **Messages** : Voit et peut répondre aux messages des voyageurs

### Pour un co-hôte avec permissions limitées :

Les boutons et fonctionnalités s'adaptent automatiquement selon les permissions accordées.

## Tests recommandés

1. Créer un co-hôte avec toutes les permissions → Vérifier accès complet
2. Créer un co-hôte avec uniquement `can_edit_listing` → Vérifier qu'il ne peut pas gérer les réservations
3. Créer un co-hôte avec uniquement `can_respond_messages` → Vérifier qu'il voit les messages mais ne peut pas éditer l'annonce
4. Vérifier que les co-hôtes ne peuvent pas :
   - Supprimer une annonce
   - Gérer les co-hôtes (ajouter/retirer)
   - Créer une nouvelle annonce (sauf s'ils sont aussi hôtes)
