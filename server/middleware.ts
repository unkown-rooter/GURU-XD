import { Request, Response, NextFunction } from "express";

// Memory storage for rate limiting
const rateLimitCache = new Map<string, { count: number; resetAt: number }>();

/**
 * Upgraded Terminal Request Logger with high-contrast colored markers
 */
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const timestamp = new Date().toISOString().substring(11, 19);
  
  res.on("finish", () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    
    let statusColor = "\x1b[32m"; // Green
    if (status >= 400 && status < 500) {
      statusColor = "\x1b[33m"; // Yellow
    } else if (status >= 500) {
      statusColor = "\x1b[31m"; // Red
    }
    
    const methodColor = "\x1b[36m"; // Cyan
    const resetColor = "\x1b[0m";
    
    console.log(
      `[${timestamp}] ${statusColor}${status}${resetColor} - ${methodColor}${req.method}${resetColor} ${req.originalUrl} (${duration}ms)`
    );
  });
  
  next();
}

/**
 * Custom Anti-Spam Rate Limiter to safeguard daemon orchestration sockets
 */
export function rateLimiter(limitCount: number = 60, windowMs: number = 60000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.headers["x-forwarded-for"] as string || "unknown_node";
    const now = Date.now();
    
    const record = rateLimitCache.get(ip);
    
    if (!record || now > record.resetAt) {
      rateLimitCache.set(ip, {
        count: 1,
        resetAt: now + windowMs
      });
      return next();
    }
    
    record.count += 1;
    if (record.count > limitCount) {
      console.warn(`[RATE LIMIT] Excessive API traffic originating from node client: ${ip}`);
      return res.status(429).json({
        success: false,
        error: "Exceeded server allocation limit rate. Please wait a minute before repeating bot daemon commands."
      });
    }
    
    next();
  };
}

/**
 * API Key / Auth Guard to protect routes
 */
export function apiGuard(req: Request, res: Response, next: NextFunction) {
  const expectedKey = process.env.ADMIN_API_KEY;
  if (!expectedKey) {
    // If no key is set in environment, bypass auth check
    return next();
  }
  
  const authHeader = req.headers["authorization"] || req.headers["x-api-key"];
  let providedKey = "";
  
  if (typeof authHeader === "string") {
    if (authHeader.startsWith("Bearer ")) {
      providedKey = authHeader.substring(7);
    } else {
      providedKey = authHeader;
    }
  } else {
    providedKey = (req.query.api_key as string) || "";
  }
  
  // Also support bypassing auth if request comes directly from local applet preview sessions
  const isFromIframe = req.headers["referer"]?.includes("europe-west2.run.app") || req.headers["host"]?.includes("localhost");
  
  if (isFromIframe || providedKey === expectedKey) {
    return next();
  }
  
  return res.status(401).json({
    success: false,
    error: "Unauthorized portal access. Invalid ADMIN_API_KEY credentials."
  });
}

/**
 * Unified Global Async Exception Handler
 */
export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  console.error("\x1b[31m[CRITICAL EXCEPTION RUNTIME ERROR]\x1b[0m", err);
  
  res.status(500).json({
    success: false,
    error: err.message || "An unexpected internal node cluster exception occurred."
  });
}
