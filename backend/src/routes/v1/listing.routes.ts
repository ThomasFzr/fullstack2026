import { Router } from 'express';
import { body, query } from 'express-validator';
import { authenticate, authorize, AuthRequest } from '../../middleware/auth.middleware';
import { cacheMiddleware } from '../../middleware/cache.middleware';
import { validate } from '../../middleware/validation.middleware';
import {
  getListings,
  getListingById,
  createListing,
  updateListing,
  deleteListing,
  getMyListings,
} from '../../controllers/listing.controller';

const router = Router();

/**
 * @swagger
 * /api/v1/listings:
 *   get:
 *     summary: Liste toutes les annonces avec filtres optionnels
 *     tags: [Listings]
 *     parameters:
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxGuests
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Liste des annonces
 */
router.get(
  '/',
  cacheMiddleware(300), // Cache de 5 minutes
  [
    query('city').optional().trim(),
    query('country').optional().trim(),
    query('minPrice').optional().isNumeric(),
    query('maxPrice').optional().isNumeric(),
    query('maxGuests').optional().isInt(),
  ],
  validate,
  getListings
);

/**
 * @swagger
 * /api/v1/listings/my-listings:
 *   get:
 *     summary: Liste les annonces de l'utilisateur connecté
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des annonces de l'utilisateur
 */
// Route spécifique doit être avant la route paramétrée /:id
router.get('/my-listings', authenticate, getMyListings);

/**
 * @swagger
 * /api/v1/listings/{id}:
 *   get:
 *     summary: Récupère une annonce par son ID
 *     tags: [Listings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Détails de l'annonce
 *       404:
 *         description: Annonce non trouvée
 */
router.get('/:id', cacheMiddleware(300), getListingById);

// Routes protégées
router.use(authenticate);

/**
 * @swagger
 * /api/v1/listings:
 *   post:
 *     summary: Créer une nouvelle annonce
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - address
 *               - city
 *               - country
 *               - price_per_night
 *               - max_guests
 *               - bedrooms
 *               - bathrooms
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               address:
 *                 type: string
 *               city:
 *                 type: string
 *               country:
 *                 type: string
 *               price_per_night:
 *                 type: number
 *               max_guests:
 *                 type: integer
 *               bedrooms:
 *                 type: integer
 *               bathrooms:
 *                 type: number
 *     responses:
 *       201:
 *         description: Annonce créée
 */
router.post(
  '/',
  authorize('host', 'cohost'),
  [
    body('title').trim().notEmpty(),
    body('description').trim().notEmpty(),
    body('address').trim().notEmpty(),
    body('city').trim().notEmpty(),
    body('country').trim().notEmpty(),
    body('price_per_night').isFloat({ min: 0 }),
    body('max_guests').isInt({ min: 1 }),
    body('bedrooms').isInt({ min: 0 }),
    body('bathrooms').isFloat({ min: 0 }),
  ],
  validate,
  createListing
);

/**
 * @swagger
 * /api/v1/listings/{id}:
 *   put:
 *     summary: Mettre à jour une annonce
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Annonce mise à jour
 */
router.put('/:id', authorize('host', 'cohost'), updateListing);

/**
 * @swagger
 * /api/v1/listings/{id}:
 *   delete:
 *     summary: Supprimer une annonce
 *     tags: [Listings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Annonce supprimée
 */
router.delete('/:id', authorize('host'), deleteListing);

export { router as listingRoutes };
