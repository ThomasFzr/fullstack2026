# Configuration PostgreSQL pour MiniBnB

## Problème : "role postgres does not exist"

Sur macOS avec Homebrew, l'utilisateur PostgreSQL par défaut est votre nom d'utilisateur système, pas "postgres".

## Solution

### 1. Mettre à jour le fichier `.env`

Dans `backend/.env`, remplacez :
```env
DB_USER=postgres
DB_PASSWORD=postgres
```

Par :
```env
DB_USER=thomasfoltzer
DB_PASSWORD=
```

(Le mot de passe est généralement vide pour l'utilisateur local sur macOS)

### 2. Ajouter PostgreSQL au PATH (optionnel mais recommandé)

Ajoutez cette ligne à votre `~/.zshrc` :

```bash
export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"
```

Puis rechargez :
```bash
source ~/.zshrc
```

### 3. Créer la base de données

```bash
# Avec le chemin complet
/opt/homebrew/opt/postgresql@15/bin/createdb -U thomasfoltzer minibnb

# Ou si ajouté au PATH
createdb minibnb
```

### 4. Exécuter le schéma

```bash
# Avec le chemin complet
/opt/homebrew/opt/postgresql@15/bin/psql -U thomasfoltzer -d minibnb < database/schema.sql

# Ou si ajouté au PATH
psql minibnb < database/schema.sql
```

## Vérification

```bash
# Vérifier que les tables existent
/opt/homebrew/opt/postgresql@15/bin/psql -U thomasfoltzer -d minibnb -c "\dt"
```

Vous devriez voir les tables : users, listings, bookings, conversations, messages, cohost_permissions
