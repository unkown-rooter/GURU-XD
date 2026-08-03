import crypto from 'crypto';
import { DatabaseService, Bot } from './db';

// ----------------------------------------------------
// TYPES & INTERFACES FOR BEHAVIOR LEARNING ENGINE
// ----------------------------------------------------

export type BotCategory = 
  | 'Business Bot'
  | 'Education Bot'
  | 'AI Assistant'
  | 'Community Bot'
  | 'Moderation Bot'
  | 'Downloader Bot'
  | 'Entertainment Bot'
  | 'Store Bot'
  | 'Customer Support Bot'
  | 'Utility Bot'
  | 'Automation Bot'
  | 'Personal Bot'
  | 'Advertising Bot'
  | 'Group Management Bot';

export type ProtectionPolicy = 
  | 'MONITOR_ONLY'
  | 'NOTIFY_ONLY'
  | 'AUTOMATIC_THROTTLING'
  | 'TEMPORARY_RATE_LIMITING'
  | 'TEMPORARY_PAUSE'
  | 'AUTOMATIC_ISOLATION'
  | 'REQUIRE_ADMIN_REVIEW'
  | 'EMERGENCY_SHUTDOWN';

export type AlertSeverity = 'Information' | 'Warning' | 'Critical' | 'Emergency';

export type TrustBadge = '🟢 Trusted' | '🔵 Verified' | '🟡 Needs Review' | '🔴 High Risk';

export interface RuntimeTelemetry {
  timestamp: string;
  cpuUsagePct: number;
  ramUsageMb: number;
  storageUsageMb: number;
  diskReadKbps: number;
  diskWriteKbps: number;
  networkUploadKbps: number;
  networkDownloadKbps: number;
  networkTotalBandwidthMb: number;
  apiRequestsCount: number;
  databaseQueriesCount: number;
  websocketConnectionsCount: number;
  httpRequestsCount: number;
  fileOperationsCount: number;
  processCreationCount: number;
  runtimeErrorsCount: number;
  crashCount: number;
  restartCount: number;
  uptimeSeconds: number;
  activeUsers: number;
  activeGroups: number;
  messagesProcessed: number;
  messagesSent: number;
  messagesReceived: number;
  commandsExecuted: number;
  activePluginsCount: number;
  destinationEndpoints: string[];
}

export interface BehaviorBaseline {
  registeredAt: string;
  samplesCount: number;
  avgCpuUsagePct: number;
  avgRamUsageMb: number;
  avgStorageUsageMb: number;
  avgApiRequestsPerMin: number;
  avgMessagesPerMin: number;
  avgMessagesPerHour: number;
  avgMessagesPerDay: number;
  avgDatabaseQueriesPerMin: number;
  avgNetworkUploadKbps: number;
  avgNetworkDownloadKbps: number;
  avgActiveUsers: number;
  avgActiveGroups: number;
  avgPluginUsageCount: number;
  avgCommandUsagePerMin: number;
  avgErrorRatePct: number;
  avgRestartFrequencyPerDay: number;
  avgCrashFrequencyPerDay: number;
  avgFileOpsPerMin: number;
  avgWebhookRequestsPerMin: number;
  avgExternalApiRequestsPerMin: number;
  isBaselineEstablished: boolean;
}

export interface BehaviorTimelineEntry {
  id: string;
  timestamp: string;
  event: string;
  type: 'INFO' | 'WARNING' | 'ALERT' | 'POLICY' | 'SYSTEM' | 'DRIFT';
  details: string;
  severity: AlertSeverity;
}

export interface BehaviorAlert {
  id: string;
  timestamp: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  metric: string;
  currentValue: string;
  baselineValue: string;
  actionTaken?: string;
  resolved: boolean;
}

export interface SecurityPassportComparison {
  passportVersion: string;
  deploymentTimestamp: string;
  passportSecurityHash: string;
  drifts: {
    configurationDrift: { detected: boolean; details: string };
    behaviorDrift: { detected: boolean; details: string };
    resourceDrift: { detected: boolean; details: string };
    environmentDrift: { detected: boolean; details: string };
    securityDrift: { detected: boolean; details: string };
    runtimeDrift: { detected: boolean; details: string };
  };
  driftCount: number;
}

export interface InstanceBehaviorProfile {
  instanceId: string;
  instanceName: string;
  platform: string;
  category: BotCategory;
  protectionPolicy: ProtectionPolicy;
  status: 'running' | 'paused' | 'throttled' | 'isolated' | 'stopped';
  
  // Scores
  behaviorScorePct: number;    // e.g. 96%
  driftScorePct: number;       // e.g. 18%
  riskScorePct: number;        // e.g. 12%
  liveHealthScorePct: number;  // e.g. 98%
  reputationScorePct: number;  // e.g. 95/100
  confidenceScorePct: number;  // e.g. 99% (grows over time)
  trustBadge: TrustBadge;

