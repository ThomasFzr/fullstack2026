import { Request, Response, NextFunction } from 'express';

/**
 * Middleware de cache HTTP pour les requêtes GET
 * Configure les headers Cache-Control appropriés
 */
export const cacheMiddleware = (maxAge: number = 300) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Ne mettre en cache que les requêtes GET réussies
    if (req.method === 'GET') {
      res.set('Cache-Control', `public, max-age=${maxAge}`);
      res.set('ETag', `"${Date.now()}"`);
    }
    next();
  };
};
