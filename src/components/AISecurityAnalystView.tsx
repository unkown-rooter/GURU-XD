import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Brain,
  AlertTriangle,
  Clock,
  CheckCircle2,
  TrendingUp,
  Activity,
  Cpu,
  HardDrive,
  Radio,
  FileSearch,
  Sparkles,
  ArrowRight,
  GitCommit,
  RefreshCw,
  Search,
  Zap,
  RotateCcw,
  Sliders,
  Terminal,
  HelpCircle,
  ExternalLink,
  Layers,
  Check
} from 'lucide-react';

export type ConfidenceLevel = 'Very High' | 'High' | 'Moderate' | 'Low' | 'Very Low';
export type IncidentRiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export interface TimelinePoint {
  time: string;
  event: string;
}

export interface HistoricalSimilarityMatch {
  incidentId: string;
  title: string;
  similarityPct: number;
  previousResolution: string;
  previousOutcome: string;
  recommendedSolution: string;
}

export interface SecurityIncident {
  incidentId: string;
  instanceId: string;
  instanceName: string;
  deploymentId: string;
  botCategory: string;
  eventType: string;
  timestamp: string;
  status: 'INVESTIGATING' | 'ANALYZED' | 'ACTION_RECOMMENDED' | 'RESOLVED' | 'DISMISSED';
  whatHappened: string;
  likelyCause: string;
  confidenceScorePct: number;
  confidenceLevel: ConfidenceLevel;
  evidence: string[];
  impact: string;
  recommendedAction: string;
  riskLevel: IncidentRiskLevel;
  causeAndEffectChain: string[];
  evidenceTimeline: TimelinePoint[];
  similarHistoricalIncidents: HistoricalSimilarityMatch[];
  behaviorScorePct: number;
  healthScorePct: number;
  trustBadge: string;
  riskScorePct: number;
  administratorResolution?: {
    resolvedAt: string;
    adminActionTaken: string;
    notes: string;
    effective: boolean;
  };
}

