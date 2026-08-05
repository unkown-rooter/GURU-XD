/**
 * GURU-XD Production-Grade Module Registration & AI Discovery System
 * Architecture Specifications & Types Definition
 */

export type ModuleLifecycleState = 
  | 'UNINITIALIZED'
  | 'INITIALIZING'
  | 'INITIALIZED'
  | 'REGISTERED'
  | 'STARTING'
  | 'RUNNING'
  | 'STOPPING'
  | 'STOPPED'
  | 'RESTARTING'
  | 'RELOADING'
  | 'ERROR'
  | 'SHUTDOWN';

export type ModuleHealthStatus = 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' | 'UNKNOWN';

export type AuditSeverity = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

export interface ModuleAuthor {
  name: string;
  email?: string;
  url?: string;
}

export interface ModuleDependency {
  moduleId: string;
  minVersion?: string;
  maxVersion?: string;
  optional?: boolean;
}

export interface ModulePermission {
  id: string;
  name: string;
  description: string;
  level: 'read' | 'write' | 'admin' | 'system';
}

export interface ModuleCapability {
  id: string;
  name: string;
  description: string;
  category: string;
}

export interface ModuleRoute {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  description: string;
  protected?: boolean;
  requiredPermission?: string;
}

export interface ModuleServiceDefinition {
  serviceKey: string; // e.g., 'dashboard.getStats'
  name: string;
  description: string;
  inputSchema?: Record<string, any>;
  outputSchema?: Record<string, any>;
}

export interface ModuleEventDefinition {
  eventType: string; // e.g., 'deployment.started'
  description: string;
  payloadSchema?: Record<string, any>;
}

export interface ModuleManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: ModuleAuthor | string;
  dependencies: ModuleDependency[];
  permissions: ModulePermission[];
  capabilities: ModuleCapability[];
  services: ModuleServiceDefinition[];
  events: ModuleEventDefinition[];
  routes: ModuleRoute[];
  configuration: Record<string, any>;
  healthEndpoint?: string;
  orchestratorMinVersion?: string;
  tags?: string[];
}

export interface ModuleHealthReport {
  healthy: boolean;
  status: ModuleHealthStatus;
  score: number; // 0 - 100
  details?: string;
  metrics?: {
    cpuPercent?: number;
    memoryMb?: number;
    activeConnections?: number;
    errorRatePercent?: number;
    lastHeartbeat?: string;
  };
}

export interface RegisteredModuleMetadata {
  manifest: ModuleManifest;
  status: 'ACTIVE' | 'INACTIVE' | 'DEGRADED' | 'FAILED' | 'UNINITIALIZED';
  lifecycleState: ModuleLifecycleState;
  health: ModuleHealthReport;
  registeredAt: string;
  lastUpdated: string;
  lastStartedAt?: string;
  errorLog?: string[];
}

export interface ServiceExecutionResult<T = any> {
  success: boolean;
  serviceKey: string;
  moduleId: string;
  data?: T;
  error?: string;
  executionTimeMs: number;
}

export interface KnowledgeGraphNode {
  id: string;
  name: string;
  type: 'module' | 'service' | 'capability' | 'event' | 'route' | 'permission' | 'database';
  metadata: Record<string, any>;
}

export interface KnowledgeGraphEdge {
  source: string;
  target: string;
  relation: 'DEPENDS_ON' | 'PROVIDES_SERVICE' | 'EXPOSES_CAPABILITY' | 'EMITS_EVENT' | 'SUBSCRIBES_TO' | 'OWNS_ROUTE' | 'REQUIRES_PERMISSION' | 'USES_DATABASE';
  metadata?: Record<string, any>;
}

export interface ModuleKnowledgeGraphData {
  nodes: KnowledgeGraphNode[];
  edges: KnowledgeGraphEdge[];
  lastUpdated: string;
}

export interface AuditItem {
  id: string;
  moduleId: string;
  category: 'REGISTRATION' | 'HEALTH' | 'VERSION' | 'SECURITY' | 'PERMISSIONS' | 'ROUTES' | 'EVENTS' | 'PERFORMANCE' | 'CONFIG';
  severity: AuditSeverity;
  title: string;
  message: string;
  recommendation: string;
  timestamp: string;
}

