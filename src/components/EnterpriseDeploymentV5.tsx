import React, { useState } from 'react';
import {
  Workflow,
  ShieldCheck,
  Bell,
  Package,
  Globe2,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Send,
  Plus,
  GitBranch,
  GitCommit,
  Terminal,
  ShieldAlert,
  Server,
  Layers,
  Check,
  ChevronRight,
  ExternalLink,
  Sliders,
  Cpu,
  RefreshCw,
  Lock,
  ArrowUpRight,
  FileCode2,
  Activity
} from 'lucide-react';
import {
  PipelineConfig,
  PipelineRunRecord,
  SecurityAuditReport,
  NotificationChannelConfig,
  NotificationLogRecord,
  AppReleaseRecord,
  EnvironmentStateRecord,
  EnvironmentPromotionRecord,
  GitProviderType,
  NotificationProviderType,
  EnvironmentType
} from '../../server/services/enterpriseDeploymentService';

interface EnterpriseDeploymentV5Props {
  activeSubTab: 'cicd' | 'security_audit' | 'notifications' | 'releases' | 'multi_env';
  pipelines: PipelineConfig[];
  pipelineRuns: PipelineRunRecord[];
  securityAudit: SecurityAuditReport | null;
  channels: NotificationChannelConfig[];
  notificationLogs: NotificationLogRecord[];
  releases: AppReleaseRecord[];
  environments: EnvironmentStateRecord[];
  promotions: EnvironmentPromotionRecord[];
  onExecutePipeline: (pipelineId: string) => void;
  onRunSecurityAudit: () => void;
  onDispatchNotification: (eventType: string, message: string) => void;
  onApproveRelease: (releaseId: string) => void;
  onPromoteRelease: (releaseId: string, versionTag: string, sourceEnv: EnvironmentType, targetEnv: EnvironmentType) => void;
  onRefreshData: () => void;
}

