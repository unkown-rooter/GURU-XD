import crypto from 'crypto';

// ----------------------------------------------------
// TELEMETRY & EVENT STANDARDS
// ----------------------------------------------------

export type ServiceStatus = 'ACTIVE' | 'DEGRADED' | 'MAINTENANCE' | 'OFFLINE';

export type ServiceLifecycleState = 'UNINITIALIZED' | 'INITIALIZING' | 'READY' | 'SHUTTING_DOWN' | 'SHUTDOWN';

export type TelemetryCategory =
  | 'Performance'
  | 'Security'
  | 'Behavior'
  | 'Health'
  | 'Errors'
  | 'Warnings'
  | 'Metrics'
  | 'Resource Usage'
  | 'Configuration Changes'
  | 'Plugin Activity'
  | 'User Activity'
  | 'Instance Activity';

export type ServiceCapability =
  | 'Deployment'
  | 'Security'
  | 'Monitoring'
  | 'Messaging'
  | 'Plugins'
  | 'Analytics'
  | 'AI'
  | 'Reporting'
  | 'Prediction'
  | 'Backup'
  | 'Recovery'
  | 'Testing'
  | 'Configuration'
  | 'Behavior'
  | 'Metrics'
  | 'Health'
  | 'Performance';

export interface ServiceMetadata {
  serviceId: string;
  serviceName: string;
  version: string;
  description: string;
  status: ServiceStatus;
  lifecycleState?: ServiceLifecycleState;
  health: number; // 0 - 100
  supportedEvents: string[];
  telemetryTypes: TelemetryCategory[];
  dependencies: string[];
  capabilities: ServiceCapability[];
  registeredAt: string;
  lastVersionUpdateAt?: string;
  previousVersion?: string;
}

export interface StandardTelemetry {
  telemetryId: string;
  serviceId: string;
  serviceName: string;
  timestamp: string;
  category: TelemetryCategory;
  instanceId?: string;
  metrics?: Record<string, number>;
  payload: any;
  version: string;
}

export interface StandardEvent {
  eventId: string;
  serviceId: string;
  serviceName: string;
  eventType: string;
  timestamp: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL' | 'RESOLVED';
  data: any;
}

export interface ServiceVersionHistory {
  serviceId: string;
  serviceName: string;
  oldVersion: string;
  newVersion: string;
  updatedAt: string;
  correlatedIncidentsCount: number;
}

// Version 2 Extension Interfaces
export interface AIProviderRegistration {
  providerId: string;
  name: string;
  type: 'gemini' | 'openai' | 'anthropic' | 'local_llm' | 'custom';
  status: 'active' | 'inactive' | 'rate_limited';
  supportedModels: string[];
  capabilities: string[];
  latencyMs?: number;
}

export interface DynamicPluginRegistration {
  pluginId: string;
  name: string;
  version: string;
  author: string;
  enabled: boolean;
  capabilities: string[];
  entryPoint?: string;
}

export type HealthCheckFn = () => Promise<{ healthy: boolean; score: number; details?: string }>;

// Global SSE Event Listener definition
type ServiceRegistryListener = (event: { type: string; payload: any }) => void;
const registryListeners: Set<ServiceRegistryListener> = new Set();

export function subscribeRegistryEvents(listener: ServiceRegistryListener) {
  registryListeners.add(listener);
  return () => {
    registryListeners.delete(listener);
  };
}

export function emitRegistryEvent(type: string, payload: any) {
  registryListeners.forEach((listener) => {
    try {
      listener({ type, payload });
    } catch (err) {
      console.error('Error emitting service registry event:', err);
    }
  });
}

// ----------------------------------------------------
// CENTRAL SERVICE REGISTRY
// ----------------------------------------------------

export class ServiceRegistry {
  private static instance: ServiceRegistry;
  private services: Map<string, ServiceMetadata> = new Map();
  private versionHistories: ServiceVersionHistory[] = [];
  private telemetryBuffer: StandardTelemetry[] = [];
  private eventBuffer: StandardEvent[] = [];

