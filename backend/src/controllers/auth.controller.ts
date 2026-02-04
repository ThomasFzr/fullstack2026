import { Request, Response, NextFunction } from 'express';
import { UserModel, CreateUserData } from '../models/User.model';
import { hashPassword, comparePassword } from '../utils/password.utils';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.utils';
import { AppError } from '../middleware/errorHandler';
import { pool } from '../config/database';

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const FRONTEND_URL = (process.env.CORS_ORIGIN || process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');

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

    // Utilisateur OAuth (sans mot de passe)
    if (!user.password_hash) {
      return next(new AppError('Utilisez la connexion avec GitHub', 401, 'OAUTH_USER'));
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

/**
 * Redirige vers GitHub pour l'autorisation OAuth
 */
export const githubAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!GITHUB_CLIENT_ID) {
      return next(new AppError('GitHub OAuth non configuré', 500, 'CONFIG_ERROR'));
    }

    const redirectUri = `${req.protocol}://${req.get('host')}/api/v1/auth/github/callback`;
    const scope = 'user:email read:user';
    const state = Math.random().toString(36).substring(7);

    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}`;

    res.redirect(githubAuthUrl);
  } catch (error) {
    next(error);
  }
};

/**
 * Callback GitHub OAuth - échange le code contre un token, récupère le profil, crée/connecte l'utilisateur
 */
export const githubCallback = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { code, state, error } = req.query;

    if (error) {
      return res.redirect(`${FRONTEND_URL}/login?error=github_denied`);
    }

    if (!code || typeof code !== 'string') {
      return res.redirect(`${FRONTEND_URL}/login?error=github_no_code`);
    }

    if (!GITHUB_CLIENT_ID || !GITHUB_CLIENT_SECRET) {
      return res.redirect(`${FRONTEND_URL}/login?error=github_not_configured`);
    }

    const redirectUri = `${req.protocol}://${req.get('host')}/api/v1/auth/github/callback`;

    // Échanger le code contre un access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: redirectUri,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error('GitHub token error:', tokenData);
      return res.redirect(`${FRONTEND_URL}/login?error=github_token_failed`);
    }

    const accessToken = tokenData.access_token;

    // Récupérer le profil utilisateur GitHub
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    const githubUser = await userResponse.json();

    if (githubUser.message) {
      return res.redirect(`${FRONTEND_URL}/login?error=github_profile_failed`);
    }

    const githubId = String(githubUser.id);
    let email = githubUser.email;

    // Si l'email est privé, récupérer les emails via l'API
    if (!email && tokenData.access_token) {
      const emailsResponse = await fetch('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });
      const emails = await emailsResponse.json();
      const primaryEmail = emails.find((e: any) => e.primary);
      email = primaryEmail?.email || null;
    }

    if (!email) {
      email = `${githubId}-${githubUser.login}@github.oauth`;
    }

    const nameParts = (githubUser.name || githubUser.login || 'User').split(' ');
    const firstName = nameParts[0] || 'User';
    const lastName = nameParts.slice(1).join(' ') || 'GitHub';

    // Chercher l'utilisateur existant par github_id ou email
    let user = await UserModel.findByGithubId(githubId);

    if (!user) {
      user = await UserModel.findByEmail(email);
      if (user) {
        // Lier le compte GitHub au compte existant (même email)
        await pool.query(
          'UPDATE users SET github_id = $1 WHERE id = $2',
          [githubId, user.id]
        );
        user = (await UserModel.findById(user.id))!;
      }
    }

    if (!user) {
      // Créer un nouvel utilisateur
      const placeholderHash = await hashPassword(
        `oauth_${githubId}_${Math.random().toString(36)}_${Date.now()}`
      );
      user = await UserModel.createFromGithub({
        email,
        first_name: firstName,
        last_name: lastName,
        github_id: githubId,
        password_hash: placeholderHash,
      });
    }

    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    const jwtAccessToken = generateAccessToken(tokenPayload);
    const jwtRefreshToken = generateRefreshToken(tokenPayload);

    // Rediriger vers le frontend avec les tokens dans l'URL
    const callbackUrl = `${FRONTEND_URL}/auth/callback?access_token=${jwtAccessToken}&refresh_token=${jwtRefreshToken}`;
    res.redirect(callbackUrl);
  } catch (error: any) {
    console.error('GitHub OAuth error:', error);
    res.redirect(`${FRONTEND_URL}/login?error=github_error`);
  }
};
