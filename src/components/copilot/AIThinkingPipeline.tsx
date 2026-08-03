import React from 'react';
import { motion } from 'motion/react';
import { 
  Eye, 
  Brain, 
  Search, 
  Cpu, 
  GitCompare, 
  Lightbulb, 
  CheckCircle2, 
  Sparkles, 
  MessageSquare,
  Loader2
} from 'lucide-react';

export interface AIThinkingPipelineProps {
  currentStageIndex?: number;
  activeStageName?: string;
  isProcessing?: boolean;
}

export const PIPELINE_STAGES = [
  { id: 'observe', label: 'Observe', icon: Eye, description: 'Ingesting query & environment metrics' },
  { id: 'understand', label: 'Understand', icon: Brain, description: 'Parsing keywords & operator intent' },
  { id: 'memory', label: 'Search Memory', icon: Search, description: 'Querying 3-tier memory stores' },
  { id: 'analyze', label: 'Analyze', icon: Cpu, description: 'Evaluating cluster telemetry & logs' },
  { id: 'compare', label: 'Compare', icon: GitCompare, description: 'Comparing historical incident patterns' },
  { id: 'reason', label: 'Reason', icon: Lightbulb, description: 'Formulating decision logic' },
  { id: 'recommend', label: 'Recommend', icon: CheckCircle2, description: 'Synthesizing action steps' },
  { id: 'generate', label: 'Generate', icon: Sparkles, description: 'Constructing response payload' },
  { id: 'respond', label: 'Respond', icon: MessageSquare, description: 'Delivering solution' }
];

export function AIThinkingPipeline({
  currentStageIndex = 3,
  activeStageName,
  isProcessing = true
}: AIThinkingPipelineProps) {
  return (
    <div className="p-3 rounded-xl bg-[#090D18] border border-blue-900/40 shadow-xl space-y-2 font-mono">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
        <span className="text-[11px] font-bold text-blue-400 flex items-center gap-1.5 uppercase tracking-wider">
          {isProcessing ? (
            <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin" />
          ) : (
            <Brain className="w-3.5 h-3.5 text-blue-400" />
          )}
          AI Cognitive Thinking Pipeline
        </span>
        <span className="text-[10px] text-slate-400 font-sans">
          {activeStageName || PIPELINE_STAGES[currentStageIndex]?.label || 'Processing'}
        </span>
      </div>

      {/* Steps Visualizer */}
      <div className="grid grid-cols-3 sm:grid-cols-9 gap-1 pt-1">
        {PIPELINE_STAGES.map((stage, idx) => {
          const Icon = stage.icon;
          const isActive = idx === currentStageIndex && isProcessing;
          const isDone = idx < currentStageIndex || (!isProcessing && idx <= currentStageIndex);

          return (
            <div
              key={stage.id}
              className={`p-1.5 rounded-lg border flex flex-col items-center text-center transition-all ${
                isActive
                  ? 'bg-blue-600/20 border-blue-500/50 text-blue-300 shadow-sm scale-105'
                  : isDone
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : 'bg-slate-900/60 border-slate-800/80 text-slate-500'
              }`}
              title={`${stage.label}: ${stage.description}`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'animate-pulse text-blue-400' : ''}`} />
              <span className="text-[9px] font-medium tracking-tight mt-1 truncate w-full">
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
