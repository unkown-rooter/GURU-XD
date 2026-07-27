import React, { useState } from 'react';
import { 
  Rocket, 
  GitBranch, 
  GitCommit, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  RotateCcw, 
  Play, 
  Terminal, 
  ChevronRight, 
  ExternalLink,
  ShieldCheck,
  Search,
  RefreshCw,
  Box,
  Layers,
  ArrowRight
} from 'lucide-react';

export interface Deployment {
  id: string;
  appName: string;
  branch: string;
  commitHash: string;
  commitMessage: string;
  status: 'Deployed' | 'Building' | 'Failed' | 'Rolled back';
  author: string;
  createdAt: string;
  duration: string;
  logs: string[];
}

interface DeploymentsViewProps {
  deployments: Deployment[];
  onTriggerDeploy: (appName: string, branch: string) => void;
  onRollback: (deploymentId: string) => void;
}

export default function DeploymentsView({
  deployments,
  onTriggerDeploy,
  onRollback
}: DeploymentsViewProps) {
  const [selectedDeploy, setSelectedDeploy] = useState<Deployment | null>(deployments[0] || null);
  const [filterAppName, setFilterAppName] = useState('All');
  const [showTriggerModal, setShowTriggerModal] = useState(false);
  const [targetAppName, setTargetAppName] = useState('GURU-XD Primary Hypervisor');
  const [targetBranch, setTargetBranch] = useState('main');

  const filteredDeploys = deployments.filter((dep) => {
    if (filterAppName === 'All') return true;
    return dep.appName === filterAppName;
  });

  const uniqueApps = Array.from(new Set(deployments.map((d) => d.appName)));

  const handleManualTrigger = (e: React.FormEvent) => {
    e.preventDefault();
    onTriggerDeploy(targetAppName, targetBranch);
    setShowTriggerModal(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-100 tracking-tight flex items-center gap-2">
            <Rocket className="w-6 h-6 text-blue-500" />
            <span>Deployments & Pipelines</span>
          </h1>
          <p className="text-xs text-slate-400">Continuous deployment pipeline, container build logs, and instant atomic zero-downtime rollbacks.</p>
        </div>

        <button
          onClick={() => setShowTriggerModal(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/20 cursor-pointer self-start"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>Trigger Build Pipeline</span>
        </button>
      </div>

      {/* Main Grid: Pipelines List + Live Log Terminal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Pipeline Build History */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between bg-slate-900/60 border border-slate-800 p-3 rounded-2xl">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider pl-1">Build History</span>
            <select
              value={filterAppName}
              onChange={(e) => setFilterAppName(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl p-1.5 focus:outline-none cursor-pointer"
            >
              <option value="All">All Apps</option>
              {uniqueApps.map((app) => (
                <option key={app} value={app}>{app}</option>
              ))}
            </select>
          </div>

          <div className="space-y-3 max-h-[680px] overflow-y-auto pr-1">
            {filteredDeploys.map((dep) => {
              const isSelected = selectedDeploy?.id === dep.id;
              return (
                <div
                  key={dep.id}
                  onClick={() => setSelectedDeploy(dep)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                    isSelected
                      ? 'bg-blue-600/10 border-blue-500/40 shadow-lg shadow-blue-500/10'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-100 flex items-center gap-2">
                      <Box className="w-3.5 h-3.5 text-blue-400" />
                      <span>{dep.appName}</span>
                    </span>

                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold flex items-center gap-1 border ${
                      dep.status === 'Deployed'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : dep.status === 'Building'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse'
                        : dep.status === 'Failed'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      {dep.status === 'Deployed' && <CheckCircle2 className="w-3 h-3" />}
                      {dep.status === 'Failed' && <XCircle className="w-3 h-3" />}
                      {dep.status === 'Building' && <RefreshCw className="w-3 h-3 animate-spin" />}
                      <span>{dep.status}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
                    <span className="flex items-center gap-1 text-slate-300">
                      <GitBranch className="w-3 h-3 text-blue-400" />
                      <span>{dep.branch}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-slate-400">
                      <GitCommit className="w-3 h-3 text-slate-500" />
                      <span>{dep.commitHash}</span>
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-1 italic">
                    "{dep.commitMessage}"
                  </p>

                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-2 border-t border-slate-800/60">
                    <span>by {dep.author}</span>
                    <div className="flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      <span>{dep.createdAt} ({dep.duration})</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Live Log Stream Terminal */}
        <div className="lg:col-span-7 bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between shadow-2xl">
          {selectedDeploy ? (
            <>
              {/* Build Details Bar */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-slate-100">{selectedDeploy.appName}</h3>
                    <span className="text-xs font-mono text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">
                      {selectedDeploy.commitHash}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">Commit: {selectedDeploy.commitMessage}</p>
                </div>

                {selectedDeploy.status === 'Deployed' && (
                  <button
                    onClick={() => onRollback(selectedDeploy.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                    <span>Rollback Container</span>
                  </button>
                )}
              </div>

              {/* Console Logs Stream */}
              <div className="space-y-2 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Pipeline Container Build Output</span>
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                    TLS 1.3 Docker Gateway
                  </span>
                </div>

                <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-4 font-mono text-xs text-slate-300 space-y-1.5 h-[480px] overflow-y-auto scrollbar-thin">
                  {selectedDeploy.logs.map((logLine, idx) => (
                    <div key={idx} className="flex gap-2">
                      <span className="text-slate-600 select-none">{(idx + 1).toString().padStart(2, '0')}</span>
                      <span className={logLine.includes('SUCCESS') || logLine.includes('Deployed') ? 'text-emerald-400' : logLine.includes('ERROR') ? 'text-rose-400' : 'text-slate-300'}>
                        {logLine}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-800 pt-3 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Atomic Container Image Signed & Verified</span>
                </span>
                <span className="font-mono text-[11px] text-slate-500">Duration: {selectedDeploy.duration}</span>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-20 text-center space-y-3">
              <Rocket className="w-10 h-10 text-slate-600" />
              <p className="text-xs text-slate-400">Select a deployment pipeline from the left to view real-time container build logs.</p>
            </div>
          )}
        </div>
      </div>

      {/* Trigger Build Modal */}
      {showTriggerModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-[9999] animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-100">Trigger Pipeline Build</h3>
              <button 
                onClick={() => setShowTriggerModal(false)}
                className="w-7 h-7 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleManualTrigger} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">Target Application</label>
                <select
                  value={targetAppName}
                  onChange={(e) => setTargetAppName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none cursor-pointer"
                >
                  {uniqueApps.map((app) => (
                    <option key={app} value={app}>{app}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-400 text-xs font-semibold uppercase tracking-wider block">Git Branch</label>
                <input
                  type="text"
                  required
                  value={targetBranch}
                  onChange={(e) => setTargetBranch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 font-mono focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTriggerModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-md shadow-blue-600/20"
                >
                  Deploy Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
