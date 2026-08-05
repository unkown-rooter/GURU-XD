import { toolRegistry, ToolExecutionContext } from '../services/toolRegistry';
import { RbacService } from '../services/rbacService';

export interface PermissionInspectorParams {
  role?: string;
  checkPermission?: string;
}

export interface PermissionInspectorResult {
  timestamp: string;
  definedRoles: string[];
  activePermissionsByRole?: Record<string, string[]>;
  permissionCheckResult?: {
    role: string;
    permission: string;
    allowed: boolean;
  };
  apiGuardActive: boolean;
}

export async function executePermissionInspectorTool(
  params: PermissionInspectorParams,
  context?: ToolExecutionContext
): Promise<PermissionInspectorResult> {
  const { role, checkPermission } = params;
  const timestamp = new Date().toISOString();
  const rbacService = RbacService.getInstance();

  const allRoles = rbacService.getAllRoles();
  const roles = allRoles.map(r => r.name);
  
  const activePermissionsByRole: Record<string, string[]> = {};
  for (const r of allRoles) {
    activePermissionsByRole[r.name] = r.permissions;
  }

  let permissionCheckResult;
  if (role && checkPermission) {
    const roleObj = rbacService.getRole(role);
    const allowed = roleObj ? (roleObj.permissions.includes('*') || roleObj.permissions.includes(checkPermission)) : false;
    permissionCheckResult = { role, permission: checkPermission, allowed };
  }

  return {
    timestamp,
    definedRoles: roles,
    activePermissionsByRole,
    permissionCheckResult,
    apiGuardActive: true
  };
}

// Register Tool 10: Permission Inspector Tool
toolRegistry.registerTool({
  toolId: 'tool-permission-inspector',
  toolName: 'Permission Inspector Tool',
  version: '1.0.0',
  description: 'RBAC role matrix, API guard policies, and security permission verification tool.',
  permissions: ['RBAC_INSPECT', 'SECURITY_CHECK'],
  capabilities: ['PermissionValidation', 'RbacInspection', 'SecurityAudit'],
  dependencies: ['rbacService'],
  owner: 'GURU-XD AI Core',
  executor: executePermissionInspectorTool
});
