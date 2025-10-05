import { Request, Response, NextFunction } from 'express';

export interface ApiError extends Error {
  code?: string;
  field?: string;
  statusCode?: number;
}

export class AppError extends Error implements ApiError {
  code: string;
  field?: string;
  statusCode: number;

  constructor(code: string, message: string, statusCode: number = 400, field?: string) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.field = field;
    this.name = 'AppError';
  }
}

// Error handler middleware
export const errorHandler = (
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  const errorResponse: any = {
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: err.message || 'An unexpected error occurred',
    },
  };

  if (err.field) {
    errorResponse.error.field = err.field;
  }

  console.error('Error:', err);

  res.status(statusCode).json(errorResponse);
};

// Async handler wrapper
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