  // Version 2 Extended Platform Collections
  private aiProviders: Map<string, AIProviderRegistration> = new Map();
  private dynamicPlugins: Map<string, DynamicPluginRegistration> = new Map();
  private healthCheckers: Map<string, HealthCheckFn> = new Map();

  private constructor() {
    this.seedDefaultServices();
    this.seedDefaultAIProviders();
  }

  public static getInstance(): ServiceRegistry {
    if (!ServiceRegistry.instance) {
      ServiceRegistry.instance = new ServiceRegistry();
    }
    return ServiceRegistry.instance;
  }

  // Pre-seed core system services as mandated by the evolution blueprint
  private seedDefaultServices() {
    const defaultServices: ServiceMetadata[] = [
      {
        serviceId: 'srv-deployment-engine',
        serviceName: 'Deployment Engine',
        version: 'v2.1.0',
        description: 'Automated multi-cloud container orchestration and deployment pipeline.',
        status: 'ACTIVE',
        lifecycleState: 'READY',
        health: 98,
        supportedEvents: ['deployment.started', 'deployment.completed', 'deployment.failed'],
        telemetryTypes: ['Performance', 'Metrics', 'Instance Activity'],
        dependencies: ['srv-instance-manager', 'srv-monitoring-engine'],
        capabilities: ['Deployment', 'Monitoring', 'Recovery'],
        registeredAt: new Date().toISOString()
      },
      {
        serviceId: 'srv-behavior-engine',
        serviceName: 'Behavior Learning Engine',
        version: 'v2.4.0',
        description: 'AI-driven category baseline learning, behavior drift detection, and trust badge calculation.',
        status: 'ACTIVE',
        lifecycleState: 'READY',
        health: 96,
        supportedEvents: ['behavior.drift.detected', 'behavior.profile.updated', 'trust.badge.changed'],
        telemetryTypes: ['Behavior', 'Metrics', 'Security'],
        dependencies: ['srv-telemetry-service'],
        capabilities: ['Behavior', 'AI', 'Analytics', 'Prediction'],
        registeredAt: new Date().toISOString(),
        previousVersion: 'v2.3.0',
        lastVersionUpdateAt: new Date(Date.now() - 3600000 * 24 * 2).toISOString()
      },
      {
        serviceId: 'srv-ai-security-analyst',
        serviceName: 'AI Security Analyst',
        version: 'v1.2.0',
        description: 'Intelligent analysis layer producing cause-and-effect evidence chains, confidence scores, and safe admin recommendations.',
        status: 'ACTIVE',
        lifecycleState: 'READY',
        health: 99,
        supportedEvents: ['security.analysis.started', 'security.analysis.completed', 'security.analysis.critical'],
        telemetryTypes: ['Security', 'Errors', 'Warnings', 'Behavior'],
        dependencies: ['srv-behavior-engine', 'srv-telemetry-service'],
        capabilities: ['Security', 'AI', 'Reporting', 'Prediction'],
        registeredAt: new Date().toISOString()
      },
      {
        serviceId: 'srv-deployment-sandbox',
        serviceName: 'Deployment Sandbox',
        version: 'v1.8.0',
        description: 'Isolated testing environment for validating bot plugins and binary updates before production rollout.',
        status: 'ACTIVE',
        lifecycleState: 'READY',
        health: 95,
        supportedEvents: ['sandbox.execution.started', 'sandbox.validation.passed', 'sandbox.threat.blocked'],
        telemetryTypes: ['Security', 'Plugin Activity', 'Errors'],
        dependencies: ['srv-plugin-manager'],
        capabilities: ['Deployment', 'Security', 'Testing'],
        registeredAt: new Date().toISOString()
      },
      {
        serviceId: 'srv-monitoring-engine',
        serviceName: 'Monitoring Engine',
        version: 'v3.0.1',
        description: 'High-frequency telemetry scraper for CPU, Memory, Disk Write, and Network Sockets.',
        status: 'ACTIVE',
        lifecycleState: 'READY',
        health: 100,
        supportedEvents: ['metrics.scraped', 'threshold.exceeded', 'node.heartbeat'],
        telemetryTypes: ['Performance', 'Metrics', 'Resource Usage'],
        dependencies: [],
        capabilities: ['Monitoring', 'Metrics'],
        registeredAt: new Date().toISOString()
      },
      {
        serviceId: 'srv-plugin-manager',
        serviceName: 'Plugin Manager',
        version: 'v1.5.2',
        description: 'Dynamic JavaScript plugin injection, sandbox isolation, and marketplace module loader.',
        status: 'ACTIVE',
        lifecycleState: 'READY',
        health: 94,
        supportedEvents: ['plugin.installed', 'plugin.uninstalled', 'plugin.execution.error'],
        telemetryTypes: ['Plugin Activity', 'Configuration Changes', 'Errors'],
        dependencies: ['srv-deployment-sandbox'],
        capabilities: ['Plugins', 'Configuration'],
        registeredAt: new Date().toISOString()
      },
      {
        serviceId: 'srv-health-engine',
        serviceName: 'Health Engine',
        version: 'v2.0.0',
        description: 'System-wide health score calculation and automated self-healing supervisor.',
        status: 'ACTIVE',
        lifecycleState: 'READY',
        health: 97,
        supportedEvents: ['health.evaluated', 'self_healing.triggered'],
        telemetryTypes: ['Health', 'Metrics', 'Errors'],
        dependencies: ['srv-monitoring-engine'],
        capabilities: ['Health', 'Recovery'],
        registeredAt: new Date().toISOString()
      },
      {
        serviceId: 'srv-performance-engine',
        serviceName: 'Performance Engine',
        version: 'v1.9.0',
        description: 'Latency optimization, thread concurrency capping, and queue throughput balancer.',
        status: 'ACTIVE',
        lifecycleState: 'READY',
        health: 98,
        supportedEvents: ['performance.optimized', 'latency.alert'],
        telemetryTypes: ['Performance', 'Resource Usage'],
        dependencies: ['srv-monitoring-engine'],
        capabilities: ['Performance', 'Metrics'],
        registeredAt: new Date().toISOString()
      },
      {
        serviceId: 'srv-telemetry-service',
        serviceName: 'Telemetry Service',
        version: 'v2.2.0',
        description: 'Unified time-series data ingestor and standardized telemetry protocol router.',
        status: 'ACTIVE',
        lifecycleState: 'READY',
        health: 100,
        supportedEvents: ['telemetry.ingested', 'telemetry.flushed'],
        telemetryTypes: ['Performance', 'Security', 'Behavior', 'Health', 'Resource Usage'],
        dependencies: [],
        capabilities: ['Reporting', 'Analytics'],
        registeredAt: new Date().toISOString()
      },
      {
        serviceId: 'srv-audit-service',
        serviceName: 'Audit Service',
        version: 'v1.1.0',
        description: 'Immutable compliance logging for administrator actions, key rotations, and access grants.',
        status: 'ACTIVE',
        lifecycleState: 'READY',
        health: 100,
        supportedEvents: ['audit.logged', 'compliance.verified'],
        telemetryTypes: ['User Activity', 'Configuration Changes'],
        dependencies: [],
        capabilities: ['Security', 'Reporting'],
        registeredAt: new Date().toISOString()
      },
      {
        serviceId: 'srv-notification-service',
        serviceName: 'Notification Service',
        version: 'v1.0.0',
        description: 'Multi-channel alert dispatcher for Webhooks, Telegram, WhatsApp, and SSE streams.',
        status: 'ACTIVE',
        lifecycleState: 'READY',
        health: 99,
        supportedEvents: ['notification.sent', 'notification.failed'],
        telemetryTypes: ['User Activity'],
        dependencies: [],
        capabilities: ['Messaging'],
        registeredAt: new Date().toISOString()
      },
      {
        serviceId: 'srv-instance-manager',
        serviceName: 'Instance Manager',
        version: 'v2.5.0',
        description: 'Container lifecycle daemon managing start, stop, restart, and state persistence.',
        status: 'ACTIVE',
        lifecycleState: 'READY',
        health: 99,
        supportedEvents: ['instance.created', 'instance.restarted', 'instance.terminated'],
        telemetryTypes: ['Instance Activity', 'Resource Usage'],
        dependencies: ['srv-monitoring-engine'],
        capabilities: ['Deployment', 'Recovery'],
        registeredAt: new Date().toISOString()
      },
      {
        serviceId: 'srv-backup-engine',
        serviceName: 'Backup Engine',
        version: 'v1.0.0',
        description: 'Automated state snapshots, database dumps, and disaster recovery store.',
        status: 'ACTIVE',
        lifecycleState: 'READY',
        health: 100,
        supportedEvents: ['backup.completed', 'backup.restored'],
        telemetryTypes: ['Configuration Changes', 'Health'],
        dependencies: [],
        capabilities: ['Backup', 'Recovery'],
        registeredAt: new Date().toISOString()
      },
      {
        serviceId: 'srv-license-manager',
        serviceName: 'License Manager',
        version: 'v1.0.0',
        description: 'Enterprise license tier verification and capability entitlement validator.',
        status: 'ACTIVE',
        lifecycleState: 'READY',
        health: 100,
        supportedEvents: ['license.validated'],
        telemetryTypes: ['User Activity'],
        dependencies: [],
        capabilities: ['Security', 'Reporting'],
        registeredAt: new Date().toISOString()
      }
    ];

    defaultServices.forEach((s) => this.services.set(s.serviceId, s));

    // Seed version history example
    this.versionHistories.push({
      serviceId: 'srv-behavior-engine',
      serviceName: 'Behavior Learning Engine',
      oldVersion: 'v2.3.0',
      newVersion: 'v2.4.0',
      updatedAt: new Date(Date.now() - 3600000 * 48).toISOString(),
      correlatedIncidentsCount: 2
    });
  }