export default function AISecurityAnalystView() {
  const [incidents, setIncidents] = useState<SecurityIncident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<SecurityIncident | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [resolving, setResolving] = useState<boolean>(false);
  const [adminNote, setAdminNote] = useState<string>('');
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'PANEL' | 'CHAIN' | 'TIMELINE' | 'HISTORICAL' | 'CATEGORY'>('PANEL');

  // Payload Scanner Test State
  const [scanInput, setScanInput] = useState<string>('');
  const [scanResult, setScanResult] = useState<any>(null);
  const [scanning, setScanning] = useState<boolean>(false);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/security-analyst/stats');
      const data = await res.json();
      if (data.success && data.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Error fetching security stats:', err);
    }
  };

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/security-analyst/incidents');
      const data = await res.json();
      if (data.success && data.incidents) {
        setIncidents(data.incidents);
        if (data.incidents.length > 0 && !selectedIncident) {
          setSelectedIncident(data.incidents[0]);
        } else if (selectedIncident) {
          // Update selected incident reference
          const updated = data.incidents.find((i: SecurityIncident) => i.incidentId === selectedIncident.incidentId);
          if (updated) setSelectedIncident(updated);
        }
      }
      fetchStats();
    } catch (err) {
      console.error('Error fetching AI security incidents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDismissIncident = async () => {
    if (!selectedIncident) return;
    try {
      setResolving(true);
      const res = await fetch(`/api/security-analyst/incidents/${selectedIncident.incidentId}/dismiss`, {
        method: 'POST'
      });
      const data = await res.json();
      if (data.success) {
        setActionSuccessMessage(`Incident ${selectedIncident.incidentId} dismissed and archived.`);
        setTimeout(() => setActionSuccessMessage(null), 5000);
        await fetchIncidents();
      }
    } catch (err) {
      console.error('Error dismissing incident:', err);
    } finally {
      setResolving(false);
    }
  };

  const handleScanPayload = async () => {
    if (!scanInput.trim()) return;
    try {
      setScanning(true);
      const res = await fetch('/api/security-analyst/scan-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promptText: scanInput })
      });
      const data = await res.json();
      if (data.success) {
        setScanResult(data.scanResult);
      }
    } catch (err) {
      console.error('Error scanning prompt payload:', err);
    } finally {
      setScanning(false);
    }
  };

  useEffect(() => {
    fetchIncidents();

    // Connect to SSE event stream
    const eventSource = new EventSource('/api/security-analyst/events');
    eventSource.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'security.analysis.completed' || data.type === 'security.analysis.resolved') {
          fetchIncidents();
        }
      } catch (err) {
        console.error('Error parsing SSE event:', err);
      }
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const handleTriggerAudit = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/security-analyst/investigate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instanceId: 'bot-1',
          instanceName: 'GURU-WA-BOT',
          botCategory: 'AI Assistant',
          customEventName: 'On-Demand Behavior Drift Audit'
        })
      });
      const data = await res.json();
      if (data.success && data.report) {
        setActionSuccessMessage('AI Security Analyst successfully completed automated investigation.');
        setTimeout(() => setActionSuccessMessage(null), 5000);
        await fetchIncidents();
        setSelectedIncident(data.report);
      }
    } catch (err) {
      console.error('Error triggering audit:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveIncident = async (actionText?: string) => {
    if (!selectedIncident) return;
    try {
      setResolving(true);
      const actionToTake = actionText || selectedIncident.recommendedAction;
      const res = await fetch(`/api/security-analyst/incidents/${selectedIncident.incidentId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminActionTaken: actionToTake,
          notes: adminNote || `Applied recommendation: ${actionToTake}`
        })
      });
      const data = await res.json();
      if (data.success && data.incident) {
        setActionSuccessMessage(`Incident ${selectedIncident.incidentId} resolved. Resolution archived into AI knowledge base for future incident matching.`);
        setTimeout(() => setActionSuccessMessage(null), 6000);
        setAdminNote('');
        await fetchIncidents();
      }
    } catch (err) {
      console.error('Error resolving incident:', err);
    } finally {
      setResolving(false);
    }
  };

  const getConfidenceBadgeColor = (level: ConfidenceLevel) => {
    switch (level) {
      case 'Very High':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'High':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'Moderate':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'Low':
      case 'Very Low':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const getRiskBadgeColor = (risk: IncidentRiskLevel) => {
    switch (risk) {
      case 'Critical':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/40 shadow-rose-900/20 shadow-lg';
      case 'High':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'Medium':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      case 'Low':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto text-slate-100 space-y-6">
      {/* Top Banner Header */}
      <div className="relative bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                GURU-XD AI SECURITY ANALYST
              </span>
              <span className="px-2 py-0.5 rounded-full text-xs font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                NON-DESTRUCTIVE HYPERVISOR LAYER
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Automated Incident Explanation & Investigation Engine
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl">
              Consumes real-time telemetry, explains behavior drifts, constructs cause-and-effect evidence chains, and generates prioritized safe recommendations for administrators.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchIncidents}
              disabled={loading}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-2 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
              Refresh Telemetry
            </button>

            <button
              onClick={handleTriggerAudit}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium text-xs shadow-lg shadow-indigo-600/30 border border-indigo-400/30 flex items-center gap-2 transition-all transform active:scale-95"
            >
              <Brain className="w-4 h-4 text-indigo-200" />
              Run On-Demand AI Investigation
            </button>
          </div>
        </div>
      </div>

      {actionSuccessMessage && (
        <div className="bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 p-4 rounded-xl text-xs flex items-center justify-between shadow-lg animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{actionSuccessMessage}</span>
          </div>
          <button onClick={() => setActionSuccessMessage(null)} className="text-emerald-400 hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      {/* Main Grid: Left = Incident Feed, Right = Live AI Analysis Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Active Incidents & Historical Feed */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <FileSearch className="w-4 h-4 text-indigo-400" />
                Detected Incidents ({incidents.length})
              </h2>
              <span className="text-[11px] font-mono text-slate-400">Auto-Investigating</span>
            </div>

            {loading && incidents.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
                <span>Scanning runtime telemetry & logs...</span>
              </div>
            ) : incidents.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs space-y-2">
                <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto opacity-80" />
                <p>No active security incidents detected.</p>
                <p className="text-[11px] text-slate-500">Telemetry monitoring runs continuously.</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[680px] overflow-y-auto pr-1">
                {incidents.map((inc) => {
                  const isSelected = selectedIncident?.incidentId === inc.incidentId;
                  const isResolved = inc.status === 'RESOLVED';

                  return (
                    <div
                      key={inc.incidentId}
                      onClick={() => setSelectedIncident(inc)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer relative ${
                        isSelected
                          ? 'bg-indigo-950/60 border-indigo-500/60 shadow-lg shadow-indigo-950/50'
                          : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <span className="text-xs font-bold text-white tracking-wide truncate max-w-[180px]">
                          {inc.eventType}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider ${getRiskBadgeColor(
                            inc.riskLevel
                          )}`}
                        >
                          {inc.riskLevel}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-2">
                        <span className="font-mono text-indigo-300">{inc.instanceName}</span>
                        <span>•</span>
                        <span className="text-slate-400">{inc.botCategory}</span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
                        <div className="flex items-center gap-1.5 font-mono">
                          <span className="text-indigo-400 font-bold">{inc.confidenceScorePct}%</span>
                          <span className="text-slate-400 text-[10px]">confidence</span>
                        </div>

                        {isResolved ? (
                          <span className="text-emerald-400 font-semibold flex items-center gap-1 text-[10px]">
                            <CheckCircle2 className="w-3 h-3" /> Resolved
                          </span>
                        ) : (
                          <span className="text-amber-400 font-semibold flex items-center gap-1 text-[10px]">
                            <AlertTriangle className="w-3 h-3" /> Action Advised
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live AI Analysis Panel */}
        <div className="lg:col-span-8">
          {selectedIncident ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col h-full">
              {/* Incident Header Details */}
              <div className="p-6 bg-slate-950/80 border-b border-slate-800">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
                      <Brain className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold text-white">{selectedIncident.eventType}</h2>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                          {selectedIncident.incidentId}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>Instance: <strong className="text-slate-200">{selectedIncident.instanceName}</strong></span>
                        <span>•</span>
                        <span>Category: <strong className="text-indigo-300">{selectedIncident.botCategory}</strong></span>
                        <span>•</span>
                        <span className="text-slate-400">{new Date(selectedIncident.timestamp).toLocaleTimeString()}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getConfidenceBadgeColor(selectedIncident.confidenceLevel)} flex items-center gap-1.5`}>
                      <Zap className="w-3.5 h-3.5" />
                      Confidence: {selectedIncident.confidenceScorePct}% ({selectedIncident.confidenceLevel})
                    </span>
                  </div>
                </div>

                {/* Status KPI Chips */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                  <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-xl text-center">
                    <span className="text-[10px] uppercase font-mono text-slate-400 block mb-0.5">Risk Level</span>
                    <span className={`text-xs font-bold ${selectedIncident.riskLevel === 'Critical' ? 'text-rose-400' : selectedIncident.riskLevel === 'High' ? 'text-amber-400' : 'text-blue-400'}`}>
                      {selectedIncident.riskLevel}
                    </span>
                  </div>

                  <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-xl text-center">
                    <span className="text-[10px] uppercase font-mono text-slate-400 block mb-0.5">Health Score</span>
                    <span className="text-xs font-bold text-emerald-400">
                      {selectedIncident.healthScorePct}%
                    </span>
                  </div>

                  <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-xl text-center">
                    <span className="text-[10px] uppercase font-mono text-slate-400 block mb-0.5">Trust Badge</span>
                    <span className="text-xs font-bold text-indigo-300">
                      {selectedIncident.trustBadge}
                    </span>
                  </div>

                  <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-xl text-center">
                    <span className="text-[10px] uppercase font-mono text-slate-400 block mb-0.5">Behavior Score</span>
                    <span className="text-xs font-bold text-indigo-400">
                      {selectedIncident.behaviorScorePct}%
                    </span>
                  </div>
                </div>
              </div>

              {/* View Switcher Tabs */}
              <div className="flex items-center gap-1 p-2 bg-slate-900 border-b border-slate-800 text-xs font-medium overflow-x-auto">
                <button
                  onClick={() => setActiveTab('PANEL')}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                    activeTab === 'PANEL'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  AI Explanation & Matrix
                </button>

                <button
                  onClick={() => setActiveTab('CHAIN')}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                    activeTab === 'CHAIN'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <GitCommit className="w-3.5 h-3.5" />
                  Cause & Effect Chain
                </button>

                <button
                  onClick={() => setActiveTab('TIMELINE')}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                    activeTab === 'TIMELINE'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  Evidence Timeline
                </button>

                <button
                  onClick={() => setActiveTab('HISTORICAL')}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                    activeTab === 'HISTORICAL'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Similar Incidents ({selectedIncident.similarHistoricalIncidents?.length || 0})
                </button>
              </div>

              {/* Tab Contents */}
              <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                {activeTab === 'PANEL' && (
                  <div className="space-y-6">
                    {/* Key Questions Matrix */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* What Happened */}
                      <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-1.5">
                        <span className="text-[11px] font-mono text-indigo-400 font-bold uppercase tracking-wider block">
                          1. What happened?
                        </span>
                        <p className="text-xs text-slate-200 leading-relaxed">
                          {selectedIncident.whatHappened}
                        </p>
                      </div>

                      {/* Why did it happen */}
                      <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-1.5">
                        <span className="text-[11px] font-mono text-indigo-400 font-bold uppercase tracking-wider block">
                          2. Why did it probably happen? (Root Cause)
                        </span>
                        <p className="text-xs text-slate-200 leading-relaxed">
                          {selectedIncident.likelyCause}
                        </p>
                      </div>

                      {/* Expected Impact */}
                      <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-1.5">
                        <span className="text-[11px] font-mono text-indigo-400 font-bold uppercase tracking-wider block">
                          3. What impact could this have?
                        </span>
                        <p className="text-xs text-slate-200 leading-relaxed">
                          {selectedIncident.impact}
                        </p>
                      </div>

                      {/* Bot Profile Context */}
                      <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-1.5">
                        <span className="text-[11px] font-mono text-indigo-400 font-bold uppercase tracking-wider block">
                          4. Bot Category Adaptation
                        </span>
                        <p className="text-xs text-slate-200 leading-relaxed">
                          Target bot category <strong className="text-indigo-300">{selectedIncident.botCategory}</strong> has custom risk thresholds applied. Rules avoid flagging expected heavy processing loops for this profile.
                        </p>
                      </div>
                    </div>

                    {/* Supporting Evidence List */}
                    <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
                      <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 font-mono">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        Evidence Supporting Conclusion
                      </h3>
                      <ul className="space-y-2">
                        {selectedIncident.evidence.map((item, idx) => (
                          <li key={idx} className="text-xs text-slate-300 flex items-start gap-2 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/80">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0"></span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Recommended Safe Action Box */}
                    <div className="bg-gradient-to-r from-indigo-950/80 via-slate-900 to-indigo-950/80 border border-indigo-500/40 rounded-xl p-5 shadow-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-2 font-mono">
                          <Zap className="w-4 h-4 text-indigo-400" />
                          Safest Recommended Action (Least Disruptive First)
                        </h3>
                        <span className="text-[10px] font-mono bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30">
                          PRIORITY SAFE ACTION
                        </span>
                      </div>

                      <div className="p-3 bg-slate-950/80 border border-indigo-500/30 rounded-lg text-sm font-semibold text-white">
                        {selectedIncident.recommendedAction}
                      </div>

                      {selectedIncident.status === 'RESOLVED' ? (
                        <div className="p-3 bg-emerald-950/60 border border-emerald-500/30 rounded-lg text-xs text-emerald-300 flex items-center gap-2 font-mono">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>Resolved: {selectedIncident.administratorResolution?.adminActionTaken}</span>
                        </div>
                      ) : (
                        <div className="space-y-3 pt-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={adminNote}
                              onChange={(e) => setAdminNote(e.target.value)}
                              placeholder="Optional administrator resolution notes..."
                              className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                            />
                            <button
                              onClick={() => handleResolveIncident()}
                              disabled={resolving}
                              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-2 transition-all shadow-md active:scale-95 shrink-0"
                            >
                              <Check className="w-3.5 h-3.5" />
                              {resolving ? 'Executing...' : 'Execute Recommended Fix'}
                            </button>
                            <button
                              onClick={handleDismissIncident}
                              disabled={resolving}
                              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs flex items-center gap-1.5 transition-all shrink-0"
                            >
                              Dismiss
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'CHAIN' && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                      Generated Cause and Effect Chain
                    </h3>
                    <p className="text-xs text-slate-400">
                      Visualization of the domino effect sequence identified by the AI Security Analyst:
                    </p>

                    <div className="space-y-3 pt-2">
                      {selectedIncident.causeAndEffectChain.map((step, idx) => (
                        <React.Fragment key={idx}>
                          <div className="flex items-center gap-3 bg-slate-950 border border-indigo-500/30 p-3.5 rounded-xl shadow-md">
                            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <span className="text-xs font-medium text-slate-200">{step}</span>
                          </div>
                          {idx < selectedIncident.causeAndEffectChain.length - 1 && (
                            <div className="flex justify-center">
                              <ArrowRight className="w-4 h-4 text-indigo-400 rotate-90 my-0.5" />
                            </div>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'TIMELINE' && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                      Evidence Timeline
                    </h3>
                    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-indigo-500/30">
                      {selectedIncident.evidenceTimeline.map((item, idx) => (
                        <div key={idx} className="relative flex items-start gap-3">
                          <div className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-indigo-500 border-2 border-slate-900"></div>
                          <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl flex-1 space-y-1">
                            <span className="text-[10px] font-mono text-indigo-400 font-bold block">
                              {item.time}
                            </span>
                            <p className="text-xs text-slate-200">{item.event}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'HISTORICAL' && (
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                      Historical Incident Pattern Match (Machine Learning Comparison)
                    </h3>
                    <p className="text-xs text-slate-400">
                      The AI compares current telemetry with previous resolved incidents in the knowledge base:
                    </p>

                    {selectedIncident.similarHistoricalIncidents?.length === 0 ? (
                      <div className="py-8 text-center text-slate-500 text-xs">
                        No previous similar incidents found in knowledge base.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedIncident.similarHistoricalIncidents.map((hist) => (
                          <div key={hist.incidentId} className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-white">{hist.title}</span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                {hist.similarityPct}% Similarity
                              </span>
                            </div>

                            <div className="space-y-1 text-xs text-slate-300">
                              <p><strong>Previous Resolution:</strong> {hist.previousResolution}</p>
                              <p><strong>Outcome:</strong> {hist.previousOutcome}</p>
                              <p className="text-indigo-300"><strong>Recommended Fix:</strong> {hist.recommendedSolution}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 text-sm space-y-3">
              <Brain className="w-12 h-12 text-indigo-400 mx-auto opacity-60" />
              <p>Select an incident from the left list to view complete AI analysis.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
