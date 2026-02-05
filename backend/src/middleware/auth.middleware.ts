import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler';
import { UserModel } from '../models/User.model';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Token d\'authentification manquant', 401, 'UNAUTHORIZED');
    }

    const token = authHeader.substring(7);
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new AppError('Configuration JWT manquante', 500, 'CONFIG_ERROR');
    }

    const decoded = jwt.verify(token, secret) as {
      id: number;
      email: string;
      role: string;
    };

    req.user = decoded;

    // Mettre à jour le rôle depuis la base de données (évite les tokens JWT obsolètes)
    const dbUser = await UserModel.findById(decoded.id);
    if (dbUser) {
      req.user.role = dbUser.role;
    }

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Token invalide', 401, 'INVALID_TOKEN'));
    } else {
      next(error);
    }
  }
};

// Middleware d'authentification optionnelle (n'échoue pas si pas de token)
export const optionalAuthenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Pas de token, on continue sans authentification
      return next();
    }

    const token = authHeader.substring(7);
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      return next();
    }

    try {
      const decoded = jwt.verify(token, secret) as {
        id: number;
        email: string;
        role: string;
      };

      req.user = decoded;

      // Mettre à jour le rôle depuis la base de données
      const dbUser = await UserModel.findById(decoded.id);
      if (dbUser) {
        req.user.role = dbUser.role;
      }
    } catch {
      // Token invalide, on continue sans authentification
    }

    next();
  } catch (error) {
    next();
  }
};

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Non authentifié', 401, 'UNAUTHORIZED'));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('Accès refusé - Rôle insuffisant', 403, 'FORBIDDEN')
      );
    }

    next();
  };
};