  private seedDefaultAIProviders() {
    this.registerAIProvider({
      providerId: 'prov-gemini-flash',
      name: 'Google Gemini Flash 2.5',
      type: 'gemini',
      status: 'active',
      supportedModels: ['gemini-2.5-flash', 'gemini-1.5-pro'],
      capabilities: ['text-generation', 'vision', 'code-execution', 'function-calling'],
      latencyMs: 140
    });
  }

  // Register or update a service in the Central Registry
  public registerService(metadata: ServiceMetadata): ServiceMetadata {
    const existing = this.services.get(metadata.serviceId);
    if (existing && existing.version !== metadata.version) {
      // Track version change history for incident correlation
      this.versionHistories.unshift({
        serviceId: metadata.serviceId,
        serviceName: metadata.serviceName,
        oldVersion: existing.version,
        newVersion: metadata.version,
        updatedAt: new Date().toISOString(),
        correlatedIncidentsCount: 0
      });
      metadata.previousVersion = existing.version;
      metadata.lastVersionUpdateAt = new Date().toISOString();
    }

    if (!metadata.lifecycleState) {
      metadata.lifecycleState = 'READY';
    }

    this.services.set(metadata.serviceId, metadata);
    emitRegistryEvent('registry.service.registered', { service: metadata });
    return metadata;
  }

