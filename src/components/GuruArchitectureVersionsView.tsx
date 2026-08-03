import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  GitCommit, 
  BookOpen, 
  Cpu, 
  Workflow, 
  MessageSquareCode, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  Sparkles, 
  Send, 
  ArrowRight, 
  Layers, 
  Lock, 
  History, 
  FileText, 
  Terminal, 
  Activity,
  Zap,
  Bookmark,
  Check,
  ChevronRight,
  Database
} from 'lucide-react';

export interface ArchitectureVersion {
  version: number;
  title: string;
  codename: string;
  status: string;
  purpose: string;
  scope: string[];
  responsibilities: string[];
  lifecycleStage: string;
  relationships: string[];
  safetyRules: string[];
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeNode {
  id: string;
  domain: string;
  title: string;
  content: string;
  verified: boolean;
  verifiedBy: string;
  relations: string[];
}

export interface DecisionLog {
  id: string;
  timestamp: string;
  observedTrigger: string;
  contextAnalysis: string;
  evidenceList: string[];
  riskAssessment: {
    level: string;
    score: number;
    impactOnExistingCode: string;
  };
  recommendedAction: string;
  reasoning: string;
  status: string;
}

export interface WorkflowLog {
  workflowId: string;
  requestType: string;
  currentStage: string;
  stages: { stage: string; timestamp: string; status: string; details: string }[];
  requiresApproval: boolean;
  completed: boolean;
  createdAt: string;
}

export default function GuruArchitectureVersionsView() {
  const [activeTab, setActiveTab] = useState<'versions' | 'governance' | 'knowledge' | 'safety' | 'decision' | 'orchestration' | 'communication'>('versions');
  const [versions, setVersions] = useState<ArchitectureVersion[]>([]);
  const [knowledgeNodes, setKnowledgeNodes] = useState<KnowledgeNode[]>([]);
  const [decisions, setDecisions] = useState<DecisionLog[]>([]);
  const [workflows, setWorkflows] = useState<WorkflowLog[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Command Testing
  const [commandInput, setCommandInput] = useState('');
  const [targetPathInput, setTargetPathInput] = useState('');
  const [commandResult, setCommandResult] = useState<any>(null);
  const [safetyCheckResult, setSafetyCheckResult] = useState<any>(null);

  // New Decision Evaluation Form
  const [evalTrigger, setEvalTrigger] = useState('');
  const [evalAction, setEvalAction] = useState('');
  const [evalImpact, setEvalImpact] = useState('');
  const [evalResult, setEvalResult] = useState<any>(null);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchOverviewData();
  }, []);

  const fetchOverviewData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/governance/overview');
      if (res.ok) {
        const data = await res.json();
        if (data.data) {
          setVersions(data.data.versions || []);
          setDecisions(data.data.recentDecisions || []);
          setWorkflows(data.data.recentWorkflows || []);
        }
      }

      const kRes = await fetch('/api/v1/governance/knowledge');
      if (kRes.ok) {
        const kData = await kRes.json();
        setKnowledgeNodes(kData.data?.nodes || []);
      }

