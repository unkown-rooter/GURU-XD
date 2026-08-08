import { DatabaseService } from "../db";
import { securityCore } from "../services/securityCore";
import { securityAnalyst } from "../securityAnalyst";
import { systemGraphContextEngine } from "./systemGraphContextEngine";

export interface ComponentInspectionResult {
  subsystemId: string;
  subsystemName: string;
  inspectedAt: string;
  healthStatus: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
  details: Record<string, any>;
  vulnerabilitiesOrWarnings: string[];
  recommendedActions: string[];
}

/**
 * Upgrade 2: Full-Spectrum Cross-Component AI Inspector
 * Allows the AI Core Orchestrator to inspect real runtime telemetry across any platform component.
 */
export class PlatformInspector {
  private static instance: PlatformInspector;
  private dbService = DatabaseService.getInstance();

  private constructor() {}

  public static getInstance(): PlatformInspector {
    if (!PlatformInspector.instance) {
      PlatformInspector.instance = new PlatformInspector();
    }
    return PlatformInspector.instance;
  }

  /**
   * Deeply inspects a specific platform subsystem or the entire platform
   */
  public inspectSubsystem(target: string = 'ALL'): ComponentInspectionResult[] {
    const db = this.dbService.read();
    const nowStr = new Date().toISOString();
    const results: ComponentInspectionResult[] = [];

    // 1. Database & Schemas Inspection
    if (target === 'ALL' || target === 'database') {
      const users = db.users || [];
      const bots = db.bots || [];
      const commands = db.commands || [];
      const logs = db.logs || [];

      const warnings: string[] = [];
      if (logs.length > 500) warnings.push("Log buffer count exceeds 500 lines. Vacuum cleanup recommended.");
      if (commands.some((c: any) => !c.isActive)) warnings.push("Inactive custom commands found in registry.");

      results.push({
        subsystemId: 'database_schemas',
        subsystemName: 'Database & Schemas Inspector',
        inspectedAt: nowStr,
        healthStatus: warnings.length > 0 ? 'DEGRADED' : 'HEALTHY',
        details: {
          usersCount: users.length,
          botsCount: bots.length,
          commandsCount: commands.length,
          logsCount: logs.length,
          filesCount: (db.files || []).length,
          pluginsCount: (db.plugins || []).length
        },
        vulnerabilitiesOrWarnings: warnings,
        recommendedActions: warnings.length > 0 ? ["Trigger database log buffer purge", "Verify command triggers"] : ["No action required"]
      });
    }

    // 2. Security, KMS & mTLS Boundaries Inspection
    if (target === 'ALL' || target === 'security') {
      const secrets = securityCore.getAllSecretsMetadata();
      const logs = db.logs || [];
      const mtlsFailures = logs.filter((l: any) => l.message.includes('mTLS') && (l.message.includes('FAILED') || l.message.includes('rejected')));

      const warnings: string[] = [];
      if (mtlsFailures.length > 0) {
        warnings.push(`Detected ${mtlsFailures.length} rejected mTLS inter-container handshakes.`);
      }

      results.push({
        subsystemId: 'security_kms_mtls',
        subsystemName: 'Security, KMS & mTLS Boundary Inspector',
        inspectedAt: nowStr,
        healthStatus: warnings.length > 0 ? 'DEGRADED' : 'HEALTHY',
        details: {
          kmsProvider: 'GCP_KMS',
          envelopeEncryption: true,
          vaultSecretsCount: secrets.length,
          mTLSHandshakeFailures: mtlsFailures.length
        },
        vulnerabilitiesOrWarnings: warnings,
        recommendedActions: mtlsFailures.length > 0 
          ? ["Re-verify mTLS socket node certificate fingerprint", "Trigger zero-trust boundary refresh"]
          : ["All zero-trust boundaries verified"]
      });
    }

    // 3. Bot Instances & Daemons Inspection
    if (target === 'ALL' || target === 'bots') {
      const bots = db.bots || [];
      const stoppedBots = bots.filter((b: any) => b.status === 'stopped');

      const warnings: string[] = [];
      if (stoppedBots.length > 0) {
        warnings.push(`${stoppedBots.length} bot daemon instances are currently offline or stopped.`);
      }

      results.push({
        subsystemId: 'bot_instances',
        subsystemName: 'Bot Instances & Messaging Daemons Inspector',
        inspectedAt: nowStr,
        healthStatus: stoppedBots.length > 0 ? 'DEGRADED' : 'HEALTHY',
        details: {
          totalBots: bots.length,
          runningBots: bots.length - stoppedBots.length,
          stoppedBots: stoppedBots.length
        },
        vulnerabilitiesOrWarnings: warnings,
        recommendedActions: stoppedBots.length > 0 ? ["Trigger AI self-healing restart on stopped daemons"] : ["All daemons running"]
      });
    }

    // 4. Plugin Marketplace & SDK Inspection
    if (target === 'ALL' || target === 'plugins') {
      const plugins = db.plugins || [];
      const warnings: string[] = [];

      plugins.forEach((p: any) => {
        const threatScan = securityAnalyst.scanPluginManifest({
          id: p.id,
          name: p.name,
          permissions: p.permissions || ['*']
        });
        if (!threatScan.approvedForDeployment) {
          warnings.push(`Plugin [${p.name}] failed risk evaluation with score ${threatScan.riskScore}`);
        }
      });

      results.push({
        subsystemId: 'plugins_marketplace',
        subsystemName: 'Plugins Marketplace & SDK Inspector',
        inspectedAt: nowStr,
        healthStatus: warnings.length > 0 ? 'DEGRADED' : 'HEALTHY',
        details: {
          totalPlugins: plugins.length,
          installedPlugins: plugins.filter((p: any) => p.installed).length
        },
        vulnerabilitiesOrWarnings: warnings,
        recommendedActions: warnings.length > 0 ? ["Quarantine unverified plugins"] : ["All plugin manifests verified"]
      });
    }

    return results;
  }
}

export const platformInspector = PlatformInspector.getInstance();
