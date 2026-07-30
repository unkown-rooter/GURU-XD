import { Request, Response, NextFunction } from 'express';

export class ApiGatewayService {
  private static rateLimitMap = new Map<string, { count: number; resetAt: number }>();

  public static rateLimiter(maxRequests: number = 60, windowMs: number = 60000) {
    return (req: Request, res: Response, next: NextFunction) => {
      const ip = req.ip || req.socket.remoteAddress || 'unknown-client';
      const now = Date.now();
      const entry = ApiGatewayService.rateLimitMap.get(ip) || { count: 0, resetAt: now + windowMs };

      if (now > entry.resetAt) {
        entry.count = 1;
        entry.resetAt = now + windowMs;
      } else {
        entry.count++;
      }

      ApiGatewayService.rateLimitMap.set(ip, entry);

      if (entry.count > maxRequests) {
        return res.status(429).json({
          success: false,
          error: 'Rate limit exceeded. Please throttle API requests.',
          retryAfterMs: entry.resetAt - now
        });
      }

      next();
    };
  }

  public static requestContextMiddleware(req: Request, res: Response, next: NextFunction) {
    (req as any).requestId = `req-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    (req as any).receivedAt = new Date().toISOString();
    res.setHeader('X-Request-ID', (req as any).requestId);
    next();
  }

  public static errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
    console.error(`[ApiGateway] Error handling request ${req.path}:`, err);
    res.status(err.status || 500).json({
      success: false,
      error: err.message || 'Internal Server Error',
      requestId: (req as any).requestId
    });
  }
}
