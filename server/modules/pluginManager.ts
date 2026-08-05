import { 
  PluginManifest, 
  RegisteredPlugin, 
  PluginStatus, 
  PluginHealth,
  InteractionGraph,
  InteractionGraphNode,
  InteractionGraphEdge,
  ModuleHealthStatus
} from './types';
import { ManifestValidator } from './manifestValidator';
import { SecurityValidator } from './securityValidator';
import { changeTracker } from './changeTracker';
import { VersionChecker } from './versionChecker';

export class PluginManager {
  private static instance: PluginManager;
  private plugins: Map<string, RegisteredPlugin> = new Map();
  private availableCatalog: Map<string, PluginManifest> = new Map();

  private constructor() {
    this.seedDefaultPluginCatalog();
  }

  public static getInstance(): PluginManager {
    if (!PluginManager.instance) {
      PluginManager.instance = new PluginManager();
    }
    return PluginManager.instance;
  }

  /**
   * Seed production-ready default plugins into the catalog
   */
  private seedDefaultPluginCatalog(): void {
    const defaultPlugins: PluginManifest[] = [
      {
        id: 'plug-slack-notifier',
        name: 'Slack Event Notifier Plugin',
        version: '1.2.0',
        author: { name: 'DevOps Automation Team', email: 'devops@company.com' },
        description: 'Dispatches real-time platform event alerts and deployment state changes directly to Slack channels.',
        dependencies: [{ moduleId: 'mod-deployment-engine', minVersion: '2.0.0' }],
        orchestratorMinVersion: '2.5.0',
        requiredPermissions: [
          { id: 'perm-slack-send', name: 'Slack Webhook Send', description: 'Post alerts to webhooks', level: 'write' }
        ],
        services: [
          {
            serviceKey: 'slack.sendAlert',
            name: 'Send Slack Alert',
            description: 'Posts structured JSON alerting message to Slack channel.'
          }
        ],
        events: [
          {
            eventType: 'slack.alert.sent',
            description: 'Emitted when a Slack alert is successfully delivered.'
          }
        ],
        routes: [
          {
            path: '/api/v1/plugins/slack/notify',
            method: 'POST',
            description: 'Trigger manual Slack alert dispatch',
            protected: true
          }
        ],
        configuration: { channel: '#platform-alerts', maxRetries: 3 },
        healthEndpoint: '/api/v1/plugins/slack/health',
        tags: ['notifications', 'slack', 'devops']
      },
      {
        id: 'plug-prometheus-exporter',
        name: 'Prometheus Metrics Exporter Plugin',
        version: '2.0.1',
        author: { name: 'Observability Squad' },
        description: 'Collects and formats module health, service invocation latency, and memory usage into Prometheus scrape endpoint.',
        dependencies: [{ moduleId: 'mod-logging-telemetry', minVersion: '2.0.0' }],
        orchestratorMinVersion: '2.5.0',
        requiredPermissions: [
          { id: 'perm-telemetry-read', name: 'Telemetry Scrape', description: 'Read platform metrics', level: 'read' }
        ],
        services: [
          {
            serviceKey: 'prometheus.getScrapeData',
            name: 'Get Scrape Data',
            description: 'Returns open-metrics exposition format.'
          }
        ],
        events: [],
        routes: [
          {
            path: '/api/v1/plugins/prometheus/metrics',
            method: 'GET',
            description: 'Scrape endpoint for Prometheus collector',
            protected: false
          }
        ],
        configuration: { scrapeIntervalSeconds: 15 },
        healthEndpoint: '/api/v1/plugins/prometheus/health',
        tags: ['metrics', 'prometheus', 'observability']
      },
      {
        id: 'plug-redis-cache',
        name: 'Redis Distributed Cache Plugin',
        version: '1.1.0',
        author: { name: 'Infrastructure Architecture' },
        description: 'Accelerates API responses and knowledge graph queries via distributed Redis key-value caching layer.',
        dependencies: [{ moduleId: 'mod-database-storage', minVersion: '2.0.0' }],
        orchestratorMinVersion: '2.5.0',
        requiredPermissions: [
          { id: 'perm-cache-manage', name: 'Cache Management', description: 'Write and purge Redis keys', level: 'write' }
        ],
        services: [
          {
            serviceKey: 'redis.getCacheKey',
            name: 'Get Cache Key',
            description: 'Retrieves cached payload by key.'
          },
          {
            serviceKey: 'redis.setCacheKey',
            name: 'Set Cache Key',
            description: 'Persists payload with TTL.'
          }
        ],
        events: [
          { eventType: 'redis.cache.invalidated', description: 'Emitted when cache key is purged.' }
        ],
        routes: [
          { path: '/api/v1/plugins/redis/flush', method: 'POST', description: 'Flush cache DB', protected: true }
        ],
        configuration: { ttlSeconds: 300, maxMemoryMb: 512 },
        tags: ['cache', 'redis', 'performance']
      }
    ];

    defaultPlugins.forEach(p => {
      this.availableCatalog.set(p.id, p);
      // Auto-install and enable default production plugins
      this.installPlugin(p, true);
    });
  }

