import React, { useState, useMemo } from 'react';
import { 
  Radio, 
  Smartphone, 
  MapPin, 
  Link, 
  Globe, 
  Clock, 
  Power, 
  RefreshCw,
  Plus,
  TrendingUp,
  Users,
  Activity,
  ArrowUpRight,
  Filter
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid,
  Legend
} from 'recharts';
import { Session } from '../types';

interface SessionsViewProps {
  sessions: Session[];
  onDisconnectSession: (id: string) => void;
  onRefresh: () => void;
}

// 24-Hour Session Trend Data Generator
const GENERATE_24H_TREND_DATA = () => {
  const hours = [
    '00:00', '01:00', '02:00', '03:00', '04:00', '05:00',
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
    '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
    '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'
  ];

  // Base curve simulating real web & app session traffic
  const baseValues = [
    12, 10, 8, 7, 9, 14,
    22, 34, 42, 48, 52, 50,
    46, 49, 53, 55, 51, 44,
    38, 35, 29, 24, 18, 15
  ];

  return hours.map((time, idx) => {
    const total = baseValues[idx];
    const web = Math.round(total * 0.62);
    const mobile = total - web;
    return {
      time,
      totalSessions: total,
      webSessions: web,
      mobileSessions: mobile,
      peakCapacityPct: Math.round((total / 60) * 100)
    };
  });
};

const CustomTrendTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl shadow-2xl font-mono text-xs space-y-2 z-50">
        <div className="flex items-center justify-between gap-4 border-b border-slate-900 pb-1.5">
          <span className="text-slate-400 font-semibold">{label} UTC</span>
          <span className="text-[10px] text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
            {payload[0]?.payload?.peakCapacityPct}% Capacity
          </span>
        </div>
        <div className="space-y-1">
          {payload.map((entry: any, index: number) => (
            <div key={`tooltip-${index}`} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                <span>{entry.name}:</span>
              </span>
              <span className="font-bold text-slate-100">{entry.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export default function SessionsView({ sessions, onDisconnectSession, onRefresh }: SessionsViewProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'6h' | '12h' | '24h'>('24h');
  const [chartMetric, setChartMetric] = useState<'all' | 'web' | 'mobile'>('all');

  const fullTrendData = useMemo(() => GENERATE_24H_TREND_DATA(), []);

  const displayedTrendData = useMemo(() => {
    if (timeRange === '6h') return fullTrendData.slice(-6);
    if (timeRange === '12h') return fullTrendData.slice(-12);
    return fullTrendData;
  }, [timeRange, fullTrendData]);

  const activeConnectedCount = useMemo(() => {
    return sessions.filter(s => s.status === 'connected').length;
  }, [sessions]);

  const peakConcurrentSessions = useMemo(() => {
    return Math.max(...displayedTrendData.map(d => d.totalSessions));
  }, [displayedTrendData]);

  const avgConcurrentSessions = useMemo(() => {
    const sum = displayedTrendData.reduce((acc, curr) => acc + curr.totalSessions, 0);
    return Math.round(sum / (displayedTrendData.length || 1));
  }, [displayedTrendData]);

  const handleDisconnect = (id: string) => {
    setLoadingId(id);
    setTimeout(() => {
      onDisconnectSession(id);
      setLoadingId(null);
    }, 1000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-100 tracking-tight">Active Device Links</h1>
          <p className="text-xs text-slate-400">Monitor active authentication sockets, linked browsers, and Multi-Device session channels.</p>
        </div>
        <button 
          onClick={onRefresh}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-medium text-xs px-4 py-2 rounded-lg transition-colors cursor-pointer self-start shadow-sm"
        >
          <RefreshCw className="w-4 h-4 text-slate-500" />
          <span>Sync Active Sockets</span>
        </button>
      </div>

      {/* 24-Hour Concurrent Sessions Trend Section */}
      <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-5 md:p-6 space-y-6 shadow-sm">
        {/* Chart Header & Metrics Summary */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-900">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400 shrink-0">
                <TrendingUp className="w-4 h-4" />
              </div>
              <h2 className="text-base font-semibold text-slate-200">Concurrent User Session Trends</h2>
            </div>
            <p className="text-xs text-slate-400 font-sans">
              Real-time multi-device authentication socket telemetry and peak load timeline
            </p>
          </div>

          {/* Quick Metrics Badges */}
          <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
            <div className="bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-xl flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-slate-400">Current Linked:</span>
              <span className="font-bold text-slate-100">{activeConnectedCount}</span>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-xl flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-400">24h Peak:</span>
              <span className="font-bold text-emerald-400">{peakConcurrentSessions}</span>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-xl flex items-center gap-2">
              <ArrowUpRight className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-slate-400">Avg Sessions:</span>
              <span className="font-bold text-amber-300">{avgConcurrentSessions}</span>
            </div>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs font-mono bg-slate-900/40 p-2.5 rounded-xl border border-slate-900">
          {/* Time Range Selector */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-850">
            <span className="text-[11px] text-slate-400 px-2 font-sans hidden sm:inline">Range:</span>
            {(['6h', '12h', '24h'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-3 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer uppercase ${
                  timeRange === r
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {/* Metric Breakdown Switcher */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-850">
            <Filter className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
            <button
              onClick={() => setChartMetric('all')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                chartMetric === 'all' ? 'bg-slate-800 text-blue-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Total Sockets
            </button>
            <button
              onClick={() => setChartMetric('web')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                chartMetric === 'web' ? 'bg-slate-800 text-cyan-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Web
            </button>
            <button
              onClick={() => setChartMetric('mobile')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                chartMetric === 'mobile' ? 'bg-slate-800 text-purple-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Mobile
            </button>
          </div>
        </div>

        {/* Recharts Line Chart Container */}
        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={displayedTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis 
                dataKey="time" 
                stroke="#64748b" 
                fontSize={11} 
                tickLine={false} 
                axisLine={{ stroke: '#1e293b' }}
              />
              <YAxis 
                stroke="#64748b" 
                fontSize={11} 
                tickLine={false} 
                axisLine={{ stroke: '#1e293b' }}
                domain={[0, 'dataMax + 10']}
              />
              <Tooltip content={<CustomTrendTooltip />} />
              <Legend 
                verticalAlign="top" 
                align="right" 
                iconType="circle"
                wrapperStyle={{ fontSize: '11px', fontFamily: 'monospace', paddingBottom: '12px' }}
              />

              {(chartMetric === 'all' || chartMetric === 'web') && (
                <Line
                  type="monotone"
                  dataKey="webSessions"
                  name="Web Sessions"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#06b6d4', strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: '#06b6d4', stroke: '#0891b2', strokeWidth: 2 }}
                />
              )}

              {(chartMetric === 'all' || chartMetric === 'mobile') && (
                <Line
                  type="monotone"
                  dataKey="mobileSessions"
                  name="Mobile Sessions"
                  stroke="#a855f7"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#a855f7', strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: '#a855f7', stroke: '#9333ea', strokeWidth: 2 }}
                />
              )}

              {chartMetric === 'all' && (
                <Line
                  type="monotone"
                  dataKey="totalSessions"
                  name="Total Concurrent"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }}
                  activeDot={{ r: 7, fill: '#3b82f6', stroke: '#2563eb', strokeWidth: 2 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Grid of link sessions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sessions.map((sess) => {
          const isConnected = sess.status === 'connected';
          const isPending = sess.status === 'pending';
          return (
            <div 
              key={sess.id}
              className={`p-6 rounded-2xl bg-slate-950/20 border flex flex-col justify-between space-y-6 transition-all duration-300 ${
                isConnected 
                  ? 'border-slate-900 hover:border-slate-800' 
                  : 'border-rose-950/20 bg-rose-950/5 hover:border-rose-900/20'
              }`}
            >
              {/* Header row */}
              <div className="flex justify-between items-start gap-3">
                <div className="flex items-center gap-3.5">
                  <div className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${
                    isConnected 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 animate-pulse' 
                      : isPending 
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                        : 'bg-slate-900 text-slate-500 border-slate-800'
                  }`}>
                    <Smartphone className="w-5.5 h-5.5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-slate-200">{sess.device}</h3>
                    <div className="flex items-center gap-1.5 mt-0.5 text-[10px] font-mono text-slate-500">
                      <Globe className="w-3.5 h-3.5" />
                      <span>{sess.ip}</span>
                    </div>
                  </div>
                </div>

                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[9px] font-mono font-semibold border uppercase ${
                  isConnected 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                    : isPending
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                }`}>
                  {sess.status}
                </span>
              </div>

              {/* Geo details */}
              <div className="grid grid-cols-2 gap-4 text-xs font-mono py-2 bg-slate-950/40 p-4 rounded-xl border border-slate-900/60">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 block uppercase font-sans tracking-wider font-semibold">Location Cluster</span>
                  <div className="flex items-center gap-1 text-slate-300">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" />
                    <span>{sess.location}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 block uppercase font-sans tracking-wider font-semibold">Last Active Sync</span>
                  <div className="flex items-center gap-1 text-slate-300">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>{sess.activeAt}</span>
                  </div>
                </div>
              </div>

              {/* Kill link button */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-[10px] font-mono text-slate-500">
                  REF-TOKEN: sess_token_{sess.id.replace('sess-', '00')}
                </span>
                
                {isConnected && (
                  <button
                    onClick={() => handleDisconnect(sess.id)}
                    disabled={loadingId === sess.id}
                    className="flex items-center gap-1.5 bg-rose-950/20 hover:bg-rose-950/50 text-rose-400 border border-rose-950/60 hover:border-rose-900 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>{loadingId === sess.id ? 'Revoking...' : 'Revoke Session'}</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