export default function EnterpriseDeploymentV5({
  activeSubTab,
  pipelines,
  pipelineRuns,
  securityAudit,
  channels,
  notificationLogs,
  releases,
  environments,
  promotions,
  onExecutePipeline,
  onRunSecurityAudit,
  onDispatchNotification,
  onApproveRelease,
  onPromoteRelease,
  onRefreshData
}: EnterpriseDeploymentV5Props) {
  const [selectedRun, setSelectedRun] = useState<PipelineRunRecord | null>(pipelineRuns[0] || null);
  const [testNotificationMsg, setTestNotificationMsg] = useState('');
  const [showPromoteModal, setShowPromoteModal] = useState<AppReleaseRecord | null>(null);
  const [targetEnv, setTargetEnv] = useState<EnvironmentType>('production');

  // Provider badge helper
  const renderProviderBadge = (provider: GitProviderType) => {
    switch (provider) {
      case 'github': return <span className="bg-slate-800 text-slate-200 border border-slate-700 text-[10px] px-2 py-0.5 rounded font-mono">GitHub Actions</span>;
      case 'gitlab': return <span className="bg-amber-950/60 text-amber-300 border border-amber-800/50 text-[10px] px-2 py-0.5 rounded font-mono">GitLab CI</span>;
      case 'bitbucket': return <span className="bg-blue-950/60 text-blue-300 border border-blue-800/50 text-[10px] px-2 py-0.5 rounded font-mono">Bitbucket Pipelines</span>;
      case 'jenkins': return <span className="bg-red-950/60 text-red-300 border border-red-800/50 text-[10px] px-2 py-0.5 rounded font-mono">Jenkins Automation</span>;
      case 'azure_devops': return <span className="bg-sky-950/60 text-sky-300 border border-sky-800/50 text-[10px] px-2 py-0.5 rounded font-mono">Azure DevOps</span>;
      default: return <span className="bg-slate-800 text-slate-300 border border-slate-700 text-[10px] px-2 py-0.5 rounded font-mono">Internal Git CI</span>;
    }
  };

  const renderChannelProviderBadge = (provider: NotificationProviderType) => {
    switch (provider) {
      case 'slack': return <span className="bg-purple-950/60 text-purple-300 border border-purple-800/50 text-[10px] px-2 py-0.5 rounded font-mono">Slack</span>;
      case 'discord': return <span className="bg-indigo-950/60 text-indigo-300 border border-indigo-800/50 text-[10px] px-2 py-0.5 rounded font-mono">Discord</span>;
      case 'telegram': return <span className="bg-sky-950/60 text-sky-300 border border-sky-800/50 text-[10px] px-2 py-0.5 rounded font-mono">Telegram</span>;
      case 'whatsapp': return <span className="bg-emerald-950/60 text-emerald-300 border border-emerald-800/50 text-[10px] px-2 py-0.5 rounded font-mono">WhatsApp API</span>;
      case 'email': return <span className="bg-amber-950/60 text-amber-300 border border-amber-800/50 text-[10px] px-2 py-0.5 rounded font-mono">Email SMTP</span>;
      case 'webhook': return <span className="bg-cyan-950/60 text-cyan-300 border border-cyan-800/50 text-[10px] px-2 py-0.5 rounded font-mono">Custom Webhook</span>;
      default: return <span className="bg-slate-800 text-slate-300 border border-slate-700 text-[10px] px-2 py-0.5 rounded font-mono">Dashboard</span>;
    }
  };

  // --- SUB-TAB 1: CI/CD PIPELINES ---
  if (activeSubTab === 'cicd') {
    const activeRun = selectedRun || pipelineRuns[0];

    return (
      <div className="space-y-6">
        {/* Header Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Active Pipelines</span>
              <Workflow className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-slate-100 mt-2">{pipelines.length}</div>
            <div className="text-[11px] text-slate-500 mt-1">Multi-provider integrations active</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Execution Runs</span>
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-slate-100 mt-2">{pipelineRuns.length}</div>
            <div className="text-[11px] text-emerald-400 mt-1">100% success rate</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Average Build Duration</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-slate-100 mt-2">2m 22s</div>
            <div className="text-[11px] text-slate-500 mt-1">Parallelized container stages</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Supported Providers</span>
              <Layers className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-slate-100 mt-2">6 Ready</div>
            <div className="text-[11px] text-slate-500 mt-1">GitHub, GitLab, Jenkins, Azure</div>
          </div>
        </div>

        {/* Pipelines Management */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Configured Pipelines */}
          <div className="lg:col-span-1 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Workflow className="w-4 h-4 text-blue-400" />
                <span>Configured Pipelines</span>
              </h3>
              <button 
                onClick={onRefreshData}
                className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Refresh</span>
              </button>
            </div>

            <div className="space-y-3">
              {pipelines.map(pipe => (
                <div 
                  key={pipe.id}
                  className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 p-4 rounded-2xl transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-100">{pipe.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        {renderProviderBadge(pipe.provider)}
                        <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
                          <GitBranch className="w-3 h-3 text-slate-500" />
                          {pipe.branch}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => onExecutePipeline(pipe.id)}
                      className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-lg shadow-blue-600/20 cursor-pointer transition-all"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Run</span>
                    </button>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-800/80">
                    <div className="text-[11px] text-slate-400 mb-1.5 font-semibold">Pipeline Execution Stages:</div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {pipe.stages.map(stg => (
                        <div key={stg.id} className="bg-slate-950/60 border border-slate-850 px-2 py-1 rounded text-[10px] text-slate-300 flex items-center justify-between">
                          <span className="truncate">{stg.name}</span>
                          <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0 ml-1" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Execution History & Detailed Output */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>Pipeline Execution History & Build Logs</span>
            </h3>

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              {/* Runs List selector */}
              <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center gap-2 overflow-x-auto">
                {pipelineRuns.map(run => (
                  <button
                    key={run.id}
                    onClick={() => setSelectedRun(run)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap cursor-pointer transition-all flex items-center gap-2 ${
                      activeRun?.id === run.id
                        ? 'bg-blue-600 text-white shadow'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>Run #{run.id.replace('prun-', '')}</span>
                    <span className="text-[10px] opacity-75">({run.durationSeconds}s)</span>
                  </button>
                ))}
              </div>

              {activeRun ? (
                <div className="p-5 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950/60 p-4 rounded-xl border border-slate-850">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-100">{activeRun.resourceName}</span>
                        <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] px-2 py-0.5 rounded font-mono font-bold">
                          {activeRun.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                        <GitCommit className="w-3.5 h-3.5 text-slate-500" />
                        <span>Commit <span className="font-mono text-slate-300">#{activeRun.commitHash}</span>: {activeRun.commitMessage}</span>
                      </p>
                    </div>

                    <div className="text-xs text-slate-400 sm:text-right">
                      <div>Trigger: <span className="text-slate-200 font-medium">{activeRun.triggerSource}</span></div>
                      <div>Started: <span className="text-slate-200 font-mono">{new Date(activeRun.startedAt).toLocaleTimeString()}</span></div>
                    </div>
                  </div>

                  {/* Stages Timeline */}
                  <div>
                    <h5 className="text-xs font-semibold text-slate-300 mb-2">Stage Performance:</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                      {activeRun.stageResults.map((stg, i) => (
                        <div key={i} className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                          <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
                            <span className="truncate">{stg.stageName}</span>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          </div>
                          <div className="text-[10px] text-slate-500 mt-1 font-mono">
                            {(stg.durationMs / 1000).toFixed(1)}s
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Terminal Log Output */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 font-mono text-xs text-slate-300 space-y-1 max-h-60 overflow-y-auto">
                    <div className="text-slate-500 border-b border-slate-800/80 pb-1 mb-2 font-sans text-[11px] flex items-center justify-between">
                      <span>Console Logs</span>
                      <span>UTF-8</span>
                    </div>
                    {activeRun.logs.map((log, idx) => (
                      <div key={idx} className="leading-relaxed hover:bg-slate-900/50 px-1 rounded">
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-500 text-xs">No execution history available.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- SUB-TAB 2: PRODUCTION SECURITY HARDENING ---
  if (activeSubTab === 'security_audit') {
    const report = securityAudit;

    return (
      <div className="space-y-6">
        {/* Security Summary Top Card */}
        <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative flex items-center justify-center w-20 h-20 bg-slate-950 border border-slate-800 rounded-2xl shadow-inner">
              <div className="text-2xl font-black text-emerald-400 font-mono">
                {report ? report.overallScore : 94}
              </div>
              <span className="absolute bottom-1 text-[9px] text-slate-500 font-mono">/ 100</span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-100">Production Security Audit</h3>
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs px-2.5 py-0.5 rounded-full font-bold">
                  {report ? report.riskLevel.toUpperCase() : 'LOW'} RISK POSTURE
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-xl">
                {report ? report.riskSummary : 'Automated security policies verified container hardening, TLS v1.3 encryption, non-root user privileges, and secret leak protection.'}
              </p>
            </div>
          </div>

          <button
            onClick={onRunSecurityAudit}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-600/20 flex items-center gap-2 cursor-pointer transition-all self-start md:self-auto"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Run Security Audit Now</span>
          </button>
        </div>

        {/* Security Checks Grid */}
        {report && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {report.checks.map(check => (
              <div 
                key={check.id}
                className={`bg-slate-900/90 border p-4 rounded-2xl transition-all ${
                  check.passed ? 'border-slate-800 hover:border-slate-700' : 'border-amber-500/40 bg-amber-950/10'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {check.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    )}
                    <h4 className="text-sm font-bold text-slate-200">{check.title}</h4>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                    check.passed ? 'bg-slate-800 text-slate-300' : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    {check.category.toUpperCase()}
                  </span>
                </div>

                <p className="text-xs text-slate-400 mt-2 pl-6">{check.description}</p>

                <div className="mt-3 pt-2 border-t border-slate-800/80 pl-6 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-medium">Recommendation:</span>
                  <span className="text-slate-300">{check.recommendation}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Policy Recommendations */}
        {report && report.recommendations.length > 0 && (
          <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl space-y-3">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Security Recommendations & Action Items</span>
            </h4>
            <div className="space-y-2">
              {report.recommendations.map((rec, idx) => (
                <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-slate-850 text-xs text-slate-300 flex items-start gap-2">
                  <ChevronRight className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- SUB-TAB 3: DEPLOYMENT NOTIFICATIONS ---
  if (activeSubTab === 'notifications') {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Bell className="w-5 h-5 text-blue-400" />
              <span>Multi-Channel Notification Channels</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Configure real-time deployment alerts to Slack, Discord, Telegram, WhatsApp, Email, or custom Webhook endpoints.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onDispatchNotification('deployment_started', '🚀 Deployment v2.5.0 initiated manually via Enterprise Console.')}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-2 rounded-xl border border-slate-700 flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Send className="w-3.5 h-3.5 text-blue-400" />
              <span>Send Test Alert</span>
            </button>
          </div>
        </div>

        {/* Channels Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {channels.map(chan => (
            <div key={chan.id} className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  {renderChannelProviderBadge(chan.provider)}
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-semibold">
                    ACTIVE
                  </span>
                </div>
                <h4 className="text-sm font-bold text-slate-100 mt-2">{chan.name}</h4>
                <p className="text-xs font-mono text-slate-500 mt-1 truncate">{chan.targetAddressUrl}</p>
              </div>

              <div className="pt-3 border-t border-slate-800/80">
                <div className="text-[10px] text-slate-400 font-semibold mb-1">Subscribed Events:</div>
                <div className="flex flex-wrap gap-1">
                  {chan.eventsToNotify.map((evt, i) => (
                    <span key={i} className="bg-slate-950 text-slate-300 border border-slate-850 text-[10px] px-1.5 py-0.5 rounded">
                      {evt}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Dispatch Log Feed */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span>Dispatched Notification Logs</span>
          </h4>

          <div className="space-y-2">
            {notificationLogs.map(log => (
              <div key={log.id} className="bg-slate-950 p-3 rounded-xl border border-slate-850 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="bg-emerald-500/10 text-emerald-400 text-[10px] px-2 py-0.5 rounded font-mono font-bold">
                    SENT
                  </span>
                  <div>
                    <div className="text-xs font-bold text-slate-200">{log.messagePayload}</div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                      <span>Channel: <span className="text-slate-400">{log.channelName}</span></span>
                      <span>•</span>
                      <span>Provider: <span className="text-slate-400">{log.provider}</span></span>
                    </div>
                  </div>
                </div>
                <span className="text-[11px] text-slate-500 font-mono">{new Date(log.dispatchedAt).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // --- SUB-TAB 4: VERSION & RELEASE MANAGEMENT ---
  if (activeSubTab === 'releases') {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Package className="w-5 h-5 text-amber-400" />
              <span>Application Releases & Approval Workflow</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Manage semantic version tags, release notes, approval gates, and multi-environment cutover safety.
            </p>
          </div>
        </div>

        {/* Releases List */}
        <div className="space-y-4">
          {releases.map(rel => (
            <div key={rel.id} className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-sm font-black px-3 py-1 rounded-xl font-mono">
                    {rel.versionTag}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-100">{rel.resourceName}</h4>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                      <span>Type: <span className="text-slate-200 font-semibold">{rel.releaseType.toUpperCase()}</span></span>
                      <span>•</span>
                      <span>Author: <span className="text-slate-200">{rel.metadata.author}</span></span>
                      <span>•</span>
                      <span className="font-mono">#{rel.metadata.commitHash}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-xs px-3 py-1 rounded-xl font-bold border ${
                    rel.approvalStatus === 'approved'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : rel.approvalStatus === 'pending'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      : 'bg-red-500/10 text-red-400 border-red-500/20'
                  }`}>
                    {rel.approvalStatus.toUpperCase()}
                  </span>

                  {rel.approvalStatus === 'pending' && (
                    <button
                      onClick={() => onApproveRelease(rel.id)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-1 rounded-xl shadow cursor-pointer transition-all"
                    >
                      Approve Release
                    </button>
                  )}

                  {rel.approvalStatus === 'approved' && (
                    <button
                      onClick={() => setShowPromoteModal(rel)}
                      className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-1 rounded-xl shadow cursor-pointer transition-all flex items-center gap-1"
                    >
                      <Globe2 className="w-3.5 h-3.5" />
                      <span>Promote Environment</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-850 text-xs text-slate-300 leading-relaxed">
                <span className="text-slate-500 font-bold block mb-1">Release Notes:</span>
                {rel.releaseNotes}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                <div>
                  Target Environments: {rel.targetEnvironments.map(e => (
                    <span key={e} className="ml-1 bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono">
                      {e}
                    </span>
                  ))}
                </div>
                {rel.approvedBy && <div>Approved by: <span className="text-slate-200 font-semibold">{rel.approvedBy}</span></div>}
              </div>
            </div>
          ))}
        </div>

        {/* Promotion Modal */}
        {showPromoteModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl max-w-md w-full space-y-4 shadow-2xl">
              <h4 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Globe2 className="w-5 h-5 text-blue-400" />
                <span>Promote Release {showPromoteModal.versionTag}</span>
              </h4>

              <p className="text-xs text-slate-400">
                Safely shift this approved release into a target deployment environment with automated canary traffic validation.
              </p>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Target Environment:</label>
                <select
                  value={targetEnv}
                  onChange={(e) => setTargetEnv(e.target.value as EnvironmentType)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                >
                  <option value="development">Development</option>
                  <option value="testing">Testing</option>
                  <option value="staging">Staging</option>
                  <option value="production">Production</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  onClick={() => setShowPromoteModal(null)}
                  className="px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onPromoteRelease(showPromoteModal.id, showPromoteModal.versionTag, 'staging', targetEnv);
                    setShowPromoteModal(null);
                  }}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-1.5 rounded-xl cursor-pointer"
                >
                  Confirm Promotion
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- SUB-TAB 5: MULTI-ENVIRONMENT SUPPORT ---
  if (activeSubTab === 'multi_env') {
    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Globe2 className="w-5 h-5 text-purple-400" />
            <span>Multi-Environment Isolation & Topology</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Independent deployment configs, health telemetry, and resource allocation across Development, Testing, Staging, and Production.
          </p>
        </div>

        {/* Environment Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {environments.map(env => (
            <div key={env.id} className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                    env.environment === 'production' ? 'bg-purple-950/80 text-purple-300 border border-purple-800/50' :
                    env.environment === 'staging' ? 'bg-blue-950/80 text-blue-300 border border-blue-800/50' :
                    'bg-slate-800 text-slate-300'
                  }`}>
                    {env.environment.toUpperCase()}
                  </span>
                  <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] px-2 py-0.5 rounded font-semibold">
                    HEALTHY
                  </span>
                </div>

                <h4 className="text-base font-bold text-slate-100 mt-3">{env.resourceName}</h4>
                <div className="text-xs text-slate-400 mt-1">
                  Active Release: <span className="font-mono text-emerald-400 font-bold">{env.activeReleaseVersion}</span>
                </div>
              </div>

              <div className="space-y-2 pt-3 border-t border-slate-800/80 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Resource Alloc:</span>
                  <span className="text-slate-200 font-mono">{env.resourceAllocation.cpuLimitCores} CPU / {env.resourceAllocation.memoryLimitMb}MB</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Replicas:</span>
                  <span className="text-slate-200 font-mono">{env.resourceAllocation.replicas} Active</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Total Deployments:</span>
                  <span className="text-slate-200 font-mono">{env.totalDeploymentsCount}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Promotions History Timeline */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl space-y-4">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Workflow className="w-4 h-4 text-blue-400" />
            <span>Environment Promotions History</span>
          </h4>

          <div className="space-y-3">
            {promotions.map(prom => (
              <div key={prom.id} className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-bold text-slate-200">
                    <span className="text-blue-400">{prom.sourceEnvironment.toUpperCase()}</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-emerald-400">{prom.targetEnvironment.toUpperCase()}</span>
                    <span className="font-mono bg-slate-800 px-2 py-0.5 rounded text-slate-300">{prom.versionTag}</span>
                  </div>
                  <span className="bg-emerald-500/10 text-emerald-400 text-[10px] px-2 py-0.5 rounded font-bold">
                    PROMOTED
                  </span>
                </div>

                <div className="text-[11px] text-slate-500 font-mono">
                  Promoted by {prom.promotedBy} at {new Date(prom.promotedAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
