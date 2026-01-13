import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { BookingModel, CreateBookingData, BookingStatus } from '../models/Booking.model';
import { ListingModel } from '../models/Listing.model';
import { AppError } from '../middleware/errorHandler';
import { pool } from '../config/database';
import { CohostModel } from '../models/Cohost.model';

export const getBookings = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return next(new AppError('Non authentifié', 401));
    }

    // Récupérer les bookings pour les listings de l'hôte
    const listingsResult = await pool.query(
      'SELECT id FROM listings WHERE host_id = $1',
      [req.user.id]
    );
    const listingIds = listingsResult.rows.map((row: any) => row.id);

    if (listingIds.length === 0) {
      return res.json([]);
    }

    const result = await pool.query(
      `SELECT * FROM bookings WHERE listing_id = ANY($1::int[]) ORDER BY check_in DESC`,
      [listingIds]
    );

    res.json(result.rows);
  } catch (error) {
    next(error);
  }
};

export const getMyBookings = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return next(new AppError('Non authentifié', 401));
    }

    const bookings = await BookingModel.findByGuestId(req.user.id);
    
    // Parser les images JSON si nécessaire
    const formattedBookings = bookings.map((booking: any) => {
      let images = booking.listing_images;
      
      // Parser images si c'est une string
      if (typeof images === 'string') {
        try {
          images = JSON.parse(images);
        } catch (e) {
          images = [];
        }
      }
      // Si c'est null ou undefined, utiliser un tableau vide
      if (!images) images = [];
      
      return {
        ...booking,
        listing_images: images,
      };
    });
    
    res.json(formattedBookings);
  } catch (error) {
    next(error);
  }
};

export const getBookingById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return next(new AppError('Non authentifié', 401));
    }

    const { id } = req.params;
    const booking = await BookingModel.findById(parseInt(id));

    if (!booking) {
      return next(new AppError('Réservation non trouvée', 404));
    }

    // Vérifier que l'utilisateur a accès à cette réservation
    if (booking.guest_id !== req.user.id) {
      // Vérifier si c'est l'hôte ou un co-hôte
      const listing = await ListingModel.findById(booking.listing_id);
      if (!listing || listing.host_id !== req.user.id) {
        if (req.user.role === 'cohost') {
          const permission = await CohostModel.findPermission(
            booking.listing_id,
            req.user.id
          );
          if (!permission || !permission.can_manage_bookings) {
            return next(new AppError('Accès refusé', 403));
          }
        } else {
          return next(new AppError('Accès refusé', 403));
        }
      }
    }

    res.json(booking);
  } catch (error) {
    next(error);
  }
};

export const createBooking = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return next(new AppError('Non authentifié', 401));
    }

    const { listing_id, check_in, check_out, guests } = req.body;

    // Vérifier que le listing existe
    const listing = await ListingModel.findById(listing_id);
    if (!listing) {
      return next(new AppError('Annonce non trouvée', 404));
    }

    // Vérifier que l'utilisateur ne réserve pas sa propre annonce
    if (listing.host_id === req.user.id) {
      return next(new AppError('Vous ne pouvez pas réserver votre propre annonce', 400));
    }

    // Vérifier le nombre de guests
    if (guests > listing.max_guests) {
      return next(
        new AppError(
          `Le nombre maximum de personnes est ${listing.max_guests}`,
          400
        )
      );
    }

    // Vérifier les dates
    const checkInDate = new Date(check_in);
    const checkOutDate = new Date(check_out);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (checkInDate < today) {
      return next(new AppError('La date d\'arrivée ne peut pas être dans le passé', 400));
    }

    if (checkOutDate <= checkInDate) {
      return next(new AppError('La date de départ doit être après la date d\'arrivée', 400));
    }

    // Vérifier les conflits de dates
    const conflictingBookings = await BookingModel.findConflictingBookings(
      listing_id,
      checkInDate,
      checkOutDate
    );

    if (conflictingBookings.length > 0) {
      return next(
        new AppError(
          'Ces dates ne sont pas disponibles',
          409,
          'DATE_CONFLICT'
        )
      );
    }

    // Calculer le prix total
    const nights = Math.ceil(
      (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const total_price = listing.price_per_night * nights;

    const bookingData: CreateBookingData = {
      listing_id,
      guest_id: req.user.id,
      check_in: checkInDate,
      check_out: checkOutDate,
      guests,
      total_price,
    };

    const booking = await BookingModel.create(bookingData);

    res.status(201).json({
      message: 'Réservation créée avec succès',
      booking,
    });
  } catch (error) {
    next(error);
  }
};

export const updateBookingStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return next(new AppError('Non authentifié', 401));
    }

    const { id } = req.params;
    const { status } = req.body;

    const booking = await BookingModel.findById(parseInt(id));
    if (!booking) {
      return next(new AppError('Réservation non trouvée', 404));
    }

    // Vérifier les permissions
    const listing = await ListingModel.findById(booking.listing_id);
    if (!listing) {
      return next(new AppError('Annonce non trouvée', 404));
    }

    if (listing.host_id !== req.user.id) {
      if (req.user.role === 'cohost') {
        const permission = await CohostModel.findPermission(
          booking.listing_id,
          req.user.id
        );
        if (!permission || !permission.can_manage_bookings) {
          return next(new AppError('Accès refusé', 403));
        }
      } else {
        return next(new AppError('Accès refusé', 403));
      }
    }

    const validStatuses = Object.values(BookingStatus);
    if (!validStatuses.includes(status)) {
      return next(new AppError('Statut invalide', 400));
    }

    const updated = await BookingModel.updateStatus(parseInt(id), status);

    res.json({
      message: 'Statut de la réservation mis à jour',
      booking: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const cancelBooking = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return next(new AppError('Non authentifié', 401));
    }

    const { id } = req.params;
    const booking = await BookingModel.findById(parseInt(id));

    if (!booking) {
      return next(new AppError('Réservation non trouvée', 404));
    }

    // Seul le guest ou l'hôte peut annuler
    if (booking.guest_id !== req.user.id) {
      const listing = await ListingModel.findById(booking.listing_id);
      if (!listing || listing.host_id !== req.user.id) {
        if (req.user.role === 'cohost') {
          const permission = await CohostModel.findPermission(
            booking.listing_id,
            req.user.id
          );
          if (!permission || !permission.can_manage_bookings) {
            return next(new AppError('Accès refusé', 403));
          }
        } else {
          return next(new AppError('Accès refusé', 403));
        }
      }
    }

    await BookingModel.updateStatus(parseInt(id), BookingStatus.CANCELLED);

    res.json({
      message: 'Réservation annulée',
    });
  } catch (error) {
    next(error);
  }
};
