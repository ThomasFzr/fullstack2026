-- Migration: Ajout du support GitHub OAuth
-- Exécuter avec: psql -d minibnb -f database/migrations/001_add_github_oauth.sql

-- Colonne github_id pour lier les comptes GitHub (unique, nullable)
ALTER TABLE users ADD COLUMN IF NOT EXISTS github_id VARCHAR(50) UNIQUE;

-- Index pour les recherches par github_id
CREATE INDEX IF NOT EXISTS idx_users_github_id ON users(github_id);
