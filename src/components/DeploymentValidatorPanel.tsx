import React, { useState } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Play,
  RefreshCw,
  Clock,
  Layers,
  ChevronRight,
  Sparkles,
  Workflow,
  Activity,
  Cpu,
  Lock,
  Server,
  Radio,
  HardDrive,
  FileText,
  CheckSquare,
  AlertOctagon,
  ArrowRight
} from 'lucide-react';
import {
  DeploymentValidationReport,
  ValidationCategory,
  ValidationCheckItem,
  DeploymentApprovalDecision
} from '../../server/services/deploymentValidatorService';

interface DeploymentValidatorPanelProps {
  currentReport: DeploymentValidationReport | null;
  validationHistory: DeploymentValidationReport[];
  onRunValidation: () => void;
  onRefreshData: () => void;
}

export default function DeploymentValidatorPanel({
  currentReport,
  validationHistory,
  onRunValidation,
  onRefreshData
}: DeploymentValidatorPanelProps) {
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<ValidationCategory | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'passed' | 'warning' | 'failed'>('all');

  const report = validationHistory.find(r => r.id === selectedReportId) || currentReport || validationHistory[0] || null;

  const categoryIcons: Record<ValidationCategory, React.ReactNode> = {
    architecture: <Workflow className="w-4 h-4 text-blue-400" />,
    environment: <Layers className="w-4 h-4 text-purple-400" />,
    security: <Lock className="w-4 h-4 text-emerald-400" />,
    resource: <Cpu className="w-4 h-4 text-amber-400" />,
    health: <Activity className="w-4 h-4 text-rose-400" />,
    dependency: <Server className="w-4 h-4 text-sky-400" />,
    monitoring: <Radio className="w-4 h-4 text-indigo-400" />,
    backup: <HardDrive className="w-4 h-4 text-cyan-400" />,
    strategy: <FileText className="w-4 h-4 text-teal-400" />,
    event_bus: <Sparkles className="w-4 h-4 text-yellow-400" />
  };

  const getDecisionBadge = (decision?: DeploymentApprovalDecision) => {
    switch (decision) {
      case 'APPROVED':
        return (
          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>APPROVED FOR PRODUCTION</span>
          </span>
        );
      case 'CONDITIONALLY_APPROVED':
        return (
          <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>CONDITIONALLY APPROVED</span>
          </span>
        );
      case 'REJECTED':
      default:
        return (
          <span className="bg-red-500/10 text-red-400 border border-red-500/20 text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5" />
            <span>REJECTED</span>
          </span>
        );
    }
  };

  if (!report) {
    return (
      <div className="bg-slate-900/80 border border-slate-800 p-8 rounded-3xl text-center space-y-4">
        <ShieldCheck className="w-12 h-12 text-blue-400 mx-auto animate-pulse" />
        <h3 className="text-base font-bold text-slate-100">No Validation Report Available</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Execute the backend validation pipeline to inspect architecture, security, resources, dependencies, and event bus readiness before deployment.
        </p>
        <button
          onClick={onRunValidation}
          className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-blue-600/20 cursor-pointer inline-flex items-center gap-2"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>Run Deployment Validator Now</span>
        </button>
      </div>
    );
  }

  // Collect all checks across categories
  const allCategoryResults = Object.values(report.categoryResults);
  const allChecks: ValidationCheckItem[] = allCategoryResults.flatMap(cat => cat.checks);

  const filteredChecks = allChecks.filter(check => {
    if (filterCategory !== 'all' && check.category !== filterCategory) return false;
    if (filterStatus !== 'all' && check.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner Card: Readiness Score & Quick Actions */}
      <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          {/* Circular Score Gauge */}
          <div className="relative flex items-center justify-center w-24 h-24 bg-slate-950 border border-slate-800 rounded-2xl shadow-inner shrink-0">
            <div className="text-3xl font-black text-emerald-400 font-mono">
              {report.overallReadinessScore}
            </div>
            <span className="absolute bottom-1.5 text-[10px] text-slate-500 font-mono">/ 100 READINESS</span>
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-bold text-slate-100">{report.resourceName}</h3>
              {getDecisionBadge(report.decision)}
              <span className="bg-slate-800 text-slate-300 border border-slate-700 text-xs px-2.5 py-0.5 rounded-full font-mono">
                RISK: {report.riskLevel}
              </span>
            </div>

            <p className="text-xs text-slate-400 max-w-xl leading-relaxed">
              Target: <span className="text-slate-200 font-semibold">{report.environment.toUpperCase()}</span> ({report.deploymentType}) • Validator Engine: <span className="font-mono text-slate-300">{report.validatorVersion}</span>
            </p>

            <div className="flex items-center gap-4 text-xs text-slate-500 font-mono pt-1">
              <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> {report.aiReport.passedChecksCount} Passed
              </span>
              <span className="flex items-center gap-1 text-amber-400 font-semibold">
                <AlertTriangle className="w-3.5 h-3.5" /> {report.aiReport.warningChecksCount} Warnings
              </span>
              <span className="flex items-center gap-1 text-red-400 font-semibold">
                <XCircle className="w-3.5 h-3.5" /> {report.aiReport.failedChecksCount} Failed
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
          <button
            onClick={onRefreshData}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-700 flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
            <span>Refresh</span>
          </button>

          <button
            onClick={onRunValidation}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg shadow-blue-600/20 flex items-center gap-2 cursor-pointer transition-all"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Run Validation Pipeline</span>
          </button>
        </div>
      </div>

      {/* History Selector Bar */}
      {validationHistory.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs text-slate-400 font-semibold shrink-0">Validation Runs:</span>
          {validationHistory.map(hist => (
            <button
              key={hist.id}
              onClick={() => setSelectedReportId(hist.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono shrink-0 cursor-pointer transition-all flex items-center gap-2 ${
                report.id === hist.id
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <span>Score: {hist.overallReadinessScore}/100</span>
              <span className="opacity-75">({new Date(hist.validatedAt).toLocaleTimeString()})</span>
            </button>
          ))}
        </div>
      )}

      {/* AI Copilot Explanation Report Card */}
      <div className="bg-gradient-to-r from-slate-900/90 via-slate-900/95 to-slate-950 border border-slate-800 p-5 rounded-2xl space-y-3 shadow-lg">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            AI Copilot Explainable Validation Analysis
          </h4>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed font-sans bg-slate-950/60 p-4 rounded-xl border border-slate-850">
          {report.aiReport.summary}
        </p>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed">
          {report.aiReport.aiCopilotExplanation}
        </div>
      </div>

      {/* 10 Validation Categories Overview Cards */}
      <div>
        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-400" />
          <span>10 Validation Sub-Services Inspection Matrix</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {allCategoryResults.map(cat => (
            <button
              key={cat.category}
              onClick={() => setFilterCategory(filterCategory === cat.category ? 'all' : cat.category)}
              className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all ${
                filterCategory === cat.category
                  ? 'bg-blue-950/50 border-blue-500'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                {categoryIcons[cat.category]}
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-950 text-emerald-400">
                  {cat.score}%
                </span>
              </div>
              <div className="text-xs font-bold text-slate-200 truncate">{cat.title.replace(' Validator', '')}</div>
              <div className="text-[10px] text-slate-500 mt-1">{cat.checks.length} Checks Executed</div>
            </button>
          ))}
        </div>
      </div>

      {/* Individual Validation Checks List */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-emerald-400" />
            <span>Detailed Validation Checks ({filteredChecks.length})</span>
          </h4>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-850">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer ${
                filterStatus === 'all' ? 'bg-slate-800 text-slate-100' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterStatus('passed')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer ${
                filterStatus === 'passed' ? 'bg-emerald-900/60 text-emerald-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Passed
            </button>
            <button
              onClick={() => setFilterStatus('warning')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer ${
                filterStatus === 'warning' ? 'bg-amber-900/60 text-amber-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Warnings
            </button>
            <button
              onClick={() => setFilterStatus('failed')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer ${
                filterStatus === 'failed' ? 'bg-red-900/60 text-red-300' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Failed
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {filteredChecks.map(check => (
            <div
              key={check.id}
              className={`bg-slate-950 p-4 rounded-xl border transition-all ${
                check.status === 'passed'
                  ? 'border-slate-850'
                  : check.status === 'warning'
                  ? 'border-amber-500/30 bg-amber-950/10'
                  : 'border-red-500/30 bg-red-950/10'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  {check.status === 'passed' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                  {check.status === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
                  {check.status === 'failed' && <XCircle className="w-4 h-4 text-red-400 shrink-0" />}
                  <h5 className="text-xs font-bold text-slate-100">{check.name}</h5>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-slate-500">Weight: {check.weight}/10</span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase ${
                    check.status === 'passed' ? 'bg-emerald-500/10 text-emerald-400' :
                    check.status === 'warning' ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'
                  }`}>
                    {check.category}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-300 mt-2 pl-6">{check.message}</p>

              <div className="mt-3 pt-2 border-t border-slate-900 pl-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
                <div className="text-slate-500 font-mono">
                  Evidence: <span className="text-slate-300 font-sans">{check.evidence}</span>
                </div>

                {check.recommendedFix && (
                  <div className="text-amber-400 font-medium flex items-center gap-1">
                    <ArrowRight className="w-3 h-3" />
                    <span>Fix: {check.recommendedFix}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommended Fixes & Pipeline Execution Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recommended Fixes */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl space-y-3">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-amber-400" />
            <span>Actionable Fixes & Policy Recommendations</span>
          </h4>

          {report.aiReport.recommendedFixes.length > 0 ? (
            <div className="space-y-2">
              {report.aiReport.recommendedFixes.map((fix, idx) => (
                <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-slate-850 text-xs text-slate-300 flex items-start gap-2">
                  <ChevronRight className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>{fix}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 bg-slate-950 rounded-xl text-xs text-slate-400 text-center">
              Zero active critical errors or warnings. Deployment configuration is 100% compliant.
            </div>
          )}
        </div>

        {/* Validation Pipeline Execution Timeline */}
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl space-y-3">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-400" />
            <span>Validation Pipeline Execution Lifecycle</span>
          </h4>

          <div className="space-y-2">
            {report.validationTimeline.map((step, idx) => (
              <div key={idx} className="bg-slate-950 p-3 rounded-xl border border-slate-850 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-200">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{step.phase}</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500">{new Date(step.timestamp).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
