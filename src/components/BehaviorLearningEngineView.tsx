import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Brain, 
  ShieldAlert, 
  ShieldCheck, 
  Zap, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Sliders, 
  Cpu, 
  HardDrive, 
  Network, 
  RefreshCw, 
  Bell, 
  Radio, 
  FileText, 
  Server, 
  Lock, 
  Terminal, 
  Play, 
  Pause, 
  AlertOctagon, 
  Flame, 
  BarChart2, 
  Eye, 
  UserCheck, 
  Shield
} from 'lucide-react';

export interface InstanceBehaviorProfile {
  instanceId: string;
  instanceName: string;
  platform: string;
  category: string;
  protectionPolicy: string;
  status: 'running' | 'paused' | 'throttled' | 'isolated' | 'stopped';
  behaviorScorePct: number;
  driftScorePct: number;
  riskScorePct: number;
  liveHealthScorePct: number;
  reputationScorePct: number;
  confidenceScorePct: number;
  trustBadge: '🟢 Trusted' | '🔵 Verified' | '🟡 Needs Review' | '🔴 High Risk';
  currentTelemetry: {
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
  };
  baseline: {
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
  };
  timeline: {
    id: string;
    timestamp: string;
    event: string;
    type: 'INFO' | 'WARNING' | 'ALERT' | 'POLICY' | 'SYSTEM' | 'DRIFT';
    details: string;
    severity: 'Information' | 'Warning' | 'Critical' | 'Emergency';
  }[];
  alerts: {
    id: string;
    timestamp: string;
    title: string;
    description: string;
    severity: 'Information' | 'Warning' | 'Critical' | 'Emergency';
    metric: string;
    currentValue: string;
    baselineValue: string;
    actionTaken?: string;
    resolved: boolean;
  }[];
  recommendations: string[];
  passportComparison: {
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
  };
  history: {
    daily: { time: string; cpu: number; ram: number; msgs: number; risk: number }[];
    weekly: { time: string; cpu: number; ram: number; msgs: number; risk: number }[];
    monthly: { time: string; cpu: number; ram: number; msgs: number; risk: number }[];
  };
}