  // Realtime & Baseline Data
  currentTelemetry: RuntimeTelemetry;
  baseline: BehaviorBaseline;
  timeline: BehaviorTimelineEntry[];
  alerts: BehaviorAlert[];
  recommendations: string[];
  passportComparison: SecurityPassportComparison;

  // Historical trend points
  history: {
    daily: { time: string; cpu: number; ram: number; msgs: number; risk: number }[];
    weekly: { time: string; cpu: number; ram: number; msgs: number; risk: number }[];
    monthly: { time: string; cpu: number; ram: number; msgs: number; risk: number }[];
  };
}

// ============================================================================
// VERSION 3 EXTENDED BEHAVIOR INTELLIGENCE TYPES
// ============================================================================

export interface UserProfileBehavior {
  userId: string;
  username: string;
  role: string;
  totalCommandsInvoked: number;
  favoriteCommands: string[];
  lastActiveAt: string;
  riskScorePct: number; // 0 - 100
  anomalyCount: number;
  trustLevel: 'HIGH' | 'MEDIUM' | 'LOW' | 'SUSPICIOUS';
}

export interface OrganizationBehaviorProfile {
  orgId: string;
  orgName: string;
  totalActiveInstances: number;
  aggregateCpuUsagePct: number;
  aggregateRamUsageMb: number;
  overallRiskScorePct: number;
  activeProtectionPolicies: Record<string, number>;
  topAlertingInstances: string[];
}

export interface BehavioralPattern {
  id: string;
  patternName: string;
  category: string;
  frequency: number;
  confidenceScore: number;
  description: string;
  detectedAt: string;
}

export interface TrendAnalysis {
  metric: string;
  direction: 'UPWARD' | 'DOWNWARD' | 'STABLE' | 'VOLATILE';
  slopePct: number;
  confidence: number;
  summary: string;
}

export interface PredictedBehavior {
  timeframe: string;
  predictedCpuPct: number;
  predictedRamMb: number;
  predictedMessagesCount: number;
  predictedRiskScorePct: number;
  forecastConfidencePct: number;
}

export interface AnomalyReport {
  instanceId: string;
  zScore: number;
  isAnomalous: boolean;
  affectedMetrics: string[];
  timestamp: string;
  details: string;
}

export interface BehaviorRule {
  id: string;
  name: string;
  conditionMetric: 'CPU' | 'RAM' | 'MESSAGES' | 'ERRORS' | 'RISK_SCORE';
  operator: '>' | '<' | '==' | '>=';
  threshold: number;
  action: ProtectionPolicy;
  enabled: boolean;
}

export interface ExecutedRuleAction {
  ruleId: string;
  ruleName: string;
  instanceId: string;
  triggeredAt: string;
  actionTaken: ProtectionPolicy;
}

export interface CrossServiceBehaviorAnalysis {
  analyzedInstancesCount: number;
  cascadingRiskDetected: boolean;
  sharedEndpointAnomalies: string[];
  systemicDriftPercentage: number;
  clusterHealthSummary: string;
}

export interface AILearningMetrics {
  totalPatternsDetected: number;
  anomalyAccuracyRatePct: number;
  feedbackApprovalRatePct: number;
  ruleEvaluationCount: number;
  lastModelRefinementAt: string;
}

// Global SSE Event Listeners for Behavior Engine
type BehaviorEventListener = (event: { type: string; payload: any }) => void;
const behaviorListeners: Set<BehaviorEventListener> = new Set();

export function subscribeBehaviorEvents(listener: BehaviorEventListener) {
  behaviorListeners.add(listener);
  return () => {
    behaviorListeners.delete(listener);
  };
}

export function emitBehaviorEvent(eventType: string, payload: any) {
  behaviorListeners.forEach((listener) => {
    try {
      listener({ type: eventType, payload });
    } catch (e) {
      console.error('Error emitting behavior event:', e);
    }
  });
}

// ----------------------------------------------------
// IN-MEMORY BEHAVIOR ENGINE REGISTRY
// ----------------------------------------------------
class BehaviorLearningEngine {
  private static instance: BehaviorLearningEngine;
  private profiles: Map<string, InstanceBehaviorProfile> = new Map();
  private userProfiles: Map<string, UserProfileBehavior> = new Map();
  private customRules: Map<string, BehaviorRule> = new Map();
  private telemetryTimer: NodeJS.Timeout | null = null;
  private learningMetrics: AILearningMetrics = {
    totalPatternsDetected: 14,
    anomalyAccuracyRatePct: 98.4,
    feedbackApprovalRatePct: 95.0,
    ruleEvaluationCount: 1240,
    lastModelRefinementAt: new Date().toISOString()
  };

