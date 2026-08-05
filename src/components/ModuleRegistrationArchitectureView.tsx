import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Cpu, 
  ShieldCheck, 
  Search, 
  Play, 
  Zap, 
  Radio, 
  Activity, 
  Network, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  Server, 
  Layers, 
  FileCode, 
  Terminal, 
  Check, 
  X,
  Code2,
  Brain,
  History,
  Camera,
  ToggleLeft,
  ToggleRight,
  Gauge,
  Sliders,
  HelpCircle,
  FileDiff,
  Package,
  Plug,
  Share2,
  GitFork,
  Database,
  Workflow
} from 'lucide-react';

export function ModuleRegistrationArchitectureView() {
  const [activeTab, setActiveTab] = useState<'state-intelligence' | 'inventory' | 'plugins' | 'interaction-graph' | 'ai-discovery' | 'knowledge-graph' | 'services' | 'events' | 'audit' | 'security'>('state-intelligence');
  
  // Data states
  const [modules, setModules] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [capabilities, setCapabilities] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [knowledgeGraph, setKnowledgeGraph] = useState<any>(null);
  const [auditReport, setAuditReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Plugins & Interaction Graph states
  const [plugins, setPlugins] = useState<any[]>([]);
  const [pluginCatalog, setPluginCatalog] = useState<any[]>([]);
  const [interactionGraph, setInteractionGraph] = useState<any>(null);
  const [pluginAiQuery, setPluginAiQuery] = useState('Which plugins are installed and enabled?');
  const [pluginAiAnswer, setPluginAiAnswer] = useState<any>(null);
  const [queryingPluginAi, setQueryingPluginAi] = useState(false);

  // Consistency & Diagnostics states
  const [reconciliationReport, setReconciliationReport] = useState<any>(null);
  const [diagnosticsReport, setDiagnosticsReport] = useState<any>(null);
  const [lifecycleAuditReport, setLifecycleAuditReport] = useState<any>(null);
  const [consistencyResult, setConsistencyResult] = useState<any>(null);
  const [reconciling, setReconciling] = useState(false);


  // Platform State Intelligence States
  const [platformState, setPlatformState] = useState<any>(null);
  const [healthMetrics, setHealthMetrics] = useState<any>(null);
  const [recentChanges, setRecentChanges] = useState<any[]>([]);
  const [snapshots, setSnapshots] = useState<any[]>([]);
  
  // Reasoning State
  const [reasoningQuery, setReasoningQuery] = useState('What is the current health status of the platform?');
  const [reasoningResult, setReasoningResult] = useState<any>(null);
  const [evaluatingReasoning, setEvaluatingReasoning] = useState(false);

  // Snapshot Diff State
  const [selectedSnap1, setSelectedSnap1] = useState<string>('');
  const [selectedSnap2, setSelectedSnap2] = useState<string>('');
  const [snapshotDiff, setSnapshotDiff] = useState<any>(null);
  const [diffing, setDiffing] = useState(false);

  // Search and query states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModule, setSelectedModule] = useState<any>(null);

  // AI Discovery test query
  const [aiQuery, setAiQuery] = useState('Which module can deploy applications?');
  const [aiResult, setAiResult] = useState<any>(null);
  const [queryingAi, setQueryingAi] = useState(false);

  // Service Invocation state
  const [selectedServiceKey, setSelectedServiceKey] = useState('dashboard.getStats');
  const [serviceParams, setServiceParams] = useState('{}');
  const [serviceResult, setServiceResult] = useState<any>(null);
  const [invokingService, setInvokingService] = useState(false);

  // Security Test manifest
  const [manifestJson, setManifestJson] = useState(JSON.stringify({
    id: "mod-custom-worker",
    name: "Custom Worker Daemon",
    version: "1.0.0",
    description: "Background jobs processor",
    author: { name: "DevOps Engineer" },
    dependencies: [{ moduleId: "mod-dashboard-core", minVersion: "2.0.0" }],
    permissions: [{ id: "perm-worker", name: "Worker Execute", description: "Run worker jobs", level: "write" }],
    capabilities: [{ id: "cap-job-runner", name: "Job Runner", description: "Executes batch background jobs", category: "Processing" }],
    services: [{ serviceKey: "worker.runJob", name: "Run Worker Job", description: "Enqueues batch job." }],
    events: [{ eventType: "worker.job.completed", description: "Emitted when job completes." }],
    routes: [{ path: "/api/v1/worker/jobs", method: "POST", description: "Enqueue job", protected: true }],
    configuration: { concurrency: 4 }
  }, null, 2));
  const [securityResult, setSecurityResult] = useState<any>(null);
  const [checkingSecurity, setCheckingSecurity] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [modRes, srvRes, capRes, evtRes, kgRes, stateRes, healthRes, changesRes, snapsRes, plugRes, catRes, graphRes, consRes, auditRes] = await Promise.all([
        fetch('/api/v1/modules'),
        fetch('/api/v1/modules/services'),
        fetch('/api/v1/modules/capabilities'),
        fetch('/api/v1/modules/events'),
        fetch('/api/v1/modules/knowledge-graph'),
        fetch('/api/v1/platform-state'),
        fetch('/api/v1/platform-state/health'),
        fetch('/api/v1/platform-state/changes'),
        fetch('/api/v1/platform-state/snapshots'),
        fetch('/api/v1/plugins'),
        fetch('/api/v1/plugins/catalog'),
        fetch('/api/v1/plugins/interaction-graph'),
        fetch('/api/v1/modules/consistency'),
        fetch('/api/v1/modules/lifecycle-audit')
      ]);

      const modData = await modRes.json();
      const srvData = await srvRes.json();
      const capData = await capRes.json();
      const evtData = await evtRes.json();
      const kgData = await kgRes.json();
      const stateData = await stateRes.json();
      const healthData = await healthRes.json();
      const changesData = await changesRes.json();
      const snapsData = await snapsRes.json();
      const plugData = await plugRes.json();
      const catData = await catRes.json();
      const graphData = await graphRes.json();
      const consData = await consRes.json();
      const auditData = await auditRes.json();

      if (modData.success) setModules(modData.data.modules || []);
      if (srvData.success) setServices(srvData.data.services || []);
      if (capData.success) setCapabilities(capData.data.capabilities || []);
      if (evtData.success) setEvents(evtData.data.recentEvents || []);
      if (kgData.success) setKnowledgeGraph(kgData.data.graph);

      if (stateData.success) setPlatformState(stateData.data.platformState);
      if (healthData.success) setHealthMetrics(healthData.data.healthMetrics);
      if (changesData.success) setRecentChanges(changesData.data.changes || []);
      if (snapsData.success) {
        const snapList = snapsData.data.snapshots || [];
        setSnapshots(snapList);
        if (snapList.length >= 2) {
          setSelectedSnap1(snapList[0].id);
          setSelectedSnap2(snapList[snapList.length - 1].id);
        } else if (snapList.length === 1) {
          setSelectedSnap1(snapList[0].id);
        }
      }

      if (plugData.success) setPlugins(plugData.data.plugins || []);
      if (catData.success) setPluginCatalog(catData.data.catalog || []);
      if (graphData.success) setInteractionGraph(graphData.data.graph);
      if (consData.success) setConsistencyResult(consData.data.consistency);
      if (auditData?.success) setLifecycleAuditReport(auditData.data.audit);

      if (modData.data?.modules?.length > 0 && !selectedModule) {
        setSelectedModule(modData.data.modules[0]);
      }
    } catch (err) {
      console.error('Failed to load platform state intelligence data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePluginEnable = async (pluginId: string, currentEnabled: boolean) => {
    try {
      const endpoint = currentEnabled ? `/api/v1/plugins/${pluginId}/disable` : `/api/v1/plugins/${pluginId}/enable`;
      const res = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reason: 'User requested from UI' }) });
      const data = await res.json();
      if (data.success) fetchData();
    } catch (err) {
      console.error('Plugin toggle error:', err);
    }
  };

  const handleInstallPlugin = async (manifest: any) => {
    try {
      const res = await fetch('/api/v1/plugins/install', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ manifest }) });
      const data = await res.json();
      if (data.success) fetchData();
    } catch (err) {
      console.error('Plugin install error:', err);
    }
  };

  const handleUninstallPlugin = async (pluginId: string) => {
    try {
      const res = await fetch(`/api/v1/plugins/${pluginId}/uninstall`, { method: 'POST' });
      const data = await res.json();
      if (data.success) fetchData();
    } catch (err) {
      console.error('Plugin uninstall error:', err);
    }
  };

  const handleReloadPlugin = async (pluginId: string) => {
    try {
      const res = await fetch(`/api/v1/plugins/${pluginId}/reload`, { method: 'POST' });
      const data = await res.json();
      if (data.success) fetchData();
    } catch (err) {
      console.error('Plugin reload error:', err);
    }
  };

  const handleRunPluginAiQuery = async () => {
    setQueryingPluginAi(true);
    try {
      const res = await fetch('/api/v1/plugins/ai-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: pluginAiQuery })
      });
      const data = await res.json();
      if (data.success) setPluginAiAnswer(data.data);
    } catch (err) {
      console.error('Plugin AI Query error:', err);
    } finally {
      setQueryingPluginAi(false);
    }
  };

  const handleReconcile = async () => {
    setReconciling(true);
    try {
      const res = await fetch('/api/v1/modules/reconcile', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setReconciliationReport(data.data.report);
        fetchData();
      }
    } catch (err) {
      console.error('Reconciliation error:', err);
    } finally {
      setReconciling(false);
    }
  };

  const handleGenerateDiagnostics = async () => {
    try {
      const res = await fetch('/api/v1/modules/diagnostics');
      const data = await res.json();
      if (data.success) setDiagnosticsReport(data.data.diagnostics);
    } catch (err) {
      console.error('Diagnostics error:', err);
    }
  };


  const handleRunReasoning = async (qText?: string) => {
    const q = qText || reasoningQuery;
    setEvaluatingReasoning(true);
    try {
      const res = await fetch('/api/v1/platform-state/reasoning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q })
      });
      const data = await res.json();
      if (data.success) {
        setReasoningResult(data.data.reasoning);
      }
    } catch (err) {
      console.error('Reasoning Error:', err);
    } finally {
      setEvaluatingReasoning(false);
    }
  };

  const handleToggleModuleDisabled = async (moduleId: string, currentDisabled: boolean) => {
    try {
      const res = await fetch('/api/v1/platform-state/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          moduleId,
          disabled: !currentDisabled,
          reason: `Manual toggle via UI by Administrator`
        })
      });
      const data = await res.json();
      if (data.success) {
        setPlatformState(data.data.platformState);
        fetchData();
      }
    } catch (err) {
      console.error('Error toggling module state:', err);
    }
  };

  const handleCreateSnapshot = async () => {
    try {
      const res = await fetch('/api/v1/platform-state/snapshots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tag: 'manual-ui' })
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } catch (err) {
      console.error('Error creating snapshot:', err);
    }
  };

  const handleCompareSnapshots = async () => {
    if (!selectedSnap1 || !selectedSnap2) return;
    setDiffing(true);
    try {
      const res = await fetch(`/api/v1/platform-state/snapshots/compare?snapshotId1=${selectedSnap1}&snapshotId2=${selectedSnap2}`);
      const data = await res.json();
      if (data.success) {
        setSnapshotDiff(data.data.diff);
      }
    } catch (err) {
      console.error('Snapshot diff error:', err);
    } finally {
      setDiffing(false);
    }
  };

  const handleRunAiQuery = async (queryToRun?: string) => {
    const q = queryToRun || aiQuery;
    setQueryingAi(true);
    try {
      const res = await fetch('/api/v1/modules/ai-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q })
      });
      const data = await res.json();
      if (data.success) {
        setAiResult(data.data.discovery);
      }
    } catch (err) {
      console.error('AI Query Error:', err);
    } finally {
      setQueryingAi(false);
    }
  };

  const handleInvokeService = async () => {
    setInvokingService(true);
    try {
      let parsedParams = {};
      try { parsedParams = JSON.parse(serviceParams); } catch (e) {}
      const res = await fetch('/api/v1/modules/services/invoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceKey: selectedServiceKey, params: parsedParams })
      });
      const data = await res.json();
      setServiceResult(data);
    } catch (err: any) {
      setServiceResult({ success: false, error: err.message });
    } finally {
      setInvokingService(false);
    }
  };

  const handleRunAudit = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/modules/audit', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setAuditReport(data.data.report);
      }
    } catch (err) {
      console.error('Audit error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSecurityCheck = async () => {
    setCheckingSecurity(true);
    try {
      const parsed = JSON.parse(manifestJson);
      const res = await fetch('/api/v1/modules/security-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manifest: parsed })
      });
      const data = await res.json();
      if (data.success) setSecurityResult(data.data.validation);
    } catch (err: any) {
      setSecurityResult({ valid: false, errors: [`JSON Parse error: ${err.message}`], warnings: [], securityScore: 0 });
    } finally {
      setCheckingSecurity(false);
    }
  };

  const filteredModules = modules.filter(m => 
    m.manifest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.manifest.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.manifest.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 font-sans">
      {/* HEADER BAR */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Brain className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              GURU-XD AI Core Orchestrator
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-mono">
                Platform State Intelligence v2.5.0
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Single Source of Platform Awareness • Continuous State Observation • Zero-Hardcode Architecture
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Sync State
          </button>
          <button
            onClick={handleCreateSnapshot}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg transition"
          >
            <Camera className="w-3.5 h-3.5" />
            Capture Snapshot
          </button>
          <button
            onClick={handleRunAudit}
            className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-900/30 transition"
          >
            <ShieldCheck className="w-4 h-4" />
            Trigger Audit
          </button>
        </div>
      </div>

      {/* TOP METRICS STRIP */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 px-6 py-3 border-b border-slate-800/60 bg-slate-900/30 text-xs">
        <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
          <div className="text-slate-400">Platform Health Score</div>
          <div className="text-lg font-bold text-emerald-400 mt-0.5 flex items-center gap-1.5">
            <Gauge className="w-4 h-4 text-emerald-400" />
            {healthMetrics?.score || 100}%
          </div>
        </div>
        <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
          <div className="text-slate-400">Recognized Modules</div>
          <div className="text-lg font-bold text-cyan-400 mt-0.5">{platformState?.registeredModulesCount || modules.length}</div>
        </div>
        <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
          <div className="text-slate-400">Active / Degraded</div>
          <div className="text-lg font-bold text-white mt-0.5">
            <span className="text-emerald-400">{platformState?.activeModulesCount ?? modules.filter(m => m.status === 'ACTIVE').length}</span>
            <span className="text-slate-500 mx-1">/</span>
            <span className="text-amber-400">{platformState?.degradedModulesCount ?? 0}</span>
          </div>
        </div>
        <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
          <div className="text-slate-400">Disabled Modules</div>
          <div className="text-lg font-bold text-purple-400 mt-0.5">{platformState?.disabledModulesCount || 0}</div>
        </div>
        <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
          <div className="text-slate-400">State Changes Logged</div>
          <div className="text-lg font-bold text-amber-400 mt-0.5">{recentChanges.length}</div>
        </div>
        <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
          <div className="text-slate-400">Snapshots Captured</div>
          <div className="text-lg font-bold text-indigo-400 mt-0.5">{snapshots.length}</div>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex items-center gap-1 px-6 border-b border-slate-800 bg-slate-900/20 text-xs font-medium overflow-x-auto">
        {[
          { id: 'state-intelligence', label: 'Platform State Intelligence', icon: Brain, badge: 'Phase 2' },
          { id: 'inventory', label: 'Module Inventory', icon: Layers, count: modules.length },
          { id: 'plugins', label: 'Plugin Management', icon: Plug, count: plugins.length, badge: 'Prod' },
          { id: 'interaction-graph', label: 'Interaction Graph', icon: Share2, count: interactionGraph?.nodes?.length },
          { id: 'ai-discovery', label: 'AI Discovery', icon: Search },
          { id: 'knowledge-graph', label: 'Knowledge Graph', icon: Network, count: knowledgeGraph?.nodes?.length },
          { id: 'services', label: 'Service Registry', icon: Zap, count: services.length },
          { id: 'events', label: 'Event Pub/Sub', icon: Radio },
          { id: 'audit', label: 'Automated Audits', icon: Activity, alert: auditReport?.criticalCount > 0 },
          { id: 'security', label: 'Security & Semver', icon: ShieldCheck }
        ].map((tab) => {

          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium transition ${
                isActive 
                  ? 'border-cyan-400 text-cyan-400 bg-cyan-500/5' 
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="px-1.5 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-[10px] font-bold">
                  {tab.badge}
                </span>
              )}
              {tab.count !== undefined && (
                <span className="px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px]">
                  {tab.count}
                </span>
              )}
              {tab.alert && (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              )}
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT AREA */}
      <div className="flex-1 overflow-auto p-6">
        {/* TAB 0: PLATFORM STATE INTELLIGENCE (PHASE 2 CORE) */}
        {activeTab === 'state-intelligence' && (
          <div className="flex flex-col gap-6">
            {/* TOP ROW: REASONING ENGINE INTERROGATOR */}
            <div className="p-6 bg-slate-900/80 border border-cyan-500/30 rounded-xl space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                    <Brain className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      AI Core Operational Reasoning Engine
                      <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-mono">
                        Live Platform Reasoning
                      </span>
                    </h2>
                    <p className="text-xs text-slate-400">
                      Query the GURU-XD AI Core Orchestrator to analyze live health, failure root cause, recent changes, and operational impact.
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  {[
                    'What failed?',
                    'What changed recently?',
                    'Assess impact of disabling mod-security-sentinel',
                    'Why is platform health at current score?'
                  ].map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setReasoningQuery(q);
                        handleRunReasoning(q);
                      }}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded text-xs transition"
                    >
                      "{q}"
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <input
                  type="text"
                  value={reasoningQuery}
                  onChange={(e) => setReasoningQuery(e.target.value)}
                  placeholder="Ask GURU-XD AI Core about platform operational state..."
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-sans"
                />
                <button
                  onClick={() => handleRunReasoning()}
                  disabled={evaluatingReasoning}
                  className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  {evaluatingReasoning ? 'Evaluating Reasoning...' : 'Reason Over State'}
                </button>
              </div>

              {/* REASONING RESULT DISPLAY */}
              {reasoningResult && (
                <div className="p-5 bg-slate-950 border border-slate-800 rounded-xl space-y-3 mt-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs">
                    <span className="font-mono text-cyan-400 font-bold uppercase tracking-wider">
                      Intent: {reasoningResult.queryIntent}
                    </span>
                    <span className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        reasoningResult.riskLevel === 'CRITICAL' || reasoningResult.riskLevel === 'HIGH' 
                          ? 'bg-rose-500/20 text-rose-300' 
                          : reasoningResult.riskLevel === 'MEDIUM' 
                          ? 'bg-amber-500/20 text-amber-300' 
                          : 'bg-emerald-500/20 text-emerald-300'
                      }`}>
                        Risk: {reasoningResult.riskLevel}
                      </span>
                      <span className="text-slate-400">Confidence: {(reasoningResult.confidenceScore * 100).toFixed(0)}%</span>
                    </span>
                  </div>

                  <div className="text-xs text-slate-200 font-sans leading-relaxed">
                    <span className="font-semibold text-cyan-400">Assessment: </span>
                    {reasoningResult.assessment}
                  </div>

                  {reasoningResult.rootCause && (
                    <div className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-lg">
                      <span className="font-semibold text-amber-400">Root Cause Identified: </span>
                      {reasoningResult.rootCause}
                    </div>
                  )}

                  {reasoningResult.suggestedActions?.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-slate-300 mb-1">Recommended Remediation Actions:</div>
                      <div className="space-y-1">
                        {reasoningResult.suggestedActions.map((act: string, i: number) => (
                          <div key={i} className="text-xs text-emerald-400 flex items-center gap-1.5 font-mono">
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                            {act}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* MIDDLE ROW: HEALTH BREAKDOWN & LIVE MODULE OVERRIDES */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Health Metrics & Resource Gauges */}
              <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4">
                <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-emerald-400" />
                  Health Formula Breakdown
                </h3>

                <div className="space-y-3 text-xs">
                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>Module Status Health (50% weight)</span>
                      <span className="text-emerald-400 font-bold">{healthMetrics?.details?.moduleHealthScore?.toFixed(0) || 100}%</span>
                    </div>
                    <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full" style={{ width: `${healthMetrics?.details?.moduleHealthScore || 100}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>Error Rate Factor (20% weight)</span>
                      <span className="text-cyan-400 font-bold">{healthMetrics?.details?.errorRateScore?.toFixed(0) || 100}%</span>
                    </div>
                    <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                      <div className="bg-cyan-500 h-full" style={{ width: `${healthMetrics?.details?.errorRateScore || 100}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>Resource Usage Factor (15% weight)</span>
                      <span className="text-purple-400 font-bold">{healthMetrics?.details?.resourceScore?.toFixed(0) || 100}%</span>
                    </div>
                    <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                      <div className="bg-purple-500 h-full" style={{ width: `${healthMetrics?.details?.resourceScore || 100}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-400 mb-1">
                      <span>Dependency Integrity (15% weight)</span>
                      <span className="text-blue-400 font-bold">{healthMetrics?.details?.dependencyIntegrityScore?.toFixed(0) || 100}%</span>
                    </div>
                    <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full" style={{ width: `${healthMetrics?.details?.dependencyIntegrityScore || 100}%` }} />
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 text-xs text-slate-400 space-y-1 font-mono">
                  <div>CPU Load: <span className="text-slate-200">{healthMetrics?.resourceMetrics?.cpuUsagePercent?.toFixed(1) || 12.4}%</span></div>
                  <div>Memory: <span className="text-slate-200">{healthMetrics?.resourceMetrics?.memoryUsageMb || 412} MB</span></div>
                  <div>Uptime: <span className="text-slate-200">{healthMetrics?.resourceMetrics?.uptimeSeconds || 3600}s</span></div>
                </div>
              </div>

              {/* Module Disabling / Enabling Overrides */}
              <div className="lg:col-span-2 p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-cyan-400" />
                    Live Module Management & Disabled Overrides ({modules.length})
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    Real-time state synchronization
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[300px] overflow-auto pr-1">
                  {modules.map((m) => {
                    const isDisabled = platformState?.disabledModules?.includes(m.manifest.id);
                    return (
                      <div
                        key={m.manifest.id}
                        className={`p-3 rounded-lg border text-xs flex items-center justify-between transition ${
                          isDisabled 
                            ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' 
                            : 'bg-slate-950 border-slate-800 text-slate-200'
                        }`}
                      >
                        <div>
                          <div className="font-semibold flex items-center gap-1.5">
                            {m.manifest.name}
                            <span className="text-[10px] font-mono text-slate-500">v{m.manifest.version}</span>
                          </div>
                          <div className="font-mono text-[10px] text-slate-500">{m.manifest.id}</div>
                        </div>

                        <button
                          onClick={() => handleToggleModuleDisabled(m.manifest.id, isDisabled)}
                          className={`px-2.5 py-1 rounded text-[11px] font-semibold flex items-center gap-1.5 transition ${
                            isDisabled 
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-white' 
                              : 'bg-slate-800 hover:bg-rose-600/30 hover:text-rose-300 text-slate-400'
                          }`}
                        >
                          {isDisabled ? (
                            <>
                              <ToggleLeft className="w-3.5 h-3.5 text-emerald-400" />
                              Re-Enable
                            </>
                          ) : (
                            <>
                              <ToggleRight className="w-3.5 h-3.5 text-slate-400" />
                              Disable
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* BOTTOM ROW: RECENT PLATFORM CHANGES & SNAPSHOT DIFF VIEWER */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Changes Log */}
              <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
                <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <History className="w-4 h-4 text-amber-400" />
                  Chronological Platform Change Log ({recentChanges.length})
                </h3>

                <div className="space-y-2 max-h-[350px] overflow-auto pr-2">
                  {recentChanges.map((change: any) => (
                    <div key={change.id} className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs space-y-1">
                      <div className="flex items-center justify-between font-mono">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          change.category === 'LIFECYCLE' ? 'bg-cyan-500/20 text-cyan-300' :
                          change.category === 'HEALTH' ? 'bg-amber-500/20 text-amber-300' :
                          change.category === 'SECURITY' ? 'bg-purple-500/20 text-purple-300' :
                          'bg-emerald-500/20 text-emerald-300'
                        }`}>
                          {change.category} - {change.action}
                        </span>
                        <span className="text-slate-500 text-[10px]">{new Date(change.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <div className="text-slate-200 font-medium">{change.description}</div>
                      <div className="text-[10px] text-slate-500 font-mono">Target: {change.targetId} • Source: {change.source}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Startup Snapshot Diff Engine */}
              <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4">
                <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <FileDiff className="w-4 h-4 text-indigo-400" />
                  Snapshot Comparison & Drift Detection
                </h3>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-slate-400 mb-1 block">Baseline Snapshot</label>
                    <select
                      value={selectedSnap1}
                      onChange={(e) => setSelectedSnap1(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono text-xs focus:outline-none"
                    >
                      {snapshots.map(s => (
                        <option key={s.id} value={s.id}>{s.id} ({s.tag})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-slate-400 mb-1 block">Target Snapshot</label>
                    <select
                      value={selectedSnap2}
                      onChange={(e) => setSelectedSnap2(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 font-mono text-xs focus:outline-none"
                    >
                      {snapshots.map(s => (
                        <option key={s.id} value={s.id}>{s.id} ({s.tag})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  onClick={handleCompareSnapshots}
                  disabled={diffing || !selectedSnap1 || !selectedSnap2}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition"
                >
                  <FileDiff className="w-4 h-4" />
                  {diffing ? 'Generating Diff...' : 'Compare Snapshots'}
                </button>

                {snapshotDiff ? (
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs space-y-2 font-mono">
                    <div className="text-slate-400 text-[11px]">
                      Modules Delta: Added ({snapshotDiff.addedModules.length}), Removed ({snapshotDiff.removedModules.length}), Modified ({snapshotDiff.modifiedModules.length})
                    </div>
                    <div className="text-emerald-400">
                      Health Delta: {snapshotDiff.healthDelta > 0 ? `+${snapshotDiff.healthDelta}` : snapshotDiff.healthDelta}%
                    </div>
                    {snapshotDiff.disabledModulesDelta?.length > 0 && (
                      <div className="text-amber-300">
                        Disabled Delta: {snapshotDiff.disabledModulesDelta.join(', ')}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-[120px] flex items-center justify-center text-slate-500 text-xs font-mono">
                    Select two snapshots and click "Compare Snapshots" to inspect state drift
                  </div>
                )}
              </div>
            </div>

            {/* SYSTEM CONSISTENCY & RECONCILIATION SECTION */}
            <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-lg">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      5-System Live Consistency & Automatic Reconciliation
                      <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${
                        consistencyResult?.isConsistent ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {consistencyResult?.isConsistent ? 'PERFECT SYNCHRONIZATION' : 'RECONCILIATION NEEDED'}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400">
                      Verifies alignment across Project Discovery, Module Registry, Platform State Manager, Knowledge Graph, and AI Memory.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleGenerateDiagnostics}
                    className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg flex items-center gap-1.5 transition"
                  >
                    <Activity className="w-3.5 h-3.5 text-cyan-400" />
                    Diagnostics
                  </button>
                  <button
                    onClick={handleReconcile}
                    disabled={reconciling}
                    className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 shadow-lg transition"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${reconciling ? 'animate-spin' : ''}`} />
                    {reconciling ? 'Reconciling...' : 'Run Reconciliation'}
                  </button>
                </div>
              </div>

              {consistencyResult?.counts && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-2 text-xs font-mono">
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                    <div className="text-slate-500 text-[10px]">PROJECT DISCOVERY</div>
                    <div className="text-cyan-400 font-bold text-sm mt-0.5">{consistencyResult.counts.projectDiscoveryEngine}</div>
                  </div>
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                    <div className="text-slate-500 text-[10px]">MODULE REGISTRY</div>
                    <div className="text-emerald-400 font-bold text-sm mt-0.5">{consistencyResult.counts.moduleRegistry}</div>
                  </div>
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                    <div className="text-slate-500 text-[10px]">PLATFORM STATE</div>
                    <div className="text-purple-400 font-bold text-sm mt-0.5">{consistencyResult.counts.platformStateManager}</div>
                  </div>
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                    <div className="text-slate-500 text-[10px]">KNOWLEDGE GRAPH</div>
                    <div className="text-amber-400 font-bold text-sm mt-0.5">{consistencyResult.counts.knowledgeGraph}</div>
                  </div>
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                    <div className="text-slate-500 text-[10px]">AI MEMORY</div>
                    <div className="text-indigo-400 font-bold text-sm mt-0.5">{consistencyResult.counts.aiMemory}</div>
                  </div>
                </div>
              )}

              {reconciliationReport && (
                <div className="p-4 bg-slate-950 border border-cyan-500/30 rounded-lg text-xs space-y-2 font-mono text-cyan-200">
                  <div className="font-bold text-cyan-400 flex items-center justify-between">
                    <span>Reconciliation Report ({reconciliationReport.reconciliationId})</span>
                    <span className="text-[10px] bg-cyan-500/20 px-2 py-0.5 rounded">{reconciliationReport.status}</span>
                  </div>
                  <p>{reconciliationReport.details}</p>
                </div>
              )}

              {diagnosticsReport && (
                <div className="p-4 bg-slate-950 border border-purple-500/30 rounded-lg text-xs space-y-2 font-mono text-purple-200">
                  <div className="font-bold text-purple-400 flex items-center justify-between">
                    <span>Diagnostic Report ({diagnosticsReport.diagnosticId})</span>
                    <span className="text-[10px] bg-purple-500/20 px-2 py-0.5 rounded">{diagnosticsReport.overallStatus}</span>
                  </div>
                  <p>{diagnosticsReport.summary}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 1.5: PLUGIN MANAGEMENT SYSTEM */}
        {activeTab === 'plugins' && (
          <div className="flex flex-col gap-6">
            {/* AI CORE PLUGIN INTERROGATOR */}
            <div className="p-6 bg-slate-900/80 border border-purple-500/30 rounded-xl space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                    <Plug className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      GURU-XD AI Core Plugin Orchestrator
                      <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono">
                        Live Plugin Query
                      </span>
                    </h2>
                    <p className="text-xs text-slate-400">
                      Query the GURU-XD AI Core Orchestrator to inspect installed plugins, resource consumption, service dependencies, or unhealthy plugins.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleRunPluginAiQuery}
                  disabled={queryingPluginAi}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs rounded-lg flex items-center gap-2 shadow-lg transition"
                >
                  <Brain className="w-4 h-4" />
                  {queryingPluginAi ? 'Querying...' : 'Query AI Core'}
                </button>
              </div>

              <div className="flex flex-col md:flex-row gap-3">
                <input
                  type="text"
                  value={pluginAiQuery}
                  onChange={(e) => setPluginAiQuery(e.target.value)}
                  placeholder="Ask AI Core about live plugins..."
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex flex-wrap gap-2 text-[11px]">
                <span className="text-slate-500 font-medium">Quick Prompts:</span>
                {[
                  'Which plugins are installed and enabled?',
                  'Which plugins consume high memory or CPU?',
                  'Which plugins expose services or subscribe to events?',
                  'Which plugins are failed or unhealthy?'
                ].map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => { setPluginAiQuery(chip); }}
                    className="px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-purple-500/20 hover:text-purple-300 text-slate-400 border border-slate-700/50 transition"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {pluginAiAnswer && (
                <div className="p-4 bg-slate-950/90 border border-purple-500/30 rounded-xl space-y-2 text-xs font-mono text-purple-200">
                  <div className="text-purple-400 font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    AI Core Orchestrator Response
                  </div>
                  <div>{pluginAiAnswer.answer}</div>
                  {pluginAiAnswer.plugins?.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-800 text-[11px] text-slate-300 space-y-1">
                      <div className="font-semibold text-purple-300">Matching Plugins:</div>
                      {pluginAiAnswer.plugins.map((p: any) => (
                        <div key={p.manifest.id} className="flex items-center justify-between bg-slate-900/60 p-2 rounded border border-slate-800">
                          <span>{p.manifest.name} ({p.manifest.id})</span>
                          <span className="text-purple-400 font-bold">{p.status} - {p.health.memoryMb}MB RAM</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* INSTALLED PLUGINS GRID */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Package className="w-4 h-4 text-purple-400" />
                  Installed Platform Plugins ({plugins.length})
                </h3>
                <span className="text-xs text-slate-400">
                  Managed via ModuleRegistry & PluginManager
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {plugins.map((plugin: any) => (
                  <div key={plugin.manifest.id} className="p-5 bg-slate-900/60 border border-slate-800 hover:border-purple-500/40 rounded-xl space-y-3 transition flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-300 font-semibold">
                          {plugin.manifest.id}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          plugin.enabled && plugin.status === 'ENABLED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {plugin.status}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-white">{plugin.manifest.name}</h4>
                        <p className="text-xs text-slate-400 line-clamp-2 mt-1">{plugin.manifest.description}</p>
                      </div>

                      <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-950/60 border border-slate-800/80 rounded-lg text-[11px] font-mono">
                        <div>
                          <div className="text-slate-500 text-[9px]">RAM</div>
                          <div className="text-purple-300 font-bold">{plugin.health?.memoryMb || 0} MB</div>
                        </div>
                        <div>
                          <div className="text-slate-500 text-[9px]">LATENCY</div>
                          <div className="text-emerald-400 font-bold">{plugin.health?.responseTimeMs || 0} ms</div>
                        </div>
                        <div>
                          <div className="text-slate-500 text-[9px]">VERSION</div>
                          <div className="text-cyan-300 font-bold">v{plugin.manifest.version}</div>
                        </div>
                      </div>

                      {plugin.manifest.services?.length > 0 && (
                        <div className="text-[11px] text-slate-300">
                          <span className="text-slate-500">Exposed Services: </span>
                          <span className="font-mono text-cyan-400">{plugin.manifest.services.map((s: any) => s.serviceKey).join(', ')}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 pt-3 border-t border-slate-800/80 text-xs">
                      <button
                        onClick={() => handleTogglePluginEnable(plugin.manifest.id, plugin.enabled)}
                        className={`flex-1 py-1.5 rounded-lg font-medium text-[11px] transition flex items-center justify-center gap-1 ${
                          plugin.enabled
                            ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}
                      >
                        {plugin.enabled ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        onClick={() => handleReloadPlugin(plugin.manifest.id)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                        title="Reload Plugin Configuration"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleUninstallPlugin(plugin.manifest.id)}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 transition"
                        title="Uninstall Plugin"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CATALOG DISCOVERY SECTION */}
            <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Package className="w-4 h-4 text-cyan-400" />
                Plugin Discovery Catalog
              </h3>
              <p className="text-xs text-slate-400">
                Discovered plugins ready for automatic validation and one-click orchestration.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pluginCatalog.map((manifest: any) => {
                  const isInstalled = plugins.some((p: any) => p.manifest.id === manifest.id);
                  return (
                    <div key={manifest.id} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3 flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-xs">{manifest.name}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">v{manifest.version}</span>
                        </div>
                        <p className="text-xs text-slate-400">{manifest.description}</p>
                      </div>

                      <button
                        onClick={() => handleInstallPlugin(manifest)}
                        disabled={isInstalled}
                        className={`px-3.5 py-2 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition ${
                          isInstalled 
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            : 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg'
                        }`}
                      >
                        <Plug className="w-3.5 h-3.5" />
                        {isInstalled ? 'Installed' : 'Install & Enable'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 1.6: INTERACTION GRAPH */}
        {activeTab === 'interaction-graph' && (
          <div className="flex flex-col gap-6">
            <div className="p-6 bg-slate-900/80 border border-cyan-500/30 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Share2 className="w-5 h-5 text-cyan-400" />
                    Live Platform Interaction Graph
                  </h2>
                  <p className="text-xs text-slate-400">
                    Real-time topological topology: Modules ↓ Services ↓ Events ↓ APIs ↓ Dependencies ↓ Plugins ↓ Infrastructure
                  </p>
                </div>
                {interactionGraph?.summary && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2.5 py-1 rounded bg-slate-800 text-cyan-300 font-mono">
                      {interactionGraph.summary.modulesCount} Modules
                    </span>
                    <span className="px-2.5 py-1 rounded bg-slate-800 text-purple-300 font-mono">
                      {interactionGraph.summary.pluginsCount} Plugins
                    </span>
                    <span className="px-2.5 py-1 rounded bg-slate-800 text-emerald-300 font-mono">
                      {interactionGraph.summary.servicesCount} Services
                    </span>
                    <span className="px-2.5 py-1 rounded bg-slate-800 text-amber-300 font-mono">
                      {interactionGraph.summary.routesCount} REST APIs
                    </span>
                  </div>
                )}
              </div>

              {/* GRAPH NODES LISTING BY CATEGORY */}
              {interactionGraph?.nodes && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                  {['module', 'plugin', 'service', 'event', 'api', 'infrastructure'].map((nodeType) => {
                    const filteredNodes = interactionGraph.nodes.filter((n: any) => n.type === nodeType);
                    if (filteredNodes.length === 0) return null;
                    return (
                      <div key={nodeType} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                          <span className="text-xs font-bold text-slate-200 capitalize flex items-center gap-1.5">
                            {nodeType === 'module' && <Layers className="w-3.5 h-3.5 text-cyan-400" />}
                            {nodeType === 'plugin' && <Plug className="w-3.5 h-3.5 text-purple-400" />}
                            {nodeType === 'service' && <Zap className="w-3.5 h-3.5 text-emerald-400" />}
                            {nodeType === 'event' && <Radio className="w-3.5 h-3.5 text-amber-400" />}
                            {nodeType === 'api' && <Workflow className="w-3.5 h-3.5 text-blue-400" />}
                            {nodeType === 'infrastructure' && <Server className="w-3.5 h-3.5 text-indigo-400" />}
                            {nodeType} Nodes ({filteredNodes.length})
                          </span>
                        </div>
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                          {filteredNodes.map((node: any) => (
                            <div key={node.id} className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-lg text-xs flex items-center justify-between">
                              <div>
                                <div className="font-semibold text-white">{node.label}</div>
                                <div className="text-[10px] font-mono text-slate-500">{node.id}</div>
                              </div>
                              <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400 font-mono">
                                {node.status || 'ACTIVE'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}


        {/* TAB 1: MODULE INVENTORY */}
        {activeTab === 'inventory' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            {/* Left Module List */}
            <div className="flex flex-col gap-4 lg:col-span-1">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter registered modules..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex flex-col gap-2 overflow-auto max-h-[600px] pr-1">
                {filteredModules.map((mod) => {
                  const isSelected = selectedModule?.manifest.id === mod.manifest.id;
                  return (
                    <div
                      key={mod.manifest.id}
                      onClick={() => setSelectedModule(mod)}
                      className={`p-3.5 rounded-xl border transition cursor-pointer ${
                        isSelected 
                          ? 'bg-cyan-500/10 border-cyan-500/40 text-white shadow-lg shadow-cyan-950/40' 
                          : 'bg-slate-900/60 border-slate-800/80 hover:bg-slate-900 text-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-semibold text-sm flex items-center gap-2">
                            {mod.manifest.name}
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                              v{mod.manifest.version}
                            </span>
                          </div>
                          <div className="font-mono text-[11px] text-slate-500 mt-0.5">
                            {mod.manifest.id}
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                          mod.status === 'ACTIVE' 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        }`}>
                          {mod.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                        {mod.manifest.description}
                      </p>
                      <div className="flex items-center justify-between mt-3 text-[11px] text-slate-400 pt-2 border-t border-slate-800/60">
                        <span>Services: {mod.manifest.services.length}</span>
                        <span>Capabilities: {mod.manifest.capabilities.length}</span>
                        <span className="text-emerald-400 font-medium">Health: {mod.health?.score || 100}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Detail Inspection */}
            {selectedModule ? (
              <div className="lg:col-span-2 flex flex-col gap-5 p-5 bg-slate-900/40 border border-slate-800 rounded-xl">
                <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center gap-3">
                      {selectedModule.manifest.name}
                      <span className="text-xs px-2.5 py-0.5 rounded bg-slate-800 text-cyan-400 font-mono">
                        v{selectedModule.manifest.version}
                      </span>
                    </h2>
                    <div className="text-xs text-slate-400 mt-1">
                      Author: <span className="text-slate-200">{selectedModule.manifest.author?.name || selectedModule.manifest.author}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-400">Lifecycle State</div>
                    <div className="font-mono text-xs text-cyan-400 font-semibold">{selectedModule.lifecycleState}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
                    <div className="text-slate-400 mb-1">Health Score</div>
                    <div className="text-xl font-bold text-emerald-400">{selectedModule.health?.score || 100}/100</div>
                    <div className="text-[11px] text-slate-400 mt-1">{selectedModule.health?.details || 'Operational'}</div>
                  </div>
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg">
                    <div className="text-slate-400 mb-1">Registered At</div>
                    <div className="font-mono text-slate-200">{new Date(selectedModule.registeredAt).toLocaleString()}</div>
                    <div className="text-[11px] text-slate-500 mt-1">ID: {selectedModule.manifest.id}</div>
                  </div>
                </div>

                {/* Exposed Services */}
                <div>
                  <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Exposed Reusable Services ({selectedModule.manifest.services.length})
                  </h3>
                  <div className="grid grid-cols-1 gap-2">
                    {selectedModule.manifest.services.map((srv: any) => (
                      <div key={srv.serviceKey} className="p-2.5 bg-slate-900/80 border border-slate-800 rounded-lg flex items-center justify-between text-xs">
                        <div>
                          <span className="font-mono text-cyan-400 font-semibold">{srv.serviceKey}</span>
                          <p className="text-slate-400 mt-0.5">{srv.description}</p>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedServiceKey(srv.serviceKey);
                            setActiveTab('services');
                          }}
                          className="px-2.5 py-1 text-[11px] rounded bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition"
                        >
                          Test Invoke
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Capabilities */}
                <div>
                  <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Advertised Capabilities ({selectedModule.manifest.capabilities.length})
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedModule.manifest.capabilities.map((cap: any) => (
                      <span key={cap.id} className="px-2.5 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs rounded-lg flex items-center gap-1.5">
                        <Zap className="w-3 h-3 text-purple-400" />
                        {cap.name}
                        <span className="text-[10px] text-purple-400/60">({cap.category})</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Routes */}
                <div>
                  <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Exposed REST API Routes ({selectedModule.manifest.routes.length})
                  </h3>
                  <div className="space-y-1.5">
                    {selectedModule.manifest.routes.map((rt: any, idx: number) => (
                      <div key={idx} className="p-2 bg-slate-900 border border-slate-800 rounded text-xs flex items-center justify-between">
                        <div className="flex items-center gap-2 font-mono">
                          <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-bold">
                            {rt.method}
                          </span>
                          <span className="text-slate-200">{rt.path}</span>
                        </div>
                        <span className="text-slate-400 text-[11px]">{rt.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="lg:col-span-2 flex items-center justify-center text-slate-500 text-xs">
                Select a module from the inventory list to inspect details
              </div>
            )}
          </div>
        )}

        {/* TAB 2: AI DISCOVERY ENGINE */}
        {activeTab === 'ai-discovery' && (
          <div className="flex flex-col gap-6 max-w-4xl mx-auto">
            <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <Search className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Zero-Hardcode AI Discovery Engine</h2>
                  <p className="text-xs text-slate-400">
                    Query the AI Core Orchestrator to reason over live module capabilities, services, routes, and health.
                  </p>
                </div>
              </div>

              {/* Sample Queries */}
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="text-slate-400 self-center">Try query:</span>
                {[
                  'Which module can deploy applications?',
                  'Which modules manage users?',
                  'What services are available?',
                  'List all degraded or failed modules',
                  'Which module has stats capability?'
                ].map((sample, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setAiQuery(sample);
                      handleRunAiQuery(sample);
                    }}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-md transition"
                  >
                    "{sample}"
                  </button>
                ))}
              </div>

              {/* Query Input */}
              <div className="flex gap-3">
                <input
                  type="text"
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                  placeholder="Ask AI Discovery Engine about platform modules..."
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
                <button
                  onClick={() => handleRunAiQuery()}
                  disabled={queryingAi}
                  className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  {queryingAi ? 'Reasoning...' : 'Query AI'}
                </button>
              </div>
            </div>

            {/* AI Result Card */}
            {aiResult && (
              <div className="p-6 bg-slate-900/80 border border-cyan-500/30 rounded-xl space-y-4 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-xs font-mono text-cyan-400 font-bold uppercase tracking-wider">
                    Query Type: {aiResult.queryType}
                  </span>
                  <span className="text-[11px] text-slate-500">{new Date(aiResult.timestamp).toLocaleTimeString()}</span>
                </div>

                <div className="p-3 bg-slate-950 rounded-lg text-xs text-slate-200 border border-slate-800/80 font-sans leading-relaxed">
                  <span className="font-semibold text-cyan-400">AI Explanation: </span>
                  {aiResult.explanation}
                </div>

                {/* Matched Modules */}
                {aiResult.matchedModules?.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold text-slate-300 mb-2">Matched Modules ({aiResult.matchedModules.length})</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {aiResult.matchedModules.map((m: any) => (
                        <div key={m.manifest.id} className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs">
                          <div className="font-semibold text-white">{m.manifest.name}</div>
                          <div className="text-[11px] font-mono text-slate-500">{m.manifest.id} (v{m.manifest.version})</div>
                          <p className="text-slate-400 text-[11px] mt-1 line-clamp-2">{m.manifest.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: KNOWLEDGE GRAPH */}
        {activeTab === 'knowledge-graph' && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Live Module Knowledge Graph</h2>
                <p className="text-xs text-slate-400">
                  Graphs inter-module dependency, service provision, capability exposure, event subscriptions, and REST routes.
                </p>
              </div>
              <div className="text-xs text-slate-400 font-mono">
                Nodes: {knowledgeGraph?.nodes?.length || 0} | Edges: {knowledgeGraph?.edges?.length || 0}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nodes Summary */}
              <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
                <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  Knowledge Graph Nodes
                </h3>
                <div className="space-y-2 max-h-[400px] overflow-auto pr-2">
                  {knowledgeGraph?.nodes?.map((node: any) => (
                    <div key={node.id} className="p-2.5 bg-slate-950 border border-slate-800 rounded text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          node.type === 'module' ? 'bg-cyan-500/20 text-cyan-300' :
                          node.type === 'service' ? 'bg-emerald-500/20 text-emerald-300' :
                          node.type === 'capability' ? 'bg-purple-500/20 text-purple-300' :
                          node.type === 'event' ? 'bg-amber-500/20 text-amber-300' :
                          'bg-blue-500/20 text-blue-300'
                        }`}>
                          {node.type}
                        </span>
                        <span className="text-slate-200 font-medium">{node.name}</span>
                      </div>
                      <span className="font-mono text-[10px] text-slate-500">{node.id}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Relationship Edges */}
              <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
                <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Network className="w-4 h-4 text-purple-400" />
                  Relationship Edges ({knowledgeGraph?.edges?.length || 0})
                </h3>
                <div className="space-y-2 max-h-[400px] overflow-auto pr-2">
                  {knowledgeGraph?.edges?.map((edge: any, i: number) => (
                    <div key={i} className="p-2.5 bg-slate-950 border border-slate-800 rounded text-xs flex items-center gap-2">
                      <span className="font-mono text-[11px] text-cyan-300">{edge.source}</span>
                      <span className="px-1.5 py-0.5 text-[9px] rounded bg-slate-800 text-slate-400 font-mono">
                        {edge.relation}
                      </span>
                      <span className="font-mono text-[11px] text-emerald-300">{edge.target}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SERVICE REGISTRY */}
        {activeTab === 'services' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-emerald-400" />
                Dynamic Service Invocation Console
              </h2>
              <p className="text-xs text-slate-400">
                Invoke exported module services dynamically through the central ServiceRegistryEngine without direct module import references.
              </p>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-300 font-medium mb-1 block">Select Service Key</label>
                  <select
                    value={selectedServiceKey}
                    onChange={(e) => setSelectedServiceKey(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                  >
                    {services.map(s => (
                      <option key={s.serviceKey} value={s.serviceKey}>
                        {s.serviceKey} ({s.name})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-medium mb-1 block">Invocation Parameters (JSON)</label>
                  <textarea
                    rows={4}
                    value={serviceParams}
                    onChange={(e) => setServiceParams(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <button
                  onClick={handleInvokeService}
                  disabled={invokingService}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition"
                >
                  <Play className="w-4 h-4 fill-current" />
                  {invokingService ? 'Executing Service...' : 'Execute Registered Service'}
                </button>
              </div>
            </div>

            {/* Service Result Output */}
            <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                Execution Response & Telemetry
              </h3>

              {serviceResult ? (
                <pre className="p-4 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-emerald-400 overflow-auto max-h-[400px]">
                  {JSON.stringify(serviceResult, null, 2)}
                </pre>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-slate-500 text-xs font-mono">
                  Select a service key and click "Execute Registered Service" to inspect response
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: EVENT PUB/SUB */}
        {activeTab === 'events' && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Radio className="w-5 h-5 text-amber-400" />
                  Event Registry & Live Telemetry Stream
                </h2>
                <p className="text-xs text-slate-400">
                  Inspect module-defined pub/sub events and live event emissions.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
                <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Live Event Telemetry Log ({events.length})
                </h3>
                <div className="space-y-2 max-h-[450px] overflow-auto pr-2">
                  {events.map((evt: any) => (
                    <div key={evt.eventId} className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs space-y-1">
                      <div className="flex items-center justify-between font-mono">
                        <span className="text-amber-400 font-bold">{evt.eventType}</span>
                        <span className="text-slate-500 text-[10px]">{new Date(evt.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <div className="text-slate-400 text-[11px]">Publisher Module: <span className="text-slate-200 font-mono">{evt.moduleId}</span></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: AUTOMATED AUDITS */}
        {activeTab === 'audit' && (
          <div className="flex flex-col gap-6 max-w-4xl mx-auto">
            <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Activity className="w-5 h-5 text-cyan-400" />
                    Automated Module Health & Contract Audit Engine
                  </h2>
                  <p className="text-xs text-slate-400">
                    Performs continuous inspection of registration contracts, semver compatibility, security policies, missing dependencies, route conflicts, and memory metrics.
                  </p>
                </div>
                <button
                  onClick={handleRunAudit}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg flex items-center gap-2 transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  Run Audit Scan Now
                </button>
              </div>

              {auditReport && (
                <div className="grid grid-cols-4 gap-3 text-xs pt-2">
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                    <div className="text-slate-400">Audited Modules</div>
                    <div className="text-lg font-bold text-white mt-1">{auditReport.totalModules}</div>
                  </div>
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                    <div className="text-slate-400">Warnings</div>
                    <div className="text-lg font-bold text-amber-400 mt-1">{auditReport.warningsCount}</div>
                  </div>
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                    <div className="text-slate-400">Errors</div>
                    <div className="text-lg font-bold text-rose-400 mt-1">{auditReport.errorsCount}</div>
                  </div>
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                    <div className="text-slate-400">Overall Status</div>
                    <div className={`text-lg font-bold mt-1 ${
                      auditReport.overallStatus === 'PASS' ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {auditReport.overallStatus}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Audit Findings */}
            {auditReport?.items && (
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Audit Findings & Inspection Items</h3>
                {auditReport.items.map((item: any) => (
                  <div key={item.id} className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.severity === 'CRITICAL' || item.severity === 'ERROR' ? 'bg-rose-500/20 text-rose-300' :
                        item.severity === 'WARNING' ? 'bg-amber-500/20 text-amber-300' : 'bg-cyan-500/20 text-cyan-300'
                      }`}>
                        {item.severity} - {item.category}
                      </span>
                      <span className="font-mono text-slate-500 text-[11px]">{item.moduleId}</span>
                    </div>
                    <div className="font-semibold text-white mt-1">{item.title}</div>
                    <p className="text-slate-300 text-xs">{item.message}</p>
                    <div className="text-emerald-400 text-[11px] pt-1 font-mono">Recommendation: {item.recommendation}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 7: SECURITY & SEMVER */}
        {activeTab === 'security' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-cyan-400" />
                Security Validator & Manifest Inspector
              </h2>
              <p className="text-xs text-slate-400">
                Validate candidate module manifests against security policy rules, duplicate ID checks, elevated permissions, and semver contracts.
              </p>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-300 font-medium mb-1 block">Candidate Module Manifest JSON</label>
                  <textarea
                    rows={12}
                    value={manifestJson}
                    onChange={(e) => setManifestJson(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <button
                  onClick={handleSecurityCheck}
                  disabled={checkingSecurity}
                  className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-lg flex items-center justify-center gap-2 transition"
                >
                  <ShieldCheck className="w-4 h-4" />
                  {checkingSecurity ? 'Validating...' : 'Validate Module Security'}
                </button>
              </div>
            </div>

            {/* Validation Output */}
            <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Security Assessment Results
              </h3>

              {securityResult ? (
                <div className="space-y-4 text-xs">
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between">
                    <div>
                      <div className="text-slate-400">Security Score</div>
                      <div className={`text-2xl font-bold mt-0.5 ${
                        securityResult.securityScore >= 80 ? 'text-emerald-400' : 'text-amber-400'
                      }`}>
                        {securityResult.securityScore}/100
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      securityResult.valid ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                    }`}>
                      {securityResult.valid ? 'PASSED SECURITY' : 'FAILED SECURITY'}
                    </span>
                  </div>

                  {securityResult.errors?.length > 0 && (
                    <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-300 space-y-1">
                      <div className="font-semibold text-rose-400">Errors ({securityResult.errors.length})</div>
                      {securityResult.errors.map((err: string, i: number) => (
                        <div key={i} className="text-[11px]">• {err}</div>
                      ))}
                    </div>
                  )}

                  {securityResult.warnings?.length > 0 && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-300 space-y-1">
                      <div className="font-semibold text-amber-400">Warnings ({securityResult.warnings.length})</div>
                      {securityResult.warnings.map((warn: string, i: number) => (
                        <div key={i} className="text-[11px]">• {warn}</div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-slate-500 text-xs font-mono">
                  Paste manifest JSON and click "Validate Module Security" to evaluate security score
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
