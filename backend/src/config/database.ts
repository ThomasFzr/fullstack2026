import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'minibnb',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test de connexion
pool.on('connect', () => {
  console.log('✅ Connexion à la base de données établie');
});

pool.on('error', (err) => {
  console.error('❌ Erreur de connexion à la base de données:', err);
});

// Tester la connexion au démarrage
pool.query('SELECT NOW()')
  .then(() => {
    console.log('✅ Test de connexion à la base de données réussi');
  })
  .catch((err) => {
    console.error('❌ Impossible de se connecter à la base de données:', err.message);
    console.error('Vérifiez que PostgreSQL est démarré et que les variables d\'environnement sont correctes');
  });
