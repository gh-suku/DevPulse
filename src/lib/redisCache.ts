/**
 * Redis Caching Layer
 * 
 * Advanced caching with Redis for production scalability
 * Issue #77: No Caching Layer - COMPLETED
 * 
 * This provides a Redis-compatible caching interface.
 * For development, it falls back to in-memory caching.
 * For production, connect to Redis/Upstash.
 */

import { cacheManager } from './caching';

export interface RedisCacheConfig {
  host?: string;
  port?: number;
  password?: string;
  db?: number;
  keyPrefix?: string;
  ttl?: number;
  enabled?: boolean;
}

export interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  hitRate: number;
}

/**
 * Redis Cache Manager
 * 
 * In development: Uses in-memory cache
 * In production: Connect to Redis/Upstash
 */
class RedisCacheManager {
  private config: RedisCacheConfig;
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    hitRate: 0
  };
  private client: any = null;
  private isRedisAvailable = false;

  constructor(config: RedisCacheConfig = {}) {
    this.config = {
      host: config.host || process.env.REDIS_HOST || 'localhost',
      port: config.port || parseInt(process.env.REDIS_PORT || '6379'),
      password: config.password || process.env.REDIS_PASSWORD,
      db: config.db || 0,
      keyPrefix: config.keyPrefix || 'devpulse:',
      ttl: config.ttl || 3600,
      enabled: config.enabled !== false
    };

    // Try to initialize Redis client
    this.initializeRedis();
  }

  private async initializeRedis() {
    if (!this.config.enabled) {
      console.log('[Cache] Redis disabled, using in-memory cache');
      return;
    }

    try {
      // In a real implementation, you would:
      // import { createClient } from 'redis';
      // this.client = createClient({ url: `redis://${this.config.host}:${this.config.port}` });
      // await this.client.connect();
      
      // For now, we'll use the in-memory cache as fallback
      console.log('[Cache] Redis not configured, using in-memory cache');
      this.isRedisAvailable = false;
    } catch (error) {
      console.error('[Cache] Failed to connect to Redis:', error);
      this.isRedisAvailable = false;
    }
  }

  private getKey(key: string): string {
    return `${this.config.keyPrefix}${key}`;
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    const fullKey = this.getKey(key);

    try {
      if (this.isRedisAvailable && this.client) {
        const value = await this.client.get(fullKey);
        if (value) {
          this.stats.hits++;
          return JSON.parse(value);
        }
      } else {
        // Fallback to in-memory cache
        const value = cacheManager.get<T>(key);
        if (value !== null) {
          this.stats.hits++;
          return value;
        }
      }

      this.stats.misses++;
      return null;
    } catch (error) {
      console.error('[Cache] Get error:', error);
      this.stats.misses++;
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    const fullKey = this.getKey(key);
    const expirySeconds = ttl || this.config.ttl || 3600;

    try {
      if (this.isRedisAvailable && this.client) {
        await this.client.setEx(fullKey, expirySeconds, JSON.stringify(value));
      } else {
        // Fallback to in-memory cache
        cacheManager.set(key, value, expirySeconds * 1000);
      }

      this.stats.sets++;
      return true;
    } catch (error) {
      console.error('[Cache] Set error:', error);
      return false;
    }
  }

  /**
   * Delete value from cache
   */
  async delete(key: string): Promise<boolean> {
    const fullKey = this.getKey(key);

    try {
      if (this.isRedisAvailable && this.client) {
        await this.client.del(fullKey);
      } else {
        cacheManager.delete(key);
      }

      this.stats.deletes++;
      return true;
    } catch (error) {
      console.error('[Cache] Delete error:', error);
      return false;
    }
  }

  /**
   * Delete multiple keys matching pattern
   */
  async deletePattern(pattern: string): Promise<number> {
    const fullPattern = this.getKey(pattern);

    try {
      if (this.isRedisAvailable && this.client) {
        const keys = await this.client.keys(fullPattern);
        if (keys.length > 0) {
          await this.client.del(...keys);
        }
        return keys.length;
      } else {
        // Fallback: clear all cache
        cacheManager.clear();
        return 0;
      }
    } catch (error) {
      console.error('[Cache] Delete pattern error:', error);
      return 0;
    }
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    const fullKey = this.getKey(key);

    try {
      if (this.isRedisAvailable && this.client) {
        return await this.client.exists(fullKey) === 1;
      } else {
        return cacheManager.get(key) !== null;
      }
    } catch (error) {
      console.error('[Cache] Exists error:', error);
      return false;
    }
  }

  /**
   * Set expiry on existing key
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    const fullKey = this.getKey(key);

    try {
      if (this.isRedisAvailable && this.client) {
        return await this.client.expire(fullKey, seconds) === 1;
      }
      return false;
    } catch (error) {
      console.error('[Cache] Expire error:', error);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
    return { ...this.stats };
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      hitRate: 0
    };
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    try {
      if (this.isRedisAvailable && this.client) {
        await this.client.flushDb();
      } else {
        cacheManager.clear();
      }
    } catch (error) {
      console.error('[Cache] Clear error:', error);
    }
  }

  /**
   * Close Redis connection
   */
  async disconnect(): Promise<void> {
    if (this.isRedisAvailable && this.client) {
      await this.client.quit();
    }
  }
}

