import redisClient, { isRedisConnected } from '../config/redis';
import logger from '../utils/logger';

/**
 * Redis Cache Service for Leaderboard Optimization
 * Uses Redis Sorted Sets for ultra-fast leaderboard queries
 */

// Cache key prefixes
const LEADERBOARD_KEY = (channelId: string) => `leaderboard:channel:${channelId}`;
const QUIZ_LEADERBOARD_KEY = (quizId: string) => `leaderboard:quiz:${quizId}`;
// const GLOBAL_LEADERBOARD_KEY = 'leaderboard:global'; // Reserved for future use

// Cache TTL (Time To Live) in seconds
const LEADERBOARD_TTL = 300; // 5 minutes
const STATS_TTL = 60; // 1 minute

export interface LeaderboardEntry {
  userId: string;
  username: string;
  email: string;
  score: number;
  totalAttempts: number;
  rank?: number;
}

export class LeaderboardCache {
  /**
   * Cache channel leaderboard using Redis Sorted Set
   * Score is stored as sorted set score for automatic ranking
   */
  static async cacheChannelLeaderboard(
    channelId: string,
    entries: LeaderboardEntry[]
  ): Promise<void> {
    if (!isRedisConnected()) {
      logger.warn('Redis not connected, skipping cache');
      return;
    }

    try {
      const key = LEADERBOARD_KEY(channelId);
      const pipeline = redisClient.pipeline();

      // Clear existing leaderboard
      pipeline.del(key);

      // Add all entries to sorted set (score as sort key)
      for (const entry of entries) {
        const member = JSON.stringify({
          userId: entry.userId,
          username: entry.username,
          email: entry.email,
          score: entry.score,
          totalAttempts: entry.totalAttempts,
        });
        pipeline.zadd(key, entry.score, member);
      }

      // Set expiration
      pipeline.expire(key, LEADERBOARD_TTL);

      await pipeline.exec();
      logger.info(`✅ Cached leaderboard for channel: ${channelId} (${entries.length} entries)`);
    } catch (error) {
      logger.error('❌ Error caching channel leaderboard:', error);
    }
  }

