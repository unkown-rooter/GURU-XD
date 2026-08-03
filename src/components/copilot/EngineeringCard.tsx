import React from 'react';
import { 
  Activity, 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  Cpu, 
  Rocket, 
  BarChart3, 
  BrainCircuit, 
  Wifi, 
  Lightbulb, 
  XCircle,
  ArrowRight,
  ShieldCheck,
  Server
} from 'lucide-react';

export type CardType = 
  | 'system_status' 
  | 'recommendation' 
  | 'warning' 
  | 'error' 
  | 'platform_health' 
  | 'deployment' 
  | 'security' 
  | 'analytics' 
  | 'memory' 
  | 'network';

export interface EngineeringCardProps {
  type: CardType;
  title: string;
  description: string;
  metrics?: { label: string; value: string; status?: 'good' | 'warn' | 'bad' }[];
  actions?: { label: string; onClick: () => void; variant?: 'primary' | 'secondary' | 'danger' }[];
  severity?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
  timestamp?: string;
}

export function EngineeringCard({
  type,
  title,
  description,
  metrics,
  actions,
  severity,
  timestamp
}: EngineeringCardProps) {
  const getCardStyling = () => {
    switch (type) {
      case 'system_status':
      case 'platform_health':
        return {
          icon: Activity,
          headerColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
          borderColor: 'border-emerald-500/30',
          accentBg: 'bg-emerald-950/20'
        };
      case 'recommendation':
        return {
          icon: Lightbulb,
          headerColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
          borderColor: 'border-amber-500/30',
          accentBg: 'bg-amber-950/20'
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          headerColor: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
          borderColor: 'border-orange-500/30',
          accentBg: 'bg-orange-950/20'
        };
      case 'error':
        return {
          icon: XCircle,
          headerColor: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
          borderColor: 'border-rose-500/30',
          accentBg: 'bg-rose-950/20'
        };
      case 'deployment':
        return {
          icon: Rocket,
          headerColor: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
          borderColor: 'border-blue-500/30',
          accentBg: 'bg-blue-950/20'
        };
      case 'security':
        return {
          icon: ShieldAlert,
          headerColor: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
          borderColor: 'border-purple-500/30',
          accentBg: 'bg-purple-950/20'
        };
      case 'analytics':
        return {
          icon: BarChart3,
          headerColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
          borderColor: 'border-cyan-500/30',
          accentBg: 'bg-cyan-950/20'
        };
      case 'memory':
        return {
          icon: BrainCircuit,
          headerColor: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
          borderColor: 'border-indigo-500/30',
          accentBg: 'bg-indigo-950/20'
        };
      case 'network':
        return {
          icon: Wifi,
          headerColor: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
          borderColor: 'border-sky-500/30',
          accentBg: 'bg-sky-950/20'
        };
      default:
        return {
          icon: Server,
          headerColor: 'text-slate-300 bg-slate-800 border-slate-700',
          borderColor: 'border-slate-800',
          accentBg: 'bg-slate-900/50'
        };
    }
  };

  const styling = getCardStyling();
  const Icon = styling.icon;

  return (
    <div className={`my-3 p-4 rounded-xl bg-[#090E1A] border ${styling.borderColor} shadow-xl space-y-3 font-sans`}>
      {/* Card Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-lg border ${styling.headerColor}`}>
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-100 flex items-center gap-2">
              {title}
              {severity && (
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                  severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                  severity === 'HIGH' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                  severity === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                  'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                }`}>
                  {severity}
                </span>
              )}
            </h4>
            {timestamp && <span className="text-[10px] text-slate-500 font-mono">{timestamp}</span>}
          </div>
        </div>

        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
          {type.replace('_', ' ')}
        </span>
      </div>

      {/* Description */}
      <p className="text-xs text-slate-300 leading-relaxed font-normal">
        {description}
      </p>

      {/* Metrics Grid */}
      {metrics && metrics.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pt-1">
          {metrics.map((m, idx) => (
            <div key={idx} className="p-2 rounded-lg bg-slate-900/80 border border-slate-800/80 space-y-0.5">
              <span className="text-[10px] text-slate-400 font-medium block">{m.label}</span>
              <span className={`text-xs font-mono font-bold ${
                m.status === 'bad' ? 'text-rose-400' :
                m.status === 'warn' ? 'text-amber-400' :
                'text-emerald-400'
              }`}>
                {m.value}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Action Buttons */}
      {actions && actions.length > 0 && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800/80">
          {actions.map((act, idx) => (
            <button
              key={idx}
              onClick={act.onClick}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                act.variant === 'danger'
                  ? 'bg-rose-600 hover:bg-rose-500 text-white'
                  : act.variant === 'primary'
                  ? 'bg-blue-600 hover:bg-blue-500 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
              }`}
            >
              {act.label}
              <ArrowRight className="w-3 h-3" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
