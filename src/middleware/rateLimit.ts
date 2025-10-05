import { Response, NextFunction } from 'express';
import NodeCache from 'node-cache';
import { AuthRequest } from './auth';
import { AppError } from './errorHandler';
import { config } from '../config';

const rateLimitCache = new NodeCache({ stdTTL: 60, checkperiod: 10 });

export const rateLimit = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    // Rate limiting is per-user, so we need authentication
    if (!req.user) {
      throw new AppError('UNAUTHORIZED', 'Authentication required for rate limiting', 401);
    }
    
    const userId = req.user.id;
    const now = Date.now();
    const minuteBucket = Math.floor(now / 60000); // Current minute
    const cacheKey = `${userId}:${minuteBucket}`;
    
    // Get current count for this minute bucket
    const currentCount = rateLimitCache.get<number>(cacheKey) || 0;
    
    if (currentCount >= config.rateLimitPerMinute) {
      const resetTime = (minuteBucket + 1) * 60; // Next minute in seconds
      
      res.setHeader('X-RateLimit-Remaining', '0');
      res.setHeader('X-RateLimit-Reset', resetTime.toString());
      
      throw new AppError(
        'RATE_LIMIT',
        `Rate limit exceeded. Try again in ${60 - Math.floor((now % 60000) / 1000)} seconds.`,
        429
      );
    }
    
    // Increment count
    rateLimitCache.set(cacheKey, currentCount + 1);
    
    // Set rate limit headers
    const remaining = config.rateLimitPerMinute - (currentCount + 1);
    const resetTime = (minuteBucket + 1) * 60;
    
    res.setHeader('X-RateLimit-Remaining', remaining.toString());
    res.setHeader('X-RateLimit-Reset', resetTime.toString());
    
    next();
  } catch (error) {
    next(error);
  }
};
