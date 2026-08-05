import { 
  RegisteredModuleMetadata, 
  ModuleAuditReport, 
  AuditItem
} from './types';
import { SecurityValidator } from './securityValidator';

export class AuditEngine {
  private static instance: AuditEngine;

  private constructor() {}

  public static getInstance(): AuditEngine {
    if (!AuditEngine.instance) {
      AuditEngine.instance = new AuditEngine();
    }
    return AuditEngine.instance;
  }

  public runAudit(modules: RegisteredModuleMetadata[]): ModuleAuditReport {
    const auditId = `AUD-${Date.now()}-${Math.floor(Math.random() * 899 + 100)}`;
    const timestamp = new Date().toISOString();
    const items: AuditItem[] = [];

    let healthyCount = 0;
    let warningsCount = 0;
    let errorsCount = 0;
    let criticalCount = 0;

    const routeOwners = new Map<string, string>();
    const eventOwners = new Map<string, string>();
    const registeredIds = new Set(modules.map(m => m.manifest.id));
    SecurityValidator.setRegisteredIds(Array.from(registeredIds));

    modules.forEach(mod => {
      const manifest = mod.manifest;

      if (mod.health.healthy && mod.health.score >= 80) {
        healthyCount++;
      }

      // 1. Health Audit
      if (mod.health.score < 50) {
        criticalCount++;
        items.push({
          id: `item-${Date.now()}-1`,
          moduleId: manifest.id,
          category: 'HEALTH',
          severity: 'CRITICAL',
          title: 'Severe Module Degradation',
          message: `Module "${manifest.name}" health score is critically low (${mod.health.score}/100). Details: ${mod.health.details || 'Unknown'}`,
          recommendation: 'Restart module or review error logs immediately.',
          timestamp
        });
      } else if (mod.health.score < 80) {
        warningsCount++;
        items.push({
          id: `item-${Date.now()}-2`,
          moduleId: manifest.id,
          category: 'HEALTH',
          severity: 'WARNING',
          title: 'Module Performance Warning',
          message: `Module "${manifest.name}" health score is degraded (${mod.health.score}/100).`,
          recommendation: 'Monitor CPU and memory usage.',
          timestamp
        });
      }

      // 2. Security & Manifest Validation
      const secVal = SecurityValidator.validateModuleSecurity(manifest);
      secVal.errors.forEach(err => {
        errorsCount++;
        items.push({
          id: `item-${Date.now()}-sec-err`,
          moduleId: manifest.id,
          category: 'SECURITY',
          severity: 'ERROR',
          title: 'Security Validation Error',
          message: err,
          recommendation: 'Fix manifest contract definition.',
          timestamp
        });
      });
      secVal.warnings.forEach(warn => {
        warningsCount++;
        items.push({
          id: `item-${Date.now()}-sec-warn`,
          moduleId: manifest.id,
          category: 'SECURITY',
          severity: 'WARNING',
          title: 'Security Audit Notice',
          message: warn,
          recommendation: 'Review module scope and permissions.',
          timestamp
        });
      });

      // 3. Dependency Check
      manifest.dependencies.forEach(dep => {
        if (!registeredIds.has(dep.moduleId) && !dep.optional) {
          errorsCount++;
          items.push({
            id: `item-${Date.now()}-dep`,
            moduleId: manifest.id,
            category: 'VERSION',
            severity: 'ERROR',
            title: 'Unsatisfied Dependency',
            message: `Required dependency module "${dep.moduleId}" is missing from registry.`,
            recommendation: `Install or register module "${dep.moduleId}".`,
            timestamp
          });
        }
      });

      // 4. Route Conflict Detection
      manifest.routes.forEach(route => {
        const routeKey = `${route.method}:${route.path}`;
        if (routeOwners.has(routeKey)) {
          errorsCount++;
          items.push({
            id: `item-${Date.now()}-route`,
            moduleId: manifest.id,
            category: 'ROUTES',
            severity: 'ERROR',
            title: 'Route Conflict',
            message: `Route "${routeKey}" is already owned by module "${routeOwners.get(routeKey)}".`,
            recommendation: 'Deduplicate API endpoint paths.',
            timestamp
          });
        } else {
          routeOwners.set(routeKey, manifest.id);
        }
      });

      // 5. Event Conflict Detection
      manifest.events.forEach(evt => {
        if (eventOwners.has(evt.eventType)) {
          warningsCount++;
          items.push({
            id: `item-${Date.now()}-evt`,
            moduleId: manifest.id,
            category: 'EVENTS',
            severity: 'INFO',
            title: 'Shared Event Type',
            message: `Event type "${evt.eventType}" is published by multiple modules (${eventOwners.get(evt.eventType)}, ${manifest.id}).`,
            recommendation: 'Ensure event schemas match across publishers.',
            timestamp
          });
        } else {
          eventOwners.set(evt.eventType, manifest.id);
        }
      });
    });

    let overallStatus: 'PASS' | 'WARNING' | 'FAIL' = 'PASS';
    if (criticalCount > 0 || errorsCount > 0) {
      overallStatus = 'FAIL';
    } else if (warningsCount > 0) {
      overallStatus = 'WARNING';
    }

    return {
      auditId,
      timestamp,
      totalModules: modules.length,
      healthyModules: healthyCount,
      warningsCount,
      errorsCount,
      criticalCount,
      items,
      overallStatus
    };
  }
}

export const auditEngine = AuditEngine.getInstance();
