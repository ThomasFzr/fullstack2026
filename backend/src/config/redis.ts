import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

let redisClient: Redis | null = null;
let initAttempted = false;

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const CACHE_TTL = 300; // 5 minutes en secondes

/**
 * Initialise et retourne le client Redis.
 * Retourne null si Redis n'est pas configuré ou indisponible (app continue sans cache).
 */
export const getRedisClient = (): Redis | null => {
  if (initAttempted) {
    return redisClient;
  }

  initAttempted = true;

  try {
    const client = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 2,
      retryStrategy: (times) => {
        if (times > 2) {
          redisClient = null;
          return null;
        }
        return Math.min(times * 100, 2000);
      },
      lazyConnect: true,
    });

    client.on('error', () => {
      redisClient = null;
    });

    client.on('connect', () => {
      console.log('✅ Redis connecté - cache serveur activé');
    });

    redisClient = client;
  } catch {
    redisClient = null;
  }

  return redisClient;
};

/**
 * Cache Redis pour les listings
 * Si Redis n'est pas disponible, toutes les opérations sont des no-op
 */
export const redisCache = {
  async get<T>(key: string): Promise<T | null> {
    const client = getRedisClient();
    if (!client) return null;
    try {
      const data = await client.get(key);
      return data ? (JSON.parse(data) as T) : null;
    } catch {
      return null;
    }
  },

  async set(key: string, value: unknown, ttlSeconds: number = CACHE_TTL): Promise<void> {
    const client = getRedisClient();
    if (!client) return;
    try {
      await client.setex(key, ttlSeconds, JSON.stringify(value));
    } catch {
      // Ignorer les erreurs de cache
    }
  },

  async del(key: string): Promise<void> {
    const client = getRedisClient();
    if (!client) return;
    try {
      await client.del(key);
    } catch {
      // Ignorer
    }
  },

  async delPattern(pattern: string): Promise<void> {
    const client = getRedisClient();
    if (!client) return;
    try {
      const keys = await client.keys(pattern);
      if (keys.length > 0) {
        await client.del(...keys);
      }
    } catch {
      // Ignorer
    }
  },
};

export const CACHE_TTL_SECONDS = CACHE_TTL;
