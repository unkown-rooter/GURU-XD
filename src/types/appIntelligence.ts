export interface AppObservation {
  id: string;
  appId: string;
  eventType: 
    | 'created' 
    | 'deployed' 
    | 'started' 
    | 'stopped' 
    | 'restarted' 
    | 'updated' 
    | 'config_change' 
    | 'env_change' 
    | 'repo_change' 
    | 'resource_sample' 
    | 'health_check' 
    | 'user_action' 
    | 'error' 
    | 'warning';
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  details: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface AppInstallationRecord {
  id: string;
  timestamp: string;
  version: string;
  repository: string;
  region: string;
  replicaCount: number;
  status: string;
  installedBy: string;
}

export interface AppUpdateRecord {
  id: string;
  timestamp: string;
  changesSummary: string;
  author: string;
  envKeysAddedOrUpdated: string[];
}

export interface AppDeploymentRecord {
  id: string;
  timestamp: string;
  commitHash: string;
  commitMessage: string;
  status: 'SUCCESS' | 'FAILED' | 'BUILDING';
  durationSeconds: number;
}

export interface AppRestartRecord {
  id: string;
  timestamp: string;
  reason: string;
  triggeredBy: string;
}

export interface AppErrorRecord {
  id: string;
  timestamp: string;
  errorMessage: string;
  severity: 'warning' | 'error' | 'critical';
  resolved: boolean;
  codeSnippet?: string;
}

export interface AppCrashRecord {
  id: string;
  timestamp: string;
  exitCode: number;
  signal: string;
  memoryMBAtCrash: number;
}

export interface AppResourceMetricSample {
  timestamp: string;
  cpuPercent: number;
  memoryUsedMB: number;
  memoryLimitMB: number;
  networkInKbps: number;
  networkOutKbps: number;
}

export interface AppUptimeRecord {
  timestamp: string;
  uptimePercent: number;
  status: 'running' | 'stopped' | 'error';
}

export interface AppConfigRecord {
  id: string;
  timestamp: string;
  envVarsCount: number;
  changedKeys: string[];
  region: string;
  replicaCount: number;
  updatedBy: string;
}

export interface AppUserActionRecord {
  id: string;
  timestamp: string;
  action: string;
  user: string;
}

export interface AppMilestone {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  type: 'first_launch' | 'scale_up' | 'zero_downtime' | 'highest_uptime' | 'major_release';
}

export interface AppStructuredMemory {
  appId: string;
  installationHistory: AppInstallationRecord[];
  updateHistory: AppUpdateRecord[];
  deploymentHistory: AppDeploymentRecord[];
  restartHistory: AppRestartRecord[];
  errorHistory: AppErrorRecord[];
  crashHistory: AppCrashRecord[];
  resourceHistory: AppResourceMetricSample[];
  uptimeHistory: AppUptimeRecord[];
  configHistory: AppConfigRecord[];
  userActions: AppUserActionRecord[];
  milestones: AppMilestone[];
}

export interface AppUnderstanding {
  appId: string;
  semanticStatus: string;
  businessCriticality: 'Low' | 'Medium' | 'High' | 'Business Critical';
  stateSummary: string;
  operationalKnowledge: string[];
  workloadRequirement: string;
  importanceDescription: string;
  lastAssessedAt: string;
}

export interface TimeframeComparison {
  cpuChangePct: number;
  memoryChangeMB: number;
  errorDeltaCount: number;
  deploymentCountDelta: number;
  uptimeDeltaPct: number;
}

export interface AppComparison {
  appId: string;
  todayVsYesterday: TimeframeComparison;
  thisWeekVsLastWeek: TimeframeComparison;
  currentVsPrevVersion: TimeframeComparison & { performanceShiftSummary: string };
  metricTrends: Array<{
    metric: 'CPU' | 'Memory' | 'Error Frequency' | 'Deployments' | 'Uptime';
    direction: 'up' | 'down' | 'stable';
    rateFormatted: string;
    significance: 'Positive' | 'Neutral' | 'Attention Required';
  }>;
}

export interface DiscoveredRelationship {
  id: string;
  title: string;
  description: string;
  confidencePct: number;
  impact: 'High' | 'Medium' | 'Low';
  category: 'update_error_correlation' | 'resource_growth' | 'bottleneck' | 'recurring_failure' | 'unusual_behavior';
}

export interface RecurringFailurePattern {
  id: string;
  patternName: string;
  frequency: string;
  lastOccurred: string;
  rootCauseInsight: string;
}

export interface ResourceBottleneck {
  id: string;
  component: string;
  metric: string;
  threshold: string;
  impact: string;
}

export interface UnusualBehavior {
  id: string;
  description: string;
  detectedAt: string;
  anomalyScore: number;
}

export interface AppAnalysisEngineResult {
  appId: string;
  discoveredRelationships: DiscoveredRelationship[];
  recurringFailures: RecurringFailurePattern[];
  resourceBottlenecks: ResourceBottleneck[];
  unusualBehaviors: UnusualBehavior[];
  healthInsights: string[];
  operationalSummary: string;
  lastAnalyzedAt: string;
}

export interface AppIntelligenceOverview {
  totalAppsMonitored: number;
  totalObservationsCount: number;
  totalMilestonesRecorded: number;
  criticalAppsCount: number;
  discoveredRelationshipsCount: number;
  clusterHealthScorePct: number;
  overallOperationalSummary: string;
  // Layer 2 Aggregate Counts
  activePredictionsCount?: number;
  learnedPatternsCount?: number;
  pendingAdaptationsCount?: number;
  personalizedRecommendationsCount?: number;
  activePlansCount?: number;

  // Layer 3 Aggregate Counts
  activeAutomationsCount?: number;
  pendingAutomationApprovalsCount?: number;
  overallSecurityScorePct?: number;
  securityScore?: number;
  securityGrade?: string;
  criticalSecurityThreatsCount?: number;
  agentCollaborationsCount?: number;
  activeAgentsCount?: number;
  reflectionScorePct?: number;
}

// ==========================================
// INTELLIGENCE LAYER 2 TYPES
// ==========================================

// 🔮 PREDICT
export interface AppPrediction {
  id: string;
  appId: string;
  predictionType: 
    | 'failure' 
    | 'high_cpu' 
    | 'memory_exhaustion' 
    | 'storage_shortage' 
    | 'deployment_risk' 
    | 'unhealthy_app' 
    | 'scaling_requirement' 
    | 'inactivity' 
    | 'downtime' 
    | 'unusual_behavior';
  title: string;
  confidencePct: number; // e.g. 92
  confidenceLevel: 'High' | 'Medium' | 'Low';
  reasoning: string;
  historicalEvidence: string[];
  suggestedAction: string;
  timeToImpact: string; // e.g., "Within 6-12 hours", "Impending peak traffic"
  predictedSeverity: 'critical' | 'warning' | 'info';
}

export interface AppPredictionEngineResult {
  appId: string;
  predictions: AppPrediction[];
  overallPredictiveRiskScorePct: number; // 0 (safe) to 100 (high risk)
  lastPredictedAt: string;
}

// 🌱 LEARN
export interface CoInstalledAppPattern {
  categoryOrApp: string;
  correlationPct: number;
  reason: string;
}

export interface DeploymentPattern {
  pattern: string;
  successRatePct: number;
  recommendation: string;
}

export interface UserPreferencesKnowledge {
  favoriteCategories: string[];
  preferredRegion: string;
  averageReplicaPreference: number;
  updateFrequencyDays: number;
}

export interface RecoveryMethodInsight {
  failureType: string;
  bestRecoveryAction: string;
  successRatePct: number;
}

export interface AppLearningEngineResult {
  appId: string;
  coInstalledApps: CoInstalledAppPattern[];
  deploymentPatterns: DeploymentPattern[];
  userPreferences: UserPreferencesKnowledge;
  successfulStrategies: string[];
  workloadCharacteristics: {
    peakHoursUtc: string;
    trafficPattern: string;
    resourceHabits: string;
  };
  updateBehavior: {
    avgDaysBetweenUpdates: number;
    typicalChangeScope: string;
  };
  appPopularityRank: number;
  commonRecoveryMethods: RecoveryMethodInsight[];
  lastLearnedAt: string;
}

// 🔄 ADAPT
export interface AppAdaptationItem {
  id: string;
  appId: string;
  type: 
    | 'replica_scaling' 
    | 'monitoring_frequency' 
    | 'dashboard_priority' 
    | 'alert_threshold' 
    | 'criticality_priority';
  title: string;
  description: string;
  currentSetting: string;
  suggestedSetting: string;
  reasoning: string;
  expectedImpact: string;
  requiresUserApproval: boolean; // Always true for infrastructure/config
  status: 'pending_user_approval' | 'approved' | 'dismissed';
}

export interface AppAdaptationEngineResult {
  appId: string;
  adaptations: AppAdaptationItem[];
  adaptedDashboardPriorityScore: number;
  lastAdaptedAt: string;
}

// 💡 RECOMMEND
export interface AppRecommendation {
  id: string;
  appId: string;
  category: 
    | 'useful_app' 
    | 'plugin' 
    | 'backup' 
    | 'security' 
    | 'scaling' 
    | 'performance' 
    | 'update_outdated' 
    | 'remove_unused' 
    | 'related_app' 
    | 'deployment_improvement' 
    | 'monitoring' 
    | 'maintenance';
  title: string;
  whyRecommended: string;
  sourceObservations: string[];
  expectedBenefits: string[];
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  actionLabel: string;
}

export interface AppRecommendationEngineResult {
  appId: string;
  recommendations: AppRecommendation[];
  lastRecommendedAt: string;
}

// 🗂 PLAN
export interface AppPlanStep {
  stepNumber: number;
  title: string;
  description: string;
  estimatedEffort: string; // e.g. "15 mins", "1 hour"
  priority: 'High' | 'Medium' | 'Low';
  status: 'planned' | 'in_progress' | 'completed';
}

export interface AppPlan {
  id: string;
  appId: string;
  planType: 
    | 'maintenance' 
    | 'upgrade' 
    | 'deployment' 
    | 'scaling_roadmap' 
    | 'backup_schedule' 
    | 'security_hardening' 
    | 'infrastructure_growth' 
    | 'resource_optimization' 
    | 'version_upgrade' 
    | 'disaster_recovery';
  title: string;
  summary: string;
  priority: 'Immediate' | 'Short-Term' | 'Long-Term';
  steps: AppPlanStep[];
  expectedOutcome: string;
  targetTimeline: string;
}

export interface AppPlanningEngineResult {
  appId: string;
  plans: AppPlan[];
  lastPlannedAt: string;
}

// ==========================================
// INTELLIGENCE LAYER 3 TYPES
// ==========================================

// 📖 EXPLAINABILITY METADATA STRUCTURE
export interface ExplainabilityMetadata {
  reason: string;
  supportingEvidence: string[];
  historicalReferences: string[];
  confidenceLevel: 'High' | 'Medium' | 'Low';
  expectedImpact: string;
}

// ⚙️ AUTOMATE
export interface AppAutomationRule {
  id: string;
  appId: string;
  type: 
    | 'backup' 
    | 'temp_cleanup' 
    | 'archive_inactive' 
    | 'maintenance_reminder' 
    | 'health_report' 
    | 'event_notification' 
    | 'schedule_update' 
    | 'health_check';
  title: string;
  description: string;
  enabled: boolean;
  requiresApproval: boolean;
  isSensitive: boolean;
  frequency: 'Hourly' | 'Daily' | 'Weekly' | 'Monthly' | 'Event-Driven';
  lastExecutedAt: string;
  nextScheduledAt: string;
  status: 'active' | 'pending_approval' | 'disabled' | 'running';
  explainability: ExplainabilityMetadata;
}

export interface AppAutomationExecutionLog {
  id: string;
  ruleId: string;
  ruleTitle: string;
  appId: string;
  timestamp: string;
  actionTaken: string;
  status: 'success' | 'failed' | 'user_approved' | 'user_rejected' | 'pending_user_approval';
  details: string;
}

export interface AppAutomationEngineResult {
  appId: string;
  automations: AppAutomationRule[];
  executionHistory: AppAutomationExecutionLog[];
  totalAutomationsCount: number;
  activeAutomationsCount: number;
  pendingApprovalsCount: number;
}

// 🛡 PROTECT (SECURITY CENTER)
export interface AppSecurityFinding {
  id: string;
  appId: string;
  category: 
    | 'suspicious_activity' 
    | 'failed_deployments' 
    | 'config_mistake' 
    | 'exposed_secrets' 
    | 'outdated_dependencies' 
    | 'permission_issue' 
    | 'abnormal_resource' 
    | 'unhealthy_app' 
    | 'unauthorized_change';
  title: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  status: 'open' | 'mitigated' | 'suppressed';
  detectedAt: string;
  affectedResource: string;
  remediationSteps: string;
  explainability: ExplainabilityMetadata;
}

export interface AppSecurityCenterResult {
  appId: string;
  overallSecurityScore: number; // 0 - 100
  securityGrade: 'A+' | 'A' | 'B' | 'C' | 'F';
  findings: AppSecurityFinding[];
  lastScannedAt: string;
}

// 🤝 COLLABORATE (MULTI-AGENT COLLABORATION)
export interface AgentCollaborationStatus {
  agentName: 'MemoryService' | 'AnalyticsService' | 'RecommendationService' | 'PredictionService' | 'SecurityService' | 'AutomationService' | 'AICopilot';
  role: string;
  status: 'healthy' | 'collaborating' | 'idle';
  version: string;
  lastHeartbeat: string;
}

export interface AgentCollaborationMessage {
  id: string;
  timestamp: string;
  senderAgent: string;
  receiverAgent: string;
  topic: string;
  payloadSummary: string;
  status: 'delivered' | 'processed';
}

export interface AppCollaborationTopology {
  agents: AgentCollaborationStatus[];
  recentBusMessages: AgentCollaborationMessage[];
  activeChannelCount: number;
}

// 🪞 REFLECT
export interface AppEcosystemReflection {
  id: string;
  evaluatedAt: string;
  rarelyUsedApps: Array<{ appId: string; appName: string; inactivityDays: number; reason: string }>;
  excessiveResourceConsumers: Array<{ appId: string; appName: string; cpuUsagePct: number; memoryMB: number; anomalyReason: string }>;
  recommendationAcceptanceRatePct: number;
  automationEfficiencyScorePct: number;
  predictionAccuracyPct: number;
  repeatedFailureCount: number;
  optimalDeploymentStrategies: string[];
  strategicActionItems: string[];
  overallReflectionSummary: string;
}

// 🚀 IMPROVE
export interface AppContinuousImprovementMetrics {
  evaluatedAt: string;
  recommendationQualityScorePct: number;
  predictionAccuracyPct: number;
  monitoringEfficiencyPct: number;
  healthAnalysisPrecisionPct: number;
  resourceOptimizationEfficiencyPct: number;
  improvementLogs: Array<{ timestamp: string; component: string; optimizationTaken: string; impactDelta: string }>;
}

// 🌟 ALL-LAYER AI INSIGHTS EXPERIENCE
export interface AIInsightsSummary {
  overallHealthPct: number;
  securityScore: number;
  securityGrade: 'A+' | 'A' | 'B' | 'C' | 'F';
  activePredictionsCount: number;
  activeAutomationsCount: number;
  activeAgentCount: number;
  reflectionScore: number;
  reflectionSummary: string;
  strategicActionItems: string[];
  rarelyUsedApps: string[];
  topResourceConsumers: string[];
  topRecommendations: Array<{
    id: string;
    appId: string;
    category: string;
    title: string;
    description: string;
    expectedImpact: string;
    confidenceLevel: string;
    reasoning: string;
  }>;
  recentDecisions: Array<{
    id: string;
    timestamp: string;
    title: string;
    category: string;
    explainability: {
      reason: string;
      expectedImpact: string;
    };
  }>;
  activePredictions: AppPrediction[];
  securityFindings: AppSecurityFinding[];
  collaborationTopology: AppCollaborationTopology;
}

export interface FullEcosystemAIInsights {
  overallClusterHealthPct: number;
  overallSecurityScore: number;
  totalMonitoredApps: number;
  activePredictions: number;
  pendingAutomationApprovals: number;
  openSecurityThreats: number;
  acceptedAdaptationCount: number;
  recentAIDecisions: Array<{
    id: string;
    timestamp: string;
    title: string;
    sourceService: string;
    outcome: string;
    explainabilitySummary: string;
  }>;
  topRecommendations: Array<{
    appId: string;
    appName: string;
    title: string;
    priority: string;
    reason: string;
  }>;
  reflectionSummary: string;
}

