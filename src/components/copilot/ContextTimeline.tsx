import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  Activity, 
  HelpCircle, 
  ArrowRight, 
  Play, 
  RotateCcw, 
  Lightbulb,
  CheckSquare,
  AlertCircle,
  FileCode
} from 'lucide-react';
import { CopilotWorkItem, CopilotSuggestion } from '../../types';

export interface ContextTimelineProps {
  currentTask?: string;
  workTimeline: CopilotWorkItem[];
  suggestions: CopilotSuggestion[];
  onResumeWork: () => void;
  onExecuteAction: (promptText: string) => void;
}

export function ContextTimeline({
  currentTask = "Optimizing GURU-XD AI Copilot & Memory Pipeline",
  workTimeline,
  suggestions,
  onResumeWork,
  onExecuteAction
}: ContextTimelineProps) {
  const [filter, setFilter] = useState<'all' | 'tasks' | 'decisions' | 'suggestions'>('all');

  const completedItems = workTimeline.filter(w => w.status === 'completed');
  const pendingItems = workTimeline.filter(w => w.status === 'in_progress' || w.status === 'planned');

  return (
    <div className="space-y-3 font-sans">
      {/* Header */}
      <div className="p-3 rounded-xl bg-gradient-to-r from-blue-950/40 via-purple-950/20 to-slate-900 border border-blue-800/40 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1 font-mono">
            <Activity className="w-3.5 h-3.5 text-blue-400" />
            Current Active Work Task
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            IN PROGRESS
          </span>
        </div>
        <p className="text-xs font-semibold text-slate-100">{currentTask}</p>
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={onResumeWork}
            className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold flex items-center gap-1 transition-colors shadow-sm"
          >
            <RotateCcw className="w-3 h-3" />
            Resume Previous Session
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 p-1 bg-slate-900/80 rounded-lg border border-slate-800/80">
        {(['all', 'tasks', 'decisions', 'suggestions'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`flex-1 py-1 text-[11px] font-medium rounded-md capitalize transition-all ${
              filter === tab
                ? 'bg-slate-800 text-blue-400 border border-slate-700/80 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Timeline Stream */}
      <div className="space-y-2.5 max-h-96 overflow-y-auto custom-scrollbar pr-1">
        {/* Pending / In Progress Tasks */}
        {(filter === 'all' || filter === 'tasks') && pendingItems.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider block">
              ⏳ Pending Work ({pendingItems.length})
            </span>
            {pendingItems.map((item) => (
              <div
                key={item.id}
                className="p-2.5 rounded-xl bg-slate-900/80 border border-amber-500/30 space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-amber-300 font-mono">{item.module}</span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-slate-200 font-medium">{item.summary}</p>
                <button
                  onClick={() => onExecuteAction(`Continue pending task: ${item.summary}`)}
                  className="text-[10px] font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 pt-1"
                >
                  <Play className="w-3 h-3" /> Execute Work
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Completed Tasks */}
        {(filter === 'all' || filter === 'tasks') && completedItems.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider block">
              ✓ Completed Work ({completedItems.length})
            </span>
            {completedItems.map((item) => (
              <div
                key={item.id}
                className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-emerald-400 font-mono flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> {item.module}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-xs text-slate-300">{item.summary}</p>
                {item.filesChanged && item.filesChanged.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {item.filesChanged.map((f, idx) => (
                      <span key={idx} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/50">
                        {f}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Suggestions / Future Work */}
        {(filter === 'all' || filter === 'suggestions') && suggestions.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono text-purple-400 uppercase tracking-wider block">
              💡 Future Recommendations ({suggestions.length})
            </span>
            {suggestions.map((sug) => (
              <div
                key={sug.id}
                className="p-2.5 rounded-xl bg-slate-900/80 border border-purple-500/20 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-purple-300 font-mono">{sug.module}</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300">
                    {sug.priority}
                  </span>
                </div>
                <p className="text-xs font-semibold text-slate-100">{sug.title}</p>
                <p className="text-[11px] text-slate-400 leading-normal">{sug.description}</p>
                <button
                  onClick={() => onExecuteAction(`Apply recommendation: ${sug.title}`)}
                  className="px-2 py-1 rounded bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-[10px] font-semibold flex items-center gap-1 transition-colors"
                >
                  Apply Recommendation <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