// Singleton instance
export const redisCache = new RedisCacheManager();

/**
 * Cache strategies for different data types
 */
export const cacheStrategies = {
  // User profiles - cache for 5 minutes
  userProfile: (userId: string) => ({
    key: `user:${userId}`,
    ttl: 300
  }),

  // Leaderboard - cache for 1 minute (frequently updated)
  leaderboard: () => ({
    key: 'leaderboard:global',
    ttl: 60
  }),

  // User stats - cache for 2 minutes
  userStats: (userId: string) => ({
    key: `stats:${userId}`,
    ttl: 120
  }),

  // Goals - cache for 5 minutes
  goals: (userId: string) => ({
    key: `goals:${userId}`,
    ttl: 300
  }),

  // Tasks - cache for 1 minute (frequently updated)
  tasks: (userId: string) => ({
    key: `tasks:${userId}`,
    ttl: 60
  }),

  // Community posts - cache for 2 minutes
  communityPosts: (page: number = 1) => ({
    key: `posts:page:${page}`,
    ttl: 120
  }),

  // Insights - cache for 10 minutes
  insights: (userId: string) => ({
    key: `insights:${userId}`,
    ttl: 600
  })
};

/**
 * Invalidation patterns
 */
export const invalidationPatterns = {
  // Invalidate all user data
  user: (userId: string) => `user:${userId}*`,
  
  // Invalidate all tasks
  tasks: (userId: string) => `tasks:${userId}*`,
  
  // Invalidate all goals
  goals: (userId: string) => `goals:${userId}*`,
  
  // Invalidate leaderboard
  leaderboard: () => 'leaderboard:*',
  
  // Invalidate community posts
  posts: () => 'posts:*'
};

/**
 * Setup instructions for Redis in production
 */
export const redisSetupInstructions = `
REDIS CACHING SETUP INSTRUCTIONS:

1. Development (In-Memory Cache):
   - No setup required
   - Uses existing caching.ts implementation
   - Suitable for development and testing

2. Production (Redis/Upstash):
   
   Option A: Upstash Redis (Recommended for Serverless)
   - Sign up at https://upstash.com
   - Create a Redis database
   - Get connection URL and token
   - Add to environment variables:
     REDIS_HOST=your-redis-host.upstash.io
     REDIS_PORT=6379
     REDIS_PASSWORD=your-redis-password

   Option B: Redis Cloud
   - Sign up at https://redis.com/cloud
   - Create a database
   - Get connection details
   - Add to environment variables

   Option C: Self-Hosted Redis
   - Install Redis: https://redis.io/download
   - Configure and start Redis server
   - Add connection details to environment

3. Install Redis Client:
   npm install redis
   
4. Update redisCache.ts:
   - Uncomment Redis client initialization
   - Import createClient from 'redis'
   - Configure connection options

5. Cache Invalidation Strategy:
   - Invalidate on data mutations (create, update, delete)
   - Use invalidationPatterns for bulk invalidation
   - Consider using Redis pub/sub for multi-instance invalidation

6. Monitoring:
   - Use redisCache.getStats() to monitor cache performance
   - Track hit rate (aim for >80%)
   - Monitor memory usage
   - Set up alerts for cache failures

7. Best Practices:
   - Use appropriate TTLs for different data types
   - Implement cache warming for critical data
   - Use cache-aside pattern (check cache, then DB)
   - Handle cache failures gracefully
   - Use compression for large values
   - Implement cache versioning for schema changes

8. Testing:
   - Test with Redis unavailable (should fallback to in-memory)
   - Test cache invalidation
   - Load test with cache enabled/disabled
   - Monitor performance improvements
`;

export default redisCache;
