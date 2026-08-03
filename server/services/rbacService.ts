import { AuditSecurityService } from './auditSecurityService';

export type SystemRoleType = 
  | 'SuperAdmin' 
  | 'OrgAdmin' 
  | 'Admin' 
  | 'Developer' 
  | 'Operator' 
  | 'Viewer' 
  | 'Guest';

export interface RoleDefinition {
  id: string;
  name: string;
  type: 'system' | 'custom' | 'organization';
  weight: number; // Higher weight means higher privilege
  parentRoleId?: string;
  description: string;
  permissions: string[];
  tenantId?: string;
  isSystemBuiltIn?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserRoleAssignment {
  id: string;
  userId: string;
  roleId: string;
  tenantId?: string;
  orgId?: string;
  assignedBy: string;
  assignedAt: string;
  expiresAt?: string;
  active: boolean;
}

export class RbacService {
  private static instance: RbacService;
  private roles: Map<string, RoleDefinition> = new Map();
  private userAssignments: Map<string, UserRoleAssignment[]> = new Map();
  private auditSecurityService = AuditSecurityService.getInstance();

  private constructor() {
    this.initializeDefaultSystemRoles();
  }

  public static getInstance(): RbacService {
    if (!RbacService.instance) {
      RbacService.instance = new RbacService();
    }
    return RbacService.instance;
  }

  private initializeDefaultSystemRoles() {
    const now = new Date().toISOString();

    const systemRoles: RoleDefinition[] = [
      {
        id: 'role-superadmin',
        name: 'SuperAdmin',
        type: 'system',
        weight: 100,
        description: 'Full platform root access across all tenants and subsystems',
        permissions: ['*'],
        isSystemBuiltIn: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'role-orgadmin',
        name: 'OrgAdmin',
        type: 'organization',
        weight: 80,
        description: 'Organization wide administrative rights and team management',
        permissions: ['org:*', 'app:*', 'user:*', 'deployment:*', 'audit:*'],
        isSystemBuiltIn: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'role-admin',
        name: 'Admin',
        type: 'system',
        weight: 70,
        description: 'Application & tenant administrator access',
        permissions: ['app:*', 'deployment:*', 'metrics:*', 'logs:*', 'config:*'],
        isSystemBuiltIn: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'role-developer',
        name: 'Developer',
        type: 'system',
        weight: 50,
        description: 'Developer workspace rights for building, testing, and deploying apps',
        permissions: ['app:read', 'app:write', 'app:deploy', 'copilot:execute', 'logs:read'],
        isSystemBuiltIn: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'role-operator',
        name: 'Operator',
        type: 'system',
        weight: 30,
        description: 'Operational rights for monitoring, restarting, and viewing app state',
        permissions: ['app:read', 'app:lifecycle', 'metrics:read', 'logs:read'],
        isSystemBuiltIn: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'role-viewer',
        name: 'Viewer',
        type: 'system',
        weight: 10,
        description: 'Read-only viewer rights across dashboards and status pages',
        permissions: ['app:read', 'metrics:read', 'logs:read'],
        isSystemBuiltIn: true,
        createdAt: now,
        updatedAt: now
      },
      {
        id: 'role-guest',
        name: 'Guest',
        type: 'system',
        weight: 1,
        description: 'Unauthenticated or guest level access',
        permissions: ['public:read'],
        isSystemBuiltIn: true,
        createdAt: now,
        updatedAt: now
      }
    ];

    systemRoles.forEach(r => this.roles.set(r.id, r));
  }

  // ----------------------------------------------------
  // ROLE MANAGEMENT
  // ----------------------------------------------------

  public getRole(roleIdOrName: string): RoleDefinition | undefined {
    // Check by ID or Name
    const role = this.roles.get(roleIdOrName);
    if (role) return role;

    for (const r of this.roles.values()) {
      if (r.name.toLowerCase() === roleIdOrName.toLowerCase()) {
        return r;
      }
    }
    return undefined;
  }

  public getAllRoles(): RoleDefinition[] {
    return Array.from(this.roles.values());
  }

