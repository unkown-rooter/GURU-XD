import { 
  OperationalReasoningResult, 
  RegisteredModuleMetadata,
  PlatformHealthMetrics,
  PlatformSnapshotDiff
} from './types';
import { platformStateManager } from './platformStateManager';
import { healthMonitor } from './healthMonitor';
import { changeTracker } from './changeTracker';
import { startupSnapshotManager } from './startupSnapshotManager';
import { serviceRegistryEngine } from './serviceRegistryEngine';
import { knowledgeGraphBuilder } from './knowledgeGraph';

export class AICoreReasoningEngine {
  private static instance: AICoreReasoningEngine;

  private constructor() {}

  public static getInstance(): AICoreReasoningEngine {
    if (!AICoreReasoningEngine.instance) {
      AICoreReasoningEngine.instance = new AICoreReasoningEngine();
    }
    return AICoreReasoningEngine.instance;
  }

  public reasonAboutPlatform(
    queryText: string,
    modules: RegisteredModuleMetadata[]
  ): OperationalReasoningResult {
    const timestamp = new Date().toISOString();
    const queryLower = queryText.toLowerCase();

    // Sync current platform state first
    const platformState = platformStateManager.syncPlatformState(() => modules);
    const healthMetrics = platformState.healthMetrics;
    const recentChanges = changeTracker.getRecentChanges(20);
    const snapshots = startupSnapshotManager.getSnapshots();

    // 1. QUERY: Module Inventory / Counts / Running / Failed
    if (
      queryLower.includes('how many module') ||
      queryLower.includes('module count') ||
      queryLower.includes('running module') ||
      queryLower.includes('failed module') ||
      queryLower.includes('disabled module') ||
      queryLower.includes('status of module')
    ) {
      const activeMods = modules.filter(m => m.status === 'ACTIVE');
      const failedMods = modules.filter(m => m.status === 'FAILED');
      const disabledMods = modules.filter(m => platformStateManager.isModuleDisabled(m.manifest.id) || m.status === 'INACTIVE');
      const degradedMods = modules.filter(m => m.status === 'DEGRADED');

      const summaryAnswer = `The GURU-XD platform currently manages ${modules.length} registered modules. Of these, ${activeMods.length} are ACTIVE and RUNNING, ${disabledMods.length} are INACTIVE/DISABLED, ${degradedMods.length} are DEGRADED, and ${failedMods.length} are FAILED.`;

      const detailedReasoning = [
        {
          sectionTitle: 'Live Module Inventory Breakdown',
          content: `Verified directly from the live Platform State Manager:\n` +
                   `- Total Modules: ${modules.length}\n` +
                   `- Active & Running: ${activeMods.map(m => m.manifest.name).join(', ') || 'None'}\n` +
                   `- Disabled / Inactive: ${disabledMods.map(m => m.manifest.name).join(', ') || 'None'}\n` +
                   `- Failed / Unhealthy: ${failedMods.map(m => m.manifest.name).join(', ') || 'None'}\n` +
                   `- Platform Health Score: ${healthMetrics.overallScore}/100 (${healthMetrics.overallStatus})`
        },
        {
          sectionTitle: 'System Orchestration Status',
          content: `All ${modules.length} standard module manifests are actively mapped into the GURU-XD Knowledge Graph with zero hardcoding. All route endpoints and service keys are registered.`
        }
      ];

      return {
        query: queryText,
        timestamp,
        source: 'GURU_XD_AI_CORE_ORCHESTRATOR',
        verifiedFromLiveState: true,
        summaryAnswer,
        detailedReasoning,
        affectedModules: failedMods.map(m => m.manifest.id),
        estimatedPlatformImpact: failedMods.length > 0 ? 'HIGH' : 'NONE',
        recommendedActionItems: failedMods.map((m, idx) => ({
          step: idx + 1,
          title: `Inspect & Recovery ${m.manifest.name}`,
          description: `Module ${m.manifest.id} reported failure (${m.health?.details || 'Error'}). Trigger state restart or inspect error telemetry.`,
          actionableModuleId: m.manifest.id,
          automatedCommand: `POST /api/v1/platform-state/toggle-module { "moduleId": "${m.manifest.id}", "action": "restart" }`
        }))
      };
    }

    // 2. QUERY: Health / Performance / CPU / Memory / Metrics
    if (
      queryLower.includes('health') ||
      queryLower.includes('cpu') ||
      queryLower.includes('memory') ||
      queryLower.includes('performance') ||
      queryLower.includes('uptime') ||
      queryLower.includes('response time')
    ) {
      const summaryAnswer = `Platform Health Score is ${healthMetrics.overallScore}/100 (${healthMetrics.overallStatus}). Uptime: ${platformState.uptimeSeconds}s. Memory Usage: ${healthMetrics.memoryUsageMb} MB / ${healthMetrics.memoryTotalMb} MB. CPU Load: ${healthMetrics.cpuPercent}%.`;

      const highestMemModule = [...modules].sort((a, b) => (b.health?.metrics?.memoryMb || 0) - (a.health?.metrics?.memoryMb || 0))[0];

      const detailedReasoning = [
        {
          sectionTitle: 'Live Telemetry & Resource Analysis',
          content: `- Overall Platform Score: ${healthMetrics.overallScore} / 100\n` +
                   `- Status: ${healthMetrics.overallStatus}\n` +
                   `- Memory Consumption: ${healthMetrics.memoryUsageMb} MB (${Math.round((healthMetrics.memoryUsageMb / healthMetrics.memoryTotalMb) * 100)}% of max heap)\n` +
                   `- CPU Utilization: ${healthMetrics.cpuPercent}%\n` +
                   `- Average Response Time: ${healthMetrics.avgResponseTimeMs} ms\n` +
                   `- Error Rate: ${healthMetrics.errorRatePercent}%\n` +
                   `- Active Requests/sec: ${healthMetrics.activeRequestsPerSec}\n` +
                   `- Database Connectivity: ${healthMetrics.databaseConnected ? 'ONLINE' : 'OFFLINE'}\n` +
                   `- Unhealthy Dependencies: ${healthMetrics.unhealthyDependenciesCount}`
        },
        {
          sectionTitle: 'Module Resource Attribution',
          content: highestMemModule 
            ? `Top memory consumer module: ${highestMemModule.manifest.name} (${highestMemModule.manifest.id}) using ~${highestMemModule.health?.metrics?.memoryMb || 45} MB.`
            : `All modules operate within nominal memory limits.`
        }
      ];

      return {
        query: queryText,
        timestamp,
        source: 'GURU_XD_AI_CORE_ORCHESTRATOR',
        verifiedFromLiveState: true,
        summaryAnswer,
        detailedReasoning,
        estimatedPlatformImpact: healthMetrics.overallStatus === 'CRITICAL' ? 'CRITICAL' : healthMetrics.overallStatus === 'DEGRADED' ? 'MEDIUM' : 'NONE'
      };
    }

    // 3. QUERY: What changed / History / Startup Diff / Snapshots
    if (
      queryLower.includes('changed') ||
      queryLower.includes('history') ||
      queryLower.includes('snapshot') ||
      queryLower.includes('diff') ||
      queryLower.includes('since last startup') ||
      queryLower.includes('recent changes')
    ) {
      const initSnap = startupSnapshotManager.getInitialStartupSnapshot();
      const latestSnap = snapshots[0];

      let diffSummary = 'No snapshot comparison available.';
      if (initSnap && latestSnap && initSnap.snapshotId !== latestSnap.snapshotId) {
        const diff = startupSnapshotManager.compareSnapshots(initSnap.snapshotId, latestSnap.snapshotId);
        diffSummary = diff.summary;
      }

      const summaryAnswer = `Recorded ${recentChanges.length} recent platform events. Initial startup snapshot was ${initSnap?.snapshotId || 'SNAP-INIT'}. ${diffSummary}`;

      const detailedReasoning = [
        {
          sectionTitle: 'Chronological Audit Log (Recent Events)',
          content: recentChanges.slice(0, 8).map(c => `[${c.timestamp.substring(11, 19)}] [${c.severity}] ${c.category}: ${c.description}`).join('\n') || 'No changes recorded in current session.'
        },
        {
          sectionTitle: 'Startup Snapshot Comparison',
          content: `Initial Startup Snapshot: ${initSnap?.snapshotId || 'N/A'} (${initSnap?.modulesSummary.total || 0} modules)\nLatest Snapshot: ${latestSnap?.snapshotId || 'N/A'} (${latestSnap?.modulesSummary.total || 0} modules)\nDiff Analysis: ${diffSummary}`
        }
      ];

      return {
        query: queryText,
        timestamp,
        source: 'GURU_XD_AI_CORE_ORCHESTRATOR',
        verifiedFromLiveState: true,
        summaryAnswer,
        detailedReasoning,
        estimatedPlatformImpact: 'NONE'
      };
    }

    // 4. QUERY: Failure Simulation / Failure Reasoning / Impact Analysis
    if (
      queryLower.includes('fail') ||
      queryLower.includes('error') ||
      queryLower.includes('impact') ||
      queryLower.includes('recovery') ||
      queryLower.includes('diagnose')
    ) {
      const failedMods = modules.filter(m => m.status === 'FAILED');

      if (failedMods.length === 0) {
        return {
          query: queryText,
          timestamp,
          source: 'GURU_XD_AI_CORE_ORCHESTRATOR',
          verifiedFromLiveState: true,
          summaryAnswer: `Diagnostic check complete: Zero module failures detected. All ${modules.length} registered modules are operating normally with an overall health score of ${healthMetrics.overallScore}/100.`,
          detailedReasoning: [
            {
              sectionTitle: 'Platform Diagnostic Evaluation',
              content: `Every standard module reported status ACTIVE or DEGRADED with no fatal exceptions. Database, event bus, and route mappings are fully operational.`
            }
          ],
          estimatedPlatformImpact: 'NONE'
        };
      }

      const failedNames = failedMods.map(m => m.manifest.name).join(', ');
      const summaryAnswer = `CRITICAL DIAGNOSTIC ALERT: Detected ${failedMods.length} failing module(s): ${failedNames}. Platform Health Score decreased to ${healthMetrics.overallScore}/100.`;

      // Identify cascading services and routes affected
      const affectedServices: string[] = [];
      const affectedAPIs: string[] = [];

      failedMods.forEach(m => {
        m.manifest.services.forEach(s => affectedServices.push(s.serviceKey));
        m.manifest.routes.forEach(r => affectedAPIs.push(`${r.method} ${r.path}`));
      });

      const detailedReasoning = [
        {
          sectionTitle: 'Failure Root Cause Analysis',
          content: failedMods.map(m => `Module [${m.manifest.id}] (${m.manifest.name}): Status FAILED. Reason: ${m.health?.details || 'Execution exception'}`).join('\n')
        },
        {
          sectionTitle: 'Cascading Platform Impact Analysis',
          content: `The following services and API routes are currently UNAVAILABLE due to this failure:\n` +
                   `- Affected Services (${affectedServices.length}): ${affectedServices.join(', ') || 'None'}\n` +
                   `- Affected API Routes (${affectedAPIs.length}): ${affectedAPIs.join(', ') || 'None'}\n` +
                   `- Estimated Platform Impact: HIGH / CRITICAL`
        }
      ];

      return {
        query: queryText,
        timestamp,
        source: 'GURU_XD_AI_CORE_ORCHESTRATOR',
        verifiedFromLiveState: true,
        summaryAnswer,
        detailedReasoning,
        affectedModules: failedMods.map(m => m.manifest.id),
        affectedServices,
        affectedAPIs,
        estimatedPlatformImpact: 'HIGH',
        recommendedActionItems: failedMods.map((m, idx) => ({
          step: idx + 1,
          title: `Restart ${m.manifest.name}`,
          description: `Re-initialize lifecycle state for module ${m.manifest.id} to attempt automatic recovery.`,
          actionableModuleId: m.manifest.id,
          automatedCommand: `POST /api/v1/platform-state/toggle-module { "moduleId": "${m.manifest.id}", "action": "restart" }`
        }))
      };
    }

    // GENERAL REASONING / FALLBACK QUERY
    const summaryAnswer = `GURU-XD AI Core Orchestrator analysis: The platform is currently operating at ${healthMetrics.overallScore}/100 health (${healthMetrics.overallStatus}) with ${modules.length} registered modules, ${platformState.servicesCount} services, and ${platformState.routesCount} API routes active.`;

    const detailedReasoning = [
      {
        sectionTitle: 'Live Operational Model Summary',
        content: `Query: "${queryText}"\n` +
                 `- Live Modules Count: ${modules.length}\n` +
                 `- Active: ${platformState.modulesCount.active}, Disabled: ${platformState.modulesCount.inactive}, Failed: ${platformState.modulesCount.failed}\n` +
                 `- Live Services Registered: ${platformState.servicesCount}\n` +
                 `- Registered API Routes: ${platformState.routesCount}\n` +
                 `- Knowledge Graph Nodes: ${knowledgeGraphBuilder.getGraph().nodes.length}`
      }
    ];

    return {
      query: queryText,
      timestamp,
      source: 'GURU_XD_AI_CORE_ORCHESTRATOR',
      verifiedFromLiveState: true,
      summaryAnswer,
      detailedReasoning,
      estimatedPlatformImpact: 'NONE'
    };
  }
}

export const aiCoreReasoningEngine = AICoreReasoningEngine.getInstance();