  /**
   * Get cached channel leaderboard with ranking
   */
  static async getChannelLeaderboard(
    channelId: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<LeaderboardEntry[] | null> {
    if (!isRedisConnected()) {
      return null;
    }

    try {
      const key = LEADERBOARD_KEY(channelId);
      
      // Get entries in descending order (highest scores first)
      // ZREVRANGE returns members sorted by score (descending)
      const results = await redisClient.zrevrange(
        key,
        offset,
        offset + limit - 1,
        'WITHSCORES'
      );

      if (!results || results.length === 0) {
        return null;
      }

      // Parse results (results array is [member, score, member, score, ...])
      const entries: LeaderboardEntry[] = [];
      for (let i = 0; i < results.length; i += 2) {
        const data = JSON.parse(results[i]);
        entries.push({
          ...data,
          rank: offset + (i / 2) + 1,
        });
      }

      logger.info(`✅ Retrieved cached leaderboard for channel: ${channelId} (${entries.length} entries)`);
      return entries;
    } catch (error) {
      logger.error('❌ Error getting cached leaderboard:', error);
      return null;
    }
  }

  /**
   * Get total participants count for a channel leaderboard
   */
  static async getChannelParticipantCount(channelId: string): Promise<number | null> {
    if (!isRedisConnected()) {
      return null;
    }

    try {
      const key = LEADERBOARD_KEY(channelId);
      const count = await redisClient.zcard(key);
      return count;
    } catch (error) {
      logger.error('❌ Error getting participant count:', error);
      return null;
    }
  }

  /**
   * Invalidate (delete) channel leaderboard cache
   */
  static async invalidateChannelLeaderboard(channelId: string): Promise<void> {
    if (!isRedisConnected()) {
      return;
    }

    try {
      const key = LEADERBOARD_KEY(channelId);
      await redisClient.del(key);
      logger.info(`✅ Invalidated leaderboard cache for channel: ${channelId}`);
    } catch (error) {
      logger.error('❌ Error invalidating leaderboard cache:', error);
    }
  }

  /**
   * Cache quiz-specific leaderboard
   */
  static async cacheQuizLeaderboard(
    quizId: string,
    entries: LeaderboardEntry[]
  ): Promise<void> {
    if (!isRedisConnected()) {
      return;
    }

    try {
      const key = QUIZ_LEADERBOARD_KEY(quizId);
      const pipeline = redisClient.pipeline();

      pipeline.del(key);

      for (const entry of entries) {
        const member = JSON.stringify({
          userId: entry.userId,
          username: entry.username,
          email: entry.email,
          score: entry.score,
          totalAttempts: entry.totalAttempts,
        });
        pipeline.zadd(key, entry.score, member);
      }

      pipeline.expire(key, LEADERBOARD_TTL);
      await pipeline.exec();

      logger.info(`✅ Cached leaderboard for quiz: ${quizId}`);
    } catch (error) {
      logger.error('❌ Error caching quiz leaderboard:', error);
    }
  }

  /**
   * Get cached quiz leaderboard
   */
  static async getQuizLeaderboard(
    quizId: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<LeaderboardEntry[] | null> {
    if (!isRedisConnected()) {
      return null;
    }

    try {
      const key = QUIZ_LEADERBOARD_KEY(quizId);
      const results = await redisClient.zrevrange(
        key,
        offset,
        offset + limit - 1,
        'WITHSCORES'
      );

      if (!results || results.length === 0) {
        return null;
      }

      const entries: LeaderboardEntry[] = [];
      for (let i = 0; i < results.length; i += 2) {
        const data = JSON.parse(results[i]);
        entries.push({
          ...data,
          rank: offset + (i / 2) + 1,
        });
      }

      return entries;
    } catch (error) {
      logger.error('❌ Error getting cached quiz leaderboard:', error);
      return null;
    }
  }

  /**
   * Update a single user's score in leaderboard (for real-time updates)
   */
  static async updateUserScore(
    channelId: string,
    userId: string,
    username: string,
    email: string,
    newScore: number,
    totalAttempts: number
  ): Promise<void> {
    if (!isRedisConnected()) {
      return;
    }

    try {
      const key = LEADERBOARD_KEY(channelId);
      
      // Check if leaderboard exists
      const exists = await redisClient.exists(key);
      if (!exists) {
        logger.warn(`Leaderboard cache doesn't exist for channel: ${channelId}`);
        return;
      }

      const member = JSON.stringify({
        userId,
        username,
        email,
        score: newScore,
        totalAttempts,
      });

      await redisClient.zadd(key, newScore, member);
      logger.info(`✅ Updated score for user ${username} in channel ${channelId}`);
    } catch (error) {
      logger.error('❌ Error updating user score:', error);
    }
  }

  /**
   * Get user's rank in leaderboard
   */
  static async getUserRank(channelId: string, userId: string): Promise<number | null> {
    if (!isRedisConnected()) {
      return null;
    }

    try {
      const key = LEADERBOARD_KEY(channelId);
      
      // Get all members
      const members = await redisClient.zrevrange(key, 0, -1);
      
      // Find user's position
      for (let i = 0; i < members.length; i++) {
        const data = JSON.parse(members[i]);
        if (data.userId === userId) {
          return i + 1; // Rank is 1-based
        }
      }

      return null;
    } catch (error) {
      logger.error('❌ Error getting user rank:', error);
      return null;
    }
  }

  /**
   * Cache simple key-value with TTL (for stats, counts, etc.)
   */
  static async cacheStats(key: string, value: any, ttl: number = STATS_TTL): Promise<void> {
    if (!isRedisConnected()) {
      return;
    }

    try {
      await redisClient.setex(key, ttl, JSON.stringify(value));
    } catch (error) {
      logger.error('❌ Error caching stats:', error);
    }
  }

  /**
   * Get cached stats
   */
  static async getStats(key: string): Promise<any | null> {
    if (!isRedisConnected()) {
      return null;
    }

    try {
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('❌ Error getting cached stats:', error);
      return null;
    }
  }

  /**
   * Clear all leaderboard caches
   */
  static async clearAllLeaderboards(): Promise<void> {
    if (!isRedisConnected()) {
      return;
    }

    try {
      const keys = await redisClient.keys('leaderboard:*');
      if (keys.length > 0) {
        await redisClient.del(...keys);
        logger.info(`✅ Cleared ${keys.length} leaderboard caches`);
      }
    } catch (error) {
      logger.error('❌ Error clearing leaderboard caches:', error);
    }
  }
}

export default LeaderboardCache;
