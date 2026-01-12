import jwt from 'jsonwebtoken';

interface TokenPayload {
  id: number;
  email: string;
  role: string;
}

export const generateAccessToken = (payload: TokenPayload): string => {
  const secret = process.env.JWT_SECRET;
  const expiry = process.env.JWT_ACCESS_EXPIRY || '15m';

  if (!secret) {
    throw new Error('JWT_SECRET non configuré');
  }

  return jwt.sign(payload, secret, { expiresIn: expiry });
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  const secret = process.env.JWT_SECRET;
  const expiry = process.env.JWT_REFRESH_EXPIRY || '7d';

  if (!secret) {
    throw new Error('JWT_SECRET non configuré');
  }

  return jwt.sign(payload, secret, { expiresIn: expiry });
};

export const verifyToken = (token: string): TokenPayload => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET non configuré');
  }

  return jwt.verify(token, secret) as TokenPayload;
};