export interface ModuleAuditReport {
  auditId: string;
  timestamp: string;
  totalModules: number;
  healthyModules: number;
  warningsCount: number;
  errorsCount: number;
  criticalCount: number;
  items: AuditItem[];
  overallStatus: 'PASS' | 'WARNING' | 'FAIL';
}

export interface SecurityValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  securityScore: number; // 0 - 100
  checkedAt: string;
}

export interface SemverCompatibilityResult {
  compatible: boolean;
  coreVersion: string;
  requestedVersion: string;
  reason?: string;
}

export interface AIDiscoveryQueryResult {
  query: string;
  queryType: 'LIST_ALL' | 'FIND_BY_CAPABILITY' | 'FIND_BY_SERVICE' | 'FIND_BY_ROUTE' | 'FIND_BY_EVENT' | 'FIND_FAILED' | 'FIND_USER_MANAGERS' | 'CUSTOM';
  matchedModules: RegisteredModuleMetadata[];
  matchedServices: ModuleServiceDefinition[];
  matchedCapabilities: ModuleCapability[];
  explanation: string;
  timestamp: string;
}

export interface AILearningPipelineResult {
  pipelineId: string;
  moduleId: string;
  steps: {
    step: string;
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
    timestamp: string;
    details?: string;
  }[];
  success: boolean;
  totalDurationMs: number;
  knowledgeGraphUpdated: boolean;
  aiMemoryUpdated: boolean;
}

// ============================================================================
// PLATFORM STATE INTELLIGENCE TYPES
// ============================================================================

export type PlatformChangeCategory = 
  | 'MODULE_LIFECYCLE'
  | 'PLUGIN_LIFECYCLE'
  | 'LIFECYCLE'
  | 'SERVICE_INVOCATION'
  | 'ROUTE_MAPPING'
  | 'HEALTH_ALERT'
  | 'CONFIG_CHANGE'
  | 'SECURITY_EVENT'
  | 'SNAPSHOT_CREATED'
  | 'DEPENDENCY_ALERT';

export type PlatformChangeSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export interface PlatformChangeLogEntry {
  id: string;
  timestamp: string;
  category: PlatformChangeCategory;
  severity: PlatformChangeSeverity;
  sourceModuleId?: string;
  eventType: string;
  description: string;
  oldValue?: any;
  newValue?: any;
}

export interface PlatformSnapshotModuleItem {
  id: string;
  name: string;
  version: string;
  lifecycleState: ModuleLifecycleState;
  status: 'ACTIVE' | 'INACTIVE' | 'DEGRADED' | 'FAILED' | 'UNINITIALIZED';
  healthScore: number;
  servicesCount: number;
  routesCount: number;
  memoryMb?: number;
  cpuPercent?: number;
}

export interface PlatformSnapshot {
  snapshotId: string;
  timestamp: string;
  type: 'STARTUP' | 'STATE_CHANGE' | 'MANUAL';
  platformVersion: string;
  uptimeSeconds: number;
  overallHealthScore: number;
  overallStatus: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
  modulesSummary: {
    total: number;
    active: number;
    inactive: number;
    degraded: number;
    failed: number;
  };
  modulesList: PlatformSnapshotModuleItem[];
  servicesCount: number;
  routesCount: number;
  eventsCount: number;
  dependenciesCount: number;
  configSummary: Record<string, any>;
}

export interface PlatformSnapshotDiff {
  snapshotAId: string;
  snapshotBId: string;
  comparedAt: string;
  addedModules: string[];
  removedModules: string[];
  modifiedModules: {
    id: string;
    name: string;
    changes: string[];
  }[];
  healthScoreDelta: number;
  statusChanged: boolean;
  summary: string;
}

export interface PlatformHealthMetrics {
  overallScore: number; // 0 - 100
  overallStatus: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
  cpuPercent: number;
  memoryUsageMb: number;
  memoryTotalMb: number;
  activeRequestsPerSec: number;
  avgResponseTimeMs: number;
  errorRatePercent: number;
  databaseConnected: boolean;
  eventBusOperational: boolean;
  unhealthyDependenciesCount: number;
  lastCheckedAt: string;
}