  public getServices(): ServiceMetadata[] {
    return Array.from(this.services.values());
  }

  public getService(serviceId: string): ServiceMetadata | undefined {
    return this.services.get(serviceId);
  }

  public updateServiceStatus(serviceId: string, status: ServiceStatus, health: number): ServiceMetadata | undefined {
    const srv = this.services.get(serviceId);
    if (!srv) return undefined;
    srv.status = status;
    srv.health = Math.max(0, Math.min(100, health));
    this.services.set(serviceId, srv);
    emitRegistryEvent('registry.service.updated', { service: srv });
    return srv;
  }

  public updateServiceVersion(serviceId: string, newVersion: string): ServiceMetadata | undefined {
    const srv = this.services.get(serviceId);
    if (!srv) return undefined;
    if (srv.version !== newVersion) {
      this.versionHistories.unshift({
        serviceId: srv.serviceId,
        serviceName: srv.serviceName,
        oldVersion: srv.version,
        newVersion,
        updatedAt: new Date().toISOString(),
        correlatedIncidentsCount: 0
      });
      srv.previousVersion = srv.version;
      srv.version = newVersion;
      srv.lastVersionUpdateAt = new Date().toISOString();
      this.services.set(serviceId, srv);
      emitRegistryEvent('registry.service.version_updated', { service: srv });
    }
    return srv;
  }