  private constructor() {
    this.initializeDefaultInstances();
    this.initializeDefaultUserProfiles();
    this.initializeDefaultRules();
    this.startTelemetryLoop();
  }

  public static getInstance(): BehaviorLearningEngine {
    if (!BehaviorLearningEngine.instance) {
      BehaviorLearningEngine.instance = new BehaviorLearningEngine();
    }
    return BehaviorLearningEngine.instance;
  }

  private initializeDefaultUserProfiles() {
    this.userProfiles.set('usr-admin-1', {
      userId: 'usr-admin-1',
      username: 'System Administrator',
      role: 'SuperAdmin',
      totalCommandsInvoked: 342,
      favoriteCommands: ['.restart', '.status', '.deploy', '.logs'],
      lastActiveAt: new Date().toISOString(),
      riskScorePct: 2,
      anomalyCount: 0,
      trustLevel: 'HIGH'
    });

    this.userProfiles.set('usr-operator-2', {
      userId: 'usr-operator-2',
      username: 'DevOps Operator',
      role: 'Operator',
      totalCommandsInvoked: 128,
      favoriteCommands: ['.scale', '.config', '.pause'],
      lastActiveAt: new Date(Date.now() - 3600000).toISOString(),
      riskScorePct: 8,
      anomalyCount: 1,
      trustLevel: 'HIGH'
    });
  }

  private initializeDefaultRules() {
    const defaultRules: BehaviorRule[] = [
      {
        id: 'rule-cpu-critical',
        name: 'Auto-Throttle CPU Spikes > 85%',
        conditionMetric: 'CPU',
        operator: '>',
        threshold: 85,
        action: 'AUTOMATIC_THROTTLING',
        enabled: true
      },
      {
        id: 'rule-risk-high',
        name: 'Isolate High Risk Instances > 75%',
        conditionMetric: 'RISK_SCORE',
        operator: '>',
        threshold: 75,
        action: 'AUTOMATIC_ISOLATION',
        enabled: true
      }
    ];
    defaultRules.forEach(r => this.customRules.set(r.id, r));
  }

  // Pre-register existing bots from DatabaseService or create demo profiles
  private initializeDefaultInstances() {
    const dbService = DatabaseService.getInstance();
    const db = dbService.read();

    const bots = db.bots && db.bots.length > 0 ? db.bots : [
      { id: 'bot-1', name: 'GURU-WA-BOT', platform: 'WhatsApp', status: 'running', prefix: '.' },
      { id: 'bot-2', name: 'TELEGRAM-ASSISTANT', platform: 'Telegram', status: 'running', prefix: '/' },
      { id: 'bot-3', name: 'DISCORD-MODERATOR', platform: 'Discord', status: 'running', prefix: '!' },
      { id: 'bot-4', name: 'SLACK-INTEGRATION', platform: 'Slack', status: 'stopped', prefix: '!' }
    ];

    bots.forEach((bot) => {
      this.registerInstance(bot.id, bot.name, bot.platform || 'WhatsApp', bot.status as any || 'running');
    });
  }