export interface PlatformStateSummary {
  platformVersion: string;
  systemStartTime: string;
  uptimeSeconds: number;
  lastSyncedAt: string;
  healthMetrics: PlatformHealthMetrics;
  modulesCount: {
    total: number;
    active: number;
    inactive: number;
    degraded: number;
    failed: number;
  };
  registeredModulesCount: number;
  activeModulesCount: number;
  disabledModulesCount: number;
  degradedModulesCount: number;
  failedModulesCount: number;
  discoveredModulesCount: number;
  knowledgeGraphModulesCount: number;
  aiMemoryModulesCount: number;
  isSystemConsistent: boolean;
  servicesCount: number;
  routesCount: number;
  eventsCount: number;
  permissionsCount: number;
  capabilitiesCount: number;
  recentChangesCount: number;
  latestSnapshotId?: string;
}

export interface ReconciliationReport {
  reconciliationId: string;
  timestamp: string;
  discoveredCount: number;
  registeredCount: number;
  aiMemoryCount: number;
  knowledgeGraphCount: number;
  platformStateCount: number;
  isFullyConsistent: boolean;
  missingRegistrations: string[];
  duplicateRegistrations: string[];
  orphanedModules: string[];
  reRegisteredModules: string[];
  status: 'SYNCHRONIZED' | 'RECONCILED_WITH_FIXES' | 'INCONSISTENT';
  details: string;
}

export interface ConsistencyCheckResult {
  timestamp: string;
  isConsistent: boolean;
  counts: {
    projectDiscoveryEngine: number;
    moduleRegistry: number;
    platformStateManager: number;
    knowledgeGraph: number;
    aiMemory: number;
  };
  discrepancies: {
    component: string;
    expectedCount: number;
    actualCount: number;
    difference: number;
  }[];
}

export interface DiagnosticReport {
  diagnosticId: string;
  timestamp: string;
  overallStatus: 'HEALTHY' | 'WARNING' | 'CRITICAL_DISCREPANCY';
  consistency: ConsistencyCheckResult;
  reconciliation?: ReconciliationReport;
  summary: string;
  recommendations: string[];
}

export interface OperationalReasoningResult {
  query: string;
  timestamp: string;
  source: 'GURU_XD_AI_CORE_ORCHESTRATOR';
  verifiedFromLiveState: boolean;
  summaryAnswer: string;
  detailedReasoning: {
    sectionTitle: string;
    content: string;
  }[];
  affectedModules?: string[];
  affectedServices?: string[];
  affectedAPIs?: string[];
  estimatedPlatformImpact?: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recommendedActionItems?: {
    step: number;
    title: string;
    description: string;
    actionableModuleId?: string;
    automatedCommand?: string;
  }[];
}

export type PluginStatus = 'INSTALLED' | 'ENABLED' | 'DISABLED' | 'FAILED' | 'UNHEALTHY' | 'UPGRADING' | 'UNINSTALLED';

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  author: ModuleAuthor | string;
  description: string;
  dependencies: ModuleDependency[];
  orchestratorMinVersion: string;
  requiredPermissions: ModulePermission[];
  services: ModuleServiceDefinition[];
  events: ModuleEventDefinition[];
  routes: ModuleRoute[];
  configuration: Record<string, any>;
  healthEndpoint?: string;
  tags?: string[];
}

export interface PluginHealth {
  status: ModuleHealthStatus;
  score: number;
  cpuPercent: number;
  memoryMb: number;
  responseTimeMs: number;
  errorCount: number;
  lastRestart: string;
  lastUpdate: string;
  details: string;
}

export interface RegisteredPlugin {
  manifest: PluginManifest;
  status: PluginStatus;
  installedAt: string;
  lastUpdatedAt: string;
  enabled: boolean;
  health: PluginHealth;
  versionHistory: { version: string; installedAt: string; changelog?: string }[];
}

export interface InteractionGraphNode {
  id: string;
  label: string;
  type: 'module' | 'service' | 'event' | 'api' | 'dependency' | 'plugin' | 'infrastructure';
  status?: string;
  metadata?: Record<string, any>;
}

export interface InteractionGraphEdge {
  source: string;
  target: string;
  type: 'exposes' | 'subscribes' | 'depends_on' | 'routes_to' | 'runs_on' | 'uses_plugin';
  label?: string;
}

