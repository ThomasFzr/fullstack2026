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

export const searchUsers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      return next(new AppError('Non authentifié', 401));
    }

    const { q } = req.query;

    if (!q || typeof q !== 'string' || q.length < 3) {
      return next(new AppError('La recherche doit contenir au moins 3 caractères', 400));
    }

    // Rechercher des utilisateurs par email
    const result = await pool.query(
      `SELECT id, email, first_name, last_name, role, is_host 
       FROM users 
       WHERE email ILIKE $1 
       LIMIT 10`,
      [`%${q}%`]
    );

    res.json(result.rows);
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

    // Récupérer tous les co-hôtes pour les listings de l'hôte avec les informations des utilisateurs
    const result = await pool.query(
      `SELECT 
        cp.id, cp.listing_id, cp.host_id, cp.cohost_id,
        cp.can_edit_listing, cp.can_manage_bookings, cp.can_respond_messages,
        cp.created_at,
        u.id as user_id, u.email, u.first_name, u.last_name, u.role, u.is_host
      FROM cohost_permissions cp
      JOIN listings l ON cp.listing_id = l.id
      LEFT JOIN users u ON cp.cohost_id = u.id
      WHERE l.host_id = $1
      ORDER BY cp.created_at DESC`,
      [req.user.id]
    );

    // Formater les résultats pour inclure les informations du co-hôte
    const cohosts = result.rows.map((row: any) => ({
      id: row.id,
      listing_id: row.listing_id,
      host_id: row.host_id,
      cohost_id: row.cohost_id,
      can_edit_listing: row.can_edit_listing,
      can_manage_bookings: row.can_manage_bookings,
      can_respond_messages: row.can_respond_messages,
      created_at: row.created_at,
      cohost: row.user_id ? {
        id: row.user_id,
        email: row.email,
        first_name: row.first_name,
        last_name: row.last_name,
        role: row.role,
        is_host: row.is_host,
      } : null,
    }));

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

    const cohostUserId = permission.rows[0].cohost_id;

    await CohostModel.delete(parseInt(id));

    // Vérifier si l'utilisateur est encore co-hôte d'autres annonces
    const remainingPermissions = await pool.query(
      'SELECT COUNT(*) as count FROM cohost_permissions WHERE cohost_id = $1',
      [cohostUserId]
    );

    // Si l'utilisateur n'est plus co-hôte d'aucune annonce, réinitialiser son rôle à 'guest'
    if (parseInt(remainingPermissions.rows[0].count) === 0) {
      await UserModel.updateRole(cohostUserId, 'guest' as any);
    }

    res.json({
      message: 'Co-hôte supprimé avec succès',
    });
  } catch (error) {
    next(error);
  }
};