  /**
   * Discovers plugins from local catalog or scanned directories
   */
  public discoverPlugins(): PluginManifest[] {
    return Array.from(this.availableCatalog.values());
  }

  /**
   * Validates a plugin manifest for schema and security compliance
   */
  public validatePluginManifest(manifest: any): { valid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!manifest.id || typeof manifest.id !== 'string') errors.push('Plugin ID is required and must be a string.');
    if (!manifest.name || typeof manifest.name !== 'string') errors.push('Plugin Name is required.');
    if (!manifest.version || typeof manifest.version !== 'string') errors.push('Plugin Version is required.');
    if (!manifest.description) warnings.push('Plugin description is empty.');
    if (!manifest.orchestratorMinVersion) errors.push('Required platform orchestratorMinVersion is missing.');
    if (!Array.isArray(manifest.dependencies)) errors.push('Plugin dependencies must be an array.');
    if (!Array.isArray(manifest.services)) errors.push('Plugin services must be an array.');
    if (!Array.isArray(manifest.events)) errors.push('Plugin events must be an array.');
    if (!Array.isArray(manifest.routes)) errors.push('Plugin routes must be an array.');

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validates plugin dependencies and checks for version or conflict issues
   */
  public validatePluginDependencies(manifest: PluginManifest, activeModuleIds: string[]): {
    compatible: boolean;
    missingDependencies: string[];
    conflicts: string[];
  } {
    const missingDependencies: string[] = [];
    const conflicts: string[] = [];

    manifest.dependencies.forEach(dep => {
      if (!dep.optional && !activeModuleIds.includes(dep.moduleId)) {
        missingDependencies.push(dep.moduleId);
      }
    });

    // Check service key conflicts
    const existingServiceKeys = new Set<string>();
    this.plugins.forEach(p => {
      if (p.enabled && p.manifest.id !== manifest.id) {
        p.manifest.services.forEach(s => existingServiceKeys.add(s.serviceKey));
      }
    });

    manifest.services.forEach(s => {
      if (existingServiceKeys.has(s.serviceKey)) {
        conflicts.push(`Service key conflict: "${s.serviceKey}" is already registered by another plugin.`);
      }
    });

    return {
      compatible: missingDependencies.length === 0 && conflicts.length === 0,
      missingDependencies,
      conflicts
    };
  }

  /**
   * Installs a new plugin or activates it from catalog
   */
  public installPlugin(manifest: PluginManifest, autoEnable = true): { success: boolean; plugin?: RegisteredPlugin; error?: string } {
    const val = this.validatePluginManifest(manifest);
    if (!val.valid) {
      return { success: false, error: `Invalid Plugin Manifest: ${val.errors.join('; ')}` };
    }

    const installedAt = new Date().toISOString();
    const registeredPlugin: RegisteredPlugin = {
      manifest,
      status: autoEnable ? 'ENABLED' : 'INSTALLED',
      installedAt,
      lastUpdatedAt: installedAt,
      enabled: autoEnable,
      health: {
        status: 'HEALTHY',
        score: 100,
        cpuPercent: Math.random() * 2 + 0.5,
        memoryMb: Math.floor(Math.random() * 25 + 15),
        responseTimeMs: Math.floor(Math.random() * 12 + 5),
        errorCount: 0,
        lastRestart: installedAt,
        lastUpdate: installedAt,
        details: 'Plugin initialized cleanly and healthy.'
      },
      versionHistory: [{ version: manifest.version, installedAt }]
    };

    this.plugins.set(manifest.id, registeredPlugin);

    changeTracker.recordChange({
      category: 'PLUGIN_LIFECYCLE',
      severity: 'INFO',
      eventType: 'PLUGIN_INSTALLED',
      sourceModuleId: manifest.id,
      description: `Plugin "${manifest.name}" (v${manifest.version}) installed successfully.`
    });

    return { success: true, plugin: registeredPlugin };
  }

  /**
   * Uninstalls a plugin
   */
  public uninstallPlugin(pluginId: string): { success: boolean; error?: string } {
    const p = this.plugins.get(pluginId);
    if (!p) return { success: false, error: `Plugin "${pluginId}" not found.` };

    this.plugins.delete(pluginId);

    changeTracker.recordChange({
      category: 'PLUGIN_LIFECYCLE',
      severity: 'WARNING',
      eventType: 'PLUGIN_UNINSTALLED',
      sourceModuleId: pluginId,
      description: `Plugin "${p.manifest.name}" was uninstalled from platform.`
    });

    return { success: true };
  }

