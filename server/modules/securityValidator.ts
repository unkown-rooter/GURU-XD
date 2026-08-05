import { ModuleManifest, SecurityValidationResult } from './types';
import { ManifestValidator } from './manifestValidator';

export class SecurityValidator {
  private static registeredModuleIds: Set<string> = new Set();

  public static setRegisteredIds(ids: string[]) {
    this.registeredModuleIds = new Set(ids);
  }

  public static validateModuleSecurity(manifest: ModuleManifest): SecurityValidationResult {
    const manifestCheck = ManifestValidator.validateManifest(manifest);
    const errors: string[] = [...manifestCheck.errors];
    const warnings: string[] = [...manifestCheck.warnings];
    let score = manifestCheck.securityScore;

    // Check for Duplicate IDs during fresh registration
    if (this.registeredModuleIds.has(manifest.id)) {
      warnings.push(`Module ID "${manifest.id}" is already registered. Re-registering will update existing module.`);
    }

    // Check circular dependencies self-reference
    if (manifest.dependencies && Array.isArray(manifest.dependencies)) {
      manifest.dependencies.forEach(dep => {
        if (dep.moduleId === manifest.id) {
          errors.push(`Self-referencing circular dependency detected: Module "${manifest.id}" cannot depend on itself.`);
          score -= 30;
        }
      });
    }

    // Check system permission escalations
    if (manifest.permissions) {
      const hasSystemPermission = manifest.permissions.some(p => p.level === 'system');
      if (hasSystemPermission) {
        warnings.push(`Module "${manifest.id}" requests elevated 'system' level permissions. Ensure audit approval.`);
        score -= 10;
      }
    }

    // Validate routes
    if (manifest.routes) {
      manifest.routes.forEach(route => {
        if (!route.path.startsWith('/')) {
          errors.push(`Invalid route path "${route.path}" in module "${manifest.id}". Paths must start with '/'.`);
          score -= 15;
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      securityScore: Math.max(0, score),
      checkedAt: new Date().toISOString()
    };
  }
}
