import crypto from 'crypto';
import { redisCache } from '../config/redis';

const LISTING_PREFIX = 'minibnb:listing:';
const LISTINGS_LIST_PREFIX = 'minibnb:listings:list:';

/**
 * Génère une clé de cache pour la liste des annonces (basée sur les filtres)
 */
export const getListingsCacheKey = (filters: Record<string, unknown>): string => {
  const hash = crypto
    .createHash('md5')
    .update(JSON.stringify(filters))
    .digest('hex');
  return `${LISTINGS_LIST_PREFIX}${hash}`;
};

/**
 * Clé de cache pour une annonce individuelle
 */
export const getListingByIdCacheKey = (id: number): string => {
  return `${LISTING_PREFIX}${id}`;
};

/**
 * Récupère la liste des annonces depuis le cache
 */
export const getCachedListings = async (filters: Record<string, unknown>) => {
  const key = getListingsCacheKey(filters);
  return redisCache.get<{ listings: unknown[]; total: number }>(key);
};

/**
 * Met en cache la liste des annonces
 */
export const setCachedListings = async (
  filters: Record<string, unknown>,
  data: { listings: unknown[]; total: number }
) => {
  const key = getListingsCacheKey(filters);
  await redisCache.set(key, data);
};

/**
 * Récupère une annonce depuis le cache
 */
export const getCachedListing = async (id: number) => {
  const key = getListingByIdCacheKey(id);
  return redisCache.get(key);
};

/**
 * Met en cache une annonce
 */
export const setCachedListing = async (id: number, data: unknown) => {
  const key = getListingByIdCacheKey(id);
  await redisCache.set(key, data);
};

/**
 * Invalide tout le cache des listings (appelé lors de create/update/delete)
 */
export const invalidateListingsCache = async (listingId?: number) => {
  await redisCache.delPattern(`${LISTINGS_LIST_PREFIX}*`);
  if (listingId !== undefined) {
    await redisCache.del(getListingByIdCacheKey(listingId));
  }
};