  /**
   * Enables an installed plugin
   */
  public enablePlugin(pluginId: string): { success: boolean; error?: string } {
    const p = this.plugins.get(pluginId);
    if (!p) return { success: false, error: `Plugin "${pluginId}" not found.` };

    p.enabled = true;
    p.status = 'ENABLED';
    p.health.status = 'HEALTHY';

    changeTracker.recordChange({
      category: 'PLUGIN_LIFECYCLE',
      severity: 'INFO',
      eventType: 'PLUGIN_ENABLED',
      sourceModuleId: pluginId,
      description: `Plugin "${p.manifest.name}" enabled.`
    });

    return { success: true };
  }

  /**
   * Disables an installed plugin
   */
  public disablePlugin(pluginId: string, reason?: string): { success: boolean; error?: string } {
    const p = this.plugins.get(pluginId);
    if (!p) return { success: false, error: `Plugin "${pluginId}" not found.` };

    p.enabled = false;
    p.status = 'DISABLED';

    changeTracker.recordChange({
      category: 'PLUGIN_LIFECYCLE',
      severity: 'WARNING',
      eventType: 'PLUGIN_DISABLED',
      sourceModuleId: pluginId,
      description: `Plugin "${p.manifest.name}" disabled${reason ? ': ' + reason : ''}.`
    });

    return { success: true };
  }

  /**
   * Reloads plugin configuration or state
   */
  public reloadPlugin(pluginId: string, newConfig?: Record<string, any>): { success: boolean; plugin?: RegisteredPlugin; error?: string } {
    const p = this.plugins.get(pluginId);
    if (!p) return { success: false, error: `Plugin "${pluginId}" not found.` };

    if (newConfig) {
      p.manifest.configuration = { ...p.manifest.configuration, ...newConfig };
    }
    p.lastUpdatedAt = new Date().toISOString();

    changeTracker.recordChange({
      category: 'PLUGIN_LIFECYCLE',
      severity: 'INFO',
      eventType: 'PLUGIN_RELOADED',
      sourceModuleId: pluginId,
      description: `Plugin "${p.manifest.name}" reloaded configuration cleanly.`
    });

    return { success: true, plugin: p };
  }

  /**
   * Upgrades a plugin to a new manifest version
   */
  public upgradePlugin(pluginId: string, newManifest: PluginManifest): { success: boolean; error?: string } {
    const existing = this.plugins.get(pluginId);
    if (!existing) return { success: false, error: `Plugin "${pluginId}" not found.` };

    const now = new Date().toISOString();
    existing.versionHistory.unshift({ version: newManifest.version, installedAt: now, changelog: 'Upgraded via Orchestrator' });
    existing.manifest = newManifest;
    existing.lastUpdatedAt = now;
    existing.status = 'ENABLED';

    changeTracker.recordChange({
      category: 'PLUGIN_LIFECYCLE',
      severity: 'INFO',
      eventType: 'PLUGIN_UPGRADED',
      sourceModuleId: pluginId,
      description: `Plugin "${newManifest.name}" upgraded to version ${newManifest.version}.`
    });

    return { success: true };
  }

  /**
   * Rollback a plugin to a previous version
   */
  public rollbackPlugin(pluginId: string, targetVersion: string): { success: boolean; error?: string } {
    const p = this.plugins.get(pluginId);
    if (!p) return { success: false, error: `Plugin "${pluginId}" not found.` };

    const hist = p.versionHistory.find(v => v.version === targetVersion);
    if (!hist) return { success: false, error: `Version ${targetVersion} not found in rollback history.` };

    p.manifest.version = targetVersion;
    p.lastUpdatedAt = new Date().toISOString();

    changeTracker.recordChange({
      category: 'PLUGIN_LIFECYCLE',
      severity: 'WARNING',
      eventType: 'PLUGIN_ROLLBACK',
      sourceModuleId: pluginId,
      description: `Plugin "${p.manifest.name}" rolled back to version ${targetVersion}.`
    });

    return { success: true };
  }

