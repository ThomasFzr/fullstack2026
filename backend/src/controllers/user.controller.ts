import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { UserModel, UserRole } from '../models/User.model';
import { CohostModel } from '../models/Cohost.model';
import { AppError } from '../middleware/errorHandler';
import { pool } from '../config/database';

export const getProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return next(new AppError('Non authentifié', 401));
    }

    const user = await UserModel.findById(req.user.id);
    if (!user) {
      return next(new AppError('Utilisateur non trouvé', 404));
    }

    res.json({
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      is_host: user.is_host,
      created_at: user.created_at,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return next(new AppError('Non authentifié', 401));
    }

    const { first_name, last_name } = req.body;
    const user = await UserModel.update(req.user.id, { first_name, last_name });

    res.json({
      message: 'Profil mis à jour',
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        is_host: user.is_host,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const becomeHost = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return next(new AppError('Non authentifié', 401));
    }

    const user = await UserModel.update(req.user.id, { is_host: true });

    res.json({
      message: 'Vous êtes maintenant hôte',
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        is_host: user.is_host,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getCohosts = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return next(new AppError('Non authentifié', 401));
    }

    // Récupérer tous les listings de l'hôte
    const listingsResult = await pool.query(
      'SELECT id FROM listings WHERE host_id = $1',
      [req.user.id]
    );
    const listingIds = listingsResult.rows.map((row: any) => row.id);

    if (listingIds.length === 0) {
      return res.json([]);
    }

    // Récupérer tous les co-hôtes pour ces listings
    const cohosts = await CohostModel.findByListingId(listingIds[0]);
    // Pour simplifier, on récupère pour le premier listing
    // En production, il faudrait agréger tous les co-hôtes

    res.json(cohosts);
  } catch (error) {
    next(error);
  }
};

export const createCohost = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return next(new AppError('Non authentifié', 401));
    }

    const { listing_id, cohost_id, can_edit_listing, can_manage_bookings, can_respond_messages } = req.body;

    // Vérifier que l'utilisateur est bien le propriétaire du listing
    const listingResult = await pool.query(
      'SELECT host_id FROM listings WHERE id = $1',
      [listing_id]
    );

    if (listingResult.rows.length === 0) {
      return next(new AppError('Annonce non trouvée', 404));
    }

    if (listingResult.rows[0].host_id !== req.user.id) {
      return next(new AppError('Vous n\'êtes pas propriétaire de cette annonce', 403));
    }

    // Vérifier que le co-hôte existe
    const cohost = await UserModel.findById(cohost_id);
    if (!cohost) {
      return next(new AppError('Utilisateur non trouvé', 404));
    }

    const permission = await CohostModel.create({
      listing_id,
      host_id: req.user.id,
      cohost_id,
      can_edit_listing: can_edit_listing ?? false,
      can_manage_bookings: can_manage_bookings ?? false,
      can_respond_messages: can_respond_messages ?? false,
    });

    // Mettre à jour le rôle de l'utilisateur en co-hôte
    await UserModel.updateRole(cohost_id, UserRole.COHOST);

    res.status(201).json({
      message: 'Co-hôte créé avec succès',
      permission,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCohost = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return next(new AppError('Non authentifié', 401));
    }

    const { id } = req.params;
    const { can_edit_listing, can_manage_bookings, can_respond_messages } = req.body;

    // Vérifier que la permission appartient à l'hôte
    const permission = await pool.query(
      'SELECT * FROM cohost_permissions WHERE id = $1',
      [id]
    );

    if (permission.rows.length === 0) {
      return next(new AppError('Permission non trouvée', 404));
    }

    if (permission.rows[0].host_id !== req.user.id) {
      return next(new AppError('Vous n\'êtes pas autorisé', 403));
    }

    const updated = await CohostModel.update(id, {
      can_edit_listing,
      can_manage_bookings,
      can_respond_messages,
    });

    res.json({
      message: 'Permissions mises à jour',
      permission: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCohost = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return next(new AppError('Non authentifié', 401));
    }

    const { id } = req.params;

    // Vérifier que la permission appartient à l'hôte
    const permission = await pool.query(
      'SELECT * FROM cohost_permissions WHERE id = $1',
      [id]
    );

    if (permission.rows.length === 0) {
      return next(new AppError('Permission non trouvée', 404));
    }

    if (permission.rows[0].host_id !== req.user.id) {
      return next(new AppError('Vous n\'êtes pas autorisé', 403));
    }

    await CohostModel.delete(parseInt(id));

    res.json({
      message: 'Co-hôte supprimé avec succès',
    });
  } catch (error) {
    next(error);
  }
};
