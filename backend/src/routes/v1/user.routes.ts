import { Router } from 'express';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import {
  getProfile,
  updateProfile,
  becomeHost,
  getCohosts,
  createCohost,
  updateCohost,
  deleteCohost,
  searchUsers,
} from '../../controllers/user.controller';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticate);

/**
 * @swagger
 * /api/v1/users/profile:
 *   get:
 *     summary: Récupérer le profil de l'utilisateur connecté
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profil utilisateur
 */
router.get('/profile', getProfile);

/**
 * @swagger
 * /api/v1/users/profile:
 *   put:
 *     summary: Mettre à jour le profil utilisateur
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profil mis à jour
 */
router.put('/profile', updateProfile);

/**
 * @swagger
 * /api/v1/users/become-host:
 *   post:
 *     summary: Devenir hôte
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statut hôte activé
 */
router.post('/become-host', becomeHost);

/**
 * @swagger
 * /api/v1/users/search:
 *   get:
 *     summary: Rechercher des utilisateurs par email
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         required: true
 *         description: Email à rechercher
 *     responses:
 *       200:
 *         description: Liste des utilisateurs trouvés
 */
router.get('/search', authorize('host'), searchUsers);

/**
 * @swagger
 * /api/v1/users/cohosts:
 *   get:
 *     summary: Liste des co-hôtes (pour les hôtes)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des co-hôtes
 */
router.get('/cohosts', authorize('host'), getCohosts);

/**
 * @swagger
 * /api/v1/users/cohosts:
 *   post:
 *     summary: Créer un co-hôte
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Co-hôte créé
 */
router.post('/cohosts', authorize('host'), createCohost);

/**
 * @swagger
 * /api/v1/users/cohosts/{id}:
 *   put:
 *     summary: Mettre à jour les permissions d'un co-hôte
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Permissions mises à jour
 */
router.put('/cohosts/:id', authorize('host'), updateCohost);

/**
 * @swagger
 * /api/v1/users/cohosts/{id}:
 *   delete:
 *     summary: Supprimer un co-hôte
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Co-hôte supprimé
 */
router.delete('/cohosts/:id', authorize('host'), deleteCohost);

export { router as userRoutes };
