# Configuration du Backend

## Problème : Erreur 500 sur `/api/v1/listings`

Cette erreur est généralement due à :
1. **Fichier `.env` manquant** (le plus probable)
2. **Base de données non connectée**
3. **Tables non créées**

## Solution rapide

### 1. Créer le fichier `.env`

Dans le dossier `backend/`, créez un fichier `.env` avec ce contenu :

```env
PORT=3000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=minibnb
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=your-super-secret-jwt-key-change-in-production-minibnb-2026
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
CORS_ORIGIN=http://localhost:5173
```

### 2. Vérifier la base de données

Assurez-vous que :
- PostgreSQL est démarré
- La base de données `minibnb` existe
- Les tables sont créées

```bash
# Si vous utilisez Homebrew
brew services start postgresql@15

# Créer la base de données (si elle n'existe pas)
createdb minibnb

# Vérifier que les tables existent
psql minibnb -c "\dt"
```

Si les tables n'existent pas :

```bash
psql minibnb < ../database/schema.sql
```

### 3. Redémarrer le serveur

```bash
cd backend
npm run dev
```

Le serveur devrait maintenant afficher :
- `✅ Test de connexion à la base de données réussi`
- `✅ Connexion à la base de données établie`

Si vous voyez une erreur de connexion, vérifiez :
- Que PostgreSQL est bien démarré
- Que les identifiants dans `.env` sont corrects
- Que la base de données `minibnb` existe

## Vérification

Une fois configuré, testez l'API :

```bash
curl http://localhost:3000/api/v1/listings
```

Vous devriez recevoir une réponse JSON avec une liste d'annonces (vide si aucune annonce n'a été créée).
