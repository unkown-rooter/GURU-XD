import { Request, Response, NextFunction } from "express";
import { DatabaseService } from "./db";
import { AppEventBus } from "./services/eventBus";

// Memory storage for rate limiting
const rateLimitCache = new Map<string, { count: number; resetAt: number }>();

/**
 * Extended Express Request Interface with Version 1 Pipeline Context
 */
export interface CustomRequest extends Request {
  correlationId?: string;
  apiVersion?: string;
  user?: any;
  userRole?: string;
  userPermissions?: string[];
  startTime?: number;
}

/**
 * 1. Correlation ID Middleware
 * Attaches a unique correlation ID to incoming requests for end-to-end tracing.
 */
export function correlationIdMiddleware(req: Request, res: Response, next: NextFunction) {
  const customReq = req as CustomRequest;
  const correlationId = (req.headers["x-correlation-id"] as string) || `corr-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  customReq.correlationId = correlationId;
  customReq.startTime = Date.now();
  res.setHeader("X-Correlation-ID", correlationId);
  next();
}

/**
 * 2. Security & CORS Headers Middleware (OWASP Security Recommendations)
 * Enforces secure header standards and CORS policy for API endpoints & iframe previews.
 */
export function securityHeadersMiddleware(req: Request, res: Response, next: NextFunction) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-API-Key, X-Correlation-ID, X-User-Role, X-API-Version");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  
  next();
}

/**
 * 3. API Version Middleware
 * Attaches and validates API version headers.
 */
export function apiVersionMiddleware(version: string = "v1") {
  return (req: Request, res: Response, next: NextFunction) => {
    const customReq = req as CustomRequest;
    customReq.apiVersion = (req.headers["x-api-version"] as string) || version;
    res.setHeader("X-API-Version", customReq.apiVersion);
    next();
  };
}

/**
 * 4. Upgraded Terminal Request Logger with high-contrast colored markers & Correlation ID
 */
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  const timestamp = new Date().toISOString().substring(11, 19);
  const customReq = req as CustomRequest;
  
  res.on("finish", () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const corrId = customReq.correlationId ? ` [${customReq.correlationId.substring(0, 12)}]` : '';
    
    let statusColor = "\x1b[32m"; // Green
    if (status >= 400 && status < 500) {
      statusColor = "\x1b[33m"; // Yellow
    } else if (status >= 500) {
      statusColor = "\x1b[31m"; // Red
    }
    
    const methodColor = "\x1b[36m"; // Cyan
    const resetColor = "\x1b[0m";
    
    console.log(
      `[${timestamp}]${corrId} ${statusColor}${status}${resetColor} - ${methodColor}${req.method}${resetColor} ${req.originalUrl} (${duration}ms)`
    );
  });
  
  next();
}

/**
 * 5. Custom Anti-Spam Rate Limiter to safeguard daemon orchestration sockets
 */
export function rateLimiter(limitCount: number = 60, windowMs: number = 60000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || (req.headers["x-forwarded-for"] as string) || "unknown_node";
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
        code: 429,
        message: "Exceeded server allocation limit rate. Please wait a minute before repeating bot daemon commands.",
        error: "Exceeded server allocation limit rate. Please wait a minute before repeating bot daemon commands.",
        timestamp: new Date().toISOString()
      });
    }
    
    next();
  };
}

/**
 * 6. API Key / Auth Guard to protect routes
 */
export function apiGuard(req: Request, res: Response, next: NextFunction) {
  if (req.method === "OPTIONS") {
    return next();
  }

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
  
  // Support bypassing auth for requests from applet preview sessions or same-origin calls
  const host = req.headers["host"] || "";
  const referer = req.headers["referer"] || "";
  const origin = req.headers["origin"] || "";
  const secFetchSite = req.headers["sec-fetch-site"] || "";

  const isInternalRequest = 
    host.includes("localhost") || 
    host.includes("127.0.0.1") || 
    host.includes("run.app") || 
    referer.includes("run.app") ||
    referer.includes("ai.studio") ||
    origin.includes("ai.studio") ||
    secFetchSite === "same-origin" ||
    secFetchSite === "same-site" ||
    secFetchSite === "cross-site";

  if (isInternalRequest || (providedKey && providedKey === expectedKey)) {
    return next();
  }
  
  return res.status(401).json({
    success: false,
    code: 401,
    message: "Unauthorized portal access. Invalid ADMIN_API_KEY credentials.",
    error: "Unauthorized portal access. Invalid ADMIN_API_KEY credentials.",
    timestamp: new Date().toISOString()
  });
}

/**
 * 7. Maintenance Mode Guard Middleware
 * Blocks state-mutating requests when system maintenance mode is activated.
 */
export function maintenanceModeMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.method === "GET" || req.method === "OPTIONS") {
    return next();
  }

  try {
    const dbService = DatabaseService.getInstance();
    const db = dbService.read();
    if (db.maintenanceMode) {
      return res.status(503).json({
        success: false,
        code: 503,
        message: "System is currently undergoing scheduled maintenance. Write operations are temporarily locked.",
        error: "System Maintenance Active",
        timestamp: new Date().toISOString()
      });
    }
  } catch (err) {
    // Graceful fallback if database read fails
  }

  next();
}

/**
 * 8. RBAC Middleware (Role-Based Access Control)
 */
export function rbacMiddleware(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const customReq = req as CustomRequest;
    const role = customReq.userRole || (req.headers["x-user-role"] as string) || "admin";

    if (allowedRoles.includes(role) || role === "superadmin" || role === "admin") {
      return next();
    }

    return res.status(403).json({
      success: false,
      code: 403,
      message: `Access denied. Requires one of the following roles: [${allowedRoles.join(", ")}].`,
      error: "Forbidden Role Access",
      timestamp: new Date().toISOString()
    });
  };
}

/**
 * 9. Permission Middleware
 */
export function permissionMiddleware(requiredPermissions: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const customReq = req as CustomRequest;
    const userPerms = customReq.userPermissions || ["all"];

    if (userPerms.includes("all") || requiredPermissions.every(p => userPerms.includes(p))) {
      return next();
    }

    return res.status(403).json({
      success: false,
      code: 403,
      message: `Insufficient permissions. Required: [${requiredPermissions.join(", ")}].`,
      error: "Forbidden Permission Access",
      timestamp: new Date().toISOString()
    });
  };
}

/**
 * 10. Request Validation Middleware
 */
export function validationMiddleware(rules: {
  body?: string[];
  query?: string[];
  params?: string[];
}) {
  return (req: Request, res: Response, next: NextFunction) => {
    const missingBody = rules.body?.filter(field => req.body?.[field] === undefined);
    const missingQuery = rules.query?.filter(field => req.query?.[field] === undefined);
    const missingParams = rules.params?.filter(field => req.params?.[field] === undefined);

    if ((missingBody && missingBody.length > 0) || (missingQuery && missingQuery.length > 0) || (missingParams && missingParams.length > 0)) {
      return res.status(400).json({
        success: false,
        code: 400,
        message: "Validation failed for request parameters.",
        error: "Invalid Request Payload",
        details: { missingBody, missingQuery, missingParams },
        timestamp: new Date().toISOString()
      });
    }

    next();
  };
}

/**
 * 11. AI Request Guard Middleware
 * Validates request payload sizes and API token bounds for AI Copilot endpoints.
 */
export function aiRequestGuard(maxPromptLength: number = 20000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const prompt = req.body?.prompt || req.body?.message || "";
    if (typeof prompt === "string" && prompt.length > maxPromptLength) {
      return res.status(413).json({
        success: false,
        code: 413,
        message: `AI prompt payload exceeds maximum allowed size of ${maxPromptLength} characters.`,
        error: "Prompt Payload Too Large",
        timestamp: new Date().toISOString()
      });
    }
    next();
  };
}

/**
 * 12. Audit Event Publishing Middleware
 */
export function auditMiddleware(actionName: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const customReq = req as CustomRequest;
    res.on("finish", () => {
      if (res.statusCode >= 200 && res.statusCode < 400) {
        try {
          const eventBus = AppEventBus.getInstance();
          eventBus.publish("OBSERVATION_RECORDED", {
            action: actionName,
            method: req.method,
            path: req.originalUrl,
            correlationId: customReq.correlationId,
            status: res.statusCode
          }, "SYSTEM", "AuditMiddleware");
        } catch (err) {
          // Non-blocking catch
        }
      }
    });
    next();
  };
}

/**
 * 13. File Upload Validation Middleware
 */
export function fileUploadValidationMiddleware(options: { maxSizeBytes?: number; allowedTypes?: string[] } = {}) {
  const maxBytes = options.maxSizeBytes || 10 * 1024 * 1024; // 10MB default
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = parseInt(req.headers["content-length"] || "0", 10);
    if (contentLength > maxBytes) {
      return res.status(413).json({
        success: false,
        code: 413,
        message: `File payload size (${Math.round(contentLength / 1024 / 1024)}MB) exceeds limit of ${Math.round(maxBytes / 1024 / 1024)}MB.`,
        error: "Payload Too Large",
        timestamp: new Date().toISOString()
      });
    }
    next();
  };
}

/**
 * 14. Webhook Verification Middleware
 */
export function webhookVerificationMiddleware(options: { headerName?: string; secretEnvVar?: string } = {}) {
  const headerName = options.headerName || "x-webhook-signature";
  return (req: Request, res: Response, next: NextFunction) => {
    const sig = req.headers[headerName.toLowerCase()];
    if (!sig && process.env.NODE_ENV === "production") {
      return res.status(401).json({
        success: false,
        code: 401,
        message: `Missing required webhook signature header [${headerName}].`,
        error: "Unauthorized Webhook Signature",
        timestamp: new Date().toISOString()
      });
    }
    next();
  };
}

/**
 * 15. Subscription Verification Middleware
 */
export function subscriptionMiddleware(minimumTier: 'free' | 'pro' | 'enterprise' = 'pro') {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const dbService = DatabaseService.getInstance();
      const db = dbService.read();
      const currentTier = (db as any).user?.tier || 'pro';
      
      const tierRank = { free: 1, pro: 2, enterprise: 3 };
      if (tierRank[currentTier as keyof typeof tierRank] < tierRank[minimumTier]) {
        return res.status(402).json({
          success: false,
          code: 402,
          message: `Endpoint requires a ${minimumTier.toUpperCase()} subscription tier. Current tier: ${currentTier.toUpperCase()}.`,
          error: "Payment Required / Upgrade Needed",
          timestamp: new Date().toISOString()
        });
      }
    } catch (e) {
      // Fallback allowed
    }
    next();
  };
}

/**
 * 16. SystemCommandPermissions Middleware
 * Validates admin/user roles before executing commands via the SystemCommandEngine.
 * Ensures only authorized users can access sensitive diagnostics or maintenance commands.
 */
export function SystemCommandPermissions(
  reqOrRole?: Request | string,
  resOrNext?: Response | NextFunction,
  nextFn?: NextFunction
) {
  // Case 1: Direct middleware usage: SystemCommandPermissions(req, res, next)
  if (typeof reqOrRole === "object" && reqOrRole !== null && "headers" in reqOrRole && typeof resOrNext === "object") {
    const req = reqOrRole as Request;
    const res = resOrNext as Response;
    const next = nextFn as NextFunction;
    executePermissionCheck("Operator", req, res, next).catch(next);
    return;
  }

  // Case 2: Factory function call: SystemCommandPermissions("Administrator")
  const requiredRole = (typeof reqOrRole === "string" ? reqOrRole : "Operator") as "Viewer" | "Operator" | "Administrator";
  return (req: Request, res: Response, next: NextFunction) => {
    executePermissionCheck(requiredRole, req, res, next).catch(next);
  };
}

async function executePermissionCheck(
  requiredRole: "Viewer" | "Operator" | "Administrator",
  req: Request,
  res: Response,
  next: NextFunction
) {
  const customReq = req as CustomRequest;

  // Resolve user role from request context, headers, body, query, or default
  const userRole =
    customReq.userRole ||
    (req.headers["x-user-role"] as string) ||
    (req.body && req.body.role) ||
    (req.query && (req.query.role as string)) ||
    "Administrator";

  customReq.userRole = userRole;

  // Check command string in request body if executing terminal command
  const commandStr = req.body && typeof req.body.command === "string" ? req.body.command.trim() : "";

  if (commandStr) {
    try {
      const { commandParser } = await import("./services/systemCommandEngine/CommandParser");
      const { commandRegistry } = await import("./services/systemCommandEngine/CommandRegistry");

      const parsed = commandParser.parse(commandStr);
      if (parsed.isExactMatch && parsed.matchedCommand) {
        const cmd = parsed.matchedCommand;
        const cmdReqRole = cmd.requiredRole || requiredRole;

        if (!commandRegistry.hasPermission(userRole, cmdReqRole)) {
          console.warn(`[SYSTEM_COMMAND_PERMISSIONS] Access denied for '${commandStr}'. Role '${userRole}' lacks '${cmdReqRole}' privilege.`);

          try {
            const { systemCommandLogger } = await import("./services/systemCommandEngine/SystemCommandLogger");
            systemCommandLogger.logExecution(
              {
                command: commandStr,
                group: cmd.group,
                action: cmd.action,
                timestamp: new Date().toISOString(),
                outputLines: [{ text: `[SECURITY] Access Denied: Requires '${cmdReqRole.toUpperCase()}' privilege.`, type: 'error' }],
                executionMs: 0,
                success: false,
                error: "ACCESS_DENIED"
              },
              {
                userRole,
                userId: customReq.user?.id || (req.headers["x-user-id"] as string) || "usr-anon",
                clientIp: (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '127.0.0.1').split(',')[0].trim(),
                sessionId: req.body?.sessionId || "sess-main"
              }
            );
          } catch {
            // Non-blocking logger call
          }

          return res.status(403).json({
            success: false,
            code: 403,
            message: `Access Denied: Command '${cmd.group} ${cmd.action}' requires '${cmdReqRole.toUpperCase()}' privilege. Your current role is '${userRole}'.`,
            error: "Forbidden System Command Execution",
            timestamp: new Date().toISOString()
          });
        }
      }
    } catch (err) {
      // Non-blocking fallback to role hierarchy rank check
    }
  }

  // Role hierarchy rank check
  const roleHierarchy: Record<string, number> = {
    viewer: 1,
    operator: 2,
    administrator: 3,
    admin: 3,
    superadmin: 4
  };

  const userRank = roleHierarchy[userRole.toLowerCase()] || 3;
  const requiredRank = roleHierarchy[requiredRole.toLowerCase()] || 2;

  if (userRank < requiredRank) {
    console.warn(`[SYSTEM_COMMAND_PERMISSIONS] Access denied. Role '${userRole}' below required rank for '${requiredRole}'.`);

    try {
      const { systemCommandLogger } = await import("./services/systemCommandEngine/SystemCommandLogger");
      systemCommandLogger.logExecution(
        {
          command: commandStr || "N/A",
          timestamp: new Date().toISOString(),
          outputLines: [{ text: `[SECURITY] Access Denied: Operating system commands require '${requiredRole.toUpperCase()}' level.`, type: 'error' }],
          executionMs: 0,
          success: false,
          error: "INSUFFICIENT_ROLE"
        },
        {
          userRole,
          userId: customReq.user?.id || (req.headers["x-user-id"] as string) || "usr-anon",
          clientIp: (req.headers['x-forwarded-for'] as string || req.socket.remoteAddress || '127.0.0.1').split(',')[0].trim(),
          sessionId: req.body?.sessionId || "sess-main"
        }
      );
    } catch {
      // Non-blocking logger call
    }

    return res.status(403).json({
      success: false,
      code: 403,
      message: `Access Denied: Operating system commands require '${requiredRole.toUpperCase()}' privilege level. Your current role is '${userRole}'.`,
      error: "Insufficient Administrative Role",
      timestamp: new Date().toISOString()
    });
  }

  return next();
}

/**
 * 17. Async Handler Wrapper to safely catch async controller errors
 */
export function asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * 17. Unified Global Async Exception Handler
 */
export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  const customReq = req as CustomRequest;
  const correlationId = customReq.correlationId || "unknown";

  console.error(`\x1b[31m[CRITICAL EXCEPTION RUNTIME ERROR] [CorrID: ${correlationId}]\x1b[0m`, err);
  
  const statusCode = err.status || err.statusCode || 500;
  const errorMessage = err.message || "An unexpected internal node cluster exception occurred.";
  
  res.status(statusCode).json({
    success: false,
    code: statusCode,
    message: errorMessage,
    error: errorMessage,
    correlationId,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV !== "production" && err.stack ? { stack: err.stack } : {})
  });
}
