import { ModuleManifest, SecurityValidationResult } from './types';

export class ManifestValidator {
  public static validateManifest(manifest: any): SecurityValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let score = 100;

    if (!manifest) {
      return {
        valid: false,
        errors: ['Manifest object is null or undefined'],
        warnings: [],
        securityScore: 0,
        checkedAt: new Date().toISOString()
      };
    }

    if (!manifest.id || typeof manifest.id !== 'string' || !manifest.id.trim()) {
      errors.push('Module manifest requires a non-empty string "id"');
      score -= 25;
    } else if (!/^[a-z0-9-_.]+$/i.test(manifest.id)) {
      errors.push(`Module ID "${manifest.id}" contains invalid characters. Must be alphanumeric with dashes/dots.`);
      score -= 15;
    }

    if (!manifest.name || typeof manifest.name !== 'string' || !manifest.name.trim()) {
      errors.push('Module manifest requires a non-empty string "name"');
      score -= 20;
    }

    if (!manifest.version || typeof manifest.version !== 'string') {
      errors.push('Module manifest requires a valid semver string "version"');
      score -= 20;
    } else if (!/^\d+\.\d+\.\d+/.test(manifest.version)) {
      warnings.push(`Version "${manifest.version}" is not strictly semantic versioning (x.y.z).`);
      score -= 5;
    }

    if (!manifest.description) {
      warnings.push('Module manifest missing a description');
      score -= 5;
    }

    if (!Array.isArray(manifest.services)) {
      errors.push('Module manifest requires a "services" array');
      score -= 10;
    } else {
      manifest.services.forEach((srv: any, i: number) => {
        if (!srv.serviceKey || !srv.name) {
          errors.push(`Service at index ${i} missing required "serviceKey" or "name"`);
          score -= 10;
        }
      });
    }

    if (!Array.isArray(manifest.capabilities)) {
      errors.push('Module manifest requires a "capabilities" array');
      score -= 10;
    }

    if (!Array.isArray(manifest.events)) {
      warnings.push('Module manifest missing "events" array');
      score -= 5;
    }

    if (!Array.isArray(manifest.routes)) {
      warnings.push('Module manifest missing "routes" array');
      score -= 5;
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
