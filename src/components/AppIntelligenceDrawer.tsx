import React, { useState, useEffect } from 'react';
import { 
  X, 
  Eye, 
  Brain, 
  Search, 
  BarChart3, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  Activity, 
  RotateCw, 
  Sparkles, 
  ChevronRight,
  GitCommit,
  Milestone,
  Check,
  XCircle,
  ShieldAlert,
  Lightbulb,
  Compass,
  ListOrdered,
  ArrowRight,
  Sliders,
  Award,
  Zap,
  Target,
  Clock,
  Cpu,
  HardDrive,
  Users,
  ShieldCheck,
  PackageCheck,
  BookmarkPlus
} from 'lucide-react';
import { Application } from './ApplicationsView';
import { 
  AppObservation, 
  AppStructuredMemory, 
  AppUnderstanding, 
  AppComparison, 
  AppAnalysisEngineResult,
  AppPredictionEngineResult,
  AppLearningEngineResult,
  AppAdaptationEngineResult,
  AppRecommendationEngineResult,
  AppPlanningEngineResult,
  AppAutomationEngineResult,
  AppSecurityCenterResult,
  AppCollaborationTopology
} from '../types/appIntelligence';
import { 
  Bot,
  Shield,
  Cog,
  FileText,
  Network,
  HelpCircle,
  ToggleLeft,
  ToggleRight,
  ShieldX
} from 'lucide-react';

interface AppIntelligenceDrawerProps {
  app: Application;
  onClose: () => void;
  onRestartApp?: (id: string) => void;
  onToggleStatus?: (id: string) => void;
}

