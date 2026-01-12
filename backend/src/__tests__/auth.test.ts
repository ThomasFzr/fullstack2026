import request from 'supertest';
import app from '../server';

describe('Auth API', () => {
  describe('POST /api/v1/auth/register', () => {
    it('devrait créer un nouvel utilisateur', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          first_name: 'Test',
          last_name: 'User',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('tokens');
      expect(response.body.user.email).toBe('test@example.com');
    });

    it('devrait retourner une erreur si l\'email existe déjà', async () => {
      // Créer un utilisateur
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'duplicate@example.com',
          password: 'password123',
          first_name: 'Test',
          last_name: 'User',
        });

      // Essayer de créer le même utilisateur
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'duplicate@example.com',
          password: 'password123',
          first_name: 'Test',
          last_name: 'User',
        });

      expect(response.status).toBe(409);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('devrait connecter un utilisateur existant', async () => {
      // Créer un utilisateur d'abord
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'login@example.com',
          password: 'password123',
          first_name: 'Test',
          last_name: 'User',
        });

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'login@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('tokens');
    });

    it('devrait retourner une erreur pour des identifiants invalides', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
    });
  });
});
