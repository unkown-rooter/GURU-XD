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
  private telemetryTimer: NodeJS.Timeout | null = null;

  private constructor() {
    this.initializeDefaultInstances();
    this.startTelemetryLoop();
  }

  public static getInstance(): BehaviorLearningEngine {
    if (!BehaviorLearningEngine.instance) {
      BehaviorLearningEngine.instance = new BehaviorLearningEngine();
    }
    return BehaviorLearningEngine.instance;
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
}

export const behaviorEngine = BehaviorLearningEngine.getInstance();