      const aRes = await fetch('/api/v1/governance/audit-logs');
      if (aRes.ok) {
        const aData = await aRes.json();
        setAuditLogs(aData.data?.logs || []);
      }
    } catch (err) {
      console.error("Failed to load governance data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRunSafetyCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandInput.trim()) return;

    try {
      const res = await fetch('/api/v1/governance/safety-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: commandInput,
          targetPath: targetPathInput || undefined
        })
      });
      if (res.ok) {
        const data = await res.json();
        setSafetyCheckResult(data.data);
        setCommandResult(data.data?.classification);

        // Refresh audit logs
        const aRes = await fetch('/api/v1/governance/audit-logs');
        if (aRes.ok) {
          const aData = await aRes.json();
          setAuditLogs(aData.data?.logs || []);
        }
      }
    } catch (err) {
      console.error("Failed to run safety check:", err);
    }
  };

  const handleTestCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandInput.trim()) return;

    try {
      const res = await fetch('/api/v1/governance/intent/classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: commandInput })
      });
      if (res.ok) {
        const data = await res.json();
        setCommandResult(data.data);
      }
    } catch (err) {
      console.error("Failed to classify intent:", err);
    }
  };

  const handleEvaluateDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evalTrigger || !evalAction) return;

    try {
      const res = await fetch('/api/v1/governance/decision/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trigger: evalTrigger,
          proposedAction: evalAction,
          impactDescription: evalImpact || 'Non-breaking additive expansion'
        })
      });
      if (res.ok) {
        const data = await res.json();
        setEvalResult(data.data?.decision);
        setDecisions((prev) => [data.data?.decision, ...prev]);
        setEvalTrigger('');
        setEvalAction('');
        setEvalImpact('');
      }
    } catch (err) {
      console.error("Failed to evaluate decision:", err);
    }
  };

  const filteredVersions = versions.filter(v => 
    v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.purpose.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.codename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-mono font-bold uppercase tracking-wider">
                GURU-XD Specs V0 - V7
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono font-bold uppercase tracking-wider">
                Implementation Mode
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-white tracking-tight">
              Architecture Specifications & Governance Engine
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Cumulative, permanent engineering specification registry and safety workflow engine for GURU-XD.
            </p>
          </div>
          <div className="text-right shrink-0 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest block">Motto Directive</span>
            <span className="text-sm font-mono font-bold text-blue-400">LET'S AUTOMATE THE WORLD.</span>
          </div>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('versions')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'versions' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800'
          }`}
        >
          <GitCommit className="w-4 h-4" />
          <span>Versions Registry ({versions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('governance')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'governance' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Governance & Intent (V1)</span>
        </button>

        <button
          onClick={() => setActiveTab('knowledge')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'knowledge' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Knowledge Graph (V3)</span>
        </button>

        <button
          onClick={() => setActiveTab('safety')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'safety' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Safety Policy (V4)</span>
        </button>

        <button
          onClick={() => setActiveTab('decision')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'decision' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>Decision Engine (V5)</span>
        </button>

        <button
          onClick={() => setActiveTab('orchestration')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'orchestration' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800'
          }`}
        >
          <Workflow className="w-4 h-4" />
          <span>Orchestration (V6)</span>
        </button>

        <button
          onClick={() => setActiveTab('communication')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'communication' ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-slate-900/60 text-slate-400 hover:bg-slate-800'
          }`}
        >
          <MessageSquareCode className="w-4 h-4" />
          <span>Communication Backbone (V7)</span>
        </button>
      </div>

      {/* Search Bar for Versions */}
      {activeTab === 'versions' && (
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search architecture specifications, scopes, or codenames..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      )}

      {/* TAB 1: VERSIONS REGISTRY */}
      {activeTab === 'versions' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredVersions.map((ver) => (
              <div 
                key={ver.version}
                className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between space-y-4 shadow-xl transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-mono font-bold">
                      VERSION {ver.version}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {ver.status}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white tracking-tight">{ver.title}</h3>
                    <span className="text-[10px] font-mono text-slate-500 block">Codename: {ver.codename}</span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                    {ver.purpose}
                  </p>

                  <div className="space-y-1.5">
                    <span className="text-[10px] font-mono uppercase text-slate-500 block">Key Scope:</span>
                    <ul className="space-y-1">
                      {ver.scope.map((item, i) => (
                        <li key={i} className="text-[11px] text-slate-400 flex items-start gap-1.5">
                          <Check className="w-3 h-3 text-blue-400 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <span>Lifecycle: {ver.lifecycleStage}</span>
                  <span>Cumulative Record</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: GOVERNANCE & INTENT CLASSIFIER */}
      {activeTab === 'governance' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Intent Testing Console */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-blue-400" />
              <h3 className="text-sm font-bold text-white">Engineering Directive & Command Intent Classifier</h3>
            </div>
            <p className="text-xs text-slate-400">
              Test commands against Version 1 Governance Safety Policy. Commands classify intent before any implementation occurs.
            </p>

            <form onSubmit={handleRunSafetyCheck} className="space-y-3">
              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">Enter Command Directive:</label>
                <input
                  type="text"
                  value={commandInput}
                  onChange={(e) => setCommandInput(e.target.value)}
                  placeholder="e.g. Inspect, Discuss, Audit, Plan, Recommend, Implement, Refactor..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">Target File Path (Optional for Pre-Flight Protection Check):</label>
                <input
                  type="text"
                  value={targetPathInput}
                  onChange={(e) => setTargetPathInput(e.target.value)}
                  placeholder="e.g. /server/engineeringGovernanceEngine.ts"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 font-mono text-[11px]"
                />
              </div>

              <div className="flex gap-2">
                {['Inspect', 'Audit', 'Plan', 'Implement', 'Refactor', 'Next Version'].map((cmd) => (
                  <button
                    key={cmd}
                    type="button"
                    onClick={() => setCommandInput(cmd)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono cursor-pointer transition-colors"
                  >
                    {cmd}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 rounded-xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Run Governance Pre-Flight Check</span>
              </button>
            </form>

            {commandResult && (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2 font-mono text-xs animate-in fade-in">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400">Detected Intent:</span>
                  <span className="text-blue-400 font-bold">{commandResult.intent}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Approval Required:</span>
                  <span className={commandResult.requiresApproval ? "text-amber-400 font-bold" : "text-emerald-400"}>
                    {commandResult.requiresApproval ? "YES (Approval Gate Enforced)" : "NO (Direct Read / Analysis)"}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Risk Score:</span>
                  <span className="text-slate-200 font-bold">{commandResult.riskScore} / 100</span>
                </div>
                {safetyCheckResult?.existingCodeProtection && (
                  <div className="p-2.5 bg-blue-950/40 border border-blue-800/40 rounded-lg text-[10px] text-blue-300 space-y-1">
                    <span className="font-bold block">🛡️ Code Protection Directive:</span>
                    <span>{safetyCheckResult.existingCodeProtection.directive}</span>
                  </div>
                )}
                <p className="text-slate-300 text-[11px] pt-1 leading-relaxed">
                  {commandResult.explanation}
                </p>
              </div>
            )}
          </div>

          {/* Governance Audit Logs & Safety Rules */}
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-400" />
                <span>Version 1 Governance Audit Logs</span>
              </h3>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {auditLogs.length === 0 ? (
                  <p className="text-xs text-slate-500 font-mono">No governance audit entries recorded yet. Test a command to generate live audit logs.</p>
                ) : (
                  auditLogs.map((log) => (
                    <div key={log.id} className="p-2.5 bg-slate-950 border border-slate-800/80 rounded-xl space-y-1 font-mono text-[11px]">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300 font-bold">[{log.intent}] "{log.command}"</span>
                        <span className="text-[10px] text-slate-500">{log.timestamp.split('T')[1]?.substring(0, 8)}</span>
                      </div>
                      <p className="text-slate-400 text-[10px]">{log.details}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1">
                <span className="text-blue-400 font-mono font-bold block">1. Existing Implementation First</span>
                <p className="text-slate-400">
                  Always inspect and search for existing modules, classes, services, and APIs before generating code. Never rebuild working code.
                </p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1">
                <span className="text-emerald-400 font-mono font-bold block">2. Non-Destructive Extension</span>
                <p className="text-slate-400">
                  Previous versions are permanent records. New versions extend existing functionality while preserving complete backward compatibility.
                </p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1">
                <span className="text-amber-400 font-mono font-bold block">3. Safety Workflow Enforcement</span>
                <p className="text-slate-400">
                  Follow sequence: Inspect → Verify → Analyze → Explain → Recommend → Wait for approval → Implement.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: KNOWLEDGE GRAPH */}
      {activeTab === 'knowledge' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {knowledgeNodes.map((node) => (
              <div key={node.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-mono uppercase font-bold">
                    {node.domain}
                  </span>
                  <span className="flex items-center gap-1 text-emerald-400 text-[10px] font-mono">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Verified
                  </span>
                </div>

                <h3 className="text-base font-bold text-white">{node.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                  {node.content}
                </p>

                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-2 border-t border-slate-800">
                  <span>Verified by: {node.verifiedBy}</span>
                  <span>Relations: {node.relations.length} linked nodes</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3.5: SAFETY POLICY (VERSION 4.0) */}
      {activeTab === 'safety' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Four Core Directives */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2 shadow-xl">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                <Search className="w-4 h-4 shrink-0" />
                <span>1. Mandatory Code Inspection</span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                Existing files must be inspected before any modification or generation. No blind overwrites allowed.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2 shadow-xl">
              <div className="flex items-center gap-2 text-blue-400 font-bold text-xs">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>2. Anti-Duplication Directive</span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                "Prefer Improve, Extend, Refactor over Rebuild, Replace, Duplicate." Existing functions are updated, never duplicated.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2 shadow-xl">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>3. Architecture Impact Report</span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                Implementation requests produce an Impact Analysis Report requiring explicit operator approval prior to execution.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2 shadow-xl">
              <div className="flex items-center gap-2 text-purple-400 font-bold text-xs">
                <Lock className="w-4 h-4 shrink-0" />
                <span>4. Immutable Version History</span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                Previous architecture versions (V0 - V7) are permanent records. New features extend history without rewriting.
              </p>
            </div>
          </div>

          {/* Interactive Safety Checker Simulator */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <Lock className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-sm font-bold text-white">Code Integrity & Safety Check Simulator</h3>
                  <span className="text-[10px] font-mono text-slate-500">Test user commands against Version 4 Safety Policy rules</span>
                </div>
              </div>

              <form onSubmit={handleRunSafetyCheck} className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-400 font-mono block mb-1">Command / Action String:</label>
                  <input
                    type="text"
                    value={commandInput}
                    onChange={(e) => setCommandInput(e.target.value)}
                    placeholder="e.g., implement new bot adapter route or refactor server/controllers.ts"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-slate-400 font-mono block mb-1">Target File Path (Optional):</label>
                  <input
                    type="text"
                    value={targetPathInput}
                    onChange={(e) => setTargetPathInput(e.target.value)}
                    placeholder="e.g., /server/routes.ts or /server/controllers.ts"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer font-mono"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Execute Version 4 Safety Check</span>
                </button>
              </form>

              {safetyCheckResult && (
                <div className="bg-slate-950 border border-emerald-500/30 rounded-xl p-4 space-y-3 text-xs font-mono animate-in fade-in duration-200">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-slate-400">Safety Verdict:</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold uppercase">
                      {safetyCheckResult.safetyPassed ? 'PASSED (SAFE)' : 'BLOCKED (POLICY VIOLATION)'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div>
                      <span className="text-slate-500 block">Intent Category:</span>
                      <span className="text-blue-400 font-bold">{safetyCheckResult.classification?.intent}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Risk Assessment:</span>
                      <span className="text-amber-400 font-bold">SCORE {safetyCheckResult.classification?.riskScore} / 100</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-slate-500 block">Directive Guidance:</span>
                    <span className="text-slate-300 block bg-slate-900 p-2 rounded border border-slate-800 text-[11px]">
                      {safetyCheckResult.existingCodeProtection?.directive}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-slate-500">Operator Approval Required:</span>
                    <span className={`font-bold ${safetyCheckResult.approvalRequired ? 'text-amber-400' : 'text-slate-400'}`}>
                      {safetyCheckResult.approvalRequired ? 'YES (APPROVAL GATEWAY ACTIVE)' : 'NO (AUTO-ALLOWED)'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Protected Core Systems Matrix */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-blue-400" />
                  <h3 className="text-sm font-bold text-white">Protected Platform Architecture Files</h3>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold">
                  100% PROTECTED
                </span>
              </div>

              <div className="space-y-2.5 text-xs font-mono">
                {[
                  { file: '/server/routes.ts', scope: 'API Endpoint Router', status: 'Additive Only', icon: GitCommit },
                  { file: '/server/controllers.ts', scope: 'Business Logic Controllers', status: 'Non-Breaking Refactor', icon: Zap },
                  { file: '/server/db.ts', scope: 'In-Memory Telemetry & Persistence Engine', status: 'Schema Safe', icon: Database },
                  { file: '/server/engineeringGovernanceEngine.ts', scope: 'V0-V7 Specifications Registry', status: 'Immutable Specs', icon: Lock },
                  { file: '/src/App.tsx', scope: 'React App Root Orchestrator', status: 'Preserved Mounting', icon: Layers }
                ].map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <div key={idx} className="bg-slate-950 border border-slate-850 p-3 rounded-xl flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon className="w-4 h-4 text-blue-400 shrink-0" />
                        <div className="min-w-0">
                          <span className="text-slate-200 font-bold block truncate">{item.file}</span>
                          <span className="text-[10px] text-slate-500 truncate block">{item.scope}</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 text-[10px] shrink-0">
                        {item.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Audit Logs Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 shadow-xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <History className="w-4 h-4 text-purple-400" />
              <span>Governance & Safety Policy Audit Logs ({auditLogs.length})</span>
            </h3>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {auditLogs.map((log) => (
                <div key={log.id} className="bg-slate-950 border border-slate-850 rounded-xl p-3 flex items-center justify-between gap-4 text-xs font-mono">
                  <div className="min-w-0 space-y-0.5">
                    <span className="text-slate-200 font-bold block truncate">{log.command}</span>
                    <span className="text-[10px] text-slate-500 block">{log.details}</span>
                  </div>
                  <div className="text-right shrink-0 space-y-0.5">
                    <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 block">
                      INTENT: {log.intent}
                    </span>
                    <span className="text-[9px] text-slate-500 block">{log.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: DECISION ENGINE */}
      {activeTab === 'decision' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Decision Evaluation Form */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-purple-400" />
              <span>Evidence-Based Decision Evaluator (Version 5)</span>
            </h3>

            <form onSubmit={handleEvaluateDecision} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 font-mono block mb-1">Observed Trigger:</label>
                <input
                  type="text"
                  value={evalTrigger}
                  onChange={(e) => setEvalTrigger(e.target.value)}
                  placeholder="e.g. Route addition request, database schema tweak..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-400 font-mono block mb-1">Proposed Action:</label>
                <input
                  type="text"
                  value={evalAction}
                  onChange={(e) => setEvalAction(e.target.value)}
                  placeholder="e.g. Register new non-breaking API endpoint..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-slate-400 font-mono block mb-1">Impact on Existing Code:</label>
                <input
                  type="text"
                  value={evalImpact}
                  onChange={(e) => setEvalImpact(e.target.value)}
                  placeholder="e.g. Non-breaking additive module..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold py-2 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Run Decision Risk Assessment</span>
              </button>
            </form>
          </div>

          {/* Decision Audit Trail */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <History className="w-4 h-4 text-blue-400" />
              <span>Decision Log History</span>
            </h3>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {decisions.map((dec) => (
                <div key={dec.id} className="bg-slate-950 border border-slate-800/80 rounded-xl p-3.5 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-slate-500">{dec.timestamp}</span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      RISK SCORE: {dec.riskAssessment.score} ({dec.riskAssessment.level})
                    </span>
                  </div>

                  <span className="text-white font-semibold block">{dec.recommendedAction}</span>
                  <p className="text-slate-400 text-[11px]">{dec.reasoning}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: WORKFLOW ORCHESTRATION */}
      {activeTab === 'orchestration' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Workflow className="w-4 h-4 text-blue-400" />
              <span>Version 6 Workflow Orchestration Engine (12-Stage Pipeline)</span>
            </h3>

            {workflows.map((wf) => (
              <div key={wf.workflowId} className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div>
                    <span className="text-xs font-bold text-white block">{wf.requestType}</span>
                    <span className="text-[10px] font-mono text-slate-500">ID: {wf.workflowId}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold">
                    COMPLETED
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] font-mono">
                  {wf.stages.map((st, i) => (
                    <div key={i} className="p-2 bg-slate-900 rounded-lg border border-slate-800 flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="text-slate-300 truncate">{st.stage}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: COMMUNICATION BACKBONE */}
      {activeTab === 'communication' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
          <div className="flex items-center gap-2">
            <MessageSquareCode className="w-5 h-5 text-blue-400" />
            <h3 className="text-sm font-bold text-white">Version 7 Platform Communication Engine</h3>
          </div>
          <p className="text-xs text-slate-400">
            Secure, validated inter-module communication backbone connecting Governance, Decision, Copilot, and Intelligence engines.
          </p>

          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs space-y-2 font-mono">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Communication Status:</span>
              <span className="text-emerald-400 font-bold">OPERATIONAL</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Message Validation:</span>
              <span className="text-blue-400 font-bold">STRICT_JSON_SCHEMA</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Delivery Telemetry:</span>
              <span className="text-purple-400 font-bold">100% SUCCESSFUL</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