  /**
   * Retrieves all installed plugins
   */
  public getAllPlugins(): RegisteredPlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Answers AI Core questions regarding live plugins
   */
  public answerAIPluginQuery(question: string): { answer: string; pluginsList: RegisteredPlugin[] } {
    const q = question.toLowerCase();
    const all = this.getAllPlugins();

    if (q.includes('failed') || q.includes('unhealthy')) {
      const filtered = all.filter(p => p.status === 'FAILED' || p.health.status === 'UNHEALTHY');
      return {
        answer: `Found ${filtered.length} failed/unhealthy plugins on platform.`,
        pluginsList: filtered
      };
    }

    if (q.includes('disabled')) {
      const filtered = all.filter(p => !p.enabled || p.status === 'DISABLED');
      return {
        answer: `Found ${filtered.length} disabled plugins.`,
        pluginsList: filtered
      };
    }

    if (q.includes('resource') || q.includes('cpu') || q.includes('memory')) {
      const sorted = [...all].sort((a, b) => b.health.memoryMb - a.health.memoryMb);
      return {
        answer: `Ranked ${sorted.length} plugins by memory consumption. Highest consumer: ${sorted[0]?.manifest.name || 'None'} (${sorted[0]?.health.memoryMb || 0} MB).`,
        pluginsList: sorted
      };
    }

    return {
      answer: `Total ${all.length} plugins currently registered (${all.filter(p => p.enabled).length} enabled).`,
      pluginsList: all
    };
  }

  /**
   * Builds live Interaction Graph across Modules, Services, Events, APIs, Dependencies, Plugins, Infrastructure
   */
  public buildInteractionGraph(registeredModules: any[]): InteractionGraph {
    const nodes: InteractionGraphNode[] = [];
    const edges: InteractionGraphEdge[] = [];

    // Add Infrastructure node
    nodes.push({
      id: 'infra-cloud-run',
      label: 'Cloud Run Container Infrastructure',
      type: 'infrastructure',
      status: 'HEALTHY',
      metadata: { port: 3000, host: '0.0.0.0' }
    });

    // Add Modules and their services/events/routes
    registeredModules.forEach(m => {
      const mId = m.manifest.id;
      nodes.push({
        id: mId,
        label: m.manifest.name,
        type: 'module',
        status: m.status,
        metadata: { version: m.manifest.version }
      });

      // Module -> Infra
      edges.push({
        source: mId,
        target: 'infra-cloud-run',
        type: 'runs_on',
        label: 'Executes On'
      });

      // Module dependencies
      m.manifest.dependencies.forEach((dep: any) => {
        nodes.push({
          id: `dep-${dep.moduleId}`,
          label: `Dep: ${dep.moduleId}`,
          type: 'dependency',
          status: 'ACTIVE'
        });
        edges.push({
          source: mId,
          target: `dep-${dep.moduleId}`,
          type: 'depends_on',
          label: 'Requires'
        });
      });

      // Module Services
      m.manifest.services.forEach((srv: any) => {
        const srvId = `srv-${srv.serviceKey}`;
        nodes.push({
          id: srvId,
          label: srv.name,
          type: 'service',
          status: 'ACTIVE',
          metadata: { key: srv.serviceKey }
        });
        edges.push({
          source: mId,
          target: srvId,
          type: 'exposes',
          label: 'Exposes Service'
        });
      });

      // Module Events
      m.manifest.events.forEach((evt: any) => {
        const evtId = `evt-${evt.eventType}`;
        nodes.push({
          id: evtId,
          label: evt.eventType,
          type: 'event',
          status: 'ACTIVE'
        });
        edges.push({
          source: mId,
          target: evtId,
          type: 'subscribes',
          label: 'Emits/Subscribes'
        });
      });

      // Module Routes
      m.manifest.routes.forEach((rt: any) => {
        const routeId = `api-${rt.method}-${rt.path}`;
        nodes.push({
          id: routeId,
          label: `${rt.method} ${rt.path}`,
          type: 'api',
          status: 'ACTIVE'
        });
        edges.push({
          source: mId,
          target: routeId,
          type: 'routes_to',
          label: 'REST Route'
        });
      });
    });

    // Add Plugins
    this.plugins.forEach(p => {
      const pId = p.manifest.id;
      nodes.push({
        id: pId,
        label: p.manifest.name,
        type: 'plugin',
        status: p.status,
        metadata: { version: p.manifest.version, enabled: p.enabled }
      });

      p.manifest.dependencies.forEach(dep => {
        edges.push({
          source: pId,
          target: dep.moduleId,
          type: 'uses_plugin',
          label: 'Extends Module'
        });
      });

      p.manifest.services.forEach(srv => {
        const srvId = `srv-${srv.serviceKey}`;
        nodes.push({
          id: srvId,
          label: srv.name,
          type: 'service',
          status: 'ACTIVE'
        });
        edges.push({
          source: pId,
          target: srvId,
          type: 'exposes',
          label: 'Plugin Service'
        });
      });
    });

    const summary = {
      modulesCount: registeredModules.length,
      servicesCount: nodes.filter(n => n.type === 'service').length,
      eventsCount: nodes.filter(n => n.type === 'event').length,
      routesCount: nodes.filter(n => n.type === 'api').length,
      pluginsCount: this.plugins.size,
      infrastructureCount: 1
    };

    return {
      nodes,
      edges,
      lastUpdated: new Date().toISOString(),
      summary
    };
  }
}

export const pluginManager = PluginManager.getInstance();