  // Register a newly deployed or existing instance
  public registerInstance(
    instanceId: string, 
    instanceName: string, 
    platform: string = 'WhatsApp',
    initialStatus: 'running' | 'paused' | 'throttled' | 'isolated' | 'stopped' = 'running',
    categoryOverride?: BotCategory
  ): InstanceBehaviorProfile {
    const now = new Date().toISOString();

    // Determine default Bot Category
    let category: BotCategory = categoryOverride || 'AI Assistant';
    if (instanceName.toLowerCase().includes('tele') || instanceName.toLowerCase().includes('group')) {
      category = 'Group Management Bot';
    } else if (instanceName.toLowerCase().includes('mod') || instanceName.toLowerCase().includes('discord')) {
      category = 'Moderation Bot';
    } else if (instanceName.toLowerCase().includes('dl') || instanceName.toLowerCase().includes('media')) {
      category = 'Downloader Bot';
    }

    const initialTelemetry: RuntimeTelemetry = {
      timestamp: now,
      cpuUsagePct: 12.4,
      ramUsageMb: 248,
      storageUsageMb: 850,
      diskReadKbps: 42,
      diskWriteKbps: 18,
      networkUploadKbps: 120,
      networkDownloadKbps: 340,
      networkTotalBandwidthMb: 45.2,
      apiRequestsCount: 18,
      databaseQueriesCount: 24,
      websocketConnectionsCount: 3,
      httpRequestsCount: 15,
      fileOperationsCount: 6,
      processCreationCount: 1,
      runtimeErrorsCount: 0,
      crashCount: 0,
      restartCount: 0,
      uptimeSeconds: 3600,
      activeUsers: 142,
      activeGroups: 18,
      messagesProcessed: 1280,
      messagesSent: 640,
      messagesReceived: 640,
      commandsExecuted: 320,
      activePluginsCount: 5,
      destinationEndpoints: [
        'api.telegram.org',
        'graph.facebook.com',
        'generativelanguage.googleapis.com',
        'redis.guru.internal'
      ]
    };

    const initialBaseline: BehaviorBaseline = {
      registeredAt: now,
      samplesCount: 48,
      avgCpuUsagePct: 11.8,
      avgRamUsageMb: 235,
      avgStorageUsageMb: 820,
      avgApiRequestsPerMin: 15,
      avgMessagesPerMin: 12,
      avgMessagesPerHour: 720,
      avgMessagesPerDay: 17280,
      avgDatabaseQueriesPerMin: 20,
      avgNetworkUploadKbps: 110,
      avgNetworkDownloadKbps: 300,
      avgActiveUsers: 150,
      avgActiveGroups: 15,
      avgPluginUsageCount: 5,
      avgCommandUsagePerMin: 6,
      avgErrorRatePct: 0.2,
      avgRestartFrequencyPerDay: 0.1,
      avgCrashFrequencyPerDay: 0,
      avgFileOpsPerMin: 4,
      avgWebhookRequestsPerMin: 2,
      avgExternalApiRequestsPerMin: 10,
      isBaselineEstablished: true
    };

    const initialTimeline: BehaviorTimelineEntry[] = [
      {
        id: `tl-${Date.now()}-1`,
        timestamp: new Date(Date.now() - 3600000).toLocaleTimeString(),
        event: 'Deployment Registered',
        type: 'SYSTEM',
        details: `Instance "${instanceName}" registered with Behavior Learning Engine. Assigned category: ${category}.`,
        severity: 'Information'
      },
      {
        id: `tl-${Date.now()}-2`,
        timestamp: new Date(Date.now() - 1800000).toLocaleTimeString(),
        event: 'Behavior Baseline Established',
        type: 'SYSTEM',
        details: 'Constructed initial 48-sample behavior baseline. Telemetry monitoring active.',
        severity: 'Information'
      }
    ];

    const initialPassportComparison: SecurityPassportComparison = {
      passportVersion: 'v3.5.0-SECURE',
      deploymentTimestamp: now,
      passportSecurityHash: `SEC-HASH-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
      drifts: {
        configurationDrift: { detected: false, details: 'Environment variables & runtime flags match Security Passport.' },
        behaviorDrift: { detected: false, details: 'Messaging rate and API frequency within nominal limits.' },
        resourceDrift: { detected: false, details: 'RAM allocation (248MB/512MB) and CPU (<15%) within bounds.' },
        environmentDrift: { detected: false, details: 'Zero untrusted external environment variable overrides.' },
        securityDrift: { detected: false, details: 'Zero process injection or unauthorized file write signatures.' },
        runtimeDrift: { detected: false, details: 'Process tree stable with 1 Node.js worker thread.' }
      },
      driftCount: 0
    };

    // Construct profile
    const profile: InstanceBehaviorProfile = {
      instanceId,
      instanceName,
      platform,
      category,
      protectionPolicy: 'AUTOMATIC_THROTTLING',
      status: initialStatus,
      behaviorScorePct: 96,
      driftScorePct: 8,
      riskScorePct: 10,
      liveHealthScorePct: 98,
      reputationScorePct: 97,
      confidenceScorePct: 95,
      trustBadge: '🟢 Trusted',
      currentTelemetry: initialTelemetry,
      baseline: initialBaseline,
      timeline: initialTimeline,
      alerts: [],
      recommendations: [
        'Optimal telemetry performance observed. Maintain current resource caps.',
        'Consider enabling automated rate-limiting if active group joins exceed 50/hr.',
        'Continuous AI token usage stable across Gemini API endpoints.'
      ],
      passportComparison: initialPassportComparison,
      history: this.generateHistoricalData()
    };

    this.profiles.set(instanceId, profile);

    emitBehaviorEvent('behavior.started', {
      instanceId,
      instanceName,
      trustBadge: profile.trustBadge,
      confidenceScorePct: profile.confidenceScorePct
    });

    return profile;
  }

  // Generate realistic historical time-series graphs
  private generateHistoricalData() {
    const daily = [];
    const weekly = [];
    const monthly = [];

    const now = Date.now();
    for (let i = 24; i >= 0; i--) {
      const t = new Date(now - i * 3600000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      daily.push({
        time: t,
        cpu: Math.round(10 + Math.sin(i / 3) * 8 + Math.random() * 4),
        ram: Math.round(220 + Math.cos(i / 2) * 30 + Math.random() * 10),
        msgs: Math.round(45 + Math.sin(i / 4) * 25 + Math.random() * 15),
        risk: Math.round(8 + Math.sin(i / 5) * 4)
      });
    }

    for (let i = 7; i >= 0; i--) {
      const t = `Day -${i}`;
      weekly.push({
        time: t,
        cpu: Math.round(12 + Math.random() * 6),
        ram: Math.round(230 + Math.random() * 25),
        msgs: Math.round(600 + Math.random() * 200),
        risk: Math.round(9 + Math.random() * 5)
      });
    }

    for (let i = 12; i >= 0; i--) {
      const t = `Month -${i}`;
      monthly.push({
        time: t,
        cpu: Math.round(14 + Math.random() * 8),
        ram: Math.round(240 + Math.random() * 35),
        msgs: Math.round(18000 + Math.random() * 5000),
        risk: Math.round(10 + Math.random() * 6)
      });
    }

    return { daily, weekly, monthly };
  }

  // Get all registered instance profiles
  public getAllProfiles(): InstanceBehaviorProfile[] {
    return Array.from(this.profiles.values());
  }

  // Get single instance behavior profile
  public getProfile(instanceId: string): InstanceBehaviorProfile | undefined {
    return this.profiles.get(instanceId);
  }

  // Update Protection Policy
  public setProtectionPolicy(instanceId: string, policy: ProtectionPolicy): InstanceBehaviorProfile | undefined {
    const profile = this.profiles.get(instanceId);
    if (!profile) return undefined;

    profile.protectionPolicy = policy;
    const nowTime = new Date().toLocaleTimeString();

    profile.timeline.unshift({
      id: `tl-${Date.now()}`,
      timestamp: nowTime,
      event: 'Protection Policy Updated',
      type: 'POLICY',
      details: `Administrator changed active protection policy to "${policy}".`,
      severity: 'Information'
    });

    emitBehaviorEvent('behavior.updated', {
      instanceId,
      event: 'policy_change',
      policy,
      profile
    });

    return profile;
  }

  // Continuous Telemetry Simulation Loop (Updates metrics dynamically)
  private startTelemetryLoop() {
    if (this.telemetryTimer) clearInterval(this.telemetryTimer);

    this.telemetryTimer = setInterval(() => {
      this.profiles.forEach((profile, id) => {
        if (profile.status === 'stopped') return;

        // Fluctuating metric updates
        const telemetry = profile.currentTelemetry;
        const baseline = profile.baseline;

        // Random organic variance
        const cpuNoise = (Math.random() - 0.48) * 3;
        const ramNoise = (Math.random() - 0.48) * 8;
        const msgsNoise = Math.floor((Math.random() - 0.45) * 5);

        telemetry.cpuUsagePct = Math.max(2, Math.min(98, parseFloat((telemetry.cpuUsagePct + cpuNoise).toFixed(1))));
        telemetry.ramUsageMb = Math.max(120, Math.min(1024, Math.round(telemetry.ramUsageMb + ramNoise)));
        telemetry.messagesProcessed += Math.max(0, msgsNoise + 2);
        telemetry.messagesSent += Math.max(0, Math.floor((msgsNoise + 2) / 2));
        telemetry.messagesReceived += Math.max(0, Math.ceil((msgsNoise + 2) / 2));
        telemetry.uptimeSeconds += 10;
        telemetry.timestamp = new Date().toISOString();

        // Increment baseline samples & confidence score
        baseline.samplesCount += 1;
        profile.confidenceScorePct = Math.min(99, Math.round(75 + Math.sqrt(baseline.samplesCount) * 2.5));

        // Evaluate Behavior Drift
        let driftCount = 0;
        let riskScore = 8;
        const alerts: BehaviorAlert[] = [];

        // Check CPU Drift
        if (telemetry.cpuUsagePct > baseline.avgCpuUsagePct * 2.5 && telemetry.cpuUsagePct > 50) {
          driftCount++;
          riskScore += 25;
          alerts.push({
            id: `alt-${Date.now()}-cpu`,
            timestamp: new Date().toLocaleTimeString(),
            title: 'High CPU Usage Spike Detected',
            description: `CPU utilization (${telemetry.cpuUsagePct}%) significantly exceeds baseline average (${baseline.avgCpuUsagePct}%).`,
            severity: telemetry.cpuUsagePct > 80 ? 'Critical' : 'Warning',
            metric: 'CPU',
            currentValue: `${telemetry.cpuUsagePct}%`,
            baselineValue: `${baseline.avgCpuUsagePct}%`,
            actionTaken: profile.protectionPolicy === 'AUTOMATIC_THROTTLING' ? 'Throttled CPU thread execution cap.' : 'Monitored',
            resolved: false
          });
        }

        // Check Memory Drift
        if (telemetry.ramUsageMb > baseline.avgRamUsageMb * 1.8 && telemetry.ramUsageMb > 400) {
          driftCount++;
          riskScore += 20;
          alerts.push({
            id: `alt-${Date.now()}-ram`,
            timestamp: new Date().toLocaleTimeString(),
            title: 'Memory Allocation Drift Detected',
            description: `RAM usage (${telemetry.ramUsageMb} MB) exceeds baseline expectation (${baseline.avgRamUsageMb} MB). Potential memory leak risk.`,
            severity: 'Warning',
            metric: 'RAM',
            currentValue: `${telemetry.ramUsageMb} MB`,
            baselineValue: `${baseline.avgRamUsageMb} MB`,
            actionTaken: 'Garbage collection hint dispatched.',
            resolved: false
          });
        }

        // Calculate scores
        profile.driftScorePct = Math.min(95, driftCount * 22 + Math.round(Math.abs(telemetry.cpuUsagePct - baseline.avgCpuUsagePct)));
        profile.riskScorePct = Math.min(95, riskScore);
        profile.behaviorScorePct = Math.max(15, 100 - profile.driftScorePct);
        profile.liveHealthScorePct = Math.max(20, Math.min(100, Math.round(100 - profile.riskScorePct * 0.5 - profile.driftScorePct * 0.3)));
        profile.reputationScorePct = Math.max(30, Math.min(100, Math.round(100 - profile.riskScorePct * 0.4)));

        // Update Trust Badge dynamically
        let newBadge: TrustBadge = '🟢 Trusted';
        if (profile.riskScorePct >= 65 || profile.driftScorePct >= 60) {
          newBadge = '🔴 High Risk';
        } else if (profile.riskScorePct >= 35 || profile.driftScorePct >= 30) {
          newBadge = '🟡 Needs Review';
        } else if (profile.confidenceScorePct >= 85) {
          newBadge = '🟢 Trusted';
        } else {
          newBadge = '🔵 Verified';
        }

        if (profile.trustBadge !== newBadge) {
          profile.trustBadge = newBadge;
          profile.timeline.unshift({
            id: `tl-${Date.now()}-badge`,
            timestamp: new Date().toLocaleTimeString(),
            event: 'Trust Badge Updated',
            type: 'ALERT',
            details: `Trust badge re-evaluated to "${newBadge}" based on behavior drift recalculation.`,
            severity: newBadge === '🔴 High Risk' ? 'Critical' : newBadge === '🟡 Needs Review' ? 'Warning' : 'Information'
          });

          emitBehaviorEvent('behavior.trust_updated', {
            instanceId: profile.instanceId,
            trustBadge: newBadge,
            riskScorePct: profile.riskScorePct
          });
        }

        // Merge alerts
        if (alerts.length > 0) {
          profile.alerts = [...alerts, ...profile.alerts].slice(0, 10);
          emitBehaviorEvent('behavior.warning', {
            instanceId: profile.instanceId,
            alerts
          });
        }

        // Evaluate Rules
        this.evaluateRules(profile.instanceId);

        // Broadcast telemetry update event
        emitBehaviorEvent('behavior.updated', {
          instanceId: profile.instanceId,
          telemetry,
          scores: {
            behaviorScorePct: profile.behaviorScorePct,
            driftScorePct: profile.driftScorePct,
            riskScorePct: profile.riskScorePct,
            liveHealthScorePct: profile.liveHealthScorePct,
            confidenceScorePct: profile.confidenceScorePct,
            trustBadge: profile.trustBadge
          }
        });
      });
    }, 8000); // Pulse every 8 seconds
  }

  // Trigger simulated spike/drift for live testing
  public simulateSpike(instanceId: string, spikeType: 'CPU_SPIKE' | 'BROADCAST_FLOOD' | 'MEMORY_LEAK' | 'SUSPICIOUS_NETWORK'): InstanceBehaviorProfile | undefined {
    const profile = this.profiles.get(instanceId);
    if (!profile) return undefined;

    const nowTime = new Date().toLocaleTimeString();

    if (spikeType === 'CPU_SPIKE') {
      profile.currentTelemetry.cpuUsagePct = 94.8;
      profile.timeline.unshift({
        id: `tl-${Date.now()}-spike`,
        timestamp: nowTime,
        event: 'Simulated CPU Spike Triggered',
        type: 'DRIFT',
        details: 'Forced runtime CPU load simulation (94.8% utilization). Behavior engine observing process isolation.',
        severity: 'Critical'
      });
    } else if (spikeType === 'BROADCAST_FLOOD') {
      profile.currentTelemetry.messagesProcessed += 8500;
      profile.currentTelemetry.networkUploadKbps = 1450;
      profile.timeline.unshift({
        id: `tl-${Date.now()}-flood`,
        timestamp: nowTime,
        event: 'Mass Broadcast Message Flood Detected',
        type: 'ALERT',
        details: 'Outbound messaging rate spiked to 850 msgs/min across 42 active groups. Rate limiting evaluated.',
        severity: 'Critical'
      });
    } else if (spikeType === 'MEMORY_LEAK') {
      profile.currentTelemetry.ramUsageMb = 890;
      profile.timeline.unshift({
        id: `tl-${Date.now()}-mem`,
        timestamp: nowTime,
        event: 'RAM Memory Allocation Overflow',
        type: 'DRIFT',
        details: 'RAM usage increased from 248MB to 890MB in 30 seconds. Unreleased buffer heap detected.',
        severity: 'Warning'
      });
    } else if (spikeType === 'SUSPICIOUS_NETWORK') {
      profile.currentTelemetry.destinationEndpoints.push('unverified-proxy-node.xyz');
      profile.timeline.unshift({
        id: `tl-${Date.now()}-net`,
        timestamp: nowTime,
        event: 'Unknown External Endpoint Connection',
        type: 'ALERT',
        details: 'Connection attempt to unverified proxy node "unverified-proxy-node.xyz" intercepted.',
        severity: 'Critical'
      });
    }

    emitBehaviorEvent('behavior.drift_detected', {
      instanceId,
      spikeType,
      profile
    });

    return profile;
  }

  // ============================================================================
  // VERSION 3 EXTENDED BEHAVIOR INTELLIGENCE ENGINE METHODS
  // ============================================================================

  public getUserProfile(userId: string): UserProfileBehavior | undefined {
    return this.userProfiles.get(userId);
  }

  public getAllUserProfiles(): UserProfileBehavior[] {
    return Array.from(this.userProfiles.values());
  }

  public getOrganizationProfile(orgId: string = 'default-org'): OrganizationBehaviorProfile {
    const profiles = this.getAllProfiles();
    const activeProfiles = profiles.filter(p => p.status !== 'stopped');

    const totalCpu = activeProfiles.reduce((acc, p) => acc + p.currentTelemetry.cpuUsagePct, 0);
    const totalRam = activeProfiles.reduce((acc, p) => acc + p.currentTelemetry.ramUsageMb, 0);
    const totalRisk = activeProfiles.reduce((acc, p) => acc + p.riskScorePct, 0);

    const policies: Record<string, number> = {};
    profiles.forEach(p => {
      policies[p.protectionPolicy] = (policies[p.protectionPolicy] || 0) + 1;
    });

    return {
      orgId,
      orgName: 'GURU-XD Enterprise System',
      totalActiveInstances: activeProfiles.length,
      aggregateCpuUsagePct: activeProfiles.length > 0 ? parseFloat((totalCpu / activeProfiles.length).toFixed(1)) : 0,
      aggregateRamUsageMb: activeProfiles.length > 0 ? Math.round(totalRam / activeProfiles.length) : 0,
      overallRiskScorePct: activeProfiles.length > 0 ? Math.round(totalRisk / activeProfiles.length) : 0,
      activeProtectionPolicies: policies,
      topAlertingInstances: profiles.filter(p => p.riskScorePct > 20).map(p => p.instanceName)
    };
  }

  public detectPatterns(instanceId: string): BehavioralPattern[] {
    const profile = this.profiles.get(instanceId);
    if (!profile) return [];

    const patterns: BehavioralPattern[] = [];
    const now = new Date().toISOString();

    if (profile.currentTelemetry.cpuUsagePct > 30) {
      patterns.push({
        id: `pat-cpu-${Date.now()}`,
        patternName: 'Cyclic Heavy CPU Consumption Pattern',
        category: 'Performance',
        frequency: 4,
        confidenceScore: 0.92,
        description: `Instance ${profile.instanceName} exhibits periodic CPU spikes correlated with payload parsing.`,
        detectedAt: now
      });
    }

    if (profile.currentTelemetry.messagesProcessed > 5000) {
      patterns.push({
        id: `pat-msg-${Date.now()}`,
        patternName: 'High Message Throughput Pattern',
        category: 'Traffic',
        frequency: 12,
        confidenceScore: 0.98,
        description: `Instance ${profile.instanceName} processes high volume group interactions during peak hours.`,
        detectedAt: now
      });
    }

    return patterns;
  }

  public analyzeTrends(instanceId: string): TrendAnalysis {
    const profile = this.profiles.get(instanceId);
    if (!profile) {
      return { metric: 'Overall Health', direction: 'STABLE', slopePct: 0, confidence: 0.5, summary: 'No profile found.' };
    }

    const cpuSlope = profile.currentTelemetry.cpuUsagePct - profile.baseline.avgCpuUsagePct;
    const direction = cpuSlope > 5 ? 'UPWARD' : cpuSlope < -5 ? 'DOWNWARD' : 'STABLE';

    return {
      metric: 'CPU & Resource Utilization',
      direction,
      slopePct: parseFloat(cpuSlope.toFixed(1)),
      confidence: 0.94,
      summary: `Current telemetry displays ${direction.toLowerCase()} slope relative to baseline standard.`
    };
  }

  public predictBehavior(instanceId: string, hoursAhead: number = 6): PredictedBehavior {
    const profile = this.profiles.get(instanceId);
    const cpu = profile ? profile.currentTelemetry.cpuUsagePct : 12;
    const ram = profile ? profile.currentTelemetry.ramUsageMb : 250;

    return {
      timeframe: `Next ${hoursAhead} Hours`,
      predictedCpuPct: parseFloat(Math.min(95, cpu * 1.05).toFixed(1)),
      predictedRamMb: Math.round(ram * 1.02),
      predictedMessagesCount: Math.round((profile?.currentTelemetry.messagesProcessed || 1000) * 1.1),
      predictedRiskScorePct: profile ? profile.riskScorePct : 10,
      forecastConfidencePct: 91.5
    };
  }

  public evaluateAnomaly(instanceId: string): AnomalyReport {
    const profile = this.profiles.get(instanceId);
    if (!profile) {
      return { instanceId, zScore: 0, isAnomalous: false, affectedMetrics: [], timestamp: new Date().toISOString(), details: 'Instance not found' };
    }

    const cpuDiff = Math.abs(profile.currentTelemetry.cpuUsagePct - profile.baseline.avgCpuUsagePct);
    const zScore = parseFloat((cpuDiff / 5.0).toFixed(2));
    const isAnomalous = zScore > 2.5;

    return {
      instanceId,
      zScore,
      isAnomalous,
      affectedMetrics: isAnomalous ? ['CPU'] : [],
      timestamp: new Date().toISOString(),
      details: isAnomalous ? `Metric CPU deviates by z-score of ${zScore}` : 'Telemetry within normal variance bounds.'
    };
  }

  public addCustomRule(rule: BehaviorRule): BehaviorRule {
    this.customRules.set(rule.id, rule);
    return rule;
  }

  public getCustomRules(): BehaviorRule[] {
    return Array.from(this.customRules.values());
  }

  public evaluateRules(instanceId: string): ExecutedRuleAction[] {
    const profile = this.profiles.get(instanceId);
    if (!profile) return [];

    const executed: ExecutedRuleAction[] = [];
    this.learningMetrics.ruleEvaluationCount += 1;

    this.customRules.forEach(rule => {
      if (!rule.enabled) return;
      let val = 0;
      if (rule.conditionMetric === 'CPU') val = profile.currentTelemetry.cpuUsagePct;
      if (rule.conditionMetric === 'RAM') val = profile.currentTelemetry.ramUsageMb;
      if (rule.conditionMetric === 'RISK_SCORE') val = profile.riskScorePct;

      let triggered = false;
      if (rule.operator === '>' && val > rule.threshold) triggered = true;
      if (rule.operator === '<' && val < rule.threshold) triggered = true;
      if (rule.operator === '>=' && val >= rule.threshold) triggered = true;

      if (triggered) {
        executed.push({
          ruleId: rule.id,
          ruleName: rule.name,
          instanceId,
          triggeredAt: new Date().toISOString(),
          actionTaken: rule.action
        });
      }
    });

    return executed;
  }

  public getCrossServiceBehaviorAnalysis(): CrossServiceBehaviorAnalysis {
    const profiles = this.getAllProfiles();
    const highRiskCount = profiles.filter(p => p.riskScorePct > 50).length;

    return {
      analyzedInstancesCount: profiles.length,
      cascadingRiskDetected: highRiskCount >= 2,
      sharedEndpointAnomalies: ['api.telegram.org'],
      systemicDriftPercentage: parseFloat(((highRiskCount / (profiles.length || 1)) * 100).toFixed(1)),
      clusterHealthSummary: highRiskCount >= 2 
        ? 'Warning: Multiple bot nodes exhibiting correlated behavior drift across shared API gateways.' 
        : 'All modular services operating within independent, isolated safety profiles.'
    };
  }

  public getAILearningMetrics(): AILearningMetrics {
    return { ...this.learningMetrics };
  }
}

export const behaviorEngine = BehaviorLearningEngine.getInstance();
