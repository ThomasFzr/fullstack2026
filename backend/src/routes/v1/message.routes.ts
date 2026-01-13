import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import {
  getConversations,
  getConversationById,
  createConversation,
  getMessages,
  sendMessage,
  markAsRead,
  getUnreadCount,
} from '../../controllers/message.controller';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticate);

/**
 * @swagger
 * /api/v1/messages/conversations:
 *   get:
 *     summary: Liste toutes les conversations de l'utilisateur
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des conversations
 */
router.get('/conversations', getConversations);

/**
 * @swagger
 * /api/v1/messages/conversations/{id}:
 *   get:
 *     summary: Récupère une conversation par son ID
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Détails de la conversation
 */
router.get('/conversations/:id', getConversationById);

/**
 * @swagger
 * /api/v1/messages/conversations:
 *   post:
 *     summary: Créer une nouvelle conversation
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - listing_id
 *             properties:
 *               listing_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Conversation créée
 */
router.post(
  '/conversations',
  [body('listing_id').isInt()],
  validate,
  createConversation
);

/**
 * @swagger
 * /api/v1/messages/conversations/{id}/messages:
 *   get:
 *     summary: Récupère tous les messages d'une conversation
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des messages
 */
router.get('/conversations/:id/messages', getMessages);

/**
 * @swagger
 * /api/v1/messages/conversations/{id}/messages:
 *   post:
 *     summary: Envoyer un message dans une conversation
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       201:
 *         description: Message envoyé
 */
router.post(
  '/conversations/:id/messages',
  [body('content').trim().notEmpty()],
  validate,
  sendMessage
);

/**
 * @swagger
 * /api/v1/messages/conversations/{id}/read:
 *   post:
 *     summary: Marquer les messages comme lus
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Messages marqués comme lus
 */
router.post('/conversations/:id/read', markAsRead);

/**
 * @swagger
 * /api/v1/messages/unread-count:
 *   get:
 *     summary: Compte les messages non lus de l'utilisateur
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Nombre de messages non lus
 */
router.get('/unread-count', getUnreadCount);

export { router as messageRoutes };
