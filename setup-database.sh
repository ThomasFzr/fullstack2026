#!/bin/bash

# Script d'aide pour configurer la base de données MiniBnB

echo "🚀 Configuration de la base de données MiniBnB"
echo ""

# Vérifier si PostgreSQL est installé
if command -v psql &> /dev/null; then
    echo "✅ PostgreSQL est installé"
    
    # Créer la base de données
    echo "📦 Création de la base de données..."
    createdb minibnb 2>/dev/null || echo "⚠️  La base de données existe peut-être déjà"
    
    # Exécuter le schéma
    echo "📝 Exécution du schéma..."
    psql minibnb < database/schema.sql
    
    echo "✅ Base de données configurée avec succès !"
    echo ""
    echo "Vous pouvez maintenant démarrer le backend avec :"
    echo "  cd backend && npm install && npm run dev"
    
elif command -v docker &> /dev/null; then
    echo "🐳 Docker est disponible"
    echo ""
    echo "Pour utiliser Docker, exécutez :"
    echo "  1. Démarrez Docker Desktop"
    echo "  2. Puis exécutez :"
    echo "     docker run --name minibnb-postgres \\"
    echo "       -e POSTGRES_PASSWORD=postgres \\"
    echo "       -e POSTGRES_DB=minibnb \\"
    echo "       -p 5432:5432 \\"
    echo "       -d postgres:15"
    echo ""
    echo "  3. Ensuite :"
    echo "     docker exec -i minibnb-postgres psql -U postgres -d minibnb < database/schema.sql"
    echo ""
    
else
    echo "❌ PostgreSQL n'est pas installé"
    echo ""
    echo "Options d'installation :"
    echo ""
    echo "1. Via Homebrew (recommandé sur macOS) :"
    echo "   brew install postgresql@15"
    echo "   brew services start postgresql@15"
    echo ""
    echo "2. Via Docker :"
    echo "   docker run --name minibnb-postgres \\"
    echo "     -e POSTGRES_PASSWORD=postgres \\"
    echo "     -e POSTGRES_DB=minibnb \\"
    echo "     -p 5432:5432 \\"
    echo "     -d postgres:15"
    echo ""
    echo "3. Via Postgres.app :"
    echo "   Téléchargez depuis https://postgresapp.com/"
    echo ""
    echo "Voir docs/INSTALLATION.md pour plus de détails"
fi
