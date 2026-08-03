import { RbacService, RoleDefinition } from './rbacService';
import { AuditSecurityService } from './auditSecurityService';

export interface ResourceAccessRequest {
  userId: string;
  role?: string;
  userRole?: string; // Fallback field for middleware compatibility
  action: string; // e.g. 'read', 'write', 'delete', 'deploy', 'execute', 'app:lifecycle'
  resourceType: string; // e.g. 'app', 'deployment', 'ai_copilot', 'system', 'audit'
  resourceId?: string;
  tenantId?: string;
  ipAddress?: string;
}

export interface AccessDecision {
  granted: boolean;
  reason: string;
  evaluatedAt: string;
  userId: string;
  matchedPermission?: string;
  matchedRole?: string;
}

export interface ApiRoutePermissionRule {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | '*';
  pathPattern: string; // e.g. '/api/apps/:id/start'
  requiredPermission: string;
  description: string;
}

export class PermissionService {
  private static instance: PermissionService;
  private rbacService = RbacService.getInstance();
  private auditSecurityService = AuditSecurityService.getInstance();
  private routeRules: ApiRoutePermissionRule[] = [];
  private cache: Map<string, { decision: AccessDecision; expiresAt: number }> = new Map();
  private cacheTtlMs: number = 10000; // 10 seconds PDP cache

  private constructor() {
    this.initializeDefaultApiRules();
  }

  public static getInstance(): PermissionService {
    if (!PermissionService.instance) {
      PermissionService.instance = new PermissionService();
    }
    return PermissionService.instance;
  }

  private initializeDefaultApiRules() {
    const defaultRules: ApiRoutePermissionRule[] = [
      { id: 'rule-app-read', method: 'GET', pathPattern: '/api/apps', requiredPermission: 'app:read', description: 'List applications' },
      { id: 'rule-app-create', method: 'POST', pathPattern: '/api/apps', requiredPermission: 'app:write', description: 'Create application' },
      { id: 'rule-app-deploy', method: 'POST', pathPattern: '/api/apps/:id/deploy', requiredPermission: 'app:deploy', description: 'Deploy application' },
      { id: 'rule-app-lifecycle', method: 'POST', pathPattern: '/api/apps/:id/restart', requiredPermission: 'app:lifecycle', description: 'Restart application' },
      { id: 'rule-copilot-exec', method: 'POST', pathPattern: '/api/copilot/execute', requiredPermission: 'copilot:execute', description: 'Execute AI Copilot action' },
      { id: 'rule-audit-read', method: 'GET', pathPattern: '/api/audit', requiredPermission: 'audit:read', description: 'Read security audit logs' }
    ];

    this.routeRules = defaultRules;
  }

  // ----------------------------------------------------
  // POLICY DECISION POINT (PDP)
  // ----------------------------------------------------

  public evaluateAccess(request: ResourceAccessRequest): AccessDecision {
    const cacheKey = `${request.userId}:${request.role || request.userRole || 'anon'}:${request.action}:${request.resourceType}:${request.resourceId || 'any'}:${request.tenantId || 'global'}`;
    const now = Date.now();

    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > now) {
      return cached.decision;
    }

    const decision = this.performEvaluation(request);
    this.cache.set(cacheKey, { decision, expiresAt: now + this.cacheTtlMs });

    if (!decision.granted) {
      this.auditSecurityService.logAuthorization(
        request.userId,
        request.resourceId || request.resourceType,
        request.action,
        false,
        { role: request.role || request.userRole, ip: request.ipAddress, reason: decision.reason }
      );
    }

