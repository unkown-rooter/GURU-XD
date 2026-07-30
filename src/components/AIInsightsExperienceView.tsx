import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  ShieldCheck, 
  Brain, 
  Activity, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  RotateCw, 
  Zap, 
  Cog, 
  Shield, 
  Bot, 
  Network, 
  Lightbulb, 
  Compass, 
  BarChart3, 
  Cpu, 
  HardDrive, 
  ArrowRight,
  FileText,
  Layers,
  Search,
  Check
} from 'lucide-react';
import { AIInsightsSummary } from '../types/appIntelligence';

export default function AIInsightsExperienceView() {
  const [data, setData] = useState<AIInsightsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'health' | 'security' | 'recommendations' | 'predictions' | 'automations'>('all');

  useEffect(() => {
    fetchAIInsights();
  }, []);

  const fetchAIInsights = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/applications/ai-insights').then(r => r.json());
      if (res.success) {
        setData(res.insights);
      }
    } catch (err) {
      console.error("Error loading AI Insights:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center space-y-4 bg-slate-950/40 border border-slate-850 rounded-2xl">
        <Activity className="w-10 h-10 text-amber-400 animate-spin mx-auto" />
        <p className="text-xs text-slate-400 font-mono">Synthesizing Ecosystem Intelligence across operational services...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="py-12 text-center text-slate-400 text-xs font-mono">
        Failed to load AI Insights summary.
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Ecosystem Executive Scorecard */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl space-y-1">
          <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> App Health
          </span>
          <p className="text-xl font-bold font-display text-slate-100">{data.overallHealthPct}%</p>
          <p className="text-[10px] text-slate-400 font-mono">3 Running • 0 Failing</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl space-y-1">
          <span className="text-[10px] font-mono text-rose-400 font-bold uppercase flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-rose-400" /> Security Grade
          </span>
          <p className="text-xl font-bold font-display text-slate-100">{data.securityGrade}</p>
          <p className="text-[10px] text-slate-400 font-mono">{data.securityScore} / 100 Score</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl space-y-1">
          <span className="text-[10px] font-mono text-amber-400 font-bold uppercase flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Active Risks
          </span>
          <p className="text-xl font-bold font-display text-slate-100">{data.activePredictionsCount}</p>
          <p className="text-[10px] text-slate-400 font-mono">Predictive Checks</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl space-y-1">
          <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase flex items-center gap-1">
            <Cog className="w-3.5 h-3.5 text-emerald-400" /> Automations
          </span>
          <p className="text-xl font-bold font-display text-slate-100">{data.activeAutomationsCount}</p>
          <p className="text-[10px] text-slate-400 font-mono">Rules Active</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl space-y-1">
          <span className="text-[10px] font-mono text-blue-400 font-bold uppercase flex items-center gap-1">
            <Bot className="w-3.5 h-3.5 text-blue-400" /> Agent Swarm
          </span>
          <p className="text-xl font-bold font-display text-slate-100">{data.activeAgentCount}</p>
          <p className="text-[10px] text-slate-400 font-mono">Micro-Agents</p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl space-y-1">
          <span className="text-[10px] font-mono text-purple-400 font-bold uppercase flex items-center gap-1">
            <Brain className="w-3.5 h-3.5 text-purple-400" /> Reflection
          </span>
          <p className="text-xl font-bold font-display text-slate-100">{data.reflectionScore}%</p>
          <p className="text-[10px] text-slate-400 font-mono">Strategic Alignment</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
              activeFilter === 'all' 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' 
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
          >
            All AI Insights
          </button>
          <button
            onClick={() => setActiveFilter('health')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
              activeFilter === 'health' 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' 
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
          >
            Ecosystem Reflection
          </button>
          <button
            onClick={() => setActiveFilter('recommendations')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
              activeFilter === 'recommendations' 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' 
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
          >
            Recommendations ({data.topRecommendations.length})
          </button>
          <button
            onClick={() => setActiveFilter('predictions')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
              activeFilter === 'predictions' 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' 
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
          >
            Predictive Risks
          </button>
          <button
            onClick={() => setActiveFilter('security')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
              activeFilter === 'security' 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' 
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
            }`}
          >
            Security Alerts
          </button>
        </div>

        <button
          onClick={fetchAIInsights}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 font-mono cursor-pointer"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>Refresh Insights</span>
        </button>
      </div>

      {/* Grid Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Column 1 & 2: Reflection & Recommendations */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Ecosystem Reflection Summary */}
          {(activeFilter === 'all' || activeFilter === 'health') && (
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-850">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 font-display">
                  <Brain className="w-4 h-4 text-purple-400" />
                  <span>Ecosystem Reflection & Health Report</span>
                </h3>
                <span className="text-[10px] font-mono bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded-full font-bold">
                  AUTONOMOUS REFLECTION ACTIVE
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed font-sans">{data.reflectionSummary}</p>

              {/* Strategic Action Items */}
              <div className="space-y-2 pt-2">
                <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">Strategic Action Items:</span>
                <div className="space-y-1.5">
                  {data.strategicActionItems.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-200 bg-slate-900/80 p-2.5 rounded-xl border border-slate-850">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resource Optimization & Inactive Apps */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-850 space-y-1">
                  <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">Rarely Used / Inactive Apps:</span>
                  <div className="text-xs font-bold text-slate-200">
                    {data.rarelyUsedApps.length > 0 ? data.rarelyUsedApps.join(', ') : 'None detected'}
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-850 space-y-1">
                  <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">Top Resource Consumer:</span>
                  <div className="text-xs font-bold text-amber-400 font-mono">
                    {data.topResourceConsumers.length > 0 ? data.topResourceConsumers.join(', ') : 'Guru Core Hypervisor'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Active Recommendations & Growth Opportunities */}
          {(activeFilter === 'all' || activeFilter === 'recommendations') && (
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-850">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 font-display">
                  <Lightbulb className="w-4 h-4 text-purple-400" />
                  <span>Personalized Recommendations & Growth Opportunities</span>
                </h3>
                <span className="text-xs font-mono text-purple-400 font-bold">{data.topRecommendations.length} Recommendations</span>
              </div>

              <div className="space-y-3">
                {data.topRecommendations.map((rec) => (
                  <div key={rec.id} className="p-4 rounded-xl bg-slate-900/80 border border-slate-850 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-100">{rec.title}</h4>
                          <span className="text-[10px] font-mono bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.2 rounded uppercase font-bold">
                            {rec.category}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">{rec.description}</p>
                      </div>
                      <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 shrink-0">
                        {rec.expectedImpact}
                      </span>
                    </div>

                    <div className="p-2.5 bg-slate-950/80 rounded-lg border border-slate-850 text-xs font-mono text-slate-400 space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-500 uppercase font-bold">AI Reason & Supporting Evidence:</span>
                        <span className="text-purple-300 font-bold">{rec.confidenceLevel} Confidence</span>
                      </div>
                      <p className="text-slate-300 font-sans">{rec.reasoning}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Traceable Recent AI Decisions */}
          {(activeFilter === 'all') && (
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-850">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 font-display">
                  <FileText className="w-4 h-4 text-blue-400" />
                  <span>Recent AI Decisions & Traceability Log</span>
                </h3>
                <span className="text-xs font-mono text-slate-400 font-bold">{data.recentDecisions.length} Decisions Logged</span>
              </div>

              <div className="space-y-3">
                {data.recentDecisions.map((dec) => (
                  <div key={dec.id} className="p-3.5 rounded-xl bg-slate-900 border border-slate-850 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-100">{dec.title}</span>
                        <span className="text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.2 rounded font-bold">
                          {dec.category.toUpperCase()}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">{new Date(dec.timestamp).toLocaleTimeString()}</span>
                    </div>

                    <div className="p-2.5 bg-slate-950 rounded border border-slate-850 font-mono text-[11px] text-slate-300 space-y-1">
                      <div><span className="text-slate-500">Reasoning:</span> {dec.explainability.reason}</div>
                      <div><span className="text-slate-500">Expected Impact:</span> {dec.explainability.expectedImpact}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Column 3: Predictions, Security, & Agent Network */}
        <div className="space-y-6">
          
          {/* Predictions & Risk Alerts */}
          {(activeFilter === 'all' || activeFilter === 'predictions') && (
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-850">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 font-display">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Predictive Risk Alerts</span>
                </h3>
                <span className="text-xs font-mono text-amber-400 font-bold">{data.activePredictions.length} Risks</span>
              </div>

              <div className="space-y-3">
                {data.activePredictions.map((pred) => (
                  <div key={pred.id} className="p-3.5 rounded-xl bg-slate-900 border border-slate-850 space-y-2">
                    <div className="flex items-start justify-between">
                      <h4 className="text-xs font-bold text-slate-100">{pred.title}</h4>
                      <span className="text-[10px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.2 rounded shrink-0">
                        {pred.confidencePct}% Confidence
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 font-sans leading-relaxed">{pred.reasoning}</p>
                    <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between pt-1 border-t border-slate-800">
                      <span>Time to Impact: {pred.timeToImpact}</span>
                      <span className="uppercase text-amber-400 font-bold">{pred.predictionType}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Security Center Findings */}
          {(activeFilter === 'all' || activeFilter === 'security') && (
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-850">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 font-display">
                  <Shield className="w-4 h-4 text-rose-400" />
                  <span>Security Center Findings</span>
                </h3>
                <span className="text-xs font-mono text-rose-400 font-bold">{data.securityFindings.length} Audits</span>
              </div>

              <div className="space-y-3">
                {data.securityFindings.map((sec) => (
                  <div key={sec.id} className="p-3.5 rounded-xl bg-slate-900 border border-slate-850 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-100">{sec.title}</span>
                      <span className="text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.2 rounded uppercase">
                        {sec.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 font-mono">{sec.affectedResource}</p>
                    <div className="p-2 bg-slate-950 rounded text-[11px] text-slate-300 font-sans border border-slate-850">
                      <span className="text-emerald-400 font-bold font-mono block text-[10px] uppercase">Remediation:</span>
                      {sec.remediationSteps}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Agent Swarm Topology */}
          {(activeFilter === 'all') && (
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-850">
                <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2 font-display">
                  <Network className="w-4 h-4 text-blue-400" />
                  <span>Active Agent Swarm Network</span>
                </h3>
                <span className="text-xs font-mono text-blue-400 font-bold">7 Agents Active</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {data.collaborationTopology.agents.map((ag) => (
                  <div key={ag.agentName} className="p-2.5 rounded-xl bg-slate-900 border border-slate-850 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-100 flex items-center gap-1">
                        <Bot className="w-3 h-3 text-blue-400" /> {ag.agentName}
                      </span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    </div>
                    <p className="text-[10px] text-slate-400 truncate">{ag.role}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
