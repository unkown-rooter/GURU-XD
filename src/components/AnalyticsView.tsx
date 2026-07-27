import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  MessageSquare, 
  Terminal, 
  TrendingUp, 
  Activity, 
  Zap, 
  Clock,
  ArrowUpRight,
  CalendarRange,
  Info,
  Server,
  Layers,
  ShieldCheck,
  AlertTriangle,
  RefreshCcw,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip as RechartsTooltip, 
  CartesianGrid,
  BarChart,
  Bar,
  LineChart,
  Line
} from 'recharts';
import { ANALYTICS_DATA, INITIAL_BOTS } from '../data';
import { Bot } from '../types';

interface AnalyticsViewProps {
  bots?: Bot[];
}

// Generate last 7 days array
const getDaysArray = () => {
  const arr = [];
  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dayName = i === 0 ? "Today" : i === 1 ? "Yesterday" : daysOfWeek[d.getDay()];
    const dateStr = `${months[d.getMonth()]} ${d.getDate()}`;
    arr.push({ dayName, dateStr, index: i });
  }
  return arr;
};

// Generate high-fidelity status values deterministically based on bot ID and day/hour
const generateHeatmapData = (botId: string, botStatus: string) => {
  const days = getDaysArray();
  return days.map((day) => {
    const hours = [];
    for (let h = 0; h < 24; h++) {
      // Deterministic hash based on bot metadata, day, and hour
      const hash = (botId.charCodeAt(0) * 3 + botId.charCodeAt(botId.length - 1) * 7 + day.index * 13 + h * 19) % 100;
      
      let cellStatus: 'online' | 'degraded' | 'standby' | 'offline' = 'online';
      let latency = Math.floor(18 + (hash % 35)); // Normal base latency 18-53ms

      if (botStatus !== 'running') {
        // Stopped bots show offline history
        cellStatus = 'offline';
        latency = 0;
      } else {
        // Active bots are mostly online (deep green)
        if (hash < 4) {
          cellStatus = 'offline'; // Brief socket disconnect
          latency = 0;
        } else if (hash < 9) {
          cellStatus = 'degraded'; // Network packet drop/jitter
          latency = Math.floor(180 + (hash * 12));
        } else if (hash < 22) {
          cellStatus = 'standby'; // Connection idle, waiting for commands
          latency = Math.floor(45 + (hash * 2));
        } else {
          cellStatus = 'online'; // Operational with active data
        }
      }

      hours.push({
        hour: h,
        hourStr: `${h.toString().padStart(2, '0')}:00`,
        status: cellStatus,
        latency,
        events: hash % 2 === 0 ? Math.floor(15 + hash * 2.5) : Math.floor(5 + hash * 1.2)
      });
    }
    return {
      ...day,
      hours
    };
  });
};

