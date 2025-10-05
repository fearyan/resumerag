import { Response, NextFunction } from 'express';
import crypto from 'crypto';
import NodeCache from 'node-cache';
import { AuthRequest } from './auth';
import { AppError } from './errorHandler';

const idempotencyCache = new NodeCache({ stdTTL: 86400, checkperiod: 3600 }); // 24 hours

export const idempotency = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const idempotencyKey = req.headers['idempotency-key'] as string;
    
    if (!idempotencyKey) {
      // Idempotency key is optional, just continue
      return next();
    }
    
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(idempotencyKey)) {
      throw new AppError('INVALID_IDEMPOTENCY_KEY', 'Idempotency key must be a valid UUID', 400);
    }
    
    const endpoint = `${req.method}:${req.path}`;
    const cacheKey = `${idempotencyKey}:${endpoint}`;
    
    // Hash the request body to check for payload changes
    const requestHash = crypto
      .createHash('sha256')
      .update(JSON.stringify(req.body || {}))
      .digest('hex');
    
    const cached = idempotencyCache.get<any>(cacheKey);
    
    if (cached) {
      // Check if payload is the same
      if (cached.requestHash !== requestHash) {
        throw new AppError(
          'IDEMPOTENCY_CONFLICT',
          'Idempotency key reused with different payload',
          409
        );
      }
      
      // Return cached response
      return res.status(cached.statusCode || 200).json(cached.response);
    }
    
    // Store original res.json to intercept response
    const originalJson = res.json.bind(res);
    
    res.json = function (body: any) {
      // Cache the response
      idempotencyCache.set(cacheKey, {
        requestHash,
        statusCode: res.statusCode,
        response: body,
      });
      
      return originalJson(body);
    };
    
    next();
  } catch (error) {
    next(error);
  }
};