export interface InteractionGraph {
  nodes: InteractionGraphNode[];
  edges: InteractionGraphEdge[];
  lastUpdated: string;
  summary: {
    modulesCount: number;
    servicesCount: number;
    eventsCount: number;
    routesCount: number;
    pluginsCount: number;
    infrastructureCount: number;
  };
}

// Stage 1 - Stage 7 Audit & Diagnostic Interfaces
export interface Stage1DiscoveryReport {
  expectedCount: number;
  discoveredCount: number;
  missingCount: number;
  ignoredCount: number;
  invalidCount: number;
  discoveredModules: { id: string; name: string; version: string }[];
  missingModules: { id: string; reason: string }[];
  ignoredModules: { id: string; reason: string }[];
  invalidModules: { moduleId: string; errors: string[]; reason: string }[];
}

export interface Stage2RegistrationRecord {
  moduleId: string;
  moduleName: string;
  status: 'STARTED' | 'COMPLETED' | 'FAILED' | 'DUPLICATE' | 'SKIPPED';
  timestamp: string;
  failureReason?: string;
  stackTrace?: string;
  recoveryRecommendation?: string;
}

export interface Stage2RegistrationReport {
  totalAttempted: number;
  startedCount: number;
  completedCount: number;
  failedCount: number;
  duplicateCount: number;
  skippedCount: number;
  records: Stage2RegistrationRecord[];
}

export interface Stage3RegistryReport {
  totalRegistered: number;
  authoritativeCount: number;
  duplicateIds: string[];
  missingEntries: string[];
  invalidEntries: string[];
  corruptedEntries: string[];
  disabledModulesCount: number;
  disabledModuleIds: string[];
  failedModulesCount: number;
  failedModuleIds: string[];
  isAuthoritative: boolean;
}

export interface Stage4SyncAuditReport {
  timestamp: string;
  isConsistent: boolean;
  counts: {
    projectDiscoveryEngine: number;
    moduleRegistry: number;
    platformStateManager: number;
    knowledgeGraph: number;
    aiMemory: number;
  };
  moduleIdsByComponent: {
    projectDiscoveryEngine: string[];
    moduleRegistry: string[];
    platformStateManager: string[];
    knowledgeGraph: string[];
    aiMemory: string[];
  };
  mismatches: {
    component: string;
    missingModuleIds: string[];
    extraModuleIds: string[];
    explanation: string;
  }[];
  repairActionTaken: boolean;
  postRepairConsistent: boolean;
}

export interface Stage5StartupStepLog {
  step: number;
  stageName: string;
  status: 'PASSED' | 'FAILED' | 'SKIPPED';
  timestamp: string;
  details: string;
  error?: string;
}

export interface Stage5StartupReport {
  startupId: string;
  timestamp: string;
  overallStatus: 'SUCCESS' | 'FAILED';
  steps: Stage5StartupStepLog[];
  failedStep?: string;
}

export interface Stage6DynamicDetectionReport {
  lastDetectedAt: string;
  newModulesDetected: string[];
  refreshedModules: string[];
  unregisteredModules: string[];
  disabledModulesMarked: string[];
  aiCoreAutoSyncEnabled: boolean;
}

export interface FullLifecycleAuditReport {
  auditId: string;
  timestamp: string;
  overallHealth: 'PERFECT_SYNCHRONIZATION' | 'RECONCILED' | 'CRITICAL_DISCREPANCY';
  stage1Discovery: Stage1DiscoveryReport;
  stage2Registration: Stage2RegistrationReport;
  stage3Registry: Stage3RegistryReport;
  stage4Sync: Stage4SyncAuditReport;
  stage5Startup: Stage5StartupReport;
  stage6DynamicDetection: Stage6DynamicDetectionReport;
  stage7DiagnosticSummary: {
    modulesDiscovered: number;
    modulesRegistered: number;
    modulesSynchronized: number;
    modulesAvailableToAICore: number;
    missingModules: string[];
    registrationFailures: Stage2RegistrationRecord[];
    synchronizationFailures: string[];
    startupWarnings: string[];
    engineeringRecommendations: string[];
  };
}