export default function AppIntelligenceDrawer({
  app,
  onClose,
  onRestartApp,
  onToggleStatus
}: AppIntelligenceDrawerProps) {
  const [activeTab, setActiveTab] = useState<
    'observe' | 'remember' | 'understand' | 'compare' | 'analyze' | 
    'predict' | 'learn' | 'adapt' | 'recommend' | 'plan' |
    'automate' | 'protect' | 'collaborate' | 'explain'
  >('automate');
  
  // Layer 1 Intelligence Data States
  const [observations, setObservations] = useState<AppObservation[]>([]);
  const [memory, setMemory] = useState<AppStructuredMemory | null>(null);
  const [understanding, setUnderstanding] = useState<AppUnderstanding | null>(null);
  const [comparison, setComparison] = useState<AppComparison | null>(null);
  const [analysis, setAnalysis] = useState<AppAnalysisEngineResult | null>(null);

  // Layer 2 Intelligence Data States
  const [predictions, setPredictions] = useState<AppPredictionEngineResult | null>(null);
  const [learning, setLearning] = useState<AppLearningEngineResult | null>(null);
  const [adaptations, setAdaptations] = useState<AppAdaptationEngineResult | null>(null);
  const [recommendations, setRecommendations] = useState<AppRecommendationEngineResult | null>(null);
  const [plans, setPlans] = useState<AppPlanningEngineResult | null>(null);

  // Layer 3 Intelligence Data States
  const [automations, setAutomations] = useState<AppAutomationEngineResult | null>(null);
  const [security, setSecurity] = useState<AppSecurityCenterResult | null>(null);
  const [collaboration, setCollaboration] = useState<AppCollaborationTopology | null>(null);

  const [isLoading, setIsLoading] = useState(true);

  // Filters & Sub-tabs
  const [obsFilter, setObsFilter] = useState<string>('all');
  const [memorySubTab, setMemorySubTab] = useState<'milestones' | 'deployments' | 'restarts' | 'config' | 'errors'>('milestones');

  useEffect(() => {
    fetchIntelligenceData();
  }, [app.id]);

  const fetchIntelligenceData = async () => {
    setIsLoading(true);
    try {
      const [
        resObs, resMem, resUnd, resComp, resAna,
        resPred, resLearn, resAdapt, resRec, resPlan,
        resAuto, resSec, resCollab
      ] = await Promise.all([
        fetch(`/api/applications/observations?appId=${app.id}`).then(r => r.json()),
        fetch(`/api/applications/${app.id}/memory`).then(r => r.json()),
        fetch(`/api/applications/${app.id}/understanding`).then(r => r.json()),
        fetch(`/api/applications/${app.id}/compare`).then(r => r.json()),
        fetch(`/api/applications/${app.id}/analysis`).then(r => r.json()),
        fetch(`/api/applications/${app.id}/predictions`).then(r => r.json()),
        fetch(`/api/applications/${app.id}/learning`).then(r => r.json()),
        fetch(`/api/applications/${app.id}/adaptations`).then(r => r.json()),
        fetch(`/api/applications/${app.id}/recommendations`).then(r => r.json()),
        fetch(`/api/applications/${app.id}/plans`).then(r => r.json()),
        fetch(`/api/applications/${app.id}/automations`).then(r => r.json()),
        fetch(`/api/applications/${app.id}/security`).then(r => r.json()),
        fetch(`/api/applications/${app.id}/collaboration`).then(r => r.json())
      ]);

      if (resObs.success) setObservations(resObs.observations || []);
      if (resMem.success) setMemory(resMem.memory);
      if (resUnd.success) setUnderstanding(resUnd.understanding);
      if (resComp.success) setComparison(resComp.comparison);
      if (resAna.success) setAnalysis(resAna.analysis);

      if (resPred.success) setPredictions(resPred.predictions);
      if (resLearn.success) setLearning(resLearn.learning);
      if (resAdapt.success) setAdaptations(resAdapt.adaptations);
      if (resRec.success) setRecommendations(resRec.recommendations);
      if (resPlan.success) setPlans(resPlan.plans);

      if (resAuto.success) setAutomations(resAuto.automations);
      if (resSec.success) setSecurity(resSec.security);
      if (resCollab.success) setCollaboration(resCollab.topology);
    } catch (err) {
      console.error("Error loading app intelligence:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleAutomation = async (ruleId: string, enabled: boolean) => {
    try {
      const res = await fetch(`/api/applications/${app.id}/automations/${ruleId}/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      }).then(r => r.json());
      if (res.success) {
        const updateRes = await fetch(`/api/applications/${app.id}/automations`).then(r => r.json());
        if (updateRes.success) setAutomations(updateRes.automations);
      }
    } catch (err) {
      console.error("Error toggling automation:", err);
    }
  };

  const handleApproveAutomationAction = async (ruleId: string, executionId: string) => {
    try {
      const res = await fetch(`/api/applications/${app.id}/automations/${ruleId}/executions/${executionId}/approve`, {
        method: 'POST'
      }).then(r => r.json());
      if (res.success) {
        const updateRes = await fetch(`/api/applications/${app.id}/automations`).then(r => r.json());
        if (updateRes.success) setAutomations(updateRes.automations);
      }
    } catch (err) {
      console.error("Error approving automation execution:", err);
    }
  };

  const handleRejectAutomationAction = async (ruleId: string, executionId: string) => {
    try {
      const res = await fetch(`/api/applications/${app.id}/automations/${ruleId}/executions/${executionId}/reject`, {
        method: 'POST'
      }).then(r => r.json());
      if (res.success) {
        const updateRes = await fetch(`/api/applications/${app.id}/automations`).then(r => r.json());
        if (updateRes.success) setAutomations(updateRes.automations);
      }
    } catch (err) {
      console.error("Error rejecting automation execution:", err);
    }
  };

  const handleApproveAdaptation = async (adaptationId: string) => {
    try {
      const res = await fetch(`/api/applications/${app.id}/adaptations/${adaptationId}/approve`, {
        method: 'POST'
      }).then(r => r.json());
      if (res.success) {
        const updateRes = await fetch(`/api/applications/${app.id}/adaptations`).then(r => r.json());
        if (updateRes.success) setAdaptations(updateRes.adaptations);
      }
    } catch (err) {
      console.error("Error approving adaptation:", err);
    }
  };

  const handleDismissAdaptation = async (adaptationId: string) => {
    try {
      const res = await fetch(`/api/applications/${app.id}/adaptations/${adaptationId}/dismiss`, {
        method: 'POST'
      }).then(r => r.json());
      if (res.success) {
        const updateRes = await fetch(`/api/applications/${app.id}/adaptations`).then(r => r.json());
        if (updateRes.success) setAdaptations(updateRes.adaptations);
      }
    } catch (err) {
      console.error("Error dismissing adaptation:", err);
    }
  };

  const filteredObs = observations.filter(o => {
    if (obsFilter === 'all') return true;
    if (obsFilter === 'errors') return o.severity === 'error' || o.severity === 'critical';
    if (obsFilter === 'deployments') return o.eventType === 'deployed' || o.eventType === 'created';
    if (obsFilter === 'config') return o.eventType === 'config_change' || o.eventType === 'env_change';
    return true;
  });

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 z-[9999] animate-in fade-in duration-200">
      <div className="w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Top Header Bar */}
        <div className="p-5 border-b border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-950/40">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-lg">
              <Sparkles className="w-6 h-6 text-amber-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-100 font-display">{app.name}</h2>
                <span className="text-[10px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded-full">
                  {app.type}
                </span>
                {understanding && (
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                    understanding.businessCriticality === 'Business Critical'
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  }`}>
                    {understanding.businessCriticality}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                AI Intelligence Engine • Layer 1 & 2 • {app.region} • {app.replicaCount} Container Instance(s)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            {onRestartApp && (
              <button
                onClick={() => onRestartApp(app.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5 text-blue-400" />
                <span>Restart Container</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-100 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Applications Operations & Insights Navigation Bar */}
        <div className="bg-slate-950/90 border-b border-slate-800 p-2 space-y-2">
          
          {/* Operations & Security Section */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-1.5 border-b border-slate-850">
            <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold px-2 flex items-center gap-1 shrink-0">
              <Zap className="w-3 h-3 text-emerald-400 animate-pulse" /> Operations:
            </span>

            <button
              onClick={() => setActiveTab('automate')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'automate'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                  : 'text-emerald-300 hover:bg-emerald-500/10 border border-emerald-500/20 bg-emerald-500/5'
              }`}
            >
              <Cog className="w-3.5 h-3.5" />
              <span>⚙️ Automate</span>
              {automations?.automations && (
                <span className="text-[10px] font-mono bg-slate-900 px-1.5 py-0.2 rounded font-bold">
                  {automations.automations.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('protect')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'protect'
                  ? 'bg-rose-500 text-slate-950 shadow-md shadow-rose-500/20 font-bold'
                  : 'text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 bg-rose-500/5'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>🛡 Protect</span>
              {security?.findings && (
                <span className="text-[10px] font-mono bg-slate-900 px-1.5 py-0.2 rounded font-bold">
                  {security.securityGrade}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('collaborate')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'collaborate'
                  ? 'bg-blue-500 text-slate-950 shadow-md shadow-blue-500/20 font-bold'
                  : 'text-blue-300 hover:bg-blue-500/10 border border-blue-500/20 bg-blue-500/5'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              <span>🤝 Collaborate</span>
            </button>

            <button
              onClick={() => setActiveTab('explain')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'explain'
                  ? 'bg-purple-500 text-slate-950 shadow-md shadow-purple-500/20 font-bold'
                  : 'text-purple-300 hover:bg-purple-500/10 border border-purple-500/20 bg-purple-500/5'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>📖 Explain</span>
            </button>
          </div>

          {/* Predictive & Adaptive Section */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-1 border-b border-slate-850">
            <span className="text-[10px] font-mono uppercase text-amber-400 font-bold px-2 flex items-center gap-1 shrink-0">
              <Zap className="w-3 h-3 text-amber-400" /> Intelligence:
            </span>

            <button
              onClick={() => setActiveTab('predict')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'predict'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-bold'
                  : 'text-amber-300 hover:bg-amber-500/10 border border-amber-500/20 bg-amber-500/5'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>🔮 Predict</span>
              {predictions?.predictions && (
                <span className="text-[10px] font-mono bg-slate-900 px-1.5 py-0.2 rounded font-bold">
                  {predictions.predictions.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('learn')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'learn'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                  : 'text-emerald-300 hover:bg-emerald-500/10 border border-emerald-500/20 bg-emerald-500/5'
              }`}
            >
              <Brain className="w-3.5 h-3.5" />
              <span>🌱 Learn</span>
            </button>

            <button
              onClick={() => setActiveTab('adapt')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'adapt'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20 font-bold'
                  : 'text-cyan-300 hover:bg-cyan-500/10 border border-cyan-500/20 bg-cyan-500/5'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>🔄 Adapt</span>
              {adaptations?.adaptations && (
                <span className="text-[10px] font-mono bg-slate-900 px-1.5 py-0.2 rounded font-bold">
                  {adaptations.adaptations.filter(a => a.status === 'pending_user_approval').length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('recommend')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'recommend'
                  ? 'bg-purple-500 text-slate-950 shadow-md shadow-purple-500/20 font-bold'
                  : 'text-purple-300 hover:bg-purple-500/10 border border-purple-500/20 bg-purple-500/5'
              }`}
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span>💡 Recommend</span>
              {recommendations?.recommendations && (
                <span className="text-[10px] font-mono bg-slate-900 px-1.5 py-0.2 rounded font-bold">
                  {recommendations.recommendations.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('plan')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'plan'
                  ? 'bg-blue-500 text-slate-950 shadow-md shadow-blue-500/20 font-bold'
                  : 'text-blue-300 hover:bg-blue-500/10 border border-blue-500/20 bg-blue-500/5'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>🗂 Plan</span>
              {plans?.plans && (
                <span className="text-[10px] font-mono bg-slate-900 px-1.5 py-0.2 rounded font-bold">
                  {plans.plans.length}
                </span>
              )}
            </button>
          </div>

          {/* Observability Section */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
            <span className="text-[10px] font-mono uppercase text-slate-500 font-bold px-2 shrink-0">
              Observability:
            </span>

            <button
              onClick={() => setActiveTab('observe')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'observe'
                  ? 'bg-slate-800 text-white font-bold border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              <span>👀 Observe</span>
            </button>

            <button
              onClick={() => setActiveTab('remember')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'remember'
                  ? 'bg-slate-800 text-white font-bold border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Brain className="w-3.5 h-3.5 text-purple-400" />
              <span>🧠 Remember</span>
            </button>

            <button
              onClick={() => setActiveTab('understand')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'understand'
                  ? 'bg-slate-800 text-white font-bold border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Search className="w-3.5 h-3.5 text-amber-400" />
              <span>🔍 Understand</span>
            </button>

            <button
              onClick={() => setActiveTab('compare')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'compare'
                  ? 'bg-slate-800 text-white font-bold border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
              <span>📊 Compare</span>
            </button>

            <button
              onClick={() => setActiveTab('analyze')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'analyze'
                  ? 'bg-slate-800 text-white font-bold border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5 text-rose-400" />
              <span>📈 Analyze</span>
            </button>
          </div>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {isLoading ? (
            <div className="py-16 text-center space-y-3">
              <Activity className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
              <p className="text-xs text-slate-400 font-mono">Synthesizing Layer 1 & 2 Application Intelligence...</p>
            </div>
          ) : (
            <>
              {/* ================= LAYER 3 TABS ================= */}

              {/* ⚙️ AUTOMATE TAB */}
              {activeTab === 'automate' && automations && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                    <div>
                      <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                        <Cog className="w-4 h-4 text-emerald-400" />
                        <span>Safe Automation Engine</span>
                      </h3>
                      <p className="text-xs text-slate-400">Configurable automated maintenance, health checks, backups, and log purges with mandatory user approval for sensitive operations.</p>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-emerald-500/20 font-mono text-xs self-start sm:self-center">
                      <span className="text-slate-400">Active Automations:</span>
                      <span className="font-bold text-emerald-400">
                        {automations.automations.filter(a => a.enabled).length} / {automations.automations.length} Active
                      </span>
                    </div>
                  </div>

                  {/* Automation Rules Grid */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider">Configurable Automation Policies</h4>
                    <div className="grid grid-cols-1 gap-4">
                      {automations.automations.map((rule) => (
                        <div key={rule.id} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h5 className="text-xs font-bold text-slate-100">{rule.title}</h5>
                                <span className="text-[10px] font-mono font-bold bg-slate-900 border border-slate-800 text-slate-300 px-2 py-0.5 rounded">
                                  {rule.frequency}
                                </span>
                                {rule.isSensitive && (
                                  <span className="text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded">
                                    Requires Approval
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-300 leading-relaxed">{rule.description}</p>
                            </div>

                            <button
                              onClick={() => handleToggleAutomation(rule.id, !rule.enabled)}
                              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer shrink-0 ${
                                rule.enabled 
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                                  : 'bg-slate-800 text-slate-400 border border-slate-700'
                              }`}
                            >
                              {rule.enabled ? <ToggleRight className="w-4 h-4 text-emerald-400" /> : <ToggleLeft className="w-4 h-4 text-slate-500" />}
                              <span>{rule.enabled ? 'ENABLED' : 'DISABLED'}</span>
                            </button>
                          </div>

                          {/* Explainability Block */}
                          <div className="p-3 bg-slate-900/80 border border-slate-850 rounded-lg space-y-2 text-xs font-sans">
                            <div className="flex items-center justify-between font-mono text-[10px]">
                              <span className="text-emerald-400 font-bold uppercase flex items-center gap-1">
                                <Sparkles className="w-3 h-3 text-emerald-400" /> AI Explainability Trace
                              </span>
                              <span className="text-slate-400 font-semibold">Confidence: {rule.explainability.confidenceLevel}</span>
                            </div>
                            <p className="text-slate-300 text-xs">{rule.explainability.reason}</p>
                            <div className="pt-1 border-t border-slate-800/80 text-[11px] font-mono text-slate-400 space-y-1">
                              <div><span className="text-slate-500">Expected Impact:</span> <span className="text-slate-200">{rule.explainability.expectedImpact}</span></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Execution Log & Pending Approvals */}
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider">Automation Execution Audit Log</h4>
                    <div className="space-y-2">
                      {automations.executionHistory.map((exec) => (
                        <div key={exec.id} className="p-3 rounded-xl bg-slate-950 border border-slate-850 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-200">{exec.ruleTitle}</span>
                              <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                                exec.status === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                exec.status === 'pending_user_approval' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse' :
                                'bg-slate-800 text-slate-400'
                              }`}>
                                {exec.status.toUpperCase()}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 font-mono">{exec.actionTaken} — {exec.details}</p>
                          </div>

                          <span className="text-[10px] font-mono text-slate-500 shrink-0">
                            {new Date(exec.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 🛡 PROTECT (SECURITY CENTER) TAB */}
              {activeTab === 'protect' && security && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                    <div>
                      <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-rose-400" />
                        <span>Application Security Center</span>
                      </h3>
                      <p className="text-xs text-slate-400">Continuous runtime vulnerability audits, plaintext secret checks, dependency scans, and privilege audits.</p>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-950 px-3.5 py-2 rounded-xl border border-rose-500/20 font-mono text-xs self-start sm:self-center">
                      <span className="text-slate-400">Security Score:</span>
                      <span className="font-bold text-emerald-400 text-sm">{security.overallSecurityScore} / 100</span>
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold text-xs">
                        GRADE {security.securityGrade}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider">Security Audits & Vulnerability Findings</h4>
                    <div className="grid grid-cols-1 gap-4">
                      {security.findings.map((item) => (
                        <div key={item.id} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-2.5">
                              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h5 className="text-xs font-bold text-slate-100">{item.title}</h5>
                                  <span className="text-[10px] font-mono font-bold bg-slate-900 border border-slate-800 text-slate-300 px-2 py-0.5 rounded">
                                    {item.category}
                                  </span>
                                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                                    item.status === 'mitigated' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  }`}>
                                    {item.status.toUpperCase()}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-300 mt-1 font-mono">{item.affectedResource}</p>
                              </div>
                            </div>
                          </div>

                          <div className="p-3 bg-slate-900/80 border border-slate-850 rounded-lg space-y-1 text-xs">
                            <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold block">Remediation & Action Plan:</span>
                            <p className="text-slate-200">{item.remediationSteps}</p>
                          </div>

                          <div className="p-3 bg-slate-900/40 border border-slate-850 rounded-lg space-y-1 text-xs">
                            <span className="text-[10px] font-mono text-slate-500 uppercase font-bold block">Explainability Evidence:</span>
                            <p className="text-slate-300">{item.explainability.reason}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 🤝 COLLABORATE TAB */}
              {activeTab === 'collaborate' && collaboration && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div>
                      <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                        <Network className="w-4 h-4 text-blue-400" />
                        <span>Multi-Agent Collaboration Network</span>
                      </h3>
                      <p className="text-xs text-slate-400">Inter-agent communication matrix exchanging structured memory, analytical telemetry, and security intelligence.</p>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-blue-500/20 font-mono text-xs">
                      <span className="text-slate-400">Active Channels:</span>
                      <span className="font-bold text-blue-400">{collaboration.activeChannelCount} Micro-Agents</span>
                    </div>
                  </div>

                  {/* Agents Grid */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider">Specialized AI Micro-Agents</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {collaboration.agents.map((ag) => (
                        <div key={ag.agentName} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                              <Bot className="w-3.5 h-3.5 text-blue-400" />
                              {ag.agentName}
                            </span>
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          </div>
                          <p className="text-[11px] text-slate-400 leading-tight">{ag.role}</p>
                          <div className="pt-1.5 border-t border-slate-850 flex items-center justify-between font-mono text-[10px] text-slate-500">
                            <span>{ag.version}</span>
                            <span className="text-emerald-400 font-bold">{ag.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Message Bus Log */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider">Inter-Agent Event Bus Stream</h4>
                    <div className="space-y-2">
                      {collaboration.recentBusMessages.map((msg) => (
                        <div key={msg.id} className="p-3 rounded-xl bg-slate-950 border border-slate-850 space-y-1 font-mono text-xs">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-[11px]">
                              <span className="text-blue-400 font-bold">{msg.senderAgent}</span>
                              <ArrowRight className="w-3 h-3 text-slate-600" />
                              <span className="text-emerald-400 font-bold">{msg.receiverAgent}</span>
                              <span className="bg-slate-900 border border-slate-800 text-slate-300 px-2 py-0.2 rounded text-[10px]">
                                {msg.topic}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-500">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                          </div>
                          <p className="text-slate-300 font-sans text-xs">{msg.payloadSummary}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 📖 EXPLAIN TAB */}
              {activeTab === 'explain' && (
                <div className="space-y-6">
                  <div className="pb-3 border-b border-slate-800">
                    <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-purple-400" />
                      <span>Unified AI Explainability Inspector</span>
                    </h3>
                    <p className="text-xs text-slate-400">Full auditability and traceability for every AI recommendation, predictive risk check, automation rule, and security decision.</p>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                      <h4 className="text-xs font-bold text-amber-400 font-mono uppercase flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-400" /> Predictive Risk Explainability
                      </h4>
                      {predictions?.predictions.slice(0, 1).map((p) => (
                        <div key={p.id} className="space-y-2 text-xs text-slate-300">
                          <p className="font-semibold text-slate-100">{p.title}</p>
                          <p><span className="text-slate-500 font-mono">Reason:</span> {p.reasoning}</p>
                          <div className="p-2.5 bg-slate-900 rounded border border-slate-850 font-mono text-[11px]">
                            <span className="text-slate-500 block mb-1">Supporting Evidence:</span>
                            {p.historicalEvidence.map((ev, i) => (
                              <div key={i} className="text-slate-300">• {ev}</div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                      <h4 className="text-xs font-bold text-emerald-400 font-mono uppercase flex items-center gap-1.5">
                        <Cog className="w-4 h-4 text-emerald-400" /> Automation Rule Explainability
                      </h4>
                      {automations?.automations.slice(0, 1).map((a) => (
                        <div key={a.id} className="space-y-2 text-xs text-slate-300">
                          <p className="font-semibold text-slate-100">{a.title}</p>
                          <p><span className="text-slate-500 font-mono">Reason:</span> {a.explainability.reason}</p>
                          <div className="p-2.5 bg-slate-900 rounded border border-slate-850 font-mono text-[11px]">
                            <span className="text-slate-500 block mb-1">Impact & Evidence:</span>
                            <div className="text-slate-300">• Expected Impact: {a.explainability.expectedImpact}</div>
                            {a.explainability.supportingEvidence.map((ev, i) => (
                              <div key={i} className="text-slate-300">• {ev}</div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ================= LAYER 2 TABS ================= */}

              {/* 🔮 PREDICT TAB */}
              {activeTab === 'predict' && predictions && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div>
                      <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        <span>Predictive Intelligence Engine</span>
                      </h3>
                      <p className="text-xs text-slate-400">Uses historical telemetry, memory logs, and workload trends to anticipate future operational risks.</p>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-amber-500/20 font-mono text-xs">
                      <span className="text-slate-400">Predictive Risk Index:</span>
                      <span className={`font-bold ${
                        predictions.overallPredictiveRiskScorePct > 40 ? 'text-amber-400' : 'text-emerald-400'
                      }`}>
                        {predictions.overallPredictiveRiskScorePct}% Risk Score
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {predictions.predictions.map((pred) => (
                      <div 
                        key={pred.id}
                        className={`p-4 rounded-xl bg-slate-950/60 border ${
                          pred.predictedSeverity === 'critical' ? 'border-rose-500/40 bg-rose-500/5' :
                          pred.predictedSeverity === 'warning' ? 'border-amber-500/40 bg-amber-500/5' :
                          'border-slate-800'
                        } space-y-3 transition-all`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5">
                            <ShieldAlert className={`w-5 h-5 shrink-0 mt-0.5 ${
                              pred.predictedSeverity === 'warning' ? 'text-amber-400' : 'text-blue-400'
                            }`} />
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="text-xs font-bold text-slate-100">{pred.title}</h4>
                                <span className="text-[10px] font-mono font-bold bg-slate-900 border border-slate-800 text-slate-300 px-2 py-0.5 rounded uppercase">
                                  {pred.predictionType}
                                </span>
                              </div>
                              <p className="text-xs text-slate-300 font-sans mt-1 leading-relaxed">{pred.reasoning}</p>
                            </div>
                          </div>

                          <div className="text-right shrink-0 font-mono text-[10px] space-y-1">
                            <span className="inline-block bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-bold">
                              {pred.confidencePct}% Confidence ({pred.confidenceLevel})
                            </span>
                            <span className="block text-slate-400 font-semibold">
                              Impact: {pred.timeToImpact}
                            </span>
                          </div>
                        </div>

                        {/* Historical Evidence References */}
                        {pred.historicalEvidence && pred.historicalEvidence.length > 0 && (
                          <div className="p-3 bg-slate-900/80 border border-slate-850 rounded-lg space-y-1 text-xs">
                            <span className="text-[10px] font-mono text-slate-500 uppercase font-bold block">Historical Evidence Base:</span>
                            <ul className="space-y-1 text-slate-300 font-mono text-[11px]">
                              {pred.historicalEvidence.map((ev, idx) => (
                                <li key={idx} className="flex items-start gap-1.5">
                                  <span className="text-amber-400 shrink-0">•</span>
                                  <span>{ev}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Suggested Action */}
                        <div className="flex items-center justify-between pt-1 text-xs font-mono">
                          <div className="flex items-center gap-2 text-slate-300">
                            <span className="text-amber-400 font-bold">Suggested Preventive Action:</span>
                            <span className="text-slate-200">{pred.suggestedAction}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 🌱 LEARN TAB */}
              {activeTab === 'learn' && learning && (
                <div className="space-y-5">
                  <div className="pb-3 border-b border-slate-800">
                    <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                      <Brain className="w-4 h-4 text-emerald-400" />
                      <span>Continuous Intelligence Learning System</span>
                    </h3>
                    <p className="text-xs text-slate-400">Learns co-installed application pairings, optimal release strategies, workload habits, and user preference profiles.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Commonly Installed Together */}
                    <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2.5">
                      <div className="flex items-center gap-2">
                        <PackageCheck className="w-4 h-4 text-emerald-400" />
                        <h4 className="text-xs font-bold text-slate-200">Co-Installed Application Patterns</h4>
                      </div>
                      <div className="space-y-2 font-mono text-xs">
                        {learning.coInstalledApps.map((item, idx) => (
                          <div key={idx} className="p-2.5 bg-slate-900 border border-slate-850 rounded-lg space-y-0.5">
                            <div className="flex justify-between items-center font-bold text-slate-200">
                              <span>{item.categoryOrApp}</span>
                              <span className="text-emerald-400 text-[10px] bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                                {item.correlationPct}% Pairing Correlation
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 font-sans">{item.reason}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Learned User & Workload Profile */}
                    <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-400" />
                        <h4 className="text-xs font-bold text-slate-200">Learned User & Workload Profile</h4>
                      </div>
                      <div className="space-y-2 font-mono text-xs text-slate-300">
                        <div className="flex justify-between p-2 bg-slate-900 rounded border border-slate-850">
                          <span className="text-slate-400">Preferred Region:</span>
                          <span className="font-bold text-blue-400">{learning.userPreferences.preferredRegion}</span>
                        </div>
                        <div className="flex justify-between p-2 bg-slate-900 rounded border border-slate-850">
                          <span className="text-slate-400">Favorite Categories:</span>
                          <span className="font-bold text-emerald-400">{learning.userPreferences.favoriteCategories.join(', ')}</span>
                        </div>
                        <div className="flex justify-between p-2 bg-slate-900 rounded border border-slate-850">
                          <span className="text-slate-400">Peak Workload UTC:</span>
                          <span className="font-bold text-amber-400">{learning.workloadCharacteristics.peakHoursUtc}</span>
                        </div>
                        <div className="flex justify-between p-2 bg-slate-900 rounded border border-slate-850">
                          <span className="text-slate-400">Update Cadence:</span>
                          <span className="font-bold text-purple-400">Every ~{learning.updateBehavior.avgDaysBetweenUpdates} days</span>
                        </div>
                      </div>
                    </div>

                    {/* Common Recovery Methods */}
                    <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 md:col-span-2">
                      <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-purple-400" />
                        <span>Learned Auto-Recovery Methods</span>
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {learning.commonRecoveryMethods.map((rec, idx) => (
                          <div key={idx} className="p-3 bg-slate-900 border border-slate-850 rounded-lg space-y-1 font-mono text-xs">
                            <span className="text-slate-400 text-[10px] uppercase block font-bold">{rec.failureType}</span>
                            <p className="text-slate-200 font-sans text-xs font-medium">{rec.bestRecoveryAction}</p>
                            <span className="text-[10px] text-emerald-400 font-bold block pt-1">
                              ✓ {rec.successRatePct}% Success Rate across historical incidents
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 🔄 ADAPT TAB */}
              {activeTab === 'adapt' && adaptations && (
                <div className="space-y-5">
                  <div className="pb-3 border-b border-slate-800">
                    <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-cyan-400" />
                      <span>Platform Behavior Adaptation Engine</span>
                    </h3>
                    <p className="text-xs text-slate-400">Proposes dynamic behavior adjustments to scaling, alerts, and priority monitoring. Requires explicit user approval before applying changes.</p>
                  </div>

                  <div className="space-y-4">
                    {adaptations.adaptations.map((adapt) => (
                      <div 
                        key={adapt.id}
                        className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-bold text-slate-100">{adapt.title}</h4>
                              <span className="text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded-full uppercase">
                                {adapt.type}
                              </span>
                            </div>
                            <p className="text-xs text-slate-300 font-sans mt-1">{adapt.description}</p>
                          </div>

                          <div className="shrink-0">
                            <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border ${
                              adapt.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                              adapt.status === 'dismissed' ? 'bg-slate-800 text-slate-400 border-slate-700' :
                              'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            }`}>
                              {adapt.status === 'pending_user_approval' ? 'Pending Approval' : adapt.status.toUpperCase()}
                            </span>
                          </div>
                        </div>

                        {/* Setting Transition Box */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-900 border border-slate-850 rounded-lg text-xs font-mono">
                          <div>
                            <span className="text-[10px] text-slate-500 block uppercase">Current Setting:</span>
                            <span className="text-slate-300 font-bold">{adapt.currentSetting}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-cyan-400 block uppercase font-bold">Suggested Adaptation:</span>
                            <span className="text-cyan-300 font-bold">{adapt.suggestedSetting}</span>
                          </div>
                        </div>

                        <div className="text-xs font-sans text-slate-400 space-y-1">
                          <p><strong className="text-slate-300">Reasoning:</strong> {adapt.reasoning}</p>
                          <p><strong className="text-slate-300">Expected Impact:</strong> {adapt.expectedImpact}</p>
                        </div>

                        {/* Interactive Approval Controls */}
                        {adapt.status === 'pending_user_approval' && (
                          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-850">
                            <button
                              onClick={() => handleDismissAdaptation(adapt.id)}
                              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                            >
                              Dismiss
                            </button>
                            <button
                              onClick={() => handleApproveAdaptation(adapt.id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-lg text-xs transition-colors cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Approve & Apply Adaptation</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 💡 RECOMMEND TAB */}
              {activeTab === 'recommend' && recommendations && (
                <div className="space-y-5">
                  <div className="pb-3 border-b border-slate-800">
                    <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-purple-400" />
                      <span>Personalized Recommendation Engine</span>
                    </h3>
                    <p className="text-xs text-slate-400">Presents context-aware recommendations for performance tuning, backups, companion microservices, and security hardening.</p>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {recommendations.recommendations.map((rec) => (
                      <div key={rec.id} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-2.5">
                            <Lightbulb className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-xs font-bold text-slate-100">{rec.title}</h4>
                                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                                  rec.priority === 'Critical' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                                  rec.priority === 'High' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                                  'bg-slate-800 text-slate-300'
                                }`}>
                                  {rec.priority} Priority
                                </span>
                              </div>
                              <p className="text-xs text-slate-300 font-sans mt-1">{rec.whyRecommended}</p>
                            </div>
                          </div>

                          <button className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg shrink-0 transition-colors cursor-pointer">
                            {rec.actionLabel}
                          </button>
                        </div>

                        {/* Benefits & Source Observations */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-900 border border-slate-850 rounded-lg text-xs font-sans">
                          <div>
                            <span className="text-[10px] font-mono text-purple-400 uppercase font-bold block mb-1">Expected Benefits:</span>
                            <ul className="space-y-0.5 text-slate-300">
                              {rec.expectedBenefits.map((b, idx) => (
                                <li key={idx} className="flex items-center gap-1.5">
                                  <Check className="w-3 h-3 text-purple-400 shrink-0" />
                                  <span>{b}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div>
                            <span className="text-[10px] font-mono text-slate-500 uppercase font-bold block mb-1">Triggering Observations:</span>
                            <ul className="space-y-0.5 text-slate-400 text-[11px] font-mono">
                              {rec.sourceObservations.map((so, idx) => (
                                <li key={idx}>• {so}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 🗂 PLAN TAB */}
              {activeTab === 'plan' && plans && (
                <div className="space-y-5">
                  <div className="pb-3 border-b border-slate-800">
                    <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                      <Compass className="w-4 h-4 text-blue-400" />
                      <span>Intelligent Action Planning Engine</span>
                    </h3>
                    <p className="text-xs text-slate-400">Organizes platform recommendations and capacity growth into prioritized step-by-step roadmaps.</p>
                  </div>

                  <div className="space-y-5">
                    {plans.plans.map((pl) => (
                      <div key={pl.id} className="p-5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2 border-b border-slate-850">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-bold text-slate-100">{pl.title}</h4>
                              <span className="text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded font-bold uppercase">
                                {pl.planType}
                              </span>
                            </div>
                            <p className="text-xs text-slate-300 font-sans mt-0.5">{pl.summary}</p>
                          </div>

                          <div className="text-right shrink-0 font-mono text-[10px]">
                            <span className="bg-slate-900 border border-slate-800 text-slate-300 px-2 py-1 rounded font-bold block">
                              Timeline: {pl.targetTimeline}
                            </span>
                          </div>
                        </div>

                        {/* Step Breakdown */}
                        <div className="space-y-2">
                          <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block">Roadmap Step Execution Sequence:</span>
                          <div className="space-y-2">
                            {pl.steps.map((step) => (
                              <div key={step.stepNumber} className="p-3 bg-slate-900 border border-slate-850 rounded-lg flex items-start gap-3">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs font-bold shrink-0 mt-0.5 ${
                                  step.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                                  step.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 animate-pulse' :
                                  'bg-slate-800 text-slate-400'
                                }`}>
                                  {step.stepNumber}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center justify-between">
                                    <h5 className="text-xs font-bold text-slate-200">{step.title}</h5>
                                    <span className="text-[10px] font-mono text-slate-500">Est. Effort: {step.estimatedEffort}</span>
                                  </div>
                                  <p className="text-xs text-slate-400 font-sans mt-0.5">{step.description}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg text-xs font-mono text-blue-300">
                          <strong>Target Outcome:</strong> {pl.expectedOutcome}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ================= LAYER 1 TABS ================= */}

              {/* 👀 OBSERVE TAB */}
              {activeTab === 'observe' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div>
                      <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                        <Eye className="w-4 h-4 text-cyan-400" />
                        <span>Continuous Observation Event Stream</span>
                      </h3>
                      <p className="text-xs text-slate-400">Records lifecycle, configuration changes, deployments, resource samples, and runtime events.</p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {['all', 'deployments', 'config', 'errors'].map(f => (
                        <button
                          key={f}
                          onClick={() => setObsFilter(f)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium capitalize cursor-pointer ${
                            obsFilter === f 
                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                              : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                          }`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {filteredObs.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-500 bg-slate-950/40 border border-slate-850 rounded-xl">
                        No observation events matching selected filter.
                      </div>
                    ) : (
                      filteredObs.map((obs) => (
                        <div 
                          key={obs.id}
                          className="bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 p-3.5 rounded-xl space-y-1.5 transition-all"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${
                                obs.severity === 'error' || obs.severity === 'critical' ? 'bg-rose-400 animate-ping' :
                                obs.severity === 'warning' ? 'bg-amber-400' : 'bg-emerald-400'
                              }`} />
                              <span className="text-xs font-bold text-slate-200 font-mono">{obs.title}</span>
                              <span className="text-[10px] font-mono text-slate-400 uppercase bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
                                {obs.eventType}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-slate-500">
                              {new Date(obs.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 pl-4 border-l-2 border-slate-800">{obs.details}</p>
                          {obs.metadata && Object.keys(obs.metadata).length > 0 && (
                            <div className="pl-4 pt-1 flex flex-wrap gap-2 text-[10px] font-mono text-slate-400">
                              {Object.entries(obs.metadata).map(([k, v]) => (
                                <span key={k} className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded">
                                  {k}: <span className="text-slate-200 font-semibold">{String(v)}</span>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* 🧠 REMEMBER TAB */}
              {activeTab === 'remember' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
                    <div>
                      <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                        <Brain className="w-4 h-4 text-purple-400" />
                        <span>Structured Application Memory System</span>
                      </h3>
                      <p className="text-xs text-slate-400">Historical records for deployments, configuration changes, restarts, resource samples, and milestones.</p>
                    </div>

                    <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
                      {(['milestones', 'deployments', 'restarts', 'config', 'errors'] as const).map(tab => (
                        <button
                          key={tab}
                          onClick={() => setMemorySubTab(tab)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium capitalize cursor-pointer whitespace-nowrap ${
                            memorySubTab === tab 
                              ? 'bg-purple-600 text-white shadow' 
                              : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                          }`}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Memory Sub-views */}
                  {memorySubTab === 'milestones' && (
                    <div className="space-y-3">
                      {memory?.milestones?.map(m => (
                        <div key={m.id} className="bg-slate-950/60 border border-purple-500/20 p-4 rounded-xl flex items-start gap-3">
                          <Milestone className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-bold text-slate-100">{m.title}</h4>
                              <span className="text-[10px] font-mono text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full">
                                {m.type}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400">{m.description}</p>
                            <span className="text-[10px] font-mono text-slate-500 block">
                              Recorded on {new Date(m.timestamp).toLocaleDateString()} at {new Date(m.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {memorySubTab === 'deployments' && (
                    <div className="space-y-3 font-mono text-xs">
                      {memory?.deploymentHistory?.map(dep => (
                        <div key={dep.id} className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <GitCommit className="w-4 h-4 text-blue-400 shrink-0" />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-blue-400">{dep.commitHash}</span>
                                <span className="text-slate-200 font-sans">{dep.commitMessage}</span>
                              </div>
                              <span className="text-[10px] text-slate-500">{new Date(dep.timestamp).toLocaleString()}</span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-bold">
                              {dep.status} ({dep.durationSeconds}s)
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {memorySubTab === 'restarts' && (
                    <div className="space-y-3 font-mono text-xs">
                      {memory?.restartHistory?.length === 0 ? (
                        <div className="p-6 text-center text-xs text-slate-500 bg-slate-950/40 border border-slate-800 rounded-xl">
                          Zero restart records stored in memory. Application running without crash interrupts.
                        </div>
                      ) : (
                        memory?.restartHistory?.map(rst => (
                          <div key={rst.id} className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <RotateCw className="w-4 h-4 text-amber-400" />
                              <div>
                                <span className="text-slate-200 font-sans font-semibold block">{rst.reason}</span>
                                <span className="text-[10px] text-slate-500">Triggered by: {rst.triggeredBy}</span>
                              </div>
                            </div>
                            <span className="text-[10px] text-slate-400">{new Date(rst.timestamp).toLocaleTimeString()}</span>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {memorySubTab === 'config' && (
                    <div className="space-y-3 font-mono text-xs">
                      {memory?.configHistory?.map(cfg => (
                        <div key={cfg.id} className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-xl space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-200">Config Revision • {cfg.region}</span>
                            <span className="text-[10px] text-slate-500">{new Date(cfg.timestamp).toLocaleString()}</span>
                          </div>
                          <p className="text-slate-400 font-sans text-xs">Updated by {cfg.updatedBy} • Changed keys: {cfg.changedKeys.join(', ')}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {memorySubTab === 'errors' && (
                    <div className="space-y-3 font-mono text-xs">
                      {memory?.errorHistory?.length === 0 ? (
                        <div className="p-6 text-center text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl font-sans">
                          ✓ Zero error entries in structured memory. Excellent operational health!
                        </div>
                      ) : (
                        memory?.errorHistory?.map(err => (
                          <div key={err.id} className="bg-slate-950/60 border border-rose-500/30 p-3.5 rounded-xl space-y-1.5">
                            <div className="flex items-center justify-between text-rose-400 font-bold">
                              <span>⚠️ {err.errorMessage}</span>
                              <span className="text-[10px] uppercase bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">{err.severity}</span>
                            </div>
                            {err.codeSnippet && (
                              <pre className="p-2.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-300 overflow-x-auto">
                                {err.codeSnippet}
                              </pre>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* 🔍 UNDERSTAND TAB */}
              {activeTab === 'understand' && (
                <div className="space-y-5">
                  <div className="pb-2 border-b border-slate-800">
                    <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                      <Search className="w-4 h-4 text-amber-400" />
                      <span>Semantic Operational Understanding & Knowledge Engine</span>
                    </h3>
                    <p className="text-xs text-slate-400">Translates raw observations into meaningful operational insights and criticality assessments.</p>
                  </div>

                  {understanding && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* State Assessment Card */}
                      <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2.5 md:col-span-2">
                        <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block">Current Operational Understanding</span>
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                          <h4 className="text-sm font-bold text-slate-100">{understanding.semanticStatus}</h4>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed font-sans">{understanding.stateSummary}</p>
                        
                        <div className="pt-2 border-t border-slate-850">
                          <span className="text-[10px] font-mono text-slate-500 uppercase block mb-1.5 font-bold">Derived Knowledge Statements:</span>
                          <ul className="space-y-1.5 text-xs text-slate-300">
                            {understanding.operationalKnowledge.map((k, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                                <span>{k}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Business Criticality & Workload Card */}
                      <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                        <div>
                          <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block">Business Criticality Tier</span>
                          <span className={`inline-block mt-1 text-xs font-bold font-mono px-2.5 py-1 rounded-full border ${
                            understanding.businessCriticality === 'Business Critical'
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          }`}>
                            {understanding.businessCriticality}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block">Workload Requirement</span>
                          <p className="text-xs text-slate-300 font-sans mt-0.5">{understanding.workloadRequirement}</p>
                        </div>

                        <div className="pt-2 border-t border-slate-850 text-[10px] font-mono text-slate-500">
                          Last Assessed: {new Date(understanding.lastAssessedAt).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 📊 COMPARE TAB */}
              {activeTab === 'compare' && (
                <div className="space-y-5">
                  <div className="pb-2 border-b border-slate-800">
                    <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-emerald-400" />
                      <span>Timeframe & Trend Comparison Matrix</span>
                    </h3>
                    <p className="text-xs text-slate-400">Detects trends and metric deltas across today vs yesterday, current week vs last week, and code versions.</p>
                  </div>

                  {comparison && (
                    <div className="space-y-4">
                      {/* Comparison Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
                        {/* Card 1: Today vs Yesterday */}
                        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                          <span className="text-[10px] uppercase text-slate-500 font-bold block">Today vs Yesterday</span>
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between">
                              <span className="text-slate-400">CPU Shift:</span>
                              <span className={comparison.todayVsYesterday.cpuChangePct <= 0 ? 'text-emerald-400' : 'text-amber-400'}>
                                {comparison.todayVsYesterday.cpuChangePct}%
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">RAM Drift:</span>
                              <span className="text-slate-200">+{comparison.todayVsYesterday.memoryChangeMB} MB</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Error Delta:</span>
                              <span className="text-emerald-400">{comparison.todayVsYesterday.errorDeltaCount}</span>
                            </div>
                          </div>
                        </div>

                        {/* Card 2: This Week vs Last Week */}
                        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                          <span className="text-[10px] uppercase text-slate-500 font-bold block">This Week vs Last Week</span>
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between">
                              <span className="text-slate-400">CPU Change:</span>
                              <span className="text-emerald-400">{comparison.thisWeekVsLastWeek.cpuChangePct}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Uptime Improvement:</span>
                              <span className="text-emerald-400">+{comparison.thisWeekVsLastWeek.uptimeDeltaPct}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">Error Frequency:</span>
                              <span className="text-emerald-400">{comparison.thisWeekVsLastWeek.errorDeltaCount} / wk</span>
                            </div>
                          </div>
                        </div>

                        {/* Card 3: Current vs Prev Build */}
                        <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                          <span className="text-[10px] uppercase text-slate-500 font-bold block">Build Version Comparison</span>
                          <p className="text-xs font-sans text-slate-300 leading-snug">
                            {comparison.currentVsPrevVersion.performanceShiftSummary}
                          </p>
                        </div>
                      </div>

                      {/* Trends Table */}
                      <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3">
                        <span className="text-xs font-bold text-slate-200 block font-display">Detected Metric Trends</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          {comparison.metricTrends.map((tr, idx) => (
                            <div key={idx} className="p-3 bg-slate-900 border border-slate-800 rounded-lg space-y-1 font-mono text-xs">
                              <span className="text-[10px] text-slate-500 uppercase block">{tr.metric}</span>
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-200">{tr.rateFormatted}</span>
                                <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                                  tr.significance === 'Positive' ? 'bg-emerald-500/10 text-emerald-400' :
                                  tr.significance === 'Attention Required' ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-800 text-slate-400'
                                }`}>
                                  {tr.significance}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 📈 ANALYZE TAB */}
              {activeTab === 'analyze' && (
                <div className="space-y-5">
                  <div className="pb-2 border-b border-slate-800">
                    <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-rose-400" />
                      <span>Operational Analysis Engine & Relationship Discovery</span>
                    </h3>
                    <p className="text-xs text-slate-400">Discovers hidden correlations between updates, failures, resource growth, and performance bottlenecks.</p>
                  </div>

                  {analysis && (
                    <div className="space-y-4">
                      {/* Operational Summary Banner */}
                      <div className="p-4 rounded-xl bg-slate-950/80 border border-blue-500/30 text-xs text-slate-200 flex items-start gap-3">
                        <Sparkles className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-blue-400 block uppercase font-mono text-[10px]">Operational Analysis Summary</span>
                          <p className="mt-0.5 font-sans leading-relaxed">{analysis.operationalSummary}</p>
                        </div>
                      </div>

                      {/* Discovered Relationships */}
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold text-slate-200 font-display uppercase tracking-wider">Discovered Relationships & Correlations</h4>
                        {analysis.discoveredRelationships.map(rel => (
                          <div key={rel.id} className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-100">{rel.title}</span>
                              <div className="flex items-center gap-2 text-[10px] font-mono">
                                <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded font-bold">
                                  Confidence: {rel.confidencePct}%
                                </span>
                                <span className={`px-2 py-0.5 rounded font-bold ${
                                  rel.impact === 'High' ? 'bg-rose-500/10 text-rose-400' : 'bg-amber-500/10 text-amber-400'
                                }`}>
                                  Impact: {rel.impact}
                                </span>
                              </div>
                            </div>
                            <p className="text-xs text-slate-300 font-sans">{rel.description}</p>
                          </div>
                        ))}
                      </div>

                      {/* Resource Bottlenecks */}
                      {analysis.resourceBottlenecks.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-slate-850">
                          <h4 className="text-xs font-bold text-slate-200 font-display uppercase tracking-wider">Identified Resource Constraints</h4>
                          {analysis.resourceBottlenecks.map(bot => (
                            <div key={bot.id} className="p-3 rounded-xl bg-slate-950/60 border border-amber-500/20 text-xs font-mono space-y-1">
                              <div className="flex items-center justify-between text-amber-400 font-bold">
                                <span>{bot.component} • {bot.metric}</span>
                                <span>Threshold: {bot.threshold}</span>
                              </div>
                              <p className="text-slate-300 font-sans text-xs">{bot.impact}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Health Insights */}
                      <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 text-xs">
                        <span className="text-[10px] font-mono text-slate-500 uppercase font-bold block">Operational Health Insights</span>
                        <ul className="space-y-1 text-slate-300 font-sans">
                          {analysis.healthInsights.map((ins, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <ChevronRight className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                              <span>{ins}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