  public createCustomRole(params: {
    name: string;
    description: string;
    permissions: string[];
    weight?: number;
    parentRoleId?: string;
    tenantId?: string;
    creatorUserId?: string;
  }): RoleDefinition {
    if (this.getRole(params.name)) {
      throw new Error(`Role with name [${params.name}] already exists.`);
    }

    const id = `role-custom-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const role: RoleDefinition = {
      id,
      name: params.name,
      type: 'custom',
      weight: params.weight ?? 20,
      description: params.description,
      permissions: params.permissions,
      parentRoleId: params.parentRoleId,
      tenantId: params.tenantId,
      isSystemBuiltIn: false,
      createdAt: now,
      updatedAt: now
    };

    this.roles.set(id, role);

    this.auditSecurityService.logEvent({
      category: 'permission',
      severity: 'medium',
      action: 'ROLE_CREATED',
      actor: { userId: params.creatorUserId || 'admin' },
      target: { resourceType: 'role', resourceId: id },
      status: 'success',
      details: { roleName: role.name, permissionsCount: role.permissions.length }
    });

    return role;
  }

  public updateRole(roleId: string, updates: Partial<Omit<RoleDefinition, 'id' | 'isSystemBuiltIn'>>, updaterUserId?: string): RoleDefinition {
    const role = this.roles.get(roleId);
    if (!role) {
      throw new Error(`Role [${roleId}] not found.`);
    }
    if (role.isSystemBuiltIn) {
      throw new Error(`Cannot modify system built-in role [${role.name}].`);
    }

    const updatedRole: RoleDefinition = {
      ...role,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.roles.set(roleId, updatedRole);

    this.auditSecurityService.logEvent({
      category: 'permission',
      severity: 'medium',
      action: 'ROLE_UPDATED',
      actor: { userId: updaterUserId || 'admin' },
      target: { resourceType: 'role', resourceId: roleId },
      status: 'success',
      details: { updates }
    });

    return updatedRole;
  }

  public deleteCustomRole(roleId: string, actorUserId?: string): boolean {
    const role = this.roles.get(roleId);
    if (!role) return false;
    if (role.isSystemBuiltIn) {
      throw new Error(`Cannot delete system built-in role [${role.name}].`);
    }

    this.roles.delete(roleId);

    this.auditSecurityService.logEvent({
      category: 'permission',
      severity: 'high',
      action: 'ROLE_DELETED',
      actor: { userId: actorUserId || 'admin' },
      target: { resourceType: 'role', resourceId: roleId },
      status: 'success',
      details: { roleName: role.name }
    });

    return true;
  }

  // ----------------------------------------------------
  // USER ASSIGNMENTS & TENANT ISOLATION
  // ----------------------------------------------------

  public assignRoleToUser(params: {
    userId: string;
    roleIdOrName: string;
    tenantId?: string;
    orgId?: string;
    assignedBy: string;
    expiresAt?: string;
  }): UserRoleAssignment {
    const role = this.getRole(params.roleIdOrName);
    if (!role) {
      throw new Error(`Role [${params.roleIdOrName}] not found.`);
    }

    const assignment: UserRoleAssignment = {
      id: `assign-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId: params.userId,
      roleId: role.id,
      tenantId: params.tenantId,
      orgId: params.orgId,
      assignedBy: params.assignedBy,
      assignedAt: new Date().toISOString(),
      expiresAt: params.expiresAt,
      active: true
    };

    const existing = this.userAssignments.get(params.userId) || [];
    existing.push(assignment);
    this.userAssignments.set(params.userId, existing);

    this.auditSecurityService.logEvent({
      category: 'authorization',
      severity: 'medium',
      action: 'USER_ROLE_ASSIGNED',
      actor: { userId: params.assignedBy },
      target: { resourceType: 'user', resourceId: params.userId },
      status: 'success',
      details: { roleId: role.id, roleName: role.name, tenantId: params.tenantId }
    });

    return assignment;
  }

  public getUserRoles(userId: string, tenantId?: string): RoleDefinition[] {
    const assignments = this.userAssignments.get(userId) || [];
    const now = new Date().getTime();

    const activeAssignments = assignments.filter(a => {
      if (!a.active) return false;
      if (a.expiresAt && new Date(a.expiresAt).getTime() < now) return false;
      if (tenantId && a.tenantId && a.tenantId !== tenantId) return false;
      return true;
    });

    const roles: RoleDefinition[] = [];
    activeAssignments.forEach(a => {
      const r = this.roles.get(a.roleId);
      if (r) roles.push(r);
    });

    // Fallback if no roles assigned: default to Viewer or Guest
    if (roles.length === 0) {
      const defaultRole = this.getRole('Viewer') || this.getRole('Guest');
      if (defaultRole) roles.push(defaultRole);
    }

    return roles;
  }

  public getEffectivePermissionsForUser(userId: string, tenantId?: string): string[] {
    const roles = this.getUserRoles(userId, tenantId);
    const permissionSet = new Set<string>();

    roles.forEach(role => {
      this.resolveRolePermissions(role, permissionSet);
    });

    return Array.from(permissionSet);
  }

  private resolveRolePermissions(role: RoleDefinition, accumulated: Set<string>): void {
    role.permissions.forEach(p => accumulated.add(p));

    if (role.parentRoleId) {
      const parent = this.roles.get(role.parentRoleId);
      if (parent) {
        this.resolveRolePermissions(parent, accumulated);
      }
    }
  }

  public isTenantAuthorized(userId: string, targetTenantId: string): boolean {
    const roles = this.getUserRoles(userId);
    // SuperAdmin bypasses tenant checks
    if (roles.some(r => r.name === 'SuperAdmin' || r.permissions.includes('*'))) {
      return true;
    }

    const assignments = this.userAssignments.get(userId) || [];
    return assignments.some(a => a.active && (!a.tenantId || a.tenantId === targetTenantId));
  }
}

export { RbacService as RBACService, RbacService as rbacService };