  public getVersionHistories(): ServiceVersionHistory[] {
    return this.versionHistories;
  }

  // Common Telemetry publishing
  public publishTelemetry(telemetry: Omit<StandardTelemetry, 'telemetryId' | 'timestamp'>): StandardTelemetry {
    const fullTelemetry: StandardTelemetry = {
      ...telemetry,
      telemetryId: `TEL-${Date.now()}-${Math.floor(Math.random() * 899 + 100)}`,
      timestamp: new Date().toISOString()
    };

    this.telemetryBuffer.unshift(fullTelemetry);
    if (this.telemetryBuffer.length > 200) {
      this.telemetryBuffer.pop();
    }

    emitRegistryEvent('telemetry.published', { telemetry: fullTelemetry });
    return fullTelemetry;
  }

  public getRecentTelemetry(): StandardTelemetry[] {
    return this.telemetryBuffer;
  }

  // Standard Event publishing
  public publishEvent(event: Omit<StandardEvent, 'eventId' | 'timestamp'>): StandardEvent {
    const fullEvent: StandardEvent = {
      ...event,
      eventId: `EVT-${Date.now()}-${Math.floor(Math.random() * 899 + 100)}`,
      timestamp: new Date().toISOString()
    };

    this.eventBuffer.unshift(fullEvent);
    if (this.eventBuffer.length > 200) {
      this.eventBuffer.pop();
    }

    emitRegistryEvent('event.published', { event: fullEvent });
    return fullEvent;
  }

  public getRecentEvents(): StandardEvent[] {
    return this.eventBuffer;
  }

  // ============================================================================
  // VERSION 2 EXTENDED PLATFORM LIFECYCLE & DISCOVERY SERVICES
  // ============================================================================

  /**
   * Service Lifecycle Management
   */
  public async initService(serviceId: string): Promise<boolean> {
    const srv = this.services.get(serviceId);
    if (!srv) return false;
    srv.lifecycleState = 'INITIALIZING';
    emitRegistryEvent('service.lifecycle.initializing', { serviceId });

    // Execute dependency check
    const depCheck = this.validateDependencies(serviceId);
    if (!depCheck.valid) {
      console.warn(`[SERVICE REGISTRY] Service ${serviceId} init warning: missing deps [${depCheck.missingDependencies.join(', ')}]`);
    }

    srv.lifecycleState = 'READY';
    srv.status = 'ACTIVE';
    emitRegistryEvent('service.lifecycle.ready', { serviceId });
    return true;
  }

  public async shutdownService(serviceId: string): Promise<boolean> {
    const srv = this.services.get(serviceId);
    if (!srv) return false;
    srv.lifecycleState = 'SHUTTING_DOWN';
    emitRegistryEvent('service.lifecycle.shutting_down', { serviceId });

    srv.lifecycleState = 'SHUTDOWN';
    srv.status = 'OFFLINE';
    emitRegistryEvent('service.lifecycle.shutdown', { serviceId });
    return true;
  }

  public async shutdownAll(): Promise<void> {
    for (const srvId of this.services.keys()) {
      await this.shutdownService(srvId);
    }
  }

