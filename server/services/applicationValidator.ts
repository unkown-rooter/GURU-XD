import { ApplicationManager, ExtendedApplicationMetadata } from './applicationManager';

export type ValidationCategory = 'schema' | 'dependency' | 'security' | 'resource' | 'compatibility';

export interface ValidationIssue {
  id: string;
  category: ValidationCategory;
  severity: 'error' | 'warning' | 'info';
  field?: string;
  message: string;
  remediation: string;
}

export interface ValidationReport {
  isValid: boolean;
  appId: string;
  validationScore: number; // 0 - 100
  issues: ValidationIssue[];
  errorCount: number;
  warningCount: number;
  validatedAt: string;
}

export class ApplicationValidator {
  private static instance: ApplicationValidator;
  private appManager = ApplicationManager.getInstance();

  private constructor() {}

  public static getInstance(): ApplicationValidator {
    if (!ApplicationValidator.instance) {
      ApplicationValidator.instance = new ApplicationValidator();
    }
    return ApplicationValidator.instance;
  }

  public validateManifest(appData: any): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    if (!appData.name || typeof appData.name !== 'string' || appData.name.trim().length === 0) {
      issues.push({
        id: 'val-name-required',
        category: 'schema',
        severity: 'error',
        field: 'name',
        message: 'Application name is required.',
        remediation: 'Provide a non-empty string for application name.'
      });
    } else if (!/^[a-z0-9-]+$/.test(appData.name)) {
      issues.push({
        id: 'val-name-format',
        category: 'schema',
        severity: 'warning',
        field: 'name',
        message: 'Application name should be lowercase alphanumeric with hyphens.',
        remediation: 'Sanitize name to match RFC-1123 DNS label standards (e.g., my-app-service).'
      });
    }

    if (!appData.type || typeof appData.type !== 'string') {
      issues.push({
        id: 'val-type-required',
        category: 'schema',
        severity: 'error',
        field: 'type',
        message: 'Application type is required.',
        remediation: 'Specify application type (e.g., "WhatsApp Bot", "Express API", "AI Agent").'
      });
    }

    if (appData.currentVersion && !/^v?\d+\.\d+\.\d+/.test(appData.currentVersion)) {
      issues.push({
        id: 'val-version-semver',
        category: 'schema',
        severity: 'warning',
        field: 'currentVersion',
        message: 'Version string does not follow Semantic Versioning format.',
        remediation: 'Use SemVer format such as v1.0.0 or 2.4.1.'
      });
    }

    return issues;
  }

  public validateDependencies(appId: string, dependencies: any[] = []): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    if (!Array.isArray(dependencies)) {
      issues.push({
        id: 'val-deps-array',
        category: 'dependency',
        severity: 'error',
        field: 'dependencies',
        message: 'Dependencies field must be an array.',
        remediation: 'Format dependencies as an array of AppDependency objects.'
      });
      return issues;
    }

    const { resolved, missing, cyclic } = this.appManager.resolveDependencyGraph(appId);

    if (cyclic) {
      issues.push({
        id: 'val-deps-cyclic',
        category: 'dependency',
        severity: 'error',
        field: 'dependencies',
        message: 'Circular dependency chain detected in application dependency graph.',
        remediation: 'Refactor dependency relationships to form a Directed Acyclic Graph (DAG).'
      });
    }

    if (missing.length > 0) {
      issues.push({
        id: 'val-deps-missing',
        category: 'dependency',
        severity: 'warning',
        field: 'dependencies',
        message: `Missing required upstream application dependencies: [${missing.join(', ')}].`,
        remediation: 'Deploy or register missing dependency applications before enabling production routing.'
      });
    }

    return issues;
  }

  public validateSecurityProfile(appData: any, envVars: Record<string, string> = {}): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    if (appData.repository && appData.repository.startsWith('http://')) {
      issues.push({
        id: 'val-sec-insecure-repo',
        category: 'security',
        severity: 'warning',
        field: 'repository',
        message: 'Insecure HTTP repository URL declared.',
        remediation: 'Use HTTPS URL for git source repositories to ensure transport encryption.'
      });
    }

    // Check for exposed secrets in plaintext env vars
    const sensitiveKeys = ['SECRET', 'KEY', 'PASSWORD', 'TOKEN', 'PRIVATE_KEY', 'CREDENTIAL'];
    Object.entries(envVars).forEach(([key, val]) => {
      const isSensitive = sensitiveKeys.some(s => key.toUpperCase().includes(s));
      if (isSensitive && val && val.length > 3 && !val.startsWith('••••') && !val.startsWith('${')) {
        issues.push({
          id: `val-sec-unmasked-${key}`,
          category: 'security',
          severity: 'warning',
          field: `envVars.${key}`,
          message: `Environment variable "${key}" appears to contain an unmasked plaintext secret.`,
          remediation: 'Store sensitive parameters in Secret Manager or mask them in application configuration.'
        });
      }
    });

    if (appData.ports && Array.isArray(appData.ports)) {
      if (appData.ports.includes(22) || appData.ports.includes(3389)) {
        issues.push({
          id: 'val-sec-dangerous-port',
          category: 'security',
          severity: 'error',
          field: 'ports',
          message: 'Application exposes administrative management ports (SSH/RDP).',
          remediation: 'Remove public port bindings for administrative protocols.'
        });
      }
    }

    return issues;
  }

  public validateResourceConstraints(appData: any): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    if (appData.replicaCount && appData.replicaCount > 50) {
      issues.push({
        id: 'val-res-high-replicas',
        category: 'resource',
        severity: 'warning',
        field: 'replicaCount',
        message: 'High replica count requested (>50). Ensure cluster quota permits high replica scaling.',
        remediation: 'Contact cluster administrator for quota expansion or adjust max replicas.'
      });
    }

    if (appData.resourceQuota) {
      const { cpuLimit, memoryLimit } = appData.resourceQuota;
      if (cpuLimit && parseFloat(cpuLimit) > 8) {
        issues.push({
          id: 'val-res-excessive-cpu',
          category: 'resource',
          severity: 'warning',
          field: 'resourceQuota.cpuLimit',
          message: `Excessive CPU allocation requested (${cpuLimit}).`,
          remediation: 'Opt for vertical scaling with multi-process pods or balance across workers.'
        });
      }
    }

    return issues;
  }

  public validateFullApplication(appData: any): ValidationReport {
    const appId = appData.id || 'new-app';
    const envVars = appData.envVars || {};

    const manifestIssues = this.validateManifest(appData);
    const dependencyIssues = this.validateDependencies(appId, appData.dependencies || []);
    const securityIssues = this.validateSecurityProfile(appData, envVars);
    const resourceIssues = this.validateResourceConstraints(appData);

    const allIssues = [...manifestIssues, ...dependencyIssues, ...securityIssues, ...resourceIssues];
    const errors = allIssues.filter(i => i.severity === 'error');
    const warnings = allIssues.filter(i => i.severity === 'warning');

    let validationScore = 100 - errors.length * 25 - warnings.length * 10;
    validationScore = Math.max(0, Math.min(100, validationScore));

    return {
      isValid: errors.length === 0,
      appId,
      validationScore,
      issues: allIssues,
      errorCount: errors.length,
      warningCount: warnings.length,
      validatedAt: new Date().toISOString()
    };
  }
}