export default function BehaviorLearningEngineView() {
  const [profiles, setProfiles] = useState<InstanceBehaviorProfile[]>([]);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'telemetry' | 'drift' | 'timeline' | 'policy' | 'history'>('telemetry');
  const [loading, setLoading] = useState<boolean>(true);
  const [sseConnected, setSseConnected] = useState<boolean>(false);
  const [historyRange, setHistoryRange] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  // Fetch initial behavior profiles
  const fetchProfiles = async () => {
    try {
      const res = await fetch('/api/behavior/profiles');
      const data = await res.json();
      if (data.success && data.profiles) {
        setProfiles(data.profiles);
        if (!selectedInstanceId && data.profiles.length > 0) {
          setSelectedInstanceId(data.profiles[0].instanceId);
        }
      }
    } catch (err) {
      console.error('Failed to load behavior profiles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();

    // Setup SSE connection for real-time telemetry stream
    const eventSource = new EventSource('/api/behavior/events');
    eventSource.onopen = () => setSseConnected(true);
    eventSource.onerror = () => setSseConnected(false);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'behavior.updated') {
          setProfiles((prev) =>
            prev.map((p) => {
              if (p.instanceId === data.payload.instanceId) {
                return {
                  ...p,
                  currentTelemetry: { ...p.currentTelemetry, ...data.payload.telemetry },
                  ...data.payload.scores
                };
              }
              return p;
            })
          );
        } else if (data.type === 'behavior.drift_detected' || data.type === 'behavior.trust_updated') {
          fetchProfiles();
        }
      } catch (e) {
        // quiet error handle
      }
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const selectedProfile = profiles.find((p) => p.instanceId === selectedInstanceId) || profiles[0];

  const handleUpdatePolicy = async (policy: string) => {
    if (!selectedProfile) return;
    try {
      const res = await fetch(`/api/behavior/profile/${selectedProfile.instanceId}/policy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ policy })
      });
      const data = await res.json();
      if (data.success && data.profile) {
        setProfiles((prev) => prev.map((p) => (p.instanceId === data.profile.instanceId ? data.profile : p)));
      }
    } catch (err) {
      console.error('Failed to update policy:', err);
    }
  };

  const handleSimulateSpike = async (spikeType: string) => {
    if (!selectedProfile) return;
    try {
      const res = await fetch(`/api/behavior/profile/${selectedProfile.instanceId}/simulate-spike`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spikeType })
      });
      const data = await res.json();
      if (data.success && data.profile) {
        setProfiles((prev) => prev.map((p) => (p.instanceId === data.profile.instanceId ? data.profile : p)));
      }
    } catch (err) {
      console.error('Failed to simulate spike:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-slate-400 font-mono text-xs gap-3">
        <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
        <span>Initializing GURU-XD Behavior Learning Engine Telemetry Stream...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
                <Brain className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-slate-100 tracking-tight">Behavior Learning Engine</h1>
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-mono font-bold">
                    CONTINUOUS TELEMETRY MONITORING
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Autonomous post-deployment baseline learning, behavior drift detection, and real-time threat protection.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className={`w-2 h-2 rounded-full ${sseConnected ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`} />
              <span className="text-slate-300">{sseConnected ? 'Live Telemetry Active' : 'Polling Sync'}</span>
            </div>
            <button
              onClick={fetchProfiles}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors cursor-pointer"
              title="Refresh Telemetry"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Aggregate Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-6 pt-6 border-t border-slate-800/80 text-xs font-mono">
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[10px] text-slate-500 uppercase block">Active Instances</span>
            <span className="text-lg font-bold text-slate-100">{profiles.length} Nodes</span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[10px] text-slate-500 uppercase block">Global Confidence</span>
            <span className="text-lg font-bold text-emerald-400">
              {Math.round(profiles.reduce((acc, p) => acc + p.confidenceScorePct, 0) / (profiles.length || 1))}% High
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[10px] text-slate-500 uppercase block">Avg Behavior Score</span>
            <span className="text-lg font-bold text-blue-400">
              {Math.round(profiles.reduce((acc, p) => acc + p.behaviorScorePct, 0) / (profiles.length || 1))}% Normal
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[10px] text-slate-500 uppercase block">System Drift Index</span>
            <span className="text-lg font-bold text-indigo-300">
              {Math.round(profiles.reduce((acc, p) => acc + p.driftScorePct, 0) / (profiles.length || 1))}% Low
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 col-span-2 md:col-span-1">
            <span className="text-[10px] text-slate-500 uppercase block">Active Alert Flags</span>
            <span className="text-lg font-bold text-amber-400">
              {profiles.reduce((acc, p) => acc + p.alerts.length, 0)} Flags
            </span>
          </div>
        </div>
      </div>

      {/* Instance Selector Grid */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Server className="w-4 h-4 text-blue-400" />
          <span>Monitored Deployed Instances</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {profiles.map((profile) => {
            const isSelected = profile.instanceId === selectedInstanceId;
            return (
              <div
                key={profile.instanceId}
                onClick={() => setSelectedInstanceId(profile.instanceId)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 border-blue-500/80 ring-2 ring-blue-500/20 shadow-lg shadow-blue-500/10'
                    : 'bg-slate-950 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm text-slate-100 truncate">{profile.instanceName}</h3>
                      <span className="text-[10px] font-mono text-slate-400">{profile.platform} • {profile.category}</span>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-900 text-slate-200 border border-slate-700 font-mono font-bold shrink-0">
                    {profile.trustBadge}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3 text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-slate-500">Behavior Score</span>
                    <p className="font-bold text-emerald-400">{profile.behaviorScorePct}%</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500">Drift Score</span>
                    <p className="font-bold text-indigo-300">{profile.driftScorePct}%</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500">CPU Usage</span>
                    <p className="font-bold text-slate-200">{profile.currentTelemetry.cpuUsagePct}%</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500">RAM Usage</span>
                    <p className="font-bold text-slate-200">{profile.currentTelemetry.ramUsageMb} MB</p>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>Policy: <strong className="text-slate-300">{profile.protectionPolicy}</strong></span>
                  <span className="text-blue-400 font-bold">Inspect →</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Instance Deep Dive Panel */}
      {selectedProfile && (
        <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 space-y-6">
          {/* Header Bar for Selected Bot */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center font-mono font-bold text-indigo-400 text-lg">
                <Brain className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-bold text-slate-100">{selectedProfile.instanceName}</h2>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold">
                    {selectedProfile.trustBadge}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-300">
                    ID: {selectedProfile.instanceId}
                  </span>
                </div>
                <p className="text-xs font-mono text-slate-400 mt-0.5">
                  Category: <span className="text-slate-200 font-semibold">{selectedProfile.category}</span> | Platform: {selectedProfile.platform} | Policy: {selectedProfile.protectionPolicy}
                </p>
              </div>
            </div>

            {/* Core Score Gauges */}
            <div className="grid grid-cols-4 gap-2 font-mono text-center">
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[9px] text-slate-500 uppercase block">Behavior</span>
                <span className="text-sm font-bold text-emerald-400">{selectedProfile.behaviorScorePct}%</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[9px] text-slate-500 uppercase block">Drift</span>
                <span className="text-sm font-bold text-indigo-300">{selectedProfile.driftScorePct}%</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[9px] text-slate-500 uppercase block">Health</span>
                <span className="text-sm font-bold text-blue-400">{selectedProfile.liveHealthScorePct}%</span>
              </div>
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-[9px] text-slate-500 uppercase block">Confidence</span>
                <span className="text-sm font-bold text-slate-200">{selectedProfile.confidenceScorePct}%</span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto text-xs font-mono">
            {[
              { id: 'telemetry', label: 'Real-time Telemetry vs Baseline', icon: Cpu },
              { id: 'drift', label: 'Drift Radar & Security Passport', icon: ShieldCheck },
              { id: 'timeline', label: 'Timeline & Live Alerts', icon: Bell, badge: selectedProfile.alerts.length },
              { id: 'policy', label: 'Protection Policy & Simulation Sandbox', icon: Sliders },
              { id: 'history', label: 'Historical Telemetry Trends', icon: BarChart2 }
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-4 py-2 rounded-xl flex items-center gap-2 font-bold transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.badge !== undefined && tab.badge > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-amber-500/30 text-amber-300 text-[10px]">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab 1: Telemetry vs Baseline */}
          {activeTab === 'telemetry' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Real-time Telemetry Metrics List */}
                <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-4 font-mono text-xs">
                  <h3 className="font-bold text-slate-200 uppercase tracking-wider flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-emerald-400" />
                      <span>Live Runtime Telemetry</span>
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Baseline Samples: {selectedProfile.baseline.samplesCount}
                    </span>
                  </h3>

                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-slate-300 mb-1">
                        <span>CPU Utilization</span>
                        <span className="font-bold">{selectedProfile.currentTelemetry.cpuUsagePct}% (Baseline: {selectedProfile.baseline.avgCpuUsagePct}%)</span>
                      </div>
                      <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className={`h-full transition-all duration-500 ${
                            selectedProfile.currentTelemetry.cpuUsagePct > 50 ? 'bg-amber-400' : 'bg-emerald-400'
                          }`}
                          style={{ width: `${Math.min(100, selectedProfile.currentTelemetry.cpuUsagePct)}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-300 mb-1">
                        <span>RAM Memory Allocation</span>
                        <span className="font-bold">{selectedProfile.currentTelemetry.ramUsageMb} MB (Baseline: {selectedProfile.baseline.avgRamUsageMb} MB)</span>
                      </div>
                      <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className="h-full bg-blue-500 transition-all duration-500"
                          style={{ width: `${Math.min(100, (selectedProfile.currentTelemetry.ramUsageMb / 512) * 100)}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-300 mb-1">
                        <span>Network Bandwidth Speed</span>
                        <span className="font-bold">
                          ↑{selectedProfile.currentTelemetry.networkUploadKbps} KB/s | ↓{selectedProfile.currentTelemetry.networkDownloadKbps} KB/s
                        </span>
                      </div>
                      <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                        <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: '38%' }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-300 mb-1">
                        <span>Messaging Throughput</span>
                        <span className="font-bold">{selectedProfile.currentTelemetry.messagesProcessed} Msgs Processed</span>
                      </div>
                      <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                        <div className="h-full bg-teal-400 transition-all duration-500" style={{ width: '55%' }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Additional Telemetry Counters */}
                <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-4 font-mono text-xs">
                  <h3 className="font-bold text-slate-200 uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center gap-2">
                    <Server className="w-4 h-4 text-indigo-400" />
                    <span>Telemetry Operations Breakdown</span>
                  </h3>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl">
                      <span className="text-[10px] text-slate-500">API Requests</span>
                      <p className="font-bold text-slate-100 text-sm">{selectedProfile.currentTelemetry.apiRequestsCount} / min</p>
                    </div>
                    <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl">
                      <span className="text-[10px] text-slate-500">DB Queries</span>
                      <p className="font-bold text-slate-100 text-sm">{selectedProfile.currentTelemetry.databaseQueriesCount} / min</p>
                    </div>
                    <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl">
                      <span className="text-[10px] text-slate-500">Active Users</span>
                      <p className="font-bold text-slate-100 text-sm">{selectedProfile.currentTelemetry.activeUsers} Users</p>
                    </div>
                    <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl">
                      <span className="text-[10px] text-slate-500">Active Groups</span>
                      <p className="font-bold text-slate-100 text-sm">{selectedProfile.currentTelemetry.activeGroups} Groups</p>
                    </div>
                    <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl">
                      <span className="text-[10px] text-slate-500">Runtime Errors</span>
                      <p className="font-bold text-emerald-400 text-sm">{selectedProfile.currentTelemetry.runtimeErrorsCount} Errors</p>
                    </div>
                    <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl">
                      <span className="text-[10px] text-slate-500">Active Plugins</span>
                      <p className="font-bold text-slate-100 text-sm">{selectedProfile.currentTelemetry.activePluginsCount} Plugins</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Network Endpoints Observed */}
              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl font-mono text-xs space-y-2">
                <span className="font-bold text-slate-300 uppercase tracking-wider block">Observed Network Outbound Endpoints</span>
                <div className="flex flex-wrap gap-2">
                  {selectedProfile.currentTelemetry.destinationEndpoints.map((ep, idx) => (
                    <span key={idx} className="px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 text-indigo-300 flex items-center gap-1.5">
                      <Network className="w-3.5 h-3.5 text-indigo-400" />
                      <span>{ep}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Drift Radar & Security Passport */}
          {activeTab === 'drift' && (
            <div className="space-y-6">
              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl font-mono text-xs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-400" />
                      <span>Security Passport Drift Verification</span>
                    </h3>
                    <p className="text-slate-400 text-[11px]">
                      Continuously compares active runtime characteristics with the baseline Security Passport hash generated during deployment.
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-indigo-300 font-bold">
                    Hash: {selectedProfile.passportComparison.passportSecurityHash}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(selectedProfile.passportComparison.drifts).map(([key, val]) => (
                    <div key={key} className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-200 capitalize">{key.replace('Drift', ' Drift')}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${val.detected ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                          {val.detected ? 'DRIFT DETECTED' : 'PASSED (0 DRIFT)'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">{val.details}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Timeline & Alerts */}
          {activeTab === 'timeline' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-mono text-xs">
              {/* Timeline Log */}
              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-3">
                <h3 className="font-bold text-slate-200 uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span>Behavior Event Timeline</span>
                </h3>

                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {selectedProfile.timeline.map((entry) => (
                    <div key={entry.id} className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-200">{entry.event}</span>
                        <span className="text-[10px] text-slate-500">{entry.timestamp}</span>
                      </div>
                      <p className="text-slate-400 text-[11px]">{entry.details}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Active Alerts & Recommendations */}
              <div className="space-y-4">
                <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-3">
                  <h3 className="font-bold text-amber-400 uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>Active Telemetry Alerts ({selectedProfile.alerts.length})</span>
                  </h3>

                  {selectedProfile.alerts.length === 0 ? (
                    <p className="text-slate-500 text-xs py-4 text-center">Zero active behavioral warning flags.</p>
                  ) : (
                    <div className="space-y-2">
                      {selectedProfile.alerts.map((alt) => (
                        <div key={alt.id} className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-1 text-amber-200">
                          <div className="font-bold flex items-center justify-between">
                            <span>{alt.title}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20">{alt.severity}</span>
                          </div>
                          <p className="text-[11px] text-amber-300/80">{alt.description}</p>
                          {alt.actionTaken && (
                            <p className="text-[10px] text-slate-400 font-bold">Action Taken: {alt.actionTaken}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-2">
                  <h4 className="font-bold text-slate-200 uppercase tracking-wider border-b border-slate-800 pb-2">
                    Engine Recommendations
                  </h4>
                  <ul className="space-y-1.5 list-disc list-inside text-slate-300 text-[11px]">
                    {selectedProfile.recommendations.map((rec, idx) => (
                      <li key={idx}>{rec}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Protection Policy & Simulation Controls */}
          {activeTab === 'policy' && (
            <div className="space-y-6 font-mono text-xs">
              {/* Protection Policy Selector */}
              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-4">
                <h3 className="font-bold text-slate-200 uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-400" />
                  <span>Configured Protection Policy</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { id: 'MONITOR_ONLY', name: 'Monitor Only', desc: 'Observe telemetry and log drift events without restricting bot runtime.' },
                    { id: 'NOTIFY_ONLY', name: 'Notify Only', desc: 'Dispatch alerts to security dashboard and Slack webhooks.' },
                    { id: 'AUTOMATIC_THROTTLING', name: 'Automatic Throttling', desc: 'Cap CPU and rate-limit messaging upon detecting drift spikes.' },
                    { id: 'TEMPORARY_RATE_LIMITING', name: 'Rate Limiting', desc: 'Restrict external API requests and group broadcasting frequency.' },
                    { id: 'TEMPORARY_PAUSE', name: 'Temporary Pause', desc: 'Pause bot messaging thread while administrator investigates.' },
                    { id: 'AUTOMATIC_ISOLATION', name: 'Automatic Isolation', desc: 'Isolate container process into sandboxed quarantine network.' },
                    { id: 'REQUIRE_ADMIN_REVIEW', name: 'Require Review', desc: 'Halt automated commands until manual approval.' },
                    { id: 'EMERGENCY_SHUTDOWN', name: 'Emergency Shutdown', desc: 'Immediately terminate bot process container.' }
                  ].map((pol) => {
                    const isCurrent = selectedProfile.protectionPolicy === pol.id;
                    return (
                      <div
                        key={pol.id}
                        onClick={() => handleUpdatePolicy(pol.id)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer ${
                          isCurrent
                            ? 'bg-blue-600/20 border-blue-500 ring-1 ring-blue-500'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-slate-100">{pol.name}</span>
                          {isCurrent && <CheckCircle2 className="w-4 h-4 text-blue-400" />}
                        </div>
                        <p className="text-[10px] text-slate-400">{pol.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Simulation Sandbox Trigger Buttons */}
              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-3">
                <h3 className="font-bold text-amber-400 uppercase tracking-wider border-b border-slate-800 pb-2 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>Simulation Sandbox Testing Controls</span>
                </h3>
                <p className="text-slate-400 text-[11px]">
                  Trigger simulated telemetry anomalies to test the Behavior Learning Engine's real-time detection, score adjustments, and protection policy execution.
                </p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <button
                    onClick={() => handleSimulateSpike('CPU_SPIKE')}
                    className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 font-bold transition-colors cursor-pointer text-center"
                  >
                    Simulate CPU Spike (95%)
                  </button>
                  <button
                    onClick={() => handleSimulateSpike('BROADCAST_FLOOD')}
                    className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20 font-bold transition-colors cursor-pointer text-center"
                  >
                    Simulate Broadcast Flood
                  </button>
                  <button
                    onClick={() => handleSimulateSpike('MEMORY_LEAK')}
                    className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 hover:bg-blue-500/20 font-bold transition-colors cursor-pointer text-center"
                  >
                    Simulate RAM Memory Leak
                  </button>
                  <button
                    onClick={() => handleSimulateSpike('SUSPICIOUS_NETWORK')}
                    className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 hover:bg-rose-500/20 font-bold transition-colors cursor-pointer text-center"
                  >
                    Simulate Unknown Proxy Node
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab 5: Historical Telemetry Trends */}
          {activeTab === 'history' && (
            <div className="space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-blue-400" />
                  <span>Historical Telemetry Trends</span>
                </h3>

                <div className="flex items-center gap-2">
                  {(['daily', 'weekly', 'monthly'] as const).map((rng) => (
                    <button
                      key={rng}
                      onClick={() => setHistoryRange(rng)}
                      className={`px-3 py-1 rounded-lg uppercase font-bold text-[10px] transition-colors cursor-pointer ${
                        historyRange === rng ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {rng}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-3">
                  <span className="font-bold text-slate-300">CPU Usage History ({historyRange})</span>
                  <div className="h-40 flex items-end gap-1 pt-4">
                    {selectedProfile.history[historyRange].map((pt, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                        <div
                          className="w-full bg-blue-500 rounded-t transition-all hover:bg-blue-400"
                          style={{ height: `${Math.max(10, (pt.cpu / 100) * 120)}px` }}
                        />
                        <span className="text-[8px] text-slate-500 truncate w-full text-center">{pt.time}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-2xl space-y-3">
                  <span className="font-bold text-slate-300">RAM Allocation History ({historyRange})</span>
                  <div className="h-40 flex items-end gap-1 pt-4">
                    {selectedProfile.history[historyRange].map((pt, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                        <div
                          className="w-full bg-indigo-500 rounded-t transition-all hover:bg-indigo-400"
                          style={{ height: `${Math.max(10, (pt.ram / 512) * 120)}px` }}
                        />
                        <span className="text-[8px] text-slate-500 truncate w-full text-center">{pt.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