export default function AnalyticsView({ bots = [] }: AnalyticsViewProps) {
  // Use provided bots or fall back to default list
  const activeBots = bots.length > 0 ? bots : INITIAL_BOTS;
  
  // Selected bot for heatmap detail
  const [selectedBotId, setSelectedBotId] = useState<string>(activeBots[0]?.id || 'bot-1');
  const currentSelectedBot = activeBots.find(b => b.id === selectedBotId) || activeBots[0];

  // Active hover/selected state for cells
  const [hoveredCell, setHoveredCell] = useState<{
    dayName: string;
    dateStr: string;
    hourStr: string;
    status: 'online' | 'degraded' | 'standby' | 'offline';
    latency: number;
    events: number;
  } | null>(null);

  const [selectedCell, setSelectedCell] = useState<{
    botName: string;
    dayName: string;
    dateStr: string;
    hourStr: string;
    status: 'online' | 'degraded' | 'standby' | 'offline';
    latency: number;
    events: number;
  } | null>(null);

  // Generate heatmap matrix for current selected bot
  const heatmapData = useMemo(() => {
    if (!currentSelectedBot) return [];
    return generateHeatmapData(currentSelectedBot.id, currentSelectedBot.status);
  }, [currentSelectedBot]);

  // Generate detailed inspection logs depending on the selected cell status
  const inspectionLogs = useMemo(() => {
    if (!selectedCell) return null;
    
    const { hourStr, status, latency, events, dateStr } = selectedCell;
    const baseHour = parseInt(hourStr.split(':')[0]);
    const min1 = '04';
    const min2 = '18';
    const min3 = '35';
    const min4 = '52';

    if (status === 'online') {
      return [
        `[${hourStr.padStart(5, '0')}:${min1}] ⚙️ [SYSTEM] Thread safety validations cleared. Node CPU clustering optimized.`,
        `[${hourStr.padStart(5, '0')}:${min2}] 📶 [GATEWAY] Socket ping returned operational limits: ${latency}ms latency.`,
        `[${hourStr.padStart(5, '0')}:${min3}] 📥 [INBOUND] Successfully parsed payload stream. Processed ${Math.floor(events * 0.4)} triggers.`,
        `[${hourStr.padStart(5, '0')}:${min4}] ✅ [HYPERVISOR] Clean memory garbage dump sweep. Current allocation: stable.`
      ];
    } else if (status === 'standby') {
      return [
        `[${hourStr.padStart(5, '0')}:${min1}] 💤 [STANDBY] No active queue payloads. Scaling virtualization cores to power-saver.`,
        `[${hourStr.padStart(5, '0')}:${min2}] 📶 [HEARTBEAT] Socket pool connection healthy. Passive polling ping: ${latency}ms.`,
        `[${hourStr.padStart(5, '0')}:${min3}] 📥 [WEBHOOK] Handled healthcheck request from cloud gateway.`,
        `[${hourStr.padStart(5, '0')}:${min4}] 🔒 [SECURITY] Automated token handshake rotation verified successfully.`
      ];
    } else if (status === 'degraded') {
      return [
        `[${hourStr.padStart(5, '0')}:${min1}] ⚠️ [JITTER_WARNING] High latency spike observed: ${latency}ms in connection cluster.`,
        `[${hourStr.padStart(5, '0')}:${min2}] 🔄 [RECONNECTION_RETRY] Flushed client socket stack. Awaiting node confirmation...`,
        `[${hourStr.padStart(5, '0')}:${min3}] ⏳ [BACKPRESSURE] Event bus buffer filling up. Throttle speed applied on ${events} transactions.`,
        `[${hourStr.padStart(5, '0')}:${min4}] 📈 [SELF_HEAL] Buffer flushed. Latency stabilizing back to safe operational bands.`
      ];
    } else {
      return [
        `[${hourStr.padStart(5, '0')}:${min1}] 🚨 [CRITICAL_ERROR] Daemon process abruptly disconnected. Socket stream closed.`,
        `[${hourStr.padStart(5, '0')}:${min2}] 🔄 [DAEMON_RESTART] Triggering auto-recovery scheduler loop [Attempt 1/3]...`,
        `[${hourStr.padStart(5, '0')}:${min3}] ❌ [SOCKET_ERROR] Handshake timeout with master cluster API node. Connection refused.`,
        `[${hourStr.padStart(5, '0')}:${min4}] 💤 [CONTAINER_SLEEP] Thread core suspended. Ready for user manually-triggered sync.`
      ];
    }
  }, [selectedCell]);

  // Uptime statistics calculation
  const calculatedStats = useMemo(() => {
    if (!currentSelectedBot) return { uptime: '100%', incidents: 0, avgLat: '0ms' };
    
    if (currentSelectedBot.status !== 'running') {
      return { uptime: '0.00%', incidents: 1, avgLat: 'N/A' };
    }

    // Average values based on bot ID hashes
    const hash = currentSelectedBot.id.charCodeAt(currentSelectedBot.id.length - 1);
    const uptimePct = (99.2 + (hash % 8) * 0.1).toFixed(2) + '%';
    const incidentsCount = hash % 3;
    const avgLatency = Math.floor(32 + (hash % 15)) + ' ms';

    return {
      uptime: uptimePct,
      incidents: incidentsCount,
      avgLat: avgLatency
    };
  }, [currentSelectedBot]);

  // Recharts custom styling
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-950 border border-slate-900 p-3 rounded-lg shadow-xl font-mono text-[11px]">
          <p className="text-slate-500 mb-1">{label}</p>
          {payload.map((p: any) => (
            <p key={p.name} style={{ color: p.color }} className="font-semibold">
              {p.name}: <span className="text-slate-200">{p.value.toLocaleString()}</span>
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-100 tracking-tight">System Performance</h1>
          <p className="text-xs text-slate-400">Review detailed historical charts tracking server bandwidth, load indexes, and webhook telemetry.</p>
        </div>
        
        {/* Quick select dropdown for bot heatmaps */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold uppercase text-slate-500">Instance Filter:</span>
          <select
            id="bot-heatmap-selector"
            value={selectedBotId}
            onChange={(e) => {
              setSelectedBotId(e.target.value);
              setSelectedCell(null); // Reset detail panel on change
            }}
            className="bg-slate-900 text-xs font-mono font-semibold text-slate-200 border border-slate-800 rounded-lg py-1.5 px-3 focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            {activeBots.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.platform})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* NEW: 7-Day Uptime Contribution Heatmap Card */}
      {currentSelectedBot && (
        <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-5 md:p-6 space-y-6 relative overflow-hidden">
          {/* Subtle Background Accent */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/[0.01] rounded-full blur-3xl pointer-events-none" />

          {/* Section Heading & Instance Overview */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-900/60">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500/10 border border-blue-500/20 p-2.5 rounded-xl text-blue-400 shrink-0">
                <CalendarRange className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-semibold font-display text-slate-200 flex items-center gap-2">
                  <span>7-Day Cluster Uptime Heatmap</span>
                  <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/25 px-2 py-0.5 rounded-full font-mono uppercase">
                    v2.0.1 Engine
                  </span>
                </h2>
                <p className="text-[11px] text-slate-400">Detailed hourly visualization of container socket state history and response trends.</p>
              </div>
            </div>

            {/* Quick Metrics of current selection */}
            <div className="grid grid-cols-3 gap-2 md:gap-4 bg-slate-950/60 border border-slate-900 p-3 rounded-xl font-mono text-[10px]">
              <div>
                <span className="text-slate-500 block uppercase tracking-wider text-[8px]">Uptime Index</span>
                <span className={`font-bold ${currentSelectedBot.status === 'running' ? 'text-emerald-400' : 'text-rose-500'}`}>
                  {calculatedStats.uptime}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block uppercase tracking-wider text-[8px]">7D Incidents</span>
                <span className={`font-bold ${calculatedStats.incidents === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {calculatedStats.incidents}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block uppercase tracking-wider text-[8px]">Avg Latency</span>
                <span className="font-bold text-slate-300">{calculatedStats.avgLat}</span>
              </div>
            </div>
          </div>

          {/* Heatmap Grid Wrapper (supports horizontal swipe/scroll on mobile) */}
          <div className="space-y-4">
            <div className="w-full overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
              <div className="min-w-[680px] space-y-2 select-none">
                {/* Heatmap Grid Header: Hourly columns */}
                <div className="flex text-[9px] font-mono text-slate-500 pl-24 pr-4">
                  <div className="w-full flex justify-between">
                    <span>00:00</span>
                    <span>04:00</span>
                    <span>08:00</span>
                    <span>12:00</span>
                    <span>16:00</span>
                    <span>20:00</span>
                    <span>23:00</span>
                  </div>
                </div>

                {/* Heatmap Grid Rows (Last 7 Days) */}
                <div className="space-y-1.5">
                  {heatmapData.map((day) => (
                    <div key={day.index} className="flex items-center">
                      {/* Left Day Name Label */}
                      <div className="w-24 shrink-0 text-left pr-4">
                        <span className="text-[10px] font-mono font-medium text-slate-400 block truncate leading-none">
                          {day.dayName}
                        </span>
                        <span className="text-[8px] font-mono text-slate-600 block truncate mt-0.5">
                          {day.dateStr}
                        </span>
                      </div>

                      {/* Hourly Cells Row */}
                      <div className="flex-1 grid grid-cols-24 gap-1">
                        {day.hours.map((hour) => {
                          const getCellColor = () => {
                            if (hour.status === 'online') return 'bg-emerald-500 hover:bg-emerald-400 border border-emerald-600/20';
                            if (hour.status === 'standby') return 'bg-emerald-600/35 hover:bg-emerald-500/50 border border-emerald-500/10';
                            if (hour.status === 'degraded') return 'bg-amber-500/70 hover:bg-amber-400 border border-amber-600/25';
                            return 'bg-slate-900 border border-slate-850 hover:bg-slate-800';
                          };

                          const isSelected = selectedCell && 
                            selectedCell.botName === currentSelectedBot.name &&
                            selectedCell.dayName === day.dayName && 
                            selectedCell.hourStr === hour.hourStr;

                          return (
                            <div
                              key={hour.hour}
                              id={`cell-${currentSelectedBot.id}-${day.index}-${hour.hour}`}
                              onClick={() => setSelectedCell({
                                botName: currentSelectedBot.name,
                                dayName: day.dayName,
                                dateStr: day.dateStr,
                                hourStr: hour.hourStr,
                                status: hour.status,
                                latency: hour.latency,
                                events: hour.events
                              })}
                              onMouseEnter={() => setHoveredCell({
                                dayName: day.dayName,
                                dateStr: day.dateStr,
                                hourStr: hour.hourStr,
                                status: hour.status,
                                latency: hour.latency,
                                events: hour.events
                              })}
                              onMouseLeave={() => setHoveredCell(null)}
                              className={`h-4.5 rounded-sm cursor-pointer transition-all duration-150 relative ${getCellColor()} ${
                                isSelected ? 'ring-2 ring-white scale-110 z-10 shadow-lg shadow-white/10' : 'hover:scale-125 hover:z-10'
                              }`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Heatmap Legend & Tooltip Status */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2 border-t border-slate-900/60">
              {/* Legend */}
              <div className="flex items-center gap-4 text-[9px] font-mono text-slate-500">
                <span className="uppercase tracking-wider">Legend:</span>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-emerald-500 border border-emerald-600/20" />
                    <span>Operational</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-emerald-600/35 border border-emerald-500/10" />
                    <span>Idle/Standby</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-amber-500/70 border border-amber-600/25" />
                    <span>Degraded</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded bg-slate-900 border border-slate-850" />
                    <span>Offline</span>
                  </div>
                </div>
              </div>

              {/* Live Interactive Cell Tooltip Box */}
              <div className="h-6 flex items-center">
                {hoveredCell ? (
                  <div className="text-[10px] font-mono text-slate-400 bg-slate-900/80 border border-slate-850/60 px-2.5 py-0.5 rounded-md flex items-center gap-2 animate-in fade-in duration-100">
                    <span className="text-slate-500">{hoveredCell.dayName} ({hoveredCell.dateStr}) {hoveredCell.hourStr}:</span>
                    <span className={`font-semibold capitalize ${
                      hoveredCell.status === 'online' ? 'text-emerald-400' :
                      hoveredCell.status === 'standby' ? 'text-emerald-500/80' :
                      hoveredCell.status === 'degraded' ? 'text-amber-400' : 'text-slate-500'
                    }`}>{hoveredCell.status}</span>
                    {hoveredCell.status !== 'offline' && (
                      <>
                        <span className="text-slate-600">|</span>
                        <span>Latency: <strong className="text-slate-200">{hoveredCell.latency}ms</strong></span>
                        <span className="text-slate-600">|</span>
                        <span>Load: <strong className="text-slate-200">{hoveredCell.events} req</strong></span>
                      </>
                    )}
                  </div>
                ) : (
                  <span className="text-[9px] font-mono text-slate-600 italic">Hover over any hourly square to view quick telemetry metrics.</span>
                )}
              </div>
            </div>
          </div>

          {/* Dynamic Cell Selection Detail Terminal */}
          {selectedCell ? (
            <div className="bg-slate-950 border border-slate-900 rounded-xl p-4 space-y-3 animate-in slide-in-from-top-3 duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-semibold font-display text-slate-200">
                    Cluster Inspector: <span className="text-blue-400">{selectedCell.botName}</span>
                  </span>
                  <span className="text-[9px] text-slate-500 font-mono">
                    ({selectedCell.dayName}, {selectedCell.dateStr} @ {selectedCell.hourStr})
                  </span>
                </div>
                <button
                  onClick={() => setSelectedCell(null)}
                  className="text-[9px] font-mono text-slate-500 hover:text-slate-300 bg-slate-900 border border-slate-850 px-1.5 py-0.5 rounded-md transition-colors cursor-pointer"
                >
                  Close Console
                </button>
              </div>

              {/* Inspector Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/30 p-2.5 rounded-lg border border-slate-900/40 text-[10px] font-mono">
                <div>
                  <span className="text-slate-500 uppercase tracking-wide text-[8px] block">Channel Status</span>
                  <span className={`font-bold uppercase ${
                    selectedCell.status === 'online' ? 'text-emerald-400' :
                    selectedCell.status === 'standby' ? 'text-emerald-500/80' :
                    selectedCell.status === 'degraded' ? 'text-amber-400' : 'text-slate-500'
                  }`}>{selectedCell.status}</span>
                </div>
                <div>
                  <span className="text-slate-500 uppercase tracking-wide text-[8px] block">Mean Latency</span>
                  <span className="font-bold text-slate-300">{selectedCell.status === 'offline' ? 'N/A' : `${selectedCell.latency} ms`}</span>
                </div>
                <div>
                  <span className="text-slate-500 uppercase tracking-wide text-[8px] block">Payload Rate</span>
                  <span className="font-bold text-slate-300">{selectedCell.status === 'offline' ? '0/sec' : `${(selectedCell.events / 60).toFixed(2)}/min`}</span>
                </div>
                <div>
                  <span className="text-slate-500 uppercase tracking-wide text-[8px] block">Cluster Node Code</span>
                  <span className="font-bold text-slate-500">{currentSelectedBot.id.toUpperCase()}-GWAY</span>
                </div>
              </div>

              {/* Raw Syslog stream */}
              <div className="bg-slate-950 border border-slate-900/80 p-3 rounded-lg space-y-1.5 font-mono text-[10px] text-slate-400 leading-relaxed overflow-x-auto max-h-32">
                {inspectionLogs?.map((log, index) => (
                  <div key={index} className="whitespace-nowrap hover:bg-slate-900/30 transition-colors">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 bg-slate-950/20 border border-dashed border-slate-900 rounded-xl text-center flex flex-col items-center justify-center space-y-1.5">
              <Info className="w-4 h-4 text-slate-600" />
              <p className="text-[10px] font-mono text-slate-500">
                Click on any hourly grid box above to deploy the <strong className="text-slate-400">Cluster Telemetry Inspector</strong> and view the specific event pipeline logs.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Analytics Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-slate-950/20 border border-slate-900 p-5 rounded-xl space-y-1">
          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500">Average Reply Latency</span>
          <h3 className="text-lg font-bold font-display text-slate-100">42 ms</h3>
          <p className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>Optimum (Below threshold of 200ms)</span>
          </p>
        </div>

        {/* Metric 2 */}
        <div className="bg-slate-950/20 border border-slate-900 p-5 rounded-xl space-y-1">
          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500">Peak Load Message Rate</span>
          <h3 className="text-lg font-bold font-display text-slate-100">22,000 msg/h</h3>
          <p className="text-[10px] font-mono text-slate-500">Registered today at 18:00 UTC</p>
        </div>

        {/* Metric 3 */}
        <div className="bg-slate-950/20 border border-slate-900 p-5 rounded-xl space-y-1">
          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500">API Callback Success</span>
          <h3 className="text-lg font-bold font-display text-emerald-400">99.98%</h3>
          <p className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" />
            <span>+0.02% vs trailing month</span>
          </p>
        </div>

        {/* Metric 4 */}
        <div className="bg-slate-950/20 border border-slate-900 p-5 rounded-xl space-y-1">
          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500">Bandwidth Consumption</span>
          <h3 className="text-lg font-bold font-display text-slate-100">14.2 GB</h3>
          <p className="text-[10px] font-mono text-slate-500">98% media asset attachments</p>
        </div>
      </div>

      {/* Grid of charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Messages vs Commands bar chart */}
        <div className="bg-slate-950/20 border border-slate-900 p-6 rounded-xl space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-200">Execution Intensity</h2>
            <p className="text-[11px] text-slate-500">Comparison of passive inbound traffic with automated trigger actions.</p>
          </div>

          <div className="h-[260px] w-full text-[10px] font-mono">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ANALYTICS_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#0f172a" vertical={false} />
                <XAxis dataKey="time" stroke="#475569" strokeWidth={0.5} tickLine={false} />
                <YAxis stroke="#475569" strokeWidth={0.5} tickLine={false} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Bar name="Messages" dataKey="messages" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={15} />
                <Bar name="Commands" dataKey="commands" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={15} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: CPU & RAM historical utilization */}
        <div className="bg-slate-950/20 border border-slate-900 p-6 rounded-xl space-y-4">
          <div>
            <h2 className="text-sm font-semibold text-slate-200">Hypervisor Core Utilization</h2>
            <p className="text-[11px] text-slate-500">Historical performance scaling curves of Docker hosting containers.</p>
          </div>

          <div className="h-[260px] w-full text-[10px] font-mono">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ANALYTICS_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#0f172a" vertical={false} />
                <XAxis dataKey="time" stroke="#475569" strokeWidth={0.5} tickLine={false} />
                <YAxis stroke="#475569" strokeWidth={0.5} tickLine={false} />
                <RechartsTooltip content={<CustomTooltip />} />
                <Line name="CPU Load (%)" type="monotone" dataKey="cpu" stroke="#3b82f6" strokeWidth={2} dot={false} />
                <Line name="RAM heap (%)" type="monotone" dataKey="ram" stroke="#f59e0b" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