  /**
   * Startup Sequence & Dependency Graph Computation
   */
  public validateDependencies(serviceId: string): { valid: boolean; missingDependencies: string[] } {
    const srv = this.services.get(serviceId);
    if (!srv) return { valid: false, missingDependencies: ['SERVICE_NOT_FOUND'] };

    const missing = srv.dependencies.filter(depId => !this.services.has(depId));
    return {
      valid: missing.length === 0,
      missingDependencies: missing
    };
  }

  public getDependencyGraph(): Record<string, string[]> {
    const graph: Record<string, string[]> = {};
    this.services.forEach((meta, id) => {
      graph[id] = [...meta.dependencies];
    });
    return graph;
  }

  public async executeStartupSequence(): Promise<{ success: boolean; sequence: string[] }> {
    const sequence: string[] = [];
    const visited = new Set<string>();

    const visit = async (serviceId: string) => {
      if (visited.has(serviceId)) return;
      visited.add(serviceId);
      const srv = this.services.get(serviceId);
      if (srv) {
        for (const dep of srv.dependencies) {
          await visit(dep);
        }
        await this.initService(serviceId);
        sequence.push(serviceId);
      }
    };

    for (const serviceId of this.services.keys()) {
      await visit(serviceId);
    }

    return { success: true, sequence };
  }

  /**
   * Health Registration Hooks
   */
  public registerHealthChecker(serviceId: string, fn: HealthCheckFn): void {
    this.healthCheckers.set(serviceId, fn);
  }

  public async runHealthCheck(serviceId: string): Promise<{ healthy: boolean; score: number; details?: string }> {
    const checker = this.healthCheckers.get(serviceId);
    if (!checker) {
      const srv = this.services.get(serviceId);
      return { healthy: srv ? srv.status === 'ACTIVE' : false, score: srv ? srv.health : 0 };
    }
    try {
      const result = await checker();
      this.updateServiceStatus(serviceId, result.healthy ? 'ACTIVE' : 'DEGRADED', result.score);
      return result;
    } catch (err: any) {
      this.updateServiceStatus(serviceId, 'DEGRADED', 50);
      return { healthy: false, score: 50, details: err.message };
    }
  }

  /**
   * Runtime Service Discovery
   */
  public discoverServicesByCapability(capability: ServiceCapability): ServiceMetadata[] {
    return Array.from(this.services.values()).filter(s => s.capabilities.includes(capability));
  }

  public discoverServicesByStatus(status: ServiceStatus): ServiceMetadata[] {
    return Array.from(this.services.values()).filter(s => s.status === status);
  }

  /**
   * Dynamic AI Provider & Plugin Registration
   */
  public registerAIProvider(provider: AIProviderRegistration): AIProviderRegistration {
    this.aiProviders.set(provider.providerId, provider);
    emitRegistryEvent('ai_provider.registered', { provider });
    return provider;
  }

  public getAIProviders(): AIProviderRegistration[] {
    return Array.from(this.aiProviders.values());
  }

  public unregisterAIProvider(providerId: string): boolean {
    const removed = this.aiProviders.delete(providerId);
    if (removed) emitRegistryEvent('ai_provider.unregistered', { providerId });
    return removed;
  }

  public registerPluginModule(plugin: DynamicPluginRegistration): DynamicPluginRegistration {
    this.dynamicPlugins.set(plugin.pluginId, plugin);
    emitRegistryEvent('plugin_module.registered', { plugin });
    return plugin;
  }

  public getRegisteredPlugins(): DynamicPluginRegistration[] {
    return Array.from(this.dynamicPlugins.values());
  }

  public togglePluginState(pluginId: string, enabled: boolean): boolean {
    const plugin = this.dynamicPlugins.get(pluginId);
    if (!plugin) return false;
    plugin.enabled = enabled;
    emitRegistryEvent('plugin_module.state_changed', { pluginId, enabled });
    return true;
  }
}

export const serviceRegistry = ServiceRegistry.getInstance();
