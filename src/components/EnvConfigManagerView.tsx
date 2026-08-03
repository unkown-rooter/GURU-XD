import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Key, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Eye, 
  EyeOff, 
  Lock, 
  Zap, 
  Cpu, 
  Database, 
  Bell, 
  Search, 
  Filter, 
  ArrowRight,
  Shield,
  FileText,
  Check,
  X,
  Plus,
  Server,
  Activity,
  Compass,
  Layers,
  Clock,
  DollarSign,
  TrendingUp,
  Sliders
} from 'lucide-react';

export interface EnvVariableItem {
  key: string;
  name: string;
  category: string;
  providerId: string;
  status: 'Configured' | 'Missing' | 'Invalid';
  purpose: string;
  storedValue: string;
  isSecret: boolean;
  defaultModel: string;
  lastVerifiedAt: string;
  verificationStatus: 'VERIFIED' | 'UNTESTED' | 'FAILED';
  verificationDetails: string;
  latencyMs?: number;
}

export interface EnvManagerSummary {
  totalRequired: number;
  configuredCount: number;
  missingCount: number;
  invalidCount: number;
  verifiedProvidersCount: number;
}

export interface ProviderAuditItem {
  providerId: string;
  providerName: string;
  enabled: boolean;
  configured: boolean;
  lastRequestTime: string;
  totalRequestsToday: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTimeMs: number;
  averageCostUsd: number;
  totalCostUsd: number;
  currentStatus: string;
  rawStatus: string;
  currentModel: string;
  lastError: string;
  isReceivingTraffic: boolean;
  configuredEnvVar: string;
}

export interface DecisionLogItem {
  decision: string;
  time: string;
  selectedProvider: string;
  reason: string;
  evidence: string;
  confidence: number;
  result: string;
}

export interface AuditReportData {
  timestamp: string;
  providers: ProviderAuditItem[];
  summary: {
    totalConfiguredProviders: number;
    providersActivelyServingRequests: number;
    idleProviders: number;
    offlineProviders: number;
    recommendedProviderOrder: string[];
    currentFailoverChain: string[];
    automaticFailoverStatus: string;
    queueSize: number;
  };
  decisionLog: DecisionLogItem[];
}

