import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate, authorize } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validation.middleware';
import {
  getBookings,
  getBookingById,
  createBooking,
  updateBookingStatus,
  cancelBooking,
  getMyBookings,
} from '../../controllers/booking.controller';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticate);

/**
 * @swagger
 * /api/v1/bookings:
 *   get:
 *     summary: Liste toutes les réservations (admin/hôte)
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des réservations
 */
router.get('/', authorize('host'), getBookings);

/**
 * @swagger
 * /api/v1/bookings/my-bookings:
 *   get:
 *     summary: Liste les réservations de l'utilisateur connecté
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des réservations de l'utilisateur
 */
router.get('/my-bookings', getMyBookings);

/**
 * @swagger
 * /api/v1/bookings/{id}:
 *   get:
 *     summary: Récupère une réservation par son ID
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Détails de la réservation
 */
router.get('/:id', getBookingById);

/**
 * @swagger
 * /api/v1/bookings:
 *   post:
 *     summary: Créer une nouvelle réservation
 *     tags: [Bookings]
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
 *               - check_in
 *               - check_out
 *               - guests
 *             properties:
 *               listing_id:
 *                 type: integer
 *               check_in:
 *                 type: string
 *                 format: date
 *               check_out:
 *                 type: string
 *                 format: date
 *               guests:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Réservation créée
 *       409:
 *         description: Conflit de dates
 */
router.post(
  '/',
  [
    body('listing_id').isInt(),
    body('check_in').isISO8601(),
    body('check_out').isISO8601(),
    body('guests').isInt({ min: 1 }),
  ],
  validate,
  createBooking
);

/**
 * @swagger
 * /api/v1/bookings/{id}/status:
 *   patch:
 *     summary: Mettre à jour le statut d'une réservation
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statut mis à jour
 */
router.patch('/:id/status', authorize('host', 'cohost'), updateBookingStatus);

/**
 * @swagger
 * /api/v1/bookings/{id}:
 *   delete:
 *     summary: Annuler une réservation
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Réservation annulée
 */
router.delete('/:id', cancelBooking);

export { router as bookingRoutes };
