import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { AppError } from './errorHandler';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('UNAUTHORIZED', 'No token provided', 401);
    }
    
    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, config.jwtSecret) as any;
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
      };
      next();
    } catch (err) {
      throw new AppError('UNAUTHORIZED', 'Invalid or expired token', 401);
    }
  } catch (error) {
    next(error);
  }
};

// Optional auth - doesn't fail if no token, but sets user if valid
export const optionalAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      try {
        const decoded = jwt.verify(token, config.jwtSecret) as any;
        req.user = {
          id: decoded.id,
          email: decoded.email,
          role: decoded.role,
        };
      } catch (err) {
        // Invalid token, but continue without user
      }
    }
    
    next();
  } catch (error) {
    next(error);
  }
};
