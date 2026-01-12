# Guide d'installation - MiniBnB

## Installation de PostgreSQL

### Option 1 : Installation via Homebrew (recommandé sur macOS)

```bash
# Installer Homebrew si ce n'est pas déjà fait
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Installer PostgreSQL
brew install postgresql@15

# Démarrer le service PostgreSQL
brew services start postgresql@15

# Ajouter PostgreSQL au PATH (ajouter cette ligne à votre ~/.zshrc)
echo 'export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# Vérifier l'installation
psql --version
```

### Option 2 : Installation via Docker (alternative)

Si vous préférez utiliser Docker :

```bash
# Démarrer PostgreSQL dans un conteneur Docker
docker run --name minibnb-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=minibnb \
  -p 5432:5432 \
  -d postgres:15

# Créer la base de données et exécuter le schéma
docker exec -i minibnb-postgres psql -U postgres -d minibnb < database/schema.sql
```

Pour arrêter le conteneur :
```bash
docker stop minibnb-postgres
docker rm minibnb-postgres
```

### Option 3 : Installation via Postgres.app (macOS)

1. Télécharger Postgres.app depuis https://postgresapp.com/
2. L'installer et l'ouvrir
3. Cliquer sur "Initialize" pour créer un nouveau serveur
4. Les outils seront disponibles dans `/Applications/Postgres.app/Contents/Versions/latest/bin`

## Création de la base de données

Une fois PostgreSQL installé :

```bash
# Créer la base de données
createdb minibnb

# Exécuter le schéma
psql minibnb < database/schema.sql

# Optionnel : Ajouter des données de test
psql minibnb < database/seed.sql
```

Si vous avez des problèmes de permissions, essayez :

```bash
# Se connecter en tant qu'utilisateur postgres
psql postgres

# Dans le shell PostgreSQL :
CREATE DATABASE minibnb;
\q

# Puis exécuter le schéma
psql minibnb < database/schema.sql
```

## Vérification

Pour vérifier que tout fonctionne :

```bash
# Se connecter à la base de données
psql minibnb

# Lister les tables
\dt

# Quitter
\q
```

## Configuration du backend

Assurez-vous que votre fichier `.env` dans `backend/` correspond à votre configuration PostgreSQL :

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=minibnb
DB_USER=postgres  # ou votre nom d'utilisateur
DB_PASSWORD=postgres  # ou votre mot de passe
```
