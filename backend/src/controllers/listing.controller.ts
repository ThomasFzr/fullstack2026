import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { ListingModel, CreateListingData, UpdateListingData } from '../models/Listing.model';
import { AppError } from '../middleware/errorHandler';
import { pool } from '../config/database';
import { CohostModel } from '../models/Cohost.model';

export const getListings = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      city,
      country,
      minPrice,
      maxPrice,
      maxGuests,
      limit = 20,
      offset = 0,
    } = req.query;

    const filters: any = {};
    if (city) filters.city = city;
    if (country) filters.country = country;
    if (minPrice) filters.minPrice = parseFloat(minPrice);
    if (maxPrice) filters.maxPrice = parseFloat(maxPrice);
    if (maxGuests) filters.maxGuests = parseInt(maxGuests);
    filters.limit = parseInt(limit);
    filters.offset = parseInt(offset);

    const listings = await ListingModel.findAll(filters);

    // Parser les JSON fields (PostgreSQL JSONB peut être un objet ou une string)
    const formattedListings = listings.map((listing: any) => {
      let images = listing.images;
      let amenities = listing.amenities;

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

      // Parser amenities si c'est une string
      if (typeof amenities === 'string') {
        try {
          amenities = JSON.parse(amenities);
        } catch (e) {
          amenities = [];
        }
      }
      // Si c'est null ou undefined, utiliser un tableau vide
      if (!amenities) amenities = [];

      return {
        ...listing,
        images,
        amenities,
      };
    });

    res.json({
      listings: formattedListings,
      total: formattedListings.length,
    });
  } catch (error: any) {
    console.error('Erreur dans getListings:', {
      message: error?.message,
      stack: error?.stack,
      code: error?.code,
      detail: error?.detail,
    });
    next(error);
  }
};

export const getListingById = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const listingId = parseInt(id);
    
    if (isNaN(listingId)) {
      return next(new AppError('ID invalide', 400, 'INVALID_ID'));
    }
    
    const listing = await ListingModel.findById(listingId);

    if (!listing) {
      return next(new AppError('Annonce non trouvée', 404, 'NOT_FOUND'));
    }

    // Parser les JSON fields
    const formattedListing = {
      ...listing,
      images: typeof listing.images === 'string' ? JSON.parse(listing.images) : listing.images,
      amenities: typeof listing.amenities === 'string' ? JSON.parse(listing.amenities) : listing.amenities,
    };

    res.json(formattedListing);
  } catch (error) {
    next(error);
  }
};

export const getMyListings = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return next(new AppError('Non authentifié', 401));
    }

    let listings;

    if (req.user.role === 'host') {
      listings = await ListingModel.findByHostId(req.user.id);
    } else if (req.user.role === 'cohost') {
      // Récupérer les listings où l'utilisateur est co-hôte
      const cohostPermissions = await CohostModel.findByCohostId(req.user.id);
      const listingIds = cohostPermissions.map((p) => p.listing_id);
      
      if (listingIds.length === 0) {
        return res.json([]);
      }

      const result = await pool.query(
        `SELECT * FROM listings WHERE id = ANY($1::int[]) ORDER BY created_at DESC`,
        [listingIds]
      );
      listings = result.rows;
    } else {
      return next(new AppError('Accès refusé', 403));
    }

    // Parser les JSON fields
    const formattedListings = listings.map((listing: any) => ({
      ...listing,
      images: typeof listing.images === 'string' ? JSON.parse(listing.images) : listing.images,
      amenities: typeof listing.amenities === 'string' ? JSON.parse(listing.amenities) : listing.amenities,
    }));

    res.json(formattedListings);
  } catch (error) {
    next(error);
  }
};

export const createListing = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return next(new AppError('Non authentifié', 401));
    }

    const listingData: CreateListingData = {
      host_id: req.user.id,
      title: req.body.title,
      description: req.body.description,
      address: req.body.address,
      city: req.body.city,
      country: req.body.country,
      price_per_night: req.body.price_per_night,
      max_guests: req.body.max_guests,
      bedrooms: req.body.bedrooms,
      bathrooms: req.body.bathrooms,
      images: req.body.images || [],
      amenities: req.body.amenities || [],
      rules: req.body.rules || '',
    };

    const listing = await ListingModel.create(listingData);

    // Parser les JSON fields
    const formattedListing = {
      ...listing,
      images: typeof listing.images === 'string' ? JSON.parse(listing.images) : listing.images,
      amenities: typeof listing.amenities === 'string' ? JSON.parse(listing.amenities) : listing.amenities,
    };

    res.status(201).json({
      message: 'Annonce créée avec succès',
      listing: formattedListing,
    });
  } catch (error) {
    next(error);
  }
};

export const updateListing = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return next(new AppError('Non authentifié', 401));
    }

    const { id } = req.params;
    const listingId = parseInt(id);
    
    if (isNaN(listingId)) {
      return next(new AppError('ID invalide', 400, 'INVALID_ID'));
    }
    
    const listing = await ListingModel.findById(listingId);

    if (!listing) {
      return next(new AppError('Annonce non trouvée', 404));
    }

    // Vérifier les permissions
    if (listing.host_id !== req.user.id) {
      // Vérifier si c'est un co-hôte avec les bonnes permissions
      if (req.user.role === 'cohost') {
        const permission = await CohostModel.findPermission(
          listingId,
          req.user.id
        );
        if (!permission || !permission.can_edit_listing) {
          return next(new AppError('Accès refusé', 403));
        }
      } else {
        return next(new AppError('Accès refusé', 403));
      }
    }

    const updateData: UpdateListingData = {};
    if (req.body.title !== undefined) updateData.title = req.body.title;
    if (req.body.description !== undefined) updateData.description = req.body.description;
    if (req.body.address !== undefined) updateData.address = req.body.address;
    if (req.body.city !== undefined) updateData.city = req.body.city;
    if (req.body.country !== undefined) updateData.country = req.body.country;
    if (req.body.price_per_night !== undefined) updateData.price_per_night = req.body.price_per_night;
    if (req.body.max_guests !== undefined) updateData.max_guests = req.body.max_guests;
    if (req.body.bedrooms !== undefined) updateData.bedrooms = req.body.bedrooms;
    if (req.body.bathrooms !== undefined) updateData.bathrooms = req.body.bathrooms;
    if (req.body.images !== undefined) updateData.images = req.body.images;
    if (req.body.amenities !== undefined) updateData.amenities = req.body.amenities;
    if (req.body.rules !== undefined) updateData.rules = req.body.rules;

    const updated = await ListingModel.update(listingId, updateData);

    // Parser les JSON fields
    const formattedListing = {
      ...updated,
      images: typeof updated.images === 'string' ? JSON.parse(updated.images) : updated.images,
      amenities: typeof updated.amenities === 'string' ? JSON.parse(updated.amenities) : updated.amenities,
    };

    res.json({
      message: 'Annonce mise à jour',
      listing: formattedListing,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteListing = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return next(new AppError('Non authentifié', 401));
    }

    const { id } = req.params;
    const listingId = parseInt(id);
    
    if (isNaN(listingId)) {
      return next(new AppError('ID invalide', 400, 'INVALID_ID'));
    }
    
    const listing = await ListingModel.findById(listingId);

    if (!listing) {
      return next(new AppError('Annonce non trouvée', 404));
    }

    // Seul le propriétaire peut supprimer
    if (listing.host_id !== req.user.id) {
      return next(new AppError('Accès refusé', 403));
    }

    await ListingModel.delete(listingId);

    res.json({
      message: 'Annonce supprimée avec succès',
    });
  } catch (error) {
    next(error);
  }
};
