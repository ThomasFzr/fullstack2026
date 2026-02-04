import { Router } from 'express';
import { body } from 'express-validator';
import { register, login, refreshToken, githubAuth, githubCallback } from '../../controllers/auth.controller';
import { validate } from '../../middleware/validation.middleware';

const router = Router();

/**
 * @swagger
 * /api/v1/auth/github:
 *   get:
 *     summary: Connexion avec GitHub (redirection OAuth)
 *     tags: [Auth]
 *     responses:
 *       302:
 *         description: Redirection vers GitHub
 */
router.get('/github', githubAuth);

/**
 * @swagger
 * /api/v1/auth/github/callback:
 *   get:
 *     summary: Callback GitHub OAuth
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *     responses:
 *       302:
 *         description: Redirection vers le frontend avec tokens
 */
router.get('/github/callback', githubCallback);

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Inscription d'un nouvel utilisateur
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - first_name
 *               - last_name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Utilisateur créé avec succès
 *       400:
 *         description: Données invalides
 */
router.post(
  '/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('first_name').trim().notEmpty(),
    body('last_name').trim().notEmpty(),
  ],
  validate,
  register
);

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Connexion d'un utilisateur
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Connexion réussie
 *       401:
 *         description: Identifiants invalides
 */
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty(),
  ],
  validate,
  login
);

/**
 * @swagger
 * /api/v1/auth/refresh:
 *   post:
 *     summary: Rafraîchir le token d'accès
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refresh_token
 *             properties:
 *               refresh_token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Nouveau token généré
 *       401:
 *         description: Token invalide
 */
router.post(
  '/refresh',
  [body('refresh_token').notEmpty()],
  validate,
  refreshToken
);

export { router as authRoutes };