    return decision;
  }

  private performEvaluation(request: ResourceAccessRequest): AccessDecision {
    const evaluatedAt = new Date().toISOString();

    // Determine roles
    let userRoles: RoleDefinition[] = [];
    if (request.role || request.userRole) {
      const explicitRole = this.rbacService.getRole(request.role || request.userRole!);
      if (explicitRole) userRoles.push(explicitRole);
    }

    // Combine with assigned user roles
    const assigned = this.rbacService.getUserRoles(request.userId, request.tenantId);
    userRoles = [...userRoles, ...assigned];

    if (userRoles.length === 0) {
      return {
        granted: false,
        reason: 'No valid active roles associated with request.',
        evaluatedAt,
        userId: request.userId
      };
    }

    // SuperAdmin or Root Bypass
    const superRole = userRoles.find(r => r.name === 'SuperAdmin' || r.permissions.includes('*'));
    if (superRole) {
      return {
        granted: true,
        reason: 'Access granted via SuperAdmin root authorization.',
        evaluatedAt,
        userId: request.userId,
        matchedPermission: '*',
        matchedRole: superRole.name
      };
    }

    // Tenant Isolation Boundary Check
    if (request.tenantId && !this.rbacService.isTenantAuthorized(request.userId, request.tenantId)) {
      return {
        granted: false,
        reason: `Cross-tenant isolation violation. Tenant [${request.tenantId}] not authorized.`,
        evaluatedAt,
        userId: request.userId
      };
    }

    // Required permission pattern construction
    const targetPermission = request.action.includes(':') 
      ? request.action 
      : `${request.resourceType}:${request.action}`;

    // Collect effective permissions
    const effectivePermissions = this.rbacService.getEffectivePermissionsForUser(request.userId, request.tenantId);

    // Also include permissions directly on explicit roles
    userRoles.forEach(r => r.permissions.forEach(p => effectivePermissions.push(p)));

    // Check permission match
    for (const perm of effectivePermissions) {
      if (this.matchPermissionPattern(perm, targetPermission)) {
        return {
          granted: true,
          reason: `Permission pattern [${perm}] satisfies required action [${targetPermission}].`,
          evaluatedAt,
          userId: request.userId,
          matchedPermission: perm,
          matchedRole: userRoles[0]?.name
        };
      }
    }

    return {
      granted: false,
      reason: `Insufficient privileges. Required permission [${targetPermission}] not granted.`,
      evaluatedAt,
      userId: request.userId
    };
  }

  // Wildcard Pattern Matching Engine (e.g. 'app:*' matches 'app:read')
  public matchPermissionPattern(grantedPattern: string, targetPermission: string): boolean {
    if (grantedPattern === '*' || grantedPattern === targetPermission) return true;

    if (grantedPattern.endsWith(':*')) {
      const prefix = grantedPattern.slice(0, -2);
      return targetPermission.startsWith(`${prefix}:`) || targetPermission === prefix;
    }

    return false;
  }

  // ----------------------------------------------------
  // API ROUTE PERMISSION ENGINE
  // ----------------------------------------------------

  public checkApiRoutePermission(method: string, path: string, userId: string, userRole?: string): AccessDecision {
    const matchedRule = this.findMatchingRouteRule(method, path);
    if (!matchedRule) {
      // Default allow public routes or unmapped APIs with basic read check
      return {
        granted: true,
        reason: 'Unrestricted API route.',
        evaluatedAt: new Date().toISOString(),
        userId
      };
    }

    return this.evaluateAccess({
      userId,
      userRole,
      action: matchedRule.requiredPermission,
      resourceType: 'api_endpoint',
      resourceId: path
    });
  }

  private findMatchingRouteRule(method: string, path: string): ApiRoutePermissionRule | undefined {
    return this.routeRules.find(rule => {
      if (rule.method !== '*' && rule.method !== method.toUpperCase()) return false;
      return this.matchPathPattern(rule.pathPattern, path);
    });
  }

  private matchPathPattern(pattern: string, path: string): boolean {
    const patternSegments = pattern.split('/').filter(Boolean);
    const pathSegments = path.split('/').filter(Boolean);

    if (patternSegments.length !== pathSegments.length && !pattern.includes('*')) {
      return false;
    }

    for (let i = 0; i < patternSegments.length; i++) {
      const pSeg = patternSegments[i];
      const actual = pathSegments[i];

      if (pSeg.startsWith(':') || pSeg === '*') continue;
      if (pSeg !== actual) return false;
    }

    return true;
  }

  public registerApiRule(rule: ApiRoutePermissionRule): void {
    this.routeRules.push(rule);
  }

  public clearCache(): void {
    this.cache.clear();
  }
}
