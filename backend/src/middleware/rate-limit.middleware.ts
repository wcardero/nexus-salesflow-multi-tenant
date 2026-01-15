import { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';

// ============================================================================
// Rate Limiting Middleware
// ============================================================================

/**
 * General rate limiting middleware (increased limits)
 * - Stricter limit in production (1000 requests per 15 minutes)
 * - More permissive in development (10000 requests per 15 minutes)
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 1000 : 10000,
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  skip: (req: Request) => {
    // Skip rate limiting in development
    return process.env.NODE_ENV !== 'production';
  },
  handler: (req: Request, res: Response) => {
    res.status(429).json({ message: 'Too many requests from this IP, please try again later.' });
  },
});

/**
 * Login rate limiting (more restrictive but increased from original)
 * - 50 login requests per 15 minutes per IP
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 login requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    res.status(429).json({ message: 'Too many login attempts, please try again later.' });
  },
});

// ============================================================================
// Custom Rate Limiter Factory
// ============================================================================

/**
 * Create a custom rate limiter with specific settings
 */
export const createRateLimiter = (options: {
  windowMs?: number;
  max?: number;
  message?: string;
  skipFailedRequests?: boolean;
}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes default
    max = 100,
    message = 'Too many requests, please try again later.',
    skipFailedRequests = false,
  } = options;

  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req: Request) => {
      if (process.env.NODE_ENV !== 'production') {
        return true;
      }
      if (skipFailedRequests) {
        // Skip if previous request failed (optional strategy)
        return false;
      }
      return false;
    },
    handler: (req: Request, res: Response) => {
      res.status(429).json({ message });
    },
  });
};

// ============================================================================
// Common Middleware
// ============================================================================

/**
 * Standard middleware that should be applied to all requests
 */
export const commonMiddleware = [
  // CORS is handled at app level
  // JSON parsing is handled at app level
];