export default function EnvConfigManagerView() {
  const [activeTab, setActiveTab] = useState<'variables' | 'audit' | 'decisions' | 'failover'>('variables');

  const [summary, setSummary] = useState<EnvManagerSummary>({
    totalRequired: 12,
    configuredCount: 0,
    missingCount: 0,
    invalidCount: 0,
    verifiedProvidersCount: 0
  });

  const [variables, setVariables] = useState<EnvVariableItem[]>([]);
  const [auditData, setAuditData] = useState<AuditReportData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [verifying, setVerifying] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [showMissingOnly, setShowMissingOnly] = useState<boolean>(false);

  // Edit Key Modal State
  const [activeModalVar, setActiveModalVar] = useState<EnvVariableItem | null>(null);
  const [inputValue, setInputValue] = useState<string>('');
  const [showPlainValue, setShowPlainValue] = useState<boolean>(false);
  const [savingKey, setSavingKey] = useState<boolean>(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);

  // Verification Log Toast
  const [verifyAuditLog, setVerifyAuditLog] = useState<string | null>(null);

  const fetchEnvConfig = async () => {
    setLoading(true);
    try {
      const [envRes, auditRes] = await Promise.all([
        fetch('/api/v1/env/manager'),
        fetch('/api/v1/ai/usage-audit')
      ]);

      const envData = await envRes.json();
      if (envData.success) {
        setSummary(envData.summary);
        setVariables(envData.variables);
      }

      const auditJson = await auditRes.json();
      if (auditJson.success) {
        setAuditData(auditJson.audit);
      }
    } catch (err) {
      console.error("Failed to fetch environment configuration & audit data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnvConfig();
  }, []);

  const handleVerifyAll = async () => {
    setVerifying(true);
    setVerifyAuditLog("Initiating live multi-provider connectivity & authentication audit...");
    try {
      const res = await fetch('/api/v1/env/manager/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await res.json();
      if (data.success) {
        setVerifyAuditLog(`Audit Complete: Verified ${data.verifiedCount} online providers. State refreshed.`);
        await fetchEnvConfig();
      } else {
        setVerifyAuditLog(`Verification Failed: ${data.error}`);
      }
    } catch (err: any) {
      setVerifyAuditLog(`Verification Error: ${err.message}`);
    } finally {
      setVerifying(false);
      setTimeout(() => setVerifyAuditLog(null), 6000);
    }
  };

  const handleOpenEditModal = (item: EnvVariableItem) => {
    setActiveModalVar(item);
    setInputValue('');
    setShowPlainValue(false);
    setSaveSuccessMsg(null);
    setSaveErrorMsg(null);
  };

  const handleSaveVariable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeModalVar) return;

    setSavingKey(true);
    setSaveSuccessMsg(null);
    setSaveErrorMsg(null);

    try {
      const res = await fetch('/api/v1/env/manager/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: activeModalVar.key,
          value: inputValue
        })
      });
      const data = await res.json();

      if (data.success) {
        setSaveSuccessMsg(data.message || `Key ${activeModalVar.key} saved successfully!`);
        setTimeout(() => {
          setActiveModalVar(null);
          fetchEnvConfig();
        }, 1200);
      } else {
        setSaveErrorMsg(data.error || "Failed to save configuration.");
      }
    } catch (err: any) {
      setSaveErrorMsg(err.message || "Network error while saving.");
    } finally {
      setSavingKey(false);
    }
  };

  // Filtering
  const filteredVariables = variables.filter((v) => {
    const matchesSearch = v.key.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          v.purpose.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'ALL' || v.category === selectedCategory;
    const matchesMissing = !showMissingOnly || v.status !== 'Configured';
    return matchesSearch && matchesCat && matchesMissing;
  });

  const categories = ['ALL', 'AI Provider Integrations', 'Core System Security', 'Database & Storage', 'Webhooks & Alerts'];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-6 rounded-2xl shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-display font-bold text-slate-100 tracking-tight flex items-center gap-2.5">
              <ShieldCheck className="w-7 h-7 text-blue-500" />
              <span>Environment Configuration Manager</span>
            </h1>
            <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] font-mono font-bold uppercase tracking-wider">
              Operator Control
            </span>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Safely manage, inspect, and verify multi-provider AI API keys and system environment variables. Secret values are masked in memory and never exposed in cleartext.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={fetchEnvConfig}
            disabled={loading}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs px-4 py-2.5 rounded-xl transition-all border border-slate-700 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-400' : ''}`} />
            <span>Reload Config</span>
          </button>

          <button
            onClick={handleVerifyAll}
            disabled={verifying}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/20 cursor-pointer disabled:opacity-50"
          >
            <Zap className={`w-3.5 h-3.5 ${verifying ? 'animate-bounce text-yellow-300' : ''}`} />
            <span>{verifying ? 'Auditing Infrastructure...' : 'Audit & Verify Providers'}</span>
          </button>
        </div>
      </div>

      {/* Main Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('variables')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'variables'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-slate-800'
          }`}
        >
          <Key className="w-4 h-4" />
          <span>Environment Variables ({summary.configuredCount}/{summary.totalRequired})</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'audit'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-slate-800'
          }`}
        >
          <Activity className="w-4 h-4 text-emerald-400" />
          <span>Runtime Usage Audit ({auditData?.summary.totalConfiguredProviders || 0} Configured)</span>
        </button>

        <button
          onClick={() => setActiveTab('decisions')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'decisions'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-slate-800'
          }`}
        >
          <Compass className="w-4 h-4 text-purple-400" />
          <span>Decision Engine Log ({auditData?.decisionLog.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('failover')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'failover'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-slate-800'
          }`}
        >
          <Layers className="w-4 h-4 text-amber-400" />
          <span>Routing & Failover Chain</span>
        </button>
      </div>

      {/* Verification Audit Log Alert */}
      {verifyAuditLog && (
        <div className="p-4 bg-blue-950/40 border border-blue-800/50 rounded-xl flex items-center gap-3 text-xs text-blue-300 font-mono animate-in slide-in-from-top duration-200">
          <Server className="w-4 h-4 text-blue-400 shrink-0 animate-pulse" />
          <span className="flex-1">{verifyAuditLog}</span>
        </div>
      )}

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-slate-900/70 border border-slate-800 p-4 rounded-xl space-y-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Total Variables</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-100">{summary.totalRequired}</span>
            <span className="text-[10px] text-slate-500">Required</span>
          </div>
        </div>

        <div className="bg-slate-900/70 border border-emerald-900/30 p-4 rounded-xl space-y-1">
          <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider">Configured</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-400">{summary.configuredCount}</span>
            <span className="text-[10px] text-emerald-500/80">
              ({Math.round((summary.configuredCount / Math.max(1, summary.totalRequired)) * 100)}%)
            </span>
          </div>
        </div>

        <div className="bg-slate-900/70 border border-amber-900/30 p-4 rounded-xl space-y-1">
          <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider">Missing</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-amber-400">{summary.missingCount}</span>
            <span className="text-[10px] text-amber-500/80">Pending setup</span>
          </div>
        </div>

        <div className="bg-slate-900/70 border border-rose-900/30 p-4 rounded-xl space-y-1">
          <span className="text-[10px] font-mono text-rose-400 uppercase tracking-wider">Invalid / Failing</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-rose-400">{summary.invalidCount}</span>
            <span className="text-[10px] text-rose-500/80">Action needed</span>
          </div>
        </div>

        <div className="bg-slate-900/70 border border-blue-900/30 p-4 rounded-xl space-y-1">
          <span className="text-[10px] font-mono text-blue-400 uppercase tracking-wider">Verified Providers</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-blue-400">{summary.verifiedProvidersCount}</span>
            <span className="text-[10px] text-blue-500/80">Active</span>
          </div>
        </div>
      </div>

      {/* TAB CONTENT: Variables */}
      {activeTab === 'variables' && (
        <div className="space-y-6">
          {/* Category Tabs & Search Toolbar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/40 p-3 rounded-xl border border-slate-800/80">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    selectedCategory === cat 
                      ? 'bg-blue-600 text-white font-semibold shadow-sm' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  {cat === 'ALL' ? 'All Variables' : cat}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="relative flex-1 md:w-64">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter key, name or purpose..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-slate-200 text-xs pl-8 pr-3 py-1.5 rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showMissingOnly}
                  onChange={(e) => setShowMissingOnly(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-blue-600 focus:ring-blue-500"
                />
                <span>Missing only</span>
              </label>
            </div>
          </div>

          {/* Variables List */}
          <div className="space-y-4">
            {loading ? (
              <div className="p-12 text-center text-slate-500 text-xs font-mono space-y-2 bg-slate-900/40 rounded-2xl border border-slate-800">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-500 mx-auto" />
                <p>Loading environment configuration metadata...</p>
              </div>
            ) : filteredVariables.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs font-mono bg-slate-900/40 rounded-2xl border border-slate-800 space-y-2">
                <AlertTriangle className="w-6 h-6 text-slate-600 mx-auto" />
                <p>No environment variables matched the active filters.</p>
              </div>
            ) : (
              filteredVariables.map((v) => (
                <div 
                  key={v.key}
                  className={`p-5 rounded-2xl border transition-all space-y-4 ${
                    v.status === 'Configured'
                      ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                      : v.status === 'Invalid'
                      ? 'bg-rose-950/20 border-rose-900/40 hover:border-rose-800/60'
                      : 'bg-amber-950/10 border-amber-900/30 hover:border-amber-800/50'
                  }`}
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-mono font-bold text-sm text-slate-100 tracking-tight">{v.key}</span>
                        
                        {/* Status Badge */}
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                          v.status === 'Configured'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : v.status === 'Invalid'
                            ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {v.status === 'Configured' && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                          {v.status === 'Missing' && <AlertTriangle className="w-3 h-3 text-amber-400" />}
                          {v.status === 'Invalid' && <XCircle className="w-3 h-3 text-rose-400" />}
                          <span>{v.status}</span>
                        </span>

                        {/* Category pill */}
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-medium border border-slate-700/60">
                          {v.category}
                        </span>

                        {v.defaultModel !== 'N/A' && (
                          <span className="px-2 py-0.5 rounded bg-blue-950/50 text-blue-300 text-[10px] font-mono border border-blue-900/50">
                            Model: {v.defaultModel}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-300 font-medium pt-1">{v.name}</p>
                    </div>

                    {/* Edit / Enter Key Action Button */}
                    <button
                      onClick={() => handleOpenEditModal(v)}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                        v.status === 'Configured'
                          ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                          : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20'
                      }`}
                    >
                      <Key className="w-3.5 h-3.5" />
                      <span>{v.status === 'Configured' ? 'Update Key' : 'Enter API Key'}</span>
                    </button>
                  </div>

                  {/* Purpose & Stored Value Box */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs pt-1">
                    <div className="bg-slate-950/60 border border-slate-850 p-3 rounded-xl space-y-1">
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Purpose</span>
                      <p className="text-slate-300 leading-relaxed">{v.purpose}</p>
                    </div>

                    <div className="bg-slate-950/60 border border-slate-850 p-3 rounded-xl space-y-1">
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">Stored Value (Masked)</span>
                      <div className="flex items-center gap-2 font-mono text-slate-200">
                        <Lock className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                        {v.storedValue ? (
                          <span className="text-slate-300 font-semibold">{v.storedValue}</span>
                        ) : (
                          <span className="text-slate-500 italic font-sans text-[11px]">Not configured in environment</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Verification Details Footer */}
                  <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-slate-400 pt-1 border-t border-slate-800/50">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">Verification:</span>
                      <span className={`font-bold ${
                        v.verificationStatus === 'VERIFIED' ? 'text-emerald-400' :
                        v.verificationStatus === 'FAILED' ? 'text-rose-400' : 'text-slate-400'
                      }`}>
                        {v.verificationStatus}
                      </span>
                      <span className="text-slate-600">|</span>
                      <span className="text-slate-300 truncate">{v.verificationDetails}</span>
                    </div>

                    {v.latencyMs ? (
                      <span className="text-blue-400 font-bold shrink-0">{v.latencyMs}ms</span>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: Runtime Provider Usage Audit */}
      {activeTab === 'audit' && auditData && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Audit Metrics Summary Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Total Configured</span>
              <div className="text-2xl font-bold font-mono text-slate-100">{auditData.summary.totalConfiguredProviders}</div>
              <span className="text-[10px] text-slate-500">Providers Ready</span>
            </div>

            <div className="p-4 bg-slate-900/80 border border-emerald-900/40 rounded-xl space-y-1">
              <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider">Actively Serving Traffic</span>
              <div className="text-2xl font-bold font-mono text-emerald-400">{auditData.summary.providersActivelyServingRequests}</div>
              <span className="text-[10px] text-emerald-500">Receiving Traffic</span>
            </div>

            <div className="p-4 bg-slate-900/80 border border-amber-900/40 rounded-xl space-y-1">
              <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider">Idle Providers</span>
              <div className="text-2xl font-bold font-mono text-amber-400">{auditData.summary.idleProviders}</div>
              <span className="text-[10px] text-amber-500">Configured but Not Used</span>
            </div>

            <div className="p-4 bg-slate-900/80 border border-rose-900/40 rounded-xl space-y-1">
              <span className="text-[10px] font-mono text-rose-400 uppercase tracking-wider">Offline Providers</span>
              <div className="text-2xl font-bold font-mono text-rose-400">{auditData.summary.offlineProviders}</div>
              <span className="text-[10px] text-rose-500">Missing Credentials</span>
            </div>
          </div>

          {/* Detailed Runtime Audit Table */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-display font-bold text-slate-100 uppercase tracking-wider">
                  Live Runtime Telemetry & Provider Usage Matrix
                </h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                Audit Timestamp: {new Date(auditData.timestamp).toLocaleTimeString()}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 text-slate-400 font-mono text-[10px] uppercase border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Provider Name</th>
                    <th className="p-3.5">Current Status</th>
                    <th className="p-3.5">Current Model</th>
                    <th className="p-3.5">Traffic State</th>
                    <th className="p-3.5">Requests Today</th>
                    <th className="p-3.5">Avg Response Time</th>
                    <th className="p-3.5">Avg Cost / Req</th>
                    <th className="p-3.5">Last Request Time</th>
                    <th className="p-3.5">Last Error</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {auditData.providers.map((p) => (
                    <tr key={p.providerId} className="hover:bg-slate-850/40 transition-colors">
                      <td className="p-3.5 font-bold text-slate-100 flex items-center gap-2">
                        <span>{p.providerName}</span>
                        {p.enabled && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                      </td>

                      <td className="p-3.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          p.currentStatus === 'ONLINE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          p.currentStatus === 'Configured but Not Used' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {p.currentStatus}
                        </span>
                      </td>

                      <td className="p-3.5 text-blue-300">{p.currentModel}</td>

                      <td className="p-3.5">
                        {p.isReceivingTraffic ? (
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            <span>ACTIVE</span>
                          </span>
                        ) : (
                          <span className="text-slate-500 font-semibold">IDLE</span>
                        )}
                      </td>

                      <td className="p-3.5">
                        <span className="text-slate-200 font-bold">{p.totalRequestsToday}</span>
                        <span className="text-slate-500 text-[10px] block">
                          ({p.successfulRequests} ok / {p.failedRequests} err)
                        </span>
                      </td>

                      <td className="p-3.5 text-slate-300">
                        {p.averageResponseTimeMs > 0 ? `${p.averageResponseTimeMs}ms` : 'N/A'}
                      </td>

                      <td className="p-3.5 text-slate-300">
                        ${p.averageCostUsd.toFixed(5)}
                      </td>

                      <td className="p-3.5 text-slate-400 text-[11px]">
                        {p.lastRequestTime === 'Never' ? 'Never' : new Date(p.lastRequestTime).toLocaleTimeString()}
                      </td>

                      <td className="p-3.5 text-rose-400 max-w-xs truncate text-[11px]">
                        {p.lastError || 'None'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT: Decision Engine Log */}
      {activeTab === 'decisions' && auditData && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-purple-400" />
              <div>
                <h3 className="text-sm font-display font-bold text-slate-100">
                  AI Engineering Decision Engine Trace Log
                </h3>
                <p className="text-xs text-slate-400">
                  Every routing, failover, and provider selection decision is logged with verified operational evidence.
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 text-xs font-mono">
              Explainable AI Decisions
            </span>
          </div>

          <div className="space-y-3">
            {auditData.decisionLog.map((log, idx) => (
              <div key={idx} className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-purple-950/60 text-purple-300 font-bold text-[10px]">
                      {log.decision}
                    </span>
                    <span className="text-slate-100 font-bold">{log.selectedProvider}</span>
                  </div>
                  <span className="text-slate-500 text-[10px]">{new Date(log.time).toLocaleTimeString()}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px] pt-1 border-t border-slate-800/50">
                  <div>
                    <span className="text-slate-500 block text-[10px]">REASON:</span>
                    <span className="text-slate-300">{log.reason}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">EVIDENCE:</span>
                    <span className="text-emerald-400">{log.evidence}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-slate-500 block text-[10px]">CONFIDENCE:</span>
                      <span className="text-blue-400 font-bold">{log.confidence}%</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold text-[10px]">
                      {log.result}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB CONTENT: Routing & Failover Chain */}
      {activeTab === 'failover' && auditData && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-400" />
                <h2 className="text-sm font-display font-bold text-slate-100 uppercase tracking-wider">
                  Configured Active Failover Chain
                </h2>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono font-bold">
                {auditData.summary.automaticFailoverStatus}
              </span>
            </div>

            <div className="space-y-2 font-mono text-xs">
              {auditData.summary.currentFailoverChain.map((chainItem, i) => (
                <div key={i} className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between">
                  <span className="text-slate-200 font-bold">{chainItem}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                    i === 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                    i < 3 ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                    'bg-slate-800 text-slate-400'
                  }`}>
                    {i === 0 ? 'PRIMARY ROUTE' : `FAILOVER LEVEL ${i + 1}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Multi-Provider Architecture Evidence Report */}
      <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-500" />
            <h2 className="text-sm font-display font-bold text-slate-100 uppercase tracking-wider">
              Multi-Provider Ecosystem Failover Matrix
            </h2>
          </div>
          <span className="text-[10px] font-mono text-slate-400">Auto-Routing & Circuit Breaker Enabled</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase">Primary AI Engine</span>
            <p className="text-slate-100 font-bold">Google Gemini 2.5 Flash</p>
            <span className="text-[10px] text-emerald-400 block">Status: Active & Preferred</span>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase">Secondary Cloud Routers</span>
            <p className="text-slate-100 font-bold">OpenAI / Groq / OpenRouter / Claude</p>
            <span className="text-[10px] text-blue-400 block">Standby Pool Ready</span>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase">Self-Hosted Fallback</span>
            <p className="text-slate-100 font-bold">Ollama / Local Synthesis</p>
            <span className="text-[10px] text-purple-400 block">Zero-Latency Local Engine</span>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1">
            <span className="text-[10px] text-slate-400 uppercase">Circuit Breaker Policy</span>
            <p className="text-slate-100 font-bold">Max 3 Failures → 60s Trip</p>
            <span className="text-[10px] text-emerald-400 block">Auto Health Recovery</span>
          </div>
        </div>
      </div>

      {/* Enter / Edit Key Modal */}
      {activeModalVar && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setActiveModalVar(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-blue-500" />
                <h3 className="text-lg font-display font-bold text-slate-100">
                  Configure {activeModalVar.key}
                </h3>
              </div>
              <p className="text-xs text-slate-400">
                {activeModalVar.name} • {activeModalVar.category}
              </p>
            </div>

            {/* Purpose Notice */}
            <div className="p-3 bg-blue-950/30 border border-blue-900/40 rounded-xl text-xs text-blue-300 space-y-1">
              <span className="font-semibold block text-blue-200">Variable Purpose:</span>
              <p className="leading-relaxed">{activeModalVar.purpose}</p>
            </div>

            {/* Security Guarantee Notice */}
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center gap-2.5 text-[11px] text-slate-400 font-mono">
              <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Keys are stored in runtime memory, masked safely, and never committed to Git.</span>
            </div>

            {saveSuccessMsg && (
              <div className="p-3 bg-emerald-950/50 border border-emerald-800 text-xs text-emerald-300 rounded-xl flex items-center gap-2 font-mono">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>{saveSuccessMsg}</span>
              </div>
            )}

            {saveErrorMsg && (
              <div className="p-3 bg-rose-950/50 border border-rose-800 text-xs text-rose-300 rounded-xl flex items-center gap-2 font-mono">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>{saveErrorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveVariable} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>API Key / Secret Value:</span>
                  {activeModalVar.isSecret && (
                    <button
                      type="button"
                      onClick={() => setShowPlainValue(!showPlainValue)}
                      className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
                    >
                      {showPlainValue ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      <span>{showPlainValue ? 'Hide Input' : 'Show Input'}</span>
                    </button>
                  )}
                </label>

                <input
                  type={activeModalVar.isSecret && !showPlainValue ? 'password' : 'text'}
                  placeholder={activeModalVar.storedValue ? `Leave blank to keep current (${activeModalVar.storedValue})` : `Paste your ${activeModalVar.key} secret here...`}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 text-xs p-3 rounded-xl focus:outline-none focus:border-blue-500 font-mono"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveModalVar(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={savingKey}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/20 cursor-pointer disabled:opacity-50"
                >
                  <SaveIcon loading={savingKey} />
                  <span>{savingKey ? 'Validating & Saving...' : 'Save & Verify Key'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function SaveIcon({ loading }: { loading: boolean }) {
  if (loading) return <RefreshCw className="w-4 h-4 animate-spin text-white" />;
  return <Check className="w-4 h-4 text-white" />;
}
