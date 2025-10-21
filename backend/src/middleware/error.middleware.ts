import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  // FIX: Prefix unused 'next' argument with an underscore to satisfy ESLint rule
  _next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      status: err.statusCode,
    });
  }

  console.error('Unexpected error:', err);

  return res.status(500).json({
    error: 'Internal server error',
    status: 500,
  });
};

export const asyncHandler = (
  // FIX: Replace 'any' with 'void' since the promise resolves to the middleware chain,
  // or use 'unknown' if the return value is needed later, but 'void' is safest here.
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
