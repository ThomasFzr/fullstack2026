import { Request, Response, NextFunction } from 'express';
import { UserModel, CreateUserData } from '../models/User.model';
import { hashPassword, comparePassword } from '../utils/password.utils';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.utils';
import { AppError } from '../middleware/errorHandler';

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password, first_name, last_name } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      return next(new AppError('Cet email est déjà utilisé', 409, 'EMAIL_EXISTS'));
    }

    // Hasher le mot de passe
    const password_hash = await hashPassword(password);

    // Créer l'utilisateur
    const userData: CreateUserData = {
      email,
      password: password_hash,
      first_name,
      last_name,
    };

    const user = await UserModel.create(userData);

    // Générer les tokens
    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    res.status(201).json({
      message: 'Utilisateur créé avec succès',
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        is_host: user.is_host,
      },
      tokens: {
        access_token: accessToken,
        refresh_token: refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    // Trouver l'utilisateur
    const user = await UserModel.findByEmail(email);
    if (!user) {
      return next(new AppError('Identifiants invalides', 401, 'INVALID_CREDENTIALS'));
    }

    // Vérifier le mot de passe
    const isPasswordValid = await comparePassword(password, user.password_hash);
    if (!isPasswordValid) {
      return next(new AppError('Identifiants invalides', 401, 'INVALID_CREDENTIALS'));
    }

    // Générer les tokens
    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    res.json({
      message: 'Connexion réussie',
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        is_host: user.is_host,
      },
      tokens: {
        access_token: accessToken,
        refresh_token: refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return next(new AppError('Refresh token manquant', 400, 'MISSING_TOKEN'));
    }

    // Vérifier le refresh token
    const { verifyToken } = require('../utils/jwt.utils');
    const decoded = verifyToken(refresh_token);

    // Vérifier que l'utilisateur existe toujours
    const user = await UserModel.findById(decoded.id);
    if (!user) {
      return next(new AppError('Utilisateur non trouvé', 404, 'USER_NOT_FOUND'));
    }

    // Générer un nouveau access token
    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(tokenPayload);

    res.json({
      access_token: accessToken,
    });
  } catch (error) {
    next(new AppError('Token invalide', 401, 'INVALID_TOKEN'));
  }
};
