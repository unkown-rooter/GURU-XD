import React from 'react';
import logoUrl from '../assets/images/guru_xd_logo_1784332841454.jpg';
import { 
  Server, 
  Bot as BotIcon, 
  CirclePause, 
  Users, 
  MessageSquare, 
  Zap, 
  Cpu, 
  Database,
  ArrowUpRight,
  TrendingUp,
  Plus,
  AlertTriangle,
  GitCompare,
  Clock
} from 'lucide-react';
import { Bot, LogLine } from '../types';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { ANALYTICS_DATA } from '../data';

interface DashboardViewProps {
  bots: Bot[];
  logs: LogLine[];
  onDeployClick: () => void;
  onBotClick: (bot: Bot) => void;
  onRefresh: () => void;
  systemMetrics: { cpu: number; ram: string };
}

export default function DashboardView({ 
  bots, 
  logs, 
  onDeployClick, 
  onBotClick,
  onRefresh,
  systemMetrics
}: DashboardViewProps) {
  const activeBots = bots.filter(b => b.status === 'running').length;
  const offlineBots = bots.filter(b => b.status === 'stopped').length;

  const [uptimeSeconds, setUptimeSeconds] = React.useState(8070); // Seed with 2h 14m 30s
  const [showReleaseDetails, setShowReleaseDetails] = React.useState(false);
  
  React.useEffect(() => {
    const interval = setInterval(() => {
      setUptimeSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours > 0 ? `${hours}h ` : ''}${minutes}m ${seconds}s`;
  };
  
  // Custom styled Tooltip for Recharts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-950 border border-slate-900 p-3 rounded-lg shadow-xl">
          <p className="text-xs font-mono text-slate-500 mb-1">{label}</p>
          <p className="text-xs font-semibold text-blue-400">
            Messages: <span className="font-mono text-slate-200">{payload[0].value.toLocaleString()}</span>
          </p>
          <p className="text-xs font-semibold text-emerald-400">
            Commands: <span className="font-mono text-slate-200">{payload[1].value.toLocaleString()}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-start md:items-center gap-3">
          <div>
            <h1 className="text-2xl font-display font-bold text-slate-100 tracking-tight">Platform Orchestration</h1>
            <p className="text-xs text-slate-400">Real-time container clusters and WhatsApp/Telegram bot hosting telemetry.</p>
          </div>
          {(() => {
            const cpuPercent = systemMetrics.cpu;
            const parseRamPercent = (ramStr: string) => {
              try {
                const parts = ramStr.split('/');
                if (parts.length === 2) {
                  const used = parseFloat(parts[0]);
                  const total = parseFloat(parts[1]);
                  if (!isNaN(used) && !isNaN(total) && total > 0) {
                    return (used / total) * 100;
                  }
                }
              } catch (e) { }
              return 45;
            };
            const ramPercent = parseRamPercent(systemMetrics.ram);
            if (cpuPercent > 85 || ramPercent > 85) {
              return (
                <div className="animate-bounce inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-mono font-bold bg-rose-600 border border-rose-500 text-white shadow-lg shadow-rose-500/40 select-none shrink-0 self-start sm:self-center">
                  <span className="w-2 h-2 rounded-full bg-white animate-ping shrink-0" />
                  <span>OVERLOAD WARNING: &gt;85%</span>
                </div>
              );
            }
            return null;
          })()}
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={onDeployClick}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs px-4 py-2 rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Deploy New Instance</span>
          </button>
        </div>
      </div>

      {/* Welcome & Brand Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-900 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center gap-5 relative z-10 text-center md:text-left flex-col md:flex-row">
          <img 
            src={logoUrl} 
            alt="GURU-XD Premium Brand Logo" 
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover ring-4 ring-blue-500/10 shadow-2xl"
            referrerPolicy="no-referrer"
          />
          <div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              HYPERVISOR CORES ONLINE • v2.0.1
            </span>
            <h2 className="text-xl sm:text-2xl font-bold font-display text-slate-100 tracking-tight flex items-center gap-2">
              GURU-XD Bot Hosting Engine
              <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">v2.0.1-Release</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
              Empower your multi-device messaging clusters. Automate manual queries, connect secure webhooks, and dominate community channels.
            </p>
          </div>
        </div>

        <div className="flex flex-row md:flex-col items-end gap-2 relative z-10 border-t border-slate-900/60 md:border-0 pt-4 md:pt-0 w-full md:w-auto justify-center">
          <div className="text-center md:text-right flex flex-col items-center md:items-end gap-2">
            <span className="text-[10px] uppercase font-mono text-slate-500 tracking-wider block">GATEWAY API STATUS</span>
            <div className="flex items-center gap-2 mt-0.5 justify-center md:justify-end">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-mono font-bold text-emerald-400">OPERATIONAL</span>
            </div>
            <button
              onClick={() => setShowReleaseDetails(!showReleaseDetails)}
              className="mt-2 text-[10px] font-mono font-bold uppercase tracking-wider bg-slate-900 hover:bg-slate-800 border border-slate-800 text-blue-400 hover:text-blue-300 py-1 px-2.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <GitCompare className="w-3.5 h-3.5 text-blue-400" />
              <span>{showReleaseDetails ? "Hide Evolution" : "Compare v1.0.0 vs v2.0.1"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Platform Evolution Comparison Timeline */}
      {showReleaseDetails && (
        <div className="bg-slate-950/25 border border-slate-900 rounded-2xl p-5 md:p-6 space-y-4 animate-in slide-in-from-top-4 duration-300">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-slate-900/60">
            <div className="flex items-center gap-2.5">
              <Clock className="w-5 h-5 text-amber-500" />
              <div>
                <h3 className="text-sm font-semibold font-display text-slate-200">GURU-XD Release History & Platform Evolution</h3>
                <p className="text-[10px] text-slate-400">Comparing the foundational v1.0.0 specifications against the current enterprise hypervisor stack.</p>
              </div>
            </div>
            <span className="text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/25 px-2 py-0.5 rounded-full">
              LIFECYCLE MAP
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Legacy V1.0.0 Column */}
            <div className="bg-slate-950/60 border border-amber-950/30 rounded-xl p-4 space-y-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/[0.01] rounded-full blur-xl pointer-events-none" />
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-amber-500 bg-amber-500/5 border border-amber-500/10 px-2 py-0.5 rounded uppercase">
                  v1.0.0 Legacy Engine
                </span>
                <span className="text-[10px] font-mono text-slate-500">Deprecated Release</span>
              </div>
              <p className="text-[11px] text-slate-400">
                A lightweight, terminal-first WhatsApp bot automation script designed for single-device hosting with static configurations.
              </p>
              <ul className="space-y-2 text-[10px] font-mono text-slate-400">
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 select-none">✕</span>
                  <span><strong className="text-slate-300">Single WA Pipeline:</strong> Limited strictly to local WhatsApp Baileys socket hooks. No Telegram/Discord capability.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 select-none">✕</span>
                  <span><strong className="text-slate-300">No Interactive UI:</strong> Configurations altered solely by manual editing of local file JSON blocks inside a terminal.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 select-none">✕</span>
                  <span><strong className="text-slate-300">No Database Brain:</strong> Commands statically read from direct Javascript file trees; zero database schema structure.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 select-none">✕</span>
                  <span><strong className="text-slate-300">Blind Operations:</strong> No active RAM/CPU hypervisor metrics. Errors only visible via raw terminal outputs.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 select-none">✕</span>
                  <span><strong className="text-slate-300">Crash-Prone:</strong> Buffer overflow limits during intensive incoming server events crashed active sessions instantly.</span>
                </li>
              </ul>
            </div>

            {/* Current V2.0.1 Column */}
            <div className="bg-slate-950/60 border border-blue-900/40 rounded-xl p-4 space-y-3 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/[0.03] rounded-full blur-xl pointer-events-none" />
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-blue-400 bg-blue-500/5 border border-blue-500/15 px-2 py-0.5 rounded uppercase">
                  v2.0.1 Enterprise Stack
                </span>
                <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-emerald-400 animate-ping" />
                  Active Build
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                A multi-tenant cloud-native hypervisor offering clustered device gateways, real-time telemetry, and a dynamic database.
              </p>
              <ul className="space-y-2 text-[10px] font-mono text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 select-none">✓</span>
                  <span><strong className="text-slate-100">Cross-Platform Clusters:</strong> Run multiple high-speed WhatsApp, Discord, and Telegram instances side-by-side.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 select-none">✓</span>
                  <span><strong className="text-slate-100">Interactive Portal:</strong> Manage file systems, edit active scripts, and hot-load plugins with zero reboots.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 select-none">✓</span>
                  <span><strong className="text-slate-100">MongoDB Database Brain:</strong> Dynamic mongoose schemas compiler, connection socket handshakes, and UI fields mapper.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 select-none">✓</span>
                  <span><strong className="text-slate-100">Rich Telemetry:</strong> CPU virtualization load, memory heap gauges, warning alerts, and real-time area load velocity charts.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 select-none">✓</span>
                  <span><strong className="text-slate-100">Self-Healing Loops:</strong> Automated connection retry handlers, load balancing, and concurrent transaction queues.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card: Server Status */}
        <div className="bg-slate-950/40 border border-slate-900/60 p-5 rounded-xl hover:border-slate-800/80 transition-all duration-300 flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Server className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500">Core Engine</span>
            <h3 className="text-lg font-bold font-display text-emerald-400 mt-0.5">HEALTHY</h3>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono mt-1">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              <span>100% Core Uptime</span>
            </div>
          </div>
        </div>

        {/* Card: Active Bots */}
        <div className="bg-slate-950/40 border border-slate-900/60 p-5 rounded-xl hover:border-slate-800/80 transition-all duration-300 flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
            <BotIcon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500">Active Instances</span>
            <h3 className="text-lg font-bold font-display text-slate-100 mt-0.5">{activeBots}</h3>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              <span>{bots.length} total hosted bots</span>
            </div>
          </div>
        </div>

        {/* Card: Stopped Bots */}
        <div className="bg-slate-950/40 border border-slate-900/60 p-5 rounded-xl hover:border-slate-800/80 transition-all duration-300 flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
            <CirclePause className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500">Offline Nodes</span>
            <h3 className="text-lg font-bold font-display text-rose-400 mt-0.5">{offlineBots}</h3>
            <div className="text-[10px] text-slate-400 font-mono mt-1">
              <span>{offlineBots > 0 ? 'Pairing session offline' : 'All channels active'}</span>
            </div>
          </div>
        </div>

        {/* Card: Global Commands Run */}
        <div className="bg-slate-950/40 border border-slate-900/60 p-5 rounded-xl hover:border-slate-800/80 transition-all duration-300 flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500">Commands Run</span>
            <h3 className="text-lg font-bold font-display text-slate-100 mt-0.5">34,185</h3>
            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono mt-1">
              <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
              <span>+12.4% vs yesterday</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Core Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Traffic Area Chart (Span 2) */}
        <div className="lg:col-span-2 bg-slate-950/20 border border-slate-900 p-6 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-200">Global Traffic Velocity</h2>
              <p className="text-[11px] text-slate-500">Incoming message load and automated handler execution metrics (24h history).</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-blue-500/20 border border-blue-500" />
                <span className="text-slate-400">Messages</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-emerald-500/20 border border-emerald-500" />
                <span className="text-slate-400">Commands</span>
              </div>
            </div>
          </div>

          <div className="h-[280px] w-full text-[10px] font-mono">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={ANALYTICS_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMessages" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCommands" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#0f172a" vertical={false} />
                <XAxis dataKey="time" stroke="#475569" strokeWidth={0.5} tickLine={false} />
                <YAxis stroke="#475569" strokeWidth={0.5} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="messages" stroke="#3b82f6" strokeWidth={1.5} fillOpacity={1} fill="url(#colorMessages)" />
                <Area type="monotone" dataKey="commands" stroke="#10b981" strokeWidth={1.5} fillOpacity={1} fill="url(#colorCommands)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* System Resource Gauges (Span 1) */}
        <div className="bg-slate-950/20 border border-slate-900 p-6 rounded-xl flex flex-col justify-between space-y-6">
          <div>
            <h2 className="text-sm font-semibold text-slate-200">Container Telemetry</h2>
            <p className="text-[11px] text-slate-500">Direct virtualization hypervisor metrics.</p>
          </div>

          <div className="space-y-5 flex-1 flex flex-col justify-center">
            {(() => {
              const cpuPercent = systemMetrics.cpu;
              
              const parseRamPercent = (ramStr: string) => {
                try {
                  const parts = ramStr.split('/');
                  if (parts.length === 2) {
                    const used = parseFloat(parts[0]);
                    const total = parseFloat(parts[1]);
                    if (!isNaN(used) && !isNaN(total) && total > 0) {
                      return (used / total) * 100;
                    }
                  }
                } catch (e) {
                  // ignore
                }
                return 45;
              };
              
              const ramPercent = parseRamPercent(systemMetrics.ram);
              
              const getCpuColor = (percent: number) => {
                if (percent > 85) return { text: 'text-rose-500 font-bold animate-pulse', bg: 'bg-rose-600 animate-pulse' };
                if (percent > 80) return { text: 'text-amber-500', bg: 'bg-amber-500' };
                return { text: 'text-blue-400', bg: 'bg-blue-500' };
              };

              const getRamColor = (percent: number) => {
                if (percent > 85) return { text: 'text-rose-500 font-bold animate-pulse', bg: 'bg-rose-600 animate-pulse' };
                if (percent > 80) return { text: 'text-amber-500', bg: 'bg-amber-500' };
                return { text: 'text-emerald-400', bg: 'bg-emerald-500' };
              };

              const cpuColors = getCpuColor(cpuPercent);
              const ramColors = getRamColor(ramPercent);
              
              const isCpuWarning = cpuPercent > 80;
              const isRamWarning = ramPercent > 80;
              const isCpuCritical = cpuPercent > 85;
              const isRamCritical = ramPercent > 85;
              const hasAnyWarning = isCpuWarning || isRamWarning;
              const hasCriticalWarning = isCpuCritical || isRamCritical;
              
              return (
                <>
                  {/* CPU Metric */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-mono">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Cpu className={`w-3.5 h-3.5 ${isCpuWarning ? cpuColors.text : 'text-slate-500'}`} />
                        <span>CPU Virtualization</span>
                      </div>
                      <span className={`font-medium transition-colors ${cpuColors.text}`}>
                        {cpuPercent.toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-900">
                      <div 
                        className={`h-full transition-all duration-1000 ${cpuColors.bg}`} 
                        style={{ width: `${cpuPercent}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 font-mono">8 Cores active (Hyper-threaded allocation)</p>
                  </div>

                  {/* RAM Metric */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-mono">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Database className={`w-3.5 h-3.5 ${isRamWarning ? ramColors.text : 'text-slate-500'}`} />
                        <span>RAM Heap Buffer</span>
                      </div>
                      <span className={`font-medium transition-colors ${ramColors.text}`}>
                        {systemMetrics.ram}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-900">
                      <div 
                        className={`h-full transition-all duration-1000 ${ramColors.bg}`} 
                        style={{ width: `${ramPercent}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 font-mono">Buffered: {((ramPercent / 100) * 2.0).toFixed(2)} GB | Max Node Limit: 2.0 GB</p>
                  </div>

                  {/* Warning Banner */}
                  {hasAnyWarning && (
                    <div className={`p-3 rounded-xl border transition-all duration-300 ${
                      hasCriticalWarning 
                        ? 'bg-rose-600/20 border-rose-500 text-rose-200 animate-pulse ring-2 ring-rose-500/50' 
                        : 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                    } font-mono leading-normal text-[10px] space-y-1`}>
                      <div className="flex items-center gap-1.5 font-bold">
                        <AlertTriangle className={`w-3.5 h-3.5 ${hasCriticalWarning ? 'text-rose-400 animate-bounce' : ''}`} />
                        <span className={hasCriticalWarning ? 'text-rose-400 font-extrabold uppercase tracking-wide' : ''}>
                          {hasCriticalWarning ? '⚠️ CRITICAL OVERLOAD WARNING (>85%)' : 'RESOURCE THRESHOLD WARNING'}
                        </span>
                      </div>
                      <p className="text-[9px] text-slate-300">
                        {hasCriticalWarning
                          ? `CRITICAL LIMIT EXCEEDED: ${isCpuCritical ? `CPU is at ${cpuPercent.toFixed(1)}%` : ''} ${isCpuCritical && isRamCritical ? 'and' : ''} ${isRamCritical ? `RAM is at ${ramPercent.toFixed(1)}%` : ''}. Avoid queuing new jobs or spinning up extra docker container instances immediately.`
                          : isCpuWarning && isRamWarning 
                          ? 'Dual resources exceeded safe limits. Core loop triggers may encounter buffering latency.'
                          : isCpuWarning 
                          ? `CPU high load at ${cpuPercent.toFixed(1)}%. Avoid scaling new intensive daemon instances.`
                          : `RAM heap at ${ramPercent.toFixed(0)}%. Avoid queuing very heavy files or JSON payloads.`
                        }
                      </p>
                    </div>
                  )}
                </>
              );
            })()}
          </div>

          <div className="pt-4 border-t border-slate-900/60 flex items-center justify-between text-[11px] font-mono text-slate-500">
            <span>Uptime: {formatUptime(uptimeSeconds)}</span>
            <span className="text-blue-400 hover:underline cursor-pointer" onClick={onRefresh}>Force Recalculate</span>
          </div>
        </div>
      </div>

      {/* Grid: Bot Overview and Recent activity logs */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Hosted Bot Node List */}
        <div className="bg-slate-950/20 border border-slate-900 p-6 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-200">Active Core Clusters</h2>
              <p className="text-[11px] text-slate-500">Current status of deployed WhatsApp and Telegram hosting threads.</p>
            </div>
            <button 
              onClick={() => onDeployClick()}
              className="text-xs text-blue-400 hover:text-blue-300 transition-colors font-mono font-medium"
            >
              Configure Nodes
            </button>
          </div>

          <div className="space-y-2.5">
            {bots.map((bot) => (
              <div 
                key={bot.id}
                onClick={() => onBotClick(bot)}
                className="group flex items-center justify-between p-3 rounded-xl bg-slate-950/40 border border-slate-900 hover:border-slate-800 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    bot.status === 'running' 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                      : 'bg-slate-900 text-slate-500 border border-slate-800'
                  }`}>
                    <BotIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-200 group-hover:text-blue-400 transition-colors">{bot.name}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-mono bg-slate-900 border border-slate-850 px-1.5 py-0.2 rounded-md text-slate-400">
                        {bot.platform}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        {bot.status === 'running' ? `online • ${bot.uptime}` : 'offline'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="hidden sm:flex flex-col items-end text-right">
                    <span className="text-[10px] font-mono text-slate-300 font-medium">{bot.memory}</span>
                    <span className="text-[9px] font-mono text-slate-500">Memory Allocation</span>
                  </div>
                  <div className={`w-2.5 h-2.5 rounded-full ${
                    bot.status === 'running' 
                      ? 'bg-emerald-500 animate-pulse' 
                      : bot.status === 'suspended'
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                  }`} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Real-time Logger Stream Preview */}
        <div className="bg-slate-950/20 border border-slate-900 p-6 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-200">Syslog Stream Preview</h2>
              <p className="text-[11px] text-slate-500">Real-time compilation logs and execution pipelines.</p>
            </div>
            <span className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>REAL-TIME STREAMING</span>
            </span>
          </div>

          <div className="bg-slate-950 border border-slate-900 p-4 rounded-xl font-mono text-xs text-slate-300 space-y-2 h-[220px] overflow-y-auto scrollbar-thin">
            {logs.slice(-6).map((log) => (
              <div key={log.id} className="flex items-start gap-3 select-text hover:bg-slate-900/30 py-0.5 rounded px-1">
                <span className="text-slate-600 shrink-0">[{log.timestamp}]</span>
                <span className={`text-[10px] shrink-0 font-bold px-1.5 py-0.2 rounded uppercase ${
                  log.type === 'error' 
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' 
                    : log.type === 'success'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : log.type === 'command'
                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                        : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                }`}>
                  {log.type}
                </span>
                <span className="text-slate-500 shrink-0">[{log.source}]</span>
                <span className="text-slate-300 break-all">{log.message}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
